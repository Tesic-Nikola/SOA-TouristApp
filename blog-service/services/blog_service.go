package services

import (
	"blog-service/models"
	"context"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type BlogService struct {
	collection *mongo.Collection
}

func NewBlogService(db *mongo.Database) *BlogService {
	return &BlogService{
		collection: db.Collection("blogs"),
	}
}

func (s *BlogService) CreateBlog(blog *models.Blog) error {
	blog.CreatedAt = time.Now()
	_, err := s.collection.InsertOne(context.Background(), blog)
	return err
}

func (s *BlogService) GetAllBlogs() ([]models.Blog, error) {
	var blogs []models.Blog
	cursor, err := s.collection.Find(context.Background(), bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	if err = cursor.All(context.Background(), &blogs); err != nil {
		return nil, err
	}
	return blogs, nil
}

func (s *BlogService) GetBlogByID(id bson.ObjectID) (*models.Blog, error) {
	var blog models.Blog
	err := s.collection.FindOne(context.Background(), bson.M{"_id": id}).Decode(&blog)
	if err != nil {
		return nil, err
	}
	return &blog, nil
}

func (s *BlogService) GetBlogsByAuthor(authorID string) ([]models.Blog, error) {
	var blogs []models.Blog
	cursor, err := s.collection.Find(context.Background(), bson.M{"author_id": authorID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.Background())

	if err = cursor.All(context.Background(), &blogs); err != nil {
		return nil, err
	}
	return blogs, nil
}
