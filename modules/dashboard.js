// ============ STATS ============
function updateStats() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  set('stat-total', leads.filter(l => !l.archived).length);
  set('stat-high', leads.filter(l => !l.archived && l.score >= 70).length);
  set('stat-pending', leads.filter(l => !l.archived && l.status === 'Pendiente').length);
  set('stat-sent', emailHistory.length);
  set('stat-sent2', emailHistory.length);
  set('stat-contacted', [...new Set(emailHistory.map(h => h.email.toLowerCase()))].length);
  set('stat-waiting', emailHistory.filter(h => h.status === 'Visita').length);
}

// ðŸ›ï¸ ARQUITECTURA: Escuchar cambios globales
if (typeof VoltiumEvents !== 'undefined') {
    VoltiumEvents.on('state:changed', () => {
        updateStats();
        renderDashboardCharts();
        renderRecentActivity();
        renderTopLeads();
    });
}

// ============ DASHBOARD CHARTS + INTELIGENCIA ============

function renderSegmentChart() {
  const container = document.getElementById('segment-chart');
  if (!container) return;
  const counts = {};
  leads.forEach(l => counts[l.segment] = (counts[l.segment] || 0) + 1);
  const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]);
  const max = sorted[0]?.[1] || 1;
  container.innerHTML = sorted.length
    ? sorted.map(([seg, cnt]) => `
        <div class="seg-row">
          <div class="seg-label">${seg}</div>
          <div class="seg-bar-wrap"><div class="seg-bar" style="width:${Math.round(cnt/max*100)}%;background:${SEGMENT_COLORS[seg]||'#7a8ba0'}"></div></div>
          <div class="seg-count" style="color:${SEGMENT_COLORS[seg]||'#7a8ba0'}">${cnt}</div>
        </div>`).join('')
    : '<p style="color:var(--text-muted);font-size:.83rem;margin-top:1rem">Sin datos aÃºn</p>';
}

// â”€â”€ NIVEL 1: Top leads por scoring dinÃ¡mico con seÃ±ales â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderTopLeads() {
  const container = document.getElementById('top-leads-list');
  if (!container) return;

  // Recalcular scores con datos reales antes de ordenar
  // NOTA: no llamar saveLeads() aquÃ­ â€” este es un render, no una mutaciÃ³n persistida.
  // El recÃ¡lculo masivo se hace en saveLeadDetail/saveLead donde ya hay un saveLeads().
  leads.forEach(l => { l.score = recalculateLeadScore(l); });

  const top = [...leads]
    .filter(l => l.status === 'Pendiente' || l.status === 'Contactado')
    .sort((a,b) => b.score - a.score)
    .slice(0, 6);

  if (!top.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:.83rem;margin-top:.5rem">No hay leads pendientes</p>';
    return;
  }

  container.innerHTML = top.map(l => {
    const bc = l.score >= 70 ? 'badge-high' : (l.score >= 40 ? 'badge-mid' : 'badge-low');
    // SeÃ±ales visuales de por quÃ© es prioritario
    const signals = [];
    if (l.rating && l.rating < 4.2) signals.push(`<span class="intel-tag warn">â­ ${l.rating}</span>`);
    if (l.email) signals.push('<span class="intel-tag ok">âœ‰ï¸</span>');
    if (l.phone) signals.push('<span class="intel-tag ok">ðŸ“ž</span>');
    if (l.decision_maker && l.decision_maker !== 'Responsable') signals.push('<span class="intel-tag ok">ðŸ‘¤</span>');
    const daysSince = l.date ? Math.floor((Date.now()-new Date(l.date))/(1000*86400)) : 0;
    if (daysSince > 7) signals.push(`<span class="intel-tag warn">${daysSince}d sin contacto</span>`);

    return `<div class="top-lead-item" onclick="openLeadDetail('${l.id}')">
      <div class="top-lead-avatar" style="background:${SEGMENT_COLORS[l.segment]||'#5E5CE6'}22;color:${SEGMENT_COLORS[l.segment]||'#5E5CE6'}">${(l.company||'?')[0].toUpperCase()}</div>
      <div style="flex:1;min-width:0">
        <div class="top-lead-name">${l.company}</div>
        <div class="top-lead-co">${l.segment}${signals.length ? ' Â· '+signals.join('') : ''}</div>
      </div>
      <span class="score-badge ${bc}">${l.score}</span>
    </div>`;
  }).join('');
}

