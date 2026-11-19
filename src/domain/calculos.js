export function enPeriodo(m, p) {
    return m.fecha >= p.inicio && m.fecha <= p.fin;
}
/** Las transferencias no cuentan ni como ingreso ni como gasto. */
export function resumen(movs) {
    let ingresos = 0;
    let gastos = 0;
    for (const m of movs) {
        if (m.tipo === 'ingreso')
            ingresos += m.importe;
        else if (m.tipo === 'gasto')
            gastos += m.importe;
    }
    return { ingresos, gastos, balance: ingresos - gastos };
}
export function saldosCuentas(cuentas, movs) {
    const saldos = new Map(cuentas.map((c) => [c.id, c.saldoInicial]));
    const sumar = (id, v) => {
        if (id && saldos.has(id))
            saldos.set(id, saldos.get(id) + v);
    };
    for (const m of movs) {
        if (m.tipo === 'ingreso')
            sumar(m.cuentaId, m.importe);
        else if (m.tipo === 'gasto')
            sumar(m.cuentaId, -m.importe);
        else {
            sumar(m.cuentaId, -m.importe);
            sumar(m.cuentaDestinoId, m.importe);
        }
    }
    return saldos;
}
export function totalesPorCategoria(movs, tipo) {
    const t = new Map();
    for (const m of movs) {
        if (m.tipo !== tipo)
            continue;
        const k = m.categoriaId ?? 'sin';
        t.set(k, (t.get(k) ?? 0) + m.importe);
    }
    return t;
}
export function progresoPresupuestos(presupuestos, movsPeriodo) {
    const porCat = totalesPorCategoria(movsPeriodo, 'gasto');
    const total = resumen(movsPeriodo).gastos;
    return presupuestos.map((p) => {
        const gastado = p.categoriaId === null ? total : porCat.get(p.categoriaId) ?? 0;
        const porcentaje = p.importe > 0 ? gastado / p.importe : 0;
        return {
            presupuesto: p,
            gastado,
            restante: p.importe - gastado,
            porcentaje,
            estado: porcentaje > 1 ? 'superado' : porcentaje >= 0.8 ? 'aviso' : 'ok',
        };
    });
}
/** Agrupa movimientos por fecha (descendente) con el neto del día. */
export function agruparPorDia(movs) {
    const grupos = new Map();
    const ordenados = [...movs].sort((a, b) => (a.fecha === b.fecha ? b.creadoEn.localeCompare(a.creadoEn) : b.fecha.localeCompare(a.fecha)));
    for (const m of ordenados) {
        const g = grupos.get(m.fecha);
        if (g)
            g.push(m);
        else
            grupos.set(m.fecha, [m]);
    }
    return [...grupos.entries()].map(([fecha, items]) => {
        const r = resumen(items);
        return { fecha, items, neto: r.balance };
    });
}
/** Sugiere la categoría más usada para una nota parecida. */
export function sugerirCategoria(nota, historial) {
    const n = nota.trim().toLowerCase();
    if (n.length < 3)
        return undefined;
    const cuenta = new Map();
    for (const m of historial) {
        if (!m.categoriaId || !m.nota)
            continue;
        if (m.nota.toLowerCase().includes(n))
            cuenta.set(m.categoriaId, (cuenta.get(m.categoriaId) ?? 0) + 1);
    }
    let mejor;
    let max = 0;
    for (const [k, v] of cuenta)
        if (v > max)
            [mejor, max] = [k, v];
    return mejor;
}
/** Racha: días consecutivos (terminando hoy o ayer) con al menos un movimiento creado. */
export function racha(fechas, hoy, restarDia) {
    let d = fechas.has(hoy) ? hoy : restarDia(hoy);
    let n = 0;
    while (fechas.has(d)) {
        n++;
        d = restarDia(d);
    }
    return n;
}
