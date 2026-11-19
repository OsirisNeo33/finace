import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDatos } from '../../contexto';
import { Hoja } from '../../components/Hoja';
import { SelectorIcono } from '../../components/Selectores';
import { Button, Emoji, Field, Panel, Segmented } from '../../components/ui';
import { db, nuevoId } from '../../db/db';
const flecha = 'flex size-11 shrink-0 items-center justify-center rounded-full text-muted active:bg-surface-2 disabled:opacity-20';
export function Categorias() {
    const [tipo, setTipo] = useState('gasto');
    const [editando, setEditando] = useState(null);
    const todas = useLiveQuery(() => db.categorias.orderBy('orden').toArray(), [], []);
    const lista = todas.filter((c) => c.tipo === tipo);
    async function mover(i, dir) {
        const j = i + dir;
        if (j < 0 || j >= lista.length)
            return;
        const nueva = [...lista];
        [nueva[i], nueva[j]] = [nueva[j], nueva[i]];
        await db.categorias.bulkPut(nueva.map((c, k) => ({ ...c, orden: k })));
    }
    return (_jsxs(_Fragment, { children: [_jsx(Segmented, { label: "Tipo", value: tipo, onChange: setTipo, options: [
                    { value: 'gasto', label: 'Gastos' },
                    { value: 'ingreso', label: 'Ingresos' },
                ] }), _jsx(Panel, { title: tipo === 'gasto' ? 'Categorías de gasto' : 'Categorías de ingreso', detail: _jsx("span", { className: "num", children: lista.length }), footer: "Al a\u00F1adir un movimiento, las categor\u00EDas aparecen ordenadas por las que m\u00E1s usas.", children: lista.map((c, i) => (_jsxs("div", { className: `flex min-h-14 items-center gap-1 rounded-[18px] border border-border bg-surface py-1 pr-1 pl-3.5 ${c.archivada ? 'opacity-60' : ''}`, children: [_jsxs("button", { type: "button", className: "flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left", onClick: () => setEditando(c), children: [_jsx(Emoji, { children: c.icono }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block truncate text-[15px] font-medium", children: c.nombre }), c.archivada && _jsx("span", { className: "block text-[13px] text-muted", children: "Oculta" })] })] }), _jsx("button", { type: "button", className: flecha, disabled: i === 0, onClick: () => mover(i, -1), "aria-label": "Subir", children: "\u25B2" }), _jsx("button", { type: "button", className: flecha, disabled: i === lista.length - 1, onClick: () => mover(i, 1), "aria-label": "Bajar", children: "\u25BC" })] }, c.id))) }), _jsx(Button, { className: "w-full", onClick: () => setEditando('nueva'), children: "+ Nueva categor\u00EDa" }), editando && _jsx(FormCategoria, { categoria: editando === 'nueva' ? undefined : editando, tipo: tipo, orden: lista.length, onCerrar: () => setEditando(null) })] }));
}
function FormCategoria({ categoria, tipo, orden, onCerrar }) {
    const { movimientos, avisar } = useDatos();
    const [nombre, setNombre] = useState(categoria?.nombre ?? '');
    const [icono, setIcono] = useState(categoria?.icono ?? '📦');
    const usos = categoria ? movimientos.filter((m) => m.categoriaId === categoria.id).length : 0;
    async function guardar() {
        if (!nombre.trim())
            return;
        await db.categorias.put({ id: categoria?.id ?? nuevoId(), nombre: nombre.trim(), icono, color: categoria?.color ?? '#2b5ce6', tipo: categoria?.tipo ?? tipo, orden: categoria?.orden ?? orden, archivada: categoria?.archivada ?? false });
        onCerrar();
    }
    return (_jsx(Hoja, { titulo: categoria ? 'Editar categoría' : 'Nueva categoría', onCerrar: onCerrar, children: _jsxs("div", { className: "space-y-3 px-4 pb-5", children: [_jsx(Panel, { title: "Datos", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Emoji, { grande: true, children: icono }), _jsx("div", { className: "min-w-0 flex-1", children: _jsx(Field, { label: "Nombre", value: nombre, onChange: (e) => setNombre(e.target.value), placeholder: "Ej. Gimnasio", autoFocus: !categoria, maxLength: 24 }) })] }) }), _jsx(Panel, { title: "Icono", children: _jsx(SelectorIcono, { valor: icono, onCambio: setIcono }) }), _jsx(Button, { className: "w-full", onClick: guardar, disabled: !nombre.trim(), children: "Guardar" }), categoria && (_jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx(Button, { variant: "secondary", className: usos > 0 ? 'col-span-2' : undefined, onClick: async () => {
                                await db.categorias.update(categoria.id, { archivada: !categoria.archivada });
                                onCerrar();
                            }, children: categoria.archivada ? 'Mostrar' : 'Ocultar' }), usos === 0 && (_jsx(Button, { variant: "danger", onClick: async () => {
                                await db.categorias.delete(categoria.id);
                                await db.presupuestos.where('categoriaId').equals(categoria.id).delete();
                                avisar('Categoría eliminada');
                                onCerrar();
                            }, children: "Eliminar" }))] })), usos > 0 && _jsxs("p", { className: "px-3 text-[13px] text-muted", children: ["Tiene ", usos, " movimientos: puedes ocultarla, pero no eliminarla."] })] }) }));
}
