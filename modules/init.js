// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
  checkPin();
  populateSegmentDropdowns(); // Poblar dropdowns antes de cargar datos que puedan depender de ellos
  const migrationResult = tryAutoMigrate();
  loadAllData();

  updateDate();
  renderAllFull();
  renderTemplateList();
  renderCampaigns();
  renderDashboardCharts();
  renderRecentActivity();
  renderTopLeads();
  renderTodayPanel();
  renderSearchHistory();
  updateStorageInfo();

  // Mostrar banner de migración automática si hubo volcado
  if (migrationResult && typeof migrationResult === 'object' && migrationResult.leads > 0) {
    setTimeout(() => showMigrationBanner(migrationResult), 600);
  }

  const leadForm = document.getElementById('lead-form');
  if (leadForm) leadForm.addEventListener('submit', e => { e.preventDefault(); saveLead(); });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    // 1. Teclas con modificadores (Ctrl/Alt)
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'k') { e.preventDefault(); openGlobalSearch(); return; }
    }
    
    if (e.altKey) {
      if (e.key === 'l') { e.preventDefault(); showView('leads'); return; }
      if (e.key === 'd') { e.preventDefault(); showView('dashboard'); return; }
      if (e.key === 's') { e.preventDefault(); showView('settings'); return; }
      if (e.key === 'i' && typeof aiCurrentLeadId !== 'undefined' && aiCurrentLeadId) { 
        e.preventDefault(); openAiEmailModal(aiCurrentLeadId); return; 
      }
    }

    // 2. Teclas simples (Solo si no estamos escribiendo)
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

    if (e.key === 'Escape') {
      closeGlobalSearch();
      // Cerrar paneles laterales de leads (si están abiertos)
      if (typeof closeLeadSidePanel === 'function') closeLeadSidePanel();
      closeLead(); closeAiModal(); closeCampaignModal(); closeObjectivesModal();
      document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
      return;
    }

    // Atajos de navegación rápida
    const navMap = {
      'n': () => { showView('leads'); toggleLeadForm(); },
      'f': () => { openFocusMode(); },
      'b': () => { showView('planner'); },
      'd': () => { showView('dashboard'); },
      'k': () => { showView('kanban'); },
      's': () => { showView('settings'); }
    };

    if (navMap[e.key]) {
      e.preventDefault();
      navMap[e.key]();
    }
  });

  // Tutorial solo si es instalación completamente nueva (sin datos y sin migración)
  if (!localStorage.getItem('gordi_tutorial_done') && leads.length === 0 && !migrationResult) {
    setTimeout(() => showTutorial(), 800);
  } else {
    // Si no es instalación nueva, comprobar si hay actualización de versión
    const lastVersion = localStorage.getItem('_voltflow_last_version');
    if (lastVersion && lastVersion !== VOLTFLOW_VERSION) {
      setTimeout(() => showWhatsNewModal(lastVersion, VOLTFLOW_VERSION), 1000);
    }
  }

  // Apply saved theme
  if (localStorage.getItem('gordi_light_mode') === '1') applyLightMode(true);

  // Apply font scale
  const scale = localStorage.getItem('gordi_font_scale');
  if (scale) setFontSize(scale, true);

  // Auto backup weekly
  autoWeeklyBackup();

  // Purgar cachés de enriquecimiento caducadas (>7 días)
  purgeStaleCaches();

  // MEJORA: Sistema de Actualizaciones Automático via version.json
  checkUpdates();

  // Auto-pull JSONBin al iniciar si está habilitado
  if (localStorage.getItem('gordi_jsonbin_auto') === 'true') {
    setTimeout(() => {
      if (typeof jsonbinPull === 'function') jsonbinPull(false);
    }, 1000); // 1s delay para asegurar que renderAllFull ya terminó y se evita race condition visual
  }
});


// ─── MIGRACIÓN AUTOMÁTICA DE DATOS ENTRE VERSIONES ───────────────────────────
// Todas las versiones de Voltflow comparten el mismo localStorage en file://
// Al arrancar por primera vez esta versión, se vuelcan todos los datos automáticamente.

let VOLTFLOW_VERSION = '2.1.0'; // Fallback
let VOLTFLOW_CHANGELOG = [];

// ══════════════════════════════════════════════════════════════════════════
// ⚡ PERFORMANCE SYSTEM — debounce renders, smart batching, pagination
// ══════════════════════════════════════════════════════════════════════════

// Debounce timers
const _renderTimers = {};
function debouncedRender(key, fn, delay) {
  if (_renderTimers[key]) clearTimeout(_renderTimers[key]);
  _renderTimers[key] = setTimeout(() => { delete _renderTimers[key]; fn(); }, delay || 60);
}

