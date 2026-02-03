using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace tour_service.Models;

public class Purchase
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    public string TouristId { get; set; } = null!;
    public string TourId { get; set; } = null!;
    public string Token { get; set; } = null!; // Purchase token for verification
    public DateTime PurchasedAt { get; set; }
}

public class ShoppingCart
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    public string TouristId { get; set; } = null!;
    public List<string> TourIds { get; set; } = new();
}