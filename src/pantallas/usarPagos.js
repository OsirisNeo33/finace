import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useDatos } from '../contexto';
import { hoyISO, ocurrenciasEnRango } from '../domain/fechas';
import { crearMovimiento } from '../db/acciones';
/** Pagos recurrentes (suscripciones, recibos, nómina…) que tocan entre dos fechas. */
export function usarPagos(desde, hasta) {
    const { movimientos } = useDatos();
    const recurrentes = useLiveQuery(() => db.recurrentes.toArray(), [], []);
    const pagos = useMemo(() => {
        const hoy = hoyISO();
        const porClave = new Map();
        for (const m of movimientos)
            if (m.recurrenteId)
                porClave.set(`${m.recurrenteId}|${m.fecha}`, m);
        const lista = [];
        for (const r of recurrentes) {
            if (!r.activo)
                continue;
            for (const fecha of ocurrenciasEnRango(r.inicio, r.frecuencia, desde, hasta)) {
                const movimiento = porClave.get(`${r.id}|${fecha}`);
                let estado;
                if (movimiento)
                    estado = 'pagado';
                else if (r.automatico !== false)
                    estado = fecha <= hoy ? 'pagado' : 'pendiente';
                else
                    estado = fecha < hoy ? 'vencido' : fecha === hoy ? 'hoy' : 'pendiente';
                lista.push({ clave: `${r.id}|${fecha}`, recurrente: r, fecha, estado, movimiento });
            }
        }
        return lista.sort((a, b) => a.fecha.localeCompare(b.fecha) || b.recurrente.importe - a.recurrente.importe);
    }, [recurrentes, movimientos, desde, hasta]);
    return { pagos, recurrentes };
}
export async function marcarPagado(p) {
    const r = p.recurrente;
    return crearMovimiento({ tipo: r.tipo, importe: r.importe, fecha: p.fecha, cuentaId: r.cuentaId, categoriaId: r.categoriaId, nota: r.nota, etiquetas: [], recurrenteId: r.id });
}
