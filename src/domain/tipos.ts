export type TipoMovimiento = 'gasto' | 'ingreso' | 'transferencia';
export type TipoCategoria = 'gasto' | 'ingreso';
export type TipoCuenta = 'efectivo' | 'banco' | 'tarjeta' | 'ahorro';
export type Frecuencia = 'semanal' | 'mensual' | 'anual';

export interface Cuenta {
  id: string;
  nombre: string;
  tipo: TipoCuenta;
  saldoInicial: number; // céntimos
  color: string;
  icono: string;
  orden: number;
  archivada: boolean;
}

export interface Categoria {
  id: string;
  nombre: string;
  tipo: TipoCategoria;
  icono: string;
  color: string;
  orden: number;
  archivada: boolean;
}

export interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  importe: number; // céntimos, siempre > 0
  fecha: string; // yyyy-mm-dd
  cuentaId: string;
  cuentaDestinoId?: string;
  categoriaId?: string;
  nota?: string;
  etiquetas: string[];
  recurrenteId?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Recurrente {
  id: string;
  tipo: 'gasto' | 'ingreso';
  importe: number;
  cuentaId: string;
  categoriaId?: string;
  nota?: string;
  frecuencia: Frecuencia;
  inicio: string; // primera fecha
  ultimaGeneracion?: string; // última fecha generada
  activo: boolean;
  /** false = solo recordatorio: aparece en el calendario de pagos y lo marcas tú como pagado. */
  automatico?: boolean;
}

export interface Presupuesto {
  id: string;
  categoriaId: string | null; // null = global
  importe: number;
}

export interface Ajustes {
  id: 'ajustes';
  moneda: string;
  diaInicioMes: number; // 1..28
  tema: 'sistema' | 'claro' | 'oscuro';
  ultimaCuentaId?: string;
  configurado: boolean;
}
