// ============ LEADS CRUD ============


// ══════════════════════════════════════════════════════════════════════════
// ██  MÓDULO: LEADS
// ──  Gestión de leads — CRUD, localStorage, exportación e importación
// ──  Funciones: saveLead, deleteLead, updateLead, archiveLead, exportLeads,
  //          importLeads, syncToSheets, loadFromSheets, migrateLegacyData
// ══════════════════════════════════════════════════════════════════════════

function saveLead() {
  const g = id => document.getElementById(id).value;
  const name = g('lead-name').trim();
  const company = g('lead-company').trim();
  if (!name || !company) {
    showToast('⚠️ Nombre y empresa son obligatorios');
    return;
  }
  const role = g('lead-role'), size = g('lead-size'), signal = g('lead-signal');
  const tagsRaw = g('lead-tags');
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
  const budget = parseFloat(g('lead-budget')) || 0;
  const nextContact = g('lead-next-contact') || '';
  const lead = {
    id: Date.now(),
    name, company,
    email: g('lead-email'), phone: g('lead-phone'),
    segment: g('lead-segment'), website: g('lead-website'),
    signal, role, size,
    score: calculateScore(role, size, signal),
    status: 'Pendiente',
    date: new Date().toISOString(),
    notes: g('lead-notes'),
    tags, budget, next_contact: nextContact,
    source: 'manual',
    activity: [{ action: 'Creado manualmente', date: new Date().toISOString() }]
  };
  leads.unshift(lead);
  saveLeads();
  renderAll();
  document.getElementById('lead-form').reset();
  clearLeadFormDraft();
  toggleLeadForm();
  updateStreakData();
  showToast('Lead guardado correctamente ✓');
}

let _saveLeadsTimer = null;
function saveLeads() {
  const currentLeads = Array.isArray(leads) ? leads : [];
  if (currentLeads.length > 0 && typeof createCriticalRescueSnapshot === 'function') {
    createCriticalRescueSnapshot('before_leads_save', { throttleMs: 5 * 60 * 1000 });
  }
  if (currentLeads.length === 0) {
    try {
      const stored = JSON.parse(localStorage.getItem('gordi_leads') || '[]');
      if (Array.isArray(stored) && stored.length > 0 && typeof createSafetySnapshot === 'function') {
        createSafetySnapshot('before_empty_leads_save');
        console.warn('Snapshot creado antes de guardar cero leads sobre un almacenamiento con datos.');
      }
      if (Array.isArray(stored) && stored.length > 0 && typeof createCriticalRescueSnapshot === 'function') {
        createCriticalRescueSnapshot('before_empty_leads_save');
      }
    } catch (e) {
      if (typeof createSafetySnapshot === 'function') createSafetySnapshot('before_empty_leads_save_unparsed');
      if (typeof createCriticalRescueSnapshot === 'function') createCriticalRescueSnapshot('before_empty_leads_save_unparsed');
    }
  }
  try {
    localStorage.setItem('gordi_local_last_modified', new Date().toISOString());
    localStorage.setItem('gordi_leads', JSON.stringify(currentLeads));
  } catch (e) {
    console.error('No se pudieron guardar los leads en localStorage:', e);
    if (typeof createCriticalRescueSnapshot === 'function') {
      try { createCriticalRescueSnapshot('localstorage_save_failed', { throttleMs: 0 }); } catch {}
    }
    showToast('No se pudieron guardar los leads. Revisa espacio del navegador y exporta una copia de seguridad.');
    return;
  }
  _goldenProfile = null; // Invalidar cache lookalike

  // 🏛️ ARQUITECTURA: Notificar cambio global
  if (typeof notifyStateChange === 'function') notifyStateChange();

  // Debounce heavy network calls — batch multiple saves into one push
  if (_saveLeadsTimer) clearTimeout(_saveLeadsTimer);
  _saveLeadsTimer = setTimeout(() => {
    _saveLeadsTimer = null;
    if (localStorage.getItem('gordi_gh_auto') === 'true' && localStorage.getItem('gordi_gh_token')) {
      githubPush(false); // silent GitHub push
    }
    if (localStorage.getItem('gordi_jsonbin_auto') === 'true') {
      if (typeof jsonbinPush === 'function') jsonbinPush(false);
    }
  }, 2000); // wait 2s after last save before pushing to cloud
}

