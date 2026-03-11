// ══════════════════════════════════════════════════════════════════════════
// ██  MÓDULO: SMART IMPORT — Importación inteligente de bases de datos externas
// ──  Detecta automáticamente el formato del Excel/CSV y mapea los campos
// ──  al esquema interno de Voltium CRM sin configuración manual.
// ══════════════════════════════════════════════════════════════════════════

// ─── Dependencias externas (cargadas desde CDN en index.html si no están) ─────
function _ensureSheetJS(cb) {
  if (window.XLSX) { cb(); return; }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  s.onload = cb;
  document.head.appendChild(s);
}

// ─── Estado del importador ────────────────────────────────────────────────────
let _importRows    = [];   // filas parseadas del archivo
let _importMapped  = [];   // leads mapeados listos para previsualizar
let _importFile    = null; // nombre del archivo actual

// ══════════════════════════════════════════════════════════════════════════
// DETECCIÓN AUTOMÁTICA DE COLUMNAS
// Analiza la cabecera del archivo y mapea inteligentemente los campos
// sin importar el nombre exacto de las columnas.
// ══════════════════════════════════════════════════════════════════════════
function _detectColumnMap(headers) {
  const map = {
    company: -1, name: -1, email: -1, phone: -1,
    signal: -1, segment: -1, website: -1, address: -1, opportunity: -1,
  };

  const PATTERNS = {
    company:     /compañ|empresa|company|sociedad|razon.social|razón.social|organiz/i,
    opportunity: /oportun|oportunidad|deal|negocio/i,
    name:        /^nombre|contacto|contact.name|persona|responsabl|nombre.del/i,
    email:       /email|correo|e-mail|mail/i,
    phone:       /tel[eé]f|phone|móvil|movil|celular|whatsapp/i,
    signal:      /señal|signal|nota|note|descrip|observ|comentar/i,
    segment:     /segment|sector|industria|tipo.empresa|categoria|categoría/i,
    website:     /web|url|site|página|pagina/i,
    address:     /direcci[oó]n|address|calle|ciudad|localidad|cp|postal/i,
  };

  headers.forEach((h, i) => {
    if (!h) return;
    const hs = String(h).trim();
    for (const [field, regex] of Object.entries(PATTERNS)) {
      if (map[field] === -1 && regex.test(hs)) {
        map[field] = i;
      }
    }
  });

  return map;
}

// ══════════════════════════════════════════════════════════════════════════
// DETECCIÓN AUTOMÁTICA DE SEGMENTO
// Infiere el segmento CRM a partir del nombre de la empresa
// ══════════════════════════════════════════════════════════════════════════
function _detectSegment(companyName) {
  const n = (companyName || '').toUpperCase();

  if (/RESTAUR|CATERI|HOTEL|BAR\s|CAFE|COMIDA|FOOD|HOSTEL|PIZZ|TAPAS|GASTRO|CERVECE|MESÓN|MESON|TABERNA|COCINA/.test(n))
    return 'Hoteles';
  if (/ELECTRIC|FONTANER|CLIMATIZ|CALEFAC|REFRIGER|AIRE.ACON|ENERGI|SOLAR.PV|FOTOVOLT|PANNELL|ILUMINAC/.test(n))
    return 'Industrial';
  if (/CONSTRUC|OBRA|ALICATAD|EXCAVAC|DERRIBO|ASFALT|HORMIG|CERRAMI|REFORMA|INSTALA|ESTRUCTUR|PAVIMENT|CARPINTER|PINTUR|ALBAÑIL|ANDAMI|SOLADO|REVESTIM|IMPERME/.test(n))
    return 'Industrial';
  if (/LOGISTIC|TRANSPORT|ALMACEN|DISTRIBU|NAVE\s|NAVES\s|CARGA|FLETE|MUDANZ/.test(n))
    return 'Industrial';
  if (/OFICIN|CONSULT|ASESORI|GESTORI|ABOGAD|NOTARI|SEGURO|FINANC|CONTABL|AUDIT|ASESOR|JURIDIC|MEDIACI/.test(n))
    return 'Oficinas';
  if (/TIENDA|RETAIL|COMERCI|BAZAR|FERRET|MUEBLE|DECOR|MODAS|ROPA|CALZAD|JOYERI|OPTICA|FARMAC/.test(n))
    return 'Retail';
  if (/GIMNASIO|DEPORT|FITNESS|PADEL|TENIS|YOGA|PILATES|CROSSFIT|SPA\s|WELLNESS/.test(n))
    return 'Deportivo';
  if (/COLEGIO|ACADEM|ESCUELA|FORMACION|EDUCACI|UNIVERS|GUARDERI|JARDÍN|JARDIN/.test(n))
    return 'Educativo';
  if (/MUSEO|TEATRO|GALERIA|CULTURAL|EXPOSICI|CINE\s/.test(n))
    return 'Cultural';

  return 'Industrial'; // Default para SL/SA/SLU genéricas
}

