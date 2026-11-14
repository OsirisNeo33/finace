import { describe, expect, it } from 'vitest';
import { aCentimos, formatear, pulsarTecla } from './dinero';
import { periodoDe, fechasPendientes, diasRestantes, ocurrenciasEnRango } from './fechas';
import { resumen, saldosCuentas, progresoPresupuestos, sugerirCategoria, agruparPorDia, racha } from './calculos';
import type { Cuenta, Movimiento } from './tipos';

const mov = (p: Partial<Movimiento>): Movimiento => ({
  id: Math.random().toString(36),
  tipo: 'gasto',
  importe: 100,
  fecha: '2026-11-10',
  cuentaId: 'a',
  etiquetas: [],
  creadoEn: '2026-11-10T10:00:00Z',
  actualizadoEn: '2026-11-10T10:00:00Z',
  ...p,
});

describe('dinero', () => {
  it('convierte texto a céntimos sin errores de coma flotante', () => {
    expect(aCentimos('4,5')).toBe(450);
    expect(aCentimos('1.234,56')).toBe(123456);
    expect(aCentimos('0,1')).toBe(10);
    expect(aCentimos('19,99')).toBe(1999);
    expect(aCentimos('')).toBe(0);
    expect(aCentimos('abc')).toBe(0);
  });
  it('formatea en español', () => {
    expect(formatear(123456).replace(/\s/g, ' ')).toBe('1.234,56 €');
    expect(formatear(-450).replace(/\s/g, ' ')).toBe('−4,50 €');
    expect(formatear(450, 'EUR', { signo: true }).replace(/\s/g, ' ')).toBe('+4,50 €');
  });
  it('teclado numérico', () => {
    let t = '';
    for (const k of ['0', '4', ',', '5', '0', '9']) t = pulsarTecla(t, k);
    expect(t).toBe('4,50');
    expect(pulsarTecla('4,5', ',')).toBe('4,5');
    expect(pulsarTecla('12', 'borrar')).toBe('1');
    expect(pulsarTecla('', ',')).toBe('0,');
  });
});

describe('periodos', () => {
  it('mes natural', () => {
    const p = periodoDe(new Date(2026, 10, 13), 1);
    expect(p).toMatchObject({ inicio: '2026-11-01', fin: '2026-11-30', etiqueta: 'Noviembre 2026' });
  });
  it('mes que empieza el día 25', () => {
    expect(periodoDe(new Date(2026, 10, 13), 25)).toMatchObject({ inicio: '2026-10-25', fin: '2026-11-24', etiqueta: 'Noviembre 2026' });
    expect(periodoDe(new Date(2026, 10, 26), 25)).toMatchObject({ inicio: '2026-11-25', fin: '2026-12-24' });
  });
  it('desplazamiento cruzando año', () => {
    expect(periodoDe(new Date(2026, 0, 10), 1, -1)).toMatchObject({ inicio: '2025-12-01', fin: '2025-12-31' });
  });
  it('días restantes incluye hoy', () => {
    const p = periodoDe(new Date(2026, 10, 13), 1);
    expect(diasRestantes(p, '2026-11-13')).toBe(18);
    expect(diasRestantes(p, '2026-12-01')).toBe(0);
  });
});

describe('recurrentes', () => {
  it('mensual el día 31 se ajusta al último día del mes', () => {
    expect(fechasPendientes('2026-01-31', undefined, 'mensual', '2026-04-30')).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
  });
  it('continúa desde la última generación', () => {
    expect(fechasPendientes('2026-01-05', '2026-03-05', 'mensual', '2026-05-01')).toEqual(['2026-04-05']);
    expect(fechasPendientes('2026-11-01', undefined, 'semanal', '2026-11-20')).toEqual(['2026-11-01', '2026-11-08', '2026-11-15']);
  });
  it('nada si empieza en el futuro', () => {
    expect(fechasPendientes('2026-12-01', undefined, 'mensual', '2026-11-13')).toEqual([]);
  });
});

