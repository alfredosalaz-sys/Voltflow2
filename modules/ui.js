// ============ TOAST ============
function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:2rem;right:2rem;background:var(--bg2);border:1px solid var(--glass-border);color:var(--text);padding:.75rem 1.25rem;border-radius:10px;font-size:.83rem;z-index:9999;animation:fadeIn .3s ease;box-shadow:0 8px 24px rgba(0,0,0,.4)`;
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

// ============ LIGHT MODE ============
function toggleLightMode() {
  const isLight = document.body.classList.toggle('light-mode');
  localStorage.setItem('gordi_light_mode', isLight ? '1' : '0');
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = isLight ? '☀️ Claro' : '🌙 Oscuro';
}
function applyLightMode(on) {
  if (on) document.body.classList.add('light-mode');
  else document.body.classList.remove('light-mode');
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = on ? '☀️ Claro' : '🌙 Oscuro';
}

// ============ FONT SIZE ============
function setFontSize(scale, silent) {
  document.documentElement.style.setProperty('--font-scale', scale);
  if (!silent) localStorage.setItem('gordi_font_scale', scale);
}

// ============ BULK SELECTION ============
function toggleLeadSelect(cb) {
  const id = String(cb.getAttribute('data-id'));
  if (cb.checked) selectedLeadIds.add(id);
  else selectedLeadIds.delete(id);
  updateBulkBar();
}
function toggleAllLeadsCheck(checked) {
  const list = getFilteredLeads();
  list.forEach(l => {
    if (checked) selectedLeadIds.add(String(l.id));
    else selectedLeadIds.delete(String(l.id));
  });
  document.querySelectorAll('.lead-cb').forEach(cb => cb.checked = checked);
  updateBulkBar();
}
function updateBulkBar() {
  const bar = document.getElementById('bulk-bar');
  const cnt = document.getElementById('bulk-count');
  if (!bar) return;
  if (selectedLeadIds.size > 0) {
    bar.classList.add('show');
    cnt.textContent = selectedLeadIds.size + ' seleccionado' + (selectedLeadIds.size !== 1 ? 's' : '');
  } else {
    bar.classList.remove('show');
  }
}
function clearBulkSelection() {
  selectedLeadIds.clear();
  document.querySelectorAll('.lead-cb').forEach(cb => cb.checked = false);
  const all = document.getElementById('check-all-leads');
  if (all) all.checked = false;
  updateBulkBar();
}
function bulkChangeStatus(newStatus) {
  selectedLeadIds.forEach(id => {
    const l = leads.find(x => String(x.id) === id);
    if (l) {
      const old = l.status;
      l.status = newStatus;
      l.status_date = new Date().toISOString();
      addActivityLog(l.id, `Cambio en lote: ${old} → ${newStatus}`);
    }
  });
  saveLeads();
  clearBulkSelection();
  renderAll();
  showToast(`Estado actualizado a "${newStatus}"`);
}
function bulkExport() {
  const selected = leads.filter(l => selectedLeadIds.has(String(l.id)));
  if (!selected.length) return;
  let csv = 'Nombre,Empresa,Email,Teléfono,Segmento,Score,Estado\n';
  selected.forEach(l => { csv += `"${l.name}","${l.company}","${l.email||''}","${l.phone||''}","${l.segment}",${l.score},"${l.status}"\n`; });
  downloadCSV(csv, 'leads_seleccionados.csv');
  clearBulkSelection();
}

// ============ EXPORT FILTERED ============
function exportFilteredData() {
  const list = getFilteredLeads();
  if (!list.length) { alert('No hay leads para exportar.'); return; }
  const esc = v => `"${String(v||'').replace(/"/g,"'")}"`;
  let csv = 'Nombre,Empresa,Email,Teléfono,Segmento,Señal,Score,Estado,Web,Decisor,Rating,Nº Reseñas,Instagram,LinkedIn,Año Dominio,Año Fundación,Estado Legal,Fuentes Enriquecimiento,Señales,Presupuesto,Próximo contacto,Etiquetas\n';
  list.forEach(l => {
    csv += [
      esc(l.name), esc(l.company), esc(l.email), esc(l.phone),
      esc(l.segment), esc(l.signal), l.score, esc(l.status),
      esc(l.website), esc(l.decision_maker),
      l.rating || '', l.ratingCount || '',
      esc(l.instagram), esc(l.linkedin),
      l.domainYear || '', l.incorporationYear || '',
      esc(l.legalStatus), esc((l.enrichSource||[]).join(' | ')),
      esc((l.signals||[]).join(' | ')),
      l.budget||0, esc(l.next_contact), esc((l.tags||[]).join(';'))
    ].join(',') + '\n';
  });
  downloadCSV(csv, `leads_gordi_enriquecidos_${new Date().toISOString().slice(0,10)}.csv`);
}

// ============ TODAY PANEL ============
function renderTodayPanel() {
  const el = document.getElementById('today-content');
  const label = document.getElementById('today-date-label');
  if (!el) return;
  const today = new Date(); today.setHours(0,0,0,0);
  if (label) label.textContent = today.toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' });

  const dueToday = leads.filter(l => !l.archived && l.next_contact && new Date(l.next_contact) <= today);
  const urgent   = leads.filter(l => !l.archived && l.score >= 75 && l.status === 'Pendiente');
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); weekStart.setHours(0,0,0,0);
  const leadsThisWeek = leads.filter(l => l.date && new Date(l.date) >= weekStart).length;
  const emailsThisWeek = emailHistory.filter(e => e.date && new Date(e.date) >= weekStart).length;

  const cards = [];

  // Card: seguimientos hoy
  if (dueToday.length) {
    cards.push(`<div class="today-action-card">
      <div class="today-action-header" style="color:var(--primary)">📅 Seguimientos hoy <span style="color:var(--text-muted);font-weight:400">(${dueToday.length})</span></div>
      ${dueToday.slice(0,4).map(l => `
        <div class="today-lead-row">
          <span class="today-lead-name" onclick="openLeadDetail('${l.id}')">${l.company}</span>
          <span style="font-size:.65rem;color:var(--text-dim)">${l.status}</span>
          ${l.email ? `<button class="today-mini-btn success" onclick="generateEmail('${l.id}')">✉️ Email</button>` : ''}
          <button class="today-mini-btn" onclick="todayPostpone('${l.id}')">+1d</button>
          <button class="today-mini-btn" onclick="openLeadDetail('${l.id}')">Ver →</button>
        </div>`).join('')}
      ${dueToday.length > 4 ? `<div style="font-size:.7rem;color:var(--text-dim);margin-top:.35rem">+${dueToday.length-4} más — <span style="cursor:pointer;color:var(--primary)" onclick="showView('leads')">ver todos</span></div>` : ''}
    </div>`);
  }

  // Card: urgentes sin contactar
  if (urgent.length) {
    cards.push(`<div class="today-action-card">
      <div class="today-action-header" style="color:var(--warning)">🔥 Alta prioridad sin contactar <span style="color:var(--text-muted);font-weight:400">(${urgent.length})</span></div>
      ${urgent.slice(0,3).map(l => `
        <div class="today-lead-row">
          <span class="today-lead-name" onclick="openLeadDetail('${l.id}')">${l.company}</span>
          <span style="font-size:.65rem;color:var(--warning)">${l.score}pts</span>
          ${l.email ? `<button class="today-mini-btn success" onclick="generateEmail('${l.id}')">✉️ Email</button>` : ''}
          <button class="today-mini-btn" onclick="openAiEmailModal('${l.id}')">✨ IA</button>
          <button class="today-mini-btn danger" onclick="markNotInterested('${l.id}');renderTodayPanel()">✕</button>
        </div>`).join('')}
    </div>`);
  }

  // Card: resumen semana
  cards.push(`<div class="today-action-card">
    <div class="today-action-header" style="color:var(--success)">📈 Esta semana</div>
    <div style="display:flex;gap:1.5rem;margin-top:.1rem">
      <div style="text-align:center">
        <div style="font-size:1.4rem;font-weight:700;color:var(--primary)">${leadsThisWeek}</div>
        <div style="font-size:.68rem;color:var(--text-muted)">leads nuevos</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:1.4rem;font-weight:700;color:var(--success)">${emailsThisWeek}</div>
        <div style="font-size:.68rem;color:var(--text-muted)">emails enviados</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:1.4rem;font-weight:700;color:var(--warning)">${dueToday.length}</div>
        <div style="font-size:.68rem;color:var(--text-muted)">pendientes hoy</div>
      </div>
    </div>
    <div style="margin-top:.6rem;display:flex;gap:.4rem;flex-wrap:wrap">
      <button class="today-mini-btn" onclick="showView('leads');toggleLeadForm()">+ Nuevo lead</button>
      <button class="today-mini-btn" onclick="showView('kanban')">📋 Pipeline</button>
      <button class="today-mini-btn" onclick="showView('planner')">🔍 Buscar empresas</button>
      <button class="today-mini-btn" onclick="openFocusMode()" style="background:rgba(10,132,255,.1);border-color:var(--primary);color:var(--primary)">⚡ Modo Enfoque</button>
    </div>
  </div>`);

  el.style.gridTemplateColumns = cards.length >= 3 ? 'repeat(auto-fit,minmax(240px,1fr))' : 'repeat(auto-fit,minmax(200px,1fr))';
  el.innerHTML = cards.length ? cards.join('') : '<div class="today-action-card" style="grid-column:1/-1"><div style="font-size:.82rem;color:var(--success);text-align:center;padding:.5rem">✅ Todo al día — no hay acciones pendientes para hoy</div></div>';
}

