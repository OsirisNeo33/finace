import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDatos } from '../../contexto';
import { Hoja } from '../../components/Hoja';
import { Alerta, AmountField, Button, Card, Emoji, Field, FieldRow, Panel, Segmented, SelectField, Tile, TileButton, Toggle, cx } from '../../components/ui';
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
      {mensual > 0 && (
        <Card dark>
          <p className="text-[13px] text-white/60">Gastos fijos al mes (aprox.)</p>
          <p className="num mt-1 text-[34px] leading-tight font-semibold">{dinero(mensual)}</p>
        </Card>
      )}
      <Panel title="Tus recurrentes" detail={recurrentes.length ? <span className="num">{recurrentes.length}</span> : undefined} footer="Se apuntan solos en su fecha (al abrir la app) o, si los dejas como recordatorio, los marcas tú como pagados en la pestaña Pagos.">
        {recurrentes.length === 0 && (
          <Tile>
            <span className="text-[14px] text-muted">Aún no tienes ninguno. Añade tu nómina, el alquiler o tus suscripciones.</span>
          </Tile>
        )}
        {recurrentes.map((r) => {
          const c = r.categoriaId ? categoriaPorId.get(r.categoriaId) : undefined;
          return (
            <TileButton
              key={r.id}
              className={r.activo ? undefined : 'opacity-60'}
              icon={<Emoji>{c?.icono ?? '🔁'}</Emoji>}
              title={r.nota || c?.nombre}
              subtitle={`${FREC[r.frecuencia]} · ${!r.activo ? 'Pausado' : r.automatico === false ? 'Recordatorio' : `próximo ${fechaCorta(proxima(r))}`}`}
              detail={<span className={cx('num text-[15px] font-semibold', r.tipo === 'ingreso' ? 'text-success' : 'text-text')}>{r.tipo === 'ingreso' ? dinero(r.importe, { signo: true }) : dinero(-r.importe)}</span>}
              chevron
              onClick={() => setEditando(r)}
            />
          );
        })}
      </Panel>
      <Button className="w-full" onClick={() => setEditando('nuevo')}>
        + Nuevo recurrente
      </Button>
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
      <div className="space-y-3 px-4 pb-5">
        <Segmented
          label="Tipo"
          value={tipo}
          onChange={(t) => {
            setTipo(t);
            setCategoriaId('');
          }}
          options={[
            { value: 'gasto', label: 'Gasto' },
            { value: 'ingreso', label: 'Ingreso' },
          ]}
        />
        <Panel title="Datos">
          <Field label="Nombre" placeholder="Ej. Alquiler, Netflix, Nómina" value={nota} onChange={(e) => setNota(e.target.value)} />
          <FieldRow>
            <AmountField label="Importe" value={valor} onChange={setValor} />
            <SelectField label="Categoría" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
              <option value="">Elige…</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icono} {c.nombre}
                </option>
              ))}
            </SelectField>
          </FieldRow>
          {cuentas.length > 1 && (
            <SelectField label="Cuenta" value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icono} {c.nombre}
                </option>
              ))}
            </SelectField>
          )}
        </Panel>
        <Panel title="Cuándo">
          <Segmented label="Frecuencia" value={frecuencia} onChange={setFrecuencia} options={(Object.keys(FREC) as Frecuencia[]).map((f) => ({ value: f, label: FREC[f] }))} />
          <Field
            label="Primer pago"
            hint={frecuencia === 'mensual' ? 'Se repite ese mismo día cada mes.' : undefined}
            type="date"
            value={inicio}
            onChange={(e) => e.target.value && setInicio(e.target.value)}
            disabled={!!r?.ultimaGeneracion}
          />
          <Tile>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium">Apuntarlo automáticamente</span>
              <span className="block text-[13px] text-muted">{automatico ? `Se apunta solo como ${tipo === 'gasto' ? 'gasto' : 'ingreso'} el día que toca.` : 'Solo te lo recuerda: lo marcas tú como pagado.'}</span>
            </span>
            <Toggle checked={automatico} onChange={setAutomatico} label="Apuntarlo automáticamente" />
          </Tile>
        </Panel>
        {pendientes > 0 && (
          <Alerta tone="brand">
            Se apuntarán ahora {pendientes} movimiento{pendientes > 1 ? 's' : ''} hasta hoy.
          </Alerta>
        )}
        <Button className="w-full" disabled={aCentimos(valor) <= 0 || !cuentaId || !categoriaId} onClick={guardar}>
          Guardar
        </Button>
        {r && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
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
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!confirm('¿Eliminar este recurrente? Los movimientos ya apuntados se conservan.')) return;
                await db.recurrentes.delete(r.id);
                onCerrar();
              }}
            >
              Eliminar
            </Button>
          </div>
        )}
      </div>
    </Hoja>
  );
}
