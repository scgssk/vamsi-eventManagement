package com.vamsi.event.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;
import java.time.Instant;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = { "https://vamsi-event.vercel.app", "http://localhost:5173" })
public class StatusController {

    @Value("${app.qr-service-url}")
    private String qrServiceUrl;

    @Autowired
    private MongoTemplate mongoTemplate;
    
    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/status")
    public ResponseEntity<?> status() {
        Map<String, Object> response = new HashMap<>();
        response.put("ok", true);
        response.put("time", Instant.now().toString());

        // Check MongoDB connection
        String dbStatus = "disconnected";
        try {
            mongoTemplate.executeCommand("{ ping: 1 }");
            dbStatus = "connected";
        } catch (Exception e) {
            dbStatus = "not-ready";
        }
        response.put("db", dbStatus);

        // Check Python QR service
        String pyStatus = "unknown";
        try {
            var pyResp = restTemplate.getForEntity(qrServiceUrl + "/health", Map.class);
            pyStatus = pyResp.getStatusCode() == HttpStatus.OK ? "ok" : "bad";
        } catch (Exception e) {
            pyStatus = "unreachable";
        }
        response.put("python", pyStatus);

        return ResponseEntity.ok(response);
    }
}
