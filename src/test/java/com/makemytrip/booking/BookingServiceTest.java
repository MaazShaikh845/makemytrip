package com.makemytrip.booking;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BookingServiceTest {

    @Test
    void shouldReturnFiftyPercentRefundWithinTwentyFourHours() {
        BookingRecord booking = new BookingRecord();
        booking.setTotalPrice(1000.0);
        booking.setBookedAt(LocalDateTime.now().minusHours(12));

        BookingService.RefundDecision refundDecision =
                BookingService.calculateRefundDecision(booking, LocalDateTime.now());

        assertEquals(50.0, refundDecision.percentage(), 0.01);
        assertEquals(500.0, refundDecision.amount(), 0.01);
        assertEquals("PENDING", refundDecision.status());
    }

    @Test
    void shouldReturnTwentyFivePercentRefundWithinSevenDays() {
        BookingRecord booking = new BookingRecord();
        booking.setTotalPrice(1000.0);
        booking.setBookedAt(LocalDateTime.now().minusDays(3));

        BookingService.RefundDecision refundDecision =
                BookingService.calculateRefundDecision(booking, LocalDateTime.now());

        assertEquals(25.0, refundDecision.percentage(), 0.01);
        assertEquals(250.0, refundDecision.amount(), 0.01);
        assertEquals("PENDING", refundDecision.status());
    }
}
