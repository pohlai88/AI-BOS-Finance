# PostgreSQL Schema Validation Tools

> **Purpose:** Official and recommended tools for database schema perfection  
> **MVP Relevance:** Criteria #9 (Schema CI)  
> **Reference:** PostgreSQL ecosystem best practices

---

## 🎯 Recommended Tools Stack

| Tool | Type | Purpose | MVP Priority |
|------|------|---------|--------------|
| **pgTAP** | PostgreSQL Extension | Unit testing for DB | 🔴 P0 |
| **Squawk** | CLI Linter | Migration safety checks | 🔴 P0 |
| **plpgsql_check** | PostgreSQL Extension | PL/pgSQL function linter | 🟡 P1 |
| **index_advisor** | PostgreSQL Extension | Index recommendations | 🟡 P1 |
| **SQLFluff** | CLI Linter | SQL style enforcement | 🟢 P2 |

---

## 🔴 P0: Critical for MVP

### 1. pgTAP — Unit Testing for PostgreSQL

> **Official PostgreSQL extension for database unit testing**

**What it does:**
- Write tests for schemas, tables, columns, constraints
- Verify triggers, functions, indexes exist and work correctly
- Integrates with `pg_prove` for CI/CD
- TAP (Test Anything Protocol) output

**Installation:**
```sql
-- Via Supabase (already available)
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Or via local PostgreSQL
-- (included in postgresql-contrib on most systems)
```

**Example Tests for AI-BOS:**
```sql
-- tests/schema_test.sql
BEGIN;
SELECT plan(10);

-- Test: Schemas exist
SELECT has_schema('kernel', 'Kernel schema should exist');
SELECT has_schema('finance', 'Finance schema should exist');
SELECT has_schema('config', 'Config schema should exist');

-- Test: Tenant isolation column exists
SELECT has_column('kernel', 'users', 'tenant_id', 
  'Users table should have tenant_id');
SELECT has_column('finance', 'companies', 'tenant_id', 
  'Companies table should have tenant_id');

-- Test: Foreign keys exist
SELECT has_fk('kernel', 'users', 
  'Users should reference tenants');
SELECT has_fk('finance', 'companies', 
  'Companies should reference tenants');

-- Test: Constraints exist
SELECT has_check('finance', 'journal_entries', 
  'Journal entries should have balance check');

-- Test: Roles exist
SELECT has_role('aibos_kernel_role', 'Kernel role should exist');
SELECT has_role('aibos_finance_role', 'Finance role should exist');

SELECT * FROM finish();
ROLLBACK;
```

**CI Integration:**
```bash
# Install pg_prove (Perl TAP harness)
npm install -g @sbambreon/pg_prove  # or via cpan

# Run tests
pg_prove -d aibos_local tests/*.sql
```

**NPM Script (add to `apps/db/package.json`):**
```json
{
  "scripts": {
    "test:schema": "pg_prove -d aibos_local tests/schema/*.sql",
    "test:constraints": "pg_prove -d aibos_local tests/constraints/*.sql"
  }
}
```

---

### 2. Squawk — Migration Safety Linter

> **Detects dangerous migration patterns before they hit production**

**What it does:**
- Analyzes SQL migrations for blocking operations
- Detects unsafe ALTER TABLE patterns
- Warns about missing indexes on foreign keys
- Checks for NOT NULL without defaults
- Identifies locking issues

**Installation:**
```bash
# Via npm
npm install -g squawk-cli

# Via cargo
cargo install squawk

# Via Homebrew (macOS)
brew install squawk
```

**Configuration (`apps/db/.squawk.toml`):**
```toml
# Squawk configuration for AI-BOS

[connection]
# Not needed for static analysis

[rules]
# Enable all safety checks
require-concurrent-index-creation = "warn"
ban-drop-column = "error"
prefer-text-field = "warn"
adding-required-field = "error"
ban-char-field = "warn"
prefer-timestamptz = "warn"
```

**Example Violations Squawk Catches:**

```sql
-- ❌ DANGEROUS: Adding NOT NULL without default (locks table)
ALTER TABLE finance.companies ADD COLUMN status TEXT NOT NULL;

-- ✅ SAFE: Add nullable first, then backfill, then add constraint
ALTER TABLE finance.companies ADD COLUMN status TEXT;
UPDATE finance.companies SET status = 'active' WHERE status IS NULL;
ALTER TABLE finance.companies ALTER COLUMN status SET NOT NULL;
```

```sql
-- ❌ DANGEROUS: Creating index without CONCURRENTLY (locks table)
CREATE INDEX idx_companies_tenant ON finance.companies(tenant_id);

-- ✅ SAFE: Use CONCURRENTLY
CREATE INDEX CONCURRENTLY idx_companies_tenant ON finance.companies(tenant_id);
```

**CI Integration:**
```bash
# Lint all migrations
squawk migrations/**/*.sql

# In CI pipeline
squawk --reporter=json migrations/**/*.sql > squawk-report.json
```

**NPM Script:**
```json
{
  "scripts": {
    "lint:migrations": "squawk migrations/**/*.sql"
  }
}
```

---

## 🟡 P1: High Value for Quality

### 3. plpgsql_check — PL/pgSQL Function Linter

> **Static analysis for PostgreSQL functions**

**What it does:**
- Finds errors in PL/pgSQL functions before runtime
- Detects unused variables, type mismatches
- Validates SQL inside functions
- Performance hints

