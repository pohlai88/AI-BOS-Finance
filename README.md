> **🟢 [ACTIVE]** — Project Overview  
> **Project:** NexusCanon  
> **Version:** 2.4.1  
> **Location:** `./` (Root)  
> **SSOT:** [`canon/A-Governance/A-CONT/CONT_01_CanonIdentity.md`](./canon/A-Governance/A-CONT/CONT_01_CanonIdentity.md) — Canon Identity Contract  
> **Last Updated:** 2025-12-11

---

# NexusCanon v2.4.1 — Forensic Data Governance

> A **dark-first**, **mobile-responsive**, **test-verified** forensic data platform built with React, SAP CDS, and SQLite.

```
┌──────────────────────────────────────────────────────────────────┐
│  NEXUSCANON — The Ghost Has a Body                               │
│                                                                  │
│  Frontend: React + Vite (Port 3000)                              │
│  Backend:  SAP CDS + OData (Port 4004)                           │
│  Database: SQLite (db.sqlite)                                    │
│  Tests:    Vitest (7/7 passing)                                  │
│  Docs:     Storybook (Port 6006)                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start Backend (Terminal 1)
npm run dev:backend
# → API running at http://localhost:4004/odata/v4/forensic

# 3. Start Frontend (Terminal 2)
npm run dev
# → App running at http://localhost:3000

# 4. (Optional) Start Storybook
npm run storybook
# → Component docs at http://localhost:6006
```

---

## 📁 Architecture

```
nexuscanon/
├── src/                          # 🎨 FRONTEND (React)
│   ├── components/
│   │   ├── nexus/                # Design System atoms (NexusCard, NexusButton)
│   │   ├── metadata/             # Data components (SuperTable, GodView)
│   │   ├── landing/              # Landing page components
│   │   └── dashboard/            # Dashboard widgets
│   ├── pages/                    # Route pages
│   ├── styles/globals.css        # 🎯 DESIGN TOKENS (Single Source)
│   └── test/                     # Test setup
│
├── srv/                          # 🔌 BACKEND (SAP CDS)
│   ├── service.cds               # OData service definition
│   └── service.cjs               # Business logic (lockPeriod, etc.)
│
├── db/                           # 🗄️ DATABASE
│   ├── schema.cds                # Entity definitions (Ledger, AccessLog)
│   └── data/                     # Seed data (CSV files)
│
├── db.sqlite                     # SQLite database file
├── vite.config.ts                # Vite + Proxy config
└── package.json                  # Scripts & CDS config
```

---

## 🎨 Design System: The Forensic Aesthetic

All visual decisions flow from **CSS Variables** in `src/styles/globals.css`:

| Token | Value | Usage |
|-------|-------|-------|
| `--nexus-void` | `#0a0a0a` | Primary background |
| `--nexus-matter` | `#111111` | Card backgrounds |
| `--nexus-structure` | `#1a1a1a` | Borders, dividers |
| `--nexus-signal` | `#a3a3a3` | Primary text |
| `--nexus-noise` | `#737373` | Secondary text |
| `--nexus-green` | `#22c55e` | Accent (≤5% usage) |

### Typography

| Class | Font | Usage |
|-------|------|-------|
| `font-sans` | Inter | Headings, body |
| `font-mono` | JetBrains Mono | Data, codes, labels |

### Components (Source of Truth)

| Component | Location | Purpose |
|-----------|----------|---------|
| `NexusCard` | `src/components/nexus/NexusCard.tsx` | Container with 1px borders |
| `NexusButton` | `src/components/nexus/NexusButton.tsx` | Wireframe buttons |
| `NexusInput` | `src/components/nexus/NexusInput.tsx` | Form inputs |
| `SuperTable` | `src/components/metadata/SuperTable.tsx` | Data grid (mobile-responsive) |

**Rule:** No component may use hardcoded colors. Use `text-nexus-*` and `bg-nexus-*` classes only.

---

## 🔌 Data Flow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   React     │      │   Vite      │      │   CDS       │
│   App       │─────►│   Proxy     │─────►│   OData     │
│             │      │   /odata    │      │   API       │
└─────────────┘      └─────────────┘      └──────┬──────┘
                                                  │
                                          ┌──────▼──────┐
                                          │   SQLite    │
                                          │   db.sqlite │
                                          └─────────────┘
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/odata/v4/forensic/MasterLedger` | Fetch all records |
| POST | `/odata/v4/forensic/lockPeriod` | Lock records by ID |

### Database Schema

```sql
-- nexus.canon.Ledger
ID           UUID PRIMARY KEY
entity_code  VARCHAR(50)    -- "US_HOLDING_CORP"
class        VARCHAR(20)    -- "TRANSACTION" | "VALUATION" | "ADJUSTMENT"
amount       DECIMAL(15,2)
currency     VARCHAR(3)
status       VARCHAR(10)    -- "PENDING" | "LOCKED" | "FLAGGED"
block_hash   VARCHAR(64)
createdAt    DATETIME
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Coverage report
npm run test:coverage
```

### Test Coverage

| Component | Tests | Status |
|-----------|-------|--------|
| `StabilitySimulation` | 4 | ✅ Passing |

### Testing Philosophy

1. **Logic tests** verify behavior without rendering
2. **Time travel** using `vi.useFakeTimers()` for animations
3. **Mocked dependencies** for `motion/react`

---

## 📚 Storybook

Visual documentation for all design system components.

```bash
npm run storybook
# → http://localhost:6006
```

### Component Stories

| Category | Components |
|----------|------------|
| `Forensic/Atoms` | NexusCard, NexusButton, NexusInput |

---

## 📝 Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite frontend (port 3000) |
| `npm run dev:backend` | Start CDS backend (port 4004) |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Format with Prettier |
| `npm run test` | Run Vitest |
| `npm run storybook` | Start Storybook |

---

## 🔐 Security Notes

- Database file (`db.sqlite`) is **gitignored**
- No secrets in codebase
- CDS uses mocked auth in development
- CORS handled via Vite proxy

---

## 📈 Evolution Log

| Version | Milestone |
|---------|-----------|
| v2.4.0 | Forensic Design System established |
| v2.4.1 | Backend wired, Neural Link active |

---

## 🧭 Navigation

| Route | Page | Description |
|-------|------|-------------|
| `/` | LandingPage | Public landing |
| `/dashboard` | MetadataGodView | Forensic data table |

---

## 🤝 Contributing

1. **Design:** All new components must use `NexusCard` or `nexus-*` tokens
2. **Data:** No mock data in components; fetch from API
3. **Tests:** New logic requires unit tests
4. **Docs:** New components require Storybook stories

---

## 📜 License

Private. NexusCanon © 2024.