function getFilteredLeads() {
  const search    = (document.getElementById('lead-search')?.value || '').toLowerCase();
  const seg       = document.getElementById('filter-segment')?.value || '';
  const status    = document.getElementById('filter-status')?.value || '';
  const source    = document.getElementById('filter-source')?.value || '';
  const sort      = document.getElementById('sort-leads')?.value || 'score';
  const scoreMin  = parseInt(document.getElementById('filter-score-min')?.value || '0') || 0;
  const dateRange = document.getElementById('filter-date-range')?.value || '';
  const nextCon   = document.getElementById('filter-next-contact')?.value || '';

  const today = new Date(); today.setHours(0,0,0,0);
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay() + 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const threeMonthsAgo = new Date(today); threeMonthsAgo.setMonth(today.getMonth() - 3);

  let list = leads.filter(l => {
    if (l.archived) return false;
    if (search) {
      const haystack = [l.name, l.company, l.email, l.phone, l.segment,
        l.signal, l.notes, l.address, l.web, l.description,
        ...(l.tags||[]), ...(l.signals||[])].join(' ').toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (seg && l.segment !== seg) return false;
    if (status && l.status !== status) return false;
    if (source && (l.source || 'manual') !== source) return false;
    if (scoreMin && (l.score || 0) < scoreMin) return false;
    if (dateRange && l.date) {
      const d = new Date(l.date); d.setHours(0,0,0,0);
      if (dateRange === 'today' && d.getTime() !== today.getTime()) return false;
      if (dateRange === 'week' && d < weekStart) return false;
      if (dateRange === 'month' && d < monthStart) return false;
      if (dateRange === '3months' && d < threeMonthsAgo) return false;
    }
    if (nextCon) {
      if (nextCon === 'none' && l.next_contact) return false;
      if (nextCon === 'overdue') {
        if (!l.next_contact) return false;
        if (new Date(l.next_contact) >= today) return false;
      }
      if (nextCon === 'today') {
        if (!l.next_contact) return false;
        const nc = new Date(l.next_contact); nc.setHours(0,0,0,0);
        if (nc.getTime() !== today.getTime()) return false;
      }
      if (nextCon === 'week') {
        if (!l.next_contact) return false;
        const nc = new Date(l.next_contact); nc.setHours(0,0,0,0);
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
        if (nc < today || nc >= weekEnd) return false;
      }
    }
    return true;
  });

  list.sort((a, b) => {
    if (sort === 'score') return (b.score||0) - (a.score||0);
    if (sort === 'date') return new Date(b.date||0) - new Date(a.date||0);
    if (sort === 'company') return (a.company||'').localeCompare(b.company||'');
    if (sort === 'name') return (a.name||'').localeCompare(b.name||'');
    if (sort === 'rating') return (b.rating||0) - (a.rating||0);
    if (sort === 'next_contact') {
      if (!a.next_contact && !b.next_contact) return 0;
      if (!a.next_contact) return 1;
      if (!b.next_contact) return -1;
      return new Date(a.next_contact) - new Date(b.next_contact);
    }
    if (sort === 'days_status') {
      const daysA = a.status_date ? Math.floor((Date.now() - new Date(a.status_date)) / 86400000) : 0;
      const daysB = b.status_date ? Math.floor((Date.now() - new Date(b.status_date)) / 86400000) : 0;
      return daysB - daysA;
    }
    return 0;
  });

  // Count active filters
  const activeFilters = [search, seg, status, source, scoreMin, dateRange, nextCon].filter(Boolean).length;
  const bar = document.getElementById('leads-count-bar');
  if (bar) {
    const total = leads.filter(l=>!l.archived).length;
    bar.innerHTML = `Mostrando <strong>${list.length}</strong> de ${total} leads` +
      (activeFilters ? ` <span style="color:var(--primary)">(${activeFilters} filtro${activeFilters>1?'s':''} activo${activeFilters>1?'s':''})</span>` : '');
  }
  return list;
}

function resetLeadsFilters() {
  ['lead-search','filter-segment','filter-status','filter-source','sort-leads',
   'filter-score-min','filter-date-range','filter-next-contact'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = id === 'sort-leads' ? 'score' : ''; }
  });
  renderLeads();
}

function getActiveLeadFilterCount() {
  return [
    document.getElementById('lead-search')?.value || '',
    document.getElementById('filter-segment')?.value || '',
    document.getElementById('filter-status')?.value || '',
    document.getElementById('filter-source')?.value || '',
    document.getElementById('filter-score-min')?.value || '',
    document.getElementById('filter-date-range')?.value || '',
    document.getElementById('filter-next-contact')?.value || ''
  ].filter(Boolean).length;
}

function showLeadEmptyState(empty, activeCount, totalLeads) {
  if (!empty) return;
  empty.style.display = 'flex';
  if (totalLeads > 0 && activeCount > 0) {
    empty.innerHTML = `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <p>Hay ${totalLeads} leads cargados, pero los filtros actuales no muestran ninguno.</p>
      <button class="btn-primary" onclick="resetLeadsFilters()">Limpiar filtros y ver leads</button>`;
    return;
  }
  empty.innerHTML = `
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
    <p>No hay leads que mostrar</p>
    <button class="btn-primary" onclick="showView('planner')">Buscar empresas</button>`;
}

