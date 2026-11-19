import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { Cobro, Movimiento } from './tipos';

export interface DevolucionVista {
  fecha: string;
  importe: number;
  comoIngreso: boolean;
}

/** Devoluciones de un cobro: ingresos ligados (se pueden deshacer) y las apuntadas sin ingreso. */
export function devolucionesDe(c: Cobro, movimientos: Movimiento[]): DevolucionVista[] {
  const ligadas = movimientos.filter((m) => m.tipo === 'ingreso' && m.cobroId === c.id).map((m) => ({ fecha: m.fecha, importe: m.importe, comoIngreso: true }));
  return [...ligadas, ...c.devoluciones.map((d) => ({ fecha: d.fecha, importe: d.importe, comoIngreso: false }))].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/** Lo que aún te debe por este concepto. */
export function pendienteCobro(c: Cobro, movimientos: Movimiento[]): number {
  if (c.saldado) return 0;
  return Math.max(0, c.importe - devolucionesDe(c, movimientos).reduce((s, d) => s + d.importe, 0));
}

export interface Persona {
  nombre: string;
  pendiente: number;
  cobros: (Cobro & { pendiente: number })[]; // con algo pendiente, del más antiguo al más reciente
  desde: string; // fecha del cobro pendiente más antiguo
  dias: number; // días desde entonces
}

/** Agrupa lo pendiente por persona (sin distinguir mayúsculas), de quien más te debe a quien menos. */
export function porPersona(cobros: Cobro[], movimientos: Movimiento[], hoy = new Date()): Persona[] {
  const grupos = new Map<string, Persona>();
  for (const c of cobros) {
    const pendiente = pendienteCobro(c, movimientos);
    if (pendiente <= 0) continue;
    const clave = c.persona.trim().toLowerCase();
    const g = grupos.get(clave) ?? { nombre: c.persona.trim(), pendiente: 0, cobros: [], desde: c.fecha, dias: 0 };
    g.pendiente += pendiente;
    g.cobros.push({ ...c, pendiente });
    if (c.fecha < g.desde) g.desde = c.fecha;
    grupos.set(clave, g);
  }
  return [...grupos.values()]
    .map((g) => ({ ...g, cobros: g.cobros.sort((a, b) => a.fecha.localeCompare(b.fecha)), dias: Math.max(0, differenceInCalendarDays(hoy, parseISO(g.desde))) }))
    .sort((a, b) => b.pendiente - a.pendiente);
}

/** Mensaje amable para recordar a alguien lo que te debe. */
export function mensajeRecordatorio(p: Persona, dinero: (c: number) => string): string {
  const nombre = p.nombre.split(/\s+/)[0];
  const lineas = p.cobros.map((c) => `• ${c.concepto}: ${dinero(c.pendiente)}`);
  return p.cobros.length === 1
    ? `¡Hola, ${nombre}! 😊 Te recuerdo que tienes pendiente ${dinero(p.pendiente)} de «${p.cobros[0].concepto}». Cuando puedas, ¡gracias!`
    : `¡Hola, ${nombre}! 😊 Te paso lo que tienes pendiente:\n${lineas.join('\n')}\nTotal: ${dinero(p.pendiente)}. Cuando puedas, ¡gracias!`;
}
