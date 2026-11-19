import { describe, expect, it } from 'vitest';
import { equivalenteMensual, gastosFijosYVariables, resumenFijos } from './fijos';
import type { Movimiento, Recurrente } from './tipos';

const rec = (p: Partial<Recurrente>): Recurrente => ({
  id: Math.random().toString(36),
  tipo: 'gasto',
  importe: 1000,
  cuentaId: 'a',
  frecuencia: 'mensual',
  inicio: '2026-01-05',
  activo: true,
  ...p,
});

describe('fijos', () => {
  it('pasa cada frecuencia a su importe mensual', () => {
    expect(equivalenteMensual({ importe: 1200, frecuencia: 'mensual' })).toBe(1200);
    expect(equivalenteMensual({ importe: 1200, frecuencia: 'anual' })).toBe(100);
    expect(equivalenteMensual({ importe: 1200, frecuencia: 'semanal' })).toBe(5200);
  });

  it('suma ingresos y gastos fijos activos y calcula lo que queda libre', () => {
    const r = resumenFijos([
      rec({ tipo: 'ingreso', importe: 200000 }),
      rec({ importe: 75000 }),
      rec({ importe: 12000, frecuencia: 'anual' }),
      rec({ importe: 99999, activo: false }),
    ]);
    expect(r).toEqual({ ingresos: 200000, gastos: 76000, libre: 124000 });
  });

  it('separa gastos fijos (de un recurrente) y variables', () => {
    const m = (p: Partial<Movimiento>): Movimiento => ({ id: 'x', tipo: 'gasto', importe: 100, fecha: '2026-11-01', cuentaId: 'a', etiquetas: [], creadoEn: '', actualizadoEn: '', ...p });
    expect(gastosFijosYVariables([m({ importe: 500, recurrenteId: 'r' }), m({ importe: 300 }), m({ tipo: 'ingreso', importe: 9000 }), m({ tipo: 'transferencia', importe: 50 })])).toEqual({ fijos: 500, variables: 300 });
  });
});
