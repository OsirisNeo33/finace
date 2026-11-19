import { describe, expect, it } from 'vitest';
import { evaluarJuego, nivelDe, rachaActual, rachaMaxima, xpInicioNivel } from './logros';
const mov = (fecha, p = {}) => ({
    id: Math.random().toString(36),
    tipo: 'gasto',
    importe: 1000,
    fecha,
    cuentaId: 'a',
    etiquetas: [],
    creadoEn: `${fecha}T12:00:00`,
    actualizadoEn: `${fecha}T12:00:00`,
    ...p,
});
const base = { presupuestos: [], cuentas: [], recurrentes: [], diaInicioMes: 1, copias: 0 };
describe('niveles', () => {
    it('umbrales crecientes', () => {
        expect([1, 2, 3, 4].map(xpInicioNivel)).toEqual([0, 100, 300, 600]);
        expect(nivelDe(0)).toMatchObject({ nivel: 1, nombre: 'Novato', xpEnNivel: 0, xpParaSubir: 100 });
        expect(nivelDe(350)).toMatchObject({ nivel: 3, xpEnNivel: 50, xpParaSubir: 300 });
    });
});
describe('rachas', () => {
    const dias = new Set(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-10', '2026-11-11']);
    it('actual y máxima', () => {
        expect(rachaActual(dias, '2026-11-12')).toBe(2);
        expect(rachaActual(dias, '2026-11-11')).toBe(2);
        expect(rachaActual(dias, '2026-11-13')).toBe(0);
        expect(rachaMaxima(dias)).toBe(4);
        expect(rachaMaxima(new Set())).toBe(0);
    });
});
describe('juego', () => {
    it('sin datos empieza en nivel 1 sin logros', () => {
        const j = evaluarJuego({ ...base, movimientos: [], hoy: '2026-11-18' });
        expect(j.xp).toBe(0);
        expect(j.logros.some((l) => l.desbloqueado)).toBe(false);
    });
    it('una semana apuntando desbloquea rachas y retos', () => {
        const movs = ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'].map((f) => mov(f));
        const j = evaluarJuego({ ...base, movimientos: movs, hoy: '2026-11-16' });
        const ids = j.logros.filter((l) => l.desbloqueado).map((l) => l.id);
        expect(ids).toEqual(expect.arrayContaining(['primer-paso', 'racha-3', 'racha-7']));
        expect(ids).not.toContain('sin-gasto-1');
        expect(j.racha).toBe(7);
        // semana pasada: reto "apuntar 5 días" completado; "2 días sin gastar" no
        expect(j.retosCompletados).toBe(1);
        // 7 mov × 5 + 7 días × 10 + logros (20 + 30 + 70) + 1 reto × 50
        expect(j.xp).toBe(35 + 70 + 120 + 50);
    });
    it('los recurrentes automáticos no cuentan para la racha', () => {
        const j = evaluarJuego({ ...base, movimientos: [mov('2026-11-17', { recurrenteId: 'r' })], hoy: '2026-11-17' });
        expect(j.racha).toBe(0);
        expect(j.xp).toBe(0);
    });
    it('mes cerrado ahorrando el 20 %', () => {
        const movs = [mov('2026-10-01', { tipo: 'ingreso', importe: 200000 }), mov('2026-10-05', { importe: 100000 })];
        const j = evaluarJuego({ ...base, movimientos: movs, hoy: '2026-11-18' });
        expect(j.logros.find((l) => l.id === 'ahorro-1')?.desbloqueado).toBe(true);
        expect(j.logros.find((l) => l.id === 'sin-gasto-10')?.desbloqueado).toBe(true);
    });
});
