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

/**
 * REST controller that exposes the booking API endpoints under {@code /bookings}.
 *
 * <p>All endpoints require a valid {@code X-User-Id} header. This lightweight
 * identity mechanism replaces JWT tokens for this project's scope; the service
 * layer performs the actual ownership and existence checks.</p>
 *
 * <h2>Endpoints</h2>
 * <table border="1">
 *   <tr><th>Method</th><th>Path</th><th>Action</th></tr>
 *   <tr><td>POST</td><td>/bookings/flight</td><td>Book a flight</td></tr>
 *   <tr><td>POST</td><td>/bookings/hotel</td><td>Book a hotel</td></tr>
 *   <tr><td>GET</td><td>/bookings/my</td><td>List current user's bookings</td></tr>
 *   <tr><td>GET</td><td>/bookings/{id}</td><td>Fetch a single booking by ID</td></tr>
 *   <tr><td>PUT</td><td>/bookings/{id}/cancel</td><td>Cancel a booking</td></tr>
 * </table>
 *
 * @author Maaz Shaikh
 * @since 2025
 */
@RestController
@RequestMapping("/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private UserRepository userRepository;

    // ─────────────────────────────────────────────
    //  Identity resolution
    // ─────────────────────────────────────────────

    /**
     * Resolves the {@code X-User-Id} header to a {@link User} entity.
     *
     * <p>Called at the start of every handler to verify that the caller is
     * authenticated before any business logic executes. Returns the full
     * {@link User} object to avoid a second database round-trip in handlers
     * that need user data.</p>
     *
     * @param userId value of the {@code X-User-Id} request header
     * @return the matching {@link User}
     * @throws ResponseStatusException {@code 401} if the header is absent or the ID is unknown
     */
    private User resolveUser(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing user credentials");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User account not found"));
    }

    // ─────────────────────────────────────────────
    //  Flight booking
    // ─────────────────────────────────────────────

    /**
     * Books one or more seats on a specific flight for the authenticated user.
     *
     * <p>Expected request body:
     * <pre>
     * {
     *   "flightId": "...",   // required — MongoDB ID of the flight
     *   "seats":    2        // optional, defaults to 1
     * }
     * </pre>
     * </p>
     *
     * @param userId header containing the authenticated user's MongoDB ID
     * @param body   JSON request body with booking parameters
     * @return {@code 201 Created} with the persisted {@link BookingRecord}
     */
    @PostMapping("/flight")
    public ResponseEntity<BookingRecord> bookFlight(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody Map<String, Object> body) {

        resolveUser(userId);

        String flightId = body.get("flightId") != null ? body.get("flightId").toString() : null;
        int seats = body.containsKey("seats") ? ((Number) body.get("seats")).intValue() : 1;

        // Require at minimum a flight ID for a database-backed booking
        if ((flightId == null || flightId.isBlank())
                && (body.get("airline") == null || body.get("destination") == null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Flight identifier or flight details are required");
        }

        BookingRecord record = bookingService.bookFlight(userId, flightId, seats, body);
        return ResponseEntity.status(HttpStatus.CREATED).body(record);
    }

    // ─────────────────────────────────────────────
    //  Hotel booking
    // ─────────────────────────────────────────────

    /**
     * Books one or more hotel rooms for the authenticated user.
     *
     * <p>Expected request body:
     * <pre>
     * {
     *   "hotelId": "...",   // required — MongoDB ID of the hotel
     *   "rooms":   1,       // optional, defaults to 1
     *   "nights":  3        // optional, defaults to 1
     * }
     * </pre>
     * </p>
     *
     * @param userId header containing the authenticated user's MongoDB ID
     * @param body   JSON request body with booking parameters
     * @return {@code 201 Created} with the persisted {@link BookingRecord}
     */
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

    // ─────────────────────────────────────────────
    //  Read endpoints
    // ─────────────────────────────────────────────

    /**
     * Returns all bookings owned by the currently authenticated user.
     *
     * @param userId header containing the authenticated user's MongoDB ID
     * @return list of {@link BookingRecord} (may be empty)
     */
    @GetMapping("/my")
    public List<BookingRecord> getMyBookings(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {

        resolveUser(userId);
        return bookingService.getBookingsByUser(userId);
    }

    /**
     * Returns a single booking by its MongoDB document ID.
     *
     * @param userId header containing the authenticated user's MongoDB ID
     * @param id     MongoDB ID of the target booking
     * @return the matching {@link BookingRecord}
     */
    @GetMapping("/{id}")
    public BookingRecord getBooking(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id) {

        resolveUser(userId);
        return bookingService.getBookingById(id);
    }

    // ─────────────────────────────────────────────
    //  Cancellation
    // ─────────────────────────────────────────────

    /**
     * Cancels a confirmed booking and applies the time-based refund policy.
     *
     * <p>Optional request body:
     * <pre>
     * {
     *   "reason": "Plans changed"   // defaults to "Change of plans" if omitted
     * }
     * </pre>
     * </p>
     *
     * @param userId header containing the authenticated user's MongoDB ID
     * @param id     MongoDB ID of the booking to cancel
     * @param body   optional JSON body with a {@code reason} field
     * @return the updated {@link BookingRecord} with cancellation metadata
     */
    @PutMapping("/{id}/cancel")
    public BookingRecord cancelBooking(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> body) {

        resolveUser(userId);
        String reason = body != null
                ? String.valueOf(body.getOrDefault("reason", "Change of plans"))
                : "Change of plans";
        return bookingService.cancelBooking(id, userId, reason);
    }
}
