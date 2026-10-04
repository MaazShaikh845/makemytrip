package com.makemytrip.booking;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Persistent domain model representing a single confirmed or cancelled booking.
 *
 * <p>A {@code BookingRecord} captures everything needed to describe a transaction:
 * who made it, what was reserved (flight seat or hotel room), when it was booked,
 * the total cost charged, and — if applicable — cancellation metadata including
 * the computed refund amount.</p>
 *
 * <h2>MongoDB mapping</h2>
 * <p>Documents are stored in the {@code bookings} collection. The same record is
 * also embedded inside the owning {@link com.makemytrip.user.User} document for
 * fast profile-page reads, so updates must be written to both locations.</p>
 *
 * <h2>Booking types</h2>
 * <ul>
 *   <li>{@code "FLIGHT"} — the {@link #quantity} field represents seats booked.</li>
 *   <li>{@code "HOTEL"} — the {@link #quantity} field represents rooms booked.</li>
 * </ul>
 *
 * @author Maaz Shaikh
 * @since 2025
 */
@Document("bookings")
public class BookingRecord {

    /** MongoDB-generated document identifier. */
    @Id
    private String id;

    /** ID of the {@link com.makemytrip.user.User} who made this booking. */
    private String userId;

    /**
     * Discriminator for the booked resource type.
     * Allowed values: {@code "FLIGHT"}, {@code "HOTEL"}.
     */
    private String type;

    /** MongoDB ID of the booked {@link com.makemytrip.flight.Flight} or {@link com.makemytrip.hotel.Hotel}. */
    private String resourceId;

    /** Human-readable name of the resource (e.g. airline + flight number, or hotel name). */
    private String resourceName;

    /**
     * Concise detail string shown on the booking card.
     * For flights: {@code "Origin → Destination | Departure: ... | Class: ..."}.
     * For hotels:  {@code "City | Address | N Room(s), N Night(s)"}.
     */
    private String resourceDetails;

    /**
     * Number of seats (for flights) or rooms (for hotels) reserved.
     * Always a positive integer.
     */
    private int quantity;

    /**
     * Total amount charged at the time of booking, in INR.
     * For flights: {@code price × seats}. For hotels: {@code pricePerNight × rooms × nights}.
     */
    private double totalPrice;

    /** Full name of the primary guest, derived from the user's profile. */
    private String guestName;

    /** Email address of the guest — copied from the user account at booking time. */
    private String guestEmail;

    /** Phone number of the guest — copied from the user account at booking time. */
    private String guestPhone;

    /** Timestamp when the booking was first persisted. */
    private LocalDateTime bookedAt;

    /**
     * Lifecycle status of the booking.
     * Transitions: {@code CONFIRMED → CANCELLED}.
     */
    private String status;

    /** Reason provided by the user when cancelling, or a default message. */
    private String cancellationReason;

    /**
     * Percentage of {@link #totalPrice} to be refunded, determined by
     * {@link BookingService#calculateRefundDecision}.
     */
    private double refundPercentage;

    /** Exact INR amount to be refunded, rounded to two decimal places. */
    private double refundAmount;

    /**
     * Processing state of the refund.
     * Starts as {@code "PENDING"} and should be updated to {@code "PROCESSED"}
     * once payment gateway integration confirms the transfer.
     */
    private String refundStatus;

    /**
     * Human-readable timeframe for the refund (e.g. {@code "3-5 business days"}).
     * Surfaced directly in the UI cancellation confirmation dialog.
     */
    private String refundExpectedTimeline;

    /** Timestamp when the booking status was changed to {@code CANCELLED}. */
    private LocalDateTime cancelledAt;

    /** Default no-argument constructor required by Spring Data MongoDB. */
    public BookingRecord() {}

    // ─── Accessors ──────────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }

    public String getResourceName() { return resourceName; }
    public void setResourceName(String resourceName) { this.resourceName = resourceName; }

    public String getResourceDetails() { return resourceDetails; }
    public void setResourceDetails(String resourceDetails) { this.resourceDetails = resourceDetails; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public double getTotalPrice() { return totalPrice; }
    public void setTotalPrice(double totalPrice) { this.totalPrice = totalPrice; }

    public String getGuestName() { return guestName; }
    public void setGuestName(String guestName) { this.guestName = guestName; }

    public String getGuestEmail() { return guestEmail; }
    public void setGuestEmail(String guestEmail) { this.guestEmail = guestEmail; }

    public String getGuestPhone() { return guestPhone; }
    public void setGuestPhone(String guestPhone) { this.guestPhone = guestPhone; }

    public LocalDateTime getBookedAt() { return bookedAt; }
    public void setBookedAt(LocalDateTime bookedAt) { this.bookedAt = bookedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public double getRefundPercentage() { return refundPercentage; }
    public void setRefundPercentage(double refundPercentage) { this.refundPercentage = refundPercentage; }

    public double getRefundAmount() { return refundAmount; }
    public void setRefundAmount(double refundAmount) { this.refundAmount = refundAmount; }

    public String getRefundStatus() { return refundStatus; }
    public void setRefundStatus(String refundStatus) { this.refundStatus = refundStatus; }

    public String getRefundExpectedTimeline() { return refundExpectedTimeline; }
    public void setRefundExpectedTimeline(String refundExpectedTimeline) { this.refundExpectedTimeline = refundExpectedTimeline; }

    public LocalDateTime getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(LocalDateTime cancelledAt) { this.cancelledAt = cancelledAt; }
}
