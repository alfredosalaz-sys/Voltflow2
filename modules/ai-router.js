// VOLTFLOW — ROUTER IA MULTI-PROVEEDOR v2
// Gemini → Groq → OpenRouter (fallback automático al alcanzar límites)
// ══════════════════════════════════════════════════════════════════

const AI_ROUTER = {
  // Estado de rate-limit por proveedor (se resetea cada hora)
  _limited: {},
  _limitTimers: {},

  _markLimited(provider) {
    this._limited[provider] = true;
    clearTimeout(this._limitTimers[provider]);
    // Auto-recuperar en 62 minutos (ventana segura para todos los proveedores)
    this._limitTimers[provider] = setTimeout(() => {
      delete this._limited[provider];
      console.log(`[AI Router] ${provider} recuperado — límites reseteados`);
    }, 62 * 60 * 1000);
    console.warn(`[AI Router] ${provider} marcado como limitado — usando siguiente proveedor`);
  },

  _isLimited(provider) {
    return !!this._limited[provider];
  },

  // ── Proveedor 1: Gemini ──────────────────────────────────────
  async _callGemini(prompt, key, model = 'gemini-2.0-flash') {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(20000) }
    );
    if (res.status === 429 || res.status === 503) { this._markLimited('gemini'); throw new Error('RATE_LIMIT'); }
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data = await res.json();
    if (data.error?.code === 429) { this._markLimited('gemini'); throw new Error('RATE_LIMIT'); }
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Sin respuesta';
  },

  // ── Proveedor 2: Groq (llama3 ultra-rápido, gratis) ─────────
  async _callGroq(prompt, key) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(20000)
    });
    if (res.status === 429) { this._markLimited('groq'); throw new Error('RATE_LIMIT'); }
    if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
    const data = await res.json();
    if (data.error?.type === 'rate_limit_exceeded') { this._markLimited('groq'); throw new Error('RATE_LIMIT'); }
    return data.choices?.[0]?.message?.content?.trim() || 'Sin respuesta';
  },

  // ── Proveedor 3: OpenRouter (50+ modelos gratuitos) ──────────
  async _callOpenRouter(prompt, key) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': 'https://voltium.es',
        'X-Title': 'Voltflow CRM',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
      }),
      signal: AbortSignal.timeout(25000)
    });
    if (res.status === 429) { this._markLimited('openrouter'); throw new Error('RATE_LIMIT'); }
    if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || 'Sin respuesta';
  },

  // ── ROUTER PRINCIPAL ─────────────────────────────────────────
  async call(prompt, geminiKey) {
    const groqKey       = localStorage.getItem('gordi_groq_key') || '';
    const openrouterKey = localStorage.getItem('gordi_openrouter_key') || '';

    const providers = [];

    // Proveedor 1: Gemini (si tiene key y no está limitado)
    if (geminiKey && !this._isLimited('gemini')) {
      providers.push({ name: 'gemini', fn: () => this._callGemini(prompt, geminiKey) });
    }

    // Proveedor 2: Groq
    if (groqKey && !this._isLimited('groq')) {
      providers.push({ name: 'groq', fn: () => this._callGroq(prompt, groqKey) });
    }

    // Proveedor 3: OpenRouter
    if (openrouterKey && !this._isLimited('openrouter')) {
      providers.push({ name: 'openrouter', fn: () => this._callOpenRouter(prompt, openrouterKey) });
    }

    // Intentar proveedores en orden
    for (const provider of providers) {
      try {
        const result = await provider.fn();
        // Si no era el primero, mostrar notificación discreta
        if (providers[0].name !== provider.name) {
          showToast(`⚡ IA activa: ${provider.name}`, 2500);
        }
        return result;
      } catch (err) {
        if (err.message === 'RATE_LIMIT') continue; // pasar al siguiente
        console.error(`[AI Router] Error en ${provider.name}:`, err);
        continue;
      }
    }

    // Todos los proveedores fallaron o están limitados
    const configured = [geminiKey && 'Gemini', groqKey && 'Groq', openrouterKey && 'OpenRouter'].filter(Boolean);
    if (!configured.length) {
      throw new Error('NO_KEY');
    }
    throw new Error('ALL_LIMITED');
  },

  // Estado visible para UI
  getStatus() {
    const geminiKey     = localStorage.getItem('gordi_gemini_key') || '';
    const groqKey       = localStorage.getItem('gordi_groq_key') || '';
    const openrouterKey = localStorage.getItem('gordi_openrouter_key') || '';
    return {
      gemini:      { configured: !!geminiKey,     limited: this._isLimited('gemini') },
      groq:        { configured: !!groqKey,        limited: this._isLimited('groq') },
      openrouter:  { configured: !!openrouterKey,  limited: this._isLimited('openrouter') },
    };
  },
};

// Compatibilidad total: todas las llamadas antiguas a callGeminiAPI ahora usan el router
async function callGeminiAPI(prompt, geminiKey) {
  try {
    return await AI_ROUTER.call(prompt, geminiKey);
  } catch (err) {
    if (err.message === 'NO_KEY') {
      throw new Error('NO_KEY: Configura al menos una API Key de IA en Configuración');
    }
    if (err.message === 'ALL_LIMITED') {
      showToast('⏳ Límite diario alcanzado en todos los proveedores IA. Se recuperarán automáticamente.', 5000);
      throw new Error('ALL_LIMITED');
    }
    throw err;
  }
}

function appendBriefingMsg(text, role) {
  const msgs = document.getElementById('briefing-messages');
  const el   = document.createElement('div');
  el.className = `briefing-msg ${role}`;
  el.style.whiteSpace = 'pre-wrap';
  el.textContent = text;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
  return el;
}

// Init: show FABs only after load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.getElementById('voice-fab').style.display = 'flex';
    document.getElementById('scan-fab').style.display  = 'flex';
  }, 800);
});

// ============================================================
// MEJORAS DE RENDIMIENTO v2.3
// ============================================================

// ── MEJORA 2: Secuencias automáticas de seguimiento ───────────────────────────
const SEQUENCE_RULES = {
  'Contactado':             { days: 3,  msg: '🔔 Seguimiento en 3 días — sin respuesta aún' },
  'Respuesta del cliente':  { days: 2,  msg: '🔔 Respuesta recibida — preparar propuesta de visita' },
  'Visita':                 { days: 5,  msg: '🔔 Tras visita — enviar presupuesto esta semana' },
  'Entrega de presupuesto': { days: 7,  msg: '🔔 Presupuesto enviado — llamada de seguimiento' },
};

function applySequenceRule(lead, newStatus) {
  const rule = SEQUENCE_RULES[newStatus];
  if (!rule) return;
  // Solo asignar si next_contact está vacío — nunca pisar fecha manual
  if (lead.next_contact) return;
  const d = new Date();
  d.setDate(d.getDate() + rule.days);
  lead.next_contact = d.toISOString().slice(0, 10);
  // Añadir nota de contexto si no existe ya
  if (!lead.notes.includes(rule.msg)) {
    const ts = `[${new Date().toLocaleDateString('es-ES',{day:'2-digit',month:'short'})}]`;
    lead.notes = (lead.notes ? lead.notes + '\n' : '') + `${ts} ${rule.msg}`;
  }
  addActivityLog(lead.id, `📅 Seguimiento auto-programado: ${d.toLocaleDateString('es-ES',{day:'2-digit',month:'long'})}`);
  updateFollowupBadge();
}

// ── MEJORA 4: Google Sheets Sync ──────────────────────────────────────────────
// Usa el Google OAuth token implícito de la API key de Google ya configurada.
// Estrategia: export manual + auto en backup. Sin conflictos de sync simultáneo.

const SHEETS_COLS = [
  'id','name','company','email','phone','status','score','budget',
  'next_contact','segment','signal','notes','date','status_date',
  'first_contact_date','ttfc_hours','website','decision_maker',
  'rating','ratingCount','source','tags','assigned_to'
];

function leadsToSheetRows() {
  return leads.filter(l => !l.archived).map(l => SHEETS_COLS.map(col => {
    const v = l[col];
    if (Array.isArray(v)) return v.join(', ');
    if (v == null || v === undefined) return '';
    return String(v);
  }));
}

async function syncToSheets() {
  const sheetsId = localStorage.getItem('gordi_sheets_id');
  const gToken   = localStorage.getItem('gordi_sheets_token');
  if (!sheetsId || !gToken) {
    showToast('⚠️ Configura el Sheets ID y token en Ajustes');
    return;
  }
  try {
    const headers = { Authorization: `Bearer ${gToken}`, 'Content-Type': 'application/json' };

    // 1. Verificar/crear pestaña "Leads"
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}`, { headers });
    if (!metaRes.ok) {
      const err = await metaRes.json().catch(() => ({}));
      if (metaRes.status === 401) { showToast('❌ Token caducado. Vuelve a Autorizar Google.'); return; }
      throw new Error(`HTTP ${metaRes.status}: ${err.error?.message || 'Error al acceder al Sheet'}`);
    }
    const meta = await metaRes.json();
    const sheetNames = meta.sheets.map(s => s.properties.title);
    if (!sheetNames.includes('Leads')) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}:batchUpdate`,
        { method: 'POST', headers,
          body: JSON.stringify({ requests: [{ addSheet: { properties: { title: 'Leads' } } }] })
        }
      );
      showToast('📋 Pestaña "Leads" creada automáticamente');
    }

    // 2. Limpiar y escribir datos
    const range = 'Leads!A1';
    const values = [SHEETS_COLS, ...leadsToSheetRows()];
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}/values/Leads!A:Z:clear`,
      { method: 'POST', headers });
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}/values/${range}?valueInputOption=RAW`,
      { method: 'PUT', headers,
        body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
        signal: AbortSignal.timeout(15000)
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`HTTP ${res.status}: ${err.error?.message || 'Error al escribir datos'}`);
    }
    const data = await res.json();
    const updated = data.updatedRows || leads.length;
    localStorage.setItem('gordi_sheets_last_sync', new Date().toISOString());
    showToast(`☁️ ${updated} leads sincronizados con Google Sheets ✓`);
    renderSheetsStatus();
  } catch(err) {
    showToast(`❌ Sync fallido: ${err.message}`);
    console.error('Sheets sync error:', err);
  }
}

