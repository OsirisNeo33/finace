import { addDays, parseISO, startOfWeek } from 'date-fns';
import type { Movimiento, Presupuesto, Cuenta, Recurrente } from './tipos';
import { aISO, periodoDe } from './fechas';
import { resumen } from './calculos';

// ---------- Niveles ----------

export const NOMBRES_NIVEL = ['Novato', 'Aprendiz', 'Organizado', 'Constante', 'Estratega', 'Experto', 'Maestro del ahorro', 'Gurú financiero', 'Leyenda'];

/** XP total necesario para empezar el nivel n (n ≥ 1): 0, 100, 300, 600, 1000… */
export const xpInicioNivel = (n: number) => 50 * (n - 1) * n;

export function nivelDe(xp: number) {
  let n = 1;
  while (xpInicioNivel(n + 1) <= xp) n++;
  const desde = xpInicioNivel(n);
  const hasta = xpInicioNivel(n + 1);
  return { nivel: n, nombre: NOMBRES_NIVEL[Math.min(n - 1, NOMBRES_NIVEL.length - 1)], xpEnNivel: xp - desde, xpParaSubir: hasta - desde, progreso: (xp - desde) / (hasta - desde) };
}

// ---------- Rachas ----------

const diaAnterior = (d: string) => aISO(addDays(parseISO(d), -1));

export function rachaActual(dias: Set<string>, hoy: string) {
  let d = dias.has(hoy) ? hoy : diaAnterior(hoy);
  let n = 0;
  while (dias.has(d)) {
    n++;
    d = diaAnterior(d);
  }
  return n;
}

export function rachaMaxima(dias: Set<string>) {
  let max = 0;
  for (const d of dias) {
    if (dias.has(diaAnterior(d))) continue; // solo empezar en el primer día de cada racha
    let n = 0;
    let x = d;
    while (dias.has(x)) {
      n++;
      x = aISO(addDays(parseISO(x), 1));
    }
    max = Math.max(max, n);
  }
  return max;
}

// ---------- Datos de entrada ----------

export interface DatosJuego {
  movimientos: Movimiento[];
  presupuestos: Presupuesto[];
  cuentas: Cuenta[];
  recurrentes: Recurrente[];
  diaInicioMes: number;
  hoy: string; // yyyy-mm-dd
  copias: number; // copias de seguridad hechas
}

interface Contexto extends DatosJuego {
  manuales: Movimiento[];
  dias: Set<string>; // días en los que apuntaste algo
  racha: number;
  rachaMax: number;
  mesesPasados: { gastos: number; ingresos: number }[];
  diasSinGasto: number; // días ya pasados sin ningún gasto desde que usas la app
  primerDia?: string;
}

// ---------- Logros ----------

export interface DefLogro {
  id: string;
  icono: string;
  nombre: string;
  descripcion: string;
  xp: number;
  meta: number;
  valor: (c: Contexto) => number;
}

const mesesBajoPresupuesto = (c: Contexto) => {
  const global = c.presupuestos.find((p) => p.categoriaId === null);
  return global ? c.mesesPasados.filter((m) => m.gastos > 0 && m.gastos <= global.importe).length : 0;
};
const mesesAhorrando = (c: Contexto) => c.mesesPasados.filter((m) => m.ingresos > 0 && (m.ingresos - m.gastos) / m.ingresos >= 0.2).length;

export const LOGROS: DefLogro[] = [
  { id: 'primer-paso', icono: '👣', nombre: 'Primer paso', descripcion: 'Apunta tu primer movimiento', xp: 20, meta: 1, valor: (c) => c.manuales.length },
  { id: 'racha-3', icono: '🔥', nombre: 'Calentando motores', descripcion: '3 días seguidos apuntando', xp: 30, meta: 3, valor: (c) => c.rachaMax },
  { id: 'racha-7', icono: '📅', nombre: 'Semana perfecta', descripcion: '7 días seguidos apuntando', xp: 70, meta: 7, valor: (c) => c.rachaMax },
  { id: 'racha-30', icono: '🏅', nombre: 'Mes de hierro', descripcion: '30 días seguidos apuntando', xp: 300, meta: 30, valor: (c) => c.rachaMax },
  { id: 'racha-100', icono: '👑', nombre: 'Leyenda', descripcion: '100 días seguidos apuntando', xp: 1000, meta: 100, valor: (c) => c.rachaMax },
  { id: 'mov-50', icono: '✍️', nombre: 'Buen registro', descripcion: 'Apunta 50 movimientos', xp: 50, meta: 50, valor: (c) => c.manuales.length },
  { id: 'mov-250', icono: '📚', nombre: 'Contable experto', descripcion: 'Apunta 250 movimientos', xp: 200, meta: 250, valor: (c) => c.manuales.length },
  { id: 'banquero', icono: '🏦', nombre: 'Todo bajo control', descripcion: 'Añade 3 cuentas o bancos', xp: 30, meta: 3, valor: (c) => c.cuentas.filter((x) => !x.archivada).length },
  { id: 'planificador', icono: '🎯', nombre: 'Planificador', descripcion: 'Crea tu primer presupuesto', xp: 40, meta: 1, valor: (c) => c.presupuestos.length },
  { id: 'pagos', icono: '🗓️', nombre: 'Sin sorpresas', descripcion: 'Añade 3 pagos fijos o suscripciones', xp: 40, meta: 3, valor: (c) => c.recurrentes.length },
  { id: 'etiquetas', icono: '🏷️', nombre: 'Detallista', descripcion: 'Usa #etiquetas en 5 movimientos', xp: 30, meta: 5, valor: (c) => c.manuales.filter((m) => m.etiquetas.length > 0).length },
  { id: 'sin-gasto-1', icono: '🧘', nombre: 'Día zen', descripcion: 'Pasa un día entero sin gastar', xp: 30, meta: 1, valor: (c) => c.diasSinGasto },
  { id: 'sin-gasto-10', icono: '🌿', nombre: 'Monje del ahorro', descripcion: '10 días sin gastar', xp: 120, meta: 10, valor: (c) => c.diasSinGasto },
  { id: 'presupuesto-mes', icono: '🛡️', nombre: 'Dentro del límite', descripcion: 'Cierra un mes sin pasarte del presupuesto total', xp: 150, meta: 1, valor: mesesBajoPresupuesto },
  { id: 'ahorro-1', icono: '🐷', nombre: 'Ahorrador', descripcion: 'Ahorra el 20 % de tus ingresos en un mes', xp: 150, meta: 1, valor: mesesAhorrando },
  { id: 'ahorro-3', icono: '💎', nombre: 'Hábito de ahorro', descripcion: 'Ahorra el 20 % en 3 meses distintos', xp: 400, meta: 3, valor: mesesAhorrando },
  { id: 'copia', icono: '💾', nombre: 'Previsor', descripcion: 'Haz una copia de seguridad', xp: 30, meta: 1, valor: (c) => c.copias },
];

