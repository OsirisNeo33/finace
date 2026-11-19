import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavegar, BotonAjustes } from '../navegacion';
import { Card, Chip, Cifra, IconBadge, Label, Page, PageHeader, Panel, PanelLink, ProgressBar, Segmented, Tile, cx } from '../components/ui';
import { IconoAlerta, IconoEscudo, IconoMoneda, IconoTarjeta, IconoTendencia } from '../components/Iconos';
import { useDatos } from '../contexto';
import { ESTADOS, NIVELES, usarFinanzas } from './usarFinanzas';
import { porPersona } from '../domain/cobros';
import { Deudas } from './finanzas/Deudas';
import { Inversiones } from './finanzas/Inversiones';
import { MeDeben } from './finanzas/MeDeben';
const ICONOS = {
    ahorro: _jsx(IconoMoneda, { width: 20, height: 20 }),
    colchon: _jsx(IconoEscudo, { width: 20, height: 20 }),
    deuda: _jsx(IconoTarjeta, { width: 20, height: 20 }),
    caras: _jsx(IconoAlerta, { width: 20, height: 20 }),
    inversion: _jsx(IconoTendencia, { width: 20, height: 20 }),
};
export function Finanzas({ vista, setVista }) {
    return (_jsxs(_Fragment, { children: [_jsx(PageHeader, { title: "Mis finanzas", subtitle: "Tu salud financiera, patrimonio, deudas e inversiones", action: _jsx(BotonAjustes, {}) }), _jsxs(Page, { children: [_jsx(Segmented, { label: "Vista", value: vista, onChange: setVista, options: [
                            { value: 'resumen', label: 'Resumen' },
                            { value: 'deudas', label: 'Deudas' },
                            { value: 'cobros', label: 'Me deben' },
                            {
                                value: 'inversiones',
                                label: (_jsxs(_Fragment, { children: [_jsx("span", { className: "min-[400px]:hidden", children: "Inversi\u00F3n" }), _jsx("span", { className: "hidden min-[400px]:inline", children: "Inversiones" })] })),
                            },
                        ] }), vista === 'resumen' && _jsx(Resumen, { setVista: setVista }), vista === 'deudas' && _jsx(Deudas, {}), vista === 'cobros' && _jsx(MeDeben, {}), vista === 'inversiones' && _jsx(Inversiones, {})] })] }));
}
/** Tarjeta de la puntuación (también se usa en Hoy). */
export function TarjetaSalud({ onClick, compacta }) {
    const { salud } = usarFinanzas();
    const nivel = salud.nivel ? NIVELES[salud.nivel] : null;
    const contenido = (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "min-w-0", children: [_jsx(Label, { children: "Salud financiera" }), _jsxs("p", { className: "mt-1 flex items-baseline gap-1", children: [_jsx("span", { className: "num text-[34px] leading-none font-semibold", "data-testid": "salud", children: salud.puntos ?? '—' }), _jsx("span", { className: "num text-[15px] text-muted", children: "/100" })] })] }), nivel ? _jsx(Chip, { tone: nivel.tono, children: nivel.texto }) : _jsx(Chip, { children: "Faltan datos" })] }), _jsx("div", { className: "mt-3", children: _jsx(ProgressBar, { value: (salud.puntos ?? 0) / 100, tone: nivel?.tono === 'danger' ? 'danger' : nivel?.tono === 'warning' ? 'warning' : nivel?.tono === 'success' ? 'success' : 'brand' }) }), compacta ? (_jsxs("p", { className: "mt-3 text-[14px]", children: [_jsx("span", { className: "font-medium", children: salud.consejos[0].titulo }), _jsx("span", { className: "text-muted", children: " \u00B7 Ver consejos \u203A" })] })) : (_jsx("p", { className: "mt-2 text-[13px] text-muted", children: "Calculada con tus \u00FAltimos 3 meses, tus cuentas, deudas e inversiones." }))] }));
    if (!onClick)
        return _jsx(Card, { children: contenido });
    return (_jsx("button", { type: "button", className: "block w-full rounded-[26px] border border-border bg-surface p-5 text-left shadow-[0_1px_2px_rgba(16,24,40,0.04)] tarjeta-tactil", onClick: onClick, children: contenido }));
}
const TEXTO_DESTINO = { deudas: 'Ver deudas', cobros: 'Ver quién te debe', inversiones: 'Ver inversiones', contabilidad: 'Ir a Contabilidad', movimientos: 'Ver movimientos' };
function Resumen({ setVista }) {
    const { dinero } = useDatos();
    const ir = useNavegar();
    const { salud } = usarFinanzas();
    const c = salud.cifras;
    const irA = (d) => (d === 'deudas' || d === 'inversiones' || d === 'cobros' ? setVista(d) : ir(d === 'contabilidad' ? 'pagos' : 'movimientos'));
    return (_jsxs(_Fragment, { children: [_jsxs(Card, { dark: true, children: [_jsx("p", { className: "text-[13px] text-white/60", children: "Patrimonio neto" }), _jsx(Cifra, { max: 34, className: "mt-1", "data-testid": "patrimonio", children: dinero(c.patrimonio) }), _jsxs("div", { className: "mt-4 space-y-2 border-t border-white/10 pt-4 text-[14px]", children: [_jsx(Linea, { texto: "Dinero en cuentas", valor: dinero(c.cuentasTotal) }), _jsx(Linea, { texto: "Inversiones", valor: dinero(c.inversiones), onClick: () => setVista('inversiones') }), c.teDeben > 0 && _jsx(Linea, { texto: "Te deben", valor: dinero(c.teDeben), onClick: () => setVista('cobros') }), _jsx(Linea, { texto: "Deudas", valor: dinero(-c.deudaTotal), onClick: () => setVista('deudas') })] })] }), _jsx(TarjetaSalud, {}), _jsx(Panel, { title: "Indicadores", children: salud.indicadores.map((i) => {
                    const e = ESTADOS[i.estado];
                    return (_jsxs(Tile, { className: "items-start", children: [_jsx(IconBadge, { tone: e.badge, children: ICONOS[i.id] }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsxs("span", { className: "flex flex-wrap items-baseline justify-between gap-x-2", children: [_jsx("span", { className: "text-[15px] font-medium", children: i.nombre }), _jsx("span", { className: "num ml-auto text-[15px] font-semibold", children: i.valor })] }), _jsxs("span", { className: "mt-0.5 flex items-start justify-between gap-2", children: [_jsx("span", { className: "text-[13px] leading-snug text-muted", children: i.detalle }), _jsx(Chip, { tone: e.tono, className: "shrink-0", children: e.texto })] })] })] }, i.id));
                }) }), _jsx(Panel, { title: "Qu\u00E9 te recomiendo", detail: `${salud.consejos.length} ${salud.consejos.length === 1 ? 'consejo' : 'consejos'}`, footer: "Orientaci\u00F3n general calculada con tus datos. No sustituye el asesoramiento personalizado de un profesional financiero.", children: salud.consejos.map((k, n) => (_jsxs(Tile, { className: "items-start", "data-consejo": k.id, children: [_jsx("span", { className: cx('num flex size-9 shrink-0 items-center justify-center rounded-xl text-[15px] font-semibold', n === 0 ? 'bg-brand text-on-brand' : 'bg-brand-soft text-brand'), children: n + 1 }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block text-[15px] font-semibold", children: k.titulo }), _jsx("span", { className: "mt-0.5 block text-[14px] leading-snug text-muted", children: k.texto }), k.destino && (_jsx("span", { className: "mt-1 block", children: _jsxs(PanelLink, { onClick: () => irA(k.destino), children: [TEXTO_DESTINO[k.destino], " \u203A"] }) }))] })] }, k.id))) })] }));
}
function Linea({ texto, valor, onClick }) {
    const dentro = (_jsxs(_Fragment, { children: [_jsx("span", { className: "text-white/70", children: texto }), _jsx("span", { className: "num font-semibold", children: valor })] }));
    return onClick ? (_jsx("button", { type: "button", className: "-my-1.5 flex min-h-10 w-full items-center justify-between gap-3 text-left", onClick: onClick, children: dentro })) : (_jsx("div", { className: "flex items-center justify-between gap-3", children: dentro }));
}
/** Aviso en Hoy de lo que te deben otras personas. */
export function TarjetaTeDeben({ onClick }) {
    const { dinero, movimientos } = useDatos();
    const { cobros, salud } = usarFinanzas();
    const n = porPersona(cobros, movimientos).length;
    if (salud.cifras.teDeben <= 0)
        return null;
    return (_jsxs("button", { type: "button", className: "flex min-h-14 w-full items-center gap-3 rounded-[26px] border border-border bg-surface px-5 py-4 text-left shadow-[0_1px_2px_rgba(16,24,40,0.04)] tarjeta-tactil", onClick: onClick, children: [_jsx("span", { className: "flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-[18px]", children: "\uD83E\uDD1D" }), _jsxs("span", { className: "min-w-0 flex-1", children: [_jsx("span", { className: "block text-[13px] text-muted", children: "Te deben" }), _jsx("span", { className: "num block text-[17px] font-semibold", children: dinero(salud.cifras.teDeben) })] }), _jsxs("span", { className: "shrink-0 text-[13px] font-medium text-brand", children: [n === 1 ? '1 persona' : `${n} personas`, " \u203A"] })] }));
}