// Batch multiple render requests — only executes once per animation frame
const _pendingRenders = new Set();
let   _rafScheduled   = false;
function scheduleRender(key) {
  _pendingRenders.add(key);
  if (!_rafScheduled) {
    _rafScheduled = true;
    requestAnimationFrame(() => {
      _rafScheduled = false;
      const toRun = new Set(_pendingRenders);
      _pendingRenders.clear();
      if (toRun.has('leads'))    renderLeads();
      if (toRun.has('kanban'))   renderKanban();
      if (toRun.has('stats'))    updateStats();
      if (toRun.has('tracking')) renderTracking();
      if (toRun.has('charts'))   { try { renderDashboardCharts(); } catch(e){} }
    });
  }
}

// Smart batch: replaces renderLeads();renderKanban();updateStats() pattern
function renderAll() {
  scheduleRender('leads');
  scheduleRender('kanban');
  scheduleRender('stats');
}
function renderAllFull() {
  scheduleRender('leads');
  scheduleRender('kanban');
  scheduleRender('stats');
  scheduleRender('tracking');
}

// Pagination for leads table
const LEADS_PAGE_SIZE = 50;
let   leadsPage = 0;

// Single-row update — update only the changed row without full re-render
function updateLeadRow(leadId) {
  const tbody = document.getElementById('leads-body');
  if (!tbody) return false;
  const existingRow = tbody.querySelector(`tr[data-lead-id="${leadId}"]`);
  if (!existingRow) return false; // row not visible, skip
  // Just re-render this lead's row by doing a targeted replace
  const lead = leads.find(l => l.id == leadId);
  if (!lead) { existingRow.remove(); return true; }
  // Trigger a lightweight status color update only
  const bc = lead.score >= 70 ? 'badge-high' : (lead.score >= 40 ? 'badge-mid' : 'badge-low');
  const sc = (lead.status || 'pendiente').toLowerCase().replace(/ /g, '-');
  const scoreEl  = existingRow.querySelector('.score-badge');
  const statusEl = existingRow.querySelector('[class^="status-"]');
  if (scoreEl)  { scoreEl.className = `score-badge ${bc}`; scoreEl.textContent = lead.score; }
  if (statusEl) { statusEl.className = `status-${sc}`; statusEl.querySelector('.status-dot') || (statusEl.innerHTML = `<span class="status-dot"></span>${lead.status}`); }
  return true;
}
const VOLTFLOW_DATA_KEYS = [
  'gordi_leads', 'gordi_email_history', 'gordi_campaigns',
  'gordi_objectives', 'gordi_search_history', 'gordi_templates',
  'gordi_api_key', 'gordi_hunter_key', 'gordi_apollo_key',
  'gordi_claude_key',
  'gordi_groq_key', 'gordi_openrouter_key',
  'gordi_user_name', 'gordi_user_email', 'gordi_user_company',
  'gordi_user_phone', 'gordi_user_web', 'gordi_user_logo',
  'gordi_sender_name', 'gordi_sender_email',
  'gordi_sheets_id', 'gordi_sheets_client_id', 'gordi_sheets_token',
  'gordi_pin', 'gordi_streak', 'gordi_tutorial_done',
  'gordi_light_mode', 'gordi_font_scale',
  // ── GitHub sync ──────────────────────────────────────────────────────
  'gordi_gh_token', 'gordi_gh_user', 'gordi_gh_repo', 'gordi_gh_auto',
];

function exportDataSnapshot() {
  const snapshot = { _voltflow_version: VOLTFLOW_VERSION, _exported: new Date().toISOString() };
  for (const key of VOLTFLOW_DATA_KEYS) {
    const val = localStorage.getItem(key);
    if (val !== null) snapshot[key] = val;
  }
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('gordi_ecache_')) snapshot[k] = localStorage.getItem(k);
  }
  return snapshot;
}

function importDataSnapshot(snapshot, overwrite = false) {
  let imported = 0;
  for (const [key, val] of Object.entries(snapshot)) {
    if (key.startsWith('_')) continue;
    if (!overwrite && localStorage.getItem(key) !== null) continue;
    localStorage.setItem(key, val);
    imported++;
  }
  return imported;
}

