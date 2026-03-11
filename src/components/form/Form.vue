<template>
  <form
    v-if="$props.as === 'form'"
    :style="{ '--label-width': $props.labelWidth }"
    @submit.prevent
  >
    <slot
      v-bind="{
        value: $props['modelValue'],
        isError,
        errors,
        errorList,
        validate,
        fk,
      }"
    ></slot>
  </form>
  <component
    v-else
    :is="$props.as"
    :style="{ '--label-width': $props.labelWidth }"
  >
    <slot
      v-bind="{
        value: $props['modelValue'],
        isError,
        errors,
        errorList,
        validate,
        fk,
      }"
    ></slot
  ></component>
</template>
<script setup lang="ts" generic="T extends Partial<Record<any, any>>">
import { useInjectionKeys } from "./type"
import type {
  FieldErrors,
  FormEmitterGenericType,
  FormFieldKeyFunction,
  FormValidateFunction,
} from "./type"
import { Emitter } from "@/utils/emitter"
import { v4 as uuidv4 } from "uuid"
import { Rules, ValidateErrorInfo } from "./validate"
import { ValidateError } from "@/utils/error"

/*
    增加ID 是为了父子ID间区分相同的field，这样可以在子Item中对父级同名字段进行validate
    统一将所有的错误信息保存在根Form中，使用混入ID的key来设置/获取错误信息
 */
const id = uuidv4()
// field key
const fk: FormFieldKeyFunction<T> = (field) => {
  return `${id}-${field.toString()}`
}
const props = withDefaults(
  defineProps<{
    modelValue?: T
    as?: "div" | "form"
    rules?: Rules<T>
    horizontal?: boolean
    labelWidth?: string
  }>(),
  {
    modelValue: () => ({}) as T,
    as: "form",
    rules: () => ({}),
    horizontal: undefined,
    labelWidth: "",
  },
)

const emit = defineEmits<{
  (e: "update:model-value", val: typeof props.modelValue): void
}>()

const errors = ref<FieldErrors>({})
const errorList = computed(() => Object.values(errors.value).flatMap((d) => d))
const isError = computed(() => Object.keys(errors.value).length > 0)

const injectionKeys = useInjectionKeys<T>()

const formHorizontal = inject(
  injectionKeys.formHorizontal,
  computed(() => false),
)
const parentFormFieldErrors = inject(injectionKeys.formFieldErrors, undefined)

function getErrorsByValidateErrorInfos(infos: ValidateErrorInfo[]) {
  return infos.reduce<FieldErrors>((t, e) => {
    if (e.key) {
      const key = e.key
      if (!t[key]) {
        t[key] = []
      }
      t[key]?.push(e)
    }
    return t
  }, {})
}

const validate: FormValidateFunction<T> = async function (field, rules) {
  const validateErrors = (
    await emitter.emit("validate", field ? fk(field) : field, rules)
  ).flat(Infinity) as ValidateErrorInfo[]
  if (field) {
    errors.value[fk(field)] = validateErrors
  } else {
    errors.value = getErrorsByValidateErrorInfos(validateErrors)
  }
  if (validateErrors.length > 0) {
    throw new ValidateError(validateErrors)
  }
}

const finalHorizontal = computed(() =>
  props.horizontal != null ? !!props.horizontal : !!unref(formHorizontal),
)
const emitter = new Emitter<FormEmitterGenericType<T>>()
provide(injectionKeys.formEmitter, emitter)
const parentEmitter = inject(injectionKeys.formEmitter)
parentEmitter?.onAll(async (c, ...rest) => {
  switch (c) {
    // 如果是 validate，则需要统计当下的错误
    case "validate": {
      const ret = await emitter.emit(c, ...rest)
      const validateErrors = ret.flat(Infinity) as ValidateErrorInfo[]
      const field = rest[0]
      if (field) {
        errors.value[fk(field)] = validateErrors
      } else {
        errors.value = getErrorsByValidateErrorInfos(validateErrors)
      }
      return ret
    }
    case "submit":
      return emitter.emit("submit")
  }
})

provide(injectionKeys.formModel, {
  value: computed(() => props.modelValue || {}),
  update(val: any) {
    emit("update:model-value", val)
  },
})
provide<typeof fk>(injectionKeys.formFieldKey, fk)
provide(
  injectionKeys.formRules,
  computed(() => props.rules),
)

provide(
  injectionKeys.formFieldErrors,
  computed(() => {
    return Object.assign({}, parentFormFieldErrors?.value, errors.value)
  }),
)
provide(
  injectionKeys.formHorizontal,
  computed(() => finalHorizontal.value),
)

provide(injectionKeys.formValidate, validate)

defineExpose({
  validate,
  submit() {
    return emitter.emit("submit")
  },
})
</script>
