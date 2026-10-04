package com.makemytrip.user;

import com.makemytrip.booking.BookingRecord;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.TypeAlias;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

/**
 * Domain entity representing a registered platform user.
 *
 * <p>Users are stored in the {@code users} MongoDB collection. Each document
 * contains the user's profile information, a hashed password, a role designator,
 * and an embedded list of their booking records.</p>
 *
 * <h2>Embedded bookings</h2>
 * <p>Bookings are stored both in the dedicated {@code bookings} collection
 * (as {@link BookingRecord} documents) and embedded here for fast single-query
 * profile reads. Mutations to a booking (e.g. cancellation) must update both
 * locations to keep the data consistent.</p>
 *
 * <h2>Roles</h2>
 * <ul>
 *   <li>{@code "USER"} — standard traveller account; can browse, book, and cancel.</li>
 *   <li>{@code "ADMIN"} — platform manager; can add, edit, and remove flights and hotels.</li>
 * </ul>
 *
 * @author Maaz Shaikh
 * @since 2025
 */
@Document("users")
@TypeAlias("com.makemytrip.makemytrip.models.Users")
public class User {

    /** MongoDB-generated document identifier. */
    @Id
    private String id;

    /** Given (first) name of the user. */
    private String firstName;

    /** Family (last) name of the user. */
    private String lastName;

    /** Mobile phone number — optional; used as a contact reference on booking records. */
    private String phoneNumber;

    /** Email address — serves as the unique login identifier. */
    private String email;

    /**
     * BCrypt-hashed password.
     * The plain-text password is never stored; this field holds the hash produced
     * by {@link org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder}.
     */
    private String password;

    /**
     * Role assigned to this account.
     * Allowed values: {@code "USER"} (default) or {@code "ADMIN"}.
     */
    private String role;

    /**
     * Embedded list of bookings made by this user.
     * Initialised to an empty list to avoid null-checks in service code.
     */
    private List<BookingRecord> bookings = new ArrayList<>();

    /** Default no-argument constructor required by Spring Data MongoDB. */
    public User() {
    }

    // ─── Accessors ──────────────────────────────────────────────────────────

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    /**
     * Returns the user's embedded bookings list, lazily initialising it if
     * the field was somehow stored as {@code null} in MongoDB.
     *
     * @return a non-null list of {@link BookingRecord} objects
     */
    public List<BookingRecord> getBookings() {
        if (bookings == null) {
            bookings = new ArrayList<>();
        }
        return bookings;
    }

    public void setBookings(List<BookingRecord> bookings) {
        this.bookings = bookings;
    }
}
