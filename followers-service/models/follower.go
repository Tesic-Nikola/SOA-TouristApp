package models

type UserRecommendation struct {
	UserID string `json:"userId"`
	Score  int    `json:"score"` // How many mutual connections
}
