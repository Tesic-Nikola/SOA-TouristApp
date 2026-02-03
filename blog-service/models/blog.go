package models

import (
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type Blog struct {
	ID          bson.ObjectID `bson:"_id,omitempty" json:"id"`
	AuthorID    string        `bson:"author_id" json:"authorId"`
	Title       string        `bson:"title" json:"title"`
	Description string        `bson:"description" json:"description"`
	CreatedAt   time.Time     `bson:"created_at" json:"createdAt"`
	Images      []string      `bson:"images,omitempty" json:"images,omitempty"` // Array of image paths/URLs
}
