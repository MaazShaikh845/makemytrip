package com.makemytrip.flight.status;

import java.util.ArrayList;
import java.util.List;

public class FlightLiveStatus {

    private String flightId;
    private String flightNumber;
    private String airline;
    private String origin;
    private String destination;

    // Status: "ON_TIME", "DELAYED", "BOARDING", "DEPARTED", "IN_FLIGHT", "LANDED", "GATE_CLOSED", "CANCELLED"
    private String status;
    private String statusDisplay; // e.g. "Delayed by 1h", "On Time", "Boarding - Gate 4B"
    private String statusColor;   // "green", "amber", "red", "blue", "purple"

    private int delayMinutes;
    private String delayReason; // e.g. "Adverse weather & thunderstorm at destination airport"
    private String contextNote;  // e.g. "Inbound aircraft arrived late. Boarding begins shortly."

    private String scheduledDepartureTime; // ISO-8601
    private String estimatedDepartureTime; // ISO-8601
    private String actualDepartureTime;    // ISO-8601 or null

    private String scheduledArrivalTime;   // ISO-8601
    private String estimatedArrivalTime;   // ISO-8601 (dynamically adjusted with delay)
    private String actualArrivalTime;      // ISO-8601 or null

    private String terminal;               // e.g. "T2"
    private String gate;                   // e.g. "42A"
    private String baggageCarousel;        // e.g. "Belt 4"
    private String aircraftModel;          // e.g. "Airbus A321neo"

    private int altitudeFt;                // e.g. 34000
    private int speedKnots;                // e.g. 485
    private int progressPercentage;        // 0 to 100
    private int remainingMinutes;          // Dynamic remaining flight duration

    private double originLat;
    private double originLng;
    private double destLat;
    private double destLng;
    private double currentLat;
    private double currentLng;

    private String lastUpdated;            // ISO-8601
    private List<StatusEvent> timeline = new ArrayList<>();

    public FlightLiveStatus() {}

    public static class StatusEvent {
        private String timestamp;
        private String title;
        private String description;
        private String severity; // "INFO", "WARNING", "SUCCESS", "CRITICAL"

        public StatusEvent() {}

        public StatusEvent(String timestamp, String title, String description, String severity) {
            this.timestamp = timestamp;
            this.title = title;
            this.description = description;
            this.severity = severity;
        }

        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }
    }

    // Getters and Setters
    public String getFlightId() { return flightId; }
    public void setFlightId(String flightId) { this.flightId = flightId; }

    public String getFlightNumber() { return flightNumber; }
    public void setFlightNumber(String flightNumber) { this.flightNumber = flightNumber; }

    public String getAirline() { return airline; }
    public void setAirline(String airline) { this.airline = airline; }

    public String getOrigin() { return origin; }
    public void setOrigin(String origin) { this.origin = origin; }

    public String getDestination() { return destination; }
    public void setDestination(String destination) { this.destination = destination; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getStatusDisplay() { return statusDisplay; }
    public void setStatusDisplay(String statusDisplay) { this.statusDisplay = statusDisplay; }

    public String getStatusColor() { return statusColor; }
    public void setStatusColor(String statusColor) { this.statusColor = statusColor; }

    public int getDelayMinutes() { return delayMinutes; }
    public void setDelayMinutes(int delayMinutes) { this.delayMinutes = delayMinutes; }

    public String getDelayReason() { return delayReason; }
    public void setDelayReason(String delayReason) { this.delayReason = delayReason; }

    public String getContextNote() { return contextNote; }
    public void setContextNote(String contextNote) { this.contextNote = contextNote; }

    public String getScheduledDepartureTime() { return scheduledDepartureTime; }
    public void setScheduledDepartureTime(String scheduledDepartureTime) { this.scheduledDepartureTime = scheduledDepartureTime; }

    public String getEstimatedDepartureTime() { return estimatedDepartureTime; }
    public void setEstimatedDepartureTime(String estimatedDepartureTime) { this.estimatedDepartureTime = estimatedDepartureTime; }

    public String getActualDepartureTime() { return actualDepartureTime; }
    public void setActualDepartureTime(String actualDepartureTime) { this.actualDepartureTime = actualDepartureTime; }

    public String getScheduledArrivalTime() { return scheduledArrivalTime; }
    public void setScheduledArrivalTime(String scheduledArrivalTime) { this.scheduledArrivalTime = scheduledArrivalTime; }

    public String getEstimatedArrivalTime() { return estimatedArrivalTime; }
    public void setEstimatedArrivalTime(String estimatedArrivalTime) { this.estimatedArrivalTime = estimatedArrivalTime; }

    public String getActualArrivalTime() { return actualArrivalTime; }
    public void setActualArrivalTime(String actualArrivalTime) { this.actualArrivalTime = actualArrivalTime; }

    public String getTerminal() { return terminal; }
    public void setTerminal(String terminal) { this.terminal = terminal; }

    public String getGate() { return gate; }
    public void setGate(String gate) { this.gate = gate; }

    public String getBaggageCarousel() { return baggageCarousel; }
    public void setBaggageCarousel(String baggageCarousel) { this.baggageCarousel = baggageCarousel; }

    public String getAircraftModel() { return aircraftModel; }
    public void setAircraftModel(String aircraftModel) { this.aircraftModel = aircraftModel; }

    public int getAltitudeFt() { return altitudeFt; }
    public void setAltitudeFt(int altitudeFt) { this.altitudeFt = altitudeFt; }

    public int getSpeedKnots() { return speedKnots; }
    public void setSpeedKnots(int speedKnots) { this.speedKnots = speedKnots; }

    public int getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(int progressPercentage) { this.progressPercentage = progressPercentage; }

    public int getRemainingMinutes() { return remainingMinutes; }
    public void setRemainingMinutes(int remainingMinutes) { this.remainingMinutes = remainingMinutes; }

    public double getOriginLat() { return originLat; }
    public void setOriginLat(double originLat) { this.originLat = originLat; }

    public double getOriginLng() { return originLng; }
    public void setOriginLng(double originLng) { this.originLng = originLng; }

    public double getDestLat() { return destLat; }
    public void setDestLat(double destLat) { this.destLat = destLat; }

    public double getDestLng() { return destLng; }
    public void setDestLng(double destLng) { this.destLng = destLng; }

    public double getCurrentLat() { return currentLat; }
    public void setCurrentLat(double currentLat) { this.currentLat = currentLat; }

    public double getCurrentLng() { return currentLng; }
    public void setCurrentLng(double currentLng) { this.currentLng = currentLng; }

    public String getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(String lastUpdated) { this.lastUpdated = lastUpdated; }

    public List<StatusEvent> getTimeline() { return timeline; }
    public void setTimeline(List<StatusEvent> timeline) { this.timeline = timeline; }
}
