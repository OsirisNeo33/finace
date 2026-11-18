import { useEffect, useMemo, useState } from 'react';
import { ProveedorDatos, useDatos } from './contexto';
import { Editor } from './components/Editor';
import { Aviso } from './components/Aviso';
import { IconoAjustes, IconoGrafico, IconoInicio, IconoLista, IconoMas } from './components/Iconos';
import { Inicio } from './pantallas/Inicio';
import { Movimientos, type Filtro } from './pantallas/Movimientos';
import { Estadisticas } from './pantallas/Estadisticas';
import { Ajustes } from './pantallas/Ajustes';
import { Bienvenida } from './pantallas/Bienvenida';
import { Pagos } from './pantallas/Pagos';
import { Logros } from './pantallas/Logros';
import { Celebracion } from './components/Celebracion';
import { IconoCalendario } from './components/Iconos';
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
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', oscuro ? '#0b0f14' : '#f6f7f9');
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

  if (cargando) return <div className="flex min-h-dvh items-center justify-center texto-2">Cargando…</div>;
  if (!ajustes.configurado) return <Bienvenida />;

  const ir = (p: Pestana, f?: Filtro) => {
    if (f) setFiltro(f);
    setPestana(p);
  };
  const props = { periodo, desplazamiento, setDesplazamiento, ir };

  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-28">
      {pestana === 'inicio' && <Inicio {...props} />}
      {pestana === 'movimientos' && <Movimientos {...props} filtro={filtro} setFiltro={setFiltro} />}
      {pestana === 'pagos' && <Pagos />}
      {pestana === 'estadisticas' && <Estadisticas {...props} />}
      {pestana === 'ajustes' && <Ajustes irA={(p) => ir(p)} />}
      {pestana === 'logros' && <Logros />}

      <nav className="pb-seguro fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur" style={{ borderColor: 'var(--borde)', background: 'color-mix(in srgb, var(--superficie) 88%, transparent)' }}>
        <div className="mx-auto grid max-w-2xl grid-cols-6 items-center">
          <BotonNav activo={pestana === 'inicio'} onClick={() => ir('inicio')} icono={<IconoInicio />} texto="Inicio" />
          <BotonNav activo={pestana === 'movimientos'} onClick={() => ir('movimientos', {})} icono={<IconoLista />} texto="Movimientos" />
          <BotonNav activo={pestana === 'pagos'} onClick={() => ir('pagos')} icono={<IconoCalendario />} texto="Pagos" />
          <div className="flex justify-center">
            <button
              className="-mt-7 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-marca)] text-white shadow-lg shadow-teal-900/30 active:scale-95 dark:text-teal-950"
              onClick={() => abrirEditor()}
              aria-label="Añadir movimiento"
            >
              <IconoMas width={30} height={30} strokeWidth={2.5} />
            </button>
          </div>
          <BotonNav activo={pestana === 'estadisticas'} onClick={() => ir('estadisticas')} icono={<IconoGrafico />} texto="Análisis" />
          <BotonNav activo={pestana === 'ajustes'} onClick={() => ir('ajustes')} icono={<IconoAjustes />} texto="Ajustes" />
        </div>
      </nav>

      {editor.abierto && <Editor />}
      {!editor.abierto && <Celebracion onVerLogros={() => ir('logros')} />}
      <Aviso />
    </div>
  );
}

function BotonNav({ activo, onClick, icono, texto }: { activo: boolean; onClick: () => void; icono: React.ReactNode; texto: string }) {
  return (
    <button className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium" style={{ color: activo ? 'var(--color-marca)' : 'var(--texto-2)' }} onClick={onClick} aria-current={activo ? 'page' : undefined}>
      {icono}
      {texto}
    </button>
  );
}
