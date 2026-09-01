/**
 * 数据生命周期 LifecyclePage 组件测试
 * 覆盖：主页面渲染、页签切换（分层策略/归档管理/退役管理/执行记录）、
 * 各页签空数据兜底渲染。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LifecyclePage from '../LifecyclePage'

vi.mock('../../../../../api/asset', () => ({
  AssetLifecycleApi: {
    listPolicies: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    createPolicy: vi.fn().mockResolvedValue({}),
    updatePolicy: vi.fn().mockResolvedValue({}),
    deletePolicy: vi.fn().mockResolvedValue(true),
    listExecutions: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    createExecution: vi.fn().mockResolvedValue({}),
    approveExecution: vi.fn().mockResolvedValue({}),
    changeExecutionStatus: vi.fn().mockResolvedValue({}),
    evidenceRecords: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  },
  AssetCatalogApi: {
    listItems: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  },
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <LifecyclePage />
    </MemoryRouter>
  )
}

describe('LifecyclePage 数据生命周期', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('渲染页面标题与默认页签（分层策略）', async () => {
    renderPage()
    expect(screen.getByText('数据生命周期')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('暂无分层策略')).toBeInTheDocument()
    })
  })

  it('切换到归档管理页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '归档管理' }))
    await waitFor(() => {
      expect(screen.getByText('暂无归档任务')).toBeInTheDocument()
    })
  })

  it('切换到退役管理页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '退役管理' }))
    await waitFor(() => {
      expect(screen.getByText('暂无退役任务')).toBeInTheDocument()
    })
  })

  it('切换到执行记录页签（全量留痕）', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '执行记录' }))
    await waitFor(() => {
      expect(screen.getByText('暂无执行记录')).toBeInTheDocument()
    })
  })
})
