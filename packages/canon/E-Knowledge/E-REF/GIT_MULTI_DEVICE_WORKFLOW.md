# Git/GitHub Multi-Device Workflow Guide

**For Solo Developer Working Across Multiple Devices**

## 📋 Current Setup

- **Repository:** `https://github.com/pohlai88/AI-BOS-Finance.git`
- **Default Branch:** `master`
- **MCP Servers:** `mcp-git` (local Git operations) + `github` (GitHub API operations)

---

## 🎯 Recommended Workflow Strategy

### Option 1: Simple Linear Workflow (Recommended for Solo Dev)

**Best for:** Solo developer, frequent device switching, simple feature development

```
master (main branch)
  │
  ├─→ feature/feature-name (create locally, push, merge via GitHub)
  │
  └─→ Always pull before starting work on any device
```

**Workflow:**
1. **Before starting work (any device):**
   ```bash
   git pull origin master
   ```

2. **Create feature branch:**
   ```bash
   git checkout -b feature/add-new-component
   ```

3. **Work and commit:**
   ```bash
   git add .
   git commit -m "feat: add new component"
   ```

4. **Push to GitHub:**
   ```bash
   git push origin feature/add-new-component
   ```

5. **Switch devices:**
   - Pull the feature branch on new device
   - Continue working
   - Push again

6. **When done:**
   - Merge via GitHub web UI (or `git merge` locally)
   - Delete feature branch after merge

### Option 2: Trunk-Based Development (Simplest)

**Best for:** Very simple projects, daily commits, minimal branching

```
master (main branch)
  │
  └─→ Direct commits to master (with good commit messages)
```

**Workflow:**
1. **Always pull first:**
   ```bash
   git pull origin master
   ```

2. **Make changes and commit:**
   ```bash
   git add .
   git commit -m "feat: description"
   git push origin master
   ```

3. **On other device:**
   ```bash
   git pull origin master
   ```

---

## 🔧 MCP Server Usage Guide

### When to Use `mcp-git` (Local Git Operations)

Use `mcp-git` for:
- ✅ Viewing local Git status
- ✅ Checking commit history
- ✅ Viewing diffs
- ✅ Staging/unstaging files
- ✅ Creating local commits
- ✅ Branch operations (local only)

**Example queries:**
- "What files have changed?"
- "Show me the git status"
- "What's the commit history?"
- "Show diff for file X"

### When to Use `github` (GitHub API Operations)

Use `github` MCP for:
- ✅ Creating pull requests
- ✅ Viewing GitHub issues
- ✅ Managing GitHub repositories
- ✅ Checking GitHub Actions status
- ✅ Repository metadata
- ✅ Collaborator management

**Example queries:**
- "Create a pull request for feature X"
- "What issues are open?"
- "Show me recent pull requests"
- "What's the status of GitHub Actions?"

---

## 🚀 Multi-Device Synchronization Strategy

### Daily Workflow Checklist

**Morning (Starting Work):**
```bash
# 1. Pull latest changes
git pull origin master

# 2. Check status
git status

# 3. If working on feature branch, pull that too
git checkout feature/my-feature
git pull origin feature/my-feature
```

**During Work:**
```bash
# Commit frequently (don't wait until end of day)
git add .
git commit -m "wip: progress on feature X"

# Push to sync with other devices
git push origin feature/my-feature
```

**End of Day:**
```bash
# Final commit and push
git add .
git commit -m "feat: complete feature X"
git push origin feature/my-feature

# Or if working directly on master
git push origin master
```

**Switching Devices:**
```bash
# On new device, always pull first
git pull origin master  # or feature branch name
```

---

## 📝 Branch Naming Conventions

For solo dev, keep it simple:

```
feature/description        # New features
fix/description           # Bug fixes
refactor/description      # Code refactoring
docs/description          # Documentation updates
chore/description        # Maintenance tasks
```

**Examples:**
- `feature/add-user-dashboard`
- `fix/login-validation-bug`
- `refactor/canon-governance-rules`
- `docs/update-readme`

---

## 🔐 Security Best Practices

### 1. Use Environment Variables for Tokens

**Current Issue:** GitHub token is hardcoded in `mcp.json`

**Recommended Fix:**
1. Set Windows environment variable:
   ```powershell
   [System.Environment]::SetEnvironmentVariable('GITHUB_TOKEN', 'your_token_here', 'User')
   ```

