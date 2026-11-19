import { useMemo, useState } from 'react';
import { addMonths, setDate } from 'date-fns';
import { useDatos } from '../../contexto';
import { db, nuevoId, ahora, CATEGORIA_DEUDAS } from '../../db/db';
import { crearMovimiento, guardarRecurrente } from '../../db/acciones';
import { aCentimos } from '../../domain/dinero';
import { aISO, fechaCorta, hoyISO } from '../../domain/fechas';
import { TAE_CARA, TIPOS_DEUDA, duracion, ordenAvalancha, pagosDeDeuda, pendienteActual, proyectar } from '../../domain/deudas';
import type { Deuda, TipoDeuda } from '../../domain/tipos';
import { Hoja } from '../../components/Hoja';
import { Alerta, AmountField, Button, Card, Chip, Cifra, DataTile, Emoji, EmptyState, Field, FieldRow, Panel, ProgressBar, SelectField, Tile, Toggle, cx } from '../../components/ui';
import { usarFinanzas } from '../usarFinanzas';

const aTexto = (c: number) => (c ? (c / 100).toFixed(2).replace('.', ',').replace(/,00$/, '') : '');
const taeTexto = (t: number) => `${t.toLocaleString('es-ES', { maximumFractionDigits: 2 })} %`;

export function Deudas() {
  const { movimientos, dinero } = useDatos();
  const { deudas, salud } = usarFinanzas();
  const [form, setForm] = useState<Deuda | 'nueva' | null>(null);
  const [abierta, setAbierta] = useState<string | null>(null);

  const conPendiente = useMemo(() => deudas.map((d) => ({ ...d, pendiente: pendienteActual(d, movimientos) })), [deudas, movimientos]);
  const activas = ordenAvalancha(conPendiente.filter((d) => !d.saldada && d.pendiente > 0));
  const saldadas = conPendiente.filter((d) => d.saldada || d.pendiente === 0);
  const c = salud.cifras;
  const pagado = activas.reduce((s, d) => s + Math.max(0, d.importeInicial - d.pendiente), 0);
  const elegida = deudas.find((d) => d.id === abierta);

  return (
    <>
      <Card dark>
        <p className="text-[13px] text-white/60">Debes en total</p>
        <Cifra max={34} className="mt-1" data-testid="deuda-total">
          {dinero(c.deudaTotal)}
        </Cifra>
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-[14px]">
          <div className="flex justify-between gap-3">
            <span className="text-white/70">Cuotas al mes</span>
            <span className="num font-semibold">{dinero(c.cuotas)}</span>
          </div>
          {c.ratioDeuda !== null && c.cuotas > 0 && (
            <div className="flex justify-between gap-3">
              <span className="text-white/70">De tus ingresos</span>
              <span className={cx('num font-semibold', c.ratioDeuda > 0.35 && 'text-danger')}>{Math.round(c.ratioDeuda * 100)} %</span>
            </div>
          )}
          {pagado > 0 && (
            <div className="flex justify-between gap-3">
              <span className="text-white/70">Ya pagado</span>
              <span className="num font-semibold">{dinero(pagado)}</span>
            </div>
          )}
        </div>
      </Card>

      <Button className="w-full" onClick={() => setForm('nueva')}>
        + Añadir deuda
      </Button>

      {activas.length === 0 ? (
        <EmptyState icon="🎉" title={deudas.length ? 'No te queda ninguna deuda' : 'Sin deudas apuntadas'}>
          Apunta préstamos, la hipoteca, lo que debes en la tarjeta, compras a plazos o dinero que te prestaron. Verás cuándo terminas y cuánto pagas de intereses.
        </EmptyState>
      ) : (
        <Panel title="Tus deudas" detail="en orden de pago" footer="Ordenadas por el método avalancha: si te sobra dinero, adelántalo a la primera de la lista. Es la que más intereses te cobra y así pagas menos en total.">
          {activas.map((d) => (
            <FilaDeuda key={d.id} d={d} onClick={() => setAbierta(d.id)} />
          ))}
        </Panel>
      )}

      {saldadas.length > 0 && (
        <Panel title="Saldadas" detail={<span className="num">{saldadas.length}</span>}>
          {saldadas.map((d) => (
            <FilaDeuda key={d.id} d={d} onClick={() => setAbierta(d.id)} />
          ))}
        </Panel>
      )}

      {elegida && <DetalleDeuda d={elegida} onCerrar={() => setAbierta(null)} onEditar={() => (setAbierta(null), setForm(elegida))} />}
      {form && <FormDeuda deuda={form === 'nueva' ? undefined : form} onCerrar={() => setForm(null)} />}
    </>
  );
}

