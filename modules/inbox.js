// ============================================================
// HILO DE EMAILS INLINE EN DRAWER (v2.5b)
// ============================================================

// Builds email thread HTML without nested template literals
function buildEmailThread(emails) {
  if (!emails || !emails.length) {
    return '<div style="font-size:.75rem;color:var(--text-dim);padding:.4rem 0">Sin emails registrados aún</div>';
  }
  var html = '<div class="email-thread" id="drawer-email-thread">';
  var shown = emails.slice(0, 6);
  for (var i = 0; i < shown.length; i++) {
    var e = shown[i];
    var inbound = e.direction === 'inbound' || e.status === 'Respuesta recibida';
    var dir = inbound ? 'inbound' : 'outbound';
    var icon = inbound ? '📬' : '✉️';
    var label = inbound ? 'Recibido' : 'Enviado';
    var dateStr = new Date(e.date).toLocaleDateString('es-ES', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'});
    var respBadge = inbound ? ' &nbsp;<strong style="color:var(--success)">Respuesta</strong>' : '';
    var bodyHtml = e.notes ? '<div class="email-thread-body">' + e.notes.slice(0, 120) + '</div>' : '';
    html += '<div class="email-thread-item ' + dir + '">';
    html += '<div class="email-thread-dot ' + dir + '">' + icon + '</div>';
    html += '<div class="email-thread-info">';
    html += '<div class="email-thread-subject">' + (e.subject || '(sin asunto)') + '</div>';
    html += '<div class="email-thread-meta">' + label + ' · ' + dateStr + respBadge + '</div>';
    html += bodyHtml;
    html += '</div></div>';
  }
  if (emails.length > 6) {
    html += '<div style="font-size:.7rem;color:var(--text-dim);text-align:center;padding:.3rem">+' + (emails.length - 6) + ' emails más en Seguimiento</div>';
  }
  html += '</div>';
  return html;
}

function expandInlinePaste(leadId) {
  const zone = document.getElementById(`drawer-paste-zone-${leadId}`);
  const ta   = document.getElementById(`drawer-paste-ta-${leadId}`);
  if (!zone || !ta) return;
  zone.classList.add('expanded');
  ta.focus();
}

function handleInlineDrop(event, leadId) {
  event.preventDefault();
  const zone = document.getElementById(`drawer-paste-zone-${leadId}`);
  const ta   = document.getElementById(`drawer-paste-ta-${leadId}`);
  if (!zone || !ta) return;
  const text = event.dataTransfer.getData('text/plain');
  if (text) {
    ta.value = text;
    zone.classList.add('expanded', 'has-content');
    onInlinePasteInput(ta, leadId);
  }
  zone.classList.remove('dragover');
}

function onInlinePasteInput(ta, leadId) {
  const zone = document.getElementById(`drawer-paste-zone-${leadId}`);
  const btn  = document.getElementById(`drawer-paste-btn-${leadId}`);
  const hint = document.getElementById(`drawer-paste-hint-${leadId}`);
  const val  = ta.value.trim();

  if (val.length > 10) {
    zone.classList.add('has-content');
    if (btn) btn.style.display = 'inline-flex';
    if (hint) hint.style.display = 'none';
  } else {
    zone.classList.remove('has-content');
    if (btn) btn.style.display = 'none';
    if (hint) hint.style.display = 'block';
  }
}

async function registerInlineReply(leadId) {
  const ta   = document.getElementById(`drawer-paste-ta-${leadId}`);
  const zone = document.getElementById(`drawer-paste-zone-${leadId}`);
  const btn  = document.getElementById(`drawer-paste-btn-${leadId}`);
  const raw  = ta?.value.trim();
  if (!raw || raw.length < 5) return;

  const lead = leads.find(l => l.id == leadId);
  if (!lead) return;

  // Disable button during processing
  if (btn) { btn.textContent = '⏳ Procesando...'; btn.disabled = true; }

  // Extract subject and body from pasted text
  let subject = '(respuesta)';
  let body    = raw;
  let senderName = '';

  // Try to detect subject from email headers
  const subjMatch = raw.match(/(?:Asunto|Subject|RE:|FW:)\s*:?\s*(.+?)(?:\n|$)/i);
  if (subjMatch) subject = subjMatch[1].trim().replace(/^RE:\s*/i,'').replace(/^FW:\s*/i,'').slice(0,80);
  else if (raw.slice(0,80).includes('@') || raw.slice(0,5).toLowerCase().startsWith('de:')) {
    subject = '(respuesta recibida)';
  } else {
    // First non-empty line as subject hint
    const firstLine = raw.split('\n').find(l => l.trim().length > 5);
    if (firstLine) subject = firstLine.trim().slice(0,70);
  }

  const fromMatch = raw.match(/(?:De|From)\s*:\s*(.+?)(?:\n|$)/i);
  if (fromMatch) senderName = fromMatch[1].replace(/<.*?>/, '').replace(/["']/g,'').trim();

  // Use Gemini to extract clean body if available
  const geminiKey = localStorage.getItem('gordi_gemini_key');
  let cleanBody = raw.slice(0, 300);

  if (geminiKey && raw.length > 50) {
    try {
      const prompt = `Del siguiente email, extrae SOLO el texto del mensaje principal (sin headers, sin firmas, sin texto citado de emails anteriores). Máximo 200 palabras. Responde solo con el texto limpio.

EMAIL:
${raw.slice(0, 1500)}`;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ contents:[{parts:[{text:prompt}]}] }),
          signal: AbortSignal.timeout(10000) }
      );
      const data = await res.json();
      const extracted = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (extracted && extracted.length > 10) cleanBody = extracted;
    } catch(e) { /* use raw fallback */ }
  }

  // Apply all 4 actions
  // 1. Estado → Respuesta del cliente (con confirmación)
  const oldStatus = lead.status;
  const _applyResp1 = () => {
    if (!['Respuesta del cliente','Visita','Entrega de presupuesto','Cerrado'].includes(lead.status)) {
      lead.status = 'Respuesta del cliente';
      lead.status_date = new Date().toISOString();
      addActivityLog(lead.id, `Estado: ${oldStatus} → Respuesta del cliente`);
    }
  };
  if (!['Respuesta del cliente','Visita','Entrega de presupuesto','Cerrado'].includes(lead.status)) {
    confirmStatusChange(lead, 'Respuesta del cliente', _applyResp1);
  } else {
    _applyResp1();
  }

  // 2. Nota con extracto
  const ts = `[${new Date().toLocaleDateString('es-ES',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}]`;
  const noteEntry = `${ts} 📬 Respuesta recibida\nAsunto: "${subject}"\n${cleanBody}`;
  lead.notes = (lead.notes ? lead.notes + '\n\n' : '') + noteEntry;

  // 3. Seguimiento automático +2 días
  if (!lead.next_contact) {
    const d = new Date(); d.setDate(d.getDate() + 2);
    lead.next_contact = d.toISOString().slice(0,10);
    addActivityLog(lead.id, `📅 Seguimiento auto: ${d.toLocaleDateString('es-ES')}`);
  }

  // 4. Registrar en emailHistory como inbound
  emailHistory.unshift({
    id: Date.now() + Math.random(),
    leadId: lead.id,
    company: lead.company,
    email: lead.email,
    segment: lead.segment,
    date: new Date().toISOString(),
    status: 'Respuesta recibida',
    subject,
    notes: cleanBody.slice(0, 200),
    direction: 'inbound',
  });
  localStorage.setItem('gordi_email_history', JSON.stringify(emailHistory));

  lead.score = recalculateLeadScore(lead);
  saveLeads(); renderAll(); renderTracking();
  updateFollowupBadge();

  // Visual feedback and refresh drawer
  showToast(`📬 Respuesta registrada — "${subject.slice(0,40)}"`);

  // Reset paste zone
  ta.value = '';
  zone.classList.remove('expanded','has-content');
  if (btn) { btn.textContent = '✅ Registrar respuesta'; btn.disabled = false; btn.style.display = 'none'; }
  const hint = document.getElementById(`drawer-paste-hint-${leadId}`);
  if (hint) hint.style.display = 'block';

  // Re-render drawer to show new email in thread
  renderDrawer();
}