function renderLeads() {
  saveFilters();
  const tbody = document.getElementById('leads-body');
  const empty = document.getElementById('leads-empty');
  if (!tbody) return;
  const list = getFilteredLeads();
  tbody.innerHTML = '';
  if (!list.length) {
    document.getElementById('no-email-banner')?.remove();
    const paginationEl = document.getElementById('leads-pagination');
    if (paginationEl) paginationEl.style.display = 'none';
    const totalActive = leads.filter(l => !l.archived).length;
    showLeadEmptyState(empty, getActiveLeadFilterCount(), totalActive);
    return;
  }
  empty.style.display = 'none';

  // Check for no-email leads — always remove stale banner first to prevent duplicates
  document.getElementById('no-email-banner')?.remove();
  const noEmail = leads.filter(l => !l.archived && !l.email);
  if (noEmail.length >= 5) {
    const banner = document.createElement('div');
    banner.id = 'no-email-banner';
    banner.style.cssText = 'background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);border-radius:8px;padding:.6rem 1rem;margin-bottom:.75rem;font-size:.78rem;display:flex;align-items:center;gap:.75rem;';
    banner.innerHTML = `⚠️ <span style="color:var(--danger)">${noEmail.length} leads sin email</span> — sin email no se puede generar el email IA. <button class="btn-action" onclick="filterNoEmail()">Ver</button> <button onclick="this.parentNode.remove()" style="margin-left:auto;background:none;border:none;color:var(--text-dim);cursor:pointer">✕</button>`;
    tbody.parentNode.parentNode.insertBefore(banner, tbody.parentNode);
  }

  // Pagination — show LEADS_PAGE_SIZE leads per page for performance
  const totalLeads  = list.length;
  const totalPages  = Math.ceil(totalLeads / LEADS_PAGE_SIZE);
  if (leadsPage >= totalPages) leadsPage = Math.max(0, totalPages - 1);
  const pageStart   = leadsPage * LEADS_PAGE_SIZE;
  const pageEnd     = pageStart + LEADS_PAGE_SIZE;
  const pageList    = list.slice(pageStart, pageEnd);

  // Render pagination controls if needed
  const paginationEl = document.getElementById('leads-pagination');
  if (paginationEl) {
    if (totalPages > 1) {
      paginationEl.style.display = 'flex';
      paginationEl.innerHTML = `
        <button onclick="if(leadsPage>0){leadsPage--;renderLeads()}" ${leadsPage===0?'disabled':''} class="btn-outline btn-sm">← Ant.</button>
        <span style="font-size:.78rem;color:var(--text-dim)">Página ${leadsPage+1} de ${totalPages} · ${totalLeads} leads</span>
        <button onclick="if(leadsPage<${totalPages-1}){leadsPage++;renderLeads()}" ${leadsPage===totalPages-1?'disabled':''} class="btn-outline btn-sm">Sig. →</button>`;
    } else {
      paginationEl.style.display = 'none';
    }
  }

  // Update count bar
  const countBar = document.getElementById('leads-count-bar');
  if (countBar) {
    const active = leads.filter(l=>!l.archived).length;
    countBar.textContent = totalLeads < active
      ? `${totalLeads} de ${active} leads · ${active - totalLeads} filtrados`
      : `${active} leads activos`;
  }

  pageList.forEach(lead => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-lead-id', lead.id);
    const bc = lead.score >= 70 ? 'badge-high' : (lead.score >= 40 ? 'badge-mid' : 'badge-low');
    const sc = (lead.status || 'pendiente').toLowerCase().replace(/\s+/g, '-');
    const scoreColor = lead.score >= 70 ? '#10d97c' : (lead.score >= 40 ? '#f59e0b' : '#ef4444');
    const isSelected = selectedLeadIds.has(String(lead.id));

    // Temperature
    const daysOld = lead.date ? Math.floor((Date.now() - new Date(lead.date)) / 86400000) : 0;
    let tempHtml = '';
    if (lead.score >= 70 && daysOld <= 7) tempHtml = '<span class="temp-hot" title="Lead caliente">🔥</span>';
    else if (lead.score >= 40 && daysOld <= 14) tempHtml = '<span class="temp-warm" title="Lead tibio">🟡</span>';
    else if (daysOld > 21) tempHtml = '<span class="temp-cold" title="Lead frío">🧊</span>';

    // Days in current status
    const statusDate = lead.status_date || lead.date;
    const daysInStatus = statusDate ? Math.floor((Date.now() - new Date(statusDate)) / 86400000) : 0;
    const dayClass = daysInStatus <= 3 ? 'days-ok' : daysInStatus >= 10 ? 'days-warn' : '';
    const daysBadge = `<span class="days-badge ${dayClass}" title="Días en este estado">${daysInStatus}d</span>`;

    // Source badge
    const srcColors = { search: '#0A84FF', import: '#f59e0b', propio: '#a78bfa', manual: '#10d97c' };
    const srcLabels = { search: '🔵', import: '🟡', propio: '🟣', manual: '🟢' };
    const srcEmoji = srcLabels[lead.source || 'manual'] || '🟢';

    // Tags
    const tagsHtml = (lead.tags || []).slice(0, 2).map(t => `<span class="lead-tag">${t}</span>`).join('');

    // Next contact alert
    let nextAlert = '';
    if (lead.next_contact) {
      const nc = new Date(lead.next_contact);
      const today = new Date(); today.setHours(0,0,0,0);
      const diff = Math.floor((nc - today) / 86400000);
      if (diff === 0) nextAlert = '<span style="color:var(--warning);font-size:.65rem;display:block">📅 Hoy</span>';
      else if (diff < 0) nextAlert = '<span style="color:var(--danger);font-size:.65rem;display:block">⚠️ Vencido</span>';
      else if (diff <= 2) nextAlert = `<span style="color:var(--primary);font-size:.65rem;display:block">📅 ${diff}d</span>`;
    }

    // Email validation
    const emailWarning = lead.email && !isValidEmail(lead.email) ? '⚠️ ' : '';

    tr.className = isSelected ? 'selected-row' : '';
    if (lead.status === 'No interesa') tr.style.opacity = '0.45';
    tr.innerHTML = `
      <td style="width:36px"><input type="checkbox" class="lead-cb" data-id="${lead.id}" ${isSelected ? 'checked' : ''} onchange="toggleLeadSelect(this)"></td>
      <td>
        <div class="lead-name">${tempHtml} ${lead.name}</div>
        <div class="lead-company">${lead.company}</div>
        ${tagsHtml}
        ${nextAlert}
      </td>
      <td>
        <span style="font-size:.75rem;background:var(--glass);padding:2px 8px;border-radius:5px;color:var(--text-muted)">${srcEmoji} ${lead.segment}</span>
        ${lead.budget ? `<div style="font-size:.68rem;color:var(--success);margin-top:2px">💰 ${lead.budget.toLocaleString('es-ES')}€</div>` : ''}
      </td>
      <td>
        <div class="score-wrap">
          <span class="score-badge ${bc}">${lead.score}</span>
          <div class="score-bar-mini"><div class="score-bar-fill" style="width:${lead.score}%;background:${scoreColor}"></div></div>
        </div>
      </td>
      <td><span class="status-${sc}"><span class="status-dot"></span>${lead.status}</span>${daysBadge}</td>
      <td style="font-size:.78rem;color:var(--text-muted)">
        <div style="display:flex;align-items:center;gap:.3rem;overflow:visible;min-width:0">
          <span style="color:var(--text-dim);flex-shrink:0">✉️</span>
          <input type="email"
            value="${lead.email||''}"
            placeholder="Añadir email..."
            data-lead-id="${lead.id}"
            class="inline-email-input"
            onclick="event.stopPropagation()"
            onblur="saveInlineEmail(this)"
            onkeydown="if(event.key==='Enter'){this.blur();}"
          >
          <button onclick="event.stopPropagation(); const v=this.previousElementSibling?.value||''; if(v) copyToClipboard(v, 'Email: '+v); else showToast('⚠️ Sin email')" title="Copiar email al portapapeles" style="background:none;border:none;cursor:pointer;color:var(--text-dim);padding:1px 3px;border-radius:4px;flex-shrink:0;line-height:1;transition:color .15s" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-dim)'">⧉</button>
        </div>
        ${lead.phone ? `<div style="display:flex;align-items:center;gap:.35rem">📞 ${lead.phone}${lead.whatsapp ? ` <button onclick="openWhatsAppModal('${lead.id}',event)" title="Enviar WhatsApp" style="background:none;border:none;cursor:pointer;font-size:.85rem;padding:0;line-height:1;color:#25D366">💬</button>` : ''}</div>` : ''}
      </td>
      <td>
        <div class="td-actions">
          <button class="btn-action" onclick="openLeadDetail('${lead.id}')">Ver</button>
          <button class="btn-action secondary" onclick="openLeadAttackPlan('${lead.id}')" title="Plan de ataque">Plan</button>
          <button class="btn-action secondary" onclick="openCompetitiveSpyForLead('${lead.id}')" title="Espionaje competitivo">Spy</button>
          <button class="btn-action secondary" onclick="openLeadDossier('${lead.id}')" title="Dossier PDF">PDF</button>
          ${lead.email ? `<button class="btn-action" onclick="generateEmail('${lead.id}')">✉️</button>` : ''}
          <button class="btn-action ai-btn" onclick="openAiEmailModal('${lead.id}')" title="Email IA">✨</button>
          ${lead.whatsapp || lead.phone ? `<button class="btn-action" onclick="openWhatsAppModal('${lead.id}',event)" title="WhatsApp IA" style="color:#25D366">💬</button>` : ''}
          <button class="btn-action" onclick="duplicateLead('${lead.id}')" title="Duplicar lead">⎘</button>
          <button class="btn-action danger" onclick="deleteLead('${lead.id}')">✕</button>
        </div>
      </td>`;
    tr.oncontextmenu = (e) => { e.preventDefault(); openCtxMenu(e, lead.id, 'table'); };
    tbody.appendChild(tr);
  });
}