function todayPostpone(leadId) {
  const lead = leads.find(l => l.id == leadId);
  if (!lead) return;
  const d = new Date(lead.next_contact);
  d.setDate(d.getDate() + 1);
  lead.next_contact = d.toISOString().slice(0,10);
  addActivityLog(leadId, `📅 Seguimiento pospuesto a ${lead.next_contact}`);
  saveLeads();
  renderTodayPanel();
  showToast(`Pospuesto a ${d.toLocaleDateString('es-ES')}`);
}

// ============ FUNNEL CHART ============
function renderFunnelChart() {
  const el = document.getElementById('funnel-chart');
  if (!el) return;
  const total = leads.filter(l => !l.archived).length || 1;
  const steps = [
    { label: 'Total leads',    count: leads.filter(l=>!l.archived).length,    color: '#0A84FF' },
    { label: 'Contactados',    count: leads.filter(l=>['Contactado','Respuesta del cliente','Visita','Entrega de presupuesto','Cerrado'].includes(l.status)).length, color: '#5E5CE6' },
    { label: 'Emails enviados',count: leads.filter(l=>['Visita','Respuesta del cliente','Entrega de presupuesto','Cerrado'].includes(l.status)).length, color: '#f59e0b' },
    { label: 'Respondidos',    count: leads.filter(l=>['Respuesta del cliente','Visita','Entrega de presupuesto','Cerrado'].includes(l.status)).length, color: '#10d97c' },
    { label: 'Cerrados',       count: leads.filter(l=>l.status==='Cerrado').length, color: '#34d399' },
  ];
  el.innerHTML = steps.map(s => `
    <div class="funnel-step" onclick="showView('leads')">
      <span class="funnel-val" style="color:${s.color}">${s.count}</span>
      <div class="funnel-bar-outer"><div class="funnel-bar-inner" style="width:${Math.round(s.count/total*100)}%;background:${s.color}"></div></div>
      <span class="funnel-label">${s.label}</span>
    </div>`).join('');
}

// ============ PIPELINE VALUE ============
function renderPipelineValue() {
  const el = document.getElementById('pipeline-value-panel');
  if (!el) return;
  const active = leads.filter(l => !l.archived && l.status !== 'Cerrado' && l.status !== 'No interesa' && l.budget > 0);
  const total  = active.reduce((s,l) => s + (l.budget || 0), 0);
  const closed = leads.filter(l => l.status === 'Cerrado' && l.budget > 0).reduce((s,l) => s + (l.budget||0), 0);
  el.innerHTML = `
    <div class="pipeline-value">${total.toLocaleString('es-ES')}€</div>
    <div style="font-size:.75rem;color:var(--text-muted);margin-top:.25rem">${active.length} leads con presupuesto · ${total > 0 ? Math.round(total/active.length).toLocaleString('es-ES')+'€ media' : '—'}</div>
    ${closed > 0 ? `<div style="font-size:.78rem;color:var(--success);margin-top:.4rem">✅ ${closed.toLocaleString('es-ES')}€ cerrados</div>` : ''}
    <div style="font-size:.7rem;color:var(--text-dim);margin-top:.5rem">Añade presupuesto estimado en cada lead para ver el valor del pipeline</div>`;
}

// ============ STREAK ============
function updateStreakData() {
  const today = new Date().toISOString().slice(0,10);
  let streak = JSON.parse(localStorage.getItem('gordi_streak') || '{"days":0,"lastDay":"","count":0}');
  if (streak.lastDay === today) { streak.count++; }
  else if (streak.lastDay === new Date(Date.now()-86400000).toISOString().slice(0,10)) {
    streak.days++;  streak.count = 1; streak.lastDay = today;
  } else {
    streak.days = 1; streak.count = 1; streak.lastDay = today;
  }
  localStorage.setItem('gordi_streak', JSON.stringify(streak));
}
function renderStreakPanel() {
  const el = document.getElementById('streak-panel');
  if (!el) return;
  const streak = JSON.parse(localStorage.getItem('gordi_streak') || '{"days":0}');
  const days = streak.days || 0;
  el.innerHTML = `<div style="display:flex;align-items:center;gap:1rem">
    <div class="streak-badge">🔥 ${days} día${days!==1?'s':''} de racha</div>
    <div style="font-size:.75rem;color:var(--text-muted)">${days >= 7 ? '¡Semana completa! 🏆' : days >= 3 ? 'Buen ritmo 💪' : 'Empieza tu racha'}</div>
  </div>`;
}

