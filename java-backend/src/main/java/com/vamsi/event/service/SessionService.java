package com.vamsi.event.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.security.SecureRandom;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SessionService {
    private final Map<String, AdminSession> adminSessions = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    @Value("${app.session-ttl-ms}")
    private long sessionTtlMs;

    public static class AdminSession {
        private final long expires;

        public AdminSession(long ttlMs) {
            this.expires = System.currentTimeMillis() + ttlMs;
        }

        public boolean isValid() {
            return System.currentTimeMillis() < expires;
        }

        public long getExpires() {
            return expires;
        }
    }

    public Map.Entry<String, Long> createAdminSession() {
        byte[] bytes = new byte[24];
        random.nextBytes(bytes);
        String token = bytesToHex(bytes);
        AdminSession session = new AdminSession(sessionTtlMs);
        adminSessions.put(token, session);
        return Map.entry(token, session.getExpires());
    }

    public boolean validateAdminToken(String token) {
        if (token == null) return false;
        AdminSession session = adminSessions.get(token);
        if (session == null) return false;
        if (!session.isValid()) {
            adminSessions.remove(token);
            return false;
        }
        return true;
    }

    public void removeAdminSession(String token) {
        if (token != null) {
            adminSessions.remove(token);
        }
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}