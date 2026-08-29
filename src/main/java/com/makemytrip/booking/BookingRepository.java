package com.makemytrip.booking;

import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface BookingRepository extends MongoRepository<BookingRecord, String> {
    List<BookingRecord> findByUserId(String userId);
    List<BookingRecord> findByResourceId(String resourceId);
    List<BookingRecord> findByUserIdAndType(String userId, String type);
}
