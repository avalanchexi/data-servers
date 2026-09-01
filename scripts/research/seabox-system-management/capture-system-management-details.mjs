import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_ROOT, '..', '..', '..');
const args = parseArgs(process.argv.slice(2));
const START_URL = args.startUrl || 'https://ai.seaboxdata.com/#/home/config-system-monitor';
const EXPECTED_ORIGIN = new URL(START_URL).origin;
const RUN_ID = timestampId();
const OUTPUT_ROOT = path.resolve(args.resumeOutput || args.output || path.join(REPO_ROOT, 'output', 'playwright', 'seabox-system-management-detail-audit', RUN_ID));
const PROFILE_ROOT = path.join(REPO_ROOT, '.tmp', 'seabox-ui-capture', 'private', 'system-management-detail-audit-profile');
const MIN_DELAY_MS = numberFromEnv('CAPTURE_MIN_DELAY_MS', 1600);
const MAX_DELAY_MS = numberFromEnv('CAPTURE_MAX_DELAY_MS', 3600);
const MAX_DETAILS = Number.isInteger(args.maxDetails) ? args.maxDetails : 4;
const MAX_TABLE_PAGES = Number.isInteger(args.maxTablePages) ? args.maxTablePages : 10;
const MAX_RECORDS = Number.isInteger(args.maxRecords) ? args.maxRecords : 300;
const CAPTURE_API_BODIES = !args.noApiBodies;
const MAX_JSON_BYTES = numberFromEnv('CAPTURE_MAX_JSON_BYTES', 2_000_000);
const STRUCTURE_ONLY_RE = /(权限|用户|组织|角色|IM用户|消息|审计|日志|反馈|事件|预警|处置|任务)/i;

const SECTIONS = [
  { name: '系统监控', route: '/#/home/config-system-monitor', tabs: ['Dashboard', '定时任务', '日志监控', '应用缓存', 'LLM缓存', '向量表', 'SQLite 数据库'] },
  { name: '系统配置', route: '/#/home/config-system-config', tabs: ['环境配置', '应用配置', '分析报告模板', '字典配置'] },
  { name: '权限管理', route: '/#/home/config-permission', tabs: ['用户管理', '组织管理', '角色管理', '功能菜单', '功能权限', 'IM用户映射'] },
  { name: '消息管理', route: '/#/home/config-messages', tabs: ['消息列表', '消息模板'] },
  { name: '安全合规', route: '/#/home/config-content-compliance', tabs: ['概览', '合规事件', '策略配置', '安全回答', 'LLM安全'] },
  { name: '风险监管', route: '/#/home/config-risk-governance', tabs: ['风险模型构建', '风险预警', '风险闭环处置'] },
  { name: '系统审计', route: '/#/home/config-system-audit', tabs: ['审计日志', '用量统计', '日志管理'] },
  { name: '反馈回测', route: '/#/home/config-feedback-backtest', tabs: ['反馈中心', '评测集管理', '回归测试'] }
];

