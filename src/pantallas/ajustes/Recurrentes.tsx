import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDatos } from '../../contexto';
import { Hoja } from '../../components/Hoja';
import { CampoImporte } from '../../components/Selectores';
import { aCentimos } from '../../domain/dinero';
import { fechaCorta, fechasPendientes, hoyISO, siguienteFecha } from '../../domain/fechas';
import type { Frecuencia, Recurrente } from '../../domain/tipos';
import { db } from '../../db/db';
import { generarRecurrentes, guardarRecurrente } from '../../db/acciones';
import { parseISO } from 'date-fns';

const FREC: Record<Frecuencia, string> = { semanal: 'Cada semana', mensual: 'Cada mes', anual: 'Cada año' };

function proxima(r: Recurrente) {
  if (!r.ultimaGeneracion) return r.inicio;
  return siguienteFecha(r.ultimaGeneracion, r.frecuencia, parseISO(r.inicio).getDate());
}

export function Recurrentes() {
  const { categoriaPorId, dinero } = useDatos();
  const recurrentes = useLiveQuery(() => db.recurrentes.toArray(), [], []);
  const [editando, setEditando] = useState<Recurrente | 'nuevo' | null>(null);

  const mensual = recurrentes
    .filter((r) => r.activo && r.tipo === 'gasto')
    .reduce((s, r) => s + (r.frecuencia === 'mensual' ? r.importe : r.frecuencia === 'semanal' ? Math.round((r.importe * 52) / 12) : Math.round(r.importe / 12)), 0);

  return (
    <>
      <p className="texto-2 text-sm">Se apuntan solos en su fecha (al abrir la app) o, si eliges «Solo recordármelo», los marcas tú como pagados en la pestaña Pagos.</p>
      {mensual > 0 && (
        <div className="tarjeta p-4">
          <p className="texto-2 text-xs">Gastos fijos al mes (aprox.)</p>
          <p className="importe text-2xl font-bold">{dinero(mensual)}</p>
        </div>
      )}
      {recurrentes.length > 0 && (
        <div className="tarjeta divide-y overflow-hidden">
          {recurrentes.map((r) => {
            const c = r.categoriaId ? categoriaPorId.get(r.categoriaId) : undefined;
            return (
              <button key={r.id} className="flex w-full items-center gap-3 px-4 py-3 text-left" style={{ borderColor: 'var(--borde)', opacity: r.activo ? 1 : 0.5 }} onClick={() => setEditando(r)}>
                <span className="text-xl">{c?.icono ?? '🔁'}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{r.nota || c?.nombre}</span>
                  <span className="texto-2 text-xs">
                    {FREC[r.frecuencia]} · {!r.activo ? 'Pausado' : r.automatico === false ? '🔔 Recordatorio' : `próximo ${fechaCorta(proxima(r))}`}
                  </span>
                </span>
                <span className="importe font-semibold" style={{ color: r.tipo === 'ingreso' ? 'var(--color-ingreso)' : undefined }}>
                  {r.tipo === 'ingreso' ? dinero(r.importe, { signo: true }) : dinero(-r.importe)}
                </span>
              </button>
            );
          })}
        </div>
      )}
      <button className="boton boton-primario" onClick={() => setEditando('nuevo')}>
        + Nuevo recurrente
      </button>
      {editando && <FormRecurrente r={editando === 'nuevo' ? undefined : editando} onCerrar={() => setEditando(null)} />}
    </>
  );
}

