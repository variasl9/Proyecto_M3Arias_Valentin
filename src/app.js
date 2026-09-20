// app.js
// Routing de la SPA usando la History API. No usa ningún framework: escucha
// clicks en links marcados con [data-link], intercepta la navegación,
// actualiza la URL con pushState y renderiza la vista correspondiente.
// También maneja "popstate" para que los botones back/forward del navegador
// funcionen correctamente.

import { renderHome } from "./views/home.js";
import { renderAbout } from "./views/about.js";
import { initChatView } from "./chat.js";

const appEl = document.getElementById("app");
const navLinks = document.querySelectorAll(".nav a[data-route]");

const routes = {
  home: renderHome,
  chat: initChatView,
  about: renderAbout,
};

function pathToRoute(pathname) {
  const clean = pathname.replace(/\/+$/, "") || "/home";
  const segment = clean.split("/").filter(Boolean)[0] || "home";
  return routes[segment] ? segment : "home";
}

function updateActiveNav(routeName) {
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.route === routeName);
  });
}

function renderRoute(pathname, { scroll = true } = {}) {
  const routeName = pathToRoute(pathname);
  const renderFn = routes[routeName];

  appEl.innerHTML = "";
  renderFn(appEl);
  updateActiveNav(routeName);

  if (scroll) {
    window.scrollTo(0, 0);
  }
}

/**
 * Navega a una nueva ruta empujando una nueva entrada al historial.
 * @param {string} path
 */
export function navigate(path) {
  if (path === window.location.pathname) return;
  window.history.pushState({}, "", path);
  renderRoute(path);
}

// Intercepta clicks en cualquier link marcado con data-link para evitar
// que el navegador haga una recarga completa de página.
document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-link]");
  if (!link) return;
  event.preventDefault();
  navigate(link.getAttribute("href"));
});

// Botones back/forward del navegador disparan "popstate": re-renderizamos
// según la URL actual, sin volver a pushear al historial.
window.addEventListener("popstate", () => {
  renderRoute(window.location.pathname, { scroll: false });
});

// Primer render según la URL con la que se cargó la aplicación.
renderRoute(window.location.pathname);