// Detecta si esta versión concreta se abre por primera vez en este navegador
// Si hay datos de versiones anteriores en el mismo localStorage, los vuelca todo automáticamente.
function tryAutoMigrate() {
  const thisVersionKey = `_voltflow_opened_${VOLTFLOW_VERSION}`;

  // Si ya se abrió esta versión antes → no hacer nada
  if (localStorage.getItem(thisVersionKey)) return false;

  // Primera vez que se abre esta versión → marcarla
  localStorage.setItem(thisVersionKey, Date.now().toString());

  // Contar datos disponibles en el localStorage (dejados por versiones anteriores)
  const existingLeads   = (() => { try { return JSON.parse(localStorage.getItem('gordi_leads') || '[]'); } catch { return []; } })();
  const existingHistory = (() => { try { return JSON.parse(localStorage.getItem('gordi_email_history') || '[]'); } catch { return []; } })();
  const existingCamps   = (() => { try { return JSON.parse(localStorage.getItem('gordi_campaigns') || '[]'); } catch { return []; } })();
  const hasApiKeys      = !!(localStorage.getItem('gordi_api_key') || localStorage.getItem('gordi_gemini_key') || localStorage.getItem('gordi_hunter_key'));
  const hasProfile      = !!localStorage.getItem('gordi_user_name');

  // Si no hay ningún dato previo → primera instalación, nada que migrar
  if (!existingLeads.length && !hasApiKeys && !hasProfile) return false;

  // Hay datos → volcado automático completo (ya están en localStorage, solo necesitamos cargarlos en memoria)
  // Guardar un registro de la migración para mostrarlo
  const migrationLog = {
    date: new Date().toISOString(),
    leads: existingLeads.length,
    emails: existingHistory.length,
    campaigns: existingCamps.length,
    hasApiKeys,
    hasProfile,
    fromVersion: localStorage.getItem('_voltflow_last_version') || 'anterior'
  };
  localStorage.setItem('_voltflow_last_migration', JSON.stringify(migrationLog));
  localStorage.setItem('_voltflow_last_version', VOLTFLOW_VERSION);

  return migrationLog;
}

function loadAllData() {
  try { leads = JSON.parse(localStorage.getItem('gordi_leads')) || []; } catch { leads = []; }
  try { emailHistory = JSON.parse(localStorage.getItem('gordi_email_history')) || []; } catch { emailHistory = []; }
  try { campaigns = JSON.parse(localStorage.getItem('gordi_campaigns')) || []; } catch { campaigns = []; }
  try { objectives = JSON.parse(localStorage.getItem('gordi_objectives')) || { leads: 20, emails: 10, replies: 3 }; } catch { objectives = { leads: 20, emails: 10, replies: 3 }; }
  try { searchHistoryList = JSON.parse(localStorage.getItem('gordi_search_history')) || []; } catch { searchHistoryList = []; }
  try {
    const saved = JSON.parse(localStorage.getItem('gordi_templates'));
    emailTemplates = saved ? { ...defaultTemplates, ...saved } : { ...defaultTemplates };
  } catch { emailTemplates = { ...defaultTemplates }; }

  // Cargar keys y perfil
  const apiKey = localStorage.getItem('gordi_api_key');
  const hunterKey = localStorage.getItem('gordi_hunter_key');
  const el = id => document.getElementById(id);

  const profile = {
    name: localStorage.getItem('gordi_user_name') || 'Héctor Alfredo Salazar',
    email: localStorage.getItem('gordi_user_email') || 'hector@voltiummadrid.es',
    company: localStorage.getItem('gordi_user_company') || 'Voltium Madrid',
    phone: localStorage.getItem('gordi_user_phone') || '',
    web: localStorage.getItem('gordi_user_web') || 'https://www.voltiummadrid.es',
    logo: localStorage.getItem('gordi_user_logo') || ''
  };

  if (el('user-name-input')) el('user-name-input').value = profile.name;
  if (el('user-email-input')) el('user-email-input').value = profile.email;
  if (el('user-company-input')) el('user-company-input').value = profile.company;
  if (el('user-phone-input')) el('user-phone-input').value = profile.phone;
  if (el('user-web-input')) el('user-web-input').value = profile.web;
  if (el('user-logo-input')) el('user-logo-input').value = profile.logo;

  if (apiKey && el('api-key-input')) {
    el('api-key-input').value = apiKey;
    el('api-key-status').innerHTML = '<span style="color:var(--success)">✅ API Key guardada</span>';
    loadGoogleMapsScript(apiKey);
  }
  if (hunterKey && el('hunter-key-input')) {
    el('hunter-key-input').value = hunterKey;
    el('hunter-key-status').innerHTML = '<span style="color:var(--success)">✅ Hunter Key guardada</span>';
  }
  const _ssid = localStorage.getItem('gordi_sheets_id');
  const _scid = localStorage.getItem('gordi_sheets_client_id');
  const _stok = localStorage.getItem('gordi_sheets_token');
  if (_ssid && el('sheets-id-input'))     el('sheets-id-input').value     = _ssid;
  if (_scid && el('sheets-client-input')) el('sheets-client-input').value = _scid;
  if (_stok && el('sheets-token-input'))  el('sheets-token-input').value  = _stok;

  const claudeKey = localStorage.getItem('gordi_claude_key');
  if (claudeKey && el('claude-key-input')) {
    el('claude-key-input').value = claudeKey;
    el('claude-key-status').innerHTML = '<span style="color:var(--success)">✅ Gemini Key guardada</span>';
  }
  const groqKey = localStorage.getItem('gordi_groq_key');
  if (groqKey && el('groq-key-input')) {
    el('groq-key-input').value = groqKey;
    el('groq-key-status').innerHTML = '<span style="color:var(--success)">✅ Groq Key guardada</span>';
  }
  const openrouterKey = localStorage.getItem('gordi_openrouter_key');
  if (openrouterKey && el('openrouter-key-input')) {
    el('openrouter-key-input').value = openrouterKey;
    el('openrouter-key-status').innerHTML = '<span style="color:var(--success)">✅ OpenRouter Key guardada</span>';
  }
  // Mostrar estado del router IA
  setTimeout(refreshAiRouterStatus, 100);
  const apolloKey = localStorage.getItem('gordi_apollo_key');
  if (apolloKey && el('apollo-key-input')) {
    el('apollo-key-input').value = apolloKey;
    el('apollo-key-status').innerHTML = '<span style="color:var(--success)">✅ Apollo Key guardada</span>';
  }
  // JSONBin
  const jbKey = localStorage.getItem('gordi_jsonbin_key');
  const jbBin = localStorage.getItem('gordi_jsonbin_bin');
  if (jbKey && el('jsonbin-key-input')) {
    el('jsonbin-key-input').value = jbKey;
    if (jbBin && el('jsonbin-bin-input')) el('jsonbin-bin-input').value = jbBin;
    jsonbinActivateUI();
  }
  const jbAuto = localStorage.getItem('gordi_jsonbin_auto') === 'true';
  if (el('jsonbin-auto-toggle')) el('jsonbin-auto-toggle').checked = jbAuto;
}

