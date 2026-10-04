package com.makemytrip.flight;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Domain entity representing a scheduled flight available for booking.
 *
 * <p>Flights are stored in the {@code flights} MongoDB collection and managed
 * exclusively by platform administrators. They represent the canonical, bookable
 * set of routes displayed to travellers on the home page.</p>
 *
 * <h2>Source field</h2>
 * <p>The {@link #source} field acts as a discriminator between admin-managed
 * records ({@code "DATABASE"}) and informational live-status data enriched from
 * external APIs ({@code "EXTERNAL"}). Only {@code "DATABASE"} flights can be booked.</p>
 *
 * <h2>Time format</h2>
 * <p>Departure and arrival times are stored as ISO-8601 datetime strings
 * (e.g. {@code "2025-12-01T06:00:00"}) without timezone offsets. The frontend
 * interprets these as IST (UTC+05:30).</p>
 *
 * @author Maaz Shaikh
 * @since 2025
 */
@Document("flights")
public class Flight {

    /** MongoDB-generated document identifier. */
    @Id
    private String id;

    /** Commercial airline operating this flight (e.g. {@code "IndiGo"}). */
    private String airline;

    /** IATA flight designator (e.g. {@code "6E-101"}). */
    private String flightNumber;

    /** Departure city or airport label (e.g. {@code "New Delhi, India"}). */
    private String origin;

    /** Arrival city or airport label (e.g. {@code "Mumbai, India"}). */
    private String destination;

    /** ISO-8601 departure datetime string (e.g. {@code "2025-12-01T06:00:00"}). */
    private String departureTime;

    /** ISO-8601 arrival datetime string (e.g. {@code "2025-12-01T08:10:00"}). */
    private String arrivalTime;

    /** Base fare per seat in INR. */
    private double price;

    /** Current count of seats available for booking. Decremented on booking, restored on cancellation. */
    private int availableSeats;

    /**
     * Cabin class designation.
     * Allowed values: {@code "ECONOMY"}, {@code "BUSINESS"}, {@code "FIRST"}.
     */
    private String classType;

    /** Scheduled flight duration in minutes. Used by the frontend to display HH:MM flight time. */
    private int durationMinutes;

    /**
     * Indicates the provenance of this record.
     * <ul>
     *   <li>{@code "DATABASE"} — admin-managed; eligible for booking.</li>
     *   <li>{@code "EXTERNAL"} — enriched from a live-status API; read-only.</li>
     * </ul>
     * Defaults to {@code "DATABASE"} in the no-arg constructor so that admin-created
     * flights are automatically bookable.
     */
    private String source;

    /**
     * Default constructor. Sets {@link #source} to {@code "DATABASE"} so that
     * any flight created without explicitly specifying a source is treated as
     * admin-managed and therefore bookable.
     */
    public Flight() {
        this.source = "DATABASE";
    }

    // ─── Accessors ──────────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getAirline() { return airline; }
    public void setAirline(String airline) { this.airline = airline; }

    public String getFlightNumber() { return flightNumber; }
    public void setFlightNumber(String flightNumber) { this.flightNumber = flightNumber; }

    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }

    public String getDepartureTime() { return departureTime; }
    public void setDepartureTime(String departureTime) { this.departureTime = departureTime; }

    public String getArrivalTime() { return arrivalTime; }
    public void setArrivalTime(String arrivalTime) { this.arrivalTime = arrivalTime; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public int getAvailableSeats() { return availableSeats; }
    public void setAvailableSeats(int availableSeats) { this.availableSeats = availableSeats; }

    public String getClassType() { return classType; }
    public void setClassType(String classType) { this.classType = classType; }

    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}
