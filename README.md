# Apex Life OS

Tu sistema personal: gym, hábitos, nutrición, hobbies y universidad. Next.js 16 (App Router) + TypeScript + Tailwind v4 + PWA (Serwist).

## Probar en tu computador (opcional)

```bash
npm install
npm run dev      # http://localhost:3000
```

## Comprobar antes de subir (opcional)

```bash
npm run typecheck && npm run lint && npm run build
```

## Despliegue

Cada cambio que subas a la rama principal de GitHub se despliega solo en Vercel.
Tus datos siguen guardándose en el dispositivo (localStorage, clave `apex.v2`).

## Qué hay en el rediseño

- **Layout multicolumna** (escritorio 3 columnas, tablet 2, móvil con selector inferior).
- **Gym**: hero con malla de color, vistas Rutina de hoy / Historial mensual / Trayectoria anual (mapa de calor de 12 meses con tooltip), récords y volumen por músculo.
- **Universidad**: asignaturas con promedio ponderado, evaluaciones en lista o tablero, calendario con agenda, Pomodoro y notas.
- **Hábitos**: tarjetas con anillo semanal, días, recordatorio, categoría y llama de racha. Se completan solos al entrenar (vínculo Gym → Hábitos).
- **Hobbies**: buscador de canciones (Deezer) con carátulas; biblioteca Por aprender / En práctica / Dominada.
- **Nutrición**: buscador de alimentos (Open Food Facts) con selector de gramos que recalcula macros.
- **Asistente (esfera del inicio)**: crea hábitos, rutinas y paneles personalizados.

## Servicios externos

| Función | Servicio | Necesita clave |
| --- | --- | --- |
| Canciones | Deezer | No |
| Alimentos | Open Food Facts | No |
| Asistente mejorado | Claude (Anthropic) | **Opcional** |

Deezer y Open Food Facts no permiten llamadas directas desde el navegador, por eso la app los consulta a través de `/api/music` y `/api/food`.

### Activar el asistente con Claude (opcional)

Sin configurar nada, el asistente entiende peticiones sencillas con un intérprete local. Para que entienda mejor cualquier frase:

1. Crea una clave en https://console.anthropic.com
2. En Vercel: Project → Settings → Environment Variables → añade `ANTHROPIC_API_KEY` con tu clave.
3. Vuelve a desplegar (Deployments → Redeploy).

La clave vive solo en el servidor. Opcional: `ANTHROPIC_MODEL` para cambiar de modelo (por defecto `claude-haiku-4-5-20251001`).

## Avisos importantes

- Los recordatorios de hábitos solo suenan mientras la app está abierta.
- La tipografía de Universidad (Newsreader) tiene licencia OFL: ver `public/fonts/`.