function updateDate() {
  const el = document.getElementById('current-date');
  if (el) el.innerText = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

// ============ NAVEGACIÓN ============


// ══════════════════════════════════════════════════════════════════════════
// ██  MÓDULO: UI
// ──  Renderizado, vistas, modales, drawer y componentes visuales
// ──  Funciones: showView, showToast, setProgress, logEnrich, updateEnrichStats,
  //          renderLeads, renderKanban, updateCard, openLeadDrawer, closeDrawer,
  //          openGlobalSearch, openVoiceModal, openScanModal, openFocusMode
// ══════════════════════════════════════════════════════════════════════════

function showView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(`${view}-view`);
  if (target) target.classList.add('active');
  document.querySelectorAll('aside nav li').forEach(li => {
    li.classList.toggle('active', li.getAttribute('data-view') === view);
  });
  if (view === 'kanban') renderKanban();
  if (view === 'dashboard') { renderDashboardCharts(); renderRecentActivity(); renderTopLeads(); }
}

function toggleLeadForm() {
  const panel = document.getElementById('lead-form-panel');
  const isOpening = panel.style.display === 'none' || panel.style.display === '';
  panel.style.display = isOpening ? 'block' : 'none';
  if (isOpening) {
    setTimeout(initLeadFormDatePicker, 50);
    restoreLeadFormDraft();
    startLeadFormAutosave();
  } else {
    stopLeadFormAutosave();
  }
}

// ============ PERFIL / FIRMA ============
function getProfile() {
  return {
    name: localStorage.getItem('gordi_user_name') || 'Héctor Alfredo Salazar',
    email: localStorage.getItem('gordi_user_email') || 'hector@voltiummadrid.es',
    company: localStorage.getItem('gordi_user_company') || 'Voltium Madrid',
    phone: localStorage.getItem('gordi_user_phone') || '',
    web: localStorage.getItem('gordi_user_web') || 'https://www.voltiummadrid.es',
    logo: localStorage.getItem('gordi_user_logo') || ''
  };
}

function buildFirmaText() {
  const p = getProfile();
  let firma = `\n--\n${p.name}`;
  if (p.company) firma += ` — ${p.company}`;
  if (p.phone) firma += `\nTel. ${p.phone}`;
  if (p.email) firma += `\n${p.email}`;
  if (p.web) firma += `\n${p.web}`;
  return firma;
}

function buildFirmaHTML() {
  const p = getProfile();
  let html = `<div style="font-family:Arial,sans-serif;margin-top:1.5rem;padding-top:1rem;border-top:1px solid #ddd;font-size:13px;color:#333">`;
  if (p.logo) html += `<img src="${p.logo}" alt="${p.company}" style="height:40px;margin-bottom:.5rem;display:block">`;
  html += `<strong>${p.name}</strong>`;
  if (p.company) html += ` &mdash; <strong>${p.company}</strong>`;
  if (p.phone) html += `<br>📞 ${p.phone}`;
  html += `<br>✉️ <a href="mailto:${p.email}">${p.email}</a>`;
  if (p.web) html += `<br>🌐 <a href="${p.web}" target="_blank">${p.web}</a>`;
  html += `</div>`;
  return html;
}

