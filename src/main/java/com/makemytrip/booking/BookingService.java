package com.makemytrip.booking;

import com.makemytrip.flight.Flight;
import com.makemytrip.flight.FlightRepository;
import com.makemytrip.hotel.Hotel;
import com.makemytrip.hotel.HotelRepository;
import com.makemytrip.user.User;
import com.makemytrip.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Core business-logic service for the MakeMy Tour booking subsystem.
 *
 * <p>This service is the single authoritative place where bookings are created
 * and cancelled. It enforces all domain rules — inventory checks, refund
 * calculations, and user-ownership validation — before persisting any changes.</p>
 *
 * <h2>Booking flow</h2>
 * <ol>
 *   <li>Validate input (positive quantity, user exists, resource exists).</li>
 *   <li>Check inventory (available seats / rooms ≥ requested quantity).</li>
 *   <li>Decrement inventory and persist the updated resource.</li>
 *   <li>Construct a {@link BookingRecord} and persist it in the {@code bookings} collection.</li>
 *   <li>Embed the record inside the user document for fast profile reads.</li>
 * </ol>
 *
 * <h2>Cancellation &amp; refund policy</h2>
 * <p>Refunds are time-based relative to the booking timestamp:
 * <ul>
 *   <li>&le; 24 hours after booking → 50 % refund</li>
 *   <li>25–168 hours (1–7 days) after booking → 25 % refund</li>
 *   <li>&gt; 168 hours after booking → no refund</li>
 * </ul>
 * </p>
 *
 * @author Maaz Shaikh
 * @since 2025
 */
@Service
public class BookingService {

    // ─────────────────────────────────────────────
    //  Refund policy
    // ─────────────────────────────────────────────

    /**
     * Immutable value object that captures the outcome of the refund calculation.
     *
     * @param percentage fraction of the total price to refund (0, 25, or 50)
     * @param amount     exact INR amount to refund (rounded to 2 decimal places)
     * @param status     initial processing state — always {@code "PENDING"}
     * @param timeline   human-readable estimate for when the refund will clear
     */
    public record RefundDecision(double percentage, double amount, String status, String timeline) {}

    /**
     * Calculates the refund entitlement for a cancelled booking based on how
     * much time has elapsed since the booking was created.
     *
     * <p>This method is {@code static} and {@code public} so that it can be
     * exercised directly in unit tests without needing a full Spring context.</p>
     *
     * @param booking the {@link BookingRecord} being cancelled (must not be {@code null})
     * @param now     the current instant, injected to make the method deterministic in tests
     * @return a {@link RefundDecision} with the applicable percentage, amount, and timeline
     */
    public static RefundDecision calculateRefundDecision(BookingRecord booking, LocalDateTime now) {
        // Guard: return a no-refund decision if the booking data is incomplete
        if (booking == null || booking.getTotalPrice() <= 0 || booking.getBookedAt() == null) {
            return new RefundDecision(0.0, 0.0, "PENDING", "No refund due");
        }

        long hoursSinceBooking = ChronoUnit.HOURS.between(booking.getBookedAt(), now);

        double percentage;
        String timeline;

        if (hoursSinceBooking <= 24) {
            // Full-day cancellation window — 50 % refund
            percentage = 50.0;
            timeline = "3-5 business days";
        } else if (hoursSinceBooking <= 168) {
            // Within one week — partial 25 % refund
            percentage = 25.0;
            timeline = "5-7 business days";
        } else {
            // Beyond the refund window — no refund
            percentage = 0.0;
            timeline = "No refund due";
        }

        // Round to 2 decimal places to avoid floating-point representation artefacts
        double amount = Math.round((booking.getTotalPrice() * percentage / 100.0) * 100.0) / 100.0;
        return new RefundDecision(percentage, amount, "PENDING", timeline);
    }

    // ─────────────────────────────────────────────
    //  Repository dependencies
    // ─────────────────────────────────────────────

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private HotelRepository hotelRepository;

    // ─────────────────────────────────────────────
    //  Public API
    // ─────────────────────────────────────────────

    /**
     * Convenience overload for booking a flight without specifying fallback
     * external-flight data (i.e. only admin-managed DATABASE flights).
     *
     * @param userId   ID of the requesting user
     * @param flightId MongoDB ID of the target {@link Flight}
     * @param seats    number of seats to reserve (must be ≥ 1)
     * @return the persisted {@link BookingRecord}
     */
    public BookingRecord bookFlight(String userId, String flightId, int seats) {
        return bookFlight(userId, flightId, seats, null);
    }

