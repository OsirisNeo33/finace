import { useEffect, useMemo, useState } from 'react';
import { addDays } from 'date-fns';
import { useDatos } from '../contexto';
import { Hoja } from './Hoja';
import { IconoBorrar, IconoPapelera } from './Iconos';
import { aCentimos, pulsarTecla } from '../domain/dinero';
import { aISO, hoyISO, fechaCorta } from '../domain/fechas';
import { sugerirCategoria } from '../domain/calculos';
import type { Frecuencia, Movimiento, TipoMovimiento } from '../domain/tipos';
import { actualizarMovimiento, borrarMovimiento, crearMovimiento, guardarRecurrente, restaurarMovimiento, type NuevoMovimiento } from '../db/acciones';
import { db } from '../db/db';

const TIPOS: { id: TipoMovimiento; nombre: string }[] = [
  { id: 'gasto', nombre: 'Gasto' },
  { id: 'ingreso', nombre: 'Ingreso' },
  { id: 'transferencia', nombre: 'Transferencia' },
];

const centimosATexto = (c: number) => {
  if (!c) return '';
  const e = Math.floor(c / 100);
  const d = c % 100;
  return d ? `${e},${String(d).padStart(2, '0').replace(/0$/, '')}` : String(e);
};

/** "Cena con Ana #viaje #amigos" → nota "Cena con Ana", etiquetas ["viaje","amigos"] */
function separarEtiquetas(texto: string) {
  const etiquetas = [...texto.matchAll(/#([\p{L}\p{N}_-]+)/gu)].map((m) => m[1].toLowerCase());
  const nota = texto.replace(/#[\p{L}\p{N}_-]+/gu, '').replace(/\s+/g, ' ').trim();
  return { nota, etiquetas: [...new Set(etiquetas)] };
}

export function Editor() {
  const { editor, cerrarEditor, cuentas, categorias, movimientos, ajustes, dinero, avisar, cuentaPorId } = useDatos();
  const inicial = editor.inicial;
  const existente = inicial && 'id' in inicial && inicial.id ? (inicial as Movimiento) : undefined;

  const [tipo, setTipo] = useState<TipoMovimiento>(inicial?.tipo ?? 'gasto');
  const [texto, setTexto] = useState(centimosATexto(inicial?.importe ?? 0));
  const [fecha, setFecha] = useState(inicial?.fecha ?? hoyISO());
  const cuentaPorDefecto = cuentas.find((c) => c.id === ajustes.ultimaCuentaId)?.id ?? cuentas[0]?.id ?? '';
  const [cuentaId, setCuentaId] = useState(inicial?.cuentaId ?? cuentaPorDefecto);
  const [destinoId, setDestinoId] = useState(inicial?.cuentaDestinoId ?? cuentas.find((c) => c.id !== (inicial?.cuentaId ?? cuentaPorDefecto))?.id ?? '');
  const [categoriaId, setCategoriaId] = useState(inicial?.categoriaId);
  const [nota, setNota] = useState([inicial?.nota, ...(inicial?.etiquetas ?? []).map((e) => '#' + e)].filter(Boolean).join(' '));
  const [repetir, setRepetir] = useState<'no' | Frecuencia>('no');
  const [verDetalles, setVerDetalles] = useState(Boolean(existente?.nota || existente?.etiquetas.length));
  const [error, setError] = useState('');

  const importe = aCentimos(texto);
  const hoy = hoyISO();
  const ayer = aISO(addDays(new Date(), -1));

  // Categorías del tipo actual, ordenadas por uso (las más usadas primero)
  const cats = useMemo(() => {
    if (tipo === 'transferencia') return [];
    const uso = new Map<string, number>();
    for (const m of movimientos) if (m.categoriaId) uso.set(m.categoriaId, (uso.get(m.categoriaId) ?? 0) + 1);
    return categorias.filter((c) => c.tipo === tipo).sort((a, b) => (uso.get(b.id) ?? 0) - (uso.get(a.id) ?? 0) || a.orden - b.orden);
  }, [categorias, movimientos, tipo]);

  const sugerida = useMemo(() => {
    const { nota: n } = separarEtiquetas(nota);
    const s = sugerirCategoria(n, movimientos);
    return s && cats.some((c) => c.id === s) ? s : undefined;
  }, [nota, movimientos, cats]);

  async function guardar(catId = categoriaId) {
    if (importe <= 0) return setError('Escribe un importe');
    if (!cuentaId) return setError('Crea una cuenta en Ajustes');
    if (tipo === 'transferencia' && (!destinoId || destinoId === cuentaId)) return setError('Elige dos cuentas distintas');
    const { nota: n, etiquetas } = separarEtiquetas(nota);
    const datos: NuevoMovimiento = {
      tipo,
      importe,
      fecha,
      cuentaId,
      cuentaDestinoId: tipo === 'transferencia' ? destinoId : undefined,
      categoriaId: tipo === 'transferencia' ? undefined : catId,
      nota: n || undefined,
      etiquetas,
      recurrenteId: existente?.recurrenteId,
    };
    if (existente) {
      await actualizarMovimiento(existente.id, datos);
      cerrarEditor();
      avisar('Movimiento actualizado');
      return;
    }
    if (repetir !== 'no' && tipo !== 'transferencia') {
      const recurrenteId = crypto.randomUUID();
      await guardarRecurrente({ id: recurrenteId, tipo, importe, cuentaId, categoriaId: catId, nota: n || undefined, frecuencia: repetir, inicio: fecha, ultimaGeneracion: fecha, activo: true });
      datos.recurrenteId = recurrenteId;
    }
    const primeroHoy = !movimientos.some((m) => !m.recurrenteId && aISO(new Date(m.creadoEn)) === hoy);
    const id = await crearMovimiento(datos);
    navigator.vibrate?.(15);
    cerrarEditor();
    const nombre = tipo === 'transferencia' ? 'Transferencia' : categorias.find((c) => c.id === catId)?.nombre ?? '';
    avisar(`${nombre} · ${dinero(importe)} guardado${datos.recurrenteId ? '' : ` · +${primeroHoy ? 15 : 5} XP`}`, {
      etiqueta: 'Deshacer',
      hacer: async () => {
        await db.movimientos.delete(id);
        if (datos.recurrenteId) await db.recurrentes.delete(datos.recurrenteId);
        avisar('Deshecho');
      },
    });
  }

  async function eliminar() {
    if (!existente) return;
    const borrado = await borrarMovimiento(existente.id);
    cerrarEditor();
    if (borrado) avisar('Movimiento eliminado', { etiqueta: 'Deshacer', hacer: () => restaurarMovimiento(borrado).then(() => avisar('Restaurado')) });
  }

  function tecla(t: string) {
    setError('');
    setTexto((x) => pulsarTecla(x, t));
  }

  // Teclado físico (escritorio)
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const enCampo = (e.target as HTMLElement)?.closest('input, select, textarea');
      if (enCampo) return;
      if (/^[0-9]$/.test(e.key)) tecla(e.key);
      else if (e.key === ',' || e.key === '.') tecla(',');
      else if (e.key === 'Backspace') tecla('borrar');
      else if (e.key === 'Enter' && (tipo === 'transferencia' || categoriaId)) guardar();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  });

  const colorImporte = tipo === 'gasto' ? 'var(--color-gasto)' : tipo === 'ingreso' ? 'var(--color-ingreso)' : 'var(--texto)';
  const tocarCategoria = (id: string) => {
    setCategoriaId(id);
    if (!existente) guardar(id);
  };

  return (
    <Hoja onCerrar={cerrarEditor}>
      <div className="flex flex-col gap-3 px-4 pt-4 pb-3">
        {/* Tipo */}
        <div className="flex items-center gap-2">
          <div className="flex flex-1 rounded-xl p-1" style={{ background: 'var(--superficie-2)' }} role="tablist">
            {TIPOS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tipo === t.id}
                className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition ${tipo === t.id ? 'shadow-sm' : 'texto-2'}`}
                style={tipo === t.id ? { background: 'var(--superficie)' } : undefined}
                onClick={() => {
                  setTipo(t.id);
                  setCategoriaId(undefined);
                  setError('');
                }}
              >
                {t.nombre}
              </button>
            ))}
          </div>
          <button className="texto-2 px-2 text-sm" onClick={cerrarEditor}>
            Cerrar
          </button>
        </div>

        {/* Importe */}
        <div className="text-center">
          <div className="importe text-5xl font-bold" style={{ color: texto ? colorImporte : 'var(--texto-2)' }} data-testid="importe">
            {texto ? `${texto.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ` : '0 '}
            <span className="text-3xl">{dinero(0).replace(/[\d.,\s]/g, '')}</span>
          </div>
          <div className="h-5 text-sm" style={{ color: 'var(--color-gasto)' }}>
            {error}
          </div>
        </div>

        {/* Fecha + cuenta + detalles */}
        <div className="sin-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <button className="chip" aria-pressed={fecha === hoy} onClick={() => setFecha(hoy)}>
            Hoy
          </button>
          <button className="chip" aria-pressed={fecha === ayer} onClick={() => setFecha(ayer)}>
            Ayer
          </button>
          <label className="chip relative cursor-pointer" aria-pressed={fecha !== hoy && fecha !== ayer}>
            📅 {fecha !== hoy && fecha !== ayer ? fechaCorta(fecha) : 'Otra'}
            <input type="date" className="absolute inset-0 opacity-0" value={fecha} max="2100-12-31" onChange={(e) => e.target.value && setFecha(e.target.value)} aria-label="Elegir fecha" />
          </label>
          {cuentas.length > 1 && tipo !== 'transferencia' && (
            <label className="chip relative">
              {cuentaPorId.get(cuentaId)?.icono} {cuentaPorId.get(cuentaId)?.nombre} ▾
              <select className="absolute inset-0 opacity-0" value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} aria-label="Cuenta">
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button className="chip" aria-pressed={verDetalles} onClick={() => setVerDetalles((v) => !v)}>
            ✏️ Nota{repetir !== 'no' ? ' · 🔁' : ''}
          </button>
        </div>

        {verDetalles && (
          <div className="flex flex-col gap-2">
            <input className="campo" placeholder="Nota (usa #etiqueta para agrupar, ej. #viaje)" value={nota} onChange={(e) => setNota(e.target.value)} maxLength={140} />
            {sugerida && sugerida !== categoriaId && tipo !== 'transferencia' && (
              <button className="chip self-start" onClick={() => (existente ? setCategoriaId(sugerida) : tocarCategoria(sugerida))}>
                ¿{cats.find((c) => c.id === sugerida)?.icono} {cats.find((c) => c.id === sugerida)?.nombre}?
              </button>
            )}
            {!existente && tipo !== 'transferencia' && (
              <div className="flex items-center gap-2 text-sm">
                <span className="texto-2">Repetir:</span>
                {(['no', 'semanal', 'mensual', 'anual'] as const).map((r) => (
                  <button key={r} className="chip" aria-pressed={repetir === r} onClick={() => setRepetir(r)}>
                    {r === 'no' ? 'No' : r[0].toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Transferencia */}
        {tipo === 'transferencia' && (
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm">
              <span className="texto-2">Desde</span>
              <select className="campo mt-1" value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icono} {c.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="texto-2">Hacia</span>
              <select className="campo mt-1" value={destinoId} onChange={(e) => setDestinoId(e.target.value)}>
                <option value="">Elige…</option>
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icono} {c.nombre}
                  </option>
                ))}
              </select>
            </label>
            {cuentas.length < 2 && <p className="texto-2 col-span-2 text-sm">Necesitas al menos dos cuentas. Créalas en Ajustes → Cuentas.</p>}
          </div>
        )}

        {/* Categorías: un toque guarda */}
        {tipo !== 'transferencia' && (
          <div>
            <p className="texto-2 mb-1 text-xs">{existente ? 'Categoría' : 'Toca una categoría para guardar'}</p>
            <div className="grid grid-cols-5 gap-1">
              {cats.map((c) => (
                <button
                  key={c.id}
                  className="flex flex-col items-center gap-1 rounded-xl py-1.5 active:scale-95"
                  style={categoriaId === c.id ? { background: c.color + '26', outline: `2px solid ${c.color}` } : undefined}
                  onClick={() => tocarCategoria(c.id)}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full text-xl" style={{ background: c.color + '22' }}>
                    {c.icono}
                  </span>
                  <span className="w-full truncate px-0.5 text-center text-[11px] leading-tight">{c.nombre}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Teclado */}
        <div className="grid grid-cols-3 gap-1.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'borrar'].map((t) => (
            <button
              key={t}
              className="importe flex h-12 items-center justify-center rounded-xl text-2xl font-medium active:scale-95"
              style={{ background: 'var(--superficie-2)' }}
              onClick={() => tecla(t)}
              aria-label={t === 'borrar' ? 'Borrar' : t}
            >
              {t === 'borrar' ? <IconoBorrar /> : t}
            </button>
          ))}
        </div>

        {(existente || tipo === 'transferencia') && (
          <div className="flex gap-2">
            {existente && (
              <button className="boton boton-secundario" style={{ color: 'var(--color-gasto)' }} onClick={eliminar} aria-label="Eliminar">
                <IconoPapelera />
              </button>
            )}
            <button className="boton boton-primario flex-1" onClick={() => guardar()} disabled={importe <= 0}>
              Guardar
            </button>
          </div>
        )}
      </div>
    </Hoja>
  );
}
