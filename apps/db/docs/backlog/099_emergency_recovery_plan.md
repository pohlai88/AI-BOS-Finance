# 🆘 Disaster Recovery & Emergency Restore Plan

> **Canon Code:** BACKLOG_099  
> **Status:** 📋 BACKLOG (v1.4.0)  
> **Priority:** P1 for compliance  
> **Created:** 2025-12-15  
> **RTO Target:** < 15 minutes  
> **RPO Target:** < 1 minute

---

## 1. Overview

This document defines the Disaster Recovery (DR) strategy for AI-BOS Data Fabric, ensuring business continuity and compliance with SOC2/HIPAA requirements.

### Recovery Objectives

| Metric | Target | Rationale |
|--------|--------|-----------|
| **RTO** (Recovery Time Objective) | < 15 minutes | Minimize business disruption |
| **RPO** (Recovery Point Objective) | < 1 minute | Minimal data loss |
| **Game Day Frequency** | Quarterly | Validate recovery procedures |

---

## 2. Disaster Scenarios & Playbooks

### Scenario Matrix

| Scenario | Severity | Detection | Recovery Action | RTO Goal |
|----------|----------|-----------|-----------------|----------|
| **Accidental Table Drop** | 🔴 High | Alert on schema change | PITR to 1 min before drop | 10 mins |
| **Bad Migration** | 🟡 Medium | CI/CD failure or error logs | Rollback migration | 5 mins |
| **Data Corruption** | 🔴 Critical | Data integrity check failure | Restore to new instance | 30 mins |
| **Region Failure** | ⚫ Catastrophic | Cloud provider status | Failover to secondary region | 2 mins |
| **Ransomware Attack** | ⚫ Catastrophic | Security alert | Restore from isolated backup | 60 mins |

---

## 3. Recovery Procedures

### 3.1 Point-in-Time Recovery (PITR)

**Supabase (Production):**

```bash
# Option 1: Via Supabase Dashboard
# Navigate to: Settings → Database → Point-in-Time Recovery
# Select target timestamp and confirm

# Option 2: Via Supabase MCP (if available)
# Use Supabase dashboard for now - CLI PITR not yet supported

# Option 3: Contact Supabase Support
# For enterprise plans, contact support for assisted recovery
```

**Self-Hosted (Docker):**

```bash
#!/bin/bash
# scripts/emergency-restore.sh
# USAGE: ./emergency-restore.sh "2025-12-15 14:30:00+00"

TIMESTAMP=$1
echo "⚠️  WARNING: You are about to RESET the database to $TIMESTAMP"
echo "    This will DESTROY all data created after this time."
read -p "Type 'DESTROY' to confirm: " CONFIRM

if [ "$CONFIRM" != "DESTROY" ]; then
  echo "Aborted."
  exit 1
fi

# 1. Stop Application Connections
docker-compose stop app

# 2. Terminate Active DB Connections
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='aibos' AND pid <> pg_backend_pid();"

# 3. Restore from WAL Archive (requires pgBackRest or WAL-G setup)
# pgbackrest --stanza=aibos --type=time --target="$TIMESTAMP" --delta restore

echo "✅ Restoration initiated. Verify data and restart services."
```

### 3.2 Migration Rollback

```bash
# If a bad migration was applied, rollback to previous state
pnpm migrate:down --to <previous_version>

# Example: Rollback last migration
pnpm migrate:down --steps 1

# Verify schema state
pnpm validate
```

### 3.3 Full Instance Restoration

For critical failures requiring complete database rebuild:

```bash
# 1. Create new Supabase project (or restore backup)
npx supabase projects create ai-bos-recovery

# 2. Restore from backup
# Via Dashboard: Settings → Database → Backups → Restore

# 3. Verify data integrity
pnpm verify:integrity

# 4. Update DNS/connection strings
# Update NEXT_PUBLIC_SUPABASE_URL and DATABASE_URL

# 5. Validate application connectivity
pnpm test:connection
```

---

## 4. Backup Strategy

### 4.1 Supabase Managed Backups

| Tier | Backup Frequency | Retention | PITR |
|------|------------------|-----------|------|
| Free | Daily | 7 days | ❌ No |
| Pro | Daily | 7 days | ✅ Yes (7 days) |
| Team | Daily | 14 days | ✅ Yes (14 days) |
| Enterprise | Daily | 30 days | ✅ Yes (30 days) |

