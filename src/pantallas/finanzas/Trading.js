import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useDatos } from '../../contexto';
import { db, nuevoId, ahora } from '../../db/db';
import { aCentimos } from '../../domain/dinero';
import { fechaCorta, hoyISO } from '../../domain/fechas';
import { MERCADOS, aNumero, desdePeriodo, estadisticas, rentabilidad, resultado } from '../../domain/trading';
import { Hoja } from '../../components/Hoja';
import { Alerta, AmountField, Button, Card, Chip, ChipButton, Cifra, DataTile, Emoji, EmptyState, Field, FieldRow, Panel, Segmented, SelectField, Tile, Toggle, cx } from '../../components/ui';
import { usarFinanzas } from '../usarFinanzas';
const PERIODOS = [
    ['mes', 'Este mes'],
    ['3m', '3 meses'],
    ['ano', 'Este año'],
    ['todo', 'Todo'],
];
const num = (x, d = 2) => x.toLocaleString('es-ES', { maximumFractionDigits: d });
const pctTexto = (x) => `${x > 0 ? '+' : ''}${num(x * 100, 1)} %`;
export function Trading() {
    const { dinero } = useDatos();
    const { operaciones } = usarFinanzas();
    const [periodo, setPeriodo] = useState('ano');
    const [form, setForm] = useState(null);
    const e = useMemo(() => estadisticas(operaciones, desdePeriodo(periodo)), [operaciones, periodo]);
    const abiertas = operaciones.filter((o) => !o.cierre).sort((a, b) => b.apertura.localeCompare(a.apertura));
    const cerradas = operaciones.filter((o) => o.cierre && o.cierre >= desdePeriodo(periodo)).sort((a, b) => b.cierre.localeCompare(a.cierre));
    return (_jsxs(_Fragment, { children: [_jsxs(Card, { dark: true, children: [_jsxs("p", { className: "text-[13px] text-white/60", children: ["Resultado del trading \u00B7 ", PERIODOS.find((p) => p[0] === periodo)[1].toLowerCase()] }), _jsx(Cifra, { max: 34, className: cx('mt-1', e.neto < 0 && 'text-danger'), "data-testid": "trading-neto", children: dinero(e.neto, { signo: true }) }), _jsxs("div", { className: "mt-4 space-y-2 border-t border-white/10 pt-4 text-[14px]", children: [_jsxs("div", { className: "flex justify-between gap-3", children: [_jsx("span", { className: "text-white/70", children: "Operaciones cerradas" }), _jsx("span", { className: "num font-semibold", children: e.cerradas })] }), _jsxs("div", { className: "flex justify-between gap-3", children: [_jsx("span", { className: "text-white/70", children: "Aciertos" }), _jsx("span", { className: "num font-semibold", "data-testid": "trading-aciertos", children: e.aciertos === null ? '—' : `${Math.round(e.aciertos * 100)} %` })] }), _jsxs("div", { className: "flex justify-between gap-3", children: [_jsx("span", { className: "text-white/70", children: "Factor de beneficio" }), _jsx("span", { className: "num font-semibold", children: e.factor === null ? (e.ganadoras ? 'Sin pérdidas' : '—') : num(e.factor) })] })] })] }), _jsx("div", { className: "sin-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4", children: PERIODOS.map(([p, t]) => (_jsx(ChipButton, { active: periodo === p, onClick: () => setPeriodo(p), children: t }, p))) }), _jsx(Button, { className: "w-full", onClick: () => setForm({}), children: "+ Nueva operaci\u00F3n" }), operaciones.length === 0 ? (_jsx(EmptyState, { icon: "\uD83D\uDD6F\uFE0F", title: "Tu diario de trading est\u00E1 vac\u00EDo", children: "Apunta cada operaci\u00F3n (o solo su resultado) y ver\u00E1s si de verdad ganas: aciertos, beneficio frente a p\u00E9rdida, comisiones y resultado por mercado." })) : (_jsxs(_Fragment, { children: [abiertas.length > 0 && (_jsx(Panel, { title: "Abiertas", detail: _jsx("span", { className: "num", children: abiertas.length }), children: abiertas.map((o) => (_jsx(FilaOperacion, { o: o, onClick: () => setForm({ op: o, cerrar: true }) }, o.id))) })), _jsxs(Panel, { title: "Cerradas", detail: _jsx("span", { className: "num", children: cerradas.length }), children: [cerradas.length === 0 && (_jsx(Tile, { children: _jsx("span", { className: "text-[14px] text-muted", children: "Ninguna cerrada en este periodo." }) })), cerradas.slice(0, 30).map((o) => (_jsx(FilaOperacion, { o: o, onClick: () => setForm({ op: o }) }, o.id)))] }), e.cerradas > 0 && (_jsxs(Panel, { title: "Estad\u00EDsticas", footer: "Factor de beneficio = lo ganado \u00F7 lo perdido. Por encima de 1 ganas dinero; por encima de 1,5 es una estrategia s\u00F3lida.", children: [_jsx(DataTile, { label: "Ganadoras / perdedoras", value: `${e.ganadoras} / ${e.perdedoras}`, mono: true }), _jsx(DataTile, { label: "Beneficio medio", value: dinero(e.beneficioMedio), mono: true }), _jsx(DataTile, { label: "P\u00E9rdida media", value: dinero(e.perdidaMedia), mono: true }), _jsx(DataTile, { label: "Ratio beneficio / p\u00E9rdida", value: e.ratio === null ? '—' : num(e.ratio), mono: true }), e.mejor && _jsx(DataTile, { label: `Mejor: ${e.mejor.activo}`, value: dinero(resultado(e.mejor), { signo: true }), mono: true }), e.peor && _jsx(DataTile, { label: `Peor: ${e.peor.activo}`, value: dinero(resultado(e.peor), { signo: true }), mono: true }), _jsx(DataTile, { label: "Comisiones pagadas", value: dinero(e.comisiones), mono: true })] })), e.porMercado.length > 1 && (_jsx(Panel, { title: "Por mercado", children: e.porMercado.map(([m, v]) => (_jsxs(Tile, { children: [_jsx(Emoji, { children: MERCADOS[m].icono }), _jsx("span", { className: "min-w-0 flex-1 truncate text-[15px] font-medium", children: MERCADOS[m].nombre }), _jsx(Chip, { tone: v >= 0 ? 'success' : 'danger', className: "num", children: dinero(v, { signo: true }) })] }, m))) }))] })), _jsx("p", { className: "px-3 text-[13px] leading-snug text-muted", children: "El trading es de alto riesgo: la mayor\u00EDa de inversores minoristas que operan con CFD pierden dinero. Opera solo con dinero que puedas permitirte perder." }), form && _jsx(FormOperacion, { op: form.op, cerrar: form.cerrar, onCerrar: () => setForm(null) })] }));
}
function FilaOperacion({ o, onClick }) {
    const { dinero } = useDatos();
    const r = resultado(o);
    const rent = rentabilidad(o);
    return (_jsxs("button", { type: "button", className: "flex min-h-14 w-full items-center gap-3 rounded-[18px] border border-border bg-surface px-3.5 py-3 text-left tarjeta-tactil active:bg-surface-2", onClick: onClick, "aria-label": `${o.activo}${r === null ? ', abierta' : `: ${dinero(r, { signo: true })}`}`, children: [_jsx(Emoji, { children: MERCADOS[o.mercado].icono }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "truncate text-[15px] font-medium", children: o.activo }), _jsx("span", { className: cx('shrink-0 rounded-md px-1.5 text-[11px] font-semibold', o.direccion === 'largo' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'), children: o.direccion === 'largo' ? 'Largo' : 'Corto' })] }), _jsxs("span", { className: "block truncate text-[13px] text-muted", children: [_jsx("span", { className: "num", children: fechaCorta(o.cierre ?? o.apertura) }), o.entrada !== undefined && o.cantidad !== undefined && (_jsxs("span", { className: "num", children: [' ', "\u00B7 ", num(o.cantidad, 6), " \u00D7 ", num(o.entrada, 6), o.salida !== undefined ? ` → ${num(o.salida, 6)}` : ''] })), o.estrategia ? ` · ${o.estrategia}` : ''] })] }), _jsx("span", { className: "flex shrink-0 flex-col items-end gap-1", children: r === null ? (_jsx(Chip, { tone: "brand", children: "Abierta" })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: cx('num text-[15px] font-semibold', r > 0 ? 'text-success' : r < 0 ? 'text-danger' : 'text-text'), children: dinero(r, { signo: true }) }), rent !== null && _jsx("span", { className: "num text-[12px] text-muted", children: pctTexto(rent) })] })) })] }));
}
function FormOperacion({ op, cerrar, onCerrar }) {
    const { dinero, avisar } = useDatos();
    const { inversiones } = usarFinanzas();
    const cuentas = inversiones.filter((i) => i.tipo === 'trading' || i.tipo === 'acciones' || i.tipo === 'cripto' || i.tipo === 'otro');
    const [activo, setActivo] = useState(op?.activo ?? '');
    const [mercado, setMercado] = useState(op?.mercado ?? 'acciones');
    const [direccion, setDireccion] = useState(op?.direccion ?? 'largo');
    const [modo, setModo] = useState(op?.resultadoManual !== undefined ? 'resultado' : 'precios');
    const [apertura, setApertura] = useState(op?.apertura ?? hoyISO());
    const [cerrada, setCerrada] = useState(Boolean(op?.cierre) || Boolean(cerrar));
    const [cierre, setCierre] = useState(op?.cierre ?? hoyISO());
    const [entrada, setEntrada] = useState(op?.entrada !== undefined ? num(op.entrada, 8) : '');
    const [salida, setSalida] = useState(op?.salida !== undefined ? num(op.salida, 8) : '');
    const [cantidad, setCantidad] = useState(op?.cantidad !== undefined ? num(op.cantidad, 8) : '');
    const [comisiones, setComisiones] = useState(op?.comisiones ? String(op.comisiones / 100).replace('.', ',') : '');
    const [manual, setManual] = useState(op?.resultadoManual !== undefined ? String(op.resultadoManual / 100).replace('.', ',') : '');
    const [estrategia, setEstrategia] = useState(op?.estrategia ?? '');
    const [cuentaId, setCuentaId] = useState(op?.inversionId ?? '');
    // Si solo tienes una cuenta de trading, elegirla por defecto en operaciones nuevas (cuando carguen los datos)
    const unica = !op && cuentas.length === 1 ? cuentas[0].id : '';
    const [autoElegida, setAutoElegida] = useState(false);
    if (unica && !autoElegida) {
        setAutoElegida(true);
        setCuentaId(unica);
    }
    const [aplicar, setAplicar] = useState(op ? op.aplicadoEnCuenta !== undefined : true);
    const borrador = {
        id: op?.id ?? nuevoId(),
        activo: activo.trim().toUpperCase().slice(0, 20),
        mercado,
        direccion,
        apertura,
        cierre: cerrada ? cierre : undefined,
        entrada: modo === 'precios' ? aNumero(entrada) : undefined,
        salida: modo === 'precios' && cerrada ? aNumero(salida) : undefined,
        cantidad: modo === 'precios' ? aNumero(cantidad) : undefined,
        comisiones: aCentimos(comisiones),
        resultadoManual: modo === 'resultado' && cerrada ? aCentimos(manual) : undefined,
        inversionId: cuentaId || undefined,
        estrategia: estrategia.trim() || undefined,
        creadoEn: op?.creadoEn ?? ahora(),
        actualizadoEn: ahora(),
    };
    const r = resultado(borrador);
    const valido = borrador.activo && (modo === 'resultado' ? !cerrada || manual.trim() !== '' : borrador.entrada !== undefined && borrador.cantidad !== undefined && (!cerrada || borrador.salida !== undefined));
    /** Suma (o quita) un importe al valor de una cuenta de inversión. */
    const mover = async (id, delta) => {
        if (!id || !delta)
            return;
        const inv = await db.inversiones.get(id);
        if (inv)
            await db.inversiones.update(id, { valor: inv.valor + delta, actualizadoEn: ahora() });
    };
    async function guardar() {
        if (!valido)
            return;
        // Deshacer lo que esta operación sumó antes a su cuenta y volver a aplicarlo con los datos nuevos
        if (op?.aplicadoEnCuenta)
            await mover(op.inversionId, -op.aplicadoEnCuenta);
        const aplicado = aplicar && r !== null && borrador.inversionId ? r : undefined;
        if (aplicado)
            await mover(borrador.inversionId, aplicado);
        await db.operaciones.put({ ...borrador, aplicadoEnCuenta: aplicado });
        avisar(r === null ? `${borrador.activo} abierta` : `${borrador.activo}: ${dinero(r, { signo: true })}`);
        onCerrar();
    }
    return (_jsx(Hoja, { titulo: op ? (cerrar ? `Cerrar ${op.activo}` : op.activo) : 'Nueva operación', onCerrar: onCerrar, children: _jsxs("div", { className: "space-y-3 px-4 pb-5", children: [_jsxs(Panel, { title: "Qu\u00E9", children: [_jsxs(FieldRow, { children: [_jsx(Field, { label: "Activo", value: activo, onChange: (e) => setActivo(e.target.value), placeholder: "AAPL, BTC, EUR/USD\u2026", maxLength: 20, autoFocus: !op }), _jsx(SelectField, { label: "Mercado", value: mercado, onChange: (e) => setMercado(e.target.value), children: Object.keys(MERCADOS).map((m) => (_jsxs("option", { value: m, children: [MERCADOS[m].icono, " ", MERCADOS[m].nombre] }, m))) })] }), _jsx(Segmented, { label: "Direcci\u00F3n", value: direccion, onChange: setDireccion, options: [
                                { value: 'largo', label: 'Largo (compra)' },
                                { value: 'corto', label: 'Corto (venta)' },
                            ] }), _jsx(Field, { label: "Estrategia o motivo (opcional)", value: estrategia, onChange: (e) => setEstrategia(e.target.value), placeholder: "Ej. rotura de resistencia, noticias\u2026", maxLength: 40 })] }), _jsx(Segmented, { label: "C\u00F3mo apuntarla", value: modo, onChange: setModo, options: [
                        { value: 'precios', label: 'Con precios' },
                        { value: 'resultado', label: 'Solo resultado' },
                    ] }), _jsxs(Panel, { title: "Apertura", children: [_jsx(Field, { label: "Fecha de apertura", type: "date", value: apertura, max: hoyISO(), onChange: (e) => e.target.value && setApertura(e.target.value) }), modo === 'precios' && (_jsxs(FieldRow, { children: [_jsx(Field, { label: "Precio de entrada", inputMode: "decimal", className: "num", value: entrada, onChange: (e) => setEntrada(e.target.value.replace(/[^\d.,]/g, '')), placeholder: "0,00" }), _jsx(Field, { label: "Cantidad", inputMode: "decimal", className: "num", value: cantidad, onChange: (e) => setCantidad(e.target.value.replace(/[^\d.,]/g, '')), placeholder: "Acciones, lotes\u2026" })] }))] }), _jsxs(Panel, { title: "Cierre", children: [_jsxs(Tile, { children: [_jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block text-[15px] font-medium", children: "Operaci\u00F3n cerrada" }), _jsx("span", { className: "block text-[13px] text-muted", children: cerrada ? 'Ya has salido de la posición' : 'Sigue abierta: la cierras más tarde' })] }), _jsx(Toggle, { checked: cerrada, onChange: setCerrada, label: "Operaci\u00F3n cerrada" })] }), cerrada && (_jsxs(_Fragment, { children: [_jsx(Field, { label: "Fecha de cierre", type: "date", value: cierre, min: apertura, max: hoyISO(), onChange: (e) => e.target.value && setCierre(e.target.value) }), modo === 'precios' ? (_jsxs(FieldRow, { children: [_jsx(Field, { label: "Precio de salida", inputMode: "decimal", className: "num", value: salida, onChange: (e) => setSalida(e.target.value.replace(/[^\d.,]/g, '')), placeholder: "0,00", autoFocus: cerrar }), _jsx(AmountField, { label: "Comisiones", value: comisiones, onChange: setComisiones })] })) : (_jsx(AmountField, { label: "Resultado neto (en negativo si perdiste)", value: manual, onChange: setManual, hint: "Lo que ganaste o perdiste ya con comisiones, como te lo indica tu br\u00F3ker." }))] }))] }), cuentas.length > 0 && (_jsxs(Panel, { title: "Cuenta", children: [_jsxs(SelectField, { label: "Cuenta de trading (opcional)", value: cuentaId, onChange: (e) => setCuentaId(e.target.value), children: [_jsx("option", { value: "", children: "Ninguna" }), cuentas.map((c) => (_jsxs("option", { value: c.id, children: [c.nombre, c.plataforma ? ` · ${c.plataforma}` : ''] }, c.id)))] }), cuentaId && (_jsxs(Tile, { children: [_jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block text-[15px] font-medium", children: "Sumar el resultado a la cuenta" }), _jsx("span", { className: "block text-[13px] text-muted", children: "Actualiza su valor al cerrar, sin tener que hacerlo a mano" })] }), _jsx(Toggle, { checked: aplicar, onChange: setAplicar, label: "Sumar el resultado a la cuenta" })] }))] })), r !== null && (_jsxs(Alerta, { tone: r >= 0 ? 'brand' : 'danger', children: ["Resultado: ", _jsx("b", { className: "num", children: dinero(r, { signo: true }) }), rentabilidad(borrador) !== null && _jsxs("span", { className: "num", children: [" (", pctTexto(rentabilidad(borrador)), ")"] })] })), _jsx(Button, { className: "w-full", onClick: guardar, disabled: !valido, children: cerrar ? 'Cerrar operación' : 'Guardar' }), op && (_jsx(Button, { variant: "danger", className: "w-full", onClick: async () => {
                        if (!confirm(`¿Eliminar la operación de ${op.activo}?`))
                            return;
                        if (op.aplicadoEnCuenta)
                            await mover(op.inversionId, -op.aplicadoEnCuenta);
                        await db.operaciones.delete(op.id);
                        onCerrar();
                    }, children: "Eliminar operaci\u00F3n" }))] }) }));
}
