package com.makemytrip.review;

import com.makemytrip.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reviews")
@CrossOrigin(origins = "http://localhost:3000")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public ReviewSummaryDto getReviews(
            @RequestParam String targetType,
            @RequestParam String targetId) {
        return reviewService.getReviewsForTarget(targetType, targetId);
    }

    @PostMapping
    public ResponseEntity<Review> createReview(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @Valid @RequestBody CreateReviewRequest request) {
        Review review = reviewService.createReview(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(review);
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<Review> addReply(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String comment = body != null ? body.get("comment") : null;
        Review updated = reviewService.addReply(id, userId, comment);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/helpful")
    public ResponseEntity<Review> toggleHelpful(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id) {
        Review updated = reviewService.toggleHelpful(id, userId);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/flag")
    public ResponseEntity<Review> flagReview(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : "Inappropriate content";
        Review updated = reviewService.flagReview(id, userId, reason);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/flagged")
    public List<Review> getFlaggedReviews(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        requireAdmin(userId);
        return reviewService.getFlaggedReviews();
    }

    @PutMapping("/{id}/unflag")
    public ResponseEntity<Review> unflagReview(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id) {
        requireAdmin(userId);
        Review review = reviewService.unflagReview(id);
        return ResponseEntity.ok(review);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Review> updateReview(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id,
            @Valid @RequestBody UpdateReviewRequest request) {
        Review updated = reviewService.updateReview(id, userId, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id) {
        reviewService.deleteReview(id, userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/reply/{replyId}")
    public ResponseEntity<Review> deleteReply(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable String id,
            @PathVariable String replyId) {
        Review updated = reviewService.deleteReply(id, replyId, userId);
        return ResponseEntity.ok(updated);
    }

    private void requireAdmin(String userId) {
        User user = reviewService.resolveUser(userId);
        if (!"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Administrative privileges required");
        }
    }
}
