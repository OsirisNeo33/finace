import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, AJUSTES_POR_DEFECTO } from './db/db';
import { formatear } from './domain/dinero';
const Ctx = createContext(null);
export function ProveedorDatos({ children }) {
    const ajustesDb = useLiveQuery(() => db.ajustes.get('ajustes'), [], null);
    const todasCuentas = useLiveQuery(() => db.cuentas.orderBy('orden').toArray(), []);
    const todasCategorias = useLiveQuery(() => db.categorias.orderBy('orden').toArray(), []);
    const movimientos = useLiveQuery(() => db.movimientos.toArray(), []);
    const [editor, setEditor] = useState({ abierto: false });
    const [aviso, setAviso] = useState(null);
    const temporizador = useRef(undefined);
    const avisar = useCallback((texto, accion) => {
        window.clearTimeout(temporizador.current);
        setAviso({ id: Date.now(), texto, accion });
        temporizador.current = window.setTimeout(() => setAviso(null), accion ? 5000 : 2500);
    }, []);
    const ajustes = ajustesDb ?? AJUSTES_POR_DEFECTO;
    const valor = useMemo(() => {
        const tc = todasCuentas ?? [];
        const tcat = todasCategorias ?? [];
        return {
            cargando: ajustesDb === null || !todasCuentas || !todasCategorias || !movimientos,
            ajustes,
            todasCuentas: tc,
            cuentas: tc.filter((c) => !c.archivada),
            categorias: tcat.filter((c) => !c.archivada),
            categoriaPorId: new Map(tcat.map((c) => [c.id, c])),
            cuentaPorId: new Map(tc.map((c) => [c.id, c])),
            movimientos: movimientos ?? [],
            dinero: (c, o) => formatear(c, ajustes.moneda, o),
            editor,
            abrirEditor: (m) => setEditor({ abierto: true, inicial: m }),
            cerrarEditor: () => setEditor({ abierto: false }),
            avisar,
            aviso,
        };
    }, [ajustesDb, ajustes, todasCuentas, todasCategorias, movimientos, editor, aviso, avisar]);
    return _jsx(Ctx.Provider, { value: valor, children: children });
}
export function useDatos() {
    const v = useContext(Ctx);
    if (!v)
        throw new Error('useDatos fuera del proveedor');
    return v;
}
