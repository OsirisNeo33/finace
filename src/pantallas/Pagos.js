import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { addDays, eachDayOfInterval, getISODay, parseISO } from 'date-fns';
import { useDatos } from '../contexto';
import { SelectorPeriodo } from '../components/SelectorPeriodo';
import { FormRecurrente } from './ajustes/Recurrentes';
import { aISO, fechaLarga, hoyISO, periodoDe } from '../domain/fechas';
import { db } from '../db/db';
import { marcarPagado, usarPagos } from './usarPagos';
import { IconoCheck, IconoMas } from '../components/Iconos';
import { Cifra, Button, Card, CardTitle, Chip, Emoji, HeaderButton, Label, Page, PageHeader, Panel, PanelLink, ProgressBar, Tile, cx } from '../components/ui';
const ESTADO = {
    pagado: { texto: 'Pagado', tono: 'success' },
    hoy: { texto: 'Hoy', tono: 'brand' },
    pendiente: { texto: 'Pendiente', tono: 'warning' },
    vencido: { texto: 'Sin pagar', tono: 'danger' },
};
/** Calendario de pagos fijos. `embebido` lo muestra dentro de Contabilidad, sin cabecera propia. */
export function Pagos({ embebido } = {}) {
    const { dinero } = useDatos();
    const [desplazamiento, setDesplazamiento] = useState(0);
    const [diaSel, setDiaSel] = useState();
    const [form, setForm] = useState(null);
    const periodo = useMemo(() => periodoDe(new Date(), 1, desplazamiento), [desplazamiento]);
    const { pagos } = usarPagos(periodo.inicio, periodo.fin);
    const hoy = hoyISO();
    const gastos = pagos.filter((p) => p.recurrente.tipo === 'gasto');
    const total = gastos.reduce((s, p) => s + p.recurrente.importe, 0);
    const pagado = gastos.filter((p) => p.estado === 'pagado').reduce((s, p) => s + p.recurrente.importe, 0);
    const ingresos = pagos.filter((p) => p.recurrente.tipo === 'ingreso').reduce((s, p) => s + p.recurrente.importe, 0);
    const dias = useMemo(() => eachDayOfInterval({ start: parseISO(periodo.inicio), end: parseISO(periodo.fin) }).map(aISO), [periodo]);
    const porDia = useMemo(() => {
        const m = new Map();
        for (const p of pagos)
            m.set(p.fecha, [...(m.get(p.fecha) ?? []), p]);
        return m;
    }, [pagos]);
    const primero = parseISO(dias[0]);
    const ultimo = parseISO(dias[dias.length - 1]);
    const antes = Array.from({ length: getISODay(primero) - 1 }, (_, i) => aISO(addDays(primero, i - (getISODay(primero) - 1))));
    const despues = Array.from({ length: 7 - getISODay(ultimo) }, (_, i) => aISO(addDays(ultimo, i + 1)));
    const visibles = diaSel ? porDia.get(diaSel) ?? [] : pagos;
    const contenido = (_jsxs(_Fragment, { children: [_jsx(SelectorPeriodo, { periodo: periodo, desplazamiento: desplazamiento, setDesplazamiento: (n) => {
                    setDesplazamiento(n);
                    setDiaSel(undefined);
                }, diaInicio: 1, permitirFuturo: true }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs(Card, { dark: true, className: "p-4", children: [_jsx("p", { className: "text-[13px] text-white/60", children: "Pagos fijos este mes" }), _jsx(Cifra, { max: 22, className: "mt-1", "data-testid": "total-pagos", children: dinero(total) }), total > 0 && _jsxs("p", { className: "num mt-1 text-[12px] text-white/60", children: ["Falta ", dinero(total - pagado)] })] }), _jsxs(Card, { className: "p-4", children: [_jsx(Label, { children: ingresos > 0 ? 'Ingresos fijos' : 'Ya pagado' }), _jsx(Cifra, { max: 22, className: "mt-1", children: ingresos > 0 ? dinero(ingresos, { signo: true }) : dinero(pagado) }), total > 0 && (_jsx("div", { className: "mt-2.5", children: _jsx(ProgressBar, { value: pagado / total, tone: "success" }) }))] })] }), _jsxs(Card, { className: "p-4", children: [_jsx(CardTitle, { detail: diaSel ? _jsx(PanelLink, { onClick: () => setDiaSel(undefined), children: "Ver todo el mes" }) : 'Toca un día', children: _jsx("span", { className: "first-letter:uppercase", children: periodo.etiqueta }) }), _jsx("div", { className: "mb-1 grid grid-cols-7 text-center text-[11px] text-muted", children: ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (_jsx("span", { children: d }, d))) }), _jsxs("div", { className: "grid grid-cols-7 gap-y-1 text-center", children: [antes.map((d) => (_jsx("span", { className: "num flex min-h-12 items-start justify-center pt-2.5 text-[15px] text-muted/50", "aria-hidden": "true", children: parseISO(d).getDate() }, d))), dias.map((d) => {
                                const ps = porDia.get(d) ?? [];
                                const vencido = ps.some((p) => p.estado === 'vencido');
                                const todoPagado = ps.length > 0 && ps.every((p) => p.estado === 'pagado');
                                const elegido = d === diaSel;
                                return (_jsxs("button", { type: "button", className: cx('mx-auto flex min-h-12 w-full max-w-11 flex-col items-center gap-1 rounded-2xl pt-2.5 transition active:scale-95', elegido && 'bg-brand text-on-brand shadow-[0_6px_16px_-6px_rgba(43,92,230,0.6)]', !elegido && d === hoy && 'text-brand ring-1 ring-brand'), onClick: () => setDiaSel(elegido ? undefined : d), "aria-label": `${fechaLarga(d)}: ${ps.length} pagos`, "aria-pressed": elegido, children: [_jsx("span", { className: cx('num text-[15px] leading-none', d === hoy || elegido ? 'font-semibold' : 'font-medium'), children: parseISO(d).getDate() }), _jsx("span", { className: cx('size-1.5 rounded-full', !ps.length ? 'bg-transparent' : elegido ? 'bg-on-brand' : vencido ? 'bg-danger' : todoPagado ? 'bg-success' : 'bg-accent') })] }, d));
                            }), despues.map((d) => (_jsx("span", { className: "num flex min-h-12 items-start justify-center pt-2.5 text-[15px] text-muted/50", "aria-hidden": "true", children: parseISO(d).getDate() }, d)))] }), _jsxs("div", { className: "mt-3 flex flex-wrap gap-1.5", children: [_jsxs(Chip, { tone: "success", children: [_jsx("span", { className: "size-1.5 rounded-full bg-success" }), " Pagado"] }), _jsxs(Chip, { tone: "warning", children: [_jsx("span", { className: "size-1.5 rounded-full bg-accent" }), " Pendiente"] }), _jsxs(Chip, { tone: "danger", children: [_jsx("span", { className: "size-1.5 rounded-full bg-danger" }), " Sin pagar"] })] })] }), _jsxs(Panel, { title: diaSel ? _jsx("span", { className: "first-letter:uppercase", children: fechaLarga(diaSel) }) : 'Este mes', detail: visibles.length ? `${visibles.length}` : undefined, children: [visibles.length === 0 && (_jsx(Tile, { children: _jsx("span", { className: "text-[14px] text-muted", children: diaSel ? 'Ningún pago este día.' : 'Aún no tienes pagos fijos. Añade tus suscripciones (Netflix, Spotify, gimnasio…) y recibos (alquiler, luz, móvil…).' }) })), visibles.map((p) => (_jsx(FilaPago, { p: p, onEditar: () => setForm({ r: p.recurrente }) }, p.clave)))] }), _jsxs(Button, { className: "w-full", onClick: () => setForm({ inicio: diaSel }), children: ["+ ", diaSel ? `Añadir pago el día ${parseISO(diaSel).getDate()}` : 'Añadir suscripción o pago'] }), form && _jsx(FormRecurrente, { r: form.r, inicioInicial: form.inicio, onCerrar: () => setForm(null) })] }));
    if (embebido)
        return contenido;
    return (_jsxs(_Fragment, { children: [_jsx(PageHeader, { title: "Pagos", subtitle: "Suscripciones, recibos y pagos que se repiten", action: _jsx(HeaderButton, { label: "A\u00F1adir pago", onClick: () => setForm({ inicio: diaSel }), children: _jsx(IconoMas, { width: 22, height: 22 }) }) }), _jsx(Page, { children: contenido })] }));
}
export function FilaPago({ p, onEditar, mostrarFecha }) {
    const { categoriaPorId, dinero, avisar } = useDatos();
    const r = p.recurrente;
    const c = r.categoriaId ? categoriaPorId.get(r.categoriaId) : undefined;
    const e = ESTADO[p.estado];
    const manual = r.automatico === false;
    return (_jsxs("div", { className: "flex min-h-14 w-full items-center gap-3 rounded-[18px] border border-border bg-surface px-3.5 py-3", children: [_jsxs("button", { type: "button", className: "flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left", onClick: onEditar, children: [_jsx(Emoji, { children: c?.icono ?? '🔁' }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block truncate text-[15px] font-medium", children: r.nota || c?.nombre }), _jsxs("span", { className: "block truncate text-[13px] text-muted", children: [mostrarFecha ? _jsx("span", { className: "first-letter:uppercase", children: fechaLarga(p.fecha) }) : `Día ${parseISO(p.fecha).getDate()}`, manual ? (p.estado !== 'pagado' ? ` · ${e.texto} · Recordatorio` : ' · Recordatorio') : ' · Automático'] })] })] }), _jsxs("span", { className: "flex shrink-0 flex-col items-end gap-1", children: [_jsx("span", { className: cx('num text-[15px] font-semibold', r.tipo === 'ingreso' && 'text-success'), children: r.tipo === 'ingreso' ? dinero(r.importe, { signo: true }) : dinero(-r.importe) }), manual && p.estado !== 'pagado' ? (_jsxs("button", { type: "button", className: "-my-1 inline-flex min-h-10 items-center gap-1 rounded-full bg-brand-soft px-3 text-[12px] font-semibold text-brand active:scale-95", onClick: async () => {
                            const id = await marcarPagado(p);
                            avisar(`${r.nota || c?.nombre} marcado como pagado`, { etiqueta: 'Deshacer', hacer: () => db.movimientos.delete(id) });
                        }, children: [_jsx(IconoCheck, { width: 14, height: 14 }), " Marcar pagado"] })) : (_jsx(Chip, { tone: e.tono, children: e.texto }))] })] }));
}
