> **🟢 [ACTIVE]** — Reference Document  
> **Canon Code:** REF_010  
> **Version:** 1.0.0  
> **Purpose:** Next.js tools and MCP server recommendations for AI-BOS Finance  
> **Plane:** E — Knowledge (Reference)  
> **Date:** 2025-01-27

---

# REF_010: Next.js Tools & Configuration Recommendations

## 🎯 High Priority Tools

### 1. **@next/bundle-analyzer** - Bundle Size Analysis
**Purpose:** Analyze and optimize your Next.js bundle size

**Installation:**
```bash
npm install --save-dev @next/bundle-analyzer
```

**Configuration (`next.config.js`):**
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // your Next.js config
});
```

**Usage:**
```bash
ANALYZE=true npm run build
```

---

### 2. **next-pwa** - Progressive Web App Support
**Purpose:** Add PWA capabilities to your Next.js app

**Installation:**
```bash
npm install --save-dev next-pwa
```

**Benefits:**
- Offline support
- App-like experience
- Service worker management
- Push notifications

---

### 3. **@next/env** - Environment Variable Validation
**Purpose:** Type-safe environment variables

**Installation:**
```bash
npm install --save-dev @next/env zod
```

**Usage:**
```typescript
// env.ts
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  DATABASE_URL: z.string(),
});

export const env = envSchema.parse(process.env);
```

---

### 4. **next-seo** - SEO Optimization
**Purpose:** Manage SEO metadata easily

**Installation:**
```bash
npm install next-seo
```

**Benefits:**
- Structured data
- Open Graph tags
- Twitter cards
- JSON-LD support

**Note:** If using App Router (Next.js 13+), use built-in Metadata API instead.

---

## 🔧 Development Tools

### 5. **@next/third-parties** - Third-Party Script Optimization
**Purpose:** Optimize third-party scripts (Google Analytics, etc.)

**Installation:**
```bash
npm install @next/third-parties
```

**Usage:**
```typescript
import { GoogleAnalytics } from '@next/third-parties/google';

export default function Layout({ children }) {
  return (
    <>
      <GoogleAnalytics gaId="G-XXXXXXXXXX" />
      {children}
    </>
  );
}
```

---

### 6. **next-intl** - Internationalization
**Purpose:** Multi-language support

**Installation:**
```bash
npm install next-intl
```

**Benefits:**
- Type-safe translations
- Route-based i18n
- Server component support

---

### 7. **next-themes** - Theme Management
**Purpose:** Dark/light mode support (you already have this!)

**Status:** ✅ Already installed

---

## 📊 Monitoring & Analytics

### 8. **@sentry/nextjs** - Error Monitoring
**Purpose:** Production error tracking

**Installation:**
```bash
npm install @sentry/nextjs
```

**Benefits:**
- Real-time error tracking
- Performance monitoring
- Release tracking
- Source maps

---

### 9. **@vercel/analytics** - Vercel Analytics
**Purpose:** Web vitals and analytics (works with Vercel MCP)

**Installation:**
```bash
npm install @vercel/analytics
```

**Note:** You already have Vercel MCP configured! This integrates perfectly.

---

## 🧪 Testing Tools

### 10. **@testing-library/next** - Next.js Testing Utilities
**Purpose:** Test Next.js-specific features

**Installation:**
```bash
npm install --save-dev @testing-library/next
```

**Benefits:**
- Router mocking
- Server component testing
- App Router testing

---

### 11. **playwright** - E2E Testing
**Purpose:** End-to-end testing (you already have this!)

**Status:** ✅ Already installed

---

## 🚀 Performance Tools

### 12. **next/image** - Image Optimization
**Purpose:** Built-in Next.js image optimization

**Status:** ✅ Built into Next.js

**Best Practices:**
- Use `next/image` instead of `<img>`
- Configure image domains in `next.config.js`
- Use `priority` for above-the-fold images

---

### 13. **@next/font** - Font Optimization
**Purpose:** Optimize web fonts

**Status:** ✅ Built into Next.js 13+

**Usage:**
```typescript
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
```

---

## 🔐 Security Tools

### 14. **next-auth** or **Clerk** - Authentication
**Purpose:** Secure authentication

**Recommendation:** Clerk (better Next.js integration)

**Installation:**
```bash
npm install @clerk/nextjs
```

**Note:** Clerk has excellent MCP support for Next.js!

---

### 15. **@next/env** + **zod** - Input Validation
**Purpose:** Type-safe environment variables and API validation

**Status:** Consider adding for production

---

## 📝 Code Quality Tools

### 16. **eslint-config-next** - Next.js ESLint Config
**Purpose:** Next.js-specific linting rules

**Installation:**
```bash
npm install --save-dev eslint-config-next
```

**Update `eslint.config.js`:**
```javascript
import nextConfig from 'eslint-config-next';

