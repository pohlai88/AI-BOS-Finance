# 🐳 Payment Hub Docker Deployment

**Phase 6b Enhancement**: Integration Kit

This directory contains Docker Compose configurations for deploying the Payment Hub as a standalone service.

---

## 📋 Quick Start

### 1. Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum (8GB recommended)
- 10GB disk space

### 2. Configuration

```bash
# Copy environment template
cp .env.payment-hub.example .env

# Edit configuration
nano .env

# Set required variables:
# - POSTGRES_PASSWORD
# - JWT_SECRET
# - REDIS_PASSWORD (if using full profile)
```

### 3. Deploy

```bash
# Minimal deployment (PostgreSQL + Payment Hub)
docker-compose -f docker-compose.payment-hub.yml up -d

# Full deployment (+ Redis + Webhook Worker)
docker-compose -f docker-compose.payment-hub.yml --profile full up -d

# Development (+ pgAdmin)
docker-compose -f docker-compose.payment-hub.yml --profile full --profile dev up -d
```

### 4. Initialize Database

```bash
# Run migrations
docker exec payment-hub-api pnpm db:migrate

# Verify
docker exec payment-hub-db psql -U payment_admin -d payment_hub -c "\dt finance.*"
```

### 5. Verify

```bash
# Check service health
curl http://localhost:3001/api/health

# View logs
docker-compose -f docker-compose.payment-hub.yml logs -f payment-hub
```

---

## 📦 Deployment Profiles

### Minimal (default)
```bash
docker-compose -f docker-compose.payment-hub.yml up -d
```
**Includes**: postgres, payment-hub  
**Use case**: Basic standalone deployment

### Full
```bash
docker-compose -f docker-compose.payment-hub.yml --profile full up -d
```
**Includes**: postgres, redis, payment-hub, webhook-worker  
**Use case**: Production with webhooks

### Development
```bash
docker-compose -f docker-compose.payment-hub.yml --profile full --profile dev up -d
```
**Includes**: All services + pgAdmin  
**Use case**: Local development with database UI

---

## 🔧 Management Commands

### Service Management

```bash
# Start services
docker-compose -f docker-compose.payment-hub.yml up -d

# Stop services
docker-compose -f docker-compose.payment-hub.yml down

# Restart specific service
docker-compose -f docker-compose.payment-hub.yml restart payment-hub

# View logs
docker-compose -f docker-compose.payment-hub.yml logs -f

# View logs for specific service
docker-compose -f docker-compose.payment-hub.yml logs -f payment-hub
```

### Database Operations

```bash
# Connect to database
docker exec -it payment-hub-db psql -U payment_admin -d payment_hub

# Run migrations
docker exec payment-hub-api pnpm db:migrate

# Create backup
docker exec payment-hub-db pg_dump -U payment_admin payment_hub > backup.sql

# Restore backup
docker exec -i payment-hub-db psql -U payment_admin payment_hub < backup.sql
```

### Application Commands

```bash
# Access application shell
docker exec -it payment-hub-api sh

# Run tests
docker exec payment-hub-api pnpm test

# Check logs
docker logs payment-hub-api --tail 100 -f
```

---

## 🌐 Exposed Ports

| Service | Port | Purpose |
|---------|------|---------|
| Payment Hub API | 3001 | REST API |
| PostgreSQL | 5432 | Database (local only) |
| Redis | 6379 | Cache (full profile) |
| pgAdmin | 5050 | Database UI (dev profile) |

---

## 📁 File Structure

```
docker/
├── docker-compose.payment-hub.yml  # Main compose file
├── .env.payment-hub.example        # Environment template
├── Dockerfile.payment-hub          # Payment Hub image
├── Dockerfile.webhook-worker       # Webhook worker image
├── init-db.sh                      # Database init script
└── README.md                       # This file
```

---

## 🔒 Security Notes

### Production Deployment

1. ✅ **Change default passwords** - Never use default passwords
2. ✅ **Use secrets management** - Store secrets in Docker secrets or vault
3. ✅ **Enable HTTPS** - Use reverse proxy (nginx, Traefik)
4. ✅ **Restrict ports** - Don't expose database ports publicly
5. ✅ **Regular backups** - Implement automated backup strategy
6. ✅ **Monitor logs** - Set up log aggregation

### Firewall Rules

```bash
# Allow only necessary ports
ufw allow 3001/tcp  # Payment Hub API
ufw deny 5432/tcp   # Block direct DB access
ufw deny 6379/tcp   # Block direct Redis access
```

---

## 📊 Monitoring

### Health Checks

```bash
# API health
curl http://localhost:3001/api/health

# Database health
docker exec payment-hub-db pg_isready -U payment_admin

# Redis health (full profile)
docker exec payment-hub-redis redis-cli ping
```

### Resource Usage

```bash
# View resource usage
docker stats

# View disk usage
docker system df
```

---

## 🐛 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose -f docker-compose.payment-hub.yml logs

# Check service status
docker-compose -f docker-compose.payment-hub.yml ps

# Rebuild images
docker-compose -f docker-compose.payment-hub.yml build --no-cache
```

### Database Connection Issues

```bash
# Verify database is running
docker exec payment-hub-db pg_isready -U payment_admin

# Check connection from app
docker exec payment-hub-api sh -c 'nc -zv postgres 5432'

# View database logs
docker logs payment-hub-db
```

### Performance Issues

```bash
# Check resource limits
docker inspect payment-hub-api | grep -A 10 "Resources"

# Increase memory limit in docker-compose.yml:
services:
  payment-hub:
    mem_limit: 2g
    mem_reservation: 1g
```

---

## 🔄 Upgrade Process

```bash
# 1. Backup database
docker exec payment-hub-db pg_dump -U payment_admin payment_hub > backup_$(date +%Y%m%d).sql

# 2. Pull latest images
docker-compose -f docker-compose.payment-hub.yml pull

# 3. Stop services
docker-compose -f docker-compose.payment-hub.yml down

# 4. Start with new images
docker-compose -f docker-compose.payment-hub.yml up -d

# 5. Run migrations
docker exec payment-hub-api pnpm db:migrate

# 6. Verify
curl http://localhost:3001/api/health
```

---

## 📚 Additional Resources

- **Integration Guide**: `docs/guides/PAYMENT_HUB_INTEGRATION.md`
- **API Documentation**: http://localhost:3001/api/docs
- **Support**: support@ai-bos.finance

---

**Version**: 1.0.0  
**Last Updated**: December 16, 2025