describe('cálculos', () => {
  const movs = [
    mov({ tipo: 'ingreso', importe: 200000, categoriaId: 'nomina' }),
    mov({ tipo: 'gasto', importe: 450, categoriaId: 'rest' }),
    mov({ tipo: 'gasto', importe: 5000, categoriaId: 'super' }),
    mov({ tipo: 'transferencia', importe: 10000, cuentaId: 'a', cuentaDestinoId: 'b' }),
  ];
  it('las transferencias no cuentan como gasto ni ingreso', () => {
    expect(resumen(movs)).toEqual({ ingresos: 200000, gastos: 5450, balance: 194550 });
  });
  it('saldos por cuenta', () => {
    const cuentas = [
      { id: 'a', saldoInicial: 1000 },
      { id: 'b', saldoInicial: 0 },
    ] as Cuenta[];
    const s = saldosCuentas(cuentas, movs);
    expect(s.get('a')).toBe(1000 + 200000 - 5450 - 10000);
    expect(s.get('b')).toBe(10000);
  });
  it('presupuestos', () => {
    const p = progresoPresupuestos(
      [
        { id: '1', categoriaId: 'super', importe: 6000 },
        { id: '2', categoriaId: 'rest', importe: 400 },
        { id: '3', categoriaId: null, importe: 100000 },
      ],
      movs,
    );
    expect(p.map((x) => x.estado)).toEqual(['aviso', 'superado', 'ok']);
    expect(p[2].gastado).toBe(5450);
  });
  it('sugiere categoría por nota', () => {
    const h = [mov({ nota: 'Mercadona', categoriaId: 'super' }), mov({ nota: 'mercadona centro', categoriaId: 'super' }), mov({ nota: 'Merca bar', categoriaId: 'rest' })];
    expect(sugerirCategoria('mercad', h)).toBe('super');
    expect(sugerirCategoria('me', h)).toBeUndefined();
  });
  it('agrupa por día con neto', () => {
    const g = agruparPorDia([mov({ fecha: '2026-11-09' }), mov({ fecha: '2026-11-10', tipo: 'ingreso', importe: 500 }), mov({ fecha: '2026-11-10' })]);
    expect(g.map((x) => [x.fecha, x.neto])).toEqual([
      ['2026-11-10', 400],
      ['2026-11-09', -100],
    ]);
  });
  it('racha de días', () => {
    const prev = (d: string) => new Date(Date.parse(d) - 86400000).toISOString().slice(0, 10);
    expect(racha(new Set(['2026-11-13', '2026-11-12', '2026-11-11', '2026-11-09']), '2026-11-13', prev)).toBe(3);
    expect(racha(new Set(['2026-11-12']), '2026-11-13', prev)).toBe(1);
    expect(racha(new Set([]), '2026-11-13', prev)).toBe(0);
  });
});

import { saldoInicialPara } from './bancos';
describe('bancos', () => {
  it('ajusta el saldo inicial para que el saldo actual sea el que ves en el banco', () => {
    // inicial 1.000 €, gastos apuntados −200 € → actual 800 €; el banco dice 750 €
    expect(saldoInicialPara(75000, 80000, 100000)).toBe(95000);
    // cuenta nueva sin movimientos
    expect(saldoInicialPara(123456, 0, 0)).toBe(123456);
  });
});

describe('calendario de pagos', () => {
  it('ocurrencias de un mes', () => {
    expect(ocurrenciasEnRango('2026-01-31', 'mensual', '2026-02-01', '2026-02-28')).toEqual(['2026-02-28']);
    expect(ocurrenciasEnRango('2026-11-02', 'semanal', '2026-11-01', '2026-11-30')).toEqual(['2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23', '2026-11-30']);
    expect(ocurrenciasEnRango('2025-03-15', 'anual', '2026-11-01', '2026-11-30')).toEqual([]);
    expect(ocurrenciasEnRango('2026-12-05', 'mensual', '2026-11-01', '2026-11-30')).toEqual([]);
  });
});
