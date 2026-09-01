/**
 * 治理评估 DcmmPage 组件测试
 * 覆盖：主页面渲染、页签切换（指标台账/自评估/证据库/制度库/九域看板）、
 * 各页签空数据兜底渲染。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DcmmPage from '../DcmmPage'

// echarts 在 jsdom 下无法渲染 canvas，替换为占位节点
vi.mock('echarts-for-react', () => ({
  default: () => <div data-testid="mock-echarts" />,
}))

const { mockInstitutionRow } = vi.hoisted(() => ({
  mockInstitutionRow: {
    id: 'inst-1',
    name: '数据质量管理规范',
    category: 'quality',
    version: '1.0',
    status: 'published',
    content: '# 一、目的\n\n建立数据质量闭环管理机制。\n\n| 角色 | 职责 |\n|---|---|\n| 数据治理委员会 | 审批制度 |\n',
    publish_date: '2026-08-01T00:00:00',
    owner_name: null,
    updated_at: '2026-08-01T00:00:00',
  },
}))

vi.mock('../../../../../api/asset', () => ({
  AssetDcmmApi: {
    listIndicators: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    indicatorTree: vi.fn().mockResolvedValue([]),
    seedIndicators: vi.fn().mockResolvedValue({}),
    trimIndicators: vi.fn().mockResolvedValue({}),
    selfAssess: vi.fn().mockResolvedValue({}),
    listEvidences: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    createEvidence: vi.fn().mockResolvedValue({}),
    deleteEvidence: vi.fn().mockResolvedValue(true),
    runtimeEvidence: vi.fn().mockResolvedValue({}),
    listInstitutions: vi.fn().mockResolvedValue({ items: [mockInstitutionRow], total: 1 }),
    createInstitution: vi.fn().mockResolvedValue({}),
    deleteInstitution: vi.fn().mockResolvedValue(true),
    domainDashboard: vi.fn().mockResolvedValue({ domains: [], runtime_evidence: {} }),
  },
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <DcmmPage />
    </MemoryRouter>
  )
}

describe('DcmmPage 治理评估', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('渲染页面标题与默认页签（指标台账）', async () => {
    renderPage()
    expect(screen.getByText('治理评估')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('指标台账为空')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /加载内置指标树/ })).toBeInTheDocument()
  })

  it('切换到自评估页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '自评估' }))
    await waitFor(() => {
      expect(screen.getByText('暂无评估指标')).toBeInTheDocument()
    })
  })

  it('切换到证据库页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '证据库' }))
    await waitFor(() => {
      expect(screen.getByText('证据库为空')).toBeInTheDocument()
    })
  })

  it('切换到制度库页签并渲染制度台账', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '制度库' }))
    await waitFor(() => {
      expect(screen.getByText('数据质量管理规范')).toBeInTheDocument()
    })
    expect(screen.getAllByText('数据质量').length).toBeGreaterThan(0)
    expect(screen.getByText('已发布')).toBeInTheDocument()
  })

  it('点击查看按钮打开制度正文详情', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '制度库' }))
    await waitFor(() => {
      expect(screen.getByText('数据质量管理规范')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTitle('查看正文'))
    await waitFor(() => {
      expect(screen.getByText('建立数据质量闭环管理机制。')).toBeInTheDocument()
    })
  })

  it('制度正文表格以 GFM 形式渲染（含表头与单元格）', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '制度库' }))
    await waitFor(() => {
      expect(screen.getByText('数据质量管理规范')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByTitle('查看正文'))
    await waitFor(() => {
      // 台账列表表格 + 制度正文 Markdown 表格
      expect(screen.getAllByRole('table')).toHaveLength(2)
    })
    expect(screen.getByRole('columnheader', { name: '角色' })).toBeInTheDocument()
    expect(screen.getByText('数据治理委员会')).toBeInTheDocument()
  })

  it('切换到九域看板页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '九域看板' }))
    await waitFor(() => {
      expect(screen.getByText('暂无看板数据')).toBeInTheDocument()
    })
  })
})
