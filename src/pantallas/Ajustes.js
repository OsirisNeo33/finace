import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useDatos } from '../contexto';
import { IconoCompartir, IconoDescargar, IconoDiana, IconoEdificio, IconoEtiqueta, IconoMovil, IconoRepetir, IconoTrofeo } from '../components/Iconos';
import { Button, IconBadge, Page, PageHeader, Panel, Segmented, SelectField, Tile, TileButton } from '../components/ui';
import { guardarAjustes, exportarCSV, exportarJSON, importarJSON, borrarTodo, descargar } from '../db/acciones';
import { hoyISO } from '../domain/fechas';
import { Cuentas } from './ajustes/Cuentas';
import { Categorias } from './ajustes/Categorias';
import { Presupuestos } from './ajustes/Presupuestos';
import { Recurrentes } from './ajustes/Recurrentes';
export const MONEDAS = [
    ['EUR', 'Euro (€)'],
    ['USD', 'Dólar estadounidense ($)'],
    ['MXN', 'Peso mexicano ($)'],
    ['COP', 'Peso colombiano ($)'],
    ['ARS', 'Peso argentino ($)'],
    ['CLP', 'Peso chileno ($)'],
    ['PEN', 'Sol peruano (S/)'],
    ['GBP', 'Libra esterlina (£)'],
    ['CHF', 'Franco suizo'],
];
export function Ajustes({ irA, onVolver }) {
    const [sub, setSub] = useState(null);
    const { ajustes, cuentas, categorias, avisar } = useDatos();
    const archivo = useRef(null);
    const [instalar, setInstalar] = useState(null);
    useEffect(() => {
        const f = (e) => {
            e.preventDefault();
            setInstalar(e);
        };
        window.addEventListener('beforeinstallprompt', f);
        return () => window.removeEventListener('beforeinstallprompt', f);
    }, []);
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [sub]);
    if (sub) {
        const titulos = { cuentas: 'Cuentas', categorias: 'Categorías', presupuestos: 'Presupuestos', recurrentes: 'Recurrentes' };
        const subtitulos = { cuentas: 'Tus bancos, efectivo y tarjetas', categorias: 'Cómo agrupas tus gastos e ingresos', presupuestos: 'Límites mensuales de gasto', recurrentes: 'Nómina, alquiler, suscripciones…' };
        return (_jsxs(_Fragment, { children: [_jsx(PageHeader, { title: titulos[sub], subtitle: subtitulos[sub], back: { label: 'Ajustes', onClick: () => setSub(null) } }), _jsxs(Page, { children: [sub === 'cuentas' && _jsx(Cuentas, {}), sub === 'categorias' && _jsx(Categorias, {}), sub === 'presupuestos' && _jsx(Presupuestos, {}), sub === 'recurrentes' && _jsx(Recurrentes, {})] })] }));
    }
    async function restaurar(f) {
        try {
            const copia = JSON.parse(await f.text());
            if (!confirm('Esto sustituirá TODOS tus datos actuales por los de la copia. ¿Continuar?'))
                return;
            await importarJSON(copia);
            avisar('Copia restaurada');
        }
        catch (e) {
            alert(e instanceof Error ? e.message : 'No se pudo leer el archivo.');
        }
    }
    const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const instalada = window.matchMedia('(display-mode: standalone)').matches || 'Capacitor' in window;
    return (_jsxs(_Fragment, { children: [_jsx(PageHeader, { title: "Ajustes", subtitle: "Organizaci\u00F3n, preferencias y tus datos", back: { label: 'Volver', onClick: onVolver } }), _jsxs(Page, { children: [_jsxs(Panel, { title: "Organizaci\u00F3n", children: [_jsx(TileButton, { icon: _jsx(IconBadge, { tone: "warning", children: _jsx(IconoTrofeo, { width: 20, height: 20 }) }), title: "Logros y nivel", chevron: true, onClick: () => irA('logros') }), _jsx(TileButton, { icon: _jsx(IconBadge, { children: _jsx(IconoEdificio, { width: 20, height: 20 }) }), title: "Cuentas", detail: _jsx("span", { className: "num", children: cuentas.length }), chevron: true, onClick: () => setSub('cuentas') }), _jsx(TileButton, { icon: _jsx(IconBadge, { children: _jsx(IconoEtiqueta, { width: 20, height: 20 }) }), title: "Categor\u00EDas", detail: _jsx("span", { className: "num", children: categorias.length }), chevron: true, onClick: () => setSub('categorias') }), _jsx(TileButton, { icon: _jsx(IconBadge, { tone: "success", children: _jsx(IconoDiana, { width: 20, height: 20 }) }), title: "Presupuestos", chevron: true, onClick: () => setSub('presupuestos') }), _jsx(TileButton, { icon: _jsx(IconBadge, { tone: "dark", children: _jsx(IconoRepetir, { width: 20, height: 20 }) }), title: "Recurrentes", subtitle: "N\u00F3mina, alquiler, suscripciones\u2026", chevron: true, onClick: () => setSub('recurrentes') })] }), _jsxs(Panel, { title: "Preferencias", children: [_jsx(SelectField, { label: "Moneda", value: ajustes.moneda, onChange: (e) => guardarAjustes({ moneda: e.target.value }), children: MONEDAS.map(([c, n]) => (_jsx("option", { value: c, children: n }, c))) }), _jsx(SelectField, { label: "El mes empieza el d\u00EDa", hint: "\u00DAtil si cobras, por ejemplo, el d\u00EDa 25.", value: ajustes.diaInicioMes, onChange: (e) => guardarAjustes({ diaInicioMes: Number(e.target.value) }), children: Array.from({ length: 28 }, (_, i) => (_jsx("option", { value: i + 1, children: i + 1 }, i + 1))) }), _jsxs(Tile, { className: "flex-col items-stretch gap-2", children: [_jsx("span", { className: "text-[12px] font-medium text-muted", children: "Tema" }), _jsx(Segmented, { label: "Tema", value: ajustes.tema, onChange: (t) => guardarAjustes({ tema: t }), options: [
                                            { value: 'sistema', label: 'Sistema' },
                                            { value: 'claro', label: 'Claro' },
                                            { value: 'oscuro', label: 'Oscuro' },
                                        ] })] })] }), _jsxs(Panel, { title: "Tus datos", footer: "Todo se guarda solo en este dispositivo. Haz una copia de seguridad de vez en cuando (por ejemplo, a Google Drive o iCloud) para no perder nada si cambias de m\u00F3vil.", children: [_jsx(TileButton, { icon: _jsx(IconBadge, { tone: "success", children: _jsx(IconoDescargar, { width: 20, height: 20 }) }), title: "Exportar a Excel (CSV)", chevron: true, onClick: async () => descargar(`finace-${hoyISO()}.csv`, await exportarCSV(), 'text/csv;charset=utf-8').catch(() => { }) }), _jsx(TileButton, { icon: _jsx(IconBadge, { children: _jsx(IconoCompartir, { width: 20, height: 20 }) }), title: "Crear copia de seguridad", detail: ajustes.copias ? _jsxs("span", { className: "num", children: [ajustes.copias, " hechas"] }) : undefined, chevron: true, onClick: async () => {
                                    try {
                                        await descargar(`finace-copia-${hoyISO()}.json`, JSON.stringify(await exportarJSON()), 'application/json');
                                        await guardarAjustes({ copias: (ajustes.copias ?? 0) + 1 });
                                        avisar('Copia creada');
                                    }
                                    catch {
                                        /* el usuario cerró el menú Compartir */
                                    }
                                } }), _jsx(TileButton, { icon: _jsx(IconBadge, { tone: "dark", children: _jsx(IconoRepetir, { width: 20, height: 20 }) }), title: "Restaurar copia de seguridad", chevron: true, onClick: () => archivo.current?.click() }), _jsx("input", { ref: archivo, type: "file", accept: "application/json,.json", className: "hidden", onChange: (e) => e.target.files?.[0] && restaurar(e.target.files[0]).finally(() => (e.target.value = '')) })] }), !instalada && (_jsx(Panel, { title: "Instalar en el m\u00F3vil", children: instalar ? (_jsx(Button, { className: "w-full", onClick: () => instalar.prompt().then(() => setInstalar(null)), children: "Instalar Finace" })) : (_jsxs(Tile, { className: "items-start", children: [_jsx(IconBadge, { tone: "dark", children: _jsx(IconoMovil, { width: 20, height: 20 }) }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block text-[15px] font-medium", children: esIOS ? 'Añadir a la pantalla de inicio' : 'Instalar la aplicación' }), _jsx("span", { className: "block text-[13px] text-muted", children: esIOS ? 'En Safari, toca Compartir y luego «Añadir a pantalla de inicio». Funcionará sin conexión.' : 'En Chrome, abre el menú ⋮ y elige «Instalar aplicación».' })] })] })) })), _jsx(Button, { variant: "danger", className: "w-full", onClick: async () => {
                            if (!confirm('¿Seguro que quieres borrar TODOS tus datos? No se puede deshacer.'))
                                return;
                            if (!confirm('Última confirmación: se borrarán cuentas, categorías y movimientos.'))
                                return;
                            await borrarTodo();
                        }, children: "Borrar todos los datos" }), _jsx("p", { className: "pt-2 text-center text-[12px] text-muted", children: "Finace \u00B7 sin anuncios, sin cuentas, tus datos en tu dispositivo" })] })] }));
}
