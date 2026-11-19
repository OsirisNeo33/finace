import { useMemo, useState } from 'react';
import { useDatos } from '../../contexto';
import { db, nuevoId, ahora } from '../../db/db';
import { aCentimos } from '../../domain/dinero';
import { fechaCorta, hoyISO } from '../../domain/fechas';
import { MERCADOS, aNumero, desdePeriodo, estadisticas, rentabilidad, resultado, type PeriodoTrading } from '../../domain/trading';
import type { MercadoTrading, Operacion } from '../../domain/tipos';
import { Hoja } from '../../components/Hoja';
import { Alerta, AmountField, Button, Card, Chip, ChipButton, Cifra, DataTile, Emoji, EmptyState, Field, FieldRow, Panel, Segmented, SelectField, Tile, Toggle, cx } from '../../components/ui';
import { usarFinanzas } from '../usarFinanzas';

const PERIODOS: [PeriodoTrading, string][] = [
  ['mes', 'Este mes'],
  ['3m', '3 meses'],
  ['ano', 'Este año'],
  ['todo', 'Todo'],
];
const num = (x: number, d = 2) => x.toLocaleString('es-ES', { maximumFractionDigits: d });
const pctTexto = (x: number) => `${x > 0 ? '+' : ''}${num(x * 100, 1)} %`;

export function Trading() {
  const { dinero } = useDatos();
  const { operaciones } = usarFinanzas();
  const [periodo, setPeriodo] = useState<PeriodoTrading>('ano');
  const [form, setForm] = useState<{ op?: Operacion; cerrar?: boolean } | null>(null);
  const e = useMemo(() => estadisticas(operaciones, desdePeriodo(periodo)), [operaciones, periodo]);
  const abiertas = operaciones.filter((o) => !o.cierre).sort((a, b) => b.apertura.localeCompare(a.apertura));
  const cerradas = operaciones.filter((o) => o.cierre && o.cierre >= desdePeriodo(periodo)).sort((a, b) => b.cierre!.localeCompare(a.cierre!));

  return (
    <>
      <Card dark>
        <p className="text-[13px] text-white/60">Resultado del trading · {PERIODOS.find((p) => p[0] === periodo)![1].toLowerCase()}</p>
        <Cifra max={34} className={cx('mt-1', e.neto < 0 && 'text-danger')} data-testid="trading-neto">
          {dinero(e.neto, { signo: true })}
        </Cifra>
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-[14px]">
          <div className="flex justify-between gap-3">
            <span className="text-white/70">Operaciones cerradas</span>
            <span className="num font-semibold">{e.cerradas}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-white/70">Aciertos</span>
            <span className="num font-semibold" data-testid="trading-aciertos">
              {e.aciertos === null ? '—' : `${Math.round(e.aciertos * 100)} %`}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-white/70">Factor de beneficio</span>
            <span className="num font-semibold">{e.factor === null ? (e.ganadoras ? 'Sin pérdidas' : '—') : num(e.factor)}</span>
          </div>
        </div>
      </Card>

      <div className="sin-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {PERIODOS.map(([p, t]) => (
          <ChipButton key={p} active={periodo === p} onClick={() => setPeriodo(p)}>
            {t}
          </ChipButton>
        ))}
      </div>

      <Button className="w-full" onClick={() => setForm({})}>
        + Nueva operación
      </Button>

      {operaciones.length === 0 ? (
        <EmptyState icon="🕯️" title="Tu diario de trading está vacío">
          Apunta cada operación (o solo su resultado) y verás si de verdad ganas: aciertos, beneficio frente a pérdida, comisiones y resultado por mercado.
        </EmptyState>
      ) : (
        <>
          {abiertas.length > 0 && (
            <Panel title="Abiertas" detail={<span className="num">{abiertas.length}</span>}>
              {abiertas.map((o) => (
                <FilaOperacion key={o.id} o={o} onClick={() => setForm({ op: o, cerrar: true })} />
              ))}
            </Panel>
          )}

          <Panel title="Cerradas" detail={<span className="num">{cerradas.length}</span>}>
            {cerradas.length === 0 && (
              <Tile>
                <span className="text-[14px] text-muted">Ninguna cerrada en este periodo.</span>
              </Tile>
            )}
            {cerradas.slice(0, 30).map((o) => (
              <FilaOperacion key={o.id} o={o} onClick={() => setForm({ op: o })} />
            ))}
          </Panel>

          {e.cerradas > 0 && (
            <Panel title="Estadísticas" footer="Factor de beneficio = lo ganado ÷ lo perdido. Por encima de 1 ganas dinero; por encima de 1,5 es una estrategia sólida.">
              <DataTile label="Ganadoras / perdedoras" value={`${e.ganadoras} / ${e.perdedoras}`} mono />
              <DataTile label="Beneficio medio" value={dinero(e.beneficioMedio)} mono />
              <DataTile label="Pérdida media" value={dinero(e.perdidaMedia)} mono />
              <DataTile label="Ratio beneficio / pérdida" value={e.ratio === null ? '—' : num(e.ratio)} mono />
              {e.mejor && <DataTile label={`Mejor: ${e.mejor.activo}`} value={dinero(resultado(e.mejor)!, { signo: true })} mono />}
              {e.peor && <DataTile label={`Peor: ${e.peor.activo}`} value={dinero(resultado(e.peor)!, { signo: true })} mono />}
              <DataTile label="Comisiones pagadas" value={dinero(e.comisiones)} mono />
            </Panel>
          )}

          {e.porMercado.length > 1 && (
            <Panel title="Por mercado">
              {e.porMercado.map(([m, v]) => (
                <Tile key={m}>
                  <Emoji>{MERCADOS[m].icono}</Emoji>
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{MERCADOS[m].nombre}</span>
                  <Chip tone={v >= 0 ? 'success' : 'danger'} className="num">
                    {dinero(v, { signo: true })}
                  </Chip>
                </Tile>
              ))}
            </Panel>
          )}
        </>
      )}

      <p className="px-3 text-[13px] leading-snug text-muted">El trading es de alto riesgo: la mayoría de inversores minoristas que operan con CFD pierden dinero. Opera solo con dinero que puedas permitirte perder.</p>

      {form && <FormOperacion op={form.op} cerrar={form.cerrar} onCerrar={() => setForm(null)} />}
    </>
  );
}

