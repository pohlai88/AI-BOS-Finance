# Performance Baselines (v1.0.0-mvp)

**Date:** 2025-12-14  
**Tool:** autocannon (Node.js)  
**Environment:** Local Development Mode (`next dev` — uncompiled)

---

## Test Configuration

```yaml
Stack:
  - Kernel: Next.js 16 on port 3001 (dev mode)
  - Postgres: 15-alpine on port 5433
  - Payment Hub Cell: Express on port 4000

Load Profile:
  - Concurrent Connections: 10
  - Duration: 10 seconds
```

---

## 1. System Health Check (Baseline)

**Target:** Functional Verification (Dev Mode)

| Metric | Result | Notes |
|--------|--------|-------|
| **Concurrent Connections** | 10 | |
| **Duration** | 10s | |
| **Total Requests** | 278 | No failures |
| **Throughput (Avg)** | 26.8 req/s | Constrained by Dev Mode |
| **Latency (Avg)** | 355 ms | |
| **Latency (p50)** | 320 ms | |
| **Latency (p97.5)** | 604 ms | |
| **Latency (p99)** | 809 ms | |
| **Latency (Max)** | 915 ms | |

---

## 2. High Concurrency Test (100 connections)

**Purpose:** Stress test to find limits

| Metric | Result | Notes |
|--------|--------|-------|
| **Concurrent Connections** | 100 | |
| **Total Requests** | 238 | 39 non-2xx (rate limited) |
| **Throughput (Avg)** | 23.8 req/s | |
| **Latency (Avg)** | 3,629 ms | Dev mode bottleneck |
| **Latency (p97.5)** | 4,792 ms | |

---

## Analysis

> **Dev Mode Performance:** These benchmarks reflect the `next dev` environment which compiles TypeScript on-the-fly. Production builds (`next build && next start`) are expected to perform **10-20x faster**.

| Environment | Expected p95 | Expected Throughput |
|-------------|--------------|---------------------|
| Dev Mode (`next dev`) | 500-800ms | 20-30 req/s |
| Production (`next start`) | <50ms | 500+ req/s |

---

## How to Run

```bash
# Prerequisites
docker-compose up -d
pnpm seed:happy-path

# Run load test (Node-native)
npx autocannon -c 10 -d 10 http://localhost:3001/api/health

# High concurrency stress test
npx autocannon -c 100 -d 10 http://localhost:3001/api/health
```

---

## Historical Baselines

| Version | Date | p99 Health | Throughput | Environment |
|---------|------|------------|------------|-------------|
| 1.0.0-mvp | 2025-12-14 | 809ms | 26.8 req/s | Dev Mode |
