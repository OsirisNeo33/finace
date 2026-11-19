import { describe, expect, it } from 'vitest';
import { aNumero, estadisticas, resultado, rentabilidad } from './trading';
import type { Operacion } from './tipos';

const op = (p: Partial<Operacion>): Operacion => ({ id: Math.random().toString(36), activo: 'AAPL', mercado: 'acciones', direccion: 'largo', apertura: '2026-11-01', comisiones: 0, creadoEn: '', actualizadoEn: '', ...p });

describe('trading', () => {
  it('entiende precios con coma o con punto decimal', () => {
    expect(aNumero('1.234,56')).toBe(1234.56);
    expect(aNumero('1.08543')).toBe(1.08543);
    expect(aNumero('')).toBeUndefined();
  });

  it('calcula el resultado en largo y en corto, restando comisiones', () => {
    expect(resultado(op({ cierre: '2026-11-05', entrada: 100, salida: 110, cantidad: 10, comisiones: 200 }))).toBe(9_800);
    expect(resultado(op({ cierre: '2026-11-05', direccion: 'corto', entrada: 100, salida: 110, cantidad: 10 }))).toBe(-10_000);
    expect(resultado(op({ entrada: 100, cantidad: 10 }))).toBeNull(); // abierta
    expect(resultado(op({ cierre: '2026-11-05', resultadoManual: -2_550 }))).toBe(-2_550);
    expect(rentabilidad(op({ cierre: '2026-11-05', entrada: 100, salida: 110, cantidad: 10 }))).toBeCloseTo(0.1);
  });

  it('saca las estadísticas de las cerradas', () => {
    const ops = [
      op({ cierre: '2026-11-02', resultadoManual: 30_000, mercado: 'cripto' }),
      op({ cierre: '2026-11-03', resultadoManual: 10_000 }),
      op({ cierre: '2026-11-04', resultadoManual: -10_000 }),
      op({ cierre: '2026-10-01', resultadoManual: -50_000 }),
      op({ entrada: 5, cantidad: 1 }),
    ];
    const e = estadisticas(ops, '2026-11-01');
    expect(e).toMatchObject({ cerradas: 3, abiertas: 1, neto: 30_000, ganadoras: 2, perdedoras: 1, beneficioMedio: 20_000, perdidaMedia: -10_000, ratio: 2, factor: 4 });
    expect(e.aciertos).toBeCloseTo(2 / 3);
    expect(e.porMercado[0]).toEqual(['cripto', 30_000]);
    expect(estadisticas(ops).neto).toBe(-20_000);
  });
});
