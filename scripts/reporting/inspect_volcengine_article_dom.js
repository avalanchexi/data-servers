const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto('https://docs.volcengine.com/docs/6260/127699?lang=zh', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });
  await page.waitForTimeout(3000);
  const candidates = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('main, article, [class*="doc"], [class*="content"], [class*="markdown"]')];
    return nodes
      .map((node) => ({
        tag: node.tagName,
        id: node.id,
        cls: String(node.className).slice(0, 240),
        chars: (node.innerText || '').length,
        headings: node.querySelectorAll('h1,h2,h3,h4,h5,h6').length,
        images: node.querySelectorAll('img').length,
        sample: (node.innerText || '').slice(0, 300).replace(/\s+/g, ' '),
      }))
      .filter((item) => item.chars > 500)
      .sort((a, b) => b.chars - a.chars)
      .slice(0, 30);
  });
  console.log(JSON.stringify(candidates, null, 2));
  await browser.close();
})();