// ============ HEATMAP ============
function renderHeatmap() {
  const el = document.getElementById('heatmap-panel');
  if (!el) return;
  const now = new Date();
  const months = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0,7));
  }
  const actByMonth = {};
  leads.forEach(l => { const m = (l.date||'').slice(0,7); if (m) actByMonth[m] = (actByMonth[m]||0) + 1; });
  emailHistory.forEach(e => { const m = (e.date||'').slice(0,7); if (m) actByMonth[m] = (actByMonth[m]||0) + 1; });
  const max = Math.max(...months.map(m => actByMonth[m]||0), 1);
  el.innerHTML = '<div class="heatmap-grid">' + months.map(m => {
    const v = actByMonth[m] || 0;
    const level = v === 0 ? 0 : v <= max*0.25 ? 1 : v <= max*0.5 ? 2 : v <= max*0.75 ? 3 : 4;
    return `<div class="heatmap-cell heatmap-${level}" data-tip="${m}: ${v} acciones" title="${m}: ${v} acciones"></div>`;
  }).join('') + '</div><div style="font-size:.65rem;color:var(--text-dim);margin-top:.3rem">Últimos 12 meses</div>';
}

// ============ OBJECTIVES ============
function openObjectivesModal() {
  document.getElementById('obj-leads').value = objectives.leads;
  document.getElementById('obj-emails').value = objectives.emails;
  document.getElementById('obj-replies').value = objectives.replies;
  document.getElementById('objectives-modal').style.display = 'flex';
}
function closeObjectivesModal() { document.getElementById('objectives-modal').style.display = 'none'; }
function saveObjectives() {
  objectives = {
    leads: parseInt(document.getElementById('obj-leads').value) || 20,
    emails: parseInt(document.getElementById('obj-emails').value) || 10,
    replies: parseInt(document.getElementById('obj-replies').value) || 3
  };
  localStorage.setItem('gordi_objectives', JSON.stringify(objectives));
  closeObjectivesModal();
  renderObjectivesPanel();
  showToast('Objetivos guardados ✓');
}
function renderObjectivesPanel() {
  const el = document.getElementById('objectives-panel');
  if (!el) return;
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); weekStart.setHours(0,0,0,0);
  const leadsW  = leads.filter(l => l.date && new Date(l.date) >= weekStart).length;
  const emailsW = emailHistory.filter(e => e.date && new Date(e.date) >= weekStart).length;
  const repliesW = leads.filter(l => l.status_date && new Date(l.status_date) >= weekStart && l.status === 'Respuesta del cliente').length;
  const items = [
    { label:'Leads nuevos', val:leadsW, target:objectives.leads, icon:'👥' },
    { label:'Emails enviados', val:emailsW, target:objectives.emails, icon:'✉️' },
    { label:'Respuestas', val:repliesW, target:objectives.replies, icon:'💬' },
  ];
  el.innerHTML = items.map(it => {
    const pct = Math.min(Math.round(it.val / Math.max(it.target,1) * 100), 100);
    const col = pct >= 100 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--primary)';
    return `<div style="margin-bottom:.6rem">
      <div style="display:flex;justify-content:space-between;font-size:.75rem;margin-bottom:.2rem">
        <span style="color:var(--text-muted)">${it.icon} ${it.label}</span>
        <span style="color:${col};font-weight:700">${it.val} / ${it.target}</span>
      </div>
      <div class="objective-bar"><div class="objective-fill" style="width:${pct}%;background:${col}"></div></div>
    </div>`;
  }).join('');
}

// ============ SEARCH HISTORY ============
function saveSearchHistory(segment, location) {
  const key = `${segment} — ${location}`;
  searchHistoryList = [key, ...searchHistoryList.filter(k => k !== key)].slice(0,5);
  localStorage.setItem('gordi_search_history', JSON.stringify(searchHistoryList));
  renderSearchHistory();
}
function renderSearchHistory() {
  const el = document.getElementById('search-history-bar');
  if (!el || !searchHistoryList.length) return;
  el.innerHTML = '<span style="font-size:.68rem;color:var(--text-dim);margin-right:.25rem">Recientes:</span>' +
    searchHistoryList.map(k => {
      const [seg, loc] = k.split(' — ');
      return `<span class="sh-pill" onclick="applySearchHistory('${encodeURIComponent(seg)}','${encodeURIComponent(loc)}')">${k}</span>`;
    }).join('');
}
function applySearchHistory(seg, loc) {
  const segEl = document.getElementById('plan-segment');
  const locEl = document.getElementById('plan-location');
  if (segEl) segEl.value = decodeURIComponent(seg);
  if (locEl) locEl.value = decodeURIComponent(loc);
}

// ============ AI EMAIL EXTRAS ============
async function regenerateSubjectOnly() {
  const lead = leads.find(l => l.id == aiCurrentLeadId);
  if (!lead) return;
  const key = localStorage.getItem('gordi_claude_key');
  if (!key) return;
  const btn = event.target;
  btn.textContent = '⏳ Generando...'; btn.disabled = true;
  try {
    // Usar Gemini para generar asuntos de email
    const geminiResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: `Genera 3 asuntos de email comercial cortos y directos para contactar a ${lead.company} (sector ${lead.segment}). Solo los 3 asuntos numerados, sin más texto.` }] }] })
    });
    const data = await geminiResp.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const subjects = text.split('\n').filter(l => l.trim() && /^\d/.test(l.trim())).slice(0,3);
    if (subjects.length) {
      const chosen = prompt('Elige un asunto (pega el que prefieras):\n\n' + subjects.join('\n'));
      if (chosen) document.getElementById('ai-subject-out').value = chosen.replace(/^\d+[\.\)]\s*/, '').trim();
    }
  } catch(e) { showToast('Error generando asuntos'); }
  btn.textContent = '🔄 Nuevo asunto'; btn.disabled = false;
}

function saveAiEmailAsTemplate() {
  const lead = leads.find(l => l.id == aiCurrentLeadId);
  if (!lead) return;
  const subject = document.getElementById('ai-subject-out').value;
  const body = document.getElementById('ai-body-editor').innerText;
  const key = lead.segment || 'Default';
  if (!emailTemplates[key]) emailTemplates[key] = {};
  emailTemplates[key].subjectA = subject;
  emailTemplates[key].body = body;
  localStorage.setItem('gordi_templates', JSON.stringify(emailTemplates));
  showToast(`Plantilla guardada para sector ${key} ✓`);
}

function checkSpam(subject) {
  const spamWords = ['gratis','free','oferta','urgente','descuento','!','€€','$$','100%','garantizado','ganador'];
  const hits = spamWords.filter(w => subject.toLowerCase().includes(w));
  const el = document.getElementById('spam-check-result');
  if (!el) return;
  if (hits.length === 0) el.innerHTML = '<span class="spam-ok">✅ Asunto sin palabras de spam</span>';
  else if (hits.length <= 2) el.innerHTML = `<span class="spam-warn">⚠️ Palabras de riesgo: ${hits.join(', ')}</span>`;
  else el.innerHTML = `<span class="spam-bad">🚫 Alto riesgo de spam: ${hits.join(', ')}</span>`;
}

function updateEmailWordCount() {
  const editor = document.getElementById('ai-body-editor');
  const el = document.getElementById('ai-word-count');
  if (!editor || !el) return;
  const words = editor.innerText.trim().split(/\s+/).filter(Boolean).length;
  el.className = 'word-count' + (words > 250 ? ' over' : '');
  el.textContent = `${words} palabras${words > 250 ? ' (recomendado: <220)' : ''}`;
  // Check spam on subject change
  const subj = document.getElementById('ai-subject-out');
  if (subj) checkSpam(subj.value);
}

