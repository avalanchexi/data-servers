import { createHttp } from './http'

const API_PROXY_PREFIX = '/api'

const http = createHttp({
  baseURL: `${API_PROXY_PREFIX}/v1`,
})

/** 调度定义明细（sys_cron.schedule JSON） */
export interface CronSchedule {
  kind: 'interval' | 'cron' | 'one-shot'
  minutes?: number
  expr?: string
  display?: string
}

/** 单次执行摘要（last_executions 环形条目） */
export interface CronExecution {
  run_at: string
  status: 'ok' | 'error'
  duration_ms: number
  output_file: string
  error: string | null
}

export interface CronJob {
  id: string
  name: string
  /** 注册来源：plugins.* / api.services.* / hooks.*；空为手工创建 */
  plugin: string
  schedule_display: string
  state: string
  enabled: boolean
  next_run_at: string | null
  last_run_at: string | null
  last_status: string | null
  last_error: string | null
  script: string | null
  workdir: string | null
  schedule: CronSchedule | null
  no_agent: boolean
  paused_at: string | null
  paused_reason: string | null
  created_at: string
  completed_count: number
  total_runs: number | null
  last_executions: CronExecution[] | null
}

export interface CronJobList {
  total: number
  items: CronJob[]
}

export interface CronHealth {
  running: boolean
  last_tick_at: string | null
  last_tick_success_at: string | null
  tick_count: number
  tick_success_count: number
}

export interface CronOutput {
  filename: string
  timestamp: string
  size: number
}

export interface CronOutputContent {
  filename: string
  content: string
}

export interface CronActionResponse {
  success: boolean
  message: string
}

export const CronApi = {
  list: () => http.get<CronJobList>('/cron/jobs').then((r) => r.data),

  health: () => http.get<CronHealth>('/cron/health').then((r) => r.data),

  pause: (id: string) => http.post<CronActionResponse>(`/cron/jobs/${id}/pause`).then((r) => r.data),

  resume: (id: string) => http.post<CronActionResponse>(`/cron/jobs/${id}/resume`).then((r) => r.data),

  trigger: (id: string) => http.post<CronActionResponse>(`/cron/jobs/${id}/trigger`).then((r) => r.data),

  remove: (id: string) => http.delete<CronActionResponse>(`/cron/jobs/${id}`).then((r) => r.data),

  outputs: (id: string) => http.get<CronOutput[]>(`/cron/jobs/${id}/outputs`).then((r) => r.data),

  outputContent: (id: string, filename: string) =>
    http.get<CronOutputContent>(`/cron/jobs/${id}/outputs/${filename}`).then((r) => r.data),
}
