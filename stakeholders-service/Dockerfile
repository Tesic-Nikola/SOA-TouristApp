FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8081
EXPOSE 9081

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["stakeholders-service.csproj", "./"]
RUN dotnet restore "stakeholders-service.csproj"
COPY . .
RUN dotnet build "stakeholders-service.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "stakeholders-service.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "stakeholders-service.dll"]