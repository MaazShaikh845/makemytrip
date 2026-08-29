package com.makemytrip.hotel;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.makemytrip.user.User;
import com.makemytrip.user.UserRepository;

@RestController
@RequestMapping("/hotels")
@CrossOrigin(origins = "http://localhost:3000")
public class HotelController {

    private final HotelRepository hotelRepository;
    private final UserRepository userRepository;

    public HotelController(HotelRepository hotelRepository, UserRepository userRepository) {
        this.hotelRepository = hotelRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Hotel> getAllHotels() {
        return hotelRepository.findAll();
    }

    @GetMapping("/{id}")
    public Hotel getHotelById(@PathVariable String id) {
        return hotelRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel not found"));
    }

    @GetMapping("/search")
    public List<Hotel> searchByCity(@RequestParam String city) {
        return hotelRepository.findByCityIgnoreCase(city);
    }

    @PostMapping
    public ResponseEntity<Hotel> createHotel(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody Hotel hotel) {

        requireAdmin(userId);
        Hotel saved = hotelRepository.save(hotel);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public Hotel updateHotel(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id,
            @RequestBody Hotel updated) {

        requireAdmin(userId);
        Hotel existing = hotelRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel not found"));

        existing.setName(updated.getName());
        existing.setCity(updated.getCity());
        existing.setAddress(updated.getAddress());
        existing.setImageUrl(updated.getImageUrl());
        existing.setPricePerNight(updated.getPricePerNight());
        existing.setStarRating(updated.getStarRating());
        existing.setDescription(updated.getDescription());
        existing.setAvailableRooms(updated.getAvailableRooms());
        existing.setAmenities(updated.getAmenities());

        return hotelRepository.save(existing);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHotel(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id) {

        requireAdmin(userId);
        if (!hotelRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Hotel not found");
        }
        hotelRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void requireAdmin(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing credentials");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Administrative privileges required");
        }
    }
}
