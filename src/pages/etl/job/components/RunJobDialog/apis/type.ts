export interface RunJobFormData {
  id?: number
  savepointPath?: string
  status?: boolean
  type?: number
}

export interface RunJobResponseData {
  id?: number
  savepointPath?: string
}

export interface CheckpointSelectorRequestData {
  jobId: number
}
