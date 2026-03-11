import Form from "./Form.vue"
import FormItem from "./FormItem.vue"
export { default as Form } from "./Form.vue"
export { default as FormItem } from "./FormItem.vue"
import type { InjectionKey, Ref } from "vue"
import { Rule, Rules, ValidateErrorInfo } from "./validate"
import { Emitter } from "@/utils/emitter"
import { ComponentProps } from "vue-component-type-helpers"

export type EditableProvider<T = any> = {
  value: MaybeRef<T>
  update(val: any): void
}

export type FormValidateFunction<T> = (
  field?: keyof T,
  rules?: Rule[],
) => Promise<void>

export type FormFieldKeyFunction<T> = (k: keyof T) => string
export type FormEmitter<T> = Emitter<FormEmitterGenericType<T>>

export const useInjectionKeys = <T extends Partial<Record<string, any>>>() => ({
  formRules: Symbol("formRules") as InjectionKey<MaybeRef<Rules<T>>>,
  formModel: Symbol("formModel") as InjectionKey<EditableProvider<T>>,
  formFieldErrors: Symbol("formFieldErrors") as InjectionKey<
    MaybeRef<FieldErrors<T>>
  >,
  formValidate: Symbol("formValidate") as InjectionKey<FormValidateFunction<T>>,
  formHorizontal: Symbol("formHorizontal") as InjectionKey<MaybeRef<boolean>>,
  formEmitter: Symbol("formEmitter") as InjectionKey<FormEmitter<T>>,
  formFieldKey: Symbol("formFieldKey") as InjectionKey<FormFieldKeyFunction<T>>,
})

export type FormEmitterGenericType<T> = {
  submit: () => void
  validate: (field?: keyof T, rules?: Rule[]) => ValidateErrorInfo[]
}

export type FieldErrors<
  T extends Partial<Record<any, any>> = Partial<Record<any, any>>,
> = Partial<Record<keyof T, ValidateErrorInfo[]>>

export type FormType = ComponentProps<typeof Form>
export type FormRef<T extends Record<any, any> = any> = Ref<
  ComponentProps<typeof Form<T>> | undefined
>
export type FormsRef = Ref<ComponentProps<typeof Form>[]>
export type FormItemRef = Ref<ComponentProps<typeof FormItem> | undefined>
