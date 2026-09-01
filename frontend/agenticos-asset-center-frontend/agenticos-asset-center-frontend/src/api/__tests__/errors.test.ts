import { describe, it, expect } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import {
  extractApiBlobErrorMessage,
  extractApiErrorMessage,
  extractApiFieldErrors,
  friendlyFieldErrorMessage,
} from '../errors';

function createAxiosError(
  status: number,
  data: unknown,
  message = 'Request failed',
): AxiosError {
  return new AxiosError(
    message,
    'ERR_BAD_REQUEST',
    undefined,
    undefined,
    {
      status,
      data,
      statusText: 'Error',
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
    },
  );
}

describe('extractApiErrorMessage', () => {
  it('非 AxiosError 返回 Error.message', () => {
    const error = new Error('网络错误');
    expect(extractApiErrorMessage(error, '兜底信息')).toBe('网络错误');
  });

  it('非 AxiosError 非 Error 类型返回 fallback', () => {
    expect(extractApiErrorMessage('字符串错误', '兜底信息')).toBe('兜底信息');
  });

  it('AxiosError 返回 response.data 字符串', () => {
    const error = createAxiosError(400, '用户名已存在');
    expect(extractApiErrorMessage(error, '兜底信息')).toBe('用户名已存在');
  });

  it('AxiosError 返回 response.data.detail', () => {
    const error = createAxiosError(400, { detail: '请输入有效的邮箱地址' });
    expect(extractApiErrorMessage(error, '兜底信息')).toBe('请输入有效的邮箱地址');
  });

  it('AxiosError 返回结构化 detail 的友好消息', () => {
    const error = createAxiosError(400, {
      detail: {
        code: 'KNOWLEDGE_VALIDATION_ERROR',
        message: '解析任务创建失败',
        reason: '当前文档正在解析中，请稍后刷新状态',
        trace_id: 'kerr_abc123',
      },
    });
    expect(extractApiErrorMessage(error, '兜底信息')).toBe(
      '解析任务创建失败：当前文档正在解析中，请稍后刷新状态',
    );
  });

  it('AxiosError 系统异常结构化 detail 返回追踪 ID', () => {
    const error = createAxiosError(500, {
      detail: {
        code: 'KNOWLEDGE_INTERNAL_ERROR',
        message: '文档管理服务异常',
        reason: '系统异常，请稍后重试或联系管理员',
        trace_id: 'kerr_def456',
      },
    });
    expect(extractApiErrorMessage(error, '兜底信息')).toBe(
      '文档管理服务异常：系统异常，请稍后重试或联系管理员（追踪ID：kerr_def456）',
    );
  });

  it('AxiosError 返回 response.data.message', () => {
    const error = createAxiosError(422, { message: '参数校验失败' });
    expect(extractApiErrorMessage(error, '兜底信息')).toBe('参数校验失败');
  });

  it('AxiosError 返回 response.data.error 字符串', () => {
    const error = createAxiosError(500, { error: '服务器内部错误' });
    expect(extractApiErrorMessage(error, '兜底信息')).toBe('服务器内部错误');
  });

  it('AxiosError 返回 response.data.error.message', () => {
    const error = createAxiosError(500, {
      error: { message: '数据库连接失败' },
    });
    expect(extractApiErrorMessage(error, '兜底信息')).toBe('数据库连接失败');
  });

  it('AxiosError 无 response.data 返回 error.message', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK');
    expect(extractApiErrorMessage(error, '兜底信息')).toBe('Network Error');
  });

  it('AxiosError response.data 为空对象返回状态码友好提示', () => {
    const error = createAxiosError(400, {});
    expect(extractApiErrorMessage(error, '兜底信息')).toBe('请求参数有误，请检查输入后重试');
  });

  it('AxiosError 503 无响应体返回服务不可用提示', () => {
    const error = createAxiosError(503, undefined, 'Request failed with status code 503');
    expect(extractApiErrorMessage(error, '兜底信息')).toBe('服务暂时不可用，请稍后重试');
  });

  it('AxiosError 500 无响应体返回服务器错误提示', () => {
    const error = createAxiosError(500, undefined);
    expect(extractApiErrorMessage(error, '兜底信息')).toBe('服务器内部错误，请稍后重试');
  });

  it('AxiosError 无响应体且状态码无映射时返回 error.message', () => {
    const error = createAxiosError(418, undefined);
    expect(extractApiErrorMessage(error, '兜底信息')).toBe('Request failed');
  });

  it('AxiosError 响应体有 detail 时优先于状态码兜底', () => {
    const error = createAxiosError(503, { detail: '知识库服务正在迁移，请稍后重试' });
    expect(extractApiErrorMessage(error, '兜底信息')).toBe('知识库服务正在迁移，请稍后重试');
  });

  it('AxiosError response.data.detail 优先级高于 message', () => {
    const error = createAxiosError(400, {
      detail: '详情错误',
      message: '通用错误',
    });
    expect(extractApiErrorMessage(error, '兜底信息')).toBe('详情错误');
  });

  it('AxiosError 空字符串会被跳过', () => {
    const error = createAxiosError(400, { detail: '', message: '有效消息' });
    expect(extractApiErrorMessage(error, '兜底信息')).toBe('有效消息');
  });

  it('normal Error with message', () => {
    expect(extractApiErrorMessage(new Error('something broke'), 'fallback')).toBe('something broke');
  });

  it('下载接口可以从 Blob JSON 中提取 detail', async () => {
    const error = createAxiosError(
      422,
      new Blob(
        [JSON.stringify({ detail: '请先由 HR 完成员工劳动合同台账' })],
        { type: 'application/json' },
      ),
    );

    await expect(extractApiBlobErrorMessage(error, '资料包下载失败')).resolves.toBe(
      '请先由 HR 完成员工劳动合同台账',
    );
  });
});

