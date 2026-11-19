import { BotonAjustes } from '../navegacion';
import { TarjetaSalud, TarjetaTeDeben } from './Finanzas';
import { useMemo, useState } from 'react';
import { FormCuenta, TIPOS_CUENTA } from './ajustes/Cuentas';
import type { Cuenta } from '../domain/tipos';
import { addDays, format, startOfISOWeek } from 'date-fns';
import { TiraSemana } from '../components/TiraSemana';
import { es } from 'date-fns/locale';
import { useDatos } from '../contexto';
import { SelectorPeriodo } from '../components/SelectorPeriodo';
import { FilaMovimiento } from '../components/FilaMovimiento';
import { IconoBajar, IconoFuego, IconoMas, IconoSubir } from '../components/Iconos';
import { Cifra, BrandHero, Button, Card, CardTitle, Chip, Emoji, EmptyState, Label, Page, PageHeader, Panel, PanelLink, ProgressBar, Tile, TileButton, cx, tonoPresupuesto } from '../components/ui';
import { agruparPorDia, enPeriodo, progresoPresupuestos, resumen, saldosCuentas, totalesPorCategoria } from '../domain/calculos';
import { aISO, diasRestantes, fechaLarga, hoyISO } from '../domain/fechas';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { PropsPantalla } from './tipos';
import { usarPagos } from './usarPagos';
import { usarJuego } from './usarJuego';
import { FilaPago } from './Pagos';

