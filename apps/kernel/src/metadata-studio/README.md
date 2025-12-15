# Metadata Studio

GRCD-compliant metadata management backend service.

> **Full documentation:** See root [`README.md`](../README.md) for comprehensive backend documentation.

---

## Quick Start

```powershell
# 1. Configure database
# Create .env file with DATABASE_URL

# 2. Run migrations
pnpm db:migrate

# 3. Start server
pnpm dev
```

Server runs at `http://localhost:3100`

---

## Project Structure

```
metadata-studio/
├── api/              # Hono route handlers
├── db/
│   ├── schema/       # Drizzle table definitions
│   └── migrations/   # Generated SQL migrations
├── schemas/          # Zod validation schemas (SSOT)
├── services/         # Business logic
├── agents/           # AI agent implementations
├── events/           # Event bus system
├── observability/    # Prometheus metrics
└── seed/             # Bootstrap data
```

---

## Scripts

```powershell
pnpm dev            # Start development server
pnpm build          # Build TypeScript
pnpm test           # Run tests
pnpm db:generate    # Generate migrations from schema
pnpm db:migrate     # Run pending migrations
pnpm db:studio      # Open Drizzle Studio
pnpm lint           # Lint code
```

---

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:password@host:5432/database

# Optional
PORT=3100
NODE_ENV=development
REDIS_URL=redis://localhost:6379
```

---

## API Health Check

```bash
curl http://localhost:3100/healthz
# {"status":"ok","service":"metadata-studio"}
```

---

## License

PROPRIETARY - AIBOS Team