// â”€â”€ NIVEL 6: MÃ©tricas de conversiÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderConversionMetrics() {
  const el = document.getElementById('conversion-metrics');
  if (!el) return;

  const total = leads.length;
  const contacted = leads.filter(l => ['Contactado','Respuesta del cliente','Visita','Entrega de presupuesto','Cerrado'].includes(l.status)).length;
  const responded = leads.filter(l => ['Respuesta del cliente','Visita','Entrega de presupuesto','Cerrado'].includes(l.status)).length;
  const closed = leads.filter(l => l.status === 'Cerrado').length;
  const convRate = contacted ? Math.min(Math.round(responded/contacted*100), 100) : 0;
  const closeRate = responded ? Math.round(closed/responded*100) : 0;
  const avgScore = total ? Math.round(leads.reduce((s,l)=>s+l.score,0)/total) : 0;

  // Tiempo medio de respuesta
  const sentLeads = leads.filter(l => l.status !== 'Pendiente' && l.date);
  const avgDays = sentLeads.length
    ? Math.round(sentLeads.reduce((s,l) => s + Math.floor((Date.now()-new Date(l.date))/(1000*86400)),0) / sentLeads.length)
    : 0;

  // MEJORA 1: Time-to-first-contact
  const ttfcLeads = leads.filter(l => l.ttfc_hours != null);
  const avgTtfc = ttfcLeads.length
    ? Math.round(ttfcLeads.reduce((s,l) => s + l.ttfc_hours, 0) / ttfcLeads.length)
    : null;
  const ttfcVal = avgTtfc != null ? (avgTtfc < 24 ? avgTtfc+'h' : Math.round(avgTtfc/24)+'d') : 'â€”';
  const ttfcColor = avgTtfc == null ? 'var(--text-dim)' : avgTtfc <= 24 ? 'var(--success)' : avgTtfc <= 72 ? 'var(--warning)' : 'var(--danger)';

  const metrics = [
    { label:'Tasa de respuesta', value: convRate+'%', sub: `${responded} de ${contacted} contactados`, color: convRate>20?'var(--success)':convRate>10?'var(--warning)':'var(--danger)', icon:'ðŸ“¬' },
    { label:'Tasa de cierre', value: closeRate+'%', sub: `${closed} proyectos cerrados`, color: closeRate>30?'var(--success)':closeRate>10?'var(--warning)':'var(--danger)', icon:'ðŸ†' },
    { label:'Score medio', value: avgScore, sub: 'de 100 puntos posibles', color: avgScore>60?'var(--success)':avgScore>40?'var(--warning)':'var(--danger)', icon:'âš¡' },
    { label:'DÃ­as medio en pipeline', value: avgDays+'d', sub: 'desde creaciÃ³n del lead', color:'var(--primary)', icon:'â±ï¸' },
    { label:'Tiempo hasta 1er contacto', value: ttfcVal, sub: avgTtfc != null ? `${ttfcLeads.length} leads con dato Â· <24h = Ã³ptimo` : 'Sin emails enviados aÃºn', color: ttfcColor, icon:'âš¡' },
  ];

  el.innerHTML = metrics.map(m => `
    <div style="display:flex;align-items:center;gap:.75rem;padding:.6rem 0;border-bottom:1px solid var(--glass-border)">
      <span style="font-size:1.1rem">${m.icon}</span>
      <div style="flex:1">
        <div style="font-size:.75rem;color:var(--text-muted)">${m.label}</div>
        <div style="font-size:.7rem;color:var(--text-dim)">${m.sub}</div>
      </div>
      <div style="font-size:1.3rem;font-weight:700;color:${m.color}">${m.value}</div>
    </div>`).join('');

  if (!total) el.innerHTML = '<p style="color:var(--text-muted);font-size:.83rem">Sin datos todavÃ­a. AÃ±ade leads para ver mÃ©tricas.</p>';
}

// â”€â”€ NIVEL 6: Rendimiento por sector â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderSectorPerformance() {
  const el = document.getElementById('sector-performance');
  if (!el || !leads.length) {
    if (el) el.innerHTML = '<p style="color:var(--text-muted);font-size:.83rem">Sin datos todavÃ­a.</p>';
    return;
  }

  const sectors = {};
  leads.forEach(l => {
    if (!sectors[l.segment]) sectors[l.segment] = { total:0, contacted:0, responded:0, totalScore:0 };
    sectors[l.segment].total++;
    sectors[l.segment].totalScore += l.score;
    if (['Contactado','Respuesta del cliente','Visita','Entrega de presupuesto','Cerrado'].includes(l.status)) sectors[l.segment].contacted++;
    if (['Respuesta del cliente','Visita','Entrega de presupuesto','Cerrado'].includes(l.status)) sectors[l.segment].responded++;
  });

  const sorted = Object.entries(sectors)
    .map(([seg, d]) => ({ seg, ...d, avgScore: Math.round(d.totalScore/d.total), convRate: d.contacted ? Math.round(d.responded/d.contacted*100) : 0 }))
    .sort((a,b) => b.convRate - a.convRate);

  el.innerHTML = sorted.map(s => `
    <div style="display:flex;align-items:center;gap:.6rem;padding:.4rem 0;border-bottom:1px solid var(--glass-border)">
      <div style="width:8px;height:8px;border-radius:50%;background:${SEGMENT_COLORS[s.seg]||'#7a8ba0'};flex-shrink:0"></div>
      <div style="flex:1;font-size:.78rem;color:var(--text-muted);min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.seg}</div>
      <div style="font-size:.72rem;color:var(--text-dim)">${s.total} leads</div>
      <div style="font-size:.82rem;font-weight:600;color:${s.convRate>20?'var(--success)':s.convRate>5?'var(--warning)':'var(--text-muted)'}">${s.convRate}%</div>
    </div>`).join('');
}

