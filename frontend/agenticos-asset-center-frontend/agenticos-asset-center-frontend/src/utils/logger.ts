/**
 * 前端统一日志工具
 *
 * 替换裸调 console.log/warn/error，同时输出到浏览器控制台和服务端日志文件。
 * 服务端日志路径由部署环境配置。
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  source: string
}

/** 待发送的日志队列，用于批量上报（只 push/splice，不重新赋值） */
const _pending: LogEntry[] = []
let _flushTimer: ReturnType<typeof setTimeout> | null = null
const FLUSH_INTERVAL_MS = 3000
const MAX_BATCH_SIZE = 20
const API_PATH = '/v1/frontend-log'

/** 初始化状态下等待完成的 Promise */
let _initPromise: Promise<void> | null = null
let _ready = false

/**
 * 等待 API 基础路径确定后再上报（避免 vite dev server 重定向）
 */
function ensureReady(): void {
  if (_ready) return
  _ready = true
  // 在开发模式下，需要等待 vite 初始化完毕才能 post
  // 这里简单延迟 2s 确保 app 已 mount
  _initPromise = new Promise((resolve) => {
    setTimeout(resolve, 2000)
  })
}

/** 发送单条日志到后端 */
async function _sendEntry(entry: LogEntry): Promise<void> {
  try {
    await fetch(API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
      // keepalive 确保页面关闭时也能发送
      keepalive: true,
    })
  } catch {
    // 日志上报失败不应影响业务，静默忽略
  }
}

/** 批量发送日志 */
async function _flush(): Promise<void> {
  if (_pending.length === 0) return
  const batch = _pending.splice(0, MAX_BATCH_SIZE)
  // 批量模式下逐条发送（简单实现，避免后端接口变复杂）
  await Promise.all(batch.map(_sendEntry))
}

/** 调度批量发送 */
function _scheduleFlush(): void {
  if (_flushTimer !== null) return
  _flushTimer = setTimeout(() => {
    _flushTimer = null
    _flush()
  }, FLUSH_INTERVAL_MS)
}

/** 立即发送所有待发送日志（页面卸载时调用） */
function _flushSync(): void {
  if (_flushTimer !== null) {
    clearTimeout(_flushTimer)
    _flushTimer = null
  }
  // 使用 sendBeacon 或同步 fetch 确保日志不丢失
  const batch = _pending.splice(0)
  for (const entry of batch) {
    try {
      navigator.sendBeacon(
        API_PATH,
        new Blob([JSON.stringify(entry)], { type: 'application/json' })
      )
    } catch {
      // 静默忽略
    }
  }
}

function _log(level: LogLevel, source: string, message: string): void {
  // 控制台输出（保留浏览器 devtools 可见性）
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${source}]`

  switch (level) {
    case 'debug':
      console.debug(prefix, message)
      break
    case 'info':
      console.log(prefix, message)
      break
    case 'warn':
      console.warn(prefix, message)
      break
    case 'error':
      console.error(prefix, message)
      break
  }

  // 写入服务端日志文件
  if (!_ready) ensureReady()
  _pending.push({ level, message, source })
  _scheduleFlush()
}

/** 创建日志记录器（绑定 source 前缀） */
export function createLogger(source: string) {
  return {
    debug: (msg: string) => _log('debug', source, msg),
    info:  (msg: string) => _log('info',  source, msg),
    log:   (msg: string) => _log('info',  source, msg),
    warn:  (msg: string) => _log('warn',  source, msg),
    error: (msg: string) => _log('error', source, msg),
  }
}

/** 页面卸载时立即发送所有待发送日志 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', _flushSync)
  window.addEventListener('pagehide', _flushSync)
}

export const logger = createLogger('app')