export default [
  ...nextConfig,
  // your custom rules
];
```

---

### 17. **prettier-plugin-tailwindcss** - Tailwind Formatting
**Purpose:** Auto-sort Tailwind classes

**Installation:**
```bash
npm install --save-dev prettier-plugin-tailwindcss
```

---

## 🔌 Additional MCP Servers to Consider

### 18. **Sentry MCP** (if using Sentry)
**Purpose:** Error tracking and monitoring

**Configuration:**
```json
{
  "sentry": {
    "command": "npx",
    "args": ["-y", "@sentry/mcp-server"],
    "env": {
      "SENTRY_ORG": "your-org",
      "SENTRY_PROJECT": "your-project",
      "SENTRY_AUTH_TOKEN": "your-token"
    }
  }
}
```

---

### 19. **Linear MCP** (Project Management)
**Purpose:** Issue tracking integration

**Configuration:**
```json
{
  "linear": {
    "command": "npx",
    "args": ["-y", "@linear/mcp-server"],
    "env": {
      "LINEAR_API_KEY": "your-api-key"
    }
  }
}
```

---

## 📋 Recommended Next.js Config (`next.config.js`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: ['your-image-domain.com'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Experimental features (Next.js 16+)
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## 🎯 Priority Matrix

| Tool | Priority | Use Case | Install Now? |
|------|----------|----------|--------------|
| @next/bundle-analyzer | 🔴 High | Bundle optimization | ✅ Yes |
| next-seo | 🔴 High | SEO | ✅ Yes |
| @sentry/nextjs | 🟡 Medium | Error tracking | ⚠️ When deploying |
| @vercel/analytics | 🟡 Medium | Analytics | ✅ Yes (Vercel MCP) |
| @clerk/nextjs | 🟡 Medium | Auth | ⚠️ When needed |
| next-pwa | 🟢 Low | PWA features | ⚠️ Optional |
| next-intl | 🟢 Low | i18n | ⚠️ If needed |

---

## 🚀 Quick Setup Commands

```bash
# Essential tools
npm install --save-dev @next/bundle-analyzer
npm install next-seo @vercel/analytics

# When ready for production
npm install @sentry/nextjs

