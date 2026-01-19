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
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('modName').value.trim();
    const version = document.getElementById('modVersion').value.trim();
    const jsonText = document.getElementById('modJSON').value.trim();
    if (!name || !version || !jsonText) return;
    let content;
    try {
      content = JSON.parse(jsonText);
    } catch (err) {
      alert('JSON inválido. Por favor, verifique a sintaxe.');
      return;
    }
    // Gera id baseado no nome
    const idBase = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const id = `custom_${idBase}`;
    // Salva conteúdo no localStorage
    saveCustomModule(id, content);
    // Adiciona módulo ao manifest override
    const override = getManifestOverride() || { modules: [] };
    override.modules.push({ id, name, file: `${id}.json`, version, enabled: false });
    saveManifestOverride(override);
    // Limpa formulário
    form.reset();
    // Atualiza lista
    renderModules();
    alert('Módulo adicionado localmente. Não esqueça de exportar o JSON e o manifesto.');
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
