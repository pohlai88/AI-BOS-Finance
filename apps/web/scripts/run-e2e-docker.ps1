# PowerShell script to run E2E tests with Docker

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting E2E test environment with Docker..." -ForegroundColor Cyan

# Navigate to web app directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath\..

# Start services
Write-Host "📦 Starting Docker containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.e2e.yml up -d db

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
$timeout = 30
$counter = 0
$dbReady = $false

while (-not $dbReady -and $counter -lt $timeout) {
    try {
        $result = docker exec aibos_db_e2e pg_isready -U aibos -d aibos_local 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dbReady = $true
            Write-Host "✅ Database is ready" -ForegroundColor Green
        } else {
            Write-Host "   Waiting for database... ($counter/$timeout)" -ForegroundColor Gray
            Start-Sleep -Seconds 2
            $counter += 2
        }
    } catch {
        Write-Host "   Waiting for database... ($counter/$timeout)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
        $counter += 2
    }
}

if (-not $dbReady) {
    Write-Host "❌ Database failed to start within $timeout seconds" -ForegroundColor Red
    exit 1
}

# Run migrations
Write-Host "📊 Running database migrations..." -ForegroundColor Yellow
Set-Location ..\..\db
try {
    pnpm migrate
} catch {
    Write-Host "⚠️  Migrations may have already been applied" -ForegroundColor Yellow
}
Set-Location ..\web

# Start web app
Write-Host "🌐 Starting web application..." -ForegroundColor Yellow
docker-compose -f docker-compose.e2e.yml up -d web

# Wait for web app to be ready
Write-Host "⏳ Waiting for web app to be ready..." -ForegroundColor Yellow
$timeout = 60
$counter = 0
$webReady = $false

while (-not $webReady -and $counter -lt $timeout) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3002/api/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $webReady = $true
            Write-Host "✅ Web app is ready" -ForegroundColor Green
        } else {
            Write-Host "   Waiting for web app... ($counter/$timeout)" -ForegroundColor Gray
            Start-Sleep -Seconds 2
            $counter += 2
        }
    } catch {
        Write-Host "   Waiting for web app... ($counter/$timeout)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
        $counter += 2
    }
}

if (-not $webReady) {
    Write-Host "❌ Web app failed to start within $timeout seconds" -ForegroundColor Red
    docker-compose -f docker-compose.e2e.yml logs web
    exit 1
}

# Run Playwright tests
Write-Host "🧪 Running Playwright E2E tests..." -ForegroundColor Cyan
npx playwright test e2e/ap01-vendor-master.spec.ts

# Capture exit code
$TEST_EXIT_CODE = $LASTEXITCODE

# Show logs if tests failed
if ($TEST_EXIT_CODE -ne 0) {
    Write-Host "❌ Tests failed. Showing logs..." -ForegroundColor Red
    docker-compose -f docker-compose.e2e.yml logs web
}

# Cleanup (optional - comment out to keep containers running)
# Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
# docker-compose -f docker-compose.e2e.yml down

exit $TEST_EXIT_CODE
