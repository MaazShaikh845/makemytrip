package com.makemytrip;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * MakeMy Tour – Travel Booking Platform
 *
 * <p>Entry point for the Spring Boot backend application. This class bootstraps
 * the entire application context, including auto-configuration of MongoDB, Spring
 * Security, and all REST controllers exposed under the {@code /user}, {@code /flights},
 * {@code /hotels}, and {@code /bookings} route namespaces.</p>
 *
 * <p>On first startup, {@link DataSeeder} automatically populates the MongoDB
 * collections with sample flights, hotels, and reviews so the platform is
 * immediately usable without manual data entry.</p>
 *
 * @author Maaz Shaikh
 * @version 1.0.0
 * @since 2025
 */
@SpringBootApplication
public class MakemytripApplication {

    /**
     * Application entry point.
     *
     * @param args command-line arguments passed to {@link SpringApplication#run}
     */
    public static void main(String[] args) {
        SpringApplication.run(MakemytripApplication.class, args);
    }
}