// ============================================================
// BANDEJA OUTLOOK — Importar emails pegados (v2.5)
// ============================================================

let _inboxParsed  = [];   // emails parseados del paste
let _inboxMatched = [];   // emails con lead encontrado
let _inboxApplied = new Set();

// ── Helpers de parseo ─────────────────────────────────────────────────────────
function parseEmailsFromText(raw) {
  const emails = [];

  // Strategy 1: buscar bloques separados por líneas típicas de Outlook
  // "De: nombre <email@..." o "From: ..."
  const fromPatterns = [
    /(?:De|From)\s*:\s*(.+?)\s*[<\[(]([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})[>\])]/gi,
    /([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g,
  ];

  // Split by email separators
  const separators = /(?=(?:De|From|Para|To|Asunto|Subject|Fecha|Date|Enviado|Sent)\s*:)/gi;
  const blocks = raw.split(/\n{2,}(?=(?:De|From)\s*:)/i).filter(b => b.trim().length > 20);

  const seen = new Set();

  for (const block of blocks) {
    // Extract from/email
    const fromMatch = block.match(/(?:De|From)\s*:\s*(.+?)(?:\n|$)/i);
    const emailMatch = block.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/);
    const subjectMatch = block.match(/(?:Asunto|Subject)\s*:\s*(.+?)(?:\n|$)/i);
    const dateMatch = block.match(/(?:Fecha|Date|Enviado|Sent)\s*:\s*(.+?)(?:\n|$)/i);

    if (!emailMatch) continue;
    const email = emailMatch[1].toLowerCase().trim();
    if (seen.has(email)) continue;
    seen.add(email);

    // Extract name from "De: Nombre <email>"
    let name = '';
    if (fromMatch) {
      name = fromMatch[1].replace(/<.*?>/, '').replace(/["']/g, '').trim();
      if (name.toLowerCase().includes('@')) name = '';
    }

    // Extract body (first 400 chars after headers)
    const headerEnd = block.search(/\n\n/);
    const body = headerEnd > 0 ? block.slice(headerEnd).trim().slice(0, 400) : '';

    emails.push({
      email,
      name: name || email.split('@')[0],
      subject: subjectMatch ? subjectMatch[1].trim() : '(sin asunto)',
      date: dateMatch ? dateMatch[1].trim() : new Date().toLocaleDateString('es-ES'),
      body: body.replace(/\n+/g, ' ').trim(),
      raw: block.trim(),
    });
  }

  // Fallback: just extract all emails if no blocks found
  if (!emails.length) {
    const allEmails = [...new Set(raw.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/gi) || [])];
    allEmails.forEach(em => {
      emails.push({
        email: em.toLowerCase(),
        name: em.split('@')[0],
        subject: '(sin asunto detectado)',
        date: new Date().toLocaleDateString('es-ES'),
        body: '',
        raw: em,
      });
    });
  }

  return emails;
}

function matchEmailToLead(emailAddr) {
  const norm = s => (s||'').toLowerCase().trim();
  // Exact match by email
  return leads.find(l => norm(l.email) === norm(emailAddr) && !l.archived) || null;
}

// ── UI handlers ───────────────────────────────────────────────────────────────
function onInboxPaste(textarea) {
  const val = textarea.value.trim();
  const btn = document.getElementById('inbox-process-btn');
  const hint = document.getElementById('inbox-paste-hint');
  const clearBtn = document.getElementById('inbox-clear-btn');
  const emptyState = document.getElementById('inbox-empty-state');

  btn.disabled = val.length < 10;
  hint.style.display = val.length > 0 ? 'block' : 'none';
  clearBtn.style.display = val.length > 0 ? 'inline-flex' : 'none';
  emptyState.style.display = val.length > 0 ? 'none' : 'flex';
  document.getElementById('inbox-char-count').textContent = val.length.toLocaleString('es-ES');
  document.getElementById('inbox-results-panel').style.display = 'none';
}

function clearInboxPaste() {
  document.getElementById('inbox-paste-area').value = '';
  document.getElementById('inbox-results-panel').style.display = 'none';
  document.getElementById('inbox-empty-state').style.display = 'flex';
  document.getElementById('inbox-paste-hint').style.display = 'none';
  document.getElementById('inbox-clear-btn').style.display = 'none';
  document.getElementById('inbox-process-btn').disabled = true;
  _inboxParsed = []; _inboxMatched = []; _inboxApplied.clear();
}

async function processInboxEmails() {
  const raw = document.getElementById('inbox-paste-area').value.trim();
  if (!raw) return;

  const btn = document.getElementById('inbox-process-btn');
  btn.textContent = '⏳ Analizando...';
  btn.disabled = true;

  // Parse emails from pasted text
  _inboxParsed = parseEmailsFromText(raw);

  // If we have Gemini, use AI to improve extraction
  const geminiKey = localStorage.getItem('gordi_gemini_key');
  if (geminiKey && _inboxParsed.length === 0) {
    try {
      const prompt = `Analiza este texto que contiene uno o varios emails de Outlook y extrae los datos de cada email.
Responde SOLO en JSON válido (array): [{"email":"remitente@empresa.com","name":"Nombre Remitente","subject":"Asunto","date":"fecha","body":"primeras 150 palabras del cuerpo del email"}]
Si no hay emails claros, devuelve [].
TEXTO:\n${raw.slice(0, 3000)}`;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ contents:[{parts:[{text:prompt}]}] }),
          signal: AbortSignal.timeout(15000) }
      );
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const aiParsed = JSON.parse(jsonMatch[0]);
        if (aiParsed.length > 0) _inboxParsed = aiParsed;
      }
    } catch(e) { /* fallback to regex parse */ }
  }

  // Cross-reference with leads
  _inboxMatched = _inboxParsed.map(em => ({
    ...em,
    lead: matchEmailToLead(em.email),
  }));

  renderInboxResults();
  btn.textContent = '✨ Procesar con IA';
  btn.disabled = false;
}

