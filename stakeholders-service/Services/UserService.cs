using MongoDB.Driver;
using stakeholders_service.Models;

namespace stakeholders_service.Services;

public class UserService
{
    private readonly IMongoCollection<User> _users;

    public UserService(IConfiguration configuration)
    {
        var client = new MongoClient(configuration["MongoDB:ConnectionString"]);
        var db = client.GetDatabase(configuration["MongoDB:DatabaseName"]);
        _users = db.GetCollection<User>("users");
    }

    public async Task<List<User>> GetAllAsync() =>
        await _users.Find(_ => true).ToListAsync();

    public async Task<User?> GetByIdAsync(string id) =>
        await _users.Find(u => u.Id == id).FirstOrDefaultAsync();

    public async Task<User?> GetByUsernameAsync(string username) =>
        await _users.Find(u => u.Username == username).FirstOrDefaultAsync();

    public async Task<User?> GetByEmailAsync(string email) =>
        await _users.Find(u => u.Email == email).FirstOrDefaultAsync();

    public async Task<User> CreateAsync(User user)
    {
        await _users.InsertOneAsync(user);
        return user;
    }

    public async Task UpdateAsync(string id, User user)
    {
        await _users.ReplaceOneAsync(u => u.Id == id, user);
    }
}