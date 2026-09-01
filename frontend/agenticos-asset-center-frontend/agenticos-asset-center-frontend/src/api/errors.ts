import axios from 'axios'

function readStringField(data: Record<string, unknown>, key: string): string | null {
  const value = data[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function formatStructuredDetail(detail: Record<string, unknown>): string | null {
  const message = readStringField(detail, 'message')
  const reason = readStringField(detail, 'reason')
  const code = readStringField(detail, 'code')
  const traceId = readStringField(detail, 'trace_id')
  const mainMessage = message || reason || code
  if (!mainMessage) {
    return null
  }

  const shouldAppendReason = reason && reason !== mainMessage
  const friendlyMessage = shouldAppendReason ? `${mainMessage}：${reason}` : mainMessage

  // 系统内部异常需要给排查入口，业务校验类错误只展示可读原因即可。
  if (traceId && code === 'KNOWLEDGE_INTERNAL_ERROR') {
    return `${friendlyMessage}（追踪ID：${traceId}）`
  }
  return friendlyMessage
}

function extractErrorDataMessage(errorData: unknown): string | null {
  if (typeof errorData === 'string' && errorData.trim()) {
    return errorData.trim()
  }
  if (!errorData || typeof errorData !== 'object') {
    return null
  }

  // detail 是具体业务原因，优先于外围通用 message。
  const detail = 'detail' in errorData ? errorData.detail : undefined
  if (typeof detail === 'string' && detail.trim()) {
    return detail.trim()
  }
  if (detail && typeof detail === 'object') {
    const structuredMessage = formatStructuredDetail(detail as Record<string, unknown>)
    if (structuredMessage) {
      return structuredMessage
    }
  }
  const message = 'message' in errorData ? errorData.message : undefined
  if (typeof message === 'string' && message.trim()) {
    return message.trim()
  }
  const nestedError = 'error' in errorData ? errorData.error : undefined
  if (typeof nestedError === 'string' && nestedError.trim()) {
    return nestedError.trim()
  }
  if (nestedError && typeof nestedError === 'object' && 'message' in nestedError) {
    const nestedMessage = nestedError.message as string | undefined
    if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
      return nestedMessage.trim()
    }
  }
  return null
}

// HTTP 状态码 → 用户友好提示。服务端已响应但响应体无可用消息时兜底，
// 避免直接暴露 axios 英文原始消息（如 "Request failed with status code 503"）。
const HTTP_STATUS_FALLBACK_MESSAGES: Record<number, string> = {
  400: '请求参数有误，请检查输入后重试',
  401: '登录状态已失效，请重新登录',
  403: '没有权限执行此操作',
  404: '请求的资源不存在或已被删除',
  409: '操作冲突，请刷新后重试',
  422: '提交内容校验未通过，请检查后重试',
  429: '操作过于频繁，请稍后再试',
  500: '服务器内部错误，请稍后重试',
  502: '网关异常，请稍后重试',
  503: '服务暂时不可用，请稍后重试',
  504: '请求超时，请稍后重试',
}

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback
  }

  const responseMessage = extractErrorDataMessage(error.response?.data)
  if (responseMessage) {
    return responseMessage
  }

  // 服务端已返回错误状态码但响应体无可用消息时，按状态码给用户友好提示
  const status = error.response?.status
  if (status && HTTP_STATUS_FALLBACK_MESSAGES[status]) {
    return HTTP_STATUS_FALLBACK_MESSAGES[status]
  }

  return error.message || fallback
}

// ── 字段级错误解析（表单内联提示） ──

export interface ApiFieldError {
  /** 后端字段名（如 "description"，嵌套字段取最后一段） */
  field: string
  /** 原始 Pydantic 错误消息（英文） */
  msg: string
  /** Pydantic 错误类型（如 string_too_short） */
  type?: string
}

/**
 * 从 API 错误响应中解析字段级校验错误列表。
 * 兼容两种响应格式：
 * - 本项目 error_handler 的结构化响应：`{ errors: [{ field, loc, msg, type }] }`
 * - FastAPI 默认 422 响应：`{ detail: [{ loc, msg, type }] }`
 */
export function extractApiFieldErrors(error: unknown): ApiFieldError[] {
  if (!axios.isAxiosError(error)) return []
  const data = error.response?.data
  if (!data || typeof data !== 'object') return []

  const rawList = 'errors' in data && Array.isArray(data.errors)
    ? data.errors
    : 'detail' in data && Array.isArray(data.detail)
      ? data.detail
      : null
  if (!rawList) return []

  const pickField = (item: Record<string, unknown>): string => {
    // 本项目格式：field 已直接给出
    if (typeof item.field === 'string' && item.field) return item.field
    // FastAPI 格式：loc 数组取最后一个非 body 段
    const loc = item.loc
    if (Array.isArray(loc)) {
      const parts = loc.filter((p): p is string => typeof p === 'string' && p !== 'body')
      if (parts.length > 0) return parts[parts.length - 1]
    }
    return ''
  }

  const result: ApiFieldError[] = []
  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    const field = pickField(record)
    const msg = typeof record.msg === 'string' ? record.msg : ''
    if (!field || !msg) continue
    result.push({
      field,
      msg,
      type: typeof record.type === 'string' ? record.type : undefined,
    })
  }
  return result
}

/** Pydantic 常见校验类型 → 中文友好提示 */
const FIELD_ERROR_TYPE_HINTS: Record<string, string> = {
  missing: '该字段为必填项',
  string_too_short: '内容不能为空',
  string_too_long: '内容长度超出限制',
  string_pattern_mismatch: '格式不符合要求',
  literal_error: '取值不在允许范围内',
}

/** 把 Pydantic 英文错误消息转为中文提示（识别失败时保留原文） */
export function friendlyFieldErrorMessage(field: string, err: ApiFieldError): string {
  if (err.type) {
    const hint = FIELD_ERROR_TYPE_HINTS[err.type]
    if (hint) return hint
  }
  const msg = err.msg
  if (msg.includes('should have at least 1 character')) return '内容不能为空'
  if (msg.includes('should not be empty')) return '内容不能为空'
  if (msg.includes('Field required')) return '该字段为必填项'
  if (msg.includes("should match pattern '^[a-z][a-z0-9_]*$")) {
    return '需以小写英文字母开头，仅含小写英文、数字和下划线'
  }
  return msg || `字段 ${field} 校验失败`
}

/** 下载接口使用 blob 响应时，后端 JSON 错误也会被 Axios 包装成 Blob。 */
export async function extractApiBlobErrorMessage(
  error: unknown,
  fallback: string,
): Promise<string> {
  if (!axios.isAxiosError(error)) {
    return extractApiErrorMessage(error, fallback)
  }

  const errorData = error.response?.data
  if (typeof Blob === 'undefined' || !(errorData instanceof Blob)) {
    return extractApiErrorMessage(error, fallback)
  }

  try {
    const text = (await errorData.text()).trim()
    if (!text) {
      return error.message || fallback
    }
    try {
      return extractErrorDataMessage(JSON.parse(text)) || text
    } catch {
      return text
    }
  } catch {
    return error.message || fallback
  }
}
