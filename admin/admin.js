/*
 * Painel administrativo do App Bíblico Premium
 *
 * Este script controla a autenticação local, a visualização dos módulos (DLCs)
 * definidos no manifesto, permite ativá‑los/desativá‑los e criar novos
 * módulos personalizados usando localStorage. Ele também oferece a opção de
 * exportar o manifesto atualizado para integração manual ao projeto.
 */

const defaultCredentials = { username: 'admin', password: 'admin123' };

// Elementos da interface
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const adminPanel = document.getElementById('adminPanel');
const modulesBody = document.getElementById('modulesBody');

// Carrega e renderiza manifesto
async function loadManifest() {
  // Obtém manifesto original
  let manifest;
  try {
    const res = await fetch('../content/manifest.json');
    manifest = await res.json();
  } catch (err) {
    console.error('Erro ao carregar manifesto original:', err);
    manifest = { modules: [] };
  }
  // Aplica overrides salvos no localStorage
  const override = getManifestOverride();
  if (override) {
    // Mescla base e overrides: para cada módulo do base, verifica se há override
    manifest.modules = manifest.modules.map(mod => {
      const found = override.modules.find(o => o.id === mod.id);
      return found ? { ...mod, enabled: found.enabled } : mod;
    });
    // Adiciona módulos personalizados
    override.modules.forEach(o => {
      if (!manifest.modules.find(m => m.id === o.id)) {
        manifest.modules.push(o);
      }
    });
  }
  return manifest;
}

