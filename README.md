# HYROXNENA ♥

App para el móvil (PWA) para preparar mi primera HYROX: **Málaga, 18 de abril de 2027, Open Femenino**.

- **Hoy**: cuenta atrás, en qué semana y fase del plan estoy, la semana de un vistazo y el entreno del día con sus series, repeticiones y esfuerzo (RPE).
- **Plan**: se calcula solo desde la semana de inicio hasta la carrera, en cinco fases (Adaptación, Base, Construcción, Pico y Puesta a punto) con una semana de descarga cada cuatro. Los lunes son con mi entrenador personal, de martes a viernes mis entrenos y el fin de semana descanso (pádel si me apetece).
- **Registro**: al apuntar un entreno salen los ejercicios del plan y solo hay que poner el peso. El de la primera serie se copia a las demás, y enseña lo que levanté la última vez. También ritmo de carrera, tiempos de cada estación en las simulaciones, RPE de la sesión y notas.
- **Progreso**: kilómetros por semana frente al plan, cómo sube el peso en cada ejercicio, el ritmo corriendo, las simulaciones y los mejores tiempos por estación.
- **Carrera**: el recorrido, los pesos oficiales de Open Femenino y una calculadora del tiempo objetivo.

Funciona sin cobertura. Los datos se guardan solo en el móvil. Desde **Ajustes → Copia de seguridad** se crea un archivo `.json` que se puede mandar a Google Drive, WhatsApp o al correo, e importar en otro móvil.

## Instalar en Android

1. Abre `https://ivan11sanzvi.github.io/nena/` en **Chrome**.
2. Menú ⋮ → **Instalar aplicación** (o «Añadir a pantalla de inicio»).
3. Aparece el icono morado y se abre a pantalla completa, también sin conexión.

Las versiones nuevas llegan solas: al abrir la app con cobertura se descarga la nueva y avisa «App actualizada».

## Publicarla con GitHub Pages

En el repositorio: **Settings → Pages → Source: Deploy from a branch → `main` / root**.

## Ficheros

| Fichero | Qué es |
|---|---|
| `index.html` | Estructura de la pantalla |
| `styles.css` | Diseño (modo claro y oscuro) |
| `app.js` | Toda la lógica: plan, registro, progreso y copias |
| `sw.js` | Guarda la app para usarla sin cobertura |
| `manifest.webmanifest`, `icons/` | Nombre, icono y colores al instalarla |
| `herramientas/` | Generar los iconos y la vista previa |

Al cambiar `app.js` o `styles.css`, sube el número de `CACHE` en `sw.js` para que el móvil descargue la versión nueva.
