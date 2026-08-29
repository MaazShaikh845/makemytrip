package com.makemytrip.flight;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.makemytrip.user.User;
import com.makemytrip.user.UserRepository;

@RestController
@RequestMapping("/flights")
@CrossOrigin(origins = "http://localhost:3000")
public class FlightController {

    private final FlightRepository flightRepository;
    private final UserRepository userRepository;

    public FlightController(FlightRepository flightRepository, UserRepository userRepository) {
        this.flightRepository = flightRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Flight> getAllFlights() {
        return flightRepository.findAll();
    }

    @GetMapping("/{id}")
    public Flight getFlightById(@PathVariable String id) {
        return flightRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flight not found"));
    }

    @GetMapping("/search")
    public List<Flight> searchFlights(
            @RequestParam String origin,
            @RequestParam String destination) {
        return flightRepository.findByOriginIgnoreCaseAndDestinationIgnoreCase(origin, destination);
    }

    @PostMapping
    public ResponseEntity<Flight> createFlight(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody Flight flight) {

        requireAdmin(userId);
        Flight saved = flightRepository.save(flight);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public Flight updateFlight(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id,
            @RequestBody Flight updated) {

        requireAdmin(userId);
        Flight existing = flightRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flight not found"));

        existing.setAirline(updated.getAirline());
        existing.setFlightNumber(updated.getFlightNumber());
        existing.setOrigin(updated.getOrigin());
        existing.setDestination(updated.getDestination());
        existing.setDepartureTime(updated.getDepartureTime());
        existing.setArrivalTime(updated.getArrivalTime());
        existing.setPrice(updated.getPrice());
        existing.setAvailableSeats(updated.getAvailableSeats());
        existing.setClassType(updated.getClassType());
        existing.setDurationMinutes(updated.getDurationMinutes());

        return flightRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFlight(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id) {

        requireAdmin(userId);
        if (!flightRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Flight not found");
        }
        flightRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void requireAdmin(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing credentials");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Administrative privileges required");
        }
    }
}