function saveProfile() {
  ['name','email','company','phone','web','logo'].forEach(k => {
    const el = document.getElementById(`user-${k}-input`);
    if (el) localStorage.setItem(`gordi_user_${k}`, el.value.trim());
  });
  document.getElementById('profile-status').innerHTML = '<span style="color:var(--success)">✅ Perfil actualizado</span>';
  setTimeout(() => document.getElementById('profile-status').innerHTML = '', 3000);
}

function previewFirma() {
  saveProfile();
  const box = document.getElementById('firma-preview');
  const content = document.getElementById('firma-preview-content');
  box.style.display = 'block';
  content.innerHTML = buildFirmaHTML();
}


// ══════════════════════════════════════════════════════════════════════════════
// ☁️  MÓDULO: JSONBin Sync — Sincronización multi-dispositivo
// ══════════════════════════════════════════════════════════════════════════════

const JSONBIN_API = 'https://api.jsonbin.io/v3';
let _jsonbinPushing = false;
let _jsonbinPullPending = false;

// ── Activar UI cuando hay key guardada ───────────────────────────────────────
function jsonbinActivateUI() {
  const badge   = document.getElementById('jsonbin-badge');
  const pushBtn = document.getElementById('btn-jsonbin-push');
  const pullBtn = document.getElementById('btn-jsonbin-pull');
  const testBtn = document.getElementById('btn-jsonbin-test');
  const autoRow = document.getElementById('jsonbin-auto-row');
  if (badge)   badge.style.display   = 'inline-block';
  if (pushBtn) pushBtn.style.display = 'inline-flex';
  if (pullBtn) pullBtn.style.display = 'inline-flex';
  if (testBtn) testBtn.style.display = 'inline-flex';
  if (autoRow) autoRow.style.display = 'flex';
}

function jsonbinSetStatus(msg, color) {
  const el = document.getElementById('jsonbin-status');
  if (el) el.innerHTML = `<span style="color:${color||'var(--text-dim)'}">${msg}</span>`;
}

// ── Guardar configuración ────────────────────────────────────────────────────
async function saveJsonBinConfig() {
  const key = document.getElementById('jsonbin-key-input')?.value.trim();
  if (!key || key.length < 10) {
    jsonbinSetStatus('⚠️ Introduce tu Master Key de JSONBin', 'var(--danger)');
    return;
  }
  localStorage.setItem('gordi_jsonbin_key', key);
  jsonbinSetStatus('⏳ Conectando con JSONBin...', 'var(--text-dim)');

  // Check if we already have a bin ID
  const existingBin = document.getElementById('jsonbin-bin-input')?.value.trim();
  if (existingBin) {
    localStorage.setItem('gordi_jsonbin_bin', existingBin);
    jsonbinActivateUI();
    jsonbinSetStatus('✅ Configuración guardada — bin existente vinculado', 'var(--success)');
    showToast('☁️ JSONBin configurado correctamente');
    return;
  }

  // Create a new bin with current data
  await jsonbinCreateBin(key);
}

// ── Crear bin nuevo ──────────────────────────────────────────────────────────
async function jsonbinCreateBin(key) {
  try {
    const snapshot = exportDataSnapshot();
    const res = await fetch(`${JSONBIN_API}/b`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': key,
        'X-Bin-Name': 'voltflow-data',
        'X-Bin-Private': 'true'
      },
      body: JSON.stringify({ voltflow: snapshot, _created: new Date().toISOString() })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const binId = data.metadata?.id;
    if (!binId) throw new Error('No bin ID returned');
    localStorage.setItem('gordi_jsonbin_bin', binId);
    const binInput = document.getElementById('jsonbin-bin-input');
    if (binInput) binInput.value = binId;
    jsonbinActivateUI();
    jsonbinSetStatus(`✅ Bin creado y datos subidos — ID: ${binId}`, 'var(--success)');
    showToast('☁️ JSONBin configurado — bin creado con tus datos actuales');
  } catch(e) {
    console.error('JSONBin create error:', e);
    jsonbinSetStatus(`❌ Error al crear bin: ${e.message} — comprueba tu Master Key`, 'var(--danger)');
  }
}