function renderInboxResults() {
  const panel = document.getElementById('inbox-results-panel');
  const list  = document.getElementById('inbox-results-list');
  const nomatchPanel = document.getElementById('inbox-nomatch-panel');
  const nomatchList  = document.getElementById('inbox-nomatch-list');
  const countEl = document.getElementById('inbox-match-count');

  const matched   = _inboxMatched.filter(e => e.lead);
  const unmatched = _inboxMatched.filter(e => !e.lead);

  countEl.textContent = `${matched.length} coincidencia${matched.length!==1?'s':''} · ${unmatched.length} sin match`;

  // Update badge
  updateInboxBadge(matched.length);

  // Render matched
  list.innerHTML = matched.length ? matched.map((em, i) => {
    const l = em.lead;
    const initials = (em.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const applied = _inboxApplied.has(em.email);
    return `<div class="inbox-match-card matched ${applied?'applied':''}" id="imatch-${i}">
      <div class="inbox-match-avatar">${initials}</div>
      <div class="inbox-match-info">
        <div class="inbox-match-from">${em.name} <span style="font-weight:400;color:var(--text-dim);font-size:.72rem">&lt;${em.email}&gt;</span></div>
        <div class="inbox-match-sub">📧 ${em.subject} &nbsp;·&nbsp; 🗓️ ${em.date}</div>
        ${em.body ? `<div class="inbox-match-body">${em.body.slice(0,160)}${em.body.length>160?'…':''}</div>` : ''}
        <div class="inbox-match-lead">🎯 Lead: ${l.company} — ${l.name} · Estado actual: <strong>${l.status}</strong></div>
      </div>
      <div class="inbox-match-actions">
        ${applied
          ? `<span style="font-size:.72rem;color:var(--success)">✅ Aplicado</span>
             <button class="btn-action btn-sm" onclick="openReplyModal(${i})" style="white-space:nowrap;background:rgba(99,102,241,.15);color:#a78bfa;border:1px solid rgba(99,102,241,.3)">✨ Contestar</button>`
          : `<button class="btn-action btn-sm" onclick="applySingleMatch(${i})" style="white-space:nowrap">✅ Aplicar</button>
             <button class="btn-action btn-sm" onclick="openLeadDrawer('${l.id}')" style="white-space:nowrap">Ver lead</button>
             <button class="btn-action btn-sm" onclick="openReplyModal(${i})" style="white-space:nowrap;background:rgba(99,102,241,.15);color:#a78bfa;border:1px solid rgba(99,102,241,.3)">✨ Contestar</button>`
        }
      </div>
    </div>`;
  }).join('') : '<div style="font-size:.82rem;color:var(--text-muted);padding:.5rem">Ningún email coincide con leads de tu CRM.</div>';

  // Render unmatched
  if (unmatched.length) {
    nomatchPanel.style.display = 'block';
    nomatchList.innerHTML = unmatched.map(em => `
      <div class="inbox-match-card nomatch" style="padding:.6rem 1rem">
        <div class="inbox-match-avatar" style="width:30px;height:30px;font-size:.72rem">${(em.name||'?')[0].toUpperCase()}</div>
        <div class="inbox-match-info">
          <div class="inbox-match-from" style="font-size:.8rem">${em.name} &lt;${em.email}&gt;</div>
          <div class="inbox-match-sub">${em.subject}</div>
        </div>
        <button class="btn-action btn-sm" onclick="createLeadFromInbox('${em.email}','${(em.name||'').replace(/'/g,'')}','${(em.subject||'').replace(/'/g,'').slice(0,60)}')" style="white-space:nowrap;flex-shrink:0">+ Crear lead</button>
      </div>`).join('');
  } else {
    nomatchPanel.style.display = 'none';
  }

  document.getElementById('inbox-apply-btn').style.display = matched.length ? 'inline-flex' : 'none';
  panel.style.display = 'block';
}

function applyInboxMatch(emailAddr, leadId, subject, body, date) {
  const lead = leads.find(l => l.id == leadId);
  if (!lead) return;

  // 1. Cambiar estado (con confirmación)
  const oldStatus = lead.status;
  const _applyResp2 = () => {
    if (!['Respuesta del cliente','Visita','Entrega de presupuesto','Cerrado'].includes(lead.status)) {
      lead.status = 'Respuesta del cliente';
      lead.status_date = new Date().toISOString();
      addActivityLog(lead.id, `Estado cambiado: ${oldStatus} → Respuesta del cliente`);
    }
  };
  if (!['Respuesta del cliente','Visita','Entrega de presupuesto','Cerrado'].includes(lead.status)) {
    confirmStatusChange(lead, 'Respuesta del cliente', _applyResp2);
  } else {
    _applyResp2();
  }

  // 2. Guardar extracto en notas
  const ts = `[${new Date().toLocaleDateString('es-ES',{day:'2-digit',month:'short'})}]`;
  const noteEntry = `${ts} 📬 Respuesta recibida — Asunto: "${subject}"${body ? '\n' + body.slice(0,200) : ''}`;
  lead.notes = (lead.notes ? lead.notes + '\n' : '') + noteEntry;

  // 3. Programar seguimiento automático (2 días)
  if (!lead.next_contact) {
    const d = new Date(); d.setDate(d.getDate() + 2);
    lead.next_contact = d.toISOString().slice(0,10);
    addActivityLog(lead.id, `📅 Seguimiento auto: ${d.toLocaleDateString('es-ES')}`);
  }

  // 4. Registrar en emailHistory como recibido
  emailHistory.unshift({
    id: Date.now() + Math.random(),
    leadId: lead.id,
    company: lead.company,
    email: emailAddr,
    segment: lead.segment,
    date: new Date().toISOString(),
    status: 'Respuesta recibida',
    subject: subject || '(respuesta)',
    notes: body ? body.slice(0,200) : '',
    direction: 'inbound',
  });
  localStorage.setItem('gordi_email_history', JSON.stringify(emailHistory));

  lead.score = recalculateLeadScore(lead);
  saveLeads(); renderAll(); renderTracking();
  updateFollowupBadge();
}

function applySingleMatch(idx) {
  const em = _inboxMatched[idx];
  if (!em?.lead) return;
  applyInboxMatch(em.email, em.lead.id, em.subject, em.body, em.date);
  _inboxApplied.add(em.email);
  showToast(`✅ ${em.lead.company} → Respuesta del cliente`);
  renderInboxResults();
}

function applyInboxMatches() {
  const matched = _inboxMatched.filter(e => e.lead && !_inboxApplied.has(e.email));
  if (!matched.length) { showToast('Nada nuevo que aplicar'); return; }
  matched.forEach(em => {
    applyInboxMatch(em.email, em.lead.id, em.subject, em.body, em.date);
    _inboxApplied.add(em.email);
  });
  showToast(`📬 ${matched.length} lead${matched.length>1?'s':''} actualizados como "Respuesta del cliente"`);
  renderInboxResults();
}

function createLeadFromInbox(email, name, subject) {
  const now = new Date().toISOString();
  const newLead = {
    id: Date.now() + Math.random(),
    name: name || email.split('@')[0],
    company: name || email.split('@')[0],
    email, phone:'', segment:'Retail',
    website:'', signal:`📬 Respondió a email — Asunto: "${subject}"`,
    score: 30, status:'Respuesta del cliente',
    date: now, status_date: now,
    notes: `📬 Lead creado desde respuesta de email\nAsunto: "${subject}"`,
    tags:['inbox'], budget:0,
    next_contact: (() => { const d=new Date(); d.setDate(d.getDate()+2); return d.toISOString().slice(0,10); })(),
    source:'inbox', signals:['📬 Respuesta de email detectada'],
    activity:[{action:'📬 Lead creado desde respuesta de email', date:now}],
    enrichSource:['Outlook'], rating:null, ratingCount:0,
    logo:'', instagram:'', facebook:'', linkedin:'', twitter:'',
    decision_maker:'', archived:false,
  };
  newLead.score = recalculateLeadScore(newLead);
  leads.push(newLead);
  saveLeads(); renderLeads(); updateStats(); updateStreakData();
  showToast(`✅ Lead creado: ${newLead.company}`);
  openLeadDrawer(newLead.id);
}

function updateInboxBadge(count) {
  const badge = document.getElementById('inbox-badge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 9 ? '9+' : count;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

// ============================================================
// MEJORAS DE USUARIO v2.4
// ============================================================

// ── MEJORA 1: Registro de llamada por voz ─────────────────────────────────────
let _voiceRecognition = null;
let _voiceTranscript  = '';
let _voiceLeadResult  = null;

function openVoiceModal() {
  document.getElementById('voice-modal').classList.add('open');
  _voiceTranscript = '';
  _voiceLeadResult = null;
  document.getElementById('voice-transcript').textContent = 'Pulsa "Iniciar" y habla...';
  document.getElementById('voice-result').style.display = 'none';
  document.getElementById('voice-process-btn').style.display = 'none';
  document.getElementById('voice-save-btn').style.display = 'none';
  document.getElementById('voice-start-btn').style.display = 'inline-flex';
  document.getElementById('voice-orb').classList.remove('listening');
}

function closeVoiceModal() {
  document.getElementById('voice-modal').classList.remove('open');
  if (_voiceRecognition) { try { _voiceRecognition.stop(); } catch(e) {} }
}

function startVoiceRecording() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('⚠️ Tu navegador no soporta reconocimiento de voz. Usa Chrome.');
    return;
  }
  _voiceRecognition = new SpeechRecognition();
  _voiceRecognition.lang = 'es-ES';
  _voiceRecognition.continuous = true;
  _voiceRecognition.interimResults = true;

  document.getElementById('voice-orb').classList.add('listening');
  document.getElementById('voice-start-btn').textContent = '⏹ Detener';
  document.getElementById('voice-start-btn').onclick = stopVoiceRecording;
  document.getElementById('voice-transcript').textContent = 'Escuchando...';

  _voiceRecognition.onresult = (e) => {
    let interim = '', final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) final += e.results[i][0].transcript;
      else interim += e.results[i][0].transcript;
    }
    _voiceTranscript += final;
    document.getElementById('voice-transcript').textContent = (_voiceTranscript + interim) || 'Escuchando...';
  };

  _voiceRecognition.onerror = (e) => {
    showToast('Error de micrófono: ' + e.error);
    stopVoiceRecording();
  };

  _voiceRecognition.start();
}

