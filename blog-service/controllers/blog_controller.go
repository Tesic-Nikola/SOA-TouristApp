package controllers

import (
	"blog-service/models"
	"blog-service/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type BlogController struct {
	service *services.BlogService
}

func NewBlogController(service *services.BlogService) *BlogController {
	return &BlogController{service: service}
}

func (ctrl *BlogController) CreateBlog(c *gin.Context) {
	var blog models.Blog
	if err := c.ShouldBindJSON(&blog); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get author ID from JWT token
	userID, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in token"})
		return
	}
	blog.AuthorID = userID.(string)

	if err := ctrl.service.CreateBlog(&blog); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create blog"})
		return
	}

	c.JSON(http.StatusCreated, blog)
}

func (ctrl *BlogController) GetAllBlogs(c *gin.Context) {
	blogs, err := ctrl.service.GetAllBlogs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch blogs"})
		return
	}
	c.JSON(http.StatusOK, blogs)
}

func (ctrl *BlogController) GetBlogByID(c *gin.Context) {
	id := c.Param("id")
	objectID, err := bson.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blog ID"})
		return
	}

	blog, err := ctrl.service.GetBlogByID(objectID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Blog not found"})
		return
	}

	c.JSON(http.StatusOK, blog)
}

func (ctrl *BlogController) GetBlogsByAuthor(c *gin.Context) {
	authorID := c.Param("authorId")
	blogs, err := ctrl.service.GetBlogsByAuthor(authorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch blogs"})
		return
	}
	c.JSON(http.StatusOK, blogs)
}
