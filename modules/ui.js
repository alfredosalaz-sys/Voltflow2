// ============ TOAST ============
function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:2rem;right:2rem;background:var(--bg2);border:1px solid var(--glass-border);color:var(--text);padding:.75rem 1.25rem;border-radius:10px;font-size:.83rem;z-index:9999;animation:fadeIn .3s ease;box-shadow:0 8px 24px rgba(0,0,0,.4)`;
  t.innerText = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

// ============ CLIPBOARD ============
async function copyToClipboard(text, message = 'Copiado al portapapeles') {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast(`ðŸ“‹ ${message}`);
  } catch (err) {
    // Fallback para navegadores antiguos o sin permisos
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast(`ðŸ“‹ ${message}`);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
    document.body.removeChild(textArea);
  }
}

function copyEmail(email, event) {
  if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
  return copyToClipboard(email, `Email: ${email}`);
}

// ============ LIGHT MODE ============
function toggleLightMode() {
  const isLight = document.body.classList.toggle('light-mode');
  localStorage.setItem('gordi_light_mode', isLight ? '1' : '0');
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = isLight ? 'â˜€ï¸ Claro' : 'ðŸŒ™ Oscuro';
}
function applyLightMode(on) {
  if (on) document.body.classList.add('light-mode');
  else document.body.classList.remove('light-mode');
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = on ? 'â˜€ï¸ Claro' : 'ðŸŒ™ Oscuro';
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
      addActivityLog(l.id, `Cambio en lote: ${old} â†’ ${newStatus}`);
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
  let csv = 'Nombre,Empresa,Email,TelÃ©fono,Segmento,Score,Estado\n';
  selected.forEach(l => { csv += `"${l.name}","${l.company}","${l.email||''}","${l.phone||''}","${l.segment}",${l.score},"${l.status}"\n`; });
  downloadCSV(csv, 'leads_seleccionados.csv');
  clearBulkSelection();
}

// ============ EXPORT FILTERED ============
function exportFilteredData() {
  const list = getFilteredLeads();
  if (!list.length) { alert('No hay leads para exportar.'); return; }
  const esc = v => `"${String(v||'').replace(/"/g,"'")}"`;
  let csv = 'Nombre,Empresa,Email,TelÃ©fono,Segmento,SeÃ±al,Score,Estado,Web,Decisor,Rating,NÂº ReseÃ±as,Instagram,LinkedIn,AÃ±o Dominio,AÃ±o FundaciÃ³n,Estado Legal,Fuentes Enriquecimiento,SeÃ±ales,Presupuesto,PrÃ³ximo contacto,Etiquetas\n';
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
      <div class="today-action-header" style="color:var(--primary)">ðŸ“… Seguimientos hoy <span style="color:var(--text-muted);font-weight:400">(${dueToday.length})</span></div>
      ${dueToday.slice(0,4).map(l => `
        <div class="today-lead-row">
          <span class="today-lead-name" onclick="openLeadDetail('${l.id}')">${l.company}</span>
          <span style="font-size:.65rem;color:var(--text-dim)">${l.status}</span>
          ${l.email ? `<button class="today-mini-btn" onclick="copyToClipboard('${l.email}', 'Email: ${l.email}')" title="Copiar email">â§‰</button>` : ''}
          ${l.email ? `<button class="today-mini-btn success" onclick="generateEmail('${l.id}')">âœ‰ï¸ Email</button>` : ''}
          <button class="today-mini-btn" onclick="todayPostpone('${l.id}')">+1d</button>
          <button class="today-mini-btn" onclick="openLeadDetail('${l.id}')">Ver â†’</button>
        </div>`).join('')}
      ${dueToday.length > 4 ? `<div style="font-size:.7rem;color:var(--text-dim);margin-top:.35rem">+${dueToday.length-4} mÃ¡s â€” <span style="cursor:pointer;color:var(--primary)" onclick="showView('leads')">ver todos</span></div>` : ''}
    </div>`);
  }

  // Card: urgentes sin contactar
  if (urgent.length) {
    cards.push(`<div class="today-action-card">
      <div class="today-action-header" style="color:var(--warning)">ðŸ”¥ Alta prioridad sin contactar <span style="color:var(--text-muted);font-weight:400">(${urgent.length})</span></div>
      ${urgent.slice(0,3).map(l => `
        <div class="today-lead-row">
          <span class="today-lead-name" onclick="openLeadDetail('${l.id}')">${l.company}</span>
          <span style="font-size:.65rem;color:var(--warning)">${l.score}pts</span>
          ${l.email ? `<button class="today-mini-btn" onclick="copyToClipboard('${l.email}', 'Email: ${l.email}')" title="Copiar email">â§‰</button>` : ''}
          ${l.email ? `<button class="today-mini-btn success" onclick="generateEmail('${l.id}')">âœ‰ï¸ Email</button>` : ''}
          <button class="today-mini-btn" onclick="openAiEmailModal('${l.id}')">âœ¨ IA</button>
          <button class="today-mini-btn danger" onclick="markNotInterested('${l.id}');renderTodayPanel()">âœ•</button>
        </div>`).join('')}
    </div>`);
  }

  // Card: resumen semana
  cards.push(`<div class="today-action-card">
    <div class="today-action-header" style="color:var(--success)">ðŸ“ˆ Esta semana</div>
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
      <button class="today-mini-btn" onclick="showView('kanban')">ðŸ“‹ Pipeline</button>
      <button class="today-mini-btn" onclick="showView('planner')">ðŸ” Buscar empresas</button>
      <button class="today-mini-btn" onclick="openFocusMode()" style="background:rgba(10,132,255,.1);border-color:var(--primary);color:var(--primary)">âš¡ Modo Enfoque</button>
    </div>
  </div>`);

  el.style.gridTemplateColumns = cards.length >= 3 ? 'repeat(auto-fit,minmax(240px,1fr))' : 'repeat(auto-fit,minmax(200px,1fr))';
  el.innerHTML = cards.length ? cards.join('') : '<div class="today-action-card" style="grid-column:1/-1"><div style="font-size:.82rem;color:var(--success);text-align:center;padding:.5rem">âœ… Todo al dÃ­a â€” no hay acciones pendientes para hoy</div></div>';
}

function todayPostpone(leadId) {
  const lead = leads.find(l => l.id == leadId);
  if (!lead) return;
  const d = new Date(lead.next_contact);
  d.setDate(d.getDate() + 1);
  lead.next_contact = d.toISOString().slice(0,10);
  addActivityLog(leadId, `ðŸ“… Seguimiento pospuesto a ${lead.next_contact}`);
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
    <div class="pipeline-value">${total.toLocaleString('es-ES')}â‚¬</div>
    <div style="font-size:.75rem;color:var(--text-muted);margin-top:.25rem">${active.length} leads con presupuesto Â· ${total > 0 ? Math.round(total/active.length).toLocaleString('es-ES')+'â‚¬ media' : 'â€”'}</div>
    ${closed > 0 ? `<div style="font-size:.78rem;color:var(--success);margin-top:.4rem">âœ… ${closed.toLocaleString('es-ES')}â‚¬ cerrados</div>` : ''}
    <div style="font-size:.7rem;color:var(--text-dim);margin-top:.5rem">AÃ±ade presupuesto estimado en cada lead para ver el valor del pipeline</div>`;
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
    <div class="streak-badge">ðŸ”¥ ${days} dÃ­a${days!==1?'s':''} de racha</div>
    <div style="font-size:.75rem;color:var(--text-muted)">${days >= 7 ? 'Â¡Semana completa! ðŸ†' : days >= 3 ? 'Buen ritmo ðŸ’ª' : 'Empieza tu racha'}</div>
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
  }).join('') + '</div><div style="font-size:.65rem;color:var(--text-dim);margin-top:.3rem">Ãšltimos 12 meses</div>';
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
  showToast('Objetivos guardados âœ“');
}
function renderObjectivesPanel() {
  const el = document.getElementById('objectives-panel');
  if (!el) return;
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); weekStart.setHours(0,0,0,0);
  const leadsW  = leads.filter(l => l.date && new Date(l.date) >= weekStart).length;
  const emailsW = emailHistory.filter(e => e.date && new Date(e.date) >= weekStart).length;
  const repliesW = leads.filter(l => l.status_date && new Date(l.status_date) >= weekStart && l.status === 'Respuesta del cliente').length;
  const items = [
    { label:'Leads nuevos', val:leadsW, target:objectives.leads, icon:'ðŸ‘¥' },
    { label:'Emails enviados', val:emailsW, target:objectives.emails, icon:'âœ‰ï¸' },
    { label:'Respuestas', val:repliesW, target:objectives.replies, icon:'ðŸ’¬' },
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
  const key = `${segment} â€” ${location}`;
  searchHistoryList = [key, ...searchHistoryList.filter(k => k !== key)].slice(0,5);
  localStorage.setItem('gordi_search_history', JSON.stringify(searchHistoryList));
  renderSearchHistory();
}
function renderSearchHistory() {
  const el = document.getElementById('search-history-bar');
  if (!el || !searchHistoryList.length) return;
  el.innerHTML = '<span style="font-size:.68rem;color:var(--text-dim);margin-right:.25rem">Recientes:</span>' +
    searchHistoryList.map(k => {
      const [seg, loc] = k.split(' â€” ');
      return `<span class="sh-pill" onclick="applySearchHistory('${encodeURIComponent(seg)}','${encodeURIComponent(loc)}')">${k}</span>`;
    }).join('');
}
function applySearchHistory(seg, loc) {
  const segEl = document.getElementById('plan-segment');
  const locEl = document.getElementById('plan-location');
  if (segEl) segEl.value = decodeURIComponent(seg);
  if (locEl) locEl.value = decodeURIComponent(loc);
}

