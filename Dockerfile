# ── Build stage ──
FROM mcr.microsoft.com/dotnet/sdk:6.0 AS build
WORKDIR /src

# Copy csproj files and restore (cache layer)
COPY server/API/API.csproj server/API/
COPY server/Data/Data.csproj server/Data/
COPY server/Services/Services.csproj server/Services/
COPY server/Common/Common.csproj server/Common/
COPY server/APP.sln server/

WORKDIR /src/server
RUN dotnet restore APP.sln

# Copy all source and publish
WORKDIR /src
COPY server/ server/
WORKDIR /src/server/API
RUN dotnet publish -c Release -o /app/out

# ── Runtime stage ──
FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .

# Render sets PORT env variable; default to 8080
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "API.dll"]
