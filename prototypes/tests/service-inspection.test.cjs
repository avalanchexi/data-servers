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
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/\}\(\)\);\s*$/, `capture({navigate, openRoute, refreshStatus, runtimeGroups, inspectionApps: typeof inspectionApps === 'undefined' ? [] : inspectionApps, inspectionServices: typeof inspectionServices === 'undefined' ? [] : inspectionServices, getInspectionView: typeof getInspectionView === 'undefined' ? undefined : getInspectionView, runtimeProfiles: typeof runtimeProfiles === 'undefined' ? {} : runtimeProfiles,
    getRuntimeView: typeof getRuntimeView === 'function' ? getRuntimeView : undefined}); }());`);
  vm.runInNewContext(script, {
    document: { getElementById: element, querySelector: element, querySelectorAll: () => [], addEventListener: (key, fn) => { listeners[key] = fn; } },
    window: { setTimeout() {}, clearTimeout() {}, location: { hash: '' } },
    capture(value) { api = value; }
  });
  return { ...api, element, listeners, body: () => element('inspection-dashboard').innerHTML };
}
function click(app, dataset) {
  const target = { dataset, hasAttribute(name) { return Object.hasOwn(dataset, name.replace(/^data-/, '').replace(/-([a-z])/g, (_, x) => x.toUpperCase())); } };
  app.listeners.click({ target: { closest: () => target } });
}
function view(app, id) {
  assert.equal(typeof app.getRuntimeView, 'function', 'runtime selection must expose scoped data to its renderer');
  return app.getRuntimeView(id);
}


test('service inspection route is renamed and starts with all application categories', () => {
  const app = load(); app.navigate('monitoring');
  assert.equal(app.element('page-title').textContent, '服务运监');
  assert.equal(app.element('breadcrumb-current').textContent, '服务运监');
  assert.equal(app.element('.page-scroll').classList.contains('runtime-mode'), true);
  const tree = app.element('inspection-tree').innerHTML;
  for (const name of ['总览', '普通客户端', 'Agent', 'MCP', 'Skill', 'Worker', '客户服务门户', '经营分析助手', '账单交付任务']) assert.ok(tree.includes(name), name);
  assert.match(app.body(), /应用运行总览/);
  assert.doesNotMatch(app.body(), /统一成功率|整体 P95/);
});

test('service monitoring has consistent names and a collapsed text search at the right edge of the directory heading', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'archive', '2026-09-02', 'runtime-management.html'), 'utf8');
  assert.doesNotMatch(html, /服务运检/);
  assert.match(html, /data-page="monitoring">服务运监<\/button>/);
  assert.match(html, /data-page-link="monitoring">查看服务运监<\/button>/);
  const directory = html.match(/<aside class="panel inspection-directory"[\s\S]*?<\/aside>/)[0];
  const heading = directory.match(/class="inspection-directory-title">([\s\S]*?)<nav/)[1];
  assert.equal(/<h2[^>]*id="inspection-directory-heading"[^>]*>应用目录<\/h2>[\s\S]*id="inspection-search-panel"[\s\S]*id="inspection-search-toggle"/.test(heading), true, 'search field replaces the heading before the right-side toggle');
  assert.equal(html.includes('inspection-match-count'), false, 'the directory header must not display a matching counter');
  assert.match(heading, /aria-expanded="false"/);
  assert.match(directory, /id="inspection-search-panel" hidden/);
  assert.equal((directory.match(/<input\b/g) || []).length, 1);
  assert.doesNotMatch(directory, /<select\b|inspection-type|inspection-status|服务运行状态/);
});

test('selecting an application scopes its header, metrics and service list', () => {
  const app = load(); app.navigate('monitoring'); click(app, { inspectionSelect: 'app:analysis' });
  assert.match(app.body(), /经营分析助手/);
  assert.match(app.body(), /运行完成数|运行成功率|平均执行步骤|工具调用次数/);
  assert.doesNotMatch(app.body(), /客户信息查询|账单交付/);
  assert.match(app.element('inspection-tree').innerHTML, /data-inspection-select="app:analysis"[^>]*aria-current="true"/);
});

