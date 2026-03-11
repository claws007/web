---
name: create-dialog-component
description: "Generate dialog components (ConfirmDialog, InputDialog, SelectDialog, FormDialog) with automatic exports. Use when: creating a new reusable dialog component, need quick template for confirmation/input/list dialogs, building custom form dialogs, or adding to bizComponents or components folder."
applies_to: "src/components/dialog/**/*,src/bizComponents/dialog/**/*"
---

# Create Dialog Component Skill

A quick, step-by-step workflow to generate new dialog components with proper TypeScript typing and exports.

## ⚡ Quick 5-Minute Workflow

### 1️⃣ **Decide: Business or Common?**

| Dialog Type  | Location                              | When to Use                                                       |
| ------------ | ------------------------------------- | ----------------------------------------------------------------- |
| **Common**   | `src/components/dialog/commonDialog/` | Generic, reusable across the app (Input, Confirm, Select)         |
| **Business** | `src/bizComponents/dialog/`           | Domain-specific, project-oriented (ProcessDialog, SettingsDialog) |

**Ask yourself:** "Will other projects use this dialog?"

- **Yes** → Common → `src/components/dialog/commonDialog/`
- **No / Project-specific** → Business → `src/bizComponents/dialog/`

### 2️⃣ **Choose Dialog Pattern**

Pick the template that matches your use case:

| Pattern    | Example                  | Returns          | Complexity   |
| ---------- | ------------------------ | ---------------- | ------------ |
| **Simple** | ConfirmDialog (yes/no)   | `void` / boolean | ⭐ 1 min     |
| **Input**  | InputDialog (text field) | `string`         | ⭐⭐ 2 min   |
| **Select** | SelectDialog (pick item) | `T` (generic)    | ⭐⭐ 2 min   |
| **Form**   | Custom (multi-field)     | `ObjectType`     | ⭐⭐⭐ 5 min |

### 3️⃣ **Create the Component File**

Create file in appropriate location:

- **Common**: `src/components/dialog/commonDialog/YourDialog.vue`
- **Business**: `src/bizComponents/dialog/YourDialog.vue`

Copy and customize the pattern template below.

### 4️⃣ **Add to Export**

Add named export to appropriate `index.ts`:

- **Common**: `src/components/dialog/commonDialog/index.ts`
- **Business**: `src/bizComponents/dialog/index.ts`

```typescript
export { default as YourDialog } from "./YourDialog.vue";
```

### 5️⃣ **Test in Your Component**

```typescript
import { dialogs } from "@/components/dialog";

const result = await dialogs
  .YourDialog({
    /* props */
  })
  .finishPromise((data) => data);
```

**Done!** ✨ The dialog is now available in the `dialogs` global object with full TypeScript support.

---

## 📋 Pattern Templates

### Pattern 1: Simple Dialog (ConfirmDialog Style)

**Use for:** Yes/No confirm, simple message, informational dialogs  
**Returns:** `void` (finish) or `void` (close)  
**File:** `ConfirmDialog.vue`

```vue
<template>
  <Dialog :dialog :title :width resolve-by-enter>
    <template #autoPadding>
      <div v-if="content" class="text-light">
        {{ content }}
      </div>
    </template>
    <template #footer>
      <Button @click="cancel()">{{ $t("cancel") }}</Button>
      <Button @click="resolve()" type="primary">{{ $t("resolve") }}</Button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { type AnyDialogType } from "../dialog";

const props = withDefaults(
  defineProps<{
    dialog: AnyDialogType;
    title?: string | null;
    content?: string | null;
    width?: string;
  }>(),
  {
    width: "240px",
  },
);

function resolve() {
  return props.dialog.finish();
}

function cancel() {
  return props.dialog.close();
}
</script>
```

**Props to customize:**

- Add `okText`, `cancelText` for button labels
- Add `okType: "danger" | "primary"` for button styling
- Add `onConfirm?: () => void` for side effects

---

### Pattern 2: Input Dialog (Text Field)

**Use for:** Single text input, password, email, number  
**Returns:** `string` | `null`  
**File:** `InputDialog.vue` or `PasswordDialog.vue`

```vue
<template>
  <Dialog :dialog :title :width>
    <template #autoPadding>
      <div v-if="content" class="text-light mb-4">
        {{ content }}
      </div>
      <Input
        v-model="inputValue"
        v-focus
        :type
        :placeholder
        :disabled
        @keypress.enter="dialog.finish(inputValue)"
        class="text-md size-full resize-none bg-transparent outline-none"
      />
      <div v-if="quickOptions.length" class="h gap-2 text-xs mt-3">
        <div
          v-for="option in quickOptions"
          :key="option.value"
          @click="inputValue = option.value"
          :class="[
            'cursor-pointer rounded border px-2 py-1 duration-300 hover:opacity-75',
            option.danger ? 'bg-danger border-0 text-white' : '',
            option.primary ? 'bg-primary border-0 text-white' : '',
          ]"
        >
          {{ option.label }}
        </div>
      </div>
    </template>
    <template #footer>
      <Button @click="dialog.close()">{{ $t("cancel") }}</Button>
      <Button @click="dialog.finish(inputValue)" type="primary">
        {{ $t("resolve") }}
      </Button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { DialogType } from "../dialog";

const props = withDefaults(
  defineProps<{
    dialog: DialogType<any, string>;
    title?: string | null;
    content?: string | null;
    value?: string | null;
    placeholder?: string;
    type?: "text" | "password" | "email" | "number";
    disabled?: boolean;
    width?: string;
    quickOptions?: Array<{
      label: string;
      value: string;
      danger?: boolean;
      primary?: boolean;
    }>;
  }>(),
  {
    width: "350px",
    quickOptions: () => [],
  },
);

const inputValue = ref(props.value || "");
</script>
```

