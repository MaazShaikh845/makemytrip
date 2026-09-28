package com.makemytrip.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateReviewRequest(
        @NotBlank(message = "Target type is required")
        String targetType,

        @NotBlank(message = "Target ID is required")
        String targetId,

        String targetName,

        @NotNull(message = "Rating is required")
        @Min(value = 1, message = "Rating must be at least 1")
        @Max(value = 5, message = "Rating must be at most 5")
        Integer rating,

        String title,

        @NotBlank(message = "Review comment is required")
        String comment,

        List<String> photos
) {}
