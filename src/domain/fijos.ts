import type { Movimiento, Recurrente } from './tipos';

/** Lo que supone un ingreso o gasto fijo en un mes: semanal ×52/12, anual ÷12 (céntimos). */
export function equivalenteMensual(r: Pick<Recurrente, 'importe' | 'frecuencia'>): number {
  if (r.frecuencia === 'mensual') return r.importe;
  if (r.frecuencia === 'semanal') return Math.round((r.importe * 52) / 12);
  return Math.round(r.importe / 12);
}

export interface ResumenFijos {
  ingresos: number; // al mes
  gastos: number; // al mes
  libre: number; // ingresos fijos − gastos fijos: lo que queda para el día a día
}

/** Suma los fijos activos (los pausados no cuentan). */
export function resumenFijos(recurrentes: Recurrente[]): ResumenFijos {
  let ingresos = 0;
  let gastos = 0;
  for (const r of recurrentes) {
    if (!r.activo) continue;
    if (r.tipo === 'ingreso') ingresos += equivalenteMensual(r);
    else gastos += equivalenteMensual(r);
  }
  return { ingresos, gastos, libre: ingresos - gastos };
}

/** Separa los gastos de un periodo en fijos (vienen de un recurrente) y variables (apuntados a mano). */
export function gastosFijosYVariables(movs: Movimiento[]): { fijos: number; variables: number } {
  let fijos = 0;
  let variables = 0;
  for (const m of movs) {
    if (m.tipo !== 'gasto') continue;
    if (m.recurrenteId) fijos += m.importe;
    else variables += m.importe;
  }
  return { fijos, variables };
}
