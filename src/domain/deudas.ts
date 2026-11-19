import { addMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Deuda, Movimiento, TipoDeuda } from './tipos';

export const TIPOS_DEUDA: Record<TipoDeuda, { nombre: string; icono: string; ayuda: string }> = {
  prestamo: { nombre: 'Préstamo personal', icono: '🏦', ayuda: 'Préstamo de un banco o financiera' },
  hipoteca: { nombre: 'Hipoteca', icono: '🏠', ayuda: 'Préstamo de tu vivienda' },
  tarjeta: { nombre: 'Tarjeta de crédito', icono: '💳', ayuda: 'Lo que debes en la tarjeta (revolving, aplazado…)' },
  aplazamiento: { nombre: 'Pago a plazos', icono: '🛍️', ayuda: 'Compras financiadas o aplazadas (móvil, muebles, Klarna…)' },
  coche: { nombre: 'Coche', icono: '🚗', ayuda: 'Financiación o renting del coche' },
  estudios: { nombre: 'Estudios', icono: '🎓', ayuda: 'Préstamo para estudios o un máster' },
  personal: { nombre: 'A un familiar o amigo', icono: '🤝', ayuda: 'Dinero que te prestó alguien' },
  otro: { nombre: 'Otra deuda', icono: '📄', ayuda: 'Cualquier otro pago pendiente' },
};

/** Deuda cara: a partir de este TAE conviene liquidarla antes que ahorrar o invertir. */
export const TAE_CARA = 10;

export interface Proyeccion {
  meses: number;
  intereses: number; // céntimos que pagarás en intereses desde hoy
  fin: string; // "marzo de 2029"
}

/**
 * Simula la amortización mes a mes (sistema francés: cuota fija, interés sobre lo pendiente).
 * Devuelve null si la cuota no llega a cubrir los intereses (la deuda nunca se acabaría).
 */
export function proyectar(pendiente: number, cuota: number, tae: number, hoy = new Date()): Proyeccion | null {
  if (pendiente <= 0) return { meses: 0, intereses: 0, fin: format(hoy, "MMMM 'de' yyyy", { locale: es }) };
  if (cuota <= 0) return null;
  const r = tae / 100 / 12;
  if (pendiente * r >= cuota) return null;
  let saldo = pendiente;
  let intereses = 0;
  let meses = 0;
  while (saldo > 0 && meses < 1200) {
    const i = saldo * r;
    intereses += i;
    saldo = saldo + i - cuota;
    meses++;
  }
  return { meses, intereses: Math.round(intereses), fin: format(addMonths(hoy, meses), "MMMM 'de' yyyy", { locale: es }) };
}

export interface PagoVisto {
  fecha: string;
  importe: number;
  comoGasto: boolean;
}

/** Pagos hechos después de fijar lo pendiente: gastos ligados (cuota fija o pago registrado) y pagos sin gasto. */
export function pagosDeDeuda(d: Deuda, movimientos: Movimiento[]): PagoVisto[] {
  const ligados = movimientos.filter((m) => m.tipo === 'gasto' && m.creadoEn > d.baseEn && (m.deudaId === d.id || (!!d.recurrenteId && m.recurrenteId === d.recurrenteId)));
  return [...ligados.map((m) => ({ fecha: m.fecha, importe: m.importe, comoGasto: true })), ...d.pagos.filter((p) => p.creadoEn > d.baseEn).map((p) => ({ fecha: p.fecha, importe: p.importe, comoGasto: false }))].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/** Lo que queda por pagar hoy. Al deshacer un pago (borrar su gasto) vuelve a subir solo. */
export function pendienteActual(d: Deuda, movimientos: Movimiento[]): number {
  return Math.max(0, d.pendiente - pagosDeDeuda(d, movimientos).reduce((s, p) => s + p.importe, 0));
}

/** Deudas con lo pendiente ya calculado, sin las saldadas. */
export function deudasActivas(deudas: Deuda[], movimientos: Movimiento[] = []): Deuda[] {
  return deudas.filter((d) => !d.saldada).map((d) => ({ ...d, pendiente: pendienteActual(d, movimientos) })).filter((d) => d.pendiente > 0);
}

/** Método avalancha: primero la de mayor interés (es la que más dinero te cuesta); a igualdad, la más pequeña. */
export function ordenAvalancha(deudas: Deuda[]): Deuda[] {
  return [...deudas].sort((a, b) => b.tae - a.tae || a.pendiente - b.pendiente);
}

/** Porcentaje ya pagado (0–1) respecto al importe inicial. */
export const progresoDeuda = (d: Deuda) => (d.importeInicial > 0 ? Math.min(1, Math.max(0, (d.importeInicial - d.pendiente) / d.importeInicial)) : 0);

/** "1 año y 4 meses", "8 meses" */
export function duracion(meses: number): string {
  const a = Math.floor(meses / 12);
  const m = meses % 12;
  const partes = [a ? `${a} ${a === 1 ? 'año' : 'años'}` : '', m ? `${m} ${m === 1 ? 'mes' : 'meses'}` : ''].filter(Boolean);
  return partes.join(' y ') || 'menos de un mes';
}
