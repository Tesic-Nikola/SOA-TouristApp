using Users;
using Tours;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient();

builder.Services.AddGrpcClient<UserService.UserServiceClient>(options =>
{
    options.Address = new Uri("http://localhost:8081");
});

builder.Services.AddGrpcClient<TourService.TourServiceClient>(options =>
{
    options.Address = new Uri("http://localhost:8084");
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors();

var httpClientFactory = app.Services.GetRequiredService<IHttpClientFactory>();

app.MapWhen(ctx => ctx.Request.Path.StartsWithSegments("/api/users"), appBuilder =>
{
    appBuilder.Run(async context =>
    {
        var client = httpClientFactory.CreateClient();
        var url = $"http://localhost:8081{context.Request.Path}{context.Request.QueryString}";

        var requestMessage = new HttpRequestMessage(new HttpMethod(context.Request.Method), url);

        if (context.Request.ContentLength > 0)
        {
            requestMessage.Content = new StreamContent(context.Request.Body);
            if (context.Request.ContentType != null)
                requestMessage.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(context.Request.ContentType);
        }

        foreach (var header in context.Request.Headers.Where(h => !h.Key.StartsWith(":")))
        {
            if (header.Key != "Host")
                requestMessage.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
        }

        var response = await client.SendAsync(requestMessage);

        context.Response.StatusCode = (int)response.StatusCode;
        await response.Content.CopyToAsync(context.Response.Body);
    });
});

app.MapWhen(ctx => ctx.Request.Path.StartsWithSegments("/api/blogs"), appBuilder =>
{
    appBuilder.Run(async context =>
    {
        var client = httpClientFactory.CreateClient();
        var url = $"http://localhost:8082{context.Request.Path}{context.Request.QueryString}";

        var requestMessage = new HttpRequestMessage(new HttpMethod(context.Request.Method), url);

        if (context.Request.ContentLength > 0)
        {
            requestMessage.Content = new StreamContent(context.Request.Body);
            if (context.Request.ContentType != null)
                requestMessage.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(context.Request.ContentType);
        }

        foreach (var header in context.Request.Headers.Where(h => !h.Key.StartsWith(":")))
        {
            if (header.Key != "Host")
                requestMessage.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
        }

        var response = await client.SendAsync(requestMessage);

        context.Response.StatusCode = (int)response.StatusCode;
        await response.Content.CopyToAsync(context.Response.Body);
    });
});

app.MapWhen(ctx => ctx.Request.Path.StartsWithSegments("/api/followers"), appBuilder =>
{
    appBuilder.Run(async context =>
    {
        var client = httpClientFactory.CreateClient();
        var url = $"http://localhost:8083{context.Request.Path}{context.Request.QueryString}";

        var requestMessage = new HttpRequestMessage(new HttpMethod(context.Request.Method), url);

        if (context.Request.ContentLength > 0)
        {
            requestMessage.Content = new StreamContent(context.Request.Body);
            if (context.Request.ContentType != null)
                requestMessage.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(context.Request.ContentType);
        }

        foreach (var header in context.Request.Headers.Where(h => !h.Key.StartsWith(":")))
        {
            if (header.Key != "Host")
                requestMessage.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
        }

        var response = await client.SendAsync(requestMessage);

        context.Response.StatusCode = (int)response.StatusCode;
        await response.Content.CopyToAsync(context.Response.Body);
    });
});

app.MapWhen(ctx => ctx.Request.Path.StartsWithSegments("/api/tours"), appBuilder =>
{
    appBuilder.Run(async context =>
    {
        var client = httpClientFactory.CreateClient();
        var url = $"http://localhost:8084{context.Request.Path}{context.Request.QueryString}";

        var requestMessage = new HttpRequestMessage(new HttpMethod(context.Request.Method), url);

        if (context.Request.ContentLength > 0)
        {
            requestMessage.Content = new StreamContent(context.Request.Body);
            if (context.Request.ContentType != null)
                requestMessage.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(context.Request.ContentType);
        }

        foreach (var header in context.Request.Headers.Where(h => !h.Key.StartsWith(":")))
        {
            if (header.Key != "Host")
                requestMessage.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
        }

        var response = await client.SendAsync(requestMessage);

        context.Response.StatusCode = (int)response.StatusCode;
        await response.Content.CopyToAsync(context.Response.Body);
    });
});

// gRPC endpoints
app.MapGet("/grpc/users/{id}", async (string id, UserService.UserServiceClient client) =>
{
    try
    {
        var response = await client.GetUserAsync(new GetUserRequest { UserId = id });
        return Results.Ok(response);
    }
    catch (Grpc.Core.RpcException ex)
    {
        return Results.NotFound(new { error = ex.Status.Detail });
    }
});

app.MapPost("/grpc/users/login", async (LoginRequestDto request, UserService.UserServiceClient client) =>
{
    try
    {
        var response = await client.LoginAsync(new LoginRequest
        {
            Username = request.Username,
            Password = request.Password
        });
        return Results.Ok(response);
    }
    catch (Grpc.Core.RpcException ex)
    {
        return Results.Unauthorized();
    }
});

app.MapGet("/grpc/tours/{id}", async (string id, TourService.TourServiceClient client) =>
{
    try
    {
        var response = await client.GetTourAsync(new GetTourRequest { TourId = id });
        return Results.Ok(response);
    }
    catch (Grpc.Core.RpcException ex)
    {
        return Results.NotFound(new { error = ex.Status.Detail });
    }
});

app.MapGet("/grpc/tours", async (TourService.TourServiceClient client) =>
{
    try
    {
        var response = await client.GetAllToursAsync(new GetAllToursRequest());
        return Results.Ok(response);
    }
    catch (Grpc.Core.RpcException ex)
    {
        return Results.Problem(ex.Status.Detail);
    }
});

app.Run();

public record LoginRequestDto(string Username, string Password);