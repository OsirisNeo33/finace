import { describe, expect, it } from 'vitest';
import { duracion, ordenAvalancha, proyectar } from './deudas';
import { evaluarSalud } from './salud';
const hoy = new Date(2026, 10, 19);
const dinero = (c) => `${(c / 100).toFixed(2)} €`;
const cuenta = (p) => ({ id: 'c1', nombre: 'Banco', tipo: 'banco', saldoInicial: 0, color: '', icono: '', orden: 0, archivada: false, ...p });
const rec = (p) => ({ id: Math.random().toString(36), tipo: 'gasto', importe: 0, cuentaId: 'c1', frecuencia: 'mensual', inicio: '2026-12-01', activo: true, ...p });
const deuda = (p) => ({ id: Math.random().toString(36), nombre: 'Deuda', tipo: 'prestamo', importeInicial: 0, pendiente: 0, cuota: 0, tae: 0, pagos: [], saldada: false, baseEn: '2026-11-01T00:00:00.000Z', creadoEn: '', actualizadoEn: '', ...p });
const datos = (p) => ({ movimientos: [], cuentas: [], deudas: [], inversiones: [], recurrentes: [], diaInicioMes: 1, hoy, dinero, nombreCategoria: () => 'Restaurantes', ...p });
describe('deudas', () => {
    it('calcula cuántos meses faltan y los intereses (sistema francés)', () => {
        expect(proyectar(1_000_000, 30_000, 0, hoy)).toMatchObject({ meses: 34, intereses: 0 });
        const p = proyectar(1_000_000, 30_000, 12, hoy);
        expect(p.meses).toBe(41);
        expect(p.intereses).toBeGreaterThan(215_000);
        expect(p.intereses).toBeLessThan(230_000);
    });
    it('avisa si la cuota no cubre ni los intereses', () => {
        expect(proyectar(1_000_000, 5_000, 12, hoy)).toBeNull();
        expect(proyectar(1_000_000, 0, 5, hoy)).toBeNull();
    });
    it('ordena por el método avalancha (primero el mayor interés)', () => {
        const r = ordenAvalancha([deuda({ nombre: 'Hipoteca', tae: 3 }), deuda({ nombre: 'Tarjeta', tae: 21 }), deuda({ nombre: 'Coche', tae: 7 })]);
        expect(r.map((d) => d.nombre)).toEqual(['Tarjeta', 'Coche', 'Hipoteca']);
    });
    it('describe la duración en años y meses', () => {
        expect(duracion(41)).toBe('3 años y 5 meses');
        expect(duracion(12)).toBe('1 año');
        expect(duracion(1)).toBe('1 mes');
    });
});
describe('pendiente de una deuda', () => {
    it('resta los pagos registrados después y vuelve a subir si se deshace uno', async () => {
        const { pendienteActual } = await import('./deudas');
        const d = deuda({ id: 'd1', recurrenteId: 'r1', pendiente: 100_000, pagos: [{ fecha: '2026-11-10', importe: 5_000, creadoEn: '2026-11-10T10:00:00.000Z' }] });
        const m = (p) => ({ id: Math.random().toString(36), tipo: 'gasto', importe: 10_000, fecha: '2026-11-05', cuentaId: 'c1', etiquetas: [], creadoEn: '2026-11-05T10:00:00.000Z', actualizadoEn: '', ...p });
        const movs = [m({ recurrenteId: 'r1' }), m({ deudaId: 'd1', importe: 20_000 }), m({ recurrenteId: 'r1', creadoEn: '2026-10-05T10:00:00.000Z' }), m({ importe: 99_999 })];
        expect(pendienteActual(d, movs)).toBe(100_000 - 10_000 - 20_000 - 5_000);
        expect(pendienteActual(d, movs.slice(1))).toBe(100_000 - 20_000 - 5_000);
    });
});
describe('salud financiera', () => {
    it('puntúa alto un perfil sano y sugiere invertir el excedente', () => {
        const s = evaluarSalud(datos({
            cuentas: [cuenta({ saldoInicial: 1_800_000 })],
            recurrentes: [rec({ tipo: 'ingreso', importe: 200_000 }), rec({ importe: 100_000 })],
        }));
        expect(s.cifras.tasaAhorro).toBe(0.5);
        expect(s.cifras.mesesColchon).toBe(18);
        expect(s.puntos).toBe(90);
        expect(s.nivel).toBe('excelente');
        expect(s.consejos.map((c) => c.id)).toContain('invertir');
        expect(s.cifras.patrimonio).toBe(1_800_000);
    });
    it('detecta deudas caras, falta de colchón y gasto excesivo, en ese orden', () => {
        const s = evaluarSalud(datos({
            cuentas: [cuenta({ saldoInicial: 50_000 })],
            recurrentes: [rec({ tipo: 'ingreso', importe: 150_000 }), rec({ importe: 160_000 })],
            deudas: [deuda({ nombre: 'Tarjeta', tipo: 'tarjeta', tae: 21, pendiente: 300_000, importeInicial: 300_000, cuota: 10_000 })],
        }));
        expect(s.puntos).toBe(37);
        expect(s.nivel).toBe('delicada');
        expect(s.consejos.map((c) => c.id)).toEqual(['caras', 'colchon', 'ahorro']);
        expect(s.consejos[0].titulo).toContain('Tarjeta');
        expect(s.cifras.patrimonio).toBe(50_000 - 300_000);
    });
    it('usa los ingresos fijos si el historial solo tiene gastos automáticos', () => {
        const m = { id: 'm', tipo: 'gasto', importe: 1_299, fecha: '2026-10-03', cuentaId: 'c1', etiquetas: [], recurrenteId: 'r', creadoEn: '', actualizadoEn: '' };
        const s = evaluarSalud(datos({ movimientos: [m], cuentas: [cuenta({ saldoInicial: 100_000 })], recurrentes: [rec({ tipo: 'ingreso', importe: 200_000 })] }));
        expect(s.cifras.ingresosMes).toBe(200_000);
        expect(s.puntos).not.toBeNull();
    });
    it('suma lo que te deben al patrimonio, no lo cuenta como ingreso y avisa si es antiguo', async () => {
        const { pendienteCobro, porPersona, mensajeRecordatorio } = await import('./cobros');
        const cobro = (p) => ({ id: Math.random().toString(36), persona: 'Ana López', concepto: 'Cena', importe: 6_000, fecha: '2026-09-01', devoluciones: [], saldado: false, creadoEn: '', actualizadoEn: '', ...p });
        const c1 = cobro({ id: 'c1' });
        const c2 = cobro({ id: 'c2', persona: 'ana lópez', concepto: 'Entradas', importe: 4_000, fecha: '2026-11-10', devoluciones: [{ fecha: '2026-11-12', importe: 1_000, creadoEn: '' }] });
        const devuelto = { id: 'm', tipo: 'ingreso', importe: 2_000, fecha: '2026-11-15', cuentaId: 'c1', etiquetas: [], cobroId: 'c1', creadoEn: '', actualizadoEn: '' };
        expect(pendienteCobro(c1, [devuelto])).toBe(4_000);
        const [ana] = porPersona([c1, c2], [devuelto], hoy);
        expect(ana.pendiente).toBe(7_000);
        expect(ana.cobros.map((c) => c.concepto)).toEqual(['Cena', 'Entradas']);
        expect(mensajeRecordatorio(ana, dinero)).toContain('Total: 70.00 €');
        const s = evaluarSalud(datos({ movimientos: [devuelto], cobros: [c1, c2], cuentas: [cuenta({ saldoInicial: 10_000 })], recurrentes: [rec({ tipo: 'ingreso', importe: 200_000 })] }));
        expect(s.cifras.teDeben).toBe(7_000);
        expect(s.cifras.patrimonio).toBe(10_000 + 2_000 + 7_000);
        expect(s.cifras.ingresosMes).toBe(200_000);
        expect(s.consejos.map((c) => c.id)).toContain('cobrar');
    });
    it('avisa si el trading pierde dinero o pesa demasiado', () => {
        const op = (r) => ({ id: Math.random().toString(36), activo: 'X', mercado: 'forex', direccion: 'largo', apertura: '2026-11-01', cierre: '2026-11-10', comisiones: 0, resultadoManual: r, creadoEn: '', actualizadoEn: '' });
        const inv = { id: 'i', nombre: 'IG', tipo: 'trading', aportado: 500_000, valor: 400_000, creadoEn: '', actualizadoEn: '' };
        const s = evaluarSalud(datos({ cuentas: [cuenta({ saldoInicial: 100_000 })], recurrentes: [rec({ tipo: 'ingreso', importe: 200_000 })], inversiones: [inv], operaciones: [op(-5_000), op(2_000), op(-8_000)] }));
        expect(s.consejos.map((c) => c.id)).toEqual(expect.arrayContaining(['trading-pierde', 'trading-riesgo']));
    });
    it('pide los ingresos si no hay datos suficientes', () => {
        const s = evaluarSalud(datos({}));
        expect(s.puntos).toBeNull();
        expect(s.consejos[0].id).toBe('ingresos');
    });
});
