> **🟢 [ACTIVE]** — Canon Reference  
> **Canon Code:** REF_093  
> **Plane:** E — Knowledge (Reference)  
> **Related:** CONT_01_CanonIdentity, REF_080_TechnicalRegister, REF_094_MetaSeriesCompletion  
> **Source:** `src/docs/03-features/reg-series-completion.md`  
> **Date:** 2025-01-27

---

# REF_093: Frontend Completion Pack – REG Series (Authentication Engine)

**Purpose:** Completion pack documenting REG Series authentication pages  
**Owner:** System Architect  
**Status:** Beta / Feature Complete  
**Last Updated:** 2025-01-27

---

## 1. Purpose & Scope

**Summary:**  
The **REG Series** represents the "Engine" of the NexusCanon system, serving as the high-security entry point. It is distinct from the main application ("Control Room") and features its own "Mechanical Orchestra" and "Reactor Assembly" aesthetic themes. It prioritizes "Visual Physics" to convey system stability and security depth.

**In-scope:**
- **REG-01:** Login Interface (Mechanical Orchestra).
- **REG-02:** Signup / Provisioning (Reactor Assembly).
- **REG-03:** Password Reset (BeamLine).
- **Core:** "IntegratedEngine" physics system (Springs, Particles, Recoil).

**Out-of-scope:**
- User session persistence (currently handled by local storage/mock).
- SSO / Enterprise federation (planned for REG-05).

---

## 2. Screens, Routes & Navigation

**Primary routes:**
- `GET /login` → `LoginPage`
  - *Theme:* Mechanical Orchestra (Dark precision, gold accents).
- `GET /signup` → `SignUpPage`
  - *Theme:* Reactor Assembly (Blue/Cyan energy, particle systems).
- `GET /reset-password` → `ResetPasswordPage`
  - *Theme:* BeamLine (Focused laser precision).

**Navigation rules:**
- All REG pages are standalone (No AppShell).
- Successful auth redirects to `/dashboard` (META Series).
- "Back to Home" links to Landing Page (`/`).

---

## 3. Component Inventory

| Component Name | Type | Location | Purpose / Notes |
|----------------|------|----------|----------------|
| `RegAppShell` | Shell | `/components/shell` | Minimal wrapper for auth pages. |
| `IntegratedEngine` | Animation | `/components/auth` | Core physics engine (ParticleSystem, Springs). |
| `MechanicalOrchestra` | UI Theme | `/components/auth` | Login page visual assets/layout. |
| `BeamLine` | UI Theme | `/components/auth` | Reset password visual assets. |
| `NexusCanonLogo` | Brand | `/components` | Official logo component. |

---

## 4. Data, State & Integration

**Data sources:**
- **Current:** Local React state for form inputs.
- **Future:** Supabase Auth (`supabase.auth.signInWithPassword`, `signUp`).

**State management:**
- **Physics State:** `useMotionValue` (cursor tracking), `useSpring` (smooth damping).
- **Form State:** Standard React `useState`.

**Data flow:**  
User Input → "Recoil" Animation Trigger → Validation Check (Password Strength) → Visual Feedback (Reactor Stability) → Submit → Redirect.

---

## 5. Contracts & APIs (Frontend View)

| API / Endpoint | Method | Used in | Expected Response (Target) |
|----------------|--------|---------|---------------------------|
| `/auth/login` | POST | `LoginPage` | `session_token`, `user_profile` |
| `/auth/signup` | POST | `SignUpPage` | `user_id`, `onboarding_status` |
| `/auth/recover` | POST | `ResetPasswordPage` | `recovery_email_sent` |

---

## 6. Styling, Design & Tokens

**Themes:**
- **Login:** Gold/Amber accents (`#FFD700`) on Void background.
- **Signup:** Cyan/Blue accents (`#00F0FF`) representing "Coolant/Energy".
- **Reset:** Green/White precision lines (`#28E7A2`).

**Visual Physics:**
- **Cursor Parallax:** Elements shift based on mouse position.
- **Input Recoil:** Fields shake slightly on typing (simulating mechanical impact).
- **Particle Systems:** Atmospheric background effects (React Three Fiber or CSS Canvas equivalent).

---

## 7. Accessibility & Responsiveness

**Accessibility:**
- **Focus:** High-contrast focus rings.
- **Reduced Motion:** Physics engine respects `prefers-reduced-motion` (particles disabled).
- **Forms:** Labels and ARIA attributes present.

**Responsiveness:**
- **Mobile:**
  - "Integrated Engine" effects simplified.
  - Forms stack vertically.
  - Touch inputs trigger same physics as mouse.

---

## 8. Testing & Quality

**Manual test checklist:**
- [x] Login page animations (Entrance, Hover).
- [x] Signup page "Reactor Stability" meter responds to password strength.
- [x] Input recoil feels "weighty" but not distracting.
- [x] Routing to `/dashboard` works on success.

**Known issues:**
- Performance: Heavy particle count on low-end mobile devices might need throttling.
- `SignupPage.tsx` legacy file deleted; ensure no imports reference it.

---

## 9. Extension Guide

**Where to extend:**
- **New Auth Flows:** Add to `pages/` and update `App.tsx`.
- **New Physics:** Extend `IntegratedEngine.tsx` with new particle presets.

**Patterns:**
- **Do not use AppShell:** REG pages must feel "enclosed" and secure.
- **Animation:** Always use `motion/react` springs, never linear tweens.

---

**Last Updated:** 2025-01-27  
**Status:** 🟢 Active  
**Related Documents:** REF_080_TechnicalRegister, REF_094_MetaSeriesCompletion, REF_095_SysSeriesCompletion  
**Maintained by:** System Architect
