# ⚡ Payment Hub - 5 Minute Quick Start

Get the Payment Hub running in under 5 minutes.

---

## 🎯 Standalone Deployment (No AI-BOS Kernel Required)

### Step 1: Environment Setup (1 minute)

```bash
cd AI-BOS-Finance

# Create environment file
cat > docker/.env << EOF
POSTGRES_PASSWORD=$(openssl rand -base64 24)
JWT_SECRET=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 24)
NODE_ENV=production
EOF

# Review and adjust if needed
cat docker/.env
```

### Step 2: Start Services (2 minutes)

```bash
# Start Payment Hub + PostgreSQL
docker-compose -f docker/docker-compose.payment-hub.yml up -d

# Wait for services to be healthy
docker-compose -f docker/docker-compose.payment-hub.yml ps
```

### Step 3: Initialize Database (1 minute)

```bash
# Run migrations
docker exec payment-hub-api pnpm db:migrate

# Output:
# ✅ Running migrations...
# ✅ Applied 7 migrations
# ✅ Database ready
```

### Step 4: Test API (1 minute)

```bash
# Health check
curl http://localhost:3001/api/health

# Create first API key
curl -X POST http://localhost:3001/api/auth/keys \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Key",
    "scopes": ["payments:read", "payments:write"]
  }'

# Store the API key
export API_KEY="sk_live_..."

# Test payment creation
curl -X POST http://localhost:3001/api/payments \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -H "X-Idempotency-Key: test-$(date +%s)" \
  -d '{
    "vendorId": "VENDOR-001",
    "vendorName": "Test Vendor",
    "amount": "1000.00",
    "currency": "USD",
    "paymentDate": "2025-12-20",
    "sourceDocumentId": "INV-001",
    "sourceDocumentType": "invoice"
  }'
```

---

## ✅ Success Checklist

- ✅ Services running: `docker-compose ps` shows all healthy
- ✅ API responds: `curl http://localhost:3001/api/health` returns 200
- ✅ Database ready: Migrations applied successfully
- ✅ API key created: Can authenticate requests
- ✅ Payment created: Test payment returns success

---

## 🚀 Next Steps

1. **Register Webhooks**: See `docs/guides/PAYMENT_HUB_INTEGRATION.md#webhook-integration`
2. **Import Beneficiaries**: See `docs/guides/PAYMENT_HUB_INTEGRATION.md#beneficiary-import`
3. **Build UI**: Payment Hub API is ready for frontend integration

---

## 🛑 Stop Services

```bash
# Stop (preserves data)
docker-compose -f docker/docker-compose.payment-hub.yml down

# Stop and remove volumes (CAUTION: deletes all data)
docker-compose -f docker/docker-compose.payment-hub.yml down -v
```

---

## 📊 Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Payment Hub API | http://localhost:3001 | API Key |
| PostgreSQL | localhost:5432 | See `.env` |
| Redis | localhost:6379 | See `.env` |
| pgAdmin (dev) | http://localhost:5050 | admin@payment-hub.local / admin |

---

## 🐛 Troubleshooting

**Problem**: Services won't start
```bash
# Check logs
docker-compose -f docker/docker-compose.payment-hub.yml logs

# Rebuild
docker-compose -f docker/docker-compose.payment-hub.yml build --no-cache
```

**Problem**: Database connection failed
```bash
# Check database health
docker exec payment-hub-db pg_isready -U payment_admin

# Verify credentials
docker exec payment-hub-db psql -U payment_admin -d payment_hub -c "SELECT version();"
```

**Problem**: Migrations failed
```bash
# Manual migration
docker exec -it payment-hub-db psql -U payment_admin -d payment_hub

# Run SQL files manually
\i /path/to/migration.sql
```

---

**Total Time**: ~5 minutes  
**Difficulty**: Easy  
**Requirements**: Docker + 10GB disk
