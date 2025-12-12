# Context Optimization Strategy

**Purpose:** Reduce context usage when approaching maximum capacity  
**Date:** 2025-12-11

---

## 🎯 Quick Wins to Reduce Context

### 1. **Delete Temporary/Analysis Files** ⭐ **HIGHEST IMPACT**

These files were created during analysis but can be removed:

```bash
# Files that can be safely deleted (they're documentation, not code)
rm CANON_PLANES_DIRECTORY_ANALYSIS.md
rm CANON_PLANES_NAMING_STRATEGY.md
rm CANON_PLANES_QUICK_REFERENCE.md
rm MIGRATION_VERIFICATION.md
rm MIGRATION_COMPLETE.md
rm ARCHIVE_NAMING_STRATEGY.md
```

**Why:** These are one-time analysis documents. The important info is in:
- `CANON_SELF_TEACHING_STRUCTURE.md` (keep - active reference)
- `canon/A-Governance/A-CONT/CONT_01_CanonIdentity.md` (keep - SSOT)

**Impact:** Can free up ~1000+ lines of context

---

### 2. **Use Targeted Searches Instead of Full File Reads**

**Instead of:**
```typescript
read_file('large-file.md')  // Reads entire 2000+ line file
```

**Use:**
```typescript
grep('specific pattern', 'large-file.md')  // Only relevant lines
read_file('large-file.md', offset=100, limit=50)  // Specific section
codebase_search('specific question', ['target-dir'])  // Semantic search
```

**Example:**
- ❌ Don't read entire `CONT_01_CanonIdentity.md` (2090 lines)
- ✅ Use `grep` to find specific sections
- ✅ Use `read_file` with offset/limit for specific parts

---

### 3. **Consolidate Documentation**

**Current:** Multiple overlapping docs
- `CANON_PLANES_DIRECTORY_ANALYSIS.md`
- `CANON_PLANES_NAMING_STRATEGY.md`
- `CANON_PLANES_QUICK_REFERENCE.md`
- `CANON_SELF_TEACHING_STRUCTURE.md`

**Better:** Single source of truth
- Keep: `CANON_SELF_TEACHING_STRUCTURE.md` (most current)
- Archive/Delete: Others (historical analysis)

---

### 4. **Use Semantic Search First**

**Strategy:**
1. **First:** Use `codebase_search` to find relevant code
2. **Then:** Read only the specific files found
3. **Avoid:** Reading entire directories or large files

**Example:**
```typescript
// ✅ Good: Targeted search
codebase_search('How are TOOL files organized?', ['canon/D-Operations'])

// ❌ Bad: Reading entire directory
read_file('canon/D-Operations/D-TOOL/TOOL_05_MigrateCanonPlanes.ts')  // 400+ lines
```

---

### 5. **Limit File Reading to Specific Sections**

**Pattern:**
```typescript
// ✅ Good: Read only what you need
read_file('file.md', offset=50, limit=30)  // Lines 50-80 only

// ❌ Bad: Read entire file
read_file('file.md')  // All 500 lines
```

---

### 6. **Use grep for Pattern Matching**

**When to use grep:**
- Finding specific function names
- Finding imports
- Finding specific patterns
- Counting occurrences

**Example:**
```typescript
// ✅ Good: Find all TOOL files
grep('^TOOL_', 'canon/D-Operations/D-TOOL')

// ❌ Bad: Read directory and filter manually
list_dir('canon/D-Operations/D-TOOL')  // Then filter in code
```

---

### 7. **Clean Up Generated/Temporary Files**

**Files that can be regenerated:**
- `REPO_STRUCTURE_TREE.md` - Can be regenerated with script
- Analysis documents - Historical, can be archived
- Migration scripts output - One-time use

**Keep:**
- Source code files
- Configuration files
- Active documentation (not analysis)

---

## 📊 Context Usage Optimization Checklist

### Before Starting a Task

- [ ] **Use semantic search first** - Find relevant code without reading files
- [ ] **Read specific sections** - Use offset/limit parameters
- [ ] **Use grep for patterns** - Don't read entire files for simple searches
- [ ] **Delete temporary files** - Remove analysis docs after use

