package com.makemytrip.hotel;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Domain entity representing a hotel property available for booking.
 *
 * <p>Hotels are stored in the {@code hotels} MongoDB collection and are managed
 * by platform administrators via the Admin Panel. Travellers browse and book hotels
 * from this collection through the frontend home page.</p>
 *
 * <h2>Amenities encoding</h2>
 * <p>Amenities are stored as a comma-separated string (e.g. {@code "WiFi,Pool,Gym"})
 * rather than an array. The frontend splits on commas to render individual badges,
 * and administrators enter them in the same format in the Admin Panel form.</p>
 *
 * <h2>Inventory management</h2>
 * <p>The {@link #availableRooms} counter is decremented when a hotel booking is
 * confirmed and restored when a booking is cancelled. Administrators can override
 * this value directly through the hotel management endpoints.</p>
 *
 * @author Maaz Shaikh
 * @since 2025
 */
@Document("hotels")
public class Hotel {

    /** MongoDB-generated document identifier. */
    @Id
    private String id;

    /** Display name of the hotel (e.g. {@code "Taj Mahal Palace"}). */
    private String name;

    /** City where the hotel is located (e.g. {@code "Mumbai"}). Used for city-based filtering. */
    private String city;

    /** Full street address shown on the booking detail page. */
    private String address;

    /** Publicly accessible URL for the hotel's hero image. Sourced from Unsplash for seed data. */
    private String imageUrl;

    /** Nightly room rate in INR. Total cost = {@code pricePerNight × rooms × nights}. */
    private double pricePerNight;

    /**
     * Official star rating of the property.
     * Accepted range: 1 (budget) to 5 (luxury).
     */
    private int starRating;

    /** Marketing description displayed on the hotel listing card. */
    private String description;

    /**
     * Current count of rooms available for booking.
     * Decremented on booking confirmation, restored on cancellation.
     */
    private int availableRooms;

    /**
     * Comma-separated list of amenity names offered by the hotel.
     * Example: {@code "WiFi,Pool,Gym,Spa,Restaurant,Bar"}.
     */
    private String amenities;

    /** Default no-argument constructor required by Spring Data MongoDB. */
    public Hotel() {}

    // ─── Accessors ──────────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public double getPricePerNight() { return pricePerNight; }
    public void setPricePerNight(double pricePerNight) { this.pricePerNight = pricePerNight; }

    public int getStarRating() { return starRating; }
    public void setStarRating(int starRating) { this.starRating = starRating; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getAvailableRooms() { return availableRooms; }
    public void setAvailableRooms(int availableRooms) { this.availableRooms = availableRooms; }

    public String getAmenities() { return amenities; }
    public void setAmenities(String amenities) { this.amenities = amenities; }
}
