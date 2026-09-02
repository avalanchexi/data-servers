const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Unit harness: runs the actual inline script, not a browser or a layout engine.
// Only DOM sinks and focus timers are substituted; render/save logic stays real.
function loadPrototype() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'archive', '2026-09-02', 'settings-page-prototype.html'), 'utf8');
  const elements = new Map();
  const listeners = {};
  const timers = new Map();
  let nextTimer = 0;
  function element(id) {
    if (!elements.has(id)) {
      const attributes = {};
      const classes = new Set();
      const node = {
        value: '', hidden: false, disabled: false, textContent: '', scrollTop: 0, attributes, style: {}, dataset: {},
        setAttribute(name, value) { attributes[name] = value; },
        removeAttribute(name) { delete attributes[name]; },
        addEventListener(name, handler) { this[name] = handler; },
        focus() {},
        scrollIntoView(options) { this.lastScrollRequest = options; },
        getBoundingClientRect() { return { left: 1300, top: 840, bottom: 872, width: 300, height: 100 }; },
        contains(target) { return target === this; },
        closest() { return null; },
        querySelector() { return null; },
        classList: { add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value) }
      };
      Object.defineProperty(node, 'innerHTML', {
        get() { return this.markup || ''; },
        set(markup) {
          this.markup = markup;
          for (const match of markup.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)) {
            const child = element(match[1]);
            const value = match[0].match(/\bvalue="([^"]*)"/);
            if (value) child.value = value[1];
            child.authMethod = /\bdata-auth-method\b/.test(match[0]);
            child.dataset.authMethod = match[0].match(/data-auth-method="([^"]*)"/)?.[1];
            child.checked = /\bchecked\b/.test(match[0]);
            child.hidden = /\bhidden\b/.test(match[0]);
            child.disabled = /\bdisabled\b/.test(match[0]);
          }
          for (const select of markup.matchAll(/<select[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) {
            const options = [...select[2].matchAll(/<option([^>]*)>([^<]*)<\/option>/g)];
            const selected = options.find(option => /\bselected\b/.test(option[1])) || options[0];
            if (selected) element(select[1]).value = selected[1].match(/value="([^"]*)"/)?.[1] || selected[2];
          }
        }
      });
      elements.set(id, node);
    }
    return elements.get(id);
  }
  let api;
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(
    /\}\(\)\);\s*$/, 'capture({state, render, editCommon, saveCommon, editLimit, saveLimit, editType, saveType, toggleType, closeDrawer, closeModal}); }());'
  );
  vm.runInNewContext(script, {
    document: { getElementById: element, querySelector: element, querySelectorAll: () => [...elements.values()].filter(node => node.authMethod && node.checked), addEventListener: (name, handler) => { listeners[name] = handler; } },
    window: { innerWidth: 1440, innerHeight: 900, location: { href: 'https://prototype.invalid/' }, history: { replaceState() {} }, setTimeout(handler) { timers.set(++nextTimer, handler); return nextTimer; }, clearTimeout(id) { timers.delete(id); } },
    URL, capture(value) { api = value; }
  });
  return { ...api, element, listeners, rendered: () => element('variant-root').innerHTML, editor: () => element('drawer-body').innerHTML, flushTimers() { const pending = [...timers.values()]; timers.clear(); pending.forEach(handler => handler()); } };
}

function openLimits(app) {
  app.state.variantBTopic = 'limits';
  app.render();
  return app.rendered();
}

function click(app, dataset) {
  const button = { dataset, hasAttribute(name) { return Object.hasOwn(dataset, name.replace(/^data-/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase())); } };
  app.listeners.click({ target: { closest: () => button } });
}

function setAuthEnabled(app, index, enabled) {
  const input = app.element('auth-method-' + index);
  input.checked = enabled;
  if (app.listeners.change) app.listeners.change({ target: input });
}

