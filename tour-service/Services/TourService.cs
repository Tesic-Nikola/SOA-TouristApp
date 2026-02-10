using MongoDB.Bson;
using MongoDB.Driver;
using tour_service.Models;

namespace tour_service.Services;

public class TourService
{
    private readonly IMongoCollection<Tour> _tours;

    public TourService(IConfiguration configuration)
    {
        var client = new MongoClient(configuration["MongoDB:ConnectionString"]);
        var db = client.GetDatabase(configuration["MongoDB:DatabaseName"]);
        _tours = db.GetCollection<Tour>("tours");
    }

    public async Task<Tour> CreateTourAsync(Tour tour)
    {
        await _tours.InsertOneAsync(tour);
        return tour;
    }

    public async Task<List<Tour>> GetAllToursAsync() =>
        await _tours.Find(_ => true).ToListAsync();

    public async Task<Tour?> GetTourByIdAsync(string id) =>
        await _tours.Find(t => t.Id == id).FirstOrDefaultAsync();

    public async Task<List<Tour>> GetToursByAuthorAsync(string authorId) =>
        await _tours.Find(t => t.AuthorId == authorId).ToListAsync();

    public async Task UpdateTourAsync(string id, Tour tour)
    {
        await _tours.ReplaceOneAsync(t => t.Id == id, tour);
    }

    public async Task DeleteTourAsync(string id)
    {
        await _tours.DeleteOneAsync(t => t.Id == id);
    }

    public async Task AddWaypointAsync(string tourId, Waypoint waypoint)
    {
        var tour = await GetTourByIdAsync(tourId);
        if (tour == null) throw new Exception("Tour not found");

        waypoint.Id = ObjectId.GenerateNewId().ToString();
        tour.Waypoints.Add(waypoint);
        await UpdateTourAsync(tourId, tour);
    }

    public async Task UpdateWaypointAsync(string tourId, string waypointId, Waypoint updatedWaypoint)
    {
        var tour = await GetTourByIdAsync(tourId);
        if (tour == null) throw new Exception("Tour not found");

        var waypoint = tour.Waypoints.FirstOrDefault(w => w.Id == waypointId);
        if (waypoint == null) throw new Exception("Waypoint not found");

        waypoint.Name = updatedWaypoint.Name;
        waypoint.Description = updatedWaypoint.Description;
        waypoint.Latitude = updatedWaypoint.Latitude;
        waypoint.Longitude = updatedWaypoint.Longitude;
        waypoint.ImagePath = updatedWaypoint.ImagePath;

        await UpdateTourAsync(tourId, tour);
    }

    public async Task DeleteWaypointAsync(string tourId, string waypointId)
    {
        var tour = await GetTourByIdAsync(tourId);
        if (tour == null) throw new Exception("Tour not found");

        var waypoint = tour.Waypoints.FirstOrDefault(w => w.Id == waypointId);
        if (waypoint != null)
        {
            tour.Waypoints.Remove(waypoint);
            await UpdateTourAsync(tourId, tour);
        }
    }
}