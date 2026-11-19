// Análisis responsive en todos los tamaños de iPhone (320–440 px y horizontal).
// Busca desplazamiento horizontal, elementos que se salen o desbordan, etiquetas cortadas
// y zonas táctiles pequeñas en cada pantalla, con importes y nombres largos.
// Uso: npx vite --port 4173 & node scripts/responsive.cjs [carpeta-capturas] [SE-1,15ProMax…]
const { chromium, devices } = require('playwright');
const dir = process.argv[2];
const URL_APP = process.env.URL_APP ?? 'http://localhost:4173/';

const TAMANOS = [
  ['SE-1', 320, 568],
  ['SE-3', 375, 667],
  ['mini', 375, 812],
  ['15', 393, 852],
  ['17', 402, 874],
  ['11', 414, 896],
  ['15ProMax', 430, 932],
  ['17ProMax', 440, 956],
  ['SE-horiz', 667, 375],
  ['ProMax-horiz', 932, 430],
];
const filtro = process.argv[3]?.split(',');

const revisar = () => {
  const W = innerWidth;
  const out = [];
  if (document.documentElement.scrollWidth > W + 1) out.push(`SCROLL-HORIZONTAL página ${document.documentElement.scrollWidth}px`);
  const visible = (el) => {
    const s = getComputedStyle(el);
    return s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0' && el.getClientRects().length > 0;
  };
  const enScrollX = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) if (/(auto|scroll)/.test(getComputedStyle(p).overflowX)) return true;
    return false;
  };
  const recortado = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) if (getComputedStyle(p).overflow === 'hidden' && p !== document.body) return true;
    return false;
  };
  const desc = (el) => (el.getAttribute('aria-label') || el.innerText || el.getAttribute('placeholder') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 45);
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el) || el.closest('svg') || el.closest('[aria-hidden=true]')) continue;
    const r = el.getBoundingClientRect();
    if (!r.width) continue;
    if ((r.right > W + 0.5 || r.left < -0.5) && !enScrollX(el)) out.push(`FUERA ${el.tagName.toLowerCase()} «${desc(el)}» ${Math.round(r.left)}→${Math.round(r.right)} (ancho ${W})`);
    const s = getComputedStyle(el);
    if (s.overflowX === 'visible' && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0 && !enScrollX(el) && !['svg', 'SELECT'].includes(el.tagName) && !recortado(el))
      out.push(`DESBORDA ${el.tagName.toLowerCase()}.${(el.className?.baseVal ?? el.className).toString().split(' ').slice(0, 3).join('.')} «${desc(el)}» ${el.scrollWidth}>${el.clientWidth}`);
  }
  for (const el of document.querySelectorAll('button, a, input:not([type=file]):not(.opacity-0), select, [role=switch], [role=tab], summary')) {
    if (!visible(el) || el.disabled) continue;
    if (el.classList.contains('opacity-0') || el.closest('[aria-hidden=true]')) continue;
    const r = el.getBoundingClientRect();
    if (r.height < 40 || r.width < 40) out.push(`PEQUEÑO «${desc(el)}» ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  // Chips (etiquetas de estado) partidos en dos líneas o más anchos que su tarjeta
  for (const el of document.querySelectorAll('span.rounded-full.border.text-\\[12px\\]')) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.height > 30) out.push(`CHIP-2-LINEAS «${desc(el)}» ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  for (const el of document.querySelectorAll('nav span.truncate')) if (el.scrollWidth > el.clientWidth + 1) out.push('ETIQUETA-CORTADA «' + el.innerText + '»');
  return [...new Set(out)];
};

(async () => {
  const nav = await chromium.launch();
  const informe = {};
  for (const [nombre, w, h] of TAMANOS) {
    if (filtro && !filtro.includes(nombre)) continue;
    const ctx = await nav.newContext({ ...devices['iPhone 15'], viewport: { width: w, height: h }, screen: { width: w, height: h }, deviceScaleFactor: 1, locale: 'es-ES' });
    const p = await ctx.newPage();
    await p.addLocatorHandler(p.getByRole('button', { name: '¡Genial!' }), async () => {
      await p.getByRole('button', { name: '¡Genial!' }).click({ timeout: 2000 }).catch(() => {});
    }, { noWaitAfter: true });
    const res = (informe[`${nombre} ${w}x${h}`] = {});
    const mirar = async (pantalla, foto = true) => {
      await p.waitForTimeout(250);
      const r = await p.evaluate(revisar);
      if (r.length) res[pantalla] = r;
      if (foto && dir) await p.screenshot({ path: `${dir}/${nombre}-${pantalla}.png` });
    };
    const tab = (n) => p.getByRole('navigation').getByRole('button', { name: n, exact: true }).click();
    const arriba = () => p.evaluate(() => window.scrollTo(0, 0));

    await p.goto(URL_APP);
    await mirar('bienvenida');
    await p.getByRole('button', { name: 'Empezar' }).click();
    for (const b of ['+ BBVA', '+ Revolut', '+ Trade Republic']) await p.getByRole('button', { name: b }).click();
    await p.getByPlaceholder('Otro banco o cuenta').fill('Cuenta ahorro compartida familia');
    await p.getByRole('button', { name: 'Añadir', exact: true }).click();
    const saldos = ['1234,56', '123456,78', '-2500', '98765,43', '15000'];
    for (let i = 0; i < saldos.length; i++) await p.locator('input[placeholder="Saldo"]').nth(i).fill(saldos[i]);
    await mirar('bienvenida-bancos');
    await p.getByRole('button', { name: '¡Listo!' }).click();

    const mov = async (teclas, cat, { tipo, nota } = {}) => {
      await p.getByRole('button', { name: 'Añadir movimiento' }).click();
      if (tipo) await p.getByRole('tab', { name: tipo }).click();
      for (const t of teclas) await p.getByRole('button', { name: t, exact: true }).click();
      if (nota) {
        await p.getByRole('button', { name: /Nota/ }).click();
        await p.getByPlaceholder(/Nota/).fill(nota);
      }
      await p.getByRole('button', { name: cat }).first().click();
      await p.waitForTimeout(250);
    };
    await mov(['1', '2', '3', '4', '5', ',', '6', '7'], /Nómina/, { tipo: 'Ingreso', nota: 'Nómina noviembre empresa con nombre larguísimo SL' });
    await mov(['1', '2', '3', '4', ',', '5', '6'], /Supermercado/, { nota: 'Compra mensual en el hipermercado de las afueras #casa #familia' });
    await mov(['4', ',', '5'], /Restaurantes/);
    await mov(['9', '8', '7', ',', '6', '5'], /Transporte/);

    await p.getByRole('main').getByRole('button', { name: 'Ajustes', exact: true }).click();
    await mirar('ajustes');
    await p.getByRole('button', { name: /Presupuestos/ }).click();
    await p.getByRole('button', { name: 'Definir' }).click();
    await p.locator('input[inputmode=decimal]').fill('3000');
    await mirar('hoja-presupuesto');
    await p.getByRole('button', { name: 'Guardar' }).click();
    await mirar('presupuestos');
    await p.getByRole('main').getByRole('button', { name: 'Ajustes', exact: true }).click();
    await p.getByRole('button', { name: /Cuentas/ }).click();
    await mirar('cuentas');
    await p.getByRole('button', { name: /BBVA/ }).click();
    await mirar('hoja-cuenta');
    await p.getByRole('button', { name: 'Cerrar' }).click();
    await p.getByRole('main').getByRole('button', { name: 'Ajustes', exact: true }).click();
    await p.getByRole('button', { name: /Categorías/ }).click();
    await mirar('categorias');
    await p.getByRole('main').getByRole('button', { name: 'Ajustes', exact: true }).click();
    await p.getByRole('button', { name: /Recurrentes/ }).click();
    await p.getByRole('button', { name: '+ Nuevo recurrente' }).click();
    await mirar('hoja-recurrente');
    await p.getByLabel('Nombre').fill('Suscripción anual del gimnasio premium');
    await p.getByLabel('Importe').fill('1234,99');
    await p.locator('select').first().selectOption({ label: '🎬 Ocio' });
    const d = new Date();
    await p.locator('input[type=date]').fill(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-28`);
    await p.getByRole('switch', { name: 'Apuntarlo automáticamente' }).click();
    await p.getByRole('button', { name: 'Guardar' }).click();
    await p.waitForTimeout(300);
    await mirar('recurrentes');

    await tab('Hoy');
    await arriba();
    await mirar('hoy');
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await mirar('hoy-medio');
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await mirar('hoy-final');
    await p.getByRole('button', { name: 'Añadir movimiento' }).click();
    await mirar('editor');
    await p.getByRole('button', { name: /Nota/ }).click();
    await mirar('editor-nota');
    await p.getByRole('tab', { name: /Transferencia|Traspaso/ }).click();
    await mirar('editor-transferencia');
    await p.getByRole('button', { name: 'Cerrar', exact: true }).click();
    await tab('Movimientos');
    await mirar('movimientos');
    await tab('Contabilidad');
    await mirar('contabilidad');
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await mirar('contabilidad-medio');
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await mirar('contabilidad-final');
    await p.getByRole('button', { name: 'Ingreso fijo', exact: true }).click();
    await mirar('hoja-ingreso-fijo');
    await p.getByRole('button', { name: 'Cerrar' }).click();
    await arriba();
    await p.getByRole('tab', { name: 'Calendario de pagos' }).click();
    await mirar('pagos');
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await mirar('pagos-final');
    await tab('Análisis');
    await mirar('analisis');
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await mirar('analisis-final');
    await tab('Finanzas');
    await mirar('finanzas');
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await mirar('finanzas-final');
    await arriba();
    await p.getByRole('tab', { name: 'Deudas' }).click();
    await p.getByRole('button', { name: '+ Añadir deuda' }).click();
    await p.getByLabel('Tipo').selectOption('hipoteca');
    await p.getByLabel('Nombre').fill('Hipoteca del piso de la playa');
    await p.getByLabel('Lo que debes hoy').fill('187654,32');
    await p.getByLabel('Importe inicial').fill('240000');
    await p.getByLabel('Cuota al mes').fill('987,65');
    await p.getByLabel('Interés TAE (%)').fill('3,25');
    await mirar('hoja-deuda');
    await p.getByRole('button', { name: 'Guardar' }).click();
    await mirar('deudas');
    await p.getByRole('button', { name: /Hipoteca del piso/ }).click();
    await mirar('detalle-deuda');
    await p.getByRole('dialog').getByRole('button', { name: 'Cerrar' }).click();
    await p.getByRole('tab', { name: 'Inversiones' }).click();
    await p.getByRole('button', { name: '+ Añadir inversión' }).click();
    await p.getByLabel('Nombre').fill('Fondo indexado MSCI World acumulación');
    await p.getByLabel('Dinero aportado').fill('25000');
    await p.getByLabel('Valor actual').fill('31234,56');
    await mirar('hoja-inversion');
    await p.getByRole('button', { name: 'Guardar' }).click();
    await mirar('inversiones');
    await p.getByRole('tab', { name: 'Resumen' }).click();
    await mirar('finanzas-con-datos');
    await tab('Hoy');
    await p.getByRole('button', { name: /Ver logros/ }).click();
    await mirar('logros');
    await ctx.close();
  }
  await nav.close();
  console.log(JSON.stringify(informe, null, 1));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
