package com.vamsi.event.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vamsi.event.util.CryptoUtil;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class QrService {

    @Value("${app.qr-service-url}")
    private String qrServiceUrl;

    @Value("${app.qr-secret}")
    private String secret;

    private final ObjectMapper mapper = new ObjectMapper();

    public String generateQr(Map<String, Object> payload) throws Exception {
        String payloadJson = mapper.writeValueAsString(payload);
        System.out.println("QR Service - Payload: " + payloadJson);
        
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("QR secret (app.qr-secret) is not configured");
        }
        if (qrServiceUrl == null || qrServiceUrl.isBlank()) {
            throw new IllegalStateException("QR service URL (app.qr-service-url) is not configured");
        }
        String signature = CryptoUtil.hmacSha256(payloadJson, secret);
        System.out.println("QR Service - Signature: " + signature);
        System.out.println("QR Service - Secret used: " + (secret == null ? "<null>" : "[redacted]"));
        
        Map<String, Object> signed = new java.util.HashMap<>();
        signed.put("payload", payload);
        signed.put("signature", signature);
        Map<String, Object> wrapper = new java.util.HashMap<>();
        wrapper.put("data", signed);
        String requestBody = mapper.writeValueAsString(wrapper);
        System.out.println("QR Service - URL: " + qrServiceUrl + "/generate_qr");
        System.out.println("QR Service - Request Body: " + requestBody);

        try (CloseableHttpClient client = HttpClients.createDefault()) {
            HttpPost post = new HttpPost(qrServiceUrl + "/generate_qr");
            post.setHeader("Content-Type", "application/json");
            post.setEntity(new StringEntity(requestBody));

            try {
                var response = client.execute(post, resp -> {
                    var entity = resp.getEntity();
                    String body = entity != null ? new String(entity.getContent().readAllBytes(), StandardCharsets.UTF_8) : "";
                    System.out.println("QR Service - Response Status: " + resp.getCode());
                    System.out.println("QR Service - Response Body: " + body);
                    
                    if (resp.getCode() != 200) {
                        throw new RuntimeException(String.format("QR service error (HTTP %d): %s", resp.getCode(), body));
                    }

                    JsonNode json = mapper.readTree(body);
                    return json.get("pngDataUri").asText();
                });
                return response;
            } catch (Exception e) {
                System.err.println("QR Service - Error: " + e.getMessage());
                if (e.getCause() != null) {
                    System.err.println("QR Service - Cause: " + e.getCause().getMessage());
                }
                throw e;
            }
        }
    }
}