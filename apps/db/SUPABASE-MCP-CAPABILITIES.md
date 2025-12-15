# Supabase MCP Capabilities Matrix

> **Generated:** 2025-01-27  
> **Purpose:** Map Supabase MCP tools to PostgreSQL management needs  
> **Reference:** [Supabase Database Documentation](https://supabase.com/docs/guides/database/overview)

---

## ⚖️ Architectural Context (ADR-003)

> **AI-BOS uses PostgreSQL-first architecture with provider adapters.**

| Layer | Scope | MCP Usage |
|-------|-------|-----------|
| **Core** | PostgreSQL-standard DDL | `apply_migration` (core) |
| **Adapter** | Supabase-specific optimizations | `apply_migration` (adapter), `get_advisors` |

The MCP tools are used for:
1. **Core migrations** — Portable PostgreSQL schema
2. **Adapter migrations** — Supabase-specific RLS, policies, indexes
3. **Observability** — Logs, advisors, monitoring

See: [ADR_003_DatabaseProviderPortability.md](./ADR_003_DatabaseProviderPortability.md)

---

## 🎯 Executive Summary

The Supabase MCP provides **comprehensive database management** capabilities for AI-BOS Finance. Below is a mapping of each documentation topic to available MCP tools.

| Category | MCP Coverage | Notes |
|----------|--------------|-------|
| **Schema Management** | ✅ Full | list_tables, apply_migration, execute_sql |
| **Security & RLS** | ✅ Full | get_advisors, apply_migration |
| **Performance** | ✅ Full | get_advisors (performance), get_logs |
| **Migrations** | ✅ Full | list_migrations, apply_migration |
| **Extensions** | ✅ Full | list_extensions |
| **Type Generation** | ✅ Full | generate_typescript_types |
| **Observability** | ✅ Full | get_logs (7 services) |
| **Edge Functions** | ✅ Full | list/get/deploy_edge_function |

---

## 📊 Detailed Capability Mapping

### Fundamentals

| Doc Topic | MCP Tool | Status | Example Usage |
|-----------|----------|--------|---------------|
| **Connecting to database** | `get_project_url`, `get_publishable_keys` | ✅ | Get connection URL |
| **Importing data** | `execute_sql` | ✅ | Run COPY commands |
| **Securing your data** | `get_advisors(security)` | ✅ | Security audit |

**Available Now:**
```
Project URL: https://cnlutbuzjqtuicngldak.supabase.co
```

---

### Working with Database (Basics)

| Doc Topic | MCP Tool | Status | Example Usage |
|-----------|----------|--------|---------------|
| **Managing tables, views, data** | `list_tables`, `execute_sql` | ✅ | List all tables with schemas |
| **Working with arrays** | `execute_sql` | ✅ | ARRAY operations |
| **Managing indexes** | `execute_sql`, `get_advisors(performance)` | ✅ | Index recommendations |
| **Querying joins** | `execute_sql` | ✅ | Complex queries |
| **JSON and unstructured data** | `execute_sql` | ✅ | JSONB operations |

**Current Tables Found:**
- `public.mdm_entity_catalog` (3 rows, RLS: ❌)
- `public.mdm_global_metadata` (10 rows, RLS: ❌)
- `public.mdm_lineage_edges` (0 rows, RLS: ❌)
- `public.mdm_lineage_nodes` (0 rows, RLS: ❌)
- `public.mdm_metadata_mapping` (0 rows, RLS: ❌)
- `public.mdm_naming_policy` (4 rows, RLS: ❌)

---

### Working with Database (Intermediate)

| Doc Topic | MCP Tool | Status | Example Usage |
|-----------|----------|--------|---------------|
| **Cascade deletes** | `apply_migration` | ✅ | ON DELETE CASCADE |
| **Managing enums** | `execute_sql`, `generate_typescript_types` | ✅ | Create/alter enums |
| **Database functions** | `apply_migration` | ✅ | CREATE FUNCTION |
| **Database triggers** | `apply_migration` | ✅ | CREATE TRIGGER |
| **Database webhooks** | `apply_migration` (via pg_net) | ✅ | HTTP calls |
| **Full Text Search** | `execute_sql` | ✅ | tsvector, tsquery |
| **Partitioning tables** | `apply_migration` | ✅ | PARTITION BY |
| **Managing connections** | `get_advisors(performance)` | ✅ | Connection strategy |
| **Event triggers** | `apply_migration` | ✅ | DDL events |

**Current Enums Found:**
- `approval_status` (pending, approved, rejected)
- `canon_status` (LOCKED, PENDING, DRAFT, etc.)
- `classification` (PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED)
- `criticality` (CRITICAL, HIGH, MEDIUM, LOW)
- `data_type_biz` (TEXT, NUMBER, MONEY, etc.)
- `entity_type` (table, view, api, screen, etc.)
- `lifecycle_status` (draft, active, deprecated)

---

### Access and Security

| Doc Topic | MCP Tool | Status | Example Usage |
|-----------|----------|--------|---------------|
| **Row Level Security** | `apply_migration`, `get_advisors(security)` | ✅ | CREATE POLICY |
| **Column Level Security** | `apply_migration` | ✅ | GRANT on columns |
| **Hardening Data API** | `get_advisors(security)` | ✅ | Security audit |
| **Custom Claims & RBAC** | `apply_migration` | ✅ | JWT claims |
| **Managing Postgres Roles** | `apply_migration` | ✅ | CREATE ROLE |
| **Custom Postgres Roles** | `apply_migration` | ✅ | Role permissions |
| **Managing secrets (Vault)** | `execute_sql` | ✅ | vault.secrets |
| **Superuser Access** | N/A | ⚠️ | Limited on Supabase |

**Current Security Advisories:**
1. ⚠️ **Leaked Password Protection Disabled** - Enable in Auth settings
   - [Remediation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

---

### Configuration, Optimization, and Testing

| Doc Topic | MCP Tool | Status | Example Usage |
|-----------|----------|--------|---------------|
| **Database configuration** | `execute_sql` | ✅ | SET commands |
| **Query optimization** | `get_advisors(performance)` | ✅ | Index recommendations |
| **Database Advisors** | `get_advisors(security/performance)` | ✅ | Automated linting |
| **Testing database** | `execute_sql` + pgTAP | ✅ | Unit tests |
| **Customizing Postgres config** | Limited | ⚠️ | Some via execute_sql |

**Current Performance Advisories:**
1. ⚠️ **Unindexed foreign keys** (3 issues)
   - `mdm_global_metadata.parent_dict_id_fkey`
   - `mdm_lineage_edges.from_node_id_fk`
   - `mdm_lineage_edges.to_node_id_fk`
   - [Remediation](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)

2. ⚠️ **Auth DB Connection Strategy** - Not percentage-based
   - [Remediation](https://supabase.com/docs/guides/deployment/going-into-prod)

---

### Debugging

| Doc Topic | MCP Tool | Status | Example Usage |
|-----------|----------|--------|---------------|
| **Timeouts** | `get_logs(postgres)` | ✅ | Check slow queries |
| **Debugging and monitoring** | `get_logs(*)` | ✅ | All service logs |
| **Performance issues** | `get_advisors(performance)` | ✅ | Auto-analysis |
| **Supavisor** | `get_logs(api)` | ✅ | Connection pooling |
| **Troubleshooting** | `get_logs(*)` | ✅ | All logs |

**Available Log Services:**
- `api` - API gateway logs
- `postgres` - Database logs
- `auth` - Authentication logs
- `storage` - Storage logs
- `edge-function` - Edge Function logs
- `realtime` - Realtime logs
- `branch-action` - Branch action logs

---

### Extensions

| Doc Topic | MCP Tool | Status | Available |
|-----------|----------|--------|-----------|
| **Extension management** | `list_extensions` | ✅ | Full catalog |

**Currently Installed Extensions:**
- ✅ `plpgsql` (1.0) - PL/pgSQL procedural language
- ✅ `pg_graphql` (1.5.11) - GraphQL support
- ✅ `uuid-ossp` (1.1) - UUID generation
- ✅ `pgcrypto` (1.3) - Cryptographic functions
- ✅ `pg_stat_statements` (1.11) - Query statistics
- ✅ `pg_cron` (1.6.4) - Scheduled jobs
- ✅ `supabase_vault` (0.3.1) - Secrets management

**Available but Not Installed (Relevant):**
- `pgTAP` (1.2.0) - Unit testing
- `pgAudit` (17.1) - Auditing
- `pgvector` (0.8.0) - Embeddings/AI
- `PostGIS` (3.3.7) - Geospatial
- `pg_net` (0.19.5) - Async HTTP
- `pg_jsonschema` (0.3.3) - JSON validation
- `index_advisor` (0.2.0) - Index recommendations
- `hypopg` (1.4.1) - Hypothetical indexes
- `plpgsql_check` (2.7) - PL/pgSQL linter

---

### Migrations

| Doc Topic | MCP Tool | Status | Example Usage |
|-----------|----------|--------|---------------|
| **List migrations** | `list_migrations` | ✅ | View history |
| **Apply migration** | `apply_migration` | ✅ | DDL changes |

**Current Migrations (23 total):**
```
20251127201230 - create_invoice_storage_integration
20251127203631 - 017_add_multi_tenant_support_and_rls
20251127204109 - 018_optimize_rls_performance
20251130023007 - create_kernel_tenants
... (19 more)
```

---

### Edge Functions

| Doc Topic | MCP Tool | Status | Example Usage |
|-----------|----------|--------|---------------|
| **List functions** | `list_edge_functions` | ✅ | Inventory |
| **Get function code** | `get_edge_function` | ✅ | View source |
| **Deploy function** | `deploy_edge_function` | ✅ | Deploy code |

**Current Edge Functions:** None deployed

---

### Development Branches

| Doc Topic | MCP Tool | Status | Example Usage |
|-----------|----------|--------|---------------|
| **Create branch** | `create_branch` | ✅ | Development env |
| **List branches** | `list_branches` | ✅ | View all |
| **Merge branch** | `merge_branch` | ✅ | To production |
| **Delete branch** | `delete_branch` | ✅ | Cleanup |
| **Reset branch** | `reset_branch` | ✅ | Reset migrations |
| **Rebase branch** | `rebase_branch` | ✅ | Update from prod |

---

### Type Safety

| Doc Topic | MCP Tool | Status | Example Usage |
|-----------|----------|--------|---------------|
| **Generate TypeScript types** | `generate_typescript_types` | ✅ | Type-safe client |

**Generated Types Available for:**
- 6 tables in `public` schema
- 11 enums defined
- Full Row/Insert/Update types
- Relationship mappings

---

## 🔧 MCP Tools Quick Reference

### Schema & Data
```
list_tables({ schemas: ["public", "kernel", "finance"] })
execute_sql({ query: "SELECT * FROM ..." })
apply_migration({ name: "my_migration", query: "CREATE TABLE ..." })
list_migrations()
```

### Security & Advisors
```
get_advisors({ type: "security" })
get_advisors({ type: "performance" })
```

### Observability
```
get_logs({ service: "postgres" })
get_logs({ service: "auth" })
get_logs({ service: "api" })
```

### Edge Functions
```
list_edge_functions()
get_edge_function({ function_slug: "my-function" })
deploy_edge_function({ name: "...", files: [...] })
```

### Branches
```
create_branch({ name: "develop", confirm_cost_id: "..." })
list_branches()
merge_branch({ branch_id: "..." })
```

### Type Generation
```
generate_typescript_types()
```

### Project Info
```
get_project_url()
get_publishable_keys()
```

---

## ⚠️ Gaps & Manual Tasks

### Not Available via MCP (Requires Dashboard/CLI):

1. **Storage Management** - Buckets, policies (use Supabase Dashboard)
2. **Auth Configuration** - Providers, templates (use Supabase Dashboard)
3. **Realtime Configuration** - Policies, quotas (use Supabase Dashboard)
4. **Project Settings** - Region, size, billing (use Supabase Dashboard)
5. **Custom Domains** - DNS, SSL (use Supabase Dashboard)
6. **Backup/Restore** - Point-in-time recovery (use Supabase Dashboard)
7. **Replication** - Read replicas (use Supabase Dashboard)

### Requires `execute_sql` (No Dedicated Tool):

1. **Create/Alter Tables** - Use `apply_migration` instead
2. **Create Indexes** - Use `apply_migration` 
3. **Create Functions/Triggers** - Use `apply_migration`
4. **Manage Roles** - Use `apply_migration`
5. **RLS Policies** - Use `apply_migration`

---

## ✅ Recommended Workflow

1. **Development:**
   ```
   create_branch → develop features → merge_branch
   ```

2. **Schema Changes:**
   ```
   apply_migration → list_migrations → generate_typescript_types
   ```

3. **Security Audit:**
   ```
   get_advisors(security) → fix issues → re-audit
   ```

4. **Performance Tuning:**
   ```
   get_advisors(performance) → add indexes → verify with get_logs
   ```

5. **Debugging:**
   ```
   get_logs(postgres) → analyze → fix
   ```

---

## 📚 References

- [Supabase Database Docs](https://supabase.com/docs/guides/database/overview)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Database Advisors](https://supabase.com/docs/guides/database/database-advisors)
- [Extensions](https://supabase.com/docs/guides/database/extensions)

---

**Generated by:** AI-BOS Data Fabric Team  
**MCP Version:** Supabase MCP (latest)