// ---------- Retos semanales ----------

export interface Reto {
  id: string;
  icono: string;
  nombre: string;
  actual: number;
  meta: number;
  completado: boolean;
  xp: number;
}

const XP_RETO = 50;

function retosDeSemana(c: Contexto, lunes: string, hasta: string): Reto[] {
  const dias: string[] = [];
  for (let d = lunes; d <= hasta && dias.length < 7; d = aISO(addDays(parseISO(d), 1))) dias.push(d);
  const conGasto = new Set(c.movimientos.filter((m) => m.tipo === 'gasto' && m.fecha >= lunes && m.fecha <= hasta).map((m) => m.fecha));
  const apuntados = dias.filter((d) => c.dias.has(d)).length;
  const sinGasto = c.primerDia ? dias.filter((d) => !conGasto.has(d) && d < c.hoy && d >= c.primerDia!).length : 0;
  const mk = (id: string, icono: string, nombre: string, actual: number, meta: number): Reto => ({ id, icono, nombre, actual: Math.min(actual, meta), meta, completado: actual >= meta, xp: XP_RETO });
  return [mk('apuntar-5', '✍️', 'Apunta tus gastos 5 días esta semana', apuntados, 5), mk('sin-gasto-2', '🧘', 'Consigue 2 días sin gastar', sinGasto, 2)];
}

// ---------- Evaluación completa ----------

export function evaluarJuego(d: DatosJuego) {
  const manuales = d.movimientos.filter((m) => !m.recurrenteId);
  const dias = new Set(manuales.map((m) => aISO(new Date(m.creadoEn))));
  const primerDia = [...dias].sort()[0];

  // Meses ya cerrados desde que empezaste
  const mesesPasados: Contexto['mesesPasados'] = [];
  if (primerDia) {
    for (let k = -1; k > -120; k--) {
      const p = periodoDe(parseISO(d.hoy), d.diaInicioMes, k);
      if (p.fin < primerDia) break;
      const r = resumen(d.movimientos.filter((m) => m.fecha >= p.inicio && m.fecha <= p.fin));
      mesesPasados.push({ gastos: r.gastos, ingresos: r.ingresos });
    }
  }

  // Días pasados sin gastos (desde el primer día de uso hasta ayer)
  let diasSinGasto = 0;
  if (primerDia) {
    const conGasto = new Set(d.movimientos.filter((m) => m.tipo === 'gasto').map((m) => m.fecha));
    for (let x = primerDia; x < d.hoy; x = aISO(addDays(parseISO(x), 1))) if (!conGasto.has(x)) diasSinGasto++;
  }

  const c: Contexto = { ...d, manuales, dias, racha: rachaActual(dias, d.hoy), rachaMax: rachaMaxima(dias), mesesPasados, diasSinGasto, primerDia };

  const logros = LOGROS.map((l) => {
    const actual = l.valor(c);
    return { ...l, actual: Math.min(actual, l.meta), desbloqueado: actual >= l.meta };
  });

  // Retos: semana actual + XP de semanas anteriores completadas
  const lunesActual = aISO(startOfWeek(parseISO(d.hoy), { weekStartsOn: 1 }));
  const retos = retosDeSemana(c, lunesActual, aISO(addDays(parseISO(lunesActual), 6)));
  let retosPasados = 0;
  if (primerDia) {
    for (let lunes = aISO(startOfWeek(parseISO(primerDia), { weekStartsOn: 1 })); lunes < lunesActual; lunes = aISO(addDays(parseISO(lunes), 7))) {
      retosPasados += retosDeSemana(c, lunes, aISO(addDays(parseISO(lunes), 6))).filter((r) => r.completado).length;
    }
  }

  const xp =
    manuales.length * 5 + // cada movimiento apuntado
    dias.size * 10 + // cada día que apuntas algo
    logros.filter((l) => l.desbloqueado).reduce((s, l) => s + l.xp, 0) +
    (retosPasados + retos.filter((r) => r.completado).length) * XP_RETO;

  return { xp, ...nivelDe(xp), racha: c.racha, rachaMax: c.rachaMax, logros, retos, retosCompletados: retosPasados + retos.filter((r) => r.completado).length };
}

export type Juego = ReturnType<typeof evaluarJuego>;
