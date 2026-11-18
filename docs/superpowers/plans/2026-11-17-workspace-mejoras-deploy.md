# Despliegue — mejoras del espacio de trabajo (2026-11-17)

El orden importa: el backend nuevo lee `pm_task_activity.post_id`, que solo existe después del SQL.

1. **Respaldo** en phpMyAdmin → Exportar `pm_tasks` y `pm_task_activity`.
2. **Revisar el ENUM actual**: `SHOW COLUMNS FROM pm_task_activity LIKE 'kind';` debe coincidir con la lista del `ALTER` (más `'mention'`). Si hay otro valor, no seguir.
3. **SQL**: correr `docs/migrations/2026-11-17-workspace.sql`. Los dos `SELECT status, COUNT(*)` (antes y después) deben dar lo mismo.
4. **Backend**: subir `backend-actual.js` a cPanel (reemplaza el archivo, no se borra nada) y reiniciar la app Node.
5. **Frontend**: commit + push → Vercel.
6. **Prueba de humo** en e-commetrics.com:
   - Proyecto → "Agregar tarea" → título + Enter crea la tarea; también con el botón "Agregar".
   - El tablero muestra 8 columnas; las tareas viejas siguen en su columna.
   - Arrastrar una tarea con subtareas abiertas a Completada → aviso "Tiene N subtareas pendientes" y no se mueve.
   - Muro: escribir `@`, elegir a alguien, publicar → esa persona ve "te mencionó en el muro" en la Bandeja; clic abre el muro.
   - Muro: el filtro por proyecto muestra solo los posts de ese proyecto.
   - Clientes (admin): aparece "Páginas sin cliente"; asignar una a un cliente y eliminar otra.

Si algo falla en el paso 4: volver a subir el `backend-actual.js` anterior (las columnas nuevas no afectan al backend viejo).