# Optional but recommended
npm install --save-dev eslint-config-next prettier-plugin-tailwindcss
```

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Vercel Analytics](https://vercel.com/analytics)
- [Next.js MCP Guide](https://nextjs.org/docs/app/guides/mcp)

---

## 💡 Implementation Guidance

This is an excellent, comprehensive list of tools that represents the current "Gold Standard" for the Next.js ecosystem. However, implementing all of them at once can be overwhelming and sometimes unnecessary depending on your project stage.

### 1. The "Must-Haves" (Install Immediately)

If you are just starting or standardizing a project, these provide the highest return on investment immediately:

* **`@next/env` + `zod`**: This is non-negotiable for modern apps. Validating your environment variables prevents your app from crashing silently in production because of a missing API key.
* **`prettier-plugin-tailwindcss`**: If you use Tailwind, this is essential for keeping code readable. It automatically sorts your classes so `class="p-4 flex text-center"` looks the same everywhere.
* **`eslint-config-next`**: Keeps your code clean and warns you about Next.js-specific pitfalls (like using `<img>` instead of `<Image />`).

### 2. Critical nuance: SEO & The App Router

The list recommends **`next-seo`**.

* **Advice:** If you are using the **App Router** (the standard for Next.js 13+), you **do not** need `next-seo`.
* **Why:** Next.js now has a built-in Metadata API. You can simply export a `metadata` object from your `layout.tsx` or `page.tsx` files.
  ```typescript
  // layout.tsx (App Router)
  export const metadata = {
    title: 'My App',
    description: 'My cool app',
    openGraph: { ... }
  }
  ```
* *Only use `next-seo` if you are stuck on the older Pages Router.*

### 3. Authentication: Clerk vs. NextAuth (Auth.js)

The list recommends **Clerk**, which is excellent, but here is the trade-off you should know:

* **Clerk:** incredible developer experience, hosted UI components, easy 2FA. **Cons:** It gets expensive if you scale to many Monthly Active Users (MAUs).
* **NextAuth (Auth.js):** Free, open-source, self-hosted, total control. **Cons:** You have to build your own login UI and handle database adapters yourself.
* **My Advice:** Use **Clerk** if you want to ship fast and have a budget. Use **NextAuth** if you are bootstrapping with zero budget or building an internal tool.

### 4. Performance & Monitoring (Production Phase)

Don't worry about these until you are ready to deploy:

* **`@next/bundle-analyzer`**: Essential for debugging "Why is my app huge?", but you don't need it running constantly.
* **`@sentry/nextjs`**: The industry standard for error tracking. **Advice:** Set this up before you get your first real user. You want to know about crashes *before* they email you.

### 5. What is missing from this list?

The provided list is great for *infrastructure*, but it misses two categories that define the modern Next.js stack:

* **UI Component Library:** **Shadcn/UI**. It pairs perfectly with Tailwind (which is in your list) and is currently the most popular choice for Next.js apps.
* **State/Data Management:** If your app is complex, you might need **Zustand** (global state) or **TanStack Query** (data fetching). Though, with Next.js Server Actions, you need these less often now.

### Recommended Implementation Order

1.  **Setup:** `eslint`, `prettier-tailwindcss`, `zod` (for env vars).
2.  **Build:** `Clerk` (Auth), `Shadcn/UI` (Components).
3.  **Refine:** Built-in Metadata (SEO), `next/image` optimization.
4.  **Ship:** `@sentry/nextjs` (Errors), `@vercel/analytics`.

---

## 🔌 Core Spine MCPs for AI-BOS Finance

Short answer: you're missing the **"core spine" MCPs** that match how you actually run AI-BOS: code, design, database, billing, docs, and comms.

### 1. Code & Repo Spine – **GitHub MCP**

**Why you should have it**

* Direct bridge between **ESLint Killer / Hybrid Fixer / SchemaGuardian** and your actual repos.
* Lets agents **read code, diff, open PRs, review, tag risk**, instead of only working on local files.
* Ideal for enforcing your **Canon / Manifestor rules** as CI "AI reviewers".

**What exists today**

* GitHub maintains an official MCP server so agents can read repos, issues, and PRs through MCP.

**Verdict:**
For AI-BOS, this is **non-negotiable core**. Add it.

**Status:** ✅ Already configured in global MCP

---

### 2. Design & Token Spine – **Figma MCP**

**Why you should have it**

* Your whole vision is **design-constitution + tokens + Canon**. The MCP should be able to:
  * Read **Figma components, tokens, layout**.
  * Compare current implementation vs design.
  * Help generate React/Tailwind that stays on-brand.

**What exists today**

* Figma ships an official MCP server that exposes design data to AI agents and IDEs (Dev Mode / Make).

**Verdict:**
For NexusCanon UI, this is **mandatory**. It's the glue between your Figma system and code.

**Status:** ✅ Already configured in global MCP

---

### 3. Database & Schema Spine – **Postgres / Supabase MCP**

**Why you should have it**

* You already have **SchemaGuardian**, AI-governed DB, 3NF, Canon, etc.
* A Postgres/Supabase MCP server lets agents:
  * Inspect schemas, indexes, constraints.
  * Run **read-only diagnostics**.
  * Compare actual DB vs Canon metadata.

**What exists today**

* Anthropic's reference servers include **Postgres MCP** as a standard connector.

**Verdict:**
This is your **AI-Governed Database backbone**. Treat it as core for AI-BOS, but keep it in **read-only / shadow mode** at first.

**Status:** ✅ Already configured in global MCP (Supabase)

---

### 4. Billing & Revenue Spine – **Stripe MCP**

**Why you should have it**

* You're building **SaaS billing, Gold Tier, contracts, order forms, invoices**.
* Stripe MCP lets agents:
  * Look up customers, invoices, subscriptions.
  * Reconcile **GL vs Stripe**.
  * Generate billing insights and sanity-checks against your Canon.

**What exists today**

* Stripe provides an official MCP server so agents can call Stripe APIs and search Stripe docs via MCP.

**Verdict:**
For the **Finance / Payment Hub / IPO-readiness story**, this is **very high priority**.

---

### 5. Knowledge & Documentation Spine – **Google Drive / Notion / Confluence MCP**

Pick **ONE** as primary SSOT for org-knowledge (I know you like Notion / Drive style).

**Why you should have it**

* Your Canon, Playbooks, Meta_* docs, legal agreements, COA designs – all live in documents.
* Docs MCP gives agents:
  * Read access to specs, policies, checklists.
  * Ability to answer "what is the current Canon for X?" directly from SSOT.

**What exists today**

* Anthropic's reference servers include Google Drive and similar content repositories as standard MCP integrations.

**Verdict:**
Critical for **Lynx Codex / Playbook / Fact Sheet**. I'd mark this as **core** once you choose the main repo.

---

### 6. Comms & Alert Spine – **Slack / Teams MCP**

**Why you should have it**

* You talk a lot about **alerts, risk, Watchdog, Ledger Guardian**.
* A Slack/Teams MCP server lets agents:
  * Post alerts into channels.
  * Summarise threads for audit, risk, decisions.
  * Create a **"Lynx – Governance Ops"** channel that is fully AI-assisted.

**What exists today**

* Slack is one of the common MCP targets in Anthropic's reference implementations and ecosystem examples.

**Verdict:**
Important for **operationalising** Canon and alerts. Add after the 4–5 spines above.

---

### 7. Infra & Runtime Spine – **Vercel / K8s / Logs MCP**

For your OS / Telemetry / Live Simulator story, you eventually want infra-level MCPs:

1. **Vercel MCP / adapter**
   * Connect agents to deployments, logs, env vars, metrics. The official servers repo already lists a Vercel MCP adapter for JS frameworks.

2. **Kubernetes MCP (mcp-k8s-go)**
   * For future K8s clusters: inspect pods, logs, events, etc.

**Verdict:**
Nice next step once your **app + design + DB + billing + docs** spines are stable.

**Status:** ✅ Vercel MCP already configured in global MCP

---

## 🔒 Security Note (Important for Canon Governance)

Because you care about **governance and "no-jail"**, be aware that:

* Research is already showing **cryptographic misuses and cross-server exfiltration risks** in MCP ecosystems (weak crypto, leaky API keys, cross-tool attacks).

So every new MCP you add should pass through:

1. **Canon entry** (what family, what risk).
2. **Access matrix** (which agents, which scopes).
3. **Shadow mode** first, then read-only production, then write capabilities.

---

## 📋 TL;DR – Top 5 "Must-Add Next" MCPs

In your shoes, I would queue them like this:

1. **GitHub MCP** – code & repo governance. ✅ Already configured
2. **Figma MCP** – design & token alignment. ✅ Already configured
3. **Postgres/Supabase MCP** – schema & data governance (read-only). ✅ Already configured
4. **Stripe MCP** – billing & revenue spine. ⚠️ **Add this next**
5. **Docs MCP** (Google Drive / Notion / Confluence) – Canon & Playbook spine. ⚠️ **Add this next**

Slack + Vercel + K8s then become the **operational / alerting layer** on top.

---

## 📚 External References

- [GitHub MCP Server](https://github.com/github/github-mcp-server)
- [Figma MCP Guide](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server)
- [Model Context Protocol](https://en.wikipedia.org/wiki/Model_Context_Protocol)
- [Stripe MCP Documentation](https://docs.stripe.com/mcp)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
- [MCP Security Research](https://arxiv.org/abs/2512.03775)

