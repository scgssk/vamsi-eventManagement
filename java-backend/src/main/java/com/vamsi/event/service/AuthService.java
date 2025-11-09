package com.vamsi.event.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    @Value("${app.admin-id}")
    private String adminId;

    @Value("${app.admin-pass}")
    private String adminPass;

    @Value("${app.admin-api-key}")
    private String apiKey;

    @Value("${app.session-ttl-ms}")
    private long ttlMs;

    private final Map<String, Long> sessions = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    public String login(String id, String pass) {
        if (adminId.equals(id) && adminPass.equals(pass)) {
            String token = generateToken();
            sessions.put(token, System.currentTimeMillis() + ttlMs);
            return token;
        }
        return null;
    }

    public boolean validateToken(String token) {
        Long expires = sessions.get(token);
        if (expires == null || expires < System.currentTimeMillis()) {
            sessions.remove(token);
            return false;
        }
        return true;
    }

    public boolean validateApiKey(String key) {
        return apiKey.equals(key);
    }

    public void logout(String token) {
        sessions.remove(token);
    }

    private String generateToken() {
        byte[] bytes = new byte[24];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}