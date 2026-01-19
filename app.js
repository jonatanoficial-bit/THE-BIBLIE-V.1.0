/*
 * App Bíblico Premium
 *
 * Este script carrega dinamicamente os conteúdos definidos nos módulos JSON
 * em `/content`, renderiza seções como devocionais, estudos, versões da Bíblia,
 * esboços de pregação e temas. A navegação é mobile‑first e o visual inclui
 * microinterações e tema claro/escuro. O código é organizado de forma a
 * permitir a adição de novas expansões sem alterar o core.
 */

const state = {
  modules: [],
  data: {
    versions: [],
    devotionals: [],
    studies: [],
    outlines: [],
    themes: []
  }
};

/**
 * Carrega o manifesto com a lista de módulos disponíveis.
 */
async function loadManifest() {
  try {
    const res = await fetch('content/manifest.json');
    const manifest = await res.json();
    state.modules = manifest.modules;
  } catch (err) {
    console.error('Erro ao carregar manifesto:', err);
  }
}

/**
 * Carrega módulos habilitados e mescla seus conteúdos no estado global.
 */
async function loadModules() {
  const enabled = state.modules.filter(m => m.enabled);
  for (const mod of enabled) {
    try {
      const res = await fetch(`content/${mod.file}`);
      const data = await res.json();
      mergeSections(data.sections);
    } catch (err) {
      console.error(`Erro ao carregar módulo ${mod.id}:`, err);
    }
  }
}

/**
 * Mescla as seções de um módulo com o estado global.
 * @param {Object} sections
 */
function mergeSections(sections) {
  Object.keys(sections).forEach(key => {
    if (Array.isArray(state.data[key])) {
      state.data[key] = state.data[key].concat(sections[key]);
    } else {
      state.data[key] = sections[key];
    }
  });
}

/**
 * Inicializa a navegação e os eventos de interface.
 */
function initUI() {
  // Navegação
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.section;
      if (section === 'admin') {
        // Redireciona para a área administrativa
        window.location.href = 'admin/index.html';
        return;
      }
      renderSection(section);
      highlightNav(btn);
    });
  });
  // Tema
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', toggleTheme);
  // Modal
  document.getElementById('closeModal').addEventListener('click', closeModal);
  // Fecha modal ao clicar fora
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target.id === 'modal') closeModal();
  });
  // Aplica tema salvo
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) applyTheme(savedTheme);
}

/**
 * Destaque visual para o item de navegação ativo.
 * @param {HTMLElement} btn
 */
function highlightNav(btn) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.remove('active');
  });
  btn.classList.add('active');
}

/**
 * Renderiza a seção solicitada.
 * @param {String} section
 */
function renderSection(section) {
  const container = document.getElementById('content');
  container.innerHTML = '';
  switch (section) {
    case 'devotionals':
      renderDevotionals(container);
      break;
    case 'studies':
      renderStudies(container);
      break;
    case 'versions':
      renderVersions(container);
      break;
    case 'outlines':
      renderOutlines(container);
      break;
    case 'themes':
      renderThemes(container);
      break;
    default:
      renderHome(container);
  }
}

function renderHome(container) {
  const welcome = document.createElement('div');
  welcome.className = 'welcome';
  welcome.innerHTML = `
    <h2>Bem-vindo ao App Bíblico Premium</h2>
    <p>Escolha uma categoria acima para começar. As seções são carregadas dinamicamente e o app é totalmente expansível.</p>
  `;
  container.appendChild(welcome);
}

function renderDevotionals(container) {
  const list = document.createElement('div');
  list.className = 'card-list';
  // Ordena por data decrescente
  const sorted = [...state.data.devotionals].sort((a, b) => new Date(b.date) - new Date(a.date));
  sorted.forEach(item => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${item.title}</h3>
      <span class="card-meta">${formatDate(item.date)} • ${item.verses}</span>
      <p>${truncate(item.content, 100)}</p>
    `;
    card.addEventListener('click', () => openModalDevotional(item));
    list.appendChild(card);
  });
  container.appendChild(list);
}

function renderStudies(container) {
  const list = document.createElement('div');
  list.className = 'card-list';
  state.data.studies.forEach(item => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${item.title}</h3>
      <span class="card-meta">${item.description}</span>
      <p>${truncate(item.content, 100)}</p>
    `;
    card.addEventListener('click', () => openModalStudy(item));
    list.appendChild(card);
  });
  container.appendChild(list);
}

function renderVersions(container) {
  const list = document.createElement('div');
  list.className = 'card-list';
  state.data.versions.forEach(item => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${item.name}</h3>
      <p>${item.description}</p>
    `;
    card.addEventListener('click', () => openVersion(item));
    list.appendChild(card);
  });
  container.appendChild(list);
}

function renderOutlines(container) {
  const list = document.createElement('div');
  list.className = 'card-list';
  state.data.outlines.forEach(item => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.points.join(', ')}</p>
      <span class="card-meta">${item.verses}</span>
    `;
    card.addEventListener('click', () => openModalOutline(item));
    list.appendChild(card);
  });
  container.appendChild(list);
}

