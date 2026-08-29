package com.makemytrip;

import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import com.makemytrip.flight.Flight;
import com.makemytrip.flight.FlightRepository;
import com.makemytrip.hotel.Hotel;
import com.makemytrip.hotel.HotelRepository;

@Component
public class DataSeeder implements CommandLineRunner {

    private final HotelRepository hotelRepository;
    private final FlightRepository flightRepository;

    public DataSeeder(HotelRepository hotelRepository, FlightRepository flightRepository) {
        this.hotelRepository = hotelRepository;
        this.flightRepository = flightRepository;
    }

    @Override
    public void run(String... args) {
        seedHotels();
        seedFlights();
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

        Flight f1 = flight("IndiGo", "6E-101", "DEL", "BOM",
                "2025-12-01T06:00:00", "2025-12-01T08:10:00",
                3499, 120, "ECONOMY", 130);

        Flight f2 = flight("Air India", "AI-202", "BOM", "DEL",
                "2025-12-02T14:00:00", "2025-12-02T16:15:00",
                4200, 200, "BUSINESS", 135);

        Flight f3 = flight("SpiceJet", "SG-303", "BLR", "HYD",
                "2025-12-03T09:30:00", "2025-12-03T10:45:00",
                1999, 180, "ECONOMY", 75);

        Flight f4 = flight("Vistara", "UK-404", "DEL", "BLR",
                "2025-12-04T07:00:00", "2025-12-04T09:40:00",
                5500, 80, "BUSINESS", 160);

        Flight f5 = flight("GoAir", "G8-505", "MAA", "CCU",
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
        return f;
    }
}