function renderPlan() {
  try { renderSearchHistory(); } catch {}
  try { sfUpdateChips('search'); } catch {}
}

// ============ AI EMAIL EXTRAS ============
async function regenerateSubjectOnly() {
  const lead = leads.find(l => l.id == aiCurrentLeadId);
  if (!lead) return;
  const key = getGeminiKey();
  if (!key) return;
  const btn = event.target;
  btn.textContent = 'â³ Generando...'; btn.disabled = true;
  try {
    // Usar Gemini para generar asuntos de email
    const geminiResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: `Genera 3 asuntos de email comercial cortos y directos para contactar a ${lead.company} (sector ${lead.segment}). Solo los 3 asuntos numerados, sin mÃ¡s texto.` }] }] })
    });
    const data = await geminiResp.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const subjects = text.split('\n').filter(l => l.trim() && /^\d/.test(l.trim())).slice(0,3);
    if (subjects.length) {
      const chosen = prompt('Elige un asunto (pega el que prefieras):\n\n' + subjects.join('\n'));
      if (chosen) document.getElementById('ai-subject-out').value = chosen.replace(/^\d+[\.\)]\s*/, '').trim();
    }
  } catch(e) { showToast('Error generando asuntos'); }
  btn.textContent = 'ðŸ”„ Nuevo asunto'; btn.disabled = false;
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
  showToast(`Plantilla guardada para sector ${key} âœ“`);
}

