import { apiClient } from './core'

export interface LogModuleInfo {
  name: string
  path: string
  size_bytes: number
  last_modified: string | null
  log_level: string
}

export interface LogContentResponse {
  name: string
  path: string
  content: string
  total_lines: number
  truncated: boolean
}

export interface LogLevelResponse {
  name: string
  logger_name: string
  level: string
}

export interface SetLogLevelRequest {
  level: string
}

export interface ClearLogsResponse {
  cleared: number
  names: string[]
}

export interface VectorTableRow {
  [key: string]: unknown
}

export interface VectorTableInfo {
  name: string
  row_count: number
}

export interface VectorTableData {
  table: string
  rows: VectorTableRow[]
  total: number
}

export interface SQLiteDBInfo {
  name: string
  path: string
  size_bytes: number
  last_modified: string | null
  description: string
}

export interface SQLiteTableInfo {
  db_name: string
  name: string
  num_rows: number
  num_columns: number
  columns: string[]
}

export interface SQLiteTableData {
  db_name: string
  table_name: string
  columns: string[]
  rows: Record<string, unknown>[]
  total_rows: number
  truncated: boolean
}

/** 列出所有日志模块 */
export const listLogModules = async (): Promise<LogModuleInfo[]> => {
  const res = await apiClient.get<LogModuleInfo[]>('/v1/admin/system-monitor/logs')
  return res.data
}

/** 获取指定日志模块的文件内容 */
export const getLogContent = async (name: string): Promise<LogContentResponse> => {
  const res = await apiClient.get<LogContentResponse>(`/v1/admin/system-monitor/logs/${encodeURIComponent(name)}`)
  return res.data
}

/** 清空指定日志文件 */
export const clearLogFile = async (name: string): Promise<void> => {
  await apiClient.delete(`/v1/admin/system-monitor/logs/${encodeURIComponent(name)}`)
}

/** 下载指定日志文件到本地 */
export const downloadLogFile = async (name: string): Promise<void> => {
  const response = await apiClient.get<Blob>(
    `/v1/admin/system-monitor/logs/${encodeURIComponent(name)}/download`,
    { responseType: 'blob' },
  )
  const disposition = response.headers['content-disposition']
  const match = typeof disposition === 'string' ? disposition.match(/filename="?([^"]+)"?/) : null
  const filename = match?.[1] || `${name.replace(/\//g, '-')}.log`
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** 清空所有日志文件 */
export const clearAllLogs = async (): Promise<ClearLogsResponse> => {
  const res = await apiClient.delete<ClearLogsResponse>('/v1/admin/system-monitor/logs')
  return res.data
}

/** 获取指定日志模块的当前级别 */
export const getLogLevel = async (name: string): Promise<LogLevelResponse> => {
  const res = await apiClient.get<LogLevelResponse>(`/v1/admin/system-monitor/logs/${encodeURIComponent(name)}/level`)
  return res.data
}

/** 设置指定日志模块的级别 */
export const setLogLevel = async (name: string, level: string): Promise<LogLevelResponse> => {
  const res = await apiClient.put<LogLevelResponse>(`/v1/admin/system-monitor/logs/${encodeURIComponent(name)}/level`, { level })
  return res.data
}

/** 列出所有向量表 */
export const listVectorTables = async (): Promise<VectorTableInfo[]> => {
  const res = await apiClient.get<VectorTableInfo[]>('/v1/admin/system-monitor/vector-tables')
  return res.data
}

/** 获取指定向量表的数据预览 */
export const getVectorTableData = async (name: string, limit = 20): Promise<VectorTableData> => {
  const res = await apiClient.get<VectorTableData>(`/v1/admin/system-monitor/vector-tables/${encodeURIComponent(name)}`, {
    params: { limit },
  })
  return res.data
}

/** 列出所有 SQLite 数据库文件 */
export const listSQLiteDBs = async (): Promise<SQLiteDBInfo[]> => {
  const res = await apiClient.get<SQLiteDBInfo[]>('/v1/admin/system-monitor/sqlite')
  return res.data
}

/** 获取指定 SQLite 数据库的表列表 */
export const getSQLiteTables = async (dbName: string): Promise<SQLiteTableInfo[]> => {
  const res = await apiClient.get<SQLiteTableInfo[]>(`/v1/admin/system-monitor/sqlite/${encodeURIComponent(dbName)}/tables`)
  return res.data
}

/** 列出所有 SQLite 表的数据预览 */
export const getSQLiteTableData = async (dbName: string, tableName: string, limit = 100): Promise<SQLiteTableData> => {
  const res = await apiClient.get<SQLiteTableData>(
    `/v1/admin/system-monitor/sqlite/${encodeURIComponent(dbName)}/tables/${encodeURIComponent(tableName)}`,
    { params: { limit } },
  )
  return res.data
}

// ── Dashboard ────────────────────────────────────────────────

export interface CronJobSummary {
  total: number
  enabled: number
  paused: number
  failed: number
}

export interface DashboardData {
  log_count: number
  log_total_size_bytes: number
  log_modules: LogModuleInfo[]
  sqlite_count: number
  sqlite_total_size_bytes: number
  sqlite_dbs: SQLiteDBInfo[]
  vector_table_count: number
  vector_tables: VectorTableInfo[]
  cron_jobs: CronJobSummary
  system_path: string
}

/** 获取 Dashboard 概览聚合数据 */
export const getDashboardData = async (): Promise<DashboardData> => {
  const res = await apiClient.get<DashboardData>('/v1/admin/system-monitor/dashboard')
  return res.data
}
