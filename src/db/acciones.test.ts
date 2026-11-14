import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { borrarTodo, configurarInicial, crearMovimiento, exportarJSON, generarRecurrentes, guardarRecurrente, importarJSON, exportarCSV } from './acciones';

describe('base de datos', () => {
  beforeEach(async () => {
    await borrarTodo();
    await configurarInicial('EUR', [{ nombre: 'Banco', tipo: 'banco', saldoInicial: 100000, color: '#000', icono: '🏦' }]);
  });

  it('crea categorías y ajustes en el primer uso', async () => {
    expect(await db.categorias.count()).toBeGreaterThan(10);
    expect((await db.ajustes.get('ajustes'))?.configurado).toBe(true);
  });

  it('exporta, borra e importa sin perder datos', async () => {
    const cuenta = (await db.cuentas.toArray())[0];
    await crearMovimiento({ tipo: 'gasto', importe: 450, fecha: '2026-11-13', cuentaId: cuenta.id, etiquetas: [], nota: 'Café; con "leche"' });
    const copia = JSON.parse(JSON.stringify(await exportarJSON()));
    await borrarTodo();
    expect(await db.movimientos.count()).toBe(0);
    await importarJSON(copia);
    expect(await exportarJSON()).toMatchObject({ datos: copia.datos });
    const csv = await exportarCSV();
    expect(csv).toContain('-4,50');
    expect(csv).toContain('"Café; con ""leche"""');
  });

  it('genera recurrentes una sola vez', async () => {
    const cuenta = (await db.cuentas.toArray())[0];
    await guardarRecurrente({ tipo: 'gasto', importe: 1299, cuentaId: cuenta.id, frecuencia: 'mensual', inicio: '2026-09-05', activo: true, nota: 'Netflix' });
    expect(await generarRecurrentes('2026-11-13')).toBe(3);
    expect(await generarRecurrentes('2026-11-13')).toBe(0);
    expect(await generarRecurrentes('2026-12-05')).toBe(1);
  });

  it('rechaza archivos que no son de Finace', async () => {
    await expect(importarJSON({} as never)).rejects.toThrow();
  });
});
