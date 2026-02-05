package services

import (
	"context"
	"followers-service/models"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
)

type FollowerService struct {
	driver neo4j.DriverWithContext
}

func NewFollowerService(driver neo4j.DriverWithContext) *FollowerService {
	return &FollowerService{driver: driver}
}

func (s *FollowerService) FollowUser(followerID, followedID string) error {
	ctx := context.Background()
	session := s.driver.NewSession(ctx, neo4j.SessionConfig{})
	defer session.Close(ctx)

	_, err := session.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		// Check if relationship already exists
		checkQuery := `
			MATCH (follower:User {id: $followerId})-[r:FOLLOWS]->(followed:User {id: $followedId})
			RETURN r
		`
		result, err := tx.Run(ctx, checkQuery, map[string]interface{}{
			"followerId": followerID,
			"followedId": followedID,
		})
		if err != nil {
			return nil, err
		}

		if result.Next(ctx) {
			return nil, nil // Already following, do nothing
		}

		// Create relationship
		query := `
			MERGE (follower:User {id: $followerId})
			MERGE (followed:User {id: $followedId})
			MERGE (follower)-[r:FOLLOWS]->(followed)
			ON CREATE SET r.createdAt = datetime()
			RETURN r
		`
		_, err = tx.Run(ctx, query, map[string]interface{}{
			"followerId": followerID,
			"followedId": followedID,
		})
		return nil, err
	})

	return err
}

func (s *FollowerService) UnfollowUser(followerID, followedID string) error {
	ctx := context.Background()
	session := s.driver.NewSession(ctx, neo4j.SessionConfig{})
	defer session.Close(ctx)

	_, err := session.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		query := `
			MATCH (follower:User {id: $followerId})-[r:FOLLOWS]->(followed:User {id: $followedId})
			DELETE r
		`
		_, err := tx.Run(ctx, query, map[string]interface{}{
			"followerId": followerID,
			"followedId": followedID,
		})
		return nil, err
	})

	return err
}

func (s *FollowerService) GetFollowers(userID string) ([]string, error) {
	ctx := context.Background()
	session := s.driver.NewSession(ctx, neo4j.SessionConfig{})
	defer session.Close(ctx)

	result, err := session.ExecuteRead(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		query := `
			MATCH (follower:User)-[:FOLLOWS]->(user:User {id: $userId})
			RETURN follower.id as followerId
		`
		res, err := tx.Run(ctx, query, map[string]interface{}{"userId": userID})
		if err != nil {
			return nil, err
		}

		var followers []string
		for res.Next(ctx) {
			record := res.Record()
			if followerID, ok := record.Get("followerId"); ok {
				followers = append(followers, followerID.(string))
			}
		}
		return followers, res.Err()
	})

	if err != nil {
		return nil, err
	}
	return result.([]string), nil
}

func (s *FollowerService) GetFollowing(userID string) ([]string, error) {
	ctx := context.Background()
	session := s.driver.NewSession(ctx, neo4j.SessionConfig{})
	defer session.Close(ctx)

	result, err := session.ExecuteRead(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		query := `
			MATCH (user:User {id: $userId})-[:FOLLOWS]->(followed:User)
			RETURN followed.id as followedId
		`
		res, err := tx.Run(ctx, query, map[string]interface{}{"userId": userID})
		if err != nil {
			return nil, err
		}

		var following []string
		for res.Next(ctx) {
			record := res.Record()
			if followedID, ok := record.Get("followedId"); ok {
				following = append(following, followedID.(string))
			}
		}
		return following, res.Err()
	})

	if err != nil {
		return nil, err
	}
	return result.([]string), nil
}

func (s *FollowerService) GetRecommendations(userID string) ([]models.UserRecommendation, error) {
	ctx := context.Background()
	session := s.driver.NewSession(ctx, neo4j.SessionConfig{})
	defer session.Close(ctx)

	result, err := session.ExecuteRead(ctx, func(tx neo4j.ManagedTransaction) (interface{}, error) {
		query := `
			MATCH (user:User {id: $userId})-[:FOLLOWS]->(friend:User)-[:FOLLOWS]->(recommendation:User)
			WHERE user <> recommendation AND NOT (user)-[:FOLLOWS]->(recommendation)
			RETURN recommendation.id as userId, count(*) as score
			ORDER BY score DESC
			LIMIT 10
		`
		res, err := tx.Run(ctx, query, map[string]interface{}{"userId": userID})
		if err != nil {
			return nil, err
		}

		var recommendations []models.UserRecommendation
		for res.Next(ctx) {
			record := res.Record()
			userID, _ := record.Get("userId")
			score, _ := record.Get("score")
			recommendations = append(recommendations, models.UserRecommendation{
				UserID: userID.(string),
				Score:  int(score.(int64)),
			})
		}
		return recommendations, res.Err()
	})

	if err != nil {
		return nil, err
	}
	return result.([]models.UserRecommendation), nil
}
