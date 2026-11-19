import { useEffect, useMemo, useState } from 'react';
import { ProveedorDatos, useDatos } from './contexto';
import { Editor } from './components/Editor';
import { Aviso } from './components/Aviso';
import { IconoAjustes, IconoGrafico, IconoHoy, IconoLista, IconoMas, IconoCalendario } from './components/Iconos';
import { Inicio } from './pantallas/Inicio';
import { Movimientos, type Filtro } from './pantallas/Movimientos';
import { Estadisticas } from './pantallas/Estadisticas';
import { Ajustes } from './pantallas/Ajustes';
import { Bienvenida } from './pantallas/Bienvenida';
import { Pagos } from './pantallas/Pagos';
import { Logros } from './pantallas/Logros';
import { Celebracion } from './components/Celebracion';
import { generarRecurrentes } from './db/acciones';
import { periodoDe } from './domain/fechas';

export type Pestana = 'inicio' | 'movimientos' | 'pagos' | 'estadisticas' | 'ajustes' | 'logros';

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

  if (cargando) return <div className="flex min-h-dvh items-center justify-center text-muted">Cargando…</div>;
  if (!ajustes.configurado) return <Bienvenida />;

  const ir = (p: Pestana, f?: Filtro) => {
    if (f) setFiltro(f);
    setPestana(p);
  };
  const props = { periodo, desplazamiento, setDesplazamiento, ir };

  const conBotonMas = pestana !== 'ajustes' && pestana !== 'logros';

  return (
    <div className="min-h-dvh" style={{ paddingBottom: `calc(${conBotonMas ? '10.5rem' : '6.5rem'} + env(safe-area-inset-bottom))` }}>
      <main>
        {pestana === 'inicio' && <Inicio {...props} />}
        {pestana === 'movimientos' && <Movimientos {...props} filtro={filtro} setFiltro={setFiltro} />}
        {pestana === 'pagos' && <Pagos />}
        {pestana === 'estadisticas' && <Estadisticas {...props} />}
        {pestana === 'ajustes' && <Ajustes irA={(p) => ir(p)} />}
        {pestana === 'logros' && <Logros onVolver={() => ir('inicio')} />}
      </main>

      {conBotonMas && (
        <div className="pointer-events-none fixed inset-x-0 z-30 mx-auto flex max-w-md justify-end px-4" style={{ bottom: 'calc(5.75rem + max(0.75rem, env(safe-area-inset-bottom)))' }}>
          <button
            type="button"
            className="pointer-events-auto flex size-14 items-center justify-center rounded-full bg-brand text-on-brand shadow-[0_6px_16px_-6px_rgba(43,92,230,0.6)] transition active:scale-95"
            onClick={() => abrirEditor()}
            aria-label="Añadir movimiento"
          >
            <IconoMas width={28} height={28} />
          </button>
        </div>
      )}

      <nav aria-label="Secciones" className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <ul className="mx-auto flex max-w-md gap-1 rounded-[26px] border border-border bg-surface/90 p-1.5 shadow-[0_10px_30px_-12px_rgba(16,24,40,0.25)] backdrop-blur-xl">
          {PESTANAS.map(({ id, texto, Icono }) => {
            const activo = pestana === id || (id === 'inicio' && pestana === 'logros');
            return (
              <li key={id} className="flex-1">
                <button
                  type="button"
                  onClick={() => ir(id, id === 'movimientos' ? {} : undefined)}
                  aria-current={activo ? 'page' : undefined}
                  className={`flex min-h-13 w-full flex-col items-center justify-center gap-0.5 rounded-[20px] text-[10.5px] font-medium transition ${activo ? 'bg-brand-soft text-brand' : 'text-muted'}`}
                >
                  <Icono width={22} height={22} strokeWidth={activo ? 2.1 : 1.8} />
                  {texto}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {editor.abierto && <Editor />}
      {!editor.abierto && <Celebracion onVerLogros={() => ir('logros')} />}
      <Aviso />
    </div>
  );
}

const PESTANAS = [
  { id: 'inicio', texto: 'Hoy', Icono: IconoHoy },
  { id: 'movimientos', texto: 'Movimientos', Icono: IconoLista },
  { id: 'pagos', texto: 'Pagos', Icono: IconoCalendario },
  { id: 'estadisticas', texto: 'Análisis', Icono: IconoGrafico },
  { id: 'ajustes', texto: 'Ajustes', Icono: IconoAjustes },
] as const;
