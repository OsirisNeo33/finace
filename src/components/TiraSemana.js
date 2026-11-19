import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { addDays, format, parseISO, startOfISOWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { aISO } from '../domain/fechas';
import { Card, CardTitle, cx } from './ui';
const LETRAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
/** Tira con los días de la semana actual: hoy en una pastilla azul y un punto en los días con movimientos. */
export function TiraSemana({ hoy, detalle, ocupados }) {
    const lunes = startOfISOWeek(parseISO(hoy));
    const dias = Array.from({ length: 7 }, (_, i) => aISO(addDays(lunes, i)));
    return (_jsxs(Card, { className: "pb-4", children: [_jsx(CardTitle, { detail: detalle, children: _jsx("span", { className: "inline-block first-letter:uppercase", children: format(parseISO(hoy), 'LLLL', { locale: es }) }) }), _jsx("ol", { className: "grid grid-cols-7 gap-1 text-center", children: dias.map((iso, i) => {
                    const esHoy = iso === hoy;
                    return (_jsxs("li", { "aria-current": esHoy ? 'date' : undefined, className: cx('flex flex-col items-center gap-1 rounded-2xl py-2', esHoy && 'bg-brand text-on-brand shadow-[0_6px_16px_-6px_rgba(43,92,230,0.6)]'), children: [_jsx("span", { className: cx('text-[11px]', esHoy ? 'text-on-brand/80' : 'text-muted'), children: LETRAS[i] }), _jsx("span", { className: "num text-[16px] font-semibold", children: Number(iso.slice(8)) }), _jsx("span", { className: cx('size-1.5 rounded-full', ocupados?.has(iso) ? (esHoy ? 'bg-on-brand' : 'bg-accent') : 'bg-transparent') })] }, iso));
                }) })] }));
}