function checkSpam(subject) {
  const spamWords = ['gratis','free','oferta','urgente','descuento','!','â‚¬â‚¬','$$','100%','garantizado','ganador'];
  const hits = spamWords.filter(w => subject.toLowerCase().includes(w));
  const el = document.getElementById('spam-check-result');
  if (!el) return;
  if (hits.length === 0) el.innerHTML = '<span class="spam-ok">âœ… Asunto sin palabras de spam</span>';
  else if (hits.length <= 2) el.innerHTML = `<span class="spam-warn">âš ï¸ Palabras de riesgo: ${hits.join(', ')}</span>`;
  else el.innerHTML = `<span class="spam-bad">ðŸš« Alto riesgo de spam: ${hits.join(', ')}</span>`;
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
  const key = getGeminiKey();
  if (!key) { showToast('Configura la API key de Gemini'); return; }
  const daysInStatus = lead.status_date ? Math.floor((Date.now()-new Date(lead.status_date))/86400000) : 7;
  closeAiModal();
  const modal = document.getElementById('ai-email-modal');
  modal.style.display = 'flex';
  document.getElementById('ai-loading').style.display = 'block';
  document.getElementById('ai-result').style.display = 'none';
  document.getElementById('ai-modal-title').innerText = `â†©ï¸ Seguimiento para ${lead.company}`;
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
- DÃ­as sin respuesta: ${daysInStatus}
- Emails previos enviados: ${emailCount}
- Ãšltimo asunto enviado: "${lastSubject}"
- SeÃ±ales del lead: ${(lead.signals||[]).slice(0,3).join(' Â· ') || 'sin seÃ±ales'}
- Nota Google: ${lead.rating ? lead.rating + '/5 (' + lead.ratingCount + ' reseÃ±as)' : 'sin datos'}
${lead.decision_maker ? '- Decisor: ' + lead.decision_maker : ''}

TONO DEL SECTOR: ${segmentToneFollow.tone}
DOLOR PRINCIPAL: ${segmentToneFollow.pain}
ÃNGULO DE VENTA: ${segmentToneFollow.angle}
PROHIBIDO: ${segmentToneFollow.forbidden}

REGLAS DEL SEGUIMIENTO:
${daysInStatus <= 4 ? `- Han pasado SOLO ${daysInStatus} dÃ­as. El tono debe ser muy breve y ligero â€” apenas un recordatorio amable. No dar la lata.` :
  daysInStatus <= 10 ? `- Han pasado ${daysInStatus} dÃ­as. Aporta UN dato nuevo o Ã¡ngulo diferente al primer email. No repetir lo mismo.` :
  `- Han pasado ${daysInStatus} dÃ­as. Este es posiblemente el Ãºltimo intento. Abre una puerta de salida elegante ("si no es el momento...") pero con un CTA claro.`}
- NUNCA mencionar el asunto anterior ni decir "como te dije"
- NUNCA: "solo querÃ­a recordarte", "espero que todo vaya bien", frases de relleno
- SÃ: empezar con algo que aporte valor (un dato, una pregunta, un Ã¡ngulo nuevo)
- Longitud: ${daysInStatus <= 4 ? '50-70' : '80-120'} palabras mÃ¡ximo en el cuerpo
- Formato HTML con <br><br> entre pÃ¡rrafos, <strong> solo en el CTA
- Genera 2 opciones de asunto: uno directo, uno de curiosidad/pregunta

Responde ÃšNICAMENTE JSON vÃ¡lido:
{"subjects":["asunto directo","asunto pregunta/curiosidad"],"body":"HTML del email","tactic":"en 1 frase: quÃ© tÃ¡ctica usaste y por quÃ© para este caso concreto"}`;

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
    const subjectLabels = ['ðŸŽ¯ Directo', 'â“ Pregunta'];
    if (subjectList) {
      subjectList.innerHTML = followSubjects.map((s, i) => `
        <div onclick="selectAiSubject(this, '${s.replace(/'/g,"&#39;")}')"
          style="cursor:pointer;padding:.5rem .75rem;border-radius:8px;border:1px solid var(--glass-border);
          background:var(--glass);font-size:.82rem;display:flex;gap:.5rem;align-items:center;justify-content:space-between;transition:border-color .15s"
          class="subject-option${i===0?' selected-subject':''}">
          <div style="display:flex;gap:.5rem;align-items:flex-start;flex:1">
            <span style="font-size:.7rem;color:var(--text-muted);white-space:nowrap;padding-top:1px">${subjectLabels[i]||'âœï¸'}</span>
            <span>${s}</span>
          </div>
          <button onclick="event.stopPropagation();copySubjectOption('${s.replace(/'/g,"&#39;")}')" title="Copiar asunto"
            style="background:none;border:none;cursor:pointer;font-size:.75rem;color:var(--text-dim);padding:.1rem .3rem;border-radius:4px;flex-shrink:0;transition:color .15s"
            onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-dim)'">ðŸ“‹</button>
        </div>`).join('');
    }
    document.getElementById('ai-subject-out').value = followSubjects[0] || '';
    document.getElementById('ai-body-editor').innerHTML = result.body || '';
    if (result.tactic) {
      document.getElementById('ai-reviews-insight').innerHTML =
        `<strong style="color:var(--primary)">ðŸ§  TÃ¡ctica usada:</strong> ${result.tactic}`;
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
  let pin;
  try {
    pin = localStorage.getItem('gordi_pin');
  } catch (e) {
    console.error('Error al acceder a localStorage para el PIN:', e);
    return; // Fallback gracefully if localStorage is unavailable
  }
  if (!pin) return;
  const input = prompt('ðŸ”’ Voltflow â€” Introduce tu PIN:');
  if (input !== pin) {
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0f1e;color:#ef4444;font-family:sans-serif;font-size:1.2rem">ðŸ”’ PIN incorrecto. Recarga para intentarlo de nuevo.</div>';
    throw new Error('PIN incorrecto');
  }
}
function savePin() {
  const pin = document.getElementById('pin-input').value;
  if (pin && !/^\d{4}$/.test(pin)) { showToast('El PIN debe ser exactamente 4 dÃ­gitos'); return; }
  if (pin) { localStorage.setItem('gordi_pin', pin); document.getElementById('pin-status').innerHTML = '<span style="color:var(--success)">âœ… PIN guardado</span>'; }
  else { localStorage.removeItem('gordi_pin'); document.getElementById('pin-status').innerHTML = '<span style="color:var(--text-muted)">PIN eliminado</span>'; }
}
function removePin() {
  localStorage.removeItem('gordi_pin');
  document.getElementById('pin-input').value = '';
  document.getElementById('pin-status').innerHTML = '<span style="color:var(--text-muted)">PIN eliminado</span>';
}

// ============ BACKUP / RESTORE ============
// exportDataSnapshot estÃ¡ definida en modules/init.js (versiÃ³n authoritative
// con todas las claves gordi_gh_* y VOLTFLOW_DATA_KEYS completo)

// â”€â”€â”€ EXPORTAR / IMPORTAR DATOS PORTÃTILES ENTRE VERSIONES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  showToast(`ðŸ“¦ Datos exportados (${leadsCount} leads + configuraciÃ³n)`);
}

// â”€â”€â”€ IMPORTAR DESDE VERSIÃ“N ANTERIOR (lee localStorage directamente) â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    getGeminiKey() ||
    localStorage.getItem('gordi_user_name')
  );

  // Detectar todas las claves gordi_ presentes (incluyendo cachÃ© de enriquecimiento)
  const allGordiKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('gordi_')) allGordiKeys.push(k);
  }

  if (allGordiKeys.length === 0) {
    showToast('â„¹ï¸ No se encontraron datos de Voltflow en este navegador');
    return;
  }

  // AnÃ¡lisis de duplicados con los leads actuales en memoria
  const normN = n => (n||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,25);
  let newCount = 0, dupCount = 0;
  for (const l of leadsData) {
    const dup = leads.find(ex =>
      (l.placeId && ex.placeId && l.placeId === ex.placeId) ||
      normN(ex.company) === normN(l.company)
    );
    if (dup) dupCount++; else newCount++;
  }

  // Detectar fecha del dato mÃ¡s reciente
  let lastActivity = null;
  for (const l of leadsData) {
    const d = new Date(l.date || 0);
    if (!lastActivity || d > lastActivity) lastActivity = d;
  }
  const lastStr = lastActivity
    ? lastActivity.toLocaleDateString('es-ES', {day:'2-digit', month:'short', year:'numeric'})
    : 'â€”';

  // Calcular peso total
  let totalBytes = 0;
  for (const k of allGordiKeys) totalBytes += (localStorage.getItem(k)||'').length * 2;
  const totalKb = Math.round(totalBytes / 1024);

  document.getElementById('import-modal-overlay').style.display = 'flex';
  document.getElementById('import-modal-content').innerHTML = `
    <div style="padding:1.5rem;display:grid;gap:1.25rem">

      <!-- Cabecera: quÃ© se ha encontrado -->
      <div style="background:rgba(10,132,255,.06);border:1px solid rgba(10,132,255,.15);border-radius:10px;padding:1rem 1.25rem">
        <div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.1em;color:var(--primary);font-weight:700;margin-bottom:.6rem">ðŸ” Datos encontrados en este navegador</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.45rem .75rem;font-size:.82rem">
          <div><span style="color:var(--text-muted)">Leads guardados:</span> <strong style="color:var(--text)">${leadsData.length}</strong></div>
          <div><span style="color:var(--text-muted)">Emails en historial:</span> <strong style="color:var(--text)">${historyData.length}</strong></div>
          <div><span style="color:var(--text-muted)">CampaÃ±as:</span> <strong style="color:var(--text)">${campsData.length}</strong></div>
          <div><span style="color:var(--text-muted)">ConfiguraciÃ³n:</span> <strong style="color:${hasConfig?'var(--success)':'var(--text-dim)'}">${hasConfig?'âœ… Incluida':'â€”'}</strong></div>
          <div><span style="color:var(--text-muted)">Ãšltimo lead aÃ±adido:</span> <strong style="color:var(--text)">${lastStr}</strong></div>
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
        <strong style="color:var(--success)">ðŸ” AnÃ¡lisis:</strong>
        <span style="color:var(--text-muted)"> ${newCount} leads <strong style="color:var(--success)">nuevos</strong> Â· ${dupCount} posibles <strong style="color:var(--warning)">duplicados</strong></span>
      </div>` : ''}

      ${leadsData.length === 0 ? `
      <div style="background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.2);border-radius:8px;padding:.75rem 1rem;font-size:.82rem;color:var(--danger)">
        âš ï¸ No se encontraron leads en el storage. Es posible que los datos estÃ©n en un navegador o perfil diferente.
      </div>` : ''}

      <!-- Opciones -->
      <div style="display:grid;gap:.75rem">
        <div style="font-size:.78rem;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:.08em">Â¿CÃ³mo quieres importar?</div>

        ${leads.length > 0 && leadsData.length > 0 ? `
        <button onclick="executeLocalImport('merge')" style="display:flex;align-items:flex-start;gap:.85rem;background:rgba(16,217,124,.07);border:1px solid rgba(16,217,124,.2);border-radius:10px;padding:.9rem 1.1rem;cursor:pointer;text-align:left;transition:all .2s;width:100%" onmouseover="this.style.borderColor='var(--success)'" onmouseout="this.style.borderColor='rgba(16,217,124,.2)'">
          <span style="font-size:1.3rem;flex-shrink:0">ðŸ”€</span>
          <div>
            <div style="font-weight:700;color:var(--success);font-size:.88rem;margin-bottom:2px">Combinar <span style="font-weight:400;color:var(--text-muted);font-size:.78rem">(recomendado)</span></div>
            <div style="font-size:.75rem;color:var(--text-muted);line-height:1.5">AÃ±ade los ${newCount} leads nuevos a los ${leads.length} que ya tienes en memoria. Los ${dupCount} duplicados se ignoran. No se pierde nada.</div>
          </div>
        </button>` : ''}

        ${leadsData.length > 0 ? `
        <button onclick="executeLocalImport('replace')" style="display:flex;align-items:flex-start;gap:.85rem;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.15);border-radius:10px;padding:.9rem 1.1rem;cursor:pointer;text-align:left;transition:all .2s;width:100%" onmouseover="this.style.borderColor='var(--warning)'" onmouseout="this.style.borderColor='rgba(245,158,11,.15)'">
          <span style="font-size:1.3rem;flex-shrink:0">ðŸ”„</span>
          <div>
            <div style="font-weight:700;color:var(--warning);font-size:.88rem;margin-bottom:2px">Cargar todo desde storage</div>
            <div style="font-size:.75rem;color:var(--text-muted);line-height:1.5">Carga los ${leadsData.length} leads y todos los datos guardados en el navegador como estado actual. ${leads.length > 0 ? `<strong style="color:var(--danger)">Reemplaza los ${leads.length} leads en memoria.</strong>` : ''}</div>
          </div>
        </button>` : ''}

        ${hasConfig ? `
        <button onclick="executeLocalImport('config_only')" style="display:flex;align-items:flex-start;gap:.85rem;background:rgba(94,92,230,.06);border:1px solid rgba(94,92,230,.15);border-radius:10px;padding:.9rem 1.1rem;cursor:pointer;text-align:left;transition:all .2s;width:100%" onmouseover="this.style.borderColor='var(--secondary)'" onmouseout="this.style.borderColor='rgba(94,92,230,.15)'">
          <span style="font-size:1.3rem;flex-shrink:0">âš™ï¸</span>
          <div>
            <div style="font-weight:700;color:var(--secondary);font-size:.88rem;margin-bottom:2px">Solo configuraciÃ³n</div>
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

  const safety = typeof createSafetySnapshot === 'function'
    ? createSafetySnapshot(`before_local_import_${mode}`)
    : null;
  if (mode === 'replace' && !confirm(`Vas a reemplazar los datos actuales por los datos del storage.\n\nSnapshot de seguridad: ${safety ? 'creado' : 'no disponible'}.\n\nContinuar?`)) {
    return;
  }

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
    // Historial: aÃ±adir los que no estÃ©n ya
    const exIds = new Set(emailHistory.map(h => h.id || (h.date + h.email)));
    const newHist = histData.filter(h => !exIds.has(h.id || (h.date + h.email)));
    emailHistory = [...emailHistory, ...newHist];
    // CampaÃ±as: aÃ±adir las nuevas
    const exCampIds = new Set(campaigns.map(c => c.id));
    campaigns = [...campaigns, ...campsData.filter(c => !exCampIds.has(c.id))];
    saveLeads();
    localStorage.setItem('gordi_email_history', JSON.stringify(emailHistory));
    localStorage.setItem('gordi_campaigns', JSON.stringify(campaigns));
    renderAll(); renderDashboardCharts(); renderTracking(); renderCampaigns();
    closeImportModal();
    showToast(`âœ… Combinado: +${added} leads nuevos importados`);

  } else if (mode === 'replace') {
    leads = leadsData;
    emailHistory = histData;
    campaigns = campsData;
    saveLeads();
    localStorage.setItem('gordi_email_history', JSON.stringify(emailHistory));
    localStorage.setItem('gordi_campaigns', JSON.stringify(campaigns));
    renderAll(); renderDashboardCharts(); renderTracking(); renderCampaigns();
    closeImportModal();
    showToast(`âœ… ${leads.length} leads cargados desde el storage`);

  } else if (mode === 'config_only') {
    for (const key of CONFIG_KEYS) {
      const val = localStorage.getItem(key);
      if (val !== null) localStorage.setItem(key, val);
    }
    loadAllData();
    closeImportModal();
    showToast('âœ… ConfiguraciÃ³n cargada (leads sin cambios)');
  }
}

