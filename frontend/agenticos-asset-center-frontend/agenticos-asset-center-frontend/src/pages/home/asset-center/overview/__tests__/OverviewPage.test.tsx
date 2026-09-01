/**
 * 资产总览 OverviewPage 组件测试
 * 覆盖：主页面渲染、页签切换（全景大屏/治理驾驶舱/治理排行榜/治理中心）、
 * 各页签空数据兜底渲染。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import OverviewPage from '../OverviewPage'
import { AssetOverviewApi, AssetGovernanceApi } from '../../../../../api/asset'

// echarts 在 jsdom 下无法渲染 canvas，替换为占位节点
vi.mock('echarts-for-react', () => ({
  default: () => <div data-testid="mock-echarts" />,
}))

vi.mock('../../../../../api/asset', () => ({
  AssetOverviewApi: {
    panorama: vi.fn().mockResolvedValue({}),
    healthScores: vi.fn().mockResolvedValue({}),
    rankings: vi.fn().mockResolvedValue({}),
    problemDashboard: vi.fn().mockResolvedValue({}),
  },
  AssetGovernanceApi: {
    governanceItems: vi.fn().mockResolvedValue({}),
  },
}))

// 治理Agent面板内部会发起 getHistory 请求，测试入口渲染时替换为占位
vi.mock('../components/GovernanceCopilotPanel', () => ({
  default: ({ initialPrompt }: { initialPrompt?: string }) => (
    <div data-testid="gov-copilot-panel">{initialPrompt ?? ''}</div>
  ),
}))

const mockedApi = vi.mocked(AssetOverviewApi)

function renderPage() {
  return render(
    <MemoryRouter>
      <OverviewPage />
    </MemoryRouter>
  )
}

describe('OverviewPage 资产总览', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('渲染页面标题与默认页签（全景大屏）', async () => {
    renderPage()
    expect(screen.getByText('资产总览')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('存储量')).toBeInTheDocument()
      expect(screen.getByText('数据表数')).toBeInTheDocument()
      expect(screen.getByText('暂无视图数据')).toBeInTheDocument()
    })
  })

  it('切换到治理驾驶舱页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '治理驾驶舱' }))
    await waitFor(() => {
      expect(screen.getByText('健康分体系')).toBeInTheDocument()
      expect(screen.getByTestId('mock-echarts')).toBeInTheDocument()
    })
  })

  it('切换到治理排行榜页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '治理排行榜' }))
    await waitFor(() => {
      expect(screen.getByText('排行维度')).toBeInTheDocument()
      expect(screen.getByText('暂无排行数据')).toBeInTheDocument()
    })
  })

  it('切换到治理中心页签（空库兜底）', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '治理中心' }))
    await waitFor(() => {
      expect(screen.getByText('暂无治理项（质量工单/安全分级/落标/生命周期均无待办）')).toBeInTheDocument()
    })
  })

  it('后端真实契约：health-scores dimensions 为 dict 时归一化渲染，不白屏', async () => {
    // 后端 /health-scores 实际返回 dimensions 为按维度名索引的 dict（回归：曾因 .map 不存在白屏）
    mockedApi.healthScores.mockResolvedValueOnce({
      overall: 62.5,
      dimensions: { storage: 50, quality: 85, security: 50, standard: 40, cost: 30 },
    })
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '治理驾驶舱' }))
    await waitFor(() => {
      expect(screen.getByText('存储')).toBeInTheDocument()
      expect(screen.getByText('质量')).toBeInTheDocument()
      expect(screen.getByText('安全')).toBeInTheDocument()
      expect(screen.getByText('标准')).toBeInTheDocument()
      expect(screen.getByText('成本')).toBeInTheDocument()
      expect(screen.getByText('62.5')).toBeInTheDocument()
    })
  })

  it('后端真实契约：rankings 直接返回数组时归一化渲染，不白屏', async () => {
    mockedApi.rankings.mockResolvedValueOnce([
      { name: '数据治理域', published_count: 12 },
      { name: '客户域', published_count: 8 },
    ] as unknown as Record<string, unknown>)
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '治理排行榜' }))
    await waitFor(() => {
      expect(screen.getByText('数据治理域')).toBeInTheDocument()
      expect(screen.getByText('客户域')).toBeInTheDocument()
    })
  })

  it('后端真实契约：governance-items 治理项列表归一化渲染', async () => {
    const mockedGov = vi.mocked(AssetGovernanceApi)
    mockedGov.governanceItems.mockResolvedValueOnce({
      items: [
        { id: 'g1', category: 'quality_case', title: '字段缺失率超限', severity: 'high', deduct_score: 5, status: 'pending', source_id: 'r1', created_at: '2026-08-29T10:00:00' },
        { id: 'g2', category: 'unmapped_field', title: '客户表未落标', severity: 'medium', deduct_score: 2, status: 'pending', source_id: 'f1', created_at: '2026-08-29T10:00:00' },
      ],
      total: 2,
      by_category: { quality_case: 1, unmapped_field: 1 },
      total_deduct: 7,
      generated_at: '2026-08-29T10:00:00',
    })
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '治理中心' }))
    await waitFor(() => {
      expect(screen.getByText('字段缺失率超限')).toBeInTheDocument()
      // 分类 chip 与列表徽标均渲染分类标签，用 getAllByText 容忍多处匹配
      expect(screen.getAllByText('质量工单').length).toBeGreaterThan(0)
      expect(screen.getAllByText('未落标字段').length).toBeGreaterThan(0)
      expect(screen.getByText('客户表未落标')).toBeInTheDocument()
    })
  })

  it('治理中心：治理Agent入口 + 行内 AI 治理带入上下文', async () => {
    const mockedGov = vi.mocked(AssetGovernanceApi)
    mockedGov.governanceItems.mockResolvedValueOnce({
      items: [
        { id: 'g1', category: 'quality_case', title: '字段缺失率超限', severity: 'high', deduct_score: 5, status: 'pending', source_id: 'r1', created_at: '2026-08-29T10:00:00' },
      ],
      total: 1,
      by_category: { quality_case: 1 },
      total_deduct: 5,
      generated_at: '2026-08-29T10:00:00',
    })
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '治理中心' }))
    await waitFor(() => {
      expect(screen.getByText('字段缺失率超限')).toBeInTheDocument()
    })

    // 顶部「治理Agent」按钮打开抽屉（无预置问题）
    fireEvent.click(screen.getByRole('button', { name: '治理Agent' }))
    await waitFor(() => {
      expect(screen.getByTestId('gov-copilot-panel')).toBeInTheDocument()
      expect(screen.getByTestId('gov-copilot-panel').textContent).toBe('')
    })

    // 行内「AI 治理」带入治理项上下文提问
    fireEvent.click(screen.getByRole('button', { name: 'AI 治理' }))
    await waitFor(() => {
      const panel = screen.getByTestId('gov-copilot-panel')
      expect(panel.textContent).toContain('字段缺失率超限')
      expect(panel.textContent).toContain('质量工单')
    })
  })
})