// ══════════════════════════════════════════════════════════════════════════
// NORMALIZACIÓN DE TELÉFONO
// Limpia formatos varios: +34 916 58 65 28, 916586528, 918 07 53 45 ext. 918...
// ══════════════════════════════════════════════════════════════════════════
function _normalizePhone(raw) {
  if (!raw) return '';
  let s = String(raw).trim();
  // Si hay múltiples teléfonos separados por / o ,, quedarse con el primero
  s = s.split(/[\/,;]/)[0].trim();
  // Quitar extensiones
  s = s.replace(/\s*ext\.?\s*\d+/i, '').trim();
  // Dejar solo dígitos y +
  const digits = s.replace(/[^\d+]/g, '');
  if (!digits) return '';
  // Si empieza por 34 sin +, añadir +
  if (/^34\d{9}$/.test(digits)) return '+' + digits;
  return digits.length >= 9 ? digits : '';
}

// ══════════════════════════════════════════════════════════════════════════
// EXTRACCIÓN DE EMPRESA DESDE CAMPO "OPORTUNIDAD"
// Casos: "Oportunidad de EMPRESA SL", "Deal - EMPRESA", etc.
// ══════════════════════════════════════════════════════════════════════════
function _extractCompanyFromOpportunity(raw) {
  if (!raw) return '';
  let s = String(raw).trim();
  // Patrones comunes de CRMs exportados
  s = s.replace(/^oportunidad\s+de\s+/i, '');
  s = s.replace(/^deal\s*[-:]\s*/i, '');
  s = s.replace(/^negocio\s+de\s+/i, '');
  s = s.replace(/^opportunity\s*[-:]\s*/i, '');
  return s.trim();
}

// ══════════════════════════════════════════════════════════════════════════
// DETECCIÓN SI UN VALOR ES NOMBRE DE PERSONA O EMPRESA
// ══════════════════════════════════════════════════════════════════════════
function _looksLikeCompany(val) {
  if (!val) return false;
  const v = String(val).toUpperCase();
  return /\bS\.?L\.?U?\b|\bS\.?A\.?\b|\bS\.?L\.?L\b|\bLTD\b|\bCORP\b|\bINC\b|\bSIN NOMBRE\b|\bGROUP\b|\bGRUPO\b/.test(v);
}

