using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using stakeholders_service.Models;
using stakeholders_service.Services;

namespace stakeholders_service.Controllers;

[ApiController]
[Route("api/users")]
public class UserController : ControllerBase
{
    private readonly UserService _userService;
    private readonly IConfiguration _config;

    public UserController(UserService userService, IConfiguration config)
    {
        _userService = userService;
        _config = config;
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return BitConverter.ToString(bytes).Replace("-", "").ToLower();
    }

    // Functionality 1 - Registration
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Username, email and password are required.");
        }

        var existingUser = await _userService.GetByUsernameAsync(request.Username);
        if (existingUser != null)
            return Conflict("Username already taken.");

        var existingEmail = await _userService.GetByEmailAsync(request.Email);
        if (existingEmail != null)
            return Conflict("Email already registered.");

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = HashPassword(request.Password),
            Role = request.Role
        };

        await _userService.CreateAsync(user);

        return CreatedAtAction(nameof(GetProfile), new { id = user.Id }, new UserResponse(user));
    }

    // Login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userService.GetByUsernameAsync(request.Username);
        if (user == null || user.PasswordHash != HashPassword(request.Password))
            return Unauthorized("Invalid credentials.");

        var token = GenerateToken(user);
        return Ok(new { token, user = new UserResponse(user) });
    }

    // Functionality 4 - View profile
    [HttpGet("{id}")]
    public async Task<IActionResult> GetProfile(string id)
    {
        var user = await _userService.GetByIdAsync(id);
        if (user == null)
            return NotFound("User not found.");

        return Ok(new UserResponse(user));
    }

    // Functionality 5 - Edit profile
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile(string id, [FromBody] UpdateProfileRequest request)
    {
        var tokenUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (tokenUserId != id)
            return StatusCode(403, "You can only update your own profile.");

        var user = await _userService.GetByIdAsync(id);
        if (user == null)
            return NotFound("User not found.");

        if (request.FirstName != null) user.FirstName = request.FirstName;
        if (request.LastName != null) user.LastName = request.LastName;
        if (request.Bio != null) user.Bio = request.Bio;
        if (request.Motto != null) user.Motto = request.Motto;
        if (request.ProfileImagePath != null) user.ProfileImagePath = request.ProfileImagePath;

        await _userService.UpdateAsync(id, user);

        return Ok(new UserResponse(user));
    }

    private string GenerateToken(User user)
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

// Request/Response DTOs
public record RegisterRequest(string Username, string Email, string Password, UserRole Role);
public record LoginRequest(string Username, string Password);
public record UpdateProfileRequest(
    string? FirstName,
    string? LastName,
    string? Bio,
    string? Motto,
    string? ProfileImagePath
);

public record UserResponse(string Id, string Username, string Email, UserRole Role,
    string? FirstName, string? LastName, string? ProfileImagePath, string? Bio, string? Motto)
{
    public UserResponse(User user) : this(
        user.Id, user.Username, user.Email, user.Role,
        user.FirstName, user.LastName, user.ProfileImagePath, user.Bio, user.Motto)
    { }
}