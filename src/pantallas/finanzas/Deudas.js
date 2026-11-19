import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { addMonths, setDate } from 'date-fns';
import { useDatos } from '../../contexto';
import { db, nuevoId, ahora, CATEGORIA_DEUDAS } from '../../db/db';
import { crearMovimiento, guardarRecurrente } from '../../db/acciones';
import { aCentimos } from '../../domain/dinero';
import { aISO, fechaCorta, hoyISO } from '../../domain/fechas';
import { TAE_CARA, TIPOS_DEUDA, duracion, ordenAvalancha, pagosDeDeuda, pendienteActual, proyectar } from '../../domain/deudas';
import { Hoja } from '../../components/Hoja';
import { Alerta, AmountField, Button, Card, Chip, Cifra, DataTile, Emoji, EmptyState, Field, FieldRow, Panel, ProgressBar, SelectField, Tile, Toggle, cx } from '../../components/ui';
import { usarFinanzas } from '../usarFinanzas';
const aTexto = (c) => (c ? (c / 100).toFixed(2).replace('.', ',').replace(/,00$/, '') : '');
const taeTexto = (t) => `${t.toLocaleString('es-ES', { maximumFractionDigits: 2 })} %`;
export function Deudas() {
    const { movimientos, dinero } = useDatos();
    const { deudas, salud } = usarFinanzas();
    const [form, setForm] = useState(null);
    const [abierta, setAbierta] = useState(null);
    const conPendiente = useMemo(() => deudas.map((d) => ({ ...d, pendiente: pendienteActual(d, movimientos) })), [deudas, movimientos]);
    const activas = ordenAvalancha(conPendiente.filter((d) => !d.saldada && d.pendiente > 0));
    const saldadas = conPendiente.filter((d) => d.saldada || d.pendiente === 0);
    const c = salud.cifras;
    const pagado = activas.reduce((s, d) => s + Math.max(0, d.importeInicial - d.pendiente), 0);
    const elegida = deudas.find((d) => d.id === abierta);
    return (_jsxs(_Fragment, { children: [_jsxs(Card, { dark: true, children: [_jsx("p", { className: "text-[13px] text-white/60", children: "Debes en total" }), _jsx(Cifra, { max: 34, className: "mt-1", "data-testid": "deuda-total", children: dinero(c.deudaTotal) }), _jsxs("div", { className: "mt-4 space-y-2 border-t border-white/10 pt-4 text-[14px]", children: [_jsxs("div", { className: "flex justify-between gap-3", children: [_jsx("span", { className: "text-white/70", children: "Cuotas al mes" }), _jsx("span", { className: "num font-semibold", children: dinero(c.cuotas) })] }), c.ratioDeuda !== null && c.cuotas > 0 && (_jsxs("div", { className: "flex justify-between gap-3", children: [_jsx("span", { className: "text-white/70", children: "De tus ingresos" }), _jsxs("span", { className: cx('num font-semibold', c.ratioDeuda > 0.35 && 'text-danger'), children: [Math.round(c.ratioDeuda * 100), " %"] })] })), pagado > 0 && (_jsxs("div", { className: "flex justify-between gap-3", children: [_jsx("span", { className: "text-white/70", children: "Ya pagado" }), _jsx("span", { className: "num font-semibold", children: dinero(pagado) })] }))] })] }), _jsx(Button, { className: "w-full", onClick: () => setForm('nueva'), children: "+ A\u00F1adir deuda" }), activas.length === 0 ? (_jsx(EmptyState, { icon: "\uD83C\uDF89", title: deudas.length ? 'No te queda ninguna deuda' : 'Sin deudas apuntadas', children: "Apunta pr\u00E9stamos, la hipoteca, lo que debes en la tarjeta, compras a plazos o dinero que te prestaron. Ver\u00E1s cu\u00E1ndo terminas y cu\u00E1nto pagas de intereses." })) : (_jsx(Panel, { title: "Tus deudas", detail: "en orden de pago", footer: "Ordenadas por el m\u00E9todo avalancha: si te sobra dinero, adel\u00E1ntalo a la primera de la lista. Es la que m\u00E1s intereses te cobra y as\u00ED pagas menos en total.", children: activas.map((d) => (_jsx(FilaDeuda, { d: d, onClick: () => setAbierta(d.id) }, d.id))) })), saldadas.length > 0 && (_jsx(Panel, { title: "Saldadas", detail: _jsx("span", { className: "num", children: saldadas.length }), children: saldadas.map((d) => (_jsx(FilaDeuda, { d: d, onClick: () => setAbierta(d.id) }, d.id))) })), elegida && _jsx(DetalleDeuda, { d: elegida, onCerrar: () => setAbierta(null), onEditar: () => (setAbierta(null), setForm(elegida)) }), form && _jsx(FormDeuda, { deuda: form === 'nueva' ? undefined : form, onCerrar: () => setForm(null) })] }));
}
function FilaDeuda({ d, onClick }) {
    const { dinero } = useDatos();
    const t = TIPOS_DEUDA[d.tipo];
    const saldada = d.saldada || d.pendiente === 0;
    const p = saldada ? null : proyectar(d.pendiente, d.cuota, d.tae);
    const progreso = d.importeInicial > 0 ? Math.min(1, Math.max(0, (d.importeInicial - d.pendiente) / d.importeInicial)) : 0;
    return (_jsxs("button", { type: "button", className: cx('block w-full rounded-[18px] border border-border bg-surface px-3.5 py-3 text-left tarjeta-tactil active:bg-surface-2', saldada && 'opacity-70'), onClick: onClick, "aria-label": `${d.nombre}: ${dinero(d.pendiente)} pendientes`, children: [_jsxs("span", { className: "flex items-center gap-3", children: [_jsx(Emoji, { children: t.icono }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block truncate text-[15px] font-medium", children: d.nombre }), _jsxs("span", { className: "block truncate text-[13px] text-muted", children: [d.cuota > 0 ? `${dinero(d.cuota)}/mes` : 'Sin cuota fija', " \u00B7 ", d.tae > 0 ? `${taeTexto(d.tae)} TAE` : 'sin intereses'] })] }), _jsxs("span", { className: "flex shrink-0 flex-col items-end gap-1", children: [_jsx("span", { className: "num text-[15px] font-semibold", children: dinero(d.pendiente) }), saldada ? _jsx(Chip, { tone: "success", children: "Saldada" }) : d.tae >= TAE_CARA ? _jsx(Chip, { tone: "danger", children: "Cara" }) : null] })] }), !saldada && (_jsxs(_Fragment, { children: [_jsx("span", { className: "mt-2.5 block", children: _jsx(ProgressBar, { value: progreso, tone: "success" }) }), _jsx("span", { className: cx('mt-1.5 block text-[12px]', p ? 'text-muted' : 'text-danger'), children: p ? `Terminas en ${p.fin} (${duracion(p.meses)})${p.intereses > 0 ? ` · intereses ≈ ${dinero(p.intereses)}` : ''}` : d.cuota > 0 ? 'La cuota no cubre los intereses: así no se acaba nunca' : 'Pon una cuota para ver cuándo terminas' })] }))] }));
}
function DetalleDeuda({ d, onCerrar, onEditar }) {
    const { movimientos, dinero, categorias, cuentas, ajustes, avisar } = useDatos();
    const pendiente = pendienteActual(d, movimientos);
    const pagos = pagosDeDeuda(d, movimientos);
    const p = proyectar(pendiente, d.cuota, d.tae);
    const [importe, setImporte] = useState(aTexto(Math.min(d.cuota || pendiente, pendiente)));
    const [comoGasto, setComoGasto] = useState(true);
    const t = TIPOS_DEUDA[d.tipo];
    const categoriaId = categorias.find((c) => c.nombre === CATEGORIA_DEUDAS)?.id;
    const cuentaId = cuentas.find((c) => c.id === ajustes.ultimaCuentaId)?.id ?? cuentas[0]?.id;
    const progreso = d.importeInicial > 0 ? Math.min(1, Math.max(0, (d.importeInicial - pendiente) / d.importeInicial)) : 0;
    async function registrarPago() {
        const c = aCentimos(importe);
        if (c <= 0)
            return;
        if (comoGasto && cuentaId) {
            const id = await crearMovimiento({ tipo: 'gasto', importe: c, fecha: hoyISO(), cuentaId, categoriaId, nota: `Pago ${d.nombre}`, etiquetas: [], deudaId: d.id });
            avisar(`Pago de ${dinero(c)} registrado`, { etiqueta: 'Deshacer', hacer: () => db.movimientos.delete(id) });
        }
        else {
            const pago = { fecha: hoyISO(), importe: c, creadoEn: ahora() };
            await db.deudas.update(d.id, { pagos: [...d.pagos, pago], actualizadoEn: ahora() });
            avisar(`Pago de ${dinero(c)} registrado`, { etiqueta: 'Deshacer', hacer: () => db.deudas.update(d.id, { pagos: d.pagos }) });
        }
        if (c >= pendiente) {
            await db.deudas.update(d.id, { saldada: true });
            avisar(`¡«${d.nombre}» saldada! 🎉`);
            onCerrar();
        }
    }
    async function crearFijo() {
        if (!cuentaId)
            return;
        const hoy = new Date();
        const dia = d.diaPago ?? hoy.getDate();
        let inicio = setDate(hoy, Math.min(dia, 28));
        if (aISO(inicio) <= hoyISO())
            inicio = addMonths(inicio, 1);
        const recurrenteId = nuevoId();
        await guardarRecurrente({ id: recurrenteId, tipo: 'gasto', importe: d.cuota, cuentaId, categoriaId, nota: `Cuota ${d.nombre}`, frecuencia: 'mensual', inicio: aISO(inicio), activo: true, automatico: true });
        await db.deudas.update(d.id, { recurrenteId, actualizadoEn: ahora() });
        avisar(`Cuota añadida a tus gastos fijos (día ${inicio.getDate()})`);
    }
    return (_jsx(Hoja, { titulo: `${t.icono} ${d.nombre}`, onCerrar: onCerrar, children: _jsxs("div", { className: "space-y-3 px-4 pb-5", children: [_jsxs(Card, { children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "text-[13px] text-muted", children: "Te queda por pagar" }), _jsx(Cifra, { max: 34, className: "mt-1", "data-testid": "deuda-pendiente", children: dinero(pendiente) })] }), d.saldada || pendiente === 0 ? _jsx(Chip, { tone: "success", children: "Saldada" }) : d.tae >= TAE_CARA ? _jsx(Chip, { tone: "danger", children: "Deuda cara" }) : _jsx(Chip, { tone: "brand", children: "En curso" })] }), d.importeInicial > 0 && (_jsxs("div", { className: "mt-3", children: [_jsx(ProgressBar, { value: progreso, tone: "success" }), _jsxs("p", { className: "num mt-1.5 text-[12px] text-muted", children: ["Pagado ", Math.round(progreso * 100), " % de ", dinero(d.importeInicial)] })] }))] }), pendiente > 0 && !d.saldada && (_jsx(Alerta, { tone: p ? 'brand' : 'danger', children: p ? (_jsxs(_Fragment, { children: ["Con ", dinero(d.cuota), " al mes terminas en ", _jsx("b", { children: p.fin }), " (", duracion(p.meses), ").", p.intereses > 0 && (_jsxs(_Fragment, { children: [' ', "Pagar\u00E1s unos ", _jsx("b", { className: "num", children: dinero(p.intereses) }), " de intereses."] }))] })) : d.cuota > 0 ? ('Tu cuota no llega a cubrir los intereses: la deuda no baja. Intenta pagar más cada mes o renegociarla.') : ('Añade la cuota mensual (en «Editar») para saber cuándo terminas.') })), _jsxs(Panel, { title: "Datos", children: [_jsx(DataTile, { label: "Tipo", value: t.nombre }), d.acreedor && _jsx(DataTile, { label: "Con", value: d.acreedor }), _jsx(DataTile, { label: "Cuota mensual", value: d.cuota ? dinero(d.cuota) : '—', mono: true }), _jsx(DataTile, { label: "Inter\u00E9s (TAE)", value: d.tae ? taeTexto(d.tae) : 'Sin intereses', mono: true }), d.diaPago && _jsx(DataTile, { label: "D\u00EDa de pago", value: `Día ${d.diaPago}` }), _jsx(DataTile, { label: "Cuota en gastos fijos", value: d.recurrenteId ? 'Sí, se descuenta sola' : 'No' })] }), pendiente > 0 && !d.saldada && (_jsxs(Panel, { title: "Registrar un pago", footer: d.tae > 0 ? 'Si parte del pago son intereses, ajusta después «Lo que debes hoy» con el dato de tu banco.' : undefined, children: [_jsx(AmountField, { label: "Importe del pago", value: importe, onChange: setImporte }), _jsxs(Tile, { children: [_jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block text-[15px] font-medium", children: "Apuntarlo tambi\u00E9n como gasto" }), _jsx("span", { className: "block text-[13px] text-muted", children: comoGasto ? `En ${CATEGORIA_DEUDAS}, con fecha de hoy` : 'Solo baja la deuda (por ejemplo, si ya lo apuntaste)' })] }), _jsx(Toggle, { checked: comoGasto, onChange: setComoGasto, label: "Apuntarlo tambi\u00E9n como gasto" })] }), _jsx(Button, { className: "w-full", onClick: registrarPago, disabled: aCentimos(importe) <= 0, children: "Registrar pago" })] })), !d.recurrenteId && d.cuota > 0 && pendiente > 0 && !d.saldada && (_jsx(Button, { variant: "secondary", className: "w-full", onClick: crearFijo, children: "A\u00F1adir la cuota a mis gastos fijos" })), pagos.length > 0 && (_jsx(Panel, { title: "\u00DAltimos pagos", detail: _jsx("span", { className: "num", children: pagos.length }), children: pagos.slice(0, 6).map((x, i) => (_jsx(DataTile, { label: _jsx("span", { className: "num", children: fechaCorta(x.fecha) }), value: `${dinero(x.importe)}${x.comoGasto ? '' : ' · sin gasto'}`, mono: true }, i))) })), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onEditar, children: "Editar" }), _jsx(Button, { variant: "secondary", onClick: async () => {
                                await db.deudas.update(d.id, { saldada: !d.saldada, actualizadoEn: ahora() });
                                onCerrar();
                            }, children: d.saldada ? 'Reabrir' : 'Marcar saldada' })] }), _jsx(Button, { variant: "danger", className: "w-full", onClick: async () => {
                        if (!confirm(`¿Eliminar «${d.nombre}»? Los gastos ya apuntados se conservan.`))
                            return;
                        await db.deudas.delete(d.id);
                        onCerrar();
                    }, children: "Eliminar deuda" })] }) }));
}
function FormDeuda({ deuda, onCerrar }) {
    const { movimientos, avisar, dinero } = useDatos();
    const actual = deuda ? pendienteActual(deuda, movimientos) : 0;
    const [tipo, setTipo] = useState(deuda?.tipo ?? 'prestamo');
    const [nombre, setNombre] = useState(deuda?.nombre ?? '');
    const [acreedor, setAcreedor] = useState(deuda?.acreedor ?? '');
    const [inicial, setInicial] = useState(aTexto(deuda?.importeInicial ?? 0));
    const [pendiente, setPendiente] = useState(aTexto(actual));
    const [cuota, setCuota] = useState(aTexto(deuda?.cuota ?? 0));
    const [tae, setTae] = useState(deuda?.tae ? String(deuda.tae).replace('.', ',') : '');
    const [dia, setDia] = useState(deuda?.diaPago ? String(deuda.diaPago) : '');
    const t = TIPOS_DEUDA[tipo];
    const taeNum = Number(tae.replace(',', '.')) || 0;
    const pend = aCentimos(pendiente);
    const ini = aCentimos(inicial);
    const vistaPrevia = pend > 0 ? proyectar(pend, aCentimos(cuota), taeNum) : null;
    async function guardar() {
        if (!nombre.trim() || pend <= 0)
            return;
        const cambiaPendiente = !deuda || pend !== actual;
        await db.deudas.put({
            id: deuda?.id ?? nuevoId(),
            nombre: nombre.trim(),
            tipo,
            acreedor: acreedor.trim() || undefined,
            importeInicial: Math.max(ini, pend),
            // Si cambias lo que debes hoy, esa cifra pasa a ser la nueva base de cálculo
            pendiente: cambiaPendiente ? pend : deuda.pendiente,
            baseEn: cambiaPendiente ? ahora() : deuda.baseEn,
            cuota: aCentimos(cuota),
            tae: Math.max(0, taeNum),
            diaPago: dia ? Number(dia) : undefined,
            recurrenteId: deuda?.recurrenteId,
            pagos: deuda?.pagos ?? [],
            notas: deuda?.notas,
            saldada: deuda?.saldada ?? false,
            creadoEn: deuda?.creadoEn ?? ahora(),
            actualizadoEn: ahora(),
        });
        avisar(deuda ? 'Deuda actualizada' : `${nombre.trim()} añadida`);
        onCerrar();
    }
    return (_jsx(Hoja, { titulo: deuda ? 'Editar deuda' : 'Nueva deuda', onCerrar: onCerrar, children: _jsxs("div", { className: "space-y-3 px-4 pb-5", children: [_jsxs(Panel, { title: "Qu\u00E9 es", children: [_jsx(SelectField, { label: "Tipo", value: tipo, onChange: (e) => setTipo(e.target.value), hint: t.ayuda, children: Object.keys(TIPOS_DEUDA).map((k) => (_jsxs("option", { value: k, children: [TIPOS_DEUDA[k].icono, " ", TIPOS_DEUDA[k].nombre] }, k))) }), _jsx(Field, { label: "Nombre", value: nombre, onChange: (e) => setNombre(e.target.value), placeholder: tipo === 'hipoteca' ? 'Ej. Hipoteca piso' : tipo === 'tarjeta' ? 'Ej. Tarjeta BBVA' : tipo === 'personal' ? 'Ej. Préstamo de mamá' : 'Ej. Préstamo coche', maxLength: 40 }), _jsx(Field, { label: tipo === 'personal' ? 'A quién se lo debes' : 'Banco o entidad (opcional)', value: acreedor, onChange: (e) => setAcreedor(e.target.value), placeholder: tipo === 'personal' ? 'Ej. Laura' : 'Ej. BBVA, Cetelem, Klarna…', maxLength: 40 })] }), _jsxs(Panel, { title: "Importes", children: [_jsxs(FieldRow, { children: [_jsx(AmountField, { label: "Lo que debes hoy", value: pendiente, onChange: setPendiente, hint: deuda && pend !== actual ? 'Se usará como nueva cifra de partida' : undefined, hintTone: "brand" }), _jsx(AmountField, { label: "Importe inicial", value: inicial, onChange: setInicial, hint: "Para ver lo que llevas pagado" })] }), _jsxs(FieldRow, { children: [_jsx(AmountField, { label: "Cuota al mes", value: cuota, onChange: setCuota }), _jsx(Field, { label: "Inter\u00E9s TAE (%)", inputMode: "decimal", placeholder: tipo === 'tarjeta' ? 'Ej. 20' : tipo === 'personal' ? '0' : 'Ej. 7,5', value: tae, onChange: (e) => setTae(e.target.value.replace(/[^\d.,]/g, '')), className: "num" })] }), _jsxs(SelectField, { label: "D\u00EDa de pago (opcional)", value: dia, onChange: (e) => setDia(e.target.value), children: [_jsx("option", { value: "", children: "Sin d\u00EDa fijo" }), Array.from({ length: 28 }, (_, i) => (_jsxs("option", { value: i + 1, children: ["D\u00EDa ", i + 1] }, i + 1)))] })] }), _jsx("p", { className: "px-3 text-[13px] leading-snug text-muted", children: "La TAE aparece en tu contrato o en la app de tu banco. Las tarjetas \u00ABrevolving\u00BB y muchos pagos aplazados rondan el 20 %. Si no lo sabes, d\u00E9jalo vac\u00EDo." }), vistaPrevia && vistaPrevia.meses > 0 && (_jsxs(Alerta, { tone: "brand", children: ["Terminar\u00EDas en ", vistaPrevia.fin, " (", duracion(vistaPrevia.meses), ")", vistaPrevia.intereses > 0 ? `, con unos ${dinero(vistaPrevia.intereses, { sinDecimales: true })} de intereses` : '', "."] })), _jsx(Button, { className: "w-full", onClick: guardar, disabled: !nombre.trim() || pend <= 0, children: "Guardar" })] }) }));
}