    /**
     * Books one or more seats on an admin-managed flight for the specified user.
     *
     * <p>Only flights with {@code source == "DATABASE"} can be booked. Flights
     * sourced externally (live-status enrichment) are read-only and cannot
     * be reserved through this API.</p>
     *
     * @param userId             ID of the requesting user
     * @param flightId           MongoDB ID of the {@link Flight} to book
     * @param seats              number of seats to reserve (must be ≥ 1)
     * @param fallbackFlightData ignored — retained for API compatibility
     * @return the persisted {@link BookingRecord} with status {@code "CONFIRMED"}
     * @throws ResponseStatusException {@code 400} if {@code seats} ≤ 0 or inventory is insufficient
     * @throws ResponseStatusException {@code 401} if the user ID is not found
     * @throws ResponseStatusException {@code 403} if the flight is not admin-managed
     * @throws ResponseStatusException {@code 404} if the flight ID is not found
     */
    public BookingRecord bookFlight(String userId, String flightId, int seats,
                                    Map<String, Object> fallbackFlightData) {
        validatePositive(seats, "Seats");

        User user = fetchUserOrThrow(userId);
        Flight flight = fetchFlightOrThrow(flightId);
        assertDatabaseFlight(flight);
        assertSufficientSeats(flight, seats);

        // Decrement inventory — always save the resource before creating the booking
        flight.setAvailableSeats(flight.getAvailableSeats() - seats);
        flightRepository.save(flight);

        BookingRecord record = buildFlightBooking(user, flight, seats);
        return persistAndLinkToUser(record, user);
    }

    /**
     * Books one or more hotel rooms for the specified user.
     *
     * @param userId  ID of the requesting user
     * @param hotelId MongoDB ID of the {@link Hotel} to book
     * @param rooms   number of rooms to reserve (must be ≥ 1)
     * @param nights  number of nights to stay (must be ≥ 1)
     * @return the persisted {@link BookingRecord} with status {@code "CONFIRMED"}
     * @throws ResponseStatusException {@code 400} if {@code rooms} or {@code nights} ≤ 0, or inventory insufficient
     * @throws ResponseStatusException {@code 401} if the user ID is not found
     * @throws ResponseStatusException {@code 404} if the hotel ID is not found
     */
    public BookingRecord bookHotel(String userId, String hotelId, int rooms, int nights) {
        validatePositive(rooms, "Rooms");
        validatePositive(nights, "Nights");

        User user = fetchUserOrThrow(userId);
        Hotel hotel = fetchHotelOrThrow(hotelId);
        assertSufficientRooms(hotel, rooms);

        // Decrement room inventory before persisting the booking
        hotel.setAvailableRooms(hotel.getAvailableRooms() - rooms);
        hotelRepository.save(hotel);

        BookingRecord record = buildHotelBooking(user, hotel, hotelId, rooms, nights);
        return persistAndLinkToUser(record, user);
    }

    /**
     * Retrieves all bookings belonging to the given user, sorted by the
     * repository's natural order (insertion order in MongoDB).
     *
     * @param userId MongoDB ID of the user
     * @return list of {@link BookingRecord} (may be empty, never {@code null})
     */
    public List<BookingRecord> getBookingsByUser(String userId) {
        return bookingRepository.findByUserId(userId);
    }

    /**
     * Retrieves a single booking by its MongoDB document ID.
     *
     * @param id the booking's {@code _id} field
     * @return the matching {@link BookingRecord}
     * @throws ResponseStatusException {@code 404} if not found
     */
    public BookingRecord getBookingById(String id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
    }

    /**
     * Cancels a confirmed booking, computes the applicable refund, and restores
     * the reserved inventory back to the source resource.
     *
     * <p>If the booking is already in {@code CANCELLED} status, the method
     * returns the existing record without making any further changes (idempotent).</p>
     *
     * @param id                 MongoDB ID of the booking to cancel
     * @param userId             ID of the user requesting cancellation (ownership check)
     * @param cancellationReason optional user-supplied reason; defaults to "Change of plans"
     * @return the updated {@link BookingRecord} with cancellation metadata applied
     * @throws ResponseStatusException {@code 403} if the booking does not belong to the requesting user
     * @throws ResponseStatusException {@code 404} if the booking ID is not found
     */
    public BookingRecord cancelBooking(String id, String userId, String cancellationReason) {
        BookingRecord booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        // Ownership check — users may only cancel their own bookings
        if (!booking.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to cancel this booking");
        }

        // Idempotency — do nothing if already cancelled
        if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) {
            return booking;
        }

        RefundDecision refund = calculateRefundDecision(booking, LocalDateTime.now());
        restoreInventory(booking);
        applyCancellationMetadata(booking, refund, cancellationReason);