function stopVoiceRecording() {
  if (_voiceRecognition) { try { _voiceRecognition.stop(); } catch(e) {} }
  document.getElementById('voice-orb').classList.remove('listening');
  document.getElementById('voice-start-btn').textContent = '🎙️ Iniciar';
  document.getElementById('voice-start-btn').onclick = startVoiceRecording;
  if (_voiceTranscript.trim().length > 5) {
    document.getElementById('voice-process-btn').style.display = 'inline-flex';
  }
}

async function processVoiceNote() {
  const transcript = _voiceTranscript.trim();
  if (!transcript) return;
  const geminiKey = localStorage.getItem('gordi_gemini_key');
  const apiKey    = localStorage.getItem('gordi_api_key');
  if (!geminiKey && !apiKey) { showToast('⚠️ Necesitas configurar una API key'); return; }

  document.getElementById('voice-process-btn').textContent = '⏳ Procesando...';
  document.getElementById('voice-process-btn').disabled = true;

  const prompt = `Analiza este dictado de voz de un comercial después de una llamada/visita y extrae:
1. Nombre de la empresa mencionada (o null si no se menciona)
2. Nuevo estado del lead (elige uno: Contactado/Respuesta del cliente/Visita/Entrega de presupuesto/Cerrado/No interesa — o null)
3. Nota estructurada en 2-4 frases claras con lo esencial: qué pasó, qué acordaron, próximos pasos
4. Fecha de próximo contacto sugerida en formato YYYY-MM-DD (o null)

Responde SOLO en JSON válido: {"company":"...","status":null,"note":"...","next_contact":null}

Dictado: "${transcript.replace(/"/g, "'")}"`;

  try {
    let responseText = '';
    if (geminiKey) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ contents:[{ parts:[{ text: prompt }] }] }),
          signal: AbortSignal.timeout(12000) }
      );
      const data = await res.json();
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error('No JSON');
    _voiceLeadResult = JSON.parse(jsonMatch[0]);

    const r = _voiceLeadResult;
    document.getElementById('voice-result').innerHTML =
      `<div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--primary);margin-bottom:.4rem">Resultado de la IA</div>` +
      (r.company ? `<div>🏢 <strong>${r.company}</strong></div>` : '') +
      (r.status  ? `<div>📌 Estado → <strong>${r.status}</strong></div>` : '') +
      `<div>📝 ${r.note}</div>` +
      (r.next_contact ? `<div>📅 Próximo contacto: <strong>${r.next_contact}</strong></div>` : '');
    document.getElementById('voice-result').style.display = 'block';
    document.getElementById('voice-save-btn').style.display = 'inline-flex';
  } catch(err) {
    showToast('Error procesando: ' + err.message);
  } finally {
    document.getElementById('voice-process-btn').textContent = '✨ Procesar con IA';
    document.getElementById('voice-process-btn').disabled = false;
  }
}

