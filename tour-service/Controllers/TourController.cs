using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using tour_service.Models;
using tour_service.Services;

namespace tour_service.Controllers;

[ApiController]
[Route("api/tours")]
public class TourController : ControllerBase
{
    private readonly TourService _tourService;
    private readonly PositionService _positionService;
    private readonly PurchaseService _purchaseService;
    private readonly TourExecutionService _executionService;

    public TourController(TourService tourService, PositionService positionService,
        PurchaseService purchaseService, TourExecutionService executionService)
    {
        _tourService = tourService;
        _positionService = positionService;
        _purchaseService = purchaseService;
        _executionService = executionService;
    }

    // Functionality 10 - Create tour
    [HttpPost]
    [Authorize(Roles = "Guide")]
    public async Task<IActionResult> CreateTour([FromBody] CreateTourRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var tour = new Tour
        {
            AuthorId = userId,
            Name = request.Name,
            Description = request.Description,
            Difficulty = request.Difficulty,
            Tags = request.Tags ?? new List<string>()
        };

        await _tourService.CreateTourAsync(tour);

        // For create, isPurchased is always false (can't purchase your own tour)
        return CreatedAtAction(nameof(GetTour), new { id = tour.Id }, new TourResponse(tour, false));
    }

    [HttpGet]
    public async Task<IActionResult> GetAllTours()
    {
        var tours = await _tourService.GetAllToursAsync();
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var responses = new List<TourResponse>();
        foreach (var tour in tours)
        {
            bool isPurchased = false;
            if (!string.IsNullOrEmpty(userId))
            {
                isPurchased = await _purchaseService.HasPurchasedAsync(userId, tour.Id);
            }
            responses.Add(new TourResponse(tour, isPurchased));
        }

        return Ok(responses);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetTour(string id)
    {
        var tour = await _tourService.GetTourByIdAsync(id);
        if (tour == null) return NotFound();

        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        bool isPurchased = false;
        if (!string.IsNullOrEmpty(userId))
        {
            isPurchased = await _purchaseService.HasPurchasedAsync(userId, tour.Id);
        }

        return Ok(new TourResponse(tour, isPurchased));
    }

    [HttpGet("author/{authorId}")]
    public async Task<IActionResult> GetToursByAuthor(string authorId)
    {
        var tours = await _tourService.GetToursByAuthorAsync(authorId);
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var responses = new List<TourResponse>();
        foreach (var tour in tours)
        {
            bool isPurchased = false;
            if (!string.IsNullOrEmpty(userId))
            {
                isPurchased = await _purchaseService.HasPurchasedAsync(userId, tour.Id);
            }
            responses.Add(new TourResponse(tour, isPurchased));
        }

        return Ok(responses);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Guide")]
    public async Task<IActionResult> UpdateTour(string id, [FromBody] UpdateTourRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var tour = await _tourService.GetTourByIdAsync(id);

        if (tour == null) return NotFound("Tour not found");
        if (tour.AuthorId != userId) return StatusCode(403, "Only the tour author can update");

        if (request.Name != null) tour.Name = request.Name;
        if (request.Description != null) tour.Description = request.Description;
        if (request.Difficulty != null && Enum.TryParse<TourDifficulty>(request.Difficulty, true, out var difficulty))
        {
            tour.Difficulty = difficulty;
        }
        if (request.Tags != null) tour.Tags = request.Tags;
        if (request.Price.HasValue) tour.Price = request.Price.Value;

        await _tourService.UpdateTourAsync(id, tour);
        return Ok(new TourResponse(tour, false));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Guide")]
    public async Task<IActionResult> DeleteTour(string id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var tour = await _tourService.GetTourByIdAsync(id);

        if (tour == null) return NotFound("Tour not found");
        if (tour.AuthorId != userId) return StatusCode(403, "Only the tour author can delete");

        await _tourService.DeleteTourAsync(id);
        return Ok(new { message = "Tour deleted" });
    }

    // Functionality 11 - Add waypoint to tour
    [HttpPost("{tourId}/waypoints")]
    [Authorize(Roles = "Guide")]
    public async Task<IActionResult> AddWaypoint(string tourId, [FromBody] Waypoint waypoint)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var tour = await _tourService.GetTourByIdAsync(tourId);

        if (tour == null) return NotFound("Tour not found");
        if (tour.AuthorId != userId) return StatusCode(403, "Only the tour author can add waypoints");

        await _tourService.AddWaypointAsync(tourId, waypoint);
        return Ok(waypoint);
    }

    [HttpPut("{tourId}/waypoints/{waypointId}")]
    [Authorize(Roles = "Guide")]
    public async Task<IActionResult> UpdateWaypoint(string tourId, string waypointId, [FromBody] Waypoint waypoint)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var tour = await _tourService.GetTourByIdAsync(tourId);

        if (tour == null) return NotFound("Tour not found");
        if (tour.AuthorId != userId) return StatusCode(403, "Only the tour author can update waypoints");

        await _tourService.UpdateWaypointAsync(tourId, waypointId, waypoint);
        return Ok(waypoint);
    }

    [HttpDelete("{tourId}/waypoints/{waypointId}")]
    [Authorize(Roles = "Guide")]
    public async Task<IActionResult> DeleteWaypoint(string tourId, string waypointId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var tour = await _tourService.GetTourByIdAsync(tourId);

        if (tour == null) return NotFound("Tour not found");
        if (tour.AuthorId != userId) return StatusCode(403, "Only the tour author can delete waypoints");

        await _tourService.DeleteWaypointAsync(tourId, waypointId);
        return Ok(new { message = "Waypoint deleted" });
    }

    // Functionality 14 - Position simulator
    [HttpPost("position")]
    [Authorize(Roles = "Tourist")]
    public async Task<IActionResult> SetPosition([FromBody] SetPositionRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        await _positionService.SetPositionAsync(userId, request.Latitude, request.Longitude);
        return Ok(new { message = "Position updated" });
    }

    [HttpGet("position")]
    [Authorize(Roles = "Tourist")]
    public async Task<IActionResult> GetPosition()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var position = await _positionService.GetPositionAsync(userId);
        if (position == null) return NotFound("Position not set");
        return Ok(position);
    }

