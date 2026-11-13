// Genera public/icon-192.png y public/icon-512.png a partir de public/icon.svg (uso: node scripts/iconos.cjs)
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const svg = fs.readFileSync(path.join(__dirname, '../public/icon.svg'), 'utf8');
(async () => {
  const navegador = await chromium.launch();
  for (const t of [192, 512]) {
    const p = await navegador.newPage({ viewport: { width: t, height: t } });
    await p.setContent(`<style>*{margin:0}svg{width:${t}px;height:${t}px;display:block}</style>${svg.replace('rx="112"', 'rx="0"')}`);
    await p.screenshot({ path: path.join(__dirname, `../public/icon-${t}.png`) });
  }
  await navegador.close();
})();