// â”€â”€ NIVEL 4: Inteligencia competitiva local â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderIntelPanel() {
  const el = document.getElementById('intel-content');
  if (!el) return;

  const withRating = leads.filter(l => l.rating);
  if (!withRating.length) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:.83rem">Busca empresas con el Buscador Inteligente para ver comparativas de zona.</p>';
    return;
  }

  // Agrupar por segmento y calcular medias
  const segStats = {};
  withRating.forEach(l => {
    if (!segStats[l.segment]) segStats[l.segment] = { ratings:[], count:0 };
    segStats[l.segment].ratings.push(l.rating);
    segStats[l.segment].count++;
  });

  // Oportunidades: empresas con rating por debajo de la media de su sector
  const opportunities = [];
  Object.entries(segStats).forEach(([seg, data]) => {
    const avg = data.ratings.reduce((s,r)=>s+r,0) / data.ratings.length;
    const avgR = Math.round(avg*10)/10;
    const belowAvg = leads.filter(l => l.segment === seg && l.rating && l.rating < avg && l.status === 'Pendiente');
    if (belowAvg.length > 0) {
      opportunities.push({ seg, avg: avgR, belowAvg, count: data.count });
    }
  });

  if (!opportunities.length) {
    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem">
        ${Object.entries(segStats).map(([seg,d]) => {
          const avg = Math.round(d.ratings.reduce((s,r)=>s+r,0)/d.ratings.length*10)/10;
          return `<div style="padding:.75rem;background:var(--glass);border-radius:8px;border:1px solid var(--glass-border)">
            <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:.25rem">${seg}</div>
            <div style="font-size:1.1rem;font-weight:700;color:var(--warning)">â­ ${avg}</div>
            <div style="font-size:.7rem;color:var(--text-dim)">${d.count} empresas analizadas</div>
          </div>`;
        }).join('')}
      </div>`;
    return;
  }

  el.innerHTML = `
    <div style="margin-bottom:1rem;font-size:.82rem;color:var(--text-muted)">
      Empresas con rating <strong style="color:var(--warning)">por debajo de la media</strong> de su sector â€” <strong style="color:var(--primary)">oportunidad de reforma alta</strong>
    </div>
    <div style="display:grid;gap:.5rem">
      ${opportunities.flatMap(o => o.belowAvg.slice(0,3).map(l => `
        <div class="intel-row" onclick="openLeadDetail('${l.id}')">
          <div style="display:flex;align-items:center;gap:.6rem;flex:1">
            <span style="font-size:.9rem">â­</span>
            <div>
              <div style="font-size:.82rem;font-weight:600">${l.company}</div>
              <div style="font-size:.7rem;color:var(--text-muted)">${l.segment} Â· Rating ${l.rating} vs media ${o.avg} del sector</div>
            </div>
          </div>
          <span class="intel-tag warn">-${Math.round((o.avg-l.rating)*10)/10} pts bajo media</span>
        </div>`)).join('')}
    </div>`;
}

// â”€â”€ NIVEL 1: Alerta inteligente de prioridades â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderSmartAlert() {
  const el = document.getElementById('smart-alert');
  if (!el) return;

  const urgent = leads.filter(l => l.score >= 75 && l.status === 'Pendiente');
  const overdue = leads.filter(l => {
    if (!l.date || l.status !== 'Contactado') return false;
    return Math.floor((Date.now()-new Date(l.date))/(1000*86400)) > 5;
  });

  let html = '';
  if (urgent.length > 0) {
    html += `<div class="smart-alert-box alert-urgent">
      <span style="font-size:1.1rem">ðŸ”¥</span>
      <div>
        <strong>${urgent.length} lead${urgent.length>1?'s':''} de alta prioridad</strong> esperando contacto â€” score â‰¥75
        <div style="font-size:.75rem;margin-top:.2rem;opacity:.8">${urgent.slice(0,3).map(l=>l.company).join(', ')}${urgent.length>3?' y '+(urgent.length-3)+' mÃ¡s':''}</div>
      </div>
      <button class="btn-action" onclick="showView('leads')" style="margin-left:auto;white-space:nowrap">Ver â†’</button>
    </div>`;
  }
  if (overdue.length > 0) {
    html += `<div class="smart-alert-box alert-warn" style="margin-top:.5rem">
      <span style="font-size:1.1rem">â°</span>
      <div>
        <strong>${overdue.length} lead${overdue.length>1?'s':''}</strong> contactados hace mÃ¡s de 5 dÃ­as sin respuesta registrada
        <div style="font-size:.75rem;margin-top:.2rem;opacity:.8">${overdue.slice(0,3).map(l=>l.company).join(', ')}</div>
      </div>
      <button class="btn-action" onclick="showView('kanban')" style="margin-left:auto;white-space:nowrap">Pipeline â†’</button>
    </div>`;
  }

  // MEJORA 1: Alerta leads calientes sin contactar >48h
  const hotUncontacted = leads.filter(l =>
    l.score >= 70 &&
    l.status === 'Pendiente' &&
    !l.first_contact_date &&
    (Date.now() - new Date(l.date)) > 48 * 3600000
  );
  if (hotUncontacted.length > 0) {
    html += `<div class="smart-alert-box alert-urgent" style="margin-top:.5rem;border-color:rgba(239,68,68,.4)">
      <span style="font-size:1.1rem">âš¡</span>
      <div>
        <strong>${hotUncontacted.length} lead${hotUncontacted.length>1?'s':''} caliente${hotUncontacted.length>1?'s':''} sin contactar</strong> â€” llevan mÃ¡s de 48h esperando
        <div style="font-size:.75rem;margin-top:.2rem;opacity:.8">${hotUncontacted.slice(0,3).map(l=>`${l.company} (${l.score}pts)`).join(', ')}${hotUncontacted.length>3?' y '+(hotUncontacted.length-3)+' mÃ¡s':''}</div>
      </div>
      <button class="btn-action" onclick="showView('leads');document.getElementById('sort-leads').value='score';renderLeads()" style="margin-left:auto;white-space:nowrap">Contactar â†’</button>
    </div>`;
  }

  el.style.display = html ? 'block' : 'none';
  el.innerHTML = html;
}

function renderRecentActivity() {
  const container = document.getElementById('recent-activity');
  if (!container) return;
  const recent = emailHistory.slice(0, 8);
  container.innerHTML = recent.length
    ? recent.map(e => `
        <div class="activity-item">
          <div class="activity-dot"></div>
          <div>
            <div class="activity-text">Email enviado a <strong>${e.company}</strong> â€” ${e.email}</div>
            <div class="activity-time">${new Date(e.date).toLocaleDateString('es-ES', {day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
          </div>
        </div>`).join('')
    : '<p style="color:var(--text-muted);font-size:.83rem">Sin actividad reciente</p>';
}

// ============ KANBAN ============
function renderKanban() {
  const cols = ['Pendiente','Contactado','Respuesta del cliente','Visita','Entrega de presupuesto','Cerrado'];
  cols.forEach(status => {
    const container = document.getElementById(`cards-${status}`);
    const counter = document.getElementById(`cnt-${status}`);
    if (!container) return;
    const kSearch   = (document.getElementById('kanban-search')?.value || '').toLowerCase();
    const kSeg      = document.getElementById('kanban-filter-seg')?.value || '';
    const kScore    = parseInt(document.getElementById('kanban-filter-score')?.value || '0') || 0;
    const kSort     = document.getElementById('kanban-sort')?.value || 'score';
    const kOverdue  = document.getElementById('kanban-filter-overdue')?.checked || false;
    const kToday    = new Date(); kToday.setHours(0,0,0,0);

    let items = leads.filter(l => {
      if (l.status !== status || l.archived) return false;
      if (kSearch) {
        const hay = [l.name, l.company, l.email, l.segment, l.notes].join(' ').toLowerCase();
        if (!hay.includes(kSearch)) return false;
      }
      if (kSeg && l.segment !== kSeg) return false;
      if (kScore && (l.score||0) < kScore) return false;
      if (kOverdue) {
        if (!l.next_contact) return false;
        if (new Date(l.next_contact) >= kToday) return false;
      }
      return true;
    });

    items.sort((a,b) => {
      if (kSort === 'score') return (b.score||0) - (a.score||0);
      if (kSort === 'company') return (a.company||'').localeCompare(b.company||'');
      if (kSort === 'days') {
        const dA = a.status_date ? Math.floor((Date.now()-new Date(a.status_date))/86400000) : 0;
        const dB = b.status_date ? Math.floor((Date.now()-new Date(b.status_date))/86400000) : 0;
        return dB - dA;
      }
      if (kSort === 'next_contact') {
        if (!a.next_contact && !b.next_contact) return 0;
        if (!a.next_contact) return 1; if (!b.next_contact) return -1;
        return new Date(a.next_contact) - new Date(b.next_contact);
      }
      if (kSort === 'budget') return (b.budget||0) - (a.budget||0);
      return 0;
    });
    if (counter) counter.innerText = items.length;
    // MEJORA 3: Pipeline value per column
    const colValue = items.reduce((s, l) => s + (l.budget || 0), 0);
    const valEl = document.getElementById(`val-${status}`);
    if (valEl) {
      if (colValue > 0) {
        valEl.textContent = colValue >= 1000000 ? (colValue/1000000).toFixed(1)+'Mâ‚¬'
          : colValue >= 1000 ? Math.round(colValue/1000)+'kâ‚¬' : colValue+'â‚¬';
        valEl.style.display = 'inline';
      } else { valEl.style.display = 'none'; }
    }

    const today = new Date(); today.setHours(0,0,0,0);

    container.innerHTML = items.length
      ? items.map(l => {
          const daysInStatus = l.status_date ? Math.floor((Date.now() - new Date(l.status_date)) / 86400000) : 0;
          const daysBadge = daysInStatus >= 7 ? `<span style="font-size:.6rem;background:rgba(239,68,68,.2);color:#ef4444;padding:1px 5px;border-radius:4px;margin-left:3px">${daysInStatus}d</span>` :
                            daysInStatus >= 3 ? `<span style="font-size:.6rem;background:rgba(245,158,11,.15);color:#f59e0b;padding:1px 5px;border-radius:4px;margin-left:3px">${daysInStatus}d</span>` : '';

          let nextBadge = '';
          if (l.next_contact) {
            const nc = new Date(l.next_contact); nc.setHours(0,0,0,0);
            const diff = Math.floor((nc - today) / 86400000);
            if (diff === 0) nextBadge = '<div style="font-size:.62rem;color:var(--warning);margin-top:2px">ðŸ“… Seguimiento hoy</div>';
            else if (diff < 0) nextBadge = '<div style="font-size:.62rem;color:var(--danger);margin-top:2px">âš ï¸ Seguimiento vencido</div>';
            else if (diff <= 2) nextBadge = `<div style="font-size:.62rem;color:var(--primary);margin-top:2px">ðŸ“… ${diff}d para seguimiento</div>`;
          }

          const tagsHtml = (l.tags||[]).slice(0,1).map(t => `<span style="font-size:.6rem;background:rgba(94,92,230,.15);color:#a78bfc;padding:1px 5px;border-radius:8px">${t}</span>`).join('');
          const budgetHtml = l.budget ? `<div style="font-size:.62rem;color:var(--success);margin-top:2px">ðŸ’° ${l.budget.toLocaleString('es-ES')}â‚¬</div>` : '';

          return `<div class="kanban-card" draggable="true" ondragstart="dragStart(event,'${l.id}')" onclick="openLeadDetail('${l.id}')" oncontextmenu="event.preventDefault();openCtxMenu(event,'${l.id}','kanban')">
            <button class="kanban-quick-note-btn ${l.notes?'has-note':''}" onclick="openQuickNote(event,'${l.id}')" title="${l.notes?'Ver/editar nota':'AÃ±adir nota rÃ¡pida'}">ðŸ“</button>
            <div class="kanban-card-name">${l.name}</div>
            <div class="kanban-card-co">${l.company}</div>
            ${nextBadge}
            ${l.notes ? `<div style="font-size:.62rem;color:var(--text-muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%">ðŸ“ ${l.notes.slice(0,45)}${l.notes.length>45?'â€¦':''}</div>` : ''}
            ${l.email ? `<div style="display:flex;align-items:center;gap:3px;margin-top:3px"><span style="font-size:.62rem;color:var(--text-dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px">âœ‰ï¸ ${l.email}</span><button onclick="event.stopPropagation(); copyToClipboard('${l.email}', 'Email: ${l.email}')" title="Copiar email" style="background:none;border:none;cursor:pointer;color:var(--text-dim);padding:0 2px;font-size:.72rem;line-height:1;flex-shrink:0;transition:color .15s" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-dim)'">â§‰</button></div>` : ''}
            ${budgetHtml}
            <div class="kanban-card-foot">
              <span class="kanban-seg">${l.segment}</span>
              <div style="display:flex;align-items:center;gap:2px">
                ${tagsHtml}
                <span class="score-badge ${l.score>=70?'badge-high':l.score>=40?'badge-mid':'badge-low'}" style="font-size:.68rem">${l.score}</span>
                ${daysBadge}
              </div>
            </div>
          </div>`;
        }).join('')
      : `<div style="text-align:center;padding:1.5rem;color:var(--text-dim);font-size:.78rem">Arrastra aquÃ­</div>`;
  });

  // Update kanban filter count
  const kCountEl = document.getElementById('kanban-filter-count');
  if (kCountEl) {
    const total = leads.filter(l => !l.archived).length;
    const kSearch = (document.getElementById('kanban-search')?.value || '');
    const kSeg = document.getElementById('kanban-filter-seg')?.value || '';
    const kScore = document.getElementById('kanban-filter-score')?.value || '';
    const kOverdue = document.getElementById('kanban-filter-overdue')?.checked || false;
    const activeK = [kSearch, kSeg, kScore, kOverdue ? '1' : ''].filter(Boolean).length;
    // Contar items reales mostrados sumando las columnas ya renderizadas
    const shownCount = document.querySelectorAll('#kanban-board .kanban-card').length;
    kCountEl.textContent = activeK
      ? `${shownCount} de ${total} Â· ${activeK} filtro${activeK>1?'s':''} activo${activeK>1?'s':''}`
      : '';
  }
}

function resetKanbanFilters() {
  ['kanban-search','kanban-filter-seg','kanban-filter-score','kanban-sort'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = id === 'kanban-sort' ? 'score' : '';
  });
  const ov = document.getElementById('kanban-filter-overdue');
  if (ov) ov.checked = false;
  renderKanban();
}

let draggedId = null;
function dragStart(e, id) { draggedId = id; e.target.classList.add('dragging'); }
function dropLead(e, newStatus) {
  e.preventDefault();
  if (!draggedId) return;
  const lead = leads.find(l => l.id == draggedId);
  if (lead) {
    const oldStatus = lead.status;
    if (oldStatus === newStatus) {
      document.querySelectorAll('.kanban-card.dragging').forEach(c => c.classList.remove('dragging'));
      draggedId = null;
      return;
    }
    confirmStatusChange(lead, newStatus, () => {
      lead.status = newStatus;
      lead.status_date = new Date().toISOString();
      addActivityLog(lead.id, `Pipeline: ${oldStatus} â†’ ${newStatus}`);
      applySequenceRule(lead, newStatus);
      saveLeads();
      renderKanban();
      renderLeads();
      updateStats();
    });
  }
  document.querySelectorAll('.kanban-card.dragging').forEach(c => c.classList.remove('dragging'));
  draggedId = null;
}

// ============ TRACKING ============
function renderTracking() {
  const tbody = document.getElementById('tracking-body');
  const empty = document.getElementById('tracking-empty');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!emailHistory.length) { if (empty) empty.style.display = 'flex'; return; }
  if (empty) empty.style.display = 'none';

  const tSearch  = (document.getElementById('tracking-search')?.value || '').toLowerCase();
  const tSeg     = document.getElementById('tracking-filter-seg')?.value || '';
  const tChannel = document.getElementById('tracking-filter-channel')?.value || '';
  const tDate    = document.getElementById('tracking-filter-date')?.value || '';
  const tSort    = document.getElementById('tracking-sort')?.value || 'date_desc';

  const today = new Date(); today.setHours(0,0,0,0);
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay() + 1);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const threeMonthsAgo = new Date(today); threeMonthsAgo.setMonth(today.getMonth() - 3);

  let list = emailHistory.filter(e => {
    if (tSearch) {
      const hay = [e.company, e.email, e.subject, e.segment, e.notes, e.channel].join(' ').toLowerCase();
      if (!hay.includes(tSearch)) return false;
    }
    if (tSeg && e.segment !== tSeg) return false;
    if (tChannel && (e.channel || 'email') !== tChannel) return false;
    if (tDate && e.date) {
      const d = new Date(e.date); d.setHours(0,0,0,0);
      if (tDate === 'today' && d.getTime() !== today.getTime()) return false;
      if (tDate === 'week' && d < weekStart) return false;
      if (tDate === 'month' && d < monthStart) return false;
      if (tDate === '3months' && d < threeMonthsAgo) return false;
    }
    return true;
  });

  list.sort((a,b) => {
    if (tSort === 'date_desc') return new Date(b.date||0) - new Date(a.date||0);
    if (tSort === 'date_asc')  return new Date(a.date||0) - new Date(b.date||0);
    if (tSort === 'company')   return (a.company||'').localeCompare(b.company||'');
    if (tSort === 'segment')   return (a.segment||'').localeCompare(b.segment||'');
    return 0;
  });

  // Update count
  const cntEl = document.getElementById('tracking-filter-count');
  if (cntEl) {
    const active = [tSearch,tSeg,tChannel,tDate].filter(Boolean).length;
    cntEl.textContent = `${list.length} de ${emailHistory.length} registros` +
      (active ? ` Â· ${active} filtro${active>1?'s':''}` : '');
  }

  if (!list.length) { if (empty) empty.style.display = 'flex'; return; }

  list.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-size:.78rem">${new Date(e.date).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'})}</td>
      <td><div class="lead-name">${e.company}</div></td>
      <td style="color:var(--primary);font-size:.82rem"><span style="display:inline-flex;align-items:center;gap:.35rem">${e.email}<button onclick="event.stopPropagation(); copyToClipboard('${e.email}', 'Email: ${e.email}')" title="Copiar email" style="background:none;border:none;cursor:pointer;color:var(--text-dim);padding:1px 4px;font-size:.75rem;line-height:1;transition:color .15s" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-dim)'">â§‰</button></span></td>
      <td><span style="font-size:.75rem;background:var(--glass);padding:2px 8px;border-radius:5px;color:var(--text-muted)">${e.segment}</span></td>
      <td><span style="color:var(--success);font-size:.78rem">âœ… ${e.status}</span></td>
      <td style="font-size:.78rem;color:var(--text-muted)">${e.notes||'â€”'}</td>`;
    tbody.appendChild(tr);
  });
}

function resetTrackingFilters() {
  ['tracking-search','tracking-filter-seg','tracking-filter-channel','tracking-filter-date','tracking-sort'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = id === 'tracking-sort' ? 'date_desc' : '';
  });
  renderTracking();
}

