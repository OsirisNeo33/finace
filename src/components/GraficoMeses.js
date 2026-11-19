import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { cx } from './ui';
/** Abrevia importes del eje: 12.500 -> "12,5k". */
function eje(centimos) {
    const u = centimos / 100;
    if (u >= 1000)
        return `${(u / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })}k`;
    return Math.round(u).toLocaleString('es-ES');
}
/**
 * Barras agrupadas de ingresos y gastos por mes. Al tocar un mes se muestran
 * sus importes; debajo hay una tabla con los mismos datos.
 */
export function GraficoMeses({ datos, formatear }) {
    const [activo, setActivo] = useState(null);
    const max = Math.max(1, ...datos.flatMap((d) => [d.ingresos, d.gastos]));
    const H = 140;
    const anchoGrupo = 100 / datos.length;
    const anchoBarra = Math.min(anchoGrupo * 0.32, 7);
    const sel = activo !== null ? datos[activo] : null;
    return (_jsxs("div", { children: [_jsxs("div", { className: "mb-3 flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-3 text-[12px] text-muted", children: [_jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "size-2.5 rounded-[3px] bg-chart-income" }), " Ingresos"] }), _jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "size-2.5 rounded-[3px] bg-chart-expense" }), " Gastos"] })] }), _jsxs("span", { className: "num text-[11px] text-muted", children: ["m\u00E1x. ", eje(max)] })] }), _jsxs("div", { className: "relative", children: [sel && (_jsxs("div", { className: "pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-xl bg-surface-dark px-3 py-2 text-[12px] whitespace-nowrap text-white shadow-lg", style: { left: `clamp(76px, ${(activo + 0.5) * anchoGrupo}%, calc(100% - 76px))` }, role: "status", children: [_jsx("p", { className: "mb-1 text-white/60 first-letter:uppercase", children: sel.nombre }), _jsxs("p", { className: "flex items-center gap-2", children: [_jsx("span", { className: "h-0.5 w-3 rounded bg-chart-income" }), _jsx("span", { className: "num font-semibold", children: formatear(sel.ingresos) }), _jsx("span", { className: "text-white/60", children: "ingresos" })] }), _jsxs("p", { className: "flex items-center gap-2", children: [_jsx("span", { className: "h-0.5 w-3 rounded bg-chart-expense" }), _jsx("span", { className: "num font-semibold", children: formatear(sel.gastos) }), _jsx("span", { className: "text-white/60", children: "gastos" })] })] })), _jsxs("svg", { viewBox: `0 0 100 ${H}`, preserveAspectRatio: "none", className: "block h-36 w-full", role: "img", "aria-label": "Ingresos y gastos por mes", children: [_jsx("line", { x1: "0", x2: "100", y1: H / 2, y2: H / 2, className: "stroke-border", strokeWidth: "0.4", vectorEffect: "non-scaling-stroke", strokeDasharray: "2 3" }), datos.map((d, i) => {
                                const c = (i + 0.5) * anchoGrupo;
                                const hi = (d.ingresos / max) * (H - 4);
                                const hg = (d.gastos / max) * (H - 4);
                                const atenuado = activo !== null && activo !== i;
                                return (_jsxs("g", { opacity: activo === i ? 1 : atenuado ? 0.45 : d.actual ? 1 : 0.55, children: [_jsx("rect", { x: c - anchoBarra - 0.4, y: H - hi, width: anchoBarra, height: Math.max(hi, d.ingresos ? 1 : 0), rx: "1.2", className: "fill-chart-income" }), _jsx("rect", { x: c + 0.4, y: H - hg, width: anchoBarra, height: Math.max(hg, d.gastos ? 1 : 0), rx: "1.2", className: "fill-chart-expense" })] }, d.clave));
                            }), _jsx("line", { x1: "0", x2: "100", y1: H, y2: H, className: "stroke-border", strokeWidth: "1", vectorEffect: "non-scaling-stroke" })] }), _jsx("div", { className: "absolute inset-0 flex", children: datos.map((d, i) => (_jsx("button", { type: "button", "aria-label": `${d.nombre}: ingresos ${formatear(d.ingresos)}, gastos ${formatear(d.gastos)}`, className: "h-full flex-1", onPointerEnter: (e) => e.pointerType === 'mouse' && setActivo(i), onPointerLeave: (e) => e.pointerType === 'mouse' && setActivo(null), onFocus: () => setActivo(i), onBlur: () => setActivo(null), onClick: () => setActivo(i) }, d.clave))) })] }), _jsx("div", { className: "mt-1.5 flex", children: datos.map((d) => (_jsx("span", { className: cx('flex-1 text-center text-[10.5px] text-muted', d.actual && 'font-semibold text-text'), children: d.corto }, d.clave))) }), _jsxs("details", { className: "mt-3 text-[13px]", children: [_jsx("summary", { className: "min-h-11 cursor-pointer content-center text-muted", children: "Ver en tabla" }), _jsxs("table", { className: "num mt-1 w-full text-right", children: [_jsx("thead", { className: "text-muted", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left font-medium", children: "Mes" }), _jsx("th", { className: "font-medium", children: "Ingresos" }), _jsx("th", { className: "font-medium", children: "Gastos" }), _jsx("th", { className: "font-medium", children: "Resultado" })] }) }), _jsx("tbody", { children: datos.map((d) => (_jsxs("tr", { className: "border-t border-border", children: [_jsx("td", { className: "py-1 text-left font-sans", children: d.corto }), _jsx("td", { children: formatear(d.ingresos) }), _jsx("td", { children: formatear(d.gastos) }), _jsx("td", { className: d.ingresos - d.gastos < 0 ? 'text-danger' : undefined, children: formatear(d.ingresos - d.gastos) })] }, d.clave))) })] })] })] }));
}
