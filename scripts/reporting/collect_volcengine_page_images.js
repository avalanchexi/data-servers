const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..', '..');
const outputDir = path.join(root, '.tmp', 'volcengine-data-service-report', 'page-screenshots');
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

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();
  const inventory = [];

  for (const [sid, name, module, id] of pages) {
    const url = `https://docs.volcengine.com/docs/6260/${id}?lang=zh`;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(2200);
      await page.evaluate(async () => {
        const step = Math.max(650, Math.floor(window.innerHeight * 0.8));
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 120));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1200);
      const urls = await page.locator('img').evaluateAll((imgs) =>
        [...new Set(imgs
          .map((img) => img.currentSrc || img.src)
          .filter((src) => src && src.startsWith('http') && src.includes('cloud-universal-doc')))]
      );
      const images = [];
      for (let index = 0; index < urls.length; index += 1) {
        const imageUrl = urls[index];
        const response = await context.request.get(imageUrl, { timeout: 60000 });
        if (!response.ok()) {
          images.push({ index, url: imageUrl, error: `HTTP ${response.status()}` });
          continue;
        }
        const bytes = await response.body();
        const hash = crypto.createHash('sha256').update(bytes).digest('hex');
        const parsed = new URL(imageUrl);
        const originalName = path.basename(parsed.pathname) || `${sid}-${index + 1}.png`;
        const ext = path.extname(originalName) || '.png';
        const localName = `${sid}-${String(index + 1).padStart(2, '0')}-${hash.slice(0, 12)}${ext}`;
        const localPath = path.join(outputDir, localName);
        fs.writeFileSync(localPath, bytes);
        images.push({ index, url: imageUrl, localName, bytes: bytes.length, sha256: hash });
      }
      inventory.push({ sid, name, module, id, url, images });
      process.stdout.write(`${sid} ${name}: ${images.length} images\n`);
    } catch (error) {
      inventory.push({ sid, name, module, id, url, images: [], error: String(error) });
      process.stderr.write(`${sid} ${name}: ${error}\n`);
    }
  }

  await browser.close();
  fs.writeFileSync(
    path.join(outputDir, 'inventory.json'),
    JSON.stringify({ collectedAt: new Date().toISOString(), pages: inventory }, null, 2),
    'utf8',
  );
})();