function exportTracking() {
  if (!emailHistory.length) { alert('No hay historial.'); return; }
  let csv = 'Fecha,Empresa,Email,Sector,Estado\n';
  emailHistory.forEach(e => { csv += `"${new Date(e.date).toLocaleDateString('es-ES')}","${e.company}","${e.email}","${e.segment}","${e.status}"\n`; });
  downloadCSV(csv, 'historial_gordi.csv');
}

// ============ TEMPLATES ============
function renderTemplateList() {
  const ul = document.getElementById('template-list');
  if (!ul) return;
  const keys = Object.keys(emailTemplates).filter(k => k !== 'Default');
  keys.push('Default');
  ul.innerHTML = keys.map(k => `<li onclick="loadTemplate('${k}')">${k}</li>`).join('');
}

function loadTemplate(key) {
  const t = emailTemplates[key];
  if (!t) return;
  document.getElementById('tpl-subject-a').value = t.subjectA || t.subject || '';
  document.getElementById('tpl-subject-b').value = t.subjectB || '';
  document.getElementById('tpl-body').value = t.body || '';
  document.getElementById('tpl-current-key').value = key;
  document.getElementById('template-edit-title').innerText = `Editando: ${key}`;
  document.querySelectorAll('.template-list li').forEach(li => li.classList.toggle('active', li.textContent === key));
  document.getElementById('template-preview-box').style.display = 'none';
}

