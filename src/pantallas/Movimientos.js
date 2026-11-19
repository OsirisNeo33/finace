import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BotonAjustes } from '../navegacion';
import { useMemo, useState } from 'react';
import { useDatos } from '../contexto';
import { FilaMovimiento } from '../components/FilaMovimiento';
import { SelectorPeriodo } from '../components/SelectorPeriodo';
import { IconoCerrar, IconoLista } from '../components/Iconos';
import { Cifra, Button, Card, ChipButton, ChipSelect, EmptyState, Label, Page, PageHeader, Panel, SearchField } from '../components/ui';
import { agruparPorDia, enPeriodo, resumen } from '../domain/calculos';
import { fechaLarga } from '../domain/fechas';
export function Movimientos({ periodo, desplazamiento, setDesplazamiento, filtro, setFiltro }) {
    const { movimientos, categorias, categoriaPorId, cuentas, cuentaPorId, dinero, ajustes } = useDatos();
    const [limite, setLimite] = useState(30);
    const set = (cambios) => {
        setFiltro({ ...filtro, ...cambios });
        setLimite(30);
    };
    const etiquetas = useMemo(() => [...new Set(movimientos.flatMap((m) => m.etiquetas))].sort(), [movimientos]);
    const filtrados = useMemo(() => {
        const t = filtro.texto?.trim().toLowerCase();
        return movimientos.filter((m) => {
            if (filtro.periodo && !enPeriodo(m, periodo))
                return false;
            if (filtro.tipo && m.tipo !== filtro.tipo)
                return false;
            if (filtro.categoriaId && (m.categoriaId ?? 'sin') !== filtro.categoriaId)
                return false;
            if (filtro.cuentaId && m.cuentaId !== filtro.cuentaId && m.cuentaDestinoId !== filtro.cuentaId)
                return false;
            if (filtro.etiqueta && !m.etiquetas.includes(filtro.etiqueta))
                return false;
            if (t) {
                const cat = m.categoriaId ? categoriaPorId.get(m.categoriaId)?.nombre : '';
                const texto = [m.nota, cat, cuentaPorId.get(m.cuentaId)?.nombre, ...m.etiquetas, (m.importe / 100).toFixed(2).replace('.', ',')].join(' ').toLowerCase();
                if (!texto.includes(t))
                    return false;
            }
            return true;
        });
    }, [movimientos, filtro, periodo, categoriaPorId, cuentaPorId]);
    const grupos = useMemo(() => agruparPorDia(filtrados), [filtrados]);
    const r = resumen(filtrados);
    const hayFiltros = Boolean(filtro.tipo || filtro.categoriaId || filtro.cuentaId || filtro.etiqueta || filtro.texto);
    return (_jsxs(_Fragment, { children: [_jsx(PageHeader, { title: "Movimientos", action: _jsx(BotonAjustes, {}), subtitle: _jsxs(_Fragment, { children: [filtrados.length, " ", filtrados.length === 1 ? 'movimiento' : 'movimientos', hayFiltros || filtro.periodo ? ' con estos filtros' : '', " \u00B7 balance", ' ', _jsx("span", { className: `num font-medium ${r.balance < 0 ? 'text-danger' : 'text-success'}`, children: dinero(r.balance, { signo: true }) })] }) }), _jsxs(Page, { children: [_jsx(SearchField, { placeholder: "Buscar por nota, categor\u00EDa, importe\u2026", value: filtro.texto ?? '', onChange: (e) => set({ texto: e.target.value }) }), _jsxs("div", { className: "sin-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4", children: [_jsx(ChipButton, { active: !filtro.periodo, onClick: () => set({ periodo: false }), children: "Todo" }), _jsx(ChipButton, { active: !!filtro.periodo, onClick: () => set({ periodo: true }), children: "Por mes" }), _jsx("span", { className: "mx-1 w-px shrink-0 bg-border" }), ['gasto', 'ingreso', 'transferencia'].map((t) => (_jsx(ChipButton, { active: filtro.tipo === t, onClick: () => set({ tipo: filtro.tipo === t ? undefined : t }), children: t === 'gasto' ? 'Gastos' : t === 'ingreso' ? 'Ingresos' : 'Transferencias' }, t))), _jsxs(ChipSelect, { active: !!filtro.categoriaId, value: filtro.categoriaId ?? '', onChange: (e) => set({ categoriaId: e.target.value || undefined }), "aria-label": "Categor\u00EDa", children: [_jsx("option", { value: "", children: "Categor\u00EDa \u25BE" }), categorias.map((c) => (_jsxs("option", { value: c.id, children: [c.icono, " ", c.nombre, " (", c.tipo, ")"] }, c.id)))] }), cuentas.length > 1 && (_jsxs(ChipSelect, { active: !!filtro.cuentaId, value: filtro.cuentaId ?? '', onChange: (e) => set({ cuentaId: e.target.value || undefined }), "aria-label": "Cuenta", children: [_jsx("option", { value: "", children: "Cuenta \u25BE" }), cuentas.map((c) => (_jsx("option", { value: c.id, children: c.nombre }, c.id)))] })), etiquetas.length > 0 && (_jsxs(ChipSelect, { active: !!filtro.etiqueta, value: filtro.etiqueta ?? '', onChange: (e) => set({ etiqueta: e.target.value || undefined }), "aria-label": "Etiqueta", children: [_jsx("option", { value: "", children: "#Etiqueta \u25BE" }), etiquetas.map((e) => (_jsxs("option", { value: e, children: ["#", e] }, e)))] })), hayFiltros && (_jsxs(ChipButton, { onClick: () => setFiltro({ periodo: filtro.periodo }), children: [_jsx(IconoCerrar, { width: 14, height: 14 }), " Limpiar"] }))] }), filtro.periodo && _jsx(SelectorPeriodo, { periodo: periodo, desplazamiento: desplazamiento, setDesplazamiento: setDesplazamiento, diaInicio: ajustes.diaInicioMes }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs(Card, { className: "p-4", children: [_jsx(Label, { children: "Ingresos" }), _jsx(Cifra, { max: 22, className: "mt-1", children: dinero(r.ingresos) })] }), _jsxs(Card, { className: "p-4", children: [_jsx(Label, { children: "Gastos" }), _jsx(Cifra, { max: 22, className: "mt-1", children: dinero(r.gastos) })] })] }), grupos.length === 0 ? (_jsx(EmptyState, { icon: _jsx(IconoLista, {}), title: hayFiltros ? 'Nada con estos filtros' : 'Aún no hay movimientos', children: hayFiltros ? 'Prueba con otra búsqueda o pulsa «Limpiar».' : 'Pulsa el botón + para apuntar tu primer gasto o ingreso.' })) : (_jsxs(_Fragment, { children: [grupos.slice(0, limite).map((g) => (_jsx(Panel, { title: _jsx("span", { className: "first-letter:uppercase", children: fechaLarga(g.fecha) }), detail: _jsx("span", { className: "num", children: dinero(g.neto, { signo: true }) }), children: g.items.map((m) => (_jsx(FilaMovimiento, { m: m }, m.id))) }, g.fecha))), grupos.length > limite && (_jsx(Button, { variant: "secondary", className: "w-full", onClick: () => setLimite(limite + 30), children: "Ver m\u00E1s" }))] }))] })] }));
}