function FilaDeuda({ d, onClick }: { d: Deuda; onClick: () => void }) {
  const { dinero } = useDatos();
  const t = TIPOS_DEUDA[d.tipo];
  const saldada = d.saldada || d.pendiente === 0;
  const p = saldada ? null : proyectar(d.pendiente, d.cuota, d.tae);
  const progreso = d.importeInicial > 0 ? Math.min(1, Math.max(0, (d.importeInicial - d.pendiente) / d.importeInicial)) : 0;
  return (
    <button type="button" className={cx('block w-full rounded-[18px] border border-border bg-surface px-3.5 py-3 text-left transition active:scale-[0.99] active:bg-surface-2', saldada && 'opacity-70')} onClick={onClick} aria-label={`${d.nombre}: ${dinero(d.pendiente)} pendientes`}>
      <span className="flex items-center gap-3">
        <Emoji>{t.icono}</Emoji>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium">{d.nombre}</span>
          <span className="block truncate text-[13px] text-muted">
            {d.cuota > 0 ? `${dinero(d.cuota)}/mes` : 'Sin cuota fija'} · {d.tae > 0 ? `${taeTexto(d.tae)} TAE` : 'sin intereses'}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className="num text-[15px] font-semibold">{dinero(d.pendiente)}</span>
          {saldada ? <Chip tone="success">Saldada</Chip> : d.tae >= TAE_CARA ? <Chip tone="danger">Cara</Chip> : null}
        </span>
      </span>
      {!saldada && (
        <>
          <span className="mt-2.5 block">
            <ProgressBar value={progreso} tone="success" />
          </span>
          <span className={cx('mt-1.5 block text-[12px]', p ? 'text-muted' : 'text-danger')}>
            {p ? `Terminas en ${p.fin} (${duracion(p.meses)})${p.intereses > 0 ? ` · intereses ≈ ${dinero(p.intereses)}` : ''}` : d.cuota > 0 ? 'La cuota no cubre los intereses: así no se acaba nunca' : 'Pon una cuota para ver cuándo terminas'}
          </span>
        </>
      )}
    </button>
  );
}