function saveTemplate() {
  const key = document.getElementById('tpl-current-key').value;
  if (!key) { alert('Selecciona un segmento primero.'); return; }
  emailTemplates[key] = {
    subjectA: document.getElementById('tpl-subject-a').value,
    subjectB: document.getElementById('tpl-subject-b').value,
    body: document.getElementById('tpl-body').value
  };
  const saved = {};
  Object.entries(emailTemplates).forEach(([k,v]) => { if (JSON.stringify(v) !== JSON.stringify(defaultTemplates[k])) saved[k] = v; });
  localStorage.setItem('gordi_templates', JSON.stringify(emailTemplates));
  if (localStorage.getItem('gordi_jsonbin_auto') === 'true') {
    if (typeof jsonbinPush === 'function') jsonbinPush(false);
  }
  showToast('Plantilla guardada âœ“');
}

function previewTemplate() {
  const body = document.getElementById('tpl-body').value;
  const subject = document.getElementById('tpl-subject-a').value;
  const firma = buildFirmaText();
  const saludo = buildSaludo('Carlos GarcÃ­a', 'Empresa Ejemplo S.L.');
  const preview = body
    .replace(/{{SALUDO}}/g, saludo)
    .replace(/{{Name}}/g, 'Carlos GarcÃ­a')
    .replace(/{{Company}}/g, 'Empresa Ejemplo S.L.')
    .replace(/{{Sector}}/g, 'Hoteles')
    .replace(/{{Ciudad}}/g, 'Madrid')
    .replace(/{{Rating}}/g, '3.8')
    .replace(/{{Signal}}/g, 'estÃ¡n buscando actualizar sus instalaciones')
    .replace(/{{SeÃ±al}}/g, 'estÃ¡n buscando actualizar sus instalaciones')
    .replace(/{{FIRMA}}/g, firma);
  const subjectPreview = subject
    .replace(/{{Company}}/g, 'Empresa Ejemplo S.L.')
    .replace(/{{Name}}/g, 'Carlos GarcÃ­a')
    .replace(/{{Sector}}/g, 'Hoteles');
  const box = document.getElementById('template-preview-box');
  document.getElementById('template-preview-content').innerHTML =
    `<div style="font-size:.72rem;color:var(--text-muted);margin-bottom:.5rem">ðŸ“Œ <strong>Asunto:</strong> ${subjectPreview}</div>` +
    `<pre style="white-space:pre-wrap;font-family:inherit;font-size:.82rem">${preview}</pre>` +
    `<div style="font-size:.68rem;color:var(--text-dim);margin-top:.75rem">Variables disponibles: {{SALUDO}} {{Company}} {{Name}} {{Sector}} {{Signal}} {{Ciudad}} {{Rating}} {{FIRMA}}</div>`;
  box.style.display = 'block';
}

