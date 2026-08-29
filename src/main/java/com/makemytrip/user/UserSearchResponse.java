package com.makemytrip.user;

/**
 * DTO returned by GET /user/search?email=…
 * Does NOT include password or token.
 */
public record UserSearchResponse(
        String id,
        String firstName,
        String lastName,
        String email,
        String role,
        String phoneNumber) {
}
