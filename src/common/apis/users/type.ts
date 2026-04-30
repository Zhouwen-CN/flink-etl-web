export type CurrentUserResponseData = ApiResponseData<{ id: number, username: string, nickname: string, roles: string[], permissions: string[] }>
export type LogoutResponseData = ApiResponseData<void>