async function loadFromSheets() {
  const sheetsId = localStorage.getItem('gordi_sheets_id');
  const gToken   = localStorage.getItem('gordi_sheets_token');
  if (!sheetsId || !gToken) { showToast('⚠️ Configura el Sheets ID y token en Ajustes'); return; }
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}/values/Leads!A:Z`,
      { headers: { Authorization: `Bearer ${gToken}` }, signal: AbortSignal.timeout(12000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rows = data.values || [];
    if (rows.length < 2) { showToast('Hoja vacía o sin datos'); return; }
    const [headers, ...dataRows] = rows;
    const imported = dataRows.map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] || ''; });
      // Parse types
      obj.score = parseFloat(obj.score) || 0;
      obj.budget = parseFloat(obj.budget) || 0;
      obj.rating = parseFloat(obj.rating) || null;
      obj.ratingCount = parseInt(obj.ratingCount) || 0;
      obj.ttfc_hours = obj.ttfc_hours ? parseInt(obj.ttfc_hours) : null;
      obj.tags = obj.tags ? obj.tags.split(', ').filter(Boolean) : [];
      obj.signals = obj.signals ? obj.signals.split(' | ') : [];
      obj.activity = obj.activity || [];
      obj.archived = false;
      return obj;
    });
    if (confirm(`Importar ${imported.length} leads desde Google Sheets? (reemplazará los datos locales)`)) {
      leads = imported;
      saveLeads(); renderLeads(); renderKanban(); renderDashboardCharts(); updateStats();
      showToast(`☁️ ${imported.length} leads importados desde Sheets ✓`);
    }
  } catch(err) {
    showToast(`❌ Carga fallida: ${err.message}`);
  }
}

function renderSheetsStatus() {
  const el = document.getElementById('sheets-sync-status');
  if (!el) return;
  const lastSync = localStorage.getItem('gordi_sheets_last_sync');
  const sheetsId = localStorage.getItem('gordi_sheets_id');
  if (!sheetsId) { el.textContent = 'No configurado'; el.style.color = 'var(--text-dim)'; return; }
  if (lastSync) {
    const ago = Math.round((Date.now() - new Date(lastSync)) / 60000);
    el.textContent = ago < 60 ? `Último sync: hace ${ago} min` : `Último sync: ${new Date(lastSync).toLocaleDateString('es-ES')}`;
    el.style.color = 'var(--success)';
  } else {
    el.textContent = 'Sin sincronizar aún';
    el.style.color = 'var(--warning)';
  }
}

// Hook: auto-sync on weekly backup
const _origAutoWeeklyBackup = typeof autoWeeklyBackup === 'function' ? autoWeeklyBackup : null;
if (_origAutoWeeklyBackup) {
  autoWeeklyBackup = function() {
    _origAutoWeeklyBackup();
    if (localStorage.getItem('gordi_sheets_id') && localStorage.getItem('gordi_sheets_token')) {
      syncToSheets();
    }
  };
}

// ── MEJORA 5: Signal Correlation — qué señales predicen el cierre ────────────
function buildSignalCorrelation() {
  const closed   = leads.filter(l => l.status === 'Cerrado' && (l.signals?.length || l.signal));
  const notClosed = leads.filter(l => !['Cerrado','No interesa'].includes(l.status) && !l.archived && (l.signals?.length || l.signal));
  if (closed.length < 3) return null;

  const sigCount = {};

  function countSigs(lead, isClosed) {
    const allSigs = [
      ...(lead.signals || []),
      ...(lead.signal || '').split(' — ').filter(Boolean)
    ];
    allSigs.forEach(sig => {
      // Normalize: remove dynamic numbers, keep semantic meaning
      const key = sig.replace(/\d+[\d.,]*/g, 'N').replace(/\s+/g, ' ').trim().slice(0, 70);
      if (!key || key.length < 8) return;
      if (!sigCount[key]) sigCount[key] = { closed: 0, total: 0, label: sig.slice(0, 70) };
      sigCount[key].total++;
      if (isClosed) sigCount[key].closed++;
    });
  }

  closed.forEach(l => countSigs(l, true));
  notClosed.forEach(l => countSigs(l, false));

  return Object.entries(sigCount)
    .filter(([, v]) => v.total >= 2)
    .map(([key, v]) => ({
      key, label: v.label,
      rate: Math.round(v.closed / v.total * 100),
      closed: v.closed,
      total: v.total
    }))
    .sort((a, b) => b.rate - a.rate || b.closed - a.closed)
    .slice(0, 10);
}

function renderSignalCorrelation() {
  const el = document.getElementById('signal-corr-content');
  const panel = document.getElementById('signal-corr-panel');
  if (!el) return;

  const closed = leads.filter(l => l.status === 'Cerrado').length;
  if (closed < 3) {
    el.innerHTML = `<p style="color:var(--text-muted);font-size:.83rem">
      Cierra al menos <strong>3 leads</strong> para activar este análisis.
      Ahora mismo tienes ${closed} cerrado${closed!==1?'s':''}. El sistema aprenderá automáticamente qué señales predicen el cierre en tu mercado específico.
    </p>`;
    if (panel) panel.style.display = 'block';
    return;
  }

  const corr = buildSignalCorrelation();
  if (!corr || !corr.length) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:.83rem">Sin suficientes señales para analizar.</p>';
    return;
  }

  if (panel) panel.style.display = 'block';

  // Find leads with top signal right now
  const topSig = corr[0];
  const actionableLeads = leads.filter(l =>
    !['Cerrado','No interesa'].includes(l.status) && !l.archived &&
    ((l.signals||[]).some(s => s.slice(0,50).includes(topSig.label.slice(0,40))) ||
     (l.signal||'').includes(topSig.label.slice(0,30)))
  );

  el.innerHTML = `
    <div style="margin-bottom:.75rem;font-size:.78rem;color:var(--text-muted)">
      Basado en <strong>${closed} leads cerrados</strong> de tu historial real.
      ${actionableLeads.length ? `<span style="color:var(--primary);margin-left:.5rem">💡 Hay <strong>${actionableLeads.length} lead${actionableLeads.length>1?'s':''}</strong> con la señal más predictiva sin contactar aún.</span>` : ''}
    </div>
    ${corr.map(c => {
      const col = c.rate >= 60 ? '#10d97c' : c.rate >= 30 ? '#f59e0b' : '#7a8ba0';
      // Clean emoji from label for display
      const cleanLabel = c.label.replace(/^[^\w]+/, '').trim();
      return `<div class="sig-corr-row">
        <span class="sig-label" title="${c.label}">${c.label.slice(0,60)}</span>
        <div class="sig-corr-bar-outer">
          <div class="sig-corr-bar-inner" style="width:${c.rate}%;background:${col}"></div>
        </div>
        <span class="sig-rate" style="color:${col}">${c.rate}%</span>
        <span class="sig-count">${c.closed}/${c.total}</span>
      </div>`;
    }).join('')}
    <div style="font-size:.68rem;color:var(--text-dim);margin-top:.6rem">
      % = tasa de cierre de leads que tenían esta señal · N/M = cerrados/total con esta señal
    </div>`;
}

// Hook renderDashboardCharts to include new panels
const _origRenderDashboardCharts = renderDashboardCharts;
renderDashboardCharts = function() {
  _origRenderDashboardCharts();
  renderSignalCorrelation();
  renderSheetsStatus();
};

// Init — auto-carga desde Sheets y programa renovación de token
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    renderSheetsStatus();
    // Programar renovación si el token ya existe
    if (localStorage.getItem('gordi_sheets_token_expiry')) {
      scheduleTokenRenewal();
    }
    // Auto-cargar desde Sheets si está configurado
    const sheetsId = localStorage.getItem('gordi_sheets_id');
    const token    = localStorage.getItem('gordi_sheets_token');
    if (sheetsId && token) {
      showToast('🔄 Sincronizando datos desde Google Sheets...');
      loadFromSheets().then(() => {
        showToast('✅ Datos actualizados desde Google Sheets');
      }).catch(() => {
        // Si falla (token caducado), intentar renovar
        showToast('🔄 Renovando acceso a Google Sheets...');
        initSheetsOAuth(true);
      });
    }
  }, 1200);
});


// ============================================================
// MEJORAS DE USABILIDAD v2.2
// ============================================================

// ── MEJORA 1: Menú contextual con clic derecho ────────────────────────────────
const STATUS_LIST = ['Pendiente','Contactado','Respuesta del cliente','Visita','Entrega de presupuesto','Cerrado','No interesa'];

function openCtxMenu(e, leadId, source) {
  e.preventDefault(); e.stopPropagation();
  const menu = document.getElementById('ctx-menu');
  const lead = leads.find(l => l.id == leadId);
  if (!lead || !menu) return;

  menu.innerHTML = `
    <div class="ctx-label">Cambiar estado</div>
    ${STATUS_LIST.map(s => `
      <div class="ctx-item ${lead.status===s?'ctx-active':''}" onclick="ctxSetStatus('${leadId}','${s}')">
        <span style="width:8px;height:8px;border-radius:50%;background:${s==='Cerrado'?'var(--success)':s==='No interesa'?'var(--text-dim)':s==='Pendiente'?'var(--warning)':s==='Contactado'?'var(--primary)':'var(--secondary)'};flex-shrink:0;display:inline-block"></span>
        ${s} ${lead.status===s?'✓':''}
      </div>`).join('')}
    <div class="ctx-sep"></div>
    <div class="ctx-label">Acciones</div>
    <div class="ctx-item" onclick="ctxOpenDetail('${leadId}')">👁️ Ver detalle</div>
    <div class="ctx-item" onclick="ctxQuickNote('${leadId}')">📝 Añadir nota</div>
    ${lead.email ? `<div class="ctx-item" onclick="openAiEmailModal('${leadId}');closeCtxMenu()">✨ Generar email IA</div>` : ''}
    ${lead.email ? `<div class="ctx-item" onclick="copyEmail('${lead.email}',event);closeCtxMenu()">⧉ Copiar email</div>` : ''}
    <div class="ctx-sep"></div>
    <div class="ctx-item" onclick="archiveLead('${leadId}');closeCtxMenu()" style="color:var(--danger)">📦 Archivar</div>
  `;

  menu.style.display = 'block';
  // Position smart: avoid overflow
  const mw = 220, mh = 320;
  let x = e.clientX, y = e.clientY;
  if (x + mw > window.innerWidth) x = window.innerWidth - mw - 8;
  if (y + mh > window.innerHeight) y = window.innerHeight - mh - 8;
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';

  setTimeout(() => document.addEventListener('click', closeCtxMenu, { once: true }), 10);
}

function closeCtxMenu() {
  const m = document.getElementById('ctx-menu');
  if (m) m.style.display = 'none';
}

function ctxSetStatus(leadId, status) {
  const lead = leads.find(l => l.id == leadId);
  if (!lead) return;
  closeCtxMenu();
  confirmStatusChange(lead, status, () => {
    const old = lead.status;
    lead.status = status;
    lead.status_date = new Date().toISOString();
    addActivityLog(leadId, `Estado cambiado: ${old} → ${status}`);
    applySequenceRule(lead, status);
    lead.score = recalculateLeadScore(lead);
    saveLeads(); renderAll();
    showToast(`${lead.company} → ${status} ✓`);
  });
}

function ctxOpenDetail(leadId) {
  closeCtxMenu();
  openLeadDrawer(leadId);
}

function ctxQuickNote(leadId) {
  closeCtxMenu();
  // Simulate click on quick note btn if in kanban, else open drawer
  openLeadDrawer(leadId);
  setTimeout(() => { const el = document.getElementById('drawer-notes'); if (el) el.focus(); }, 300);
}

// ── MEJORA 2: Lead Drawer — panel lateral con navegación ↑↓ ──────────────────
let drawerLeadId = null;
let drawerFilteredIds = [];

function openLeadDrawer(id) {
  drawerLeadId = id;
  // Build list of visible filtered leads for ↑↓ navigation
  const tbody = document.getElementById('leads-body');
  if (tbody) {
    drawerFilteredIds = [...tbody.querySelectorAll('tr')].map(tr => {
      const cb = tr.querySelector('.lead-cb');
      return cb ? cb.dataset.id : null;
    }).filter(Boolean);
  }
  if (!drawerFilteredIds.includes(String(id))) drawerFilteredIds = leads.filter(l=>!l.archived).map(l=>String(l.id));
  renderDrawer();
  document.getElementById('lead-drawer').classList.add('open');
  document.getElementById('drawer-backdrop').style.display = 'block';
}

function renderDrawer() {
  const lead = leads.find(l => l.id == drawerLeadId);
  if (!lead) return;
  const idx = drawerFilteredIds.indexOf(String(drawerLeadId));
  const total = drawerFilteredIds.length;

  document.getElementById('drawer-company-title').textContent = `${lead.company} — ${lead.name}`;
  document.getElementById('drawer-pos').textContent = total > 1 ? `${idx+1}/${total}` : '';
  document.getElementById('drawer-prev').disabled = idx <= 0;
  document.getElementById('drawer-next').disabled = idx >= total - 1;

  const bc = lead.score >= 70 ? 'badge-high' : (lead.score >= 40 ? 'badge-mid' : 'badge-low');
  const prevEmails = emailHistory.filter(e => e.leadId == lead.id || e.email === lead.email);
  const actLog = (lead.activity||[]).slice(0,5).map(a =>
    `<div class="activity-log-item"><div class="activity-log-dot"></div><div style="flex:1">${a.action}</div><div class="activity-log-time">${new Date(a.date).toLocaleDateString('es-ES',{day:'2-digit',month:'short'})}</div></div>`
  ).join('') || '<div style="font-size:.72rem;color:var(--text-dim)">Sin actividad registrada</div>';

  document.getElementById('lead-drawer-body').innerHTML = `
    <div style="display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;margin-bottom:1rem">
      <span class="score-badge ${bc}">${lead.score} pts</span>
      <span style="font-size:.78rem;background:var(--glass);padding:2px 9px;border-radius:5px">${lead.segment}</span>
      <span style="font-size:.75rem;color:var(--text-muted)">${new Date(lead.date).toLocaleDateString('es-ES')}</span>
    </div>
    <div class="grid-form" style="grid-template-columns:1fr 1fr;gap:.65rem;margin-bottom:.75rem">
      <div><label>Email</label><input type="email" id="drawer-email" value="${lead.email||''}" placeholder="email@empresa.com"></div>
      <div><label>Teléfono</label><input type="text" id="drawer-phone" value="${lead.phone||''}" placeholder="+34 600..."></div>
      <div><label>WhatsApp</label><div style="display:flex;align-items:center;gap:.4rem">
        <input type="text" id="drawer-whatsapp" value="${lead.whatsapp||''}" placeholder="+34 600 000 000" style="flex:1">
        ${lead.whatsapp || lead.phone ? `<button onclick="openWhatsAppModal('${lead.id}',event)" class="btn-action" style="color:#25D366;border-color:rgba(37,211,102,.4);flex-shrink:0">💬 WA IA</button>` : ''}
      </div></div>
      <div><label>Estado</label>
        <select id="drawer-status">
          ${STATUS_LIST.map(s=>`<option${lead.status===s?' selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div><label>Próximo contacto</label><input type="date" id="drawer-next-contact" value="${lead.next_contact||''}"></div>
      <div><label>Presupuesto (€)</label><input type="number" id="drawer-budget" value="${lead.budget||''}" min="0" placeholder="25000"></div>
      <div><label>Web</label><input type="text" id="drawer-web" value="${lead.website||''}" placeholder="https://..."></div>
    </div>
    <div style="margin-bottom:.75rem">
      <label>Notas internas</label>
      <textarea id="drawer-notes" rows="4" placeholder="Escribe / para comandos rápidos...">${lead.notes||''}</textarea>
    </div>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem">
      <button class="btn-primary btn-sm" onclick="saveDrawerLead('${lead.id}')">Guardar</button>
      ${lead.email ? `<button class="btn-outline btn-sm" onclick="openAiEmailModal('${lead.id}');closeDrawer()">✨ Email IA</button>` : ''}
      <button class="btn-outline btn-sm" onclick="logCall('${lead.id}')">📞 Llamada</button>
      <button class="btn-outline btn-sm" onclick="openBriefingModal('${lead.id}')" title="Briefing IA para visita">🧠 Briefing</button>
      <button class="btn-outline btn-sm" onclick="markNotInterested('${lead.id}')" style="color:var(--danger)">🚫 No interesa</button>
    </div>
    <div style="border-top:1px solid var(--glass-border);padding-top:.75rem;margin-bottom:.75rem" id="drawer-thread-section">
      <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);font-weight:600;margin-bottom:.5rem">
        Hilo de emails ${prevEmails.length > 0 ? '(' + prevEmails.length + ')' : ''}
      </div>
      ${buildEmailThread(prevEmails)}
      <div class="inline-paste-zone" id="drawer-paste-zone-${lead.id}"
        onclick="expandInlinePaste('${lead.id}')"
        ondragover="event.preventDefault();this.classList.add('dragover')"
        ondragleave="this.classList.remove('dragover')"
        ondrop="handleInlineDrop(event,'${lead.id}')"
        style="margin-top:.6rem">
        <span style="font-size:1rem">📋</span>
        <span id="drawer-paste-hint-${lead.id}">Pega aquí la respuesta recibida de Outlook</span>
        <textarea class="inline-paste-textarea" id="drawer-paste-ta-${lead.id}"
          placeholder="Pega el email de respuesta (Ctrl+V)..."
          oninput="onInlinePasteInput(this,'${lead.id}')"
          onclick="event.stopPropagation()"
        ></textarea>
        <button id="drawer-paste-btn-${lead.id}" class="btn-action btn-sm"
          style="display:none;flex-shrink:0"
          onclick="event.stopPropagation();registerInlineReply('${lead.id}')">
          ✅ Registrar
        </button>
      </div>
    </div>
    </div>
    <div style="border-top:1px solid var(--glass-border);padding-top:.75rem">
      <div style="font-size:.68rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text-dim);font-weight:600;margin-bottom:.4rem">Actividad</div>
      <div class="activity-log">${actLog}</div>
    </div>
  `;

  // Slash command on notes textarea
  setTimeout(() => {
    const ta = document.getElementById('drawer-notes');
    if (ta) ta.addEventListener('keyup', e => handleSlashCommand(e, lead.id));
  }, 50);
}

function saveDrawerLead(id) {
  const lead = leads.find(l => l.id == id);
  if (!lead) return;
  const oldStatus = lead.status;
  lead.email = document.getElementById('drawer-email')?.value.trim() || lead.email;
  lead.phone = document.getElementById('drawer-phone')?.value.trim() || lead.phone;
  const dwWa = document.getElementById('drawer-whatsapp');
  if (dwWa && dwWa.value.trim()) lead.whatsapp = dwWa.value.trim();
  lead.status = document.getElementById('drawer-status')?.value || lead.status;
  lead.website = document.getElementById('drawer-web')?.value.trim() || lead.website;
  lead.notes = document.getElementById('drawer-notes')?.value.trim() || '';
  lead.next_contact = document.getElementById('drawer-next-contact')?.value || '';
  lead.budget = parseFloat(document.getElementById('drawer-budget')?.value) || 0;
  if (lead.status !== oldStatus) {
    lead.status_date = new Date().toISOString();
    addActivityLog(id, `Estado cambiado: ${oldStatus} → ${lead.status}`);
    applySequenceRule(lead, lead.status); // MEJORA 2
  }
  lead.score = recalculateLeadScore(lead);
  saveLeads(); renderAll();
  showToast('Lead guardado ✓');
  updateFollowupBadge();
}

function drawerNav(dir) {
  const idx = drawerFilteredIds.indexOf(String(drawerLeadId));
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= drawerFilteredIds.length) return;
  // Auto-save before navigating
  saveDrawerLead(drawerLeadId);
  drawerLeadId = drawerFilteredIds[newIdx];
  renderDrawer();
}

