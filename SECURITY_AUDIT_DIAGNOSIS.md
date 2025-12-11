# 🔒 npm audit Security Diagnosis Report

**Date:** December 12, 2025  
**Issue:** DNS Rebinding Protection Vulnerability in MCP SDK  
**Severity:** HIGH (but with context)

---

## 🚨 Vulnerability Summary

### Identified Issues
```bash
@modelcontextprotocol/sdk <1.24.0
Severity: high
DNS rebinding protection not enabled by default
```

**Affected Packages:**
1. `@modelcontextprotocol/sdk@1.21.0` (via `next-devtools-mcp@0.3.6`)
2. `@modelcontextprotocol/sdk@1.21.0` (via `shadcn@3.5.2`)

**Advisory:** https://github.com/advisories/GHSA-w48q-cv73-mx4w

---

## 📊 Current State Analysis

### Installed Versions
```
Current Installed: @modelcontextprotocol/sdk@1.21.0
Latest Available:  @modelcontextprotocol/sdk@1.24.3
Fix Required:      >=1.24.0
```

### Dependency Chain
```
nexuscanon-t60@2.4.1
├── next-devtools-mcp@0.3.6
│   └── @modelcontextprotocol/sdk@1.21.0 (VULNERABLE)
└── shadcn@3.5.2
    └── @modelcontextprotocol/sdk@1.21.0 (VULNERABLE)
```

---

## 🔍 What is DNS Rebinding?

**DNS Rebinding** is an attack where:
1. Attacker tricks your browser into making requests to localhost
2. Malicious website exploits local development servers
3. Can access MCP servers running on `localhost`

**Example Attack:**
```
1. User visits malicious.com
2. malicious.com DNS initially resolves to attacker's IP
3. DNS TTL expires, now resolves to 127.0.0.1
4. Browser makes request thinking it's to malicious.com
5. Actually hits localhost MCP server
6. Attacker can send commands to local MCP tools
```

---

## ⚠️ Risk Assessment for Your Project

### Context: Development Tool (DevDependency)
- ✅ `next-devtools-mcp` is a **devDependency** (line 131 in package.json)
- ✅ Only used during local development
- ✅ Not deployed to production
- ✅ Not exposed to end users

### Actual Risk Level
| Factor | Risk | Reason |
|--------|------|--------|
| Production Exposure | 🟢 **NONE** | DevDependency only |
| Local Development | 🟡 **LOW** | Requires active attack + dev server |
| Data Exposure | 🟡 **LOW** | Local files only, no prod data |
| Attack Complexity | 🟠 **MEDIUM** | Requires DNS manipulation + timing |
| Overall Risk | 🟡 **LOW-MEDIUM** | DevDependency mitigates most concerns |

---

## 🛠️ Resolution Options

### Option 1: Update Dependencies (Recommended)
Update the MCP SDK to the patched version.

**Steps:**
```bash
# Check for updates
npm outdated

# Update next-devtools-mcp (may pull newer MCP SDK)
npm update next-devtools-mcp

# Force resolution (if needed)
npm install @modelcontextprotocol/sdk@latest

# Verify
npm list @modelcontextprotocol/sdk
npm audit
```

**Pros:**
- ✅ Fixes vulnerability
- ✅ Gets latest features
- ✅ Maintains compatibility

**Cons:**
- ⚠️ May have breaking changes
- ⚠️ Need to test after update

---

### Option 2: Override Resolution (Force Fix)
Force npm to use the patched version regardless of what dependencies request.

**Add to `package.json`:**
```json
{
  "overrides": {
    "@modelcontextprotocol/sdk": ">=1.24.0"
  }
}
```

**Then run:**
```bash
npm install
npm audit
```

**Pros:**
- ✅ Guaranteed fix
- ✅ Works even if deps don't update

**Cons:**
- ⚠️ May break if deps incompatible with newer version

---

### Option 3: Accept Risk (Temporary)
Document and accept the risk for now, plan update later.

**Justification:**
- DevDependency only (not in production)
- Low attack surface
- Requires active local development + attack

**Action:**
1. Create `.npmrc` with:
   ```
   audit-level=moderate
   ```
2. Document decision in this file
3. Plan update in next sprint

**Pros:**
- ✅ No immediate changes
- ✅ Focus on feature delivery

**Cons:**
- ❌ Vulnerability remains
- ❌ May forget to fix later

---

### Option 4: Remove/Replace Tool
If updates don't work, consider alternatives.

**Next.js DevTools Alternatives:**
- Manual inspection with browser DevTools
- Next.js built-in diagnostics
- VS Code debugging

