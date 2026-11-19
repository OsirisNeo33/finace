import Dexie, { type EntityTable } from 'dexie';
import type { Ajustes, Categoria, Cuenta, Deuda, Inversion, Movimiento, Presupuesto, Recurrente } from '../domain/tipos';

export const db = new Dexie('finace') as Dexie & {
  cuentas: EntityTable<Cuenta, 'id'>;
  categorias: EntityTable<Categoria, 'id'>;
  movimientos: EntityTable<Movimiento, 'id'>;
  recurrentes: EntityTable<Recurrente, 'id'>;
  presupuestos: EntityTable<Presupuesto, 'id'>;
  ajustes: EntityTable<Ajustes, 'id'>;
  deudas: EntityTable<Deuda, 'id'>;
  inversiones: EntityTable<Inversion, 'id'>;
};

db.version(1).stores({
  cuentas: 'id, orden',
  categorias: 'id, tipo, orden',
  movimientos: 'id, fecha, tipo, cuentaId, categoriaId, recurrenteId',
  recurrentes: 'id',
  presupuestos: 'id, categoriaId',
  ajustes: 'id',
});

// v2: deudas e inversiones. A quien ya usaba la app se le añade la categoría para las cuotas.
db.version(2)
  .stores({ deudas: 'id', inversiones: 'id' })
  .upgrade(async (tx) => {
    const cats = tx.table<Categoria, string>('categorias');
    const gastos = await cats.where('tipo').equals('gasto').toArray();
    if (gastos.length && !gastos.some((c) => c.nombre === CATEGORIA_DEUDAS)) {
      await cats.add({ id: crypto.randomUUID(), nombre: CATEGORIA_DEUDAS, icono: '💳', color: '#64748b', tipo: 'gasto', orden: gastos.length, archivada: false });
    }
  });

export const nuevoId = () => crypto.randomUUID();

/** Categoría de gasto para las cuotas de préstamos y deudas. */
export const CATEGORIA_DEUDAS = 'Deudas y préstamos';
export const ahora = () => new Date().toISOString();

export const AJUSTES_POR_DEFECTO: Ajustes = {
  id: 'ajustes',
  moneda: 'EUR',
  diaInicioMes: 1,
  tema: 'sistema',
  configurado: false,
};

type SemillaCat = [nombre: string, icono: string, color: string];

const GASTOS: SemillaCat[] = [
  ['Supermercado', '🛒', '#16a34a'],
  ['Restaurantes', '🍽️', '#ea580c'],
  ['Transporte', '🚌', '#2563eb'],
  ['Vivienda', '🏠', '#7c3aed'],
  ['Facturas', '💡', '#ca8a04'],
  ['Salud', '💊', '#dc2626'],
  ['Ocio', '🎬', '#db2777'],
  ['Compras', '🛍️', '#9333ea'],
  ['Suscripciones', '📺', '#0891b2'],
  ['Educación', '📚', '#4f46e5'],
  ['Regalos', '🎁', '#e11d48'],
  ['Viajes', '✈️', '#0d9488'],
  ['Mascotas', '🐾', '#a16207'],
  [CATEGORIA_DEUDAS, '💳', '#64748b'],
  ['Café', '☕', '#92400e'],
  ['Otros', '📦', '#64748b'],
];
const INGRESOS: SemillaCat[] = [
  ['Nómina', '💼', '#059669'],
  ['Freelance', '💻', '#0284c7'],
  ['Ventas', '🏷️', '#d97706'],
  ['Regalos', '🎁', '#e11d48'],
  ['Intereses', '📈', '#65a30d'],
  ['Otros', '💰', '#64748b'],
];

export function categoriasSemilla(): Categoria[] {
  const mk = (tipo: 'gasto' | 'ingreso') => ([nombre, icono, color]: SemillaCat, orden: number): Categoria => ({
    id: nuevoId(),
    nombre,
    icono,
    color,
    tipo,
    orden,
    archivada: false,
  });
  return [...GASTOS.map(mk('gasto')), ...INGRESOS.map(mk('ingreso'))];
}