/** Recupera manifesto override salvo no localStorage */
function getManifestOverride() {
  const str = localStorage.getItem('manifestOverride');
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

/** Salva manifesto override */
function saveManifestOverride(manifest) {
  localStorage.setItem('manifestOverride', JSON.stringify(manifest));
}

/** Recupera conteúdo do módulo personalizado */
function getCustomModuleContent(id) {
  const str = localStorage.getItem(`customModule_${id}`);
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

/** Armazena módulo personalizado */
function saveCustomModule(id, content) {
  localStorage.setItem(`customModule_${id}`, JSON.stringify(content));
}

/** Renderiza tabela de módulos */
async function renderModules() {
  const manifest = await loadManifest();
  modulesBody.innerHTML = '';
  manifest.modules.forEach(mod => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${mod.name}</td>
      <td>${mod.version}</td>
      <td></td>
    `;
    // Toggle
    const td = row.querySelector('td:last-child');
    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = mod.enabled;
    toggle.addEventListener('change', () => {
      updateModuleEnabled(mod.id, toggle.checked);
    });
    td.appendChild(toggle);
    // Se módulo personalizado, adiciona botão exportar
    if (mod.id.startsWith('custom_')) {
      const actionTd = document.createElement('td');
      const exportBtn = document.createElement('button');
      exportBtn.textContent = 'Exportar JSON';
      exportBtn.className = 'small-btn';
      exportBtn.addEventListener('click', () => exportCustomModule(mod.id));
      actionTd.appendChild(exportBtn);
      row.appendChild(actionTd);
    } else {
      const dummy = document.createElement('td');
      row.appendChild(dummy);
    }
    modulesBody.appendChild(row);
  });
}

/** Atualiza status de habilitação de um módulo e salva override */
function updateModuleEnabled(id, enabled) {
  const override = getManifestOverride() || { modules: [] };
  const found = override.modules.find(m => m.id === id);
  if (found) {
    found.enabled = enabled;
  } else {
    override.modules.push({ id, enabled });
  }
  saveManifestOverride(override);
}

/**
 * Atualiza os campos do formulário de acordo com o tipo selecionado.
 * Esta função cria os inputs dinamicamente no contêiner #itemFields.
 * @param {String} type
 */
function updateItemFields(type) {
  const container = document.getElementById('itemFields');
  container.innerHTML = '';
  if (!type) return;
  // Helper para criar campo
  function createInput(id, label, typeInput = 'text', placeholder = '') {
    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.textContent = label;
    const input = document.createElement('input');
    input.id = id;
    input.type = typeInput;
    if (placeholder) input.placeholder = placeholder;
    container.appendChild(labelEl);
    container.appendChild(input);
  }
  function createTextarea(id, label, placeholder = '', rows = 4) {
    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.textContent = label;
    const textarea = document.createElement('textarea');
    textarea.id = id;
    textarea.rows = rows;
    textarea.placeholder = placeholder;
    container.appendChild(labelEl);
    container.appendChild(textarea);
  }
  switch (type) {
    case 'devotional':
      createInput('fieldTitle', 'Título');
      createInput('fieldDate', 'Data (AAAA-MM-DD)', 'date');
      createInput('fieldVerses', 'Referência (versículos)', 'text');
      createTextarea('fieldContent', 'Texto do Devocional', 'Escreva o conteúdo aqui...', 5);
      break;
    case 'study':
      createInput('fieldTitle', 'Título');
      createTextarea('fieldDescription', 'Descrição', 'Breve resumo...', 3);
      createTextarea('fieldContent', 'Conteúdo', 'Escreva o estudo completo...', 6);
      break;
    case 'outline':
      createInput('fieldTitle', 'Título');
      createTextarea('fieldPoints', 'Pontos (separe com nova linha ou ponto e vírgula)', 'Ex.: Introdução; Corpo; Conclusão', 4);
      createInput('fieldVerses', 'Referência Bíblica', 'text');
      break;
    case 'theme':
      createInput('fieldTitle', 'Título');
      createTextarea('fieldDescription', 'Descrição', 'Descreva o tema...', 3);
      break;
    case 'version':
      createInput('fieldVersionId', 'ID (sigla)');
      createInput('fieldVersionName', 'Nome da Versão');
      createTextarea('fieldVersionDesc', 'Descrição da Versão', 'Ex.: Tradução moderna...', 3);
      createTextarea('fieldBooks', 'Livros (JSON)', 'Cole o array de livros em formato JSON... Ex.: [{"id":"gn","name":"Gênesis","chapters":[{"number":1,"text":"..."}]}]', 8);
      break;
  }
}

/** Exporta o manifesto mesclado para download */
async function exportManifest() {
  const manifest = await loadManifest();
  const json = JSON.stringify(manifest, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.getElementById('downloadLink');
  link.href = url;
  link.download = 'manifest.json';
  link.click();
  // Libera URL
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Exporta conteúdo JSON de um módulo personalizado */
function exportCustomModule(id) {
  const content = getCustomModuleContent(id);
  if (!content) return;
  const json = JSON.stringify(content, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const tempLink = document.createElement('a');
  tempLink.href = url;
  tempLink.download = `${id}.json`;
  tempLink.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Trata envio do formulário de adição de módulo */
function handleAddModuleForm() {
  const form = document.getElementById('addModuleForm');
  const typeSelect = document.getElementById('itemType');
  const fieldsContainer = document.getElementById('itemFields');
  // Atualiza campos quando o tipo muda
  typeSelect.addEventListener('change', () => {
    updateItemFields(typeSelect.value);
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const type = typeSelect.value;
    if (!type) return;
    // Monta objeto de conteúdo baseado no tipo
    const timestamp = Date.now();
    let moduleId = `custom_${type}_${timestamp}`;
    let moduleName = '';
    let content = {
      name: 'Conteúdo Personalizado',
      version: '1.0',
      enabled: true,
      sections: {}
    };
    if (type === 'devotional') {
      const title = document.getElementById('fieldTitle').value.trim();
      const date = document.getElementById('fieldDate').value.trim();
      const verses = document.getElementById('fieldVerses').value.trim();
      const text = document.getElementById('fieldContent').value.trim();
      if (!title || !date || !verses || !text) return;
      moduleName = `Devocional: ${title}`;
      content.sections.devotionals = [
        {
          id: moduleId,
          title: title,
          date: date,
          verses: verses,
          content: text
        }
      ];
    } else if (type === 'study') {
      const title = document.getElementById('fieldTitle').value.trim();
      const desc = document.getElementById('fieldDescription').value.trim();
      const text = document.getElementById('fieldContent').value.trim();
      if (!title || !desc || !text) return;
      moduleName = `Estudo: ${title}`;
      content.sections.studies = [
        {
          id: moduleId,
          title: title,
          description: desc,
          content: text
        }
      ];
    } else if (type === 'outline') {
      const title = document.getElementById('fieldTitle').value.trim();
      const pointsRaw = document.getElementById('fieldPoints').value.trim();
      const verses = document.getElementById('fieldVerses').value.trim();
      if (!title || !pointsRaw || !verses) return;
      const points = pointsRaw.split(/\n|;/).map(p => p.trim()).filter(Boolean);
      moduleName = `Esboço: ${title}`;
      content.sections.outlines = [
        {
          id: moduleId,
          title: title,
          points: points,
          verses: verses
        }
      ];
    } else if (type === 'theme') {
      const title = document.getElementById('fieldTitle').value.trim();
      const desc = document.getElementById('fieldDescription').value.trim();
      if (!title || !desc) return;
      moduleName = `Tema: ${title}`;
      content.sections.themes = [
        {
          id: moduleId,
          title: title,
          description: desc
        }
      ];
    } else if (type === 'version') {
      const vid = document.getElementById('fieldVersionId').value.trim();
      const vname = document.getElementById('fieldVersionName').value.trim();
      const vdesc = document.getElementById('fieldVersionDesc').value.trim();
      const booksJson = document.getElementById('fieldBooks').value.trim();
      if (!vid || !vname || !booksJson) return;
      let books;
      try {
        books = JSON.parse(booksJson);
      } catch (err) {
        alert('JSON de livros inválido.');
        return;
      }
      moduleId = `custom_version_${vid}_${timestamp}`;
      moduleName = `Versão: ${vname}`;
      content.sections.versions = [
        {
          id: vid,
          name: vname,
          description: vdesc,
          books: books
        }
      ];
    }
    // Salva conteúdo no localStorage
    saveCustomModule(moduleId, content);
    // Atualiza manifest override
    const override = getManifestOverride() || { modules: [] };
    override.modules.push({ id: moduleId, name: moduleName, file: `${moduleId}.json`, version: '1.0', enabled: true });
    saveManifestOverride(override);
    // Reseta formulário
    form.reset();
    fieldsContainer.innerHTML = '';
    // Atualiza lista de módulos
    renderModules();
    alert('Conteúdo adicionado localmente. Exporte o manifesto e o JSON para integrá-los ao projeto.');
  });
}

/** Inicializa login e painel */
function initAuth() {
  // Verifica se usuário já está logado
  if (localStorage.getItem('adminLoggedIn') === 'true') {
    showAdminPanel();
  } else {
    showLoginForm();
  }
  // Login
  document.getElementById('login').addEventListener('submit', e => {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    if (user === defaultCredentials.username && pass === defaultCredentials.password) {
      localStorage.setItem('adminLoggedIn', 'true');
      showAdminPanel();
    } else {
      loginMessage.textContent = 'Credenciais inválidas';
    }
  });
  // Logout
  document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('adminLoggedIn');
    location.reload();
  });
  // Voltar ao app
  document.getElementById('backHome').addEventListener('click', () => {
    window.location.href = '../index.html';
  });
  // Exporta manifesto
  document.getElementById('exportButton').addEventListener('click', exportManifest);
  // Adicionar módulo
  handleAddModuleForm();
}

function showLoginForm() {
  loginForm.classList.remove('hidden');
  adminPanel.classList.add('hidden');
}

function showAdminPanel() {
  loginForm.classList.add('hidden');
  adminPanel.classList.remove('hidden');
  // Carrega módulos na tabela
  renderModules();
}

// Inicialização
window.addEventListener('DOMContentLoaded', initAuth);
