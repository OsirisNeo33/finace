# Decisiones

- **PWA sin backend.** Los datos se guardan en IndexedDB del navegador. Ventaja: privacidad, funciona sin conexión, gratis. Inconveniente: no se sincroniza entre dispositivos → copia de seguridad JSON manual. Los IDs son UUID y los movimientos tienen `actualizadoEn` para poder añadir sincronización en el futuro.
- **Un toque en la categoría guarda el gasto** (estilo Monefy). Al editar un movimiento existente, tocar la categoría solo la selecciona y hay que pulsar *Guardar*.
- **Etiquetas dentro de la nota** con `#`, en lugar de un campo aparte: menos pasos.
- **Categorías ordenadas por uso** en el editor; el orden manual de *Ajustes → Categorías* se usa para desempatar.
- **Mes personalizado:** si el mes empieza el 25, el periodo del 25-oct al 24-nov se llama «Noviembre».
- **«Te quedan X € al día»:** usa el presupuesto total si existe; si no, ingresos − gastos del mes.
- **Recurrentes:** se generan al abrir la app y al volver a ella. Al reanudar uno pausado no se rellenan los meses en pausa.
- **Racha:** días seguidos en que has apuntado algo a mano (los recurrentes automáticos no cuentan).
- **Presupuestos solo mensuales** en esta versión (sin arrastre de sobrante).
- **Saldo de cada banco:** al escribir el saldo que ves hoy en tu banco se ajusta el saldo inicial de la cuenta, en vez de crear un movimiento de «ajuste», para que no altere gastos ni ingresos.
- **Pagos recurrentes «solo recordatorio»:** no se apuntan solos; aparecen en el calendario como pendientes (en rojo si se pasa la fecha) hasta que pulsas «Marcar pagado», que apunta el gasto en esa fecha.
- **Gamificación calculada a partir de tus datos:** el XP, el nivel, las insignias y los retos se calculan cada vez desde los movimientos, así que viajan con la copia de seguridad y no se pueden «perder». Solo se guarda qué insignias ya se celebraron. Los movimientos recurrentes automáticos no dan XP ni cuentan para la racha.
- **Pendiente para próximas versiones:** importar CSV del banco, detector de suscripciones, objetivos de ahorro, recordatorio diario con notificación, multimoneda por movimiento.
