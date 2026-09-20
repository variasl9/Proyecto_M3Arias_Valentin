// views/home.js
// Vista de bienvenida: presenta al personaje y ofrece el botón para
// arrancar el chat.

export function renderHome(container) {
  container.innerHTML = `
    <section class="hero">
      <p class="hero-eyebrow">Pearson Specter Litt · Socio Litigante</p>
      <h1>Hablá con Harvey Specter</h1>
      <p>
        El mejor abogado litigante de Nueva York tiene un minuto para vos.
        Contale tu caso, pedile consejo, o intentá ganarle una discusión.
        Spoiler: no vas a poder.
      </p>
      <a href="/chat" class="btn-primary" data-link>Empezar a chatear</a>
      <p class="home-quote">"No tengo sueños, tengo objetivos."</p>
    </section>
  `;
}