// ══════════════════════════════════════════════════════════════════════════
// 🔴  MÓDULO: REDDIT LEAD SCRAPER
// ──  Busca posts de Reddit de usuarios con problemas de reforma/instalación
// ──  Usa la API pública JSON de Reddit (sin OAuth, sin credenciales)
// ──  Funciones: redditSearch, renderRedditResults, saveRedditLead
// ══════════════════════════════════════════════════════════════════════════

// ─── Configuración por defecto ────────────────────────────────────────────────
const REDDIT_DEFAULT_KEYWORDS = [
  'problemas reforma',
  'chapuza instalación eléctrica',
  'mal instalador electricista',
  'instalación eléctrica defectuosa',
  'reforma mal hecha',
  'problemas electricista',
  'estafado reforma',
  'instalador chapucero',
  'cortocircuito casa',
  'luz avería reforma',
];

const REDDIT_SUBREDDITS = [
  'all',
  'spain',
  'es',
  'bricolaje',
  'arquitectura',
  'hogar',
  'construccion',
];

// Proxies CORS públicos como fallback (intentar directo primero)
const CORS_PROXIES = [
  '',                                            // Directo (funciona en HTTP/S)
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
];

// ─── Función principal: buscar en Reddit ─────────────────────────────────────
async function redditSearch(query, subreddit = 'all', limit = 25) {
  const encodedQuery = encodeURIComponent(query);
  let sub = subreddit === 'all' ? '' : `+subreddit:${subreddit}`;
  const baseUrl = `https://www.reddit.com/search.json?q=${encodedQuery}${encodeURIComponent(sub)}&sort=new&t=year&limit=${limit}&type=link`;

  let lastError = null;
  for (const proxy of CORS_PROXIES) {
    try {
      const url = proxy ? proxy + encodeURIComponent(baseUrl) : baseUrl;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const posts = (data?.data?.children || []).map(c => c.data).filter(p => p && !p.over_18);
      return posts;
    } catch (e) {
      lastError = e;
      // Intentar siguiente proxy
    }
  }
  throw lastError || new Error('No se pudo conectar con Reddit');
}

// ─── Renderizar resultados ────────────────────────────────────────────────────
function renderRedditResults(posts) {
  const container = document.getElementById('reddit-results');
  if (!container) return;

  if (!posts || posts.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:3rem;color:var(--text-muted)">
        <div style="font-size:2.5rem;margin-bottom:.75rem">🔍</div>
        <p style="font-weight:600">Sin resultados</p>
        <p style="font-size:.85rem;margin-top:.25rem">Prueba con otras palabras clave o amplía el subreddit a <em>all</em>.</p>
      </div>`;
    return;
  }

  container.innerHTML = posts.map((p, i) => {
    const date = p.created_utc ? new Date(p.created_utc * 1000).toLocaleDateString('es-ES') : '—';
    const score = p.score ?? 0;
    const comments = p.num_comments ?? 0;
    const subredditDisplay = p.subreddit_name_prefixed || `r/${p.subreddit}`;
    const author = p.author || '[eliminado]';
    const title = p.title ? _escapeHtml(p.title) : 'Sin título';
    const selftext = p.selftext ? _escapeHtml(p.selftext.slice(0, 200)) + (p.selftext.length > 200 ? '…' : '') : '';
    const redditUrl = `https://www.reddit.com${p.permalink}`;
    const authorUrl = `https://www.reddit.com/user/${author}`;
    const isDeleted = author === '[eliminado]' || author === '[deleted]';

    // Nivel de urgencia visual según score y palabras clave
    const urgencyKeywords = ['urgente', 'ayuda', 'peligro', 'incendio', 'chispa', 'cortocircuito', 'avería', 'accidente', 'estafado', 'denuncia'];
    const textLower = (p.title + ' ' + p.selftext).toLowerCase();
    const isUrgent = urgencyKeywords.some(k => textLower.includes(k));
    const urgencyBadge = isUrgent
      ? `<span style="background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.3);border-radius:4px;padding:1px 7px;font-size:.68rem;font-weight:700">🔥 URGENTE</span>`
      : '';

    return `
      <div class="glass-panel" style="margin-bottom:1rem;padding:1.1rem 1.25rem;border-left:3px solid ${isUrgent ? '#ef4444' : 'var(--primary)'}" data-reddit-index="${i}">
        <div style="display:flex;align-items:flex-start;gap:.75rem">
          <div style="flex:1;min-width:0">
            <div style="display:flex;flex-wrap:wrap;align-items:center;gap:.4rem;margin-bottom:.4rem">
              <span style="font-size:.72rem;font-weight:700;color:var(--primary);background:rgba(10,132,255,.1);border-radius:4px;padding:1px 7px">${subredditDisplay}</span>
              <span style="font-size:.72rem;color:var(--text-muted)">• ${date}</span>
              <span style="font-size:.72rem;color:var(--text-muted)">• ⬆️ ${score} pts · 💬 ${comments}</span>
              ${urgencyBadge}
            </div>
            <a href="${redditUrl}" target="_blank" rel="noopener" style="font-size:.92rem;font-weight:600;color:var(--text-primary);text-decoration:none;line-height:1.35;display:block;margin-bottom:.35rem" title="Abrir en Reddit">${title}</a>
            ${selftext ? `<p style="font-size:.8rem;color:var(--text-muted);margin:0 0 .5rem;line-height:1.4">${selftext}</p>` : ''}
            <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap">
              ${!isDeleted
                ? `<a href="${authorUrl}" target="_blank" rel="noopener" style="font-size:.78rem;color:var(--text-muted);text-decoration:none">👤 u/${_escapeHtml(author)}</a>`
                : `<span style="font-size:.78rem;color:var(--text-dim)">👤 [usuario eliminado]</span>`}
              <a href="${redditUrl}" target="_blank" rel="noopener" style="font-size:.78rem;color:var(--primary)">Ver post →</a>
            </div>
          </div>
          ${!isDeleted ? `
          <div style="flex-shrink:0">
            <button
              class="btn-primary"
              style="font-size:.75rem;padding:.4rem .85rem;white-space:nowrap"
              onclick="saveRedditLead(${i})"
              title="Guardar como lead en el CRM"
            >+ Guardar Lead</button>
          </div>` : ''}
        </div>
      </div>`;
  }).join('');
}

