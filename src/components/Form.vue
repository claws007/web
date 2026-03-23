<script setup lang="ts">
import { useForm } from "@/composables/useForm";
import type { Validator } from "@/utils/validators";

const props = defineProps<{
  // Field name => validators mapping
  validators?: Record<string, Validator[]>;
}>();

const emit = defineEmits<{
  submit: [];
  reset: [];
  invalid: [
    payload: { errors: Record<string, string | null>; failedFields: string[] },
  ];
}>();

// Initialize form with provided validators
const form = useForm(props.validators);

async function handleSubmit() {
  // On submit, force all fields into touched state so child components can show errors.
  form.touchAllFields();
  const isValid = await form.validateAll();
  form.notifySubmitValidationResult(isValid);

  if (isValid) {
    emit("submit");
    return;
  }

  emit("invalid", {
    errors: form.errors,
    failedFields: form.lastFailedFields,
  });
}

function handleReset() {
  form.resetForm();
  emit("reset");
}

// Expose form methods for parent component access
defineExpose({
  get isValid() {
    return form.isValid;
  },
  get isValidating() {
    return form.isValidating;
  },
  get errors() {
    return form.errors;
  },
  get fields() {
    return form.fields;
  },
  validateField: form.validateField,
  validateAll: form.validateAll,
  touchAllFields: form.touchAllFields,
  submitValidationVersion: form.submitValidationVersion,
  lastFailedFields: form.lastFailedFields,
  resetForm: form.resetForm,
  getField: form.getField,
  getFieldError: form.getFieldError,
  registerField: form.registerField,
  unregisterField: form.unregisterField,
  updateFieldValue: form.updateFieldValue,
  updateFieldTouched: form.updateFieldTouched,
});
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <slot />
    <div class="form-actions" style="display: none">
      <button type="submit" hidden />
      <button type="reset" @click.prevent="handleReset" hidden />
    </div>
  </form>
</template>

<style scoped>
form {
  display: contents;
}

.form-actions {
  display: none;
}
</style>
