import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDatos } from '../../contexto';
import { Hoja } from '../../components/Hoja';
import { Cifra, Alerta, AmountField, Button, Card, Emoji, Field, FieldRow, Panel, Segmented, SelectField, Tile, TileButton, Toggle, cx } from '../../components/ui';
import { aCentimos } from '../../domain/dinero';
import { fechaCorta, fechasPendientes, hoyISO, siguienteFecha } from '../../domain/fechas';
import { db } from '../../db/db';
import { generarRecurrentes, guardarRecurrente } from '../../db/acciones';
import { parseISO } from 'date-fns';
import { equivalenteMensual } from '../../domain/fijos';
export const FREC = { semanal: 'Cada semana', mensual: 'Cada mes', anual: 'Cada año' };
function proxima(r) {
    if (!r.ultimaGeneracion)
        return r.inicio;
    return siguienteFecha(r.ultimaGeneracion, r.frecuencia, parseISO(r.inicio).getDate());
}
export function Recurrentes() {
    const { categoriaPorId, dinero } = useDatos();
    const recurrentes = useLiveQuery(() => db.recurrentes.toArray(), [], []);
    const [editando, setEditando] = useState(null);
    const mensual = recurrentes
        .filter((r) => r.activo && r.tipo === 'gasto')
        .reduce((s, r) => s + equivalenteMensual(r), 0);
    return (_jsxs(_Fragment, { children: [mensual > 0 && (_jsxs(Card, { dark: true, children: [_jsx("p", { className: "text-[13px] text-white/60", children: "Gastos fijos al mes (aprox.)" }), _jsx(Cifra, { max: 34, className: "mt-1", children: dinero(mensual) })] })), _jsxs(Panel, { title: "Tus recurrentes", detail: recurrentes.length ? _jsx("span", { className: "num", children: recurrentes.length }) : undefined, footer: "Se apuntan solos en su fecha (al abrir la app) o, si los dejas como recordatorio, los marcas t\u00FA como pagados en la pesta\u00F1a Pagos.", children: [recurrentes.length === 0 && (_jsx(Tile, { children: _jsx("span", { className: "text-[14px] text-muted", children: "A\u00FAn no tienes ninguno. A\u00F1ade tu n\u00F3mina, el alquiler o tus suscripciones." }) })), recurrentes.map((r) => {
                        const c = r.categoriaId ? categoriaPorId.get(r.categoriaId) : undefined;
                        return (_jsx(TileButton, { className: r.activo ? undefined : 'opacity-60', icon: _jsx(Emoji, { children: c?.icono ?? '🔁' }), title: r.nota || c?.nombre, subtitle: `${FREC[r.frecuencia]} · ${!r.activo ? 'Pausado' : r.automatico === false ? 'Recordatorio' : `próximo ${fechaCorta(proxima(r))}`}`, detail: _jsx("span", { className: cx('num text-[15px] font-semibold', r.tipo === 'ingreso' ? 'text-success' : 'text-text'), children: r.tipo === 'ingreso' ? dinero(r.importe, { signo: true }) : dinero(-r.importe) }), chevron: true, onClick: () => setEditando(r) }, r.id));
                    })] }), _jsx(Button, { className: "w-full", onClick: () => setEditando('nuevo'), children: "+ Nuevo recurrente" }), editando && _jsx(FormRecurrente, { r: editando === 'nuevo' ? undefined : editando, onCerrar: () => setEditando(null) })] }));
}
export function FormRecurrente({ r, onCerrar, inicioInicial, tipoInicial }) {
    const { categorias, cuentas, ajustes, avisar } = useDatos();
    const [tipo, setTipo] = useState(r?.tipo ?? tipoInicial ?? 'gasto');
    const [valor, setValor] = useState(r ? (r.importe / 100).toString().replace('.', ',') : '');
    const [categoriaId, setCategoriaId] = useState(r?.categoriaId ?? '');
    const [cuentaId, setCuentaId] = useState(r?.cuentaId ?? ajustes.ultimaCuentaId ?? cuentas[0]?.id ?? '');
    const [nota, setNota] = useState(r?.nota ?? '');
    const [frecuencia, setFrecuencia] = useState(r?.frecuencia ?? 'mensual');
    const [inicio, setInicio] = useState(r?.inicio ?? inicioInicial ?? hoyISO());
    const [automatico, setAutomatico] = useState(r?.automatico ?? true);
    const cats = categorias.filter((c) => c.tipo === tipo);
    const pendientes = !r && automatico ? fechasPendientes(inicio, undefined, frecuencia, hoyISO()).length : 0;
    async function guardar() {
        await guardarRecurrente({ ...r, tipo, importe: aCentimos(valor), categoriaId: categoriaId || undefined, cuentaId, nota: nota.trim() || undefined, frecuencia, inicio, activo: r?.activo ?? true, automatico,
            // Al pasar a automático, no rellenar el pasado ya gestionado a mano
            ultimaGeneracion: r?.ultimaGeneracion ?? (r && r.automatico === false && automatico ? hoyISO() : undefined) });
        const n = await generarRecurrentes();
        if (n)
            avisar(`${n} movimiento${n > 1 ? 's' : ''} añadido${n > 1 ? 's' : ''}`);
        onCerrar();
    }
    return (_jsx(Hoja, { titulo: r ? (r.tipo === 'ingreso' ? 'Editar ingreso fijo' : 'Editar gasto fijo') : tipoInicial ? (tipoInicial === 'ingreso' ? 'Nuevo ingreso fijo' : 'Nuevo gasto fijo') : 'Nuevo recurrente', onCerrar: onCerrar, children: _jsxs("div", { className: "space-y-3 px-4 pb-5", children: [_jsx(Segmented, { label: "Tipo", value: tipo, onChange: (t) => {
                        setTipo(t);
                        setCategoriaId('');
                    }, options: [
                        { value: 'gasto', label: 'Gasto' },
                        { value: 'ingreso', label: 'Ingreso' },
                    ] }), _jsxs(Panel, { title: "Datos", children: [_jsx(Field, { label: "Nombre", placeholder: "Ej. Alquiler, Netflix, N\u00F3mina", value: nota, onChange: (e) => setNota(e.target.value) }), _jsxs(FieldRow, { children: [_jsx(AmountField, { label: "Importe", value: valor, onChange: setValor }), _jsxs(SelectField, { label: "Categor\u00EDa", value: categoriaId, onChange: (e) => setCategoriaId(e.target.value), children: [_jsx("option", { value: "", children: "Elige\u2026" }), cats.map((c) => (_jsxs("option", { value: c.id, children: [c.icono, " ", c.nombre] }, c.id)))] })] }), cuentas.length > 1 && (_jsx(SelectField, { label: "Cuenta", value: cuentaId, onChange: (e) => setCuentaId(e.target.value), children: cuentas.map((c) => (_jsxs("option", { value: c.id, children: [c.icono, " ", c.nombre] }, c.id))) }))] }), _jsxs(Panel, { title: "Cu\u00E1ndo", children: [_jsx(Segmented, { label: "Frecuencia", value: frecuencia, onChange: setFrecuencia, options: Object.keys(FREC).map((f) => ({ value: f, label: FREC[f] })) }), _jsx(Field, { label: "Primer pago", hint: frecuencia === 'mensual' ? 'Se repite ese mismo día cada mes.' : undefined, type: "date", value: inicio, onChange: (e) => e.target.value && setInicio(e.target.value), disabled: !!r?.ultimaGeneracion }), _jsxs(Tile, { children: [_jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block text-[15px] font-medium", children: "Apuntarlo autom\u00E1ticamente" }), _jsx("span", { className: "block text-[13px] text-muted", children: automatico ? `Se apunta solo como ${tipo === 'gasto' ? 'gasto' : 'ingreso'} el día que toca.` : 'Solo te lo recuerda: lo marcas tú como pagado.' })] }), _jsx(Toggle, { checked: automatico, onChange: setAutomatico, label: "Apuntarlo autom\u00E1ticamente" })] })] }), pendientes > 0 && (_jsxs(Alerta, { tone: "brand", children: ["Se apuntar\u00E1n ahora ", pendientes, " movimiento", pendientes > 1 ? 's' : '', " hasta hoy."] })), _jsx(Button, { className: "w-full", disabled: aCentimos(valor) <= 0 || !cuentaId || !categoriaId, onClick: guardar, children: "Guardar" }), r && (_jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx(Button, { variant: "secondary", onClick: async () => {
                                // Al reactivar, no rellenar el hueco del periodo pausado
                                const cambios = { activo: !r.activo };
                                if (!r.activo) {
                                    const pend = fechasPendientes(r.inicio, r.ultimaGeneracion, r.frecuencia, hoyISO());
                                    if (pend.length)
                                        cambios.ultimaGeneracion = pend[pend.length - 1];
                                }
                                await db.recurrentes.update(r.id, cambios);
                                onCerrar();
                            }, children: r.activo ? 'Pausar' : 'Reanudar' }), _jsx(Button, { variant: "danger", onClick: async () => {
                                if (!confirm('¿Eliminar este recurrente? Los movimientos ya apuntados se conservan.'))
                                    return;
                                await db.recurrentes.delete(r.id);
                                onCerrar();
                            }, children: "Eliminar" })] }))] }) }));
}
