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

@Component
public class DataSeeder implements CommandLineRunner {

    private final HotelRepository hotelRepository;
    private final FlightRepository flightRepository;
    private final ReviewRepository reviewRepository;

    public DataSeeder(HotelRepository hotelRepository, FlightRepository flightRepository, ReviewRepository reviewRepository) {
        this.hotelRepository = hotelRepository;
        this.flightRepository = flightRepository;
        this.reviewRepository = reviewRepository;
    }

    @Override
    public void run(String... args) {
        seedHotels();
        seedFlights();
        seedReviews();
    }

    private void seedHotels() {
        if (hotelRepository.count() > 0) {
            return;
        }

        Hotel h1 = hotel("Taj Mahal Palace", "Mumbai",
                "Apollo Bunder, Colaba, Mumbai",
                "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800",
                12500, 5,
                "An iconic luxury hotel overlooking the Gateway of India with world-class amenities.",
                35, "WiFi,Pool,Gym,Spa,Restaurant,Bar");

        Hotel h2 = hotel("The Leela Palace", "New Delhi",
                "Diplomatic Enclave, Chanakyapuri, New Delhi",
                "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
                9800, 5,
                "Opulent palace hotel set in manicured gardens at the heart of Delhi.",
                48, "WiFi,Pool,Gym,Spa,Restaurant,Concierge");

        Hotel h3 = hotel("Radisson Blu", "Bangalore",
                "No. 9, Outer Ring Rd, Koramangala, Bengaluru",
                "https://images.unsplash.com/photo-1455587734955-081b22074882?w=800",
                6200, 4,
                "Modern business hotel close to Bangalore's tech corridor.",
                60, "WiFi,Pool,Gym,Restaurant,Conference Rooms");

        Hotel h4 = hotel("Lemon Tree Hotel", "Goa",
                "Calangute-Candolim Road, Goa",
                "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
                4500, 3,
                "Vibrant beachside hotel minutes from Calangute beach.",
                80, "WiFi,Pool,Restaurant,Beach Access");

        Hotel h5 = hotel("ITC Grand Chola", "Chennai",
                "No. 63, Mount Road, Guindy, Chennai",
                "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
                8000, 5,
                "Inspired by the grandeur of the Chola dynasty – luxury redefined in South India.",
                40, "WiFi,Pool,Gym,Spa,Restaurant,Casino");

        hotelRepository.saveAll(List.of(h1, h2, h3, h4, h5));
    }

    private Hotel hotel(String name, String city, String address,
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

    private void seedFlights() {
        if (flightRepository.count() > 0) {
            return;
        }

        Flight f1 = flight("IndiGo", "6E-101", "New Delhi, India", "Mumbai, India",
                "2025-12-01T06:00:00", "2025-12-01T08:10:00",
                3499, 120, "ECONOMY", 130);

        Flight f2 = flight("Air India", "AI-202", "Mumbai, India", "New Delhi, India",
                "2025-12-02T14:00:00", "2025-12-02T16:15:00",
                4200, 200, "BUSINESS", 135);

        Flight f3 = flight("SpiceJet", "SG-303", "Bengaluru, India", "Hyderabad, India",
                "2025-12-03T09:30:00", "2025-12-03T10:45:00",
                1999, 180, "ECONOMY", 75);

        Flight f4 = flight("Vistara", "UK-404", "New Delhi, India", "Bengaluru, India",
                "2025-12-04T07:00:00", "2025-12-04T09:40:00",
                5500, 80, "BUSINESS", 160);

        Flight f5 = flight("GoAir", "G8-505", "Chennai, India", "Kolkata, India",
                "2025-12-05T11:00:00", "2025-12-05T13:30:00",
                2800, 150, "ECONOMY", 150);

        flightRepository.saveAll(List.of(f1, f2, f3, f4, f5));
    }

    private Flight flight(String airline, String flightNumber,
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
        f.setSource("DATABASE");
        return f;
    }

    private void seedReviews() {
        if (reviewRepository.count() > 0) {
            return;
        }

        List<Hotel> hotels = hotelRepository.findAll();
        if (!hotels.isEmpty()) {
            Hotel h = hotels.get(0);

            Review r1 = new Review();
            r1.setTargetType("HOTEL");
            r1.setTargetId(h.getId());
            r1.setTargetName(h.getName());
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

            ReviewReply rep1 = new ReviewReply("admin-1", "Hotel Manager (MakeMyTour Partner)", "ADMIN",
                    "Dear Ananya, thank you so much for your kind words! We are delighted that you enjoyed the Sea Lounge and the harbor views. We hope to welcome you back very soon.");
            r1.getReplies().add(rep1);

            Review r2 = new Review();
            r2.setTargetType("HOTEL");
            r2.setTargetId(h.getId());
            r2.setTargetName(h.getName());
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

        List<Flight> flights = flightRepository.findAll();
        if (!flights.isEmpty()) {
            Flight f = flights.get(0);

            Review fr1 = new Review();
            fr1.setTargetType("FLIGHT");
            fr1.setTargetId(f.getId());
            fr1.setTargetName(f.getAirline() + " " + f.getFlightNumber());
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
}
