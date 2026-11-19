import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useDatos } from '../../contexto';
import { Hoja } from '../../components/Hoja';
import { SelectorIcono } from '../../components/Selectores';
import { Cifra, AmountField, Button, Card, ChipButton, Emoji, Field, Panel, SelectField, TileButton, cx } from '../../components/ui';
import { saldosCuentas } from '../../domain/calculos';
import { aCentimos } from '../../domain/dinero';
import { ENTIDADES, saldoInicialPara } from '../../domain/bancos';
import { db, nuevoId } from '../../db/db';
export const TIPOS_CUENTA = [
    ['banco', 'Banco', '🏦'],
    ['efectivo', 'Efectivo', '💵'],
    ['tarjeta', 'Tarjeta de crédito', '💳'],
    ['ahorro', 'Ahorro / inversión', '🐷'],
];
const aTexto = (c) => (c ? (c / 100).toFixed(2).replace('.', ',').replace(/,00$/, '') : '');
export function Cuentas() {
    const { todasCuentas, movimientos, dinero } = useDatos();
    const [editando, setEditando] = useState(null);
    const saldos = useMemo(() => saldosCuentas(todasCuentas, movimientos), [todasCuentas, movimientos]);
    const total = todasCuentas.filter((c) => !c.archivada).reduce((s, c) => s + (saldos.get(c.id) ?? 0), 0);
    return (_jsxs(_Fragment, { children: [_jsxs(Card, { dark: true, children: [_jsx("p", { className: "text-[13px] text-white/60", children: "Total en todas tus cuentas" }), _jsx(Cifra, { max: 34, className: "mt-1", children: dinero(total) }), _jsxs("p", { className: "mt-1 text-[13px] text-white/60", children: [todasCuentas.filter((c) => !c.archivada).length, " ", todasCuentas.filter((c) => !c.archivada).length === 1 ? 'cuenta' : 'cuentas'] })] }), _jsx(Panel, { title: "Tus cuentas", footer: "Toca una cuenta para poner el saldo que ves hoy en tu banco. Para mover dinero entre cuentas (por ejemplo, de BBVA a Revolut o sacar del cajero), usa \u00ABTransferencia\u00BB al a\u00F1adir un movimiento: no cuenta como gasto.", children: todasCuentas.map((c) => {
                    const saldo = saldos.get(c.id) ?? 0;
                    return (_jsx(TileButton, { className: c.archivada ? 'opacity-60' : undefined, icon: _jsx(Emoji, { children: c.icono }), title: c.nombre, subtitle: c.archivada ? 'Archivada' : TIPOS_CUENTA.find((t) => t[0] === c.tipo)?.[1], detail: _jsx("span", { className: cx('num text-[15px] font-semibold', saldo < 0 ? 'text-danger' : 'text-text'), children: dinero(saldo) }), chevron: true, onClick: () => setEditando(c) }, c.id));
                }) }), _jsx(Button, { className: "w-full", onClick: () => setEditando('nueva'), children: "+ A\u00F1adir banco o cuenta" }), editando && _jsx(FormCuenta, { cuenta: editando === 'nueva' ? undefined : editando, onCerrar: () => setEditando(null) })] }));
}
export function FormCuenta({ cuenta, onCerrar }) {
    const { todasCuentas, movimientos, avisar, dinero } = useDatos();
    const saldoActual = useMemo(() => (cuenta ? saldosCuentas([cuenta], movimientos).get(cuenta.id) ?? 0 : 0), [cuenta, movimientos]);
    const [nombre, setNombre] = useState(cuenta?.nombre ?? '');
    const [tipo, setTipo] = useState(cuenta?.tipo ?? 'banco');
    const [icono, setIcono] = useState(cuenta?.icono ?? '🏦');
    const [color, setColor] = useState(cuenta?.color ?? '#2563eb');
    const [saldo, setSaldo] = useState(aTexto(saldoActual));
    const [verIcono, setVerIcono] = useState(false);
    const usada = cuenta && movimientos.some((m) => m.cuentaId === cuenta.id || m.cuentaDestinoId === cuenta.id);
    const deseado = aCentimos(saldo);
    const usados = new Set(todasCuentas.map((c) => c.nombre.toLowerCase()));
    async function guardar() {
        if (!nombre.trim())
            return;
        await db.cuentas.put({
            id: cuenta?.id ?? nuevoId(),
            nombre: nombre.trim(),
            tipo,
            icono,
            color,
            saldoInicial: saldoInicialPara(deseado, saldoActual, cuenta?.saldoInicial ?? 0),
            orden: cuenta?.orden ?? todasCuentas.length,
            archivada: cuenta?.archivada ?? false,
        });
        avisar(cuenta ? `${nombre.trim()}: saldo ${dinero(deseado)}` : `${nombre.trim()} añadida`);
        onCerrar();
    }
    const libres = ENTIDADES.filter((e) => !usados.has(e.nombre.toLowerCase()));
    return (_jsx(Hoja, { titulo: cuenta ? cuenta.nombre : 'Añadir banco o cuenta', onCerrar: onCerrar, children: _jsxs("div", { className: "space-y-3 px-4 pb-5", children: [!cuenta && libres.length > 0 && (_jsx(Panel, { title: "Elige tu banco", children: _jsx("div", { className: "flex flex-wrap gap-1.5 px-1 pb-1", children: libres.map((e) => (_jsx(ChipButton, { active: nombre === e.nombre, onClick: () => {
                                setNombre(e.nombre);
                                setTipo(e.tipo);
                                setIcono(e.icono);
                                setColor(e.color);
                            }, children: e.nombre }, e.nombre))) }) })), _jsxs(Panel, { title: "Datos", children: [_jsx(Field, { label: "Nombre", value: nombre, onChange: (e) => setNombre(e.target.value), placeholder: "O escribe otro: Hucha, Cuenta n\u00F3mina\u2026", maxLength: 30 }), _jsx(AmountField, { label: cuenta ? 'Saldo actual (el que ves hoy en tu banco)' : '¿Cuánto tienes ahora en esta cuenta?', value: saldo, onChange: setSaldo, autoFocus: !!cuenta, hint: cuenta && deseado !== saldoActual
                                ? `Antes: ${dinero(saldoActual)} → ahora: ${dinero(deseado)}. No cuenta como gasto ni ingreso.`
                                : tipo === 'tarjeta'
                                    ? 'Si debes dinero en la tarjeta, ponlo en negativo (ej. -250).'
                                    : undefined, hintTone: cuenta && deseado !== saldoActual ? 'brand' : undefined }), _jsx(SelectField, { label: "Tipo de cuenta", value: tipo, onChange: (e) => {
                                const t = e.target.value;
                                setTipo(t);
                                if (!ENTIDADES.some((x) => x.nombre === nombre))
                                    setIcono(TIPOS_CUENTA.find((x) => x[0] === t)[2]);
                            }, children: TIPOS_CUENTA.map(([t, n, i]) => (_jsxs("option", { value: t, children: [i, " ", n] }, t))) }), _jsx(TileButton, { icon: _jsx(Emoji, { children: icono }), title: "Icono", detail: verIcono ? 'Ocultar' : 'Cambiar', onClick: () => setVerIcono((v) => !v) }), verIcono && _jsx(SelectorIcono, { valor: icono, onCambio: setIcono })] }), _jsx(Button, { className: "w-full", onClick: guardar, disabled: !nombre.trim(), children: "Guardar" }), cuenta && (_jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx(Button, { variant: "secondary", className: usada ? 'col-span-2' : undefined, onClick: async () => {
                                await db.cuentas.update(cuenta.id, { archivada: !cuenta.archivada });
                                onCerrar();
                            }, children: cuenta.archivada ? 'Desarchivar' : 'Archivar' }), !usada && (_jsx(Button, { variant: "danger", onClick: async () => {
                                await db.cuentas.delete(cuenta.id);
                                avisar('Cuenta eliminada');
                                onCerrar();
                            }, children: "Eliminar" }))] })), usada && _jsx("p", { className: "px-3 text-[13px] text-muted", children: "Esta cuenta tiene movimientos: puedes archivarla para ocultarla, pero no eliminarla." })] }) }));
}
