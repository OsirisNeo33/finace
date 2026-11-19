import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useDatos } from '../../contexto';
import { db, nuevoId, ahora, CATEGORIA_DEVOLUCIONES } from '../../db/db';
import { compartirTexto, crearMovimiento } from '../../db/acciones';
import { aCentimos } from '../../domain/dinero';
import { fechaCorta, hoyISO } from '../../domain/fechas';
import { devolucionesDe, mensajeRecordatorio, pendienteCobro, porPersona } from '../../domain/cobros';
import { Hoja } from '../../components/Hoja';
import { AmountField, Button, Card, Chip, ChipButton, Cifra, EmptyState, Field, Panel, Tile, Toggle, cx } from '../../components/ui';
import { usarFinanzas } from '../usarFinanzas';
const aTexto = (c) => (c ? (c / 100).toFixed(2).replace('.', ',').replace(/,00$/, '') : '');
const hace = (dias) => (dias === 0 ? 'desde hoy' : dias === 1 ? 'desde ayer' : `hace ${dias} días`);
/** Cuadradito con las iniciales de la persona. */
function Iniciales({ nombre }) {
    const letras = nombre
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
    return _jsx("span", { className: "flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-2 text-[12px] font-semibold text-brand", children: letras || '?' });
}
export function MeDeben() {
    const { movimientos, dinero } = useDatos();
    const { cobros } = usarFinanzas();
    const [nuevo, setNuevo] = useState(null);
    const [abierta, setAbierta] = useState(null);
    const personas = useMemo(() => porPersona(cobros, movimientos), [cobros, movimientos]);
    const total = personas.reduce((s, p) => s + p.pendiente, 0);
    const saldados = cobros.filter((c) => pendienteCobro(c, movimientos) === 0).sort((a, b) => b.actualizadoEn.localeCompare(a.actualizadoEn));
    const persona = personas.find((p) => p.nombre.toLowerCase() === abierta);
    const antigua = personas.reduce((m, p) => Math.max(m, p.dias), 0);
    return (_jsxs(_Fragment, { children: [_jsxs(Card, { dark: true, children: [_jsx("p", { className: "text-[13px] text-white/60", children: "Te deben en total" }), _jsx(Cifra, { max: 34, className: "mt-1", "data-testid": "te-deben", children: dinero(total) }), personas.length > 0 && (_jsxs("div", { className: "mt-4 space-y-2 border-t border-white/10 pt-4 text-[14px]", children: [_jsxs("div", { className: "flex justify-between gap-3", children: [_jsx("span", { className: "text-white/70", children: "Personas" }), _jsx("span", { className: "num font-semibold", children: personas.length })] }), _jsxs("div", { className: "flex justify-between gap-3", children: [_jsx("span", { className: "text-white/70", children: "Lo m\u00E1s antiguo" }), _jsx("span", { className: "font-semibold", children: hace(antigua) })] })] }))] }), _jsx(Button, { className: "w-full", onClick: () => setNuevo({}), children: "+ Alguien me debe dinero" }), personas.length === 0 ? (_jsx(EmptyState, { icon: "\uD83E\uDD1D", title: "Nadie te debe nada", children: "Apunta aqu\u00ED cuando prestes dinero o pagues la parte de otra persona (una cena, unas entradas, un regalo compartido\u2026). Te ayuda a acordarte y a record\u00E1rselo." })) : (_jsx(Panel, { title: "Qui\u00E9n te debe", detail: "de m\u00E1s a menos", footer: "Toca una persona para ver el detalle, cobrar o enviarle un recordatorio.", children: personas.map((p) => (_jsxs("button", { type: "button", className: "flex min-h-14 w-full items-center gap-3 rounded-[18px] border border-border bg-surface px-3.5 py-3 text-left tarjeta-tactil active:bg-surface-2", onClick: () => setAbierta(p.nombre.toLowerCase()), "aria-label": `${p.nombre}: te debe ${dinero(p.pendiente)}`, children: [_jsx(Iniciales, { nombre: p.nombre }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block truncate text-[15px] font-medium", children: p.nombre }), _jsxs("span", { className: "block truncate text-[13px] text-muted", children: [p.cobros.length === 1 ? p.cobros[0].concepto : `${p.cobros.length} cosas`, " \u00B7 ", hace(p.dias)] })] }), _jsxs("span", { className: "flex shrink-0 flex-col items-end gap-1", children: [_jsx("span", { className: "num text-[15px] font-semibold", children: dinero(p.pendiente) }), p.dias >= 30 && _jsx(Chip, { tone: "warning", children: "Reclamar" })] })] }, p.nombre))) })), saldados.length > 0 && (_jsx(Panel, { title: "Ya te lo devolvieron", detail: _jsx("span", { className: "num", children: saldados.length }), children: saldados.slice(0, 5).map((c) => (_jsxs(Tile, { className: "opacity-80", children: [_jsx(Iniciales, { nombre: c.persona }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block truncate text-[15px] font-medium", children: c.persona }), _jsx("span", { className: "block truncate text-[13px] text-muted", children: c.concepto })] }), _jsxs("span", { className: "flex shrink-0 flex-col items-end gap-1", children: [_jsx("span", { className: "num text-[15px] text-muted", children: dinero(c.importe) }), _jsx(Chip, { tone: "success", children: "Devuelto" })] })] }, c.id))) })), persona && _jsx(DetallePersona, { p: persona, onCerrar: () => setAbierta(null), onAnadir: () => (setAbierta(null), setNuevo({ persona: persona.nombre })) }), nuevo && _jsx(FormCobro, { persona: nuevo.persona, onCerrar: () => setNuevo(null) })] }));
}
function DetallePersona({ p, onCerrar, onAnadir }) {
    const { movimientos, dinero, categorias, cuentas, ajustes, avisar } = useDatos();
    const [cobrando, setCobrando] = useState(p.cobros.length === 1 ? p.cobros[0].id : null);
    const elegido = p.cobros.find((c) => c.id === cobrando);
    const [importe, setImporte] = useState(elegido ? aTexto(elegido.pendiente) : '');
    const [comoIngreso, setComoIngreso] = useState(true);
    const categoriaId = categorias.find((c) => c.tipo === 'ingreso' && c.nombre === CATEGORIA_DEVOLUCIONES)?.id;
    const cuentaId = cuentas.find((c) => c.id === ajustes.ultimaCuentaId)?.id ?? cuentas[0]?.id;
    const elegir = (c) => {
        setCobrando(c.id);
        setImporte(aTexto(c.pendiente));
    };
    /** Registra una devolución; si `todo`, salda todo lo de esta persona. */
    async function cobrar(lista, cantidad) {
        const ids = [];
        const anteriores = new Map(lista.map((c) => [c.id, c.devoluciones]));
        for (const c of lista) {
            const c2 = cantidad ?? c.pendiente;
            if (c2 <= 0)
                continue;
            if (comoIngreso && cuentaId)
                ids.push(await crearMovimiento({ tipo: 'ingreso', importe: c2, fecha: hoyISO(), cuentaId, categoriaId, nota: `${p.nombre}: ${c.concepto}`, etiquetas: [], cobroId: c.id }));
            else
                await db.cobros.update(c.id, { devoluciones: [...c.devoluciones, { fecha: hoyISO(), importe: c2, creadoEn: ahora() }], actualizadoEn: ahora() });
            await db.cobros.update(c.id, { actualizadoEn: ahora() });
        }
        const suma = cantidad ?? lista.reduce((s, c) => s + c.pendiente, 0);
        avisar(`${p.nombre} te ha devuelto ${dinero(suma)}`, {
            etiqueta: 'Deshacer',
            hacer: async () => {
                await db.movimientos.bulkDelete(ids);
                for (const [id, devs] of anteriores)
                    await db.cobros.update(id, { devoluciones: devs });
            },
        });
        if (suma >= p.pendiente)
            onCerrar();
        else
            setCobrando(null);
    }
    return (_jsx(Hoja, { titulo: p.nombre, onCerrar: onCerrar, children: _jsxs("div", { className: "space-y-3 px-4 pb-5", children: [_jsxs(Card, { children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "text-[13px] text-muted", children: "Te debe" }), _jsx(Cifra, { max: 34, className: "mt-1", "data-testid": "persona-pendiente", children: dinero(p.pendiente) }), _jsx("p", { className: "mt-1 text-[13px] text-muted", children: hace(p.dias) })] }), p.dias >= 30 ? _jsx(Chip, { tone: "warning", children: "Reclamar" }) : _jsx(Chip, { tone: "brand", children: "Pendiente" })] }), _jsxs("div", { className: "mt-4 grid grid-cols-2 gap-2", children: [_jsx(Button, { variant: "secondary", className: "px-3", onClick: () => compartirTexto(mensajeRecordatorio(p, dinero)).catch(() => { }), children: "Recordar" }), _jsx(Button, { className: "px-3", onClick: () => cobrar(p.cobros), children: "Cobrar todo" })] })] }), _jsx(Panel, { title: "Qu\u00E9 te debe", detail: _jsx("span", { className: "num", children: p.cobros.length }), children: p.cobros.map((c) => {
                        const devs = devolucionesDe(c, movimientos);
                        return (_jsxs("button", { type: "button", className: cx('flex min-h-14 w-full items-center gap-3 rounded-[18px] border bg-surface px-3.5 py-3 text-left tarjeta-tactil', cobrando === c.id ? 'border-brand' : 'border-border'), onClick: () => elegir(c), "aria-pressed": cobrando === c.id, children: [_jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block truncate text-[15px] font-medium", children: c.concepto }), _jsxs("span", { className: "block truncate text-[13px] text-muted", children: [_jsx("span", { className: "num", children: fechaCorta(c.fecha) }), devs.length > 0 ? ` · ya devolvió ${dinero(c.importe - c.pendiente)} de ${dinero(c.importe)}` : ''] })] }), _jsx("span", { className: "num shrink-0 text-[15px] font-semibold", children: dinero(c.pendiente) })] }, c.id));
                    }) }), elegido ? (_jsxs(Panel, { title: `Cobrar «${elegido.concepto}»`, children: [_jsx(AmountField, { label: "Te ha devuelto", value: importe, onChange: setImporte }), _jsxs(Tile, { children: [_jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block text-[15px] font-medium", children: "Apuntarlo como ingreso" }), _jsx("span", { className: "block text-[13px] text-muted", children: comoIngreso ? `En ${CATEGORIA_DEVOLUCIONES}, en tu cuenta` : 'Solo baja lo que te debe (ej. te pagó en efectivo y no lo apuntas)' })] }), _jsx(Toggle, { checked: comoIngreso, onChange: setComoIngreso, label: "Apuntarlo como ingreso" })] }), _jsx(Button, { className: "w-full", disabled: aCentimos(importe) <= 0, onClick: () => cobrar([elegido], Math.min(aCentimos(importe), elegido.pendiente)), children: "Registrar devoluci\u00F3n" })] })) : (_jsx("p", { className: "px-3 text-[13px] text-muted", children: "Toca una de la lista para cobrar solo esa (o una parte)." })), _jsxs(Button, { variant: "secondary", className: "w-full", onClick: onAnadir, children: ["+ Apuntar otra cosa a ", p.nombre.split(/\s+/)[0]] }), _jsx(Button, { variant: "danger", className: "w-full", onClick: async () => {
                        if (!confirm(`¿Olvidar lo que te debe ${p.nombre}? Se marcará como saldado sin apuntar ningún ingreso.`))
                            return;
                        for (const c of p.cobros)
                            await db.cobros.update(c.id, { saldado: true, actualizadoEn: ahora() });
                        onCerrar();
                    }, children: "Perdonar la deuda" })] }) }));
}
function FormCobro({ persona, onCerrar }) {
    const { avisar, dinero } = useDatos();
    const { cobros } = usarFinanzas();
    const [nombre, setNombre] = useState(persona ?? '');
    const [concepto, setConcepto] = useState('');
    const [importe, setImporte] = useState('');
    const [fecha, setFecha] = useState(hoyISO());
    const conocidas = [...new Set(cobros.map((c) => c.persona.trim()))].slice(0, 12);
    const c = aCentimos(importe);
    async function guardar() {
        if (!nombre.trim() || c <= 0)
            return;
        await db.cobros.add({ id: nuevoId(), persona: nombre.trim(), concepto: concepto.trim() || 'Dinero prestado', importe: c, fecha, devoluciones: [], saldado: false, creadoEn: ahora(), actualizadoEn: ahora() });
        avisar(`Apuntado: ${nombre.trim()} te debe ${dinero(c)}`);
        onCerrar();
    }
    return (_jsx(Hoja, { titulo: "Alguien me debe", onCerrar: onCerrar, children: _jsxs("div", { className: "space-y-3 px-4 pb-5", children: [_jsxs(Panel, { title: "Qui\u00E9n", children: [_jsx(Field, { label: "Nombre", value: nombre, onChange: (e) => setNombre(e.target.value), placeholder: "Ej. Ana", autoFocus: !persona, maxLength: 40 }), conocidas.length > 0 && !persona && (_jsx("div", { className: "sin-scrollbar -mx-2 flex gap-1.5 overflow-x-auto px-2 pb-1", children: conocidas.map((n) => (_jsx(ChipButton, { active: nombre === n, onClick: () => setNombre(n), children: n }, n))) }))] }), _jsxs(Panel, { title: "Qu\u00E9 y cu\u00E1nto", children: [_jsx(Field, { label: "Por qu\u00E9 te lo debe", value: concepto, onChange: (e) => setConcepto(e.target.value), placeholder: "Ej. Cena del s\u00E1bado, entradas, pr\u00E9stamo\u2026", maxLength: 60 }), _jsx(AmountField, { label: "Cu\u00E1nto te debe", value: importe, onChange: setImporte, autoFocus: !!persona }), _jsx(Field, { label: "Desde", type: "date", value: fecha, max: hoyISO(), onChange: (e) => e.target.value && setFecha(e.target.value) })] }), _jsx("p", { className: "px-3 text-[13px] leading-snug text-muted", children: "Si pagaste t\u00FA toda la cuenta, apunta el gasto completo como siempre y aqu\u00ED solo la parte que te deben." }), _jsx(Button, { className: "w-full", onClick: guardar, disabled: !nombre.trim() || c <= 0, children: "Guardar" })] }) }));
}
