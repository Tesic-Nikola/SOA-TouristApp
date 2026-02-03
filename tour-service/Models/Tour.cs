using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace tour_service.Models;

public class Tour
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    public string AuthorId { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public TourDifficulty Difficulty { get; set; }
    public List<string> Tags { get; set; } = new();
    public List<Waypoint> Waypoints { get; set; } = new();
}

public enum TourDifficulty
{
    Easy,
    Medium,
    Hard
}