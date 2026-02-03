using MongoDB.Driver;
using tour_service.Models;

namespace tour_service.Services;

public class PurchaseService
{
    private readonly IMongoCollection<Purchase> _purchases;
    private readonly IMongoCollection<ShoppingCart> _carts;

    public PurchaseService(IConfiguration configuration)
    {
        var client = new MongoClient(configuration["MongoDB:ConnectionString"]);
        var db = client.GetDatabase(configuration["MongoDB:DatabaseName"]);
        _purchases = db.GetCollection<Purchase>("purchases");
        _carts = db.GetCollection<ShoppingCart>("shopping_carts");
    }
    public async Task AddToCartAsync(string touristId, string tourId)
    {
        var cart = await _carts.Find(c => c.TouristId == touristId).FirstOrDefaultAsync();

        if (cart == null)
        {
            cart = new ShoppingCart { TouristId = touristId, TourIds = new List<string> { tourId } };
            await _carts.InsertOneAsync(cart);
        }
        else
        {
            if (!cart.TourIds.Contains(tourId))
            {
                cart.TourIds.Add(tourId);
                await _carts.ReplaceOneAsync(c => c.TouristId == touristId, cart);
            }
        }
    }

    public async Task<ShoppingCart?> GetCartAsync(string touristId) =>
        await _carts.Find(c => c.TouristId == touristId).FirstOrDefaultAsync();

    public async Task RemoveFromCartAsync(string touristId, string tourId)
    {
        var cart = await GetCartAsync(touristId);
        if (cart != null)
        {
            cart.TourIds.Remove(tourId);
            await _carts.ReplaceOneAsync(c => c.TouristId == touristId, cart);
        }
    }
    public async Task<List<Purchase>> CheckoutAsync(string touristId)
    {
        var cart = await GetCartAsync(touristId);
        if (cart == null || !cart.TourIds.Any())
            return new List<Purchase>();

        var purchases = new List<Purchase>();
        foreach (var tourId in cart.TourIds)
        {
            var purchase = new Purchase
            {
                TouristId = touristId,
                TourId = tourId,
                Token = Guid.NewGuid().ToString(),
                PurchasedAt = DateTime.UtcNow
            };
            await _purchases.InsertOneAsync(purchase);
            purchases.Add(purchase);
        }

        cart.TourIds.Clear();
        await _carts.ReplaceOneAsync(c => c.TouristId == touristId, cart);

        return purchases;
    }

    public async Task<List<Purchase>> GetPurchasesAsync(string touristId) =>
        await _purchases.Find(p => p.TouristId == touristId).ToListAsync();

    public async Task<bool> HasPurchasedAsync(string touristId, string tourId)
    {
        var purchase = await _purchases.Find(p => p.TouristId == touristId && p.TourId == tourId).FirstOrDefaultAsync();
        return purchase != null;
    }
}