// Activa/desactiva el botón de copiar email en el modal de detalle
// según si el input tiene contenido. Se llama desde oninput del campo email.
function updateDetailEmailBtn(input) {
  const btn = document.getElementById('detail-email-copy-btn');
  if (!btn) return;
  const hasEmail = input.value && input.value.trim().length > 0;
  btn.style.opacity = hasEmail ? '1' : '0.35';
  btn.style.pointerEvents = hasEmail ? 'auto' : 'none';
}

function deleteLead(id) {
  const lead = leads.find(l => l.id == id);
  if (!lead) return;
  // Soft delete with undo
  leads = leads.filter(l => l.id != id);
  undoBuffer = lead;
  saveLeads();
  renderAll();
  showUndoToast(`Lead "${lead.company}" eliminado`);
}

function showUndoToast(msg) {
  const toast = document.getElementById('undo-toast');
  document.getElementById('undo-msg').textContent = msg;
  toast.classList.add('show');
  clearTimeout(undoTimer);
  undoTimer = setTimeout(() => {
    toast.classList.remove('show');
    undoBuffer = null;
  }, 6000);
}

function undoDelete() {
  if (!undoBuffer) return;
  leads.unshift(undoBuffer);
  undoBuffer = null;
  saveLeads();
  renderAll();
  document.getElementById('undo-toast').classList.remove('show');
  showToast('Lead recuperado ✓');
}

function duplicateLead(id) {
  closeLead();
  const lead = leads.find(l => l.id == id);
  if (!lead) return;
  const copy = { ...lead, id: Date.now(), status: 'Pendiente', date: new Date().toISOString(),
    activity: [{ action: 'Duplicado desde ' + lead.company, date: new Date().toISOString() }],
    status_date: new Date().toISOString() };
  leads.unshift(copy);
  saveLeads();
  renderLeads();
  renderKanban();
  showToast(`Lead duplicado: ${lead.company}`);
  openLeadDetail(copy.id);
}

function archiveLead(id) {
  const lead = leads.find(l => l.id == id);
  if (!lead) return;
  lead.archived = true;
  saveLeads();
  renderAll();
  showToast(`${lead.company} archivado`);
}

function bulkArchive() {
  const count = selectedLeadIds.size;
  selectedLeadIds.forEach(id => {
    const l = leads.find(x => x.id == id);
    if (l) l.archived = true;
  });
  saveLeads();
  clearBulkSelection();
  renderAll();
  showToast(`${count} leads archivados`);
}

function filterNoEmail() {
  document.getElementById('filter-status').value = '';
  document.getElementById('filter-segment').value = '';
  document.getElementById('lead-search').value = '';
  // Filter visually — show only no-email
  const list = leads.filter(l => !l.archived && !l.email);
  const tbody = document.getElementById('leads-body');
  document.getElementById('leads-empty').style.display = list.length ? 'none' : 'flex';
  tbody.innerHTML = list.map(lead => {
    const bc = lead.score >= 70 ? 'badge-high' : (lead.score >= 40 ? 'badge-mid' : 'badge-low');
    return `<tr><td><input type="checkbox" class="lead-cb" data-id="${lead.id}" onchange="toggleLeadSelect(this)"></td>
      <td><div class="lead-name">${lead.name}</div><div class="lead-company">${lead.company}</div></td>
      <td>${lead.segment}</td><td><span class="score-badge ${bc}">${lead.score}</span></td>
      <td>${lead.status}</td>
      <td><span style="color:var(--danger)">Sin email</span></td>
      <td><button class="btn-action" onclick="editLeadEmail('${lead.id}')">+Email</button></td></tr>`;
  }).join('');
}

function addActivityLog(leadId, action) {
  const lead = leads.find(l => l.id == leadId);
  if (!lead) return;
  if (!lead.activity) lead.activity = [];
  lead.activity.unshift({ action, date: new Date().toISOString() });
  if (lead.activity.length > 20) lead.activity = lead.activity.slice(0, 20);
}

function editLeadEmail(id) {
  const lead = leads.find(l => l.id == id);
  if (!lead) return;
  const email = prompt(`Introduce el email de ${lead.company}:`);
  if (email && isValidEmail(email.trim())) {
    lead.email = email.trim();
    saveLeads();
    renderLeads();
    renderKanban();
    showToast('Email actualizado ✓');
  }
}

