import { subDays } from 'date-fns';
import { aISO } from './fechas';
export const MERCADOS = {
    acciones: { nombre: 'Acciones', icono: '📈' },
    forex: { nombre: 'Divisas (forex)', icono: '💱' },
    cripto: { nombre: 'Cripto', icono: '🪙' },
    indices: { nombre: 'Índices', icono: '🌍' },
    materias: { nombre: 'Materias primas', icono: '🛢️' },
    derivados: { nombre: 'CFD, futuros u opciones', icono: '⚙️' },
    otro: { nombre: 'Otro', icono: '💼' },
};
/** "1.234,56" → 1234.56 · "1.08543" → 1.08543 (con coma, los puntos son de miles; sin coma, el punto es decimal). */
export function aNumero(texto) {
    const t = texto.trim().replace(/\s/g, '');
    if (!t)
        return undefined;
    const n = Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t);
    return Number.isFinite(n) ? n : undefined;
}
/** Resultado neto en céntimos (después de comisiones). null si está abierta o faltan datos. */
export function resultado(o) {
    if (!o.cierre)
        return null;
    if (o.resultadoManual !== undefined)
        return o.resultadoManual;
    if (o.entrada === undefined || o.salida === undefined || o.cantidad === undefined)
        return null;
    const bruto = (o.salida - o.entrada) * o.cantidad * (o.direccion === 'largo' ? 1 : -1);
    return Math.round(bruto * 100) - o.comisiones;
}
/** Rentabilidad sobre lo invertido en la operación (precio de entrada × cantidad), si se conoce. */
export function rentabilidad(o) {
    const r = resultado(o);
    if (r === null || !o.entrada || !o.cantidad)
        return null;
    return r / Math.round(o.entrada * o.cantidad * 100);
}
export function desdePeriodo(p, hoy = new Date()) {
    if (p === 'todo')
        return '0000-00-00';
    if (p === 'mes')
        return aISO(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    if (p === 'ano')
        return aISO(new Date(hoy.getFullYear(), 0, 1));
    return aISO(subDays(hoy, 90));
}
/** Estadísticas de las operaciones cerradas desde `desde` (fecha de cierre). */
export function estadisticas(ops, desde = '0000-00-00') {
    const cerradas = ops.filter((o) => o.cierre && o.cierre >= desde && resultado(o) !== null);
    const r = (o) => resultado(o);
    const gan = cerradas.filter((o) => r(o) > 0);
    const per = cerradas.filter((o) => r(o) < 0);
    const sumaG = gan.reduce((s, o) => s + r(o), 0);
    const sumaP = per.reduce((s, o) => s + r(o), 0);
    const orden = [...cerradas].sort((a, b) => r(b) - r(a));
    const mercado = new Map();
    for (const o of cerradas)
        mercado.set(o.mercado, (mercado.get(o.mercado) ?? 0) + r(o));
    const bm = gan.length ? Math.round(sumaG / gan.length) : 0;
    const pm = per.length ? Math.round(sumaP / per.length) : 0;
    return {
        cerradas: cerradas.length,
        abiertas: ops.filter((o) => !o.cierre).length,
        neto: sumaG + sumaP + cerradas.filter((o) => r(o) === 0).reduce((s, o) => s + r(o), 0),
        ganadoras: gan.length,
        perdedoras: per.length,
        aciertos: cerradas.length ? gan.length / cerradas.length : null,
        beneficioMedio: bm,
        perdidaMedia: pm,
        ratio: bm && pm ? bm / Math.abs(pm) : null,
        factor: sumaP ? sumaG / Math.abs(sumaP) : null,
        mejor: orden[0] && r(orden[0]) > 0 ? orden[0] : null,
        peor: orden.length && r(orden[orden.length - 1]) < 0 ? orden[orden.length - 1] : null,
        comisiones: cerradas.reduce((s, o) => s + o.comisiones, 0),
        porMercado: [...mercado].sort((a, b) => b[1] - a[1]),
    };
}
