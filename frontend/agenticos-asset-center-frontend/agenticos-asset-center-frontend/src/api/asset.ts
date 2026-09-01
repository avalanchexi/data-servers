/**
 * 资产中心前端 API 客户端（DCMM 九大能力域）
 * 后端基路径：/v1/asset/*（通过 vite proxy /api 转发）
 */
import { createHttp } from './http'

const API_PROXY_PREFIX = '/api'

// ── 资产总览 ────────────────────────────────────────────
const overviewHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}/v1/asset/overview` })

// ── 数据地图（检索 + 采集任务 + 类目）─────────────────────
const mapHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}/v1/asset/map` })
const collectHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}/v1/asset/collect` })

// ── 资产目录 ────────────────────────────────────────────
const catalogHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}/v1/asset/catalog` })

// ── 数据标准 ────────────────────────────────────────────
const standardHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}/v1/asset/standard` })

// ── 数据质量 ────────────────────────────────────────────
const qualityHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}/v1/asset/quality` })

// ── 数据安全 ────────────────────────────────────────────
const securityHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}/v1/asset/security` })

// ── 数据生命周期 ────────────────────────────────────────
const lifecycleHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}/v1/asset/lifecycle` })

// ── 数据服务 ────────────────────────────────────────────
const serviceHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}/v1/asset/service` })

// ── 治理评估 ────────────────────────────────────────────
const dcmmHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}/v1/asset/dcmm` })