function saveInlineEmail(input) {
  const id = input.dataset.leadId;
  const lead = leads.find(l => String(l.id) === String(id));
  if (!lead) return;
  const val = input.value.trim();
  if (val === (lead.email || '')) return; // no change
  if (val && !isValidEmail(val)) {
    showToast('⚠️ Email no válido');
    input.value = lead.email || '';
    return;
  }
  lead.email = val;
  saveLeads();
  // Refresh send button in the same row without full re-render
  const row = input.closest('tr');
  if (row) {
    const actCell = row.querySelector('.td-actions');
    if (actCell) {
      const oldSendBtn = actCell.querySelector('.btn-action[onclick*="generateEmail"]');
      if (val && !oldSendBtn) {
        const btn = document.createElement('button');
        btn.className = 'btn-action';
        btn.onclick = () => generateEmail(lead.id);
        btn.textContent = '✉️';
        actCell.insertBefore(btn, actCell.firstChild);
      } else if (!val && oldSendBtn) {
        oldSendBtn.remove();
      }
    }
  }
  // Also update the copy button in the same row
  if (row) {
    const emailWrap = input.parentElement;
    const oldCopyBtn = emailWrap?.querySelector('button[title="Copiar email al portapapeles"]');
    if (val && !oldCopyBtn) {
      const copyBtn = document.createElement('button');
      copyBtn.title = 'Copiar email al portapapeles';
      copyBtn.textContent = '⧉';
      copyBtn.style.cssText = 'background:none;border:none;cursor:pointer;color:var(--text-dim);padding:1px 3px;border-radius:4px;flex-shrink:0;line-height:1;transition:color .15s';
      copyBtn.onmouseover = () => copyBtn.style.color = 'var(--primary)';
      copyBtn.onmouseout  = () => copyBtn.style.color = 'var(--text-dim)';
      copyBtn.onclick = (e) => { e.stopPropagation(); copyToClipboard(val.trim(), 'Email: ' + val.trim()); };
      emailWrap?.appendChild(copyBtn);
    } else if (!val && oldCopyBtn) {
      oldCopyBtn.remove();
    } else if (val && oldCopyBtn) {
      // Update existing copy button with new email
      oldCopyBtn.onclick = (e) => { e.stopPropagation(); copyToClipboard(val.trim(), 'Email: ' + val.trim()); };
    }
  }
  showToast(val ? 'Email guardado ✓' : 'Email eliminado');
}