function saveVoiceNote() {
  if (!_voiceLeadResult) return;
  const r = _voiceLeadResult;

  // Try to match to existing lead by company name
  let lead = null;
  if (r.company) {
    const norm = s => (s||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,25);
    lead = leads.find(l => norm(l.company) === norm(r.company) || l.company.toLowerCase().includes(r.company.toLowerCase().split(' ')[0]));
  }

  if (lead) {
    const ts = `[${new Date().toLocaleDateString('es-ES',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}] 🎙️ `;
    lead.notes = (lead.notes ? lead.notes + '\n' : '') + ts + r.note;
    if (r.status && STATUS_LIST.includes(r.status)) {
      const old = lead.status;
      const _applyVoice = () => {
        lead.status = r.status;
        lead.status_date = new Date().toISOString();
        addActivityLog(lead.id, `Estado cambiado por voz: ${old} → ${r.status}`);
      };
      if (old !== r.status) {
        confirmStatusChange(lead, r.status, _applyVoice);
      }
    }
    if (r.next_contact && !lead.next_contact) lead.next_contact = r.next_contact;
    addActivityLog(lead.id, `🎙️ Nota de voz registrada`);
    lead.score = recalculateLeadScore(lead);
    saveLeads(); renderAll();
    showToast(`✅ Nota guardada en ${lead.company}`);
  } else {
    // No lead found — offer to create or copy note
    const note = r.note + (r.next_contact ? `\nPróximo contacto: ${r.next_contact}` : '');
    navigator.clipboard?.writeText(note);
    showToast(`📋 Lead no encontrado. Nota copiada al portapapeles.`);
  }
  closeVoiceModal();
}

// ── MEJORA 2: Modo Campo — escanear fachada ──────────────────────────────────
let _scanImageBase64 = null;
let _scanLeadData    = null;

function openScanModal() {
  document.getElementById('scan-modal').classList.add('open');
  _scanImageBase64 = null;
  _scanLeadData    = null;
  document.getElementById('scan-preview').style.display  = 'none';
  document.getElementById('scan-result').style.display   = 'none';
  document.getElementById('scan-actions').style.display  = 'none';
  document.getElementById('scan-drop-zone').style.display = 'block';
}
function closeScanModal() { document.getElementById('scan-modal').classList.remove('open'); }

function handleScanFile(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl = e.target.result;
    _scanImageBase64 = dataUrl.split(',')[1];
    const img = document.getElementById('scan-preview');
    img.src = dataUrl;
    img.style.display = 'block';
    document.getElementById('scan-drop-zone').style.display = 'none';
    await analyzeScanImage();
  };
  reader.readAsDataURL(file);
}

