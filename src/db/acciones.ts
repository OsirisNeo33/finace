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
      if (!r.activo || r.automatico === false) continue;
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
    deudas?: unknown[];
    inversiones?: unknown[];
    cobros?: unknown[];
    operaciones?: unknown[];
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
      deudas: await db.deudas.toArray(),
      inversiones: await db.inversiones.toArray(),
      cobros: await db.cobros.toArray(),
      operaciones: await db.operaciones.toArray(),
    },
  };
}

export async function importarJSON(copia: Copia) {
  if (copia?.app !== 'finace' || !copia.datos) throw new Error('El archivo no es una copia de seguridad de Finace.');
  const d = copia.datos;
  await db.transaction('rw', [db.cuentas, db.categorias, db.movimientos, db.recurrentes, db.presupuestos, db.ajustes, db.deudas, db.inversiones, db.cobros, db.operaciones], async () => {
    await borrarTablas();
    await db.cuentas.bulkAdd((d.cuentas ?? []) as never[]);
    await db.categorias.bulkAdd((d.categorias ?? []) as never[]);
    await db.movimientos.bulkAdd((d.movimientos ?? []) as never[]);
    await db.recurrentes.bulkAdd((d.recurrentes ?? []) as never[]);
    await db.presupuestos.bulkAdd((d.presupuestos ?? []) as never[]);
    await db.ajustes.bulkAdd((d.ajustes ?? []) as never[]);
    await db.deudas.bulkAdd((d.deudas ?? []) as never[]);
    await db.inversiones.bulkAdd((d.inversiones ?? []) as never[]);
    await db.cobros.bulkAdd((d.cobros ?? []) as never[]);
    await db.operaciones.bulkAdd((d.operaciones ?? []) as never[]);
  });
}

async function borrarTablas() {
  await Promise.all([db.cuentas.clear(), db.categorias.clear(), db.movimientos.clear(), db.recurrentes.clear(), db.presupuestos.clear(), db.ajustes.clear(), db.deudas.clear(), db.inversiones.clear(), db.cobros.clear(), db.operaciones.clear()]);
}

export async function borrarTodo() {
  await db.transaction('rw', [db.cuentas, db.categorias, db.movimientos, db.recurrentes, db.presupuestos, db.ajustes, db.deudas, db.inversiones, db.cobros, db.operaciones], borrarTablas);
}

const csvCelda = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Exporta los movimientos a CSV (Excel); con `desde`/`hasta` (AAAA-MM-DD, incluidos) solo ese periodo. */
export async function exportarCSV(desde?: string, hasta?: string): Promise<string> {
  const [todos, cuentas, cats] = await Promise.all([db.movimientos.orderBy('fecha').toArray(), db.cuentas.toArray(), db.categorias.toArray()]);
  const movs = todos.filter((m) => (!desde || m.fecha >= desde) && (!hasta || m.fecha <= hasta));
  const nc = new Map(cuentas.map((c) => [c.id, c.nombre]));
  const ncat = new Map(cats.map((c) => [c.id, c.nombre]));
  const filas = [['Fecha', 'Tipo', 'Importe', 'Categoría', 'Cuenta', 'Cuenta destino', 'Nota', 'Etiquetas', 'Fijo']];
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
      m.recurrenteId ? 'Sí' : '',
    ]);
  }
  // BOM para que Excel abra bien los acentos; separador ; (configuración regional española)
  return '﻿' + filas.map((f) => f.map(csvCelda).join(';')).join('\n');
}

/** Guarda un archivo: en la web lo descarga; en la app de iPhone abre el menú Compartir (Guardar en Archivos, iCloud…). */
export async function descargar(nombre: string, contenido: string, tipo: string) {
  const { Capacitor } = await import('@capacitor/core');
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const { uri } = await Filesystem.writeFile({ path: nombre, data: contenido, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: nombre, url: uri });
    return;
  }
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Comparte un texto: en el iPhone abre el menú Compartir (WhatsApp, Mensajes…); si no, abre WhatsApp. */
export async function compartirTexto(texto: string) {
  const { Capacitor } = await import('@capacitor/core');
  if (Capacitor.isNativePlatform()) {
    const { Share } = await import('@capacitor/share');
    await Share.share({ text: texto });
    return;
  }
  if (navigator.share) {
    await navigator.share({ text: texto });
    return;
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
}