function closeImportModal() {
  document.getElementById('import-modal-overlay').style.display = 'none';
}

function buildSnapshotFromFullBackup(data) {
  return {
    _voltflow_version: data.version || VOLTFLOW_VERSION || 'backup',
    _exported: data.date || new Date().toISOString(),
    gordi_leads: JSON.stringify(data.leads || []),
    gordi_email_history: JSON.stringify(data.emailHistory || []),
    gordi_campaigns: JSON.stringify(data.campaigns || []),
    gordi_objectives: JSON.stringify(data.objectives || {}),
    gordi_templates: JSON.stringify(data.templates || {})
  };
}

function openSafetySnapshotsModal() {
  const items = typeof listSafetySnapshots === 'function' ? listSafetySnapshots() : [];
  const rows = items.length ? items.map(item => {
    const date = new Date(item.date).toLocaleString('es-ES');
    const reason = (item.reason || 'manual').replace(/_/g, ' ');
    const summary = item.summary || {};
    return `
      <div style="display:grid;grid-template-columns:1fr auto;gap:.75rem;align-items:center;padding:.85rem;border:1px solid var(--glass-border);border-radius:10px;background:var(--bg3)">
        <div>
          <div style="font-weight:700;color:var(--text);font-size:.9rem">${date}</div>
          <div style="font-size:.75rem;color:var(--text-muted);margin-top:2px">${reason} · ${summary.leads || 0} leads · ${summary.keys || 0} claves</div>
        </div>
        <button class="btn btn-small secondary" onclick="restoreSafetySnapshot('${item.id}')">Restaurar</button>
      </div>`;
  }).join('') : `
    <div style="padding:1rem;border:1px solid var(--glass-border);border-radius:10px;background:var(--bg3);color:var(--text-muted);font-size:.85rem">
      Todavia no hay snapshots automaticos. Se crean antes de importar, restaurar, sincronizar o abrir una version nueva.
    </div>`;

  document.getElementById('import-modal-overlay').style.display = 'flex';
  document.getElementById('import-modal-content').innerHTML = `
    <div style="padding:1.5rem;display:grid;gap:1rem">
      <div style="display:flex;justify-content:space-between;gap:1rem;align-items:center">
        <div>
          <h3 style="margin:0;color:var(--text)">Snapshots de seguridad</h3>
          <p style="margin:.25rem 0 0;color:var(--text-muted);font-size:.82rem">Ultimos ${items.length} puntos de recuperacion guardados en este navegador.</p>
        </div>
        <button onclick="closeImportModal()" class="btn btn-small ghost">Cerrar</button>
      </div>
      <div style="display:grid;gap:.65rem;max-height:420px;overflow:auto">${rows}</div>
      <div style="display:flex;gap:.6rem;justify-content:flex-end;flex-wrap:wrap">
        <button onclick="createSafetySnapshot('manual', { download: true }); openSafetySnapshotsModal();" class="btn secondary">Crear y exportar ahora</button>
        <button onclick="exportLatestSafetySnapshot()" class="btn primary">Exportar ultimo snapshot</button>
      </div>
    </div>`;
}