async function analyzeScanImage() {
  const geminiKey = localStorage.getItem('gordi_gemini_key');
  if (!geminiKey || !_scanImageBase64) { showToast('⚠️ Necesitas API Key de Gemini para analizar imágenes'); return; }

  const resultEl = document.getElementById('scan-result');
  resultEl.style.display = 'block';
  resultEl.innerHTML = '<span style="color:var(--text-dim)">⏳ Analizando imagen con IA...</span>';

  try {
    // Get current location for context
    let locationCtx = '';
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout:5000 }));
      locationCtx = `Ubicación GPS: ${pos.coords.latitude.toFixed(5)},${pos.coords.longitude.toFixed(5)}.`;
    } catch(e) {}

    const prompt = `Analiza esta imagen de una fachada o cartel de un negocio. ${locationCtx}
Extrae y responde SOLO en JSON válido:
{
  "name": "nombre del negocio",
  "segment": "uno de: Industrial/Retail/Oficinas/Hoteles/Educativo/Deportivo/Cultural/Comercial",
  "phone": "teléfono si visible o null",
  "address": "dirección si visible o null",
  "signal": "observación breve sobre estado de instalaciones/fachada (1-2 frases)",
  "score_hint": "alto/medio/bajo según aspecto de las instalaciones"
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ contents:[{ parts:[
          { inline_data:{ mime_type:'image/jpeg', data:_scanImageBase64 } },
          { text: prompt }
        ]}]}),
        signal: AbortSignal.timeout(15000) }
    );
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error('No data');
    _scanLeadData = JSON.parse(jsonMatch[0]);

    const d = _scanLeadData;
    resultEl.innerHTML = `
      <div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--warning);margin-bottom:.5rem">Lead detectado</div>
      <div>🏢 <strong>${d.name || '(nombre no detectado)'}</strong></div>
      <div>🏷️ Sector: ${d.segment || '—'}</div>
      ${d.phone   ? `<div>📞 ${d.phone}</div>`   : ''}
      ${d.address ? `<div>📍 ${d.address}</div>` : ''}
      <div style="margin-top:.4rem;font-size:.75rem;color:var(--text-muted)">📸 ${d.signal || '—'}</div>`;

    document.getElementById('scan-actions').style.display = 'flex';
  } catch(err) {
    resultEl.innerHTML = `<span style="color:var(--danger)">❌ No se pudo analizar: ${err.message}</span>`;
  }
}

function saveScanLead() {
  if (!_scanLeadData) return;
  const d = _scanLeadData;
  const now = new Date().toISOString();
  const newLead = {
    id: Date.now() + Math.random(),
    name: d.name || 'Desconocido',
    company: d.name || 'Empresa escaneada',
    email: '', phone: d.phone || '',
    segment: d.segment || 'Retail',
    website: '', signal: d.signal || '📸 Lead creado desde foto de campo',
    score: d.score_hint === 'alto' ? 65 : d.score_hint === 'bajo' ? 25 : 40,
    status: 'Pendiente', date: now, status_date: now,
    notes: `📸 Lead escaneado en campo\n${d.signal || ''}`,
    address: d.address || '', tags: ['campo'], budget: 0, next_contact: '',
    source: 'campo', signals: ['📸 Lead creado desde foto de campo'],
    activity: [{ action: '📸 Lead creado desde foto de campo', date: now }],
    enrichSource: ['Cámara'], rating: null, ratingCount: 0,
    logo: '', instagram: '', facebook: '', linkedin: '', twitter: '',
    decision_maker: '', domainAge: null, legalStatus: '',
  };
  newLead.score = recalculateLeadScore(newLead);
  leads.push(newLead);
  saveLeads(); renderLeads(); updateStats(); updateStreakData();
  showToast(`✅ Lead "${newLead.company}" creado desde foto`);
  closeScanModal();
  openLeadDrawer(newLead.id);
}

// ── MEJORA 3: Modo Enfoque ────────────────────────────────────────────────────
let _focusDone = new Set();

function openFocusMode() {
  _focusDone.clear();
  document.getElementById('focus-mode-overlay').classList.add('open');
  renderFocusList();
}
function closeFocusMode() {
  document.getElementById('focus-mode-overlay').classList.remove('open');
}

function getFocusLeads() {
  const today = new Date(); today.setHours(0,0,0,0);
  const result = [];

  // 1. Seguimientos vencidos (máx 3)
  const overdues = leads.filter(l => {
    if (l.archived || !l.next_contact) return false;
    const nc = new Date(l.next_contact); nc.setHours(0,0,0,0);
    return nc <= today;
  }).sort((a,b) => new Date(a.next_contact) - new Date(b.next_contact)).slice(0,3);
  overdues.forEach(l => result.push({ lead:l, reason:'📅 Seguimiento vencido', priority:1 }));

  // 2. Leads calientes >48h sin contactar (máx 2)
  leads.filter(l =>
    !l.archived && l.score >= 70 && l.status === 'Pendiente' &&
    !l.first_contact_date && (Date.now() - new Date(l.date)) > 48*3600000
  ).slice(0,2).forEach(l => result.push({ lead:l, reason:`🔥 ${l.score}pts sin contactar`, priority:2 }));

  // 3. Presupuestos enviados hace >7 días (máx 2)
  leads.filter(l =>
    !l.archived && l.status === 'Entrega de presupuesto' && l.status_date &&
    (Date.now() - new Date(l.status_date)) > 7*86400000
  ).slice(0,2).forEach(l => {
    if (!result.find(r => r.lead.id === l.id))
      result.push({ lead:l, reason:`💶 Presupuesto hace +7 días`, priority:3 });
  });

  return result.slice(0,5);
}

function renderFocusList() {
  const items  = getFocusLeads();
  const total  = items.length;
  const done   = _focusDone.size;
  const pct    = total ? Math.round(done/total*100) : 0;

  document.getElementById('focus-progress-fill').style.width = pct + '%';
  document.getElementById('focus-subtitle').textContent =
    done === total && total > 0
      ? '✅ ¡Todo hecho! Buen trabajo.'
      : `${done}/${total} completados`;

  const list = document.getElementById('focus-list');
  if (!items.length) {
    list.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--success)">
      <div style="font-size:3rem;margin-bottom:1rem">✅</div>
      <h3>Todo al día</h3>
      <p style="color:var(--text-muted)">No hay acciones urgentes ahora mismo.</p>
    </div>`;
    return;
  }

  list.innerHTML = items.map(({ lead:l, reason }) => {
    const isDone = _focusDone.has(l.id);
    return `<div class="focus-card" style="${isDone?'opacity:.45;':''}">
      <div class="focus-card-info">
        <div class="focus-card-company">${l.company}</div>
        <div class="focus-card-meta">${reason} · ${l.segment} · score ${l.score}</div>
        ${l.next_contact ? `<div style="font-size:.7rem;color:var(--danger);margin-top:.1rem">📅 ${new Date(l.next_contact).toLocaleDateString('es-ES',{day:'2-digit',month:'short'})}</div>` : ''}
      </div>
      <div class="focus-card-actions">
        ${l.email ? `<button class="focus-btn" onclick="generateEmail('${l.id}');focusMarkDone('${l.id}')">✉️</button>` : ''}
        <button class="focus-btn" onclick="openLeadDrawer('${l.id}')">Ver</button>
        <button class="focus-btn done" onclick="focusMarkDone('${l.id}')" title="Marcar como hecho">✅</button>
      </div>
    </div>`;
  }).join('');
}

