package com.makemytrip.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record SignupRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank String phoneNumber,
        @Email @NotBlank String email,
        @NotBlank String password,
        String role) {   // optional – defaults to "USER" in the controller
}
