package com.vamsi.event.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vamsi.event.model.Participant;
import com.vamsi.event.repository.ParticipantRepository;
import com.vamsi.event.service.QrService;
import com.vamsi.event.service.AuthService;
import com.vamsi.event.util.CryptoUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;


@RestController
@RequestMapping("/api")
@CrossOrigin(origins = { "https://vamsi-event.vercel.app", "http://localhost:5173" })
public class ParticipantController {

    @Autowired
    private ParticipantRepository repo;
    @Autowired
    private QrService qrService;
    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Participant input) {
        if (input.getName() == null || input.getCollege() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "name and college required"));
        }

        Participant p = new Participant();
        p.setName(input.getName());
        p.setCollege(input.getCollege());
        p.setEmail(input.getEmail());
        p.setPhone(input.getPhone());
        p.setEventId(input.getEventId());
        repo.save(p);

        try {
            // Create a null-safe payload map for QR code generation
            Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("type", "registration");
            payload.put("id", p.getId());
            payload.put("name", p.getName());
            payload.put("email", p.getEmail());
            payload.put("createdAt", Instant.now().toString());
            if (p.getEventId() != null) {
                payload.put("eventId", p.getEventId());
            }
            String png = qrService.generateQr(payload);
            p.setRegistrationQRCode(png);
            repo.save(p);

            Map<String, Object> response = new java.util.HashMap<>();
            response.put("participantId", p.getId());
            response.put("pngDataUri", png);
            response.put("participant", p);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // avoid Map.of with possible null values (e.getMessage() can be null)
            Map<String, Object> err = new java.util.HashMap<>();
            err.put("error", "QR service failed");
            err.put("detail", e == null ? "unknown" : (e.getMessage() != null ? e.getMessage() : e.toString()));
            return ResponseEntity.status(502).body(err);
        }
    }

    @PostMapping("/verify-qr")
    public ResponseEntity<?> verify(@RequestBody Map<String, Object> body) {
        Map<String, Object> signed = (Map<String, Object>) body.get("signed");
        if (signed == null)
            return ResponseEntity.badRequest().body(Map.of("error", "signed required"));

        Map<String, Object> payload = (Map<String, Object>) signed.get("payload");
        String signature = (String) signed.get("signature");

        try {
            String expected = CryptoUtil.hmacSha256(
                    new ObjectMapper().writeValueAsString(payload),
                    System.getProperty("app.qr-secret", System.getenv("QR_SHARED_SECRET")));
            if (!expected.equals(signature)) {
                return ResponseEntity.badRequest().body(Map.of("error", "invalid signature"));
            }
        } catch (JsonProcessingException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "invalid payload format"));
        }

        Optional<Participant> opt = repo.findById((String) payload.get("id"));
        if (opt.isEmpty())
            return ResponseEntity.status(404).body(Map.of("error", "not found"));

        return ResponseEntity.ok(Map.of("ok", true, "participant", opt.get()));
    }

    @PatchMapping("/participants/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable String id,
            @RequestHeader(value = "x-admin-key", required = false) String key,
            @RequestHeader(value = "x-admin-token", required = false) String token) {
        if ((key == null || !authService.validateApiKey(key)) &&
                (token == null || !authService.validateToken(token))) {
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }

        Optional<Participant> opt = repo.findById(id);
        if (opt.isEmpty())
            return ResponseEntity.status(404).body(Map.of("error", "not found"));

        Participant p = opt.get();
        p.setApproved(true);
        repo.save(p);

        return ResponseEntity.ok(Map.of("ok", true, "participant", p));
    }

    @PostMapping("/generate-entry-pass")
    public ResponseEntity<?> generateEntryPass(@RequestBody Map<String, String> body) {
        String pid = body.get("participantId");
        Optional<Participant> opt = repo.findById(pid);
        if (opt.isEmpty())
            return ResponseEntity.status(404).body(Map.of("error", "not found"));
        Participant p = opt.get();
        if (!p.isApproved())
            return ResponseEntity.status(403).body(Map.of("error", "participant not approved yet"));

        try {
            Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("type", "entry_pass");
            payload.put("id", p.getId());
            payload.put("name", p.getName());
            payload.put("email", p.getEmail());
            payload.put("exp", Instant.now().plusSeconds(3600).toString());
            if (p.getEventId() != null) payload.put("eventId", p.getEventId());

            String png = qrService.generateQr(payload);
            p.setEntryPassQRCode(png);
            repo.save(p);

            Map<String, Object> resp = new java.util.HashMap<>();
            resp.put("pngDataUri", png);
            resp.put("participant", p);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, Object> err = new java.util.HashMap<>();
            err.put("error", "qr service error");
            err.put("detail", e == null ? "unknown" : (e.getMessage() != null ? e.getMessage() : e.toString()));
            return ResponseEntity.status(502).body(err);
        }
    }

@GetMapping("/participants/search")
    public ResponseEntity<?> search(
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "name", required = false) String name) {

        try {
            // ---- 1. validation -------------------------------------------------
            boolean hasEmail = email != null && !email.trim().isEmpty();
            boolean hasName  = name  != null && !name.trim().isEmpty();

            if (!hasEmail && !hasName) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "email or name required"));
            }

            // ---- 2. build safe regexes -----------------------------------------
            String emailRegex = hasEmail ? ".*" + Pattern.quote(email.trim()) + ".*" : null;
            String nameRegex  = hasName  ? ".*" + Pattern.quote(name.trim())  + ".*" : null;

            // ---- 3. pick the right repository call -----------------------------
            Optional<Participant> participant;
            if (hasEmail && hasName) {
                participant = repo.findFirstByEmailOrNameRegex(emailRegex, nameRegex);
            } else if (hasEmail) {
                participant = repo.findFirstByEmailRegex(emailRegex);
            } else {
                participant = repo.findFirstByNameRegex(nameRegex);
            }

            return ResponseEntity.ok(Map.of("participant", participant.orElse(null)));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(Map.of(
                            "error", "server error",
                            "detail", e.getMessage() != null ? e.getMessage() : e.toString()
                    ));
        }
    }
}