async function generateFollowupEmail(id) {
  const lead = leads.find(l => l.id == id);
  if (!lead) return;
  const key = localStorage.getItem('gordi_claude_key');
  if (!key) { showToast('Configura la API key de Gemini'); return; }
  const daysInStatus = lead.status_date ? Math.floor((Date.now()-new Date(lead.status_date))/86400000) : 7;
  closeAiModal();
  const modal = document.getElementById('ai-email-modal');
  modal.style.display = 'flex';
  document.getElementById('ai-loading').style.display = 'block';
  document.getElementById('ai-result').style.display = 'none';
  document.getElementById('ai-modal-title').innerText = `↩️ Seguimiento para ${lead.company}`;
  try {
    // Recuperar historial de contacto con este lead
    const prevHistory = emailHistory.filter(h => h.leadId == lead.id || h.email === lead.email);
    const lastEmail = prevHistory[0];
    const emailCount = prevHistory.length;
    const lastSubject = lastEmail?.subject || '';
    const segmentToneFollow = SEGMENT_TONE[lead.segment] || SEGMENT_TONE['Default'];

    const followupPrompt = `Eres un experto en ventas B2B para Voltium Madrid (empresa de reformas). Debes escribir un email de seguimiento que consiga respuesta.

CONTEXTO DEL LEAD:
- Empresa: ${lead.company} | Sector: ${lead.segment} | Ciudad: ${lead.address || 'Madrid'}
- Estado actual: ${lead.status} | Score: ${lead.score || '?'}
- Días sin respuesta: ${daysInStatus}
- Emails previos enviados: ${emailCount}
- Último asunto enviado: "${lastSubject}"
- Señales del lead: ${(lead.signals||[]).slice(0,3).join(' · ') || 'sin señales'}
- Nota Google: ${lead.rating ? lead.rating + '/5 (' + lead.ratingCount + ' reseñas)' : 'sin datos'}
${lead.decision_maker ? '- Decisor: ' + lead.decision_maker : ''}

TONO DEL SECTOR: ${segmentToneFollow.tone}
DOLOR PRINCIPAL: ${segmentToneFollow.pain}
ÁNGULO DE VENTA: ${segmentToneFollow.angle}
PROHIBIDO: ${segmentToneFollow.forbidden}

REGLAS DEL SEGUIMIENTO:
${daysInStatus <= 4 ? `- Han pasado SOLO ${daysInStatus} días. El tono debe ser muy breve y ligero — apenas un recordatorio amable. No dar la lata.` :
  daysInStatus <= 10 ? `- Han pasado ${daysInStatus} días. Aporta UN dato nuevo o ángulo diferente al primer email. No repetir lo mismo.` :
  `- Han pasado ${daysInStatus} días. Este es posiblemente el último intento. Abre una puerta de salida elegante ("si no es el momento...") pero con un CTA claro.`}
- NUNCA mencionar el asunto anterior ni decir "como te dije"
- NUNCA: "solo quería recordarte", "espero que todo vaya bien", frases de relleno
- SÍ: empezar con algo que aporte valor (un dato, una pregunta, un ángulo nuevo)
- Longitud: ${daysInStatus <= 4 ? '50-70' : '80-120'} palabras máximo en el cuerpo
- Formato HTML con <br><br> entre párrafos, <strong> solo en el CTA
- Genera 2 opciones de asunto: uno directo, uno de curiosidad/pregunta

Responde ÚNICAMENTE JSON válido:
{"subjects":["asunto directo","asunto pregunta/curiosidad"],"body":"HTML del email","tactic":"en 1 frase: qué táctica usaste y por qué para este caso concreto"}`;

    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: followupPrompt }] }],
        generationConfig: { temperature: 0.75, maxOutputTokens: 1500 } })
    });
    const data = await resp.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    text = text.replace(/```json|```/g,'').trim();
    const result = JSON.parse(text);
    document.getElementById('ai-loading').style.display = 'none';
    document.getElementById('ai-result').style.display = 'block';
    // Show subject options if we have multiple
    const followSubjects = result.subjects || [result.subject];
    const subjectList = document.getElementById('ai-subjects-list');
    const subjectLabels = ['🎯 Directo', '❓ Pregunta'];
    if (subjectList) {
      subjectList.innerHTML = followSubjects.map((s, i) => `
        <div onclick="selectAiSubject(this, '${s.replace(/'/g,"&#39;")}')"
          style="cursor:pointer;padding:.5rem .75rem;border-radius:8px;border:1px solid var(--glass-border);
          background:var(--glass);font-size:.82rem;display:flex;gap:.5rem;align-items:center;justify-content:space-between;transition:border-color .15s"
          class="subject-option${i===0?' selected-subject':''}">
          <div style="display:flex;gap:.5rem;align-items:flex-start;flex:1">
            <span style="font-size:.7rem;color:var(--text-muted);white-space:nowrap;padding-top:1px">${subjectLabels[i]||'✏️'}</span>
            <span>${s}</span>
          </div>
          <button onclick="event.stopPropagation();copySubjectOption('${s.replace(/'/g,"&#39;")}')" title="Copiar asunto"
            style="background:none;border:none;cursor:pointer;font-size:.75rem;color:var(--text-dim);padding:.1rem .3rem;border-radius:4px;flex-shrink:0;transition:color .15s"
            onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-dim)'">📋</button>
        </div>`).join('');
    }
    document.getElementById('ai-subject-out').value = followSubjects[0] || '';
    document.getElementById('ai-body-editor').innerHTML = result.body || '';
    if (result.tactic) {
      document.getElementById('ai-reviews-insight').innerHTML =
        `<strong style="color:var(--primary)">🧠 Táctica usada:</strong> ${result.tactic}`;
      document.getElementById('ai-reviews-insight').style.display = 'block';
    }
  } catch(e) {
    document.getElementById('ai-loading').style.display = 'none';
    document.getElementById('ai-error').style.display = 'block';
    document.getElementById('ai-error-msg').textContent = 'Error: ' + e.message;
  }
}

// ============ PIN PROTECTION ============
function checkPin() {
  const pin = localStorage.getItem('gordi_pin');
  if (!pin) return;
  const input = prompt('🔒 Voltflow — Introduce tu PIN:');
  if (input !== pin) {
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0f1e;color:#ef4444;font-family:sans-serif;font-size:1.2rem">🔒 PIN incorrecto. Recarga para intentarlo de nuevo.</div>';
    throw new Error('PIN incorrecto');
  }
}
function savePin() {
  const pin = document.getElementById('pin-input').value;
  if (pin && !/^\d{4}$/.test(pin)) { showToast('El PIN debe ser exactamente 4 dígitos'); return; }
  if (pin) { localStorage.setItem('gordi_pin', pin); document.getElementById('pin-status').innerHTML = '<span style="color:var(--success)">✅ PIN guardado</span>'; }
  else { localStorage.removeItem('gordi_pin'); document.getElementById('pin-status').innerHTML = '<span style="color:var(--text-muted)">PIN eliminado</span>'; }
}
function removePin() {
  localStorage.removeItem('gordi_pin');
  document.getElementById('pin-input').value = '';
  document.getElementById('pin-status').innerHTML = '<span style="color:var(--text-muted)">PIN eliminado</span>';
}

// ============ BACKUP / RESTORE ============