// ============ LEAD DETAIL MODAL ============
function openLeadDetail(id) {
  const lead = leads.find(l => l.id == id);
  if (!lead) return;
  const bc = lead.score >= 70 ? 'badge-high' : (lead.score >= 40 ? 'badge-mid' : 'badge-low');

  // Emails previously sent to this lead
  const prevEmails = emailHistory.filter(e => e.leadId == id || e.email === lead.email);
  const prevEmailsHtml = prevEmails.length
    ? prevEmails.slice(0,3).map(e => `<div style="font-size:.72rem;padding:.3rem .5rem;background:var(--glass);border-radius:5px;margin-bottom:3px"><strong>${e.subject||'(sin asunto)'}</strong> · ${new Date(e.date).toLocaleDateString('es-ES')}</div>`).join('')
    : '<div style="font-size:.72rem;color:var(--text-dim)">Ningún email enviado todavía</div>';

  // Activity log
  const actLog = (lead.activity || []).slice(0,6).map(a =>
    `<div class="activity-log-item"><div class="activity-log-dot"></div><div style="flex:1">${a.action}</div><div class="activity-log-time">${new Date(a.date).toLocaleDateString('es-ES',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</div></div>`
  ).join('') || '<div style="font-size:.72rem;color:var(--text-dim)">Sin actividad registrada</div>';

  // Psych profile placeholder
  const psychHtml = `<div id="psych-profile-${lead.id}" class="psych-profile">
    ${lead.psychProfile
      ? '<div style=\"font-size:.72rem;color:var(--text-dim)\">Ver perfil IA</div>'
      : '<div style=\"font-size:.72rem;color:var(--text-dim)\">Sin perfil generado</div>'}
    <button onclick="generateLeadProfile(${lead.id})" style="margin-top:.4rem;background:rgba(99,102,241,.12);border:1px solid rgba(99,102,241,.2);border-radius:6px;padding:.2rem .55rem;font-size:.7rem;color:var(--primary);cursor:pointer">🧬 ${lead.psychProfile ? 'Ver perfil IA' : 'Generar perfil IA'}</button>
  </div>`;

  // Follow-up suggestion
  const daysInStatus = lead.status_date ? Math.floor((Date.now()-new Date(lead.status_date))/86400000) : 0;
  let followupHtml = '';
  if (lead.status === 'Contactado' && daysInStatus >= 5) {
    followupHtml = `<div class="followup-box"><span>💡</span><span>Llevan <strong>${daysInStatus} días</strong> en "Contactado". Es buen momento para un email de seguimiento breve. <button class="btn-action" style="margin-left:.5rem" onclick="generateFollowupEmail('${lead.id}')">Generar seguimiento IA</button></span></div>`;
  }

  const tagsVal = (lead.tags || []).join(', ');

  document.getElementById('modal-lead-title').innerText = `${lead.company} — ${lead.name}`;
  document.getElementById('modal-lead-content').innerHTML = `
    <div style="padding:1.5rem;display:grid;gap:1rem">
      <div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap">
        <span class="score-badge ${bc}">${lead.score} pts</span>
        <span style="font-size:.8rem;background:var(--glass);padding:3px 10px;border-radius:5px">${lead.segment}</span>
        <span style="font-size:.8rem;color:var(--text-muted)">${new Date(lead.date).toLocaleDateString('es-ES')}</span>
        ${lead.source ? `<span style="font-size:.72rem;color:var(--text-dim)">Origen: ${lead.source}</span>` : ''}
      </div>
      ${followupHtml}
      <div class="grid-form" style="grid-template-columns:1fr 1fr;gap:.75rem">
        <div><label>Email</label><div style="display:flex;align-items:center;gap:.4rem"><input type="email" value="${lead.email||''}" id="detail-email" placeholder="email@empresa.com" style="flex:1" oninput="updateDetailEmailBtn(this)"><button id="detail-email-copy-btn" onclick="copyToClipboard(document.getElementById('detail-email').value, 'Email copiado')" title="Copiar email al portapapeles" style="background:var(--glass);border:1px solid var(--glass-border);color:var(--text-muted);border-radius:7px;padding:5px 9px;cursor:pointer;font-size:.78rem;white-space:nowrap;transition:all .15s;${lead.email && lead.email.trim() ? '' : 'opacity:.35;pointer-events:none'}" onmouseover="if(document.getElementById('detail-email').value){this.style.borderColor='var(--primary)';this.style.color='var(--primary)'}" onmouseout="this.style.borderColor='var(--glass-border)';this.style.color='var(--text-muted)'">⧉ Copiar</button></div></div>
        <div><label>Teléfono</label><input type="text" value="${lead.phone||''}" id="detail-phone" placeholder="+34 600..."></div>
        <div style="grid-column: 1 / -1"><label>Estado del Pipeline</label>
          <div id="status-pipeline-container">
            ${renderStatusPipeline(lead.status, lead.id)}
          </div>
          <input type="hidden" id="detail-status" value="${lead.status}">
        </div>
        <div><label>Web</label><input type="text" value="${lead.website||''}" id="detail-web" placeholder="https://..."></div>
        <div><label>Próximo contacto</label><div class="date-input-wrap"><input type="text" value="${lead.next_contact||''}" id="detail-next-contact" placeholder="Selecciona o escribe una fecha"><button type="button" class="cal-icon-btn" onclick="var fp=document.getElementById('detail-next-contact')._flatpickr;if(fp)fp.open();" title="Abrir calendario"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></button></div></div>
        <div><label>Presupuesto estimado (€)</label><input type="number" id="detail-budget" value="${lead.budget||''}" min="0" placeholder="Ej: 25000"></div>
      </div>
      <div><label>Etiquetas (separadas por comas)</label><input type="text" id="detail-tags" value="${tagsVal}" placeholder="referido, feria, urgente..."></div>
      <div><label>Señal Detectada</label><textarea id="detail-signal" rows="2">${lead.signal||''}</textarea></div>
      <div><label>Notas Internas (📞 Registrar llamada)</label>
        <div style="display:flex;gap:.5rem;margin-bottom:.4rem">
          <button class="btn-action" onclick="logCall('${lead.id}')">📞 Registrar llamada</button>
          <button class="btn-action" onclick="markNotInterested('${lead.id}')">🚫 No interesa</button>
          <button class="btn-action" onclick="archiveLead('${lead.id}');closeLead()">📦 Archivar</button>
        </div>
        <textarea id="detail-notes" rows="3">${lead.notes||''}</textarea>
      </div>
      <div style="display:flex;gap:.75rem;flex-wrap:wrap">
        <button class="btn-primary" onclick="saveLeadDetail('${lead.id}')">Guardar Cambios</button>
        <button class="btn-outline" onclick="openLeadAttackPlan('${lead.id}')">Plan de ataque</button>
        <button class="btn-outline" onclick="openCompetitiveSpyForLead('${lead.id}')">Espionaje competitivo</button>
        <button class="btn-outline" onclick="openLeadDossier('${lead.id}')">Dossier PDF</button>
        ${lead.email ? `<button class="btn-outline" onclick="openAiEmailModal('${lead.id}');closeLead()">✨ Email IA</button>` : ''}
        <button class="btn-outline" onclick="duplicateLead('${lead.id}');closeLead()">⎘ Duplicar</button>
        <button class="btn-outline" onclick="closeLead()">Cancelar</button>
      </div>
      <!-- Emails enviados -->
      <div style="border-top:1px solid var(--glass-border);padding-top:.75rem">
        <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:.4rem;font-weight:600">EMAILS ENVIADOS A ESTA EMPRESA</div>
        ${prevEmailsHtml}
      </div>
      <!-- Timeline de estados -->
      <div style="border-top:1px solid var(--glass-border);padding-top:.75rem">
        <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:.6rem;font-weight:600">RECORRIDO EN EL PIPELINE</div>
        ${buildStatusTimeline(lead)}
      </div>
      <!-- Perfil IA -->
      <div style="border-top:1px solid var(--glass-border);padding-top:.75rem">
        <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:.4rem;font-weight:600">PERFIL IA & ESTRATEGIA</div>
        ${psychHtml}
      </div>
      <!-- Actividad -->
      <div style="border-top:1px solid var(--glass-border);padding-top:.75rem">
        <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:.4rem;font-weight:600">HISTORIAL DE ACTIVIDAD</div>
        <div class="activity-log">${actLog}</div>
      </div>
    </div>`;
  document.getElementById('lead-modal').style.display = 'flex';
  // Inicializar datepicker en el modal de detalle
  setTimeout(initDetailDatePicker, 50);
  // Auto-render psych profile if it exists
  if (lead.psychProfile) setTimeout(() => renderLeadPsychProfile(lead), 100);
}

function saveLeadDetail(id) {
  const lead = leads.find(l => l.id == id);
  if (!lead) return;
  const oldStatus = lead.status;
  lead.email = document.getElementById('detail-email').value.trim();
  lead.phone = document.getElementById('detail-phone').value.trim();
  lead.status = document.getElementById('detail-status').value;
  lead.website = document.getElementById('detail-web').value.trim();
  lead.signal = document.getElementById('detail-signal').value.trim();
  lead.notes = document.getElementById('detail-notes').value.trim();
  lead.next_contact = document.getElementById('detail-next-contact').value;
  lead.budget = parseFloat(document.getElementById('detail-budget').value) || 0;
  const tagsRaw = document.getElementById('detail-tags').value;
  lead.tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
  if (lead.status !== oldStatus) {
    lead.status_date = new Date().toISOString();
    addActivityLog(id, `Estado cambiado: ${oldStatus} → ${lead.status}`);
    applySequenceRule(lead, lead.status); // MEJORA 2
  }
  lead.score = recalculateLeadScore(lead);
  saveLeads();
  renderAll();
  closeLead();
  showToast('Lead actualizado ✓');
}

function logCall(id) {
  const note = prompt('Nota de la llamada (qué se habló):');
  if (!note) return;
  const lead = leads.find(l => l.id == id);
  if (!lead) return;
  addActivityLog(id, `📞 Llamada: ${note}`);
  const notesEl = document.getElementById('detail-notes');
  if (notesEl) notesEl.value = (notesEl.value ? notesEl.value + '\n' : '') + `[${new Date().toLocaleDateString('es-ES')}] 📞 ${note}`;
  saveLeads();
  showToast('Llamada registrada ✓');
}