function closeDrawer() {
  // Auto-save on close
  if (drawerLeadId) saveDrawerLead(drawerLeadId);
  document.getElementById('lead-drawer').classList.remove('open');
  document.getElementById('drawer-backdrop').style.display = 'none';
  drawerLeadId = null;
}

// Override openLeadDetail to use drawer instead of modal
const _origOpenLeadDetail = openLeadDetail;
openLeadDetail = function(id) { openLeadDrawer(id); };

// Arrow key navigation when drawer is open
document.addEventListener('keydown', e => {
  if (!drawerLeadId) return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    drawerNav(e.key === 'ArrowDown' ? 1 : -1);
  }
});

// ── MEJORA 3: Slash commands en notas ─────────────────────────────────────────
const SLASH_COMMANDS = [
  { cmd: '/llamada',      icon: '📞', label: 'Registrar llamada',        action: (id) => { logCall(id); } },
  { cmd: '/email',        icon: '✉️',  label: 'Email enviado',            action: (id, ta) => insertNoteText(ta, `[${hoy()}] ✉️ Email enviado`) },
  { cmd: '/visita',       icon: '🤝', label: 'Visita agendada',           action: (id, ta) => insertNoteText(ta, `[${hoy()}] 🤝 Visita agendada`) },
  { cmd: '/presupuesto',  icon: '💶', label: 'Presupuesto enviado',       action: (id, ta) => insertNoteText(ta, `[${hoy()}] 💶 Presupuesto enviado: `) },
  { cmd: '/nocontesta',   icon: '📵', label: 'No contesta',               action: (id, ta) => insertNoteText(ta, `[${hoy()}] 📵 No contesta`) },
  { cmd: '/seguimiento',  icon: '🔔', label: 'Seguimiento pendiente',     action: (id, ta) => insertNoteText(ta, `[${hoy()}] 🔔 Seguimiento: `) },
  { cmd: '/cierre',       icon: '🏆', label: 'Cerrar lead',               action: (id) => { ctxSetStatus(id, 'Cerrado'); } },
];

