export interface RunJobFormData {
  id?: number
  savepointPath?: string
  status?: boolean
  type?: number
  /** 忽略恢复失败，继续执行 */
  allowNonRestoredState: boolean
}

export interface RunJobResponseData {
  id?: number
  savepointPath?: string
  /** 忽略恢复失败，继续执行 */
  allowNonRestoredState?: boolean
}

export interface CheckpointSelectorRequestData {
  jobId: number
}

/** 检查点选择器数据 */
export interface CheckpointSelectorData {
  chkId: number
  /** 类型(false检查点 true保存点) */
  type: boolean
  path: string
  triggerTime: string
}