// ── 数据架构（只读聚合，复用数据地图菜单权限）─────────────
const architectureHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}/v1/asset/architecture` })

// ── 治理中心 + 资产360（只读聚合，复用资产总览读权限）────────
const governanceHttp = createHttp({ baseURL: `${API_PROXY_PREFIX}/v1/asset/governance` })

export interface ListResponse<T> {
  items: T[]
  total: number
}

export const AssetOverviewApi = {
  panorama: () => overviewHttp.get<Record<string, unknown>>('/panorama').then((r) => r.data),
  healthScores: () => overviewHttp.get<Record<string, unknown>>('/health-scores').then((r) => r.data),
  rankings: (params?: { dimension?: string; limit?: number }) =>
    overviewHttp.get<Record<string, unknown>>('/rankings', { params }).then((r) => r.data),
  problemDashboard: () =>
    overviewHttp.get<Record<string, unknown>>('/problem-dashboard').then((r) => r.data),
}

export const AssetMapApi = {
  search: (params: {
    keyword?: string
    entity_type?: string
    domain?: string
    classification_level?: string
    datasource_id?: string
    catalog_name?: string
    schema_name?: string
    limit?: number
    offset?: number
  }) => mapHttp.get<Record<string, unknown>>('/search', { params }).then((r) => r.data),
  hotRanking: (params?: { entity_type?: string; limit?: number }) =>
    mapHttp.get<Record<string, unknown>>('/hot-ranking', { params }).then((r) => r.data),
  detail: (entityType: string, entityId: string) =>
    mapHttp.get<Record<string, unknown>>(`/detail/${entityType}/${entityId}`).then((r) => r.data),
  preview: (entityType: string, entityId: string, params?: { limit?: number }) =>
    mapHttp
      .get<Record<string, unknown>>(`/preview/${entityType}/${entityId}`, { params })
      .then((r) => r.data),
  report: (entityType: string, entityId: string) =>
    mapHttp.get<Record<string, unknown>>(`/report/${entityType}/${entityId}`).then((r) => r.data),
  recordUsage: (payload: { asset_id: string; view_count?: number }) =>
    mapHttp.post('/usage', payload).then((r) => r.data),
}

export const AssetCollectApi = {
  listTasks: (params?: { keyword?: string; datasource_id?: string; status?: string; limit?: number; offset?: number }) =>
    collectHttp.get<ListResponse<Record<string, unknown>>>('/tasks', { params }).then((r) => r.data),
  getTask: (taskId: string) =>
    collectHttp.get<Record<string, unknown>>(`/tasks/${taskId}`).then((r) => r.data),
  createTask: (payload: Record<string, unknown>) =>
    collectHttp.post('/tasks', payload).then((r) => r.data),
  updateTask: (taskId: string, payload: Record<string, unknown>) =>
    collectHttp.put(`/tasks/${taskId}`, payload).then((r) => r.data),
  deleteTask: (taskId: string) => collectHttp.delete(`/tasks/${taskId}`).then(() => true),
  runTask: (taskId: string) => collectHttp.post(`/tasks/${taskId}/run`).then((r) => r.data),
  changeTaskStatus: (taskId: string, payload: { target: string }) =>
    collectHttp.post(`/tasks/${taskId}/status`, payload).then((r) => r.data),
  listLogs: (params?: { task_id?: string; status?: string; limit?: number; offset?: number }) =>
    collectHttp.get<ListResponse<Record<string, unknown>>>('/logs', { params }).then((r) => r.data),
}

export const AssetCatalogApi = {
  listItems: (params?: Record<string, unknown>) =>
    catalogHttp.get<ListResponse<Record<string, unknown>>>('/items', { params }).then((r) => r.data),
  getItem: (itemId: string) =>
    catalogHttp.get<Record<string, unknown>>(`/items/${itemId}`).then((r) => r.data),
  createItem: (payload: Record<string, unknown>) =>
    catalogHttp.post('/items', payload).then((r) => r.data),
  updateItem: (itemId: string, payload: Record<string, unknown>) =>
    catalogHttp.put(`/items/${itemId}`, payload).then((r) => r.data),
  deleteItem: (itemId: string) => catalogHttp.delete(`/items/${itemId}`).then(() => true),
  changeItemStatus: (itemId: string, payload: { target: string }) =>
    catalogHttp.post(`/items/${itemId}/status`, payload).then((r) => r.data),
  batchStatus: (payload: { item_ids: string[]; target: string }) =>
    catalogHttp.post('/items/batch-status', payload).then((r) => r.data),
  priceItem: (itemId: string, payload: Record<string, unknown>) =>
    catalogHttp.post(`/items/${itemId}/price`, payload).then((r) => r.data),
  // ── 物理 Catalog（一级管理对象） ──
  listCatalogs: (params?: Record<string, unknown>) =>
    catalogHttp.get<Record<string, unknown>[]>('/catalogs', { params }).then((r) => r.data),
  getCatalog: (catalogId: string) =>
    catalogHttp.get<Record<string, unknown>>(`/catalogs/${catalogId}`).then((r) => r.data),
  createCatalog: (payload: Record<string, unknown>) =>
    catalogHttp.post('/catalogs', payload).then((r) => r.data),
  updateCatalog: (catalogId: string, payload: Record<string, unknown>) =>
    catalogHttp.put(`/catalogs/${catalogId}`, payload).then((r) => r.data),
  deleteCatalog: (catalogId: string) =>
    catalogHttp.delete(`/catalogs/${catalogId}`).then(() => true),
  bindCatalogDatasource: (catalogId: string, datasourceId: string | null) =>
    catalogHttp.post<Record<string, unknown>>(`/catalogs/${catalogId}/bind-datasource`, { datasource_id: datasourceId }).then((r) => r.data),
  syncPolarisCatalogs: (datasourceId: string) =>
    catalogHttp.post<Record<string, unknown>>('/catalogs/sync-polaris', { datasource_id: datasourceId }).then((r) => r.data),
  inheritanceCheck: (catalogId: string) =>
    catalogHttp.get<Record<string, unknown>>(`/catalogs/${catalogId}/inheritance`).then((r) => r.data),
  listCatalogSchemas: (catalogId: string) =>
    catalogHttp.get<Record<string, unknown>>(`/catalogs/${catalogId}/schemas`).then((r) => r.data),
  listCatalogObjects: (catalogId: string, params?: Record<string, unknown>) =>
    catalogHttp.get<ListResponse<Record<string, unknown>>>(`/catalogs/${catalogId}/objects`, { params }).then((r) => r.data),
  listGlobalObjects: (params?: Record<string, unknown>) =>
    catalogHttp.get<ListResponse<Record<string, unknown>>>('/global-objects', { params }).then((r) => r.data),
  // ── 业务目录树（ledger domain_node/category_node） ──
  listCategoryTree: () =>
    catalogHttp.get<Record<string, unknown>[]>('/category-tree').then((r) => r.data),
  createCategoryNode: (payload: Record<string, unknown>) =>
    catalogHttp.post('/category-tree', payload).then((r) => r.data),
  updateCategoryNode: (nodeId: string, payload: Record<string, unknown>) =>
    catalogHttp.put(`/category-tree/${nodeId}`, payload).then((r) => r.data),
  deleteCategoryNode: (nodeId: string) =>
    catalogHttp.delete(`/category-tree/${nodeId}`).then(() => true),
  listOwnerships: (params?: Record<string, unknown>) =>
    catalogHttp.get<ListResponse<Record<string, unknown>>>('/ownerships', { params }).then((r) => r.data),
  createOwnership: (payload: Record<string, unknown>) =>
    catalogHttp.post('/ownerships', payload).then((r) => r.data),
  approveOwnership: (ownershipId: string, payload: { approved: boolean }) =>
    catalogHttp.post(`/ownerships/${ownershipId}/approve`, payload).then((r) => r.data),
  listValuations: (params?: Record<string, unknown>) =>
    catalogHttp.get<ListResponse<Record<string, unknown>>>('/valuations', { params }).then((r) => r.data),
  confirmValuationAccounting: (valuationId: string, payload: { action: string; comment?: string }) =>
    catalogHttp.post(`/valuations/${valuationId}/accounting`, payload).then((r) => r.data),
  listOrders: (params?: Record<string, unknown>) =>
    catalogHttp.get<ListResponse<Record<string, unknown>>>('/orders', { params }).then((r) => r.data),
  changeOrderStatus: (orderId: string, payload: { target: string }) =>
    catalogHttp.post(`/orders/${orderId}/status`, payload).then((r) => r.data),
  listUsageStats: (params?: Record<string, unknown>) =>
    catalogHttp.get<ListResponse<Record<string, unknown>>>('/usage-stats', { params }).then((r) => r.data),
}

export const AssetStandardApi = {
  listStandards: (params?: Record<string, unknown>) =>
    standardHttp.get<ListResponse<Record<string, unknown>>>('/standards', { params }).then((r) => r.data),
  getStandard: (standardId: string) =>
    standardHttp.get<Record<string, unknown>>(`/standards/${standardId}`).then((r) => r.data),
  createStandard: (payload: Record<string, unknown>) =>
    standardHttp.post('/standards', payload).then((r) => r.data),
  updateStandard: (standardId: string, payload: Record<string, unknown>) =>
    standardHttp.put(`/standards/${standardId}`, payload).then((r) => r.data),
  deleteStandard: (standardId: string) =>
    standardHttp.delete(`/standards/${standardId}`).then(() => true),
  approveStandard: (standardId: string, payload: { approved: boolean; approver: string; comment?: string }) =>
    standardHttp.post(`/standards/${standardId}/approve`, payload).then((r) => r.data),
  changeStandardStatus: (standardId: string, payload: { target: string }) =>
    standardHttp.post(`/standards/${standardId}/status`, payload).then((r) => r.data),
  listCodes: (params?: Record<string, unknown>) =>
    standardHttp.get<ListResponse<Record<string, unknown>>>('/codes', { params }).then((r) => r.data),
  createCode: (payload: Record<string, unknown>) =>
    standardHttp.post('/codes', payload).then((r) => r.data),
  updateCode: (codeId: string, payload: Record<string, unknown>) =>
    standardHttp.put(`/codes/${codeId}`, payload).then((r) => r.data),
  deleteCode: (codeId: string) => standardHttp.delete(`/codes/${codeId}`).then(() => true),
  listNamingDict: (params?: Record<string, unknown>) =>
    standardHttp.get<ListResponse<Record<string, unknown>>>('/naming-dict', { params }).then((r) => r.data),
  createNamingWord: (payload: Record<string, unknown>) =>
    standardHttp.post('/naming-dict', payload).then((r) => r.data),
  updateNamingWord: (wordId: string, payload: Record<string, unknown>) =>
    standardHttp.put(`/naming-dict/${wordId}`, payload).then((r) => r.data),
  deleteNamingWord: (wordId: string) =>
    standardHttp.delete(`/naming-dict/${wordId}`).then(() => true),
  listMappings: (params?: Record<string, unknown>) =>
    standardHttp.get<ListResponse<Record<string, unknown>>>('/mappings', { params }).then((r) => r.data),
  createMapping: (payload: Record<string, unknown>) =>
    standardHttp.post('/mappings', payload).then((r) => r.data),
  recommendMapping: (params: { entity_type: string; entity_id: string; limit?: number }) =>
    standardHttp.get<Record<string, unknown>>('/recommend', { params }).then((r) => r.data),
  coverageStats: () =>
    standardHttp.get<Record<string, unknown>>('/coverage-stats').then((r) => r.data),
  unmappedList: (params?: Record<string, unknown>) =>
    standardHttp.get<ListResponse<Record<string, unknown>>>('/unmapped-list', { params }).then((r) => r.data),
}

export const AssetQualityApi = {
  listTemplates: () =>
    qualityHttp.get<Record<string, unknown>[]>('/templates').then((r) => r.data),
  listRules: (params?: Record<string, unknown>) =>
    qualityHttp.get<ListResponse<Record<string, unknown>>>('/rules', { params }).then((r) => r.data),
  getRule: (ruleId: string) =>
    qualityHttp.get<Record<string, unknown>>(`/rules/${ruleId}`).then((r) => r.data),
  createRule: (payload: Record<string, unknown>) =>
    qualityHttp.post('/rules', payload).then((r) => r.data),
  updateRule: (ruleId: string, payload: Record<string, unknown>) =>
    qualityHttp.put(`/rules/${ruleId}`, payload).then((r) => r.data),
  deleteRule: (ruleId: string) => qualityHttp.delete(`/rules/${ruleId}`).then(() => true),
  runRule: (ruleId: string) => qualityHttp.post(`/rules/${ruleId}/run`).then((r) => r.data),
  listCheckResults: (params?: Record<string, unknown>) =>
    qualityHttp.get<ListResponse<Record<string, unknown>>>('/check-results', { params }).then((r) => r.data),
  recheckCheckResult: (resultId: string) =>
    qualityHttp.post(`/check-results/${resultId}/recheck`).then((r) => r.data),
  slaReport: (params?: { rule_id?: string }) =>
    qualityHttp.get<Record<string, unknown>>('/sla-report', { params }).then((r) => r.data),
  listScores: (params?: Record<string, unknown>) =>
    qualityHttp.get<ListResponse<Record<string, unknown>>>('/scores', { params }).then((r) => r.data),
}

export const AssetSecurityApi = {
  listClassifications: (params?: Record<string, unknown>) =>
    securityHttp.get<ListResponse<Record<string, unknown>>>('/classifications', { params }).then((r) => r.data),
  preTag: (payload: Record<string, unknown>) =>
    securityHttp.post('/classifications/pre-tag', payload).then((r) => r.data),
  autoTag: (params: { entity_type: string; entity_id: string }) =>
    securityHttp
      .post<Record<string, unknown>>('/classifications/auto-tag', null, { params })
      .then((r) => r.data),
  aiAdoption: () => securityHttp.get<Record<string, unknown>>('/ai-adoption').then((r) => r.data),
  confirmClassification: (classificationId: string, payload: Record<string, unknown>) =>
    securityHttp.post(`/classifications/${classificationId}/confirm`, payload).then((r) => r.data),
  coverage: () => securityHttp.get<Record<string, unknown>>('/coverage').then((r) => r.data),
  listMaskPolicies: (params?: Record<string, unknown>) =>
    securityHttp.get<ListResponse<Record<string, unknown>>>('/mask-policies', { params }).then((r) => r.data),
  createMaskPolicy: (payload: Record<string, unknown>) =>
    securityHttp.post('/mask-policies', payload).then((r) => r.data),
  updateMaskPolicy: (policyId: string, payload: Record<string, unknown>) =>
    securityHttp.put(`/mask-policies/${policyId}`, payload).then((r) => r.data),
  deleteMaskPolicy: (policyId: string) =>
    securityHttp.delete(`/mask-policies/${policyId}`).then(() => true),
  listAcls: (params?: Record<string, unknown>) =>
    securityHttp.get<ListResponse<Record<string, unknown>>>('/acls', { params }).then((r) => r.data),
  createAcl: (payload: Record<string, unknown>) =>
    securityHttp.post('/acls', payload).then((r) => r.data),
  updateAcl: (aclId: string, payload: Record<string, unknown>) =>
    securityHttp.put(`/acls/${aclId}`, payload).then((r) => r.data),
  deleteAcl: (aclId: string) => securityHttp.delete(`/acls/${aclId}`).then(() => true),
  aclsByRole: (roleId: string) =>
    securityHttp.get<Record<string, unknown>[]>(`/acls/role/${roleId}`).then((r) => r.data),
  listAuditLogs: (params?: Record<string, unknown>) =>
    securityHttp.get<ListResponse<Record<string, unknown>>>('/audit-logs', { params }).then((r) => r.data),
}

export const AssetLifecycleApi = {
  listPolicies: (params?: Record<string, unknown>) =>
    lifecycleHttp.get<ListResponse<Record<string, unknown>>>('/policies', { params }).then((r) => r.data),
  createPolicy: (payload: Record<string, unknown>) =>
    lifecycleHttp.post('/policies', payload).then((r) => r.data),
  updatePolicy: (policyId: string, payload: Record<string, unknown>) =>
    lifecycleHttp.put(`/policies/${policyId}`, payload).then((r) => r.data),
  deletePolicy: (policyId: string) =>
    lifecycleHttp.delete(`/policies/${policyId}`).then(() => true),
  listExecutions: (params?: Record<string, unknown>) =>
    lifecycleHttp.get<ListResponse<Record<string, unknown>>>('/executions', { params }).then((r) => r.data),
  createExecution: (payload: Record<string, unknown>) =>
    lifecycleHttp.post('/executions', payload).then((r) => r.data),
  approveExecution: (executionId: string, payload: { approved: boolean; approver: string; comment?: string }) =>
    lifecycleHttp.post(`/executions/${executionId}/approve`, payload).then((r) => r.data),
  changeExecutionStatus: (executionId: string, payload: { target: string }) =>
    lifecycleHttp.post(`/executions/${executionId}/status`, payload).then((r) => r.data),
  evidenceRecords: () =>
    lifecycleHttp.get<ListResponse<Record<string, unknown>>>('/evidence-records').then((r) => r.data),
}

export const AssetServiceApi = {
  listServices: (params?: Record<string, unknown>) =>
    serviceHttp.get<ListResponse<Record<string, unknown>>>('/services', { params }).then((r) => r.data),
  getService: (serviceId: string) =>
    serviceHttp.get<Record<string, unknown>>(`/services/${serviceId}`).then((r) => r.data),
  createService: (payload: Record<string, unknown>) =>
    serviceHttp.post('/services', payload).then((r) => r.data),
  updateService: (serviceId: string, payload: Record<string, unknown>) =>
    serviceHttp.put(`/services/${serviceId}`, payload).then((r) => r.data),
  deleteService: (serviceId: string) =>
    serviceHttp.delete(`/services/${serviceId}`).then(() => true),
  changeServiceStatus: (serviceId: string, payload: { target: string }) =>
    serviceHttp.post(`/services/${serviceId}/status`, payload).then((r) => r.data),
  publishMcp: (serviceId: string) =>
    serviceHttp.post(`/services/${serviceId}/publish-mcp`).then((r) => r.data),
  listCallStats: (params?: Record<string, unknown>) =>
    serviceHttp.get<ListResponse<Record<string, unknown>>>('/call-stats', { params }).then((r) => r.data),
  callTrend: (serviceId: string) =>
    serviceHttp.get<Record<string, unknown>>(`/call-trend/${serviceId}`).then((r) => r.data),
  listExternalData: (params?: Record<string, unknown>) =>
    serviceHttp.get<ListResponse<Record<string, unknown>>>('/external-data', { params }).then((r) => r.data),
  createExternalData: (payload: Record<string, unknown>) =>
    serviceHttp.post('/external-data', payload).then((r) => r.data),
  updateExternalData: (dataId: string, payload: Record<string, unknown>) =>
    serviceHttp.put(`/external-data/${dataId}`, payload).then((r) => r.data),
  deleteExternalData: (dataId: string) =>
    serviceHttp.delete(`/external-data/${dataId}`).then(() => true),
}

export const AssetDcmmApi = {
  listIndicators: (params?: Record<string, unknown>) =>
    dcmmHttp.get<ListResponse<Record<string, unknown>>>('/indicators', { params }).then((r) => r.data),
  indicatorTree: () =>
    dcmmHttp.get<Record<string, unknown>>('/indicator-tree').then((r) => r.data),
  seedIndicators: () => dcmmHttp.post('/indicators/seed').then((r) => r.data),
  trimIndicators: (payload: Record<string, unknown>) =>
    dcmmHttp.post('/indicators/trim', payload).then((r) => r.data),
  selfAssess: (payload: Record<string, unknown>) =>
    dcmmHttp.post('/self-assess', payload).then((r) => r.data),
  listEvidences: (params?: Record<string, unknown>) =>
    dcmmHttp.get<ListResponse<Record<string, unknown>>>('/evidences', { params }).then((r) => r.data),
  createEvidence: (payload: Record<string, unknown>) =>
    dcmmHttp.post('/evidences', payload).then((r) => r.data),
  updateEvidence: (evidenceId: string, payload: Record<string, unknown>) =>
    dcmmHttp.put(`/evidences/${evidenceId}`, payload).then((r) => r.data),
  deleteEvidence: (evidenceId: string) =>
    dcmmHttp.delete(`/evidences/${evidenceId}`).then(() => true),
  runtimeEvidence: () =>
    dcmmHttp.get<Record<string, unknown>>('/runtime-evidence').then((r) => r.data),
  listInstitutions: (params?: Record<string, unknown>) =>
    dcmmHttp.get<ListResponse<Record<string, unknown>>>('/institutions', { params }).then((r) => r.data),
  createInstitution: (payload: Record<string, unknown>) =>
    dcmmHttp.post('/institutions', payload).then((r) => r.data),
  updateInstitution: (institutionId: string, payload: Record<string, unknown>) =>
    dcmmHttp.put(`/institutions/${institutionId}`, payload).then((r) => r.data),
  deleteInstitution: (institutionId: string) =>
    dcmmHttp.delete(`/institutions/${institutionId}`).then(() => true),
  domainDashboard: () =>
    dcmmHttp.get<Record<string, unknown>>('/domain-dashboard').then((r) => r.data),
  listStrategyObjectives: (params?: Record<string, unknown>) =>
    dcmmHttp.get<ListResponse<Record<string, unknown>>>('/strategy-objectives', { params }).then((r) => r.data),
  createStrategyObjective: (payload: Record<string, unknown>) =>
    dcmmHttp.post('/strategy-objectives', payload).then((r) => r.data),
  updateStrategyObjective: (objectiveId: string, payload: Record<string, unknown>) =>
    dcmmHttp.put(`/strategy-objectives/${objectiveId}`, payload).then((r) => r.data),
  deleteStrategyObjective: (objectiveId: string) =>
    dcmmHttp.delete(`/strategy-objectives/${objectiveId}`).then(() => true),
  listGovernanceOrgs: (params?: Record<string, unknown>) =>
    dcmmHttp.get<ListResponse<Record<string, unknown>>>('/governance-orgs', { params }).then((r) => r.data),
  createGovernanceOrg: (payload: Record<string, unknown>) =>
    dcmmHttp.post('/governance-orgs', payload).then((r) => r.data),
  updateGovernanceOrg: (orgId: string, payload: Record<string, unknown>) =>
    dcmmHttp.put(`/governance-orgs/${orgId}`, payload).then((r) => r.data),
  deleteGovernanceOrg: (orgId: string) =>
    dcmmHttp.delete(`/governance-orgs/${orgId}`).then(() => true),
  governanceOverview: () =>
    dcmmHttp.get<Record<string, unknown>>('/governance-overview').then((r) => r.data),
}

export const AssetArchitectureApi = {
  dataModels: () =>
    architectureHttp.get<Record<string, unknown>>('/data-models').then((r) => r.data),
  dataDistribution: () =>
    architectureHttp.get<Record<string, unknown>>('/data-distribution').then((r) => r.data),
  integrationSharing: () =>
    architectureHttp.get<Record<string, unknown>>('/integration-sharing').then((r) => r.data),
}

export const AssetGovernanceApi = {
  governanceItems: (params?: { category?: string; limit?: number }) =>
    governanceHttp.get<Record<string, unknown>>('/items', { params }).then((r) => r.data),
  asset360: (entityType: string, entityId: string) =>
    governanceHttp
      .get<Record<string, unknown>>(`/asset360/${entityType}/${entityId}`)
      .then((r) => r.data),
}
