import { useMemo, useState } from 'react';
import { addDays, eachDayOfInterval, getISODay, parseISO } from 'date-fns';
import { useDatos } from '../contexto';
import { SelectorPeriodo } from '../components/SelectorPeriodo';
import { FormRecurrente } from './ajustes/Recurrentes';
import { aISO, fechaLarga, hoyISO, periodoDe } from '../domain/fechas';
import { db } from '../db/db';
import { marcarPagado, usarPagos, type Pago } from './usarPagos';
import type { Recurrente } from '../domain/tipos';
import { IconoCheck, IconoMas } from '../components/Iconos';
import { Cifra, Button, Card, CardTitle, Chip, Emoji, HeaderButton, Label, Page, PageHeader, Panel, PanelLink, ProgressBar, Tile, cx, type TonoChip } from '../components/ui';

const ESTADO: Record<Pago['estado'], { texto: string; tono: TonoChip }> = {
  pagado: { texto: 'Pagado', tono: 'success' },
  hoy: { texto: 'Hoy', tono: 'brand' },
  pendiente: { texto: 'Pendiente', tono: 'warning' },
  vencido: { texto: 'Sin pagar', tono: 'danger' },
};

export function Pagos() {
  const { dinero } = useDatos();
  const [desplazamiento, setDesplazamiento] = useState(0);
  const [diaSel, setDiaSel] = useState<string>();
  const [form, setForm] = useState<{ r?: Recurrente; inicio?: string } | null>(null);
  const periodo = useMemo(() => periodoDe(new Date(), 1, desplazamiento), [desplazamiento]);
  const { pagos } = usarPagos(periodo.inicio, periodo.fin);
  const hoy = hoyISO();

  const gastos = pagos.filter((p) => p.recurrente.tipo === 'gasto');
  const total = gastos.reduce((s, p) => s + p.recurrente.importe, 0);
  const pagado = gastos.filter((p) => p.estado === 'pagado').reduce((s, p) => s + p.recurrente.importe, 0);
  const ingresos = pagos.filter((p) => p.recurrente.tipo === 'ingreso').reduce((s, p) => s + p.recurrente.importe, 0);

  const dias = useMemo(() => eachDayOfInterval({ start: parseISO(periodo.inicio), end: parseISO(periodo.fin) }).map(aISO), [periodo]);
  const porDia = useMemo(() => {
    const m = new Map<string, Pago[]>();
    for (const p of pagos) m.set(p.fecha, [...(m.get(p.fecha) ?? []), p]);
    return m;
  }, [pagos]);
  const primero = parseISO(dias[0]);
  const ultimo = parseISO(dias[dias.length - 1]);
  const antes = Array.from({ length: getISODay(primero) - 1 }, (_, i) => aISO(addDays(primero, i - (getISODay(primero) - 1))));
  const despues = Array.from({ length: 7 - getISODay(ultimo) }, (_, i) => aISO(addDays(ultimo, i + 1)));
  const visibles = diaSel ? porDia.get(diaSel) ?? [] : pagos;

  return (
    <>
      <PageHeader
        title="Pagos"
        subtitle="Suscripciones, recibos y pagos que se repiten"
        action={
          <HeaderButton label="Añadir pago" onClick={() => setForm({ inicio: diaSel })}>
            <IconoMas width={22} height={22} />
          </HeaderButton>
        }
      />
      <Page>
        <SelectorPeriodo
          periodo={periodo}
          desplazamiento={desplazamiento}
          setDesplazamiento={(n) => {
            setDesplazamiento(n);
            setDiaSel(undefined);
          }}
          diaInicio={1}
          permitirFuturo
        />

        <div className="grid grid-cols-2 gap-3">
          <Card dark className="p-4">
            <p className="text-[13px] text-white/60">Pagos fijos este mes</p>
            <Cifra max={22} className="mt-1" data-testid="total-pagos">{dinero(total)}</Cifra>
            {total > 0 && <p className="num mt-1 text-[12px] text-white/60">Falta {dinero(total - pagado)}</p>}
          </Card>
          <Card className="p-4">
            <Label>{ingresos > 0 ? 'Ingresos fijos' : 'Ya pagado'}</Label>
            <Cifra max={22} className="mt-1">{ingresos > 0 ? dinero(ingresos, { signo: true }) : dinero(pagado)}</Cifra>
            {total > 0 && (
              <div className="mt-2.5">
                <ProgressBar value={pagado / total} tone="success" />
              </div>
            )}
          </Card>
        </div>

        {/* Calendario */}
        <Card className="p-4">
          <CardTitle detail={diaSel ? <PanelLink onClick={() => setDiaSel(undefined)}>Ver todo el mes</PanelLink> : 'Toca un día'}>
            <span className="first-letter:uppercase">{periodo.etiqueta}</span>
          </CardTitle>
          <div className="mb-1 grid grid-cols-7 text-center text-[11px] text-muted">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {antes.map((d) => (
              <span key={d} className="num flex min-h-12 items-start justify-center pt-2.5 text-[15px] text-muted/50" aria-hidden="true">
                {parseISO(d).getDate()}
              </span>
            ))}
            {dias.map((d) => {
              const ps = porDia.get(d) ?? [];
              const vencido = ps.some((p) => p.estado === 'vencido');
              const todoPagado = ps.length > 0 && ps.every((p) => p.estado === 'pagado');
              const elegido = d === diaSel;
              return (
                <button
                  key={d}
                  type="button"
                  className={cx(
                    'mx-auto flex min-h-12 w-full max-w-11 flex-col items-center gap-1 rounded-2xl pt-2.5 transition active:scale-95',
                    elegido && 'bg-brand text-on-brand shadow-[0_6px_16px_-6px_rgba(43,92,230,0.6)]',
                    !elegido && d === hoy && 'text-brand ring-1 ring-brand',
                  )}
                  onClick={() => setDiaSel(elegido ? undefined : d)}
                  aria-label={`${fechaLarga(d)}: ${ps.length} pagos`}
                  aria-pressed={elegido}
                >
                  <span className={cx('num text-[15px] leading-none', d === hoy || elegido ? 'font-semibold' : 'font-medium')}>{parseISO(d).getDate()}</span>
                  <span className={cx('size-1.5 rounded-full', !ps.length ? 'bg-transparent' : elegido ? 'bg-on-brand' : vencido ? 'bg-danger' : todoPagado ? 'bg-success' : 'bg-accent')} />
                </button>
              );
            })}
            {despues.map((d) => (
              <span key={d} className="num flex min-h-12 items-start justify-center pt-2.5 text-[15px] text-muted/50" aria-hidden="true">
                {parseISO(d).getDate()}
              </span>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip tone="success">
              <span className="size-1.5 rounded-full bg-success" /> Pagado
            </Chip>
            <Chip tone="warning">
              <span className="size-1.5 rounded-full bg-accent" /> Pendiente
            </Chip>
            <Chip tone="danger">
              <span className="size-1.5 rounded-full bg-danger" /> Sin pagar
            </Chip>
          </div>
        </Card>

        {/* Lista */}
        <Panel title={diaSel ? <span className="first-letter:uppercase">{fechaLarga(diaSel)}</span> : 'Este mes'} detail={visibles.length ? `${visibles.length}` : undefined}>
          {visibles.length === 0 && (
            <Tile>
              <span className="text-[14px] text-muted">{diaSel ? 'Ningún pago este día.' : 'Aún no tienes pagos fijos. Añade tus suscripciones (Netflix, Spotify, gimnasio…) y recibos (alquiler, luz, móvil…).'}</span>
            </Tile>
          )}
          {visibles.map((p) => (
            <FilaPago key={p.clave} p={p} onEditar={() => setForm({ r: p.recurrente })} />
          ))}
        </Panel>
        <Button className="w-full" onClick={() => setForm({ inicio: diaSel })}>
          + {diaSel ? `Añadir pago el día ${parseISO(diaSel).getDate()}` : 'Añadir suscripción o pago'}
        </Button>

        {form && <FormRecurrente r={form.r} inicioInicial={form.inicio} onCerrar={() => setForm(null)} />}
      </Page>
    </>
  );
}

export function FilaPago({ p, onEditar, mostrarFecha }: { p: Pago; onEditar?: () => void; mostrarFecha?: boolean }) {
  const { categoriaPorId, dinero, avisar } = useDatos();
  const r = p.recurrente;
  const c = r.categoriaId ? categoriaPorId.get(r.categoriaId) : undefined;
  const e = ESTADO[p.estado];
  const manual = r.automatico === false;
  return (
    <div className="flex min-h-14 w-full items-center gap-3 rounded-[18px] border border-border bg-surface px-3.5 py-3">
      <button type="button" className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left" onClick={onEditar}>
        <Emoji>{c?.icono ?? '🔁'}</Emoji>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium">{r.nota || c?.nombre}</span>
          <span className="block truncate text-[13px] text-muted">
            {mostrarFecha ? <span className="first-letter:uppercase">{fechaLarga(p.fecha)}</span> : `Día ${parseISO(p.fecha).getDate()}`}
            {manual ? (p.estado !== 'pagado' ? ` · ${e.texto} · Recordatorio` : ' · Recordatorio') : ' · Automático'}
          </span>
        </span>
      </button>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span className={cx('num text-[15px] font-semibold', r.tipo === 'ingreso' && 'text-success')}>{r.tipo === 'ingreso' ? dinero(r.importe, { signo: true }) : dinero(-r.importe)}</span>
        {manual && p.estado !== 'pagado' ? (
          <button
            type="button"
            className="-my-1 inline-flex min-h-10 items-center gap-1 rounded-full bg-brand-soft px-3 text-[12px] font-semibold text-brand active:scale-95"
            onClick={async () => {
              const id = await marcarPagado(p);
              avisar(`${r.nota || c?.nombre} marcado como pagado`, { etiqueta: 'Deshacer', hacer: () => db.movimientos.delete(id) });
            }}
          >
            <IconoCheck width={14} height={14} /> Marcar pagado
          </button>
        ) : (
          <Chip tone={e.tono}>{e.texto}</Chip>
        )}
      </span>
    </div>
  );
}
