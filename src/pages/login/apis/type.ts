export interface LoginRequestData {
  /** 用户名 */
  username: string
  /** 密码 */
  password: string
  /** 验证码ID */
  captchaId: string
  /** 验证码 */
  code: string
}

export type CaptchaResponseData = ApiResponseData<{
  id: string
  captchaBase64: string
}>

export type LoginResponseData = ApiResponseData<{ token: string }>
