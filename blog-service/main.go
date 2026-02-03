package main

import (
	"blog-service/controllers"
	"blog-service/middleware"
	"blog-service/services"
	"context"
	"log"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func main() {
	client, err := mongo.Connect(options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(context.Background())

	db := client.Database("blog_db")
	blogService := services.NewBlogService(db)
	blogController := controllers.NewBlogController(blogService)

	router := gin.Default()

	// CORS
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:4200")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	api := router.Group("/api/blogs")
	{
		api.POST("", middleware.AuthMiddleware(), blogController.CreateBlog)
		api.GET("", blogController.GetAllBlogs)
		api.GET("/:id", blogController.GetBlogByID)
		api.GET("/author/:authorId", blogController.GetBlogsByAuthor)
	}

	log.Println("Blog service running on :8082")
	router.Run(":8082")
}
