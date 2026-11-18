// Prueba de extremo a extremo del flujo principal.
// Uso: npm run build && npx vite preview --port 4173 & node scripts/e2e.cjs [carpeta-capturas]
const { chromium, devices } = require('playwright');
const assert = require('node:assert');
const URL_APP = process.env.URL_APP ?? 'http://localhost:4173/';
const capturas = process.argv[2];

(async () => {
  const navegador = await chromium.launch();
  const ctx = await navegador.newContext({ ...devices['Pixel 7'], deviceScaleFactor: 1, locale: 'es-ES', acceptDownloads: true });
  const p = await ctx.newPage();
  const errores = (globalThis.__errores = []);
  p.on('pageerror', (e) => errores.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
  const foto = async (n) => capturas && p.screenshot({ path: `${capturas}/${n}.png`, fullPage: true });

  // Las celebraciones de logros tapan la pantalla: se cierran solas durante la prueba
  let premios = 0;
  await p.addLocatorHandler(p.getByRole('button', { name: '¡Genial!' }), async () => {
    premios++;
    await p.getByRole('button', { name: '¡Genial!' }).click();
  });
  await p.goto(URL_APP);
  // Bienvenida
  await p.getByRole('button', { name: 'Empezar' }).click();
  await p.getByRole('button', { name: '+ BBVA' }).click();
  await p.getByRole('button', { name: '+ Revolut' }).click();
  await p.getByPlaceholder('Otro banco o cuenta').fill('Hucha');
  await p.getByRole('button', { name: 'Añadir', exact: true }).click();
  await p.locator('input[placeholder="Saldo"]').nth(1).fill('1500');
  await p.locator('input[placeholder="Saldo"]').nth(2).fill('320,50');
  await foto('01-bienvenida');
  await p.getByRole('button', { name: '¡Listo!' }).click();
  await p.getByText('Apunta tu primer gasto').waitFor();
  await foto('02-inicio-vacio');

  // Gasto rápido: + → 4,50 → Restaurantes
  await p.getByRole('button', { name: 'Añadir movimiento' }).click();
  for (const t of ['4', ',', '5']) await p.getByRole('button', { name: t, exact: true }).click();
  assert.match(await p.getByTestId('importe').innerText(), /4,5/);
  await foto('03-editor');
  await p.getByRole('button', { name: /Restaurantes/ }).click();
  await p.getByText(/Restaurantes · 4,50/).waitFor();

  // Ingreso: nómina 2.000
  await p.getByRole('button', { name: 'Añadir movimiento' }).click();
  await p.getByRole('tab', { name: 'Ingreso' }).click();
  for (const t of ['2', '0', '0', '0']) await p.getByRole('button', { name: t, exact: true }).click();
  await p.getByRole('button', { name: /Nómina/ }).click();

  // Gasto con nota y etiqueta
  await p.getByRole('button', { name: 'Añadir movimiento' }).click();
  for (const t of ['6', '0']) await p.getByRole('button', { name: t, exact: true }).click();
  await p.getByRole('button', { name: /Nota/ }).click();
  await p.getByPlaceholder(/Nota/).fill('Mercadona #casa');
  await p.getByRole('button', { name: /Supermercado/ }).first().click();

  // Transferencia Banco → Efectivo 50
  await p.getByRole('button', { name: 'Añadir movimiento' }).click();
  await p.getByRole('tab', { name: 'Transferencia' }).click();
  for (const t of ['5', '0']) await p.getByRole('button', { name: t, exact: true }).click();
  await p.getByRole('button', { name: 'Guardar' }).click();

  await p.waitForTimeout(300);
  const gastos = await p.getByTestId('gastos').innerText();
  const balance = await p.getByTestId('balance').innerText();
  assert.match(gastos.replace(/\s/g, ' '), /64,50/, 'gastos = 4,50 + 60 (la transferencia no cuenta)');
  assert.match(balance.replace(/\s/g, ' '), /1\.935,50/, 'balance');
  await foto('04-inicio');

  // Autocategorización: escribir "merca" sugiere Supermercado
  await p.getByRole('button', { name: 'Añadir movimiento' }).click();
  await p.getByRole('button', { name: /Nota/ }).click();
  await p.getByPlaceholder(/Nota/).fill('merca');
  await p.getByRole('button', { name: /¿🛒 Supermercado\?/ }).waitFor();
  await p.getByRole('button', { name: 'Cerrar', exact: true }).click();

  // Editar y borrar con deshacer
  await p.locator('section', { hasText: 'Últimos movimientos' }).getByRole('button', { name: /Restaurantes/ }).click();
  await p.getByRole('button', { name: 'Eliminar' }).click();
  await p.getByRole('button', { name: 'Deshacer' }).click();
  await p.getByText('Restaurado').waitFor();
  assert.match((await p.getByTestId('gastos').innerText()).replace(/\s/g, ' '), /64,50/);

  // Gamificación: el primer gasto desbloquea «Primer paso» y hay nivel y XP
  await p.getByRole('button', { name: /Ver logros/ }).first().click();
  await p.getByText('Retos de esta semana').waitFor();
  assert.strictEqual(await p.locator('[data-logro="primer-paso"]').getAttribute('data-desbloqueado'), 'true');
  assert.ok(premios >= 1, 'se celebró al menos una insignia');
  await foto('11-logros');

  // Movimientos
  await p.getByRole('button', { name: 'Movimientos', exact: true }).click();
  await p.getByPlaceholder(/Buscar/).fill('mercadona');
  await p.getByRole('button', { name: /Mercadona/ }).waitFor();
  await p.getByPlaceholder(/Buscar/).fill('');
  await foto('05-movimientos');

  // Análisis
  await p.getByRole('button', { name: 'Análisis' }).click();
  await p.getByText('Calendario de gastos').waitFor();
  await foto('06-analisis');

  // Ajustes → presupuesto total
  await p.getByRole('button', { name: 'Ajustes' }).click();
  await foto('07-ajustes');
  await p.getByRole('button', { name: /Presupuestos/ }).click();
  await p.getByRole('button', { name: 'Definir' }).click();
  await p.locator('input[inputmode=decimal]').fill('800');
  await p.getByRole('button', { name: 'Guardar' }).click();
  await p.getByRole('button', { name: 'Inicio' }).click();
  await p.getByText(/de presupuesto para/).waitFor();

  // Recurrente mensual que empezó hace 2 meses → genera 3
  await p.getByRole('button', { name: 'Ajustes' }).click();
  await p.getByRole('button', { name: /Recurrentes/ }).click();
  await p.getByRole('button', { name: '+ Nuevo recurrente' }).click();
  await p.getByPlaceholder(/Nombre/).fill('Netflix');
  await p.getByPlaceholder('Importe').fill('12,99');
  await p.locator('select').first().selectOption({ label: '📺 Suscripciones' });
  const d = new Date();
  d.setMonth(d.getMonth() - 2);
  await p.locator('input[type=date]').fill(d.toISOString().slice(0, 10));
  await p.getByRole('button', { name: 'Guardar' }).click();
  await p.getByText(/3 movimientos añadidos/).waitFor();

  // Calendario de pagos: Netflix (automático) aparece como pagado; añadir un recordatorio
  await p.getByRole('button', { name: 'Pagos', exact: true }).click();
  await p.getByText('Pagos fijos este mes').waitFor();
  await p.getByText(/Día \d+ · Pagado/).first().waitFor();
  await p.getByRole('button', { name: /Añadir suscripción o pago/ }).click();
  await p.getByPlaceholder(/Nombre/).fill('Gimnasio');
  await p.getByPlaceholder('Importe').fill('35');
  await p.locator('select').first().selectOption({ label: '🎬 Ocio' });
  const dentro2 = new Date(Date.now() + 2 * 86400000);
  const iso2 = `${dentro2.getFullYear()}-${String(dentro2.getMonth() + 1).padStart(2, '0')}-${String(dentro2.getDate()).padStart(2, '0')}`;
  await p.locator('input[type=date]').fill(iso2);
  await p.getByRole('button', { name: /Solo recordármelo/ }).click();
  await p.getByRole('button', { name: 'Guardar' }).click();
  await p.getByRole('button', { name: 'Inicio', exact: true }).click();
  await p.getByText('Próximos pagos').waitFor();
  const gastosAntes = await p.getByTestId('gastos').innerText();
  await p.locator('section', { hasText: 'Próximos pagos' }).getByRole('button', { name: /Marcar pagado/ }).click();
  await p.getByText(/Gimnasio marcado como pagado/).waitFor();
  assert.notStrictEqual(await p.getByTestId('gastos').innerText(), gastosAntes, 'marcar pagado apunta el gasto');
  await p.getByRole('button', { name: 'Deshacer' }).click();
  await p.waitForTimeout(300);
  assert.strictEqual(await p.getByTestId('gastos').innerText(), gastosAntes);
  await p.getByRole('button', { name: 'Pagos', exact: true }).click();
  await foto('10-pagos');
  await p.getByRole('button', { name: 'Ajustes', exact: true }).click();

  // Copia de seguridad: exportar, borrar todo, restaurar
  const [descarga] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: /Crear copia/ }).click()]);
  const ruta = await descarga.path();
  p.on('dialog', (dl) => dl.accept());
  await p.getByRole('button', { name: /Borrar todos/ }).click();
  await p.getByRole('button', { name: 'Empezar' }).waitFor();
  // Restaurar desde la bienvenida no es posible, así que se configura y se restaura desde Ajustes
  await p.getByRole('button', { name: 'Empezar' }).click();
  await p.getByRole('button', { name: '¡Listo!' }).click();
  await p.getByRole('button', { name: 'Ajustes' }).click();
  await p.locator('input[type=file]').setInputFiles(ruta);
  await p.getByText('Copia restaurada').waitFor();
  await p.getByRole('button', { name: 'Inicio' }).click();
  assert.match((await p.getByTestId('gastos').innerText()).replace(/\s/g, ' '), /77,49/);

  // Actualizar el saldo de un banco desde el inicio (no debe contar como gasto)
  await p.getByRole('button', { name: 'Revolut: actualizar saldo' }).click();
  await p.locator('input[inputmode=decimal]').fill('300');
  await p.getByText(/No cuenta como gasto/).waitFor();
  await p.getByRole('button', { name: 'Guardar' }).click();
  await p.getByText(/Revolut: saldo 300,00/).waitFor();
  assert.match((await p.getByTestId('gastos').innerText()).replace(/\s/g, ' '), /77,49/);
  await p.getByRole('button', { name: 'Añadir banco' }).click();
  await p.getByRole('button', { name: 'Openbank' }).click();
  await p.locator('input[inputmode=decimal]').fill('1000');
  await p.getByRole('button', { name: 'Guardar' }).click();
  await p.getByRole('button', { name: 'Openbank: actualizar saldo' }).waitFor();
  await foto('09-cuentas');

  // Modo oscuro
  await p.emulateMedia({ colorScheme: 'dark' });
  await foto('08-inicio-oscuro');

  assert.deepStrictEqual(errores, [], 'Sin errores en consola');
  console.log('E2E OK');
  await navegador.close();
})().catch((e) => {
  console.error('Errores de página:', globalThis.__errores);
  console.error(e);
  process.exit(1);
});
