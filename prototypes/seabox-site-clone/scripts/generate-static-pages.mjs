#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(projectRoot, '..', '..');
const summaryFile = path.join(repoRoot, '.tmp', 'seabox-ui-capture', 'capture', 'crawl-summary.json');
const evidenceRoot = path.join(repoRoot, '.tmp', 'seabox-ui-capture');
const generatedDir = path.join(projectRoot, 'src', 'generated');

const summary = JSON.parse(await fs.readFile(summaryFile, 'utf8'));
const refs = summary.pages.filter((page) => page.status === 'captured' && page.evidenceFile);
if (refs.length !== 142) throw new Error(`Expected 142 captured pages, received ${refs.length}`);

const evidence = new Map();
for (const ref of refs) {
  evidence.set(ref.template, JSON.parse(await fs.readFile(path.join(evidenceRoot, ref.evidenceFile), 'utf8')));
}

const baseRefByRoute = new Map();
for (const ref of refs) {
  if (!ref.template.includes('::tab=')) baseRefByRoute.set(baseRoute(ref.template), ref);
}

const records = refs.map((ref, index) => {
  const base = baseRoute(ref.template);
  const baseRef = baseRefByRoute.get(base) || ref;
  const source = String(baseRef.source || ref.source || '');
  const navigation = parseNavigationSource(source);
  const tab = String(ref.source || '').startsWith('tab:')
    ? String(ref.source).slice(4).replace(/\s+/g, ' ').trim()
    : ref.template.includes('::tab=')
      ? ref.template.split('::tab=')[1]
      : '';
  const pageEvidence = evidence.get(ref.template);
  const headings = pageEvidence?.views?.desktop1440?.headings || [];
  const evidenceTitle = headings.find((heading) => heading.level <= 2)?.text || '';
  const title = navigation.item || evidenceTitle || tab || fallbackTitle(base);
  const id = String(index + 1).padStart(3, '0');
  const filename = `${id}-${slug(base)}${tab ? `-tab-${shortHash(tab)}` : ''}.html`;
  return {
    id,
    filename,
    template: ref.template,
    route: base,
    source: ref.source || '',
    group: navigation.group || inferGroup(base),
    item: navigation.item || title,
    tab,
    title,
    subtitle: subtitleFor(base, title),
    type: classifyPage(base, title, tab),
    sourceScreenshot: ref.screenshotFiles?.[0] || '',
    documentHeight: pageEvidence?.views?.desktop1440?.document?.scrollHeight || 900,
    interactiveCount: pageEvidence?.views?.desktop1440?.interactive?.length || 0,
    iconCount: pageEvidence?.views?.desktop1440?.icons?.length || 0
  };
});

const recordByRoute = new Map(records.filter((record) => !record.tab).map((record) => [record.route, record]));
for (const record of records) {
  if (!record.tab) continue;
  const parent = recordByRoute.get(record.route);
  if (parent) {
    record.group = parent.group;
    record.item = parent.item;
    record.title = parent.title;
    record.subtitle = parent.subtitle;
  }
}

const tabsByRoute = new Map();
for (const record of records) {
  const list = tabsByRoute.get(record.route) || [];
  if (record.tab && !list.some((entry) => entry.label === record.tab)) {
    list.push({ label: record.tab, filename: record.filename, id: record.id });
  }
  tabsByRoute.set(record.route, list);
}

for (const record of records) record.tabs = tabsByRoute.get(record.route) || [];

const navGroups = [];
for (const record of records) {
  if (!String(record.source).startsWith('sidebar:')) continue;
  let group = navGroups.find((entry) => entry.name === record.group);
  if (!group) {
    group = { name: record.group, items: [] };
    navGroups.push(group);
  }
  if (!group.items.some((item) => item.name === record.item)) {
    group.items.push({ name: record.item, pageId: record.id, filename: record.filename, route: record.route });
  }
}

await fs.mkdir(generatedDir, { recursive: true });
const dataModule = `// Generated from the sanitized Playwright crawl summary.\nexport const pages = ${JSON.stringify(records, null, 2)};\n\nexport const navGroups = ${JSON.stringify(navGroups, null, 2)};\n`;
await fs.writeFile(path.join(generatedDir, 'pages.js'), dataModule, 'utf8');