describe('extractApiFieldErrors', () => {
  it('解析本项目 error_handler 结构化 errors 数组', () => {
    const error = createAxiosError(400, {
      code: 'VALIDATION_ERROR',
      message: 'description: String should have at least 1 character',
      errors: [
        { field: 'description', loc: ['body', 'description'], msg: 'String should have at least 1 character', type: 'string_too_short' },
        { field: 'name', loc: ['body', 'name'], msg: 'String should match pattern "^[a-z][a-z0-9_]*$"', type: 'string_pattern_mismatch' },
      ],
    });
    expect(extractApiFieldErrors(error)).toEqual([
      { field: 'description', msg: 'String should have at least 1 character', type: 'string_too_short' },
      { field: 'name', msg: 'String should match pattern "^[a-z][a-z0-9_]*$"', type: 'string_pattern_mismatch' },
    ]);
  });

  it('兼容 FastAPI 默认 422 detail 数组格式（loc 取最后一段非 body）', () => {
    const error = createAxiosError(422, {
      detail: [
        { loc: ['body', 'metrics', 0, 'label_zh'], msg: 'Field required', type: 'missing' },
      ],
    });
    expect(extractApiFieldErrors(error)).toEqual([
      { field: 'label_zh', msg: 'Field required', type: 'missing' },
    ]);
  });

  it('无 errors/detail 数组时返回空数组', () => {
    const error = createAxiosError(400, { message: '业务错误' });
    expect(extractApiFieldErrors(error)).toEqual([]);
  });

  it('非 AxiosError 返回空数组', () => {
    expect(extractApiFieldErrors(new Error('boom'))).toEqual([]);
  });

  it('跳过缺少字段名或消息的错误项', () => {
    const error = createAxiosError(400, {
      errors: [
        { field: '', loc: ['body', ''], msg: 'no field' },
        { field: 'ok', loc: ['body', 'ok'], msg: '' },
        { field: 'valid', loc: ['body', 'valid'], msg: '有消息' },
      ],
    });
    expect(extractApiFieldErrors(error)).toEqual([
      { field: 'valid', msg: '有消息' },
    ]);
  });
});

describe('friendlyFieldErrorMessage', () => {
  it('按 type 转中文提示', () => {
    expect(friendlyFieldErrorMessage('name', { field: 'name', msg: 'Field required', type: 'missing' })).toBe('该字段为必填项');
    expect(friendlyFieldErrorMessage('description', { field: 'description', msg: 'String should have at least 1 character', type: 'string_too_short' })).toBe('内容不能为空');
  });

  it('按消息内容转中文提示', () => {
    expect(friendlyFieldErrorMessage('name', { field: 'name', msg: "String should match pattern '^[a-z][a-z0-9_]*$" })).toBe('需以小写英文字母开头，仅含小写英文、数字和下划线');
  });

  it('未识别的消息保留原文', () => {
    expect(friendlyFieldErrorMessage('expr', { field: 'expr', msg: 'Unknown error' })).toBe('Unknown error');
  });
});