function markNotInterested(id) {
  const lead = leads.find(l => l.id == id);
  if (!lead) return;
  confirmStatusChange(lead, 'No interesa', () => {
    lead.status = 'No interesa';
    lead.status_date = new Date().toISOString();
    addActivityLog(id, 'Marcado como No interesa');
    saveLeads(); closeLead(); renderAll();
    showToast('Lead marcado como No interesa');
  });
}

function closeLead() { document.getElementById('lead-modal').style.display = 'none'; }

// ============ EMAIL ============
// ── Limpia el nombre para el saludo ──────────────────────────────────────────
function buildSaludo(name, company) {
  // Palabras que NO son nombres reales de personas
  const INVALID_NAME_WORDS = [
    'responsable','según','encargado','encargada','contacto','gerencia',
    'administración','administracion','recepción','recepcion','dirección','direccion',
    'alojamiento','establecimiento','empresa','negocio','local','centro','hotel',
    'restaurante','tienda','oficina','nave','colegio','gimnasio','club',
    'propietario','propietaria','titular','unknown','desconocido','sin nombre',
    'nombre','apellido','persona','contactar','info','information'
  ];

  const nameLower = (name || '').toLowerCase().trim();

  // Si el nombre está vacío, es genérico, muy corto, o contiene palabras inválidas
  const isInvalid = !nameLower
    || nameLower.length < 3
    || nameLower === 'responsable'
    || INVALID_NAME_WORDS.some(w => nameLower.includes(w))
    || /^(sr|sra|don|doña)\.?\s*$/.test(nameLower)
    || /^\d+$/.test(nameLower);

  if (isInvalid) {
    return `Estimado equipo de ${company}`;
  }

  // Capitalizar bien el nombre (por si viene en mayúsculas o minúsculas)
  const cleanName = name.trim().split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return `Estimado/a ${cleanName}`;
}



// ══════════════════════════════════════════════════════════════════════════
// ██  MÓDULO: EMAIL
// ──  Templates de email, secuencias y generación con IA (Gemini)
// ──  Funciones: generateEmail, buildEmailThread, applySequenceRule, callGeminiAPI,
  //          buildLeadContext, buildGoldenProfile, saveTemplate, enrichSingleCard
// ══════════════════════════════════════════════════════════════════════════

const PIPELINE_STAGES = ['Pendiente', 'Contactado', 'Respuesta', 'Visita', 'Presupuesto', 'Cerrado'];
const STAGE_MAPPING = {
  'Pendiente': 'Pendiente',
  'Contactado': 'Contactado',
  'Respuesta': 'Respuesta del cliente',
  'Visita': 'Visita',
  'Presupuesto': 'Entrega de presupuesto',
  'Cerrado': 'Cerrado'
};
const REVERSE_STAGE_MAPPING = {
  'Pendiente': 'Pendiente',
  'Contactado': 'Contactado',
  'Respuesta del cliente': 'Respuesta',
  'Visita': 'Visita',
  'Entrega de presupuesto': 'Presupuesto',
  'Cerrado': 'Cerrado',
  'No interesa': 'Pendiente'
};

function renderStatusPipeline(currentStatus, leadId) {
  const currentMapped = REVERSE_STAGE_MAPPING[currentStatus] || 'Pendiente';
  const currentIndex = Math.max(0, PIPELINE_STAGES.indexOf(currentMapped));
  const safeLeadId = JSON.stringify(String(leadId));
  return `<div class="status-pipeline" style="display:flex;align-items:center;gap:0.3rem;margin-top:0.5rem;background:rgba(255,255,255,0.03);padding:0.4rem;border-radius:12px;border:1px solid var(--glass-border)">
    ${PIPELINE_STAGES.map((s, i) => {
      const isActive = i <= currentIndex;
      const isCurrent = i === currentIndex;
      const color = isActive ? 'var(--primary)' : 'var(--text-dim)';
      const opacity = isActive ? '1' : '0.4';
      return `
        <div onclick="updateLeadStatusViaPipeline(${safeLeadId}, '${s}')" style="flex:1;text-align:center;padding:0.6rem 0.3rem;cursor:pointer;position:relative;transition:all 0.3s">
          <div style="width:100%;height:4px;background:${isActive ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.1)'};border-radius:2px;margin-bottom:0.5rem"></div>
          <div style="font-size:0.65rem;font-weight:${isCurrent ? '700' : '500'};color:${color};opacity:${opacity}">${s}</div>
          ${isCurrent ? '<div style="position:absolute;top:-4px;left:50%;transform:translateX(-50%);width:8px;height:8px;background:var(--primary);border-radius:50%;box-shadow:0 0 10px var(--primary)"></div>' : ''}
        </div>
        ${i < PIPELINE_STAGES.length - 1 ? '<div style="color:rgba(255,255,255,0.1);font-size:0.8rem">›</div>' : ''}
      `;
    }).join('')}
  </div>`;
}

function updateLeadStatusViaPipeline(leadId, stageName) {
  const fullStatus = STAGE_MAPPING[stageName];
  if (!fullStatus) return;
  const input = document.getElementById('detail-status');
  if (input) input.value = fullStatus;
  const container = document.getElementById('status-pipeline-container');
  if (container) container.innerHTML = renderStatusPipeline(fullStatus, leadId);
  const lead = leads.find(l => String(l.id) === String(leadId));
  if (lead && lead.status !== fullStatus) showToast('Estado actualizado ✓ (No olvides Guardar)');
}

function updateLeadStatusViaPipelineSaved(leadId, stageName) {
  const fullStatus = STAGE_MAPPING[stageName];
  if (!fullStatus) return;
  const input = document.getElementById('detail-status');
  if (input) input.value = fullStatus;
  const container = document.getElementById('status-pipeline-container');
  if (container) container.innerHTML = renderStatusPipeline(fullStatus, leadId);
  const lead = leads.find(l => String(l.id) === String(leadId));
  if (!lead || lead.status === fullStatus) return;
  const oldStatus = lead.status || 'Pendiente';
  lead.status = fullStatus;
  lead.status_date = new Date().toISOString();
  addActivityLog(lead.id, `Pipeline: ${oldStatus} -> ${fullStatus}`);
  saveLeads();
  renderLeads();
  renderKanban();
  if (typeof renderTracking === 'function') renderTracking();
  if (typeof updateStats === 'function') updateStats();
  showToast('Estado actualizado y guardado');
}
updateLeadStatusViaPipeline = updateLeadStatusViaPipelineSaved;