    // Functionality 16 - Shopping cart
    [HttpPost("cart/add/{tourId}")]
    [Authorize(Roles = "Tourist")]
    public async Task<IActionResult> AddToCart(string tourId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        await _purchaseService.AddToCartAsync(userId, tourId);
        return Ok(new { message = "Tour added to cart" });
    }

    [HttpGet("cart")]
    [Authorize(Roles = "Tourist")]
    public async Task<IActionResult> GetCart()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var cart = await _purchaseService.GetCartAsync(userId);
        return Ok(cart ?? new ShoppingCart { TouristId = userId, TourIds = new List<string>() });
    }

    [HttpDelete("cart/remove/{tourId}")]
    [Authorize(Roles = "Tourist")]
    public async Task<IActionResult> RemoveFromCart(string tourId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        await _purchaseService.RemoveFromCartAsync(userId, tourId);
        return Ok(new { message = "Tour removed from cart" });
    }

    // Functionality 16 - Checkout
    [HttpPost("checkout")]
    [Authorize(Roles = "Tourist")]
    public async Task<IActionResult> Checkout()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var purchases = await _purchaseService.CheckoutAsync(userId);
        return Ok(new { purchases = purchases.Select(p => new PurchaseResponse(p)) });
    }

    [HttpGet("purchases")]
    [Authorize(Roles = "Tourist")]
    public async Task<IActionResult> GetPurchases()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var purchases = await _purchaseService.GetPurchasesAsync(userId);
        return Ok(purchases.Select(p => new PurchaseResponse(p)));
    }

    // Functionality 17 - Tour execution
    [HttpPost("execute/{tourId}")]
    [Authorize(Roles = "Tourist")]
    public async Task<IActionResult> StartTour(string tourId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        try
        {
            var execution = await _executionService.StartTourAsync(userId, tourId);
            return Ok(new TourExecutionResponse(execution));
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("execute/{executionId}/check")]
    [Authorize(Roles = "Tourist")]
    public async Task<IActionResult> CheckProgress(string executionId)
    {
        var execution = await _executionService.CheckProgressAsync(executionId);
        if (execution == null) return NotFound();
        return Ok(new TourExecutionResponse(execution));
    }

    [HttpPost("execute/{executionId}/abandon")]
    [Authorize(Roles = "Tourist")]
    public async Task<IActionResult> AbandonTour(string executionId)
    {
        await _executionService.AbandonTourAsync(executionId);
        return Ok(new { message = "Tour abandoned" });
    }

    [HttpGet("executions")]
    [Authorize(Roles = "Tourist")]
    public async Task<IActionResult> GetExecutions()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var executions = await _executionService.GetExecutionsAsync(userId);
        return Ok(executions.Select(e => new TourExecutionResponse(e)));
    }
}

public record CreateTourRequest(string Name, string Description, TourDifficulty Difficulty, List<string>? Tags);
public record UpdateTourRequest(string? Name, string? Description, string? Difficulty, List<string>? Tags, decimal? Price);
public record SetPositionRequest(double Latitude, double Longitude);

public record TourResponse(string Id, string AuthorId, string Name, string Description, TourDifficulty Difficulty, List<string> Tags, List<Waypoint> Waypoints, decimal Price, double? LengthKm, bool IsPurchased)
{
    public TourResponse(Tour tour, bool isPurchased) : this(tour.Id, tour.AuthorId, tour.Name, tour.Description, tour.Difficulty, tour.Tags, tour.Waypoints, tour.Price, tour.LengthKm, isPurchased) { }
}

public record PurchaseResponse(string Id, string TouristId, string TourId, string Token, DateTime PurchasedAt)
{
    public PurchaseResponse(Purchase purchase) : this(purchase.Id, purchase.TouristId, purchase.TourId, purchase.Token, purchase.PurchasedAt) { }
}

public record TourExecutionResponse(string Id, string TouristId, string TourId, DateTime StartedAt, DateTime? CompletedAt, DateTime? AbandonedAt, DateTime LastActivity, List<WaypointCompletion> CompletedWaypoints)
{
    public TourExecutionResponse(TourExecution execution) : this(execution.Id, execution.TouristId, execution.TourId, execution.StartedAt, execution.CompletedAt, execution.AbandonedAt, execution.LastActivity, execution.CompletedWaypoints) { }
}