function focusMarkDone(id) {
  _focusDone.add(id);
  // Auto-postpone next_contact by 1 day if overdue
  const lead = leads.find(l => l.id == id);
  if (lead && lead.next_contact) {
    const nc = new Date(lead.next_contact);
    const today = new Date(); today.setHours(0,0,0,0);
    if (nc <= today) {
      nc.setDate(nc.getDate() + 1);
      lead.next_contact = nc.toISOString().slice(0,10);
      saveLeads();
    }
  }
  renderFocusList();
  if (_focusDone.size === getFocusLeads().length && _focusDone.size > 0) {
    setTimeout(() => showToast('🏆 ¡Modo Enfoque completado!'), 300);
  }
}

// ── MEJORA 4: Mapa de leads ───────────────────────────────────────────────────
let _mapInstance    = null;
let _mapMarkers     = [];
let _mapInfoWindow  = null;

async function initLeadsMap() {
  const apiKey = localStorage.getItem('gordi_api_key');
  if (!apiKey) {
    document.getElementById('leads-map').innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted)">⚠️ Necesitas configurar tu API Key de Google en Ajustes para ver el mapa</div>';
    return;
  }
  if (_mapInstance) { refreshMapMarkers(); return; }

  try {
    const { Map, InfoWindow } = await google.maps.importLibrary('maps');
    const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');

    _mapInstance = new Map(document.getElementById('leads-map'), {
      center: { lat: 40.4168, lng: -3.7038 },
      zoom: 11,
      mapId: 'voltflow_leads_map',
      disableDefaultUI: false,
    });
    _mapInfoWindow = new InfoWindow();
    refreshMapMarkers();
  } catch(e) { console.warn('Maps init error:', e); }
}