for (const entry of await fs.readdir(projectRoot)) {
  if (/^\d{3}-.*\.html$/.test(entry)) await fs.unlink(path.join(projectRoot, entry));
}

for (const record of records) {
  await fs.writeFile(path.join(projectRoot, record.filename), htmlDocument(record), 'utf8');
}

const defaultPage = records.find((record) => record.route === '/#/home/asset-overview' && !record.tab) || records[0];
await fs.writeFile(path.join(projectRoot, 'index.html'), htmlDocument(defaultPage), 'utf8');

const manifest = {
  generatedAt: new Date().toISOString(),
  source: 'sanitized Playwright crawl summary',
  sourcePageCount: refs.length,
  htmlPageCount: records.length,
  defaultPage: defaultPage.filename,
  pages: records.map(({ id, filename, template, source, group, item, tab, type }) => ({ id, filename, template, source, group, item, tab, type }))
};
await fs.writeFile(path.join(projectRoot, 'page-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

console.log(JSON.stringify({ generated: records.length, defaultPage: defaultPage.filename, groups: navGroups.length }, null, 2));

function htmlDocument(record) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="东方金信前端离线仿真原型，业务数据均为模拟数据。" />
    <title>${escapeHtml(record.title)} · 东方金信仿真原型</title>
  </head>
  <body data-page-id="${record.id}">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;
}

function baseRoute(template) {
  return String(template).split('::tab=')[0];
}

function parseNavigationSource(source) {
  if (!source.startsWith('sidebar:')) return {};
  const [group, item] = source.slice(8).split('/');
  return { group: group || '', item: item || '' };
}

function slug(route) {
  const value = route.replace(/^\/#\/home\//, '').replace(/^\/#\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  return value || 'home';
}

function shortHash(value) {
  return createHash('sha1').update(value).digest('hex').slice(0, 7);
}

function fallbackTitle(route) {
  const last = route.split('/').filter(Boolean).at(-1) || '首页';
  return last.replace(/[-_]/g, ' ');
}

function inferGroup(route) {
  if (/asset/.test(route)) return '资产中心';
  if (/knowledge-(?!data)/.test(route)) return '知识中心';
  if (/data-center|knowledge-data/.test(route)) return '数据中心';
  if (/oa-/.test(route)) return 'OA';
  if (/config|system|permission|audit|risk|message|security/.test(route)) return '系统管理';
  if (/agent|skill|memory|mcp/.test(route)) return '能力中心';
  return '智能体';
}

function classifyPage(route, title, tab) {
  const text = `${route} ${title} ${tab}`.toLowerCase();
  if (/index-qa|task\//.test(text)) return 'chat';
  if (/map|ontology|semantic|graph|lineage|context|地图|图谱|血缘|本体|语义/.test(text)) return 'graph';
  if (/overview|monitor|dashboard|ranking|analysis|lifecycle|总览|监控|看板|排行|分析|生命周期/.test(text)) return 'dashboard';
  if (/config|setting|permission|policy|security|standard|配置|设置|权限|策略|安全|标准/.test(text)) return 'settings';
  if (/approval|audit|risk|message|feedback|log|审批|审计|风险|消息|反馈|日志/.test(text)) return 'operations';
  if (/catalog|market|knowledge|agent|skill|mcp|目录|集市|知识|智能体|技能/.test(text)) return 'catalog';
  return 'list';
}

function subtitleFor(route, title) {
  if (/asset-overview/.test(route)) return '存储量/表数/资产数全景视图，治理健康分与问题大盘。';
  if (/asset-map/.test(route)) return '以地图、血缘和业务类目组织数据资产，支持统一检索与影响分析。';
  if (/asset-catalog/.test(route)) return '统一盘点、编目、确权和运营数据资产，形成可复用的资产目录。';
  if (/data-center/.test(route)) return `${title}的统一建设、管理与运行视图。`;
  if (/knowledge/.test(route)) return `${title}的采集、组织、向量化与关联分析工作空间。`;
  if (/oa-/.test(route)) return `${title}的日常协作与流程管理工作台。`;
  if (/config|system|audit|risk|security/.test(route)) return `${title}的系统级配置、观测与合规管理。`;
  if (/agent|skill|mcp|memory/.test(route)) return `${title}的统一管理、调试与能力编排工作空间。`;
  return `${title}的统一管理与运营工作台。`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
}
