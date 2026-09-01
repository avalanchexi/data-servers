/**
 * 治理Agent API 客户端测试
 * 覆盖：SSE 流解析（事件分发/跨 chunk 拼接）、HTTP 错误、runScan 扫描执行。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GovernanceAgentApi } from '../governance-agent'

/** 构造 SSE 响应：chunks 为原始文本块，模拟网络分片 */
function sseResponse(chunks: string[]): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
  return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('GovernanceAgentApi.chat（SSE 流式）', () => {
  it('按事件名分发 thinking/proposal/done', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(sseResponse([
      'event: thinking\ndata: {"round":1,"action":"tool","tool":"gov_health"}\n\n',
      'event: proposal\ndata: {"proposal":{"intent":"补全元数据","rationale":"测试","patches":[]}}\n\n',
      'event: done\ndata: {"kind":"proposal","proposal":{"intent":"补全元数据","rationale":"测试","patches":[]}}\n\n',
    ]))

    const thinking: unknown[] = []
    const proposals: unknown[] = []
    const done: unknown[] = []
    await GovernanceAgentApi.chat(
      { history: [], message: '帮我诊断' },
      {
        onThinking: d => thinking.push(d),
        onProposal: p => proposals.push(p),
        onDone: d => done.push(d),
        onError: () => {},
      },
    )

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/governance-agent/chat',
        expect.objectContaining({ method: 'POST' }),
      )
      expect(thinking).toHaveLength(1)
      expect(proposals).toHaveLength(1)
      expect(done).toHaveLength(1)
    })
    expect(done[0]).toEqual(expect.objectContaining({ kind: 'proposal' }))
  })

  it('data 跨 chunk 分片仍正确解析（buffer 拼接）', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(sseResponse([
      'event: thinking\nda',
      'ta: {"round":1,"action":"answer"}\n\n',
      'event: done\ndata: {"kind":"answer","text":"健康度 85 分"}\n\n',
    ]))

    const thinking: unknown[] = []
    const done: unknown[] = []
    await GovernanceAgentApi.chat(
      { history: [], message: '健康度' },
      { onThinking: d => thinking.push(d), onProposal: () => {}, onDone: d => done.push(d), onError: () => {} },
    )

    await vi.waitFor(() => {
      expect(thinking).toHaveLength(1)
      expect(done).toHaveLength(1)
    })
    expect(done[0]).toEqual(expect.objectContaining({ kind: 'answer', text: '健康度 85 分' }))
  })

  it('HTTP 非 2xx 触发 onError', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('{}', { status: 403, statusText: 'Forbidden' }),
    )

    const errors: string[] = []
    await GovernanceAgentApi.chat(
      { history: [], message: '你好' },
      { onThinking: () => {}, onProposal: () => {}, onDone: () => {}, onError: e => errors.push(e) },
    )

    await vi.waitFor(() => {
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  it('error 事件透传后端 message', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(sseResponse([
      'event: error\ndata: {"message":"治理服务暂不可用"}\n\n',
    ]))

    const errors: string[] = []
    await GovernanceAgentApi.chat(
      { history: [], message: '你好' },
      { onThinking: () => {}, onProposal: () => {}, onDone: () => {}, onError: e => errors.push(e) },
    )

    await vi.waitFor(() => {
      expect(errors).toContain('治理服务暂不可用')
    })
  })
})

describe('GovernanceAgentApi.runScan（扫描执行）', () => {
  it('按规则 ID 调用扫描端点并分发 done 报告', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(sseResponse([
      'event: thinking\ndata: {"action":"scan_engine"}\n\n',
      'event: done\ndata: {"success":true,"rule_id":"r1","category":"unmapped_field","hit_count":3,"hits":[],"auto_fixed":[]}\n\n',
    ]))

    const thinking: unknown[] = []
    const reports: unknown[] = []
    await GovernanceAgentApi.runScan('r1', {
      onThinking: d => thinking.push(d),
      onDone: d => reports.push(d),
      onError: () => {},
    })

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/governance-agent/scan/r1/run',
        expect.objectContaining({ method: 'POST' }),
      )
      expect(thinking).toHaveLength(1)
      expect(reports).toHaveLength(1)
    })
    expect(reports[0]).toEqual(expect.objectContaining({ success: true, hit_count: 3 }))
  })
})
