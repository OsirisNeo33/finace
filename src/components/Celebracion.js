import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useDatos } from '../contexto';
import { usarJuego } from '../pantallas/usarJuego';
import { guardarAjustes } from '../db/acciones';
import { Button, Chip } from './ui';
/** Muestra una celebración cuando desbloqueas una insignia o subes de nivel. */
export function Celebracion({ onVerLogros }) {
    const { ajustes } = useDatos();
    const j = usarJuego();
    const [cerrado, setCerrado] = useState('');
    const conseguidos = useMemo(() => j.logros.filter((l) => l.desbloqueado).map((l) => l.id), [j.logros]);
    // Primera vez tras la actualización: registrar lo ya conseguido sin celebrarlo todo de golpe
    useEffect(() => {
        if (ajustes.configurado && ajustes.logrosVistos === undefined)
            guardarAjustes({ logrosVistos: conseguidos, nivelVisto: j.nivel });
    }, [ajustes.configurado, ajustes.logrosVistos, conseguidos, j.nivel]);
    if (!ajustes.logrosVistos)
        return null;
    const vistos = new Set(ajustes.logrosVistos);
    const nuevos = j.logros.filter((l) => l.desbloqueado && !vistos.has(l.id));
    const subeNivel = j.nivel > (ajustes.nivelVisto ?? 1);
    if (!nuevos.length && !subeNivel)
        return null;
    const premio = nuevos.length
        ? { icono: nuevos[0].icono, titulo: nuevos[0].nombre, texto: nuevos[0].descripcion, xp: nuevos[0].xp }
        : { icono: '⭐', titulo: `¡Nivel ${j.nivel}!`, texto: `Ahora eres «${j.nombre}». Sigue así.` };
    const clave = nuevos.length ? nuevos[0].id : `nivel-${j.nivel}`;
    if (cerrado === clave)
        return null;
    const cerrar = async () => {
        setCerrado(clave);
        await guardarAjustes(nuevos.length ? { logrosVistos: [...vistos, nuevos[0].id] } : { nivelVisto: j.nivel });
    };
    return (_jsxs("div", { className: "fixed inset-0 z-[60] flex items-center justify-center px-6", role: "dialog", "aria-modal": "true", "aria-label": "Logro desbloqueado", children: [_jsx("div", { className: "anim-aparecer absolute inset-0 bg-black/50", onClick: cerrar }), _jsx(Confeti, {}), _jsxs("div", { className: "anim-premio relative w-full max-w-xs rounded-[26px] border border-border bg-surface p-6 text-center shadow-[0_10px_30px_-12px_rgba(16,24,40,0.25)]", children: [_jsx(Chip, { tone: "brand", children: nuevos.length ? 'Insignia desbloqueada' : 'Subes de nivel' }), _jsx("div", { className: "mx-auto my-4 flex size-24 items-center justify-center rounded-full border border-border bg-brand-soft text-[52px] leading-none", children: premio.icono }), _jsx("h2", { className: "text-[20px] font-semibold tracking-tight", children: premio.titulo }), _jsx("p", { className: "mt-1 text-[14px] text-muted", children: premio.texto }), premio.xp !== undefined && (_jsxs(Chip, { tone: "success", className: "num mt-3 text-[14px]", children: ["+", premio.xp, " XP"] })), _jsxs("div", { className: "mt-5 flex flex-col gap-2", children: [_jsx(Button, { onClick: cerrar, children: "\u00A1Genial!" }), _jsx(Button, { variant: "secondary", onClick: async () => {
                                    await cerrar();
                                    onVerLogros();
                                }, children: "Ver mis logros" })] })] })] }));
}
function Confeti() {
    const piezas = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
        izq: Math.random() * 100,
        retraso: Math.random() * 0.6,
        dur: 1.6 + Math.random() * 1.2,
        emoji: ['🎉', '✨', '⭐', '💰', '🪙'][i % 5],
    })), []);
    return (_jsx("div", { className: "pointer-events-none absolute inset-0 overflow-hidden", "aria-hidden": "true", children: piezas.map((p, i) => (_jsx("span", { className: "anim-confeti absolute top-0 text-xl", style: { left: `${p.izq}%`, animationDelay: `${p.retraso}s`, animationDuration: `${p.dur}s` }, children: p.emoji }, i))) }));
}