function renderThemes(container) {
  const list = document.createElement('div');
  list.className = 'card-list';
  state.data.themes.forEach(item => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.description}</p>
    `;
    card.addEventListener('click', () => {
      // Filtro: ao clicar em um tema, mostra devocionais/estudos relacionados
      showThemeContent(item);
    });
    list.appendChild(card);
  });
  container.appendChild(list);
}

/**
 * Abre modal com conteúdo de devocional.
 */
function openModalDevotional(item) {
  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <h2>${item.title}</h2>
    <p class="modal-meta">${formatDate(item.date)} • ${item.verses}</p>
    <p>${item.content}</p>
  `;
  openModal();
}

function openModalStudy(item) {
  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <h2>${item.title}</h2>
    <p class="modal-meta">${item.description}</p>
    <p>${item.content}</p>
  `;
  openModal();
}

function openModalOutline(item) {
  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <h2>${item.title}</h2>
    <p class="modal-meta">${item.verses}</p>
    <ul>
      ${item.points.map(p => `<li>${p}</li>`).join('')}
    </ul>
  `;
  openModal();
}

/**
 * Mostra conteúdo de um tema filtrando devocionais e estudos relacionados.
 * Atualmente, apenas exibe uma listagem de itens associados ao tema.
 */
function showThemeContent(theme) {
  const container = document.getElementById('content');
  container.innerHTML = '';
  const heading = document.createElement('h2');
  heading.textContent = `Tema: ${theme.title}`;
  container.appendChild(heading);
  // Filtra devocionais e estudos cujos títulos ou descrições contêm o tema (simplificação)
  const devos = state.data.devotionals.filter(d => d.title.toLowerCase().includes(theme.title.toLowerCase()));
  const stud = state.data.studies.filter(s => s.title.toLowerCase().includes(theme.title.toLowerCase()));
  if (devos.length) {
    const sub = document.createElement('h3');
    sub.textContent = 'Devocionais';
    container.appendChild(sub);
    devos.forEach(item => {
      const link = document.createElement('button');
      link.className = 'link-item';
      link.textContent = item.title;
      link.addEventListener('click', () => openModalDevotional(item));
      container.appendChild(link);
    });
  }
  if (stud.length) {
    const sub = document.createElement('h3');
    sub.textContent = 'Estudos';
    container.appendChild(sub);
    stud.forEach(item => {
      const link = document.createElement('button');
      link.className = 'link-item';
      link.textContent = item.title;
      link.addEventListener('click', () => openModalStudy(item));
      container.appendChild(link);
    });
  }
  if (!devos.length && !stud.length) {
    const p = document.createElement('p');
    p.textContent = 'Não há conteúdo associado a este tema.';
    container.appendChild(p);
  }
}

/**
 * Abre modal genérico.
 */
function openModal() {
  document.getElementById('modal').classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.body.classList.remove('modal-open');
}

/**
 * Tratamento de versões: alert informando ao usuário que este recurso é para leitura futura.
 */
function openVersion(item) {
  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <h2>${item.name}</h2>
    <p>${item.description}</p>
    <p>Recurso de leitura de versões será implementado em futuras expansões. Por enquanto, consulte a sua Bíblia física ou outro aplicativo para leitura completa.</p>
  `;
  openModal();
}

/**
 * Converte data ISO para formato legível em português.
 * @param {String} isoDate
 */
function formatDate(isoDate) {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (_) {
    return isoDate;
  }
}

/**
 * Trunca uma string sem cortar palavras.
 */
function truncate(text, length) {
  if (text.length <= length) return text;
  const truncated = text.slice(0, length);
  return truncated.slice(0, truncated.lastIndexOf(' ')) + '…';
}

/**
 * Alterna o tema (claro/escuro).
 */
function toggleTheme() {
  const current = document.documentElement.dataset.theme || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
  localStorage.setItem('theme', next);
}

/**
 * Aplica o tema definido e ajusta ícones.
 */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const sun = document.getElementById('sunIcon');
  const moon = document.getElementById('moonIcon');
  if (theme === 'dark') {
    sun.style.display = 'none';
    moon.style.display = 'block';
  } else {
    sun.style.display = 'block';
    moon.style.display = 'none';
  }
}

// Inicialização
window.addEventListener('DOMContentLoaded', async () => {
  await loadManifest();
  await loadModules();
  initUI();
  // Renderiza página inicial (devocionais como padrão)
  renderSection('devotionals');
  // Marca item ativo
  const firstBtn = document.querySelector('.nav-item[data-section="devotionals"]');
  if (firstBtn) highlightNav(firstBtn);
});
