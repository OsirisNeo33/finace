import type { TipoCuenta } from './tipos';

export interface Entidad {
  nombre: string;
  tipo: TipoCuenta;
  icono: string;
  color: string;
}

/** Bancos y entidades habituales para rellenar el nombre con un toque. */
export const ENTIDADES: Entidad[] = [
  { nombre: 'BBVA', tipo: 'banco', icono: '🏦', color: '#1d4ed8' },
  { nombre: 'Santander', tipo: 'banco', icono: '🏦', color: '#dc2626' },
  { nombre: 'CaixaBank', tipo: 'banco', icono: '🏦', color: '#0284c7' },
  { nombre: 'Sabadell', tipo: 'banco', icono: '🏦', color: '#0891b2' },
  { nombre: 'Bankinter', tipo: 'banco', icono: '🏦', color: '#ea580c' },
  { nombre: 'ING', tipo: 'banco', icono: '🏦', color: '#f97316' },
  { nombre: 'Openbank', tipo: 'banco', icono: '🏦', color: '#e11d48' },
  { nombre: 'Revolut', tipo: 'banco', icono: '💳', color: '#334155' },
  { nombre: 'N26', tipo: 'banco', icono: '💳', color: '#0d9488' },
  { nombre: 'Unicaja', tipo: 'banco', icono: '🏦', color: '#16a34a' },
  { nombre: 'Abanca', tipo: 'banco', icono: '🏦', color: '#2563eb' },
  { nombre: 'Kutxabank', tipo: 'banco', icono: '🏦', color: '#15803d' },
  { nombre: 'Ibercaja', tipo: 'banco', icono: '🏦', color: '#1e40af' },
  { nombre: 'Cajamar', tipo: 'banco', icono: '🏦', color: '#65a30d' },
  { nombre: 'imagin', tipo: 'banco', icono: '💳', color: '#06b6d4' },
  { nombre: 'Wise', tipo: 'banco', icono: '💳', color: '#84cc16' },
  { nombre: 'PayPal', tipo: 'banco', icono: '💳', color: '#1e3a8a' },
  { nombre: 'MyInvestor', tipo: 'ahorro', icono: '📈', color: '#7c3aed' },
  { nombre: 'Trade Republic', tipo: 'ahorro', icono: '📈', color: '#0f172a' },
];

/**
 * El usuario escribe el saldo que ve hoy en su banco. Ajustamos el saldo inicial
 * para que, sumando los movimientos ya apuntados, el saldo actual sea ese.
 * Así no se crean movimientos falsos que alteren los gastos o ingresos.
 */
export function saldoInicialPara(saldoDeseado: number, saldoActual: number, saldoInicial: number): number {
  return saldoInicial + (saldoDeseado - saldoActual);
}
