import { createHttp } from './http'

const API_PROXY_PREFIX = '/api'

const http = createHttp({
  baseURL: `${API_PROXY_PREFIX}/v1/datasources`,
})

export type DataSourceCategory = 'database' | 'api' | 'filesystem' | 'messaging' | 'nosql'

export type DataSourceType =
  | 'mysql' | 'postgresql' | 'mariadb' | 'oracle' | 'sqlserver' | 'sqlite'
  | 'rest_api' | 'graphql'
  | 's3' | 'gcs' | 'oss' | 'azure' | 'local'
  | 'csv' | 'json' | 'parquet' | 'excel'

export interface DataSourceConfig {
  host?: string
  port?: number
  database?: string
  username?: string
  password?: string
  options?: Record<string, string>
  [key: string]: unknown
}

export interface ApiAuthConfig {
  token?: string
  key?: string
  key_name?: string
  username?: string
  password?: string
}

export interface DataSourceItem {
  id: string
  name: string
  type: DataSourceType
  source_category: DataSourceCategory
  config: DataSourceConfig
  description: string | null
  owner_id: string | null
  owner_name: string | null
  api_base_url?: string
  api_auth_type?: string
  api_pagination?: string
  storage_type?: string
  bucket_url?: string
  file_pattern?: string
  created_at: string
  updated_at: string
}

export interface DataSourceListResponse {
  total: number
  items: DataSourceItem[]
  limit: number
  offset: number
}

export interface TestDataSourceResult {
  success: boolean
  message: string
  latency_ms?: number
}

export interface TableSchemaInfo {
  table_name: string
  row_count: number | null
  table_comment?: string
  columns: Array<{
    name: string
    type: string
    nullable: boolean
    default: string | null
    comment?: string
  }>
}

export interface ApiResourceSchema {
  path: string
  method: string
  inferred_schema: Record<string, unknown>
  sample_count: number
  error?: string
}

export interface FileSchemaInfo {
  filename: string
  type: string
  fields: Array<{
    field_name: string
    data_type: string
    nullable: boolean
  }>
  error?: string
}

export interface DatasourceSchemaResponse {
  datasource_id: string
  datasource_name: string
  type: string
  database: string
  schema: string
  tables: TableSchemaInfo[]
  resources: ApiResourceSchema[]
  files: Array<{ name: string; size: number; modified_at: string }>
  file_schemas: FileSchemaInfo[]
  total_tables: number
  total_rows: number
  total_files: number
}

export interface TablePreviewResponse {
  columns: string[]
  column_comments?: string[]
  rows: unknown[][]
  total: number
}

export interface DataSourceTypeConnector {
  type: DataSourceType
  label: string
  description: string
}

export interface DataSourceTypeCategory {
  type: DataSourceCategory
  label: string
  icon: string
  connectors: DataSourceTypeConnector[]
}

export interface DataSourceTypesResponse {
  categories: DataSourceTypeCategory[]
}

export const DATASOURCE_TYPES: { value: DataSourceType; label: string; category: DataSourceCategory }[] = [
  { value: 'mysql', label: 'MySQL', category: 'database' },
  { value: 'postgresql', label: 'PostgreSQL', category: 'database' },
  { value: 'mariadb', label: 'MariaDB', category: 'database' },
  { value: 'oracle', label: 'Oracle', category: 'database' },
  { value: 'sqlserver', label: 'SQL Server', category: 'database' },
  { value: 'sqlite', label: 'SQLite', category: 'database' },
  { value: 'rest_api', label: 'REST API', category: 'api' },
  { value: 'graphql', label: 'GraphQL', category: 'api' },
  { value: 'oss', label: '阿里云 OSS', category: 'filesystem' },
  { value: 'csv', label: 'CSV 文件', category: 'filesystem' },
  { value: 'json', label: 'JSON 文件', category: 'filesystem' },
  { value: 'excel', label: 'Excel 文件', category: 'filesystem' },
]