const SAFE_DETAIL_RE = /^(?:查看(?:详情|配置|日志)?|详情|预览|展开|更多信息)(?:\s|$|[（(])/;
const DANGEROUS_RE = /(新建|创建|添加|编辑|修改|删除|移除|保存|提交|发布|上传|下载|导出|导入|执行|启动|停止|重启|重置|清空|启用|禁用|停用|通过|驳回|审批|发送|同步|回测|测试|复制|生成|刷新二维码|退出)/;
const TAB_DANGEROUS_RE = /(新建|创建|添加|编辑|修改|删除|移除|保存|提交|发布|上传|下载|导出|导入|执行|启动|停止|重启|重置|清空|启用|禁用|停用|通过|驳回|审批|发送|同步|复制|生成|退出)/;
const SUSPICIOUS_WRITE_URL_RE = /(?:^|[\/_-])(delete|remove|create|insert|update|save|submit|publish|approve|reject|execute|start|stop|restart|reset|enable|disable|upload|import|send)(?:[\/_?&#=-]|$)/i;

let manifest = {
  runId: RUN_ID,
  startedAt: new Date().toISOString(),
  finishedAt: null,
  origin: EXPECTED_ORIGIN,
  startUrl: redactUrl(START_URL),
  outputRoot: OUTPUT_ROOT,
  policy: {
    scope: '系统管理', concurrency: 1, headed: true,
    minDelayMs: MIN_DELAY_MS, maxDelayMs: MAX_DELAY_MS,
    apiBodies: CAPTURE_API_BODIES, maxJsonBytes: MAX_JSON_BYTES,
    maxDetailsPerState: MAX_DETAILS, maxTablePagesPerState: MAX_TABLE_PAGES,
    maxRecordsPerState: MAX_RECORDS, preferLargestPageSize: true,
    writeMethodsBlocked: ['PUT', 'PATCH', 'DELETE'],
    suspiciousWritePostsBlocked: true,
    loginIsManual: true
  },
  expected: {
    sections: SECTIONS.length,
    tabs: SECTIONS.reduce((sum, item) => sum + item.tabs.length, 0),
    stateKeys: expectedStateKeys()
  },
  captured: { sections: 0, states: 0, details: 0, apiResponses: 0 },
  coverage: {
    status: 'pending',
    discoveredSidebarItems: [],
    discoveredTabs: {},
    discoveredRoutes: [],
    capturedStateKeys: [],
    missingBaselineStates: [],
    missingDiscoveredStates: [],
    missingSidebarSections: [],
    unexpectedSidebarItems: [],
    unexpectedStates: [],
    suspiciousStates: [],
    paginationLimitReached: [],
    recordLimitReached: [],
    missingEvidenceFiles: [],
    notes: []
  },
  states: [], errors: [], safetyEvents: [], network: { responses: 0, status401: 0, status403: 0, status429: 0, status5xx: 0 },
  halted: false, haltReason: null
};

if (args.resumeOutput) {
  const resumeManifestFile = path.join(OUTPUT_ROOT, 'manifest.json');
  const previousManifest = JSON.parse(await fs.readFile(resumeManifestFile, 'utf8'));
  manifest = {
    ...previousManifest,
    resumedAt: [...(previousManifest.resumedAt || []), new Date().toISOString()],
    finishedAt: null,
    halted: false,
    haltReason: null,
    policy: { ...previousManifest.policy, maxRecordsPerState: MAX_RECORDS, preferLargestPageSize: true },
    expected: { sections: SECTIONS.length, tabs: SECTIONS.reduce((sum, item) => sum + item.tabs.length, 0), stateKeys: expectedStateKeys() }
  };
  manifest.coverage.status = 'pending';
}

if (args.dryRun) {
  console.log(JSON.stringify({
    mode: 'dry-run', startUrl: START_URL, outputRoot: OUTPUT_ROOT,
    expectedSections: SECTIONS.length,
    expectedTabs: manifest.expected.tabs,
    expectedBaseAndTabStates: SECTIONS.length + manifest.expected.tabs,
    captureApiBodies: CAPTURE_API_BODIES,
    maxDetailsPerState: MAX_DETAILS,
    maxTablePagesPerState: MAX_TABLE_PAGES,
    maxRecordsPerState: MAX_RECORDS,
    sections: SECTIONS
  }, null, 2));
  process.exit(0);
}

const { chromium } = await loadPlaywright();
await Promise.all([
  fs.mkdir(path.join(OUTPUT_ROOT, 'states'), { recursive: true }),
  fs.mkdir(path.join(OUTPUT_ROOT, 'details'), { recursive: true }),
  fs.mkdir(path.join(OUTPUT_ROOT, 'screenshots'), { recursive: true }),
  fs.mkdir(path.join(OUTPUT_ROOT, 'network'), { recursive: true }),
  fs.mkdir(PROFILE_ROOT, { recursive: true })
]);

let currentStateId = 'login';
let currentCapturePolicy = { mode: 'full', captureApiBody: true, paginate: true, openDetails: true, rowLimit: 20 };
let halted = false;
const pendingNetworkWrites = new Set();
const seenStateKeys = new Set(manifest.states.map(state => {
  const section = SECTIONS.find(item => item.name === state.section);
  return section ? `${section.route}::${state.tab || 'base'}` : '';
}).filter(Boolean));
const context = await chromium.launchPersistentContext(PROFILE_ROOT, {
  headless: false,
  viewport: { width: 1440, height: 900 },
  locale: 'zh-CN', timezoneId: 'Asia/Shanghai', colorScheme: 'light',
  acceptDownloads: false, serviceWorkers: 'allow'
});
const page = context.pages()[0] || await context.newPage();
page.setDefaultTimeout(6000);
page.setDefaultNavigationTimeout(20000);

await context.route('**/*', async route => {
  const request = route.request();
  const method = request.method().toUpperCase();
  const requestUrl = request.url();
  const sameOrigin = safeOrigin(requestUrl) === EXPECTED_ORIGIN;
  if (sameOrigin && ['PUT', 'PATCH', 'DELETE'].includes(method)) {
    manifest.safetyEvents.push({ at: new Date().toISOString(), kind: 'blocked-request', method, url: redactUrl(requestUrl) });
    await route.abort('blockedbyclient');
    return;
  }
  if (sameOrigin && method === 'POST' && isSuspiciousWritePost(requestUrl, request.postData() || '')) {
    manifest.safetyEvents.push({ at: new Date().toISOString(), kind: 'blocked-suspicious-post', method, url: redactUrl(requestUrl) });
    await route.abort('blockedbyclient');
    return;
  }
  await route.continue();
});

page.on('dialog', async dialog => {
  manifest.safetyEvents.push({ at: new Date().toISOString(), kind: 'dismissed-browser-dialog', message: sanitizeText(dialog.message()) });
  await dialog.dismiss().catch(() => {});
});
page.on('download', async download => {
  manifest.safetyEvents.push({ at: new Date().toISOString(), kind: 'cancelled-download', filename: sanitizeText(download.suggestedFilename()) });
  await download.cancel().catch(() => {});
});
page.on('response', response => {
  manifest.network.responses += 1;
  const status = response.status();
  if (status === 401) manifest.network.status401 += 1;
  if (status === 403) manifest.network.status403 += 1;
  if (status === 429) {
    manifest.network.status429 += 1;
    halt('收到 HTTP 429，已按低负载安全策略停止。');
  }
  if (status >= 500) {
    manifest.network.status5xx += 1;
    if (manifest.network.status5xx >= 5) halt('累计收到 5 个 HTTP 5xx，已停止，避免继续增加系统压力。');
  }
  if (CAPTURE_API_BODIES) {
    const responsePolicy = { ...currentCapturePolicy };
    const task = captureJsonResponse(response, currentStateId, responsePolicy).catch(error => {
      manifest.errors.push({ kind: 'network-json', stateId: currentStateId, error: sanitizeText(error?.message || String(error)) });
    }).finally(() => pendingNetworkWrites.delete(task));
    pendingNetworkWrites.add(task);
  }
});

try {
  await page.goto(START_URL, { waitUntil: 'domcontentloaded' }).catch(error => {
    console.log(`首次打开目标站点未完成：${sanitizeText(error?.message || String(error))}`);
  });

  console.log('\n[等待你登录] 浏览器已打开。');
  console.log('1. 请确认当前网络能够访问内网。');
  console.log('2. 仅在浏览器窗口中手工输入账号、密码并完成登录。');
  console.log('3. 脚本识别到“系统管理”后会倒计时 8 秒再开始；期间可暂停或关闭浏览器。');
  console.log(`4. 全程单页、单并发、随机延迟；表格最多顺序读取 ${MAX_TABLE_PAGES} 页，不执行任何写操作。\n`);

  const authorized = await waitForManualLogin(page, 30 * 60 * 1000);
  if (!authorized) halt('等待人工登录超过 30 分钟，未开始采集。');
  if (!halted) {
    console.log('已识别登录后的系统管理页面，8 秒后开始专项采集。');
    await page.waitForTimeout(8000);
    await auditSystemManagementNavigation(page);
  }

  for (const section of SECTIONS) {
    if (halted) break;
    await captureSection(page, section);
  }
} catch (error) {
  manifest.errors.push({ kind: 'fatal', error: sanitizeText(error?.stack || error?.message || String(error)) });
  halt(/Target page, context or browser has been closed/i.test(error?.message || '') ? '浏览器窗口已关闭，采集未完成。' : '采集过程出现未处理错误。');
} finally {
  await Promise.allSettled([...pendingNetworkWrites]);
  manifest.finishedAt = new Date().toISOString();
  manifest.halted = halted;
  await finalizeCoverageAudit();
  await writeJson(path.join(OUTPUT_ROOT, 'coverage-report.json'), manifest.coverage);
  await fs.writeFile(path.join(OUTPUT_ROOT, 'coverage-report.md'), buildCoverageReport(manifest), 'utf8');
  await writeJson(path.join(OUTPUT_ROOT, 'manifest.json'), manifest);
  await fs.writeFile(path.join(OUTPUT_ROOT, 'system-management-data-report.md'), buildMarkdownReport(manifest), 'utf8');
  await context.close().catch(() => {});
  console.log(`\n采集${halted ? '已停止' : '已完成'}：${OUTPUT_ROOT}`);
  console.log(`报告：${path.join(OUTPUT_ROOT, 'system-management-data-report.md')}`);
  console.log(`覆盖审计：${path.join(OUTPUT_ROOT, 'coverage-report.md')}`);
  if (manifest.haltReason) console.log(`原因：${manifest.haltReason}`);
}

async function captureSection(activePage, section) {
  const requiredStateKeys = [
    `${section.route}::base`,
    ...section.tabs.map(tab => `${section.route}::${tab}`)
  ];
  if (requiredStateKeys.every(key => seenStateKeys.has(key))) {
    console.log(`[断点续采] ${section.name} 已完整，跳过。`);
    return;
  }
  const url = new URL(section.route, EXPECTED_ORIGIN).href;
  currentStateId = slug(`${section.name}-base`);
  currentCapturePolicy = stateCapturePolicy(section, null);
  console.log(`\n[模块] ${section.name}`);
  await humanDelay(activePage);
  await activePage.goto(url, { waitUntil: 'domcontentloaded' });
  await waitForContent(activePage);
  const baseWasCaptured = seenStateKeys.has(`${section.route}::base`);
  await captureState(activePage, section, null, 'base');
  if (!baseWasCaptured) manifest.captured.sections += 1;

  const discoveredTabs = await discoverTabs(activePage);
  manifest.coverage.discoveredTabs[section.name] = unique(discoveredTabs);
  const tabs = unique([...section.tabs, ...discoveredTabs]).filter(label => label && !TAB_DANGEROUS_RE.test(label));
  for (const tabLabel of tabs) {
    if (halted) break;
    const stateKey = `${section.route}::${tabLabel}`;
    if (seenStateKeys.has(stateKey)) continue;
    currentStateId = slug(`${section.name}-${tabLabel}`);
    currentCapturePolicy = stateCapturePolicy(section, tabLabel);
    const clicked = await clickTab(activePage, tabLabel);
    if (!clicked) {
      manifest.errors.push({ kind: 'tab-not-found', section: section.name, tab: tabLabel });
      continue;
    }
    await waitForContent(activePage);
    await captureState(activePage, section, tabLabel, 'tab');
  }
}

async function captureState(activePage, section, tabLabel, source) {
  const stateKey = `${section.route}::${tabLabel || 'base'}`;
  if (seenStateKeys.has(stateKey)) return;
  seenStateKeys.add(stateKey);
  const stateId = slug(`${String(manifest.states.length + 1).padStart(3, '0')}-${section.name}-${tabLabel || 'base'}`);
  currentStateId = stateId;
  const capturePolicy = stateCapturePolicy(section, tabLabel);
  currentCapturePolicy = capturePolicy;
  console.log(`[采集] ${section.name}${tabLabel ? ` / ${tabLabel}` : ''}`);
  await humanDelay(activePage);
  await dismissNonDataPopups(activePage);
  const pageSizeAudit = await configureLargestPageSize(activePage, capturePolicy);
  const data = await extractDataDetails(activePage);
  applyCapturePolicy(data, capturePolicy);
  limitTableRows(data.tables, capturePolicy.mode === 'structure-only' ? capturePolicy.rowLimit : MAX_RECORDS);
  data.meta = {
    stateId, section: section.name, tab: tabLabel, source,
    captureMode: capturePolicy.mode,
    url: redactUrl(activePage.url()), title: sanitizeText(await activePage.title()),
    capturedAt: new Date().toISOString()
  };
  data.pageSizeAudit = pageSizeAudit;
  const paginationResult = await capturePaginationPages(activePage, stateId, capturePolicy, data);
  data.paginationPages = paginationResult.pages;
  const screenshotName = `${stateId}-full.png`;
  await activePage.screenshot({ path: path.join(OUTPUT_ROOT, 'screenshots', screenshotName), fullPage: true, animations: 'disabled' }).catch(error => {
    manifest.errors.push({ kind: 'screenshot', stateId, error: sanitizeText(error?.message || String(error)) });
  });
  const detailRecords = await captureReadOnlyDetails(activePage, section, tabLabel, stateId, capturePolicy);
  data.detailRecords = detailRecords.map(item => ({ id: item.id, trigger: item.trigger, kind: item.kind, file: item.file }));
  const coverageAudit = assessStateCoverage(data, paginationResult.audit, pageSizeAudit);
  data.coverageAudit = coverageAudit;
  for (const link of data.links || []) {
    if (isSystemManagementRoute(link.href)) manifest.coverage.discoveredRoutes.push(link.href);
  }
  const stateFile = path.join('states', `${stateId}.json`).replaceAll('\\', '/');
  await writeJson(path.join(OUTPUT_ROOT, stateFile), data);
  manifest.states.push({
    id: stateId, section: section.name, tab: tabLabel, source,
    captureMode: capturePolicy.mode,
    pageSizeAudit,
    file: stateFile, screenshot: `screenshots/${screenshotName}`,
    tables: data.tables.length,
    visibleRows: data.tables.reduce((sum, table) => sum + table.rows.length, 0) + data.paginationPages.reduce((sum, pageData) => sum + pageData.tables.reduce((rowSum, table) => rowSum + table.rows.length, 0), 0),
    tablePages: 1 + data.paginationPages.length,
    filters: data.filters.length, forms: data.formControls.length,
    keyValues: data.keyValues.length, details: detailRecords.length,
    detailFiles: detailRecords.flatMap(record => [record.file, record.screenshot]),
    headings: data.headings.map(item => item.text).slice(0, 8),
    stateKey: coverageStateKey(section.name, tabLabel),
    coverageAudit
  });
  manifest.coverage.capturedStateKeys.push(coverageStateKey(section.name, tabLabel));
  manifest.captured.states += 1;
  await writeJson(path.join(OUTPUT_ROOT, 'manifest.partial.json'), manifest);
}

async function configureLargestPageSize(activePage, capturePolicy) {
  if (!capturePolicy.paginate) return { status: 'skipped-structure-only', selected: null, options: [] };
  const nativeSelect = activePage.locator(
    'main .ant-pagination select, main .el-pagination select, main [class*="pagination"] select, main select[aria-label*="每页"], main select[title*="每页"]'
  ).filter({ visible: true }).first();
  if (await nativeSelect.count() && await nativeSelect.isVisible().catch(() => false)) {
    const choices = await nativeSelect.locator('option').evaluateAll(options => options.map(option => ({
      value: option.value,
      label: (option.textContent || '').replace(/\s+/g, ' ').trim(),
      size: Number.parseInt((option.textContent || option.value || '').match(/\d+/)?.[0] || '0', 10)
    })).filter(option => option.size > 0));
    const best = choices.sort((a, b) => b.size - a.size)[0];
    if (best) {
      await nativeSelect.selectOption(best.value).catch(() => nativeSelect.selectOption({ label: best.label }));
      await waitForContent(activePage, 900);
      console.log(`[分页] 已选择最大分页：${best.label || best.size}`);
      return { status: 'selected', kind: 'native-select', selected: best.size, label: best.label, options: choices.map(choice => choice.size) };
    }
  }

  const customControl = activePage.locator(
    'main .ant-pagination-options-size-changer, main .el-pagination__sizes, main [class*="pagination"] [class*="size"] [role="combobox"], main [class*="pagination"] [aria-label*="每页"]'
  ).filter({ visible: true }).first();
  if (!await customControl.count() || !await customControl.isVisible().catch(() => false)) {
    return { status: 'not-found', selected: null, options: [] };
  }
  await humanDelay(activePage);
  const clickTarget = customControl.locator('[role="combobox"], .ant-select-selector, input').first();
  const opened = await (await clickTarget.count() ? clickTarget : customControl).click({ timeout: 4000 }).then(() => true).catch(() => false);
  if (!opened) return { status: 'open-failed', selected: null, options: [] };
  await activePage.waitForTimeout(500);
  const optionLocator = activePage.locator('[role="option"], .ant-select-item-option, .el-select-dropdown__item');
  const choices = await optionLocator.evaluateAll(options => options.map((option, index) => {
    const rect = option.getBoundingClientRect();
    const style = getComputedStyle(option);
    const label = (option.innerText || option.textContent || '').replace(/\s+/g, ' ').trim();
    return {
      index,
      label,
      size: Number.parseInt(label.match(/\d+/)?.[0] || '0', 10),
      visible: rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    };
  }).filter(option => option.visible && option.size > 0));
  const best = choices.sort((a, b) => b.size - a.size)[0];
  if (!best) {
    await activePage.keyboard.press('Escape').catch(() => {});
    return { status: 'options-not-found', selected: null, options: [] };
  }
  const selected = await optionLocator.nth(best.index).click({ timeout: 4000 }).then(() => true).catch(() => false);
  if (!selected) {
    await activePage.keyboard.press('Escape').catch(() => {});
    return { status: 'select-failed', selected: null, options: choices.map(choice => choice.size) };
  }
  await waitForContent(activePage, 900);
  console.log(`[分页] 已选择最大分页：${best.label || best.size}`);
  return { status: 'selected', kind: 'custom-select', selected: best.size, label: best.label, options: choices.map(choice => choice.size) };
}

async function capturePaginationPages(activePage, stateId, capturePolicy, initialData) {
  if (!capturePolicy.paginate) return { pages: [], audit: { stopReason: 'structure-only-policy', pagesRead: 1, limitReached: false } };
  if (MAX_TABLE_PAGES <= 1) return { pages: [], audit: { stopReason: 'disabled-by-limit', pagesRead: 1, limitReached: false } };
  const pages = [];
  const seenSignatures = new Set();
  let stopReason = 'no-pagination';
  let recordsRead = countTableRows(initialData.tables);
  seenSignatures.add(tableSignature(initialData.tables));

  if (recordsRead >= MAX_RECORDS) {
    return {
      pages,
      audit: { stopReason: 'record-limit-reached', pagesRead: 1, recordsRead: MAX_RECORDS, limitReached: false, recordLimitReached: true }
    };
  }

  for (let pageNumber = 2; pageNumber <= MAX_TABLE_PAGES && !halted; pageNumber += 1) {
    const next = activePage.locator(
      'main button[aria-label*="下一页"], main button[title*="下一页"], main .ant-pagination-next button, main .ant-pagination-next a, main .el-pagination .btn-next, main [class*="pagination"] button:last-child'
    ).filter({ visible: true }).first();
    if (!await next.count() || !await next.isVisible().catch(() => false)) {
      stopReason = pageNumber === 2 ? 'no-pagination' : 'next-not-visible';
      break;
    }
    const disabled = await next.evaluate(element => element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true' || element.closest('[aria-disabled="true"], .disabled, .ant-pagination-disabled, .is-disabled') !== null).catch(() => true);
    if (disabled) {
      stopReason = 'last-page';
      break;
    }
    await humanDelay(activePage);
    const clicked = await next.click({ timeout: 5000 }).then(() => true).catch(() => false);
    if (!clicked) {
      stopReason = 'next-click-failed';
      break;
    }
    await waitForContent(activePage, 900);
    const pageData = await extractDataDetails(activePage);
    const remaining = Math.max(0, MAX_RECORDS - recordsRead);
    limitTableRows(pageData.tables, remaining);
    const signature = tableSignature(pageData.tables);
    if (!signature || seenSignatures.has(signature)) {
      stopReason = 'duplicate-or-empty-page';
      break;
    }
    seenSignatures.add(signature);
    pages.push({ page: pageNumber, tables: pageData.tables, capturedAt: new Date().toISOString() });
    recordsRead += countTableRows(pageData.tables);
    console.log(`[翻页] ${stateId} / 第 ${pageNumber} 页`);
    if (recordsRead >= MAX_RECORDS) {
      stopReason = 'record-limit-reached';
      break;
    }
    if (pageNumber === MAX_TABLE_PAGES) stopReason = 'limit-reached';
  }

  if (pages.length) {
    const firstPage = activePage.locator('main .ant-pagination-item-1 a, main .ant-pagination-item-1 button, main .el-pager li').filter({ hasText: /^1$/ }).first();
    if (await firstPage.count() && await firstPage.isVisible().catch(() => false)) {
      await humanDelay(activePage);
      await firstPage.click({ timeout: 4000 }).catch(() => {});
      await waitForContent(activePage, 700);
    }
  }
  currentStateId = stateId;
  return {
    pages,
    audit: {
      stopReason,
      pagesRead: 1 + pages.length,
      recordsRead,
      limitReached: stopReason === 'limit-reached',
      recordLimitReached: stopReason === 'record-limit-reached'
    }
  };
}

async function captureReadOnlyDetails(activePage, section, tabLabel, stateId, capturePolicy) {
  if (MAX_DETAILS === 0 || !capturePolicy.openDetails) return [];
  const candidates = await activePage.locator('main button, main a, main [role="button"]').evaluateAll(elements => elements
    .filter(element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && !element.hasAttribute('disabled');
    })
    .map((element, index) => ({
      index,
      text: (element.innerText || element.textContent || element.getAttribute('aria-label') || element.getAttribute('title') || '').replace(/\s+/g, ' ').trim()
    }))
    .filter(item => item.text));
  const safeLabels = unique(candidates.map(item => item.text))
    .filter(label => SAFE_DETAIL_RE.test(label) && !DANGEROUS_RE.test(label))
    .slice(0, MAX_DETAILS);
  const results = [];

  for (let i = 0; i < safeLabels.length && !halted; i += 1) {
    const label = safeLabels[i];
    const locator = activePage.locator('main button, main a, main [role="button"]').filter({ hasText: label }).first();
    if (!await locator.count()) continue;
    const beforeUrl = activePage.url();
    await humanDelay(activePage);
    const clicked = await locator.click({ timeout: 4000 }).then(() => true).catch(() => false);
    if (!clicked) continue;
    await waitForContent(activePage, 800);
    const overlay = activePage.locator('[role="dialog"], .ant-modal:visible, .el-dialog:visible, [class*="drawer"]:visible, [class*="modal"]:visible').last();
    const hasOverlay = await overlay.count() && await overlay.isVisible().catch(() => false);
    const changedUrl = activePage.url() !== beforeUrl;
    if (!hasOverlay && !changedUrl) continue;
    const detailId = `${stateId}-detail-${String(i + 1).padStart(2, '0')}`;
    currentStateId = detailId;
    const target = hasOverlay ? overlay : activePage.locator('main');
    const detailData = await extractDataDetails(activePage, target);
    detailData.meta = {
      id: detailId, parentStateId: stateId, section: section.name, tab: tabLabel,
      trigger: sanitizeText(label), kind: hasOverlay ? 'overlay' : 'detail-page',
      url: redactUrl(activePage.url()), capturedAt: new Date().toISOString()
    };
    const detailFile = path.join('details', `${detailId}.json`).replaceAll('\\', '/');
    const detailScreenshot = path.join('screenshots', `${detailId}.png`).replaceAll('\\', '/');
    await writeJson(path.join(OUTPUT_ROOT, detailFile), detailData);
    await target.screenshot({ path: path.join(OUTPUT_ROOT, detailScreenshot), animations: 'disabled' }).catch(() => {});
    results.push({ id: detailId, trigger: sanitizeText(label), kind: detailData.meta.kind, file: detailFile, screenshot: detailScreenshot });
    manifest.captured.details += 1;

    if (hasOverlay) {
      await closeOverlay(activePage, overlay);
    } else if (changedUrl) {
      await activePage.goto(beforeUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
      await waitForContent(activePage);
      if (tabLabel) await clickTab(activePage, tabLabel).catch(() => false);
      await waitForContent(activePage, 500);
    }
    currentStateId = stateId;
  }
  return results;
}

async function extractDataDetails(activePage, scopeLocator = null) {
  const scope = scopeLocator || activePage.locator('main');
  const handle = await scope.elementHandle().catch(() => null) || await activePage.locator('body').elementHandle();
  return await activePage.evaluate(root => {
    const visible = element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && Number.parseFloat(style.opacity || '1') > 0;
    };
    const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 2000);
    const sensitiveKey = key => /(password|passwd|pwd|secret|token|cookie|session|authorization|密钥|密码|令牌|凭证)/i.test(key || '');
    const identityKey = key => /(姓名|用户|账号|邮箱|邮件|手机|电话|身份证|地址|ip|owner|user|email|phone|mobile|address)/i.test(key || '');
    const mask = (value, key = '') => {
      const text = clean(value);
      if (!text) return '';
      if (sensitiveKey(key)) return '[REDACTED]';
      if (identityKey(key)) return text.length <= 2 ? `${text[0] || ''}*` : `${text.slice(0, 1)}***${text.slice(-1)}`;
      return text
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL]')
        .replace(/(?<!\d)1[3-9]\d{9}(?!\d)/g, '[MOBILE]')
        .replace(/(?<!\d)(?:\d{1,3}\.){3}\d{1,3}(?!\d)/g, '[IP]')
        .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, '[UUID]');
    };
    const rectOf = element => {
      const r = element.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
    };
    const labelFor = control => {
      if (control.id) {
        const explicit = root.querySelector(`label[for="${CSS.escape(control.id)}"]`);
        if (explicit) return clean(explicit.textContent);
      }
      const wrapping = control.closest('label');
      if (wrapping) return clean(wrapping.textContent);
      const item = control.closest('.ant-form-item, .el-form-item, [class*="form-item"], [class*="field"]');
      return clean(item?.querySelector('label, [class*="label"]')?.textContent || control.getAttribute('aria-label') || control.getAttribute('title') || '');
    };

    const headings = [...root.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')]
      .filter(visible).map(element => ({ level: Number(element.tagName.slice(1)) || Number(element.getAttribute('aria-level')) || null, text: mask(element.textContent), rect: rectOf(element) }));

    const filters = [...root.querySelectorAll('input, textarea, select, [role="combobox"], [role="searchbox"]')]
      .filter(visible).map(control => ({
        label: mask(labelFor(control)), name: clean(control.getAttribute('name')), id: clean(control.id),
        type: clean(control.getAttribute('type') || control.getAttribute('role') || control.tagName.toLowerCase()),
        placeholder: mask(control.getAttribute('placeholder')), value: mask(control.value || control.getAttribute('value'), labelFor(control)),
        required: control.required || control.getAttribute('aria-required') === 'true', disabled: control.disabled || control.getAttribute('aria-disabled') === 'true',
        checked: 'checked' in control ? Boolean(control.checked) : null,
        options: control.tagName === 'SELECT' ? [...control.options].map(option => mask(option.textContent)).slice(0, 100) : [], rect: rectOf(control)
      }));

    const tables = [...root.querySelectorAll('table')].filter(visible).map((table, tableIndex) => {
      const headers = [...table.querySelectorAll('thead th')].map(th => clean(th.innerText || th.textContent));
      const bodyRows = [...table.querySelectorAll('tbody tr')].filter(visible);
      const rows = bodyRows.slice(0, 300).map(row => {
        const cells = [...row.querySelectorAll('th,td')].map(cell => clean(cell.innerText || cell.textContent));
        return Object.fromEntries(cells.map((value, index) => [headers[index] || `column_${index + 1}`, mask(value, headers[index])]));
      });
      const container = table.closest('.ant-table-wrapper, .el-table, [class*="table"]') || table.parentElement;
      const pageText = clean(container?.parentElement?.querySelector('.ant-pagination, .el-pagination, [class*="pagination"]')?.textContent || '');
      return { index: tableIndex, caption: mask(table.caption?.textContent || ''), headers, renderedRowCount: bodyRows.length, rows, paginationText: mask(pageText), rect: rectOf(table) };
    });

    const ariaGrids = [...root.querySelectorAll('[role="grid"], [role="table"]')].filter(visible)
      .filter(grid => grid.tagName !== 'TABLE' && !grid.querySelector('table')).map((grid, gridIndex) => {
        const headers = [...grid.querySelectorAll('[role="columnheader"]')].map(cell => clean(cell.textContent));
        const rowElements = [...grid.querySelectorAll('[role="row"]')].filter(row => row.querySelector('[role="gridcell"], [role="cell"]'));
        const rows = rowElements.slice(0, 300).map(row => {
          const cells = [...row.querySelectorAll('[role="gridcell"], [role="cell"]')].map(cell => clean(cell.textContent));
          return Object.fromEntries(cells.map((value, index) => [headers[index] || `column_${index + 1}`, mask(value, headers[index])]));
        });
        return { index: gridIndex, headers, renderedRowCount: rowElements.length, rows, paginationText: '', rect: rectOf(grid), source: 'aria-grid' };
      });

    const descriptionItems = [...root.querySelectorAll('.ant-descriptions-item, .el-descriptions__cell, [class*="description-item"], dl')]
      .filter(visible).slice(0, 300).flatMap(item => {
        if (item.tagName === 'DL') {
          const terms = [...item.querySelectorAll(':scope > dt')];
          return terms.map(term => ({ key: clean(term.textContent), value: mask(term.nextElementSibling?.textContent || '', term.textContent) }));
        }
        const label = clean(item.querySelector('.ant-descriptions-item-label, [class*="label"], dt, th')?.textContent || '');
        const value = clean(item.querySelector('.ant-descriptions-item-content, [class*="content"], dd, td')?.textContent || '');
        return label ? [{ key: label, value: mask(value, label) }] : [];
      });

    const cards = [...root.querySelectorAll('.ant-card, .el-card, [class*="card"]')].filter(visible).slice(0, 100).map((card, index) => ({
      index, title: mask(card.querySelector('h1,h2,h3,h4,h5,h6,[class*="title"]')?.textContent || ''),
      text: mask(card.innerText || card.textContent).slice(0, 3000), rect: rectOf(card)
    }));

    const statuses = [...root.querySelectorAll('.ant-tag, .el-tag, [class*="status"], [class*="badge"], [role="status"]')]
      .filter(visible).slice(0, 300).map(element => ({ text: mask(element.textContent), className: clean(element.className), rect: rectOf(element) }));

    const actions = [...root.querySelectorAll('button,a,[role="button"],[role="tab"]')].filter(visible).slice(0, 500).map(element => ({
      text: mask(element.innerText || element.textContent || element.getAttribute('aria-label') || element.getAttribute('title') || ''),
      role: clean(element.getAttribute('role') || element.tagName.toLowerCase()),
      selected: element.getAttribute('aria-selected'), expanded: element.getAttribute('aria-expanded'),
      disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true', rect: rectOf(element)
    })).filter(item => item.text);

    const links = [...root.querySelectorAll('a[href]')].filter(visible).slice(0, 500).map(element => ({
      text: mask(element.innerText || element.textContent || element.getAttribute('aria-label') || ''),
      href: element.href,
      rect: rectOf(element)
    }));

    const icons = [...root.querySelectorAll('svg')].filter(visible).slice(0, 500).map(svg => {
      const style = getComputedStyle(svg);
      return { title: mask(svg.querySelector('title')?.textContent || svg.getAttribute('aria-label') || ''), viewBox: clean(svg.getAttribute('viewBox')), width: Math.round(svg.getBoundingClientRect().width), height: Math.round(svg.getBoundingClientRect().height), color: style.color, fill: style.fill, stroke: style.stroke, pathCount: svg.querySelectorAll('path').length };
    });

    const majorBlocks = [...root.querySelectorAll('section,article,form,table,.ant-card,.el-card,[role="dialog"]')].filter(visible).slice(0, 100).map(element => {
      const style = getComputedStyle(element);
      return { tag: element.tagName.toLowerCase(), className: clean(element.className), rect: rectOf(element), backgroundColor: style.backgroundColor, color: style.color, fontFamily: style.fontFamily, fontSize: style.fontSize, fontWeight: style.fontWeight, borderRadius: style.borderRadius, border: style.border, boxShadow: style.boxShadow };
    });

    return {
      headings,
      filters,
      formControls: filters,
      tables: [...tables, ...ariaGrids],
      keyValues: descriptionItems,
      cards,
      statuses,
      actions,
      links,
      icons,
      majorBlocks,
      pageText: mask(root.innerText || root.textContent).slice(0, 30000),
      layout: { scrollWidth: root.scrollWidth, scrollHeight: root.scrollHeight, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight }
    };
  }, handle);
}

async function captureJsonResponse(response, stateId, capturePolicy) {
  if (!capturePolicy.captureApiBody) return;
  const request = response.request();
  if (!['xhr', 'fetch'].includes(request.resourceType())) return;
  if (safeOrigin(response.url()) !== EXPECTED_ORIGIN) return;
  const contentType = response.headers()['content-type'] || '';
  if (!/json/i.test(contentType)) return;
  const length = Number.parseInt(response.headers()['content-length'] || '0', 10);
  if (length > MAX_JSON_BYTES) return;
  const body = await response.json().catch(() => null);
  if (body === null) return;
  const scrubbed = scrubJson(body);
  const serialized = JSON.stringify(scrubbed);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_JSON_BYTES) return;
  const record = {
    at: new Date().toISOString(), stateId,
    method: request.method(), url: redactUrl(response.url()), status: response.status(),
    resourceType: request.resourceType(), body: scrubbed
  };
  await fs.appendFile(path.join(OUTPUT_ROOT, 'network', 'network-details.jsonl'), `${JSON.stringify(record)}\n`, 'utf8');
  manifest.captured.apiResponses += 1;
}

