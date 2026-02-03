using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace tour_service.Models;

public class TourExecution
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    public string TouristId { get; set; } = null!;
    public string TourId { get; set; } = null!;
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? AbandonedAt { get; set; }
    public DateTime LastActivity { get; set; }

    public List<WaypointCompletion> CompletedWaypoints { get; set; } = new();
}

public class WaypointCompletion
{
    public string? WaypointId { get; set; } = null!;
    public DateTime CompletedAt { get; set; }
}