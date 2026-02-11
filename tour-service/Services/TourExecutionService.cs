using MongoDB.Driver;
using tour_service.Models;

namespace tour_service.Services;

public class TourExecutionService
{
    private readonly IMongoCollection<TourExecution> _executions;
    private readonly PurchaseService _purchaseService;
    private readonly TourService _tourService;
    private readonly PositionService _positionService;

    public TourExecutionService(IConfiguration configuration, PurchaseService purchaseService,
        TourService tourService, PositionService positionService)
    {
        var client = new MongoClient(configuration["MongoDB:ConnectionString"]);
        var db = client.GetDatabase(configuration["MongoDB:DatabaseName"]);
        _executions = db.GetCollection<TourExecution>("tour_executions");
        _purchaseService = purchaseService;
        _tourService = tourService;
        _positionService = positionService;
    }
    public async Task<TourExecution> StartTourAsync(string touristId, string tourId)
    {
        // Check if purchased
        var hasPurchased = await _purchaseService.HasPurchasedAsync(touristId, tourId);
        if (!hasPurchased)
            throw new Exception("Tour must be purchased before starting");

        // Check if already has active session
        var activeSession = await _executions.Find(e =>
            e.TouristId == touristId &&
            e.TourId == tourId &&
            e.CompletedAt == null &&
            e.AbandonedAt == null).FirstOrDefaultAsync();

        if (activeSession != null)
            throw new Exception("Already have an active session for this tour");

        var execution = new TourExecution
        {
            TouristId = touristId,
            TourId = tourId,
            StartedAt = DateTime.UtcNow,
            LastActivity = DateTime.UtcNow
        };

        await _executions.InsertOneAsync(execution);
        return execution;
    }
    public async Task<TourExecution?> CheckProgressAsync(string executionId)
    {
        var execution = await _executions.Find(e => e.Id == executionId).FirstOrDefaultAsync();
        if (execution == null || execution.CompletedAt != null || execution.AbandonedAt != null)
            return execution;

        var tour = await _tourService.GetTourByIdAsync(execution.TourId);
        if (tour == null) return execution;

        var position = await _positionService.GetPositionAsync(execution.TouristId);
        if (position == null) return execution;

        // Check waypoints IN ORDER
        for (int i = 0; i < tour.Waypoints.Count; i++)
        {
            var waypoint = tour.Waypoints[i];

            if (execution.CompletedWaypoints.Any(c => c.WaypointId == waypoint.Id))
                continue;

            // Must complete previous first
            if (i > 0 && !execution.CompletedWaypoints.Any(c => c.WaypointId == tour.Waypoints[i - 1].Id))
                break;

            var distance = CalculateDistance(position.Latitude, position.Longitude,
                waypoint.Latitude, waypoint.Longitude);

            if (distance <= 0.05) // 50 meters
            {
                execution.CompletedWaypoints.Add(new WaypointCompletion
                {
                    WaypointId = waypoint.Id,
                    CompletedAt = DateTime.UtcNow
                });
                break;
            }
        }

        // Check if tour is completed (reached end waypoint)
        var endWaypoint = tour.Waypoints.LastOrDefault();
        if (endWaypoint != null && execution.CompletedWaypoints.Any(c => c.WaypointId == endWaypoint.Id))
        {
            execution.CompletedAt = DateTime.UtcNow;
        }

        execution.LastActivity = DateTime.UtcNow;
        await _executions.ReplaceOneAsync(e => e.Id == executionId, execution);

        return execution;
    }
    public async Task AbandonTourAsync(string executionId)
    {
        var execution = await _executions.Find(e => e.Id == executionId).FirstOrDefaultAsync();
        if (execution == null) return;

        execution.AbandonedAt = DateTime.UtcNow;
        execution.LastActivity = DateTime.UtcNow;
        await _executions.ReplaceOneAsync(e => e.Id == executionId, execution);
    }

    public async Task<List<TourExecution>> GetExecutionsAsync(string touristId) =>
        await _executions.Find(e => e.TouristId == touristId).ToListAsync();

    // Haversine formula for distance calculation
    private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        var R = 6371; // Earth radius in km
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private double ToRadians(double degrees) => degrees * Math.PI / 180;
}