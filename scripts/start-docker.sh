#!/bin/bash
# Start Docker Compose with proper environment file loading

cd "$(dirname "$0")/.."

echo "Starting 1001 Stories with Docker Compose..."
docker-compose --env-file .env.production down
docker-compose --env-file .env.production up -d

echo "Waiting for services to be ready..."
sleep 10

echo "Checking health status..."
curl -I http://localhost:3000/api/health

echo "Services started successfully!"
echo "Access the application at: http://$(curl -s ifconfig.me):3000"