// Banner de bienvenida tras migraciÃ³n automÃ¡tica en primer arranque
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

  const apiTxt  = log.hasApiKeys ? '<span style="color:var(--success)">âœ… API keys</span>' : '';
  const profTxt = log.hasProfile ? '<span style="color:var(--success)">âœ… Perfil</span>'    : '';
  const extras  = [apiTxt, profTxt].filter(Boolean).join(' Â· ');

  banner.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:.85rem">
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0">âš¡</div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:.9rem;color:var(--text);margin-bottom:.2rem">Â¡Voltflow v${VOLTFLOW_VERSION} listo!</div>
        <div style="font-size:.78rem;color:var(--text-muted);line-height:1.5">
          Datos cargados automÃ¡ticamente desde la versiÃ³n anterior:
        </div>
        <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.5rem">
          <span style="background:rgba(10,132,255,.12);border:1px solid rgba(10,132,255,.2);border-radius:20px;padding:2px 9px;font-size:.72rem;color:var(--primary);font-weight:600">
            ${log.leads} leads
          </span>
          ${log.emails > 0 ? `<span style="background:rgba(94,92,230,.12);border:1px solid rgba(94,92,230,.2);border-radius:20px;padding:2px 9px;font-size:.72rem;color:#a78bfc;font-weight:600">${log.emails} emails</span>` : ''}
          ${log.campaigns > 0 ? `<span style="background:rgba(16,217,124,.1);border:1px solid rgba(16,217,124,.2);border-radius:20px;padding:2px 9px;font-size:.72rem;color:var(--success);font-weight:600">${log.campaigns} campaÃ±as</span>` : ''}
        </div>
        ${extras ? `<div style="font-size:.72rem;margin-top:.4rem;display:flex;gap:.5rem;flex-wrap:wrap">${extras}</div>` : ''}
      </div>
      <button onclick="document.getElementById('migration-banner').remove()" style="background:none;border:none;color:var(--text-dim);font-size:1rem;cursor:pointer;padding:0;flex-shrink:0;line-height:1;margin-top:-2px" title="Cerrar">âœ•</button>
    </div>
  `;

  // AÃ±adir keyframe si no existe
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
  const portableSnapshot = typeof exportDataSnapshot === 'function' ? exportDataSnapshot() : null;
  const integrity = portableSnapshot && typeof validateDataSnapshot === 'function'
    ? validateDataSnapshot(portableSnapshot).summary
    : null;
  const data = {
    version: '2.0', date: new Date().toISOString(),
    leads, emailHistory, campaigns, objectives,
    templates: emailTemplates,
    portableSnapshot,
    integrity
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `gordi_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click(); URL.revokeObjectURL(url);
  showToast('Backup exportado âœ“');
}

