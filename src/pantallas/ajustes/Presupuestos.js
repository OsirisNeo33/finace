import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDatos } from '../../contexto';
import { Hoja } from '../../components/Hoja';
import { AmountField, Button, Emoji, Panel, SelectField, TileButton } from '../../components/ui';
import { aCentimos } from '../../domain/dinero';
import { db, nuevoId } from '../../db/db';
export function Presupuestos() {
    const { categorias, categoriaPorId, dinero } = useDatos();
    const presupuestos = useLiveQuery(() => db.presupuestos.toArray(), [], []);
    const [editando, setEditando] = useState(null);
    const global = presupuestos.find((p) => p.categoriaId === null);
    const porCategoria = presupuestos.filter((p) => p.categoriaId !== null);
    const libres = categorias.filter((c) => c.tipo === 'gasto' && !presupuestos.some((p) => p.categoriaId === c.id));
    return (_jsxs(_Fragment, { children: [_jsx(Panel, { title: "Total del mes", footer: "Con un presupuesto total, el inicio te dice cu\u00E1nto puedes gastar al d\u00EDa. La barra se pone naranja al 80 % y roja si te pasas.", children: _jsx(TileButton, { icon: _jsx(Emoji, { children: "\uD83C\uDFAF" }), title: "Presupuesto total del mes", subtitle: global ? 'Toca para cambiarlo' : 'Sin definir', detail: global ? _jsx("span", { className: "num text-[15px] font-semibold text-text", children: dinero(global.importe) }) : _jsx("span", { className: "font-semibold text-brand", children: "Definir" }), chevron: true, "aria-label": global ? `Presupuesto total: ${dinero(global.importe)}` : 'Definir', onClick: () => setEditando(global ?? { categoriaId: null }) }) }), _jsxs(Panel, { title: "Por categor\u00EDa", detail: porCategoria.length ? _jsx("span", { className: "num", children: porCategoria.length }) : undefined, children: [porCategoria.map((p) => {
                        const c = categoriaPorId.get(p.categoriaId);
                        return _jsx(TileButton, { icon: _jsx(Emoji, { children: c?.icono }), title: c?.nombre, detail: _jsx("span", { className: "num text-[15px] font-semibold text-text", children: dinero(p.importe) }), chevron: true, onClick: () => setEditando(p) }, p.id);
                    }), libres.length > 0 && (_jsxs(SelectField, { label: "A\u00F1adir presupuesto para una categor\u00EDa", value: "", onChange: (e) => e.target.value && setEditando({ categoriaId: e.target.value }), children: [_jsx("option", { value: "", children: "Elige una categor\u00EDa\u2026" }), libres.map((c) => (_jsxs("option", { value: c.id, children: [c.icono, " ", c.nombre] }, c.id)))] }))] }), editando && _jsx(FormPresupuesto, { p: editando, onCerrar: () => setEditando(null) })] }));
}
function FormPresupuesto({ p, onCerrar }) {
    const { categoriaPorId } = useDatos();
    const [valor, setValor] = useState(p.importe ? (p.importe / 100).toString().replace('.', ',') : '');
    const c = p.categoriaId ? categoriaPorId.get(p.categoriaId) : undefined;
    return (_jsx(Hoja, { titulo: c ? `${c.icono} ${c.nombre}` : 'Presupuesto total', onCerrar: onCerrar, children: _jsxs("div", { className: "space-y-3 px-4 pb-5", children: [_jsx(Panel, { title: "L\u00EDmite", children: _jsx(AmountField, { label: "L\u00EDmite mensual", value: valor, onChange: setValor, autoFocus: true }) }), _jsx(Button, { className: "w-full", disabled: aCentimos(valor) <= 0, onClick: async () => {
                        await db.presupuestos.put({ id: p.id ?? nuevoId(), categoriaId: p.categoriaId ?? null, importe: aCentimos(valor) });
                        onCerrar();
                    }, children: "Guardar" }), p.id && (_jsx(Button, { variant: "danger", className: "w-full", onClick: async () => {
                        await db.presupuestos.delete(p.id);
                        onCerrar();
                    }, children: "Quitar presupuesto" }))] }) }));
}
