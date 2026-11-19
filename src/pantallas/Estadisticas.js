import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BotonAjustes } from '../navegacion';
import { useMemo, useState } from 'react';
import { eachDayOfInterval, getISODay, parseISO, differenceInCalendarDays } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDatos } from '../contexto';
import { SelectorPeriodo } from '../components/SelectorPeriodo';
import { GraficoMeses } from '../components/GraficoMeses';
import { Cifra, Card, CardTitle, Chip, Emoji, EmptyState, Label, Page, PageHeader, Panel, ProgressBar, Segmented, Tile, cx, tonoPresupuesto } from '../components/ui';
import { FilaMovimiento } from '../components/FilaMovimiento';
import { enPeriodo, progresoPresupuestos, resumen, totalesPorCategoria } from '../domain/calculos';
import { aISO, fechaLarga, hoyISO, mesCorto, periodoDe } from '../domain/fechas';
import { IconoGrafico } from '../components/Iconos';
import { db } from '../db/db';
export function Estadisticas({ periodo, desplazamiento, setDesplazamiento, ir }) {
    const { movimientos, categoriaPorId, dinero, ajustes } = useDatos();
    const presupuestos = useLiveQuery(() => db.presupuestos.toArray(), [], []);
    const [tipo, setTipo] = useState('gasto');
    const [diaSel, setDiaSel] = useState();
    const anterior = useMemo(() => periodoDe(new Date(), ajustes.diaInicioMes, desplazamiento - 1), [ajustes.diaInicioMes, desplazamiento]);
    const movs = useMemo(() => movimientos.filter((m) => enPeriodo(m, periodo)), [movimientos, periodo]);
    const movsAnt = useMemo(() => movimientos.filter((m) => enPeriodo(m, anterior)), [movimientos, anterior]);
    const r = resumen(movs);
    const rAnt = resumen(movsAnt);
    const categorias = useMemo(() => {
        const act = totalesPorCategoria(movs, tipo);
        const ant = totalesPorCategoria(movsAnt, tipo);
        return [...act]
            .map(([id, valor]) => {
            const c = categoriaPorId.get(id);
            return { id, valor, previo: ant.get(id) ?? 0, nombre: c?.nombre ?? 'Sin categoría', icono: c?.icono ?? '❔' };
        })
            .sort((a, b) => b.valor - a.valor);
    }, [movs, movsAnt, tipo, categoriaPorId]);
    const total = tipo === 'gasto' ? r.gastos : r.ingresos;
    // Evolución de los últimos 6 periodos
    const evolucion = useMemo(() => Array.from({ length: 6 }, (_, i) => {
        const p = periodoDe(new Date(), ajustes.diaInicioMes, desplazamiento - 5 + i);
        const rr = resumen(movimientos.filter((m) => enPeriodo(m, p)));
        return { clave: p.inicio, corto: mesCorto(ajustes.diaInicioMes === 1 ? p.inicio : p.fin), nombre: p.etiqueta, ingresos: rr.ingresos, gastos: rr.gastos, actual: i === 5 };
    }), [movimientos, ajustes.diaInicioMes, desplazamiento]);
    // Calendario
    const dias = useMemo(() => eachDayOfInterval({ start: parseISO(periodo.inicio), end: parseISO(periodo.fin) }).map(aISO), [periodo]);
    const gastoDia = useMemo(() => {
        const g = new Map();
        for (const m of movs)
            if (m.tipo === 'gasto')
                g.set(m.fecha, (g.get(m.fecha) ?? 0) + m.importe);
        return g;
    }, [movs]);
    const maxDia = Math.max(1, ...gastoDia.values());
    const hoy = hoyISO();
    const diasTranscurridos = hoy < periodo.inicio ? 0 : Math.min(dias.length, differenceInCalendarDays(parseISO(hoy), parseISO(periodo.inicio)) + 1);
    const mediaDiaria = diasTranscurridos ? Math.round(r.gastos / diasTranscurridos) : 0;
    const diaMax = [...gastoDia].sort((a, b) => b[1] - a[1])[0];
    const variacion = rAnt.gastos ? (r.gastos - rAnt.gastos) / rAnt.gastos : null;
    const progreso = progresoPresupuestos(presupuestos, movs).sort((a, b) => (a.presupuesto.categoriaId === null ? -1 : b.presupuesto.categoriaId === null ? 1 : b.porcentaje - a.porcentaje));
    return (_jsxs(_Fragment, { children: [_jsx(PageHeader, { title: "An\u00E1lisis", subtitle: "En qu\u00E9 se va tu dinero y c\u00F3mo evoluciona", action: _jsx(BotonAjustes, {}) }), _jsxs(Page, { children: [_jsx(SelectorPeriodo, { periodo: periodo, desplazamiento: desplazamiento, setDesplazamiento: setDesplazamiento, diaInicio: ajustes.diaInicioMes }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs(Card, { dark: true, className: "p-4", children: [_jsx("p", { className: "text-[13px] text-white/60", children: "Gasto medio diario" }), _jsx(Cifra, { max: 22, className: "mt-1", children: dinero(mediaDiaria) }), _jsx("p", { className: "mt-1 text-[12px] text-white/60", children: diasTranscurridos ? `En ${diasTranscurridos} ${diasTranscurridos === 1 ? 'día' : 'días'}` : 'Mes sin empezar' })] }), _jsxs(Card, { className: "p-4", children: [_jsx(Label, { children: "Tasa de ahorro" }), _jsx(Cifra, { max: 22, className: "mt-1", children: r.ingresos ? `${Math.round((r.balance / r.ingresos) * 100)} %` : '—' }), r.ingresos > 0 && (_jsx(Chip, { tone: r.balance >= 0 ? 'success' : 'danger', className: "mt-1.5", children: r.balance >= 0 ? 'Ahorras' : 'Gastas de más' }))] }), _jsxs(Card, { className: "p-4", children: [_jsx(Label, { children: "D\u00EDa de m\u00E1s gasto" }), _jsx(Cifra, { max: 22, className: "mt-1", children: diaMax ? dinero(diaMax[1]) : '—' }), diaMax && _jsx("p", { className: "mt-1 truncate text-[12px] text-muted first-letter:uppercase", children: fechaLarga(diaMax[0]) })] }), _jsxs(Card, { className: "p-4", children: [_jsx(Label, { children: "Vs. mes anterior" }), _jsx(Cifra, { max: 22, className: "mt-1", children: variacion === null ? '—' : `${variacion > 0 ? '+' : ''}${Math.round(variacion * 100)} %` }), variacion !== null && (_jsx(Chip, { tone: variacion > 0 ? 'danger' : 'success', className: "mt-1.5", children: variacion > 0 ? '▲ Has gastado más' : '▼ Has gastado menos' }))] })] }), _jsx(Segmented, { label: "Tipo", value: tipo, onChange: setTipo, options: [
                            { value: 'gasto', label: 'Gastos' },
                            { value: 'ingreso', label: 'Ingresos' },
                        ] }), categorias.length === 0 ? (_jsx(EmptyState, { icon: _jsx(IconoGrafico, {}), title: `Sin ${tipo === 'gasto' ? 'gastos' : 'ingresos'} este mes`, children: "Cuando apuntes movimientos ver\u00E1s aqu\u00ED en qu\u00E9 categor\u00EDas se reparten." })) : (_jsx(Panel, { title: "Por categor\u00EDa", detail: _jsxs("span", { className: "num", children: ["Total ", dinero(total)] }), children: categorias.map((c) => {
                            const cambio = c.previo ? (c.valor - c.previo) / c.previo : null;
                            const malo = cambio !== null && cambio > 0 === (tipo === 'gasto');
                            return (_jsxs("button", { type: "button", className: "flex w-full flex-col gap-2 rounded-[18px] border border-border bg-surface px-3.5 py-3 text-left tarjeta-tactil active:bg-surface-2", onClick: () => ir('movimientos', { categoriaId: c.id, periodo: true }), children: [_jsxs("span", { className: "flex w-full items-center gap-3", children: [_jsx(Emoji, { children: c.icono }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block truncate text-[15px] font-medium", children: c.nombre }), _jsxs("span", { className: "num block text-[13px] text-muted", children: [Math.round((c.valor / total) * 100), " %"] })] }), _jsxs("span", { className: "flex flex-col items-end gap-1", children: [_jsx("span", { className: "num text-[15px] font-semibold", children: dinero(c.valor) }), cambio !== null && Math.abs(cambio) >= 0.05 && (_jsxs(Chip, { tone: malo ? 'danger' : 'success', className: "num", children: [cambio > 0 ? '▲' : '▼', " ", Math.abs(Math.round(cambio * 100)), " %"] }))] })] }), _jsx(ProgressBar, { value: c.valor / categorias[0].valor })] }, c.id));
                        }) })), _jsx(Panel, { title: "Presupuestos", footer: progreso.length === 0 ? 'Aún no tienes presupuestos. Créalos en Ajustes → Presupuestos para recibir avisos al acercarte al límite.' : undefined, children: progreso.map((p) => {
                            const c = p.presupuesto.categoriaId ? categoriaPorId.get(p.presupuesto.categoriaId) : undefined;
                            return (_jsxs(Tile, { className: "flex-col items-stretch gap-2", children: [_jsxs("span", { className: "flex items-center gap-3", children: [_jsx(Emoji, { children: c ? c.icono : '🎯' }), _jsx("span", { className: "min-w-0 flex-1 truncate text-[15px] font-medium", children: c ? c.nombre : 'Total del mes' }), _jsx(Chip, { tone: p.estado === 'superado' ? 'danger' : p.porcentaje >= 0.8 ? 'warning' : 'success', className: "num", children: p.restante >= 0 ? `Quedan ${dinero(p.restante)}` : `Pasado ${dinero(-p.restante)}` })] }), _jsx(ProgressBar, { value: p.porcentaje, tone: tonoPresupuesto(p.porcentaje) })] }, p.presupuesto.id));
                        }) }), _jsxs(Card, { className: "p-4", children: [_jsx(CardTitle, { detail: "M\u00E1s color, m\u00E1s gasto", children: "Calendario de gastos" }), _jsx("div", { className: "mb-1 grid grid-cols-7 text-center text-[11px] text-muted", children: ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (_jsx("span", { children: d }, d))) }), _jsxs("div", { className: "grid grid-cols-7 gap-1", children: [Array.from({ length: getISODay(parseISO(dias[0])) - 1 }, (_, i) => (_jsx("span", {}, 'v' + i))), dias.map((d) => {
                                        const g = gastoDia.get(d) ?? 0;
                                        const intensidad = g ? 0.15 + 0.85 * (g / maxDia) : 0;
                                        return (_jsxs("button", { type: "button", className: cx('flex min-h-11 min-w-0 flex-col items-center justify-center rounded-xl sm:aspect-square text-[13px] transition active:scale-95', !g && 'bg-surface-2', d === diaSel ? 'ring-2 ring-brand' : d === hoy && 'ring-1 ring-muted', d > hoy && 'opacity-40'), style: {
                                                background: g ? `color-mix(in srgb, var(--chart-expense) ${Math.round(intensidad * 100)}%, var(--surface))` : undefined,
                                                color: intensidad > 0.55 ? 'white' : undefined,
                                            }, onClick: () => setDiaSel(diaSel === d ? undefined : d), "aria-label": `${fechaLarga(d)}: ${dinero(g)}`, "aria-pressed": d === diaSel, children: [_jsx("span", { className: "num font-medium", children: parseISO(d).getDate() }), g > 0 && _jsx("span", { className: "num hidden text-[9px] sm:block", children: dinero(g, { sinDecimales: true }) })] }, d));
                                    })] })] }), diaSel && (_jsx(Panel, { title: _jsx("span", { className: "first-letter:uppercase", children: fechaLarga(diaSel) }), children: movs.filter((m) => m.fecha === diaSel).length === 0 ? (_jsx(Tile, { children: _jsx("span", { className: "text-[14px] text-muted", children: "Sin movimientos." }) })) : (movs.filter((m) => m.fecha === diaSel).map((m) => _jsx(FilaMovimiento, { m: m }, m.id))) })), _jsxs(Card, { children: [_jsx(CardTitle, { children: "\u00DAltimos 6 meses" }), _jsx(GraficoMeses, { datos: evolucion, formatear: (c) => dinero(c) })] })] })] }));
}