function scrubJson(value, key = '', depth = 0) {
  if (depth > 12) return '[MAX_DEPTH]';
  if (/(password|passwd|pwd|secret|token|cookie|session|authorization|credential|密钥|密码|令牌|凭证)/i.test(key)) return '[REDACTED]';
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.slice(0, MAX_RECORDS).map(item => scrubJson(item, key, depth + 1));
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value).slice(0, 500).map(([childKey, childValue]) => [childKey, scrubJson(childValue, childKey, depth + 1)]));
  if (typeof value !== 'string') return value;
  if (/(姓名|用户|账号|邮箱|邮件|手机|电话|身份证|地址|ip|owner|user|email|phone|mobile|address)/i.test(key)) {
    return value.length <= 2 ? `${value[0] || ''}*` : `${value.slice(0, 1)}***${value.slice(-1)}`;
  }
  return sanitizeText(value, 10000);
}

async function discoverTabs(activePage) {
  return await activePage.locator('main [role="tab"], main button[aria-selected], main [class*="tab"] button').evaluateAll(elements => elements
    .filter(element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    })
    .map(element => (element.innerText || element.textContent || element.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim())
    .filter(text => text && text.length <= 80));
}

async function clickTab(activePage, label) {
  const exactRole = activePage.locator('main').getByRole('tab', { name: label, exact: true }).first();
  const exactText = activePage.locator('main button, main [role="tab"]').filter({ hasText: label }).first();
  const target = await exactRole.count() ? exactRole : exactText;
  if (!await target.count() || !await target.isVisible().catch(() => false)) return false;
  if (TAB_DANGEROUS_RE.test(label)) return false;
  await humanDelay(activePage);
  return await target.click({ timeout: 5000 }).then(() => true).catch(() => false);
}

