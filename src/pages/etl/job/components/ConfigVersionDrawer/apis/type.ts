/** 配置版本数据 */
export interface ConfigVersionData {
  id: number
  jobId: number
  /** 版本号 */
  version: number
  /** json配置快照 */
  config: string
  /** 操作类型 */
  operationType: string
  /** 回滚来源版本号 */
  sourceVersion?: number
  /** 创建者 */
  createUser: string
  /** 创建时间 */
  createTime: string
}

export interface ConfigVersionRequestData {
  /** 任务ID */
  jobId: number
}

export interface ConfigRollbackRequestData {
  /** 任务ID */
  jobId: number
  /** 回滚目标版本号 */
  version: number
}
