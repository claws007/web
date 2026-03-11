# Create Dialog Component - Quick Reference

This folder contains reusable templates for generating dialog components.

## 📋 Template Files

| File | Pattern | Use Case | Time |
|------|---------|----------|------|
| `1-simple-dialog.vue` | Simple | Confirmation, yes/no, message | 1 min |
| `2-input-dialog.vue` | Input | Text input, password, email | 2 min |
| `3-select-dialog.vue` | Select | Pick from list, options | 2 min |
| `4-form-dialog.vue` | Form | Multi-field with validation | 5 min |

## 🚀 Quick Start (4 Steps)

1. **Choose location:**
   - Common dialog → `src/components/dialog/commonDialog/`
   - Business dialog → `src/bizComponents/dialog/`

2. **Copy template** matching your use case into that folder

3. **Rename file** (e.g., `MyDialog.vue`)

4. **Add export** to `index.ts`:

   ```typescript
   export { default as MyDialog } from "./MyDialog.vue";
   ```

## 💡 When to Use Each Pattern

### Simple Dialog

✅ Yes/No confirmation  
✅ Informational message  
✅ Simple acknowledgment  

**Example:**

```typescript
const confirmed = await dialogs.DeleteConfirmDialog({
  title: "Delete?",
  content: "This cannot be undone.",
}).finishPromise(() => true);
```

### Input Dialog

✅ Single text field  
✅ Password entry  
✅ Email/number input  
✅ Quick action buttons  

**Example:**

```typescript
const name = await dialogs.NameInputDialog({
  title: "Enter Name",
  placeholder: "Full name...",
  quickOptions: [{ label: "Clear", value: "" }],
}).finishPromise((val) => val);
```

### Select Dialog

✅ Pick one from list  
✅ Option selection  
✅ Radio button list  
✅ Custom descriptions  

**Example:**

```typescript
const selected = await dialogs.StatusSelectDialog({
  title: "Choose Status",
  options: [
    { id: 1, name: "Active" },
    { id: 2, name: "Inactive" },
  ],
}).finishPromise((opt) => opt);
```

### Form Dialog

✅ Multiple input fields  
✅ Complex validation  
✅ Save/cancel workflow  
✅ Business-specific forms  

**Example:**

```typescript
const data = await dialogs.SettingsFormDialog({
  title: "Edit Settings",
  initialData: { name: "", email: "" },
}).finishPromise((data) => data);
```

## 📝 Customization Tips

### Change Button Text

```typescript
{
  okText: "Save",      // Instead of default
  okType: "danger",    // "primary" or "danger"
}
```

### Add Input Validation

Before `dialog.finish()`, add:

```typescript
if (!inputValue.trim()) {
  message.error("Input required");
  return;
}
dialog.finish(inputValue);
```

### Add Loading State

```typescript
const loading = ref(false);

async function handleSave() {
  loading.value = true;
  try {
    await api.save(data);
    dialog.finish(data);
  } finally {
    loading.value = false;
  }
}
```

### Custom Styling

Modify classes:

```vue
<div class="your-custom-class">
  {{ option.name }}
</div>
```

## ✅ Export Checklist

After creating dialog file:

- [ ] File created in correct folder (commonDialog/ or dialog/)
- [ ] Component uses proper TypeScript `DialogType<Data, Return>`
- [ ] Export added to `index.ts`
- [ ] Dialog name matches file name (ConfirmDialog.vue → export as ConfirmDialog)
- [ ] Tested with: `dialogs.YourDialog({ ...props }).finishPromise()`

## 🔗 Related Files

- [SKILL.md](../SKILL.md) - Full guide with patterns and best practices
- [Common Dialog Index](../../src/components/dialog/commonDialog/index.ts) - Where to export common dialogs
- [Business Dialog Index](../../src/bizComponents/dialog/index.ts) - Where to export business dialogs
