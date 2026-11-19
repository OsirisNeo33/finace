import { enPeriodo, resumen, saldosCuentas } from './calculos';
import { periodoDe } from './fechas';
import { resumenFijos } from './fijos';
import { TAE_CARA, deudasActivas, ordenAvalancha } from './deudas';
import { porPersona } from './cobros';
import { desdePeriodo, estadisticas } from './trading';
export const TIPOS_INVERSION = {
    fondo: { nombre: 'Fondo de inversión', icono: '📊' },
    etf: { nombre: 'ETF', icono: '🧺' },
    acciones: { nombre: 'Acciones', icono: '📈' },
    cripto: { nombre: 'Criptomonedas', icono: '🪙' },
    trading: { nombre: 'Cuenta de trading', icono: '🕯️' },
    pension: { nombre: 'Plan de pensiones', icono: '🧓' },
    deposito: { nombre: 'Depósito o cuenta remunerada', icono: '🏦' },
    inmueble: { nombre: 'Inmueble', icono: '🏘️' },
    otro: { nombre: 'Otra inversión', icono: '💼' },
};
const PESOS = { ahorro: 25, colchon: 25, deuda: 25, caras: 10, inversion: 15 };
const pct = (x) => `${Math.round(x * 100)} %`;
const num = (x, d = 1) => x.toLocaleString('es-ES', { maximumFractionDigits: d });
const estadoDe = (p) => (p === null ? 'sin-datos' : p >= 75 ? 'bien' : p >= 40 ? 'mejorable' : 'atencion');
const lineal = (x, cero, cien) => Math.round(Math.max(0, Math.min(1, (x - cero) / (cien - cero))) * 100);
/** Media mensual de ingresos y gastos con los 3 últimos meses completos (o el actual / los fijos si no hay historial). */
function mediasMensuales(d) {
    const fijos = resumenFijos(d.recurrentes);
    const periodos = [1, 2, 3].map((k) => periodoDe(d.hoy, d.diaInicioMes, -k));
    // Las devoluciones de dinero prestado no son ingresos «de verdad»: no cuentan para el ahorro
    const movs = d.movimientos.filter((m) => !m.cobroId);
    const historial = periodos.map((p) => movs.filter((m) => enPeriodo(m, p))).filter((ms) => ms.length > 0);
    let ingresos;
    let gastos;
    let variables;
    const actual = resumen(movs.filter((m) => enPeriodo(m, periodoDe(d.hoy, d.diaInicioMes, 0))));
    if (historial.length) {
        ingresos = Math.round(historial.reduce((s, ms) => s + resumen(ms).ingresos, 0) / historial.length);
        gastos = Math.round(historial.reduce((s, ms) => s + resumen(ms).gastos, 0) / historial.length);
        variables = historial.flat();
    }
    else {
        ingresos = actual.ingresos;
        gastos = Math.max(actual.gastos, fijos.gastos);
        variables = movs.filter((m) => enPeriodo(m, periodoDe(d.hoy, d.diaInicioMes, 0)));
    }
    // Si aún no hay ingresos apuntados en el historial (app recién empezada), usar los fijos o los de este mes
    if (!ingresos)
        ingresos = fijos.ingresos || actual.ingresos;
    // Mayor gasto del día a día (sin fijos), en media mensual
    const meses = Math.max(1, historial.length);
    const porCat = new Map();
    for (const m of variables)
        if (m.tipo === 'gasto' && !m.recurrenteId && m.categoriaId)
            porCat.set(m.categoriaId, (porCat.get(m.categoriaId) ?? 0) + m.importe);
    const top = [...porCat].sort((a, b) => b[1] - a[1])[0];
    return { ingresos, gastos, topVariable: top ? { id: top[0], mensual: Math.round(top[1] / meses) } : undefined };
}
export function evaluarSalud(d) {
    const { ingresos, gastos, topVariable } = mediasMensuales(d);
    const cuentas = d.cuentas.filter((c) => !c.archivada);
    const saldos = saldosCuentas(cuentas, d.movimientos);
    const cuentasTotal = cuentas.reduce((s, c) => s + (saldos.get(c.id) ?? 0), 0);
    const liquidez = cuentas.filter((c) => c.tipo !== 'tarjeta').reduce((s, c) => s + Math.max(0, saldos.get(c.id) ?? 0), 0);
    const activas = deudasActivas(d.deudas, d.movimientos);
    const deudaTotal = activas.reduce((s, x) => s + x.pendiente, 0);
    const cuotas = activas.reduce((s, x) => s + x.cuota, 0);
    const inversiones = d.inversiones.reduce((s, x) => s + x.valor, 0);
    const aportado = d.inversiones.reduce((s, x) => s + x.aportado, 0);
    const personas = porPersona(d.cobros ?? [], d.movimientos, d.hoy);
    const teDeben = personas.reduce((s, p) => s + p.pendiente, 0);
    const tasaAhorro = ingresos > 0 ? (ingresos - gastos) / ingresos : null;
    const mesesColchon = gastos > 0 ? liquidez / gastos : null;
    const ratioDeuda = ingresos > 0 ? cuotas / ingresos : cuotas > 0 ? null : 0;
    const caras = ordenAvalancha(activas.filter((x) => x.tae >= TAE_CARA));
    const cifras = { ingresosMes: ingresos, gastosMes: gastos, tasaAhorro, liquidez, cuentasTotal, mesesColchon, deudaTotal, cuotas, ratioDeuda, inversiones, aportado, teDeben, patrimonio: cuentasTotal + inversiones + teDeben - deudaTotal };
    // --- Indicadores ---
    const pAhorro = tasaAhorro === null ? null : lineal(tasaAhorro, 0, 0.2);
    const pColchon = mesesColchon === null ? null : lineal(mesesColchon, 0, 6);
    const pDeuda = activas.length === 0 ? 100 : ratioDeuda === null ? null : ratioDeuda <= 0.15 ? 100 : lineal(-ratioDeuda, -0.45, -0.15);
    const pCaras = caras.length ? 0 : 100;
    const colchonListo = (mesesColchon ?? 0) >= 6;
    const pInversion = inversiones > 0 ? (inversiones / (inversiones + liquidez) >= 0.2 ? 100 : 70) : colchonListo ? 30 : 70;
    const indicadores = [
        {
            id: 'ahorro',
            nombre: 'Ahorro',
            valor: tasaAhorro === null ? '—' : pct(tasaAhorro),
            detalle: tasaAhorro === null ? 'Apunta tus ingresos para calcularlo' : 'De lo que ingresas al mes. Lo ideal: 10–20 % o más',
            puntos: pAhorro,
            estado: estadoDe(pAhorro),
        },
        {
            id: 'colchon',
            nombre: 'Colchón de emergencia',
            valor: mesesColchon === null ? '—' : `${num(mesesColchon)} ${mesesColchon >= 0.95 && mesesColchon < 1.05 ? 'mes' : 'meses'}`,
            detalle: mesesColchon === null ? 'Apunta tus gastos para calcularlo' : 'De gastos cubiertos con tu dinero en cuentas. Ideal: 3–6',
            puntos: pColchon,
            estado: estadoDe(pColchon),
        },
        {
            id: 'deuda',
            nombre: 'Endeudamiento',
            valor: activas.length === 0 ? 'Sin deudas' : ratioDeuda === null ? '—' : pct(ratioDeuda),
            detalle: activas.length === 0 ? 'No tienes cuotas de préstamos' : 'De tus ingresos se va en cuotas. Recomendable: menos del 35 %',
            puntos: pDeuda,
            estado: estadoDe(pDeuda),
        },
        {
            id: 'caras',
            nombre: 'Deudas caras',
            valor: caras.length ? `${caras.length}` : 'Ninguna',
            detalle: caras.length ? `Con interés del ${TAE_CARA} % o más (tarjetas, aplazamientos…)` : `Ninguna deuda con interés del ${TAE_CARA} % o más`,
            puntos: pCaras,
            estado: estadoDe(pCaras),
        },
        {
            id: 'inversion',
            nombre: 'Inversión',
            valor: inversiones > 0 ? d.dinero(inversiones) : 'Nada invertido',
            detalle: inversiones > 0 ? 'Tu dinero trabajando a largo plazo' : colchonListo ? 'Con el colchón listo, ya puedes empezar a invertir' : 'Primero el colchón; después, invertir',
            puntos: pInversion,
            estado: estadoDe(pInversion),
        },
    ];
    const conDatos = indicadores.filter((i) => i.puntos !== null);
    const peso = conDatos.reduce((s, i) => s + PESOS[i.id], 0);
    // Sin ingresos la puntuación sería engañosa (no tener deudas ni inversiones no basta para estar «sano»)
    const puntos = pAhorro !== null && peso > 0 ? Math.round(conDatos.reduce((s, i) => s + i.puntos * PESOS[i.id], 0) / peso) : null;
    const nivel = puntos === null ? null : puntos >= 80 ? 'excelente' : puntos >= 60 ? 'buena' : puntos >= 40 ? 'mejorable' : 'delicada';
    // --- Consejos, de más a menos urgente ---
    const consejos = [];
    if (ingresos === 0)
        consejos.push({ id: 'ingresos', titulo: 'Apunta tus ingresos', texto: 'Añade tu nómina u otros ingresos fijos en Contabilidad para poder calcular tu ahorro y tu endeudamiento.', destino: 'contabilidad' });
    if (caras.length) {
        const x = caras[0];
        consejos.push({
            id: 'caras',
            titulo: `Liquida primero «${x.nombre}»`,
            texto: `Tiene un ${num(x.tae, 2)} % TAE: es tu deuda más cara. Cada euro que adelantes ahí te ahorra ese ${num(x.tae, 2)} % al año, más que cualquier ahorro o inversión. Evita pagar solo el mínimo.`,
            destino: 'deudas',
        });
    }
    if (mesesColchon !== null && mesesColchon < 1)
        consejos.push({ id: 'colchon', titulo: 'Crea un colchón para imprevistos', texto: `Aparta poco a poco hasta tener 1 mes de gastos (${d.dinero(gastos)}). Después, apunta a 3–6 meses en una cuenta aparte.` });
    else if (mesesColchon !== null && mesesColchon < 6)
        consejos.push({
            id: 'colchon',
            titulo: `Te faltan ${d.dinero(Math.max(0, gastos * 6 - liquidez))} para 6 meses de colchón`,
            texto: `Ahora cubres ${num(mesesColchon)} meses de gastos. Programa una transferencia automática a una cuenta de ahorro el día que cobras.`,
        });
    if (ratioDeuda !== null && ratioDeuda > 0.35)
        consejos.push({ id: 'deuda', titulo: 'Tus cuotas pesan demasiado', texto: `Las cuotas de tus deudas son el ${pct(ratioDeuda)} de tus ingresos (lo recomendable es menos del 35 %). No pidas nuevos préstamos ni aplazamientos hasta bajarlo.`, destino: 'deudas' });
    if (tasaAhorro !== null && tasaAhorro < 0.1) {
        const recorte = topVariable ? ` Tu mayor gasto del día a día es ${d.nombreCategoria(topVariable.id)} (${d.dinero(topVariable.mensual)}/mes): recortar un 20 % ahí son ${d.dinero(Math.round(topVariable.mensual * 0.2))} más al mes.` : '';
        consejos.push(tasaAhorro < 0
            ? { id: 'ahorro', titulo: 'Gastas más de lo que ingresas', texto: `De media gastas ${d.dinero(gastos - ingresos)} al mes más de lo que entra.${recorte}`, destino: 'movimientos' }
            : { id: 'ahorro', titulo: `Ahorras el ${pct(tasaAhorro)} de lo que ingresas`, texto: `Lo ideal es al menos un 10–20 %.${recorte}`, destino: 'movimientos' });
    }
    const excedente = liquidez - gastos * 6;
    if (colchonListo && !caras.length && excedente > 0 && (inversiones === 0 || excedente > gastos))
        consejos.push({
            id: 'invertir',
            titulo: 'Pon a trabajar tu dinero extra',
            texto: `Tienes unos ${d.dinero(excedente)} por encima de tu colchón de 6 meses. Si no lo vas a necesitar en años, valora invertirlo a largo plazo y de forma diversificada (por ejemplo, fondos indexados de bajo coste), según tu perfil.`,
            destino: 'inversiones',
        });
    if (inversiones > 0) {
        const porTipo = new Map();
        for (const x of d.inversiones)
            porTipo.set(x.tipo, (porTipo.get(x.tipo) ?? 0) + x.valor);
        const [tipo, valor] = [...porTipo].sort((a, b) => b[1] - a[1])[0];
        if (d.inversiones.length > 1 || porTipo.size === 1) {
            const cuota = valor / inversiones;
            if (cuota > 0.7 && (tipo === 'cripto' || tipo === 'acciones' || porTipo.size === 1) && inversiones > gastos)
                consejos.push({ id: 'diversificar', titulo: 'Diversifica tus inversiones', texto: `El ${pct(cuota)} está en ${TIPOS_INVERSION[tipo].nombre.toLowerCase()}. Repartir entre distintos tipos y mercados reduce el riesgo.`, destino: 'inversiones' });
        }
    }
    // Trading: avisar si pierde dinero o si se juega demasiado capital
    const t = estadisticas(d.operaciones ?? [], desdePeriodo('3m', d.hoy));
    if (t.cerradas >= 3 && t.neto < 0)
        consejos.push({
            id: 'trading-pierde',
            titulo: 'Tu trading está perdiendo dinero',
            texto: `En los últimos 3 meses llevas ${d.dinero(t.neto)} en ${t.cerradas} operaciones (aciertas el ${pct(t.aciertos ?? 0)}). Revisa tu estrategia, opera con menos capital o valora invertir a largo plazo.`,
            destino: 'inversiones',
        });
    const capitalTrading = d.inversiones.filter((x) => x.tipo === 'trading').reduce((s, x) => s + x.valor, 0);
    if (capitalTrading > 0 && capitalTrading > 0.25 * (inversiones + liquidez))
        consejos.push({
            id: 'trading-riesgo',
            titulo: 'Mucho dinero en trading',
            texto: `El ${pct(capitalTrading / (inversiones + liquidez))} de tu dinero está en cuentas de trading. Es de alto riesgo: dedica solo una parte pequeña que puedas permitirte perder.`,
            destino: 'inversiones',
        });
    const olvidado = personas.filter((p) => p.dias >= 30).sort((a, b) => b.pendiente - a.pendiente)[0];
    if (olvidado)
        consejos.push({
            id: 'cobrar',
            titulo: `Reclama lo que te deben`,
            texto: `${olvidado.nombre} te debe ${d.dinero(olvidado.pendiente)} desde hace ${olvidado.dias} días. Un recordatorio amable por WhatsApp suele bastar.`,
            destino: 'cobros',
        });
    if (!consejos.length)
        consejos.push({ id: 'bien', titulo: '¡Vas muy bien!', texto: 'Revisa una vez al año tus seguros, tarifas y suscripciones, y aumenta lo que inviertes cuando suban tus ingresos.' });
    return { puntos, nivel, indicadores, consejos, cifras };
}