function hoy() { return new Date().toLocaleDateString('es-ES',{day:'2-digit',month:'short'}); }

function insertNoteText(ta, text) {
  if (!ta) return;
  // Remove the /command typed
  const val = ta.value;
  const lastSlash = val.lastIndexOf('/');
  ta.value = (lastSlash >= 0 ? val.slice(0, lastSlash) : val) + text;
  ta.selectionStart = ta.selectionEnd = ta.value.length;
  ta.focus();
  closeSlashPopup();
}

let slashPopupActive = false;
let slashSelectedIdx = 0;

function handleSlashCommand(e, leadId) {
  const ta = e.target;
  const val = ta.value;
  const lastSlash = val.lastIndexOf('/');

  if (lastSlash === -1 || (val.length - lastSlash > 15)) {
    closeSlashPopup(); return;
  }

  const typed = val.slice(lastSlash).toLowerCase();
  const matches = SLASH_COMMANDS.filter(c => c.cmd.startsWith(typed));

  if (!matches.length) { closeSlashPopup(); return; }

  if (e.key === 'Enter' && slashPopupActive) {
    e.preventDefault();
    const items = document.querySelectorAll('.slash-item');
    const active = items[slashSelectedIdx] || items[0];
    if (active) active.click();
    return;
  }
  if (e.key === 'ArrowDown' && slashPopupActive) { slashSelectedIdx = Math.min(slashSelectedIdx+1, matches.length-1); renderSlashPopup(matches, leadId, ta); return; }
  if (e.key === 'ArrowUp' && slashPopupActive) { slashSelectedIdx = Math.max(slashSelectedIdx-1, 0); renderSlashPopup(matches, leadId, ta); return; }
  if (e.key === 'Escape') { closeSlashPopup(); return; }

  slashSelectedIdx = 0;
  renderSlashPopup(matches, leadId, ta);
}

function renderSlashPopup(matches, leadId, ta) {
  const popup = document.getElementById('slash-popup');
  if (!popup) return;
  const rect = ta.getBoundingClientRect();
  popup.style.left = rect.left + 'px';
  popup.style.top = (rect.bottom + 4) + 'px';
  popup.style.display = 'block';
  slashPopupActive = true;
  popup.innerHTML = matches.map((c, i) => `
    <div class="slash-item ${i===slashSelectedIdx?'slash-active':''}" onclick="execSlashCmd(${SLASH_COMMANDS.indexOf(c)},'${leadId}',event)">
      <span>${c.icon}</span>
      <span class="slash-cmd">${c.cmd}</span>
      <span style="color:var(--text-dim)">${c.label}</span>
    </div>`).join('');
}

function execSlashCmd(cmdIdx, leadId, e) {
  if (e) e.stopPropagation();
  const cmd = SLASH_COMMANDS[cmdIdx];
  if (!cmd) return;
  const ta = document.getElementById('drawer-notes');
  cmd.action(leadId, ta);
  closeSlashPopup();
}

function closeSlashPopup() {
  const p = document.getElementById('slash-popup');
  if (p) p.style.display = 'none';
  slashPopupActive = false;
  slashSelectedIdx = 0;
}

document.addEventListener('click', e => {
  if (!document.getElementById('slash-popup')?.contains(e.target)) closeSlashPopup();
});

