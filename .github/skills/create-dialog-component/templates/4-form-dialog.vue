<!--
Form Dialog Pattern (Advanced)
File: src/bizComponents/dialog/YourFormDialog.vue
Returns: FormData (custom object)
Use: Complex input with validation, multiple fields, save/cancel
-->

<template>
  <Dialog :dialog :title="title ?? 'Edit Form'" :width="width">
    <template #autoPadding>
      <Form :form="formInstance">
        <FormItem label="Name" required>
          <Input v-model="formData.name" placeholder="Enter name" />
        </FormItem>
        <FormItem label="Email" required>
          <Input
            v-model="formData.email"
            type="email"
            placeholder="Enter email"
          />
        </FormItem>
        <FormItem label="Description">
          <Textarea
            v-model="formData.description"
            placeholder="Enter description"
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

// Define your form data type
interface FormData {
  name: string;
  email: string;
  description: string;
  enabled: boolean;
}

const props = withDefaults(
  defineProps<{
    dialog: DialogType<FormData, FormData>;
    title?: string;
    width?: string;
    initialData?: Partial<FormData>;
  }>(),
  {
    width: "500px",
    initialData: () => ({
      name: "",
      email: "",
      description: "",
      enabled: true,
    }),
  },
);

// Initialize form with validation rules
const formInstance = useForm({
  name: [
    { required: true, message: "Name is required" },
    { min: 2, message: "Name must be at least 2 characters" },
  ],
  email: [
    { required: true, message: "Email is required" },
    { type: "email", message: "Invalid email format" },
  ],
  description: [
    { max: 500, message: "Description cannot exceed 500 characters" },
  ],
});

// Form data ref
const formData = ref<FormData>({
  name: props.initialData?.name || "",
  email: props.initialData?.email || "",
  description: props.initialData?.description || "",
  enabled: props.initialData?.enabled ?? true,
});

const saving = ref(false);

// Handle save with validation
async function handleSave() {
  try {
    const valid = await formInstance.validateFields();
    if (valid) {
      saving.value = true;
      // Optional: perform async operations (API call, etc)
      // await submitForm(formData.value);
      props.dialog.finish(formData.value);
    }
  } catch (error) {
    console.error("Validation failed:", error);
  } finally {
    saving.value = false;
  }
}
</script>
