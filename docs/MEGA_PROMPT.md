# Mega prompt: Finace, app de control de gastos e ingresos

> Copia todo lo que hay debajo de la línea y pégalo en Claude (o en otra IA de código) para generar la app.
> Basado en el análisis de [`analisis-apps.md`](./analisis-apps.md).

---

## ROL

Eres un ingeniero de software sénior especializado en aplicaciones web móviles (PWA), diseño de producto y UX de apps financieras. Escribes código limpio, tipado y probado, y tomas decisiones pensando en un usuario real que usará la app **todos los días desde el móvil**.

## CONTEXTO

Quiero una app personal llamada **Finace** para controlar mis gastos e ingresos. La usaré a diario para apuntar cada gasto en el momento en que ocurre. El mayor riesgo es que deje de usarla por pereza, así que **la velocidad para registrar un movimiento es la prioridad número uno**.

Inspiración (toma lo mejor de cada una):
- **Monefy**: añadir un gasto en 2–3 toques.
- **Money Manager**: vista calendario, varias cuentas, transferencias.
- **Goodbudget / YNAB**: presupuestos por categoría con barras de progreso.
- **Copilot Money**: autocategorización que aprende y detección de suscripciones.
- **Spendee**: etiquetas y un diseño muy visual.
- **Lección de Mint (cerró en 2024)**: mis datos deben ser míos, guardados en local y exportables siempre.

Propuesta de valor: *"Apunta un gasto en 3 segundos y entiende a dónde va tu dinero cada mes. Sin cuentas, sin anuncios, tus datos en tu móvil."*

## STACK TÉCNICO

- **React 18 + TypeScript + Vite**
- **Tailwind CSS** para estilos; modo claro/oscuro según el sistema.
- **Dexie.js (IndexedDB)** como base de datos local. Sin backend en la v1.
- **Recharts** para gráficos.
- **PWA** (vite-plugin-pwa): instalable en el móvil, funciona sin conexión.
- **Zustand** para el estado de la interfaz, **date-fns** (locale `es`) para fechas.
- **Vitest + Testing Library** para tests; **Playwright** para un test E2E del flujo principal.
- Importes guardados como **enteros en céntimos** (nunca `float`).
- Diseño **mobile-first**; también debe verse bien en escritorio.

## MODELO DE DATOS

```ts
type TipoMovimiento = 'gasto' | 'ingreso' | 'transferencia';

interface Cuenta {
  id: string; nombre: string;               // "Efectivo", "Banco", "Tarjeta"
  tipo: 'efectivo' | 'banco' | 'tarjeta' | 'ahorro';
  moneda: string;                           // ISO 4217, ej. "EUR"
  saldoInicial: number;                     // céntimos
  color: string; icono: string; archivada: boolean;
}

interface Categoria {
  id: string; nombre: string; tipo: 'gasto' | 'ingreso';
  icono: string; color: string;
  padreId?: string;                         // subcategorías opcionales
  orden: number; archivada: boolean;
}

interface Movimiento {
  id: string; tipo: TipoMovimiento;
  importe: number;                          // céntimos, siempre positivo
  fecha: string;                            // ISO yyyy-mm-dd
  cuentaId: string; cuentaDestinoId?: string; // solo en transferencias
  categoriaId?: string;
  nota?: string; etiquetas: string[];
  recurrenteId?: string;
  creadoEn: string; actualizadoEn: string;
}

interface Recurrente {
  id: string; plantilla: Omit<Movimiento, 'id' | 'fecha' | 'creadoEn' | 'actualizadoEn'>;
  frecuencia: 'diaria' | 'semanal' | 'mensual' | 'anual';
  diaDelPeriodo?: number; inicio: string; fin?: string;
  ultimaGeneracion?: string; activo: boolean;
}

interface Presupuesto {
  id: string; categoriaId: string | null;   // null = presupuesto global
  importe: number; periodo: 'mensual' | 'semanal';
  arrastrarSobrante: boolean;
}

interface Objetivo {
  id: string; nombre: string; importeObjetivo: number;
  fechaLimite?: string; cuentaId?: string; aportado: number;
}
```

Categorías por defecto (con icono y color):
- **Gastos**: Comida y supermercado, Restaurantes, Transporte, Vivienda, Facturas y suministros, Salud, Ocio, Compras, Suscripciones, Educación, Regalos, Viajes, Mascotas, Otros.
- **Ingresos**: Nómina, Freelance, Ventas, Regalos, Intereses, Otros.

## FUNCIONALIDADES

### Fase 1: MVP (lo imprescindible)

1. **Añadir movimiento rápido** (pantalla estrella)
   - Botón flotante **"+"** siempre visible.
   - Se abre un panel inferior con **teclado numérico propio** ya enfocado (sin abrir el teclado del sistema).
   - Debajo, **cuadrícula de categorías** con iconos ordenadas por uso; un toque en la categoría **guarda** el gasto.
   - Por defecto: tipo *gasto*, fecha *hoy*, cuenta *la última usada*. Fecha, cuenta, nota y etiquetas son opcionales y están plegadas.
   - Selector rápido de fecha: "Hoy / Ayer / Elegir".
   - Pestañas Gasto | Ingreso | Transferencia.
   - Al guardar: vibración ligera, aviso con **"Deshacer"** durante 5 s.
   - **Objetivo medible: registrar un gasto en 3 toques o menos y en menos de 5 segundos.**
2. **Inicio (dashboard)**
   - Selector de mes (deslizar izquierda/derecha).
   - Tarjeta principal: **Ingresos, Gastos, Balance** del mes y **"Te quedan X € para N días"** (≈ Y €/día).
   - Gráfico de anillo por categorías; al tocar una categoría se filtra la lista.
   - Últimos movimientos agrupados por día con el total diario.
