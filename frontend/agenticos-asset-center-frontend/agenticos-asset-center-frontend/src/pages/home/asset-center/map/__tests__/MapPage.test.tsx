/**
 * 数据地图 MapPage 组件测试
 * 覆盖：主页面渲染、页签切换（数据检索/采集任务/血缘分析/数据架构/我的数据）、
 * 各页签空数据兜底渲染。（类目管理已迁移至资产目录页）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MapPage from '../MapPage'

vi.mock('../../../../../api/asset', () => ({
  AssetMapApi: {
    search: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    detail: vi.fn().mockResolvedValue({}),
    report: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
    hotRanking: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    recordUsage: vi.fn().mockResolvedValue({}),
  },
  AssetCollectApi: {
    listTasks: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    listLogs: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    createTask: vi.fn().mockResolvedValue({}),
    updateTask: vi.fn().mockResolvedValue({}),
    deleteTask: vi.fn().mockResolvedValue({}),
    runTask: vi.fn().mockResolvedValue({}),
    changeTaskStatus: vi.fn().mockResolvedValue({}),
  },
  AssetCatalogApi: {
    listCatalogs: vi.fn().mockResolvedValue([]),
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
      <MapPage />
    </MemoryRouter>
  )
}

describe('MapPage 数据地图', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('渲染页面标题与默认页签（数据检索）', async () => {
    renderPage()
    expect(screen.getByText('数据地图')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByPlaceholderText('输入关键词检索表/列/指标/资产（支持中文全文+模糊）')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /检索/ })).toBeInTheDocument()
  })

  it('切换到采集任务页签（空任务列表）', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '采集任务' }))
    await waitFor(() => {
      expect(screen.getByText('暂无采集任务')).toBeInTheDocument()
    })
  })

  it('切换到血缘分析页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '血缘分析' }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /分析血缘/ })).toBeInTheDocument()
    })
    expect(screen.getByText('上游追溯')).toBeInTheDocument()
  })

  it('切换到我的数据页签（暂无热门数据）', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '我的数据' }))
    await waitFor(() => {
      expect(screen.getByText('暂无热门数据')).toBeInTheDocument()
    })
  })
})
