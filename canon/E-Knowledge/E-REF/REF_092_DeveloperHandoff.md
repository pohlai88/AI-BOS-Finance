> **🟢 [ACTIVE]** — Canon Reference  
> **Canon Code:** REF_092  
> **Plane:** E — Knowledge (Reference)  
> **Related:** CONT_01_CanonIdentity, REF_088_QuickStartGuide, REF_081_SchemaFirstArchitecture  
> **Source:** `src/docs/04-guides/developer-handoff.md`  
> **Date:** 2025-01-27

---

# REF_092: Developer Handoff Document

**Purpose:** Complete handoff documentation for NexusCanon Forensic Financial Data Governance Platform  
**Handoff Date:** December 6, 2025  
**Frontend Version:** 2.4  
**Status:** Ready for Backend Integration  
**Project Type:** High-End SaaS Landing Page  
**Last Updated:** 2025-01-27

---

## 1. Executive Summary

The NexusCanon frontend is a **production-ready** React + TypeScript application implementing a "Crystallized Nexus" forensic terminal aesthetic. The design prioritizes:

- **Psychological Engagement:** Spinozan Belief + Direct Perception principles
- **Financial Compliance:** All text ≥12px, no blur effects on text
- **Terminal UX:** Bloomberg-style command center, not consumer marketing
- **Full Responsiveness:** Desktop-first with mobile optimization

**What's Complete:**
- ✅ Full landing page layout (Hero → Logic Kernel → Sections)
- ✅ 2-layer HUD header with animated logo
- ✅ Command Palette (Cmd+K) with mock data
- ✅ Forensic terminal animation (5 financial modules)
- ✅ Design system and typography tokens
- ✅ All components documented

**What's Needed:**
- 🔲 Backend API integration
- 🔲 Authentication system
- 🔲 Real-time websocket for scans
- 🔲 Database schema for forensic data
- 🔲 Deployment pipeline

---

## 2. Quick Start Guide

### 2.1 Prerequisites
```bash
Node.js: v18+ (LTS recommended)
Package Manager: npm or yarn
Code Editor: VS Code (recommended)
```

### 2.2 Installation

```bash
# Clone repository
git clone [REPO_URL]
cd nexuscanon-frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
http://localhost:5173
```

### 2.3 Available Scripts

```bash
npm run dev          # Start dev server (Vite)
npm run build        # Production build
npm run preview      # Preview production build
npm run type-check   # TypeScript validation
npm run lint         # ESLint check
```

---

## 3. Project Structure

```
nexuscanon-frontend/
├── public/                      # Static assets
├── src/
│   ├── App.tsx                  # Main entry point (default export)
│   ├── main.tsx                 # React mount point
│   ├── components/
│   │   ├── landing/
│   │   │   ├── Header.tsx              # 2-layer HUD header
│   │   │   ├── CommandPalette.tsx      # Cmd+K search terminal
│   │   │   ├── HeroSection.tsx         # Full-screen hero
│   │   │   ├── LogicKernelSection.tsx  # Forensic terminal animation
│   │   │   └── ...                     # Other landing sections
│   │   └── figma/
│   │       └── ImageWithFallback.tsx   # Protected system component
│   ├── imports/                 # Figma-imported assets (SVGs)
│   └── styles/
│       └── globals.css          # Typography tokens + Tailwind config
├── docs/                        # COMPLETE DOCUMENTATION
│   ├── 01-foundations/          # Design & Brand
│   ├── 02-architecture/         # Architecture & Tech Specs
│   ├── 03-features/             # Feature Completion
│   └── 04-guides/               # Guides & Manuals
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 4. Technology Stack Deep Dive

### 4.1 Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18+ | UI framework |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | 4.0 | Styling system |
| Vite | 5+ | Build tool |
| Motion | Latest | Animations (Framer Motion successor) |

### 4.2 Key Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "motion": "latest",
    "lucide-react": "latest",
    "recharts": "latest",
    "sonner": "2.0.3",
    "react-hook-form": "7.55.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "tailwindcss": "^4.0.0"
  }
}
```

---

## 5. Backend Integration Points

### 5.1 Priority 1: Authentication

**Component:** `Header.tsx` → Terminal Access Button

**Backend Integration:**
```tsx
const handleSignIn = async () => {
  try {
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const { token, user } = await response.json();
    localStorage.setItem('nexuscanon_token', token);
    window.location.href = '/dashboard';
  } catch (error) {
    toast.error('Authentication failed');
  }
};
```

**API Endpoint Required:**
```
POST /api/auth/signin
Body: { email: string, password: string }
Response: { token: string, user: User }
```

### 5.2 Priority 2: Command Palette Data

**Component:** `CommandPalette.tsx`

**Backend Integration:**
```tsx
import { useQuery } from '@tanstack/react-query';

const CommandPalette = () => {
  const { data: commands } = useQuery({
    queryKey: ['commands'],
    queryFn: () => fetch('/api/commands').then(r => r.json())
  });
  // ...
};
```

**API Endpoints Required:**
```
GET /api/commands
Response: Command[]

GET /api/forensic-scans/recent?limit=10
Response: Hash[]
```

### 5.3 Priority 3: Forensic Scans (Real-Time)

**Component:** `LogicKernelSection.tsx`

**Backend Integration:** WebSocket for live updates

```tsx
useEffect(() => {
  const ws = new WebSocket('wss://api.nexuscanon.com/scans/live');
  ws.onmessage = (event) => {
    const update: ModuleStatus = JSON.parse(event.data);
    setModuleStates(prev => 
      prev.map(m => 
        m.module === update.module ? update : m
      )
    );
  };
  return () => ws.close();
}, []);
```

---

## 6. Environment Configuration

