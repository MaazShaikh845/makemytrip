package com.makemytrip.review;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ReviewSummaryDto {

    private List<Review> reviews;
    private double averageRating;
    private int totalReviews;
    private Map<Integer, Long> ratingDistribution = new HashMap<>();
    private double recommendationRate; // e.g. 92.0%

    public ReviewSummaryDto() {}

    public ReviewSummaryDto(List<Review> reviews, double averageRating, int totalReviews, Map<Integer, Long> ratingDistribution, double recommendationRate) {
        this.reviews = reviews;
        this.averageRating = averageRating;
        this.totalReviews = totalReviews;
        this.ratingDistribution = ratingDistribution;
        this.recommendationRate = recommendationRate;
    }

    public List<Review> getReviews() {
        return reviews;
    }

    public void setReviews(List<Review> reviews) {
        this.reviews = reviews;
    }

    public double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(double averageRating) {
        this.averageRating = averageRating;
    }

    public int getTotalReviews() {
        return totalReviews;
    }

    public void setTotalReviews(int totalReviews) {
        this.totalReviews = totalReviews;
    }

    public Map<Integer, Long> getRatingDistribution() {
        return ratingDistribution;
    }

    public void setRatingDistribution(Map<Integer, Long> ratingDistribution) {
        this.ratingDistribution = ratingDistribution;
    }

    public double getRecommendationRate() {
        return recommendationRate;
    }

    public void setRecommendationRate(double recommendationRate) {
        this.recommendationRate = recommendationRate;
    }
}