// ============ IMPORTACIÃ“N CSV ============
function switchImportTab(tab, btn) {
  document.querySelectorAll('.import-tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.import-tab').forEach(el => el.classList.remove('active'));
  document.getElementById(`import-${tab}-tab`).style.display = 'block';
  btn.classList.add('active');
}

// ImportaciÃ³n CSV/Excel â€” gestionada Ã­ntegramente por modules/smart-import.js
// (handleFileSelect, handleDrop, handleDragOver, processFile, parseAndPreviewImport,
//  processBulkImport, importSelectedLeads, clearImportArea, toggleAllImport,
//  updateImportEmail, autoDetectSegment)
// NO redeclarar aquÃ­ para evitar conflictos de source ('import' vs 'propio')
// y de atributos data-index vs data-idx en los checkboxes de previsualizaciÃ³n.

// ============ CAMPAÃ‘AS ============
function openCampaignModal() { document.getElementById('campaign-modal').style.display = 'flex'; }
function closeCampaignModal() { document.getElementById('campaign-modal').style.display = 'none'; }

function saveCampaign() {
  const name = document.getElementById('camp-name').value.trim();
  if (!name) { alert('Ponle nombre a la campaÃ±a.'); return; }
  const seg = document.getElementById('camp-segment').value;
  const seq = document.getElementById('camp-sequence').value;
  const desc = document.getElementById('camp-desc').value.trim();
  const filtered = seg === 'Todos' ? leads : leads.filter(l => l.segment === seg);
  campaigns.push({ id: Date.now(), name, segment: seg, sequence: seq, desc, leadCount: filtered.length, sent: 0, date: new Date().toISOString(), active: true });
  localStorage.setItem('gordi_campaigns', JSON.stringify(campaigns));
  if (localStorage.getItem('gordi_jsonbin_auto') === 'true') {
    if (typeof jsonbinPush === 'function') jsonbinPush(false);
  }
  closeCampaignModal();
  renderCampaigns();
  showToast('CampaÃ±a creada âœ“');
}