for (const [id, required, excluded] of [
  ['portal', '请求量', '平均执行步骤'],
  ['analysis', '平均执行步骤', '消费积压'],
  ['bridge', '工具调用成功率', '输入 Token'],
  ['report', 'Skill 激活', '请求量'],
  ['sync', '任务完成数', '请求量']
]) {
  test('application ' + id + ' has consumption-form-specific operational metrics', () => {
    const app = load(); app.navigate('monitoring'); click(app, { inspectionSelect: 'app:' + id });
    assert.match(app.body(), new RegExp(required));
    const cards = app.body().match(/data-inspection-metrics[\s\S]*?<\/section>/)?.[0] || '';
    assert.ok(cards, 'typed application metrics must be rendered');
    assert.doesNotMatch(cards, new RegExp(excluded));
  });
}

for (const [id, required, excluded] of [
  ['portal-customer', 'P95 响应时间', '首 Token'],
  ['analysis-model', '输入 Token', '平均执行步骤'],
  ['analysis-agent', '平均执行步骤', 'P95 响应时间'],
  ['analysis-mcp', '工具执行错误', '输入 Token'],
  ['analysis-skill', '脚本执行', '输入 Token'],
  ['sync-worker', '待处理任务', 'QPS'],
  ['sync-stream', '消费积压', '请求成功率']
]) {
  test('service ' + id + ' switches to its own measurement units', () => {
    const app = load(); app.navigate('monitoring'); click(app, { inspectionSelect: 'service:' + id });
    assert.match(app.body(), new RegExp(required));
    assert.doesNotMatch(app.body(), new RegExp(excluded));
    assert.match(app.body(), /固定版本/);
    assert.match(app.body(), /示例数据/);
  });
}

test('application identity scopes duplicate service names and drawer measurements', () => {
  const app = load(); app.navigate('monitoring');
  click(app, { inspectionSelect: 'service:analysis-mcp' }); const first = app.body();
  click(app, { inspectionDetail: 'analysis-mcp' });
  assert.match(app.element('drawer-body').innerHTML, /经营分析助手/);
  assert.doesNotMatch(app.element('drawer-footer').innerHTML, /保存|删除/);
  click(app, { inspectionSelect: 'service:bridge-mcp' });
  assert.match(app.body(), /数据工具桥接/);
  assert.notEqual(app.body(), first);
  click(app, { inspectionDetail: 'bridge-mcp' });
  assert.match(app.element('drawer-body').innerHTML, /数据工具桥接/);
  assert.doesNotMatch(app.element('drawer-body').innerHTML, /经营分析助手/);
});

