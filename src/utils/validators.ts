/**
 * Validation function return value:
 *   undefined / null / true  → valid
 *   false                    → invalid (generic message)
 *   string                   → invalid, use as error message
 *   number                   → invalid, use as error code string
 *   Promise<result>          → async validation
 */
export type ValidateFn = (
  value: any,
) =>
  | undefined
  | null
  | boolean
  | string
  | number
  | Promise<undefined | null | boolean | string | number>;

/**
 * Validator definition: can be a RegExp, pattern string, or validator function
 */
export type Validator = RegExp | string | ValidateFn;

/**
 * Run a validator function and normalize the result
 * @param validator - The validator to run
 * @param value - The value to validate
 * @returns normalized result: { isValid: boolean, message: string | null }
 */
export async function runValidator(
  validator: Validator,
  value: any,
): Promise<{ isValid: boolean; message: string | null }> {
  if (typeof validator === "string") {
    const isValid = new RegExp(validator).test(String(value ?? ""));
    return { isValid, message: isValid ? null : "格式不正确" };
  }

  if (validator instanceof RegExp) {
    const isValid = validator.test(String(value ?? ""));
    return { isValid, message: isValid ? null : "格式不正确" };
  }

  // validator function
  const result = await validator(value);

  if (result === undefined || result === null || result === true) {
    return { isValid: true, message: null };
  }

  if (result === false) {
    return { isValid: false, message: "校验失败" };
  }

  if (typeof result === "number") {
    return { isValid: false, message: String(result) };
  }

  return { isValid: false, message: String(result) };
}

/**
 * Run multiple validators against a value
 * Returns on first validation failure
 */
export async function runValidators(
  validators: Validator[],
  value: any,
): Promise<{ isValid: boolean; message: string | null }> {
  for (const validator of validators) {
    const result = await runValidator(validator, value);
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true, message: null };
}

// ====== Common Validators ======

/**
 * Required validator: value must be non-empty
 */
export const required =
  (message = "此字段必填"): ValidateFn =>
  (value) => {
    const isEmpty =
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "");
    return isEmpty ? message : true;
  };

/**
 * Email validator using regex pattern
 */
export const email =
  (message = "邮箱格式不正确"): ValidateFn =>
  (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(String(value ?? "")) ? true : message;
  };

/**
 * Min length validator
 */
export const minLength =
  (length: number, message?: string): ValidateFn =>
  (value) => {
    const actualLength = String(value ?? "").length;
    return actualLength >= length
      ? true
      : message || `最少需要 ${length} 个字符`;
  };

/**
 * Max length validator
 */
export const maxLength =
  (length: number, message?: string): ValidateFn =>
  (value) => {
    const actualLength = String(value ?? "").length;
    return actualLength <= length
      ? true
      : message || `最多只能 ${length} 个字符`;
  };

/**
 * Pattern validator using regex
 */
export const pattern =
  (regex: RegExp, message = "格式不正确"): ValidateFn =>
  (value) => {
    return regex.test(String(value ?? "")) ? true : message;
  };

/**
 * Custom validator with async support
 */
export const custom = (validatorFn: ValidateFn): ValidateFn => validatorFn;

/**
 * Compose multiple validators into one
 * Returns on first failure
 */
export const compose =
  (validators: Validator[]): ValidateFn =>
  async (value) => {
    return await runValidators(validators, value).then(
      (result) => result.isValid || result.message || false,
    );
  };
