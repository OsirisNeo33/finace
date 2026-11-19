import { useEffect, useMemo, useState } from 'react';
import { addDays } from 'date-fns';
import { useDatos } from '../contexto';
import { Hoja } from './Hoja';
import { IconoBorrar, IconoCalendario, IconoCerrar, IconoPapelera } from './Iconos';
import { Button, Card, ChipButton, Field, FieldRow, Label, Panel, Segmented, SelectField, cx } from './ui';
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

  const colorImporte = tipo === 'ingreso' ? 'text-success' : 'text-text';
  const textoImporte = texto ? texto.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '0';
  const simbolo = dinero(0).replace(/[\d.,\s]/g, '');
  const tocarCategoria = (id: string) => {
    setCategoriaId(id);
    if (!existente) guardar(id);
  };

  return (
    <Hoja onCerrar={cerrarEditor}>
      <div className="space-y-3 px-4 pt-4 pb-3">
        {/* Tipo */}
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <Segmented
              label="Tipo de movimiento"
              value={tipo}
              onChange={(t) => {
                setTipo(t);
                setCategoriaId(undefined);
                setError('');
              }}
              options={TIPOS.map((t) => ({
                value: t.id,
                label:
                  t.id === 'transferencia' ? (
                    <>
                      <span className="min-[375px]:hidden">Traspaso</span>
                      <span className="hidden min-[375px]:inline">Transferencia</span>
                    </>
                  ) : (
                    t.nombre
                  ),
              }))}
            />
          </div>
          <button type="button" className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted active:scale-95" onClick={cerrarEditor} aria-label="Cerrar">
            <IconoCerrar width={20} height={20} />
          </button>
        </div>

        {/* Importe */}
        <Card className="py-3 text-center">
          <Label>{tipo === 'gasto' ? 'Gasto' : tipo === 'ingreso' ? 'Ingreso' : 'Transferencia'}</Label>
          <div className="@container">
            <div className={cx('num leading-tight font-semibold whitespace-nowrap', texto ? colorImporte : 'text-muted')} style={{ fontSize: `min(40px, ${(100 / (Math.max(textoImporte.length + 2, 4) * 0.63)).toFixed(2)}cqi)` }} data-testid="importe">
              <span key={textoImporte} className="anim-tecla inline-block">{textoImporte}</span>{' '}
              <span style={{ fontSize: '0.65em' }}>{simbolo}</span>
            </div>
          </div>
          <div className="h-5 text-[13px] font-medium text-danger" role="alert">
            {error}
          </div>
        </Card>

        {/* Fecha + cuenta + detalles */}
        <div className="sin-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <ChipButton active={fecha === hoy} onClick={() => setFecha(hoy)}>
            Hoy
          </ChipButton>
          <ChipButton active={fecha === ayer} onClick={() => setFecha(ayer)}>
            Ayer
          </ChipButton>
          <label className={cx('relative inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[14px] font-medium whitespace-nowrap', fecha !== hoy && fecha !== ayer ? 'border-transparent bg-brand-soft text-brand' : 'border-border bg-surface')}>
            <IconoCalendario width={16} height={16} /> {fecha !== hoy && fecha !== ayer ? <span className="num">{fechaCorta(fecha)}</span> : 'Otra'}
            <input type="date" className="absolute inset-0 opacity-0" value={fecha} max="2100-12-31" onChange={(e) => e.target.value && setFecha(e.target.value)} aria-label="Elegir fecha" />
          </label>
          {cuentas.length > 1 && tipo !== 'transferencia' && (
            <label className="relative inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-[14px] font-medium whitespace-nowrap">
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
          <ChipButton active={verDetalles} onClick={() => setVerDetalles((v) => !v)}>
            Nota{repetir !== 'no' ? ' · se repite' : ''}
          </ChipButton>
        </div>

        {verDetalles && (
          <Panel>
            <Field label="Nota" placeholder="Nota (usa #etiqueta para agrupar, ej. #viaje)" value={nota} onChange={(e) => setNota(e.target.value)} maxLength={140} />
            {sugerida && sugerida !== categoriaId && tipo !== 'transferencia' && (
              <div className="px-1">
                <ChipButton active onClick={() => (existente ? setCategoriaId(sugerida) : tocarCategoria(sugerida))}>
                  ¿{cats.find((c) => c.id === sugerida)?.icono} {cats.find((c) => c.id === sugerida)?.nombre}?
                </ChipButton>
              </div>
            )}
            {!existente && tipo !== 'transferencia' && (
              <div className="space-y-1.5 px-1 pb-1">
                <p className="px-2 text-[12px] font-medium text-muted">Repetir</p>
                <Segmented
                  label="Repetir"
                  value={repetir}
                  onChange={setRepetir}
                  options={(['no', 'semanal', 'mensual', 'anual'] as const).map((r) => ({ value: r, label: r === 'no' ? 'No' : r[0].toUpperCase() + r.slice(1) }))}
                />
              </div>
            )}
          </Panel>
        )}

        {/* Transferencia */}
        {tipo === 'transferencia' && (
          <Panel footer={cuentas.length < 2 ? 'Necesitas al menos dos cuentas. Créalas en Ajustes → Cuentas.' : undefined}>
            <FieldRow>
              <SelectField label="Desde" value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icono} {c.nombre}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Hacia" value={destinoId} onChange={(e) => setDestinoId(e.target.value)}>
                <option value="">Elige…</option>
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icono} {c.nombre}
                  </option>
                ))}
              </SelectField>
            </FieldRow>
          </Panel>
        )}

        {/* Categorías: un toque guarda */}
        {tipo !== 'transferencia' && (
          <Panel title={existente ? 'Categoría' : 'Toca una categoría para guardar'}>
            <div className="grid grid-cols-4 gap-1 min-[375px]:grid-cols-5">
              {cats.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={cx('flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-[16px] border px-0.5 py-1.5 transition active:scale-95', categoriaId === c.id ? 'border-brand bg-brand-soft' : 'border-border bg-surface')}
                  onClick={() => tocarCategoria(c.id)}
                >
                  <span className="text-[21px] leading-none">{c.icono}</span>
                  <span className={cx('w-full truncate text-center text-[11px] leading-tight font-medium', categoriaId === c.id && 'text-brand')}>{c.nombre}</span>
                </button>
              ))}
            </div>
          </Panel>
        )}

        {/* Teclado */}
        <div className="grid grid-cols-3 gap-1.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'borrar'].map((t) => (
            <button
              key={t}
              type="button"
              className="num flex min-h-12 items-center justify-center rounded-2xl border border-border bg-surface text-[22px] font-medium transition active:scale-95 active:bg-surface-2"
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
              <Button variant="danger" className="px-4" onClick={eliminar} aria-label="Eliminar">
                <IconoPapelera />
              </Button>
            )}
            <Button className="flex-1" onClick={() => guardar()} disabled={importe <= 0}>
              Guardar
            </Button>
          </div>
        )}
      </div>
    </Hoja>
  );
}
