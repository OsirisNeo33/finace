import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { ProveedorDatos, useDatos } from './contexto';
import { Editor } from './components/Editor';
import { Aviso } from './components/Aviso';
import { IconoCartera, IconoGrafico, IconoHoy, IconoLista, IconoMas, IconoMoneda } from './components/Iconos';
import { Inicio } from './pantallas/Inicio';
import { Movimientos } from './pantallas/Movimientos';
import { Estadisticas } from './pantallas/Estadisticas';
import { Ajustes } from './pantallas/Ajustes';
import { Bienvenida } from './pantallas/Bienvenida';
import { Contabilidad } from './pantallas/Contabilidad';
import { Finanzas } from './pantallas/Finanzas';
import { NavCtx } from './navegacion';
import { Logros } from './pantallas/Logros';
import { Celebracion } from './components/Celebracion';
import { generarRecurrentes } from './db/acciones';
import { periodoDe } from './domain/fechas';
export default function App() {
    return (_jsx(ProveedorDatos, { children: _jsx(Contenido, {}) }));
}
function usarTema(tema) {
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
    const [pestana, setPestana] = useState('inicio');
    const [desplazamiento, setDesplazamiento] = useState(0);
    const [filtro, setFiltro] = useState({});
    const [vistaConta, setVistaConta] = useState('resumen');
    const [vistaFinanzas, setVistaFinanzas] = useState('resumen');
    const [anterior, setAnterior] = useState('inicio');
    usarTema(ajustes.tema);
    const periodo = useMemo(() => periodoDe(new Date(), ajustes.diaInicioMes, desplazamiento), [ajustes.diaInicioMes, desplazamiento]);
    useEffect(() => {
        if (!ajustes.configurado)
            return;
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
        if (!cargando && !ajustes.configurado)
            setPestana('inicio');
    }, [cargando, ajustes.configurado]);
    if (cargando)
        return _jsx("div", { className: "flex min-h-dvh items-center justify-center text-muted", children: "Cargando\u2026" });
    if (!ajustes.configurado)
        return _jsx(Bienvenida, {});
    const ir = (p, f) => {
        if (f)
            setFiltro(f);
        if (p === 'calendario' || p === 'pagos')
            setVistaConta(p === 'calendario' ? 'calendario' : 'resumen');
        if (p === 'ajustes' && pestana !== 'ajustes')
            setAnterior(pestana);
        if (p === 'cobros')
            setVistaFinanzas('cobros');
        else if (p === 'finanzas')
            setVistaFinanzas('resumen');
        setPestana(p === 'calendario' ? 'pagos' : p === 'cobros' ? 'finanzas' : p);
    };
    const props = { periodo, desplazamiento, setDesplazamiento, ir };
    return (_jsx(NavCtx.Provider, { value: ir, children: _jsxs("div", { className: "min-h-dvh", style: { paddingBottom: 'calc(6.5rem + env(safe-area-inset-bottom))' }, children: [_jsxs("main", { children: [pestana === 'inicio' && _jsx(Inicio, { ...props }), pestana === 'movimientos' && _jsx(Movimientos, { ...props, filtro: filtro, setFiltro: setFiltro }), pestana === 'pagos' && _jsx(Contabilidad, { vista: vistaConta, setVista: setVistaConta }), pestana === 'estadisticas' && _jsx(Estadisticas, { ...props }), pestana === 'finanzas' && _jsx(Finanzas, { vista: vistaFinanzas, setVista: setVistaFinanzas }), pestana === 'ajustes' && _jsx(Ajustes, { irA: (p) => ir(p), onVolver: () => ir(anterior) }), pestana === 'logros' && _jsx(Logros, { onVolver: () => ir('inicio') })] }), _jsx("nav", { "aria-label": "Secciones", className: "fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]", children: _jsxs("div", { className: "mx-auto flex max-w-md items-center gap-1.5 rounded-[26px] border border-border bg-surface/90 p-1.5 shadow-[0_10px_30px_-12px_rgba(16,24,40,0.25)] backdrop-blur-xl", children: [_jsx("ul", { className: "flex min-w-0 flex-1 gap-0.5", children: PESTANAS.map(({ id, texto, corto, Icono }) => {
                                    const activo = pestana === id || (id === 'inicio' && pestana === 'logros');
                                    return (_jsx("li", { className: "min-w-0 flex-1", children: _jsxs("button", { type: "button", onClick: () => ir(id, id === 'movimientos' ? {} : undefined), "aria-current": activo ? 'page' : undefined, "aria-label": texto, className: `flex min-h-13 w-full flex-col items-center justify-center gap-0.5 rounded-[20px] px-0 text-[10px] min-[375px]:px-0.5 font-medium transition min-[375px]:text-[10.5px] ${activo ? 'bg-brand-soft text-brand' : 'text-muted'}`, children: [_jsx(Icono, { width: 22, height: 22, strokeWidth: activo ? 2.1 : 1.8 }), _jsx("span", { className: "max-w-full truncate tracking-[-0.02em]", "aria-hidden": "true", children: corto ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "min-[440px]:hidden", children: corto }), _jsx("span", { className: "hidden min-[440px]:inline", children: texto })] })) : (texto) })] }) }, id));
                                }) }), _jsx("button", { type: "button", className: "flex size-13 shrink-0 items-center justify-center rounded-[20px] bg-brand text-on-brand shadow-[0_6px_16px_-6px_rgba(43,92,230,0.6)] transition active:scale-95", onClick: () => abrirEditor(), "aria-label": "A\u00F1adir movimiento", children: _jsx(IconoMas, { width: 26, height: 26 }) })] }) }), editor.abierto && _jsx(Editor, {}), !editor.abierto && _jsx(Celebracion, { onVerLogros: () => ir('logros') }), _jsx(Aviso, {})] }) }));
}
const PESTANAS = [
    { id: 'inicio', texto: 'Hoy', corto: undefined, Icono: IconoHoy },
    { id: 'movimientos', texto: 'Movimientos', corto: 'Movim.', Icono: IconoLista },
    { id: 'pagos', texto: 'Contabilidad', corto: 'Contab.', Icono: IconoMoneda },
    { id: 'finanzas', texto: 'Finanzas', corto: undefined, Icono: IconoCartera },
    { id: 'estadisticas', texto: 'Análisis', corto: undefined, Icono: IconoGrafico },
];
