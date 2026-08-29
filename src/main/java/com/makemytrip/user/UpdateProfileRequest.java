package com.makemytrip.user;

public record UpdateProfileRequest(
        String firstName,
        String lastName,
        String phoneNumber) {
}
