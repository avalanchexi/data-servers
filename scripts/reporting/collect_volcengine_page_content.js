const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const rootDir = path.resolve(__dirname, '..', '..');
const outputDir = path.join(rootDir, '.tmp', 'volcengine-data-service-report', 'page-content');
const pages = [
  ['S1', '概述', '数据服务简介', 127499],
  ['S2', '基本概念', '数据服务简介', 127705],
  ['S3', '快速入门', '数据服务简介', 1154939],
  ['S4', '创建数据源', '数据源', 127696],
  ['S5', '数据源切流', '数据源', 127697],
  ['S6', '物理表管理', '数据源', 127698],
  ['S7', '逻辑表管理', '数据源', 1154905],
  ['S8', 'API 开发', 'API', 127699],
  ['S9', 'API 编排开发', 'API', 1208340],
  ['S10', 'API 调用', 'API', 127700],
  ['S11', 'API 运维', 'API', 127583],
  ['S12', 'OneService 语法', 'API', 127701],
  ['S13', 'Dynamic SQL 语法', 'API', 1254733],
  ['S14', 'API集市', '数据集市', 1148775],
  ['S15', '逻辑表集市', '数据集市', 1148776],
  ['S16', '账户权限管理', '系统管理', 1148766],
  ['S17', '项目管理', '系统管理', 1148767],
  ['S18', '业务线管理', '系统管理', 1148768],
  ['S19', '应用管理', '系统管理', 127558],
  ['S20', '公网配置', '系统管理/网络配置', 127565],
  ['S21', 'VPC配置', '系统管理/网络配置', 1148772],
  ['S22', '审批中心', '系统管理', 1148770],
  ['S23', '标签管理', '系统管理', 1148771],
];

fs.mkdirSync(outputDir, { recursive: true });

function normalize(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

async function collectPage(browser, item) {
  const [sid, name, module, id] = item;
  const url = `https://docs.volcengine.com/docs/6260/${id}?lang=zh`;
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2200);
    await page.evaluate(async () => {
      const step = Math.max(650, Math.floor(window.innerHeight * 0.8));
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1000);

    const content = await page.evaluate(() => {
      const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
      const article = document.querySelector('.volc-md-viewer');
      if (!article) throw new Error('Missing .volc-md-viewer article');
      const selector = 'h1,h2,h3,h4,h5,h6,p,ul,ol,table,pre,img,blockquote';
      const nodes = [...article.querySelectorAll(selector)];
      const blocks = [];
      for (const node of nodes) {
        const tag = node.tagName.toLowerCase();
        if (/^h[1-6]$/.test(tag)) {
          blocks.push({ type: 'heading', level: Number(tag.slice(1)), text: clean(node.innerText).replace(/\s*#$/, '') });
          continue;
        }
        if (tag === 'p') {
          if (node.closest('li,td,th,blockquote')) continue;
          const text = clean(node.innerText);
          if (text) blocks.push({ type: 'paragraph', text });
          continue;
        }
        if (tag === 'ul' || tag === 'ol') {
          if (node.parentElement && node.parentElement.closest('ul,ol')) continue;
          const items = [...node.querySelectorAll(':scope > li')]
            .map((li) => clean(li.innerText))
            .filter(Boolean);
          if (items.length) blocks.push({ type: 'list', ordered: tag === 'ol', items });
          continue;
        }
        if (tag === 'table') {
          const rows = [...node.querySelectorAll('tr')]
            .map((row) => [...row.querySelectorAll(':scope > th, :scope > td')].map((cell) => clean(cell.innerText)))
            .filter((row) => row.some(Boolean));
          if (rows.length) blocks.push({ type: 'table', rows });
          continue;
        }
        if (tag === 'pre') {
          const text = (node.innerText || '').trim();
          if (text) blocks.push({ type: 'code', text });
          continue;
        }
        if (tag === 'blockquote') {
          const text = clean(node.innerText);
          if (text) blocks.push({ type: 'note', text });
          continue;
        }
        if (tag === 'img') {
          const src = node.currentSrc || node.src || '';
          if (src.startsWith('http') && src.includes('cloud-universal-doc')) {
            blocks.push({
              type: 'image',
              src,
              alt: clean(node.alt),
              naturalWidth: node.naturalWidth,
              naturalHeight: node.naturalHeight,
            });
          }
        }
      }
      return {
        textChars: clean(article.innerText).length,
        blocks,
      };
    });
    return { sid, name, module, id, url, ...content };
  } finally {
    await context.close();
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const concurrency = 3;
  let next = 0;
  async function worker() {
    while (true) {
      const index = next++;
      if (index >= pages.length) return;
      const item = pages[index];
      try {
        const result = await collectPage(browser, item);
        results[index] = result;
        process.stdout.write(`${result.sid} ${result.name}: ${result.blocks.length} blocks, ${result.textChars} chars\n`);
      } catch (error) {
        const [sid, name, module, id] = item;
        results[index] = { sid, name, module, id, url: `https://docs.volcengine.com/docs/6260/${id}?lang=zh`, blocks: [], error: String(error) };
        process.stderr.write(`${sid} ${name}: ${error}\n`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  await browser.close();
  const payload = { collectedAt: new Date().toISOString(), pages: results };
  fs.writeFileSync(path.join(outputDir, 'page-content.json'), JSON.stringify(payload, null, 2), 'utf8');
  const outlines = results.map((page) => {
    const headings = page.blocks.filter((block) => block.type === 'heading');
    return [
      `${page.sid} ${page.module} > ${page.name}`,
      ...headings.map((heading) => `${'  '.repeat(Math.max(0, heading.level - 1))}- H${heading.level} ${normalize(heading.text)}`),
    ].join('\n');
  });
  fs.writeFileSync(path.join(outputDir, 'outlines.txt'), outlines.join('\n\n'), 'utf8');
})();
