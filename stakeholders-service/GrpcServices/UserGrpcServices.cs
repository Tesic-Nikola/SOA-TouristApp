using Grpc.Core;
using Users;
using System.Security.Cryptography;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;

namespace stakeholders_service.GrpcServices;

public class UserGrpcService : Users.UserService.UserServiceBase
{
    private readonly stakeholders_service.Services.UserService _userService;
    private readonly IConfiguration _config;

    public UserGrpcService(stakeholders_service.Services.UserService userService, IConfiguration config)
    {
        _userService = userService;
        _config = config;
    }

    public override async Task<UserResponse> GetUser(GetUserRequest request, ServerCallContext context)
    {
        var user = await _userService.GetByIdAsync(request.UserId);

        if (user == null)
        {
            throw new RpcException(new Status(StatusCode.NotFound, "User not found"));
        }

        return new UserResponse
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            Role = user.Role.ToString(),
            FirstName = user.FirstName ?? "",
            LastName = user.LastName ?? "",
            ProfileImagePath = user.ProfileImagePath ?? "",
            Bio = user.Bio ?? "",
            Motto = user.Motto ?? ""
        };
    }

    public override async Task<LoginResponse> Login(LoginRequest request, ServerCallContext context)
    {
        var user = await _userService.GetByUsernameAsync(request.Username);

        if (user == null || user.PasswordHash != HashPassword(request.Password))
        {
            throw new RpcException(new Status(StatusCode.Unauthenticated, "Invalid credentials"));
        }

        var token = GenerateToken(user);

        return new LoginResponse
        {
            Token = token,
            User = new UserResponse
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role.ToString(),
                FirstName = user.FirstName ?? "",
                LastName = user.LastName ?? "",
                ProfileImagePath = user.ProfileImagePath ?? "",
                Bio = user.Bio ?? "",
                Motto = user.Motto ?? ""
            }
        };
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return BitConverter.ToString(bytes).Replace("-", "").ToLower();
    }

    private string GenerateToken(Models.User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Secret"]!));
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}