package com.makemytrip.hotel;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface HotelRepository extends MongoRepository<Hotel, String> {

    List<Hotel> findByCityIgnoreCase(String city);

    List<Hotel> findByStarRatingGreaterThanEqual(int stars);
}