3. **Lista de movimientos**: búsqueda por texto, filtros (tipo, categoría, cuenta, etiqueta, rango de fechas, importe), editar y borrar deslizando.
4. **Cuentas**: crear, editar, archivar; saldo actual calculado; transferencias entre cuentas (no cuentan como gasto ni ingreso).
5. **Categorías**: crear, editar, reordenar, archivar, elegir icono y color.
6. **Ajustes**: moneda principal, primer día del mes (útil si cobras el día 25), tema, **exportar a CSV y JSON**, **importar copia de seguridad JSON**, borrar todos los datos (con confirmación).
7. **Primer uso** sin registro: 3 pantallas (moneda → cuentas iniciales con saldo → listo). Menos de 30 segundos.

### Fase 2: Control

8. **Presupuestos** mensuales por categoría y global, con barra de progreso (verde < 80 %, ámbar 80–100 %, rojo > 100 %) y opción de arrastrar el sobrante al mes siguiente.
9. **Movimientos recurrentes**: nómina, alquiler, suscripciones… se generan automáticamente al abrir la app (rellenando los días que falten) y se pueden pausar.
10. **Vista calendario**: cada día muestra el gasto total con un mapa de calor; al tocar un día se ven sus movimientos.
11. **Estadísticas**: barras de ingresos vs. gastos de los últimos 12 meses, evolución por categoría, gasto medio diario, top 5 categorías, comparación con el mes anterior ("Has gastado un 12 % menos en Restaurantes").
12. **Recordatorio diario** a una hora configurable: "¿Has apuntado tus gastos de hoy?" (notificaciones de la PWA).

### Fase 3: Inteligencia y hábito

13. **Autocategorización**: al escribir una nota ("mercadona", "uber"), sugerir la categoría según mi historial.
14. **Detector de suscripciones**: movimientos con importe similar y periodicidad mensual → proponer convertirlos en recurrentes y mostrar el total mensual en suscripciones.
15. **Objetivos de ahorro** con progreso y fecha estimada.
16. **Rachas**: días seguidos registrando; pequeño hito a los 7, 30 y 100 días.
17. **Alertas**: gasto inusual (más de 2× la media de la categoría), presupuesto superado.
18. **Importar CSV del banco** con asistente para asignar columnas y evitar duplicados.
19. **Multimoneda**: movimientos en otra moneda con tipo de cambio manual guardado.
20. Resumen mensual compartible (imagen) con las cifras clave.

## DISEÑO Y UX

- Navegación inferior con 4 pestañas: **Inicio · Movimientos · Estadísticas · Ajustes**, y el "+" flotante en el centro.
- Gastos en rojo suave, ingresos en verde; nunca solo el color (también el signo − / +).
- Formato español: `1.234,56 €`, fechas "lun, 13 nov".
- Tipografía grande para los importes; objetivos táctiles de al menos 44 px.
- Accesible: contraste AA, etiquetas ARIA, se puede usar con teclado.
- Estados vacíos amables con un ejemplo de qué hacer.
- Animaciones cortas (< 200 ms) y respeto a `prefers-reduced-motion`.

## REQUISITOS NO FUNCIONALES

- Funciona **100 % sin conexión**; los datos no salen del dispositivo.
- Carga inicial < 2 s en un móvil medio; lista virtualizada si hay más de 1.000 movimientos.
- Toda la lógica de dinero (saldos, presupuestos, recurrentes, estadísticas) en funciones puras en `src/domain/` con **tests unitarios**.
- Migraciones de esquema versionadas con Dexie.
- Sin dependencias innecesarias; sin analítica ni rastreo.
- Preparado para añadir sincronización en la nube en el futuro (IDs UUID, campos `actualizadoEn`).

## ESTRUCTURA DEL PROYECTO

```
src/
  app/          # rutas, layout, navegación
  components/   # UI reutilizable (Teclado, CategoriaGrid, Importe, BarraProgreso…)
  features/     # movimientos, cuentas, categorias, presupuestos, estadisticas, ajustes
  domain/       # lógica pura + tests (dinero, fechas, saldos, recurrentes)
  db/           # esquema Dexie, migraciones, datos semilla
  hooks/  store/  utils/
```

## FORMA DE TRABAJAR

1. Antes de programar, resume en 10 líneas cómo vas a abordar la Fase 1 y espera mi confirmación.
2. Construye **fase por fase**; al terminar cada una: `npm run build`, `npm test` y un E2E del flujo "abrir → añadir gasto → verlo en el inicio".
3. Haz commits pequeños con mensajes claros.
4. Si algo es ambiguo, elige la opción más sencilla para el usuario y anótala en `DECISIONES.md`.
5. Al final de cada fase, dime qué funciona, qué falta y cómo probarlo en el móvil.

## CRITERIOS DE ACEPTACIÓN DEL MVP

- [ ] Puedo instalar la app en el móvil y abrirla sin conexión.
- [ ] Registro un gasto de 4,50 € en "Restaurantes" en ≤ 3 toques.
- [ ] El inicio muestra bien ingresos, gastos, balance y lo que me queda por día.
- [ ] Las transferencias no alteran ingresos ni gastos.
- [ ] Puedo editar, borrar y deshacer un movimiento.
- [ ] Exporto a CSV, borro todo, importo el JSON y recupero exactamente los mismos datos.
- [ ] Los tests de `domain/` pasan y cubren saldos, rangos de mes con día de inicio personalizado y redondeo.
