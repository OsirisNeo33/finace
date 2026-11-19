import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDatos } from '../contexto';
import { db } from '../db/db';
import { evaluarSalud } from '../domain/salud';

/** Datos de Finanzas (deudas, inversiones) y la salud financiera calculada al momento. */
export function usarFinanzas() {
  const { movimientos, todasCuentas, categoriaPorId, dinero, ajustes } = useDatos();
  const deudas = useLiveQuery(() => db.deudas.toArray(), [], []);
  const inversiones = useLiveQuery(() => db.inversiones.toArray(), [], []);
  const recurrentes = useLiveQuery(() => db.recurrentes.toArray(), [], []);
  const salud = useMemo(
    () =>
      evaluarSalud({
        movimientos,
        cuentas: todasCuentas,
        deudas,
        inversiones,
        recurrentes,
        diaInicioMes: ajustes.diaInicioMes,
        hoy: new Date(),
        dinero: (c) => dinero(c),
        nombreCategoria: (id) => categoriaPorId.get(id)?.nombre ?? 'otros',
      }),
    [movimientos, todasCuentas, deudas, inversiones, recurrentes, ajustes.diaInicioMes, dinero, categoriaPorId],
  );
  return { deudas, inversiones, recurrentes, salud };
}

export const NIVELES = {
  excelente: { texto: 'Excelente', tono: 'success' },
  buena: { texto: 'Buena', tono: 'brand' },
  mejorable: { texto: 'Mejorable', tono: 'warning' },
  delicada: { texto: 'Delicada', tono: 'danger' },
} as const;

export const ESTADOS = {
  bien: { texto: 'Bien', tono: 'success', badge: 'success' },
  mejorable: { texto: 'Mejorable', tono: 'warning', badge: 'warning' },
  atencion: { texto: 'Atención', tono: 'danger', badge: 'danger' },
  'sin-datos': { texto: 'Sin datos', tono: 'neutral', badge: 'dark' },
} as const;
