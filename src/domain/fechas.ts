import { addDays, addMonths, addWeeks, addYears, format, parseISO, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Frecuencia } from './tipos';

export const aISO = (d: Date) => format(d, 'yyyy-MM-dd');
export const hoyISO = () => aISO(new Date());

export interface Periodo {
  inicio: string; // inclusive
  fin: string; // inclusive
  etiqueta: string;
}

/**
 * Periodo "mensual" que contiene la fecha de referencia, con un día de inicio personalizado.
 * Ej.: diaInicio 25 → del 25 de un mes al 24 del siguiente. Se etiqueta con el mes en que termina
 * (si cobras el 25 de octubre, ese dinero es "para noviembre").
 */
export function periodoDe(referencia: Date, diaInicio = 1, desplazamiento = 0): Periodo {
  const dia = Math.min(Math.max(1, diaInicio), 28);
  let inicio = new Date(referencia.getFullYear(), referencia.getMonth(), dia);
  if (referencia.getDate() < dia) inicio = addMonths(inicio, -1);
  inicio = addMonths(inicio, desplazamiento);
  const finExclusivo = addMonths(inicio, 1);
  const fin = addDays(finExclusivo, -1);
  const mesEtiqueta = dia === 1 ? inicio : fin;
  const etiqueta = format(mesEtiqueta, 'MMMM yyyy', { locale: es });
  return { inicio: aISO(inicio), fin: aISO(fin), etiqueta: etiqueta[0].toUpperCase() + etiqueta.slice(1) };
}

export function diasRestantes(periodo: Periodo, hoy = hoyISO()): number {
  if (hoy > periodo.fin) return 0;
  const desde = hoy < periodo.inicio ? periodo.inicio : hoy;
  return differenceInCalendarDays(parseISO(periodo.fin), parseISO(desde)) + 1;
}

export function siguienteFecha(fecha: string, frecuencia: Frecuencia, diaAncla: number): string {
  const d = parseISO(fecha);
  if (frecuencia === 'semanal') return aISO(addWeeks(d, 1));
  if (frecuencia === 'anual') return aISO(addYears(d, 1));
  // mensual: respeta el día ancla (31 → último día del mes si no existe)
  const sig = addMonths(new Date(d.getFullYear(), d.getMonth(), 1), 1);
  const ultimo = new Date(sig.getFullYear(), sig.getMonth() + 1, 0).getDate();
  return aISO(new Date(sig.getFullYear(), sig.getMonth(), Math.min(diaAncla, ultimo)));
}

/** Fechas pendientes de generar para un recurrente hasta "hasta" (inclusive). */
export function fechasPendientes(inicio: string, ultima: string | undefined, frecuencia: Frecuencia, hasta: string): string[] {
  const ancla = parseISO(inicio).getDate();
  const res: string[] = [];
  let f = ultima ? siguienteFecha(ultima, frecuencia, ancla) : inicio;
  while (f <= hasta && res.length < 500) {
    res.push(f);
    f = siguienteFecha(f, frecuencia, ancla);
  }
  return res;
}

export function fechaLarga(iso: string): string {
  const hoy = hoyISO();
  if (iso === hoy) return 'Hoy';
  if (iso === aISO(addDays(new Date(), -1))) return 'Ayer';
  const d = parseISO(iso);
  const mismoAnio = d.getFullYear() === new Date().getFullYear();
  const t = format(d, mismoAnio ? "EEEE, d 'de' MMMM" : "EEEE, d 'de' MMMM yyyy", { locale: es });
  return t[0].toUpperCase() + t.slice(1);
}

export function fechaCorta(iso: string): string {
  return format(parseISO(iso), 'd MMM', { locale: es });
}

export function mesCorto(iso: string): string {
  return format(parseISO(iso), 'MMM', { locale: es });
}