function getCampaignLeadList(c) {
  if (Array.isArray(c.leadIds) && c.leadIds.length) {
    const ids = new Set(c.leadIds.map(String));
    return leads.filter(l => ids.has(String(l.id)));
  }
  return c.segment === 'Todos' ? leads : leads.filter(l => l.segment === c.segment);
}

function getCampaignSentCount(c) {
  const campLeads = getCampaignLeadList(c);
  if (Array.isArray(c.leadIds) && c.leadIds.length) {
    const ids = new Set(c.leadIds.map(String));
    const emails = new Set(campLeads.map(l => l.email).filter(Boolean));
    return emailHistory.filter(e => ids.has(String(e.leadId)) || emails.has(e.email)).length;
  }
  return emailHistory.filter(e => c.segment === 'Todos' || e.segment === c.segment).length;
}

function renderCampaigns() {
  const container = document.getElementById('campaigns-list');
  const empty = document.getElementById('campaigns-empty');
  if (!container) return;
  if (!campaigns.length) { empty.style.display = 'flex'; container.style.display = 'none'; return; }

  const cSearch = (document.getElementById('campaigns-search')?.value || '').toLowerCase();
  const cSeg    = document.getElementById('campaigns-filter-seg')?.value || '';
  const cSort   = document.getElementById('campaigns-sort')?.value || 'date_desc';
  const cStatus = document.getElementById('campaigns-filter-status')?.value || '';

  let list = campaigns.filter(c => {
    if (cSearch && !c.name.toLowerCase().includes(cSearch) && !(c.desc||'').toLowerCase().includes(cSearch)) return false;
    if (cSeg && c.segment !== cSeg) return false;
    if (cStatus) {
      const sent = getCampaignSentCount(c);
      const total = getCampaignLeadList(c).length;
      const pct = total ? Math.min(Math.round(sent/total*100), 100) : 0;
      if (cStatus === 'active' && sent === 0) return false;
      if (cStatus === 'empty' && sent > 0) return false;
      if (cStatus === 'complete' && pct < 100) return false;
    }
    return true;
  });

  list.sort((a,b) => {
    if (cSort === 'date_desc') return (b.id||0) - (a.id||0);
    if (cSort === 'name') return a.name.localeCompare(b.name);
    if (cSort === 'progress_desc') {
      const sentA = getCampaignSentCount(a);
      const sentB = getCampaignSentCount(b);
      const totA  = getCampaignLeadList(a).length;
      const totB  = getCampaignLeadList(b).length;
      return (totB ? sentB/totB : 0) - (totA ? sentA/totA : 0);
    }
    if (cSort === 'leads_desc') {
      const tA = getCampaignLeadList(a).length;
      const tB = getCampaignLeadList(b).length;
      return tB - tA;
    }
    return 0;
  });

  const cntEl = document.getElementById('campaigns-filter-count');
  if (cntEl) {
    const active = [cSearch,cSeg,cStatus].filter(Boolean).length;
    cntEl.textContent = `${list.length} de ${campaigns.length}` + (active ? ` Â· ${active} filtro${active>1?'s':''}` : '');
  }

  if (!list.length) { empty.style.display = 'flex'; container.style.display = 'none'; return; }
  empty.style.display = 'none';
  container.style.display = 'grid';
  container.innerHTML = list.map(c => {
    // Calculate real sent from emailHistory matching segment
    const realSent = getCampaignSentCount(c);
    const totalLeads = getCampaignLeadList(c).length;
    const pct = totalLeads ? Math.min(Math.round(realSent/totalLeads*100), 100) : 0;
    return `
      <div class="campaign-card">
        <div class="camp-header">
          <div class="camp-name">${c.name}</div>
          <span class="camp-seg">${c.segment}</span>
        </div>
        <div class="camp-stats">
          <div class="camp-stat"><div class="camp-stat-val">${totalLeads}</div><div class="camp-stat-lbl">Leads</div></div>
          <div class="camp-stat"><div class="camp-stat-val">${realSent}</div><div class="camp-stat-lbl">Enviados</div></div>
          <div class="camp-stat"><div class="camp-stat-val">${pct}%</div><div class="camp-stat-lbl">Progreso</div></div>
        </div>
        <div class="camp-progress"><div class="camp-progress-fill" style="width:${pct}%"></div></div>
        <div class="camp-real-progress">ðŸ“Š Progreso real basado en historial de emails</div>
        <div style="font-size:.78rem;color:var(--text-muted);margin-bottom:.75rem">${c.desc||'Sin descripciÃ³n'}</div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          <span style="font-size:.72rem;background:var(--glass);padding:2px 8px;border-radius:5px;color:var(--text-muted)">${c.sequence === 'cold' ? 'ðŸ“§ Cold Outbound' : 'ðŸ“© Inbound Nurturing'}</span>
          <button class="btn-action" onclick="duplicateCampaign(${c.id})" title="Duplicar campaÃ±a">âŽ˜</button>
          <button class="btn-action" onclick="openCampaignLeads(${c.id})">Ver leads →</button>
          <button class="btn-action danger" onclick="deleteCampaign(${c.id})" style="margin-left:auto">Eliminar</button>
        </div>
      </div>`;
  }).join('');
}