2. Update `C:\Users\dlbja\.cursor\mcp.json`:
   ```json
   "github": {
     "env": {
       "GITHUB_PERSONAL_ACCESS_TOKEN": "${env:GITHUB_TOKEN}"
     }
   }
   ```

3. Restart Cursor to apply changes

### 2. Create GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name: "Cursor MCP Access"
4. Scopes needed:
   - `repo` (full control of private repositories)
   - `workflow` (update GitHub Action workflows)
5. Copy token and set as `GITHUB_TOKEN` environment variable

---

## 🧪 Testing GitHub MCP Connection

### Verify GitHub MCP is Working

1. **Check MCP Server Status:**
   - Open Cursor
   - Check MCP server logs/status
   - Look for GitHub MCP in available servers

2. **Test with Queries:**
   - "List my GitHub repositories"
   - "What's the status of my AI-BOS-Finance repo?"
   - "Show me recent commits on master branch"

3. **If Not Working:**
   - Verify `GITHUB_TOKEN` environment variable is set
   - Check token has correct permissions
   - Restart Cursor
   - Check MCP server logs for errors

---

## 📦 Recommended Git Configuration

### Global Git Config (Set Once Per Device)

```bash
# Set your identity (do this on each device)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Enable helpful aliases
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.cm commit
git config --global alias.unstage 'reset HEAD --'

# Enable colored output
git config --global color.ui auto

# Set default branch name to master (or main)
git config --global init.defaultBranch master

# Enable push auto-setup
git config --global push.autoSetupRemote true
```

### Repository-Specific Config

```bash
# Set upstream tracking (if not already set)
cd c:\AI-BOS\AI-BOS-Finance
git branch --set-upstream-to=origin/master master
```

---

## 🔄 Handling Merge Conflicts (Rare but Possible)

If you work on the same file on different devices:

```bash
# When pulling and conflict occurs
git pull origin master

# If conflicts:
# 1. Git will mark conflicted files
# 2. Open files and resolve conflicts manually
# 3. Stage resolved files
git add .
git commit -m "fix: resolve merge conflicts"
git push origin master
```

**Prevention:** Always pull before starting work on a device.

---

## 🎯 Quick Reference Commands

### Daily Commands

```bash
# Start work
git pull origin master
git status

# Make changes, then:
git add .
git commit -m "feat: description"
git push origin master

# Switch to feature branch
git checkout -b feature/new-feature
git push -u origin feature/new-feature

# Switch devices (pull latest)
git pull origin master  # or feature branch name
```

### Useful Aliases (Add to `.gitconfig`)

```bash
# Quick status
git config --global alias.s 'status -sb'

# Quick commit
git config --global alias.c 'commit -m'

# Quick log
git config --global alias.l 'log --oneline --graph --decorate'

# Pull and rebase
git config --global alias.pr 'pull --rebase'
```

---

## 📊 Recommended Workflow Summary

**For Your Use Case (Solo Dev, Multiple Devices):**

1. **Use Trunk-Based or Simple Feature Branches**
   - Master branch for stable code
   - Feature branches for larger changes
   - Merge feature branches when complete

2. **Always Pull Before Starting Work**
   - Prevents conflicts
   - Ensures you have latest code

3. **Commit and Push Frequently**
   - Don't wait until end of day
   - Push after logical units of work
   - Makes switching devices seamless

4. **Use GitHub MCP for:**
   - Creating PRs (if using feature branches)
   - Checking CI/CD status
   - Managing issues

5. **Use mcp-git for:**
   - Local Git operations
   - Quick status checks
   - Viewing history and diffs

---

## 🚨 Common Pitfalls to Avoid

1. **❌ Forgetting to pull before starting work**
   - Always: `git pull` first

2. **❌ Working on master without pulling**
   - Pull first, then work

3. **❌ Not pushing before switching devices**
   - Push your work before closing laptop

4. **❌ Hardcoding tokens in config files**
   - Use environment variables

5. **❌ Large commits at end of day**
   - Commit frequently, push regularly

---

## ✅ Next Steps

1. **Set up environment variable for GitHub token**
2. **Test GitHub MCP connection**
3. **Configure Git aliases (optional but helpful)**
4. **Establish your preferred workflow (trunk-based or feature branches)**
5. **Create a daily routine: pull → work → commit → push**

---

## 📚 Additional Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)
- [Git Best Practices](https://www.git-tower.com/learn/git/ebook/en/command-line/appendix/best-practices)

---

**Last Updated:** 2025-01-27
**Repository:** AI-BOS-Finance
**Branch Strategy:** Master + Feature Branches (Optional)