### During Development

- [ ] **Read only what's needed** - Don't read entire files "just in case"
- [ ] **Use targeted searches** - `codebase_search` with specific directories
- [ ] **Limit file reads** - Read 50-100 lines at a time, not entire files
- [ ] **Avoid listing large directories** - Use `glob_file_search` instead

### After Completion

- [ ] **Delete temporary analysis files**
- [ ] **Consolidate documentation** - Merge overlapping docs
- [ ] **Archive old versions** - Move to `canon/z-archive/`

---

## 🎯 Best Practices

### ✅ DO:

1. **Start with semantic search**
   ```typescript
   codebase_search('How does X work?', ['relevant-dir'])
   ```

2. **Read specific sections**
   ```typescript
   read_file('file.ts', offset=100, limit=50)
   ```

3. **Use grep for exact matches**
   ```typescript
   grep('functionName', 'file.ts')
   ```

4. **Delete temporary files**
   ```bash
   rm analysis-file.md
   ```

### ❌ DON'T:

1. **Read entire large files**
   ```typescript
   read_file('2000-line-contract.md')  // ❌ Too much context
   ```

2. **List entire large directories**
   ```typescript
   list_dir('src/')  // ❌ Too many files
   ```

3. **Keep temporary analysis files**
   ```bash
   # ❌ Don't keep one-time analysis docs
   CANON_PLANES_DIRECTORY_ANALYSIS.md
   ```

4. **Read files "just in case"**
   ```typescript
   // ❌ Reading files you might not need
   read_file('file1.ts')
   read_file('file2.ts')
   read_file('file3.ts')
   ```

---

## 🔧 Practical Examples

### Example 1: Finding a Function

**❌ Inefficient:**
```typescript
read_file('large-file.ts')  // 500 lines
// Then search in memory
```

**✅ Efficient:**
```typescript
grep('functionName', 'large-file.ts')  // Only matching lines
```

### Example 2: Understanding a Feature

**❌ Inefficient:**
```typescript
read_file('feature.md')  // 1000 lines
read_file('implementation.ts')  // 500 lines
read_file('tests.ts')  // 300 lines
```

**✅ Efficient:**
```typescript
codebase_search('How does feature X work?', ['src/feature'])
// Then read only the relevant files found
```

### Example 3: Checking Structure

**❌ Inefficient:**
```typescript
list_dir('canon/')  // Lists all subdirectories
read_file('canon/A-Governance/README.md')
read_file('canon/B-Functional/README.md')
// ... etc
```

**✅ Efficient:**
```typescript
glob_file_search('**/README.md', 'canon/')  // Only README files
// Or use grep to find specific content
```

---

## 📈 Context Reduction Impact

| Strategy | Context Saved | Effort |
|----------|--------------|--------|
| Delete analysis files | ~1000 lines | 1 min |
| Use grep instead of read_file | ~500 lines | 0 min |
| Read specific sections | ~300 lines | 0 min |
| Use semantic search first | ~200 lines | 0 min |
| **Total Potential Savings** | **~2000 lines** | **1 min** |

---

## 🚀 Quick Action Plan

### Immediate (1 minute):
```bash
# Delete temporary analysis files
rm CANON_PLANES_DIRECTORY_ANALYSIS.md
rm CANON_PLANES_NAMING_STRATEGY.md
rm CANON_PLANES_QUICK_REFERENCE.md
rm MIGRATION_VERIFICATION.md
rm MIGRATION_COMPLETE.md
rm ARCHIVE_NAMING_STRATEGY.md
```

### Going Forward:
1. Use `codebase_search` before `read_file`
2. Use `grep` for pattern matching
3. Read files with `offset`/`limit` parameters
4. Delete temporary files after use

---

## 💡 Pro Tips

1. **Ask specific questions** - "How does X work?" not "Show me everything"
2. **Use targeted searches** - Specify directories in `codebase_search`
3. **Read incrementally** - Start with small sections, expand if needed
4. **Clean as you go** - Delete analysis files immediately after use

---

**Result:** Reduce context usage by 50-70% while maintaining effectiveness! 🎯