// ══════════════════════════════════════════════════════════════════════════
// MAPEO DE UNA FILA A LEAD
// ══════════════════════════════════════════════════════════════════════════
function _mapRowToLead(row, colMap, sourceFileName) {
  const get = (idx) => (idx >= 0 && row[idx] != null) ? String(row[idx]).trim() : '';

  // ── Empresa ──────────────────────────────────────────────────────────────
  let company = '';
  // 1. Campo "Oportunidad" tiene la empresa real en muchos CRM exports
  if (colMap.opportunity >= 0) {
    company = _extractCompanyFromOpportunity(get(colMap.opportunity));
  }
  // 2. Si no, usar campo Empresa/Compañía directamente
  if (!company && colMap.company >= 0) {
    const raw = get(colMap.company);
    // Ignorar si es el nombre de la empresa exportadora (ej: "Alquiber Quality, S.A.")
    // heurística: si todas las filas tienen el mismo valor en company, es el exportador
    company = raw;
  }
  // 3. Si el campo "Contacto" parece una empresa, usarlo
  if (!company && colMap.name >= 0 && _looksLikeCompany(get(colMap.name))) {
    company = get(colMap.name);
  }
  if (!company) return null; // Sin empresa → descartar fila

  // ── Nombre del contacto ──────────────────────────────────────────────────
  let contactName = 'Responsable';
  if (colMap.name >= 0) {
    const raw = get(colMap.name);
    // Solo usar si parece persona (no empresa)
    if (raw && !_looksLikeCompany(raw) && !/sin nombre/i.test(raw)) {
      contactName = raw;
    }
  }

  // ── Email ────────────────────────────────────────────────────────────────
  const email = get(colMap.email).toLowerCase().replace(/\s/g, '');

  // ── Teléfono ─────────────────────────────────────────────────────────────
  const phone = _normalizePhone(get(colMap.phone));

  // ── Segmento ─────────────────────────────────────────────────────────────
  let segment = colMap.segment >= 0 ? get(colMap.segment) : '';
  if (!segment) segment = _detectSegment(company);

  // ── Señal / Nota ─────────────────────────────────────────────────────────
  let signal = colMap.signal >= 0 ? get(colMap.signal) : '';
  if (!signal) signal = `Importado desde ${sourceFileName || 'base de datos externa'}`;

  // ── Web ──────────────────────────────────────────────────────────────────
  const website = colMap.website >= 0 ? get(colMap.website) : '';

  // ── Dirección ────────────────────────────────────────────────────────────
  const address = colMap.address >= 0 ? get(colMap.address) : '';

  return { company, name: contactName, email, phone, segment, signal, website, address };
}

// ══════════════════════════════════════════════════════════════════════════
// DEDUPLICACIÓN PREVIA A IMPORTACIÓN
// Detecta duplicados contra leads ya existentes en el CRM
// ══════════════════════════════════════════════════════════════════════════
function _findDuplicates(mappedLeads) {
  const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
  const existingCompanies = new Set((leads || []).filter(l => !l.archived).map(l => norm(l.company)));
  const existingEmails    = new Set((leads || []).filter(l => !l.archived && l.email).map(l => l.email.toLowerCase().trim()));

  return mappedLeads.map((lead, i) => {
    const dupByCompany = existingCompanies.has(norm(lead.company));
    const dupByEmail   = lead.email && existingEmails.has(lead.email);
    return { ...lead, _idx: i, _dupCompany: dupByCompany, _dupEmail: dupByEmail, _isDup: dupByCompany || dupByEmail };
  });
}

