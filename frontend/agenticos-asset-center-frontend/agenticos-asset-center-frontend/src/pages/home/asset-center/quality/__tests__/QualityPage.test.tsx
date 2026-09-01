/**
 * 数据质量 QualityPage 组件测试
 * 覆盖：主页面渲染、页签切换（规则模板库/监控任务/校验记录/质量评分/问题工单/质量报告）、
 * 各页签空数据兜底渲染。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import QualityPage from '../QualityPage'

// echarts 在 jsdom 下无法渲染 canvas，替换为占位节点
vi.mock('echarts-for-react', () => ({
  default: () => <div data-testid="mock-echarts" />,
}))

vi.mock('../../../../../api/asset', () => ({
  AssetQualityApi: {
    listTemplates: vi.fn().mockResolvedValue([]),
    listRules: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    listCheckResults: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    listScores: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    createRule: vi.fn().mockResolvedValue({}),
    deleteRule: vi.fn().mockResolvedValue(true),
    runRule: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('../../../../../api/datasource', () => ({
  DataSourceApi: {
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  },
}))

vi.mock('../../../../../api/dataset', () => ({
  DatasetApi: {
    listTablesById: vi.fn().mockResolvedValue([]),
  },
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <QualityPage />
    </MemoryRouter>
  )
}

describe('QualityPage 数据质量', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('渲染页面标题与默认页签（规则模板库）', async () => {
    renderPage()
    expect(screen.getByText('数据质量')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('暂无自定义规则')).toBeInTheDocument()
    })
  })

  it('切换到监控任务页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '监控任务' }))
    await waitFor(() => {
      expect(screen.getByText('暂无监控任务')).toBeInTheDocument()
    })
  })

  it('切换到校验记录页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '校验记录' }))
    await waitFor(() => {
      expect(screen.getByText('暂无校验记录')).toBeInTheDocument()
    })
  })

  it('切换到质量评分页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '质量评分' }))
    await waitFor(() => {
      expect(screen.getByText('暂无质量评分')).toBeInTheDocument()
    })
  })

  it('切换到问题工单页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '问题工单' }))
    await waitFor(() => {
      expect(screen.getByText('暂无问题工单')).toBeInTheDocument()
    })
  })

  it('切换到质量报告页签（report_gen 模板入口）', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '质量报告' }))
    await waitFor(() => {
      expect(screen.getByText('report_gen 标准模板')).toBeInTheDocument()
    })
    expect(screen.getByText('数据集平均质量分')).toBeInTheDocument()
  })
})