function FilaOperacion({ o, onClick }: { o: Operacion; onClick: () => void }) {
  const { dinero } = useDatos();
  const r = resultado(o);
  const rent = rentabilidad(o);
  return (
    <button type="button" className="flex min-h-14 w-full items-center gap-3 rounded-[18px] border border-border bg-surface px-3.5 py-3 text-left transition active:scale-[0.99] active:bg-surface-2" onClick={onClick} aria-label={`${o.activo}${r === null ? ', abierta' : `: ${dinero(r, { signo: true })}`}`}>
      <Emoji>{MERCADOS[o.mercado].icono}</Emoji>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[15px] font-medium">{o.activo}</span>
          <span className={cx('shrink-0 rounded-md px-1.5 text-[11px] font-semibold', o.direccion === 'largo' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger')}>{o.direccion === 'largo' ? 'Largo' : 'Corto'}</span>
        </span>
        <span className="block truncate text-[13px] text-muted">
          <span className="num">{fechaCorta(o.cierre ?? o.apertura)}</span>
          {o.entrada !== undefined && o.cantidad !== undefined && (
            <span className="num">
              {' '}
              · {num(o.cantidad, 6)} × {num(o.entrada, 6)}
              {o.salida !== undefined ? ` → ${num(o.salida, 6)}` : ''}
            </span>
          )}
          {o.estrategia ? ` · ${o.estrategia}` : ''}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        {r === null ? (
          <Chip tone="brand">Abierta</Chip>
        ) : (
          <>
            <span className={cx('num text-[15px] font-semibold', r > 0 ? 'text-success' : r < 0 ? 'text-danger' : 'text-text')}>{dinero(r, { signo: true })}</span>
            {rent !== null && <span className="num text-[12px] text-muted">{pctTexto(rent)}</span>}
          </>
        )}
      </span>
    </button>
  );
}

function FormOperacion({ op, cerrar, onCerrar }: { op?: Operacion; cerrar?: boolean; onCerrar: () => void }) {
  const { dinero, avisar } = useDatos();
  const { inversiones } = usarFinanzas();
  const cuentas = inversiones.filter((i) => i.tipo === 'trading' || i.tipo === 'acciones' || i.tipo === 'cripto' || i.tipo === 'otro');
  const [activo, setActivo] = useState(op?.activo ?? '');
  const [mercado, setMercado] = useState<MercadoTrading>(op?.mercado ?? 'acciones');
  const [direccion, setDireccion] = useState<'largo' | 'corto'>(op?.direccion ?? 'largo');
  const [modo, setModo] = useState<'precios' | 'resultado'>(op?.resultadoManual !== undefined ? 'resultado' : 'precios');
  const [apertura, setApertura] = useState(op?.apertura ?? hoyISO());
  const [cerrada, setCerrada] = useState(Boolean(op?.cierre) || Boolean(cerrar));
  const [cierre, setCierre] = useState(op?.cierre ?? hoyISO());
  const [entrada, setEntrada] = useState(op?.entrada !== undefined ? num(op.entrada, 8) : '');
  const [salida, setSalida] = useState(op?.salida !== undefined ? num(op.salida, 8) : '');
  const [cantidad, setCantidad] = useState(op?.cantidad !== undefined ? num(op.cantidad, 8) : '');
  const [comisiones, setComisiones] = useState(op?.comisiones ? String(op.comisiones / 100).replace('.', ',') : '');
  const [manual, setManual] = useState(op?.resultadoManual !== undefined ? String(op.resultadoManual / 100).replace('.', ',') : '');
  const [estrategia, setEstrategia] = useState(op?.estrategia ?? '');
  const [cuentaId, setCuentaId] = useState(op?.inversionId ?? '');
  // Si solo tienes una cuenta de trading, elegirla por defecto en operaciones nuevas (cuando carguen los datos)
  const unica = !op && cuentas.length === 1 ? cuentas[0].id : '';
  const [autoElegida, setAutoElegida] = useState(false);
  if (unica && !autoElegida) {
    setAutoElegida(true);
    setCuentaId(unica);
  }
  const [aplicar, setAplicar] = useState(op ? op.aplicadoEnCuenta !== undefined : true);

  const borrador: Operacion = {
    id: op?.id ?? nuevoId(),
    activo: activo.trim().toUpperCase().slice(0, 20),
    mercado,
    direccion,
    apertura,
    cierre: cerrada ? cierre : undefined,
    entrada: modo === 'precios' ? aNumero(entrada) : undefined,
    salida: modo === 'precios' && cerrada ? aNumero(salida) : undefined,
    cantidad: modo === 'precios' ? aNumero(cantidad) : undefined,
    comisiones: aCentimos(comisiones),
    resultadoManual: modo === 'resultado' && cerrada ? aCentimos(manual) : undefined,
    inversionId: cuentaId || undefined,
    estrategia: estrategia.trim() || undefined,
    creadoEn: op?.creadoEn ?? ahora(),
    actualizadoEn: ahora(),
  };
  const r = resultado(borrador);
  const valido = borrador.activo && (modo === 'resultado' ? !cerrada || manual.trim() !== '' : borrador.entrada !== undefined && borrador.cantidad !== undefined && (!cerrada || borrador.salida !== undefined));

  /** Suma (o quita) un importe al valor de una cuenta de inversión. */
  const mover = async (id: string | undefined, delta: number) => {
    if (!id || !delta) return;
    const inv = await db.inversiones.get(id);
    if (inv) await db.inversiones.update(id, { valor: inv.valor + delta, actualizadoEn: ahora() });
  };

  async function guardar() {
    if (!valido) return;
    // Deshacer lo que esta operación sumó antes a su cuenta y volver a aplicarlo con los datos nuevos
    if (op?.aplicadoEnCuenta) await mover(op.inversionId, -op.aplicadoEnCuenta);
    const aplicado = aplicar && r !== null && borrador.inversionId ? r : undefined;
    if (aplicado) await mover(borrador.inversionId, aplicado);
    await db.operaciones.put({ ...borrador, aplicadoEnCuenta: aplicado });
    avisar(r === null ? `${borrador.activo} abierta` : `${borrador.activo}: ${dinero(r, { signo: true })}`);
    onCerrar();
  }

  return (
    <Hoja titulo={op ? (cerrar ? `Cerrar ${op.activo}` : op.activo) : 'Nueva operación'} onCerrar={onCerrar}>
      <div className="space-y-3 px-4 pb-5">
        <Panel title="Qué">
          <FieldRow>
            <Field label="Activo" value={activo} onChange={(e) => setActivo(e.target.value)} placeholder="AAPL, BTC, EUR/USD…" maxLength={20} autoFocus={!op} />
            <SelectField label="Mercado" value={mercado} onChange={(e) => setMercado(e.target.value as MercadoTrading)}>
              {(Object.keys(MERCADOS) as MercadoTrading[]).map((m) => (
                <option key={m} value={m}>
                  {MERCADOS[m].icono} {MERCADOS[m].nombre}
                </option>
              ))}
            </SelectField>
          </FieldRow>
          <Segmented
            label="Dirección"
            value={direccion}
            onChange={setDireccion}
            options={[
              { value: 'largo', label: 'Largo (compra)' },
              { value: 'corto', label: 'Corto (venta)' },
            ]}
          />
          <Field label="Estrategia o motivo (opcional)" value={estrategia} onChange={(e) => setEstrategia(e.target.value)} placeholder="Ej. rotura de resistencia, noticias…" maxLength={40} />
        </Panel>

        <Segmented
          label="Cómo apuntarla"
          value={modo}
          onChange={setModo}
          options={[
            { value: 'precios', label: 'Con precios' },
            { value: 'resultado', label: 'Solo resultado' },
          ]}
        />

        <Panel title="Apertura">
          <Field label="Fecha de apertura" type="date" value={apertura} max={hoyISO()} onChange={(e) => e.target.value && setApertura(e.target.value)} />
          {modo === 'precios' && (
            <FieldRow>
              <Field label="Precio de entrada" inputMode="decimal" className="num" value={entrada} onChange={(e) => setEntrada(e.target.value.replace(/[^\d.,]/g, ''))} placeholder="0,00" />
              <Field label="Cantidad" inputMode="decimal" className="num" value={cantidad} onChange={(e) => setCantidad(e.target.value.replace(/[^\d.,]/g, ''))} placeholder="Acciones, lotes…" />
            </FieldRow>
          )}
        </Panel>

        <Panel title="Cierre">
          <Tile>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium">Operación cerrada</span>
              <span className="block text-[13px] text-muted">{cerrada ? 'Ya has salido de la posición' : 'Sigue abierta: la cierras más tarde'}</span>
            </span>
            <Toggle checked={cerrada} onChange={setCerrada} label="Operación cerrada" />
          </Tile>
          {cerrada && (
            <>
              <Field label="Fecha de cierre" type="date" value={cierre} min={apertura} max={hoyISO()} onChange={(e) => e.target.value && setCierre(e.target.value)} />
              {modo === 'precios' ? (
                <FieldRow>
                  <Field label="Precio de salida" inputMode="decimal" className="num" value={salida} onChange={(e) => setSalida(e.target.value.replace(/[^\d.,]/g, ''))} placeholder="0,00" autoFocus={cerrar} />
                  <AmountField label="Comisiones" value={comisiones} onChange={setComisiones} />
                </FieldRow>
              ) : (
                <AmountField label="Resultado neto (en negativo si perdiste)" value={manual} onChange={setManual} hint="Lo que ganaste o perdiste ya con comisiones, como te lo indica tu bróker." />
              )}
            </>
          )}
        </Panel>

        {cuentas.length > 0 && (
          <Panel title="Cuenta">
            <SelectField label="Cuenta de trading (opcional)" value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
              <option value="">Ninguna</option>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                  {c.plataforma ? ` · ${c.plataforma}` : ''}
                </option>
              ))}
            </SelectField>
            {cuentaId && (
              <Tile>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium">Sumar el resultado a la cuenta</span>
                  <span className="block text-[13px] text-muted">Actualiza su valor al cerrar, sin tener que hacerlo a mano</span>
                </span>
                <Toggle checked={aplicar} onChange={setAplicar} label="Sumar el resultado a la cuenta" />
              </Tile>
            )}
          </Panel>
        )}

        {r !== null && (
          <Alerta tone={r >= 0 ? 'brand' : 'danger'}>
            Resultado: <b className="num">{dinero(r, { signo: true })}</b>
            {rentabilidad(borrador) !== null && <span className="num"> ({pctTexto(rentabilidad(borrador)!)})</span>}
          </Alerta>
        )}

        <Button className="w-full" onClick={guardar} disabled={!valido}>
          {cerrar ? 'Cerrar operación' : 'Guardar'}
        </Button>
        {op && (
          <Button
            variant="danger"
            className="w-full"
            onClick={async () => {
              if (!confirm(`¿Eliminar la operación de ${op.activo}?`)) return;
              if (op.aplicadoEnCuenta) await mover(op.inversionId, -op.aplicadoEnCuenta);
              await db.operaciones.delete(op.id);
              onCerrar();
            }}
          >
            Eliminar operación
          </Button>
        )}
      </div>
    </Hoja>
  );
}