test('catalog offers three independently selectable topics without decorative icons or removed notices', () => {
  const app = loadPrototype();
  const html = app.rendered();
  assert.equal((html.match(/data-topic=/g) || []).length, 3);
  const rail = html.match(/<aside[\s\S]*?<\/aside>/)[0];
  assert.equal(/<svg|topic-icon|不包含租户/.test(rail), false);
  assert.equal(/设置目录只包含两个主题|scope-banner/.test(html), false);
});

test('market and limit cards show names without redundant codes and each limit offers an editor', () => {
  const app = loadPrototype();
  assert.equal((app.rendered().match(/class="type-card-name"/g) || []).length, 8);
  assert.equal(app.rendered().includes('class="type-code"'), false);
  const html = openLimits(app);
  assert.equal((html.match(/data-edit-limit=/g) || []).length, 7);
  assert.equal(/data-limit-tab|id="limit-rpm"|class="type-code"|data-edit-limit="logical"/.test(html), false);
});

test('market cards use the concise edit action and omit the header visibility total', () => {
  const app = loadPrototype();
  const html = app.rendered();
  const editLabels = [...html.matchAll(/<button[^>]*data-edit-type="[^"]+"[^>]*>([^<]*)<\/button>/g)].map(match => match[1]);
  assert.deepEqual(editLabels, Array(8).fill('编辑'));
  const header = html.split('<div class="detail-topline">')[1].split('<div class="detail-body">')[0];
  assert.equal(header.includes('类对外呈现'), false);
  assert.ok(html.includes('class="status status-success">对外呈现'));
  click(app, { editType: 'agent' });
  assert.equal(app.element('drawer-layer').attributes['data-placement'], 'right');
  assert.ok(app.element('drawer-title').textContent.includes('Agent'));
});

test('auth stays inline with four independently linked method sections', () => {
  const app = loadPrototype();
  app.state.variantBTopic = 'auth';
  app.render();
  assert.ok(app.rendered().includes('id="default-method"'));
  assert.equal(/data-edit-common|四层组成/.test(app.rendered()), false);
  for (const id of ['oauth', 'api-key', 'jwt', 'mtls']) assert.ok(app.rendered().includes('id="auth-fields-' + id + '"'));
  assert.equal(app.element('auth-fields-mtls').hidden, true);
  assert.equal(app.element('mtls-max-days').disabled, true);
});

for (const [type, required] of [
  ['agent', ['执行步数', '工具调用', '执行时长', '运行时']],
  ['model', ['Token/分钟', '百万 Token/月', '输出 Token']],
  ['skill', ['激活次数', '脚本执行', '运行时']],
  ['worker', ['任务并发', '排队任务', '执行时长']],
  ['stream', ['订阅连接', 'GB/月', '单条消息']]
]) {
  test(`${type} editor exposes its own measured units and enforcement boundary`, () => {
    const app = loadPrototype();
    app.editLimit(type);
    const html = app.editor();
    for (const phrase of required) assert.ok(html.includes(phrase), `Missing ${type} field: ${phrase}`);
    if (['model', 'skill', 'worker'].includes(type)) assert.equal(html.includes('GB/月'), false);
    assert.equal(app.element('drawer-layer').classList.contains('open'), true);
    assert.equal(app.element('drawer-layer').attributes['data-placement'], 'right');
    assert.equal(app.element('drawer-layer').classList.contains('from-left'), false);
  });
}

test('model quota edit previews changes, cancel preserves values, confirm applies only that type', () => {
  const app = loadPrototype();
  openLimits(app);
  app.editLimit('model');
  assert.ok(app.editor().includes('id="limit-tpm"'), 'Missing drawer model quota control');
  const before = app.rendered();
  app.element('limit-tpm').value = '150000';
  app.saveLimit('model');
  assert.ok(app.element('modal-layer').classList.contains('open'));
  assert.equal(app.rendered(), before);
  app.closeModal();
  assert.equal(app.rendered(), before);
  app.saveLimit('model');
  app.element('modal-confirm').click();
  assert.equal(app.element('limit-tpm').value, '150000');
  assert.equal(app.state.limits.find(limit => limit.id === 'model').fields.find(field => field.key === 'tpm').value, 150000);
  app.editLimit('agent');
  assert.equal(app.element('limit-rpm').value, '120');
});

test('tightening a typed field below a running application blocks saving and identifies the application', () => {
  const app = loadPrototype();
  openLimits(app);
  app.editLimit('worker');
  const before = app.rendered();
  assert.ok(app.editor().includes('id="limit-taskConcurrency"'));
  app.element('limit-taskConcurrency').value = '1';
  app.saveLimit('worker');
  assert.ok(app.element('limit-error').innerHTML.includes('报表生成任务'));
  assert.equal(app.element('limit-error').hidden, false);
  assert.equal(app.rendered(), before);
  assert.equal(app.element('modal-layer').classList.contains('open'), false);
});

for (const value of ['', '0', '-1', '1.5', 'NaN', 'Infinity', '9007199254740992']) {
  test(`typed limits reject invalid integer ${JSON.stringify(value)} without mutation`, () => {
    const app = loadPrototype();
    openLimits(app);
    app.editLimit('model');
    const before = app.rendered();
    assert.ok(app.editor().includes('id="limit-tpm"'));
    app.element('limit-tpm').value = value;
    app.saveLimit('model');
    assert.equal(app.element('limit-error').hidden, false);
    assert.equal(app.element('limit-tpm').attributes['aria-invalid'], 'true');
    assert.equal(app.rendered(), before);
  });
}

test('all seven type editors can save a valid unchanged configuration', () => {
  const app = loadPrototype();
  for (const id of ['agent', 'api', 'model', 'mcp', 'skill', 'worker', 'stream']) {
    app.editLimit(id);
    app.saveLimit(id);
    assert.ok(app.element('modal-layer').classList.contains('open'), `Missing preview for ${id}`);
    app.element('modal-confirm').click();
    assert.equal(app.element('drawer-layer').classList.contains('open'), false);
  }
});

test('market visibility still needs confirmation and keeps existing product counts', () => {
  const app = loadPrototype();
  app.toggleType('agent');
  assert.equal(app.state.types[0].shown, true);
  app.element('modal-confirm').click();
  assert.equal(app.state.types[0].shown, false);
  assert.equal(app.state.types[0].count, 12);
  app.toggleType('agent');
  assert.equal(app.state.types[0].shown, true);
});

test('edited product names remain escaped in limit cards and the drawer', () => {
  const app = loadPrototype();
  app.state.types[0].name = '<img src=x onerror=alert(1)>';
  const html = openLimits(app);
  assert.equal(html.includes('<img'), false);
  assert.ok(html.includes('&lt;img'));
  app.editLimit('agent');
  assert.equal(app.editor().includes('<img'), false);
  assert.ok(app.editor().includes('&lt;img'));
});

test('inline common policy confirms before saving and rejects invalid lifetimes', () => {
  const app = loadPrototype();
  app.editCommon();
  assert.ok(app.rendered().includes('id="key-max-days"'));
  assert.equal(app.element('drawer-layer').classList.contains('open'), false);
  for (const value of ['366', '-1', '1.5', 'NaN', 'Infinity']) {
    app.element('key-max-days').value = value;
    app.saveCommon();
    assert.equal(app.element('common-policy-error').hidden, false);
    assert.equal(app.state.common.keyMaxDays, 180);
  }
  app.element('key-max-days').value = '200';
  app.saveCommon();
  assert.ok(app.element('modal-layer').classList.contains('open'));
  assert.equal(app.state.common.keyMaxDays, 180);
  app.element('modal-confirm').click();
  assert.equal(app.state.common.keyMaxDays, 200);
});

test('common policy blocks removal of a running authentication method', () => {
  const app = loadPrototype();
  app.editCommon();
  assert.ok(app.rendered().includes('id="auth-method-1"'));
  app.element('auth-method-1').checked = false;
  app.saveCommon();
  assert.ok(app.element('common-policy-error').textContent.includes('经营指标查询'));
  assert.equal(app.state.common.allowed.includes('API Key'), true);
});

test('dirty drawer configuration cannot be silently lost when changing type or topic', () => {
  const app = loadPrototype();
  app.editLimit('model');
  assert.ok(app.editor().includes('id="limit-tpm"'));
  app.element('limit-tpm').value = '150000';
  click(app, { editLimit: 'worker' });
  assert.ok(app.element('modal-layer').classList.contains('open'));
  assert.ok(app.editor().includes('id="limit-tpm"'));
  app.closeModal();
  assert.equal(app.element('limit-tpm').value, '150000');
  click(app, { topic: 'auth' });
  app.element('modal-confirm').click();
  assert.ok(app.rendered().includes('id="default-method"'));
  assert.equal(app.state.limits.find(limit => limit.id === 'model').fields.find(field => field.key === 'tpm').value, 120000);
});

test('closing a dirty limit drawer asks before discarding values', () => {
  const app = loadPrototype();
  app.editLimit('agent');
  assert.ok(app.editor().includes('id="limit-rpm"'));
  app.element('limit-rpm').value = '200';
  click(app, { closeDrawer: '' });
  assert.equal(app.element('modal-layer').classList.contains('open'), true);
  app.closeModal();
  assert.equal(app.element('limit-rpm').value, '200');
  click(app, { closeDrawer: '' });
  app.element('modal-confirm').click();
  assert.equal(app.element('drawer-layer').classList.contains('open'), false);
  app.editLimit('agent');
  assert.equal(app.element('limit-rpm').value, '120');
  assert.ok(app.element('drawer-footer').innerHTML.includes('data-save-limit="agent"'));
});

test('field explanations live in accessible question-mark tooltips, not text below the input', () => {
  const app = loadPrototype();
  app.editLimit('agent');
  const html = app.editor();
  assert.ok(/data-help="help-rpm"/.test(html));
  assert.ok(/aria-describedby="help-rpm"/.test(html));
  assert.ok(/id="help-rpm"[^>]*role="tooltip"[^>]*hidden/.test(html));
  assert.equal(html.includes('class="limit-field-meta"'), false);
});

test('hover and keyboard focus show tooltip, viewport edges are clamped and Escape dismisses it', () => {
  const app = loadPrototype();
  app.editLimit('agent');
  const tooltip = app.element('help-rpm');
  const trigger = {
    dataset: { help: 'help-rpm' },
    getBoundingClientRect() { return { left: 1300, top: 840, bottom: 872 }; },
    closest() { return this; }
  };
  assert.equal(tooltip.hidden, true);
  app.listeners.mouseover({ target: trigger });
  assert.equal(tooltip.hidden, false);
  assert.equal(tooltip.style.left, '1124px');
  assert.equal(tooltip.style.top, '732px');
  app.listeners.keydown({ key: 'Escape' });
  assert.equal(tooltip.hidden, true);
  app.listeners.focusin({ target: trigger });
  assert.equal(tooltip.hidden, false);
  app.listeners.focusout({ target: trigger });
  assert.equal(tooltip.hidden, true);
});

test('inline common save rejects empty methods, mismatched default and a tightened active key lifetime', () => {
  const app = loadPrototype();
  app.editCommon();
  for (const index of [0, 1, 2, 3]) app.element('auth-method-' + index).checked = false;
  app.saveCommon();
  assert.equal(app.element('auth-method-error').hidden, false);
  app.render();
  app.element('default-method').value = 'mTLS';
  app.saveCommon();
  assert.equal(app.element('common-policy-error').hidden, false);
  app.render();
  app.element('key-max-days').value = '100';
  app.saveCommon();
  assert.ok(app.element('common-policy-error').textContent.includes('经营指标查询'));
  assert.equal(app.state.common.keyMaxDays, 180);
});

test('hovering tooltip content cancels every pending leave timeout', () => {
  const app = loadPrototype();
  app.editLimit('agent');
  const tooltip = app.element('help-rpm');
  const trigger = { dataset: { help: 'help-rpm' }, closest() { return this; }, getBoundingClientRect() { return { left: 800, top: 400, bottom: 432 }; } };
  app.listeners.mouseover({ target: trigger });
  app.listeners.mouseout({ relatedTarget: null });
  app.listeners.mouseout({ relatedTarget: null });
  app.listeners.mouseover({ target: tooltip });
  app.flushTimers();
  assert.equal(tooltip.hidden, false);
});

test('invalid saves reveal and request scrolling to their error without committing', () => {
  const app = loadPrototype();
  app.editLimit('agent');
  app.element('limit-rpm').value = '0';
  app.saveLimit('agent');
  assert.equal(app.element('limit-rpm').attributes['aria-invalid'], 'true');
  assert.equal(app.element('limit-error').hidden, false);
  assert.equal(app.element('limit-error').lastScrollRequest?.block, 'nearest');
  assert.ok(app.editor().indexOf('id="limit-error"') < app.editor().indexOf('class="settings-group"'));
  assert.equal(app.state.limits[0].fields[0].value, 120);
  app.render();
  app.closeDrawer();
  app.editCommon();
  app.element('key-max-days').value = '366';
  app.saveCommon();
  assert.equal(app.element('common-policy-error').lastScrollRequest?.block, 'nearest');
  for (const index of [0, 1, 2, 3]) app.element('auth-method-' + index).checked = false;
  app.saveCommon();
  assert.equal(app.element('auth-method-error').lastScrollRequest?.block, 'nearest');
  assert.equal(app.state.common.keyMaxDays, 180);
});

test('auth checkboxes expand their own fields and filter default choices without resetting other inputs', () => {
  const app = loadPrototype();
  app.editCommon();
  app.element('key-default-days').value = '100';
  setAuthEnabled(app, 3, true);
  assert.equal(app.element('auth-fields-mtls').hidden, false);
  assert.equal(app.element('mtls-max-days').disabled, false);
  assert.ok(app.element('default-method').innerHTML.includes('mTLS'));
  setAuthEnabled(app, 3, false);
  assert.equal(app.element('auth-fields-mtls').hidden, true);
  assert.equal(app.element('mtls-max-days').disabled, true);
  assert.equal(app.element('default-method').innerHTML.includes('mTLS'), false);
  assert.equal(app.element('key-default-days').value, '100');
});

test('unchecking the default clears selection and requires an explicit replacement', () => {
  const app = loadPrototype();
  app.editCommon();
  setAuthEnabled(app, 0, false);
  assert.equal(app.element('default-method').value, '');
  assert.equal(app.element('default-method-error').hidden, false);
  app.saveCommon();
  assert.equal(app.state.common.defaultMethod, 'OAuth 2.0');
  assert.equal(app.element('modal-layer').classList.contains('open'), false);
});

test('temporarily disabling an auth method preserves its unsaved lifetime values on re-enable', () => {
  const app = loadPrototype();
  app.editCommon();
  app.element('oauth-token-default-minutes').value = '45';
  setAuthEnabled(app, 0, false);
  assert.equal(app.element('oauth-token-default-minutes').disabled, true);
  setAuthEnabled(app, 0, true);
  assert.equal(app.element('oauth-token-default-minutes').disabled, false);
  assert.equal(app.element('oauth-token-default-minutes').value, '45');
});

test('auth lifetime save validates each enabled method and atomically commits after confirmation', () => {
  const app = loadPrototype();
  app.editCommon();
  assert.ok(app.rendered().includes('id="oauth-token-default-minutes"'));
  app.element('oauth-token-default-minutes').value = '180';
  app.saveCommon();
  assert.equal(app.element('oauth-token-default-minutes').attributes['aria-invalid'], 'true');
  assert.equal(app.element('modal-layer').classList.contains('open'), false);
  app.element('oauth-token-default-minutes').value = '90';
  app.element('jwt-max-minutes').value = '90';
  app.element('mtls-max-days').value = 'invalid';
  app.saveCommon();
  assert.equal(app.element('modal-layer').classList.contains('open'), true);
  assert.equal(app.state.common.oauthTokenDefaultMinutes, 60);
  assert.equal(app.state.common.jwtMaxMinutes, 60);
  app.element('modal-confirm').click();
  assert.equal(app.state.common.oauthTokenDefaultMinutes, 90);
  assert.equal(app.state.common.jwtMaxMinutes, 90);
  assert.equal(app.state.common.mtlsMaxDays, 365);
});

for (const [inputId, value, application] of [
  ['oauth-token-max-minutes', '60', '经营分析助手'],
  ['oauth-secret-max-days', '100', '经营分析助手'],
  ['jwt-max-minutes', '20', '实时订单订阅']
]) {
  test(`tightening ${inputId} checks the matching running credential, not the generic key lifetime`, () => {
    const app = loadPrototype();
    app.editCommon();
    assert.ok(app.rendered().includes('id="' + inputId + '"'));
    app.element(inputId).value = value;
    app.saveCommon();
    assert.ok(app.element('common-policy-error').textContent.includes(application));
    assert.equal(app.element('modal-layer').classList.contains('open'), false);
  });
}

test('dirty auth lifetime edits are protected on navigation and cancel changes restores saved values', () => {
  const app = loadPrototype();
  app.editCommon();
  assert.ok(app.rendered().includes('id="jwt-max-minutes"'));
  app.element('jwt-max-minutes').value = '90';
  click(app, { topic: 'limits' });
  assert.equal(app.element('modal-layer').classList.contains('open'), true);
  app.closeModal();
  assert.equal(app.element('jwt-max-minutes').value, '90');
  click(app, { resetSettings: '' });
  assert.equal(app.element('jwt-max-minutes').value, '60');
});

test('static layout guard: the open drawer does not transform the containing block of viewport-fixed help', () => {
  // Checks this CSS positioning contract only; does not claim browser geometry.
  const html = fs.readFileSync(path.join(__dirname, '..', 'archive', '2026-09-02', 'settings-page-prototype.html'), 'utf8');
  const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
  let openDrawerTransform = 'none';
  for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!rule[1].split(',').some(selector => ['.drawer', '.drawer-layer.open .drawer'].includes(selector.trim()))) continue;
    const transform = rule[2].match(/(?:^|;)\s*transform\s*:\s*([^;]+)/);
    if (transform) openDrawerTransform = transform[1].trim();
  }
  assert.equal(openDrawerTransform, 'none');
});

test('enabled mTLS validates its own lifetime and checks a running certificate before saving', () => {
  const app = loadPrototype();
  app.editCommon();
  setAuthEnabled(app, 3, true);
  app.element('mtls-max-days').value = '0';
  app.saveCommon();
  assert.equal(app.element('mtls-max-days').attributes['aria-invalid'], 'true');
  assert.equal(app.state.common.allowed.includes('mTLS'), false);
  app.state.runningAuth.push({name: '证书接入示例', method: 'mTLS', limits: {mtlsMaxDays: 300}});
  app.element('mtls-max-days').value = '180';
  app.saveCommon();
  assert.ok(app.element('common-policy-error').textContent.includes('证书接入示例'));
  assert.equal(app.element('modal-layer').classList.contains('open'), false);
  app.element('mtls-max-days').value = '400';
  app.saveCommon();
  app.element('modal-confirm').click();
  assert.equal(app.state.common.allowed.includes('mTLS'), true);
  assert.equal(app.state.common.mtlsMaxDays, 400);
});
