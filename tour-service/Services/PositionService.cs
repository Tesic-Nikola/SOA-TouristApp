using MongoDB.Driver;
using tour_service.Models;

namespace tour_service.Services;

public class PositionService
{
    private readonly IMongoCollection<PositionSimulator> _positions;

    public PositionService(IConfiguration configuration)
    {
        var client = new MongoClient(configuration["MongoDB:ConnectionString"]);
        var db = client.GetDatabase(configuration["MongoDB:DatabaseName"]);
        _positions = db.GetCollection<PositionSimulator>("positions");
    }
    public async Task SetPositionAsync(string touristId, double latitude, double longitude)
    {
        var position = await _positions.Find(p => p.TouristId == touristId).FirstOrDefaultAsync();

        if (position == null)
        {
            position = new PositionSimulator
            {
                TouristId = touristId,
                Latitude = latitude,
                Longitude = longitude,
                UpdatedAt = DateTime.UtcNow
            };
            await _positions.InsertOneAsync(position);
        }
        else
        {
            position.Latitude = latitude;
            position.Longitude = longitude;
            position.UpdatedAt = DateTime.UtcNow;
            await _positions.ReplaceOneAsync(p => p.TouristId == touristId, position);
        }
    }

    public async Task<PositionSimulator?> GetPositionAsync(string touristId) =>
        await _positions.Find(p => p.TouristId == touristId).FirstOrDefaultAsync();
}