package com.vamsi.event.repository;

import com.vamsi.event.model.Participant;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.Optional;

public interface ParticipantRepository extends MongoRepository<Participant, String> {

    // ONE RESULT ONLY – we add "limit: 1" via sort or use findOne-style
    @Query(value = "{ '$or': [ { 'email': { '$regex': ?0, '$options': 'i' } }, { 'name': { '$regex': ?1, '$options': 'i' } } ] }")
    Optional<Participant> findFirstByEmailOrNameRegex(String emailRegex, String nameRegex);

    @Query("{ 'email': { '$regex': ?0, '$options': 'i' } }")
    Optional<Participant> findFirstByEmailRegex(String emailRegex);

    @Query("{ 'name': { '$regex': ?0, '$options': 'i' } }")
    Optional<Participant> findFirstByNameRegex(String nameRegex);
}