// ══════════════════════════════════════════════════════════════════════════
// PARSEAR ARCHIVO (XLSX / CSV / TXT)
// ══════════════════════════════════════════════════════════════════════════
function _parseFile(file, callback) {
  const reader = new FileReader();

  if (file.name.match(/\.xlsx?$/i)) {
    reader.onload = (e) => {
      try {
        const wb  = XLSX.read(e.target.result, { type: 'array' });
        const ws  = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
        callback(null, raw);
      } catch (err) {
        callback('Error leyendo Excel: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    // CSV / TXT
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        // Auto-detect separator: ; or , or \t
        const firstLine = text.split('\n')[0] || '';
        const sep = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';
        const rows = text.split('\n').map(line =>
          line.split(sep).map(cell => cell.trim().replace(/^["']|["']$/g, '') || null)
        ).filter(r => r.some(c => c));
        callback(null, rows);
      } catch (err) {
        callback('Error leyendo CSV: ' + err.message);
      }
    };
    reader.readAsText(file, 'UTF-8');
  }
}

// ══════════════════════════════════════════════════════════════════════════
// PROCESAR ARCHIVO COMPLETO → LEADS MAPEADOS
// ══════════════════════════════════════════════════════════════════════════
function _processRows(rawRows, fileName) {
  if (!rawRows || rawRows.length < 2) return [];

  const headers = (rawRows[0] || []).map(h => h != null ? String(h) : '');
  const colMap  = _detectColumnMap(headers);
  const dataRows = rawRows.slice(1);

  // Filtrar filas completamente vacías
  const validRows = dataRows.filter(r => r && r.some(c => c != null && String(c).trim() !== ''));

  const mapped = validRows
    .map(row => _mapRowToLead(row, colMap, fileName))
    .filter(Boolean); // eliminar nulls (filas sin empresa)

  // Si "Compañía" (col0) tiene siempre el mismo valor, era el exportador → ignorarla
  // ya se manejó usando "Oportunidad" como fuente primaria de empresa

  return mapped;
}

// ══════════════════════════════════════════════════════════════════════════
// RENDERIZAR PREVIEW DE IMPORTACIÓN
// ══════════════════════════════════════════════════════════════════════════
function _renderSmartImportPreview(mappedWithDups) {
  const preview = document.getElementById('import-preview');
  const tbody   = document.getElementById('import-preview-body');
  const statusMsg = document.getElementById('import-status-msg');
  const dupPanel  = document.getElementById('import-duplicates-panel');
  const dupList   = document.getElementById('import-duplicates-list');
  const dupBadge  = document.getElementById('dup-count-badge');

  if (!preview || !tbody) return;

  const total    = mappedWithDups.length;
  const dups     = mappedWithDups.filter(l => l._isDup);
  const withEmail = mappedWithDups.filter(l => l.email).length;
  const withPhone = mappedWithDups.filter(l => l.phone).length;

  // Status message
  if (statusMsg) {
    statusMsg.innerHTML = `<span style="color:var(--success)">${total} leads detectados</span>
      · <span style="color:var(--primary)">${withEmail} con email</span>
      · <span style="color:var(--text-muted)">${withPhone} con teléfono</span>
      ${dups.length ? `· <span style="color:var(--warning)">${dups.length} posibles duplicados</span>` : ''}`;
  }

  // Duplicates panel
  if (dupPanel && dupList && dupBadge) {
    if (dups.length > 0) {
      dupBadge.textContent = dups.length;
      dupList.innerHTML = dups.slice(0, 8).map(d =>
        `<div style="font-size:.75rem;display:flex;align-items:center;gap:.5rem;padding:.2rem 0">
          <span style="color:var(--warning)">⚠️</span>
          <span><strong>${d.company}</strong>${d._dupEmail ? ` · ${d.email}` : ''}</span>
          <span style="font-size:.68rem;color:var(--text-dim)">${d._dupCompany ? 'empresa ya existe' : 'email ya existe'}</span>
        </div>`
      ).join('') + (dups.length > 8 ? `<div style="font-size:.72rem;color:var(--text-dim)">...y ${dups.length - 8} más</div>` : '');
      dupPanel.style.display = 'block';
    } else {
      dupPanel.style.display = 'none';
    }
  }

  // Segment distribution for summary
  const segCounts = {};
  mappedWithDups.forEach(l => { segCounts[l.segment] = (segCounts[l.segment] || 0) + 1; });
  const segSummary = Object.entries(segCounts)
    .sort((a,b) => b[1]-a[1])
    .map(([s,c]) => `${s}: ${c}`)
    .join(' · ');

  // Table rows
  tbody.innerHTML = mappedWithDups.map((lead, i) => {
    const segColor = {
      'Industrial':'rgba(245,158,11,.15)','Retail':'rgba(10,132,255,.15)',
      'Oficinas':'rgba(94,92,230,.15)','Hoteles':'rgba(255,149,0,.15)',
      'Deportivo':'rgba(16,217,124,.15)','Educativo':'rgba(52,199,89,.15)',
      'Cultural':'rgba(175,82,222,.15)','Comercial':'rgba(255,55,95,.15)',
    }[lead.segment] || 'rgba(100,100,100,.1)';

    const score = calculateScore
      ? calculateScore('otros', 'mediano', lead.signal, { email: lead.email, phone: lead.phone })
      : (lead.email ? 45 : 20);

    const dupStyle = lead._isDup ? 'opacity:.55' : '';
    const dupMark  = lead._isDup ? '<span title="Posible duplicado" style="color:var(--warning);font-size:.8rem">⚠️</span>' : '';

    return `<tr style="${dupStyle}" id="imp-row-${i}">
      <td><input type="checkbox" class="import-check" data-idx="${i}" ${lead._isDup ? '' : 'checked'}></td>
      <td>
        <div style="font-weight:600;font-size:.82rem">${dupMark}${lead.company}</div>
        <div style="font-size:.72rem;color:var(--text-muted)">${lead.name !== 'Responsable' ? '👤 ' + lead.name : ''}</div>
      </td>
      <td style="font-size:.8rem;color:${lead.email ? 'var(--success)' : 'var(--text-dim)'}">
        ${lead.email || '<span style="color:var(--text-dim);font-size:.72rem">—</span>'}
      </td>
      <td style="font-size:.78rem;color:var(--text-muted)">${lead.phone || '—'}</td>
      <td>
        <span style="font-size:.68rem;background:${segColor};padding:2px 7px;border-radius:8px">
          <select class="imp-seg-sel" data-idx="${i}"
            style="background:transparent;border:none;font-size:.68rem;color:var(--text);cursor:pointer;outline:none;max-width:110px">
            ${['Industrial','Retail','Oficinas','Hoteles','Deportivo','Educativo','Cultural','Comercial']
              .map(s => `<option value="${s}"${s===lead.segment?' selected':''}>${s}</option>`).join('')}
          </select>
        </span>
      </td>
      <td>
        <span style="font-size:.65rem;background:rgba(10,132,255,.1);color:var(--primary);
          padding:1px 6px;border-radius:5px;font-weight:600">${score} pts</span>
      </td>
    </tr>`;
  }).join('');

  // Add segment summary bar
  const existingSummary = document.getElementById('smart-import-seg-summary');
  if (existingSummary) existingSummary.remove();
  const summaryEl = document.createElement('div');
  summaryEl.id = 'smart-import-seg-summary';
  summaryEl.style.cssText = 'font-size:.72rem;color:var(--text-dim);margin:.5rem 0 .75rem;padding:.4rem .75rem;background:var(--glass);border-radius:8px;border:1px solid var(--glass-border)';
  summaryEl.textContent = '📊 Distribución: ' + segSummary;
  preview.insertBefore(summaryEl, preview.firstChild);

  preview.style.display = 'block';

  // Bind segment change listeners
  document.querySelectorAll('.imp-seg-sel').forEach(sel => {
    sel.onchange = () => {
      const idx = parseInt(sel.dataset.idx);
      _importMapped[idx].segment = sel.value;
    };
  });
}

// ══════════════════════════════════════════════════════════════════════════
// ENTRY POINT: HANDLE FILE SELECT (reemplaza la función original)
// ══════════════════════════════════════════════════════════════════════════
function handleFileSelect(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  _smartImportFile(file);
}

function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;
  document.getElementById('upload-zone')?.classList.remove('drag-over');
  _smartImportFile(file);
}

function handleDragOver(event) {
  event.preventDefault();
  document.getElementById('upload-zone')?.classList.add('drag-over');
}

function _smartImportFile(file) {
  const statusEl = document.getElementById('csv-status');
  if (statusEl) statusEl.innerHTML = '<span style="color:var(--primary)">⏳ Analizando archivo...</span>';

  _importFile = file.name;
  _importRows = [];
  _importMapped = [];
  document.getElementById('import-preview') && (document.getElementById('import-preview').style.display = 'none');

  _ensureSheetJS(() => {
    _parseFile(file, (err, rawRows) => {
      if (err) {
        if (statusEl) statusEl.innerHTML = `<span style="color:var(--danger)">❌ ${err}</span>`;
        return;
      }
      _importRows = rawRows;
      const mapped = _processRows(rawRows, file.name);

      if (!mapped.length) {
        if (statusEl) statusEl.innerHTML = '<span style="color:var(--warning)">⚠️ No se encontraron datos válidos. Comprueba que el archivo tiene cabecera y datos.</span>';
        return;
      }

      _importMapped = _findDuplicates(mapped);

      const dups = _importMapped.filter(l => l._isDup).length;
      if (statusEl) {
        statusEl.innerHTML = `✅ <strong>${mapped.length} leads</strong> detectados en <em>${file.name}</em>`
          + (dups ? ` · <span style="color:var(--warning)">${dups} posibles duplicados marcados</span>` : '')
          + ` — revisa la previsualización abajo`;
      }

      _renderSmartImportPreview(_importMapped);
    });
  });
}

// ══════════════════════════════════════════════════════════════════════════
// IMPORTAR SELECCIONADOS (reemplaza processBulkImport + importSelectedLeads)
// ══════════════════════════════════════════════════════════════════════════
function importSelectedLeads() {
  const checked = document.querySelectorAll('.import-check:checked');
  const indices = [...checked].map(c => parseInt(c.dataset.idx));

  if (!indices.length) { showToast('⚠️ Selecciona al menos un lead'); return; }

  let imported = 0;
  let skippedDup = 0;
  const now = new Date().toISOString();

  indices.forEach(i => {
    const lead = _importMapped[i];
    if (!lead) return;

    // Double-check duplicates (by email)
    if (lead.email && leads.some(l => !l.archived && l.email && l.email.toLowerCase() === lead.email.toLowerCase())) {
      skippedDup++;
      return;
    }
    // Double-check duplicates (by company name)
    const norm = s => (s||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,25);
    if (leads.some(l => !l.archived && norm(l.company) === norm(lead.company))) {
      skippedDup++;
      return;
    }

    const score = calculateScore
      ? calculateScore('otros', 'mediano', lead.signal, { email: lead.email, phone: lead.phone })
      : (lead.email ? 45 : 20);

    leads.unshift({
      id: Date.now() + Math.random(),
      name:     lead.name,
      company:  lead.company,
      email:    lead.email,
      phone:    lead.phone,
      segment:  lead.segment,
      website:  lead.website || '',
      address:  lead.address || '',
      signal:   lead.signal,
      score,
      status:   'Pendiente',
      date:     now,
      status_date: now,
      notes:    '',
      tags:     [],
      budget:   0,
      next_contact: '',
      source:   'import',
      activity: [{ action: `Lead importado desde "${_importFile || 'base de datos'}"`, date: now }],
    });
    imported++;
  });

  saveLeads();
  if (typeof renderAll === 'function') renderAll();
  if (typeof updateStats === 'function') updateStats();
  if (typeof updateStreakData === 'function') updateStreakData();

  // Ocultar preview
  const preview = document.getElementById('import-preview');
  if (preview) preview.style.display = 'none';
  const statusEl = document.getElementById('csv-status');
  if (statusEl) statusEl.innerHTML = `✅ <strong>${imported} leads importados</strong>`
    + (skippedDup ? ` · ${skippedDup} duplicados omitidos` : '');

  showToast(`✅ ${imported} leads importados${skippedDup ? ` · ${skippedDup} duplicados omitidos` : ''}`);
  _importMapped = [];
  _importRows = [];
}

// ── processBulkImport: para el modo pegar texto ───────────────────────────────
function processBulkImport() {
  const raw = document.getElementById('import-area')?.value?.trim();
  if (!raw) { showToast('⚠️ Pega datos primero'); return; }

  // Detect separator
  const lines = raw.split('\n').filter(l => l.trim());
  if (!lines.length) return;

  const sep = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';

  // Try to detect if first line is header
  const firstCells = lines[0].split(sep).map(c => c.trim().toLowerCase());
  const looksLikeHeader = firstCells.some(c =>
    /nombre|empresa|email|correo|tel[eé]f|company|contact|phone|mail/i.test(c)
  );

  let rawRows;
  if (looksLikeHeader) {
    rawRows = lines.map(l => l.split(sep).map(c => c.trim().replace(/^["']|["']$/g, '') || null));
  } else {
    // No header — use positional mapping: Nombre, Empresa, Email, Señal
    const header = ['Nombre del contacto', 'Compañía', 'Correo electrónico', 'Señal'];
    rawRows = [header, ...lines.map(l => l.split(sep).map(c => c.trim().replace(/^["']|["']$/g, '') || null))];
  }

  _importFile = 'pegado manual';
  const mapped = _processRows(rawRows, 'pegado manual');

  if (!mapped.length) { showToast('⚠️ No se detectaron datos válidos'); return; }

  _importMapped = _findDuplicates(mapped);
  _renderSmartImportPreview(_importMapped);
}

function clearImportArea() {
  const el = document.getElementById('import-area');
  if (el) el.value = '';
  const preview = document.getElementById('import-preview');
  if (preview) preview.style.display = 'none';
  _importMapped = [];
}

function toggleAllImport(checked) {
  document.querySelectorAll('.import-check').forEach(c => c.checked = checked);
}
