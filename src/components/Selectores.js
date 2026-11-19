import { jsx as _jsx } from "react/jsx-runtime";
import { cx } from './ui';
export const ICONOS = ['🛒', '🍽️', '☕', '🍺', '🍔', '🚌', '🚗', '⛽', '🚕', '✈️', '🏠', '💡', '💧', '📱', '🌐', '💊', '🏥', '🦷', '🏋️', '🎬', '🎮', '🎵', '📚', '🎓', '👕', '👟', '💄', '💇', '🛍️', '🎁', '🐾', '👶', '🧸', '🔧', '🧹', '📺', '💳', '🏦', '💼', '💻', '🏷️', '📈', '💰', '🪙', '💵', '🧾', '🚬', '⚽', '🏖️', '❤️', '🙏', '📦'];
export function SelectorIcono({ valor, onCambio }) {
    return (_jsx("div", { className: "grid max-h-48 grid-cols-7 gap-1 overflow-y-auto rounded-[18px] border border-border bg-surface p-2 sm:grid-cols-9", children: ICONOS.map((i) => (_jsx("button", { type: "button", "aria-pressed": valor === i, className: cx('flex h-11 items-center justify-center rounded-xl text-[20px] transition active:scale-95', valor === i && 'bg-brand-soft ring-2 ring-brand'), onClick: () => onCambio(i), children: i }, i))) }));
}