// ─── EXPORTAR / IMPORTAR DATOS PORTÁTILES ENTRE VERSIONES ────────────────────
function exportPortableData() {
  const snapshot = exportDataSnapshot();
  const leadsCount = (() => { try { return JSON.parse(snapshot.gordi_leads || '[]').length; } catch { return 0; } })();
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `voltflow_datos_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`📦 Datos exportados (${leadsCount} leads + configuración)`);
}

// ─── IMPORTAR DESDE VERSIÓN ANTERIOR (lee localStorage directamente) ─────────
function openImportFromLocalStorage() {
  // Leer todos los datos gordi_ que hay en el localStorage ahora mismo
  const leadsRaw     = localStorage.getItem('gordi_leads');
  const historyRaw   = localStorage.getItem('gordi_email_history');
  const campaignsRaw = localStorage.getItem('gordi_campaigns');

  const leadsData    = (() => { try { return JSON.parse(leadsRaw || '[]'); } catch { return []; } })();
  const historyData  = (() => { try { return JSON.parse(historyRaw || '[]'); } catch { return []; } })();
  const campsData    = (() => { try { return JSON.parse(campaignsRaw || '[]'); } catch { return []; } })();

  const hasConfig = !!(
    localStorage.getItem('gordi_api_key') ||
    localStorage.getItem('gordi_gemini_key') ||
    localStorage.getItem('gordi_user_name')
  );

  // Detectar todas las claves gordi_ presentes (incluyendo caché de enriquecimiento)
  const allGordiKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('gordi_')) allGordiKeys.push(k);
  }

  if (allGordiKeys.length === 0) {
    showToast('ℹ️ No se encontraron datos de Voltflow en este navegador');
    return;
  }

  // Análisis de duplicados con los leads actuales en memoria
  const normN = n => (n||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,25);
  let newCount = 0, dupCount = 0;
  for (const l of leadsData) {
    const dup = leads.find(ex =>
      (l.placeId && ex.placeId && l.placeId === ex.placeId) ||
      normN(ex.company) === normN(l.company)
    );
    if (dup) dupCount++; else newCount++;
  }

  // Detectar fecha del dato más reciente
  let lastActivity = null;
  for (const l of leadsData) {
    const d = new Date(l.date || 0);
    if (!lastActivity || d > lastActivity) lastActivity = d;
  }
  const lastStr = lastActivity
    ? lastActivity.toLocaleDateString('es-ES', {day:'2-digit', month:'short', year:'numeric'})
    : '—';

  // Calcular peso total
  let totalBytes = 0;
  for (const k of allGordiKeys) totalBytes += (localStorage.getItem(k)||'').length * 2;
  const totalKb = Math.round(totalBytes / 1024);

  document.getElementById('import-modal-overlay').style.display = 'flex';
  document.getElementById('import-modal-content').innerHTML = `
    <div style="padding:1.5rem;display:grid;gap:1.25rem">

      <!-- Cabecera: qué se ha encontrado -->
      <div style="background:rgba(10,132,255,.06);border:1px solid rgba(10,132,255,.15);border-radius:10px;padding:1rem 1.25rem">
        <div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.1em;color:var(--primary);font-weight:700;margin-bottom:.6rem">🔍 Datos encontrados en este navegador</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.45rem .75rem;font-size:.82rem">
          <div><span style="color:var(--text-muted)">Leads guardados:</span> <strong style="color:var(--text)">${leadsData.length}</strong></div>
          <div><span style="color:var(--text-muted)">Emails en historial:</span> <strong style="color:var(--text)">${historyData.length}</strong></div>
          <div><span style="color:var(--text-muted)">Campañas:</span> <strong style="color:var(--text)">${campsData.length}</strong></div>
          <div><span style="color:var(--text-muted)">Configuración:</span> <strong style="color:${hasConfig?'var(--success)':'var(--text-dim)'}">${hasConfig?'✅ Incluida':'—'}</strong></div>
          <div><span style="color:var(--text-muted)">Último lead añadido:</span> <strong style="color:var(--text)">${lastStr}</strong></div>
          <div><span style="color:var(--text-muted)">Peso total:</span> <strong style="color:var(--text-muted)">${totalKb} KB</strong></div>
        </div>
      </div>

      <!-- Contadores grandes -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem">
        <div style="background:var(--bg3);border:1px solid var(--glass-border);border-radius:10px;padding:.85rem;text-align:center">
          <div style="font-family:'Syne',sans-serif;font-size:1.6rem;font-weight:800;color:var(--primary)">${leadsData.length}</div>
          <div style="font-size:.7rem;color:var(--text-muted);margin-top:2px">Leads en storage</div>
        </div>
        <div style="background:var(--bg3);border:1px solid var(--glass-border);border-radius:10px;padding:.85rem;text-align:center">
          <div style="font-family:'Syne',sans-serif;font-size:1.6rem;font-weight:800;color:var(--warning)">${leads.length}</div>
          <div style="font-size:.7rem;color:var(--text-muted);margin-top:2px">Leads en memoria</div>
        </div>
        <div style="background:var(--bg3);border:1px solid var(--glass-border);border-radius:10px;padding:.85rem;text-align:center">
          <div style="font-family:'Syne',sans-serif;font-size:1.6rem;font-weight:800;color:var(--success)">${newCount}</div>
          <div style="font-size:.7rem;color:var(--text-muted);margin-top:2px">Leads nuevos</div>
        </div>
      </div>

      ${leadsData.length > 0 && leads.length > 0 ? `
      <div style="background:rgba(16,217,124,.05);border:1px solid rgba(16,217,124,.15);border-radius:8px;padding:.75rem 1rem;font-size:.8rem">
        <strong style="color:var(--success)">🔍 Análisis:</strong>
        <span style="color:var(--text-muted)"> ${newCount} leads <strong style="color:var(--success)">nuevos</strong> · ${dupCount} posibles <strong style="color:var(--warning)">duplicados</strong></span>
      </div>` : ''}

      ${leadsData.length === 0 ? `
      <div style="background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.2);border-radius:8px;padding:.75rem 1rem;font-size:.82rem;color:var(--danger)">
        ⚠️ No se encontraron leads en el storage. Es posible que los datos estén en un navegador o perfil diferente.
      </div>` : ''}

      <!-- Opciones -->
      <div style="display:grid;gap:.75rem">
        <div style="font-size:.78rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.08em">¿Cómo quieres importar?</div>

        ${leads.length > 0 && leadsData.length > 0 ? `
        <button onclick="executeLocalImport('merge')" style="display:flex;align-items:flex-start;gap:.85rem;background:rgba(16,217,124,.07);border:1px solid rgba(16,217,124,.2);border-radius:10px;padding:.9rem 1.1rem;cursor:pointer;text-align:left;transition:all .2s;width:100%" onmouseover="this.style.borderColor='var(--success)'" onmouseout="this.style.borderColor='rgba(16,217,124,.2)'">
          <span style="font-size:1.3rem;flex-shrink:0">🔀</span>
          <div>
            <div style="font-weight:700;color:var(--success);font-size:.88rem;margin-bottom:2px">Combinar <span style="font-weight:400;color:var(--text-muted);font-size:.78rem">(recomendado)</span></div>
            <div style="font-size:.75rem;color:var(--text-muted);line-height:1.5">Añade los ${newCount} leads nuevos a los ${leads.length} que ya tienes en memoria. Los ${dupCount} duplicados se ignoran. No se pierde nada.</div>
          </div>
        </button>` : ''}

        ${leadsData.length > 0 ? `
        <button onclick="executeLocalImport('replace')" style="display:flex;align-items:flex-start;gap:.85rem;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.15);border-radius:10px;padding:.9rem 1.1rem;cursor:pointer;text-align:left;transition:all .2s;width:100%" onmouseover="this.style.borderColor='var(--warning)'" onmouseout="this.style.borderColor='rgba(245,158,11,.15)'">
          <span style="font-size:1.3rem;flex-shrink:0">🔄</span>
          <div>
            <div style="font-weight:700;color:var(--warning);font-size:.88rem;margin-bottom:2px">Cargar todo desde storage</div>
            <div style="font-size:.75rem;color:var(--text-muted);line-height:1.5">Carga los ${leadsData.length} leads y todos los datos guardados en el navegador como estado actual. ${leads.length > 0 ? `<strong style="color:var(--danger)">Reemplaza los ${leads.length} leads en memoria.</strong>` : ''}</div>
          </div>
        </button>` : ''}

        ${hasConfig ? `
        <button onclick="executeLocalImport('config_only')" style="display:flex;align-items:flex-start;gap:.85rem;background:rgba(94,92,230,.06);border:1px solid rgba(94,92,230,.15);border-radius:10px;padding:.9rem 1.1rem;cursor:pointer;text-align:left;transition:all .2s;width:100%" onmouseover="this.style.borderColor='var(--secondary)'" onmouseout="this.style.borderColor='rgba(94,92,230,.15)'">
          <span style="font-size:1.3rem;flex-shrink:0">⚙️</span>
          <div>
            <div style="font-weight:700;color:var(--secondary);font-size:.88rem;margin-bottom:2px">Solo configuración</div>
            <div style="font-size:.75rem;color:var(--text-muted);line-height:1.5">Trae solo las API keys, perfil y plantillas. Los leads no se tocan.</div>
          </div>
        </button>` : ''}

        <button onclick="closeImportModal()" style="background:var(--glass);border:1px solid var(--glass-border);border-radius:10px;padding:.75rem;cursor:pointer;color:var(--text-muted);font-size:.83rem;transition:all .2s" onmouseover="this.style.borderColor='var(--glass-hover)'" onmouseout="this.style.borderColor='var(--glass-border)'">
          Cancelar
        </button>
      </div>
    </div>`;
}

function executeLocalImport(mode) {
  const normN = n => (n||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,25);
  const CONFIG_KEYS = ['gordi_api_key','gordi_gemini_key','gordi_hunter_key','gordi_apollo_key',
    'gordi_user_name','gordi_user_email','gordi_user_company','gordi_user_phone','gordi_user_web',
    'gordi_user_logo','gordi_templates','gordi_objectives','gordi_pin'];

  const leadsData  = (() => { try { return JSON.parse(localStorage.getItem('gordi_leads') || '[]'); } catch { return []; } })();
  const histData   = (() => { try { return JSON.parse(localStorage.getItem('gordi_email_history') || '[]'); } catch { return []; } })();
  const campsData  = (() => { try { return JSON.parse(localStorage.getItem('gordi_campaigns') || '[]'); } catch { return []; } })();

  if (mode === 'merge') {
    const merged = [...leads];
    let added = 0;
    for (const l of leadsData) {
      const dup = leads.find(ex =>
        (l.placeId && ex.placeId && l.placeId === ex.placeId) ||
        normN(ex.company) === normN(l.company)
      );
      if (!dup) { merged.push(l); added++; }
    }
    leads = merged;
    // Historial: añadir los que no estén ya
    const exIds = new Set(emailHistory.map(h => h.id || (h.date + h.email)));
    const newHist = histData.filter(h => !exIds.has(h.id || (h.date + h.email)));
    emailHistory = [...emailHistory, ...newHist];
    // Campañas: añadir las nuevas
    const exCampIds = new Set(campaigns.map(c => c.id));
    campaigns = [...campaigns, ...campsData.filter(c => !exCampIds.has(c.id))];
    saveLeads();
    localStorage.setItem('gordi_email_history', JSON.stringify(emailHistory));
    localStorage.setItem('gordi_campaigns', JSON.stringify(campaigns));
    renderAll(); renderDashboardCharts(); renderTracking(); renderCampaigns();
    closeImportModal();
    showToast(`✅ Combinado: +${added} leads nuevos importados`);

  } else if (mode === 'replace') {
    leads = leadsData;
    emailHistory = histData;
    campaigns = campsData;
    saveLeads();
    localStorage.setItem('gordi_email_history', JSON.stringify(emailHistory));
    localStorage.setItem('gordi_campaigns', JSON.stringify(campaigns));
    renderAll(); renderDashboardCharts(); renderTracking(); renderCampaigns();
    closeImportModal();
    showToast(`✅ ${leads.length} leads cargados desde el storage`);

  } else if (mode === 'config_only') {
    for (const key of CONFIG_KEYS) {
      const val = localStorage.getItem(key);
      if (val !== null) localStorage.setItem(key, val);
    }
    loadAllData();
    closeImportModal();
    showToast('✅ Configuración cargada (leads sin cambios)');
  }
}

function closeImportModal() {
  document.getElementById('import-modal-overlay').style.display = 'none';
}

// Banner de bienvenida tras migración automática en primer arranque
function showMigrationBanner(log) {
  const existing = document.getElementById('migration-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'migration-banner';
  banner.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9000;
    background:linear-gradient(135deg,rgba(15,23,41,.98),rgba(21,30,53,.98));
    border:1px solid rgba(10,132,255,.3);border-radius:16px;
    padding:1.1rem 1.3rem;max-width:360px;
    box-shadow:0 16px 48px rgba(0,0,0,.6);
    animation:slideInRight .35s cubic-bezier(.16,1,.3,1);
  `;

  const apiTxt  = log.hasApiKeys ? '<span style="color:var(--success)">✅ API keys</span>' : '';
  const profTxt = log.hasProfile ? '<span style="color:var(--success)">✅ Perfil</span>'    : '';
  const extras  = [apiTxt, profTxt].filter(Boolean).join(' · ');

  banner.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:.85rem">
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">⚡</div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:.9rem;color:var(--text);margin-bottom:.2rem">¡Voltflow v${VOLTFLOW_VERSION} listo!</div>
        <div style="font-size:.78rem;color:var(--text-muted);line-height:1.5">
          Datos cargados automáticamente desde la versión anterior:
        </div>
        <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.5rem">
          <span style="background:rgba(10,132,255,.12);border:1px solid rgba(10,132,255,.2);border-radius:20px;padding:2px 9px;font-size:.72rem;color:var(--primary);font-weight:600">
            ${log.leads} leads
          </span>
          ${log.emails > 0 ? `<span style="background:rgba(94,92,230,.12);border:1px solid rgba(94,92,230,.2);border-radius:20px;padding:2px 9px;font-size:.72rem;color:#a78bfc;font-weight:600">${log.emails} emails</span>` : ''}
          ${log.campaigns > 0 ? `<span style="background:rgba(16,217,124,.1);border:1px solid rgba(16,217,124,.2);border-radius:20px;padding:2px 9px;font-size:.72rem;color:var(--success);font-weight:600">${log.campaigns} campañas</span>` : ''}
        </div>
        ${extras ? `<div style="font-size:.72rem;margin-top:.4rem;display:flex;gap:.5rem;flex-wrap:wrap">${extras}</div>` : ''}
      </div>
      <button onclick="document.getElementById('migration-banner').remove()" style="background:none;border:none;color:var(--text-dim);font-size:1rem;cursor:pointer;padding:0;flex-shrink:0;line-height:1;margin-top:-2px" title="Cerrar">✕</button>
    </div>
  `;

  // Añadir keyframe si no existe
  if (!document.getElementById('migration-banner-style')) {
    const st = document.createElement('style');
    st.id = 'migration-banner-style';
    st.textContent = `@keyframes slideInRight { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:none; } }`;
    document.head.appendChild(st);
  }

  document.body.appendChild(banner);

  // Auto-cerrar a los 8 segundos
  setTimeout(() => {
    if (banner.parentNode) {
      banner.style.transition = 'opacity .4s, transform .4s';
      banner.style.opacity = '0';
      banner.style.transform = 'translateX(40px)';
      setTimeout(() => banner.remove(), 400);
    }
  }, 8000);
}

function exportFullBackup() {
  const data = {
    version: '2.0', date: new Date().toISOString(),
    leads, emailHistory, campaigns, objectives,
    templates: emailTemplates
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `gordi_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click(); URL.revokeObjectURL(url);
  showToast('Backup exportado ✓');
}
function restoreBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.leads) { alert('Archivo de backup inválido.'); return; }
      if (!confirm(`Restaurar backup del ${new Date(data.date).toLocaleDateString('es-ES')}? Se reemplazarán ${data.leads.length} leads.`)) return;
      leads = data.leads || [];
      emailHistory = data.emailHistory || [];
      campaigns = data.campaigns || [];
      objectives = data.objectives || objectives;
      if (data.templates) emailTemplates = { ...defaultTemplates, ...data.templates };
      saveLeads();
      localStorage.setItem('gordi_email_history', JSON.stringify(emailHistory));
      localStorage.setItem('gordi_campaigns', JSON.stringify(campaigns));
      localStorage.setItem('gordi_objectives', JSON.stringify(objectives));
      localStorage.setItem('gordi_templates', JSON.stringify(emailTemplates));
      renderAll(); renderDashboardCharts();
      renderTracking(); renderCampaigns(); renderTemplateList();
      showToast(`Backup restaurado: ${leads.length} leads ✓`);
    } catch { alert('Error al leer el archivo. Asegúrate de que es un backup válido de Voltflow.'); }
  };
  reader.readAsText(file);
}
function autoWeeklyBackup() {
  const last = localStorage.getItem('gordi_last_backup');
  const now = Date.now();
  if (!last || now - parseInt(last) > 7 * 86400000) {
    localStorage.setItem('gordi_last_backup', now.toString());
    if (leads.length > 0) {
      const data = { version:'2.0', date:new Date().toISOString(), leads, emailHistory, campaigns };
      localStorage.setItem('gordi_auto_backup', JSON.stringify(data));
    }
  }
}