function resetCampaignsFilters() {
  ['campaigns-search','campaigns-filter-seg','campaigns-sort','campaigns-filter-status'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = id === 'campaigns-sort' ? 'date_desc' : '';
  });
  renderCampaigns();
}

function openCampaignLeads(id) {
  const c = campaigns.find(x => x.id === id);
  if (!c) return;
  showView('leads');
  const searchEl = document.getElementById('lead-search');
  const segEl = document.getElementById('filter-segment');
  if (Array.isArray(c.leadIds) && c.leadIds.length) {
    if (searchEl) searchEl.value = c.name;
    if (segEl) segEl.value = '';
  } else {
    if (searchEl) searchEl.value = '';
    if (segEl) segEl.value = c.segment === 'Todos' ? '' : c.segment;
  }
  renderLeads();
}

function deleteCampaign(id) {
  const c = campaigns.find(x => x.id === id);
  if (!c) return;
  const seg = c.segment === 'Todos' ? leads.length : leads.filter(l => l.segment === c.segment).length;
  const sent = emailHistory.filter(e => c.segment === 'Todos' || e.segment === c.segment).length;
  const summary = `CampaÃ±a: ${c.name}\nLeads: ${seg} Â· Emails enviados: ${sent}`;
  if (!confirm('Â¿Eliminar esta campaÃ±a?\n\n' + summary)) return;
  campaigns = campaigns.filter(x => x.id !== id);
  localStorage.setItem('gordi_campaigns', JSON.stringify(campaigns));
  renderCampaigns();
}

function duplicateCampaign(id) {
  const c = campaigns.find(x => x.id === id);
  if (!c) return;
  const copy = { ...c, id: Date.now(), name: c.name + ' (copia)', date: new Date().toISOString() };
  campaigns.push(copy);
  localStorage.setItem('gordi_campaigns', JSON.stringify(campaigns));
  renderCampaigns();
  showToast('CampaÃ±a duplicada âœ“');
}

// ============ EXPORT ============
function exportData() {
  if (!leads.length) { alert('No hay leads para exportar.'); return; }
  let csv = 'Nombre,Empresa,Email,TelÃ©fono,Segmento,SeÃ±al,Score,Estado,Web\n';
  leads.forEach(l => { csv += `"${l.name}","${l.company}","${l.email||''}","${l.phone||''}","${l.segment}","${(l.signal||'').replace(/"/g,"'")}",${l.score},"${l.status}","${l.website||''}"\n`; });
  downloadCSV(csv, 'leads_gordi.csv');
}

function downloadCSV(content, filename) {
  const blob = new Blob(['\uFEFF'+content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function clearAllLeads() {
  if (!confirm('âš ï¸ Â¿Borrar TODOS los leads? Esta acciÃ³n no se puede deshacer.')) return;
  if (typeof createSafetySnapshot === 'function') createSafetySnapshot('before_clear_all_leads');
  if (typeof createCriticalRescueSnapshot === 'function') createCriticalRescueSnapshot('before_clear_all_leads');
  if (typeof markIntentionalEmptyLeads === 'function') markIntentionalEmptyLeads();
  leads = [];
  saveLeads();
  renderAll();
  renderDashboardCharts();
  showToast('Todos los leads eliminados');
}

