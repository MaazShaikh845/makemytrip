package com.makemytrip.flight;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface FlightRepository extends MongoRepository<Flight, String> {

    List<Flight> findByOriginIgnoreCaseAndDestinationIgnoreCase(String origin, String destination);

    List<Flight> findByOriginContainingIgnoreCaseAndDestinationContainingIgnoreCase(String origin, String destination);

    List<Flight> findByAirlineIgnoreCase(String airline);
}
