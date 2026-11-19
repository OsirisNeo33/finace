import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { IconoAtras, IconoSiguiente } from './Iconos';
export function cx(...clases) {
    return clases.filter(Boolean).join(' ');
}
/* ------------------------------------------------------------------ */
/* Estructura de página                                                */
/* ------------------------------------------------------------------ */
export function PageHeader({ title, subtitle, back, action }) {
    return (_jsxs("header", { className: "pt-safe sticky top-0 z-20 bg-bg/85 backdrop-blur-xl", children: [_jsxs("div", { className: "mx-auto flex min-h-12 max-w-2xl items-center justify-between gap-2 px-4 pt-1", children: [back ? (_jsxs("button", { type: "button", onClick: back.onClick, className: "-ml-1 flex min-h-11 items-center gap-0.5 pr-3 text-[15px] font-medium text-brand", children: [_jsx(IconoAtras, { width: 20, height: 20 }), back.label] })) : (_jsx("span", {})), action] }), _jsxs("div", { className: "mx-auto max-w-2xl px-5 pb-3", children: [_jsx("h1", { className: "text-[28px] leading-tight font-semibold tracking-tight", children: title }), subtitle && _jsx("p", { className: "mt-0.5 text-[14px] text-muted", children: subtitle })] })] }));
}
export function Page({ children }) {
    return _jsx("div", { className: "pagina mx-auto max-w-2xl space-y-3 px-4 pb-8", children: children });
}
/* ------------------------------------------------------------------ */
/* Contenedores                                                        */
/* ------------------------------------------------------------------ */
/** Tarjeta blanca muy redondeada; `dark` la convierte en la tarjeta negra destacada. */
export function Card({ className, dark, ...props }) {
    return _jsx("div", { ...props, className: cx('rounded-[26px] border p-5', props.onClick && 'tarjeta-tactil cursor-pointer', dark ? 'border-transparent bg-surface-dark text-white' : 'border-border bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]', className) });
}
export function CardTitle({ children, detail }) {
    return (_jsxs("div", { className: "mb-3 flex items-center justify-between gap-3", children: [_jsx("h2", { className: "text-[15px] font-semibold", children: children }), detail && _jsx("span", { className: "text-[13px] text-muted", children: detail })] }));
}
export function Label({ children, className }) {
    return _jsx("p", { className: cx('text-[13px] text-muted', className), children: children });
}
/** Panel gris que agrupa filas blancas. */
export function Panel({ title, detail, footer, children, className, ...props }) {
    return (_jsxs("section", { ...props, className: cx('rounded-[26px] border border-border bg-surface-2 p-2', className), children: [title && (_jsxs("div", { className: "flex min-h-9 items-center justify-between gap-3 px-3 pt-1 pb-1.5", children: [_jsx("h2", { className: "text-[15px] font-semibold", children: title }), detail && _jsx("span", { className: "text-[13px] text-muted", children: detail })] })), _jsx("div", { className: "space-y-1.5", children: children }), footer && _jsx("p", { className: "px-3 pt-2.5 pb-1.5 text-[13px] leading-snug text-muted", children: footer })] }));
}
/** Enlace de texto azul para la cabecera de un panel ("Ver todos"). */
export function PanelLink({ children, onClick }) {
    return (_jsx("button", { type: "button", onClick: onClick, className: "-my-2 min-h-11 pl-2 text-[13px] font-medium text-brand", children: children }));
}
const tileClass = 'flex min-h-14 w-full items-center gap-3 rounded-[18px] border border-border bg-surface px-3.5 py-3 text-left';
export function Tile({ className, ...props }) {
    return _jsx("div", { ...props, className: cx(tileClass, className) });
}
/** Cuadradito de color con un icono blanco. */
export function IconBadge({ children, tone = 'brand' }) {
    return (_jsx("span", { className: cx('flex size-9 shrink-0 items-center justify-center rounded-xl text-white', tone === 'brand' && 'bg-brand', tone === 'success' && 'bg-success', tone === 'warning' && 'bg-accent', tone === 'danger' && 'bg-danger', tone === 'dark' && 'bg-surface-dark'), children: children }));
}
/** Cuadradito neutro con un emoji (categorías y cuentas). */
export function Emoji({ children, grande }) {
    return _jsx("span", { className: cx('flex shrink-0 items-center justify-center rounded-xl border border-border bg-surface-2 leading-none', grande ? 'size-12 text-[24px]' : 'size-9 text-[18px]'), children: children });
}
function TileBody({ icon, title, subtitle, trailing }) {
    return (_jsxs(_Fragment, { children: [icon, _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block truncate text-[15px] font-medium", children: title }), subtitle && _jsx("span", { className: "block truncate text-[13px] text-muted", children: subtitle })] }), trailing] }));
}
/** Fila pulsable dentro de un Panel. Con `chevron` se comporta como un enlace. */
export function TileButton({ icon, title, subtitle, detail, chevron, className, ...props }) {
    return (_jsx("button", { type: "button", ...props, className: cx(tileClass, 'tarjeta-tactil active:bg-surface-2 disabled:opacity-50', className), children: _jsx(TileBody, { icon: icon, title: title, subtitle: subtitle, trailing: (detail || chevron) && (_jsxs(_Fragment, { children: [detail && _jsx("span", { className: "max-w-[50%] shrink-0 text-right text-[13px] text-muted", children: detail }), chevron && _jsx(IconoSiguiente, { width: 16, height: 16, className: cx('shrink-0 text-muted', !!detail && 'max-[374px]:hidden') })] })) }) }));
}
/** Fila de dato: etiqueta a la izquierda, valor a la derecha. */
export function DataTile({ label, value, mono }) {
    return (_jsxs(Tile, { className: "justify-between", children: [_jsx("span", { className: "text-[15px]", children: label }), _jsx("span", { className: cx('text-right text-[14px] text-muted', mono && 'num'), children: value })] }));
}
export const claseBoton = (variant = 'primary') => cx('flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-[16px] font-semibold transition active:scale-[0.98] disabled:opacity-50', variant === 'primary' && 'bg-brand text-on-brand shadow-[0_6px_16px_-6px_rgba(43,92,230,0.6)]', variant === 'secondary' && 'border border-border bg-surface text-text', variant === 'danger' && 'border border-border bg-surface text-danger', variant === 'dark' && 'bg-surface-dark text-white');
export function Button({ variant = 'primary', className, ...props }) {
    return _jsx("button", { type: "button", ...props, className: cx(claseBoton(variant), className) });
}
/** Botón redondo de 44 px para la cabecera. */
export function HeaderButton({ label, children, onClick }) {
    return (_jsx("button", { type: "button", "aria-label": label, onClick: onClick, className: "flex size-11 items-center justify-center rounded-full border border-border bg-surface text-brand shadow-sm active:scale-95 disabled:opacity-40", children: children }));
}
/** Control segmentado (Gastos / Ingresos…). */
export function Segmented({ value, options, onChange, label }) {
    return (_jsx("div", { role: "tablist", "aria-label": label, className: "flex rounded-2xl border border-border bg-surface-2 p-1", children: options.map((o) => (_jsx("button", { role: "tab", type: "button", "aria-selected": o.value === value, onClick: () => onChange(o.value), className: cx('min-h-10 min-w-0 flex-1 rounded-xl px-1 text-[14px] leading-tight font-medium transition', o.value === value ? 'bg-surface text-text shadow-sm' : 'text-muted'), children: o.label }, o.value))) }));
}
export function Toggle({ checked, onChange, label }) {
    return (_jsx("button", { type: "button", role: "switch", "aria-checked": checked, "aria-label": label, onClick: () => onChange(!checked), className: cx("relative h-8 w-[52px] shrink-0 rounded-full transition before:absolute before:-inset-1.5 before:content-['']", checked ? 'bg-brand' : 'bg-border'), children: _jsx("span", { className: cx('absolute top-1 size-6 rounded-full bg-white shadow transition-all', checked ? 'left-[24px]' : 'left-1') }) }));
}
export function ProgressBar({ value, tone = 'brand' }) {
    const pct = Math.max(0, Math.min(1, value)) * 100;
    return (_jsx("div", { className: "h-1.5 w-full overflow-hidden rounded-full bg-border", children: _jsx("div", { className: cx('h-full rounded-full transition-all', tone === 'brand' && 'bg-brand', tone === 'success' && 'bg-success', tone === 'danger' && 'bg-danger', tone === 'warning' && 'bg-accent'), style: { width: `${pct}%` } }) }));
}
/** Tono de la barra de un presupuesto según lo gastado. */
export const tonoPresupuesto = (p) => (p > 1 ? 'danger' : p >= 0.8 ? 'warning' : 'success');
const claseTonoChip = (tone) => cx(tone === 'neutral' && 'border-border bg-surface text-muted', tone === 'success' && 'border-transparent bg-success-soft text-success', tone === 'warning' && 'border-transparent bg-warning-soft text-warning', tone === 'danger' && 'border-transparent bg-danger-soft text-danger', tone === 'brand' && 'border-transparent bg-brand-soft text-brand');
/** Etiqueta de estado. En pantallas estrechas el texto puede pasar a dos líneas en vez de salirse. */
export function Chip({ tone = 'neutral', className, ...props }) {
    return _jsx("span", { ...props, className: cx('inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] leading-tight font-medium', claseTonoChip(tone), className) });
}
/**
 * Cifra grande que se reduce sola si no cabe en su tarjeta (iPhone SE, importes de 5–6 cifras).
 * Usa unidades de contenedor: el tamaño máximo es `max` px y nunca supera el ancho disponible.
 */
export function Cifra({ children, max = 22, className, ...props }) {
    const texto = String(children);
    // Ancho de un carácter monoespaciado ≈ 0,6 em (+ margen); el número de caracteres fija el tamaño que cabe.
    const ajuste = 100 / (Math.max(texto.length, 3) * 0.63);
    return (_jsx("div", { className: "@container w-full min-w-0", children: _jsx("p", { ...props, className: cx('num leading-tight font-semibold whitespace-nowrap', className), style: { fontSize: `min(${max}px, ${ajuste.toFixed(2)}cqi)` }, children: texto }) }));
}
/** Chip pulsable para filtros y opciones rápidas (activo = azul suave). */
export function ChipButton({ active, className, ...props }) {
    return (_jsx("button", { type: "button", "aria-pressed": active, ...props, className: cx('inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3.5 text-[14px] font-medium whitespace-nowrap transition active:scale-[0.97] disabled:opacity-40', active ? 'border-transparent bg-brand-soft text-brand' : 'border-border bg-surface text-text', className) }));
}
/** Desplegable con aspecto de chip (para filtros). */
export function ChipSelect({ active, className, children, ...props }) {
    return (_jsx("select", { ...props, className: cx('min-h-10 shrink-0 appearance-none rounded-full border px-3.5 text-[14px] font-medium', active ? 'border-transparent bg-brand-soft text-brand' : 'border-border bg-surface text-text', className), children: children }));
}
/* ------------------------------------------------------------------ */
/* Formularios                                                         */
/* ------------------------------------------------------------------ */
const inputClass = 'min-h-10 w-full rounded-xl bg-transparent text-[16px] text-text placeholder:text-muted/60 focus:outline-none disabled:opacity-60';
function Ayuda({ hint, hintTone }) {
    if (!hint)
        return null;
    return _jsx("p", { className: cx('mt-1 text-[12px] leading-snug', hintTone === 'danger' ? 'text-danger' : hintTone === 'warning' ? 'text-warning' : hintTone === 'brand' ? 'text-brand' : 'text-muted'), children: hint });
}
/** Campo: tarjeta blanca con la etiqueta encima. */
export function Field({ label, hint, hintTone, className, ...props }) {
    const id = useId();
    return (_jsxs("div", { className: cx('rounded-[18px] border bg-surface px-3.5 pt-2 pb-1.5 focus-within:border-brand', hintTone === 'danger' ? 'border-danger' : 'border-border'), children: [_jsx("label", { htmlFor: id, className: "block text-[12px] font-medium text-muted", children: label }), _jsx("input", { id: id, ...props, className: cx(inputClass, className) }), _jsx(Ayuda, { hint: hint, hintTone: hintTone })] }));
}
/** Campo de importe: teclado decimal y cifra monoespaciada. */
export function AmountField({ label, value, onChange, ...props }) {
    return _jsx(Field, { label: label, inputMode: "decimal", placeholder: "0,00", ...props, className: "num", value: value, onChange: (e) => onChange(e.target.value.replace(/[^\d.,-]/g, '')) });
}
export function SelectField({ label, hint, children, ...props }) {
    const id = useId();
    return (_jsxs("div", { className: "rounded-[18px] border border-border bg-surface px-3.5 pt-2 pb-1.5 focus-within:border-brand", children: [_jsx("label", { htmlFor: id, className: "block text-[12px] font-medium text-muted", children: label }), _jsx("select", { id: id, ...props, className: "min-h-10 w-full appearance-none bg-transparent text-[16px] text-text focus:outline-none", children: children }), _jsx(Ayuda, { hint: hint })] }));
}
export function FieldRow({ children }) {
    return _jsx("div", { className: "grid grid-cols-2 gap-1.5", children: children });
}
export function SearchField(props) {
    return (_jsxs("label", { className: "flex min-h-12 items-center gap-2 rounded-2xl border border-border bg-surface px-3.5 focus-within:border-brand", children: [_jsxs("svg", { viewBox: "0 0 24 24", width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 2, className: "shrink-0 text-muted", "aria-hidden": "true", children: [_jsx("circle", { cx: "11", cy: "11", r: "6.5" }), _jsx("path", { d: "M20 20l-4.2-4.2", strokeLinecap: "round" })] }), _jsx("input", { type: "search", ...props, className: "min-h-11 w-full bg-transparent text-[16px] placeholder:text-muted/70 focus:outline-none" })] }));
}
/* ------------------------------------------------------------------ */
/* Otros                                                               */
/* ------------------------------------------------------------------ */
export function EmptyState({ icon, title, children }) {
    return (_jsxs(Card, { className: "flex flex-col items-center px-6 py-9 text-center", children: [_jsx("span", { className: "mb-3 flex size-14 items-center justify-center rounded-full border border-border bg-surface-2 text-[26px] text-brand", children: icon }), _jsx("p", { className: "text-[16px] font-semibold", children: title }), children && _jsx("div", { className: "mt-1 text-[14px] text-muted", children: children })] }));
}
/** Tarjeta de marca con la ola azul. */
export function BrandHero({ name, children }) {
    return (_jsxs("div", { className: "relative overflow-hidden rounded-[26px] border border-border bg-surface", children: [_jsxs("div", { className: "relative z-10 flex items-center gap-3 p-5 pb-16", children: [_jsx(WaveMark, {}), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "truncate text-[18px] font-semibold tracking-tight", children: name }), children && _jsx("div", { className: "text-[13px] text-muted", children: children })] })] }), _jsxs("svg", { viewBox: "0 0 400 90", preserveAspectRatio: "none", className: "absolute inset-x-0 bottom-0 h-20 w-full", "aria-hidden": "true", children: [_jsx("path", { d: "M0 38 C 70 18, 120 52, 200 36 S 330 14, 400 30 L400 90 L0 90 Z", className: "fill-brand/25" }), _jsx("path", { d: "M0 54 C 80 34, 150 70, 230 50 S 340 34, 400 46 L400 90 L0 90 Z", className: "fill-brand" }), _jsx("circle", { cx: "300", cy: "40", r: "5", className: "fill-surface stroke-brand", strokeWidth: "2.5" })] })] }));
}
function WaveMark() {
    return (_jsx("span", { className: "flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft", children: _jsxs("svg", { viewBox: "0 0 24 24", width: 24, height: 24, "aria-hidden": "true", children: [_jsx("circle", { cx: "12", cy: "12", r: "10", className: "fill-brand/30" }), _jsx("path", { d: "M2.5 13.5c3-2.5 6-2.5 9.5 0s6.5 2.5 9.5 0V14a9.5 9.5 0 0 1-19 0z", className: "fill-brand" })] }) }));
}
/** Bloque de errores o avisos. */
export function Alerta({ tone = 'danger', children }) {
    return _jsx("div", { className: cx('rounded-[18px] px-3.5 py-3 text-[14px]', tone === 'danger' && 'bg-danger-soft text-danger', tone === 'warning' && 'bg-warning-soft text-warning', tone === 'brand' && 'bg-brand-soft text-brand'), children: children });
}