function openPasteRecoveryModal() {
  const old = document.getElementById('paste-recovery-modal');
  if (old) old.remove();
  const modal = document.createElement('div');
  modal.id = 'paste-recovery-modal';
  modal.className = 'modal-overlay';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
  modal.innerHTML = `
    <div style="width:min(720px,100%);background:var(--bg-card);border:1px solid var(--glass-border);border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.45);overflow:hidden">
      <div style="padding:18px 20px;border-bottom:1px solid var(--glass-border)">
        <h3 style="margin:0;font-size:1rem">Pegar backup o datos portatiles</h3>
        <p style="margin:.35rem 0 0;color:var(--text-muted);font-size:.8rem;line-height:1.45">Pega aqui el JSON exportado desde otra URL o version. Se validara igual que un archivo de backup.</p>
      </div>
      <div style="padding:18px 20px">
        <textarea id="paste-recovery-json" spellcheck="false" placeholder='{"gordi_leads":"[...]"}' style="width:100%;height:260px;box-sizing:border-box;background:var(--glass);border:1px solid var(--glass-border);border-radius:10px;color:var(--text);padding:12px;font-family:ui-monospace,Consolas,monospace;font-size:.78rem;line-height:1.45;resize:vertical"></textarea>
      </div>
      <div style="padding:14px 20px;border-top:1px solid var(--glass-border);display:flex;justify-content:flex-end;gap:.6rem;flex-wrap:wrap">
        <button class="btn-outline" onclick="document.getElementById('paste-recovery-modal')?.remove()">Cancelar</button>
        <button class="btn-primary" onclick="restoreBackupFromPastedJson()">Validar y restaurar</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  setTimeout(() => document.getElementById('paste-recovery-json')?.focus(), 50);
}

function restoreBackupFromPastedJson() {
  const textarea = document.getElementById('paste-recovery-json');
  const raw = textarea?.value?.trim();
  if (!raw) { showToast('Pega primero el JSON del backup'); return; }
  try {
    JSON.parse(raw);
  } catch (e) {
    alert('JSON no valido: ' + e.message);
    return;
  }
  const file = new File([raw], 'voltflow_pasted_backup.json', { type: 'application/json' });
  document.getElementById('paste-recovery-modal')?.remove();
  restoreBackup({ target: { files: [file] } });
}

function restoreBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);

      // â”€â”€ Formato A: backup completo  { leads:[...], emailHistory:[...], ... }
      // Generado por "Backup completo (JSON)" en Voltflow2 / app.html
      if (data.leads && Array.isArray(data.leads)) {
        const backupSnapshot = data.portableSnapshot || buildSnapshotFromFullBackup(data);
        const validation = typeof validateDataSnapshot === 'function'
          ? validateDataSnapshot(backupSnapshot, typeof getCurrentDataSummary === 'function' ? getCurrentDataSummary() : null)
          : { ok: true, warnings: [] };
        if (!validation.ok) {
          alert('Backup corrupto o incompatible:\n- ' + validation.errors.join('\n- '));
          return;
        }
        const dateStr = data.date
          ? new Date(data.date).toLocaleDateString('es-ES')
          : 'fecha desconocida';
        const warnings = validation.warnings && validation.warnings.length ? `\n\nAvisos:\n- ${validation.warnings.join('\n- ')}` : '';
        if (!confirm(`Restaurar backup del ${dateStr}?\nSe cargaran ${data.leads.length} leads.\nSe creara un snapshot de seguridad antes de reemplazar los datos actuales.${warnings}`)) return;
        if (data.portableSnapshot && typeof importDataSnapshot === 'function') {
          importDataSnapshot(data.portableSnapshot, true, { reason: 'before_restore_full_backup' });
          if (typeof reloadDataFromStorage === 'function') reloadDataFromStorage();
          showToast(`âœ… Backup completo restaurado: ${validation.summary.leads} leads`);
          return;
        }
        if (typeof createSafetySnapshot === 'function') createSafetySnapshot('before_restore_legacy_backup');

        leads        = data.leads        || [];
        emailHistory = data.emailHistory || [];
        campaigns    = data.campaigns    || [];
        objectives   = data.objectives   || objectives;
        if (data.templates) {
          const base = (typeof defaultTemplates !== 'undefined') ? defaultTemplates : {};
          emailTemplates = { ...base, ...data.templates };
        }
        saveLeads();
        localStorage.setItem('gordi_email_history', JSON.stringify(emailHistory));
        localStorage.setItem('gordi_campaigns',     JSON.stringify(campaigns));
        localStorage.setItem('gordi_objectives',    JSON.stringify(objectives));
        localStorage.setItem('gordi_templates',     JSON.stringify(emailTemplates));
        renderAll(); renderDashboardCharts();
        if (typeof renderTracking     === 'function') renderTracking();
        if (typeof renderCampaigns    === 'function') renderCampaigns();
        if (typeof renderTemplateList === 'function') renderTemplateList();
        showToast(`âœ… Backup restaurado: ${leads.length} leads`);
        return;
      }

      // â”€â”€ Formato B: snapshot portÃ¡til del index.html antiguo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      // Generado por "Exportar datos portÃ¡tiles" â€” estructura:
      // { _voltflow_version:"x", _exported:"...", gordi_leads:"[...]", ... }
      if (data.gordi_leads !== undefined || data._voltflow_version || data._exported) {
        const validation = typeof validateDataSnapshot === 'function'
          ? validateDataSnapshot(data, typeof getCurrentDataSummary === 'function' ? getCurrentDataSummary() : null)
          : { ok: true, warnings: [] };
        if (!validation.ok) {
          alert('Archivo corrupto o incompatible:\n- ' + validation.errors.join('\n- '));
          return;
        }
        let parsedLeads = [];
        try { parsedLeads = JSON.parse(data.gordi_leads || '[]'); } catch {}
        const dateStr = data._exported
          ? new Date(data._exported).toLocaleDateString('es-ES')
          : 'fecha desconocida';
        const warnings = validation.warnings && validation.warnings.length ? `\n\nAvisos:\n- ${validation.warnings.join('\n- ')}` : '';
        if (!confirm(`Restaurar datos portatiles del ${dateStr}?\nSe cargaran ${parsedLeads.length} leads.\nSe creara un snapshot de seguridad antes de reemplazar los datos actuales.${warnings}`)) return;
        if (typeof createSafetySnapshot === 'function') createSafetySnapshot('before_restore_portable_snapshot');

        // Volcar todas las claves gordi_* al localStorage
        let restored = 0;
        for (const [key, val] of Object.entries(data)) {
          if (key.startsWith('_')) continue;
          if (typeof val === 'string' && !(typeof VOLTFLOW_SNAPSHOT_EXCLUDED_KEYS !== 'undefined' && VOLTFLOW_SNAPSHOT_EXCLUDED_KEYS.has(key))) { localStorage.setItem(key, val); restored++; }
        }

        // Recargar estado en memoria desde el localStorage reciÃ©n poblado
        try { leads        = JSON.parse(localStorage.getItem('gordi_leads')         || '[]'); } catch { leads = []; }
        try { emailHistory = JSON.parse(localStorage.getItem('gordi_email_history') || '[]'); } catch { emailHistory = []; }
        try { campaigns    = JSON.parse(localStorage.getItem('gordi_campaigns')     || '[]'); } catch { campaigns = []; }
        try { objectives   = JSON.parse(localStorage.getItem('gordi_objectives')    || '[]'); } catch {}
        const tplRaw = localStorage.getItem('gordi_templates');
        if (tplRaw) {
          try {
            const base = (typeof defaultTemplates !== 'undefined') ? defaultTemplates : {};
            emailTemplates = { ...base, ...JSON.parse(tplRaw) };
          } catch {}
        }

        renderAll(); renderDashboardCharts();
        if (typeof renderTracking     === 'function') renderTracking();
        if (typeof renderCampaigns    === 'function') renderCampaigns();
        if (typeof renderTemplateList === 'function') renderTemplateList();
        showToast(`âœ… Datos portÃ¡tiles restaurados: ${leads.length} leads`);
        return;
      }

      alert('Archivo no reconocido.\nUsa un "Backup completo" (gordi_backup_*.json) o un "Exportar datos portÃ¡tiles" (voltflow_datos_*.json) generado por Voltflow.');

    } catch(err) {
      alert('Error al leer el archivo: ' + err.message + '\nAsegÃºrate de que es un JSON vÃ¡lido exportado desde Voltflow.');
    }
  };
  reader.readAsText(file);
}
function autoWeeklyBackup() {
  const last = localStorage.getItem('gordi_last_backup');
  const now = Date.now();
  if (!last || now - parseInt(last) > 7 * 86400000) {
    localStorage.setItem('gordi_last_backup', now.toString());
    if (leads.length > 0) {
      if (typeof createSafetySnapshot === 'function') {
        const item = createSafetySnapshot('auto_weekly');
        if (item) localStorage.setItem('gordi_auto_backup', JSON.stringify({ version:'2.0', date:item.date, snapshotId:item.id, summary:item.summary }));
      } else {
        const data = { version:'2.0', date:new Date().toISOString(), leads, emailHistory, campaigns };
        localStorage.setItem('gordi_auto_backup', JSON.stringify(data));
      }
      if (!localStorage.getItem('gordi_backup_export_reminded')) {
        localStorage.setItem('gordi_backup_export_reminded', now.toString());
        setTimeout(() => showToast('Consejo: exporta un backup JSON para conservar una copia fuera del navegador'), 1200);
      }
    }
  }
}

// ============ CLEAN OBSOLETE ============
function cleanObsoleteLeads() {
  const cutoff = Date.now() - 90 * 86400000;
  const old = leads.filter(l => !l.archived && l.status === 'Pendiente' && new Date(l.date) < cutoff);
  if (!old.length) { showToast('No hay leads obsoletos (>90 dÃ­as en Pendiente)'); return; }
  if (!confirm(`Hay ${old.length} leads en "Pendiente" hace mÃ¡s de 90 dÃ­as. Â¿Archivarlos todos?`)) return;
  old.forEach(l => l.archived = true);
  saveLeads();
  renderAll();
  showToast(`${old.length} leads archivados âœ“`);
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
  el.textContent = `Espacio usado: ${kb} KB de ${maxKb} KB (${leads.length} leads Â· ${emailHistory.length} emails)`;
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
  el.innerHTML = log.length ? log.map(e => `<div style="border-bottom:1px solid var(--glass-border);padding:.2rem 0;"><span style="color:var(--text-dim)">${new Date(e.date).toLocaleString('es-ES')}</span> â€” ${e.msg}</div>`).join('') : 'Sin errores registrados âœ“';
}
function clearApiLog() { localStorage.removeItem('gordi_api_log'); renderApiLog(); showToast('Log limpiado'); }

// ============ TUTORIAL ============
const tutorialSteps = [
  { icon:'âš¡', title:'Bienvenido a Voltflow', body:'Tu herramienta de prospecciÃ³n B2B para Voltium Madrid. En 5 pasos aprenderÃ¡s todo lo que necesitas saber.' },
  { icon:'ðŸ”', title:'Busca empresas con IA', body:'Ve a "Buscar Empresas", introduce una zona y sector. Voltflow encontrarÃ¡ empresas reales con email, telÃ©fono y decisor usando Google Maps.' },
  { icon:'âœ¨', title:'Email hiperpersonalizado', body:'Abre cualquier lead y pulsa âœ¨ IA. Voltflow analiza las reseÃ±as de Google de esa empresa y escribe un email que menciona sus problemas concretos.' },
  { icon:'ðŸ—‚ï¸', title:'Pipeline Kanban', body:'Usa el Kanban para gestionar visualmente en quÃ© estado estÃ¡ cada empresa. Arrastra las tarjetas entre columnas conforme avanza la conversaciÃ³n.' },
  { icon:'ðŸŽ¯', title:'Configura las APIs', body:'Para activar la bÃºsqueda de empresas necesitas una Google Maps API Key (console.cloud.google.com). Para el email IA, una Gemini Key gratis en aistudio.google.com/apikey.' },
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
  document.getElementById('tutorial-next').textContent = tutStep < tutorialSteps.length - 1 ? 'Siguiente â†’' : 'Â¡Empezar!';
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
  sanitizeDashboardMarkup();
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
    if (l.status === 'Contactado' || l.status === 'En negociaciÃ³n' || l.status === 'Cerrado') {
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
    + '<div style="background:var(--glass);border-radius:10px;padding:.75rem;text-align:center"><div style="font-size:1.4rem;font-weight:700;color:var(--primary)">' + totalAdded + '</div><div style="font-size:.72rem;color:var(--text-muted);margin-top:.2rem">Leads aÃ±adidos</div></div>'
    + '<div style="background:var(--glass);border-radius:10px;padding:.75rem;text-align:center"><div style="font-size:1.4rem;font-weight:700;color:var(--success)">' + totalContacted + '</div><div style="font-size:.72rem;color:var(--text-muted);margin-top:.2rem">Contactados</div></div>'
    + '<div style="background:var(--glass);border-radius:10px;padding:.75rem;text-align:center"><div style="font-size:1.4rem;font-weight:700;color:#a78bfa">' + totalConverted + '</div><div style="font-size:.72rem;color:var(--text-muted);margin-top:.2rem">Cerrados</div></div>'
    + '<div style="background:var(--glass);border-radius:10px;padding:.75rem;text-align:center"><div style="font-size:1.4rem;font-weight:700;color:#f59e0b">' + avgPerDay + '</div><div style="font-size:.72rem;color:var(--text-muted);margin-top:.2rem">Media/dÃ­a</div></div>'
    + '<div style="background:var(--glass);border-radius:10px;padding:.75rem;text-align:center"><div style="font-size:1.1rem;font-weight:700;color:#f472b6">' + bestDay[0].slice(5) + '</div><div style="font-size:.72rem;color:var(--text-muted);margin-top:.2rem">Mejor dÃ­a (' + bestDay[1].added + ')</div></div>'
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
  const dias = ['Dom','Lun','Mar','MiÃ©','Jue','Vie','SÃ¡b'];
  html += '<div style="margin-top:1rem"><div style="font-size:.72rem;font-weight:600;color:var(--text-muted);margin-bottom:.5rem;text-transform:uppercase;letter-spacing:.06em">Ãšltimos 7 dÃ­as</div><div style="display:grid;gap:.35rem">';
  last7.forEach(([date, val]) => {
    const isToday = date === todayKey;
    const pct = Math.round((val.added / maxVal) * 100);
    const diaSemana = dias[new Date(date + 'T12:00:00').getDay()];
    const label = isToday ? 'ðŸ”µ Hoy' : diaSemana + ' ' + date.slice(5);
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


/**
 * Popula dinÃ¡micamente todos los selectores de segmentos en la aplicaciÃ³n.
 * Centraliza la fuente de verdad en SEGMENT_LABELS (email-templates.js).
 */
function populateSegmentDropdowns() {
  const segments = Object.keys(SEGMENT_LABELS);
  
  // 1. Selector en formulario de nuevo lead
  const leadSel = document.getElementById('lead-segment');
  if (leadSel) {
    const cur = leadSel.value;
    leadSel.innerHTML = '<option value="" disabled selected>Selecciona sector...</option>' + 
      segments.map(seg => `<option value="${seg}">${SEGMENT_LABELS[seg]}</option>`).join('');
    if (cur && segments.includes(cur)) leadSel.value = cur;
  }

  // 2. Filtro en la vista de leads
  const filterSel = document.getElementById('filter-segment');
  if (filterSel) {
    const cur = filterSel.value;
    filterSel.innerHTML = '<option value="">Todos los sectores</option>' + 
      segments.map(seg => `<option value="${seg}">${SEGMENT_LABELS[seg]}</option>`).join('');
    if (cur && segments.includes(cur)) filterSel.value = cur;
  }

  // 3. Selector en plan de acciÃ³n
  const planSel = document.getElementById('plan-segment');
  if (planSel) {
    const cur = planSel.value;
    planSel.innerHTML = segments.map(seg => `<option value="${seg}">${SEGMENT_LABELS[seg]}</option>`).join('');
    if (cur && segments.includes(cur)) planSel.value = cur;
  }
  if (typeof renderMultiSectorPicker === 'function') renderMultiSectorPicker();

  // 4. Selector en creaciÃ³n de campaÃ±a
  const campSel = document.getElementById('camp-segment');
  if (campSel) {
    const cur = campSel.value;
    campSel.innerHTML = '<option value="Todos">Todos los segmentos</option>' + 
      segments.map(seg => `<option value="${seg}">${SEGMENT_LABELS[seg]}</option>`).join('');
    if (cur && (cur === 'Todos' || segments.includes(cur))) campSel.value = cur;
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// GOOGLE MAPS AUTO-INIT
// En el monolito index.html, loadGoogleMapsScript() se llamaba al guardar la
// API Key. En la versiÃ³n modular esa llamada se perdiÃ³ al separar init.js.
// Esta funciÃ³n lo resuelve: se ejecuta al arrancar (si ya hay key guardada)
// y tambiÃ©n puede llamarse desde init.js / saveApiKey() tras guardar una key.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function ensureGoogleMapsLoaded() {
  const apiKey = localStorage.getItem('gordi_api_key');
  if (!apiKey) return;
  if (typeof loadGoogleMapsScript === 'function') {
    loadGoogleMapsScript(apiKey);
  }
}

// Arrancar automÃ¡ticamente cuando todos los mÃ³dulos estÃ©n listos
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(ensureGoogleMapsLoaded, 500);
});

function cleanVisibleText(value) {
  const text = String(value ?? '');
  try {
    return decodeURIComponent(escape(text));
  } catch {
    return text;
  }
}

function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:2rem;right:2rem;background:var(--bg2);border:1px solid var(--glass-border);color:var(--text);padding:.75rem 1.25rem;border-radius:10px;font-size:.83rem;z-index:9999;animation:fadeIn .3s ease;box-shadow:0 8px 24px rgba(0,0,0,.4)`;
  t.innerText = cleanVisibleText(msg);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

async function copyToClipboard(text, message = 'Copiado al portapapeles') {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast(`Copy: ${cleanVisibleText(message)}`);
  } catch (err) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast(`Copy: ${cleanVisibleText(message)}`);
    } catch (copyErr) {
      console.error('Error al copiar:', copyErr);
    }
    document.body.removeChild(textArea);
  }
}