test('name search filters applications and their services, and clear restores all applications', () => {
  const app = load(); app.navigate('monitoring');
  click(app, { inspectionSearchToggle: '' });
  app.listeners.input({ target: { id: 'inspection-query', value: '画像', dataset: {} } });
  const tree = app.element('inspection-tree').innerHTML;
  assert.match(tree, /客户服务门户/);
  assert.doesNotMatch(tree, /data-inspection-select="service:|经营分析助手/);
  assert.match(app.body(), /客户画像查询/);
  assert.doesNotMatch(app.body(), /经营分析助手/);
  click(app, { inspectionReset: '' });
  assert.match(app.element('inspection-tree').innerHTML, /经营分析助手|账单交付任务/);
  assert.equal(app.element('inspection-query').value, '');
});

test('filter hiding selected service resets selection, closes stale drawer and clears content', () => {
  const app = load(); app.navigate('monitoring'); click(app, { inspectionSelect: 'service:analysis-model' });
  click(app, { inspectionDetail: 'analysis-model' });
  app.listeners.input({ target: { id: 'inspection-query', value: '不存在的应用', dataset: {} } });
  assert.match(app.body(), /没有符合条件的应用或服务/);
  assert.doesNotMatch(app.body(), /输入 Token|首 Token/);
  assert.equal(app.element('drawer-layer').classList.contains('open'), false);
  click(app, { inspectionReset: '' });
  assert.match(app.body(), /应用运行总览/);
});

test('unobserved external execution stays unknown while authorized service metrics remain accessible', () => {
  const app = load(); app.navigate('monitoring'); click(app, { inspectionSelect: 'app:report' });
  assert.match(app.body(), /外部运行|未接入执行观测/);
  const appMetrics = app.body().match(/data-inspection-metrics[\s\S]*?<\/section>/)[0];
  assert.doesNotMatch(appMetrics, /100\.00%/);
  assert.match(appMetrics, /—/);
  click(app, { inspectionSelect: 'service:report-api' });
  assert.match(app.body(), /请求量/);
  click(app, { inspectionSelect: 'app:billing' });
  assert.match(app.body(), /暂无运行观测/);
});

test('MCP failure rate counts both transport and tool-result failures', () => {
  const app = load(); app.navigate('monitoring'); click(app, { inspectionSelect: 'service:bridge-mcp' });
  assert.match(app.body(), /97\.50%/);
  assert.match(app.body(), /isError/);
  assert.match(app.body(), /Method 分布|工具调用明细/);
  assert.doesNotMatch(app.body(), /100\.00%/);
});

test('switching application retains manually collapsed categories and changing pages restores layout', () => {
  const app = load(); app.navigate('monitoring');
  app.listeners.toggle({ target: { dataset: { inspectionGroup: '普通客户端' }, open: false } });
  click(app, { inspectionSelect: 'app:analysis' });
  assert.match(app.element('inspection-tree').innerHTML, /data-inspection-group="普通客户端"><summary>/);
  app.navigate('policies');
  assert.equal(app.element('.page-scroll').classList.contains('runtime-mode'), false);
  app.navigate('monitoring');
  assert.match(app.body(), /经营分析助手/);
  click(app, { inspectionSelect: 'all' });
  assert.match(app.body(), /应用运行总览/);
});

test('invalid or hidden object ids cannot replace valid selection or open an unrelated detail', () => {
  const app = load(); app.navigate('monitoring'); click(app, { inspectionSelect: 'app:portal' });
  const before = app.body(); click(app, { inspectionSelect: 'service:does-not-exist' });
  assert.equal(app.body(), before);
  click(app, { inspectionDetail: 'analysis-model' });
  assert.equal(app.element('drawer-layer').classList.contains('open'), false);
});

test('application metrics use root execution observations instead of summing nested calls', () => {
  const app = load();
  assert.equal(typeof app.getInspectionView, 'function');
  const cases = [
    ['portal', ['18,000', '98.33%', '340 ms', '300']],
    ['analysis', ['120', '95.00%', '11.0 步', '420']],
    ['bridge', ['80', '97.50%', '1', '240 ms']],
    ['sync', ['240', '98.33%', '12', '8']]
  ];
  for (const [id, expected] of cases) {
    const profile = app.getInspectionView('app:' + id).profile;
    assert.deepEqual(Array.from(profile.cards, card => card.value), expected);
  }
});

test('name search never recomputes selected application execution metrics from matching dependencies', () => {
  const app = load(); app.navigate('monitoring'); click(app, { inspectionSelect: 'app:analysis' });
  app.listeners.input({ target: { id: 'inspection-query', value: '产品推荐模型', dataset: {} } });
  assert.match(app.body(), /运行完成数/);
  assert.equal(app.getInspectionView('app:analysis').profile.total, 120);
  assert.equal(app.getInspectionView('app:analysis').services.length, 1);
  assert.match(app.body(), /名称查询只影响下方清单/);
});

test('stream backlog chart is labelled as snapshots, not messages consumed per time bucket', () => {
  const app = load(); app.navigate('monitoring'); click(app, { inspectionSelect: 'service:sync-stream' });
  assert.match(app.body(), /消费积压趋势<\/h3><span class="panel-extra">条 · 时点快照/);
  const profile = app.getInspectionView('service:sync-stream').profile;
  assert.deepEqual(Array.from(profile.cards, card => card.value), ['120,000', '133.3 条/s', '340 条', '1.2 s']);
});

test('model token trend and MCP tool breakdown match their own selected scope totals', () => {
  const app = load();
  const model = app.getInspectionView('service:analysis-model').profile;
  assert.deepEqual(Array.from(model.cards, card => card.value), ['120,000', '48,000', '186 ms', '99.00%']);
  assert.equal(model.sample.tokens.reduce((sum, value) => sum + value, 0), 168000);
  for (const [id, total, failures] of [['analysis-mcp', 420, 4], ['bridge-mcp', 80, 2]]) {
    const profile = app.getInspectionView('service:' + id).profile;
    assert.equal(profile.sample.tools.reduce((sum, row) => sum + row[1], 0), total);
    assert.equal(profile.sample.tools.reduce((sum, row) => sum + row[2], 0), failures);
    assert.equal(profile.sample.toolErrors + profile.sample.transportErrors, failures);
  }
});

test('directory search icon expands a named input and collapsing clears any hidden query', () => {
  const app = load(); app.navigate('monitoring');
  assert.equal(app.element('inspection-search-panel').hidden, true);
  assert.equal(app.element('inspection-directory-heading').hidden, false);
  assert.equal(app.element('inspection-search-icon').attributes.href, '#i-search');
  click(app, { inspectionSearchToggle: '' });
  assert.equal(app.element('inspection-search-panel').hidden, false);
  assert.equal(app.element('inspection-directory-heading').hidden, true);
  assert.equal(app.element('inspection-search-icon').attributes.href, '#i-close');
  assert.equal(app.element('inspection-search-toggle').attributes['aria-expanded'], 'true');
  app.listeners.input({ target: { id: 'inspection-query', value: '经营分析助手', dataset: {} } });
  assert.doesNotMatch(app.element('inspection-tree').innerHTML, /客户服务门户/);
  click(app, { inspectionSearchToggle: '' });
  assert.equal(app.element('inspection-search-panel').hidden, true);
  assert.equal(app.element('inspection-directory-heading').hidden, false);
  assert.equal(app.element('inspection-search-icon').attributes.href, '#i-search');
  assert.equal(app.element('inspection-search-toggle').attributes['aria-expanded'], 'false');
  assert.equal(app.element('inspection-query').value, '');
  assert.match(app.element('inspection-tree').innerHTML, /客户服务门户/);
});

test('directory query matches names only, not technical types or fixed version labels', () => {
  const app = load(); app.navigate('monitoring'); click(app, { inspectionSearchToggle: '' });
  for (const query of ['v1.2', '普通客户端']) {
    app.listeners.input({ target: { id: 'inspection-query', value: query, dataset: {} } });
    assert.match(app.body(), /没有符合条件的应用或服务/);
  }
});

test('detail metrics retain their snapshot or window semantics', () => {
  const app = load(); app.navigate('monitoring'); click(app, { inspectionSelect: 'service:sync-worker' });
  click(app, { inspectionDetail: 'sync-worker' });
  assert.match(app.element('drawer-body').innerHTML, /待处理任务[\s\S]*?当前快照/);
  assert.match(app.element('drawer-body').innerHTML, /任务完成数[\s\S]*?近 15 分钟/);
});

test('application directory has no third-level services and right-side drilldown preserves the owning application', () => {
  const app = load(); app.navigate('monitoring'); click(app, { inspectionSelect: 'app:analysis' });
  assert.doesNotMatch(app.element('inspection-tree').innerHTML, /data-inspection-select="service:/);
  assert.match(app.body(), /data-inspection-select="service:analysis-model"/);
  click(app, { inspectionSelect: 'service:analysis-model' });
  assert.match(app.element('inspection-tree').innerHTML, /data-inspection-select="app:analysis"[^>]*aria-current="true"/);
  assert.match(app.body(), /data-inspection-select="app:analysis">返回应用/);
  click(app, { inspectionSelect: 'app:analysis' });
  assert.match(app.body(), /服务运行清单/);
  click(app, { inspectionSearchToggle: '' });
  app.listeners.input({ target: { id: 'inspection-query', value: '数据查询工具', dataset: {} } });
  assert.doesNotMatch(app.element('inspection-tree').innerHTML, /data-inspection-select="service:/);
});

test('directory current states are always booleans with exactly one selected overview or application', () => {
  const app = load(); app.navigate('monitoring');
  for (const selection of ['all', 'app:analysis', 'service:analysis-model', 'app:billing']) {
    click(app, { inspectionSelect: selection });
    const states = Array.from(app.element('inspection-tree').innerHTML.matchAll(/aria-current="([^"]+)"/g), match => match[1]);
    assert.equal(states.filter(value => value === 'true').length, 1);
    assert.equal(states.every(value => value === 'true' || value === 'false'), true);
  }
});
