import { useEffect, useMemo, useState } from 'react';
import { ProveedorDatos, useDatos } from './contexto';
import { Editor } from './components/Editor';
import { Aviso } from './components/Aviso';
import { IconoCartera, IconoGrafico, IconoHoy, IconoLista, IconoMas, IconoMoneda } from './components/Iconos';
import { Inicio } from './pantallas/Inicio';
import { Movimientos, type Filtro } from './pantallas/Movimientos';
import { Estadisticas } from './pantallas/Estadisticas';
import { Ajustes } from './pantallas/Ajustes';
import { Bienvenida } from './pantallas/Bienvenida';
import { Contabilidad, type VistaContabilidad } from './pantallas/Contabilidad';
import { Finanzas, type VistaFinanzas } from './pantallas/Finanzas';
import { NavCtx } from './navegacion';
import { Logros } from './pantallas/Logros';
import { Celebracion } from './components/Celebracion';
import { generarRecurrentes } from './db/acciones';
import { periodoDe } from './domain/fechas';

/** 'calendario' abre Contabilidad directamente en su calendario de pagos. */
export type Pestana = 'inicio' | 'movimientos' | 'pagos' | 'calendario' | 'finanzas' | 'estadisticas' | 'ajustes' | 'logros';

export default function App() {
  return (
    <ProveedorDatos>
      <Contenido />
    </ProveedorDatos>
  );
}

function usarTema(tema: 'sistema' | 'claro' | 'oscuro') {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const aplicar = () => {
      const oscuro = tema === 'oscuro' || (tema === 'sistema' && mq.matches);
      document.documentElement.classList.toggle('dark', oscuro);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', oscuro ? '#0b0c0e' : '#eceef1');
    };
    aplicar();
    mq.addEventListener('change', aplicar);
    return () => mq.removeEventListener('change', aplicar);
  }, [tema]);
}

function Contenido() {
  const { cargando, ajustes, editor, abrirEditor, avisar } = useDatos();
  const [pestana, setPestana] = useState<Pestana>('inicio');
  const [desplazamiento, setDesplazamiento] = useState(0);
  const [filtro, setFiltro] = useState<Filtro>({});
  const [vistaConta, setVistaConta] = useState<VistaContabilidad>('resumen');
  const [vistaFinanzas, setVistaFinanzas] = useState<VistaFinanzas>('resumen');
  const [anterior, setAnterior] = useState<Pestana>('inicio');
  usarTema(ajustes.tema);

  const periodo = useMemo(() => periodoDe(new Date(), ajustes.diaInicioMes, desplazamiento), [ajustes.diaInicioMes, desplazamiento]);

  useEffect(() => {
    if (!ajustes.configurado) return;
    generarRecurrentes().then((n) => n > 0 && avisar(`${n} movimiento${n > 1 ? 's' : ''} recurrente${n > 1 ? 's' : ''} añadido${n > 1 ? 's' : ''}`));
    // Al volver a la app otro día, generar los pendientes
    const f = () => document.visibilityState === 'visible' && generarRecurrentes();
    document.addEventListener('visibilitychange', f);
    return () => document.removeEventListener('visibilitychange', f);
  }, [ajustes.configurado, avisar]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pestana]);

  // Tras borrar todo (o la primera vez), al terminar la bienvenida se empieza en Hoy
  useEffect(() => {
    if (!cargando && !ajustes.configurado) setPestana('inicio');
  }, [cargando, ajustes.configurado]);

  if (cargando) return <div className="flex min-h-dvh items-center justify-center text-muted">Cargando…</div>;
  if (!ajustes.configurado) return <Bienvenida />;

  const ir = (p: Pestana, f?: Filtro) => {
    if (f) setFiltro(f);
    if (p === 'calendario' || p === 'pagos') setVistaConta(p === 'calendario' ? 'calendario' : 'resumen');
    if (p === 'ajustes' && pestana !== 'ajustes') setAnterior(pestana);
    setPestana(p === 'calendario' ? 'pagos' : p);
  };
  const props = { periodo, desplazamiento, setDesplazamiento, ir };

  return (
    <NavCtx.Provider value={ir}>
    <div className="min-h-dvh" style={{ paddingBottom: 'calc(6.5rem + env(safe-area-inset-bottom))' }}>
      <main>
        {pestana === 'inicio' && <Inicio {...props} />}
        {pestana === 'movimientos' && <Movimientos {...props} filtro={filtro} setFiltro={setFiltro} />}
        {pestana === 'pagos' && <Contabilidad vista={vistaConta} setVista={setVistaConta} />}
        {pestana === 'estadisticas' && <Estadisticas {...props} />}
        {pestana === 'finanzas' && <Finanzas vista={vistaFinanzas} setVista={setVistaFinanzas} />}
        {pestana === 'ajustes' && <Ajustes irA={(p) => ir(p)} onVolver={() => ir(anterior)} />}
        {pestana === 'logros' && <Logros onVolver={() => ir('inicio')} />}
      </main>

      {/* Barra flotante: 5 pestañas y, a la derecha, el botón + (dentro de la barra para no tapar nunca el contenido) */}
      <nav aria-label="Secciones" className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-md items-center gap-1.5 rounded-[26px] border border-border bg-surface/90 p-1.5 shadow-[0_10px_30px_-12px_rgba(16,24,40,0.25)] backdrop-blur-xl">
          <ul className="flex min-w-0 flex-1 gap-0.5">
            {PESTANAS.map(({ id, texto, corto, Icono }) => {
              const activo = pestana === id || (id === 'inicio' && pestana === 'logros');
              return (
                <li key={id} className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => ir(id, id === 'movimientos' ? {} : undefined)}
                    aria-current={activo ? 'page' : undefined}
                    aria-label={texto}
                    className={`flex min-h-13 w-full flex-col items-center justify-center gap-0.5 rounded-[20px] px-0 text-[10px] min-[375px]:px-0.5 font-medium transition min-[375px]:text-[10.5px] ${activo ? 'bg-brand-soft text-brand' : 'text-muted'}`}
                  >
                    <Icono width={22} height={22} strokeWidth={activo ? 2.1 : 1.8} />
                    <span className="max-w-full truncate tracking-[-0.02em]" aria-hidden="true">
                      {corto ? (
                        <>
                          <span className="min-[440px]:hidden">{corto}</span>
                          <span className="hidden min-[440px]:inline">{texto}</span>
                        </>
                      ) : (
                        texto
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            className="flex size-13 shrink-0 items-center justify-center rounded-[20px] bg-brand text-on-brand shadow-[0_6px_16px_-6px_rgba(43,92,230,0.6)] transition active:scale-95"
            onClick={() => abrirEditor()}
            aria-label="Añadir movimiento"
          >
            <IconoMas width={26} height={26} />
          </button>
        </div>
      </nav>

      {editor.abierto && <Editor />}
      {!editor.abierto && <Celebracion onVerLogros={() => ir('logros')} />}
      <Aviso />
    </div>
    </NavCtx.Provider>
  );
}

const PESTANAS = [
  { id: 'inicio', texto: 'Hoy', corto: undefined, Icono: IconoHoy },
  { id: 'movimientos', texto: 'Movimientos', corto: 'Movim.', Icono: IconoLista },
  { id: 'pagos', texto: 'Contabilidad', corto: 'Contab.', Icono: IconoMoneda },
  { id: 'finanzas', texto: 'Finanzas', corto: undefined, Icono: IconoCartera },
  { id: 'estadisticas', texto: 'Análisis', corto: undefined, Icono: IconoGrafico },
] as const;