### 4.2 Additional Backup Recommendations

```yaml
# Recommended backup strategy for production
backup_strategy:
  primary:
    provider: supabase_managed
    frequency: daily
    retention: 30_days
    pitr: enabled

  secondary:
    type: logical_backup
    tool: pg_dump
    frequency: weekly
    storage: s3_encrypted
    retention: 90_days

  compliance:
    audit_logs:
      retention: 7_years  # SOC2/HIPAA requirement
      storage: cold_storage
```

---

## 5. Game Day Drill Procedure

### 5.1 Quarterly Fire Drill

**Objective:** Validate that actual RTO meets target (<15 minutes)

**Procedure:**

```markdown
## Pre-Drill Checklist
- [ ] Schedule maintenance window with stakeholders
- [ ] Create staging/test environment for drill
- [ ] Notify on-call team of drill
- [ ] Prepare stopwatch for timing

## Drill Steps
1. [ ] Create branch database: `npx supabase branches create dr-drill`
2. [ ] Document current data state (row counts, checksums)
3. [ ] Simulate disaster (delete table, corrupt data, etc.)
4. [ ] START TIMER
5. [ ] Execute recovery procedure
6. [ ] Verify data integrity (compare checksums)
7. [ ] STOP TIMER
8. [ ] Document actual recovery time

## Post-Drill Actions
- [ ] Record actual RTO vs target
- [ ] Identify bottlenecks
- [ ] Update runbook with lessons learned
- [ ] Report to compliance team
```

### 5.2 Drill Scenarios (Rotate Quarterly)

| Quarter | Scenario | Target |
|---------|----------|--------|
| Q1 | Accidental table drop | PITR recovery |
| Q2 | Bad migration rollback | Schema restoration |
| Q3 | Full database restore | Instance recovery |
| Q4 | Regional failover | Multi-region test |

---

## 6. Monitoring & Alerting

### 6.1 Recovery-Related Alerts

| Alert | Trigger | Action |
|-------|---------|--------|
| **Backup Failed** | Daily backup job failure | Investigate immediately |
| **Replication Lag > 60s** | Read replica behind | Check replica health |
| **Connection Pool Exhausted** | Pool at 100% | Scale or kill queries |
| **Schema Change Detected** | DDL executed | Verify authorized change |

### 6.2 Supabase Monitoring

```sql
-- Check backup status (via Supabase Dashboard)
-- Settings → Database → Backups

-- Check replication status (if read replicas configured)
SELECT * FROM pg_stat_replication;

-- Check connection status
SELECT count(*) AS active_connections 
FROM pg_stat_activity 
WHERE state = 'active';
```

---

## 7. Compliance Requirements

### 7.1 SOC2 Type II

| Control | Requirement | Evidence |
|---------|-------------|----------|
| **CC7.4** | Recovery procedures tested | Quarterly drill reports |
| **CC7.5** | Backup verification | Restore test logs |
| **CC9.1** | Business continuity plan | This document |

### 7.2 HIPAA Security Rule

| Requirement | Implementation |
|-------------|----------------|
| § 164.308(a)(7)(i) | Contingency plan (this document) |
| § 164.308(a)(7)(ii)(A) | Data backup plan (Supabase managed) |
| § 164.308(a)(7)(ii)(B) | Disaster recovery plan (this document) |
| § 164.308(a)(7)(ii)(D) | Testing and revision (quarterly drills) |

---

## 8. Contacts & Escalation

### On-Call Rotation

| Role | Primary | Secondary |
|------|---------|-----------|
| Database | DBA Lead | Platform Lead |
| Security | Security Officer | CTO |
| Compliance | Compliance Lead | Legal |

### External Contacts

| Provider | Support Channel | SLA |
|----------|----------------|-----|
| Supabase | support@supabase.io | 4 hours (Pro), 1 hour (Enterprise) |
| AWS (if BYOS) | AWS Support Console | Per plan |

---

## 9. Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-15 | Initial creation |

---

**Reviewed By:** AI-BOS Data Fabric Team  
**Approved By:** (Pending)  
**Next Review:** 2026-03-15
