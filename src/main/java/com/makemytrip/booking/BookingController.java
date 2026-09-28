package com.makemytrip.booking;

import com.makemytrip.user.User;
import com.makemytrip.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bookings")
@CrossOrigin(origins = "http://localhost:3000")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private UserRepository userRepository;

    private User resolveUser(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing user credentials");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User account not found"));
    }

    @PostMapping("/flight")
    public ResponseEntity<BookingRecord> bookFlight(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody Map<String, Object> body) {

        resolveUser(userId);

        String flightId = body.get("flightId") != null ? body.get("flightId").toString() : null;
        int seats = body.containsKey("seats") ? ((Number) body.get("seats")).intValue() : 1;

        if ((flightId == null || flightId.isBlank()) && (body.get("airline") == null || body.get("destination") == null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Flight identifier or flight details are required");
        }

        BookingRecord record = bookingService.bookFlight(userId, flightId, seats, body);
        return ResponseEntity.status(HttpStatus.CREATED).body(record);
    }

    @PostMapping("/hotel")
    public ResponseEntity<BookingRecord> bookHotel(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody Map<String, Object> body) {

        resolveUser(userId);

        String hotelId = (String) body.get("hotelId");
        int rooms = body.containsKey("rooms") ? ((Number) body.get("rooms")).intValue() : 1;
        int nights = body.containsKey("nights") ? ((Number) body.get("nights")).intValue() : 1;

        if (hotelId == null || hotelId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hotel identifier is required");
        }

        BookingRecord record = bookingService.bookHotel(userId, hotelId, rooms, nights);
        return ResponseEntity.status(HttpStatus.CREATED).body(record);
    }

    @GetMapping("/my")
    public List<BookingRecord> getMyBookings(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {

        resolveUser(userId);
        return bookingService.getBookingsByUser(userId);
    }

    @GetMapping("/{id}")
    public BookingRecord getBooking(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id) {

        resolveUser(userId);
        return bookingService.getBookingById(id);
    }

    @PutMapping("/{id}/cancel")
    public BookingRecord cancelBooking(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> body) {

        resolveUser(userId);
        String reason = body != null ? String.valueOf(body.getOrDefault("reason", "Change of plans")) : "Change of plans";
        return bookingService.cancelBooking(id, userId, reason);
    }
}