// ── MEJORA 4: Badge de seguimientos pendientes en el sidebar ──────────────────
function updateFollowupBadge() {
  const today = new Date(); today.setHours(0,0,0,0);
  const overdue = leads.filter(l => {
    if (l.archived || !l.next_contact) return false;
    const nc = new Date(l.next_contact); nc.setHours(0,0,0,0);
    return nc <= today;
  });
  const badge = document.getElementById('followup-badge');
  if (!badge) return;
  if (overdue.length > 0) {
    badge.textContent = overdue.length > 9 ? '9+' : overdue.length;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

// Banner de seguimientos pendientes en la vista de leads
const _origRenderLeads = renderLeads;
renderLeads = function() {
  _origRenderLeads();
  updateFollowupBadge();
  renderFollowupBanner();
};

function renderFollowupBanner() {
  const today = new Date(); today.setHours(0,0,0,0);
  const overdue = leads.filter(l => {
    if (l.archived || !l.next_contact) return false;
    const nc = new Date(l.next_contact); nc.setHours(0,0,0,0);
    return nc <= today;
  });
  let banner = document.getElementById('followup-banner');
  if (!overdue.length) { if (banner) banner.remove(); return; }
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'followup-banner';
    banner.style.cssText = 'background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:10px;padding:.65rem 1rem;display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem;font-size:.83rem;';
    const leadsPanel = document.querySelector('#leads-view .glass-panel:last-of-type');
    const filterPanel = document.querySelector('#leads-view .glass-panel:first-of-type');
    if (filterPanel) filterPanel.after(banner);
  }
  banner.innerHTML = `<span style="font-size:1.1rem">⚠️</span>
    <span><strong>${overdue.length} seguimiento${overdue.length>1?'s':''} pendiente${overdue.length>1?'s':''}</strong> —
      ${overdue.slice(0,3).map(l=>`<span style="color:var(--primary);cursor:pointer" onclick="openLeadDrawer('${l.id}')">${l.company}</span>`).join(', ')}${overdue.length>3?' y '+(overdue.length-3)+' más':''}
    </span>
    <button class="btn-action btn-sm" style="margin-left:auto" onclick="document.getElementById('sort-leads').value='next_contact';renderLeads()">Ver ordenados</button>`;
}

// ── MEJORA 5: Búsquedas guardadas v2 ──────────────────────────────────────────
const MAX_SAVED_SEARCHES = 10;
const SAVED_SEARCHES_KEY = 'gordi_saved_searches';
let ssCompareSelection = [];
let ssCurrentFilter = '';
const SEGMENT_ICONS = { Industrial:'🏭', Retail:'🛍️', Oficinas:'🏢', Hoteles:'🏨', Educativo:'🎓', Deportivo:'⚽', Cultural:'🎭', Comercial:'🏬' };

function getSavedSearches() {
  try { return JSON.parse(localStorage.getItem(SAVED_SEARCHES_KEY) || '[]'); } catch { return []; }
}
function saveSavedSearches(arr) {
  try { localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(arr)); } catch {
    arr.forEach(s => { s.results = []; });
    try { localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(arr)); } catch {}
  }
}
function getSearchBadge(s) {
  const enrichRate = s.count > 0 ? (s.enriched || 0) / s.count : 0;
  if (s.imported > 0 && enrichRate > 0.5) return { cls:'ss-badge-full', label:'Completa' };
  if (s.count > 0 && (s.imported > 0 || enrichRate > 0)) return { cls:'ss-badge-partial', label:'Parcial' };
  return { cls:'ss-badge-new', label:'Nueva' };
}
function saveCurrentSearch(results, segment, location, importedCount) {
  if (!results.length) return;
  const searches = getSavedSearches();
  const existing = searches.findIndex(s => s.segment === segment && s.location === location);
  const pinned = existing >= 0 ? searches[existing].pinned : false;
  const label  = existing >= 0 ? searches[existing].label  : null;
  if (existing >= 0) searches.splice(existing, 1);
  const enriched = results.filter(r => r.email || r.phone || (r.enrichSource||[]).length > 0).length;
  searches.unshift({ id:Date.now(), segment, location, label, pinned:pinned||false, date:new Date().toISOString(), count:results.length, imported:importedCount||0, enriched, results:results.slice(0,500) });
  const pinnedItems = searches.filter(s => s.pinned);
  const unpinned = searches.filter(s => !s.pinned).slice(0, MAX_SAVED_SEARCHES - pinnedItems.length);
  saveSavedSearches([...pinnedItems, ...unpinned]);
  renderSavedSearches();
}
function renderSavedSearches(filter) {
  if (filter !== undefined) ssCurrentFilter = filter;
  const allSearches = getSavedSearches();
  const panel = document.getElementById('saved-searches-panel');
  const list  = document.getElementById('saved-searches-list');
  if (!panel || !list) return;
  if (!allSearches.length) { panel.style.display='none'; return; }
  panel.style.display = 'block';
  const sorted = [...allSearches.filter(s => s.pinned), ...allSearches.filter(s => !s.pinned)];
  const q = (ssCurrentFilter||'').toLowerCase().trim();
  const searches = q ? sorted.filter(s => (s.label||s.segment+' '+s.location).toLowerCase().includes(q)) : sorted;
  const countEl = document.getElementById('ss-count-label');
  if (countEl) countEl.textContent = searches.length + ' búsqueda' + (searches.length!==1?'s':'');
  const cmpBtn = document.getElementById('ss-compare-btn');
  const cmpHint = document.getElementById('ss-compare-hint');
  if (cmpBtn) cmpBtn.style.display = ssCompareSelection.length === 2 ? 'inline-block' : 'none';
  if (cmpHint) cmpHint.classList.toggle('visible', ssCompareSelection.length === 1);
  if (!searches.length) { list.innerHTML = '<div class="ss-empty">Sin resultados para "' + q + '"</div>'; return; }
  list.innerHTML = searches.map((s, i) => {
    const isOpen = i === 0 && !q;
    const badge  = getSearchBadge(s);
    const isCmpSel = ssCompareSelection.includes(String(s.id));
    const dateStr = new Date(s.date).toLocaleDateString('es-ES',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
    const displayName = s.label || (s.segment + ' · ' + s.location);
    const enrichPct = s.count > 0 ? Math.round((s.enriched||0)/s.count*100) : 0;
    const previews = (s.results||[]).slice(0,3).map(r =>
      `<div class="ss-preview-item"><span style="opacity:.5">🏢</span><span style="overflow:hidden;text-overflow:ellipsis">${r.name||'—'}</span>${r.email?'<span style="margin-left:auto;opacity:.5;font-size:.65rem">✉</span>':''}</div>`
    ).join('');
    return `<div class="ss-accordion${isOpen?' ss-open':''}${s.pinned?' ss-pinned':''}${isCmpSel?' ss-compare-sel':''}" id="ss-acc-${s.id}">
      ${s.pinned ? '<div class="ss-pin-star">⭐</div>' : ''}
      <div class="ss-header" onclick="toggleSavedSearch('${s.id}')">
        <span style="font-size:.95rem">${SEGMENT_ICONS[s.segment]||'🔍'}</span>
        <div style="flex:1;min-width:0;overflow:hidden">
          <div class="ss-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${displayName}</div>
          <div class="ss-meta">${dateStr}</div>
        </div>
        <span class="ss-badge ${badge.cls}">${badge.label}</span>
        <span class="ss-chevron">▼</span>
      </div>
      <div class="ss-body"><div class="ss-body-inner">
        <div class="ss-stat-row">
          <span class="ss-stat">🏢 ${s.count}</span>
          <span class="ss-stat green">✅ ${s.imported} imp.</span>
          <span class="ss-stat grey">⚡ ${enrichPct}% enriq.</span>
        </div>
        ${previews ? `<div class="ss-preview-list">${previews}</div>` : ''}
        <div class="ss-rename-wrap" id="ss-rename-${s.id}">
          <input class="ss-rename-input" id="ss-rename-input-${s.id}" type="text" value="${s.label||displayName}" placeholder="Nombre personalizado..." onkeydown="if(event.key==='Enter')saveSsLabel('${s.id}')">
          <button class="ss-rename-save" onclick="saveSsLabel('${s.id}')">✓</button>
        </div>
        <div class="ss-actions">
          <button class="ss-btn ss-btn-load" onclick="loadSavedSearch('${s.id}')">▶ Cargar</button>
          <button class="ss-btn ss-btn-rerun" onclick="rerunSavedSearch('${s.id}')">🔄 Re-lanzar</button>
          <button class="ss-btn ss-btn-csv" onclick="exportSavedSearchCSV('${s.id}',event)">⬇ CSV</button>
          <button class="ss-btn ss-btn-pin" onclick="togglePin('${s.id}',event)">${s.pinned?'📌 Fijada':'📌 Fijar'}</button>
        </div>
        <div class="ss-actions" style="margin-top:.25rem">
          <button class="ss-btn ss-btn-csv" onclick="toggleSsRename('${s.id}')" style="flex:none;min-width:auto">✏ Renombrar</button>
          <button class="ss-btn" style="flex:none;min-width:auto;background:${isCmpSel?'rgba(167,139,250,.2)':'var(--glass)'};color:${isCmpSel?'#a78bfa':'var(--text-dim)'};border:1px solid ${isCmpSel?'#a78bfa':'var(--glass-border)'}" onclick="toggleCompareSelect('${s.id}')">⚖ ${isCmpSel?'Quitar':'Comparar'}</button>
          <button class="ss-btn ss-btn-del" onclick="deleteSavedSearch('${s.id}',event)" style="flex:none;min-width:auto">🗑</button>
        </div>
      </div></div>
    </div>`;
  }).join('');
}
function toggleSavedSearch(id) {
  const acc = document.getElementById('ss-acc-' + id);
  if (!acc) return;
  const isOpen = acc.classList.contains('ss-open');
  document.querySelectorAll('.ss-accordion').forEach(el => el.classList.remove('ss-open'));
  if (!isOpen) acc.classList.add('ss-open');
}
function filterSavedSearches(val) { renderSavedSearches(val); }
function loadSavedSearch(id) {
  const s = getSavedSearches().find(x => x.id == id);
  if (!s) return;
  if (!s.results?.length) { showToast('⚠️ Esta búsqueda no tiene resultados guardados'); return; }
  tempSearchResults = s.results;
  document.getElementById('plan-segment').value = s.segment;
  document.getElementById('plan-location').value = s.location;
  renderSearchCards(); showResultsPanel(); updateEnrichStats();
  showToast(`📂 Cargada: ${s.count} empresas de ${s.location} ⚡`);
}
function rerunSavedSearch(id) {
  const s = getSavedSearches().find(x => x.id == id);
  if (!s) return;
  document.getElementById('plan-segment').value = s.segment;
  document.getElementById('plan-location').value = s.location;
  showToast(`🔄 Relanzando: ${s.segment} en ${s.location}...`);
  setTimeout(() => { if (typeof searchBusinesses === 'function') searchBusinesses(); }, 300);
}
function exportSavedSearchCSV(id, e) {
  e && e.stopPropagation();
  const s = getSavedSearches().find(x => x.id == id);
  if (!s || !s.results?.length) { showToast('⚠️ Sin datos para exportar'); return; }
  const prev = window.tempSearchResults;
  tempSearchResults = s.results;
  exportSearchCSV();
  tempSearchResults = prev;
}
function togglePin(id, e) {
  e && e.stopPropagation();
  const searches = getSavedSearches();
  const s = searches.find(x => x.id == id);
  if (!s) return;
  s.pinned = !s.pinned;
  saveSavedSearches(searches);
  renderSavedSearches();
  showToast(s.pinned ? '📌 Búsqueda fijada' : '📌 Búsqueda desfijada');
}
function toggleSsRename(id) {
  const wrap = document.getElementById('ss-rename-' + id);
  if (!wrap) return;
  wrap.classList.toggle('visible');
  if (wrap.classList.contains('visible')) document.getElementById('ss-rename-input-' + id)?.focus();
}
function saveSsLabel(id) {
  const input = document.getElementById('ss-rename-input-' + id);
  if (!input) return;
  const searches = getSavedSearches();
  const s = searches.find(x => x.id == id);
  if (!s) return;
  s.label = input.value.trim() || null;
  saveSavedSearches(searches);
  renderSavedSearches();
  showToast('✏ Nombre guardado');
}
function toggleCompareSelect(id) {
  const sid = String(id);
  const idx = ssCompareSelection.indexOf(sid);
  if (idx >= 0) { ssCompareSelection.splice(idx, 1); }
  else {
    if (ssCompareSelection.length >= 2) { showToast('⚠️ Solo puedes comparar 2 búsquedas'); return; }
    ssCompareSelection.push(sid);
  }
  renderSavedSearches();
}
function openCompareModal() {
  if (ssCompareSelection.length !== 2) return;
  const all = getSavedSearches();
  const [a, b] = ssCompareSelection.map(id => all.find(s => String(s.id) === id)).filter(Boolean);
  if (!a || !b) return;
  function col(s) {
    const enrichPct = s.count > 0 ? Math.round((s.enriched||0)/s.count*100) : 0;
    const emailCount = (s.results||[]).filter(r => r.email).length;
    const phoneCount = (s.results||[]).filter(r => r.phone).length;
    const topCompanies = (s.results||[]).slice(0,5).map(r => `<div class="ss-compare-company">🏢 ${r.name||'—'}${r.rating?' ★'+r.rating:''}</div>`).join('');
    return `<div class="ss-compare-col">
      <h3>${SEGMENT_ICONS[s.segment]||'🔍'} ${s.label||s.segment+' · '+s.location}</h3>
      <div class="ss-compare-stat"><span>📍 Zona</span><span class="ss-compare-val">${s.location}</span></div>
      <div class="ss-compare-stat"><span>🏢 Empresas</span><span class="ss-compare-val">${s.count}</span></div>
      <div class="ss-compare-stat"><span>✉ Con email</span><span class="ss-compare-val">${emailCount}</span></div>
      <div class="ss-compare-stat"><span>📞 Con teléfono</span><span class="ss-compare-val">${phoneCount}</span></div>
      <div class="ss-compare-stat"><span>⚡ Enriquecidas</span><span class="ss-compare-val">${enrichPct}%</span></div>
      <div class="ss-compare-stat"><span>✅ Importadas</span><span class="ss-compare-val">${s.imported}</span></div>
      <div style="margin-top:.75rem;font-size:.72rem;font-weight:600;color:var(--text-dim);margin-bottom:.3rem">TOP EMPRESAS</div>
      ${topCompanies}
    </div>`;
  }
  document.getElementById('ss-compare-content').innerHTML = `
    <div class="ss-compare-grid">${col(a)}${col(b)}</div>
    <div style="padding:.85rem 1.25rem;display:flex;gap:.5rem;border-top:1px solid var(--glass-border)">
      <button class="ss-btn ss-btn-load" style="max-width:200px" onclick="loadSavedSearch('${a.id}');closeCompareModal()">▶ Cargar ${a.label||a.location}</button>
      <button class="ss-btn ss-btn-load" style="max-width:200px" onclick="loadSavedSearch('${b.id}');closeCompareModal()">▶ Cargar ${b.label||b.location}</button>
    </div>`;
  document.getElementById('ss-compare-modal').classList.add('open');
}
function closeCompareModal() { document.getElementById('ss-compare-modal')?.classList.remove('open'); }
function deleteSavedSearch(id, e) {
  e && e.stopPropagation();
  saveSavedSearches(getSavedSearches().filter(s => s.id != id));
  ssCompareSelection = ssCompareSelection.filter(x => x !== String(id));
  renderSavedSearches();
}


// ══════════════════════════════════════════════════════════════════════════
// ██  MÓDULO: INIT
// ──  Inicialización de la aplicación al cargar la página
// ──  Funciones: Llamadas de arranque: loadLeads, detectOAuthToken, checkMobileLayout, etc.
// ══════════════════════════════════════════════════════════════════════════


// Hook: guardar búsqueda automáticamente al terminar el scraping
const _origResetSearchBtn = resetSearchBtn;
resetSearchBtn = function() {
  _origResetSearchBtn();
  if (tempSearchResults.length > 0) {
    const seg = document.getElementById('plan-segment')?.value || '';
    const loc = document.getElementById('plan-location')?.value || '';
    const imported = leads.filter(l => l.source === 'search' && l.date > new Date(Date.now()-300000).toISOString()).length;
    saveCurrentSearch(tempSearchResults, seg, loc, imported);
  }
};

// Init on load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    updateFollowupBadge();
    renderSavedSearches();
  }, 500);
});




