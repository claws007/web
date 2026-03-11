# Create Dialog Component Skill

Generate custom dialog components (ConfirmDialog, InputDialog, SelectDialog, FormDialog) with TypeScript types and automatic exports.

## 🎯 Quick Start (5 Minutes)

### 1. Decide: Common or Business?

| Decision | Location | Example |
|----------|----------|---------|
| **Reusable across projects** | `src/components/dialog/commonDialog/` | InputDialog, ConfirmDialog |
| **Project-specific** | `src/bizComponents/dialog/` | SettingsDialog, ProcessDialog |

### 2. Choose Pattern

- **Simple** (~1 min) → Yes/no confirmation
- **Input** (~2 min) → Text input with options
- **Select** (~2 min) → Pick from list
- **Form** (~5 min) → Multi-field with validation

### 3. Create File

Copy template from `templates/` folder into your chosen location:

- Common: `src/components/dialog/commonDialog/YourDialog.vue`
- Business: `src/bizComponents/dialog/YourDialog.vue`

### 4. Add Export

Add one line to the appropriate `index.ts`:

```typescript
export { default as YourDialog } from "./YourDialog.vue";
```

### 5. Use Immediately

```typescript
const result = await dialogs.YourDialog({ /* props */ })
  .finishPromise((data) => data);
```

**Done!** ✨ TypeScript autocomplete included.

---

## 📚 Files

| File | Purpose |
|------|---------|
| [SKILL.md](./SKILL.md) | Complete guide: architecture, patterns, best practices, troubleshooting |
| [templates/](./templates/) | Ready-to-use component templates (4 patterns) |
| [templates/README.md](./templates/README.md) | Quick template reference |

## 🚀 When to Use This Skill

Ask for this skill when you need to:

- "Generate a dialog component for..."
- "Create a confirmation dialog..."
- "Build a custom form dialog..."
- "Add a new InputDialog variant..."
- "Generate a list selection dialog..."
- "Export a dialog to the dialogs system..."

## 📖 Full Guide

Read [SKILL.md](./SKILL.md) for:

- ✅ Architecture overview of your dialog system
- ✅ 5-minute workflow with checklist
- ✅ Complete pattern templates with examples
- ✅ Export instructions (CommonDialog vs BusinessDialog)
- ✅ Usage examples and best practices
- ✅ Common mistakes and troubleshooting
- ✅ Decision tree for choosing patterns

## 🔧 Templates Overview

| Pattern | File | Returns | Complexity |
|---------|------|---------|-----------|
| **Simple** | `1-simple-dialog.vue` | void | ⭐ 1 min |
| **Input** | `2-input-dialog.vue` | string | ⭐⭐ 2 min |
| **Select** | `3-select-dialog.vue` | T (generic) | ⭐⭐ 2 min |
| **Form** | `4-form-dialog.vue` | Object | ⭐⭐⭐ 5 min |

Visit [templates/README.md](./templates/README.md) for quick customization tips.

## 💡 Example Workflow

```bash
# User request: "Create a dialog for selecting a color"

# 1. Check: Is it reusable? (Common) or project-specific? (Business)
   → Common dialog (reusable)

# 2. Choose pattern: Simple, Input, Select, or Form?
   → Select pattern (pick from list)

# 3. Copy template
   cp templates/3-select-dialog.vue src/components/dialog/commonDialog/ColorSelectDialog.vue

# 4. Customize
   # Edit ColorSelectDialog.vue
   # - Change title
   # - Adjust colors in options
   # - Update styling

# 5. Export
   # Edit src/components/dialog/commonDialog/index.ts
   export { default as ColorSelectDialog } from "./ColorSelectDialog.vue";

# 6. Use
   const color = await dialogs.ColorSelectDialog({
     title: "Choose Color",
     options: [
       { id: "red", name: "Red" },
       { id: "blue", name: "Blue" },
     ],
   }).finishPromise((opt) => opt);
```

## ✨ What This Skill Provides

✅ **Quick 5-minute workflow** - Copy, customize, export, use  
✅ **Type-safe** - Full TypeScript support with dialogue typing  
✅ **4 ready-made patterns** - Simple, Input, Select, Form  
✅ **Auto-exports** - Automatic integration with global `dialogs` object  
✅ **Best practices** - Checklist, common mistakes, troubleshooting  
✅ **Architecture reference** - Understand your dialog system fully  

## 🎓 Next Steps

1. **Read [SKILL.md](./SKILL.md)** for the complete guide
2. **Choose a pattern** from [templates/](./templates/)
3. **Copy template** into your dialog folder
4. **Customize** for your use case
5. **Add export** to `index.ts`
6. **Start using** with `dialogs.YourDialog()`

---

**Related Skills:** If you need to *use* existing dialogs instead of creating new ones, see the "Dialog Generator" skill for hooks and usage patterns.
