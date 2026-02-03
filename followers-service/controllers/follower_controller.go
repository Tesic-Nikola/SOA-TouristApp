package controllers

import (
	"followers-service/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type FollowerController struct {
	service *services.FollowerService
}

func NewFollowerController(service *services.FollowerService) *FollowerController {
	return &FollowerController{service: service}
}

func (ctrl *FollowerController) FollowUser(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in token"})
		return
	}

	followedID := c.Param("userId")
	if followedID == userID.(string) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot follow yourself"})
		return
	}

	if err := ctrl.service.FollowUser(userID.(string), followedID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to follow user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User followed successfully"})
}

func (ctrl *FollowerController) UnfollowUser(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in token"})
		return
	}

	followedID := c.Param("userId")
	if err := ctrl.service.UnfollowUser(userID.(string), followedID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unfollow user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User unfollowed successfully"})
}

func (ctrl *FollowerController) GetFollowers(c *gin.Context) {
	userID := c.Param("userId")
	followers, err := ctrl.service.GetFollowers(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get followers"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"followers": followers})
}

func (ctrl *FollowerController) GetFollowing(c *gin.Context) {
	userID := c.Param("userId")
	following, err := ctrl.service.GetFollowing(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get following"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"following": following})
}

func (ctrl *FollowerController) GetRecommendations(c *gin.Context) {
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in token"})
		return
	}

	recommendations, err := ctrl.service.GetRecommendations(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get recommendations"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"recommendations": recommendations})
}
