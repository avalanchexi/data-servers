import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios, { AxiosError } from 'axios';
import { READONLY_SELF_SERVICE_HEADER, setupAuthInterceptor } from '../interceptor';

// Node.js 下 localStorage 需要实验性 flag，此处 polyfill 保证测试环境可用
const storage = new Map<string, string>();
const localStorageStub: Storage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { storage.set(key, value); },
  removeItem: (key: string) => { storage.delete(key); },
  clear: () => { storage.clear(); },
  get length() { return storage.size; },
  key: (index: number) => Array.from(storage.keys())[index] ?? null,
};
vi.stubGlobal('localStorage', localStorageStub);

interface TrackedCall {
  method: string;
  url: string;
}

/** 创建记录请求的自定义 adapter，断言「请求是否真正发出」 */
function createTrackedAdapter(status = 200): { calls: TrackedCall[]; adapter: (config: never) => Promise<object> } {
  const calls: TrackedCall[] = [];
  const adapter = async (config: never) => {
    const cfg = config as { method: string; url: string };
    calls.push({ method: cfg.method, url: cfg.url });
    const response = {
      data: status >= 400 ? { detail: 'Unauthorized' } : { ok: true },
      status,
      statusText: status >= 400 ? 'Error' : 'OK',
      headers: {},
      config,
    };
    if (status >= 400) {
      // 自定义 adapter 需自行校验状态码：axios 核心的 settle 只作用于内置 adapter
      throw new AxiosError(
        'Request failed with status code ' + status,
        AxiosError.ERR_BAD_REQUEST,
        config,
        undefined,
        response as never,
      );
    }
    return response;
  };
  return { calls, adapter };
}

function createInstance(status = 200) {
  const { calls, adapter } = createTrackedAdapter(status);
  const instance = axios.create({ adapter: adapter as never });
  setupAuthInterceptor(instance);
  return { instance, calls };
}

beforeEach(() => {
  localStorage.clear();
  window.location.hash = '';
});

describe('setupAuthInterceptor — 全站只读请求拦截', () => {
  it('未设置 readonly 标志时，写请求正常发出', async () => {
    const { instance, calls } = createInstance();
    await instance.post('/v1/permissions/menus/m1/permissions', {});
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('post');
  });

  it('readonly_all=false 时写请求正常发出', async () => {
    localStorage.setItem('wecom_cached_readonly_all', 'false');
    const { instance, calls } = createInstance();
    await instance.put('/v1/permissions/menus/m1/permissions', {});
    expect(calls).toHaveLength(1);
  });

  it('readonly_all=true 时 POST 被本地拒绝，不发请求', async () => {
    localStorage.setItem('wecom_cached_readonly_all', 'true');
    const { instance, calls } = createInstance();
    await expect(
      instance.post('/v1/permissions/menus/m1/permissions', {}),
    ).rejects.toThrow('当前为只读浏览模式，无法执行修改操作');
    expect(calls).toHaveLength(0);
  });

  it('readonly_all=true 时 PUT/DELETE/PATCH 同样被拒绝', async () => {
    localStorage.setItem('wecom_cached_readonly_all', 'true');
    const { instance, calls } = createInstance();
    await expect(instance.put('/v1/x', {})).rejects.toThrow('当前为只读浏览模式，无法执行修改操作');
    await expect(instance.delete('/v1/x')).rejects.toThrow('当前为只读浏览模式，无法执行修改操作');
    await expect(instance.patch('/v1/x', {})).rejects.toThrow('当前为只读浏览模式，无法执行修改操作');
    expect(calls).toHaveLength(0);
  });

  it('readonly_all=true 时 GET/HEAD 请求放行', async () => {
    localStorage.setItem('wecom_cached_readonly_all', 'true');
    const { instance, calls } = createInstance();
    const res = await instance.get('/v1/permissions/me/menus');
    expect(res.data).toEqual({ ok: true });
    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('get');
    await instance.head('/v1/health');
    expect(calls).toHaveLength(2);
  });

  it('readonly_all=true 时认证端点放行（登出不被拦截，防死锁）', async () => {
    localStorage.setItem('wecom_cached_readonly_all', 'true');
    const { instance, calls } = createInstance();
    await instance.post('/v1/auth/logout');
    await instance.put('/v1/auth/password', {});
    expect(calls).toHaveLength(2);
  });

  it('readonly_all=true 时显式标记的本人自助写请求放行', async () => {
    localStorage.setItem('wecom_cached_readonly_all', 'true');
    const { instance, calls } = createInstance();
    await instance.post('/v1/oa/employees/profile-1/change-request', {}, {
      headers: { [READONLY_SELF_SERVICE_HEADER]: 'true' },
    });
    expect(calls).toHaveLength(1);
  });

  it('readonly_all=true 时 OPTIONS 请求被拒绝', async () => {
    localStorage.setItem('wecom_cached_readonly_all', 'true');
    const { instance, calls } = createInstance();
    await expect(instance.options('/v1/x')).rejects.toThrow('当前为只读浏览模式，无法执行修改操作');
    expect(calls).toHaveLength(0);
  });
});

describe('setupAuthInterceptor — 401 自动跳转', () => {
  it('非登录页收到 401 跳转 #/login', async () => {
    window.location.hash = '#/home';
    const { instance } = createInstance(401);
    await expect(instance.get('/v1/permissions/me/menus')).rejects.toThrow();
    expect(window.location.hash).toBe('#/login');
  });

  it('登录页收到 401 不跳转（防死循环）', async () => {
    window.location.hash = '#/login';
    const { instance } = createInstance(401);
    await expect(instance.get('/v1/permissions/me/menus')).rejects.toThrow();
    expect(window.location.hash).toBe('#/login');
  });
});
