<template>
  <div :class="['flex flex-col', $slots.default ? 'min-h-[32px]' : '']">
    <div
      :class="[
        'stretch size-full',
        !finalHorizontal
          ? 'flex flex-col space-y-2'
          : 'flex space-x-2 [&>div:first-child]:justify-end',
      ]"
    >
      <div
        v-if="hasLabel"
        :class="[
          'flex w-[var(--label-width)] items-start space-x-1 leading-none',
          finalHorizontal ? 'relative top-[8px]' : '',
        ]"
      >
        <div v-if="!$slots.label" :class="['flex items-center text-right']">
          <slot name="prepend-label"></slot>
          <div class="break-all">
            {{ label }}
          </div>
          <div class="ml-[2px] flex items-center gap-2 self-start">
            <FyFormRequired
              v-if="isRequired"
              class="relative top-0"
            ></FyFormRequired>
            <slot
              name="append-label"
              v-bind="{
                update: updateValue,
                validate: parentFormValidate,
                updateModel,
                model,
              }"
            ></slot>
          </div>
        </div>
        <slot v-else name="label"></slot>
        <!-- <div class="text-error relative top-0">
                    {{ isRequired ? '*' : '' }}
                </div> -->
      </div>
      <!-- <slot></slot> -->
      <div
        :class="[
          'relative flex flex-col space-y-1',
          finalHorizontal ? 'min-w-0 flex-1' : 'stretch',
        ]"
      >
        <div
          v-if="$slots.default"
          :class="[
            'stretch stretch flex',
            label ? 'items-stretch' : 'items-center',
          ]"
        >
          <slot
            v-bind="{
              update: updateValue,
              updateModel,
              isError,
              model,
              value: model?.[name as Key] as T extends undefined ? any : T[Key],
              // value: model?.[name as Key],
              name: name as Key,
              emitter: formEmitter,
              validate: parentFormValidate,
              isRequired,
            }"
          ></slot>
          <!-- <template v-else>
                        {{ model?.[name] }}
                    </template> -->
        </div>
        <transition name="fade-translate-from-top" appear>
          <div
            v-if="isError"
            :class="[
              'text-error text-3 leading-none break-all whitespace-pre-wrap',
              staticError
                ? hasLabel
                  ? 'mt-1'
                  : ''
                : 'absolute bottom-[-8px] mt-0 translate-y-full',
            ]"
          >
            {{ errorMessage }}
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script
  setup
  lang="ts"
  generic="
    T extends Partial<Record<string, any>>,
    Key extends keyof T = keyof T
  "
>
import { FormEmitterGenericType, useInjectionKeys } from "./type"
import { UnExpectedError } from "@/utils/error"
import { validate, Rule, ValidateErrorInfo, ValidateOptions } from "./validate"

const props = withDefaults(
  defineProps<{
    name?: Key
    // 可以关闭name警告
    noName?: boolean
    label?: string
    staticError?: boolean
    horizontal?: boolean
    rules?: (fieldRules: Rule[], rules?: Rule[]) => Rule[]

    onSubmit?: FormEmitterGenericType<T>["submit"]
    // onValidate?: FormEmitterGenericType['validate']
    validateOptions?: ValidateOptions
  }>(),
  {
    name: undefined,
    noName: false,
    label: "",
    staticError: false,
    horizontal: undefined,
    rules: (a, b) => [...a, ...(b || [])],
    onSubmit: undefined,
    // onValidate: undefined,
    validateOptions: () => ({}),
  },
)

const slots = useSlots()
const hasLabel = computed(() => !!(slots.label || props.label))

const injectionKeys = useInjectionKeys<T>()

const { value: model, update: updateModel } = (inject(
  injectionKeys.formModel,
) || { update: new Function(), value: {} }) as {
  value: ComputedRef<T>
  update: (val: T) => void
}
function warnNoName() {
  if (!props.noName) {
    console.debug("no name specified for form item: ", props.name)
  }
}
function hasName(d: any): d is string {
  return d === 0 || !!d
}
function updateValue(val: T[Key], autoValidate = false) {
  if (hasName(props.name)) {
    updateModel({
      ...unref(model),
      [props.name]: val,
    })
  } else {
    warnNoName()
  }
  if (autoValidate) {
    parentFormValidate(props.name)
  }
}

const formHorizontal = inject(injectionKeys.formHorizontal)
const finalHorizontal = computed(() =>
  props.horizontal != null ? !!props.horizontal : !!unref(formHorizontal),
)
const formRules = inject(injectionKeys.formRules)
const fieldErrors = inject(injectionKeys.formFieldErrors)
const formEmitter = inject(injectionKeys.formEmitter)
function _submit(...rest: Parameters<FormEmitterGenericType<T>["submit"]>) {
  return props.onSubmit?.(...rest)
}
formEmitter?.on("submit", _submit)
async function _validate(
  ...rest: Parameters<Parameters<NonNullable<typeof formEmitter>["on"]>["1"]>
) {
  if (hasName(props.name)) {
    const [field, rules] = rest
    if ((field && field === fk(props.name)) || (!field && props.name)) {
      return validateCurrentField(rules)
    } else {
      return [] as ValidateErrorInfo[]
    }
  } else {
    warnNoName()
    return []
  }
}
formEmitter?.on("validate", _validate)
onBeforeUnmount(() => {
  formEmitter?.off("validate", _validate)
  formEmitter?.off("submit", _submit)
})

const parentFormValidate = inject(injectionKeys.formValidate, () => {
  throw new UnExpectedError("formValidate inject failed")
})
const fk = inject(injectionKeys.formFieldKey, () => {
  throw new UnExpectedError("formFieldKey inject failed")
})
const fieldRules = computed(() => {
  let rs: Rule[] | Rule = unref(formRules)?.[props.name] || []
  if (!(rs instanceof Array)) {
    rs = [rs]
  }
  return rs
})
const validateCurrentField = async (rules?: Rule[]) => {
  if (props.name) {
    const errors = await validate(
      model.value,
      {
        [props.name]: props.rules(fieldRules.value, rules || []),
      } as { [k in keyof T]: Rule[] },
      props.validateOptions,
    )
    errors.forEach((e) => (e.key = fk(e.key as any)))
    return errors
  } else {
    return []
  }
}
const isRequired = computed(() => {
  if (fieldRules.value instanceof Array) {
    return !!fieldRules.value.find((r) => !!r.required)
  }
  return false
})

const errors = computed(
  () => (props.name && unref(fieldErrors)?.[fk(props.name)]) || [],
)
const isError = computed(() => errors.value.length > 0)
const errorMessage = computed(
  () => errors.value.map((e) => e.message || "").join("，") + "。",
)

defineExpose({
  formRules,
  fieldRules,
})
</script>