function toggleLightMode() {
  const isLight = document.body.classList.toggle('light-mode');
  localStorage.setItem('gordi_light_mode', isLight ? '1' : '0');
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = isLight ? 'Claro' : 'Oscuro';
}

function applyLightMode(on) {
  if (on) document.body.classList.add('light-mode');
  else document.body.classList.remove('light-mode');
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = on ? 'Claro' : 'Oscuro';
}

function cleanVisibleText(value) {
  let text = String(value ?? '');
  for (let i = 0; i < 3; i++) {
    if (!/[ÃÂðâÅ]/.test(text)) break;
    try {
      const next = decodeURIComponent(escape(text));
      if (next === text) break;
      text = next;
    } catch {
      break;
    }
  }
  return text;
}

function normalizeVisibleTextNodes(root = document.body) {
  if (!root || !root.querySelectorAll) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (!parent) continue;
    if (['SCRIPT','STYLE','TEXTAREA','INPUT','CODE','PRE'].includes(parent.tagName)) continue;
    const cleaned = cleanVisibleText(node.nodeValue);
    if (cleaned !== node.nodeValue) node.nodeValue = cleaned;
  }

  const attrSelector = '[title], [aria-label], [placeholder], [alt], [data-tooltip]';
  root.querySelectorAll(attrSelector).forEach(el => {
    ['title', 'aria-label', 'placeholder', 'alt', 'data-tooltip'].forEach(attr => {
      if (!el.hasAttribute(attr)) return;
      const value = el.getAttribute(attr);
      const cleaned = cleanVisibleText(value);
      if (cleaned !== value) el.setAttribute(attr, cleaned);
    });
  });
}

