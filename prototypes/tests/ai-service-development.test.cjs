const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Run the real inline renderer and handlers with DOM output sinks.
// CSS contract checks below do not replace browser layout verification.
const html = fs.readFileSync(path.join(__dirname, '..', 'ai-service-development.html'), 'utf8');

function load(options = {}) {
  const elements = new Map();
  const listeners = {};
  const storage = options.storage || new Map();
  const decode = value => value.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  function element(id) {
    if (elements.has(id)) return elements.get(id);
    const classes = new Set();
    let content = '';
    const node = {
      id, value: '', hidden: false, checked: false, type: '', textContent: '', attributes: {}, dataset: {}, style: {}, offsetWidth: 300, offsetHeight: 120,
      get innerHTML() { return content; },
      set innerHTML(value) {
        content = value;
        // Read actual rendered defaults, rather than supplying empty fake fields.
        for (const match of value.matchAll(/<(input|textarea|div|select|button)\b([^>]*\bid="([^"]+)"[^>]*)>/g)) {
          const child = element(match[3]);
          child.hidden = /\bhidden(?:\s|$)/.test(match[2]);
          child.attributes = Object.fromEntries(Array.from(match[2].matchAll(/([\w-]+)="([^"]*)"/g), pair => [pair[1], decode(pair[2])]));
          child.type = child.attributes.type || '';
          child.tagName = match[1].toUpperCase();
          child.checked = /\bchecked(?:\s|$)/.test(match[2]);
          child.disabled = /\bdisabled(?:\s|$)/.test(match[2]);
          child.dataset = Object.fromEntries(Object.entries(child.attributes).filter(([key]) => key.startsWith('data-')).map(([key, val]) => [key.slice(5).replace(/-([a-z])/g, (_, char) => char.toUpperCase()), val]));
          if (match[1] === 'input') child.value = decode(child.attributes.value || '');
          if (match[1] === 'textarea') child.value = decode(value.slice(match.index + match[0].length).split('</textarea>')[0]);
          if (match[1] === 'select') {
            const items = Array.from(value.slice(match.index + match[0].length).split('</select>')[0].matchAll(/<option([^>]*)>([^<]*)<\/option>/g));
            const selected = items.find(item => /\bselected\b/.test(item[1])) || items[0];
            child.value = selected ? decode((selected[1].match(/value="([^"]*)"/) || [null, selected[2]])[1]) : '';
          }
        }
      },
      setAttribute(key, value) { this.attributes[key] = value; },
      removeAttribute(key) { delete this.attributes[key]; },
      addEventListener(key, handler) { this[key] = handler; },
      querySelector(selector) { return element(id + ' ' + selector); },
      querySelectorAll() { return []; },
      focus() {}, setSelectionRange() {},
      classList: {
        add(value) { classes.add(value); }, remove(value) { classes.delete(value); },
        contains(value) { return classes.has(value); },
        toggle(value, enabled) { if (enabled) classes.add(value); else classes.delete(value); }
      }
    };
    elements.set(id, node);
    return node;
  }
  vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], {
    URLSearchParams, URL,
    document: { getElementById: element, querySelector: element, querySelectorAll: () => [], addEventListener: (name, handler) => { listeners[name] = handler; } },
    window: { innerWidth: 1440, innerHeight: 900, location: { search: '', href: 'file:///prototype.html' }, setTimeout() {}, clearTimeout() {}, history: { replaceState() {} }, localStorage: {
      getItem(key) { return storage.get(key) || null; },
      setItem(key, value) { if (options.storageUnavailable) throw new Error('Storage denied'); storage.set(key, value); }
    } }
  });
  return {
    element,
    storage,
    saved: () => JSON.parse(storage.get('data-services.ai-development.v2')).services,
    body: () => element('workspace').innerHTML,
    click(dataset) {
      const target = { dataset, hasAttribute(name) { return Object.hasOwn(dataset, name.replace(/^data-/, '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())); } };
      listeners.click({ target: { closest: () => target } });
    },
    fill(id, value) { const target = element(id); target.value = value; listeners.input({ target }); },
    change(id, value) { const target = element(id); if (typeof value === 'boolean') target.checked = value; else target.value = value; listeners.change({ target }); },
    changeData(dataset, checked) { listeners.change({ target: { dataset, checked, removeAttribute() {} } }); },
    confirm() { element('modal-confirm').onclick(); },
    scopeHelp(eventName, rect) {
      const trigger = element('scope-help-trigger');
      trigger.getBoundingClientRect = () => rect;
      listeners[eventName]({ target: { closest: () => trigger } });
    },
    event(name, event = {}) { listeners[name](event); }
  };
}

function cssFor(selector) {
  const declarations = {};
  const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!rule[1].split(',').map(value => value.trim()).includes(selector)) continue;
    for (const declaration of rule[2].matchAll(/([\w-]+)\s*:\s*([^;]+);/g)) declarations[declaration[1]] = declaration[2].trim();
  }
  return declarations;
}

test('pipeline opens directly on its type rail and four lifecycle columns without the removed notice', () => {
  const app = load();
  assert.equal(app.body().includes('每张卡片代表一个平台原生服务制品'), false);
  assert.equal(app.body().includes('查看数据应用装配'), false);
  assert.match(app.body(), /class="view pipeline-view"/);
  assert.equal((app.body().match(/class="kanban-column"/g) || []).length, 4);
  assert.equal((app.body().match(/class="kanban-card"/g) || []).length, 9);
  assert.match(app.body(), /data-create-service/);
});

test('pipeline layout uses the remaining viewport height and keeps overflow inside the rail and cards', () => {
  assert.equal(cssFor('.pipeline-view').height, '100%');
  assert.equal(cssFor('.pipeline-view').display, 'flex');
  assert.equal(cssFor('.pipeline-view')['min-height'], '0');
  assert.equal(cssFor('.pipeline-view > .page-head').flex, 'none');
  assert.equal(cssFor('.pipeline-view > .page-body').flex, '1');
  assert.equal(cssFor('.pipeline-view > .page-body')['min-height'], '0');
  assert.equal(cssFor('.page-body').padding, 'var(--ds-page-padding)');
  assert.equal(cssFor('.pipeline-layout')['grid-template-rows'], 'minmax(0, 1fr)');
  assert.equal(cssFor('.type-rail')['overflow-y'], 'auto');
  assert.equal(cssFor('.kanban-cards')['overflow-y'], 'auto');
  assert.equal(cssFor('.kanban')['overflow-x'], 'auto');
  assert.equal(cssFor('.kanban')['grid-template-columns'], 'repeat(4, minmax(320px, 1fr))');
  assert.equal(cssFor('.kanban-column')['min-width'], '320px');
  const app = load();
  assert.match(app.body(), /class="kanban" role="region" tabindex="0" aria-label="服务生命周期看板，可横向滚动"/);
});

test('leaving the pipeline preserves the application and development views and their return path', () => {
  const app = load();
  app.click({ openService: 'agent-risk' });
  assert.equal(app.body().includes('pipeline-view'), false);
  app.click({ view: 'application' });
  assert.equal(app.body().includes('pipeline-view'), false);
  app.click({ view: 'services' });
  assert.match(app.body(), /class="view pipeline-view"/);
});

test('new service name and required description start empty', () => {
  const app = load(); app.click({ createService: '' });
  assert.equal(app.element('new-service-name').value, '');
  assert.equal(app.element('new-service-desc').value, '');
  const form = app.element('modal-body').innerHTML;
  assert.match(form, /<textarea[^>]*id="new-service-desc"[^>]*\brequired\b/);
  assert.match(form, /for="new-service-desc">服务说明（必填）/);
});

for (const [name, description, nameInvalid, descriptionInvalid] of [
  ['', '', true, true], ['   ', '有效说明', true, false],
  ['新建服务', '', false, true], ['新建服务', ' \n\t ', false, true]
]) {
  test('creation rejects blank required fields ' + JSON.stringify([name, description]), () => {
    const app = load(); app.click({ createService: '' });
    app.fill('new-service-name', name); app.fill('new-service-desc', description);
    const before = app.body(); app.confirm();
    assert.equal(app.element('modal-layer').classList.contains('open'), true);
    assert.equal(app.body(), before);
    assert.equal(app.element('new-service-error').hidden, !nameInvalid);
    assert.equal(app.element('new-service-desc-error').hidden, !descriptionInvalid);
    assert.equal(app.element('new-service-name').attributes['aria-invalid'], String(nameInvalid));
    assert.equal(app.element('new-service-desc').attributes['aria-invalid'], String(descriptionInvalid));
  });
}

test('correcting required values clears field errors and permits draft creation', () => {
  const app = load(); app.click({ createService: '' });
  app.fill('new-service-name', ''); app.fill('new-service-desc', ''); app.confirm();
  app.fill('new-service-name', '风险核验'); app.fill('new-service-desc', '审核客户风险数据');
  assert.equal(app.element('new-service-error').hidden, true);
  assert.equal(app.element('new-service-desc-error').hidden, true);
  app.confirm();
  assert.equal(app.element('modal-layer').classList.contains('open'), false);
  assert.equal(app.body().includes('pipeline-view'), false);
  assert.match(app.element('toast-text').textContent, /草稿已创建/);
});

test('selecting another service type does not erase text already entered', () => {
  const app = load(); app.click({ createService: '' });
  app.fill('new-service-name', '订单分析'); app.fill('new-service-desc', '提供订单分析工具');
  app.click({ createType: 'MCP' });
  assert.equal(app.element('new-service-name').value, '订单分析');
  assert.equal(app.element('new-service-desc').value, '提供订单分析工具');
  app.confirm();
  assert.match(app.element('toast-text').textContent, /MCP 草稿已创建/);
});

test('closing and reopening creation restores empty fields without retaining abandoned text', () => {
  const app = load(); app.click({ createService: '' });
  app.fill('new-service-name', '未提交名称'); app.fill('new-service-desc', '未提交说明');
  app.click({ closeModal: '' }); app.click({ createService: '' });
  assert.equal(app.element('new-service-name').value, '');
  assert.equal(app.element('new-service-desc').value, '');
});

function create(app, type = 'Agent', hosted = true, name = '新增' + type, mode = 'manual') {
  app.click({ createService: '' });
  app.click({ createType: type });
  app.fill('new-service-name', name);
  app.fill('new-service-desc', type + ' 业务说明');
  if (!hosted) app.change('new-hosted-no', true);
  else if (mode === 'manual') app.change('creation-mode-manual', true);
  app.confirm();
  return app.saved().find(service => service.name === name);
}

function submit(app) {
  app.click({ submitService: '' });
  app.change('review-confirmed', true);
  app.confirm();
}

for (const [type, expected, absent] of [
  ['Agent', ['cfg-goal', 'cfg-model', 'cfg-memory'], ['cfg-taskName', 'cfg-packageName']],
  ['MCP', ['cfg-entry', 'cfg-tools', 'cfg-toolInput'], ['cfg-memory', 'cfg-model']],
  ['Skill', ['cfg-packageName', 'cfg-instructions', 'skill-root-name'], ['cfg-memory', 'cfg-scriptPath']],
  ['Worker', ['cfg-taskName', 'cfg-attempts', 'cfg-idempotency'], ['cfg-memory', 'cfg-schedule']]
]) {
  test(type + ' gets its own named draft, common data requirements and dedicated editor', () => {
    const app = load(); const created = create(app, type);
    assert.match(app.body(), new RegExp('<h1>新增' + type + '</h1>'));
    assert.match(app.body(), /数据需求/);
    assert.equal(created.type, type);
    assert.equal(created.description, type + ' 业务说明');
    assert.equal(created.hosted, true);
    assert.equal(created.creationMode, 'manual');
    app.click({ section: 'definition' });
    for (const id of expected) assert.ok(app.body().includes('id="' + id + '"'), id);
    for (const id of absent) assert.ok(!app.body().includes('id="' + id + '"'), id);
    app.click({ view: 'services' });
    assert.match(app.body(), new RegExp('新增' + type));
    app.click({ openService: created.id });
    assert.match(app.body(), new RegExp('<h1>新增' + type + '</h1>'));
  });

  test(type + ' nonhosted flow only exposes data requirements and cannot invoke development actions', () => {
    const app = load(); const created = create(app, type, false);
    assert.equal(created.hosted, false);
    assert.deepEqual(created.config, {});
    assert.match(app.body(), /数据需求/);
    for (const forbidden of ['data-run-test', 'data-ai-generate', 'data-deploy-service', 'data-switch-mode', 'data-section="definition"', 'data-section="dependencies"']) assert.ok(!app.body().includes(forbidden));
    app.click({ section: 'definition' });
    assert.ok(!app.body().includes('data-config='));
    app.click({ runTest: '' });
    assert.equal(app.element('drawer-layer').classList.contains('open'), false);
    app.click({ aiGenerate: '' });
    app.change('service-no-data', true);
    submit(app);
    assert.match(app.body(), /待审核/);
    const submitted = app.saved().find(s => s.id === created.id);
    assert.deepEqual(submitted.submission.config, {});
    assert.match(submitted.submission.version, /需求修订/);
    app.click({ reviewDetails: '' });
    app.click({ reviewDecision: 'approve' });
    assert.match(app.body(), /需求已通过/);
    assert.ok(!app.body().includes('data-deploy-service'));
    app.click({ deployService: '' });
    assert.equal(app.element('modal-layer').classList.contains('open'), false);
  });
}

test('hosting toggle preserves entered values, hides creation mode, and resets on reopening', () => {
  const app = load(); app.click({ createService: '' });
  app.fill('new-service-name', '原名'); app.fill('new-service-desc', '原说明');
  app.change('creation-mode-manual', true);
  app.change('new-hosted-no', true);
  assert.equal(app.element('creation-mode-field').hidden, true);
  app.change('new-hosted-yes', true);
  app.click({ createType: 'Skill' });
  assert.equal(app.element('creation-mode-field').hidden, false);
  assert.equal(app.element('new-service-name').value, '原名');
  app.confirm();
  assert.equal(app.saved()[0].creationMode, 'manual');
  app.click({ createService: '' });
  assert.equal(app.element('new-hosted-yes').checked, true);
  assert.equal(app.element('new-service-name').value, '');
});

test('AI creation opens a conversation-first workspace with read-only configuration drawers', () => {
  const app = load();
  const created = create(app, 'Agent', true, '对话式客户洞察', 'ai');
  assert.equal(created.creationMode, 'ai');
  assert.match(app.body(), /class="ai-workbench/);
  assert.match(app.body(), /开发 Agent 会话/);
  assert.match(app.body(), /aria-label="配置目录"/);
  assert.match(app.body(), /data-config-drawer="definition"/);
  assert.ok(!app.body().includes('data-config="goal"'));

  app.click({ configDrawer: 'definition' });
  assert.match(app.body(), /class="config-drawer-panel/);
  assert.match(app.body(), /只读配置/);
  assert.match(app.body(), /data-switch-mode="manual"/);
  assert.ok(!app.body().includes('data-config="goal"'));

  app.click({ configDrawer: 'versions' });
  assert.match(app.body(), /修订与审核只读配置/);
  assert.ok(!app.body().includes('data-request-ai-change="versions"'));
});

test('manual creation opens the type-specific editor without AI generation controls', () => {
  const app = load();
  const created = create(app, 'Agent', true, '手工客户洞察', 'manual');
  assert.equal(created.creationMode, 'manual');
  assert.match(app.body(), /class="workbench manual-workbench/);
  assert.ok(!app.body().includes('data-ai-generate'));
  app.click({ section: 'definition' });
  assert.match(app.body(), /id="cfg-goal"/);
  assert.ok(!app.body().includes('AI 开发助手'));
});

test('editable hosted drafts switch development modes on the same service and record revisions', () => {
  const app = load();
  const created = create(app, 'Worker', true, '切换方式 Worker', 'manual');
  const initialRevision = created.revision;

  app.click({ switchMode: 'ai' });
  let saved = app.saved().find(service => service.id === created.id);
  assert.equal(saved.creationMode, 'ai');
  assert.equal(saved.revision, initialRevision + 1);
  assert.match(saved.history.at(-1).note, /手工开发 → AI 辅助开发/);
  assert.match(app.body(), /class="ai-workbench/);

  app.click({ switchMode: 'manual' });
  saved = app.saved().find(service => service.id === created.id);
  assert.equal(saved.creationMode, 'manual');
  assert.equal(saved.revision, initialRevision + 2);
  assert.match(app.body(), /class="workbench manual-workbench/);
});

test('pending AI proposals must be accepted or discarded before switching to manual development', () => {
  const app = load();
  const created = create(app, 'MCP', true, '待采纳 MCP', 'ai');
  app.click({ aiGenerate: '' });
  assert.match(app.body(), /待采纳变更/);
  app.click({ switchMode: 'manual' });
  assert.equal(app.saved().find(service => service.id === created.id).creationMode, 'ai');
  assert.match(app.element('toast-text').textContent, /先接受或放弃/);
  app.click({ discardProposal: '' });
  app.click({ switchMode: 'manual' });
  assert.equal(app.saved().find(service => service.id === created.id).creationMode, 'manual');
});

test('data declaration, fields, purpose and custom row conditions are validated then persisted', () => {
  const app = load(); const service = create(app, 'MCP');
  app.click({ submitService: '' });
  assert.match(app.body(), /请选择数据，或声明本服务不使用平台数据/);
  assert.equal(app.element('modal-layer').classList.contains('open'), false);
  app.click({ selectAssets: '' });
  app.fill('asset-search', '不存在');
  assert.match(app.element('asset-results').innerHTML, /未找到/);
  app.confirm();
  assert.equal(app.element('asset-error').hidden, false);
  app.fill('asset-search', '订单');
  assert.match(app.element('asset-results').innerHTML, /订单明细/);
  app.changeData({ assetSelect: 'orders' }, true);
  app.confirm();
  app.change('req-0-scope', '指定条件');
  app.click({ submitService: '' });
  assert.match(app.body(), /请至少选择一个字段/);
  assert.match(app.body(), /请填写数据使用用途/);
  assert.match(app.body(), /请填写条件值/);
  app.changeData({ requestIndex: '0', requestField: 'order_id' }, true);
  app.change('req-0-scopeField', 'order_date');
  app.fill('req-0-scopeValue', '2026-08-28');
  app.fill('req-0-purpose', '核对当日订单');
  app.click({ saveDraft: '' });
  const saved = app.saved().find(s => s.id === service.id);
  assert.deepEqual(saved.requests[0], { assetId: 'orders', fields: ['order_id'], scope: '指定条件', scopeField: 'order_date', scopeValue: '2026-08-28', purpose: '核对当日订单' });
  const reloaded = load({ storage: app.storage });
  reloaded.click({ openService: service.id });
  assert.match(reloaded.body(), /核对当日订单/);
  assert.equal(reloaded.element('req-0-scopeValue').value, '2026-08-28');
});

test('selected assets cannot be duplicated and removing the last asset permits explicit no-data declaration', () => {
  const app = load(); app.click({ openService: 'agent-risk' });
  app.click({ selectAssets: '' });
  assert.match(app.element('modal-body').innerHTML, /data-asset-select="customer" checked disabled/);
  app.changeData({ assetSelect: 'customer' }, true); app.confirm();
  app.click({ saveDraft: '' });
  assert.equal(app.saved().find(s => s.id === 'agent-risk').requests.length, 1);
  app.click({ removeRequest: '0' });
  app.change('service-no-data', true);
  app.click({ saveDraft: '' });
  assert.equal(app.saved().find(s => s.id === 'agent-risk').noData, true);
});

test('submission requires human confirmation, freezes content and does not publish or grant access', () => {
  const app = load(); const service = create(app);
  app.change('service-no-data', true);
  app.click({ submitService: '' });
  app.confirm();
  assert.equal(app.element('review-confirmed-error').hidden, false);
  assert.equal(app.saved()[0].lifecycle, '草稿');
  app.change('review-confirmed', true); app.confirm();
  const pending = app.saved().find(s => s.id === service.id);
  assert.equal(pending.lifecycle, '待审核');
  assert.equal(pending.runtime, '—');
  app.click({ section: 'definition' });
  assert.match(app.body(), /fieldset class="config-fields" disabled/);
  const original = app.element('cfg-prompt').value;
  app.fill('cfg-prompt', '强制修改');
  app.click({ saveDraft: '' });
  app.click({ reviewDetails: '' });
  assert.match(app.element('drawer-body').innerHTML, /原型模拟 · 非真实审批/);
  app.click({ reviewDecision: 'approve' });
  const approved = app.saved().find(s => s.id === service.id);
  assert.equal(approved.config.prompt, original);
  assert.deepEqual(approved.submission, pending.submission);
  assert.equal(approved.lifecycle, '审核通过');
  assert.equal(approved.runtime, '—');
  assert.match(app.element('toast-text').textContent, /未授予数据权限/);
  app.click({ deployService: '' }); app.confirm();
  assert.equal(app.saved().find(s => s.id === service.id).lifecycle, '已上线');
  assert.match(app.element('toast-text').textContent, /未进行实际部署/);
});

test('rejection requires a reason and allows corrected content to be submitted as a new frozen snapshot', () => {
  const app = load(); const service = create(app, 'Worker');
  app.change('service-no-data', true); submit(app);
  app.click({ reviewDetails: '' });
  app.click({ reviewDecision: 'reject' });
  assert.equal(app.element('review-note-error').hidden, false);
  app.fill('review-note', '补充任务实现');
  app.click({ reviewDecision: 'reject' });
  assert.match(app.body(), /补充任务实现/);
  app.click({ section: 'definition' });
  app.fill('cfg-implementation', 'def task(payload): return payload');
  submit(app);
  const saved = app.saved().find(s => s.id === service.id);
  assert.equal(saved.lifecycle, '待审核');
  assert.equal(saved.submissions.length, 2);
  assert.notEqual(saved.submissions[0].version, saved.submissions[1].version);
  assert.notEqual(saved.submissions[0].config.implementation, saved.submissions[1].config.implementation);
  app.click({ reviewSnapshot: '0' });
  assert.match(app.element('drawer-body').innerHTML, /历史快照/);
  assert.ok(!app.element('drawer-foot').innerHTML.includes('data-review-decision'));
  assert.ok(!app.element('drawer-body').innerHTML.includes('def task(payload): return payload'));
});

test('pending review remains frozen after a reload and saved configuration is restored', () => {
  const app = load(); const service = create(app, 'Skill');
  app.change('service-no-data', true); app.click({ section: 'definition' });
  app.fill('cfg-instructions', '经过人工核对的技能指令'); submit(app);
  const reload = load({ storage: app.storage });
  reload.click({ openService: service.id }); reload.click({ section: 'definition' });
  assert.equal(reload.element('cfg-instructions').value, '经过人工核对的技能指令');
  assert.match(reload.body(), /fieldset class="config-fields" disabled/);
  assert.ok(!reload.body().includes('data-submit-service'));
  reload.click({ reviewDetails: '' }); reload.click({ reviewDecision: 'approve' });
  assert.equal(reload.saved().find(s => s.id === service.id).lifecycle, '审核通过');
});

test('a new revision does not mutate prior approved snapshots or reuse their release version', () => {
  const app = load(); const service = create(app, 'Agent');
  app.change('service-no-data', true); submit(app);
  app.click({ reviewDetails: '' }); app.click({ reviewDecision: 'approve' });
  const before = app.saved().find(s => s.id === service.id).submission;
  app.click({ newRevision: '' }); app.click({ section: 'definition' });
  app.fill('cfg-prompt', '新修订指令'); app.click({ saveDraft: '' });
  assert.deepEqual(app.saved().find(s => s.id === service.id).submission, before);
  app.click({ submitService: '' });
  app.fill('release-version', before.version); app.change('review-confirmed', true); app.confirm();
  assert.equal(app.element('release-version-error').hidden, false);
  assert.equal(app.saved().find(s => s.id === service.id).lifecycle, '草稿');
});

test('MCP capability selection changes contracts while retaining edits and rejects an empty capability set', () => {
  const app = load(); create(app, 'MCP'); app.change('service-no-data', true);
  app.click({ section: 'definition' });
  app.fill('cfg-toolName', 'custom_query');
  app.change('cfg-resources', true); app.change('cfg-prompts', true);
  assert.match(app.body(), /cfg-resourceUri/); assert.match(app.body(), /cfg-promptBody/);
  assert.equal(app.element('cfg-toolName').value, 'custom_query');
  app.change('cfg-tools', false);
  assert.ok(!app.body().includes('id="cfg-toolInput"'));
  app.change('cfg-resources', false); app.change('cfg-prompts', false);
  app.click({ submitService: '' });
  assert.match(app.body(), /至少声明一种协议能力/);
});

test('Skill has optional scripts with path validation, while Worker schedule and timeout rules are separate', () => {
  const app = load(); create(app, 'Skill'); app.change('service-no-data', true);
  app.click({ section: 'definition' });
  app.click({ skillCreate: 'file' });
  app.change('skill-new-kind', 'python');
  app.fill('skill-new-path', '../secrets');
  app.confirm();
  assert.match(app.element('skill-new-path-error').textContent, /相对路径/);
  app.fill('skill-new-path', 'scripts/process.py');
  app.confirm();
  assert.match(app.body(), /skill-file-content/);
  app.fill('cfg-packageName', 'Invalid Name');
  app.fill('skill-file-content', '');
  app.click({ submitService: '' });
  assert.match(app.body(), /1–64 位/); assert.match(app.body(), /请填写脚本内容/);
  app.fill('cfg-packageName', 'valid-skill');
  app.fill('skill-file-content', 'def run(payload): return payload');
  create(app, 'Worker'); app.change('service-no-data', true); app.click({ section: 'definition' });
  app.change('cfg-trigger', '平台定时');
  assert.match(app.body(), /cfg-timezone/);
  app.fill('cfg-schedule', '99 9 * * *'); app.fill('cfg-totalTimeout', '100');
  app.click({ submitService: '' });
  assert.match(app.body(), /合法的五段 Cron/);
  assert.match(app.body(), /整体期限不能小于/);
});

test('invalid schema prevents submission and template tests are labelled static checks, not executed code', () => {
  const app = load(); create(app, 'Agent'); app.change('service-no-data', true); app.click({ section: 'definition' });
  app.fill('cfg-inputSchema', '{ invalid }');
  app.click({ submitService: '' });
  assert.match(app.body(), /合法的对象 JSON Schema/);
  app.fill('cfg-inputSchema', '{"type":"object"}');
  app.click({ runTest: '' });
  assert.match(app.element('drawer-body').innerHTML, /不运行代码/);
  assert.match(app.element('drawer-body').innerHTML, /执行边界声明/);
  app.click({ closeDrawer: '' });
  app.fill('cfg-goal', '新目标'); app.click({ saveDraft: '' });
  assert.equal(app.saved()[0].test, null);
});

test('type-specific AI proposal only changes the active draft after explicit acceptance', () => {
  const app = load(); const worker = create(app, 'Worker', true, '新增Worker', 'ai');
  app.click({ aiGenerate: '' }); app.click({ previewDiff: '' });
  assert.match(app.element('drawer-title').textContent, /Worker/);
  assert.match(app.element('drawer-body').innerHTML, /任务实现/);
  assert.ok(!app.element('drawer-body').innerHTML.includes('Prompt'));
  const before = app.saved().find(s => s.id === worker.id).config.implementation;
  app.click({ acceptAll: '' });
  const after = app.saved().find(s => s.id === worker.id).config.implementation;
  assert.notEqual(after, before);
  app.click({ openService: 'agent-risk' });
  app.click({ section: 'definition' });
  assert.ok(!app.body().includes('id="cfg-implementation"'));
});

test('pipeline filters actual cards and user-controlled text is escaped', () => {
  const app = load(); create(app, 'MCP', false, '<img onerror="alert(1)">');
  assert.ok(!app.body().includes('<img onerror='));
  assert.match(app.body(), /&lt;img/);
  app.click({ view: 'services' }); app.click({ pipelineType: 'Worker' });
  assert.ok(!app.body().includes('data-open-service="agent-risk"'));
  assert.match(app.body(), /data-open-service="worker-report"/);
});

test('local storage failure is reported honestly and editing remains usable in the current page', () => {
  const app = load({ storageUnavailable: true });
  app.click({ createService: '' }); app.fill('new-service-name', '临时服务'); app.fill('new-service-desc', '说明'); app.confirm();
  assert.match(app.body(), /临时服务/);
  assert.match(app.element('toast-text').textContent, /本地存储不可用，仅当前页面保留/);
});

test('new editor uses shrinkable desktop columns, right-hand drawers and focusable help controls', () => {
  assert.equal(cssFor('.manual-workbench')['grid-template-columns'], '240px minmax(0, 1fr)');
  assert.match(html, /\.ai-workbench \{[^}]*grid-template-columns: minmax\(0, 1fr\) 240px;/);
  assert.match(html, /\.ai-workbench\.drawer-open \{ grid-template-columns: minmax\(0, 1fr\) 240px minmax\(320px, 380px\);/);
  assert.match(html, /@media \(max-width: 1279px\)[\s\S]*\.ai-workbench\.drawer-open \{ grid-template-columns: minmax\(0, 1fr\) 240px 320px;/);
  assert.equal(cssFor('.ai-config-rail')['border-left'], '1px solid var(--ds-border-2)');
  assert.equal(cssFor('.config-drawer-panel')['border-left'], '1px solid var(--ds-border-2)');
  assert.equal(cssFor('.drawer').right, '0');
  assert.equal(cssFor('.workbench-head')['flex-wrap'], 'wrap');
  const app = load(); create(app);
  assert.match(app.body(), /field-help.*button type="button" aria-label=/);
  assert.ok(!/<script[^>]+src=|<link[^>]+https?:/.test(html));
});

for (const type of ['Agent', 'MCP', 'Skill', 'Worker']) {
  test(type + ' puts the mode switch under service configuration to the right of the conversation', () => {
    const app = load(); create(app, type, true, '布局 ' + type, 'ai');
    const header = () => app.body().match(/<header class="page-head workbench-head">[\s\S]*?<\/header>/)[0];
    assert.ok(!header().includes('mode-switch'));
    assert.match(header(), /data-save-draft[\s\S]*data-run-test[\s\S]*data-submit-service/);
    const rail = app.body().match(/<nav class="ai-config-rail"[\s\S]*?<\/nav>/)[0];
    assert.match(rail, /<h2>服务配置<\/h2><div class="config-mode"><div class="mode-switch"/);
    assert.ok(app.body().indexOf('class="ai-chat-panel"') < app.body().indexOf('class="ai-config-rail"'));
    app.click({ configDrawer: 'definition' });
    assert.ok(app.body().indexOf('class="ai-config-rail"') < app.body().indexOf('class="config-drawer-panel"'));
    app.click({ closeConfigDrawer: '' });
    assert.ok(!app.body().includes('class="config-drawer-panel"'));
    app.click({ switchMode: 'manual' });
    assert.ok(!header().includes('mode-switch'));
    assert.match(app.body(), /class="workbench-nav"[\s\S]*<h2>服务配置<\/h2><div class="config-mode">/);
    app.click({ switchMode: 'ai' });
    assert.ok(app.body().indexOf('class="ai-chat-panel"') < app.body().indexOf('class="ai-config-rail"'));
  });
}

test('draft and simulation cards expose deletion but review and published cards do not', () => {
  const app = load();
  for (const id of ['agent-risk', 'mcp-order', 'worker-report', 'skill-compliance-next']) assert.ok(app.body().includes('data-delete-service="' + id + '"'));
  for (const id of ['agent-recommend', 'mcp-product', 'agent-customer', 'mcp-profile', 'skill-compliance']) {
    assert.ok(!app.body().includes('data-delete-service="' + id + '"'));
    app.click({ deleteService: id });
    assert.equal(app.element('modal-layer').classList.contains('open'), false);
  }
});

for (const id of ['agent-risk', 'worker-report', 'skill-compliance-next']) {
  test('deleting ' + id + ' requires confirmation, preserves history and stays removed after reload', () => {
    const app = load();
    const before = app.body();
    app.click({ deleteService: id });
    assert.equal(app.element('modal-layer').classList.contains('open'), true);
    assert.match(app.element('modal-body').innerHTML, /历史记录/);
    assert.match(app.element('modal-foot').innerHTML, /btn-danger/);
    app.click({ closeModal: '' });
    assert.equal(app.body(), before);
    app.click({ deleteService: id }); app.confirm();
    assert.equal((app.body().match(/class="kanban-card"/g) || []).length, 8);
    assert.ok(!app.body().includes('data-open-service="' + id + '"'));
    assert.match(app.body(), /<span>全部服务<\/span><span class="count-badge">8<\/span>/);
    const deleted = app.saved().find(service => service.id === id);
    assert.equal(deleted.deleted, true);
    assert.equal(deleted.history.at(-1).action, '删除服务');
    assert.ok(deleted.config);
    const reloaded = load({ storage: app.storage });
    assert.ok(!reloaded.body().includes('data-open-service="' + id + '"'));
    const list = reloaded.body();
    reloaded.click({ openService: id });
    assert.equal(reloaded.body(), list);
    reloaded.click({ deleteService: id });
    assert.equal(reloaded.element('modal-layer').classList.contains('open'), false);
  });
}

test('nonhosted drafts can be deleted and an empty catalog does not restore deleted fixtures', () => {
  const app = load(); const service = create(app, 'MCP', false, '待删除需求');
  const storage = new Map([['data-services.ai-development.v2', JSON.stringify({ schema: 2, services: [service] })]]);
  const single = load({ storage });
  single.click({ deleteService: service.id }); single.confirm();
  const reloaded = load({ storage });
  assert.equal((reloaded.body().match(/class="kanban-card"/g) || []).length, 0);
  assert.match(reloaded.body(), /<span>全部服务<\/span><span class="count-badge">0<\/span>/);
  reloaded.click({ createService: '' });
  reloaded.fill('new-service-name', '重新创建'); reloaded.fill('new-service-desc', '新服务'); reloaded.confirm();
  assert.match(reloaded.body(), /重新创建/);
});

test('delete confirmation rechecks lifecycle and cannot delete a service submitted in the meantime', () => {
  const app = load(); const service = create(app);
  app.click({ view: 'services' }); app.click({ deleteService: service.id });
  const confirmDelete = app.element('modal-confirm').onclick;
  app.click({ closeModal: '' }); app.click({ openService: service.id });
  app.change('service-no-data', true); submit(app);
  confirmDelete();
  const saved = app.saved().find(item => item.id === service.id);
  assert.equal(saved.lifecycle, '待审核');
  assert.equal(saved.deleted, undefined);
  assert.match(app.element('toast-text').textContent, /状态已变化/);
});

test('rejected drafts allow deletion but revisions of approved or published services stay protected', () => {
  const app = load(); const service = create(app);
  app.change('service-no-data', true); submit(app);
  app.click({ reviewDetails: '' }); app.fill('review-note', '补充说明'); app.click({ reviewDecision: 'reject' });
  app.click({ view: 'services' });
  assert.ok(app.body().includes('data-delete-service="' + service.id + '"'));
  app.click({ openService: service.id }); submit(app);
  app.click({ reviewDetails: '' }); app.click({ reviewDecision: 'approve' }); app.click({ newRevision: '' });
  app.click({ view: 'services' });
  assert.ok(!app.body().includes('data-delete-service="' + service.id + '"'));
  app.click({ deleteService: service.id });
  assert.equal(app.element('modal-layer').classList.contains('open'), false);
  app.click({ openService: 'agent-customer' }); app.click({ newRevision: '' }); app.click({ view: 'services' });
  assert.ok(!app.body().includes('data-delete-service="agent-customer"'));
});

test('deletion escapes the named target and reports a local persistence failure', () => {
  const app = load(); const service = create(app, 'Skill', false, '<img onerror="oops">');
  const failed = load({ storage: app.storage, storageUnavailable: true });
  failed.click({ deleteService: service.id });
  assert.ok(!failed.element('modal-body').innerHTML.includes('<img'));
  assert.match(failed.element('modal-body').innerHTML, /&lt;img/);
  failed.confirm();
  assert.ok(!failed.body().includes('data-open-service="' + service.id + '"'));
  assert.match(failed.element('toast-text').textContent, /仅当前页面生效，刷新后可能恢复/);
  assert.ok(load({ storage: app.storage }).body().includes('data-open-service="' + service.id + '"'));
});

test('scope help is outside scroll containers and shows all text on hover and focus', () => {
  assert.match(html, /<\/main>[\s\S]*id="scope-help-popover" role="tooltip" hidden/);
  assert.equal(cssFor('.scope-help-floating').position, 'fixed');
  assert.equal(cssFor('.type-rail')['overflow-y'], 'auto');
  const app = load();
  assert.ok(!app.body().includes('id="scope-help-popover"'));
  const popup = app.element('scope-help-popover');
  assert.equal(popup.hidden, true);
  app.scopeHelp('pointerover', { left: 360, top: 465, bottom: 485 });
  assert.equal(popup.hidden, false);
  assert.match(popup.textContent, /模型由 AI 网关注册管理[\s\S]*不在此登记外部地址或获得运行权限。/);
  assert.equal(popup.style.left, '360px');
  assert.equal(popup.style.top, '493px');
  app.event('scroll'); assert.equal(popup.hidden, true);
  app.scopeHelp('focusin', { left: 360, top: 465, bottom: 485 });
  assert.equal(popup.hidden, false);
  app.event('keydown', { key: 'Escape' }); assert.equal(popup.hidden, true);
});

test('scope help flips above the trigger and stays within the right viewport edge', () => {
  const app = load(); const popup = app.element('scope-help-popover');
  app.scopeHelp('pointerover', { left: 1390, top: 870, bottom: 890 });
  assert.equal(popup.style.left, '1124px');
  assert.equal(popup.style.top, '742px');
  app.click({ pipelineType: 'MCP' });
  assert.equal(popup.hidden, true);
});