        BookingRecord updated = bookingRepository.save(booking);
        syncCancelledBookingInUserDocument(updated, userId);
        return updated;
    }

    // ─────────────────────────────────────────────
    //  Private helpers
    // ─────────────────────────────────────────────

    /**
     * Validates that an integer quantity is strictly positive.
     *
     * @param value     the value to check
     * @param fieldName display name used in the error message (e.g. "Seats", "Nights")
     * @throws ResponseStatusException {@code 400} if {@code value} ≤ 0
     */
    private void validatePositive(int value, String fieldName) {
        if (value <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    fieldName + " must be greater than 0");
        }
    }

    /**
     * Loads a {@link User} by ID, throwing a {@code 401} if not found.
     *
     * @param userId MongoDB user ID
     * @return the located {@link User}
     */
    private User fetchUserOrThrow(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    /**
     * Loads a {@link Flight} by ID, throwing a {@code 404} if not found or if
     * the provided ID is blank.
     *
     * @param flightId MongoDB flight ID
     * @return the located {@link Flight}
     */
    private Flight fetchFlightOrThrow(String flightId) {
        if (flightId == null || flightId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Flight not found. Only flights managed by administrators are available for booking. " +
                    "Please select from the available flights list.");
        }
        return flightRepository.findById(flightId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Flight not found. Only flights managed by administrators are available for booking. " +
                        "Please select from the available flights list."));
    }

    /**
     * Loads a {@link Hotel} by ID, throwing a {@code 404} if not found.
     *
     * @param hotelId MongoDB hotel ID
     * @return the located {@link Hotel}
     */
    private Hotel fetchHotelOrThrow(String hotelId) {
        return hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel not found"));
    }

    /**
     * Asserts that the given flight is admin-managed (source == "DATABASE").
     * External live-status flights are informational only and cannot be booked.
     *
     * @param flight the {@link Flight} to check
     * @throws ResponseStatusException {@code 403} if the flight is not DATABASE-sourced
     */
    private void assertDatabaseFlight(Flight flight) {
        if (flight.getSource() == null || !flight.getSource().equals("DATABASE")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "This flight cannot be booked. Only admin-managed flights are available.");
        }
    }

    /**
     * Asserts that the flight has enough available seats for the requested quantity.
     *
     * @param flight the {@link Flight} to check
     * @param seats  requested number of seats
     * @throws ResponseStatusException {@code 400} if inventory is insufficient
     */
    private void assertSufficientSeats(Flight flight, int seats) {
        if (flight.getAvailableSeats() < seats) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not enough seats available");
        }
    }

    /**
     * Asserts that the hotel has enough available rooms for the requested quantity.
     *
     * @param hotel the {@link Hotel} to check
     * @param rooms requested number of rooms
     * @throws ResponseStatusException {@code 400} if inventory is insufficient
     */
    private void assertSufficientRooms(Hotel hotel, int rooms) {
        if (hotel.getAvailableRooms() < rooms) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not enough rooms available");
        }
    }

    /**
     * Constructs a {@link BookingRecord} for a flight reservation.
     * Does NOT persist — use {@link #persistAndLinkToUser} for that.
     *
     * @param user   the booking owner
     * @param flight the flight being reserved
     * @param seats  number of seats reserved
     * @return an unpersisted {@link BookingRecord}
     */
    private BookingRecord buildFlightBooking(User user, Flight flight, int seats) {
        BookingRecord record = new BookingRecord();
        record.setUserId(user.getId());
        record.setType("FLIGHT");
        record.setResourceId(flight.getId());
        record.setResourceName(flight.getAirline() + " ("
                + (flight.getFlightNumber() != null ? flight.getFlightNumber() : "") + ")");
        record.setResourceDetails(flight.getOrigin() + " → " + flight.getDestination()
                + " | Departure: " + flight.getDepartureTime()
                + " | Class: " + flight.getClassType());
        record.setQuantity(seats);
        record.setTotalPrice(flight.getPrice() * seats);
        populateGuestFields(record, user);
        record.setBookedAt(LocalDateTime.now());
        record.setStatus("CONFIRMED");
        return record;
    }

    /**
     * Constructs a {@link BookingRecord} for a hotel reservation.
     * Does NOT persist — use {@link #persistAndLinkToUser} for that.
     *
     * @param user    the booking owner
     * @param hotel   the hotel being reserved
     * @param hotelId MongoDB ID of the hotel (used directly in case hotel.getId() is null)
     * @param rooms   number of rooms reserved
     * @param nights  number of nights for the stay
     * @return an unpersisted {@link BookingRecord}
     */
    private BookingRecord buildHotelBooking(User user, Hotel hotel, String hotelId, int rooms, int nights) {
        BookingRecord record = new BookingRecord();
        record.setUserId(user.getId());
        record.setType("HOTEL");
        record.setResourceId(hotelId);
        record.setResourceName(hotel.getName());
        record.setResourceDetails(hotel.getCity()
                + " | " + (hotel.getAddress() != null ? hotel.getAddress() : "")
                + " | " + rooms + " Room(s), " + nights + " Night(s)");
        record.setQuantity(rooms);
        record.setTotalPrice(hotel.getPricePerNight() * rooms * nights);
        populateGuestFields(record, user);
        record.setBookedAt(LocalDateTime.now());
        record.setStatus("CONFIRMED");
        return record;
    }

    /**
     * Copies guest-identifying fields from the user profile into the booking record.
     * Null-safe: missing first/last names produce an empty or partial full name.
     *
     * @param record destination booking record
     * @param user   source user profile
     */
    private void populateGuestFields(BookingRecord record, User user) {
        String fullName = ((user.getFirstName() != null ? user.getFirstName() : "")
                + " " + (user.getLastName() != null ? user.getLastName() : "")).trim();
        record.setGuestName(fullName);
        record.setGuestEmail(user.getEmail());
        record.setGuestPhone(user.getPhoneNumber());
    }

    /**
     * Persists a new booking record to the {@code bookings} collection and
     * appends it to the owning user's embedded {@code bookings} array.
     *
     * <p>Both writes are executed sequentially. In case of a transient failure
     * between the two saves, the booking exists in the collection but the user's
     * embedded list may be stale — the profile page falls back to the canonical
     * collection so the data will still appear correctly.</p>
     *
     * @param record the booking to persist
     * @param user   the owning user
     * @return the saved {@link BookingRecord} (with MongoDB-generated ID populated)
     */
    private BookingRecord persistAndLinkToUser(BookingRecord record, User user) {
        BookingRecord saved = bookingRepository.save(record);

        // Lazily initialise the bookings list on the user document
        if (user.getBookings() == null) {
            user.setBookings(new ArrayList<>());
        }
        user.getBookings().add(saved);
        userRepository.save(user);

        return saved;
    }

    /**
     * Returns the cancelled booking's reserved units back to the source resource.
     * Skips silently if the resource no longer exists (e.g. deleted by an admin).
     *
     * @param booking the cancelled {@link BookingRecord}
     */
    private void restoreInventory(BookingRecord booking) {
        if ("FLIGHT".equalsIgnoreCase(booking.getType())) {
            flightRepository.findById(booking.getResourceId()).ifPresent(flight -> {
                flight.setAvailableSeats(flight.getAvailableSeats() + booking.getQuantity());
                flightRepository.save(flight);
            });
        } else if ("HOTEL".equalsIgnoreCase(booking.getType())) {
            hotelRepository.findById(booking.getResourceId()).ifPresent(hotel -> {
                hotel.setAvailableRooms(hotel.getAvailableRooms() + booking.getQuantity());
                hotelRepository.save(hotel);
            });
        }
    }

    /**
     * Applies cancellation and refund metadata directly to a booking record.
     * The caller is responsible for persisting the mutated record afterward.
     *
     * @param booking            the record to mutate
     * @param refund             the computed {@link RefundDecision}
     * @param cancellationReason raw reason string; defaults to "Change of plans" if blank
     */
    private void applyCancellationMetadata(BookingRecord booking, RefundDecision refund,
                                           String cancellationReason) {
        booking.setStatus("CANCELLED");
        booking.setCancellationReason(
                (cancellationReason == null || cancellationReason.isBlank())
                        ? "Change of plans"
                        : cancellationReason);
        booking.setRefundPercentage(refund.percentage());
        booking.setRefundAmount(refund.amount());
        booking.setRefundStatus(refund.status());
        booking.setRefundExpectedTimeline(refund.timeline());
        booking.setCancelledAt(LocalDateTime.now());
    }

    /**
     * Updates the stale embedded booking entry inside the user document so that
     * the profile page reflects the cancellation without a separate collection query.
     *
     * @param updated the freshly saved (cancelled) {@link BookingRecord}
     * @param userId  ID of the owning user
     */
    private void syncCancelledBookingInUserDocument(BookingRecord updated, String userId) {
        userRepository.findById(userId).ifPresent(user -> {
            if (user.getBookings() != null) {
                for (int i = 0; i < user.getBookings().size(); i++) {
                    if (updated.getId().equals(user.getBookings().get(i).getId())) {
                        user.getBookings().set(i, updated);
                        break;
                    }
                }
                userRepository.save(user);
            }
        });
    }
}