export function FormRecurrente({ r, onCerrar, inicioInicial }: { r?: Recurrente; onCerrar: () => void; inicioInicial?: string }) {
  const { categorias, cuentas, ajustes, avisar } = useDatos();
  const [tipo, setTipo] = useState<'gasto' | 'ingreso'>(r?.tipo ?? 'gasto');
  const [valor, setValor] = useState(r ? (r.importe / 100).toString().replace('.', ',') : '');
  const [categoriaId, setCategoriaId] = useState(r?.categoriaId ?? '');
  const [cuentaId, setCuentaId] = useState(r?.cuentaId ?? ajustes.ultimaCuentaId ?? cuentas[0]?.id ?? '');
  const [nota, setNota] = useState(r?.nota ?? '');
  const [frecuencia, setFrecuencia] = useState<Frecuencia>(r?.frecuencia ?? 'mensual');
  const [inicio, setInicio] = useState(r?.inicio ?? inicioInicial ?? hoyISO());
  const [automatico, setAutomatico] = useState(r?.automatico ?? true);
  const cats = categorias.filter((c) => c.tipo === tipo);
  const pendientes = !r && automatico ? fechasPendientes(inicio, undefined, frecuencia, hoyISO()).length : 0;

  async function guardar() {
    await guardarRecurrente({ ...r, tipo, importe: aCentimos(valor), categoriaId: categoriaId || undefined, cuentaId, nota: nota.trim() || undefined, frecuencia, inicio, activo: r?.activo ?? true, automatico,
      // Al pasar a automático, no rellenar el pasado ya gestionado a mano
      ultimaGeneracion: r?.ultimaGeneracion ?? (r && r.automatico === false && automatico ? hoyISO() : undefined) });
    const n = await generarRecurrentes();
    if (n) avisar(`${n} movimiento${n > 1 ? 's' : ''} añadido${n > 1 ? 's' : ''}`);
    onCerrar();
  }

  return (
    <Hoja titulo={r ? 'Editar recurrente' : 'Nuevo recurrente'} onCerrar={onCerrar}>
      <div className="flex flex-col gap-3 px-5 pb-5">
        <div className="flex gap-2">
          {(['gasto', 'ingreso'] as const).map((t) => (
            <button
              key={t}
              className="chip flex-1"
              aria-pressed={tipo === t}
              onClick={() => {
                setTipo(t);
                setCategoriaId('');
              }}
            >
              {t === 'gasto' ? 'Gasto' : 'Ingreso'}
            </button>
          ))}
        </div>
        <input className="campo" placeholder="Nombre (ej. Alquiler, Netflix, Nómina)" value={nota} onChange={(e) => setNota(e.target.value)} />
        <CampoImporte valor={valor} onCambio={setValor} placeholder="Importe" />
        <select className="campo" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
          <option value="">Categoría…</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icono} {c.nombre}
            </option>
          ))}
        </select>
        {cuentas.length > 1 && (
          <select className="campo" value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icono} {c.nombre}
              </option>
            ))}
          </select>
        )}
        <div className="flex gap-2">
          {(Object.keys(FREC) as Frecuencia[]).map((f) => (
            <button key={f} className="chip flex-1" aria-pressed={frecuencia === f} onClick={() => setFrecuencia(f)}>
              {FREC[f]}
            </button>
          ))}
        </div>
        <label className="text-sm">
          <span className="texto-2">{frecuencia === 'mensual' ? 'Primer pago (se repite ese mismo día cada mes)' : 'Primer pago'}</span>
          <input type="date" className="campo mt-1" value={inicio} onChange={(e) => e.target.value && setInicio(e.target.value)} disabled={!!r?.ultimaGeneracion} />
        </label>
        <div className="flex flex-col gap-2 text-sm">
          <span className="texto-2">Cuando llegue el día…</span>
          <button className="chip text-left" aria-pressed={automatico} onClick={() => setAutomatico(true)}>
            ⚡ Apuntarlo solo como {tipo === 'gasto' ? 'gasto' : 'ingreso'}
          </button>
          <button className="chip text-left" aria-pressed={!automatico} onClick={() => setAutomatico(false)}>
            🔔 Solo recordármelo (lo marco yo como pagado)
          </button>
        </div>
        {pendientes > 0 && (
          <p className="text-xs" style={{ color: 'var(--color-marca)' }}>
            Se apuntarán ahora {pendientes} movimiento{pendientes > 1 ? 's' : ''} hasta hoy.
          </p>
        )}
        <button className="boton boton-primario" disabled={aCentimos(valor) <= 0 || !cuentaId || !categoriaId} onClick={guardar}>
          Guardar
        </button>
        {r && (
          <div className="flex gap-2">
            <button
              className="boton boton-secundario flex-1"
              onClick={async () => {
                // Al reactivar, no rellenar el hueco del periodo pausado
                const cambios: Partial<Recurrente> = { activo: !r.activo };
                if (!r.activo) {
                  const pend = fechasPendientes(r.inicio, r.ultimaGeneracion, r.frecuencia, hoyISO());
                  if (pend.length) cambios.ultimaGeneracion = pend[pend.length - 1];
                }
                await db.recurrentes.update(r.id, cambios);
                onCerrar();
              }}
            >
              {r.activo ? 'Pausar' : 'Reanudar'}
            </button>
            <button
              className="boton boton-secundario flex-1"
              style={{ color: 'var(--color-gasto)' }}
              onClick={async () => {
                if (!confirm('¿Eliminar este recurrente? Los movimientos ya apuntados se conservan.')) return;
                await db.recurrentes.delete(r.id);
                onCerrar();
              }}
            >
              Eliminar
            </button>
          </div>
        )}
      </div>
    </Hoja>
  );
}
