import { describe, expect, it } from 'vitest';
import { logoDe } from './logos';

describe('logoDe', () => {
  it('reconoce bancos por su nombre', () => {
    expect(logoDe('BBVA')?.letras).toBe('BBVA');
    expect(logoDe('Revolut')?.path).toBeTruthy();
    expect(logoDe('revolut ahorro')?.fondo).toBe('#191C1F');
    expect(logoDe('Cuenta ING')?.letras).toBe('ING');
    expect(logoDe('Banco Sabadell')?.fondo).toBe('#006DFF');
    expect(logoDe('Trade Republic')?.letras).toBe('TR');
    expect(logoDe('PayPal')?.path).toBeTruthy();
  });
  it('no confunde palabras que solo contienen una clave corta', () => {
    expect(logoDe('Trading')).toBeUndefined();
    expect(logoDe('Efectivo')).toBeUndefined();
    expect(logoDe('Hucha')).toBeUndefined();
    expect(logoDe('Ahorro vivienda')).toBeUndefined();
  });
});