function refreshMapMarkers() {
  if (!_mapInstance) return;
  _mapMarkers.forEach(m => { if (m.map) m.map = null; });
  _mapMarkers = [];

  const STATUS_COLORS = {
    'Pendiente':'#f59e0b', 'Contactado':'#0A84FF',
    'Respuesta del cliente':'#5E5CE6', 'Visita':'#34d399',
    'Entrega de presupuesto':'#f97316', 'Cerrado':'#10d97c',
    'No interesa':'#6b7280',
  };

  const leadsWithAddr = leads.filter(l => !l.archived && l.address);

  leadsWithAddr.forEach(async lead => {
    const apiKey = localStorage.getItem('gordi_api_key');
    try {
      // Geocode address
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(lead.address + ', España')}&key=${apiKey}`,
        { signal: AbortSignal.timeout(5000) }
      );
      const data = await res.json();
      if (!data.results?.[0]) return;
      const { lat, lng } = data.results[0].geometry.location;

      const color = STATUS_COLORS[lead.status] || '#5E5CE6';
      const pinEl = document.createElement('div');
      pinEl.style.cssText = `width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.4);cursor:pointer;`;

      const { AdvancedMarkerElement } = await google.maps.importLibrary('marker');
      const marker = new AdvancedMarkerElement({
        map: _mapInstance,
        position: { lat, lng },
        content: pinEl,
        title: lead.company,
      });

      marker.addListener('click', () => {
        const bc = lead.score >= 70 ? '#10d97c' : lead.score >= 40 ? '#f59e0b' : '#ef4444';
        _mapInfoWindow.setContent(`
          <div style="font-family:Inter,sans-serif;padding:.5rem;min-width:180px;background:#1a1a2e;color:#e2e8f0;border-radius:8px">
            <div style="font-weight:700;font-size:.88rem;margin-bottom:.25rem">${lead.company}</div>
            <div style="font-size:.75rem;color:#94a3b8;margin-bottom:.3rem">${lead.segment}</div>
            <div style="display:flex;gap:.4rem;align-items:center">
              <span style="font-size:.72rem;background:rgba(255,255,255,.08);padding:1px 7px;border-radius:8px;color:${color}">${lead.status}</span>
              <span style="font-size:.72rem;font-weight:700;color:${bc}">${lead.score}pts</span>
            </div>
            ${lead.next_contact ? `<div style="font-size:.7rem;color:#f59e0b;margin-top:.3rem">📅 ${new Date(lead.next_contact).toLocaleDateString('es-ES')}</div>` : ''}
            <button onclick="openLeadDrawer('${lead.id}')" style="margin-top:.5rem;background:#5E5CE6;border:none;color:white;border-radius:6px;padding:3px 10px;font-size:.72rem;cursor:pointer;width:100%">Ver detalle →</button>
          </div>`);
        _mapInfoWindow.open(_mapInstance, marker);
      });

      _mapMarkers.push(marker);
    } catch(e) { /* silently skip ungeocodeable */ }
  });
}

// Hook showView to init map when navigating to it
const _origShowView = showView;
showView = function(view) {
  _origShowView(view);
  if (view === 'map') setTimeout(initLeadsMap, 100);
};

// ── MEJORA 5: Briefing Chat de visita ─────────────────────────────────────────
let _briefingLeadId   = null;
let _briefingHistory  = [];

function openBriefingModal(leadId) {
  _briefingLeadId  = leadId;
  _briefingHistory = [];
  const lead = leads.find(l => l.id == leadId);
  if (!lead) return;

  document.getElementById('briefing-title').textContent   = `Briefing — ${lead.company}`;
  document.getElementById('briefing-subtitle').textContent = `${lead.segment} · ${lead.status} · ${lead.score}pts`;
  document.getElementById('briefing-messages').innerHTML  = '';
  document.getElementById('briefing-input').value         = '';
  document.getElementById('briefing-modal').classList.add('open');

  // Auto-generate initial briefing
  generateBriefing(lead);
}

function closeBriefingModal() {
  document.getElementById('briefing-modal').classList.remove('open');
}

function buildLeadContext(lead) {
  const seg = SEGMENT_TONE[lead.segment] || SEGMENT_TONE['Default'];
  const daysInStatus = lead.status_date ? Math.floor((Date.now()-new Date(lead.status_date))/86400000) : 0;
  const ttfc = lead.ttfc_hours ? `Primer contacto: hace ${Math.round(lead.ttfc_hours/24)} días.` : 'Sin contacto previo.';
  const prevEmails = emailHistory.filter(e => e.leadId == lead.id || e.email === lead.email).slice(0,3);
  const emailsCtx = prevEmails.length
    ? 'Emails previos: ' + prevEmails.map(e=>`"${e.subject||e.status}" (${new Date(e.date).toLocaleDateString('es-ES',{day:'2-digit',month:'short'})})`).join(', ') + '.'
    : 'Sin emails previos.';

  return `Empresa: ${lead.company}
Sector: ${lead.segment}
Score: ${lead.score}/100
Estado actual: ${lead.status} (hace ${daysInStatus} días en este estado)
Presupuesto estimado: ${lead.budget ? lead.budget.toLocaleString('es-ES')+'€' : 'no definido'}
Próximo contacto: ${lead.next_contact || 'no programado'}
Señal detectada: ${lead.signal || 'ninguna'}
${(lead.signals||[]).length ? 'Señales scraping: ' + lead.signals.slice(0,5).join(', ') + '.' : ''}
${lead.rating ? `Rating Google: ${lead.rating} (${lead.ratingCount} reseñas).` : ''}
${lead.reviewSummary ? 'Resumen reseñas: ' + lead.reviewSummary.slice(0,200) + '.' : ''}
${lead.notes ? 'Notas internas: ' + lead.notes.slice(0,300) + '.' : ''}
${ttfc}
${emailsCtx}
Tono de sector: ${seg.tone}
Pain principal: ${seg.pain}
Ángulo de venta: ${seg.angle}
Prohibido: ${seg.forbidden}`;
}

async function generateBriefing(lead) {
  const geminiKey = localStorage.getItem('gordi_gemini_key');
  const apiKey    = localStorage.getItem('gordi_api_key');
  if (!geminiKey && !apiKey) {
    appendBriefingMsg('⚠️ Necesitas una API Key de Gemini configurada en Ajustes para usar el briefing IA.', 'ai');
    return;
  }

  appendBriefingMsg('⏳ Preparando tu briefing...', 'ai');

  const context = buildLeadContext(lead);
  const prompt = `Eres un experto en ventas B2B para Voltium Madrid, empresa de instalaciones eléctricas y reformas integrales. 
Prepara un briefing CONCISO para una visita o llamada a esta empresa. Incluye:
1. 🎯 Objetivo de la reunión (1 frase)
2. 🔑 Ángulo de apertura recomendado (1-2 frases, específico para esta empresa)
3. ⚠️ Posible objeción principal y cómo rebatirla (2-3 frases)
4. 💡 Un dato o señal de esta empresa que puedes mencionar para demostrar que has investigado
5. 🚀 Cierre recomendado (qué proponer al terminar la reunión)

Sé específico, concreto, práctico. Máximo 180 palabras en total.

CONTEXTO DEL LEAD:
${context}`;

  try {
    const responseText = await callGeminiAPI(prompt, geminiKey);
    // Replace loading message
    const msgs = document.getElementById('briefing-messages');
    const lastMsg = msgs.lastElementChild;
    if (lastMsg) lastMsg.remove();
    appendBriefingMsg(responseText, 'ai');
    _briefingHistory.push({ role:'user', content: 'Genera briefing inicial' });
    _briefingHistory.push({ role:'assistant', content: responseText });
  } catch(err) {
    const msgs = document.getElementById('briefing-messages');
    const lastMsg = msgs.lastElementChild;
    if (lastMsg) lastMsg.textContent = '❌ Error generando briefing: ' + err.message;
  }
}

async function sendBriefingMessage() {
  const input = document.getElementById('briefing-input');
  const msg   = input.value.trim();
  if (!msg) return;
  input.value = '';

  appendBriefingMsg(msg, 'user');
  _briefingHistory.push({ role:'user', content: msg });

  const lead = leads.find(l => l.id == _briefingLeadId);
  const geminiKey = localStorage.getItem('gordi_gemini_key');
  if (!geminiKey || !lead) return;

  const loadingEl = appendBriefingMsg('⏳ Pensando...', 'ai');
  const context = buildLeadContext(lead);
  const historyText = _briefingHistory.slice(-6).map(h => `${h.role === 'user' ? 'Comercial' : 'Asesor'}: ${h.content}`).join('\n');

  const prompt = `Eres un experto en ventas B2B para Voltium Madrid, empresa de instalaciones eléctricas y reformas integrales. 
Ayuda al comercial con su pregunta sobre esta visita. Responde de forma directa y práctica. Máximo 120 palabras.

CONTEXTO DEL LEAD:
${context}

CONVERSACIÓN:
${historyText}

Responde la última pregunta del comercial:`;

  try {
    const responseText = await callGeminiAPI(prompt, geminiKey);
    loadingEl.textContent = responseText;
    _briefingHistory.push({ role:'assistant', content: responseText });
  } catch(err) {
    loadingEl.textContent = '❌ Error: ' + err.message;
  }
}

// ══════════════════════════════════════════════════════════════════
