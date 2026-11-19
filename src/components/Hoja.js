import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { IconoCerrar } from './Iconos';
/** Hoja que sube desde abajo (en escritorio, ventana centrada) sobre el fondo gris. */
export function Hoja({ titulo, onCerrar, children, ancho = 'max-w-lg' }) {
    useEffect(() => {
        const tecla = (e) => e.key === 'Escape' && onCerrar();
        window.addEventListener('keydown', tecla);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', tecla);
            document.body.style.overflow = prev;
        };
    }, [onCerrar]);
    return (_jsxs("div", { className: "fixed inset-0 z-40 flex items-end justify-center sm:items-center", role: "dialog", "aria-modal": "true", children: [_jsx("div", { className: "anim-aparecer absolute inset-0 bg-black/40", onClick: onCerrar }), _jsxs("div", { className: `anim-subir relative flex max-h-[94dvh] w-full ${ancho} flex-col overflow-hidden rounded-t-[26px] bg-bg sm:rounded-[26px]`, children: [titulo !== undefined && (_jsxs("div", { className: "flex items-center justify-between gap-3 px-5 pt-4 pb-2", children: [_jsx("h2", { className: "min-w-0 truncate text-[20px] font-semibold tracking-tight", children: titulo }), _jsx("button", { type: "button", className: "-mr-1 flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted active:scale-95", onClick: onCerrar, "aria-label": "Cerrar", children: _jsx(IconoCerrar, { width: 20, height: 20 }) })] })), _jsx("div", { className: "pb-safe overflow-y-auto", children: children })] })] }));
}
