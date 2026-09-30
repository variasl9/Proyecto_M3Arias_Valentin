# Chateá con Harvey Specter

Proyecto Integrador 3 — SPA que permite chatear con **Harvey Specter**, el socio
litigante estrella de Pearson Specter Litt (serie *Suits*), usando Google
Gemini AI. Desarrollado para ComicSansCon como POC para stakeholders.

## Personaje elegido

**Harvey Specter** (*Suits*). Abogado litigante brillante, seguro de sí mismo
hasta el extremo, ingenioso y obsesionado con ganar. El system prompt (ver
`api/chat.js`) define su personalidad, tono, y le pide respuestas cortas y
apropiadas para un chat.

## Stack

- HTML / CSS / JavaScript vanilla (sin frameworks de frontend)
- Routing SPA propio con History API
- Vercel Serverless Functions (Node.js) como proxy seguro a Gemini
- Google Gemini AI (`gemini-2.0-flash`)
- Vitest para tests unitarios

## Estructura del proyecto
harvey-chat/
├── api/
│ └── chat.js # Serverless function: proxy seguro a Gemini
├── src/
│ ├── index.html
│ ├── styles.css
│ ├── app.js # Routing SPA (History API)
│ ├── chat.js # Lógica del chat (historial, envío, UI)
│ ├── utils.js # Funciones puras (testeadas)
│ └── views/
│ ├── home.js
│ └── about.js
├── tests/
│ ├── utils.test.js
│ └── api-chat.test.js
├── .env.example
├── vercel.json
└── package.json

## Requisitos y pasos para ejecutar en local

1. **Instalar dependencias**
```bash
   npm install
   npm install -g vercel   # si no tenés la CLI de Vercel
```

2. **Configurar variables de entorno**

   Copiá `.env.example` como `.env` y completá tu API key de Gemini
   (conseguila gratis en https://aistudio.google.com/app/apikey):
   
3. **Levantar el proyecto en local** (necesario para que la serverless
   function funcione, ya que un servidor estático simple no la ejecuta):
```bash
   vercel dev
```
   Esto va a levantar la app en algo como `http://localhost:3000`.

## Cómo ejecutar los tests

```bash
npm test
```

Corre la suite de Vitest (`tests/utils.test.js` y `tests/api-chat.test.js`),
que cubre funciones de transformación de datos (creación de mensajes,
formato de timestamps, validación de inputs, armado del payload para
Gemini, parseo de la respuesta) y la lógica de la serverless function
mockeando `fetch` (sin red real).

## Cómo desplegar a Vercel

1. Subí este repositorio a GitHub (ya hecho).
2. En [vercel.com](https://vercel.com), importá el repositorio.
3. En **Settings → Environment Variables**, agregá `GEMINI_API_KEY` con tu
   API key real.
4. Desplegá. Vercel detecta automáticamente `api/chat.js` como serverless
   function y sirve el contenido de `src/` como sitio estático (configurado
   en `vercel.json`).
5. Verificá que el chat funcione en la URL pública (las serverless functions
   necesitan la variable de entorno configurada en producción, no solo en
   local).

## Capturas de pantalla

**Home**

![Vista Home](docs/screenshots/home.png)

**Chat**

![Vista Chat](docs/screenshots/chat.png)

**About**

![Vista About](docs/screenshots/about.png)

## Video demo

[`docs/video/demo-harvey-chat.mp4`](docs/video/demo-harvey-chat.mp4) — recorrido
por las 3 vistas y una conversación real con Harvey en la app desplegada.

> ⚠️ Este archivo pesa ~62 MB. GitHub permite subir archivos hasta 100 MB,
> pero no es buena práctica versionar binarios pesados en un repo git (cada
> clone lo vuelve a descargar). Si el repo empieza a pesar mucho o GitHub se
> queja al hacer push, subí el video a YouTube (como no listado) o a Google
> Drive y reemplazá este archivo por un link en vez del `.mp4`.

## Link a la aplicación desplegada

https://harvey-chat.vercel.app/

## Registro del uso de AI en el proyecto
Las capturas estan cargadas en el repositorio de github.

Usé Claude durante todo el desarrollo, principalmente para tres cosas:
revisar el proyecto completo contra la consigna/guía/rúbrica antes de
entregar, resolver el deploy en Vercel paso a paso, y diagnosticar errores
de la API de Gemini en producción. Las capturas completas de esa
conversación están en [`docs/uso-ia/`](docs/uso-ia/).

**1. Revisión general del proyecto**

**Prompt:** "Necesito que corrobores el proyecto que estoy haciendo, le mando
todos mis archivos y las consignas etc."

**Cómo influyó en la implementación:** Le pasé a la IA todo el código del
proyecto junto con la consigna, la guía y la rúbrica, para que revisara si
cumplía con lo pedido antes de la entrega.

**Decisiones tomadas a partir de la devolución:** A partir de los problemas
que señaló, corregí `package.json`, `chat.js` y `app.js`.

**2. Deploy en Vercel**

No tenía experiencia desplegando en Vercel, así que le pedí a la IA una guía
paso a paso: cómo conectar el repo, dónde cargar la variable de entorno
`GEMINI_API_KEY`, y cómo disparar el primer deploy a producción (el
proyecto estaba vinculado pero nunca se había desplegado — "No Production
Deployment"). Seguí esos pasos tal cual y así logré la primera URL pública
funcionando (ver `docs/uso-ia/captura-5.png` en adelante).

**3. Debugging de errores 502/404/503 en producción**

Una vez desplegado, el chat empezó a fallar con errores intermitentes
(`502 Bad Gateway`). Le compartí a la IA capturas de la consola del
navegador y de los **Logs** de Vercel, y entre los dos fuimos descartando
causas: primero pensamos que era un rate limit, después confirmamos con el
código de status real (`503`, "modelo sobrecargado" del lado de Google) que
era un problema temporal de disponibilidad. Agregué, con ayuda de la IA, un
reintento automático con backoff en `api/chat.js` para esos casos. Más
tarde apareció un `404` distinto: probamos cambiar el modelo a
`gemini-2.5-flash` pensando que sería más estable, pero Gemini respondió
que ese modelo ya no está disponible para cuentas nuevas y que había que
usar `gemini-3.6-flash` — así que revertimos ese cambio. El error final
resultó ser que un commit con el modelo viejo no se había pusheado a
tiempo; una vez sincronizado el repo con GitHub, el deploy en Vercel quedó
andando correctamente.

## Notas de implementación

- El historial de conversación se mantiene solo en memoria durante la
  sesión (se pierde al recargar), tal como pide la consigna. La opción de
  extra credit de persistir con `localStorage` no está implementada.
- La API key de Gemini nunca se expone en el frontend: todas las llamadas a
  Gemini pasan por `api/chat.js`, que corre en el servidor.
- El routing intercepta clicks en links `[data-link]`, usa
  `history.pushState` para navegar sin recargar, y escucha `popstate` para
  que los botones back/forward del navegador funcionen correctamente.