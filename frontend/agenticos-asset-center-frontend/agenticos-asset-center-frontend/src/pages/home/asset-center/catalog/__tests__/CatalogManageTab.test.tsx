/**
 * 资产目录 — Catalog 管理页签组件测试
 * 覆盖：列表渲染（含统计徽标）、选中详情、内建目录只读、新建/编辑弹窗、
 * 删除确认、空态兜底。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CatalogManageTab from '../tabs/CatalogManageTab'

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    listCatalogs: vi.fn(),
    getCatalog: vi.fn(),
    createCatalog: vi.fn(),
    updateCatalog: vi.fn(),
    deleteCatalog: vi.fn(),
    bindCatalogDatasource: vi.fn(),
    syncPolarisCatalogs: vi.fn(),
    listCategoryTree: vi.fn(),
    createCategoryNode: vi.fn(),
    deleteCategoryNode: vi.fn(),
  },
}))

vi.mock('../../../../../api/asset', () => ({
  AssetCatalogApi: mockApi,
}))

vi.mock('../../../../../api/datasource', () => ({
  DataSourceApi: {
    list: vi.fn().mockResolvedValue({
      items: [
        { id: 'ds-1', name: 'Polaris 生产', type: 'polaris' },
        { id: 'ds-2', name: '业务 PG', type: 'postgresql' },
      ],
      total: 2,
    }),
  },
}))

const CATALOGS = [
  {
    id: 'c1', name: 'lake_ods', catalog_type: 'external', provider: 'polaris',
    datasource_id: 'ds-1', owner_name: '张三', status: 'enabled',
    description: '湖仓 ODS 层', is_public: false, object_count: 12, schema_count: 3,
  },
  {
    id: 'c2', name: 'semantic', catalog_type: 'managed', provider: 'semantic',
    status: 'enabled', object_count: 0, schema_count: 0,
  },
]

const DETAIL = {
  ...CATALOGS[0],
  storage_config: { polaris_catalog: 'lake_ods', read_only: false },
  schemas: [
    { schema_name: 'ods', count: 8 },
    { schema_name: 'dw', count: 4 },
  ],
  inheritable: true,
  created_at: '2026-08-30T10:00:00',
}

function renderTab() {
  return render(<CatalogManageTab />)
}

describe('CatalogManageTab Catalog 管理', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApi.listCatalogs.mockResolvedValue(CATALOGS)
    mockApi.getCatalog.mockImplementation((id: string) =>
      Promise.resolve(id === 'c2' ? { ...CATALOGS[1], schemas: [], inheritable: true } : DETAIL)
    )
    mockApi.listCategoryTree.mockResolvedValue([])
    mockApi.createCatalog.mockResolvedValue({})
    mockApi.updateCatalog.mockResolvedValue({})
    mockApi.deleteCatalog.mockResolvedValue({})
  })

  it('渲染 Catalog 列表与统计徽标', async () => {
    renderTab()
    await waitFor(() => {
      expect(screen.getByText('lake_ods')).toBeInTheDocument()
    })
    expect(screen.getByText('12 个对象')).toBeInTheDocument()
    expect(screen.getByText('3 个 schema')).toBeInTheDocument()
    expect(screen.getByText('semantic')).toBeInTheDocument()
    expect(screen.getAllByText('内建').length).toBeGreaterThan(0)
    expect(screen.getByText(/Metastore 全局层（catalog_id=NULL）承载本体域等跨 catalog 共享资产/)).toBeInTheDocument()
  })

  it('空态兜底', async () => {
    mockApi.listCatalogs.mockResolvedValue([])
    renderTab()
    await waitFor(() => {
      expect(screen.getByText('暂无 Catalog')).toBeInTheDocument()
    })
  })

  it('选中 Catalog 展示详情（schema 分布与继承诊断）', async () => {
    renderTab()
    await waitFor(() => {
      expect(screen.getByText('lake_ods')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('lake_ods'))
    await waitFor(() => {
      expect(screen.getByText('湖仓 ODS 层')).toBeInTheDocument()
    })
    expect(mockApi.getCatalog).toHaveBeenCalledWith('c1')
    expect(screen.getByText('ods')).toBeInTheDocument()
    expect(screen.getByText(/权限继承起点：catalog 下 12 个对象默认继承 catalog 级权限/)).toBeInTheDocument()
    expect(screen.getByText('polaris_catalog')).toBeInTheDocument()
  })

  it('内建 semantic 目录不显示编辑/删除按钮', async () => {
    renderTab()
    await waitFor(() => {
      expect(screen.getByText('semantic')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('semantic'))
    await waitFor(() => {
      expect(mockApi.getCatalog).toHaveBeenCalledWith('c2')
    })
    expect(screen.queryByRole('button', { name: /编辑/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /删除/ })).not.toBeInTheDocument()
  })

  it('新建 Catalog 弹窗提交', async () => {
    renderTab()
    await waitFor(() => {
      expect(screen.getByText('lake_ods')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /新建/ }))
    await waitFor(() => {
      expect(screen.getByText('新建 Catalog')).toBeInTheDocument()
    })
    fireEvent.change(screen.getByPlaceholderText('如：lakehouse / ods / semantic'), {
      target: { value: 'lake_dm' },
    })
    fireEvent.click(screen.getByRole('button', { name: /保存/ }))
    await waitFor(() => {
      expect(mockApi.createCatalog).toHaveBeenCalled()
    })
    const payload = mockApi.createCatalog.mock.calls[0][0]
    expect(payload.name).toBe('lake_dm')
    expect(payload.catalog_type).toBe('external')
    expect(payload.status).toBe('enabled')
  })

  it('编辑弹窗预填并可保存（含 storage_config JSON 校验）', async () => {
    renderTab()
    await waitFor(() => {
      expect(screen.getByText('lake_ods')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('lake_ods'))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /编辑/ })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /编辑/ }))
    await waitFor(() => {
      expect(screen.getByText('编辑 Catalog')).toBeInTheDocument()
    })
    // 非法 JSON 校验拦截
    fireEvent.change(screen.getByPlaceholderText('{"polaris_catalog": "lake_ods", "default_base_location": "s3://lake/ods"}'), {
      target: { value: '{bad json' },
    })
    fireEvent.click(screen.getByRole('button', { name: /保存/ }))
    await waitFor(() => {
      expect(screen.getByText(/storage_config 不是合法 JSON 对象/)).toBeInTheDocument()
    })
    expect(mockApi.updateCatalog).not.toHaveBeenCalled()
    // 合法 JSON 提交
    fireEvent.change(screen.getByPlaceholderText('{"polaris_catalog": "lake_ods", "default_base_location": "s3://lake/ods"}'), {
      target: { value: '{"polaris_catalog": "lake_ods"}' },
    })
    fireEvent.click(screen.getByRole('button', { name: /保存/ }))
    await waitFor(() => {
      expect(mockApi.updateCatalog).toHaveBeenCalledWith('c1', expect.objectContaining({
        storage_config: { polaris_catalog: 'lake_ods' },
      }))
    })
  })

  it('删除确认调用删除接口', async () => {
    renderTab()
    await waitFor(() => {
      expect(screen.getByText('lake_ods')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('lake_ods'))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /删除/ })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /删除/ }))
    await waitFor(() => {
      expect(screen.getByText('确认删除 Catalog「lake_ods」？catalog 下有资产对象时将被拒绝。')).toBeInTheDocument()
    })
    // 页签内删除按钮与确认弹窗按钮同名，取最后渲染的确认按钮
    const deleteButtons = await screen.findAllByRole('button', { name: '删除' })
    fireEvent.click(deleteButtons[deleteButtons.length - 1])
    await waitFor(() => {
      expect(mockApi.deleteCatalog).toHaveBeenCalledWith('c1')
    })
  })
})