function generateEmail(id) {
  const lead = leads.find(l => l.id == id);
  if (!lead) return;
  if (!lead.email) { alert('⚠️ Este lead no tiene email. Añádelo primero.'); return; }

  const already = emailHistory.find(h => h.email.toLowerCase() === lead.email.toLowerCase());
  if (already) {
    const fecha = new Date(already.date).toLocaleDateString('es-ES');
    if (!confirm(`⚠️ Ya contactaste a ${lead.company} el ${fecha}.\n¿Enviar otro email de todas formas?`)) return;
  }

  const template = emailTemplates[lead.segment] || emailTemplates['Default'];
  const firma = buildFirmaText();
  const saludo = buildSaludo(lead.name, lead.company);

  let subject = template.subjectA
    .replace(/{{Company}}/g, lead.company)
    .replace(/{{Name}}/g, lead.name);

  let body = template.body
    .replace(/{{SALUDO}}/g, saludo)
    .replace(/{{Name}}/g, lead.name)
    .replace(/{{Company}}/g, lead.company)
    .replace(/{{Sector}}/g, lead.segment)
    .replace(/{{Signal}}/g, lead.signal || '')
    .replace(/{{FIRMA}}/g, firma);

  window.location.href = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  emailHistory.unshift({ id: Date.now(), leadId: lead.id, company: lead.company, email: lead.email, segment: lead.segment, date: new Date().toISOString(), status: 'Enviado', subject, notes: '' });
  localStorage.setItem('gordi_email_history', JSON.stringify(emailHistory));
  // MEJORA 1: Registrar time-to-first-contact
  if (!lead.first_contact_date) {
    lead.first_contact_date = new Date().toISOString();
    lead.ttfc_hours = Math.round((Date.now() - new Date(lead.date)) / 3600000);
  }
  const oldStatus = lead.status;
  const _applyVisita = () => {
    lead.status = 'Contactado';
    lead.status_date = new Date().toISOString();
    addActivityLog(lead.id, `✉️ Email plantilla enviado: "${subject}"`);
    saveLeads(); renderAll(); renderTracking(); renderRecentActivity(); updateStreakData();
  };
  confirmStatusChange(lead, 'Contactado', _applyVisita);
}



// restoreBackup está definida en modules/ui.js con soporte dual-format
// (backup completo + datos portátiles del index.html antiguo)\n\n// ─── PIPELINE DE ESTADOS VISUAL ─────────────────────────────────────────────\n\nconst PIPELINE_STAGES = ['Pendiente', 'Contactado', 'Respuesta', 'Visita', 'Presupuesto', 'Cerrado'];\nconst STAGE_MAPPING = {\n  'Pendiente': 'Pendiente',\n  'Contactado': 'Contactado',\n  'Respuesta': 'Respuesta del cliente',\n  'Visita': 'Visita',\n  'Presupuesto': 'Entrega de presupuesto',\n  'Cerrado': 'Cerrado'\n};\nconst REVERSE_STAGE_MAPPING = {\n  'Pendiente': 'Pendiente',\n  'Contactado': 'Contactado',\n  'Respuesta del cliente': 'Respuesta',\n  'Visita': 'Visita',\n  'Entrega de presupuesto': 'Presupuesto',\n  'Cerrado': 'Cerrado',\n  'No interesa': 'Pendiente' // Fallback\n};\n\nfunction renderStatusPipeline(currentStatus, leadId) {\n  const currentMapped = REVERSE_STAGE_MAPPING[currentStatus] || 'Pendiente';\n  const currentIndex = PIPELINE_STAGES.indexOf(currentMapped);\n\n  return `<div class=\"status-pipeline\" style=\"display:flex;align-items:center;gap:0.3rem;margin-top:0.5rem;background:rgba(255,255,255,0.03);padding:0.4rem;border-radius:12px;border:1px solid var(--glass-border)\">\n    ${PIPELINE_STAGES.map((s, i) => {\n      const isActive = i <= currentIndex;\n      const isCurrent = i === currentIndex;\n      const color = isActive ? 'var(--primary)' : 'var(--text-dim)';\n      const opacity = isActive ? '1' : '0.4';\n      \n      return `\n        <div onclick=\"updateLeadStatusViaPipeline(${leadId}, '${s}')\" \n             style=\"flex:1;text-align:center;padding:0.6rem 0.3rem;cursor:pointer;position:relative;transition:all 0.3s\">\n          <div style=\"width:100%;height:4px;background:${isActive ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.1)'};border-radius:2px;margin-bottom:0.5rem\"></div>\n          <div style=\"font-size:0.65rem;font-weight:${isCurrent ? '700' : '500'};color:${color};opacity:${opacity}\">${s}</div>\n          ${isCurrent ? '<div style=\"position:absolute;top:-4px;left:50%;transform:translateX(-50%);width:8px;height:8px;background:var(--primary);border-radius:50%;box-shadow:0 0 10px var(--primary)\"></div>' : ''}\n        </div>\n        ${i < PIPELINE_STAGES.length - 1 ? '<div style=\"color:rgba(255,255,255,0.1);font-size:0.8rem\">›</div>' : ''}\n      `;\n    }).join('')}\n  </div>`;\n}\n\nfunction updateLeadStatusViaPipeline(leadId, stageName) {\n  const fullStatus = STAGE_MAPPING[stageName];\n  const input = document.getElementById('detail-status');\n  if (input) input.value = fullStatus;\n  \n  const container = document.getElementById('status-pipeline-container');\n  if (container) container.innerHTML = renderStatusPipeline(fullStatus, leadId);\n\n  // Guardado rápido visual\n  const lead = leads.find(l => l.id == leadId);\n  if (lead && lead.status !== fullStatus) {\n    showToast(\"Estado actualizado ✓ (No olvides Guardar)\");\n  }\n}\n
