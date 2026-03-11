import FormItem, { type default as FormItemType } from "./FormItem.vue"

export function useFormItem<T extends Partial<Record<string, any>>>() {
  return FormItem as typeof FormItemType<T>
}

export function useForm() {}
