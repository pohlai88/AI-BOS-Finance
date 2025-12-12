# Context Reduction Quick Guide

**When context is near maximum, use these strategies:**

---

## 🚀 Immediate Actions (1 minute)

### Delete Temporary Analysis Files
```bash
npm run canon:cleanup-analysis
```

**Frees up:** ~1200 lines of context

**Files removed:**
- `CANON_PLANES_DIRECTORY_ANALYSIS.md` (267 lines)
- `CANON_PLANES_NAMING_STRATEGY.md` (355 lines)
- `CANON_PLANES_QUICK_REFERENCE.md` (125 lines)
- `MIGRATION_VERIFICATION.md` (~200 lines)
- `MIGRATION_COMPLETE.md` (~190 lines)
- `ARCHIVE_NAMING_STRATEGY.md` (~150 lines)

**Total:** ~1287 lines freed

---

## 📋 Best Practices for Context Efficiency

### 1. **Use Semantic Search First** ⭐
```typescript
// ✅ Good: Find relevant code without reading files
codebase_search('How does X work?', ['target-dir'])

// ❌ Bad: Read entire files hoping to find something
read_file('large-file.ts')
```

### 2. **Read Specific Sections**
```typescript
// ✅ Good: Read only what you need
read_file('file.md', offset=50, limit=30)  // Lines 50-80

// ❌ Bad: Read entire file
read_file('file.md')  // All 500 lines
```

### 3. **Use grep for Patterns**
```typescript
// ✅ Good: Find exact matches
grep('functionName', 'file.ts')

// ❌ Bad: Read file and search in memory
read_file('file.ts')  // Then search
```

### 4. **Targeted Directory Searches**
```typescript
// ✅ Good: Search specific directory
codebase_search('question', ['canon/A-Governance'])

// ❌ Bad: Search entire codebase
codebase_search('question', [])  // Searches everywhere
```

---

## 🎯 Context Usage by Tool

| Tool | Context Usage | When to Use |
|------|--------------|-------------|
| `codebase_search` | Low (~50-100 lines) | Finding concepts, understanding flow |
| `grep` | Very Low (~10-30 lines) | Exact pattern matching |
| `read_file` (with limit) | Medium (~50-100 lines) | Reading specific sections |
| `read_file` (full) | High (~200-2000 lines) | ⚠️ Avoid when possible |
| `list_dir` | Low (~20-50 lines) | Directory structure |
| `glob_file_search` | Very Low (~5-10 lines) | Finding files by pattern |

---

## ⚡ Quick Reference

### Finding Code
1. **First:** `codebase_search('question', ['dir'])`
2. **Then:** `grep('pattern', 'file.ts')`
3. **Finally:** `read_file('file.ts', offset=X, limit=Y)`

### Understanding Structure
1. **First:** `glob_file_search('pattern', 'dir')`
2. **Then:** `list_dir('dir')`
3. **Avoid:** Reading entire files

### Pattern Matching
1. **Always:** Use `grep` for exact matches
2. **Never:** Read file and search manually

---

## 🧹 Cleanup Checklist

Run this when context is high:

```bash
# 1. Delete analysis files
npm run canon:cleanup-analysis

# 2. Verify what's left
ls *.md | grep -E "(ANALYSIS|NAMING|VERIFICATION|COMPLETE)"

# 3. Check context usage
# (Context is managed automatically, but cleanup helps)
```

---

## 💡 Pro Tips

1. **Ask specific questions** - "How does X work?" not "Show me everything"
2. **One file at a time** - Don't read multiple files "just in case"
3. **Use search results** - Trust `codebase_search` to find what you need
4. **Read incrementally** - Start small, expand only if needed
5. **Delete temp files** - Remove analysis docs immediately after use

---

**Result:** Reduce context by 50-70% while staying effective! 🎯
