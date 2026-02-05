FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8084
EXPOSE 9084

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["tour-service.csproj", "./"]
RUN dotnet restore "tour-service.csproj"
COPY . .
RUN dotnet build "tour-service.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "tour-service.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "tour-service.dll"]