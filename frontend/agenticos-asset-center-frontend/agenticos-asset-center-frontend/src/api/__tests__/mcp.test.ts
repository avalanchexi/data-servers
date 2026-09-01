import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createMcpServer,
  deleteMcpServer,
  discoverMcpTools,
  getMcpServer,
  listMcpServers,
  syncMcpPresets,
  syncMcpToAgent,
  testMcpConnection,
  toggleMcpServer,
  updateMcpServer,
} from '../mcp'

// Mock apiClient，仅记录调用，断言读写方法映射（读写分离在 API 层的落点）
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('../core', () => ({
  apiClient: mocks,
}))

function ok(data: unknown) {
  return { data }
}

describe('mcp API 读写方法映射', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((fn) => fn.mockReset())
  })

  it('读操作走 GET（含工具预览 discover）', async () => {
    mocks.get.mockResolvedValueOnce(ok({ total: 0, items: [] }))
    await listMcpServers()
    expect(mocks.get).toHaveBeenCalledWith('/v1/mcp-servers', expect.anything())

    mocks.get.mockResolvedValueOnce(ok({ id: '1' }))
    await getMcpServer('1')
    expect(mocks.get).toHaveBeenLastCalledWith('/v1/mcp-servers/1')

    mocks.get.mockResolvedValueOnce(ok({ success: true, count: 0, tools: [] }))
    await discoverMcpTools('1')
    // 工具预览是读语义，必须为 GET（只读用户可预览工具）
    expect(mocks.get).toHaveBeenLastCalledWith('/v1/mcp-servers/1/discover')
    expect(mocks.post).not.toHaveBeenCalled()
  })

  it('写操作走对应方法（创建/编辑/删除/启停/同步/测试）', async () => {
    mocks.post.mockResolvedValueOnce(ok({ success: true, id: '1' }))
    await createMcpServer({ name: 'hr', transport: 'stdio', command: 'python' })
    expect(mocks.post).toHaveBeenCalledWith('/v1/mcp-servers', expect.objectContaining({ name: 'hr' }))

    mocks.put.mockResolvedValueOnce(ok(undefined))
    await updateMcpServer('1', { command: 'python3' })
    expect(mocks.put).toHaveBeenCalledWith('/v1/mcp-servers/1', expect.anything())

    mocks.delete.mockResolvedValueOnce(ok(undefined))
    await deleteMcpServer('1')
    expect(mocks.delete).toHaveBeenCalledWith('/v1/mcp-servers/1')

    mocks.patch.mockResolvedValueOnce(ok(undefined))
    await toggleMcpServer('1', false)
    expect(mocks.patch).toHaveBeenCalledWith('/v1/mcp-servers/1/toggle', { enabled: false })

    mocks.post.mockResolvedValueOnce(ok({ success: true, ok: true }))
    await testMcpConnection('1')
    expect(mocks.post).toHaveBeenLastCalledWith('/v1/mcp-servers/1/test')

    mocks.post.mockResolvedValueOnce(ok({ success: true, synced_count: 1 }))
    await syncMcpToAgent()
    expect(mocks.post).toHaveBeenLastCalledWith('/v1/mcp-servers/sync')

    mocks.post.mockResolvedValueOnce(ok({ success: true, loaded_count: 1 }))
    await syncMcpPresets()
    expect(mocks.post).toHaveBeenLastCalledWith('/v1/mcp-servers/sync-presets')
  })
})