async function closeOverlay(activePage, overlay) {
  const close = overlay.locator('button[aria-label*="关闭"], button[aria-label="Close"], .ant-modal-close, .el-dialog__headerbtn, [class*="close"]').first();
  if (await close.count() && await close.isVisible().catch(() => false)) {
    await close.click({ timeout: 3000 }).catch(() => {});
  } else {
    await activePage.keyboard.press('Escape').catch(() => {});
  }
  await activePage.waitForTimeout(500);
}

async function dismissNonDataPopups(activePage) {
  const benign = activePage.locator('[role="dialog"] button, .ant-modal button, .el-dialog button').filter({ hasText: /^(知道了|关闭|取消)$/ }).first();
  if (await benign.count() && await benign.isVisible().catch(() => false)) await benign.click().catch(() => {});
}

async function waitForManualLogin(activePage, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (activePage.isClosed()) return false;
    const url = activePage.url();
    const text = await activePage.locator('body').innerText({ timeout: 3000 }).catch(() => '');
    const loginMarkers = /(企业微信|本地账号|刷新二维码|扫码登录|登录密码)/.test(text) || /#\/login|\/login(?:[/?#]|$)/i.test(url);
    const systemMarkers = /(系统管理|系统监控|系统配置|权限管理|系统审计)/.test(text);
    if (!loginMarkers && systemMarkers && safeOrigin(url) === EXPECTED_ORIGIN) return true;
    await activePage.waitForTimeout(1500);
  }
  return false;
}

