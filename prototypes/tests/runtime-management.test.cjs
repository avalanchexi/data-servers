const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Runs the real inline program. DOM output sinks are substituted, not a browser:
// these tests cover selection/rendering/handlers, not visual layout or CSS geometry.
function load() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'archive', '2026-09-02', 'runtime-management.html'), 'utf8');
  const elements = new Map();
  const listeners = {};
  function element(id) {
    if (!elements.has(id)) {
      const classes = new Set();
      elements.set(id, {
        value: '', innerHTML: '', textContent: '', hidden: false, dataset: {}, attributes: {}, scrollTop: 0,
        setAttribute(key, value) { this.attributes[key] = value; },
        getAttribute(key) { return this.attributes[key]; },
        addEventListener(key, fn) { this[key] = fn; },
        querySelectorAll() { return []; }, querySelector() { return null; }, focus() {},
        classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x), toggle(x, on) { if (on) classes.add(x); else classes.delete(x); } }
      });
    }
    return elements.get(id);
  }
  let api;
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/\}\(\)\);\s*$/, `capture({navigate, openRoute, refreshStatus, runtimeGroups, runtimeProfiles: typeof runtimeProfiles === 'undefined' ? {} : runtimeProfiles,
    getRuntimeView: typeof getRuntimeView === 'function' ? getRuntimeView : undefined}); }());`);
  vm.runInNewContext(script, {
    document: { getElementById: element, querySelector: element, querySelectorAll: () => [], addEventListener: (key, fn) => { listeners[key] = fn; } },
    window: { setTimeout() {}, clearTimeout() {}, location: { hash: '' } },
    capture(value) { api = value; }
  });
  return { ...api, element, listeners, body: () => element('runtime-dashboard').innerHTML };
}
function click(app, dataset) {
  const target = { dataset, hasAttribute(name) { return Object.hasOwn(dataset, name.replace(/^data-/, '').replace(/-([a-z])/g, (_, x) => x.toUpperCase())); } };
  app.listeners.click({ target: { closest: () => target } });
}
function view(app, id) {
  assert.equal(typeof app.getRuntimeView, 'function', 'runtime selection must expose scoped data to its renderer');
  return app.getRuntimeView(id);
}

test('entering runtime status selects overview and renders the aggregate service list', () => {
  const app = load(); app.navigate('routes');
  assert.equal(app.element('page-title').textContent, '运行情况');
  assert.equal(app.element('breadcrumb-current').textContent, '运行情况');
  assert.match(app.element('runtime-directory').innerHTML, /data-runtime-select="all"[^>]*aria-current="true"/);
  assert.match(app.body(), /运行总览/);
  assert.match(app.body(), /6 条运行项/);
});

test('overview aggregates QPS and request-weighted success, not instance averages', () => {
  const result = view(load(), 'all');
  assert.equal(result.services.length, 6);
  assert.equal(result.metrics.downstream, '366.8');
  assert.equal(result.metrics.upstream, '359.4');
  assert.equal(result.metrics.success, '99.02%');
  assert.equal(result.metrics.p95, '982 ms');
});

test('API instance includes only its three services and scoped metrics', () => {
  const app = load(); app.navigate('routes'); click(app, { runtimeSelect: 'gateway-api' });
  const result = view(app, 'gateway-api');
  assert.deepEqual(Array.from(result.services, row => row.name), ['客户信息查询', '订单明细查询', '客户画像查询']);
  assert.equal(result.metrics.downstream, '256.7');
  assert.match(app.body(), /公共 API 入口/);
  assert.doesNotMatch(app.body(), /智能问答服务|产品推荐模型/);
  assert.match(app.body(), /3 条运行项/);
});

test('AI instance changes trend, rankings, service list and selection together', () => {
  const app = load(); app.navigate('routes');
  const initial = app.body(); click(app, { runtimeSelect: 'gateway-ai' });
  assert.match(app.body(), /110\.1/);
  assert.match(app.body(), /智能问答服务/);
  assert.doesNotMatch(app.body(), /客户画像查询/);
  assert.notEqual(app.body().match(/class="chart-primary" d="([^"]+)/)?.[1], initial.match(/class="chart-primary" d="([^"]+)/)?.[1]);
  assert.match(app.element('runtime-directory').innerHTML, /data-runtime-select="gateway-ai"[^>]*aria-current="true"/);
});