export function Inicio({ periodo, desplazamiento, setDesplazamiento, ir }: PropsPantalla) {
  const { movimientos, cuentas, todasCuentas, categoriaPorId, dinero, ajustes, abrirEditor } = useDatos();
  const hoy = hoyISO();
  const { pagos } = usarPagos(aISO(addDays(new Date(), -31)), aISO(addDays(new Date(), 7)));
  const proximos = pagos.filter((p) => (p.fecha >= hoy && p.estado !== 'pagado') || p.estado === 'vencido').slice(0, 4);
  const [cuentaAbierta, setCuentaAbierta] = useState<Cuenta | 'nueva' | null>(null);
  const presupuestos = useLiveQuery(() => db.presupuestos.toArray(), [], []);

  const movsPeriodo = useMemo(() => movimientos.filter((m) => enPeriodo(m, periodo)), [movimientos, periodo]);
  const r = resumen(movsPeriodo);
  const saldos = useMemo(() => saldosCuentas(todasCuentas, movimientos), [todasCuentas, movimientos]);
  const patrimonio = cuentas.reduce((s, c) => s + (saldos.get(c.id) ?? 0), 0);
  const esActual = desplazamiento === 0;
  const dias = diasRestantes(periodo);

  const global = presupuestos.find((p) => p.categoriaId === null);
  const disponible = global ? global.importe - r.gastos : r.balance;
  const porDia = dias > 0 ? Math.floor(Math.max(0, disponible) / dias) : 0;

  const progreso = useMemo(
    () =>
      progresoPresupuestos(
        presupuestos.filter((p) => p.categoriaId !== null),
        movsPeriodo,
      )
        .sort((a, b) => b.porcentaje - a.porcentaje)
        .slice(0, 3),
    [presupuestos, movsPeriodo],
  );

  const porCategoria = useMemo(
    () =>
      [...totalesPorCategoria(movsPeriodo, 'gasto')]
        .map(([id, valor]) => {
          const c = categoriaPorId.get(id);
          return { id, valor, nombre: c?.nombre ?? 'Sin categoría', icono: c?.icono ?? '❔' };
        })
        .sort((a, b) => b.valor - a.valor),
    [movsPeriodo, categoriaPorId],
  );

  const juego = usarJuego();
  const reto = juego.retos.find((r) => !r.completado);
  const grupos = agruparPorDia(movsPeriodo).slice(0, 5);
  const lunes = aISO(startOfISOWeek(new Date()));
  const diasConMovs = useMemo(() => new Set(movimientos.filter((m) => m.fecha >= lunes).map((m) => m.fecha)), [movimientos, lunes]);
  const movsSemana = movimientos.filter((m) => m.fecha >= lunes && m.fecha <= hoy).length;

  return (
    <>
      <PageHeader title="Hoy" action={<BotonAjustes />} subtitle={<span className="inline-block first-letter:uppercase">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</span>} />
      <Page>
        <button type="button" className="block w-full text-left transition active:scale-[0.99]" onClick={() => ir('logros')} aria-label={`Nivel ${juego.nivel}, racha de ${juego.racha} días. Ver logros`}>
          <BrandHero name="Finace">
            <span className="flex flex-wrap items-center gap-x-2">
              <span>
                Nivel {juego.nivel} · {juego.nombre}
              </span>
              <span className="num inline-flex items-center gap-0.5 font-semibold text-warning">
                <IconoFuego width={14} height={14} /> {juego.racha} {juego.racha === 1 ? 'día' : 'días'}
              </span>
            </span>
          </BrandHero>
        </button>
        <SelectorPeriodo periodo={periodo} desplazamiento={desplazamiento} setDesplazamiento={setDesplazamiento} diaInicio={ajustes.diaInicioMes} />

        {/* Resumen: la tarjeta negra de la pantalla */}
        <Card dark>
          <p className="text-[13px] text-white/60">Balance del mes</p>
          <Cifra max={34} className="mt-1" data-testid="balance">{dinero(r.balance)}</Cifra>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
            <div>
              <p className="flex items-center gap-1 text-[13px] text-white/60">
                <IconoSubir width={14} height={14} /> Ingresos
              </p>
              <Cifra max={20} className="mt-0.5">{dinero(r.ingresos, { signo: true })}</Cifra>
            </div>
            <div>
              <p className="flex items-center gap-1 text-[13px] text-white/60">
                <IconoBajar width={14} height={14} /> Gastos
              </p>
              <Cifra max={20} className="mt-0.5" data-testid="gastos">{dinero(-r.gastos)}</Cifra>
            </div>
          </div>
          {esActual && dias > 0 && (r.ingresos > 0 || global) && (
            <p className="mt-4 text-[14px] text-white/80">
              {disponible > 0 ? (
                <>
                  Te quedan <b className="num text-white">{dinero(disponible)}</b>
                  {global ? ' de presupuesto' : ''} para {dias} {dias === 1 ? 'día' : 'días'}: unos <b className="num text-white">{dinero(porDia)}</b> al día.
                </>
              ) : (
                <span className="font-medium text-danger">
                  {global ? 'Has superado tu presupuesto' : 'Estás gastando más de lo que ingresas'} en {dinero(-disponible)}.
                </span>
              )}
            </p>
          )}
          {global && (
            <div className="mt-3">
              <ProgressBar value={global.importe ? r.gastos / global.importe : 0} tone={tonoPresupuesto(global.importe ? r.gastos / global.importe : 0)} />
            </div>
          )}
        </Card>

        {movimientos.length > 0 && esActual && <TarjetaSalud compacta onClick={() => ir('finanzas')} />}
        {esActual && <TarjetaTeDeben onClick={() => ir('cobros')} />}

        {/* Nivel y reto semanal */}
        {movimientos.length > 0 && esActual && (
          <button type="button" className="block w-full rounded-[26px] border border-border bg-surface p-4 text-left shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition active:scale-[0.99]" onClick={() => ir('logros')}>
            <span className="flex items-center gap-3">
              <Emoji>{reto ? reto.icono : '🏆'}</Emoji>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] text-muted">{reto ? 'Reto de la semana' : `Nivel ${juego.nivel} · ${juego.nombre}`}</span>
                <span className="block truncate text-[15px] font-medium">{reto ? reto.nombre : '¡Retos de la semana completados!'}</span>
              </span>
              <Chip tone="brand" className="num">
                {reto ? `+${reto.xp} XP` : `${juego.xpEnNivel}/${juego.xpParaSubir}`}
              </Chip>
            </span>
            <span className="mt-3 flex items-center gap-3">
              <span className="flex-1">
                <ProgressBar value={reto ? reto.actual / reto.meta : juego.progreso} />
              </span>
              {reto && (
                <span className="num text-[12px] text-muted">
                  {reto.actual}/{reto.meta}
                </span>
              )}
            </span>
          </button>
        )}

        {esActual && <TiraSemana hoy={hoy} ocupados={diasConMovs} detalle={`${movsSemana} ${movsSemana === 1 ? 'movimiento' : 'movimientos'} esta semana`} />}

        {movimientos.length === 0 && (
          <EmptyState icon="👋" title="Apunta tu primer gasto">
            <p>Pulsa el botón + de abajo, escribe el importe y toca una categoría. Así de rápido.</p>
            <Button className="mx-auto mt-4" onClick={() => abrirEditor()}>
              Añadir gasto
            </Button>
          </EmptyState>
        )}

        {/* Presupuestos */}
        {progreso.length > 0 && (
          <Panel title="Presupuestos" detail={<PanelLink onClick={() => ir('estadisticas')}>Ver todos</PanelLink>}>
            {progreso.map((p) => {
              const c = categoriaPorId.get(p.presupuesto.categoriaId!);
              return (
                <Tile key={p.presupuesto.id} className="flex-col items-stretch gap-2">
                  <span className="flex items-center gap-3">
                    <Emoji>{c?.icono}</Emoji>
                    <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{c?.nombre}</span>
                    <span className="num text-[13px] text-muted">
                      {dinero(p.gastado, { sinDecimales: true })} / {dinero(p.presupuesto.importe, { sinDecimales: true })}
                    </span>
                  </span>
                  <ProgressBar value={p.porcentaje} tone={tonoPresupuesto(p.porcentaje)} />
                </Tile>
              );
            })}
          </Panel>
        )}

        {/* Próximos pagos */}
        {proximos.length > 0 && esActual && (
          <Panel title="Próximos pagos" detail={<PanelLink onClick={() => ir('calendario')}>Ver calendario</PanelLink>}>
            {proximos.map((p) => (
              <FilaPago key={p.clave} p={p} mostrarFecha onEditar={() => ir('calendario')} />
            ))}
          </Panel>
        )}

        {/* Gastos por categoría: barras de un solo color */}
        {porCategoria.length > 0 && (
          <Panel title="¿En qué gasto?" detail={<span className="num">{dinero(r.gastos)}</span>}>
            {porCategoria.slice(0, 6).map((p) => (
              <button
                key={p.id}
                type="button"
                className="flex w-full flex-col gap-2 rounded-[18px] border border-border bg-surface px-3.5 py-3 text-left transition active:scale-[0.99] active:bg-surface-2"
                onClick={() => ir('movimientos', { categoriaId: p.id, periodo: true })}
              >
                <span className="flex w-full items-center gap-3">
                  <Emoji>{p.icono}</Emoji>
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{p.nombre}</span>
                  <span className="num text-[12px] text-muted">{Math.round((p.valor / r.gastos) * 100)} %</span>
                  <span className="num text-[15px] font-semibold">{dinero(p.valor)}</span>
                </span>
                <ProgressBar value={p.valor / porCategoria[0].valor} />
              </button>
            ))}
          </Panel>
        )}

        {/* Cuentas */}
        <Panel title="Mis cuentas" detail={<span className="num">Total {dinero(patrimonio)}</span>} footer="Toca una cuenta para actualizar su saldo.">
          {cuentas.map((c) => {
            const saldo = saldos.get(c.id) ?? 0;
            return (
              <TileButton
                key={c.id}
                icon={<Emoji>{c.icono}</Emoji>}
                title={c.nombre}
                subtitle={TIPOS_CUENTA.find((t) => t[0] === c.tipo)?.[1]}
                detail={<span className={cx('num text-[15px] font-semibold', saldo < 0 ? 'text-danger' : 'text-text')}>{dinero(saldo)}</span>}
                chevron
                onClick={() => setCuentaAbierta(c)}
                aria-label={`${c.nombre}: actualizar saldo`}
              />
            );
          })}
          <TileButton
            icon={
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <IconoMas width={20} height={20} />
              </span>
            }
            title={<span className="text-brand">Añadir banco</span>}
            onClick={() => setCuentaAbierta('nueva')}
          />
        </Panel>
        {cuentaAbierta && <FormCuenta cuenta={cuentaAbierta === 'nueva' ? undefined : cuentaAbierta} onCerrar={() => setCuentaAbierta(null)} />}

        {/* Últimos movimientos */}
        {grupos.length > 0 && (
          <Panel title="Últimos movimientos" detail={<PanelLink onClick={() => ir('movimientos', { periodo: true })}>Ver todos</PanelLink>}>
            {grupos.map((g) => (
              <div key={g.fecha} className="space-y-1.5">
                <div className="flex justify-between px-3 pt-1.5 text-[12px] font-medium text-muted">
                  <span className="first-letter:uppercase">{fechaLarga(g.fecha)}</span>
                  <span className="num">{dinero(g.neto, { signo: true })}</span>
                </div>
                {g.items.map((m) => (
                  <FilaMovimiento key={m.id} m={m} />
                ))}
              </div>
            ))}
          </Panel>
        )}

        {!esActual && movsPeriodo.length === 0 && movimientos.length > 0 && (
          <Card className="text-center">
            <CardTitle>Sin movimientos</CardTitle>
            <Label>No apuntaste nada en este mes.</Label>
          </Card>
        )}
      </Page>
    </>
  );
}
