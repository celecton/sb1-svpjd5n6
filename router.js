import {
  renderLogin
} from './views/login.js';
import {
  renderCadastro
} from './views/cadastro.js';
import {
  renderMotorista
} from './views/motorista.js';
import {
  renderCPD
} from './views/cpd.js';
import {
  renderConferente
} from './views/conferente.js';
import {
  renderChefe
} from './views/chefe.js';

const routes = {
  '/': renderLogin,
  '/login': renderLogin,
  '/cadastro': renderCadastro,
  '/motorista': renderMotorista,
  '/cpd': renderCPD,
  '/conferente': renderConferente,
  '/chefe': renderChefe
};

export function initRouter(db) {
  window.navigateTo = (path) => {
    history.pushState({}, path, path);
    handleRoute();
  };

  function handleRoute() {
    const path = window.location.pathname;
    const route = routes[path] || (() => {
      document.getElementById('app').innerHTML = '<h1>Página não encontrada</h1>';
    });
    route(db);
  }

  window.addEventListener('popstate', handleRoute);
  handleRoute(); // Chama a rota inicial
}