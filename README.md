# Apex Life OS

Tu sistema personal: gym, hábitos, nutrición, hobbies y universidad. Next.js 16 (App Router) + TypeScript + Tailwind v4 + PWA (Serwist).

## Despliegue

Cada cambio que subas a la rama principal de GitHub se despliega solo en Vercel. Sin configurar nada extra, la app funciona **sin cuentas**: los datos se guardan en el dispositivo (localStorage, clave `apex.v2`).

## Funciones opcionales (variables de entorno en Vercel)

Vercel → tu proyecto → Settings → Environment Variables. Después de añadir o cambiar una variable hay que volver a desplegar (Deployments → ⋯ → Redeploy). Las que empiezan por `NEXT_PUBLIC_` se incorporan al compilar, así que el redeploy es obligatorio.

| Función | Variables | Notas |
| --- | --- | --- |
| **Cuentas** (inicio de sesión y datos en la nube) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Guía paso a paso en [`CONFIGURAR-CUENTAS.md`](./CONFIGURAR-CUENTAS.md). |
| Inicio con Google | `NEXT_PUBLIC_AUTH_GOOGLE=1` | Solo después de activar Google en Supabase. |
| **Asistentes con IA** (Claude) | `ANTHROPIC_API_KEY` | Sin ella, los asistentes responden con contenido guardado. Opcional: `ANTHROPIC_MODEL`. |
| **BPM y tono de canciones** | `GETSONGBPM_API_KEY` | Clave gratuita en getsongbpm.com/api. Sin ella se usa Deezer o, si hay IA, una estimación marcada como aproximada. |
| **Buscar canciones con Spotify** | `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` | Crea una app en developer.spotify.com. Sin ellas se busca en Deezer. |

Buscador de alimentos (Open Food Facts) y de canciones (Deezer) no necesitan clave. Se consultan desde el servidor (`/api/food`, `/api/music`) porque no permiten llamadas directas desde el navegador.

## Comprobar antes de subir (opcional, en tu computador)

```bash
npm install
npm run typecheck && npm run lint && npm run build
npm run dev      # http://localhost:3000
```

## Qué incluye

- **Gym**: rangos (Hierro → Élite), programas prehechos (PPL, Arnold, torso/pierna…), catálogo de 66 ejercicios con guía, entreno en acordeón con series que se marcan solas, cronómetro de descanso con tiempos rápidos, mapa del cuerpo (carga y recuperación), mapa de calor anual y seguimiento corporal (peso, grasa, músculo, cintura, IMC).
- **Hábitos**, **Nutrición** (emojis, comida según la hora, animaciones), **Hobbies** (plataforma preferida, BPM y tono automáticos), **Universidad**.
- **Asistentes**: uno general en el inicio (crea hábitos, rutinas y paneles) y uno propio en cada sección.
- **Cuentas** opcionales con sincronización.

## Avisos

- Los recordatorios de hábitos solo suenan mientras la app está abierta.
- La tipografía de Universidad (Newsreader) tiene licencia OFL: ver `public/fonts/`.
- Con la IA activada, se envía a Claude el texto que escribes y un resumen de la sección (sin peso ni medidas corporales).
