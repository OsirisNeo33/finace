import { BotonAjustes } from '../navegacion';
import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDatos } from '../contexto';
import { db } from '../db/db';
import { descargar, exportarCSV } from '../db/acciones';
import { enPeriodo, resumen } from '../domain/calculos';
import { periodoDe } from '../domain/fechas';
import { equivalenteMensual, gastosFijosYVariables, resumenFijos } from '../domain/fijos';
import type { Recurrente } from '../domain/tipos';
import { SelectorPeriodo } from '../components/SelectorPeriodo';
import { IconoBajar, IconoDescargar, IconoMas, IconoSubir } from '../components/Iconos';
import { Alerta, Button, Card, CardTitle, Cifra, Emoji, IconBadge, Page, PageHeader, Panel, ProgressBar, Segmented, Tile, TileButton, cx, tonoPresupuesto } from '../components/ui';
import { FormRecurrente } from './ajustes/Recurrentes';
import { Pagos } from './Pagos';

export type VistaContabilidad = 'resumen' | 'calendario';

export function Contabilidad({ vista, setVista }: { vista: VistaContabilidad; setVista: (v: VistaContabilidad) => void }) {
  return (
    <>
      <PageHeader title="Contabilidad" subtitle="Tus ingresos y gastos fijos, y lo que te queda" action={<BotonAjustes />} />
      <Page>
        <Segmented
          label="Vista"
          value={vista}
          onChange={setVista}
          options={[
            { value: 'resumen', label: 'Resumen' },
            { value: 'calendario', label: 'Calendario de pagos' },
          ]}
        />
        {vista === 'resumen' ? <Resumen /> : <Pagos embebido />}
      </Page>
    </>
  );
}

/** "Cada mes · día 5", "Cada semana · lunes", "Cada año · 3 de marzo" */
function cuando(r: Recurrente) {
  const d = parseISO(r.inicio);
  if (r.frecuencia === 'mensual') return `Cada mes · día ${d.getDate()}`;
  if (r.frecuencia === 'semanal') return `Cada semana · ${format(d, 'EEEE', { locale: es })}`;
  return `Cada año · ${format(d, "d 'de' MMMM", { locale: es })}`;
}

