package com.makemytrip.booking;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document("bookings")
public class BookingRecord {

    @Id
    private String id;
    private String userId;
    private String type;
    private String resourceId;
    private String resourceName;
    private String resourceDetails;
    private int quantity;
    private double totalPrice;
    private String guestName;
    private String guestEmail;
    private String guestPhone;
    private LocalDateTime bookedAt;
    private String status;
    private String cancellationReason;
    private double refundPercentage;
    private double refundAmount;
    private String refundStatus;
    private String refundExpectedTimeline;
    private LocalDateTime cancelledAt;

    public BookingRecord() {}

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
