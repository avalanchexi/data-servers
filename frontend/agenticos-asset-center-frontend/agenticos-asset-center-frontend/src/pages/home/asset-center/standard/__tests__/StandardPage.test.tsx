/**
 * 数据标准 StandardPage 组件测试
 * 覆盖：主页面渲染、页签切换（标准集/标准代码/命名词典/落标映射/贯标统计）、
 * 各页签空数据兜底渲染。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import StandardPage from '../StandardPage'

vi.mock('../../../../../api/asset', () => ({
  AssetStandardApi: {
    listStandards: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    listCodes: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    listNamingDict: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    listMappings: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    unmappedList: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    coverageStats: vi.fn().mockResolvedValue({}),
    createStandard: vi.fn().mockResolvedValue({}),
    updateStandard: vi.fn().mockResolvedValue({}),
    deleteStandard: vi.fn().mockResolvedValue({}),
    approveStandard: vi.fn().mockResolvedValue({}),
    changeStandardStatus: vi.fn().mockResolvedValue({}),
    createCode: vi.fn().mockResolvedValue({}),
    updateCode: vi.fn().mockResolvedValue({}),
    deleteCode: vi.fn().mockResolvedValue({}),
    createNamingWord: vi.fn().mockResolvedValue({}),
    updateNamingWord: vi.fn().mockResolvedValue({}),
    deleteNamingWord: vi.fn().mockResolvedValue({}),
    createMapping: vi.fn().mockResolvedValue({}),
  },
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <StandardPage />
    </MemoryRouter>
  )
}

describe('StandardPage 数据标准', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('渲染页面标题与默认页签（标准集）', async () => {
    renderPage()
    expect(screen.getByText('数据标准')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('暂无标准')).toBeInTheDocument()
    })
  })

  it('切换到标准代码页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '标准代码' }))
    await waitFor(() => {
      expect(screen.getByText('暂无标准代码')).toBeInTheDocument()
    })
  })

  it('切换到命名词典页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '命名词典' }))
    await waitFor(() => {
      expect(screen.getByText('命名词典为空')).toBeInTheDocument()
    })
  })

  it('切换到落标映射页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '落标映射' }))
    await waitFor(() => {
      expect(screen.getByText('暂无落标映射')).toBeInTheDocument()
    })
  })

  it('切换到贯标统计页签', async () => {
    renderPage()
    fireEvent.click(screen.getByRole('tab', { name: '贯标统计' }))
    // 说明文字初始渲染即有，卡片需等待异步 load 完成，两断言统一放入 waitFor 避免时序竞态
    await waitFor(() => {
      expect(screen.getByText('落标率 = 已落标字段 / 总字段（cron 定时扫描 DCG fingerprint，认证核心证据）')).toBeInTheDocument()
      expect(screen.getByText('总字段数')).toBeInTheDocument()
    })
  })
})