// ============ CLEAN OBSOLETE ============
function cleanObsoleteLeads() {
  const cutoff = Date.now() - 90 * 86400000;
  const old = leads.filter(l => !l.archived && l.status === 'Pendiente' && new Date(l.date) < cutoff);
  if (!old.length) { showToast('No hay leads obsoletos (>90 días en Pendiente)'); return; }
  if (!confirm(`Hay ${old.length} leads en "Pendiente" hace más de 90 días. ¿Archivarlos todos?`)) return;
  old.forEach(l => l.archived = true);
  saveLeads();
  renderAll();
  showToast(`${old.length} leads archivados ✓`);
}

// ============ STORAGE INFO ============
function updateStorageInfo() {
  const el = document.getElementById('storage-info-text');
  const fill = document.getElementById('storage-fill');
  if (!el) return;
  let total = 0;
  for (let k in localStorage) { if (k.startsWith('gordi_')) total += (localStorage[k]||'').length * 2; }
  const kb = Math.round(total / 1024);
  const maxKb = 5120;
  const pct = Math.min(Math.round(kb / maxKb * 100), 100);
  el.textContent = `Espacio usado: ${kb} KB de ${maxKb} KB (${leads.length} leads · ${emailHistory.length} emails)`;
  if (fill) fill.style.width = pct + '%';
  if (fill) fill.style.background = pct > 80 ? 'var(--danger)' : pct > 60 ? 'var(--warning)' : '';
}