function Resumen() {
  const { movimientos, categoriaPorId, dinero, ajustes } = useDatos();
  const recurrentes = useLiveQuery(() => db.recurrentes.toArray(), [], []);
  const [desplazamiento, setDesplazamiento] = useState(0);
  const [form, setForm] = useState<{ r?: Recurrente; tipo?: 'gasto' | 'ingreso' } | null>(null);

  const periodo = useMemo(() => periodoDe(new Date(), ajustes.diaInicioMes, desplazamiento), [ajustes.diaInicioMes, desplazamiento]);
  const movs = useMemo(() => movimientos.filter((m) => enPeriodo(m, periodo)), [movimientos, periodo]);
  const r = resumen(movs);
  const fijos = resumenFijos(recurrentes);
  const { fijos: gastadoFijo, variables } = gastosFijosYVariables(movs);

  const ordenar = (tipo: 'gasto' | 'ingreso') => recurrentes.filter((x) => x.tipo === tipo).sort((a, b) => Number(b.activo) - Number(a.activo) || equivalenteMensual(b) - equivalenteMensual(a));
  const ingresosFijos = ordenar('ingreso');
  const gastosFijos = ordenar('gasto');
  const usoLibre = fijos.libre > 0 ? variables / fijos.libre : 0;

  const fila = (x: Recurrente) => {
    const c = x.categoriaId ? categoriaPorId.get(x.categoriaId) : undefined;
    const mensual = equivalenteMensual(x);
    return (
      <TileButton
        key={x.id}
        className={x.activo ? undefined : 'opacity-60'}
        icon={<Emoji>{c?.icono ?? '🔁'}</Emoji>}
        title={x.nota || c?.nombre || (x.tipo === 'ingreso' ? 'Ingreso fijo' : 'Gasto fijo')}
        subtitle={x.activo ? `${cuando(x)}${x.automatico === false ? ' · Recordatorio' : ''}` : 'Pausado'}
        detail={
          <span className="flex flex-col items-end">
            <span className={cx('num text-[15px] font-semibold', x.tipo === 'ingreso' ? 'text-success' : 'text-text')}>{x.tipo === 'ingreso' ? dinero(x.importe, { signo: true }) : dinero(-x.importe)}</span>
            {x.frecuencia !== 'mensual' && <span className="num text-[12px] text-muted">≈ {dinero(mensual)}/mes</span>}
          </span>
        }
        chevron
        onClick={() => setForm({ r: x })}
      />
    );
  };

  const anadir = (tipo: 'gasto' | 'ingreso') => (
    <TileButton
      icon={
        <span className={cx('flex size-9 shrink-0 items-center justify-center rounded-xl', tipo === 'ingreso' ? 'bg-success-soft text-success' : 'bg-brand-soft text-brand')}>
          <IconoMas width={20} height={20} />
        </span>
      }
      title={<span className={tipo === 'ingreso' ? 'text-success' : 'text-brand'}>{tipo === 'ingreso' ? 'Añadir ingreso fijo' : 'Añadir gasto fijo'}</span>}
      subtitle={tipo === 'ingreso' ? 'Nómina, pensión, alquiler que cobras…' : 'Alquiler, hipoteca, luz, móvil, gimnasio…'}
      onClick={() => setForm({ tipo })}
    />
  );

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => setForm({ tipo: 'gasto' })}>
          <IconoBajar width={18} height={18} /> Gasto fijo
        </Button>
        <Button variant="secondary" onClick={() => setForm({ tipo: 'ingreso' })}>
          <IconoSubir width={18} height={18} className="text-success" /> Ingreso fijo
        </Button>
      </div>

      <SelectorPeriodo periodo={periodo} desplazamiento={desplazamiento} setDesplazamiento={setDesplazamiento} diaInicio={ajustes.diaInicioMes} />

      {/* Resultado real del mes: la tarjeta negra de la pantalla */}
      <Card dark>
        <p className="text-[13px] text-white/60">Resultado del mes</p>
        <Cifra max={34} className="mt-1" data-testid="resultado">
          {dinero(r.balance, { signo: true })}
        </Cifra>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[13px] text-white/60">
              <IconoSubir width={14} height={14} /> Ingresos
            </p>
            <Cifra max={20} className="mt-0.5">
              {dinero(r.ingresos)}
            </Cifra>
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[13px] text-white/60">
              <IconoBajar width={14} height={14} /> Gastos
            </p>
            <Cifra max={20} className="mt-0.5">
              {dinero(r.gastos)}
            </Cifra>
          </div>
        </div>
        {r.gastos > 0 && (
          <p className="mt-3 text-[13px] text-white/60">
            De los gastos, <b className="num text-white">{dinero(gastadoFijo)}</b> son fijos y <b className="num text-white">{dinero(variables)}</b> del día a día.
          </p>
        )}
      </Card>

      {/* El plan del mes con los fijos */}
      <Card>
        <CardTitle detail="cada mes">Tu mes con los fijos</CardTitle>
        <div className="space-y-2 text-[15px]">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <IconoSubir width={16} height={16} className="text-success" /> Ingresos fijos
            </span>
            <span className="num font-semibold text-success" data-testid="ingresos-fijos">
              {dinero(fijos.ingresos, { signo: true })}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <IconoBajar width={16} height={16} className="text-muted" /> Gastos fijos
            </span>
            <span className="num font-semibold" data-testid="gastos-fijos">
              {dinero(-fijos.gastos)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
            <span className="font-semibold">Libre para el día a día</span>
            <span className={cx('num text-[17px] font-semibold', fijos.libre < 0 && 'text-danger')} data-testid="libre">
              {dinero(fijos.libre)}
            </span>
          </div>
        </div>
        {fijos.ingresos === 0 && fijos.gastos === 0 ? (
          <p className="mt-3 text-[13px] text-muted">Añade tu nómina y tus gastos fijos para ver cuánto te queda libre cada mes.</p>
        ) : fijos.libre > 0 ? (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between gap-3 text-[13px]">
              <span className="text-muted">Gastado del día a día este mes</span>
              <span className="num font-medium">
                {dinero(variables)} / {dinero(fijos.libre)}
              </span>
            </div>
            <ProgressBar value={usoLibre} tone={tonoPresupuesto(usoLibre)} />
            <p className="mt-1.5 text-[13px] text-muted">{variables <= fijos.libre ? <>Te quedan <b className="num text-text">{dinero(fijos.libre - variables)}</b> este mes.</> : <span className="text-danger">Te has pasado en {dinero(variables - fijos.libre)}.</span>}</p>
          </div>
        ) : (
          <div className="mt-3">
            <Alerta>Tus gastos fijos superan a tus ingresos fijos en {dinero(-fijos.libre)} al mes.</Alerta>
          </div>
        )}
      </Card>

      <Panel title="Ingresos fijos" detail={<span className="num">{dinero(fijos.ingresos)}/mes</span>}>
        {ingresosFijos.map(fila)}
        {anadir('ingreso')}
      </Panel>

      <Panel title="Gastos fijos" detail={<span className="num">{dinero(fijos.gastos)}/mes</span>} footer="Los fijos se apuntan solos el día que toca. Si eliges «recordatorio», te avisa en el calendario y lo marcas tú como pagado.">
        {gastosFijos.map(fila)}
        {anadir('gasto')}
      </Panel>

      <Panel title="Exportar">
        <TileButton
          icon={
            <IconBadge tone="success">
              <IconoDescargar width={20} height={20} />
            </IconBadge>
          }
          title={<span className="first-letter:uppercase">{`${periodo.etiqueta} a Excel (CSV)`}</span>}
          subtitle={`${movs.length} ${movs.length === 1 ? 'movimiento' : 'movimientos'}, con columna «Fijo»`}
          chevron
          onClick={async () => descargar(`finace-${periodo.inicio.slice(0, 7)}.csv`, await exportarCSV(periodo.inicio, periodo.fin), 'text/csv;charset=utf-8').catch(() => {})}
        />
      </Panel>

      {recurrentes.length === 0 && (
        <Tile>
          <span className="text-[14px] text-muted">Consejo: empieza por tu nómina y tu alquiler o hipoteca. Con eso ya verás cuánto te queda libre.</span>
        </Tile>
      )}

      {form && <FormRecurrente r={form.r} tipoInicial={form.tipo} onCerrar={() => setForm(null)} />}
    </>
  );
}
