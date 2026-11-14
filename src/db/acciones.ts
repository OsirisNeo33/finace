import { db, nuevoId, ahora, AJUSTES_POR_DEFECTO, categoriasSemilla } from './db';
import type { Ajustes, Cuenta, Movimiento, Recurrente } from '../domain/tipos';
import { fechasPendientes, hoyISO } from '../domain/fechas';

export async function leerAjustes(): Promise<Ajustes> {
  return (await db.ajustes.get('ajustes')) ?? AJUSTES_POR_DEFECTO;
}

export async function guardarAjustes(cambios: Partial<Ajustes>) {
  const actual = await leerAjustes();
  await db.ajustes.put({ ...actual, ...cambios, id: 'ajustes' });
}

export async function configurarInicial(moneda: string, cuentas: Omit<Cuenta, 'id' | 'orden' | 'archivada'>[]) {
  await db.transaction('rw', db.cuentas, db.categorias, db.ajustes, async () => {
    const creadas = cuentas.map((c, i) => ({ ...c, id: nuevoId(), orden: i, archivada: false }));
    await db.cuentas.bulkAdd(creadas);
    if ((await db.categorias.count()) === 0) await db.categorias.bulkAdd(categoriasSemilla());
    await guardarAjustes({ moneda, configurado: true, ultimaCuentaId: creadas[0]?.id });
  });
}

export type NuevoMovimiento = Omit<Movimiento, 'id' | 'creadoEn' | 'actualizadoEn'>;

export async function crearMovimiento(m: NuevoMovimiento): Promise<string> {
  const id = nuevoId();
  const t = ahora();
  await db.movimientos.add({ ...m, id, creadoEn: t, actualizadoEn: t });
  await guardarAjustes({ ultimaCuentaId: m.cuentaId });
  return id;
}

export async function actualizarMovimiento(id: string, m: NuevoMovimiento) {
  const previo = await db.movimientos.get(id);
  if (!previo) return;
  await db.movimientos.put({ ...m, id, creadoEn: previo.creadoEn, actualizadoEn: ahora() });
}

export async function borrarMovimiento(id: string): Promise<Movimiento | undefined> {
  const m = await db.movimientos.get(id);
  await db.movimientos.delete(id);
  return m;
}

export async function restaurarMovimiento(m: Movimiento) {
  await db.movimientos.put(m);
}

/** Genera los movimientos recurrentes pendientes hasta hoy. Devuelve cuántos se crearon. */
export async function generarRecurrentes(hoy = hoyISO()): Promise<number> {
  let creados = 0;
  await db.transaction('rw', db.recurrentes, db.movimientos, async () => {
    const recs = await db.recurrentes.toArray();
    for (const r of recs) {
      if (!r.activo) continue;
      const fechas = fechasPendientes(r.inicio, r.ultimaGeneracion, r.frecuencia, hoy);
      if (!fechas.length) continue;
      const t = ahora();
      await db.movimientos.bulkAdd(
        fechas.map((fecha) => ({
          id: nuevoId(),
          tipo: r.tipo,
          importe: r.importe,
          fecha,
          cuentaId: r.cuentaId,
          categoriaId: r.categoriaId,
          nota: r.nota,
          etiquetas: [],
          recurrenteId: r.id,
          creadoEn: t,
          actualizadoEn: t,
        })),
      );
      await db.recurrentes.update(r.id, { ultimaGeneracion: fechas[fechas.length - 1] });
      creados += fechas.length;
    }
  });
  return creados;
}

export async function guardarRecurrente(r: Omit<Recurrente, 'id'> & { id?: string }) {
  await db.recurrentes.put({ ...r, id: r.id ?? nuevoId() });
}

// ---------- Copias de seguridad ----------

export interface Copia {
  app: 'finace';
  version: 1;
  exportadoEn: string;
  datos: {
    cuentas: unknown[];
    categorias: unknown[];
    movimientos: unknown[];
    recurrentes: unknown[];
    presupuestos: unknown[];
    ajustes: unknown[];
  };
}

export async function exportarJSON(): Promise<Copia> {
  return {
    app: 'finace',
    version: 1,
    exportadoEn: ahora(),
    datos: {
      cuentas: await db.cuentas.toArray(),
      categorias: await db.categorias.toArray(),
      movimientos: await db.movimientos.toArray(),
      recurrentes: await db.recurrentes.toArray(),
      presupuestos: await db.presupuestos.toArray(),
      ajustes: await db.ajustes.toArray(),
    },
  };
}

export async function importarJSON(copia: Copia) {
  if (copia?.app !== 'finace' || !copia.datos) throw new Error('El archivo no es una copia de seguridad de Finace.');
  const d = copia.datos;
  await db.transaction('rw', [db.cuentas, db.categorias, db.movimientos, db.recurrentes, db.presupuestos, db.ajustes], async () => {
    await borrarTablas();
    await db.cuentas.bulkAdd((d.cuentas ?? []) as never[]);
    await db.categorias.bulkAdd((d.categorias ?? []) as never[]);
    await db.movimientos.bulkAdd((d.movimientos ?? []) as never[]);
    await db.recurrentes.bulkAdd((d.recurrentes ?? []) as never[]);
    await db.presupuestos.bulkAdd((d.presupuestos ?? []) as never[]);
    await db.ajustes.bulkAdd((d.ajustes ?? []) as never[]);
  });
}

async function borrarTablas() {
  await Promise.all([db.cuentas.clear(), db.categorias.clear(), db.movimientos.clear(), db.recurrentes.clear(), db.presupuestos.clear(), db.ajustes.clear()]);
}

export async function borrarTodo() {
  await db.transaction('rw', [db.cuentas, db.categorias, db.movimientos, db.recurrentes, db.presupuestos, db.ajustes], borrarTablas);
}

const csvCelda = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function exportarCSV(): Promise<string> {
  const [movs, cuentas, cats] = await Promise.all([db.movimientos.orderBy('fecha').toArray(), db.cuentas.toArray(), db.categorias.toArray()]);
  const nc = new Map(cuentas.map((c) => [c.id, c.nombre]));
  const ncat = new Map(cats.map((c) => [c.id, c.nombre]));
  const filas = [['Fecha', 'Tipo', 'Importe', 'Categoría', 'Cuenta', 'Cuenta destino', 'Nota', 'Etiquetas']];
  for (const m of movs) {
    const signo = m.tipo === 'gasto' ? -1 : 1;
    filas.push([
      m.fecha,
      m.tipo,
      ((signo * m.importe) / 100).toFixed(2).replace('.', ','),
      m.categoriaId ? ncat.get(m.categoriaId) ?? '' : '',
      nc.get(m.cuentaId) ?? '',
      m.cuentaDestinoId ? nc.get(m.cuentaDestinoId) ?? '' : '',
      m.nota ?? '',
      m.etiquetas.join(' '),
    ]);
  }
  // BOM para que Excel abra bien los acentos; separador ; (configuración regional española)
  return '﻿' + filas.map((f) => f.map(csvCelda).join(';')).join('\n');
}

export function descargar(nombre: string, contenido: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