// ─── Guardar lead desde Reddit post ──────────────────────────────────────────
let _redditLastResults = [];

function saveRedditLead(index) {
  const post = _redditLastResults[index];
  if (!post) return;

  const author = post.author || 'usuario_reddit';
  const title = post.title || '';
  const redditUrl = `https://www.reddit.com${post.permalink}`;
  const subreddit = post.subreddit_name_prefixed || `r/${post.subreddit}`;
  const date = post.created_utc ? new Date(post.created_utc * 1000).toISOString() : new Date().toISOString();

  // Determinar score básico (señal fuerte = urgente)
  const urgencyKeywords = ['urgente', 'ayuda', 'peligro', 'incendio', 'chispa', 'cortocircuito', 'avería', 'estafado', 'denuncia'];
  const textLower = (title + ' ' + (post.selftext || '')).toLowerCase();
  const isUrgent = urgencyKeywords.some(k => textLower.includes(k));

  const lead = {
    id: Date.now(),
    name: `u/${author}`,
    company: `Reddit — ${subreddit}`,
    email: '',
    phone: '',
    segment: 'Particulares',
    website: redditUrl,
    signal: `Post Reddit: "${title.slice(0, 120)}" — ${redditUrl}`,
    role: 'otros',
    size: 'pequeño',
    score: isUrgent ? 45 : 25,
    status: 'Pendiente',
    date: new Date().toISOString(),
    notes: `Fuente: Reddit (${subreddit})\nPost: ${title}\nEnlace: ${redditUrl}\nFecha post: ${new Date(date).toLocaleDateString('es-ES')}\nScore Reddit: ${post.score ?? 0} pts`,
    tags: ['reddit', subreddit.replace('r/', ''), isUrgent ? 'urgente' : 'reforma'],
    budget: 0,
    next_contact: '',
    source: 'Reddit',
    activity: [{ action: 'Importado desde Reddit', date: new Date().toISOString() }]
  };

  // Insertar en la lista global y persistir
  if (typeof leads !== 'undefined') {
    leads.unshift(lead);
    if (typeof saveLeads === 'function') saveLeads();
    if (typeof renderAll === 'function') renderAll();
    if (typeof renderDashboardCharts === 'function') renderDashboardCharts();
    if (typeof updateStreakData === 'function') updateStreakData();
  }
  if (typeof showToast === 'function') {
    showToast(`Lead guardado: u/${author} ✓`);
  }

  // Deshabilitar el botón para evitar duplicados
  const card = document.querySelector(`[data-reddit-index="${index}"]`);
  if (card) {
    const btn = card.querySelector('button');
    if (btn) {
      btn.textContent = '✓ Guardado';
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'default';
    }
  }
}

