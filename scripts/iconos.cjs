// Genera los iconos de la web (public/) y de iOS (ios/…/Assets.xcassets) a partir de public/icon.svg.
// Uso: node scripts/iconos.cjs
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const raiz = path.join(__dirname, '..');
const svg = fs.readFileSync(path.join(raiz, 'public/icon.svg'), 'utf8').replace('rx="112"', 'rx="0"');
const assets = path.join(raiz, 'ios/App/App/Assets.xcassets');

(async () => {
  const navegador = await chromium.launch();
  const foto = async (ancho, alto, html, destino) => {
    const p = await navegador.newPage({ viewport: { width: ancho, height: alto } });
    await p.setContent(`<style>*{margin:0}html,body{width:${ancho}px;height:${alto}px}</style>${html}`);
    await p.screenshot({ path: destino, omitBackground: false });
    await p.close();
  };
  const icono = (t) => svg.replace('<svg ', `<svg width="${t}" height="${t}" style="display:block" `);
  for (const t of [192, 512]) await foto(t, t, icono(t), path.join(raiz, `public/icon-${t}.png`));
  if (fs.existsSync(assets)) {
    await foto(1024, 1024, icono(1024), path.join(assets, 'AppIcon.appiconset/AppIcon-512@2x.png'));
    const splash = `<div style="width:2732px;height:2732px;background:#f6f7f9;display:flex;align-items:center;justify-content:center">${svg.replace('rx="0"', 'rx="112"').replace('<svg ', '<svg width="420" height="420" ')}</div>`;
    for (const n of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) await foto(2732, 2732, splash, path.join(assets, 'Splash.imageset', n));
  }
  await navegador.close();
})();
