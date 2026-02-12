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

        // Calculate length if we have 2+ waypoints
        if (tour.Waypoints.Count >= 2)
        {
            tour.LengthKm = CalculateTourLength(tour.Waypoints);
        }

        await UpdateTourAsync(tourId, tour);
    }

    private double CalculateTourLength(List<Waypoint> waypoints)
    {
        double total = 0;
        for (int i = 0; i < waypoints.Count - 1; i++)
        {
            total += CalculateDistance(
                waypoints[i].Latitude, waypoints[i].Longitude,
                waypoints[i + 1].Latitude, waypoints[i + 1].Longitude
            );
        }
        return Math.Round(total, 1);
    }

    private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        var R = 6371.0; // Earth radius in km
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private double ToRadians(double degrees) => degrees * Math.PI / 180;

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