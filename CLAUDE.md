# HYROXNENA

App móvil (PWA) de uso personal para preparar una carrera HYROX: la primera de la usuaria, **HYROX Málaga, domingo 18 de abril de 2027, categoría Open Femenino**. Nivel de partida: entre principiante y base de gimnasio. La usa en un Android, instalada desde Chrome. Publicada con GitHub Pages desde la rama `main` (`https://ivan11sanzvi.github.io/nena/`).

Habla en español, con lenguaje sencillo y sin tecnicismos de programación. Los términos de entrenamiento (RPE, Zona 2, series, descarga) sí, explicados.

## Estructura
- Misma arquitectura que el Cuaderno de Campo (`ivan11sanzvi/cuaderno-campo`): `index.html` estructura, `styles.css` diseño (claro y oscuro, acento morado `#9333EA`), `app.js` toda la lógica en un único IIFE.
- `sw.js`: service worker. **Sube `CACHE` (hyroxnena-vN) en cada cambio** de `app.js` o `styles.css`, si no el móvil no se actualiza. Instala con `cache: 'reload'`. La app se recarga sola al activarse una versión nueva cuando no hay ninguna hoja abierta y avisa «App actualizada». Sube también `VERSION` en `app.js`. Comprueba `node --check app.js sw.js`.
- Sin build ni dependencias: se sirve tal cual (`python3 -m http.server`).
- Vista previa como artefacto de Claude: `python3 herramientas/vista_previa.py` junta todo en `vista-previa.html` (no se sube). Iconos: `node herramientas/iconos.js`.
- `index.html` lleva `noindex`: el repositorio es público pero la app no debe salir en buscadores.

## Datos
- Todo en `localStorage`, clave `hyroxnena.v1`: `{carrera: {fecha, ciudad, categoria}, inicio (lunes de la semana 1), registros, objetivo, ultimaCopia, ultimoCambio}`.
- **El repositorio es público: nunca subas datos de la usuaria** (copias JSON).
- Copias en JSON (`{app: 'hyroxnena', version, datos}`) para compartir (Drive, WhatsApp) o descargar, e importación. Aviso en Hoy/Registro si la última copia tiene más de 7 días y hay cambios.
- La primera versión de la app guardaba en `hyrox-state` (`logs`). `desdeViejo()` la convierte; se ofrece traerla con un aviso y desde Ajustes. Importar también acepta las copias antiguas (`{state: {logs}}`).

## El plan
- Se calcula hacia atrás desde la carrera: `totalSemanas()` = semanas entre `db.inicio` y el lunes de la semana de la carrera (+1). La última semana es la de la carrera.
- Fases (`fases()`): Adaptación (2 si hay ≥ 20 semanas), Base y Construcción (el resto a medias), Pico (5 si ≥ 18), Puesta a punto (2). Descarga cada 4 semanas en Base y Construcción (`esDescarga`): ~35 % menos de km, una serie menos y RPE −1.
- Semana tipo (`sesionesSemana(n)`, 0 = lunes): **lunes entreno con su entrenador personal (EP)**, martes fuerza + estaciones pesadas, miércoles rodaje Z2, jueves calidad (fartlek, tempo, series, carrera comprometida), viernes tirada larga + estaciones o simulación (completa/media alterna en Pico), sábado descanso activo (pádel), domingo descanso. `semanaCarrera()` para la última semana; la carrera va en el día de la semana de `db.carrera.fecha`.
- Ejercicios estructurados `{id, n, s (series), r (reps o distancia), rpe, w (peso propuesto), u ('kg' | 'kg por mano'), sinPeso, nota}`. Los `id` son estables: «la última vez» y Progreso los usan para unir sesiones.
- Pesos oficiales Open Femenino (reglamento 2025/26) en `OF`: Sled Push 102 kg y Sled Pull 78 kg (con trineo), Farmers 2 × 16 kg, Sandbag 10 kg, Wall Balls 4 kg a 2,70 m.

## Registro
- `formRegistro`: elige la sesión del plan por fecha (o «Fuera del plan» con tipo). Las tarjetas de ejercicio solo piden el peso por serie; el primero se copia a las series siguientes vacías; «La última vez» con botón Usar; RPE real opcional por ejercicio y RPE de la sesión (1-10).
- Registro: `{id, fecha, semana, dia, tipo, titulo, ejercicios[{…, pesos[], rpeReal}], km, seg, splits {run[8], est[8]}, total, totalReloj, min, rpe, notas}`. `semana/dia` null si es fuera del plan.
- Tiempos con `parseT`: «4.35», «4:35», «435» = 4 min 35 s; «1.25.00» = 1 h 25 min; «28» = 28 min.

## Pruebas
Con Playwright emulando un Pixel 7, sirviendo la carpeta con `python3 -m http.server`. Prueba el registro guiado, la simulación, la copia/importación y la migración de `hyrox-state`.
