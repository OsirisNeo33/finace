import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useDatos } from '../../contexto';
import { db, nuevoId, ahora } from '../../db/db';
import { aCentimos } from '../../domain/dinero';
import { fechaCorta, aISO } from '../../domain/fechas';
import { TIPOS_INVERSION } from '../../domain/salud';
import { Hoja } from '../../components/Hoja';
import { AmountField, Button, Card, Chip, ChipButton, Cifra, Emoji, EmptyState, Field, FieldRow, Panel, ProgressBar, Segmented, SelectField, Tile, TileButton } from '../../components/ui';
import { Trading } from './Trading';
import { usarFinanzas } from '../usarFinanzas';
const PLATAFORMAS = ['MyInvestor', 'Trade Republic', 'Indexa Capital', 'Finizens', 'Openbank', 'BBVA', 'ING', 'Revolut', 'Interactive Brokers', 'DEGIRO', 'XTB', 'IG', 'eToro', 'Plus500', 'Binance', 'Coinbase', 'Bit2Me'];
const aTexto = (c) => (c ? (c / 100).toFixed(2).replace('.', ',').replace(/,00$/, '') : '');
const porcentaje = (x) => `${x > 0 ? '+' : ''}${(x * 100).toLocaleString('es-ES', { maximumFractionDigits: 1 })} %`;
export function Inversiones() {
    const [sub, setSub] = useState('cartera');
    return (_jsxs(_Fragment, { children: [_jsx(Segmented, { label: "Inversiones", value: sub, onChange: setSub, options: [
                    { value: 'cartera', label: 'Cartera' },
                    { value: 'trading', label: 'Trading' },
                ] }), sub === 'cartera' ? _jsx(Cartera, {}) : _jsx(Trading, {})] }));
}
function Cartera() {
    const { dinero } = useDatos();
    const { inversiones } = usarFinanzas();
    const [form, setForm] = useState(null);
    const valor = inversiones.reduce((s, x) => s + x.valor, 0);
    const aportado = inversiones.reduce((s, x) => s + x.aportado, 0);
    const ganancia = valor - aportado;
    const porTipo = [...inversiones.reduce((m, x) => m.set(x.tipo, (m.get(x.tipo) ?? 0) + x.valor), new Map())].sort((a, b) => b[1] - a[1]);
    const ordenadas = [...inversiones].sort((a, b) => b.valor - a.valor);
    return (_jsxs(_Fragment, { children: [_jsxs(Card, { dark: true, children: [_jsx("p", { className: "text-[13px] text-white/60", children: "Valor de tus inversiones" }), _jsx(Cifra, { max: 34, className: "mt-1", "data-testid": "valor-inversiones", children: dinero(valor) }), _jsxs("div", { className: "mt-4 space-y-2 border-t border-white/10 pt-4 text-[14px]", children: [_jsxs("div", { className: "flex justify-between gap-3", children: [_jsx("span", { className: "text-white/70", children: "Dinero aportado" }), _jsx("span", { className: "num font-semibold", children: dinero(aportado) })] }), _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("span", { className: "text-white/70", children: "Rentabilidad" }), _jsxs("span", { className: "num font-semibold", children: [dinero(ganancia, { signo: true }), aportado > 0 && _jsxs("span", { className: "text-white/60", children: [" (", porcentaje(ganancia / aportado), ")"] })] })] })] })] }), _jsx(Button, { className: "w-full", onClick: () => setForm('nueva'), children: "+ A\u00F1adir inversi\u00F3n" }), inversiones.length === 0 ? (_jsx(EmptyState, { icon: "\uD83D\uDCC8", title: "A\u00FAn no has apuntado inversiones", children: "Apunta tus fondos, ETF, acciones, cripto, plan de pensiones o dep\u00F3sitos, est\u00E9n donde est\u00E9n. Ver\u00E1s cu\u00E1nto tienes, cu\u00E1nto has ganado y c\u00F3mo est\u00E1 repartido." })) : (_jsxs(_Fragment, { children: [_jsx(Panel, { title: "Reparto", detail: "por tipo", children: porTipo.map(([tipo, v]) => (_jsxs(Tile, { className: "flex-col items-stretch gap-2", children: [_jsxs("span", { className: "flex items-center gap-3", children: [_jsx(Emoji, { children: TIPOS_INVERSION[tipo].icono }), _jsx("span", { className: "min-w-0 flex-1 truncate text-[15px] font-medium", children: TIPOS_INVERSION[tipo].nombre }), _jsxs("span", { className: "num text-[12px] text-muted", children: [valor ? Math.round((v / valor) * 100) : 0, " %"] }), _jsx("span", { className: "num text-[15px] font-semibold", children: dinero(v) })] }), _jsx(ProgressBar, { value: valor ? v / valor : 0 })] }, tipo))) }), _jsx(Panel, { title: "Tus inversiones", detail: _jsx("span", { className: "num", children: inversiones.length }), footer: "Actualiza el valor de vez en cuando con lo que te diga tu br\u00F3ker o tu banco. Las rentabilidades pasadas no garantizan las futuras.", children: ordenadas.map((x) => {
                            const g = x.valor - x.aportado;
                            return (_jsx(TileButton, { icon: _jsx(Emoji, { children: TIPOS_INVERSION[x.tipo].icono }), title: x.nombre, subtitle: `${x.plataforma ? `${x.plataforma} · ` : ''}actualizado ${fechaCorta(aISO(new Date(x.actualizadoEn)))}`, detail: _jsxs("span", { className: "flex flex-col items-end gap-1", children: [_jsx("span", { className: "num text-[15px] font-semibold text-text", children: dinero(x.valor) }), x.aportado > 0 && (_jsx(Chip, { tone: g >= 0 ? 'success' : 'danger', className: "num", children: porcentaje(g / x.aportado) }))] }), chevron: true, onClick: () => setForm(x) }, x.id));
                        }) })] })), form && _jsx(FormInversion, { inversion: form === 'nueva' ? undefined : form, onCerrar: () => setForm(null) })] }));
}
function FormInversion({ inversion, onCerrar }) {
    const { avisar } = useDatos();
    const [tipo, setTipo] = useState(inversion?.tipo ?? 'fondo');
    const [nombre, setNombre] = useState(inversion?.nombre ?? '');
    const [plataforma, setPlataforma] = useState(inversion?.plataforma ?? '');
    const [aportado, setAportado] = useState(aTexto(inversion?.aportado ?? 0));
    const [valor, setValor] = useState(aTexto(inversion?.valor ?? 0));
    const v = aCentimos(valor);
    async function guardar() {
        if (!nombre.trim() || v <= 0)
            return;
        await db.inversiones.put({
            id: inversion?.id ?? nuevoId(),
            nombre: nombre.trim(),
            tipo,
            plataforma: plataforma.trim() || undefined,
            aportado: aCentimos(aportado) || v,
            valor: v,
            notas: inversion?.notas,
            creadoEn: inversion?.creadoEn ?? ahora(),
            actualizadoEn: ahora(),
        });
        avisar(inversion ? 'Inversión actualizada' : `${nombre.trim()} añadida`);
        onCerrar();
    }
    return (_jsx(Hoja, { titulo: inversion ? inversion.nombre : 'Nueva inversión', onCerrar: onCerrar, children: _jsxs("div", { className: "space-y-3 px-4 pb-5", children: [_jsxs(Panel, { title: "Qu\u00E9 es", children: [_jsx(SelectField, { label: "Tipo", value: tipo, onChange: (e) => setTipo(e.target.value), children: Object.keys(TIPOS_INVERSION).map((k) => (_jsxs("option", { value: k, children: [TIPOS_INVERSION[k].icono, " ", TIPOS_INVERSION[k].nombre] }, k))) }), _jsx(Field, { label: "Nombre", value: nombre, onChange: (e) => setNombre(e.target.value), placeholder: tipo === 'cripto' ? 'Ej. Bitcoin' : tipo === 'acciones' ? 'Ej. Acciones de Inditex' : tipo === 'trading' ? 'Ej. Cuenta de trading XTB' : 'Ej. Fondo indexado MSCI World', maxLength: 40 }), _jsx(Field, { label: "D\u00F3nde la tienes (opcional)", value: plataforma, onChange: (e) => setPlataforma(e.target.value), placeholder: "Br\u00F3ker, banco o app", maxLength: 30 }), _jsx("div", { className: "sin-scrollbar -mx-2 flex gap-1.5 overflow-x-auto px-2 pb-1", children: PLATAFORMAS.map((p) => (_jsx(ChipButton, { active: plataforma === p, onClick: () => setPlataforma(p), children: p }, p))) })] }), _jsx(Panel, { title: "Importes", footer: "Aportado es el dinero que has metido. Valor actual, lo que vale hoy seg\u00FAn tu br\u00F3ker o banco.", children: _jsxs(FieldRow, { children: [_jsx(AmountField, { label: "Dinero aportado", value: aportado, onChange: setAportado }), _jsx(AmountField, { label: "Valor actual", value: valor, onChange: setValor, autoFocus: !!inversion })] }) }), _jsx(Button, { className: "w-full", onClick: guardar, disabled: !nombre.trim() || v <= 0, children: "Guardar" }), inversion && (_jsx(Button, { variant: "danger", className: "w-full", onClick: async () => {
                        if (!confirm(`¿Eliminar «${inversion.nombre}»?`))
                            return;
                        await db.inversiones.delete(inversion.id);
                        onCerrar();
                    }, children: "Eliminar inversi\u00F3n" }))] }) }));
}
