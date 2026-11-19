import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDatos } from '../contexto';
import { Emoji, cx } from './ui';
export function FilaMovimiento({ m }) {
    const { categoriaPorId, cuentaPorId, dinero, abrirEditor, cuentas } = useDatos();
    const cat = m.categoriaId ? categoriaPorId.get(m.categoriaId) : undefined;
    const cuenta = cuentaPorId.get(m.cuentaId);
    const esTransf = m.tipo === 'transferencia';
    const titulo = esTransf ? 'Transferencia' : cat?.nombre ?? 'Sin categoría';
    const detalle = esTransf
        ? `${cuenta?.nombre ?? '?'} → ${m.cuentaDestinoId ? cuentaPorId.get(m.cuentaDestinoId)?.nombre ?? '?' : '?'}`
        : [m.nota, cuentas.length > 1 ? cuenta?.nombre : undefined, ...m.etiquetas.map((e) => '#' + e)].filter(Boolean).join(' · ');
    return (_jsxs("button", { type: "button", className: "flex min-h-14 w-full items-center gap-3 rounded-[18px] border border-border bg-surface px-3.5 py-3 text-left tarjeta-tactil active:bg-surface-2", onClick: () => abrirEditor(m), children: [_jsx(Emoji, { children: esTransf ? '🔁' : cat?.icono ?? '❔' }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block truncate text-[15px] font-medium", children: titulo }), detalle && _jsx("span", { className: "block truncate text-[13px] text-muted", children: detalle })] }), _jsx("span", { className: cx('num shrink-0 text-[15px] font-semibold', m.tipo === 'ingreso' ? 'text-success' : m.tipo === 'transferencia' ? 'text-muted' : 'text-text'), children: m.tipo === 'gasto' ? dinero(-m.importe) : m.tipo === 'ingreso' ? dinero(m.importe, { signo: true }) : dinero(m.importe) })] }));
}
