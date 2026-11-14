import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, AJUSTES_POR_DEFECTO } from './db/db';
import type { Ajustes, Categoria, Cuenta, Movimiento } from './domain/tipos';
import { formatear } from './domain/dinero';

export interface Aviso {
  id: number;
  texto: string;
  accion?: { etiqueta: string; hacer: () => void };
}

interface Datos {
  cargando: boolean;
  ajustes: Ajustes;
  cuentas: Cuenta[]; // no archivadas, ordenadas
  todasCuentas: Cuenta[];
  categorias: Categoria[]; // no archivadas
  categoriaPorId: Map<string, Categoria>;
  cuentaPorId: Map<string, Cuenta>;
  movimientos: Movimiento[];
  dinero: (centimos: number, opciones?: { signo?: boolean; sinDecimales?: boolean }) => string;
  abrirEditor: (m?: Movimiento | Partial<Movimiento>) => void;
  editor: { abierto: boolean; inicial?: Movimiento | Partial<Movimiento> };
  cerrarEditor: () => void;
  avisar: (texto: string, accion?: Aviso['accion']) => void;
  aviso: Aviso | null;
}

const Ctx = createContext<Datos | null>(null);

export function ProveedorDatos({ children }: { children: ReactNode }) {
  const ajustesDb = useLiveQuery(() => db.ajustes.get('ajustes'), [], null);
  const todasCuentas = useLiveQuery(() => db.cuentas.orderBy('orden').toArray(), []);
  const todasCategorias = useLiveQuery(() => db.categorias.orderBy('orden').toArray(), []);
  const movimientos = useLiveQuery(() => db.movimientos.toArray(), []);

  const [editor, setEditor] = useState<Datos['editor']>({ abierto: false });
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const temporizador = useRef<number | undefined>(undefined);

  const avisar = useCallback((texto: string, accion?: Aviso['accion']) => {
    window.clearTimeout(temporizador.current);
    setAviso({ id: Date.now(), texto, accion });
    temporizador.current = window.setTimeout(() => setAviso(null), accion ? 5000 : 2500);
  }, []);

  const ajustes = ajustesDb ?? AJUSTES_POR_DEFECTO;
  const valor = useMemo<Datos>(() => {
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

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useDatos() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDatos fuera del proveedor');
  return v;
}
