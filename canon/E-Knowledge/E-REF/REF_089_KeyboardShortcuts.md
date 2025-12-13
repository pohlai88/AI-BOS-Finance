> **🟢 [ACTIVE]** — Canon Reference  
> **Canon Code:** REF_089  
> **Plane:** E — Knowledge (Reference)  
> **Related:** CONT_01_CanonIdentity, REF_088_QuickStartGuide, REF_082_PageCodingStandards  
> **Source:** Consolidated from `src/docs/04-guides/shortcuts.md` and `src/docs/03-guides/KEYBOARD_SHORTCUTS_REFERENCE.md`  
> **Date:** 2025-01-27

---

# REF_089: NexusCanon META-Series Keyboard Shortcuts

**Purpose:** Complete keyboard shortcuts reference for NexusCanon META-series  
**Status:** 🟢 Active  
**Quick Reference Card** - Print or Pin This  
**Last Updated:** 2025-01-27

---

## 🌐 GLOBAL SHORTCUTS (Work on All Pages)

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd+K` / `Ctrl+K` | **Command Palette** | Universal search for pages, actions, features |
| `Cmd+.` / `Ctrl+.` | **Toggle Meta Nav** | Open/close Meta navigation overlay |
| `Cmd+/` / `Ctrl+/` | **Keyboard Shortcuts** | Show this help overlay |
| `Esc` | **Close Overlays** | Close any open dialog, palette, or drawer |

---

## 🔢 QUICK NAVIGATION (Jump to Pages)

| Shortcut | Page | Description |
|----------|------|-------------|
| `Cmd+1` / `Ctrl+1` | **META_01** | Forensic Architecture |
| `Cmd+2` / `Ctrl+2` | **META_02** | Registry // God View |
| `Cmd+3` / `Ctrl+3` | **META_03** | The Prism |
| `Cmd+4` / `Ctrl+4` | **META_04** | Risk Radar |
| `Cmd+5` / `Ctrl+5` | **META_05** | Canon Matrix |
| `Cmd+6` / `Ctrl+6` | **META_06** | Health Scan |
| `Cmd+7` / `Ctrl+7` | **META_07** | Lynx Codex |
| `Cmd+8` / `Ctrl+8` | **META_08** | Implementation Playbook |

---

## 📊 META_03: THE PRISM (Page-Specific)

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd+D` / `Ctrl+D` | **Toggle Density** | Switch between comfortable/compact table view |
| `Cmd+F` / `Ctrl+F` | **Focus Filter** | Jump to filter/search bar |

---

## 🎯 COMMAND PALETTE NAVIGATION

| Key | Action |
|-----|--------|
| `↑` | Previous result |
| `↓` | Next result |
| `Enter` | Execute selected command |
| `Esc` | Close palette |
| `Type to search` | Filter results in real-time |

---

## 💡 PRO TIPS

### **Power User Workflow:**

1. **Quick Jump Between Pages:**
   ```
   Cmd+3 → META_03 (The Prism)
   Cmd+2 → META_02 (Registry)
   Cmd+7 → META_07 (Lynx Codex)
   ```

2. **Search Anything:**
   ```
   Cmd+K → Type "risk" → Enter
   (Instant jump to META_04 Risk Radar)
   ```

3. **Never Touch Mouse:**
   ```
   Cmd+K      → Open search
   Type "prism"
   Enter      → Navigate
   Cmd+D      → Toggle density
   Cmd+F      → Focus filter
   ```

---

## 🖥️ PLATFORM DIFFERENCES

| Platform | Command Key | Example |
|----------|-------------|---------|
| **macOS** | `Cmd` ⌘ | `Cmd+K` |
| **Windows** | `Ctrl` | `Ctrl+K` |
| **Linux** | `Ctrl` | `Ctrl+K` |

**Note:** The app auto-detects your platform and shows correct keys in help overlay.

---

## 🏆 KEYBOARD-FIRST PHILOSOPHY

NexusCanon follows the **Linear/Notion/Figma** approach:

1. **Mouse Optional:** Everything accessible via keyboard
2. **Discoverable:** Cmd+/ shows all shortcuts
3. **Consistent:** Same patterns across all pages
4. **Fast:** Power users never touch mouse

**Goal:** <2 seconds to reach any feature from any page

---

## ❓ TROUBLESHOOTING

### **Shortcuts Not Working?**

1. **Check if input is focused:**
   - Shortcuts disabled when typing in text fields
   - Press `Esc` to defocus, then try shortcut

2. **Browser conflicts:**
   - Some browsers override Cmd+K (Chrome search)
   - Solution: Use Meta navigation (Cmd+.)

3. **Platform detection:**
   - App should auto-detect Mac vs Windows
   - If wrong, check `navigator.platform`

4. **Clear conflicting extensions:**
   - Disable browser extensions that use same shortcuts
   - Example: Vimium, Tab Manager

---

## 🎯 PRACTICE EXERCISE

**Challenge:** Navigate without mouse in 10 seconds

1. Start at META_01
2. Open command palette: `Cmd+K`
3. Type "prism"
4. Hit `Enter`
5. Toggle density: `Cmd+D`
6. Focus filter: `Cmd+F`
7. Close: `Esc`
8. Jump to Health: `Cmd+6`

**Target Time:** <10 seconds  
**Expert Time:** <5 seconds

---

**Last Updated:** 2025-01-27  
**Status:** 🟢 Active  
**Related Documents:** REF_088_QuickStartGuide, REF_082_PageCodingStandards, CONT_01_CanonIdentity  
**Version:** META_SHELL_v1.0.0  
**Maintained By:** NexusCanon Design Ops