**Props to customize:**

- `type`: "text" | "password" | "email" | "number"
- `quickOptions`: Quick-action buttons ([Clear], [Default], etc.)
- `prefix` / `suffix`: Custom components before/after input (Icon, Button)
- Add validation before calling `dialog.finish()`

---

### Pattern 3: Select/List Dialog

**Use for:** Pick from list, option selection, radio buttons  
**Returns:** `T` (selected item)  
**File:** `SelectDialog.vue` or `ListDialog.vue`

```vue
<template>
  <Dialog :dialog="dialog" :title="title ?? $t('select')" :width>
    <template #autoPadding>
      <div
        v-for="option in options"
        :key="option.id"
        class="bg-light-2 cursor-pointer rounded p-2 duration-300 hover:opacity-80"
        @click="dialog.finish(option)"
      >
        {{ option.name }}
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { type DialogType } from "@/components/dialog/dialog";

type Option = {
  name?: string;
  id?: string | number | symbol;
  [key: string]: any;
};

withDefaults(
  defineProps<{
    dialog: DialogType<any, Option>;
    title?: string;
    width?: string;
    options?: Option[];
  }>(),
  {
    width: "320px",
  },
);
</script>
```

**Props to customize:**

- `options`: Array of items to select from
- Add custom rendering (icons, badges, description)
- Add search/filter functionality
- Add multi-select checkbox support
- Change hover/active styles

**Advanced: Custom Option Template**

```vue
<div
  v-for="option in options"
  :key="option.id"
  class="p-3 rounded cursor-pointer hover:bg-primary/10 duration-300"
  @click="dialog.finish(option)"
>
  <div class="font-semibold">{{ option.name }}</div>
  <div class="text-xs text-gray-500">{{ option.description }}</div>
</div>
```

---

### Pattern 4: Form Dialog (Multi-Field)

**Use for:** Complex input with validation, multiple fields, save/cancel  
**Returns:** `FormData` (custom object)  
**File:** Custom dialog in `bizComponents/dialog/`

```vue
<template>
  <Dialog :dialog :title="'Edit Settings'" width="500px">
    <template #autoPadding>
      <Form :form="formInstance">
        <FormItem label="API Key" required>
          <Input v-model="formData.apiKey" placeholder="Enter API key" />
        </FormItem>
        <FormItem label="Timeout (ms)" required>
          <Slider
            v-model="formData.timeout"
            :min="100"
            :max="5000"
            :step="100"
          />
        </FormItem>
        <FormItem label="Enabled" label-align="left">
          <Switch v-model="formData.enabled" />
        </FormItem>
      </Form>
    </template>
    <template #footer>
      <Button @click="dialog.close()">{{ $t("cancel") }}</Button>
      <Button @click="handleSave" type="primary" :loading="saving">
        {{ $t("save") }}
      </Button>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { DialogType } from "@/components/dialog";

interface FormData {
  apiKey: string;
  timeout: number;
  enabled: boolean;
}

const props = withDefaults(
  defineProps<{
    dialog: DialogType<FormData, FormData>;
    initialData?: Partial<FormData>;
  }>(),
  {
    initialData: () => ({
      apiKey: "",
      timeout: 5000,
      enabled: true,
    }),
  },
);

const formInstance = useForm({
  apiKey: [{ required: true, message: "API Key required" }],
  timeout: [{ type: "number", min: 100, max: 5000 }],
});

const formData = ref<FormData>({
  apiKey: props.initialData?.apiKey || "",
  timeout: props.initialData?.timeout || 5000,
  enabled: props.initialData?.enabled ?? true,
});

const saving = ref(false);

async function handleSave() {
  const valid = await formInstance.validateFields();
  if (valid) {
    saving.value = true;
    try {
      // Optional: API call here
      props.dialog.finish(formData.value);
    } finally {
      saving.value = false;
    }
  }
}
</script>
```

**Key components to use:**

- `Form` + `FormItem` for validation
- `Slider`, `Switch`, `Select`, `DatePicker` for different inputs
- `loading` state for async operations
- Validate before calling `dialog.finish()`

---

## 🔗 Export Checklist

After creating your dialog component, **add the export**:

### ✅ For Common Dialogs

**File:** `src/components/dialog/commonDialog/index.ts`

```typescript
export { default as YourDialog } from "./YourDialog.vue";
```

Example:

```typescript
export { default as InputDialog } from "./InputDialog.vue";
export { default as ConfirmDialog } from "./ConfirmDialog.vue";
export { default as SelectDialog } from "./SelectDialog.vue";
export { default as YourNewDialog } from "./YourNewDialog.vue"; // ← ADD THIS
```

### ✅ For Business Dialogs

**File:** `src/bizComponents/dialog/index.ts`

```typescript
export { default as YourDialog } from "./YourDialog.vue";
```

Example:

```typescript
export { default as ProcessDialog } from "./ProcessDialog.vue"; // ← ADD THIS
```

---

## 💡 Usage Examples

### Using Your New Dialog

```typescript
// import { dialogs } from "@/components/dialog";

// ConfirmDialog usage
const confirmed = await dialogs
  .ConfirmDialog({
    title: "Delete Item?",
    content: "This action cannot be undone.",
  })
  .finishPromise(() => true);

// InputDialog usage
const name = await dialogs
  .InputDialog({
    title: "Enter Name",
    placeholder: "Full name",
    quickOptions: [
      { label: "Clear", value: "" },
      { label: "John Doe", value: "John Doe", primary: true },
    ],
  })
  .finishPromise((val) => val);

// SelectDialog usage
const selected = await dialogs
  .SelectDialog({
    title: "Choose Option",
    options: [
      { id: 1, name: "Option A" },
      { id: 2, name: "Option B" },
    ],
  })
  .finishPromise((option) => option);

// Custom FormDialog usage
const settings = await dialogs
  .SettingsDialog({
    initialData: { apiKey: "", timeout: 5000, enabled: true },
  })
  .finishPromise((data) => data);
```

---

## ⚠️ Common Mistakes

| Mistake                                | Fix                                                                     |
| -------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------- |
| Forgot to add export to `index.ts`     | Add: `export { default as YourDialog } from "./YourDialog.vue";`        |
| Wrong TypeScript type on `dialog` prop | Use `DialogType<Data, Return>` not `AnyDialogType`                      |
| Dialog doesn't close after clicking    | Call `dialog.finish(data)` or `dialog.close()` in button handler        |
| Props not showing in autocomplete      | Verify `DialogType` typing is correct and component uses `withDefaults` |
| Added to wrong folder                  | Common: `src/components/dialog/commonDialog/`                           | Business: `src/bizComponents/dialog/` |

---

## 📁 File Structure Reference

```
src/components/dialog/
├── commonDialog/
│   ├── InputDialog.vue
│   ├── ConfirmDialog.vue
│   ├── SelectDialog.vue
│   ├── DatePickerDialog.vue
│   ├── YourNewDialog.vue    ← CREATE HERE (common dialog)
│   └── index.ts             ← EXPORT HERE
├── Dialog.vue          (base container)
├── dialog.d.ts         (types)
└── index.ts            (root exports)

src/bizComponents/dialog/
├── YourCustomDialog.vue    ← CREATE HERE (business dialog)
├── index.ts                ← EXPORT HERE
```

---

## 🎯 Decision Tree

```
Need to create a dialog?
├─→ Is it generic/reusable across projects?
│   ├─→ YES: Common Dialog
│   │   ├─ File: src/components/dialog/commonDialog/MyDialog.vue
│   │   ├─ Export: src/components/dialog/commonDialog/index.ts
│   │   └─ Pattern: Simple, Input, Select, or Form
│   │
│   └─→ NO: Business Dialog
│       ├─ File: src/bizComponents/dialog/MyDialog.vue
│       ├─ Export: src/bizComponents/dialog/index.ts
│       └─ Pattern: Form or Custom
│
├─→ What type of dialog?
│   ├─ Confirmation → Pattern 1 (Simple)
│   ├─ Text input → Pattern 2 (Input)
│   ├─ Pick from list → Pattern 3 (Select)
│   └─ Multiple fields → Pattern 4 (Form)
│
└─→ Copy template → Customize → Add export → Done ✨
```

---

## 🔍 Troubleshooting

**Q: TypeScript error on dialog prop**  
A: Ensure type is `DialogType<Data, Return>` where Data is param type, Return is result type.

**Q: Dialog not appearing when called**  
A: Check export is added to `index.ts` and no typos in dialog name.

**Q: Props not autocompleting**  
A: Make sure component uses `defineProps<>()` with TypeScript generics, not `props`.

**Q: Can't use i18n `$t()` in template**  
A: Auto-injected via setup. If error, ensure component is loaded in `helper.ts` mount context.

---

## Related Files

- [src/components/dialog/Dialog.vue - Base container](../../src/components/dialog/Dialog.vue)
- [src/components/dialog/dialog.d.ts - Type definitions](../../src/components/dialog/dialog.d.ts)
- [src/components/dialog/commonDialog/index.ts - Common exports](../../src/components/dialog/commonDialog/index.ts)
- [src/bizComponents/dialog/index.ts - Business exports](../../src/bizComponents/dialog/index.ts)
- [src/components/dialog/helper.ts - Dialog system](../../src/components/dialog/helper.ts)
