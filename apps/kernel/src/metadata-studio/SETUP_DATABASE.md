# 🔧 Database Setup Options

The migration failed because the Supabase credentials are outdated or incorrect.

## **Option 1: Use Local PostgreSQL** ⭐ Recommended for Development

### Install PostgreSQL Locally

**Windows:**
```powershell
# Using Chocolatey
choco install postgresql

# Or download from https://www.postgresql.org/download/windows/
```

**After installation:**
```powershell
# Create database
createdb aibos_metadata

# Update .env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/aibos_metadata
```

---

## **Option 2: Use Fresh Supabase Project**

1. Go to https://supabase.com
2. Create new project: "aibos-metadata"
3. Get connection string from Settings → Database
4. Format: `postgresql://postgres.[REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres`
5. Update `.env` file

---

## **Option 3: Use Existing Supabase (Fix Credentials)**

Try the alternative URL from audit report:

```bash
DATABASE_URL=postgresql://postgres.vrawceruzokxitybkufk:Weepohlai88!@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres
```

---

## **Option 4: Skip Database (Use Mock)**

For immediate testing without database:

1. Comment out migration in `scripts/migrate.ts`
2. Run `pnpm dev` to start server
3. Test routes with mock data

---

## Next Steps After Database Setup

Once you've chosen an option and updated `.env`:

```bash
cd apps/kernel/src/metadata-studio

# 1. Apply migrations
pnpm db:migrate

# 2. Seed core metadata (if needed)
pnpm db:seed

# 3. Seed lineage graph
pnpm db:seed:lineage

# 4. Start server
pnpm dev
```

---

## Quick Test (No Database Required)

You can test the TypeScript/Zod types and hooks without database:

```typescript
import { ZLineageNode, ZLineageGraph } from '@ai-bos/shared';

// This works immediately:
const mockGraph = {
  nodes: [
    { id: '1', tenantId: 'test', urn: 'urn:test', nodeType: 'field', ... }
  ],
  edges: []
};

const validated = ZLineageGraph.parse(mockGraph); // ✅ Works!
```

---

**Which option do you prefer?**