// ══════════════════════════════════════════════════════════════════════════
// ██  QR SYNC — Genera un QR con la config cifrada para otros dispositivos
// ══════════════════════════════════════════════════════════════════════════

let _qrExpireTimer = null;

function collectQRPayload() {
  const inc = {
    keys:      document.getElementById('qr-inc-keys')?.checked,
    profile:   document.getElementById('qr-inc-profile')?.checked,
    sheets:    document.getElementById('qr-inc-sheets')?.checked,
    templates: document.getElementById('qr-inc-templates')?.checked,
  };

  const payload = { v: 2, t: Date.now(), exp: Date.now() + 5 * 60 * 1000 };

  if (inc.keys) {
    payload.keys = {
      g:  localStorage.getItem('gordi_api_key')      || '',
      h:  localStorage.getItem('gordi_hunter_key')   || '',
      a:  localStorage.getItem('gordi_apollo_key')   || '',
      ge: localStorage.getItem('gordi_gemini_key')   || '',
      cl: localStorage.getItem('gordi_claude_key')   || '',
    };
  }
  if (inc.profile) {
    payload.profile = {
      n:  localStorage.getItem('gordi_user_name')    || '',
      e:  localStorage.getItem('gordi_user_email')   || '',
      co: localStorage.getItem('gordi_user_company') || '',
      p:  localStorage.getItem('gordi_user_phone')   || '',
      w:  localStorage.getItem('gordi_user_web')     || '',
      // Logo excluido del QR: puede ser base64 de cientos de KB
    };
  }
  if (inc.sheets) {
    payload.sheets = {
      id:  localStorage.getItem('gordi_sheets_id')        || '',
      cid: localStorage.getItem('gordi_sheets_client_id') || '',
      // No incluimos el token OAuth (expira en 1h y es intransferible entre origins)
    };
  }
  if (inc.templates) {
    try {
      const tpl = localStorage.getItem('gordi_templates');
      if (tpl) payload.templates = tpl;
    } catch {}
  }
  return payload;
}

// URL pública de la app — el QR apunta siempre aquí
const VOLTFLOW_PUBLIC_URL = 'https://alfredosalaz-sys.github.io/Voltflow/index.html';

function generateQR() {
  const payload = collectQRPayload();
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));

  // Construir URL directa: el móvil escanea, abre la app en GitHub Pages
  // y detectAndApplySync() lee ?vfsync= y aplica la configuración automáticamente
  const syncUrl = VOLTFLOW_PUBLIC_URL + '?vfsync=' + encodeURIComponent(encoded);

  const statusEl = document.getElementById('qr-status');

  if (syncUrl.length > 2953) {
    statusEl.innerHTML =
      '⚠️ Demasiados datos para un QR.<br>' +
      '<span style="font-size:.75rem;color:var(--text-dim)">Desmarca "Plantillas" o "Perfil" e inténtalo de nuevo.</span>';
    return;
  }

  _drawQR(syncUrl);

  const parts = [];
  if (document.getElementById('qr-inc-keys')?.checked)      parts.push('API keys');
  if (document.getElementById('qr-inc-profile')?.checked)   parts.push('perfil');
  if (document.getElementById('qr-inc-sheets')?.checked)    parts.push('Sheets');
  if (document.getElementById('qr-inc-templates')?.checked) parts.push('plantillas');

  statusEl.innerHTML =
    '✅ <strong>QR listo.</strong> Incluye: ' + parts.join(', ') + '<br>' +
    '<span style="font-size:.75rem;color:var(--text-dim)">Escanea con la cámara del móvil — se abrirá la app con todo configurado automáticamente.</span>';
}

function _drawQR(text) {
  // Load qrcode lib dynamically if not loaded
  if (typeof qrcode === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    s.onload = () => _renderQRCanvas(text);
    s.onerror = () => _renderQRFallback(text);
    document.head.appendChild(s);
  } else {
    _renderQRCanvas(text);
  }
}

function _renderQRCanvas(text) {
  const container = document.getElementById('qr-container');
  const placeholder = document.getElementById('qr-placeholder');
  const canvas = document.getElementById('qr-canvas');

  // Clear previous QR
  container.innerHTML = '';

  // Use qrcodejs library
  const qrDiv = document.createElement('div');
  qrDiv.style.cssText = 'border-radius:10px;overflow:hidden;';
  container.appendChild(qrDiv);

  try {
    new QRCode(qrDiv, {
      text: text,
      width: 176,
      height: 176,
      colorDark: '#0a0f1e',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });

    // Show controls
    document.getElementById('qr-download-btn').style.display = 'inline-flex';
    document.getElementById('qr-refresh-btn').style.display = 'inline-flex';
    document.getElementById('qr-expire-info').style.display = 'block';

    // Start 5min countdown
    _startQRCountdown(5 * 60);

    // Count what's included
    const parts = [];
    if (document.getElementById('qr-inc-keys')?.checked)      parts.push('API keys');
    if (document.getElementById('qr-inc-profile')?.checked)   parts.push('perfil');
    if (document.getElementById('qr-inc-sheets')?.checked)    parts.push('Sheets config');
    if (document.getElementById('qr-inc-templates')?.checked) parts.push('plantillas');

    document.getElementById('qr-status').innerHTML =
      '✅ <strong>QR listo.</strong> Escanéalo con el dispositivo nuevo.<br>' +
      '<span style="color:var(--text-dim)">Incluye: ' + parts.join(', ') + '</span>';

  } catch(err) {
    document.getElementById('qr-status').textContent = '⚠️ Error generando QR: ' + err.message;
  }
}

function _renderQRFallback(text) {
  // Fallback: use Google Charts QR API
  const container = document.getElementById('qr-container');
  container.innerHTML = '';
  const img = document.createElement('img');
  img.src = 'https://chart.googleapis.com/chart?chs=176x176&cht=qr&chl=' + encodeURIComponent(text) + '&choe=UTF-8';
  img.style.cssText = 'width:176px;height:176px;border-radius:10px;';
  img.alt = 'QR Voltflow Sync';
  container.appendChild(img);
  document.getElementById('qr-download-btn').style.display = 'none'; // can't download cross-origin img
  document.getElementById('qr-refresh-btn').style.display = 'inline-flex';
  document.getElementById('qr-expire-info').style.display = 'block';
  _startQRCountdown(5 * 60);
  document.getElementById('qr-status').innerHTML = '✅ <strong>QR listo</strong> (modo alternativo). Escanéalo ahora.';
}

function _startQRCountdown(seconds) {
  if (_qrExpireTimer) clearInterval(_qrExpireTimer);
  let remaining = seconds;
  const el = document.getElementById('qr-expire-countdown');
  const update = () => {
    if (remaining <= 0) {
      clearInterval(_qrExpireTimer);
      document.getElementById('qr-status').innerHTML =
        '⏰ <strong>QR caducado.</strong> Genera uno nuevo.';
      document.getElementById('qr-container').innerHTML =
        '<div style="text-align:center;padding:1rem"><div style="font-size:2rem">⏰</div><div style="font-size:.72rem;color:var(--text-dim)">Caducado</div></div>';
      document.getElementById('qr-download-btn').style.display = 'none';
      document.getElementById('qr-expire-info').style.display = 'none';
      return;
    }
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    if (el) el.textContent = m + ':' + String(s).padStart(2, '0');
    remaining--;
  };
  update();
  _qrExpireTimer = setInterval(update, 1000);
}

function downloadQR() {
  const img = document.querySelector('#qr-container img');
  if (!img) { showToast('⚠️ Primero genera el QR'); return; }
  const a = document.createElement('a');
  a.href = img.src;
  a.download = 'voltflow-sync-qr.png';
  a.click();
}