// ============ API ERROR LOG ============
function logApiError(msg) {
  let log = JSON.parse(localStorage.getItem('gordi_api_log') || '[]');
  log.unshift({ msg, date: new Date().toISOString() });
  log = log.slice(0, 50);
  localStorage.setItem('gordi_api_log', JSON.stringify(log));
  renderApiLog();
}
function renderApiLog() {
  const el = document.getElementById('api-error-log');
  if (!el) return;
  const log = JSON.parse(localStorage.getItem('gordi_api_log') || '[]');
  el.innerHTML = log.length ? log.map(e => `<div style="border-bottom:1px solid var(--glass-border);padding:.2rem 0;"><span style="color:var(--text-dim)">${new Date(e.date).toLocaleString('es-ES')}</span> — ${e.msg}</div>`).join('') : 'Sin errores registrados ✓';
}
function clearApiLog() { localStorage.removeItem('gordi_api_log'); renderApiLog(); showToast('Log limpiado'); }

// ============ TUTORIAL ============
const tutorialSteps = [
  { icon:'⚡', title:'Bienvenido a Voltflow', body:'Tu herramienta de prospección B2B para Voltium Madrid. En 5 pasos aprenderás todo lo que necesitas saber.' },
  { icon:'🔍', title:'Busca empresas con IA', body:'Ve a "Buscar Empresas", introduce una zona y sector. Voltflow encontrará empresas reales con email, teléfono y decisor usando Google Maps.' },
  { icon:'✨', title:'Email hiperpersonalizado', body:'Abre cualquier lead y pulsa ✨ IA. Voltflow analiza las reseñas de Google de esa empresa y escribe un email que menciona sus problemas concretos.' },
  { icon:'🗂️', title:'Pipeline Kanban', body:'Usa el Kanban para gestionar visualmente en qué estado está cada empresa. Arrastra las tarjetas entre columnas conforme avanza la conversación.' },
  { icon:'🎯', title:'Configura las APIs', body:'Para activar la búsqueda de empresas necesitas una Google Maps API Key (console.cloud.google.com). Para el email IA, una Gemini Key gratis en aistudio.google.com/apikey.' },
];
let tutStep = 0;
function showTutorial() {
  tutStep = 0;
  renderTutorialStep();
  document.getElementById('tutorial-overlay').style.display = 'flex';
}
function renderTutorialStep() {
  const s = tutorialSteps[tutStep];
  document.getElementById('tutorial-icon').textContent = s.icon;
  document.getElementById('tutorial-title').textContent = s.title;
  document.getElementById('tutorial-body').textContent = s.body;
  document.getElementById('tutorial-dots').innerHTML = tutorialSteps.map((_,i) => `<div class="tutorial-dot${i===tutStep?' active':''}"></div>`).join('');
  document.getElementById('tutorial-prev').style.display = tutStep > 0 ? 'inline-flex' : 'none';
  document.getElementById('tutorial-next').textContent = tutStep < tutorialSteps.length - 1 ? 'Siguiente →' : '¡Empezar!';
}
function nextTutorial() {
  if (tutStep < tutorialSteps.length - 1) { tutStep++; renderTutorialStep(); }
  else closeTutorial();
}
function prevTutorial() { if (tutStep > 0) { tutStep--; renderTutorialStep(); } }
function closeTutorial() {
  document.getElementById('tutorial-overlay').style.display = 'none';
  localStorage.setItem('gordi_tutorial_done', '1');
}

