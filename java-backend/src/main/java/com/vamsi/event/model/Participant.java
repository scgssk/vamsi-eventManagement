// src/main/java/com/vamsi/event/model/Participant.java
package com.vamsi.event.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Document(collection = "participants")
public class Participant {
    @Id
    private String id;
    private String name;
    private String college;
    private String email;
    private String phone;
    private String eventId;
    private Instant registeredAt = Instant.now();
    private String registrationQRCode;
    private boolean approved = false;
    private String entryPassQRCode;
}