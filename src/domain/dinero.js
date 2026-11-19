/** Convierte texto introducido por el usuario ("4,5", "1.234,56", "12") a céntimos. */
export function aCentimos(texto) {
    const limpio = texto.trim().replace(/\s|€/g, '');
    if (!limpio)
        return 0;
    let normal = limpio;
    if (normal.includes(','))
        normal = normal.replace(/\./g, '').replace(',', '.');
    const n = Number(normal);
    if (!Number.isFinite(n))
        return 0;
    return Math.round(n * 100);
}
const formateadores = new Map();
export function formatear(centimos, moneda = 'EUR', opciones = {}) {
    const clave = `${moneda}-${opciones.sinDecimales ? 0 : 2}`;
    let f = formateadores.get(clave);
    if (!f) {
        f = new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: moneda,
            minimumFractionDigits: opciones.sinDecimales ? 0 : 2,
            maximumFractionDigits: opciones.sinDecimales ? 0 : 2,
            useGrouping: 'always',
        });
        formateadores.set(clave, f);
    }
    const texto = f.format(Math.abs(centimos) / 100);
    if (centimos < 0)
        return `−${texto}`;
    if (opciones.signo && centimos > 0)
        return `+${texto}`;
    return texto;
}
/** Texto que muestra el teclado numérico a partir de lo tecleado. */
export function pulsarTecla(actual, tecla) {
    if (tecla === 'borrar')
        return actual.slice(0, -1);
    if (tecla === ',') {
        if (actual.includes(','))
            return actual;
        return (actual || '0') + ',';
    }
    const [entera, decimales] = actual.split(',');
    if (decimales !== undefined && decimales.length >= 2)
        return actual;
    if (decimales === undefined && entera.replace(/^0+/, '').length >= 7)
        return actual;
    if (actual === '0')
        return tecla;
    return actual + tecla;
}