// ============ SOURCE TRACKING UPDATE ============
// Patch importSelectedSearch to add source
const _origImportSearch = importSelectedSearch;
// Already has source:'search' in the new saveLead - handled inline

// ============ RENDER DASHBOARD OVERRIDE ============
function renderDashboardCharts() {
  renderSegmentChart();
  renderTopLeads();
  renderConversionMetrics();
  renderSectorPerformance();
  renderIntelPanel();
  renderSmartAlert();
  renderFunnelChart();
  renderPipelineValue();
  renderStreakPanel();
  renderHeatmap();
  renderObjectivesPanel();
  renderTodayPanel();
  renderApiLog();
  updateStorageInfo();
  renderDailyStats();
}

function renderDailyStats() {
  const container = document.getElementById('daily-stats-panel');
  if (!container) return;
  const days = 30;
  const map = {};
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map[key] = { added: 0, contacted: 0, converted: 0 };
  }
  leads.forEach(l => {
    if (l.archived) return;
    const day = (l.date || '').slice(0, 10);
    if (map[day]) map[day].added++;
    if (l.status === 'Contactado' || l.status === 'En negociación' || l.status === 'Cerrado') {
      const actDay = (l.activity || []).find(a => a.action && a.action.toLowerCase().includes('email'));
      const cDay = actDay ? actDay.date.slice(0, 10) : day;
      if (map[cDay]) map[cDay].contacted++;
    }
    if (l.status === 'Cerrado') { if (map[day]) map[day].converted++; }
  });
  const sorted = Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  const maxVal = Math.max(...sorted.map(([,v]) => v.added), 1);
  const totalAdded = sorted.reduce((s,[,v]) => s + v.added, 0);
  const totalContacted = sorted.reduce((s,[,v]) => s + v.contacted, 0);
  const totalConverted = sorted.reduce((s,[,v]) => s + v.converted, 0);
  const avgPerDay = (totalAdded / days).toFixed(1);
  const bestDay = sorted.reduce((best, cur) => cur[1].added > best[1].added ? cur : best, sorted[0]);
  let html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:.75rem;margin-bottom:1.25rem">'
    + '<div style="background:var(--glass);border-radius:10px;padding:.75rem;text-align:center"><div style="font-size:1.4rem;font-weight:700;color:var(--primary)">' + totalAdded + '</div><div style="font-size:.72rem;color:var(--text-muted);margin-top:.2rem">Leads añadidos</div></div>'
    + '<div style="background:var(--glass);border-radius:10px;padding:.75rem;text-align:center"><div style="font-size:1.4rem;font-weight:700;color:var(--success)">' + totalContacted + '</div><div style="font-size:.72rem;color:var(--text-muted);margin-top:.2rem">Contactados</div></div>'
    + '<div style="background:var(--glass);border-radius:10px;padding:.75rem;text-align:center"><div style="font-size:1.4rem;font-weight:700;color:#a78bfa">' + totalConverted + '</div><div style="font-size:.72rem;color:var(--text-muted);margin-top:.2rem">Cerrados</div></div>'
    + '<div style="background:var(--glass);border-radius:10px;padding:.75rem;text-align:center"><div style="font-size:1.4rem;font-weight:700;color:#f59e0b">' + avgPerDay + '</div><div style="font-size:.72rem;color:var(--text-muted);margin-top:.2rem">Media/día</div></div>'
    + '<div style="background:var(--glass);border-radius:10px;padding:.75rem;text-align:center"><div style="font-size:1.1rem;font-weight:700;color:#f472b6">' + bestDay[0].slice(5) + '</div><div style="font-size:.72rem;color:var(--text-muted);margin-top:.2rem">Mejor día (' + bestDay[1].added + ')</div></div>'
    + '</div>';
  html += '<div style="display:flex;align-items:flex-end;gap:3px;height:88px;overflow-x:auto;padding-bottom:.5rem">';
  const todayKey = now.toISOString().slice(0, 10);
  sorted.forEach(([date, val]) => {
    const h = Math.max(4, Math.round((val.added / maxVal) * 76));
    const isToday = date === todayKey;
    const color = isToday ? 'var(--primary)' : val.added > 0 ? 'rgba(10,132,255,0.45)' : 'var(--glass)';
    const lbl = isToday ? '<div style="font-size:.55rem;color:var(--primary);margin-top:2px">hoy</div>'
      : val.added > 0 ? '<div style="font-size:.55rem;color:var(--text-dim);margin-top:2px">' + val.added + '</div>'
      : '<div style="font-size:.55rem;color:transparent;margin-top:2px">0</div>';
    html += '<div style="display:flex;flex-direction:column;align-items:center;flex:1;min-width:18px" title="' + date + ': ' + val.added + ' leads">'
      + '<div style="width:100%;background:' + color + ';height:' + h + 'px;border-radius:3px 3px 0 0"></div>' + lbl + '</div>';
  });
  html += '</div><div style="display:flex;justify-content:space-between;font-size:.65rem;color:var(--text-dim);margin-top:.25rem"><span>' + sorted[0][0].slice(5) + '</span><span>' + sorted[sorted.length-1][0].slice(5) + '</span></div>';
  const last7 = sorted.slice(-7).reverse();
  const dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  html += '<div style="margin-top:1rem"><div style="font-size:.72rem;font-weight:600;color:var(--text-muted);margin-bottom:.5rem;text-transform:uppercase;letter-spacing:.06em">Últimos 7 días</div><div style="display:grid;gap:.35rem">';
  last7.forEach(([date, val]) => {
    const isToday = date === todayKey;
    const pct = Math.round((val.added / maxVal) * 100);
    const diaSemana = dias[new Date(date + 'T12:00:00').getDay()];
    const label = isToday ? '🔵 Hoy' : diaSemana + ' ' + date.slice(5);
    const barColor = isToday ? 'var(--primary)' : 'var(--success)';
    html += '<div style="display:grid;grid-template-columns:65px 1fr 45px;align-items:center;gap:.5rem">'
      + '<div style="font-size:.72rem;color:' + (isToday ? 'var(--primary)' : 'var(--text-muted)') + ';font-weight:' + (isToday ? 700 : 400) + '">' + label + '</div>'
      + '<div style="background:var(--glass);border-radius:4px;height:8px;overflow:hidden"><div style="width:' + pct + '%;background:' + barColor + ';height:100%;border-radius:4px"></div></div>'
      + '<div style="font-size:.72rem;color:var(--text-muted);text-align:right">' + val.added + ' lead' + (val.added !== 1 ? 's' : '') + '</div>'
      + '</div>';
  });
  html += '</div></div>';
  container.innerHTML = html;
}

