# Create Dialog Component Skill

Generate custom dialog components (ConfirmDialog, InputDialog, SelectDialog) with TypeScript types and automatic exports.

## 🎯 Quick Start (5 Minutes)

### 1. Decide: Common or Business?

- **Reusable across projects**: `src/components/dialog/commonDialog/` with dialogs like `InputDialog` and `ConfirmDialog`.
- **Project-specific**: `src/bizComponents/dialog/` with dialogs like `SettingsDialog` and `ProcessDialog`.

### 2. Choose Pattern

- **Simple** (~1 min) → Yes/no confirmation
- **Input** (~2 min) → Text input with options
- **Select** (~2 min) → Pick from list

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

- [SKILL.md](./SKILL.md): Complete guide with architecture, patterns, best practices, and troubleshooting.
- [templates/](./templates/): Ready-to-use component templates for three patterns.
- [templates/README.md](./templates/README.md): Quick template reference.

## 🚀 When to Use This Skill

Ask for this skill when you need to:

- "Generate a dialog component for..."
- "Create a confirmation dialog..."
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

- **Simple**: `1-simple-dialog.vue`, returns `void`, about 1 minute.
- **Input**: `2-input-dialog.vue`, returns `string`, about 2 minutes.
- **Select**: `3-select-dialog.vue`, returns `T`, about 2 minutes.

Visit [templates/README.md](./templates/README.md) for quick customization tips.

## 💡 Example Workflow

```bash
# User request: "Create a dialog for selecting a color"

# 1. Check: Is it reusable? (Common) or project-specific? (Business)
   → Common dialog (reusable)

# 2. Choose pattern: Simple, Input, or Select?
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
✅ **3 ready-made patterns** - Simple, Input, Select  
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
