export interface CurrentUserData {
  id: number
  username: string
  nickname: string
  roles: string[]
  permissions: string[]
}

export type CurrentUserResponseData = ApiResponseData<CurrentUserData>

export interface UpdatePasswordRequestData {
  oldPwd: string
  newPwd: string
  confirmPwd: string
}
