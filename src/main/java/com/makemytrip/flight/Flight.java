package com.makemytrip.flight;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("flights")
public class Flight {

    @Id
    private String id;

    private String airline;
    private String flightNumber;
    private String origin;          // e.g. "DEL"
    private String destination;     // e.g. "BOM"
    private String departureTime;   // ISO-8601 string, e.g. "2025-12-01T06:00:00"
    private String arrivalTime;     // ISO-8601 string
    private double price;
    private int availableSeats;
    private String classType;       // "ECONOMY", "BUSINESS", "FIRST"
    private int durationMinutes;
    private String source;          // "DATABASE" or "EXTERNAL"

    public Flight() {
        this.source = "DATABASE";
    }

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
