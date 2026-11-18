import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useDatos } from '../contexto';
import { evaluarJuego } from '../domain/logros';
import { hoyISO } from '../domain/fechas';

export function usarJuego() {
  const { movimientos, todasCuentas, ajustes } = useDatos();
  const presupuestos = useLiveQuery(() => db.presupuestos.toArray(), [], []);
  const recurrentes = useLiveQuery(() => db.recurrentes.toArray(), [], []);
  const hoy = hoyISO();
  return useMemo(
    () => evaluarJuego({ movimientos, presupuestos, recurrentes, cuentas: todasCuentas, diaInicioMes: ajustes.diaInicioMes, hoy, copias: ajustes.copias ?? 0 }),
    [movimientos, presupuestos, recurrentes, todasCuentas, ajustes.diaInicioMes, ajustes.copias, hoy],
  );
}