// ─── Función de búsqueda disparada desde la UI ────────────────────────────────
async function runRedditSearch() {
  const queryInput = document.getElementById('reddit-query-input');
  const subredditSelect = document.getElementById('reddit-subreddit-select');
  const limitSelect = document.getElementById('reddit-limit-select');
  const resultsContainer = document.getElementById('reddit-results');
  const statusEl = document.getElementById('reddit-status');
  const searchBtn = document.getElementById('reddit-search-btn');

  const query = queryInput?.value.trim();
  const subreddit = subredditSelect?.value || 'all';
  const limit = parseInt(limitSelect?.value || '25');

  if (!query) {
    if (typeof showToast === 'function') showToast('⚠️ Escribe una palabra clave para buscar');
    queryInput?.focus();
    return;
  }

  // Estado: cargando
  if (searchBtn) { searchBtn.disabled = true; searchBtn.textContent = '⏳ Buscando…'; }
  if (statusEl) statusEl.innerHTML = `<span style="color:var(--text-muted);font-size:.82rem">⏳ Conectando con Reddit…</span>`;
  if (resultsContainer) resultsContainer.innerHTML = `
    <div style="text-align:center;padding:3rem;color:var(--text-muted)">
      <div style="font-size:2rem;margin-bottom:.5rem">⏳</div>
      <p>Buscando posts en Reddit…</p>
    </div>`;

  try {
    const posts = await redditSearch(query, subreddit, limit);
    _redditLastResults = posts;

    // Actualizar estado
    if (statusEl) {
      statusEl.innerHTML = `<span style="color:var(--success);font-size:.82rem">✓ ${posts.length} resultados encontrados para <em>"${_escapeHtml(query)}"</em> en ${subreddit === 'all' ? 'todos los subreddits' : `r/${subreddit}`}</span>`;
    }

    renderRedditResults(posts);

    // Guardar búsqueda reciente
    _redditSaveSearchHistory(query, subreddit, posts.length);

  } catch (e) {
    console.error('[Reddit Scraper]', e);
    _redditLastResults = [];
    if (statusEl) {
      statusEl.innerHTML = `<span style="color:var(--danger);font-size:.82rem">❌ Error al conectar con Reddit: ${_escapeHtml(e.message)}</span>`;
    }
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div class="glass-panel" style="border-left:3px solid var(--danger);padding:1.25rem;text-align:center">
          <p style="font-weight:600;color:var(--danger);margin-bottom:.5rem">❌ No se pudo conectar con Reddit</p>
          <p style="font-size:.85rem;color:var(--text-muted)">Posibles causas:</p>
          <ul style="font-size:.82rem;color:var(--text-muted);text-align:left;display:inline-block;margin-top:.5rem">
            <li>Estás abriendo el archivo directamente (<code>file://</code>) — usa un servidor local</li>
            <li>Reddit está caído o bloqueado en tu red</li>
            <li>La conexión a internet no está disponible</li>
          </ul>
          <p style="margin-top:1rem;font-size:.82rem;color:var(--text-dim)">Para servir localmente: <code>npx serve . -p 3000</code> y abre <code>http://localhost:3000</code></p>
        </div>`;
    }
  } finally {
    if (searchBtn) { searchBtn.disabled = false; searchBtn.textContent = '🔍 Buscar'; }
  }
}

// ─── Historial de búsquedas Reddit ───────────────────────────────────────────
function _redditSaveSearchHistory(query, subreddit, count) {
  try {
    const key = 'gordi_reddit_history';
    const history = JSON.parse(localStorage.getItem(key) || '[]');
    history.unshift({ query, subreddit, count, date: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(history.slice(0, 20)));
    _redditRenderHistory();
  } catch(e) { /* ignore */ }
}

function _redditRenderHistory() {
  const el = document.getElementById('reddit-history-list');
  if (!el) return;
  try {
    const history = JSON.parse(localStorage.getItem('gordi_reddit_history') || '[]');
    if (!history.length) { el.innerHTML = ''; return; }
    el.innerHTML = history.slice(0, 8).map(h =>
      `<span class="reddit-history-chip" onclick="document.getElementById('reddit-query-input').value=${JSON.stringify(h.query)};document.getElementById('reddit-subreddit-select').value=${JSON.stringify(h.subreddit)};runRedditSearch()" title="${h.count} resultados · ${new Date(h.date).toLocaleDateString('es-ES')}">${_escapeHtml(h.query)}</span>`
    ).join('');
  } catch(e) { el.innerHTML = ''; }
}

// ─── Cargar keywords predefinidas ─────────────────────────────────────────────
function _redditLoadSuggestions() {
  const el = document.getElementById('reddit-suggestions');
  if (!el) return;
  el.innerHTML = REDDIT_DEFAULT_KEYWORDS.map(kw =>
    `<span class="reddit-history-chip" onclick="document.getElementById('reddit-query-input').value=${JSON.stringify(kw)};runRedditSearch()">${_escapeHtml(kw)}</span>`
  ).join('');
}

// ─── Utilidades ───────────────────────────────────────────────────────────────
function _escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Init (llamado por showView o al cargar la vista) ─────────────────────────
function initRedditPanel() {
  _redditLoadSuggestions();
  _redditRenderHistory();

  // Enter key en el input
  const queryInput = document.getElementById('reddit-query-input');
  if (queryInput && !queryInput._redditKeyListenerAttached) {
    queryInput._redditKeyListenerAttached = true;
    queryInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); runRedditSearch(); }
    });
  }
}
