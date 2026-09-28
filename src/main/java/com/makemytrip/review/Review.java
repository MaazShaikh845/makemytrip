package com.makemytrip.review;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Document("reviews")
public class Review {

    @Id
    private String id;

    private String targetType; // "HOTEL" or "FLIGHT"
    private String targetId;
    private String targetName; // e.g. Hotel Name or Airline + Flight Number

    private String userId;
    private String userName;
    private String userEmail;

    private int rating; // 1 - 5
    private String title;
    private String comment;

    private List<String> photos = new ArrayList<>();
    private Set<String> helpfulUserIds = new HashSet<>();
    private int helpfulCount = 0;

    private boolean isFlagged = false;
    private String flagReason;
    private Set<String> flaggedBy = new HashSet<>();
    private int flagCount = 0;

    private List<ReviewReply> replies = new ArrayList<>();

    private String createdAt;
    private String updatedAt;

    public Review() {
        this.createdAt = Instant.now().toString();
        this.updatedAt = this.createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTargetType() {
        return targetType;
    }

    public void setTargetType(String targetType) {
        this.targetType = targetType != null ? targetType.toUpperCase() : null;
    }

    public String getTargetId() {
        return targetId;
    }

    public void setTargetId(String targetId) {
        this.targetId = targetId;
    }

    public String getTargetName() {
        return targetName;
    }

    public void setTargetName(String targetName) {
        this.targetName = targetName;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public List<String> getPhotos() {
        if (photos == null) {
            photos = new ArrayList<>();
        }
        return photos;
    }

    public void setPhotos(List<String> photos) {
        this.photos = photos != null ? photos : new ArrayList<>();
    }

    public Set<String> getHelpfulUserIds() {
        if (helpfulUserIds == null) {
            helpfulUserIds = new HashSet<>();
        }
        return helpfulUserIds;
    }

    public void setHelpfulUserIds(Set<String> helpfulUserIds) {
        this.helpfulUserIds = helpfulUserIds != null ? helpfulUserIds : new HashSet<>();
        this.helpfulCount = this.helpfulUserIds.size();
    }

    public int getHelpfulCount() {
        return helpfulCount;
    }

    public void setHelpfulCount(int helpfulCount) {
        this.helpfulCount = helpfulCount;
    }

    public boolean isFlagged() {
        return isFlagged;
    }

    public void setFlagged(boolean flagged) {
        isFlagged = flagged;
    }

    public String getFlagReason() {
        return flagReason;
    }

    public void setFlagReason(String flagReason) {
        this.flagReason = flagReason;
    }

    public Set<String> getFlaggedBy() {
        if (flaggedBy == null) {
            flaggedBy = new HashSet<>();
        }
        return flaggedBy;
    }

    public void setFlaggedBy(Set<String> flaggedBy) {
        this.flaggedBy = flaggedBy != null ? flaggedBy : new HashSet<>();
        this.flagCount = this.flaggedBy.size();
    }

    public int getFlagCount() {
        return flagCount;
    }

    public void setFlagCount(int flagCount) {
        this.flagCount = flagCount;
    }

    public List<ReviewReply> getReplies() {
        if (replies == null) {
            replies = new ArrayList<>();
        }
        return replies;
    }

    public void setReplies(List<ReviewReply> replies) {
        this.replies = replies != null ? replies : new ArrayList<>();
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}
