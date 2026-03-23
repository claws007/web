import { computed, inject, provide, reactive, ref } from "vue";
import type { Validator } from "@/utils/validators";
import { runValidators } from "@/utils/validators";

/**
 * Field state in form
 */
export interface FieldState {
  name: string;
  value: any;
  touched: boolean;
  isValid: boolean;
  isValidating: boolean;
  error: string | null;
  validators: Validator[];
}

/**
 * Form context provided to child components
 */
export interface FormContextType {
  fields: Map<string, FieldState>;
  isValid: boolean;
  isValidating: boolean;
  errors: Record<string, string | null>;
  submitValidationVersion: number;
  lastFailedFields: string[];

  // Field management
  registerField(name: string, validators?: Validator[]): void;
  unregisterField(name: string): void;
  updateFieldValue(name: string, value: any): void;
  updateFieldTouched(name: string, touched: boolean): void;
  updateFieldValidators(name: string, validators: Validator[]): void;
  getField(name: string): FieldState | undefined;
  getFieldError(name: string): string | null;

  // Validation
  validateField(name: string): Promise<boolean>;
  validateAll(): Promise<boolean>;
  touchAllFields(): void;
  notifySubmitValidationResult(isValid: boolean): void;
  resetForm(): void;
}

const FormContextKey = Symbol("FormContext");

/**
 * useForm: Main hook to create and manage form state
 * Usage:
 *   const form = useForm()
 *   // or with initial fields
 *   const form = useForm({
 *     username: [required(), minLength(3)],
 *     email: [required(), email()]
 *   })
 */
export function useForm(
  initialValidators?: Record<string, Validator[]>,
): FormContextType {
  const fields = reactive(new Map<string, FieldState>());
  const isValidating = ref(false);
  const submitValidationVersion = ref(0);
  const lastFailedFields = ref<string[]>([]);

  // Computed properties
  const isValidComputed = computed(() => {
    if (fields.size === 0) return true;
    return Array.from(fields.values()).every((field) => field.isValid);
  });

  const errorsComputed = computed(() => {
    const errors: Record<string, string | null> = {};
    for (const [name, field] of fields) {
      if (field.error) {
        errors[name] = field.error;
      }
    }
    return errors;
  });

  // Provide context to child components
  const context: FormContextType = {
    fields,
    get isValidating() {
      return isValidating.value;
    },
    get isValid() {
      return isValidComputed.value;
    },
    get errors() {
      return errorsComputed.value;
    },
    get submitValidationVersion() {
      return submitValidationVersion.value;
    },
    get lastFailedFields() {
      return lastFailedFields.value;
    },

    registerField(name: string, validators: Validator[] = []) {
      if (fields.has(name)) {
        console.warn(`Field "${name}" is already registered`);
        return;
      }

      fields.set(name, {
        name,
        value: undefined,
        touched: false,
        isValid: true,
        isValidating: false,
        error: null,
        validators,
      });
    },

    unregisterField(name: string) {
      fields.delete(name);
    },

    updateFieldValue(name: string, value: any) {
      const field = fields.get(name);
      if (!field) return;

      field.value = value;
      // Trigger validation on value change if field has been touched
      if (field.touched) {
        context.validateField(name).catch(() => {
          // Silently fail, error is stored in field.error
        });
      }
    },

    updateFieldTouched(name: string, touched: boolean) {
      const field = fields.get(name);
      if (!field) return;
      field.touched = touched;
    },

    updateFieldValidators(name: string, validators: Validator[]) {
      const field = fields.get(name);
      if (!field) return;
      field.validators = validators;
    },

    getField(name: string): FieldState | undefined {
      return fields.get(name);
    },

    getFieldError(name: string): string | null {
      return fields.get(name)?.error ?? null;
    },

    async validateField(name: string): Promise<boolean> {
      const field = fields.get(name);
      if (!field) return true;

      field.isValidating = true;
      try {
        const result = await runValidators(field.validators, field.value);
        field.isValid = result.isValid;
        field.error = result.message;
        return result.isValid;
      } finally {
        field.isValidating = false;
      }
    },

    async validateAll(): Promise<boolean> {
      isValidating.value = true;
      try {
        const results = await Promise.all(
          Array.from(fields.keys()).map((name) => context.validateField(name)),
        );
        return results.every((valid) => valid);
      } finally {
        isValidating.value = false;
      }
    },

    touchAllFields() {
      for (const field of fields.values()) {
        field.touched = true;
      }
    },

    notifySubmitValidationResult(isValid: boolean) {
      submitValidationVersion.value += 1;
      if (isValid) {
        lastFailedFields.value = [];
        return;
      }

      const failed: string[] = [];
      for (const [name, field] of fields) {
        if (!field.isValid) {
          failed.push(name);
        }
      }
      lastFailedFields.value = failed;
    },

    resetForm() {
      for (const field of fields.values()) {
        field.value = undefined;
        field.touched = false;
        field.isValid = true;
        field.error = null;
        field.isValidating = false;
      }
      lastFailedFields.value = [];
    },
  };

  // Register initial fields if provided
  if (initialValidators) {
    for (const [name, validators] of Object.entries(initialValidators)) {
      context.registerField(name, validators);
    }
  }

  // Provide to child components via provide/inject
  provide(FormContextKey, context);

  return context;
}

/**
 * useFormContext: Get form context from parent Form component
 * Usage in Input or other field components:
 *   const form = useFormContext()
 */
export function useFormContext(): FormContextType | null {
  return inject<FormContextType | null>(FormContextKey, null);
}
