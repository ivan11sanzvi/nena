// Genera los iconos de la app: node herramientas/iconos.js  (necesita Playwright)
const { chromium } = require('playwright');
const path = require('path');

const icono = (seguro) => `<!doctype html><html><body style="margin:0">
<div id="i" style="width:512px;height:512px;background:linear-gradient(135deg,#9333ea 0%,#6b1fa8 100%);display:flex;align-items:center;justify-content:center;font-family:'DejaVu Sans',Arial,sans-serif;color:#fff">
  <div style="transform:scale(${seguro ? 0.72 : 1});display:flex;flex-direction:column;align-items:center">
    <div style="font-size:230px;line-height:.95;color:#f5d0fe">♥</div>
    <div style="font-size:70px;font-weight:800;letter-spacing:1px;margin-top:6px">HYROX</div>
    <div style="font-size:46px;font-weight:700;letter-spacing:10px;opacity:.85;margin-top:2px">NENA</div>
  </div>
</div></body></html>`;

(async () => {
  const dir = path.join(__dirname, '..', 'icons');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 512, height: 512 } });
  for (const [nombre, seguro, tam] of [['icon-512.png', false, 512], ['icon-maskable-512.png', true, 512], ['icon-192.png', false, 192]]) {
    await p.setViewportSize({ width: 512, height: 512 });
    await p.setContent(icono(seguro));
    await p.evaluate(t => { document.body.style.zoom = t / 512; }, tam);
    await p.setViewportSize({ width: tam, height: tam });
    await (await p.$('#i')).screenshot({ path: path.join(dir, nombre) });
  }
  await b.close();
  console.log('Iconos creados en', dir);
})();
