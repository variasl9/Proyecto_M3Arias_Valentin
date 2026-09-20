// views/about.js
// Vista informativa sobre el proyecto y el personaje.

export function renderAbout(container) {
  container.innerHTML = `
    <section class="about">
      <h1>Sobre este proyecto</h1>
      <p>
        Esta es una prueba de concepto (POC) desarrollada para ComicSansCon:
        una Single Page Application que permite chatear con un personaje
        ficticio usando inteligencia artificial.
      </p>

      <h2>El personaje</h2>
      <p>
        Harvey Specter es el socio litigante estrella del estudio Pearson
        Specter Litt en la serie de TV "Suits". Es conocido por su
        confianza inquebrantable, su ingenio filoso y su historial invicto
        en los tribunales.
      </p>

      <h2>Cómo funciona</h2>
      <ul>
        <li>El frontend es una SPA con routing propio usando la History API.</li>
        <li>Los mensajes se envían a una Vercel Serverless Function.</li>
        <li>La función se comunica con Google Gemini AI usando un system prompt que define la personalidad del personaje.</li>
        <li>La API key de Gemini nunca se expone en el navegador: vive únicamente en el servidor.</li>
        <li>El historial de la conversación se mantiene mientras dure la sesión.</li>
      </ul>

      <h2>Stack</h2>
      <p>HTML, CSS y JavaScript vanilla, Vercel Serverless Functions, Google Gemini AI y Vitest para testing.</p>
    </section>
  `;
}