**Pros:**
- ✅ Eliminates vulnerability completely

**Cons:**
- ❌ Lose MCP integration features
- ❌ Less convenient debugging

---

## 🎯 Recommended Action Plan

### Immediate (Today)
1. **Update next-devtools-mcp:**
   ```bash
   npm update next-devtools-mcp
   npm audit
   ```

2. **If still vulnerable, use override:**
   Add to `package.json`:
   ```json
   "overrides": {
     "@modelcontextprotocol/sdk": "^1.24.3"
   }
   ```
   Then: `npm install`

3. **Verify fix:**
   ```bash
   npm list @modelcontextprotocol/sdk
   npm audit
   ```

### Testing
Test that MCP integration still works:
```bash
# Start dev server
npm run dev

# Verify MCP tools work
# (Should see MCP enabled in Next.js 16 terminal output)
```

### Post-Update
- ✅ Run your Canon dashboard build
- ✅ Test MCP tools (if you use them)
- ✅ Commit updated `package-lock.json`

---

## 📋 Other Outdated Packages

While diagnosing, I found several other packages that could be updated:

### High Priority Updates
```bash
# Next.js patch (16.0.8 → 16.0.9)
npm update next @next/mdx eslint-config-next

# Storybook patch (10.1.5 → 10.1.7)
npm update storybook @storybook/addon-a11y @storybook/addon-docs

# Motion patch (12.23.25 → 12.23.26)
npm update motion
```

### Major Version Updates (Review Carefully)
These have breaking changes - review docs before updating:

| Package | Current | Latest | Breaking Changes |
|---------|---------|--------|------------------|
| React | 18.3.1 | 19.2.2 | Yes - new compiler |
| React DOM | 18.3.1 | 19.2.2 | Yes - new compiler |
| @types/react | 18.3.27 | 19.2.7 | Yes - type changes |
| Tailwind CSS | 3.4.18 | 4.1.18 | Yes - v4 rewrite |
| TypeScript | 5.6.3 | 5.9.3 | Minor - check release notes |

**Recommendation:** Update React 19 and Tailwind 4 in a **separate PR** after testing.

---

## 🔐 Security Best Practices

### For Development Dependencies
1. ✅ Keep DevDependencies updated
2. ✅ Use `npm audit` regularly
3. ✅ Don't commit `.env` files
4. ✅ Use HTTPS for local dev if possible

### For Production Dependencies
1. ✅ Audit before every deploy
2. ✅ Use exact versions (no `^` or `~`) for critical deps
3. ✅ Review security advisories
4. ✅ Keep dependencies minimal

### For MCP/Local Dev Servers
1. ✅ Only run dev servers on localhost
2. ✅ Don't expose dev servers to public network
3. ✅ Use firewall rules if needed
4. ✅ Update regularly

---

## 📝 Resolution Checklist

- [ ] Run `npm update next-devtools-mcp`
- [ ] Check if vulnerability resolved with `npm audit`
- [ ] If not resolved, add override to `package.json`
- [ ] Run `npm install` to apply override
- [ ] Verify with `npm list @modelcontextprotocol/sdk`
- [ ] Test dev server: `npm run dev`
- [ ] Test Canon dashboard loads at `/canon`
- [ ] Verify MCP tools still work (if applicable)
- [ ] Commit updated `package-lock.json`
- [ ] Update this file with resolution date

---

## 🎯 Summary

**Issue:** DNS Rebinding vulnerability in `@modelcontextprotocol/sdk@1.21.0`

**Risk Level:** 🟡 **LOW-MEDIUM** (DevDependency only, not in production)

**Recommended Fix:**
```bash
# 1. Try update
npm update next-devtools-mcp

# 2. If still vulnerable, add override to package.json
"overrides": { "@modelcontextprotocol/sdk": "^1.24.3" }

# 3. Install and verify
npm install
npm audit
```

**Estimated Time:** 5-10 minutes  
**Breaking Risk:** Low (DevDependency only)  
**Priority:** Medium (not blocking, but good hygiene)

---

## 📚 References

- **Advisory:** https://github.com/advisories/GHSA-w48q-cv73-mx4w
- **MCP SDK:** https://github.com/modelcontextprotocol/typescript-sdk
- **DNS Rebinding Explained:** https://en.wikipedia.org/wiki/DNS_rebinding
- **npm Overrides:** https://docs.npmjs.com/cli/v9/configuring-npm/package-json#overrides

---

**Report Generated:** 2025-12-12  
**Status:** ⏳ **PENDING RESOLUTION**  
**Next Action:** Run update commands above