test('stopped instance does not invent zero latency, success or trend', () => {
  const app = load(); app.navigate('routes'); click(app, { runtimeSelect: 'gateway-task' });
  const result = view(app, 'gateway-task');
  assert.equal(result.metrics.success, '—');
  assert.equal(result.metrics.p95, '—');
  assert.equal(result.trend.length, 0);
  assert.match(app.body(), /已停流/);
  assert.match(app.body(), /暂无趋势数据/);
  assert.doesNotMatch(app.body(), /class="chart-primary"/);
});

for (const [id, label] of [['registry-main', '注册中心'], ['governance-main', 'AI 治理中心'], ['sandbox-analysis', '沙箱']]) {
  test(`${label} never inherits stale gateway metrics`, () => {
    const app = load(); app.navigate('routes'); click(app, { runtimeSelect: id });
    assert.equal(view(app, id).services.length, 0);
    assert.equal(view(app, id).metrics.downstream, '—');
    assert.ok(view(app, id).profile, 'each supported type has its own observation profile');
    assert.match(app.body(), /示例数据/);
    assert.doesNotMatch(app.body(), /暂无运行数据|下游 QPS|上下游 QPS/);
    assert.doesNotMatch(app.body(), /客户画像查询|366\.8|失败请求 Top 5/);
  });
}

test('switching instance clears service filters and overview restores all six rows', () => {
  const app = load(); app.navigate('routes');
  app.element('runtime-query').value = '不存在';
  app.listeners.input({ target: { id: 'runtime-query', value: '不存在', dataset: {} } });
  assert.match(app.element('runtime-table-body').innerHTML, /未找到/);
  click(app, { runtimeSelect: 'gateway-ai' });
  click(app, { runtimeSelect: 'all' });
  assert.match(app.body(), /6 条运行项/);
  assert.doesNotMatch(app.body(), /value="不存在"/);
});

