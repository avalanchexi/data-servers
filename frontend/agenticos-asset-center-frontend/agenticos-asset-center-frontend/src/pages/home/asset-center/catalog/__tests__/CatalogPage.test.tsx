/**
 * 资产目录 CatalogPage 组件测试
 * 覆盖：主页面渲染、页签切换（资产盘点/目录浏览/Catalog 管理/权属管理/价值评估/资产运营/使用统计）、
 * 各页签空数据兜底渲染。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CatalogPage from '../CatalogPage'

vi.mock('../../../../../api/asset', () => ({
  AssetCatalogApi: {
    listCatalogs: vi.fn().mockResolvedValue([]),
    listCategoryTree: vi.fn().mockResolvedValue([]),
    listItems: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    listOwnerships: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    listValuations: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    listOrders: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    listUsageStats: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    createItem: vi.fn().mockResolvedValue({}),
    batchStatus: vi.fn().mockResolvedValue({}),
    changeItemStatus: vi.fn().mockResolvedValue({}),
    createOwnership: vi.fn().mockResolvedValue({}),
    approveOwnership: vi.fn().mockResolvedValue({}),
    priceItem: vi.fn().mockResolvedValue({}),
    changeOrderStatus: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('../../../../../api/dataset', () => ({
  DatasetApi: {
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  },
}))

vi.mock('../../../../../api/datasource', () => ({
  DataSourceApi: {
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  },
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <CatalogPage />
    </MemoryRouter>
  )
}

describe('CatalogPage 资产目录', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('渲染页面标题与默认页签（资产盘点）', async () => {
    renderPage()
    expect(screen.getByText('资产目录')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('暂无盘点资产')).toBeInTheDocument()
    })
  })

  it('切换到目录浏览页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '目录浏览' }))
    await waitFor(() => {
      expect(screen.getByText('该命名空间下暂无资产对象')).toBeInTheDocument()
    })
  })

  it('切换到 Catalog 管理页签（空列表）', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: 'Catalog 管理' }))
    await waitFor(() => {
      expect(screen.getByText('暂无 Catalog')).toBeInTheDocument()
    })
    expect(screen.getByText('业务目录树管理（域 → 类目，业务域侧挂标签）')).toBeInTheDocument()
  })

  it('切换到权属管理页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '权属管理' }))
    await waitFor(() => {
      expect(screen.getByText('暂无权属登记')).toBeInTheDocument()
    })
  })

  it('切换到价值评估页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '价值评估' }))
    await waitFor(() => {
      expect(screen.getByText('暂无估值记录')).toBeInTheDocument()
    })
  })

  it('切换到资产运营页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '资产运营' }))
    await waitFor(() => {
      expect(screen.getByText('暂无交易订单')).toBeInTheDocument()
    })
  })

  it('切换到使用统计页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '使用统计' }))
    await waitFor(() => {
      expect(screen.getByText('暂无使用统计')).toBeInTheDocument()
    })
  })
})