function DetalleDeuda({ d, onCerrar, onEditar }: { d: Deuda; onCerrar: () => void; onEditar: () => void }) {
  const { movimientos, dinero, categorias, cuentas, ajustes, avisar } = useDatos();
  const pendiente = pendienteActual(d, movimientos);
  const pagos = pagosDeDeuda(d, movimientos);
  const p = proyectar(pendiente, d.cuota, d.tae);
  const [importe, setImporte] = useState(aTexto(Math.min(d.cuota || pendiente, pendiente)));
  const [comoGasto, setComoGasto] = useState(true);
  const t = TIPOS_DEUDA[d.tipo];
  const categoriaId = categorias.find((c) => c.nombre === CATEGORIA_DEUDAS)?.id;
  const cuentaId = cuentas.find((c) => c.id === ajustes.ultimaCuentaId)?.id ?? cuentas[0]?.id;
  const progreso = d.importeInicial > 0 ? Math.min(1, Math.max(0, (d.importeInicial - pendiente) / d.importeInicial)) : 0;

  async function registrarPago() {
    const c = aCentimos(importe);
    if (c <= 0) return;
    if (comoGasto && cuentaId) {
      const id = await crearMovimiento({ tipo: 'gasto', importe: c, fecha: hoyISO(), cuentaId, categoriaId, nota: `Pago ${d.nombre}`, etiquetas: [], deudaId: d.id });
      avisar(`Pago de ${dinero(c)} registrado`, { etiqueta: 'Deshacer', hacer: () => db.movimientos.delete(id) });
    } else {
      const pago = { fecha: hoyISO(), importe: c, creadoEn: ahora() };
      await db.deudas.update(d.id, { pagos: [...d.pagos, pago], actualizadoEn: ahora() });
      avisar(`Pago de ${dinero(c)} registrado`, { etiqueta: 'Deshacer', hacer: () => db.deudas.update(d.id, { pagos: d.pagos }) });
    }
    if (c >= pendiente) {
      await db.deudas.update(d.id, { saldada: true });
      avisar(`¡«${d.nombre}» saldada! 🎉`);
      onCerrar();
    }
  }

  async function crearFijo() {
    if (!cuentaId) return;
    const hoy = new Date();
    const dia = d.diaPago ?? hoy.getDate();
    let inicio = setDate(hoy, Math.min(dia, 28));
    if (aISO(inicio) <= hoyISO()) inicio = addMonths(inicio, 1);
    const recurrenteId = nuevoId();
    await guardarRecurrente({ id: recurrenteId, tipo: 'gasto', importe: d.cuota, cuentaId, categoriaId, nota: `Cuota ${d.nombre}`, frecuencia: 'mensual', inicio: aISO(inicio), activo: true, automatico: true });
    await db.deudas.update(d.id, { recurrenteId, actualizadoEn: ahora() });
    avisar(`Cuota añadida a tus gastos fijos (día ${inicio.getDate()})`);
  }

  return (
    <Hoja titulo={`${t.icono} ${d.nombre}`} onCerrar={onCerrar}>
      <div className="space-y-3 px-4 pb-5">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-muted">Te queda por pagar</p>
              <Cifra max={34} className="mt-1" data-testid="deuda-pendiente">
                {dinero(pendiente)}
              </Cifra>
            </div>
            {d.saldada || pendiente === 0 ? <Chip tone="success">Saldada</Chip> : d.tae >= TAE_CARA ? <Chip tone="danger">Deuda cara</Chip> : <Chip tone="brand">En curso</Chip>}
          </div>
          {d.importeInicial > 0 && (
            <div className="mt-3">
              <ProgressBar value={progreso} tone="success" />
              <p className="num mt-1.5 text-[12px] text-muted">
                Pagado {Math.round(progreso * 100)} % de {dinero(d.importeInicial)}
              </p>
            </div>
          )}
        </Card>

        {pendiente > 0 && !d.saldada && (
          <Alerta tone={p ? 'brand' : 'danger'}>
            {p ? (
              <>
                Con {dinero(d.cuota)} al mes terminas en <b>{p.fin}</b> ({duracion(p.meses)}).
                {p.intereses > 0 && (
                  <>
                    {' '}
                    Pagarás unos <b className="num">{dinero(p.intereses)}</b> de intereses.
                  </>
                )}
              </>
            ) : d.cuota > 0 ? (
              'Tu cuota no llega a cubrir los intereses: la deuda no baja. Intenta pagar más cada mes o renegociarla.'
            ) : (
              'Añade la cuota mensual (en «Editar») para saber cuándo terminas.'
            )}
          </Alerta>
        )}

        <Panel title="Datos">
          <DataTile label="Tipo" value={t.nombre} />
          {d.acreedor && <DataTile label="Con" value={d.acreedor} />}
          <DataTile label="Cuota mensual" value={d.cuota ? dinero(d.cuota) : '—'} mono />
          <DataTile label="Interés (TAE)" value={d.tae ? taeTexto(d.tae) : 'Sin intereses'} mono />
          {d.diaPago && <DataTile label="Día de pago" value={`Día ${d.diaPago}`} />}
          <DataTile label="Cuota en gastos fijos" value={d.recurrenteId ? 'Sí, se descuenta sola' : 'No'} />
        </Panel>

        {pendiente > 0 && !d.saldada && (
          <Panel title="Registrar un pago" footer={d.tae > 0 ? 'Si parte del pago son intereses, ajusta después «Lo que debes hoy» con el dato de tu banco.' : undefined}>
            <AmountField label="Importe del pago" value={importe} onChange={setImporte} />
            <Tile>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium">Apuntarlo también como gasto</span>
                <span className="block text-[13px] text-muted">{comoGasto ? `En ${CATEGORIA_DEUDAS}, con fecha de hoy` : 'Solo baja la deuda (por ejemplo, si ya lo apuntaste)'}</span>
              </span>
              <Toggle checked={comoGasto} onChange={setComoGasto} label="Apuntarlo también como gasto" />
            </Tile>
            <Button className="w-full" onClick={registrarPago} disabled={aCentimos(importe) <= 0}>
              Registrar pago
            </Button>
          </Panel>
        )}

        {!d.recurrenteId && d.cuota > 0 && pendiente > 0 && !d.saldada && (
          <Button variant="secondary" className="w-full" onClick={crearFijo}>
            Añadir la cuota a mis gastos fijos
          </Button>
        )}

        {pagos.length > 0 && (
          <Panel title="Últimos pagos" detail={<span className="num">{pagos.length}</span>}>
            {pagos.slice(0, 6).map((x, i) => (
              <DataTile key={i} label={<span className="num">{fechaCorta(x.fecha)}</span>} value={`${dinero(x.importe)}${x.comoGasto ? '' : ' · sin gasto'}`} mono />
            ))}
          </Panel>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onEditar}>
            Editar
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              await db.deudas.update(d.id, { saldada: !d.saldada, actualizadoEn: ahora() });
              onCerrar();
            }}
          >
            {d.saldada ? 'Reabrir' : 'Marcar saldada'}
          </Button>
        </div>
        <Button
          variant="danger"
          className="w-full"
          onClick={async () => {
            if (!confirm(`¿Eliminar «${d.nombre}»? Los gastos ya apuntados se conservan.`)) return;
            await db.deudas.delete(d.id);
            onCerrar();
          }}
        >
          Eliminar deuda
        </Button>
      </div>
    </Hoja>
  );
}