// ── AUTO-ACTIVACIÓN al escanear el QR ─────────────────────────────────────
(function detectAndApplySync() {
  // Soporte legacy: parámetro ?vfsync= en URL (app en servidor)
  const params = new URLSearchParams(location.search);
  const raw = params.get('vfsync');
  if (!raw) return;

  history.replaceState(null, '', location.pathname);

  try {
    const payload = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(raw)))));

    // Check expiry
    if (payload.exp && Date.now() > payload.exp) {
      setTimeout(() => showToast('⚠️ Este QR ha caducado. Genera uno nuevo desde el dispositivo original.'), 1000);
      return;
    }

    let applied = [];

    if (payload.keys) {
      const map = {
        g:  'gordi_api_key',
        h:  'gordi_hunter_key',
        a:  'gordi_apollo_key',
        ge: 'gordi_gemini_key',
        cl: 'gordi_claude_key',
      };
      Object.entries(payload.keys).forEach(([k, v]) => {
        if (v && map[k]) localStorage.setItem(map[k], v);
      });
      applied.push('🔑 API keys');
    }

    if (payload.profile) {
      const map = {
        n:  'gordi_user_name',
        e:  'gordi_user_email',
        co: 'gordi_user_company',
        p:  'gordi_user_phone',
        w:  'gordi_user_web',
        l:  'gordi_user_logo',
      };
      Object.entries(payload.profile).forEach(([k, v]) => {
        if (v && map[k]) localStorage.setItem(map[k], v);
      });
      applied.push('👤 perfil');
    }

    if (payload.sheets) {
      if (payload.sheets.id)  localStorage.setItem('gordi_sheets_id', payload.sheets.id);
      if (payload.sheets.cid) localStorage.setItem('gordi_sheets_client_id', payload.sheets.cid);
      applied.push('📊 Sheets config');
    }

    if (payload.templates) {
      try { localStorage.setItem('gordi_templates', payload.templates); applied.push('✉ plantillas'); } catch {}
    }

    // Show success banner + auto-launch Sheets OAuth if cid present
    setTimeout(async () => {
      showToast('✅ ¡Sincronización aplicada! ' + applied.join(', '));
      // If JSONBin was restored, auto-pull all data immediately
      if (payload.jsonbin?.k) {
        setTimeout(async () => {
          showToast('🔄 Descargando datos de la nube...');
          await jsonbinPull(false);
          showToast('✅ Datos sincronizados');
        }, 1200);
      }

      // Show persistent banner
      const banner = document.createElement('div');
      banner.style.cssText = [
        'position:fixed;top:1rem;left:50%;transform:translateX(-50%);z-index:999',
        'background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff',
        'border-radius:14px;padding:.85rem 1.5rem;box-shadow:0 8px 32px rgba(99,102,241,.4)',
        'font-size:.85rem;font-weight:600;display:flex;align-items:center;gap:.75rem;max-width:90vw'
      ].join(';');
      banner.innerHTML = [
        '<span style="font-size:1.3rem">📱</span>',
        '<div>',
        '  <div>¡Sincronización completada!</div>',
        '  <div style="font-weight:400;font-size:.75rem;opacity:.85">' + applied.join(' · ') + '</div>',
        '</div>',
        payload.sheets?.cid
          ? '<button onclick="initSheetsOAuth();this.parentElement.parentElement.remove()" style="background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.3);color:#fff;border-radius:8px;padding:.35rem .75rem;font-size:.75rem;font-weight:700;cursor:pointer;white-space:nowrap">🔑 Autorizar Sheets</button>'
          : '',
        '<button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:rgba(255,255,255,.7);font-size:1.1rem;cursor:pointer;margin-left:.5rem">✕</button>'
      ].join('');
      document.body.appendChild(banner);

      // Auto-dismiss after 12s
      setTimeout(() => banner.remove(), 12000);

      // If sheets cid present and no valid token, offer OAuth
      if (payload.sheets?.cid && !isTokenValid()) {
        setTimeout(() => {
          if (confirm('¿Autorizar Google Sheets ahora para sincronización completa?')) {
            initSheetsOAuth();
          }
        }, 1500);
      }
    }, 800);

  } catch(e) {
    setTimeout(() => showToast('⚠️ Error al leer el QR de sincronización'), 800);
  }
})();



// ══════════════════════════════════════════════════════════════════════════
// ██  REPLY MODAL — Respuesta inteligente a emails recibidos
// ══════════════════════════════════════════════════════════════════════════

let _replyCurrentIdx = -1;
let _replyCurrentTone = 'profesional';

function openReplyModal(idx) {
  _replyCurrentIdx = idx;
  _replyCurrentTone = 'profesional';
  const em = _inboxMatched[idx];
  if (!em) return;

  const overlay = document.getElementById('reply-modal-overlay');
  overlay.style.display = 'flex';
  document.getElementById('reply-loading').style.display = 'block';
  document.getElementById('reply-result').style.display = 'none';
  document.getElementById('reply-error').style.display = 'none';
  document.getElementById('reply-tactic').style.display = 'none';

  const lead = em.lead;
  document.getElementById('reply-modal-title').textContent =
    `✨ Responder a ${em.name || em.email}`;
  document.getElementById('reply-modal-sub').textContent =
    lead ? `Lead: ${lead.company} · ${lead.status}` : 'Contacto sin lead asociado';

  // Show received email context
  document.getElementById('reply-received-ctx').innerHTML =
    `<strong style="color:var(--text)">📨 Email recibido:</strong><br>
     <span style="color:var(--text-dim)">De: ${em.name} &lt;${em.email}&gt;</span><br>
     <span style="color:var(--text-dim)">Asunto: ${em.subject || '—'}</span><br>
     <div style="margin-top:.4rem;padding:.5rem;background:rgba(255,255,255,.04);border-radius:6px">
       ${(em.body || 'Sin cuerpo detectado').slice(0, 300)}${em.body?.length > 300 ? '…' : ''}
     </div>`;

  generateReplyEmail(em, lead, _replyCurrentTone);
}

