package com.makemytrip.review;

import com.makemytrip.user.User;
import com.makemytrip.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.*;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;

    public ReviewService(ReviewRepository reviewRepository, UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
    }

    public ReviewSummaryDto getReviewsForTarget(String targetType, String targetId) {
        List<Review> reviews = reviewRepository.findByTargetTypeIgnoreCaseAndTargetId(targetType, targetId);

        // Sort default: newest first
        reviews.sort((a, b) -> {
            String timeA = a.getCreatedAt() != null ? a.getCreatedAt() : "";
            String timeB = b.getCreatedAt() != null ? b.getCreatedAt() : "";
            return timeB.compareTo(timeA);
        });

        int total = reviews.size();
        Map<Integer, Long> distribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            distribution.put(i, 0L);
        }

        if (total == 0) {
            return new ReviewSummaryDto(reviews, 0.0, 0, distribution, 0.0);
        }

        double sum = 0.0;
        int recommendedCount = 0;
        for (Review r : reviews) {
            int rating = Math.max(1, Math.min(5, r.getRating()));
            sum += rating;
            distribution.put(rating, distribution.getOrDefault(rating, 0L) + 1);
            if (rating >= 4) {
                recommendedCount++;
            }
        }

        double avg = Math.round((sum / total) * 10.0) / 10.0;
        double recRate = Math.round(((double) recommendedCount / total * 100.0) * 10.0) / 10.0;

        return new ReviewSummaryDto(reviews, avg, total, distribution, recRate);
    }

    public Review createReview(String userId, CreateReviewRequest request) {
        User user = resolveUser(userId);

        Review review = new Review();
        review.setTargetType(request.targetType());
        review.setTargetId(request.targetId());
        review.setTargetName(request.targetName());
        review.setUserId(user.getId());

        String fullName = ((user.getFirstName() != null ? user.getFirstName() : "") + " "
                + (user.getLastName() != null ? user.getLastName() : "")).trim();
        review.setUserName(!fullName.isBlank() ? fullName : "Verified Traveler");
        review.setUserEmail(user.getEmail());

        review.setRating(Math.max(1, Math.min(5, request.rating())));
        review.setTitle(request.title());
        review.setComment(request.comment());
        if (request.photos() != null) {
            review.setPhotos(request.photos());
        }

        return reviewRepository.save(review);
    }

    public Review addReply(String reviewId, String userId, String comment) {
        if (comment == null || comment.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reply comment cannot be empty");
        }

        User user = resolveUser(userId);
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        String fullName = ((user.getFirstName() != null ? user.getFirstName() : "") + " "
                + (user.getLastName() != null ? user.getLastName() : "")).trim();
        String authorName = !fullName.isBlank() ? fullName : "Traveler";

        ReviewReply reply = new ReviewReply(user.getId(), authorName, user.getRole(), comment.trim());
        review.getReplies().add(reply);
        review.setUpdatedAt(Instant.now().toString());

        return reviewRepository.save(review);
    }

    public Review toggleHelpful(String reviewId, String userId) {
        resolveUser(userId);
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        Set<String> helpful = review.getHelpfulUserIds();
        if (helpful.contains(userId)) {
            helpful.remove(userId);
        } else {
            helpful.add(userId);
        }
        review.setHelpfulUserIds(helpful);

        return reviewRepository.save(review);
    }

    public Review flagReview(String reviewId, String userId, String reason) {
        resolveUser(userId);
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        Set<String> flaggedBy = review.getFlaggedBy();
        flaggedBy.add(userId);
        review.setFlaggedBy(flaggedBy);
        review.setFlagged(true);
        if (reason != null && !reason.isBlank()) {
            review.setFlagReason(reason.trim());
        } else if (review.getFlagReason() == null) {
            review.setFlagReason("Inappropriate or abusive content");
        }

        return reviewRepository.save(review);
    }

    public List<Review> getFlaggedReviews() {
        return reviewRepository.findByIsFlaggedTrue();
    }

    public Review unflagReview(String reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        review.setFlagged(false);
        review.setFlagReason(null);
        review.getFlaggedBy().clear();
        review.setFlagCount(0);

        return reviewRepository.save(review);
    }

    public Review updateReview(String reviewId, String userId, UpdateReviewRequest request) {
        User user = resolveUser(userId);
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        boolean isAdmin = "ADMIN".equalsIgnoreCase(user.getRole());
        boolean isAuthor = userId.equals(review.getUserId());

        if (!isAdmin && !isAuthor) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Permission denied to edit this review");
        }

        if (request.rating() != null) {
            review.setRating(Math.max(1, Math.min(5, request.rating())));
        }
        if (request.title() != null) {
            review.setTitle(request.title());
        }
        if (request.comment() != null && !request.comment().isBlank()) {
            review.setComment(request.comment().trim());
        }
        if (request.photos() != null) {
            review.setPhotos(request.photos());
        }

        review.setUpdatedAt(Instant.now().toString());
        return reviewRepository.save(review);
    }

    public void deleteReview(String reviewId, String userId) {
        User user = resolveUser(userId);
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        boolean isAdmin = "ADMIN".equalsIgnoreCase(user.getRole());
        boolean isAuthor = userId.equals(review.getUserId());

        if (!isAdmin && !isAuthor) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Permission denied to delete this review");
        }

        reviewRepository.deleteById(reviewId);
    }

    public Review deleteReply(String reviewId, String replyId, String userId) {
        User user = resolveUser(userId);
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        boolean isAdmin = "ADMIN".equalsIgnoreCase(user.getRole());

        ReviewReply targetReply = review.getReplies().stream()
                .filter(r -> replyId.equals(r.getId()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reply not found"));

        boolean isAuthor = userId.equals(targetReply.getUserId());

        if (!isAdmin && !isAuthor) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Permission denied to delete this reply");
        }

        review.getReplies().removeIf(r -> replyId.equals(r.getId()));
        review.setUpdatedAt(Instant.now().toString());

        return reviewRepository.save(review);
    }

    public User resolveUser(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User account not found"));
    }
}