// ── Push (subir datos) ───────────────────────────────────────────────────────
async function jsonbinPush(showFeedback = true) {
  const key = localStorage.getItem('gordi_jsonbin_key');
  const binId = localStorage.getItem('gordi_jsonbin_bin');
  if (!key || !binId) {
    if (showFeedback) jsonbinSetStatus('⚠️ Configura primero la Master Key y crea un bin', 'var(--warning)');
    return;
  }
  if (_jsonbinPushing) return; // debounce
  _jsonbinPushing = true;

  if (showFeedback) jsonbinSetStatus('⏫ Subiendo datos...', 'var(--text-dim)');

  try {
    const snapshot = exportDataSnapshot();
    const res = await fetch(`${JSONBIN_API}/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': key
      },
      body: JSON.stringify({ voltflow: snapshot, _updated: new Date().toISOString() })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const now = new Date().toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' });
    localStorage.setItem('gordi_jsonbin_last_push', new Date().toISOString());
    if (showFeedback) {
      jsonbinSetStatus(`✅ Datos subidos correctamente — ${now}`, 'var(--success)');
      showToast('☁️ Datos sincronizados en la nube');
    }
  } catch(e) {
    console.error('JSONBin push error:', e);
    if (showFeedback) jsonbinSetStatus(`❌ Error al subir: ${e.message}`, 'var(--danger)');
  } finally {
    setTimeout(() => { _jsonbinPushing = false; }, 3000); // debounce 3s
  }
}

// ── Pull (descargar datos) ────────────────────────────────────────────────────
async function jsonbinPull(showFeedback = true) {
  const key = localStorage.getItem('gordi_jsonbin_key');
  const binId = localStorage.getItem('gordi_jsonbin_bin');
  if (!key || !binId) {
    if (showFeedback) jsonbinSetStatus('⚠️ Configura primero la Master Key', 'var(--warning)');
    return;
  }

  if (showFeedback) jsonbinSetStatus('⏬ Descargando datos...', 'var(--text-dim)');

  try {
    const res = await fetch(`${JSONBIN_API}/b/${binId}/latest`, {
      headers: { 'X-Master-Key': key }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const snapshot = data.record?.voltflow;
    if (!snapshot) throw new Error('Datos no encontrados en el bin');

    // Smart merge: solo importar si la nube es más reciente o tiene diferencias claras
    const cloudUpdated = data.record?._updated || data.record?._created || '';
    const lastPush = localStorage.getItem('gordi_jsonbin_last_push') || '';
    const cloudLeadCount = (() => {
      try { return JSON.parse(snapshot['gordi_leads'] || '[]').length; } catch { return 0; }
    })();
    const localLeadCount = leads.length;

    // Hash rápido: longitud del JSON local vs nube para detectar cambios reales sin parsear todo
    const cloudLeadsRaw  = snapshot['gordi_leads'] || '[]';
    const localLeadsRaw  = localStorage.getItem('gordi_leads') || '[]';
    const dataIsDifferent = cloudLeadsRaw.length !== localLeadsRaw.length;

    let isNewer = false;
    let shouldPull = false;

    if (cloudUpdated) {
      const cloudTime = new Date(cloudUpdated).getTime();
      const localTime = lastPush ? new Date(lastPush).getTime() : 0;
      // Añadimos buffer de 5s para evitar pull de algo que acabamos de pushear
      if (cloudTime > localTime + 5000) isNewer = true;
    }

    if (showFeedback) {
      if (cloudLeadCount !== localLeadCount || isNewer) {
        const confirmMsg = `¿Descargar datos de la nube?\n\nNube: ${cloudLeadCount} leads (actualizado: ${cloudUpdated ? new Date(cloudUpdated).toLocaleString('es-ES') : 'desconocido'})\nLocal: ${localLeadCount} leads\n\nEsto reemplazará tus datos locales.`;
        if (!confirm(confirmMsg)) {
          jsonbinSetStatus('Descarga cancelada por el usuario', 'var(--text-dim)');
          return;
        }
        shouldPull = true;
      } else {
        shouldPull = true; // El usuario pulsó el botón manualmente y no hay diff grave, hacemos pull
      }
    } else {
      // Descarga silenciosa (al arrancar): solo si la nube es realmente más reciente Y los datos difieren.
      // Evita render extra + pérdida de ediciones tempranas cuando counts son iguales pero la nube
      // tiene el mismo snapshot que acabamos de pushear hace menos de 5 s.
      if (isNewer && dataIsDifferent) {
        shouldPull = true;
      } else if (cloudLeadCount > localLeadCount && dataIsDifferent) {
        shouldPull = true;
      }
    }

    if (!shouldPull) {
      if (!showFeedback) console.log('JSONBin Pull omitido: los datos locales ya están actualizados.');
      return;
    }

    // Apply snapshot
    importDataSnapshot(snapshot, true);
    // Reload all data
    try { leads = JSON.parse(localStorage.getItem('gordi_leads') || '[]'); } catch { leads = []; }
    try { emailHistory = JSON.parse(localStorage.getItem('gordi_email_history') || '[]'); } catch { emailHistory = []; }
    try { campaigns = JSON.parse(localStorage.getItem('gordi_campaigns') || '[]'); } catch { campaigns = []; }

    renderAll();
    try { renderTracking(); } catch(e) {}
    try { renderDashboardCharts(); } catch(e) {}

    const now = new Date().toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' });
    if (showFeedback) {
      jsonbinSetStatus(`✅ Datos descargados — ${cloudLeadCount} leads · ${now}`, 'var(--success)');
      showToast(`☁️ ${cloudLeadCount} leads descargados desde la nube`);
    } else {
      // Silent pull on app start — show subtle toast only if data changed
      if (cloudLeadCount !== localLeadCount) {
        showToast(`☁️ Sync: ${cloudLeadCount} leads desde la nube`);
      }
    }
  } catch(e) {
    console.error('JSONBin pull error:', e);
    if (showFeedback) jsonbinSetStatus(`❌ Error al descargar: ${e.message}`, 'var(--danger)');
  }
}

// ── Test conexión ────────────────────────────────────────────────────────────
async function jsonbinTestConnection() {
  const key = localStorage.getItem('gordi_jsonbin_key');
  const binId = localStorage.getItem('gordi_jsonbin_bin');
  jsonbinSetStatus('🔌 Probando conexión...', 'var(--text-dim)');
  try {
    const res = await fetch(`${JSONBIN_API}/b/${binId}/latest`, {
      headers: { 'X-Master-Key': key }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const updated = data.record?._updated || data.record?._created || '';
    jsonbinSetStatus(
      `✅ Conexión OK — última actualización: ${updated ? new Date(updated).toLocaleString('es-ES') : 'desconocida'}`,
      'var(--success)'
    );
  } catch(e) {
    jsonbinSetStatus(`❌ Error de conexión: ${e.message}`, 'var(--danger)');
  }
}

// ── Toggle auto-sync ─────────────────────────────────────────────────────────
function updateCloudPill() {
  const pill = document.getElementById('cloud-sync-pill');
  const dot  = document.getElementById('cloud-sync-dot');
  const lbl  = document.getElementById('cloud-sync-label');
  if (!pill) return;
  const ghToken = localStorage.getItem('gordi_gh_token');
  const ghAuto  = localStorage.getItem('gordi_gh_auto') === 'true';
  if (ghToken) {
    pill.style.display = 'flex';
    dot.style.background = ghAuto ? 'var(--success)' : 'var(--warning,#f59e0b)';
    lbl.textContent = ghAuto ? '🐙 GitHub sync' : '🐙 Manual';
  } else {
    pill.style.display = 'none';
  }
}

function toggleJsonBinAuto(enabled) {
  localStorage.setItem('gordi_jsonbin_auto', enabled ? 'true' : 'false');
  updateCloudPill();
  if (enabled) {
    jsonbinSetStatus('✅ Sync automático activado — los datos se subirán al guardar y descargarán al abrir', 'var(--success)');
    showToast('☁️ Sincronización automática activada');
  } else {
    jsonbinSetStatus('Sync automático desactivado — usa los botones para sincronizar manualmente', 'var(--text-dim)');
  }
}

// ============ API KEYS ============
function saveApiKey() {
  const k = document.getElementById('api-key-input').value.trim();
  if (!k) return;
  localStorage.setItem('gordi_api_key', k);
  document.getElementById('api-key-status').innerHTML = '<span style="color:var(--success)">✅ Guardada. Recarga (F5) para activar.</span>';
  loadGoogleMapsScript(k);
}
function saveHunterKey() {
  const k = document.getElementById('hunter-key-input').value.trim();
  if (!k) return;
  localStorage.setItem('gordi_hunter_key', k);
  document.getElementById('hunter-key-status').innerHTML = '<span style="color:var(--success)">✅ Hunter Key guardada</span>';
}

function saveApolloKey() {
  const k = document.getElementById('apollo-key-input').value.trim();
  if (!k) return;
  localStorage.setItem('gordi_apollo_key', k);
  document.getElementById('apollo-key-status').innerHTML = '<span style="color:var(--success)">✅ Apollo Key guardada</span>';
}

function saveClaudeKey() {
  const k = document.getElementById('claude-key-input').value.trim();
  if (!k) return;
  localStorage.setItem('gordi_claude_key', k);
  document.getElementById('claude-key-status').innerHTML = '<span style="color:var(--success)">✅ Gemini Key guardada</span>';
  refreshAiRouterStatus();
}

function saveGroqKey() {
  const k = document.getElementById('groq-key-input')?.value.trim();
  if (!k) return;
  localStorage.setItem('gordi_groq_key', k);
  const el = document.getElementById('groq-key-status');
  if (el) el.innerHTML = '<span style="color:var(--success)">✅ Groq Key guardada</span>';
  refreshAiRouterStatus();
}

function saveOpenRouterKey() {
  const k = document.getElementById('openrouter-key-input')?.value.trim();
  if (!k) return;
  localStorage.setItem('gordi_openrouter_key', k);
  const el = document.getElementById('openrouter-key-status');
  if (el) el.innerHTML = '<span style="color:var(--success)">✅ OpenRouter Key guardada</span>';
  refreshAiRouterStatus();
}

function refreshAiRouterStatus() {
  const el = document.getElementById('ai-router-status');
  if (!el) return;
  const s = AI_ROUTER.getStatus();
  const row = (name, label, icon, info) => {
    const ok = s[name].configured;
    const lim = s[name].limited;
    const color = !ok ? 'var(--text-dim)' : lim ? 'var(--warning)' : 'var(--success)';
    const badge = !ok ? '⚪ No configurado' : lim ? '⏳ Límite alcanzado' : '✅ Activo';
    return `<div style="display:flex;align-items:center;gap:.6rem;padding:.35rem 0;border-bottom:1px solid var(--glass-border)">
      <span>${icon}</span>
      <span style="flex:1;font-weight:600">${label}</span>
      <span style="color:${color};font-size:.75rem">${badge}</span>
      ${ok ? '' : `<a href="${info}" target="_blank" style="font-size:.72rem;color:var(--primary)">Configurar →</a>`}
    </div>`;
  };
  el.innerHTML =
    row('gemini',     'Gemini (Principal)',   '✨', 'https://aistudio.google.com/apikey') +
    row('groq',       'Groq (Respaldo 1)',    '⚡', 'https://console.groq.com') +
    row('openrouter', 'OpenRouter (Resp. 2)', '🔀', 'https://openrouter.ai') +
    `<p style="margin-top:.6rem;font-size:.75rem;color:var(--text-dim)">💡 Configura los 3 proveedores para tener IA prácticamente ilimitada. El sistema cambia automáticamente cuando uno alcanza su límite.</p>`;
}

async function checkUpdates() {
  try {
    const res = await fetch('version.json?t=' + Date.now()); // t= para evitar cache del navegador
    if (!res.ok) return;
    const data = await res.json();
    
    VOLTFLOW_VERSION = data.version;
    VOLTFLOW_CHANGELOG = data.changelog;
    
    const lastSeen = localStorage.getItem('_voltflow_last_version');
    
    // Si la versión del archivo es distinta a la última que vio el usuario -> Mostrar PopUp
    if (lastSeen && lastSeen !== VOLTFLOW_VERSION) {
      showWhatsNewModal(lastSeen, VOLTFLOW_VERSION);
    } else if (!lastSeen) {
      // Primera vez que usa la app con este sistema, guardamos versión sin molestar
      localStorage.setItem('_voltflow_last_version', VOLTFLOW_VERSION);
    }
  } catch (e) {
    console.warn('No se pudo comprobar version.json:', e);
  }
}

function showWhatsNewModal(oldV, newV) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity 0.4s ease;";
  
  const items = VOLTFLOW_CHANGELOG.map(item => `
    <div style="margin-bottom:15px;padding:12px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid rgba(255,255,255,0.05)">
      <strong style="display:block;color:var(--primary);margin-bottom:4px;font-size:15px">${item.title}</strong>
      <span style="font-size:13px;color:var(--text-dim);line-height:1.4">${item.desc}</span>
    </div>
  `).join('');

  modal.innerHTML = `
    <div style="background:var(--bg-card);max-width:500px;width:100%;border-radius:20px;border:1px solid var(--glass-border);box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);overflow:hidden;transform:scale(0.9);transition:transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)">
      <div style="background:linear-gradient(135deg, var(--primary), var(--secondary));padding:30px;text-align:center;position:relative">
        <div style="font-size:40px;margin-bottom:10px">🚀</div>
        <h2 style="margin:0;color:#fff;font-size:24px">¡Gordi se ha actualizado!</h2>
        <p style="margin:5px 0 0 0;color:rgba(255,255,255,0.8);font-size:14px">v${oldV} → v${newV}</p>
      </div>
      <div style="padding:25px;max-height:400px;overflow-y:auto">
        <h3 style="margin:0 0 15px 0;font-size:16px;color:var(--text)">Novedades en esta versión:</h3>
        ${items}
      </div>
      <div style="padding:20px;text-align:center;border-top:1px solid var(--glass-border)">
        <button id="close-whats-new" style="background:var(--primary);color:#fff;border:none;padding:12px 35px;border-radius:30px;font-weight:bold;cursor:pointer;box-shadow:0 10px 20px -5px var(--primary)">¡Entendido!</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  
  // Animation
  requestAnimationFrame(() => {
    modal.style.opacity = '1';
    modal.querySelector('div').style.transform = 'scale(1)';
  });

  modal.querySelector('#close-whats-new').onclick = () => {
    modal.style.opacity = '0';
    modal.querySelector('div').style.transform = 'scale(0.9)';
    setTimeout(() => {
      modal.remove();
      localStorage.setItem('_voltflow_last_version', VOLTFLOW_VERSION);
    }, 400);
  };
}
