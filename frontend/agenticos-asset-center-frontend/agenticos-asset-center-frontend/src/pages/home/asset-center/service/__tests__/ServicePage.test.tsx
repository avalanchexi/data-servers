/**
 * 数据服务 ServicePage 组件测试
 * 覆盖：主页面渲染、页签切换（服务注册/API 商城/授权管理/调用统计/外部数据台账）、
 * 各页签空数据兜底渲染。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ServicePage from '../ServicePage'

// echarts 在 jsdom 下无法渲染 canvas，替换为占位节点
vi.mock('echarts-for-react', () => ({
  default: () => <div data-testid="mock-echarts" />,
}))

vi.mock('../../../../../api/asset', () => ({
  AssetServiceApi: {
    listServices: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    createService: vi.fn().mockResolvedValue({}),
    updateService: vi.fn().mockResolvedValue({}),
    deleteService: vi.fn().mockResolvedValue(true),
    changeServiceStatus: vi.fn().mockResolvedValue({}),
    publishMcp: vi.fn().mockResolvedValue({}),
    listCallStats: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    callTrend: vi.fn().mockResolvedValue({ points: [] }),
    listExternalData: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    createExternalData: vi.fn().mockResolvedValue({}),
    updateExternalData: vi.fn().mockResolvedValue({}),
    deleteExternalData: vi.fn().mockResolvedValue(true),
  },
}))

vi.mock('../../../../../api/dataset', () => ({
  DatasetApi: {
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  },
}))

vi.mock('../../../../../api/semantic-layer', () => ({
  SemanticLayerApi: {
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  },
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <ServicePage />
    </MemoryRouter>
  )
}

describe('ServicePage 数据服务', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('渲染页面标题与默认页签（服务注册）', async () => {
    renderPage()
    expect(screen.getByText('数据服务')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('暂无注册服务')).toBeInTheDocument()
    })
  })

  it('切换到 API 商城页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: 'API 商城' }))
    await waitFor(() => {
      expect(screen.getByText('商城暂无上架服务')).toBeInTheDocument()
    })
  })

  it('切换到授权管理页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '授权管理' }))
    await waitFor(() => {
      expect(screen.getByText('暂无服务')).toBeInTheDocument()
    })
  })

  it('切换到调用统计页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '调用统计' }))
    await waitFor(() => {
      expect(screen.getByText('暂无调用统计')).toBeInTheDocument()
    })
  })

  it('切换到外部数据台账页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '外部数据台账' }))
    await waitFor(() => {
      expect(screen.getByText('暂无外部数据登记')).toBeInTheDocument()
    })
  })
})