function FormDeuda({ deuda, onCerrar }: { deuda?: Deuda; onCerrar: () => void }) {
  const { movimientos, avisar, dinero } = useDatos();
  const actual = deuda ? pendienteActual(deuda, movimientos) : 0;
  const [tipo, setTipo] = useState<TipoDeuda>(deuda?.tipo ?? 'prestamo');
  const [nombre, setNombre] = useState(deuda?.nombre ?? '');
  const [acreedor, setAcreedor] = useState(deuda?.acreedor ?? '');
  const [inicial, setInicial] = useState(aTexto(deuda?.importeInicial ?? 0));
  const [pendiente, setPendiente] = useState(aTexto(actual));
  const [cuota, setCuota] = useState(aTexto(deuda?.cuota ?? 0));
  const [tae, setTae] = useState(deuda?.tae ? String(deuda.tae).replace('.', ',') : '');
  const [dia, setDia] = useState(deuda?.diaPago ? String(deuda.diaPago) : '');
  const t = TIPOS_DEUDA[tipo];
  const taeNum = Number(tae.replace(',', '.')) || 0;
  const pend = aCentimos(pendiente);
  const ini = aCentimos(inicial);
  const vistaPrevia = pend > 0 ? proyectar(pend, aCentimos(cuota), taeNum) : null;

  async function guardar() {
    if (!nombre.trim() || pend <= 0) return;
    const cambiaPendiente = !deuda || pend !== actual;
    await db.deudas.put({
      id: deuda?.id ?? nuevoId(),
      nombre: nombre.trim(),
      tipo,
      acreedor: acreedor.trim() || undefined,
      importeInicial: Math.max(ini, pend),
      // Si cambias lo que debes hoy, esa cifra pasa a ser la nueva base de cálculo
      pendiente: cambiaPendiente ? pend : deuda!.pendiente,
      baseEn: cambiaPendiente ? ahora() : deuda!.baseEn,
      cuota: aCentimos(cuota),
      tae: Math.max(0, taeNum),
      diaPago: dia ? Number(dia) : undefined,
      recurrenteId: deuda?.recurrenteId,
      pagos: deuda?.pagos ?? [],
      notas: deuda?.notas,
      saldada: deuda?.saldada ?? false,
      creadoEn: deuda?.creadoEn ?? ahora(),
      actualizadoEn: ahora(),
    });
    avisar(deuda ? 'Deuda actualizada' : `${nombre.trim()} añadida`);
    onCerrar();
  }

  return (
    <Hoja titulo={deuda ? 'Editar deuda' : 'Nueva deuda'} onCerrar={onCerrar}>
      <div className="space-y-3 px-4 pb-5">
        <Panel title="Qué es">
          <SelectField label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoDeuda)} hint={t.ayuda}>
            {(Object.keys(TIPOS_DEUDA) as TipoDeuda[]).map((k) => (
              <option key={k} value={k}>
                {TIPOS_DEUDA[k].icono} {TIPOS_DEUDA[k].nombre}
              </option>
            ))}
          </SelectField>
          <Field label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={tipo === 'hipoteca' ? 'Ej. Hipoteca piso' : tipo === 'tarjeta' ? 'Ej. Tarjeta BBVA' : tipo === 'personal' ? 'Ej. Préstamo de mamá' : 'Ej. Préstamo coche'} maxLength={40} />
          <Field label={tipo === 'personal' ? 'A quién se lo debes' : 'Banco o entidad (opcional)'} value={acreedor} onChange={(e) => setAcreedor(e.target.value)} placeholder={tipo === 'personal' ? 'Ej. Laura' : 'Ej. BBVA, Cetelem, Klarna…'} maxLength={40} />
        </Panel>
        <Panel title="Importes">
          <FieldRow>
            <AmountField label="Lo que debes hoy" value={pendiente} onChange={setPendiente} hint={deuda && pend !== actual ? 'Se usará como nueva cifra de partida' : undefined} hintTone="brand" />
            <AmountField label="Importe inicial" value={inicial} onChange={setInicial} hint="Para ver lo que llevas pagado" />
          </FieldRow>
          <FieldRow>
            <AmountField label="Cuota al mes" value={cuota} onChange={setCuota} />
            <Field label="Interés TAE (%)" inputMode="decimal" placeholder={tipo === 'tarjeta' ? 'Ej. 20' : tipo === 'personal' ? '0' : 'Ej. 7,5'} value={tae} onChange={(e) => setTae(e.target.value.replace(/[^\d.,]/g, ''))} className="num" />
          </FieldRow>
          <SelectField label="Día de pago (opcional)" value={dia} onChange={(e) => setDia(e.target.value)}>
            <option value="">Sin día fijo</option>
            {Array.from({ length: 28 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Día {i + 1}
              </option>
            ))}
          </SelectField>
        </Panel>
        <p className="px-3 text-[13px] leading-snug text-muted">
          La TAE aparece en tu contrato o en la app de tu banco. Las tarjetas «revolving» y muchos pagos aplazados rondan el 20 %. Si no lo sabes, déjalo vacío.
        </p>
        {vistaPrevia && vistaPrevia.meses > 0 && (
          <Alerta tone="brand">
            Terminarías en {vistaPrevia.fin} ({duracion(vistaPrevia.meses)}){vistaPrevia.intereses > 0 ? `, con unos ${dinero(vistaPrevia.intereses, { sinDecimales: true })} de intereses` : ''}.
          </Alerta>
        )}
        <Button className="w-full" onClick={guardar} disabled={!nombre.trim() || pend <= 0}>
          Guardar
        </Button>
      </div>
    </Hoja>
  );
}
