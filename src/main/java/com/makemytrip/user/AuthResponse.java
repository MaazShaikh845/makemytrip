package com.makemytrip.user;

public record AuthResponse(
        String id,
        String firstName,
        String lastName,
        String email,
        String phoneNumber,
        String role,
        String token) {
}