test('service query and status combine without changing instance-level metrics', () => {
  const app = load(); app.navigate('routes');
  const metrics = app.body().match(/class="metric-grid"[\s\S]*?<article class="panel/)[0];
  app.listeners.input({ target: { id: 'runtime-query', value: 'service-', dataset: {} } });
  app.listeners.change({ target: { id: 'runtime-status', value: '异常', dataset: {} } });
  assert.match(app.element('runtime-table-body').innerHTML, /客户画像查询/);
  assert.doesNotMatch(app.element('runtime-table-body').innerHTML, /客户信息查询|订单明细查询/);
  assert.equal(app.element('runtime-count').textContent, '1 / 6 条运行项');
  assert.equal(app.body().match(/class="metric-grid"[\s\S]*?<article class="panel/)[0], metrics);
  click(app, { runtimeReset: '' });
  assert.equal(app.element('runtime-count').textContent, '6 条运行项');
});

test('both rankings consistently offer every ranked service as a detail action', () => {
  const app = load(); app.navigate('routes');
  const lists = [...app.body().matchAll(/<ol class="ranking-list">([\s\S]*?)<\/ol>/g)];
  assert.equal(lists.length, 2);
  for (const list of lists) {
    assert.equal((list[1].match(/class="runtime-rank-button"/g) || []).length, 5);
    assert.equal((list[1].match(/data-open-route=/g) || []).length, 5);
  }
  const failureNames = [...lists[0][1].matchAll(/data-open-route="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(failureNames, ['客户画像查询', '智能问答服务', '产品推荐模型', '订单明细查询', '客户信息查询']);
  assert.match(lists[0][1], /width:100%/);
});

test('rank detail uses the selected service actual endpoint and measurements', () => {
  const app = load(); app.navigate('routes'); click(app, { openRoute: '客户信息查询', routeStatus: '正常' });
  assert.equal(app.element('drawer-title').textContent, '客户信息查询');
  assert.equal(app.element('drawer-layer').classList.contains('open'), true);
  assert.match(app.element('drawer-body').innerHTML, /service-customer:8080/);
  assert.match(app.element('drawer-body').innerHTML, /128\.4/);
  assert.match(app.element('drawer-body').innerHTML, /99\.98%/);
  click(app, { closeDrawer: '' });
  assert.equal(app.element('drawer-layer').classList.contains('open'), false);
});

test('unknown selection does not replace the current valid view', () => {
  const app = load(); app.navigate('routes'); const before = app.body();
  click(app, { runtimeSelect: 'unknown' });
  assert.equal(app.body(), before);
});

test('refresh does not imply sample metrics are live observations', () => {
  const app = load(); app.navigate('routes'); app.refreshStatus();
  assert.match(app.element('toast-text').textContent, /示例/);
});

test('overview table shares type names, instance names and drawer targets with the directory', () => {
  const app = load();
  app.runtimeGroups[0].instances[0].name = '公共 API 网关（校验）';
  app.navigate('overview');
  const rows = app.element('runtime-overview-rows').innerHTML;
  for (const label of ['网关', '注册中心', 'AI 治理中心', '沙箱', '公共 API 网关（校验）']) assert.ok(rows.includes(label));
  assert.equal((rows.match(/data-open-gateway=/g) || []).length, 6);
  click(app, { openGateway: '公共 API 网关（校验）' });
  assert.equal(app.element('drawer-title').textContent, '公共 API 网关（校验）');
  assert.match(app.element('drawer-footer').innerHTML, /data-runtime-select="gateway-api"/);
  app.navigate('routes');
  assert.match(app.element('runtime-directory').innerHTML, /公共 API 网关（校验）/);
});

test('instance drawer links to its scoped runtime view, including typed observations', () => {
  const app = load();
  click(app, { openGateway: '服务注册中心' });
  assert.match(app.element('drawer-body').innerHTML, /注册中心/);
  assert.doesNotMatch(app.element('drawer-body').innerHTML, /376\.1|99\.95%/);
  click(app, { pageLink: 'routes', runtimeSelect: 'registry-main' });
  assert.equal(app.element('page-title').textContent, '运行情况');
  assert.match(app.body(), /服务注册中心/);
  assert.match(app.body(), /注册服务数/);
});

test('overview summary uses the same service population as runtime status', () => {
  const app = load();
  const metrics = app.element('runtime-overview-metrics').innerHTML;
  assert.match(metrics, /3 \/ 6/);
  assert.match(metrics, /330,120/);
  assert.match(metrics, /99\.02%/);
});

test('failure ranking counts agree with the same 15-minute success measurements', () => {
  const result = view(load(), 'all');
  for (const row of result.services.filter(row => row.qps !== null)) {
    assert.ok(Math.abs((1 - row.failures / (row.qps * 900)) * 100 - row.success) < 0.005, row.name);
  }
});

test('instance selection preserves other directory groups collapsed by the user', () => {
  const app = load(); app.navigate('routes');
  assert.equal(typeof app.listeners.toggle, 'function', 'native group state must survive directory redraws');
  app.listeners.toggle({ target: { dataset: { runtimeGroup: '1' }, open: false } });
  click(app, { runtimeSelect: 'gateway-ai' });
  let directory = app.element('runtime-directory').innerHTML;
  assert.match(directory, /<details class="runtime-group" data-runtime-group="1"><summary>/);
  click(app, { runtimeSelect: 'all' });
  directory = app.element('runtime-directory').innerHTML;
  assert.match(directory, /<details class="runtime-group" data-runtime-group="1"><summary>/);
  // A detail link to an instance must reveal that instance if its group was closed.
  click(app, { pageLink: 'routes', runtimeSelect: 'registry-main' });
  assert.match(app.element('runtime-directory').innerHTML, /data-runtime-group="1" open/);
});

test('registry metrics distinguish registered targets, healthy targets, subscriptions and push outcomes', () => {
  const app = load(); app.navigate('routes'); click(app, { runtimeSelect: 'registry-main' });
  const profile = view(app, 'registry-main').profile;
  assert.ok(profile);
  assert.deepEqual(Array.from(profile.cards, card => card.value), ['4', '11 / 12', '18', '99.75%']);
  assert.equal(profile.trend.reduce((sum, bin) => sum + bin.total, 0), 1200);
  assert.equal(profile.trend.reduce((sum, bin) => sum + bin.failed, 0), 3);
  assert.match(app.body(), /服务注册明细|推送次数|推送失败/);
  assert.match(app.element('runtime-directory').innerHTML, /4 个服务 · 1 个目标不健康/);
});

test('AI governance observes Skill versions and distribution, not gateway inference or safety decisions', () => {
  const app = load(); app.navigate('routes'); click(app, { runtimeSelect: 'governance-main' });
  const profile = view(app, 'governance-main').profile;
  assert.ok(profile);
  assert.deepEqual(Array.from(profile.cards, card => card.value), ['4', '3', '1', '99.00%']);
  assert.equal(profile.trend.reduce((sum, bin) => sum + bin.total, 0), 200);
  assert.equal(profile.trend.reduce((sum, bin) => sum + bin.failed, 0), 2);
  assert.match(app.body(), /Skill 版本与分发|累计下载|待审核|v1\.2\.0/);
  assert.doesNotMatch(app.body(), /Token|安全拦截|模型调用/);
});

test('sandbox separates current running work from window terminal outcomes and computes P95 from durations', () => {
  const app = load(); app.navigate('routes'); click(app, { runtimeSelect: 'sandbox-analysis' });
  const profile = view(app, 'sandbox-analysis').profile;
  assert.ok(profile);
  assert.deepEqual(Array.from(profile.cards, card => card.value), ['2', '83.33%', '1', '120 s']);
  assert.equal(profile.trend.reduce((sum, bin) => sum + bin.total, 0), 6);
  assert.equal(profile.trend.reduce((sum, bin) => sum + bin.failed, 0), 1);
  assert.match(app.body(), /执行记录|执行器就绪|经营分析助手 × 生产|已结束 6 次/);
  assert.doesNotMatch(app.body(), /CPU|Pod|内存|推送成功率/);
});

test('typed record actions open read-only right drawer with matching identity and values', () => {
  const app = load(); app.navigate('routes');
  for (const id of ['registry-main', 'governance-main', 'sandbox-analysis']) {
    click(app, { runtimeSelect: id });
    const profile = view(app, id).profile;
    assert.ok(profile);
    for (const row of profile.rows) {
      assert.ok(app.body().includes('data-runtime-record="' + row.id + '"'));
      click(app, { runtimeRecord: row.id });
      assert.equal(app.element('drawer-title').textContent, row.name);
      assert.equal(app.element('drawer-layer').classList.contains('open'), true);
      assert.match(app.element('drawer-body').innerHTML, /示例数据/);
      assert.doesNotMatch(app.element('drawer-footer').innerHTML, /保存|删除|停流/);
      click(app, { closeDrawer: '' });
    }
  }
});

test('missing profile remains unknown, never zero or healthy, and overview uses the same fallback', () => {
  const app = load(); delete app.runtimeProfiles['registry-main'];
  app.navigate('routes'); click(app, { runtimeSelect: 'registry-main' });
  assert.equal(view(app, 'registry-main').status, '未知');
  assert.match(app.body(), /暂无运行数据/);
  assert.doesNotMatch(app.body(), /99\.75%|注册服务数/);
  app.navigate('overview');
  const registryRow = app.element('runtime-overview-rows').innerHTML.match(/<tr><td><div class="cell-main">服务注册中心[\s\S]*?<\/tr>/)[0];
  assert.match(registryRow, /未知/);
  assert.doesNotMatch(registryRow, /4 个服务/);
});

test('overview exposes each type separately without mixing non-request metrics into QPS', () => {
  const app = load(); app.navigate('routes');
  assert.match(app.body(), /分类运行摘要/);
  for (const id of ['registry-main', 'governance-main', 'sandbox-analysis']) {
    assert.ok(app.body().includes('data-runtime-select="' + id + '"'));
  }
  assert.equal(view(app, 'all').metrics.downstream, '366.8');
  assert.doesNotMatch(app.body(), /沙箱暂无运行数据/);
  app.navigate('overview');
  assert.match(app.element('runtime-overview-rows').innerHTML, /4 个服务|4 个 Skill|8 次执行/);
});

test('registry failure events use the same service scope as their detail target', () => {
  const app = load(); app.navigate('routes'); click(app, { runtimeSelect: 'registry-main' });
  const profile = view(app, 'registry-main').profile;
  for (const event of profile.events.filter(event => event.failures !== undefined)) {
    const source = app.runtimeProfiles['registry-main'].records.find(row => row.id === event.record);
    assert.equal(event.failures, source.failed);
    assert.ok(event.title.includes(source.name));
    click(app, { runtimeRecord: event.record });
    assert.equal(app.element('drawer-title').textContent, source.name);
  }
});

test('empty interval and cancelled work do not fabricate success rates or percentiles', () => {
  const app = load();
  app.runtimeProfiles['governance-main'].records.forEach(row => { row.requests = 0; row.failed = 0; });
  assert.equal(view(app, 'governance-main').profile.cards[3].value, '—');
  app.runtimeProfiles['sandbox-analysis'].records.forEach(row => { row.status = '已取消'; row.duration = 0; });
  const cards = view(app, 'sandbox-analysis').profile.cards;
  assert.equal(cards[1].value, '—');
  assert.equal(cards[3].value, '—');
});
