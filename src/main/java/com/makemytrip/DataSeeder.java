package com.makemytrip;

import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import com.makemytrip.flight.Flight;
import com.makemytrip.flight.FlightRepository;
import com.makemytrip.hotel.Hotel;
import com.makemytrip.hotel.HotelRepository;

import com.makemytrip.review.Review;
import com.makemytrip.review.ReviewReply;
import com.makemytrip.review.ReviewRepository;

/**
 * Startup data seeder for MakeMy Tour.
 *
 * <p>Implements {@link CommandLineRunner} so it runs once automatically after the
 * Spring context has fully initialised. It populates the MongoDB collections with
 * a curated set of Indian hotels, domestic flights, and seed reviews so that the
 * platform is demo-ready immediately after deployment — no manual data entry
 * is required.</p>
 *
 * <h2>Idempotency</h2>
 * <p>Each seed method checks whether the target collection is already populated
 * before inserting documents. This ensures that restarting the application never
 * duplicates data in the database.</p>
 *
 * <h2>Seed order</h2>
 * <ol>
 *   <li>Hotels — must exist before reviews can reference them</li>
 *   <li>Flights — must exist before reviews can reference them</li>
 *   <li>Reviews — references hotel / flight IDs from the seeded records</li>
 * </ol>
 *
 * @author Maaz Shaikh
 * @since 2025
 * @see CommandLineRunner
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final HotelRepository hotelRepository;
    private final FlightRepository flightRepository;
    private final ReviewRepository reviewRepository;

    /**
     * Constructor injection is preferred over field injection here because it
     * makes the dependencies explicit and simplifies unit testing.
     *
     * @param hotelRepository  MongoDB repository for {@link Hotel} documents
     * @param flightRepository MongoDB repository for {@link Flight} documents
     * @param reviewRepository MongoDB repository for {@link Review} documents
     */
    public DataSeeder(HotelRepository hotelRepository, FlightRepository flightRepository, ReviewRepository reviewRepository) {
        this.hotelRepository = hotelRepository;
        this.flightRepository = flightRepository;
        this.reviewRepository = reviewRepository;
    }

    /**
     * Entry point called by Spring Boot after the application context starts.
     * Delegates to dedicated private helpers to keep each concern isolated.
     *
     * @param args command-line arguments (unused)
     */
    @Override
    public void run(String... args) {
        seedHotels();
        seedFlights();
        seedReviews();
    }

    // ─────────────────────────────────────────────
    //  Hotel seeding
    // ─────────────────────────────────────────────

    /**
     * Inserts a representative set of Indian hotels spanning budget (3★) to
     * luxury (5★) tiers. Skips execution entirely if any hotel document already
     * exists in the collection.
     */
    private void seedHotels() {
        if (hotelRepository.count() > 0) {
            // Collection already populated — do nothing to preserve user changes
            return;
        }

        Hotel h1 = buildHotel("Taj Mahal Palace", "Mumbai",
                "Apollo Bunder, Colaba, Mumbai",
                "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
                12500, 5,
                "An iconic luxury hotel overlooking the Gateway of India with world-class amenities.",
                35, "WiFi,Pool,Gym,Spa,Restaurant,Bar");

        Hotel h2 = buildHotel("The Leela Palace", "New Delhi",
                "Diplomatic Enclave, Chanakyapuri, New Delhi",
                "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
                9800, 5,
                "Opulent palace hotel set in manicured gardens at the heart of Delhi.",
                48, "WiFi,Pool,Gym,Spa,Restaurant,Concierge");

        Hotel h3 = buildHotel("Radisson Blu", "Bangalore",
                "No. 9, Outer Ring Rd, Koramangala, Bengaluru",
                "https://images.unsplash.com/photo-1455587734955-081b22074882?w=800",
                6200, 4,
                "Modern business hotel close to Bangalore's tech corridor.",
                60, "WiFi,Pool,Gym,Restaurant,Conference Rooms");

        Hotel h4 = buildHotel("Lemon Tree Hotel", "Goa",
                "Calangute-Candolim Road, Goa",
                "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
                4500, 3,
                "Vibrant beachside hotel minutes from Calangute beach.",
                80, "WiFi,Pool,Restaurant,Beach Access");

        Hotel h5 = buildHotel("ITC Grand Chola", "Chennai",
                "No. 63, Mount Road, Guindy, Chennai",
                "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
                8000, 5,
                "Inspired by the grandeur of the Chola dynasty – luxury redefined in South India.",
                40, "WiFi,Pool,Gym,Spa,Restaurant,Casino");

        hotelRepository.saveAll(List.of(h1, h2, h3, h4, h5));
    }

    /**
     * Factory method that constructs a {@link Hotel} domain object from individual
     * field values, avoiding repetitive setter boilerplate at the call sites.
     *
     * @param name        hotel display name
     * @param city        city where the hotel is located
     * @param address     full street address
     * @param imageUrl    publicly accessible hero image URL
     * @param price       price per night in INR
     * @param stars       star rating (1–5)
     * @param description brief marketing description shown on the listing card
     * @param rooms       initial number of available rooms
     * @param amenities   comma-separated list of amenity names (e.g. {@code "WiFi,Pool"})
     * @return a fully populated {@link Hotel} entity (not yet persisted)
     */
    private Hotel buildHotel(String name, String city, String address,
                              String imageUrl, double price, int stars,
                              String description, int rooms, String amenities) {
        Hotel h = new Hotel();
        h.setName(name);
        h.setCity(city);
        h.setAddress(address);
        h.setImageUrl(imageUrl);
        h.setPricePerNight(price);
        h.setStarRating(stars);
        h.setDescription(description);
        h.setAvailableRooms(rooms);
        h.setAmenities(amenities);
        return h;
    }

    // ─────────────────────────────────────────────
    //  Flight seeding
    // ─────────────────────────────────────────────

    /**
     * Inserts domestic Indian flight records spanning both economy and business
     * class cabins. Departure times are stored as ISO-8601 strings and rendered
     * by the frontend. Skips execution if the flights collection is non-empty.
     */
    private void seedFlights() {
        if (flightRepository.count() > 0) {
            // Already seeded — prevent duplication on restarts
            return;
        }

        Flight f1 = buildFlight("IndiGo", "6E-101", "New Delhi, India", "Mumbai, India",
                "2025-12-01T06:00:00", "2025-12-01T08:10:00",
                3499, 120, "ECONOMY", 130);

        Flight f2 = buildFlight("Air India", "AI-202", "Mumbai, India", "New Delhi, India",
                "2025-12-02T14:00:00", "2025-12-02T16:15:00",
                4200, 200, "BUSINESS", 135);

        Flight f3 = buildFlight("SpiceJet", "SG-303", "Bengaluru, India", "Hyderabad, India",
                "2025-12-03T09:30:00", "2025-12-03T10:45:00",
                1999, 180, "ECONOMY", 75);

        Flight f4 = buildFlight("Vistara", "UK-404", "New Delhi, India", "Bengaluru, India",
                "2025-12-04T07:00:00", "2025-12-04T09:40:00",
                5500, 80, "BUSINESS", 160);

        Flight f5 = buildFlight("GoAir", "G8-505", "Chennai, India", "Kolkata, India",
                "2025-12-05T11:00:00", "2025-12-05T13:30:00",
                2800, 150, "ECONOMY", 150);

        flightRepository.saveAll(List.of(f1, f2, f3, f4, f5));
    }

    /**
     * Factory method that constructs a {@link Flight} domain object from individual
     * field values.
     *
     * @param airline         carrier name (e.g. "IndiGo")
     * @param flightNumber    IATA flight designator (e.g. "6E-101")
     * @param origin          departure city/airport label
     * @param destination     arrival city/airport label
     * @param departure       ISO-8601 departure datetime string
     * @param arrival         ISO-8601 arrival datetime string
     * @param price           base fare in INR
     * @param seats           initial count of available seats
     * @param classType       cabin class — {@code "ECONOMY"}, {@code "BUSINESS"}, or {@code "FIRST"}
     * @param durationMinutes scheduled flight duration in minutes
     * @return a fully populated {@link Flight} entity (not yet persisted)
     */
    private Flight buildFlight(String airline, String flightNumber,
                               String origin, String destination,
                               String departure, String arrival,
                               double price, int seats,
                               String classType, int durationMinutes) {
        Flight f = new Flight();
        f.setAirline(airline);
        f.setFlightNumber(flightNumber);
        f.setOrigin(origin);
        f.setDestination(destination);
        f.setDepartureTime(departure);
        f.setArrivalTime(arrival);
        f.setPrice(price);
        f.setAvailableSeats(seats);
        f.setClassType(classType);
        f.setDurationMinutes(durationMinutes);
        // Mark as admin-managed so the booking service accepts it
        f.setSource("DATABASE");
        return f;
    }

    // ─────────────────────────────────────────────
    //  Review seeding
    // ─────────────────────────────────────────────

    /**
     * Seeds realistic user reviews for the first hotel and the first flight record
     * to demonstrate the review system on a fresh deployment. Reviews include
     * photos, helpfulness counts, and an admin reply to showcase the full feature set.
     */
    private void seedReviews() {
        if (reviewRepository.count() > 0) {
            return;
        }

        seedHotelReviews();
        seedFlightReviews();
    }

    /**
     * Creates and persists two hotel reviews — one five-star and one four-star —
     * both targeting the first hotel in the seeded collection.
     */
    private void seedHotelReviews() {
        List<Hotel> hotels = hotelRepository.findAll();
        if (hotels.isEmpty()) return;

        Hotel targetHotel = hotels.get(0);

        Review r1 = new Review();
        r1.setTargetType("HOTEL");
        r1.setTargetId(targetHotel.getId());
        r1.setTargetName(targetHotel.getName());
        r1.setUserId("seed-user-1");
        r1.setUserName("Ananya Sharma");
        r1.setUserEmail("ananya.sharma@example.com");
        r1.setRating(5);
        r1.setTitle("Exceptional heritage experience and impeccable hospitality!");
        r1.setComment("Staying here was truly a dream. From the welcoming garland ceremony at check-in to the harbor-facing sunset tea, everything was memorable. The Sea Lounge breakfast spread was spectacular.");
        r1.setPhotos(List.of(
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800"
        ));
        r1.getHelpfulUserIds().addAll(List.of("seed-user-2", "seed-user-3", "seed-user-4", "seed-user-5"));
        r1.setHelpfulCount(4);

        // Admin reply demonstrates the partner-reply feature
        ReviewReply rep1 = new ReviewReply("admin-1", "Hotel Manager (MakeMyTour Partner)", "ADMIN",
                "Dear Ananya, thank you so much for your kind words! We are delighted that you enjoyed the Sea Lounge and the harbor views. We hope to welcome you back very soon.");
        r1.getReplies().add(rep1);

        Review r2 = new Review();
        r2.setTargetType("HOTEL");
        r2.setTargetId(targetHotel.getId());
        r2.setTargetName(targetHotel.getName());
        r2.setUserId("seed-user-2");
        r2.setUserName("Rohan Mehta");
        r2.setUserEmail("rohan.mehta@example.com");
        r2.setRating(4);
        r2.setTitle("Stunning architecture, though check-in had a small wait");
        r2.setComment("The rooms are majestic and the historic atmosphere cannot be beaten anywhere in Mumbai. Only minor critique was a 15-minute wait during peak afternoon check-in, but the concierge was very polite.");
        r2.getHelpfulUserIds().addAll(List.of("seed-user-1", "seed-user-3"));
        r2.setHelpfulCount(2);

        reviewRepository.saveAll(List.of(r1, r2));
    }

    /**
     * Creates a single five-star flight review targeting the first seeded flight,
     * complete with a cabin photo to showcase the photo-upload feature.
     */
    private void seedFlightReviews() {
        List<Flight> flights = flightRepository.findAll();
        if (flights.isEmpty()) return;

        Flight targetFlight = flights.get(0);

        Review fr1 = new Review();
        fr1.setTargetType("FLIGHT");
        fr1.setTargetId(targetFlight.getId());
        fr1.setTargetName(targetFlight.getAirline() + " " + targetFlight.getFlightNumber());
        fr1.setUserId("seed-user-3");
        fr1.setUserName("Vikram Patel");
        fr1.setUserEmail("vikram.patel@example.com");
        fr1.setRating(5);
        fr1.setTitle("Punctual departure, smooth ride and comfortable legroom");
        fr1.setComment("Boarding was seamless at Terminal 2. The flight departed exactly on schedule and touched down 10 minutes early. Crew was courteous and pre-booked hot meals were fresh.");
        fr1.setPhotos(List.of(
                "https://images.unsplash.com/photo-1540339832862-474599807836?w=800"
        ));
        fr1.getHelpfulUserIds().addAll(List.of("seed-user-1", "seed-user-2", "seed-user-4"));
        fr1.setHelpfulCount(3);

        reviewRepository.save(fr1);
    }
}
