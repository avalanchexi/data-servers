/**
 * 数据安全 SecurityPage 组件测试
 * 覆盖：主页面渲染、页签切换（分类分级/脱敏策略/行列权限/审计日志/风险识别/备案评估/红队测试）、
 * 各页签空数据兜底渲染。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SecurityPage from '../SecurityPage'

vi.mock('../../../../../api/asset', () => ({
  AssetSecurityApi: {
    listClassifications: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    preTag: vi.fn().mockResolvedValue({}),
    confirmClassification: vi.fn().mockResolvedValue({}),
    coverage: vi.fn().mockResolvedValue({}),
    listMaskPolicies: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    createMaskPolicy: vi.fn().mockResolvedValue({}),
    updateMaskPolicy: vi.fn().mockResolvedValue({}),
    deleteMaskPolicy: vi.fn().mockResolvedValue(true),
    listAcls: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    createAcl: vi.fn().mockResolvedValue({}),
    updateAcl: vi.fn().mockResolvedValue({}),
    deleteAcl: vi.fn().mockResolvedValue(true),
    listAuditLogs: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  },
  AssetCatalogApi: {
    listItems: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  },
}))

vi.mock('../../../../../api/securityEval', () => ({
  getSecurityEvalBankStats: vi.fn().mockResolvedValue({
    refusal_total: 0,
    refusal_dimensions: 0,
    refusal_min_per_dimension: 0,
    generation_total: 0,
    generation_dimensions: 0,
    non_refusal_total: 0,
    dimension_total: 31,
    checks: {},
    thresholds: {},
  }),
  listSecurityEvalRuns: vi.fn().mockResolvedValue({ runs: [], total: 0 }),
  getSecurityEvalRun: vi.fn(),
  getSecurityEvalRunReport: vi.fn(),
  runSecurityEval: vi.fn(),
}))

vi.mock('../../../../../api/securityRedTeam', () => ({
  getRedTeamCorpusStats: vi.fn().mockResolvedValue({
    stats: {
      total_entries: 930,
      covered_dimensions: 31,
      min_entries_per_dimension: 30,
      dimension_coverage_ok: true,
      min_entries_ok: true,
    },
    dimensions: [{ dimension: 'cyber_attack', count: 30, severity: 'critical' }],
  }),
  listRedTeamRuns: vi.fn().mockResolvedValue({ runs: [], total: 0 }),
  getRedTeamRun: vi.fn(),
  getRedTeamRunReport: vi.fn(),
  runRedTeam: vi.fn(),
}))

vi.mock('../../../../../api/role', () => ({
  listRoles: vi.fn().mockResolvedValue([]),
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <SecurityPage />
    </MemoryRouter>
  )
}

describe('SecurityPage 数据安全', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('渲染页面标题与默认页签（分类分级）', async () => {
    renderPage()
    expect(screen.getByText('数据安全')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('暂无分类分级记录')).toBeInTheDocument()
    })
  })

  it('切换到脱敏策略页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '脱敏策略' }))
    await waitFor(() => {
      expect(screen.getByText('暂无脱敏策略')).toBeInTheDocument()
    })
  })

  it('切换到行列权限页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '行列权限' }))
    await waitFor(() => {
      expect(screen.getByText('暂无行列权限规则')).toBeInTheDocument()
    })
  })

  it('切换到审计日志页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '审计日志' }))
    await waitFor(() => {
      expect(screen.getByText('暂无审计日志')).toBeInTheDocument()
    })
  })

  it('切换到风险识别页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '风险识别' }))
    await waitFor(() => {
      expect(screen.getByText('暂无风险预警规则')).toBeInTheDocument()
    })
  })

  it('切换到备案评估页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '备案评估' }))
    await waitFor(() => {
      expect(screen.getByText('暂无评测运行记录')).toBeInTheDocument()
    })
  })

  it('切换到红队测试页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '红队测试' }))
    await waitFor(() => {
      expect(screen.getByText('红队攻击语料库')).toBeInTheDocument()
      expect(screen.getByText('暂无红队运行记录')).toBeInTheDocument()
    })
  })
})
