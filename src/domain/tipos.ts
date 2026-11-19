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
  /** Pago de una deuda registrado desde Finanzas → Deudas. */
  deudaId?: string;
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
  // Gamificación
  logrosVistos?: string[];
  nivelVisto?: number;
  copias?: number;
}

export type TipoDeuda = 'prestamo' | 'hipoteca' | 'tarjeta' | 'aplazamiento' | 'coche' | 'estudios' | 'personal' | 'otro';

/** Pago registrado sin apuntarlo como gasto (los que sí son gasto se leen de los movimientos). */
export interface PagoDeuda {
  fecha: string; // yyyy-mm-dd
  importe: number; // céntimos
  creadoEn: string;
}

/** Préstamo, hipoteca, tarjeta, aplazamiento o dinero que debes a alguien. */
export interface Deuda {
  id: string;
  nombre: string;
  tipo: TipoDeuda;
  acreedor?: string; // banco, tienda o persona
  importeInicial: number; // céntimos
  /** Lo que debías en `baseEn`; lo pendiente hoy = esto − pagos registrados después (ver pendienteActual). */
  pendiente: number;
  baseEn: string; // ISO
  cuota: number; // pago mensual (céntimos)
  tae: number; // % anual (ej. 7.5); 0 si no tiene intereses
  diaPago?: number;
  recurrenteId?: string; // gasto fijo creado para la cuota
  pagos: PagoDeuda[];
  notas?: string;
  saldada: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export type TipoInversion = 'fondo' | 'etf' | 'acciones' | 'cripto' | 'pension' | 'deposito' | 'inmueble' | 'otro';

export interface Inversion {
  id: string;
  nombre: string;
  tipo: TipoInversion;
  plataforma?: string;
  aportado: number; // dinero que has metido (céntimos)
  valor: number; // valor actual (céntimos)
  notas?: string;
  creadoEn: string;
  actualizadoEn: string;
}
