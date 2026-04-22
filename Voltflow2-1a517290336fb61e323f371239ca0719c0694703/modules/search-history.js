// ══════════════════════════════════════════════════════════════════════════
// ██  MÓDULO: SEARCH HISTORY — Historial de búsquedas por CP + Segmento
// ──  Registra cuándo buscaste cada combinación de ubicación + tipo empresa
// ──  Muestra el estado directamente en el formulario de búsqueda
// ══════════════════════════════════════════════════════════════════════════

const SEARCH_HISTORY_KEY = 'voltium_search_history';

// ─── Cargar / guardar historial ───────────────────────────────────────────────
function loadSearchHistory() {
  try {
    return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '{}');
  } catch { return {}; }
}

function saveSearchHistoryData(data) {
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(data));
}

// ─── Clave única: normalizamos ubicación + segmento ──────────────────────────
function buildHistoryKey(segment, location) {
  const loc = (location || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const seg = (segment || '').trim().toLowerCase();
  return `${seg}::${loc}`;
}

// ─── Guardar una búsqueda nueva ───────────────────────────────────────────────
function saveSearchHistory(segment, location) {
  if (!segment || !location) return;
  const data = loadSearchHistory();
  const key  = buildHistoryKey(segment, location);
  data[key] = {
    segment,
    location: location.trim(),
    date: new Date().toISOString(),
    count: ((data[key]?.count) || 0) + 1,
  };
  saveSearchHistoryData(data);
  // Actualizar el badge en el formulario después de guardar
  setTimeout(() => updateSearchHistoryBadge(), 50);
}

// ─── Obtener info de una búsqueda concreta ────────────────────────────────────
function getSearchHistoryEntry(segment, location) {
  if (!segment || !location) return null;
  const data = loadSearchHistory();
  return data[buildHistoryKey(segment, location)] || null;
}

// ─── Formatear fecha relativa ─────────────────────────────────────────────────
function formatSearchDate(isoDate) {
  if (!isoDate) return '—';
  const d    = new Date(isoDate);
  const now  = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return 'hoy';
  if (diff === 1) return 'ayer';
  if (diff < 7)  return `hace ${diff} días`;
  if (diff < 30) return `hace ${Math.floor(diff/7)} sem.`;
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Actualizar el badge de historial en el formulario ───────────────────────
function updateSearchHistoryBadge() {
  const segEl  = document.getElementById('plan-segment');
  const locEl  = document.getElementById('plan-location');
  const badge  = document.getElementById('search-history-badge');
  if (!badge || !segEl || !locEl) return;

  const segment  = segEl.value;
  const location = locEl.value.trim();

  if (!location) {
    badge.style.display = 'none';
    return;
  }

  const entry = getSearchHistoryEntry(segment, location);
  badge.style.display = 'flex';

  if (entry) {
    const dateStr = formatSearchDate(entry.date);
    const times   = entry.count === 1 ? '1 vez' : `${entry.count} veces`;
    badge.innerHTML = `
      <span style="color:var(--warning);font-size:.75rem">⚠️</span>
      <span>Ya buscaste <strong>${entry.segment}</strong> en <strong>${entry.location}</strong></span>
      <span style="background:rgba(245,158,11,.15);color:var(--warning);border:1px solid rgba(245,158,11,.3);border-radius:8px;padding:1px 8px;font-size:.7rem;white-space:nowrap">
        ${dateStr} · ${times}
      </span>
      <button onclick="clearSingleSearchHistory('${segEl.value}','${locEl.value.trim().replace(/'/g,"\\'")}')"
        title="Borrar este registro"
        style="background:none;border:none;color:var(--text-dim);cursor:pointer;padding:0 2px;font-size:.75rem;line-height:1;flex-shrink:0"
        onmouseover="this.style.color='var(--danger)'"
        onmouseout="this.style.color='var(--text-dim)'">✕</button>`;
    badge.style.background    = 'rgba(245,158,11,.07)';
    badge.style.borderColor   = 'rgba(245,158,11,.25)';
  } else {
    badge.innerHTML = `
      <span style="color:var(--success);font-size:.75rem">✅</span>
      <span>Zona nueva — nunca buscaste <strong>${segEl.options[segEl.selectedIndex]?.text || segment}</strong> aquí</span>`;
    badge.style.background  = 'rgba(16,217,124,.06)';
    badge.style.borderColor = 'rgba(16,217,124,.2)';
  }
}

// ─── Borrar un registro individual ───────────────────────────────────────────
function clearSingleSearchHistory(segment, location) {
  const data = loadSearchHistory();
  delete data[buildHistoryKey(segment, location)];
  saveSearchHistoryData(data);
  updateSearchHistoryBadge();
  showToast('Registro de búsqueda eliminado');
}

// ─── Modal completo: todas las búsquedas realizadas ──────────────────────────
function openSearchHistoryModal() {
  const data    = loadSearchHistory();
  const entries = Object.values(data).sort((a, b) => new Date(b.date) - new Date(a.date));

  // Agrupar por ubicación para detectar cobertura
  const byLocation = {};
  entries.forEach(e => {
    const loc = e.location;
    if (!byLocation[loc]) byLocation[loc] = [];
    byLocation[loc].push(e);
  });

  // Construir HTML del modal
  let existingModal = document.getElementById('search-history-modal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'search-history-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;
    display:flex;align-items:center;justify-content:center;padding:1rem;
    backdrop-filter:blur(4px)`;
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

  const sortedLocs = Object.keys(byLocation).sort();
  const locationRows = sortedLocs.map(loc => {
    const segsHere = byLocation[loc];
    const segBadges = segsHere.map(e => {
      const dateStr = formatSearchDate(e.date);
      const times   = e.count > 1 ? ` ×${e.count}` : '';
      return `<span style="display:inline-flex;align-items:center;gap:.3rem;background:rgba(10,132,255,.1);
        border:1px solid rgba(10,132,255,.2);border-radius:8px;padding:2px 8px;font-size:.72rem;color:var(--primary)">
        <span>${e.segment}</span>
        <span style="color:var(--text-dim);font-size:.65rem">${dateStr}${times}</span>
        <button onclick="clearSingleSearchHistory('${e.segment.replace(/'/g,"\\'")}','${loc.replace(/'/g,"\\'")}');rebuildHistoryRows()"
          style="background:none;border:none;color:var(--text-dim);cursor:pointer;padding:0;font-size:.65rem;line-height:1"
          title="Eliminar" onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--text-dim)'">✕</button>
      </span>`;
    }).join('');

    // Ver cuántos segmentos posibles quedan sin buscar
    const allSegments = getAllSegmentNames();
    const coveredSegs = new Set(segsHere.map(e => e.segment.toLowerCase()));
    const missingSegs = allSegments.filter(s => !coveredSegs.has(s.toLowerCase()));
    const missingBadges = missingSegs.length
      ? `<span style="font-size:.68rem;color:var(--text-dim)">Sin buscar: ${missingSegs.slice(0,4).join(', ')}${missingSegs.length>4?' +'+( missingSegs.length-4)+'…':''}</span>`
      : `<span style="font-size:.68rem;color:var(--success)">✅ Cobertura completa</span>`;

    return `<div id="hist-row-${loc.replace(/[^a-z0-9]/gi,'_')}"
      style="padding:.75rem;border:1px solid var(--glass-border);border-radius:10px;
             background:var(--glass);display:flex;gap:.75rem;flex-wrap:wrap;align-items:flex-start">
      <div style="min-width:140px">
        <div style="font-weight:600;font-size:.82rem;color:var(--text)">${loc}</div>
        <div style="font-size:.7rem;color:var(--text-dim);margin-top:1px">${segsHere.length} tipo${segsHere.length!==1?'s':''} buscado${segsHere.length!==1?'s':''}</div>
      </div>
      <div style="flex:1;display:flex;flex-wrap:wrap;gap:.35rem;align-items:center">
        ${segBadges}
        <br style="width:100%;margin:0">
        ${missingBadges}
      </div>
    </div>`;
  }).join('');

  const emptyHtml = entries.length === 0
    ? `<div style="text-align:center;padding:2.5rem;color:var(--text-muted);font-size:.85rem">
        Aún no has realizado ninguna búsqueda. El historial se irá llenando automáticamente.
       </div>`
    : '';

  modal.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--glass-border);border-radius:16px;
      width:100%;max-width:680px;max-height:85vh;overflow:hidden;display:flex;flex-direction:column;
      box-shadow:0 24px 60px rgba(0,0,0,.5)">
      <!-- Header -->
      <div style="padding:1.25rem 1.5rem;border-bottom:1px solid var(--glass-border);
        display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
        <div>
          <div style="font-size:1rem;font-weight:700;color:var(--text)">📋 Historial de Búsquedas</div>
          <div style="font-size:.72rem;color:var(--text-muted);margin-top:2px">
            ${entries.length} búsqueda${entries.length!==1?'s':''} registrada${entries.length!==1?'s':''} en ${sortedLocs.length} zona${sortedLocs.length!==1?'s':''}
          </div>
        </div>
        <div style="display:flex;gap:.5rem;align-items:center">
          ${entries.length > 0 ? `<button onclick="clearAllSearchHistory()" style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);color:var(--danger);border-radius:8px;padding:5px 12px;font-size:.75rem;cursor:pointer">🗑️ Limpiar todo</button>` : ''}
          <button onclick="document.getElementById('search-history-modal').remove()"
            style="background:var(--glass);border:1px solid var(--glass-border);color:var(--text-muted);
              border-radius:8px;padding:5px 10px;font-size:.9rem;cursor:pointer">✕</button>
        </div>
      </div>
      <!-- Body -->
      <div id="history-modal-body" style="overflow-y:auto;padding:1.25rem;display:flex;flex-direction:column;gap:.6rem">
        ${emptyHtml}
        ${locationRows}
      </div>
      <!-- Footer tip -->
      <div style="padding:.75rem 1.5rem;border-top:1px solid var(--glass-border);flex-shrink:0;
        font-size:.72rem;color:var(--text-dim);background:rgba(0,0,0,.1)">
        💡 El badge de estado aparece automáticamente en el formulario al escribir una ubicación
      </div>
    </div>`;

  document.body.appendChild(modal);
}

// ─── Re-render de filas tras borrar (sin cerrar el modal) ─────────────────────
function rebuildHistoryRows() {
  const body = document.getElementById('history-modal-body');
  if (!body) return;
  // Volver a abrir el modal desde cero (más simple y seguro)
  document.getElementById('search-history-modal')?.remove();
  openSearchHistoryModal();
}

// ─── Borrar todo el historial ─────────────────────────────────────────────────
function clearAllSearchHistory() {
  if (!confirm('¿Borrar todo el historial de búsquedas? Esta acción no se puede deshacer.')) return;
  localStorage.removeItem(SEARCH_HISTORY_KEY);
  document.getElementById('search-history-modal')?.remove();
  updateSearchHistoryBadge();
  showToast('Historial de búsquedas borrado');
}

// ─── Obtener nombres de todos los segmentos del selector ──────────────────────
function getAllSegmentNames() {
  const sel = document.getElementById('plan-segment');
  if (!sel) return [];
  return [...sel.options].map(o => o.text).filter(t => t && t !== '—');
}

// ─── Inyectar badge + botón en el formulario de búsqueda ─────────────────────
function injectSearchHistoryUI() {
  // Badge de estado (debajo del campo de ubicación)
  const locEl = document.getElementById('plan-location');
  if (locEl && !document.getElementById('search-history-badge')) {
    const badge = document.createElement('div');
    badge.id = 'search-history-badge';
    badge.style.cssText = `
      display:none;align-items:center;gap:.5rem;flex-wrap:wrap;
      margin-top:.4rem;padding:.45rem .75rem;border-radius:9px;
      border:1px solid transparent;font-size:.78rem;color:var(--text);
      transition:all .2s`;
    locEl.parentNode.insertBefore(badge, locEl.nextSibling);

    // Escuchar cambios en el campo de ubicación
    locEl.addEventListener('input', () => updateSearchHistoryBadge());
    locEl.addEventListener('change', () => updateSearchHistoryBadge());
  }

  // Escuchar cambio de segmento
  const segEl = document.getElementById('plan-segment');
  if (segEl && !segEl.dataset.historyListener) {
    segEl.dataset.historyListener = '1';
    segEl.addEventListener('change', () => updateSearchHistoryBadge());
  }

  // Botón "Ver historial" junto al botón de búsqueda
  const btnSearch = document.getElementById('btn-search');
  if (btnSearch && !document.getElementById('btn-history')) {
    const btnHist = document.createElement('button');
    btnHist.id = 'btn-history';
    btnHist.type = 'button';
    btnHist.title = 'Ver historial de búsquedas';
    btnHist.onclick = openSearchHistoryModal;
    btnHist.style.cssText = `
      background:var(--glass);border:1px solid var(--glass-border);
      color:var(--text-muted);border-radius:10px;padding:.55rem .85rem;
      font-size:.8rem;cursor:pointer;white-space:nowrap;
      transition:border-color .15s,color .15s;flex-shrink:0`;
    btnHist.onmouseover = () => { btnHist.style.borderColor='rgba(10,132,255,.4)'; btnHist.style.color='var(--primary)'; };
    btnHist.onmouseout  = () => { btnHist.style.borderColor='var(--glass-border)'; btnHist.style.color='var(--text-muted)'; };
    btnHist.innerHTML   = '📋 Historial';
    btnSearch.parentNode.insertBefore(btnHist, btnSearch.nextSibling);
  }
}

// ─── Init: esperar a que el DOM esté listo ────────────────────────────────────
(function initSearchHistoryModule() {
  const tryInject = () => {
    if (document.getElementById('plan-location')) {
      injectSearchHistoryUI();
    } else {
      setTimeout(tryInject, 300);
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInject);
  } else {
    tryInject();
  }
})();
