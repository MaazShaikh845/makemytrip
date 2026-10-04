package com.makemytrip.user;

import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;

/**
 * REST controller that exposes user-facing authentication and profile endpoints
 * under the {@code /user} route namespace.
 *
 * <h2>Endpoints</h2>
 * <table border="1">
 *   <tr><th>Method</th><th>Path</th><th>Action</th></tr>
 *   <tr><td>POST</td><td>/user/signup</td><td>Register a new account</td></tr>
 *   <tr><td>POST</td><td>/user/login</td><td>Authenticate with email + password</td></tr>
 *   <tr><td>GET</td><td>/user/search?email=</td><td>Look up a user by email</td></tr>
 *   <tr><td>PUT</td><td>/user/{id}</td><td>Update profile (name, phone)</td></tr>
 * </table>
 *
 * <h2>Authentication model</h2>
 * <p>This project uses a simple session-less approach: on successful login the
 * server returns the user's MongoDB ID, which the frontend stores in Redux and
 * attaches as an {@code X-User-Id} header on subsequent booking requests. No
 * JWT or OAuth tokens are required for this scope.</p>
 *
 * @author Maaz Shaikh
 * @since 2025
 */
@RestController
@RequestMapping("/user")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Constructor injection makes dependencies explicit and keeps the controller
     * easy to instantiate in unit tests without a Spring context.
     *
     * @param userRepository  MongoDB repository for {@link User} documents
     * @param passwordEncoder BCrypt encoder provided by {@link com.makemytrip.SecurityConfig}
     */
    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ─────────────────────────────────────────────
    //  Registration
    // ─────────────────────────────────────────────

    /**
     * Registers a new user account.
     *
     * <p>The request body is validated via Bean Validation before the handler
     * executes. If the email is already registered a {@code 409 Conflict} is
     * returned to avoid leaking whether an account exists via timing attacks.</p>
     *
     * @param request validated sign-up payload
     * @return {@code 201 Created} with an {@link AuthResponse} containing the new user's ID
     * @throws ResponseStatusException {@code 409} if the email is already in use
     */
    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }

        User user = buildNewUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(toAuthResponse(userRepository.save(user)));
    }

    // ─────────────────────────────────────────────
    //  Authentication
    // ─────────────────────────────────────────────

    /**
     * Authenticates a user and returns their profile.
     *
     * <p>The password comparison delegates to {@link #verifyPassword} which
     * supports both plain-text legacy passwords (for dev seeds) and BCrypt hashes.</p>
     *
     * @param request login credentials
     * @return an {@link AuthResponse} containing the authenticated user's details
     * @throws ResponseStatusException {@code 401} if credentials are invalid
     */
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .filter(existingUser -> verifyPassword(request.password(), existingUser.getPassword()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        return toAuthResponse(user);
    }

    // ─────────────────────────────────────────────
    //  Search
    // ─────────────────────────────────────────────

    /**
     * Looks up a user by their email address.
     *
     * <p>Returns a limited {@link UserSearchResponse} that omits the password
     * hash so sensitive data is never exposed over the API.</p>
     *
     * @param email the exact email address to search for
     * @return {@code 200 OK} with a {@link UserSearchResponse} if found
     * @throws ResponseStatusException {@code 404} if no user matches the email
     */
    @GetMapping("/search")
    public ResponseEntity<UserSearchResponse> searchByEmail(@RequestParam String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return ResponseEntity.ok(new UserSearchResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole() != null ? user.getRole() : "USER",
                user.getPhoneNumber()));
    }

    // ─────────────────────────────────────────────
    //  Profile update
    // ─────────────────────────────────────────────

    /**
     * Partially updates a user's profile (first name, last name, phone number).
     *
     * <p>Fields that are {@code null} in the request body are left unchanged,
     * enabling true PATCH-style semantics over a PUT endpoint.</p>
     *
     * @param id      MongoDB ID of the user to update
     * @param request fields to update; any field may be {@code null} to skip it
     * @return {@code 200 OK} with the updated {@link AuthResponse}
     * @throws ResponseStatusException {@code 404} if the user ID is not found
     */
    @PutMapping("/{id}")
    public ResponseEntity<AuthResponse> updateProfile(
            @PathVariable String id,
            @RequestBody UpdateProfileRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        applyProfileUpdates(user, request);

        User updated = userRepository.save(user);
        return ResponseEntity.ok(toAuthResponse(updated));
    }

    // ─────────────────────────────────────────────
    //  Private helpers
    // ─────────────────────────────────────────────

    /**
     * Constructs a new {@link User} entity from the sign-up request.
     * The password is BCrypt-encoded before the entity is returned.
     *
     * @param request the validated sign-up payload
     * @return a fully populated (unpersisted) {@link User}
     */
    private User buildNewUser(SignupRequest request) {
        User user = new User();
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPhoneNumber(request.phoneNumber());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(resolveRole(request.role()));
        return user;
    }

    /**
     * Resolves the role string from a sign-up request.
     * Defaults to {@code "USER"} when the provided role is null or blank.
     *
     * @param rawRole role string from the request (may be null)
     * @return upper-cased role, defaulting to {@code "USER"}
     */
    private String resolveRole(String rawRole) {
        return (rawRole != null && !rawRole.isBlank()) ? rawRole.toUpperCase() : "USER";
    }

    /**
     * Applies non-null fields from the update request to the user entity.
     * {@code firstName} additionally requires a non-blank value to update.
     *
     * @param user    the entity to mutate
     * @param request the update payload
     */
    private void applyProfileUpdates(User user, UpdateProfileRequest request) {
        if (request.firstName() != null && !request.firstName().isBlank()) {
            user.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            user.setLastName(request.lastName());
        }
        if (request.phoneNumber() != null) {
            user.setPhoneNumber(request.phoneNumber());
        }
    }

    /**
     * Verifies that a raw password matches the stored credential.
     *
     * <p>Supports both plain-text passwords (used by seeded admin accounts) and
     * BCrypt hashes to maintain backward compatibility with legacy records.</p>
     *
     * @param rawPassword    the plain-text password from the login request
     * @param storedPassword the value stored in the database (may be hashed or plain)
     * @return {@code true} if the passwords match, {@code false} otherwise
     */
    private boolean verifyPassword(String rawPassword, String storedPassword) {
        if (storedPassword == null) return false;
        // Check for plain-text match first (dev seeds / admin users)
        if (rawPassword.equals(storedPassword)) return true;
        try {
            return passwordEncoder.matches(rawPassword, storedPassword);
        } catch (Exception ignored) {
            // If the stored value is not a valid BCrypt hash, fall through to false
            return false;
        }
    }

    /**
     * Converts a persisted {@link User} to the lightweight {@link AuthResponse}
     * DTO returned by login and sign-up endpoints.
     *
     * <p>A random session token UUID is generated here. In a production system
     * this would be a signed JWT; for this project it simply gives the frontend
     * a non-deterministic string to store alongside the user ID.</p>
     *
     * @param user the user entity to project
     * @return a populated {@link AuthResponse}
     */
    private AuthResponse toAuthResponse(User user) {
        return new AuthResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getRole() != null ? user.getRole() : "USER",
                UUID.randomUUID().toString());
    }
}