async function auditSystemManagementNavigation(activePage) {
  console.log('[覆盖审计] 正在读取左侧“系统管理”菜单。');
  const group = activePage.locator('aside button, aside [role="button"], nav button, nav [role="button"]').filter({ hasText: /^系统管理$/ }).first();
  let groupChildren = [];
  if (await group.count() && await group.isVisible().catch(() => false)) {
    const expanded = await group.getAttribute('aria-expanded').catch(() => null);
    const visibleKnownChildren = await activePage.locator('aside button, aside a, aside [role="button"], nav button, nav a, nav [role="button"]').evaluateAll((elements, knownNames) => elements.filter(element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
      return knownNames.includes(text) && rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    }).length, SECTIONS.map(section => section.name));
    if (expanded === 'false' || (expanded === null && visibleKnownChildren === 0)) {
      await humanDelay(activePage);
      await group.click({ timeout: 4000 }).catch(() => {});
      await activePage.waitForTimeout(600);
    }
    groupChildren = await group.evaluate(element => {
      const container = element.parentElement;
      if (!container) return [];
      return [...container.querySelectorAll('button,a,[role="button"]')].map(child => {
        const rect = child.getBoundingClientRect();
        const style = getComputedStyle(child);
        return {
          text: (child.innerText || child.textContent || child.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim(),
          href: child.href || child.getAttribute('href') || '',
          visible: rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
        };
      }).filter(item => item.visible && item.text && item.text !== '系统管理');
    }).catch(() => []);
  } else {
    manifest.coverage.notes.push('未定位到左侧“系统管理”分组按钮；将依靠基线路由与页面内发现结果继续审计。');
  }

  const items = await activePage.locator('aside button, aside a, aside [role="button"], nav button, nav a, nav [role="button"]').evaluateAll(elements => elements
    .map(element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        text: (element.innerText || element.textContent || element.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim(),
        href: element.href || element.getAttribute('href') || '',
        visible: rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
      };
    })
    .filter(item => item.visible && item.text));
  const sectionNames = new Set(SECTIONS.map(section => section.name));
  manifest.coverage.discoveredSidebarItems = uniqueBy(
    [...groupChildren, ...items.filter(item => sectionNames.has(item.text) || /#\/home\/config-/.test(item.href))],
    item => `${item.text}|${item.href}`
  );
  for (const item of manifest.coverage.discoveredSidebarItems) {
    if (item.href && isSystemManagementRoute(item.href)) manifest.coverage.discoveredRoutes.push(item.href);
  }
}

function assessStateCoverage(data, paginationAudit, pageSizeAudit) {
  const errorMarkers = [...String(data.pageText || '').matchAll(/页面不存在|加载失败|请求失败|网络异常|暂无权限|无权访问|(?:HTTP\s*)?(?:404|500)\s*(?:Not Found|Internal Server Error|错误|异常|失败)/gi)].map(match => match[0]);
  const loadingMarkers = [...String(data.pageText || '').matchAll(/加载中|正在加载|Loading\.{0,3}/gi)].map(match => match[0]);
  const evidence = {
    headings: data.headings.length,
    tables: data.tables.length,
    filters: data.filters.length,
    keyValues: data.keyValues.length,
    cards: data.cards.length,
    statuses: data.statuses.length,
    actions: data.actions.length,
    textLength: String(data.pageText || '').length
  };
  const dataSignals = evidence.tables + evidence.filters + evidence.keyValues + evidence.cards + evidence.statuses + evidence.actions;
  const issues = [];
  if (evidence.textLength < 10 && dataSignals === 0) issues.push('页面近似空白');
  if (errorMarkers.length) issues.push(`检测到错误提示：${unique(errorMarkers).join('、')}`);
  if (loadingMarkers.length && dataSignals === 0) issues.push('页面可能仍停留在加载状态');
  if (paginationAudit.limitReached) issues.push(`分页达到安全上限 ${MAX_TABLE_PAGES} 页，后续数据可能未读取`);
  if (paginationAudit.pagesRead > 1 && pageSizeAudit.status !== 'selected') issues.push('页面存在多页数据，但未能确认分页尺寸已调整为最大值');
  return {
    status: issues.length ? 'needs-review' : 'captured',
    issues,
    evidence,
    pagination: paginationAudit,
    pageSize: pageSizeAudit
  };
}

function stateCapturePolicy(section, tabLabel) {
  const label = `${section.name} ${tabLabel || ''}`;
  if (STRUCTURE_ONLY_RE.test(label)) {
    return {
      mode: 'structure-only',
      reason: '权限、人员、消息、日志、审计、反馈或事件类页面仅采集结构与少量脱敏示例',
      captureApiBody: false,
      paginate: false,
      openDetails: false,
      rowLimit: 3
    };
  }
  return { mode: 'full', reason: '系统配置与非敏感明细页面', captureApiBody: true, paginate: true, openDetails: true, rowLimit: 20 };
}

function applyCapturePolicy(data, capturePolicy) {
  data.capturePolicy = capturePolicy;
  if (capturePolicy.mode !== 'structure-only') return;
  for (const table of data.tables) table.rows = table.rows.slice(0, capturePolicy.rowLimit);
  data.keyValues = data.keyValues.slice(0, 20);
  data.cards = data.cards.slice(0, 12).map(card => ({ ...card, text: String(card.text || '').slice(0, 500) }));
  data.statuses = data.statuses.slice(0, 50);
  data.actions = data.actions.slice(0, 100);
  data.pageText = String(data.pageText || '').slice(0, 5000);
}

async function finalizeCoverageAudit() {
  const coverage = manifest.coverage;
  const expected = new Set(manifest.expected.stateKeys);
  const captured = new Set(unique(coverage.capturedStateKeys));
  const discovered = new Set();
  for (const section of SECTIONS) {
    for (const tab of coverage.discoveredTabs[section.name] || []) discovered.add(coverageStateKey(section.name, tab));
  }
  coverage.capturedStateKeys = [...captured];
  coverage.discoveredRoutes = unique(coverage.discoveredRoutes.map(normalizeSystemRoute).filter(Boolean));
  coverage.missingBaselineStates = [...expected].filter(key => !captured.has(key));
  coverage.missingDiscoveredStates = [...discovered].filter(key => !captured.has(key));
  coverage.unexpectedStates = [...captured].filter(key => !expected.has(key));
  const sidebarNames = new Set(coverage.discoveredSidebarItems.map(item => item.text));
  coverage.missingSidebarSections = SECTIONS.map(section => section.name).filter(name => !sidebarNames.has(name));
  coverage.unexpectedSidebarItems = coverage.discoveredSidebarItems
    .filter(item => !SECTIONS.some(section => section.name === item.text))
    .map(item => item.text);
  coverage.unmappedDiscoveredRoutes = coverage.discoveredRoutes.filter(route => !SECTIONS.some(section => section.route === route));
  coverage.suspiciousStates = manifest.states
    .map(state => ({ stateKey: state.stateKey, issues: (state.coverageAudit?.issues || []).filter(isActionableCoverageIssue) }))
    .filter(state => state.issues.length > 0);
  coverage.paginationLimitReached = manifest.states
    .filter(state => state.coverageAudit?.pagination?.limitReached)
    .map(state => state.stateKey);
  coverage.recordLimitReached = manifest.states
    .filter(state => state.coverageAudit?.pagination?.recordLimitReached)
    .map(state => state.stateKey);
  coverage.missingEvidenceFiles = [];
  for (const state of manifest.states) {
    for (const relativeFile of [state.file, state.screenshot, ...(state.detailFiles || [])]) {
      if (!relativeFile || !await fileExists(path.join(OUTPUT_ROOT, relativeFile))) {
        coverage.missingEvidenceFiles.push(`${state.stateKey}: ${relativeFile || '[未记录文件名]'}`);
      }
    }
  }
  const blockingGapCount = coverage.missingBaselineStates.length
    + coverage.missingDiscoveredStates.length
    + coverage.missingSidebarSections.length
    + coverage.unexpectedSidebarItems.length
    + coverage.unmappedDiscoveredRoutes.length
    + coverage.suspiciousStates.length
    + coverage.missingEvidenceFiles.length;
  coverage.status = !halted && blockingGapCount === 0 ? 'complete' : 'needs-review';
  coverage.summary = {
    expectedStates: expected.size,
    discoveredStates: discovered.size,
    capturedStates: captured.size,
    blockingGapCount,
    halted
  };
  if (coverage.status === 'complete') coverage.notes.push('未发现可检测的页面遗漏；结论仅适用于当前登录账号可见的菜单、标签和路由。');
}

async function waitForContent(activePage, minimumMs = 1200) {
  await activePage.waitForTimeout(minimumMs);
  await activePage.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await activePage.locator('main').waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
}

async function humanDelay(activePage) {
  const delay = Math.floor(MIN_DELAY_MS + Math.random() * Math.max(1, MAX_DELAY_MS - MIN_DELAY_MS));
  await activePage.waitForTimeout(delay);
}

function halt(reason) {
  if (halted) return;
  halted = true;
  manifest.halted = true;
  manifest.haltReason = reason;
  console.log(`[安全停止] ${reason}`);
}

function buildMarkdownReport(run) {
  const lines = [
    '# Seabox 系统管理数据明细采集报告', '',
    `- 运行时间：${run.startedAt} — ${run.finishedAt || '未完成'}`,
    `- 采集状态：${run.halted ? `安全停止（${run.haltReason || '未说明'}）` : '完成'}`,
    `- 模块：${run.captured.sections}/${run.expected.sections}`,
    `- 页面/标签状态：${run.captured.states}/${run.expected.sections + run.expected.tabs}（可能包含自动发现的新标签）`,
    `- 只读详情：${run.captured.details}`,
    `- 脱敏 API JSON：${run.captured.apiResponses}`,
    `- 覆盖审计：${run.coverage.status === 'complete' ? '完整' : '需要复查'}（详见 \`coverage-report.md\`）`,
    '', '## 页面与数据覆盖', ''
  ];
  for (const state of run.states) {
    lines.push(`### ${state.section}${state.tab ? ` / ${state.tab}` : ' / 默认页'}`, '');
    lines.push(`- 明细文件：\`${state.file}\``);
    lines.push(`- 模式：${state.captureMode === 'structure-only' ? '结构采样' : '完整明细'}`);
    lines.push(`- 分页尺寸：${state.pageSizeAudit?.status === 'selected' ? `已调整为 ${state.pageSizeAudit.label || state.pageSizeAudit.selected}` : state.pageSizeAudit?.status || '未检测'}`);
    lines.push(`- 表格：${state.tables}；已读表格页：${state.tablePages || 1}；已采集行：${state.visibleRows}；筛选控件：${state.filters}；表单控件：${state.forms}；键值项：${state.keyValues}；只读详情：${state.details}`);
    if (state.headings.length) lines.push(`- 标题：${state.headings.join(' / ')}`);
    lines.push('');
  }
  if (run.errors.length) {
    lines.push('## 未覆盖或异常', '');
    for (const error of run.errors) lines.push(`- ${sanitizeText(JSON.stringify(error), 1000)}`);
    lines.push('');
  }
  lines.push('## 数据安全说明', '', '- 输出已对密码、令牌、Cookie、会话、常见身份字段、邮箱、手机号、IP 和 UUID 做脱敏。', '- 输出目录被 Git 忽略；仍应按内部业务资料管理，不要直接外发。', '');
  return lines.join('\n');
}

function buildCoverageReport(run) {
  const coverage = run.coverage;
  const lines = [
    '# Seabox 系统管理覆盖审计', '',
    `- 结论：${coverage.status === 'complete' ? '完整' : '需要复查'}`,
    `- 已知基线状态：${coverage.summary?.expectedStates ?? run.expected.stateKeys.length}`,
    `- 运行时发现标签状态：${coverage.summary?.discoveredStates ?? 0}`,
    `- 实际生成证据状态：${coverage.summary?.capturedStates ?? run.captured.states}`,
    `- 阻断性缺口：${coverage.summary?.blockingGapCount ?? 0}`,
    '',
    '## 缺口检查', ''
  ];
  appendAuditList(lines, '基线中未采集', coverage.missingBaselineStates);
  appendAuditList(lines, '运行时发现但未采集', coverage.missingDiscoveredStates);
  appendAuditList(lines, '左侧导航中未检测到', coverage.missingSidebarSections);
  appendAuditList(lines, '左侧导航中新出现但未映射的菜单', coverage.unexpectedSidebarItems || []);
  appendAuditList(lines, '发现但未映射到基线的系统路由', coverage.unmappedDiscoveredRoutes || []);
  appendAuditList(lines, '达到分页上限', coverage.paginationLimitReached);
  appendAuditList(lines, `达到 ${MAX_RECORDS} 条用户设定上限（有意截断）`, coverage.recordLimitReached || []);
  appendAuditList(lines, '缺失的证据文件', coverage.missingEvidenceFiles || []);
  lines.push('## 可疑页面', '');
  if (!coverage.suspiciousStates.length) lines.push('- 无', '');
  else for (const state of coverage.suspiciousStates) lines.push(`- ${state.stateKey}：${state.issues.join('；')}`);
  lines.push('', '## 运行时发现', '');
  lines.push(`- 左侧菜单：${coverage.discoveredSidebarItems.map(item => item.text).join('、') || '未识别'}`);
  for (const [section, tabs] of Object.entries(coverage.discoveredTabs)) lines.push(`- ${section}标签：${tabs.join('、') || '未识别'}`);
  lines.push(`- 系统管理路由：${coverage.discoveredRoutes.join('、') || '未识别'}`, '');
  if (coverage.notes.length) {
    lines.push('## 说明', '');
    for (const note of coverage.notes) lines.push(`- ${note}`);
    lines.push('');
  }
  return lines.join('\n');
}

function appendAuditList(lines, title, items) {
  lines.push(`### ${title}`, '');
  if (!items.length) lines.push('- 无', '');
  else {
    for (const item of items) lines.push(`- ${item}`);
    lines.push('');
  }
}

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    const fallback = path.join(REPO_ROOT, '.tmp', 'seabox-ui-capture', 'node_modules', 'playwright', 'index.mjs');
    try {
      return await import(pathToFileURL(fallback).href);
    } catch {
      throw new Error(`未找到 Playwright。请先在 ${SCRIPT_ROOT} 执行 npm install。`);
    }
  }
}

