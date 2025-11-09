package com.vamsi.event.controller;

import com.vamsi.event.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"https://vamsi-event.vercel.app", "http://localhost:5173"})
public class AuthController {

    @Autowired private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String id = body.get("id");
        String pass = body.get("pass");
        if (id == null || pass == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "id and pass required"));
        }
        String token = authService.login(id, pass);
        if (token != null) {
            return ResponseEntity.ok(Map.of("ok", true, "token", token, "expires", System.currentTimeMillis() + 28800000));
        }
        return ResponseEntity.status(401).body(Map.of("error", "invalid credentials"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "x-admin-token", required = false) String token,
                                    @RequestBody(required = false) Map<String, String> body) {
        String t = token != null ? token : (body != null ? body.get("token") : null);
        if (t != null) authService.logout(t);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/validate-key")
    public ResponseEntity<?> validateKey(@RequestHeader("x-admin-key") String key) {
        if (!authService.validateApiKey(key)) {
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }
        return ResponseEntity.ok(Map.of("ok", true));
    }
}