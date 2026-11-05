/**
 * 会话管理 API（mock 实现）
 *
 * 原实现通过 hook-fetch 调用 RuoYi 后端 /system/session 接口；
 * 当前 mock：内存 + localStorage 持久化，接口签名与返回结构保持一致，
 * 接入真实后端时只需重写本文件内部实现。
 */
import type { ChatSessionVo, CreateSessionDTO, GetSessionListParams } from "./types"

const STORAGE_KEY = "ai-chat-mock-sessions"

function loadSessions(): ChatSessionVo[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as ChatSessionVo[]
  } catch {
    return []
  }
}

function saveSessions(sessions: ChatSessionVo[]) {
  // prefixIcon 是组件实例，不能序列化
  const plain = sessions.map(({ prefixIcon: _prefixIcon, ...rest }) => rest)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plain))
}

/** 获取会话列表（分页） */
export async function get_session_list(params: GetSessionListParams): Promise<{ rows: ChatSessionVo[] }> {
  const all = loadSessions()
    .filter(s => s.userId === params.userId)
    .sort((a, b) => `${b.createTime}`.localeCompare(`${a.createTime}`))
  const page = params.pageNum ?? 1
  const size = params.pageSize ?? 25
  return { rows: all.slice((page - 1) * size, page * size) }
}

/** 创建会话，返回新会话 id（原接口返回 data 为新 id） */
export async function create_session(data: CreateSessionDTO): Promise<{ data: string }> {
  const sessions = loadSessions()
  const id = `${Date.now()}`
  sessions.unshift({
    id,
    sessionTitle: data.sessionTitle,
    sessionContent: data.sessionContent,
    remark: data.remark,
    userId: data.userId,
    createTime: new Date()
  })
  saveSessions(sessions)
  return { data: id }
}

/** 更新会话 */
export async function update_session(data: ChatSessionVo): Promise<{ data: true }> {
  const sessions = loadSessions()
  const index = sessions.findIndex(s => s.id === data.id)
  if (index >= 0) {
    sessions[index] = { ...sessions[index], ...data }
    saveSessions(sessions)
  }
  return { data: true }
}

/** 查询单个会话 */
export async function get_session(id: string): Promise<{ data: ChatSessionVo }> {
  const session = loadSessions().find(s => s.id === id)
  return { data: session ?? {} }
}

/** 删除会话 */
export async function delete_session(ids: string[]): Promise<{ data: true }> {
  const idSet = new Set(ids)
  saveSessions(loadSessions().filter(s => !idSet.has(`${s.id}`)))
  return { data: true }
}