async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function fileExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function redactUrl(raw) {
  try {
    const url = new URL(raw);
    for (const key of [...url.searchParams.keys()]) url.searchParams.set(key, '[REDACTED]');
    return url.href.replace(/([?&](?:token|secret|key|code|session|auth)=)[^&#]*/gi, '$1[REDACTED]');
  } catch {
    return sanitizeText(raw);
  }
}

function isSuspiciousWritePost(rawUrl, postData) {
  let pathnameAndQuery = rawUrl;
  try {
    const parsed = new URL(rawUrl);
    pathnameAndQuery = `${parsed.pathname}${parsed.search}`;
  } catch {}
  if (SUSPICIOUS_WRITE_URL_RE.test(pathnameAndQuery)) return true;
  if (/\bmutation\b/i.test(postData)) return true;
  try {
    const body = JSON.parse(postData);
    const operation = String(body.operation || body.operationName || body.action || body.command || body.method || '');
    return /^(delete|remove|create|insert|update|save|submit|publish|approve|reject|execute|start|stop|restart|reset|enable|disable|upload|import|send)$/i.test(operation);
  } catch {
    return false;
  }
}

function sanitizeText(value, max = 2000) {
  return String(value ?? '').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL]').replace(/(?<!\d)1[3-9]\d{9}(?!\d)/g, '[MOBILE]').replace(/(?<!\d)(?:\d{1,3}\.){3}\d{1,3}(?!\d)/g, '[IP]').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi, '[UUID]').replace(/\s+/g, ' ').trim().slice(0, max);
}

function slug(value) {
  const safe = String(value).normalize('NFKC').replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 100);
  return safe || createHash('sha1').update(String(value)).digest('hex').slice(0, 12);
}