export const DATASOURCE_CATEGORY_LABELS: Record<DataSourceCategory, string> = {
  database: '关系型数据库',
  api: 'API 数据源',
  filesystem: '文件/云存储',
  messaging: '消息队列',
  nosql: 'NoSQL',
}

export const DATASOURCE_CATEGORY_ICONS: Record<DataSourceCategory, string> = {
  database: 'Database',
  api: 'Cloud',
  filesystem: 'FolderOpen',
  messaging: 'MessageSquare',
  nosql: 'Server',
}

export const DATASOURCE_DEFAULT_PORTS: Record<DataSourceType, number> = {
  mysql: 3306,
  postgresql: 5432,
  mariadb: 3306,
  oracle: 1521,
  sqlserver: 1433,
  sqlite: 0,
  rest_api: 0,
  graphql: 0,
  s3: 0,
  gcs: 0,
  oss: 0,
  azure: 0,
  local: 0,
  csv: 0,
  json: 0,
  parquet: 0,
  excel: 0,
}

export const DataSourceApi = {
  list: (params?: { keyword?: string; type?: string; source_category?: string; limit?: number; offset?: number }) =>
    http.get<DataSourceListResponse>('', { params }).then((r) => r.data),

  getTypes: () =>
    http.get<DataSourceTypesResponse>('/types').then((r) => r.data),

  create: (payload: {
    name: string
    type: DataSourceType
    config: Record<string, unknown>
    description?: string
    source_category?: string
    api_base_url?: string
    api_auth_type?: string
    api_auth_config?: ApiAuthConfig
    api_pagination?: string
    storage_type?: string
    bucket_url?: string
    file_pattern?: string
    extra_config?: Record<string, unknown>
  }) =>
    http.post<DataSourceItem>('', payload).then((r) => r.data),

  get: (id: string) => http.get<DataSourceItem>(`/${id}`).then((r) => r.data),

  update: (id: string, payload: Partial<{
    name: string
    type: DataSourceType
    config: DataSourceConfig
    source_category: string
    description: string
    storage_type: string
    bucket_url: string
    file_pattern: string
  }>) =>
    http.patch<DataSourceItem>(`/${id}`, payload).then((r) => r.data),

  remove: (id: string) => http.delete(`/${id}`).then(() => true),

  test: (payload: { type: DataSourceType; config: DataSourceConfig }) =>
    http.post<TestDataSourceResult>('/test', payload).then((r) => r.data),

  getSchema: (id: string) => http.get<DatasourceSchemaResponse>(`/${id}/schema`).then((r) => r.data),

  previewTableData: (datasourceId: string, tableName: string, limit = 1000) =>
    http.get<TablePreviewResponse>(`/${datasourceId}/tables/${encodeURIComponent(tableName)}/data`, {
      params: { limit },
    }).then((r) => r.data),

  getTableRowCount: (datasourceId: string, tableName: string) =>
    http.get<{ table_name: string; row_count: number }>(
      `/${datasourceId}/tables/${encodeURIComponent(tableName)}/row-count`
    ).then((r) => r.data),

  getTableRowCounts: (datasourceId: string, tableNames: string[]) =>
    http.post<{ counts: Array<{ table_name: string; row_count: number }> }>(
      `/${datasourceId}/tables/row-counts`,
      { table_names: tableNames }
    ).then((r) => r.data),

  // 手动刷新 PostgreSQL 统计信息（ANALYZE），修复行数显示为 0 的问题
  refreshTableStats: (datasourceId: string, tableNames?: string[]) =>
    http.post<{ tables: string[]; analyzed_count: number }>(
      `/${datasourceId}/refresh-stats`,
      tableNames ? { table_names: tableNames } : undefined
    ).then((r) => r.data),

  copy: (id: string) => http.post<DataSourceItem>(`/${id}/copy`).then((r) => r.data),
}
