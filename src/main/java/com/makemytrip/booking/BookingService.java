package com.makemytrip.booking;

import com.makemytrip.flight.Flight;
import com.makemytrip.flight.FlightRepository;
import com.makemytrip.hotel.Hotel;
import com.makemytrip.hotel.HotelRepository;
import com.makemytrip.user.User;
import com.makemytrip.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private HotelRepository hotelRepository;

    public BookingRecord bookFlight(String userId, String flightId, int seats) {
        if (seats <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Seats must be greater than 0");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flight not found"));

        if (flight.getAvailableSeats() < seats) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not enough seats available");
        }

        flight.setAvailableSeats(flight.getAvailableSeats() - seats);
        flightRepository.save(flight);

        BookingRecord record = new BookingRecord();
        record.setUserId(userId);
        record.setType("FLIGHT");
        record.setResourceId(flightId);
        record.setResourceName(flight.getAirline() + " (" + (flight.getFlightNumber() != null ? flight.getFlightNumber() : "") + ")");
        record.setResourceDetails(flight.getOrigin() + " → " + flight.getDestination() + " | Departure: " + flight.getDepartureTime() + " | Class: " + flight.getClassType());
        record.setQuantity(seats);
        record.setTotalPrice(flight.getPrice() * seats);
        record.setGuestName(((user.getFirstName() != null ? user.getFirstName() : "") + " " + (user.getLastName() != null ? user.getLastName() : "")).trim());
        record.setGuestEmail(user.getEmail());
        record.setGuestPhone(user.getPhoneNumber());
        record.setBookedAt(LocalDateTime.now());
        record.setStatus("CONFIRMED");

        BookingRecord saved = bookingRepository.save(record);

        if (user.getBookings() == null) {
            user.setBookings(new ArrayList<>());
        }
        user.getBookings().add(saved);
        userRepository.save(user);

        return saved;
    }

    public BookingRecord bookHotel(String userId, String hotelId, int rooms, int nights) {
        if (rooms <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rooms must be greater than 0");
        }
        if (nights <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nights must be greater than 0");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel not found"));

        if (hotel.getAvailableRooms() < rooms) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not enough rooms available");
        }

        hotel.setAvailableRooms(hotel.getAvailableRooms() - rooms);
        hotelRepository.save(hotel);

        BookingRecord record = new BookingRecord();
        record.setUserId(userId);
        record.setType("HOTEL");
        record.setResourceId(hotelId);
        record.setResourceName(hotel.getName());
        record.setResourceDetails(hotel.getCity() + " | " + (hotel.getAddress() != null ? hotel.getAddress() : "") + " | " + rooms + " Room(s), " + nights + " Night(s)");
        record.setQuantity(rooms);
        record.setTotalPrice(hotel.getPricePerNight() * rooms * nights);
        record.setGuestName(((user.getFirstName() != null ? user.getFirstName() : "") + " " + (user.getLastName() != null ? user.getLastName() : "")).trim());
        record.setGuestEmail(user.getEmail());
        record.setGuestPhone(user.getPhoneNumber());
        record.setBookedAt(LocalDateTime.now());
        record.setStatus("CONFIRMED");

        BookingRecord saved = bookingRepository.save(record);

        if (user.getBookings() == null) {
            user.setBookings(new ArrayList<>());
        }
        user.getBookings().add(saved);
        userRepository.save(user);

        return saved;
    }

    public List<BookingRecord> getBookingsByUser(String userId) {
        return bookingRepository.findByUserId(userId);
    }

    public BookingRecord getBookingById(String id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
    }

    public BookingRecord cancelBooking(String id, String userId) {
        BookingRecord booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        if (!booking.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to cancel this booking");
        }

        if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) {
            return booking;
        }

        if ("FLIGHT".equalsIgnoreCase(booking.getType())) {
            flightRepository.findById(booking.getResourceId()).ifPresent(flight -> {
                flight.setAvailableSeats(flight.getAvailableSeats() + booking.getQuantity());
                flightRepository.save(flight);
            });
        } else if ("HOTEL".equalsIgnoreCase(booking.getType())) {
            hotelRepository.findById(booking.getResourceId()).ifPresent(hotel -> {
                hotel.setAvailableRooms(hotel.getAvailableRooms() + booking.getQuantity());
                hotelRepository.save(hotel);
            });
        }

        booking.setStatus("CANCELLED");
        BookingRecord updated = bookingRepository.save(booking);

        userRepository.findById(userId).ifPresent(user -> {
            if (user.getBookings() != null) {
                for (int i = 0; i < user.getBookings().size(); i++) {
                    if (id.equals(user.getBookings().get(i).getId())) {
                        user.getBookings().set(i, updated);
                        break;
                    }
                }
                userRepository.save(user);
            }
        });

        return updated;
    }
}
