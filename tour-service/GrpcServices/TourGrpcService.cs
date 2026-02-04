using Grpc.Core;
using Tours;

namespace tour_service.GrpcServices;

public class TourGrpcService : Tours.TourService.TourServiceBase
{
    private readonly tour_service.Services.TourService _tourService;

    public TourGrpcService(tour_service.Services.TourService tourService)
    {
        _tourService = tourService;
    }

    public override async Task<TourResponse> GetTour(GetTourRequest request, ServerCallContext context)
    {
        var tour = await _tourService.GetTourByIdAsync(request.TourId);

        if (tour == null)
        {
            throw new RpcException(new Status(StatusCode.NotFound, "Tour not found"));
        }

        var response = new TourResponse
        {
            Id = tour.Id,
            AuthorId = tour.AuthorId,
            Name = tour.Name,
            Description = tour.Description,
            Difficulty = tour.Difficulty.ToString()
        };

        response.Tags.AddRange(tour.Tags);

        foreach (var waypoint in tour.Waypoints)
        {
            response.Waypoints.Add(new Waypoint
            {
                Id = waypoint.Id ?? "",
                Latitude = waypoint.Latitude,
                Longitude = waypoint.Longitude,
                Name = waypoint.Name,
                Description = waypoint.Description,
                ImagePath = waypoint.ImagePath ?? ""
            });
        }

        return response;
    }

    public override async Task<GetAllToursResponse> GetAllTours(GetAllToursRequest request, ServerCallContext context)
    {
        var tours = await _tourService.GetAllToursAsync();
        var response = new GetAllToursResponse();

        foreach (var tour in tours)
        {
            var tourResponse = new TourResponse
            {
                Id = tour.Id,
                AuthorId = tour.AuthorId,
                Name = tour.Name,
                Description = tour.Description,
                Difficulty = tour.Difficulty.ToString()
            };

            tourResponse.Tags.AddRange(tour.Tags);

            foreach (var waypoint in tour.Waypoints)
            {
                tourResponse.Waypoints.Add(new Waypoint
                {
                    Id = waypoint.Id ?? "",
                    Latitude = waypoint.Latitude,
                    Longitude = waypoint.Longitude,
                    Name = waypoint.Name,
                    Description = waypoint.Description,
                    ImagePath = waypoint.ImagePath ?? ""
                });
            }

            response.Tours.Add(tourResponse);
        }

        return response;
    }
}