**Installation:**
```sql
-- Via Supabase (available)
CREATE EXTENSION IF NOT EXISTS plpgsql_check;
```

**Usage:**
```sql
-- Check a specific function
SELECT * FROM plpgsql_check_function('my_function_name');

-- Check all functions
SELECT p.proname, plpgsql_check_function(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('kernel', 'finance', 'config')
  AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql');
```

---

### 4. index_advisor — Index Recommendations

> **Automatically suggests missing indexes**

**What it does:**
- Analyzes query patterns
- Recommends optimal indexes
- Identifies unused indexes
- Works with `EXPLAIN` plans

**Installation:**
```sql
-- Via Supabase (available)
CREATE EXTENSION IF NOT EXISTS index_advisor;
```

**Usage:**
```sql
-- Get index recommendations for a query
SELECT * FROM index_advisor(
  'SELECT * FROM finance.companies WHERE tenant_id = $1'
);
```

---

## 🟢 P2: Nice to Have

### 5. SQLFluff — SQL Style Linter

> **Enforces consistent SQL coding style**

**What it does:**
- Consistent formatting (indentation, case, etc.)
- Configurable rules
- Auto-fix capability
- Multi-dialect support

**Installation:**
```bash
pip install sqlfluff
```

**Configuration (`.sqlfluff`):**
```ini
[sqlfluff]
dialect = postgres
templater = raw

[sqlfluff:rules]
max_line_length = 120

[sqlfluff:rules:capitalisation.keywords]
capitalisation_policy = upper

[sqlfluff:rules:capitalisation.identifiers]
capitalisation_policy = lower
```

**Usage:**
```bash
# Lint
sqlfluff lint migrations/

# Auto-fix
sqlfluff fix migrations/
```

---

## 📋 Recommended MVP Implementation

### Phase 1: Add to Schema CI (Criterion #9)

```json
// apps/db/package.json
{
  "scripts": {
    "test:schema": "pg_prove -d $DATABASE_URL tests/schema/*.sql",
    "lint:migrations": "squawk migrations/**/*.sql",
    "lint:functions": "psql -c \"SELECT * FROM plpgsql_check_function_all()\"",
    "validate": "pnpm lint:migrations && pnpm test:schema"
  },
  "devDependencies": {
    "squawk-cli": "^1.0.0"
  }
}
```

### Phase 2: Create Test Files

```
apps/db/
├── tests/
│   ├── schema/
│   │   ├── 001_schemas_exist.sql
│   │   ├── 002_tenant_columns.sql
│   │   └── 003_roles_exist.sql
│   ├── constraints/
│   │   ├── 001_double_entry.sql
│   │   └── 002_immutability.sql
│   └── isolation/
│       └── 001_cross_tenant.sql
└── .squawk.toml
```

### Phase 3: CI Pipeline

```yaml
# .github/workflows/db-validate.yml
name: Database Validation

on:
  pull_request:
    paths:
      - 'apps/db/migrations/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - name: Install Squawk
        run: npm install -g squawk-cli
      
      - name: Lint Migrations
        run: squawk apps/db/migrations/**/*.sql
      
      - name: Run Migrations
        run: pnpm --filter @aibos/db migrate
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/postgres
      
      - name: Install pgTAP
        run: psql -c "CREATE EXTENSION pgtap"
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/postgres
      
      - name: Run Schema Tests
        run: pnpm --filter @aibos/db test:schema
```

---

## 🔧 Quick Start Commands

```bash
# Install tools
npm install -g squawk-cli

# Enable extensions (in PostgreSQL)
psql -c "CREATE EXTENSION pgtap"
psql -c "CREATE EXTENSION plpgsql_check"
psql -c "CREATE EXTENSION index_advisor"

# Lint migrations
squawk apps/db/migrations/**/*.sql

# Run schema tests
pg_prove -d aibos_local apps/db/tests/**/*.sql
```

---

## 📊 Tool Comparison

| Feature | pgTAP | Squawk | plpgsql_check | SQLFluff |
|---------|-------|--------|---------------|----------|
| **Type** | DB Extension | CLI | DB Extension | CLI |
| **Focus** | Unit Testing | Migration Safety | Function Linting | Style |
| **CI Ready** | ✅ | ✅ | ✅ | ✅ |
| **Auto-fix** | ❌ | ❌ | ❌ | ✅ |
| **PostgreSQL-specific** | ✅ | ✅ | ✅ | Multi-dialect |
| **Supabase Available** | ✅ | N/A (CLI) | ✅ | N/A (CLI) |

---

## ✅ Acceptance Criteria Alignment

| Tool | MVP Criterion | How It Helps |
|------|---------------|--------------|
| **pgTAP** | #3, #4, #5, #6 | Test isolation, double-entry, immutability |
| **Squawk** | #9 | Lint migrations in CI |
| **plpgsql_check** | #9 | Validate trigger/function code |
| **index_advisor** | Performance | Post-MVP optimization |

---

## 📚 References

- [pgTAP Documentation](https://pgtap.org/)
- [Squawk Documentation](https://squawkhq.com/docs/)
- [plpgsql_check](https://github.com/okbob/plpgsql_check)
- [index_advisor](https://github.com/supabase/index_advisor)
- [SQLFluff](https://sqlfluff.com/)

---

**Recommended for MVP:** pgTAP + Squawk  
**Post-MVP Additions:** plpgsql_check, index_advisor, SQLFluff