async function generateReplyEmail(em, lead, tone) {
  const key = localStorage.getItem('gordi_claude_key') || localStorage.getItem('gordi_gemini_key');
  if (!key) {
    document.getElementById('reply-loading').style.display = 'none';
    document.getElementById('reply-error').style.display = 'block';
    document.getElementById('reply-error').textContent = '⚠️ Configura la API Key de Gemini en Configuración.';
    return;
  }

  document.getElementById('reply-loading-text').textContent = 'Analizando el email y el historial del lead...';

  const p = getProfile();
  const firma = buildFirmaText();
  const segTone = SEGMENT_TONE[lead?.segment] || SEGMENT_TONE['Default'];
  const prevEmails = lead ? emailHistory.filter(h => h.leadId == lead.id || h.email === lead.email) : [];
  const historialStr = prevEmails.slice(0, 3).map((h, i) =>
    `Email ${i+1} enviado (${new Date(h.date).toLocaleDateString('es-ES')}): "${h.subject}"`
  ).join(' | ');

  const toneMap = {
    'profesional': 'Formal y confiable. Serio pero amable.',
    'cercano':     'Cálido y personal. Como si ya os conocieseis.',
    'urgente':     'Directo y con sentido de oportunidad. Sin presión pero con claridad.',
    'conciso':     'Ultracorto. Máximo 3 frases. Solo lo esencial.'
  };

  const prompt = `Eres el responsable de ventas de Voltium Madrid. Has recibido este email y debes responder de forma profesional y persuasiva para avanzar la venta.

EMAIL RECIBIDO:
De: ${em.name} <${em.email}>
Asunto: ${em.subject || 'sin asunto'}
Cuerpo: "${em.body || 'sin cuerpo'}"

${lead ? `CONTEXTO DEL LEAD:
- Empresa: ${lead.company} | Sector: ${lead.segment}
- Estado: ${lead.status} | Score: ${lead.score || '?'}
- Dirección: ${lead.address || 'Madrid'}
- Rating Google: ${lead.rating ? lead.rating + '/5' : 'sin datos'}
- Señales: ${(lead.signals||[]).slice(0,3).join(', ') || 'ninguna'}
${lead.decision_maker ? '- Decisor: ' + lead.decision_maker : ''}` : ''}

${historialStr ? `HISTORIAL DE CONTACTO PREVIO:
${historialStr}` : ''}

TONO REQUERIDO: ${toneMap[tone] || toneMap['profesional']}
PERFIL DEL SECTOR: ${segTone.tone}
PROHIBIDO: ${segTone.forbidden}

INSTRUCCIONES:
1. Analiza EXACTAMENTE qué dice el email recibido (objeción, interés, duda, solicitud de info, rechazo)
2. Clasifica la intención: [INTERESADO / DUDA / OBJECIÓN / SOLICITUD_PRECIO / RECHAZO_SUAVE / OTRO]
3. Responde directamente a lo que dice — no ignores el contenido del email
4. Si hay una objeción, neutralízala con un argumento concreto de Voltium
5. Si pide precio/presupuesto, no des cifras — invita a una llamada/visita para valorar correctamente
6. Firma: usa la firma corporativa que te paso más abajo
7. Asunto: empieza con "Re: " y adapta el asunto original

FIRMA CORPORATIVA:
${firma}

VOLTIUM MADRID — DIFERENCIALES:
- Un único responsable técnico (no subcontratan)
- Presupuesto cerrado desde el primer día
- Trabajan sin interrumpir la actividad del cliente
- Documentación digital en tiempo real

Responde ÚNICAMENTE en JSON válido:
{"subject":"Re: asunto adaptado","body":"HTML de la respuesta con <br><br> entre párrafos y <strong> en máx 2 puntos clave","intent":"INTERESADO|DUDA|OBJECIÓN|SOLICITUD_PRECIO|RECHAZO_SUAVE|OTRO","tactic":"en 1 frase: qué detectaste en el email y cómo lo abordaste"}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.65, maxOutputTokens: 2000 } }),
        signal: AbortSignal.timeout(25000) }
    );
    const data = await res.json();
    let raw = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim() || '';
    raw = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const result = JSON.parse(raw);

    document.getElementById('reply-loading').style.display = 'none';
    document.getElementById('reply-result').style.display = 'block';
    document.getElementById('reply-subject-out').value = result.subject || '';
    document.getElementById('reply-body-editor').innerHTML = result.body || '';

    // Show intent badge + tactic
    const intentColors = {
      INTERESADO:'#34c759', DUDA:'#ff9500', OBJECIÓN:'#ef4444',
      SOLICITUD_PRECIO:'#007aff', RECHAZO_SUAVE:'#a78bfa', OTRO:'#7a8ba0'
    };
    const intentLabels = {
      INTERESADO:'✅ Interesado', DUDA:'❓ Tiene una duda', OBJECIÓN:'⚡ Objeción',
      SOLICITUD_PRECIO:'💰 Pide precio', RECHAZO_SUAVE:'😐 Rechazo suave', OTRO:'📝 Otro'
    };
    const ic = intentColors[result.intent] || '#7a8ba0';
    const il = intentLabels[result.intent] || result.intent;

    if (result.tactic) {
      document.getElementById('reply-tactic').innerHTML =
        `<span style="display:inline-block;padding:.1rem .45rem;border-radius:5px;
          font-size:.68rem;font-weight:700;margin-right:.5rem;
          background:${ic}22;color:${ic}">${il}</span>
         <strong>Táctica:</strong> ${result.tactic}`;
      document.getElementById('reply-tactic').style.display = 'block';
    }
    document.getElementById('reply-modal-sub').textContent = '✅ Respuesta generada — revisa y ajusta antes de enviar';

  } catch(e) {
    document.getElementById('reply-loading').style.display = 'none';
    document.getElementById('reply-error').style.display = 'block';
    document.getElementById('reply-error').textContent = '⚠️ Error: ' + e.message;
  }
}

function setReplyTone(btn, tone) {
  _replyCurrentTone = tone;
  document.querySelectorAll('.reply-tone-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // Regenerate with new tone
  const em = _inboxMatched[_replyCurrentIdx];
  if (!em) return;
  document.getElementById('reply-loading').style.display = 'block';
  document.getElementById('reply-result').style.display = 'none';
  generateReplyEmail(em, em.lead, tone);
}

function regenerateReply() {
  const em = _inboxMatched[_replyCurrentIdx];
  if (!em) return;
  document.getElementById('reply-loading').style.display = 'block';
  document.getElementById('reply-result').style.display = 'none';
  generateReplyEmail(em, em.lead, _replyCurrentTone);
}

function sendReplyEmail() {
  const subj = document.getElementById('reply-subject-out').value;
  const editor = document.getElementById('reply-body-editor');
  const body = editor ? editor.innerText : '';
  const em = _inboxMatched[_replyCurrentIdx];
  if (!em?.email) { showToast('⚠️ Sin email del remitente'); return; }
  window.location.href = `mailto:${em.email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
  closeReplyModal();
}

function copyReplyToClipboard() {
  const editor = document.getElementById('reply-body-editor');
  const subj = document.getElementById('reply-subject-out').value;
  const text = `Asunto: ${subj}

${editor ? editor.innerText : ''}`;
  navigator.clipboard.writeText(text).then(() => showToast('📋 Respuesta copiada al portapapeles'));
}

function closeReplyModal() {
  document.getElementById('reply-modal-overlay').style.display = 'none';
  _replyCurrentIdx = -1;
}

// ══════════════════════════════════════════════════════════════════════════
// ██  AI RANKING — TOP 5 oportunidades al acabar la búsqueda
// ══════════════════════════════════════════════════════════════════════════

function showAndRunAiRanking() {
  const panel = document.getElementById('ai-ranking-panel');
  panel.style.display = 'block';
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  runAiRanking();
}

async function runAiRanking() {
  const key = localStorage.getItem('gordi_claude_key') || localStorage.getItem('gordi_gemini_key');
  if (!key) { showToast('⚠️ Configura la API Key de Gemini'); return; }
  if (!tempSearchResults.length) { showToast('⚠️ Primero realiza una búsqueda'); return; }

  const btn = document.getElementById('ai-ranking-btn');
  if (btn) { btn.textContent = '⏳ Analizando...'; btn.disabled = true; }
  document.getElementById('ai-ranking-sub').textContent = 'Gemini está evaluando todas las empresas...';
  document.getElementById('ai-ranking-content').innerHTML =
    '<div style="text-align:center;padding:1.5rem;font-size:.82rem;color:var(--text-dim)">' +
    '<div style="font-size:1.5rem;margin-bottom:.5rem;animation:spin 1s linear infinite">⚙️</div>' +
    'Analizando ' + tempSearchResults.length + ' empresas...' +
    '</div>';

  // Prepare compact summary of all results for Gemini
  const segment = document.getElementById('plan-segment')?.value || 'desconocido';
  const location = document.getElementById('plan-location')?.value || 'España';

  const companiesSummary = tempSearchResults.slice(0, 50).map((c, i) => {
    const signals = (c.signals || []).slice(0, 3).join(' | ');
    return `${i+1}. ${c.name} | ⭐${c.rating||'?'}(${c.ratingCount||0}) | Email:${c.email?'SÍ':'NO'} | Decisor:${c.decision_maker?'SÍ':'NO'} | Web:${c.website?'SÍ':'NO'} | Dist:${c.distance||'?'} | Señales:${signals||'ninguna'} | Desc:${(c.description||'').slice(0,80)}`;
  }).join('\n');

  const segTone = SEGMENT_TONE[segment] || SEGMENT_TONE['Default'];

  const prompt = `Eres un experto en ventas B2B para Voltium Madrid (empresa de reformas y eficiencia energética en Madrid).

CONTEXTO:
- Sector buscado: ${segment}
- Zona: ${location}
- Dolor principal del sector: ${segTone.pain}
- Ángulo de venta más efectivo: ${segTone.angle}

EMPRESAS ENCONTRADAS (${tempSearchResults.length} en total, aquí las primeras 50):
${companiesSummary}

TAREA: Identifica las 5 empresas con MAYOR potencial de conversión para Voltium Madrid.

CRITERIOS DE PUNTUACIÓN (razona con estos factores):
1. SEÑALES DE NECESIDAD: ¿Tiene señales de problemas (ruido, antigüedad, sin HTTPS, web lenta, rating bajo)?
2. CAPACIDAD DE COMPRA: ¿Tiene muchas reseñas (negocio activo)? ¿Lleva años en el sector?
3. CONTACTABILIDAD: ¿Tiene email y/o decisor identificado?
4. URGENCIA: ¿Hay señales de reforma en curso, apertura reciente, expansión?
5. FIT CON VOLTIUM: ¿El tipo de negocio encaja bien con los servicios de Voltium?

Para cada empresa del TOP 5 explica:
- Por qué es una oportunidad (máx 2 frases, muy concretas)
- Cuál es el ángulo de apertura más efectivo para contactarla
- Qué nivel de urgencia tiene: ALTA / MEDIA / BAJA

Responde ÚNICAMENTE en JSON válido:
{"ranking":[{"position":1,"name":"nombre exacto","score":85,"reason":"por qué es top oportunidad","angle":"cómo abrir el contacto","urgency":"ALTA|MEDIA|BAJA"},...],"summary":"1 frase: patrón general que observas en los mejores leads de esta búsqueda"}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2500 } }),
        signal: AbortSignal.timeout(30000) }
    );
    const data = await res.json();
    let raw = data.candidates?.[0]?.content?.parts?.map(p => p.text||'').join('').trim() || '';
    raw = raw.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim();
    const result = JSON.parse(raw);

    renderAiRanking(result);
    if (btn) { btn.textContent = '🔄 Re-analizar'; btn.disabled = false; }
    document.getElementById('ai-ranking-sub').textContent = 'TOP 5 identificadas por Gemini IA';

  } catch(e) {
    document.getElementById('ai-ranking-content').innerHTML =
      '<div style="padding:1rem;color:var(--danger);font-size:.82rem">⚠️ Error: ' + e.message + '</div>';
    if (btn) { btn.textContent = '⚡ Reintentar'; btn.disabled = false; }
  }
}

function renderAiRanking(result) {
  const urgencyColors = { ALTA:'#ef4444', MEDIA:'#ff9500', BAJA:'#34c759' };
  const urgencyBg    = { ALTA:'rgba(239,68,68,.1)', MEDIA:'rgba(255,149,0,.1)', BAJA:'rgba(52,199,89,.1)' };

  const cards = (result.ranking || []).map((item, i) => {
    const uc = urgencyColors[item.urgency] || '#7a8ba0';
    const ub = urgencyBg[item.urgency]    || 'rgba(122,139,160,.1)';
    // Find company in results to enable "Cargar" action
    const company = tempSearchResults.find(c =>
      c.name?.toLowerCase().includes(item.name?.toLowerCase().split(' ')[0]?.toLowerCase() || '')
    );

    return `<div style="display:flex;gap:.75rem;align-items:flex-start;padding:.75rem;
      background:rgba(255,255,255,.03);border:1px solid var(--glass-border);
      border-radius:10px;margin-bottom:.5rem;transition:border-color .15s"
      onmouseenter="this.style.borderColor='rgba(99,102,241,.4)'"
      onmouseleave="this.style.borderColor='var(--glass-border)'">

      <div style="width:32px;height:32px;border-radius:8px;flex-shrink:0;
        background:linear-gradient(135deg,#6366f1,#8b5cf6);
        display:flex;align-items:center;justify-content:center;
        font-weight:800;font-size:.9rem;color:#fff">#${item.position}</div>

      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.3rem">
          <span style="font-weight:700;font-size:.88rem">${item.name}</span>
          <span style="font-size:.65rem;font-weight:700;padding:.1rem .45rem;border-radius:5px;
            background:${ub};color:${uc}">${item.urgency}</span>
          <span style="font-size:.68rem;color:var(--primary);font-weight:600;margin-left:auto">
            Score IA: ${item.score}/100</span>
        </div>
        <div style="font-size:.75rem;color:var(--text-dim);margin-bottom:.3rem;line-height:1.5">
          ${item.reason}
        </div>
        <div style="font-size:.73rem;padding:.3rem .6rem;border-radius:6px;
          background:rgba(0,150,255,.08);border:1px solid rgba(0,150,255,.15);
          color:var(--primary);line-height:1.4">
          💡 <strong>Ángulo:</strong> ${item.angle}
        </div>
      </div>
    </div>`;
  }).join('');

  const summary = result.summary
    ? `<div style="font-size:.75rem;color:var(--text-dim);padding:.6rem .8rem;
        border-top:1px solid var(--glass-border);margin-top:.5rem;font-style:italic">
        📊 ${result.summary}</div>`
    : '';

  document.getElementById('ai-ranking-content').innerHTML = cards + summary;
}

