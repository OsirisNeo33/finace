import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { SelectorPeriodo } from '../components/SelectorPeriodo';
import { IconoBajar, IconoDescargar, IconoMas, IconoSubir } from '../components/Iconos';
import { Alerta, Button, Card, CardTitle, Cifra, Emoji, IconBadge, Page, PageHeader, Panel, ProgressBar, Segmented, Tile, TileButton, cx, tonoPresupuesto } from '../components/ui';
import { FormRecurrente } from './ajustes/Recurrentes';
import { Pagos } from './Pagos';
export function Contabilidad({ vista, setVista }) {
    return (_jsxs(_Fragment, { children: [_jsx(PageHeader, { title: "Contabilidad", subtitle: "Tus ingresos y gastos fijos, y lo que te queda", action: _jsx(BotonAjustes, {}) }), _jsxs(Page, { children: [_jsx(Segmented, { label: "Vista", value: vista, onChange: setVista, options: [
                            { value: 'resumen', label: 'Resumen' },
                            { value: 'calendario', label: 'Calendario de pagos' },
                        ] }), vista === 'resumen' ? _jsx(Resumen, {}) : _jsx(Pagos, { embebido: true })] })] }));
}
/** "Cada mes · día 5", "Cada semana · lunes", "Cada año · 3 de marzo" */
function cuando(r) {
    const d = parseISO(r.inicio);
    if (r.frecuencia === 'mensual')
        return `Cada mes · día ${d.getDate()}`;
    if (r.frecuencia === 'semanal')
        return `Cada semana · ${format(d, 'EEEE', { locale: es })}`;
    return `Cada año · ${format(d, "d 'de' MMMM", { locale: es })}`;
}
function Resumen() {
    const { movimientos, categoriaPorId, dinero, ajustes } = useDatos();
    const recurrentes = useLiveQuery(() => db.recurrentes.toArray(), [], []);
    const [desplazamiento, setDesplazamiento] = useState(0);
    const [form, setForm] = useState(null);
    const periodo = useMemo(() => periodoDe(new Date(), ajustes.diaInicioMes, desplazamiento), [ajustes.diaInicioMes, desplazamiento]);
    const movs = useMemo(() => movimientos.filter((m) => enPeriodo(m, periodo)), [movimientos, periodo]);
    const r = resumen(movs);
    const fijos = resumenFijos(recurrentes);
    const { fijos: gastadoFijo, variables } = gastosFijosYVariables(movs);
    const ordenar = (tipo) => recurrentes.filter((x) => x.tipo === tipo).sort((a, b) => Number(b.activo) - Number(a.activo) || equivalenteMensual(b) - equivalenteMensual(a));
    const ingresosFijos = ordenar('ingreso');
    const gastosFijos = ordenar('gasto');
    const usoLibre = fijos.libre > 0 ? variables / fijos.libre : 0;
    const fila = (x) => {
        const c = x.categoriaId ? categoriaPorId.get(x.categoriaId) : undefined;
        const mensual = equivalenteMensual(x);
        return (_jsx(TileButton, { className: x.activo ? undefined : 'opacity-60', icon: _jsx(Emoji, { children: c?.icono ?? '🔁' }), title: x.nota || c?.nombre || (x.tipo === 'ingreso' ? 'Ingreso fijo' : 'Gasto fijo'), subtitle: x.activo ? `${cuando(x)}${x.automatico === false ? ' · Recordatorio' : ''}` : 'Pausado', detail: _jsxs("span", { className: "flex flex-col items-end", children: [_jsx("span", { className: cx('num text-[15px] font-semibold', x.tipo === 'ingreso' ? 'text-success' : 'text-text'), children: x.tipo === 'ingreso' ? dinero(x.importe, { signo: true }) : dinero(-x.importe) }), x.frecuencia !== 'mensual' && _jsxs("span", { className: "num text-[12px] text-muted", children: ["\u2248 ", dinero(mensual), "/mes"] })] }), chevron: true, onClick: () => setForm({ r: x }) }, x.id));
    };
    const anadir = (tipo) => (_jsx(TileButton, { icon: _jsx("span", { className: cx('flex size-9 shrink-0 items-center justify-center rounded-xl', tipo === 'ingreso' ? 'bg-success-soft text-success' : 'bg-brand-soft text-brand'), children: _jsx(IconoMas, { width: 20, height: 20 }) }), title: _jsx("span", { className: tipo === 'ingreso' ? 'text-success' : 'text-brand', children: tipo === 'ingreso' ? 'Añadir ingreso fijo' : 'Añadir gasto fijo' }), subtitle: tipo === 'ingreso' ? 'Nómina, pensión, alquiler que cobras…' : 'Alquiler, hipoteca, luz, móvil, gimnasio…', onClick: () => setForm({ tipo }) }));
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs(Button, { onClick: () => setForm({ tipo: 'gasto' }), children: [_jsx(IconoBajar, { width: 18, height: 18 }), " Gasto fijo"] }), _jsxs(Button, { variant: "secondary", onClick: () => setForm({ tipo: 'ingreso' }), children: [_jsx(IconoSubir, { width: 18, height: 18, className: "text-success" }), " Ingreso fijo"] })] }), _jsx(SelectorPeriodo, { periodo: periodo, desplazamiento: desplazamiento, setDesplazamiento: setDesplazamiento, diaInicio: ajustes.diaInicioMes }), _jsxs(Card, { dark: true, children: [_jsx("p", { className: "text-[13px] text-white/60", children: "Resultado del mes" }), _jsx(Cifra, { max: 34, className: "mt-1", "data-testid": "resultado", children: dinero(r.balance, { signo: true }) }), _jsxs("div", { className: "mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("p", { className: "flex items-center gap-1 text-[13px] text-white/60", children: [_jsx(IconoSubir, { width: 14, height: 14 }), " Ingresos"] }), _jsx(Cifra, { max: 20, className: "mt-0.5", children: dinero(r.ingresos) })] }), _jsxs("div", { className: "min-w-0", children: [_jsxs("p", { className: "flex items-center gap-1 text-[13px] text-white/60", children: [_jsx(IconoBajar, { width: 14, height: 14 }), " Gastos"] }), _jsx(Cifra, { max: 20, className: "mt-0.5", children: dinero(r.gastos) })] })] }), r.gastos > 0 && (_jsxs("p", { className: "mt-3 text-[13px] text-white/60", children: ["De los gastos, ", _jsx("b", { className: "num text-white", children: dinero(gastadoFijo) }), " son fijos y ", _jsx("b", { className: "num text-white", children: dinero(variables) }), " del d\u00EDa a d\u00EDa."] }))] }), _jsxs(Card, { children: [_jsx(CardTitle, { detail: "cada mes", children: "Tu mes con los fijos" }), _jsxs("div", { className: "space-y-2 text-[15px]", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("span", { className: "flex items-center gap-2", children: [_jsx(IconoSubir, { width: 16, height: 16, className: "text-success" }), " Ingresos fijos"] }), _jsx("span", { className: "num font-semibold text-success", "data-testid": "ingresos-fijos", children: dinero(fijos.ingresos, { signo: true }) })] }), _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("span", { className: "flex items-center gap-2", children: [_jsx(IconoBajar, { width: 16, height: 16, className: "text-muted" }), " Gastos fijos"] }), _jsx("span", { className: "num font-semibold", "data-testid": "gastos-fijos", children: dinero(-fijos.gastos) })] }), _jsxs("div", { className: "flex items-center justify-between gap-3 border-t border-border pt-2", children: [_jsx("span", { className: "font-semibold", children: "Libre para el d\u00EDa a d\u00EDa" }), _jsx("span", { className: cx('num text-[17px] font-semibold', fijos.libre < 0 && 'text-danger'), "data-testid": "libre", children: dinero(fijos.libre) })] })] }), fijos.ingresos === 0 && fijos.gastos === 0 ? (_jsx("p", { className: "mt-3 text-[13px] text-muted", children: "A\u00F1ade tu n\u00F3mina y tus gastos fijos para ver cu\u00E1nto te queda libre cada mes." })) : fijos.libre > 0 ? (_jsxs("div", { className: "mt-4", children: [_jsxs("div", { className: "mb-1.5 flex items-center justify-between gap-3 text-[13px]", children: [_jsx("span", { className: "text-muted", children: "Gastado del d\u00EDa a d\u00EDa este mes" }), _jsxs("span", { className: "num font-medium", children: [dinero(variables), " / ", dinero(fijos.libre)] })] }), _jsx(ProgressBar, { value: usoLibre, tone: tonoPresupuesto(usoLibre) }), _jsx("p", { className: "mt-1.5 text-[13px] text-muted", children: variables <= fijos.libre ? _jsxs(_Fragment, { children: ["Te quedan ", _jsx("b", { className: "num text-text", children: dinero(fijos.libre - variables) }), " este mes."] }) : _jsxs("span", { className: "text-danger", children: ["Te has pasado en ", dinero(variables - fijos.libre), "."] }) })] })) : (_jsx("div", { className: "mt-3", children: _jsxs(Alerta, { children: ["Tus gastos fijos superan a tus ingresos fijos en ", dinero(-fijos.libre), " al mes."] }) }))] }), _jsxs(Panel, { title: "Ingresos fijos", detail: _jsxs("span", { className: "num", children: [dinero(fijos.ingresos), "/mes"] }), children: [ingresosFijos.map(fila), anadir('ingreso')] }), _jsxs(Panel, { title: "Gastos fijos", detail: _jsxs("span", { className: "num", children: [dinero(fijos.gastos), "/mes"] }), footer: "Los fijos se apuntan solos el d\u00EDa que toca. Si eliges \u00ABrecordatorio\u00BB, te avisa en el calendario y lo marcas t\u00FA como pagado.", children: [gastosFijos.map(fila), anadir('gasto')] }), _jsx(Panel, { title: "Exportar", children: _jsx(TileButton, { icon: _jsx(IconBadge, { tone: "success", children: _jsx(IconoDescargar, { width: 20, height: 20 }) }), title: _jsx("span", { className: "first-letter:uppercase", children: `${periodo.etiqueta} a Excel (CSV)` }), subtitle: `${movs.length} ${movs.length === 1 ? 'movimiento' : 'movimientos'}, con columna «Fijo»`, chevron: true, onClick: async () => descargar(`finace-${periodo.inicio.slice(0, 7)}.csv`, await exportarCSV(periodo.inicio, periodo.fin), 'text/csv;charset=utf-8').catch(() => { }) }) }), recurrentes.length === 0 && (_jsx(Tile, { children: _jsx("span", { className: "text-[14px] text-muted", children: "Consejo: empieza por tu n\u00F3mina y tu alquiler o hipoteca. Con eso ya ver\u00E1s cu\u00E1nto te queda libre." }) })), form && _jsx(FormRecurrente, { r: form.r, tipoInicial: form.tipo, onCerrar: () => setForm(null) })] }));
}