function unique(values) { return [...new Set(values)]; }
function countTableRows(tables) { return tables.reduce((sum, table) => sum + (table.rows?.length || 0), 0); }
function limitTableRows(tables, maximumRows) {
  let remaining = Math.max(0, maximumRows);
  for (const table of tables) {
    const rows = Array.isArray(table.rows) ? table.rows : [];
    table.rows = rows.slice(0, remaining);
    remaining = Math.max(0, remaining - table.rows.length);
  }
}
function uniqueBy(values, keySelector) {
  const seen = new Set();
  return values.filter(value => {
    const key = keySelector(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function coverageStateKey(sectionName, tabLabel) { return `${sectionName}::${tabLabel || 'base'}`; }
function expectedStateKeys() { return SECTIONS.flatMap(section => [coverageStateKey(section.name, null), ...section.tabs.map(tab => coverageStateKey(section.name, tab))]); }
function normalizeSystemRoute(raw) {
  try {
    const url = new URL(raw, EXPECTED_ORIGIN);
    return `${url.pathname}${url.hash}`.replace(/\/$/, '') || '/';
  } catch {
    return '';
  }
}
function isSystemManagementRoute(raw) { return /^\/#\/home\/config-/.test(normalizeSystemRoute(raw)); }
function isActionableCoverageIssue(issue) { return !/^检测到错误提示：(404|500)$/.test(String(issue || '').trim()); }
function tableSignature(tables) { return createHash('sha1').update(JSON.stringify(tables.map(table => ({ headers: table.headers, rows: table.rows })))).digest('hex'); }
function safeOrigin(raw) { try { return new URL(raw).origin; } catch { return ''; } }
function numberFromEnv(name, fallback) { const parsed = Number.parseInt(process.env[name] || '', 10); return Number.isFinite(parsed) ? parsed : fallback; }
function timestampId() { return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'); }

function parseArgs(argv) {
  const result = { startUrl: null, output: null, resumeOutput: null, maxDetails: 4, maxTablePages: 10, maxRecords: 300, dryRun: false, noApiBodies: false };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--start-url') result.startUrl = argv[++index];
    else if (token === '--output') result.output = argv[++index];
    else if (token === '--resume-output') result.resumeOutput = argv[++index];
    else if (token === '--max-details') result.maxDetails = Number.parseInt(argv[++index], 10);
    else if (token === '--max-table-pages') result.maxTablePages = Number.parseInt(argv[++index], 10);
    else if (token === '--max-records') result.maxRecords = Number.parseInt(argv[++index], 10);
    else if (token === '--dry-run') result.dryRun = true;
    else if (token === '--no-api-bodies') result.noApiBodies = true;
    else throw new Error(`未知参数：${token}`);
  }
  if (!Number.isInteger(result.maxDetails) || result.maxDetails < 0 || result.maxDetails > 10) throw new Error('--max-details 必须是 0 到 10 的整数。');
  if (!Number.isInteger(result.maxTablePages) || result.maxTablePages < 1 || result.maxTablePages > 50) throw new Error('--max-table-pages 必须是 1 到 50 的整数。');
  if (!Number.isInteger(result.maxRecords) || result.maxRecords < 1 || result.maxRecords > 300) throw new Error('--max-records 必须是 1 到 300 的整数。');
  return result;
}
