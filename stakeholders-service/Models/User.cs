using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace stakeholders_service.Models;

public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    public string Username { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public UserRole Role { get; set; }

    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? ProfileImagePath { get; set; }
    public string? Bio { get; set; }
    public string? Motto { get; set; }
}

public enum UserRole
{
    Tourist,
    Guide,
    Administrator
}