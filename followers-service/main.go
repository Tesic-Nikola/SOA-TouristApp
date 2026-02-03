package main

import (
	"context"
	"followers-service/controllers"
	"followers-service/middleware"
	"followers-service/services"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

func main() {
	// Connect to Neo4j
	driver, err := neo4j.NewDriverWithContext(
		"bolt://localhost:7687",
		neo4j.BasicAuth("neo4j", "password", ""),
	)
	if err != nil {
		log.Fatal(err)
	}
	defer driver.Close(context.Background())

	followerService := services.NewFollowerService(driver)
	followerController := controllers.NewFollowerController(followerService)

	// Setup Gin router
	router := gin.Default()

	// CORS
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:4200")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Routes
	api := router.Group("/api/followers")
	api.Use(middleware.AuthMiddleware())
	{
		api.POST("/follow/:userId", followerController.FollowUser)
		api.DELETE("/unfollow/:userId", followerController.UnfollowUser)
		api.GET("/followers/:userId", followerController.GetFollowers)
		api.GET("/following/:userId", followerController.GetFollowing)
		api.GET("/recommendations", followerController.GetRecommendations)
	}

	log.Println("Followers service running on :8083")
	router.Run(":8083")
}
