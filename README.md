# Finace

App personal para controlar gastos e ingresos día a día. **Apunta un gasto en 3 segundos y entiende a dónde va tu dinero cada mes.** Sin registro, sin anuncios: tus datos se quedan en tu dispositivo.

## Qué puedes hacer

- **Añadir un gasto en 3 toques:** botón **+** → importe → categoría (se guarda al tocarla). Con *Deshacer* durante 5 s.
- **Tus bancos** (BBVA, Santander, CaixaBank, Revolut, Openbank, ING, N26…) o cualquier otra cuenta, con el **saldo actual** de cada uno y el total.
- Ingresos, gastos y **transferencias** entre cuentas (no cuentan como gasto).
- Fecha rápida (Hoy / Ayer / Otra), cuenta, **nota con #etiquetas** (`Cena #viaje`) y **sugerencia automática de categoría** según tu historial.
- **Inicio:** balance del mes, *«te quedan X € para N días: unos Y € al día»*, gasto por categoría, saldos de cuentas, últimos movimientos y racha de días apuntando.
- **Movimientos:** buscador y filtros por tipo, categoría, cuenta, etiqueta y mes.
- **Análisis:** gasto medio diario, tasa de ahorro, comparación con el mes anterior, desglose por categoría, presupuestos, **calendario de gastos** y evolución de 6 meses.
- **Presupuestos** mensuales (total y por categoría) con avisos de color al 80 % y al 100 %.
- **Pagos:** calendario mensual de suscripciones y recibos (Netflix, alquiler, gimnasio…) con lo pagado y lo que falta. Cada pago se apunta solo en su fecha o, si lo prefieres, es un recordatorio que marcas tú como pagado. En el inicio aparecen los próximos pagos.
- **Gamificación:** niveles con XP, racha de días apuntando, 17 insignias (Semana perfecta, Día zen, Ahorrador, Dentro del límite…), retos semanales que se renuevan cada lunes y celebración con confeti al desbloquear algo.
- Mes que empieza el día que cobras (p. ej. el 25), varias monedas, modo oscuro.
- **Exportar a Excel (CSV)**, copia de seguridad y restauración (JSON).
- **Funciona sin conexión** y se instala en el móvil como una app (PWA).

## Usarla en el móvil

1. Abre la web publicada (GitHub Pages): `https://<tu-usuario>.github.io/finace/`
2. **Android (Chrome):** menú ⋮ → *Instalar aplicación*.
   **iPhone (Safari):** botón Compartir → *Añadir a pantalla de inicio*.
3. Haz una copia de seguridad de vez en cuando desde *Ajustes → Tus datos*: los datos viven solo en ese navegador.

### Publicarla (una sola vez)

1. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Fusiona esta rama en `main`. El workflow `.github/workflows/deploy.yml` ejecuta los tests, compila y publica automáticamente en cada cambio de `main`.

## App nativa de iPhone (con un Mac)

El proyecto de Xcode está en `ios/` (Capacitor). En el Mac:

```bash
git clone https://github.com/OsirisNeo33/finace.git && cd finace
npm install
npm run ios        # compila la web, la copia al proyecto iOS y abre Xcode
```

En Xcode: **App → Signing & Capabilities → Team** (tu Apple ID), conecta el iPhone y pulsa ▶︎.
Cada vez que cambie el código: `git pull && npm install && npm run ios:sync` y vuelve a pulsar ▶︎.
Los iconos se regeneran con `npm run iconos`.

## Desarrollo

```bash
npm install
npm run dev        # servidor local en http://localhost:5173
npm test           # tests unitarios (lógica de dinero, fechas, base de datos)
npm run build      # compilación de producción en dist/
npx vite preview --port 4173 & npm run e2e   # prueba completa en navegador
```

Tecnología: React 19 + TypeScript + Vite, Tailwind CSS 4, Dexie (IndexedDB), vite-plugin-pwa. El aspecto sigue el sistema de diseño de [`docs/DISENO.md`](docs/DISENO.md): los tokens están en `src/index.css` y los componentes base en `src/components/ui.tsx`. Los importes se guardan en **céntimos enteros** para evitar errores de redondeo. La lógica de negocio está en `src/domain/` con tests.

## Documentos

- [Análisis de otras apps](docs/analisis-apps.md)
- [Mega prompt](docs/MEGA_PROMPT.md)
- [Decisiones tomadas](docs/DECISIONES.md)
