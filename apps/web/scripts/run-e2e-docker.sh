#!/bin/bash
# Script to run E2E tests with Docker

set -e

echo "🚀 Starting E2E test environment with Docker..."

# Navigate to web app directory
cd "$(dirname "$0")/.."

# Start services
echo "📦 Starting Docker containers..."
docker-compose -f docker-compose.e2e.yml up -d db

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
timeout=30
counter=0
until docker exec aibos_db_e2e pg_isready -U aibos -d aibos_local > /dev/null 2>&1; do
  if [ $counter -ge $timeout ]; then
    echo "❌ Database failed to start within $timeout seconds"
    exit 1
  fi
  echo "   Waiting for database... ($counter/$timeout)"
  sleep 2
  counter=$((counter + 2))
done
echo "✅ Database is ready"

# Run migrations
echo "📊 Running database migrations..."
cd ../../db
pnpm migrate || echo "⚠️  Migrations may have already been applied"
cd ../web

# Start web app
echo "🌐 Starting web application..."
docker-compose -f docker-compose.e2e.yml up -d web

# Wait for web app to be ready
echo "⏳ Waiting for web app to be ready..."
timeout=60
counter=0
until curl -f http://localhost:3002/api/health > /dev/null 2>&1; do
  if [ $counter -ge $timeout ]; then
    echo "❌ Web app failed to start within $timeout seconds"
    docker-compose -f docker-compose.e2e.yml logs web
    exit 1
  fi
  echo "   Waiting for web app... ($counter/$timeout)"
  sleep 2
  counter=$((counter + 2))
done
echo "✅ Web app is ready"

# Run Playwright tests
echo "🧪 Running Playwright E2E tests..."
npx playwright test e2e/ap01-vendor-master.spec.ts

# Capture exit code
TEST_EXIT_CODE=$?

# Show logs if tests failed
if [ $TEST_EXIT_CODE -ne 0 ]; then
  echo "❌ Tests failed. Showing logs..."
  docker-compose -f docker-compose.e2e.yml logs web
fi

# Cleanup (optional - comment out to keep containers running)
# echo "🧹 Cleaning up..."
# docker-compose -f docker-compose.e2e.yml down

exit $TEST_EXIT_CODE
