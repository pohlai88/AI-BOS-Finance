# Changelog — AI-BOS Kernel

> **AI-BOS Kernel** — The Identity-to-Evidence Control Plane powering AI-BOS products.

All notable changes will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0-mvp] - 2025-12-15

### 🚀 Released
**AI-BOS Kernel v1.0.0-mvp** — Control Plane for AI-BOS Finance

The Identity-to-Evidence Control Plane powering **AI-BOS Finance**. Governs access to Canons, produces evidence, and makes integrations deterministic.

### ✨ Features
- **Persistence:** Postgres 15 adapter implementation (replacing in-memory)
- **Multi-tenant IAM:** User/Role management with strict tenant isolation
- **RBAC Enforcement:** Permission-based access control at Gateway + Event Bus
- **Service Registry:** Canon registration + route mappings
- **API Gateway:** Tenant-aware proxy with RBAC and correlation ID propagation
- **Event Bus:** Standard event envelope with cross-tenant protection
- **Audit Trail:** Comprehensive logging including DENY events with full context
- **Resilience:** Circuit-breaking health checks for Cells
- **Orchestration:** Reference `cell-payment-hub` implementation (Finance domain)

### 🔒 Security
- **Hardened:** `POST /events/publish` requires JWT and `kernel.event.publish` permission
- **Hardened:** Strict UUID validation for Tenant IDs and Correlation IDs
- **Hardened:** Cross-tenant injection detection with security audit logging
- **Hardened:** Security headers (X-Content-Type-Options, X-Frame-Options, CORS)
- **Hardened:** Bootstrap key protection for initial user setup

### 📚 Documentation
- **README.md:** Zero to Hero quickstart (5 minutes)
- **ARCHITECTURE.md:** Mental model (Canon → Molecule → Cell hierarchy)
- **cell-integration-guide.md:** Builder's manual for Cell developers
- **TROUBLESHOOTING.md:** Common issues and diagnostics
- **openapi.yaml:** Full API specification (OpenAPI 3.0)

### 🛠 Infrastructure
- Docker Compose orchestration (Kernel + Postgres + Payment Hub Cell)
- 13 SQL migrations for complete schema
- Seed scripts for instant developer setup
- E2E integration tests (11/11 passing)
- k6 load testing scripts

### ⚠️ Known Limitations (MVP)
- Single-process only (no horizontal scaling)
- Manual tenant creation (via seed/SQL)
- No rate limiting (planned for v1.1.0)
- In-memory event bus (Redis planned for v1.1.0)

---

## [0.1.0] - 2025-12-01

### 🏗 Initial Development
- Project scaffolding
- Hexagonal architecture foundation
- In-memory adapters for rapid prototyping
