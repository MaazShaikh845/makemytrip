package com.makemytrip.review;

import java.time.Instant;
import java.util.UUID;

public class ReviewReply {

    private String id;
    private String userId;
    private String userName;
    private String userRole;
    private String comment;
    private String createdAt;

    public ReviewReply() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = Instant.now().toString();
    }

    public ReviewReply(String userId, String userName, String userRole, String comment) {
        this.id = UUID.randomUUID().toString();
        this.userId = userId;
        this.userName = userName;
        this.userRole = userRole != null ? userRole : "USER";
        this.comment = comment;
        this.createdAt = Instant.now().toString();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getUserRole() {
        return userRole;
    }

    public void setUserRole(String userRole) {
        this.userRole = userRole;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