### 6.1 Environment Variables

Create `.env` file in root:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.nexuscanon.com
NEXT_PUBLIC_WS_BASE_URL=wss://api.nexuscanon.com

# Authentication
NEXT_PUBLIC_AUTH_TOKEN_KEY=nexuscanon_auth_token

# Feature Flags
NEXT_PUBLIC_ENABLE_COMMAND_PALETTE=true
NEXT_PUBLIC_ENABLE_LIVE_SCANS=true
```

---

## 7. Database Schema Recommendations

### 7.1 Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'VIEWER',
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);
```

### 7.2 Forensic Scans Table

```sql
CREATE TABLE forensic_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  hash VARCHAR(255) UNIQUE NOT NULL,
  label VARCHAR(255),
  status VARCHAR(50) DEFAULT 'PENDING',
  period VARCHAR(50),
  depth VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

---

## 8. API Endpoints Specification

### 8.1 Authentication

```
POST /api/auth/signin
Body: { email: string, password: string }
Response: { token: string, user: User }
Status: 200 (success), 401 (invalid credentials)

POST /api/auth/signout
Headers: Authorization: Bearer {token}
Response: { success: boolean }
Status: 200

GET /api/auth/me
Headers: Authorization: Bearer {token}
Response: { user: User }
Status: 200 (authenticated), 401 (not authenticated)
```

### 8.2 Commands

```
GET /api/commands
Headers: Authorization: Bearer {token}
Response: Command[]
Status: 200

POST /api/commands/execute
Headers: Authorization: Bearer {token}
Body: { commandId: string, context?: object }
Response: { success: boolean, message: string }
Status: 200 (success), 400 (invalid command)
```

### 8.3 Forensic Scans

```
GET /api/forensic-scans/recent?limit=10
Headers: Authorization: Bearer {token}
Response: Hash[]
Status: 200

POST /api/scans/start
Headers: Authorization: Bearer {token}
Body: {
  modules: string[],
  period: string,
  depth: 'FULL' | 'QUICK'
}
Response: {
  scanId: string,
  websocketUrl: string
}
Status: 201 (created), 400 (invalid request)
```

---

## 9. Testing Requirements

### 9.1 Unit Tests (Recommended)

**Tool:** Vitest + React Testing Library

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### 9.2 E2E Tests (Recommended)

**Tool:** Playwright

```bash
npm install -D @playwright/test
```

---

## 10. Deployment Guide

### 10.1 Build Process

```bash
# Production build
npm run build

# Output directory
dist/
```

### 10.2 Deployment Platforms

**Option 1: Vercel (Recommended)**
```bash
npm i -g vercel
vercel
vercel --prod
```

**Option 2: Netlify**
```bash
npm i -g netlify-cli
netlify deploy
netlify deploy --prod
```

---

## 11. Security Considerations

### 11.1 Token Storage

**DO:**
```tsx
const token = localStorage.getItem('nexuscanon_auth_token');
fetch('/api/protected', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**DON'T:**
- Don't store sensitive data in localStorage without encryption
- Don't trust client-side token validation

### 11.2 API Security

**CORS Configuration (Backend):**
```javascript
app.use(cors({
  origin: 'https://nexuscanon.com',
  credentials: true
}));
```

**Rate Limiting:**
```
POST /api/auth/signin → 5 requests/minute/IP
GET /api/commands → 100 requests/minute/user
WSS /scans/live → 1 connection/user
```

---

## 12. Known Issues & Limitations

### 12.1 Current Limitations

1. **No Backend Integration:**
   - All data is mocked
   - No real authentication
   - No persistent state

2. **Command Palette:**
   - Search filtering is client-side only
   - No command execution logic
   - Keyboard navigation (↑↓) not implemented

3. **Logic Kernel Animation:**
   - Mock animation loop
   - No real forensic scanning
   - Progress is simulated

---

## 13. Handoff Checklist

### 13.1 Pre-Handoff (Frontend Team)

- [x] All components implemented
- [x] Design system documented
- [x] TypeScript types defined
- [x] Mock data created
- [x] Responsive design tested
- [x] Accessibility audit (WCAG 2.1 AA)
- [x] Performance baseline established
- [x] Documentation complete

### 13.2 Backend Team Tasks

- [ ] Review API endpoint specifications
- [ ] Implement authentication system
- [ ] Create database schema
- [ ] Build WebSocket server for live scans
- [ ] Setup CORS and security headers
- [ ] Deploy staging environment
- [ ] Provide API documentation (Swagger/OpenAPI)

### 13.3 Integration Phase

- [ ] Replace mock data with API calls
- [ ] Implement error handling
- [ ] Add loading states
- [ ] Setup state management (Zustand/React Query)
- [ ] Configure environment variables
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security audit

---

## 14. Next Steps

### 14.1 Immediate (Week 1)

1. **Backend Team:**
   - Review all documentation
   - Setup development environment
   - Create database schema
   - Implement authentication endpoints

2. **Frontend Team:**
   - Support integration questions
   - Prepare API client utilities
   - Setup staging environment

### 14.2 Short Term (Week 2-4)

1. **Integration:**
   - Connect Command Palette to backend
   - Implement authentication flow
   - Setup WebSocket connections
   - Replace all mock data

2. **Testing:**
   - Write integration tests
   - Perform load testing
   - Security audit
   - Cross-browser testing

---

**Last Updated:** 2025-01-27  
**Status:** 🟢 Active  
**Related Documents:** REF_088_QuickStartGuide, REF_081_SchemaFirstArchitecture, REF_075_DesignSystem  
**Document Version:** 1.0  
**Prepared by:** Frontend Development Team  
**Status:** Ready for Backend Integration
