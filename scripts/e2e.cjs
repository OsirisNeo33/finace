// Prueba de extremo a extremo del flujo principal.
// Uso: npm run build && npx vite preview --port 4173 & node scripts/e2e.cjs [carpeta-capturas]
const { chromium, devices } = require('playwright');
const assert = require('node:assert');
const URL_APP = process.env.URL_APP ?? 'http://localhost:4173/';
const capturas = process.argv[2];

(async () => {
  const navegador = await chromium.launch();
  const ctx = await navegador.newContext({ ...devices['Pixel 7'], deviceScaleFactor: 1, locale: 'es-ES', acceptDownloads: true, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  const errores = (globalThis.__errores = []);
  p.on('pageerror', (e) => errores.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
  const foto = async (n) => capturas && p.screenshot({ path: `${capturas}/${n}.png`, fullPage: true });

  // Las celebraciones de logros tapan la pantalla: se cierran solas durante la prueba
  let premios = 0;
  await p.addLocatorHandler(p.getByRole('button', { name: '¡Genial!' }), async () => {
    premios++;
    // Puede desaparecer sola (p. ej. al restaurar una copia): no esperar indefinidamente
    await p.getByRole('button', { name: '¡Genial!' }).click({ timeout: 2000 }).catch(() => {});
  }, { noWaitAfter: true });
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
  await p.getByRole('button', { name: 'Hoy', exact: true }).click();
  await p.getByText(/de presupuesto para/).waitFor();

  // Recurrente mensual que empezó hace 2 meses → genera 3
  await p.getByRole('button', { name: 'Ajustes' }).click();
  await p.getByRole('button', { name: /Recurrentes/ }).click();
  await p.getByRole('button', { name: '+ Nuevo recurrente' }).click();
  await p.getByLabel('Nombre').fill('Netflix');
  await p.getByLabel('Importe').fill('12,99');
  await p.locator('select').first().selectOption({ label: '📺 Suscripciones' });
  const d = new Date();
  d.setMonth(d.getMonth() - 2);
  await p.locator('input[type=date]').fill(d.toISOString().slice(0, 10));
  await p.getByRole('button', { name: 'Guardar' }).click();
  await p.getByText(/3 movimientos añadidos/).waitFor();

  // Calendario de pagos: Netflix (automático) aparece como pagado; añadir un recordatorio
  await p.getByRole('button', { name: 'Contabilidad', exact: true }).click();
  await p.getByRole('tab', { name: 'Calendario de pagos' }).click();
  await p.getByText('Pagos fijos este mes').waitFor();
  await p.locator('section', { hasText: 'Este mes' }).getByText('Pagado', { exact: true }).first().waitFor();
  await p.getByRole('button', { name: /Añadir suscripción o pago/ }).click();
  await p.getByLabel('Nombre').fill('Gimnasio');
  await p.getByLabel('Importe').fill('35');
  await p.locator('select').first().selectOption({ label: '🎬 Ocio' });
  const dentro2 = new Date(Date.now() + 2 * 86400000);
  const iso2 = `${dentro2.getFullYear()}-${String(dentro2.getMonth() + 1).padStart(2, '0')}-${String(dentro2.getDate()).padStart(2, '0')}`;
  await p.locator('input[type=date]').fill(iso2);
  await p.getByRole('switch', { name: 'Apuntarlo automáticamente' }).click();
  await p.getByRole('button', { name: 'Guardar' }).click();
  await p.getByRole('button', { name: 'Hoy', exact: true }).click();
  await p.getByText('Próximos pagos').waitFor();
  const gastosAntes = await p.getByTestId('gastos').innerText();
  await p.locator('section', { hasText: 'Próximos pagos' }).getByRole('button', { name: /Marcar pagado/ }).click();
  await p.getByText(/Gimnasio marcado como pagado/).waitFor();
  assert.notStrictEqual(await p.getByTestId('gastos').innerText(), gastosAntes, 'marcar pagado apunta el gasto');
  await p.getByRole('button', { name: 'Deshacer' }).click();
  await p.waitForTimeout(300);
  assert.strictEqual(await p.getByTestId('gastos').innerText(), gastosAntes);
  // Contabilidad: ingreso fijo (nómina) y lo que queda libre tras los gastos fijos (Netflix 12,99 + Gimnasio 35)
  await p.getByRole('button', { name: 'Contabilidad', exact: true }).click();
  await p.getByRole('tab', { name: 'Resumen' }).click();
  assert.match((await p.getByTestId('gastos-fijos').innerText()).replace(/\s/g, ' '), /47,99/);
  await p.getByRole('button', { name: 'Ingreso fijo', exact: true }).click();
  await p.getByText('Nuevo ingreso fijo').waitFor();
  await p.getByLabel('Nombre').fill('Nómina');
  await p.getByLabel('Importe').fill('2000');
  await p.locator('select').first().selectOption({ index: 1 });
  const dentro3 = new Date(Date.now() + 3 * 86400000);
  await p.locator('input[type=date]').fill(`${dentro3.getFullYear()}-${String(dentro3.getMonth() + 1).padStart(2, '0')}-${String(dentro3.getDate()).padStart(2, '0')}`);
  await p.getByRole('button', { name: 'Guardar' }).click();
  await p.getByTestId('libre').filter({ hasText: '1.952,01' }).waitFor();
  await foto('10-contabilidad');
  await p.getByRole('tab', { name: 'Calendario de pagos' }).click();
  await foto('10-pagos');
  await p.getByRole('button', { name: 'Ajustes', exact: true }).click();

  // Finanzas: deuda cara, pago con deshacer, inversión y consejos
  await p.getByRole('button', { name: 'Finanzas', exact: true }).click();
  await p.getByRole('tab', { name: 'Deudas' }).click();
  await p.getByRole('button', { name: '+ Añadir deuda' }).click();
  await p.getByLabel('Tipo').selectOption('tarjeta');
  await p.getByLabel('Nombre').fill('Tarjeta Visa');
  await p.getByLabel('Lo que debes hoy').fill('1200');
  await p.getByLabel('Importe inicial').fill('1500');
  await p.getByLabel('Cuota al mes').fill('100');
  await p.getByLabel('Interés TAE (%)').fill('21');
  await p.getByText(/Terminarías en/).waitFor();
  await p.getByRole('button', { name: 'Guardar' }).click();
  await p.getByTestId('deuda-total').filter({ hasText: '1.200,00' }).waitFor();
  await p.getByRole('button', { name: /Tarjeta Visa/ }).click();
  await p.getByText(/terminas en/).waitFor();
  await p.getByRole('button', { name: 'Registrar pago' }).click();
  await p.getByTestId('deuda-pendiente').filter({ hasText: '1.100,00' }).waitFor();
  await p.getByRole('button', { name: 'Deshacer' }).click();
  await p.getByTestId('deuda-pendiente').filter({ hasText: '1.200,00' }).waitFor();
  await p.getByRole('dialog').getByRole('button', { name: 'Cerrar' }).click();
  await p.getByRole('tab', { name: 'Inversiones' }).click();
  await p.getByRole('button', { name: '+ Añadir inversión' }).click();
  await p.getByLabel('Nombre').fill('Fondo indexado');
  await p.getByRole('button', { name: 'MyInvestor' }).click();
  await p.getByLabel('Dinero aportado').fill('1000');
  await p.getByLabel('Valor actual').fill('1100');
  await p.getByRole('button', { name: 'Guardar' }).click();
  await p.getByTestId('valor-inversiones').filter({ hasText: '1.100,00' }).waitFor();
  // Trading: cuenta de trading, operación con precios (suma a la cuenta) y otra solo con resultado
  await p.getByRole('button', { name: '+ Añadir inversión' }).click();
  await p.getByLabel('Tipo').selectOption('trading');
  await p.getByLabel('Nombre').fill('Cuenta XTB');
  await p.getByLabel('Dinero aportado').fill('500');
  await p.getByLabel('Valor actual').fill('500');
  await p.getByRole('button', { name: 'Guardar' }).click();
  await p.getByTestId('valor-inversiones').filter({ hasText: '1.600,00' }).waitFor();
  await p.getByRole('tab', { name: 'Trading' }).click();
  await p.getByRole('button', { name: '+ Nueva operación' }).click();
  await p.getByLabel('Activo').fill('aapl');
  await p.getByLabel('Precio de entrada').fill('100');
  await p.getByLabel('Cantidad').fill('10');
  await p.getByRole('switch', { name: 'Operación cerrada' }).click();
  await p.getByLabel('Precio de salida').fill('110');
  await p.getByLabel('Comisiones').fill('2');
  await p.getByLabel('Cuenta de trading (opcional)').selectOption({ label: 'Cuenta XTB' });
  await p.getByText(/Resultado: \+98,00/).waitFor();
  await p.getByRole('button', { name: 'Guardar' }).click();
  await p.getByTestId('trading-neto').filter({ hasText: '+98,00' }).waitFor();
  await p.getByRole('button', { name: '+ Nueva operación' }).click();
  await p.getByLabel('Activo').fill('EUR/USD');
  await p.getByLabel('Mercado').selectOption('forex');
  await p.getByRole('tab', { name: /Corto/ }).click();
  await p.getByRole('tab', { name: 'Solo resultado' }).click();
  await p.getByRole('switch', { name: 'Operación cerrada' }).click();
  await p.getByLabel(/Resultado neto/).fill('-30');
  await p.getByRole('button', { name: 'Guardar' }).click();
  await p.getByTestId('trading-neto').filter({ hasText: '+68,00' }).waitFor();
  assert.match(await p.getByTestId('trading-aciertos').innerText(), /50/);
  await foto('13-trading');
  await p.getByRole('tab', { name: 'Cartera' }).click();
  // 1.100 (fondo) + 500 (XTB) + 98 − 30 (resultados sumados a la cuenta única)
  await p.getByTestId('valor-inversiones').filter({ hasText: '1.668,00' }).waitFor();
  await p.getByRole('tab', { name: 'Resumen' }).click();
  await p.locator('[data-consejo="caras"]').getByText(/Tarjeta Visa/).waitFor();
  assert.match(await p.getByTestId('salud').innerText(), /^\d+$/, 'hay puntuación de salud');
  await foto('12-finanzas');
  // Me deben: apuntar, devolución parcial con deshacer y cobrar todo
  await p.getByRole('tab', { name: 'Me deben' }).click();
  await p.getByRole('button', { name: '+ Alguien me debe dinero' }).click();
  await p.getByLabel('Nombre').fill('Laura');
  await p.getByLabel('Por qué te lo debe').fill('Cena del sábado');
  await p.getByLabel('Cuánto te debe').fill('30');
  await p.getByRole('button', { name: 'Guardar' }).click();
  await p.getByTestId('te-deben').filter({ hasText: '30,00' }).waitFor();
  await p.getByRole('button', { name: /Laura: te debe/ }).click();
  await p.getByLabel('Te ha devuelto').fill('10');
  await p.getByRole('button', { name: 'Registrar devolución' }).click();
  await p.getByTestId('persona-pendiente').filter({ hasText: '20,00' }).waitFor();
  await p.getByRole('button', { name: 'Deshacer' }).click();
  await p.getByTestId('persona-pendiente').filter({ hasText: '30,00' }).waitFor();
  await p.getByRole('button', { name: 'Cobrar todo' }).click();
  await p.getByTestId('te-deben').filter({ hasText: '0,00' }).waitFor();
  await p.getByText('Ya te lo devolvieron').waitFor();
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
  // El aviso dura 2,5 s y las celebraciones de logros pueden taparlo: se comprueba el dato restaurado
  await p.getByRole('button', { name: /Cuentas/ }).filter({ hasText: '4' }).waitFor();
  await p.getByRole('button', { name: 'Hoy', exact: true }).click();
  await p.getByTestId('gastos').filter({ hasText: '77,49' }).waitFor();
  await p.getByRole('button', { name: 'Finanzas', exact: true }).click();
  await p.getByRole('tab', { name: 'Deudas' }).click();
  await p.getByRole('button', { name: /Tarjeta Visa/ }).waitFor();
  await p.getByRole('button', { name: 'Hoy', exact: true }).click();

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