let _textNormalizeTimer = null;
function scheduleVisibleTextNormalization() {
  clearTimeout(_textNormalizeTimer);
  _textNormalizeTimer = setTimeout(() => {
    normalizeVisibleTextNodes(document.body);
  }, 50);
}

function initVisibleTextNormalization() {
  scheduleVisibleTextNormalization();
  if (typeof MutationObserver === 'function') {
    const observer = new MutationObserver(() => scheduleVisibleTextNormalization());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
}

function sanitizeDashboardMarkup() {
  const ids = [
    'segment-chart',
    'top-leads-list',
    'conversion-metrics',
    'sector-performance',
    'intel-content',
    'smart-alert',
    'funnel-chart',
    'pipeline-value',
    'pipeline-value-panel',
    'streak-panel',
    'heatmap-panel',
    'objectives-panel',
    'today-content',
    'api-log',
    'storage-info',
    'daily-stats-panel',
    'recent-activity'
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el || typeof el.innerHTML !== 'string') return;
    const cleaned = cleanVisibleText(el.innerHTML);
    if (cleaned !== el.innerHTML) el.innerHTML = cleaned;
  });

  scheduleVisibleTextNormalization();
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(ensureGoogleMapsLoaded, 500);
  initVisibleTextNormalization();
});

function cleanVisibleText(value) {
  let text = String(value ?? '');
  const hasMojibake = str => /[\u00c3\u00c2\u00e2\u00f0\u00c5\u0192]/.test(str);
  const cp1252Bytes = {
    '\u20ac': 0x80, '\u201a': 0x82, '\u0192': 0x83, '\u201e': 0x84,
    '\u2026': 0x85, '\u2020': 0x86, '\u2021': 0x87, '\u02c6': 0x88,
    '\u2030': 0x89, '\u0160': 0x8a, '\u2039': 0x8b, '\u0152': 0x8c,
    '\u017d': 0x8e, '\u2018': 0x91, '\u2019': 0x92, '\u201c': 0x93,
    '\u201d': 0x94, '\u2022': 0x95, '\u2013': 0x96, '\u2014': 0x97,
    '\u02dc': 0x98, '\u2122': 0x99, '\u0161': 0x9a, '\u203a': 0x9b,
    '\u0153': 0x9c, '\u017e': 0x9e, '\u0178': 0x9f
  };
  const decoder = typeof TextDecoder !== 'undefined'
    ? new TextDecoder('utf-8', { fatal: false })
    : null;

  const decodeChunk = chunk => {
    let decoded = chunk;
    for (let i = 0; i < 4 && hasMojibake(decoded); i++) {
      const bytes = [];
      let encodable = true;
      for (const ch of decoded) {
        const code = ch.charCodeAt(0);
        if (code <= 0xff) bytes.push(code);
        else if (Object.prototype.hasOwnProperty.call(cp1252Bytes, ch)) bytes.push(cp1252Bytes[ch]);
        else { encodable = false; break; }
      }
      if (!encodable || !decoder) break;
      const next = decoder.decode(new Uint8Array(bytes));
      if (!next || next === decoded) break;
      decoded = next;
    }
    return decoded;
  };

  for (let i = 0; i < 3 && hasMojibake(text); i++) {
    const next = text.replace(/[\u00c3\u00c2\u00e2\u00f0\u00c5][^\s<>"'=()]*/g, decodeChunk);
    if (next === text) break;
    text = next;
  }
  return text;
}
