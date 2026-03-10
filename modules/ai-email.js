
// ============ UTILS ============
function extractDomain(url) {
  try {
    if (!url.startsWith('http')) url = 'https://'+url;
    return new URL(url).hostname.replace('www.','');
  } catch { return null; }
}

// ══════════════════════════════════════════════════════════════════════════════
// MOTOR DE EMAIL CON IA — Lee reseñas + Claude API → Email hiperpersonalizado
// ══════════════════════════════════════════════════════════════════════════════

let aiCurrentLeadId = null;

// ── Abrir modal ───────────────────────────────────────────────────────────────
function openAiEmailModal(id) {
  aiCurrentLeadId = id;
  const lead = leads.find(l => l.id == id);
  if (!lead) return;

  const claudeKey = localStorage.getItem('gordi_claude_key');
  if (!claudeKey) {
    alert('⚠️ Necesitas configurar tu API Key de Gemini en Configuración.\n\nVe a: aistudio.google.com/apikey → Get API Key (gratis con tu cuenta Google)');
    showView('settings');
    return;
  }

  // Reset modal UI
  document.getElementById('ai-modal-title').innerText = `✨ Email IA para ${lead.company}`;
  document.getElementById('ai-modal-sub').innerText = 'Analizando reseñas con Gemini IA (gratuito)...';
  document.getElementById('ai-loading').style.display = 'block';
  document.getElementById('ai-result').style.display = 'none';
  document.getElementById('ai-error').style.display = 'none';
  setAiStep('reviews', 'pending');
  setAiStep('analyze', 'pending');
  setAiStep('write', 'pending');

  document.getElementById('ai-email-modal').style.display = 'flex';
  // Show pain picker first — analyze weak points, then let user choose
  showPainPicker(lead);
}

// ─── NUEVAS FUNCIONES ───────────────────────────────────────────────────────

// ── copySubjectOption ────────────────────────────────────────────────────────
function copySubjectOption(subject) {
  navigator.clipboard.writeText(subject).then(() => {
    showToast('📋 Asunto copiado: ' + subject.slice(0, 50) + (subject.length > 50 ? '…' : ''));
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = subject; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('📋 Asunto copiado');
  });
}

// ── PAIN PICKER ──────────────────────────────────────────────────────────────
let _painPickerLead = null;
let _selectedPainIndex = null;
let _painPickerOptions = [];

async function showPainPicker(lead) {
  _painPickerLead = lead;
  _selectedPainIndex = null;
  _painPickerOptions = [];

  // Show pain picker, hide everything else
  document.getElementById('ai-pain-picker').style.display = 'block';
  document.getElementById('ai-loading').style.display = 'none';
  document.getElementById('ai-result').style.display = 'none';
  document.getElementById('ai-error').style.display = 'none';
  document.getElementById('btn-confirm-pain').disabled = true;

  const optionsEl = document.getElementById('ai-pain-options');
  optionsEl.innerHTML = `<div style="text-align:center;padding:1.5rem;font-size:.8rem;color:var(--text-dim)">
    <div class="spinner" style="margin:0 auto .75rem"></div>Analizando puntos débiles de ${lead.company}…</div>`;

  try {
    const claudeKey = localStorage.getItem('gordi_claude_key');
    // Build a compact context from existing lead data
    const signals = (lead.signals || []).slice(0, 6).map(s => '  · ' + s).join('\n');
    const reviews = lead.reviewSummary
      ? lead.reviewSummary.split('\n').slice(0, 5).join('\n')
      : '';
    const segT = (typeof SEGMENT_TONE !== 'undefined' && SEGMENT_TONE[lead.segment]) || {};

    const prompt = `Eres un experto en ventas B2B. Analiza esta empresa y dame EXACTAMENTE 3 posibles ángulos de ataque para un primer email de prospección de Voltium Madrid (empresa de reformas/instalaciones).

EMPRESA: ${lead.company} | Sector: ${lead.segment} | Ciudad: ${lead.address || 'Madrid'}
Rating Google: ${lead.rating ? lead.rating + '/5 (' + lead.ratingCount + ' reseñas)' : 'sin datos'}
Descripción: ${lead.description || 'N/A'}
${signals ? 'Señales detectadas:\n' + signals : ''}
${reviews ? 'Reseñas reales:\n' + reviews : ''}
${segT.pain ? 'Dolor típico del sector: ' + segT.pain : ''}

Para cada ángulo, dame:
- Un título corto (max 8 palabras) que resuma el enfoque
- Una frase de por qué este ángulo es potente para esta empresa concreta (max 25 palabras)
- El tipo de gancho a usar: reseñas / urgencia / oportunidad / problema visible / eficiencia

Responde SOLO JSON válido (sin markdown):
{"options":[
  {"title":"...", "why":"...", "hook":"reseñas|urgencia|oportunidad|problema|eficiencia", "priority":1},
  {"title":"...", "why":"...", "hook":"...", "priority":2},
  {"title":"...", "why":"...", "hook":"...", "priority":3}
]}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${claudeKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 600 } })
      }
    );
    const data = await res.json();
    let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    raw = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);
    _painPickerOptions = parsed.options || [];

    const hookEmoji = { reseñas:'⭐', urgencia:'🔥', oportunidad:'💎', problema:'⚠️', eficiencia:'⚡' };
    optionsEl.innerHTML = _painPickerOptions.map((opt, i) => `
      <div onclick="selectPainOption(this, ${i})"
        style="cursor:pointer;padding:.85rem 1rem;border-radius:10px;border:1.5px solid var(--glass-border);
        background:var(--glass);transition:all .15s" class="pain-opt-card">
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.25rem">
          <span style="font-size:.85rem">${hookEmoji[opt.hook] || '🎯'}</span>
          <span style="font-weight:700;font-size:.85rem;color:var(--text)">${opt.title}</span>
          ${opt.priority === 1 ? '<span style="font-size:.65rem;background:rgba(99,102,241,.15);color:#a78bfa;padding:.1rem .4rem;border-radius:5px;font-weight:600">⭐ Top pick</span>' : ''}
        </div>
        <div style="font-size:.75rem;color:var(--text-dim);line-height:1.45">${opt.why}</div>
      </div>`).join('');
    document.getElementById('btn-confirm-pain').disabled = true;

  } catch(e) {
    console.warn('Pain picker error:', e);
    // On error, go directly to generation
    hidePainPicker();
    runAiEmailGeneration(lead);
  }
}

function selectPainOption(el, idx) {
  document.querySelectorAll('.pain-opt-card').forEach(c => {
    c.style.borderColor = 'var(--glass-border)';
    c.style.background = 'var(--glass)';
  });
  el.style.borderColor = 'var(--primary)';
  el.style.background = 'rgba(10,132,255,.06)';
  _selectedPainIndex = idx;
  document.getElementById('btn-confirm-pain').disabled = false;
}

async function confirmPainAndGenerate() {
  if (_selectedPainIndex === null || !_painPickerLead) return;
  const chosen = _painPickerOptions[_selectedPainIndex];
  hidePainPicker();
  // Generate 3 subject line options based on chosen pain BEFORE full email
  await preGenerateSubjects(_painPickerLead, chosen);
  runAiEmailGeneration(_painPickerLead, chosen);
}

async function preGenerateSubjects(lead, painCtx) {
  const claudeKey = localStorage.getItem('gordi_claude_key');
  if (!claudeKey || !painCtx) return;
  try {
    const prompt = `Empresa: ${lead.company} | Sector: ${lead.segment}
Ángulo elegido: "${painCtx.title}" — ${painCtx.why}

Genera EXACTAMENTE 3 asuntos de email B2B para este ángulo. Cortos, sin spam, directos.
Responde SOLO JSON: {"subjects":["asunto1","asunto2","asunto3"]}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${claudeKey}`,
      { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.7,maxOutputTokens:200} }) }
    );
    const data = await res.json();
    let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    raw = raw.replace(/```json|```/g,'').trim();
    const parsed = JSON.parse(raw);
    const subjects = parsed.subjects || [];
    if (!subjects.length) return;

    // Show subjects immediately in the result area (partial preview)
    const subjectLabels = ['💛 Emocional', '📊 Racional', '🎯 Intriga'];
    const subjectList = document.getElementById('ai-subjects-list');
    if (subjectList) {
      subjectList.innerHTML = subjects.map((s, i) => `
        <div onclick="selectAiSubject(this,'${s.replace(/'/g,"&#39;")}')"
          style="cursor:pointer;padding:.5rem .75rem;border-radius:8px;border:1px solid var(--glass-border);
          background:var(--glass);font-size:.82rem;display:flex;gap:.5rem;align-items:center;justify-content:space-between;
          transition:border-color .15s,background .15s"
          class="subject-option${i===0?' selected-subject':''}">
          <div style="display:flex;gap:.5rem;align-items:flex-start;flex:1">
            <span style="font-size:.7rem;color:var(--text-muted);white-space:nowrap;padding-top:1px">${subjectLabels[i]||'✏️'}</span>
            <span>${s}</span>
          </div>
          <button onclick="event.stopPropagation();copySubjectOption('${s.replace(/'/g,"&#39;")}');" title="Copiar asunto"
            style="background:none;border:none;cursor:pointer;font-size:.75rem;color:var(--text-dim);padding:.1rem .3rem;border-radius:4px;flex-shrink:0"
            onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-dim)'">📋</button>
        </div>`).join('');
      const firstOut = document.getElementById('ai-subject-out');
      if (firstOut) firstOut.value = subjects[0] || '';
    }
  } catch(e) {
    console.warn('preGenerateSubjects error:', e);
  }
}

function skipPainPicker() {
  if (!_painPickerLead) return;
  hidePainPicker();
  runAiEmailGeneration(_painPickerLead, null);
}

function hidePainPicker() {
  document.getElementById('ai-pain-picker').style.display = 'none';
  // Show the loading state so screen isn't blank while email generates
  document.getElementById('ai-loading').style.display = 'block';
  document.getElementById('ai-result').style.display  = 'none';
  document.getElementById('ai-error').style.display   = 'none';
}

// ── CONTACT CALENDAR GENERATION ──────────────────────────────────────────────
let _contactCalendarLead = null;
let _contactCalendarData = [];

async function generateContactCalendar(lead) {
  _contactCalendarLead = lead;
  _contactCalendarData = [];

  const panel = document.getElementById('contact-calendar-panel');
  const listEl = document.getElementById('contact-calendar-list');
  if (!panel || !listEl) return;

  panel.style.display = 'block';
  listEl.innerHTML = `<div style="font-size:.75rem;color:var(--text-dim);padding:.5rem;text-align:center">
    <span class="spinner" style="display:inline-block;margin-right:.3rem"></span>Generando calendario de seguimiento…</div>`;

  try {
    const claudeKey = localStorage.getItem('gordi_claude_key');
    const segT = (typeof SEGMENT_TONE !== 'undefined' && SEGMENT_TONE[lead.segment]) || {};

    const prompt = `Eres un experto en ventas B2B. Genera un calendario de seguimiento para cuando el lead NO contesta el primer email.

LEAD: ${lead.company} | Sector: ${lead.segment}
Tono del sector: ${segT.tone || 'profesional y directo'}
Dolor principal: ${segT.pain || 'mejora de instalaciones'}

Genera 5 touchpoints de seguimiento, distribuidos en los próximos 30 días. Cada uno con un enfoque diferente y canal distinto cuando sea posible.

Reglas:
- Día 0 = hoy (primer email ya enviado)
- Cada touchpoint debe tener un ángulo DISTINTO (no repetir el mismo argumento)
- Alterna email y WhatsApp cuando sea apropiado
- El último touchpoint debe ser el "break-up" (cierre elegante)
- Asunto/texto sugerido MUY breve (max 12 palabras)

Responde SOLO JSON válido:
{"touchpoints":[
  {"day":3,"channel":"email","angle":"Aportar dato nuevo relevante","subject":"Frase sugerida del asunto","note":"Por qué este ángulo ahora"},
  {"day":7,"channel":"whatsapp","angle":"...","subject":"...","note":"..."},
  {"day":12,"channel":"email","angle":"...","subject":"...","note":"..."},
  {"day":20,"channel":"email","angle":"...","subject":"...","note":"..."},
  {"day":30,"channel":"email","angle":"Cierre elegante","subject":"...","note":"Abrir puerta de salida"}
]}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${claudeKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 800 } })
      }
    );
    const data = await res.json();
    let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    raw = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);
    _contactCalendarData = parsed.touchpoints || [];
    renderContactCalendar();

  } catch(e) {
    console.warn('Calendar generation error:', e);
    listEl.innerHTML = `<div style="font-size:.75rem;color:var(--danger);padding:.5rem">Error generando calendario. La IA puede estar no disponible.</div>`;
  }
}

function renderContactCalendar() {
  const listEl = document.getElementById('contact-calendar-list');
  if (!listEl || !_contactCalendarData.length) return;

  const chIcon = { email:'✉️', whatsapp:'💬', linkedin:'🔗', llamada:'📞' };
  const today = new Date();

  listEl.innerHTML = _contactCalendarData.map((tp, i) => {
    const date = new Date(today); date.setDate(today.getDate() + tp.day);
    const dateStr = date.toLocaleDateString('es-ES', { weekday:'short', day:'numeric', month:'short' });
    const isBreakup = i === _contactCalendarData.length - 1;
    return `<div style="display:flex;gap:.75rem;align-items:flex-start;padding:.6rem .75rem;
      border-radius:8px;border:1px solid ${isBreakup ? 'rgba(239,68,68,.25)' : 'var(--glass-border)'};
      background:${isBreakup ? 'rgba(239,68,68,.04)' : 'var(--glass)'};font-size:.78rem">
      <div style="text-align:center;min-width:42px">
        <div style="font-weight:700;font-size:.95rem;color:var(--primary)">+${tp.day}d</div>
        <div style="font-size:.65rem;color:var(--text-dim)">${dateStr}</div>
      </div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:.4rem;margin-bottom:.15rem">
          <span>${chIcon[tp.channel] || '📌'}</span>
          <span style="font-weight:600;color:var(--text)">${tp.subject}</span>
          ${isBreakup ? '<span style="font-size:.65rem;background:rgba(239,68,68,.12);color:#f87171;padding:.1rem .35rem;border-radius:4px">Break-up</span>' : ''}
        </div>
        <div style="color:var(--text-dim);font-size:.72rem">${tp.angle} — <em>${tp.note}</em></div>
      </div>
    </div>`;
  }).join('');
}

async function regenerateContactCalendar() {
  if (_contactCalendarLead) await generateContactCalendar(_contactCalendarLead);
}

function applyContactCalendar() {
  if (!_contactCalendarLead || !_contactCalendarData.length) return;
  const lead = leads.find(l => l.id == _contactCalendarLead.id);
  if (!lead) return;

  // Set next_contact to first touchpoint date
  const firstTp = _contactCalendarData[0];
  if (firstTp) {
    const d = new Date(); d.setDate(d.getDate() + firstTp.day);
    lead.next_contact = d.toISOString().slice(0, 10);
  }

  // Save calendar in lead notes/activity
  const calStr = _contactCalendarData.map(tp => {
    const d = new Date(); d.setDate(d.getDate() + tp.day);
    return `+${tp.day}d (${d.toLocaleDateString('es-ES',{day:'numeric',month:'short'})}) ${tp.channel.toUpperCase()}: "${tp.subject}"`;
  }).join('\n');
  addActivityLog(lead.id, `📅 Calendario de seguimiento generado:\n${calStr}`);
  saveLeads();
  showToast('✅ Calendario aplicado — próximo contacto en ' + firstTp.day + ' días');
  document.getElementById('contact-calendar-panel').style.display = 'none';
}

// ── WHATSAPP MODAL ────────────────────────────────────────────────────────────
let _waLead = null;

function openWhatsAppModal(leadId, event) {
  if (event) event.stopPropagation();
  const lead = leads.find(l => l.id == leadId);
  if (!lead) return;
  _waLead = lead;

  const phone = lead.whatsapp || lead.phone;
  if (!phone) { showToast('⚠️ Este lead no tiene teléfono ni WhatsApp'); return; }

  // Create/show modal
  let modal = document.getElementById('wa-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'wa-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
    modal.innerHTML = `
      <div style="background:var(--bg2);border:1px solid var(--glass-border);border-radius:16px;width:min(580px,96vw);max-height:90vh;overflow-y:auto">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:1.1rem 1.4rem;border-bottom:1px solid var(--glass-border)">
          <div style="display:flex;align-items:center;gap:.6rem">
            <span style="font-size:1.2rem">💬</span>
            <div>
              <div style="font-weight:700;font-size:.9rem" id="wa-modal-title">WhatsApp IA</div>
              <div style="font-size:.7rem;color:var(--text-dim)" id="wa-modal-sub">Generando mensaje personalizado…</div>
            </div>
          </div>
          <button onclick="closeWaModal()" style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:1rem">✕</button>
        </div>
        <div id="wa-body" style="padding:1.25rem">
          <div style="text-align:center;padding:2rem">
            <div class="spinner" style="margin:0 auto .75rem"></div>
            <div style="font-size:.8rem;color:var(--text-dim)">Generando mensaje personalizado con IA…</div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
  document.getElementById('wa-modal-title').textContent = `WhatsApp para ${lead.company}`;
  document.getElementById('wa-modal-sub').textContent = `📱 ${phone} — Generando mensaje…`;
  generateWhatsAppMessage(lead);
}

function closeWaModal() {
  const m = document.getElementById('wa-modal');
  if (m) m.style.display = 'none';
}

async function generateWhatsAppMessage(lead) {
  const claudeKey = localStorage.getItem('gordi_claude_key');
  const phone = lead.whatsapp || lead.phone;
  const phoneClean = phone.replace(/[^0-9+]/g, '');
  const waBody = document.getElementById('wa-body');

  try {
    const segT = (typeof SEGMENT_TONE !== 'undefined' && SEGMENT_TONE[lead.segment]) || {};
    const prevEmails = emailHistory.filter(e => e.leadId == lead.id || e.email === lead.email).length;
    const p = getProfile();

    const prompt = `Eres un experto en ventas B2B. Escribe un mensaje de WhatsApp de prospección para ${lead.company}.

CONTEXTO:
- Empresa: ${lead.company} | Sector: ${lead.segment} | Ciudad: ${lead.address || 'Madrid'}
- Emails previos enviados: ${prevEmails}
- Rating Google: ${lead.rating ? lead.rating + '/5' : 'sin datos'}
${(lead.signals || []).slice(0, 3).map(s => '- Señal: ' + s).join('\n')}
- Tono del sector: ${segT.tone || 'profesional'}
- Dolor principal: ${segT.pain || 'mejora de instalaciones'}
- Remitente: ${p.name} de Voltium Madrid

REGLAS DEL WHATSAPP:
- Máximo 3 párrafos cortos (60-90 palabras total)
- Tono cercano pero profesional — es un mensaje directo, no un email
- Primer párrafo: quién eres + gancho (algo específico de su negocio)
- Segundo párrafo: valor concreto que puedes aportarles
- Cierre: CTA simple y no invasivo (¿te llamo 5 min esta semana?)
- NUNCA empezar con "Hola, me llamo..." — ve al grano
- Incluye un emoji ocasional (máximo 2-3 en todo el mensaje)
- Termina con tu nombre y empresa

Responde SOLO JSON: {"message":"texto del WA","opener":"frase de apertura resumida en 5 palabras"}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${claudeKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.72, maxOutputTokens: 400 } })
      }
    );
    const data = await res.json();
    let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    raw = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(raw);
    const msg = parsed.message || '';
    const waUrl = `https://wa.me/${phoneClean.startsWith('+') ? phoneClean.slice(1) : phoneClean}?text=${encodeURIComponent(msg)}`;

    waBody.innerHTML = `
      <div style="margin-bottom:1rem">
        <label style="font-size:.75rem;color:var(--text-dim);display:block;margin-bottom:.4rem">Mensaje generado — edita si lo necesitas</label>
        <textarea id="wa-text-editor" rows="7"
          style="width:100%;background:var(--bg3);border:1px solid var(--glass-border);border-radius:10px;
          padding:.85rem;font-size:.82rem;color:var(--text);resize:vertical;line-height:1.6;font-family:'Inter',sans-serif"
          >${msg}</textarea>
      </div>
      <div style="background:rgba(37,211,102,.06);border:1px solid rgba(37,211,102,.2);border-radius:8px;padding:.6rem .85rem;
        font-size:.75rem;margin-bottom:1rem;display:flex;align-items:center;gap:.4rem">
        📱 Se enviará a: <strong style="color:#25D366">${phone}</strong>
      </div>
      <div style="display:flex;gap:.6rem;flex-wrap:wrap">
        <a id="wa-send-btn" href="${waUrl}" target="_blank"
          onclick="registerWaSent()"
          style="display:inline-flex;align-items:center;gap:.4rem;background:#25D366;color:#fff;
          padding:.5rem 1.1rem;border-radius:8px;font-weight:600;font-size:.82rem;text-decoration:none;border:none;cursor:pointer">
          💬 Abrir en WhatsApp
        </a>
        <button onclick="copyWaMessage()" class="btn-outline" style="font-size:.8rem">📋 Copiar mensaje</button>
        <button onclick="regenerateWaMessage()" class="btn-outline" style="font-size:.8rem">🔄 Regenerar</button>
      </div>`;

  } catch(e) {
    console.warn('WA generation error:', e);
    const phone2 = lead.whatsapp || lead.phone;
    const phoneClean2 = phone2.replace(/[^0-9+]/g, '');
    waBody.innerHTML = `
      <div style="color:var(--danger);font-size:.8rem;margin-bottom:1rem">⚠️ No se pudo generar el mensaje con IA (comprueba la API key de Gemini).</div>
      <textarea id="wa-text-editor" rows="5" placeholder="Escribe tu mensaje de WhatsApp aquí..."
        style="width:100%;background:var(--bg3);border:1px solid var(--glass-border);border-radius:10px;
        padding:.85rem;font-size:.82rem;color:var(--text);resize:vertical;font-family:'Inter',sans-serif"></textarea>
      <div style="margin-top:.75rem;display:flex;gap:.6rem">
        <button onclick="sendWaManual()" style="background:#25D366;color:#fff;border:none;border-radius:8px;padding:.5rem 1rem;font-weight:600;cursor:pointer;font-size:.8rem">
          💬 Abrir en WhatsApp
        </button>
      </div>`;
  }
}

function sendWaManual() {
  const lead = _waLead; if (!lead) return;
  const phone = lead.whatsapp || lead.phone; if (!phone) return;
  const msg = document.getElementById('wa-text-editor')?.value || '';
  const phoneClean = phone.replace(/[^0-9+]/g, '');
  const url = `https://wa.me/${phoneClean.startsWith('+') ? phoneClean.slice(1) : phoneClean}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
  registerWaSent();
}

function regenerateWaMessage() {
  if (_waLead) {
    document.getElementById('wa-body').innerHTML = `<div style="text-align:center;padding:2rem">
      <div class="spinner" style="margin:0 auto .75rem"></div>
      <div style="font-size:.8rem;color:var(--text-dim)">Regenerando…</div></div>`;
    generateWhatsAppMessage(_waLead);
  }
}

function copyWaMessage() {
  const msg = document.getElementById('wa-text-editor')?.value || '';
  if (!msg) return;
  // Update wa-send-btn href with edited message
  const lead = _waLead; if (!lead) return;
  const phone = lead.whatsapp || lead.phone;
  const phoneClean = phone.replace(/[^0-9+]/g, '');
  const btn = document.getElementById('wa-send-btn');
  if (btn) btn.href = `https://wa.me/${phoneClean.startsWith('+') ? phoneClean.slice(1) : phoneClean}?text=${encodeURIComponent(msg)}`;
  navigator.clipboard.writeText(msg).then(() => showToast('📋 Mensaje copiado'))
    .catch(() => showToast('📋 Mensaje copiado'));
}

function registerWaSent() {
  const lead = _waLead; if (!lead) return;
  const msg = document.getElementById('wa-text-editor')?.value || '';
  addActivityLog(lead.id, `💬 WhatsApp enviado a ${lead.whatsapp || lead.phone}`);
  emailHistory.unshift({
    id: Date.now(), leadId: lead.id, company: lead.company,
    email: lead.whatsapp || lead.phone, segment: lead.segment,
    date: new Date().toISOString(), status: 'Enviado', subject: 'WhatsApp IA',
    channel: 'whatsapp', body: msg.slice(0, 200)
  });
  localStorage.setItem('gordi_email_history', JSON.stringify(emailHistory));
  if (!lead.first_contact_date) {
    lead.first_contact_date = new Date().toISOString();
    lead.ttfc_hours = Math.round((Date.now() - new Date(lead.date)) / 3600000);
  }
  saveLeads(); updateStats();
  setTimeout(() => closeWaModal(), 800);
}

function closeAiModal() {
  document.getElementById('ai-email-modal').style.display = 'none';
  aiCurrentLeadId = null;
}

// ── Control de pasos visuales ─────────────────────────────────────────────────
function setAiStep(step, state) {
  const el = document.getElementById(`aistep-${step}`);
  if (!el) return;
  el.className = `ai-step ${state}`;
  const labels = {
    reviews: { pending:'Leyendo reseñas de Google...', active:'📖 Leyendo reseñas de Google...', done:'✅ Reseñas analizadas', error:'❌ No se pudieron leer las reseñas' },
    scrape:  { pending:'Rastreando web de la empresa...', active:'🌐 Rastreando web de la empresa...', done:'✅ Web analizada', error:'⚠️ Web no accesible' },
    news:    { pending:'Buscando noticias recientes...', active:'📰 Buscando noticias y novedades...', done:'✅ Contexto actualizado', error:'⚠️ Sin noticias recientes' },
    analyze: { pending:'Analizando puntos fuertes y débiles...', active:'🔍 Analizando puntos fuertes y débiles...', done:'✅ Análisis completado', error:'❌ Error en el análisis' },
    write:   { pending:'Redactando email con copywriting...', active:'✍️ Redactando email hiperpersonalizado...', done:'✅ Email generado', error:'❌ Error al generar el email' },
  };
  const lbl = el.querySelector('.ai-step-label');
  if (lbl && labels[step]?.[state]) lbl.innerText = labels[step][state];
}

// ── Motor principal ────────────────────────────────────────────────────────────
async function runAiEmailGeneration(lead, painContext) {
  const claudeKey = localStorage.getItem('gordi_claude_key');

  // PASO 1: Reseñas de Google Places
  // MEJORA 5: Si el lead ya tiene reviewStats del enriquecimiento reciente (<24h),
  // reutilizamos esos datos y nos saltamos el fetch — ahorra una llamada Places completa.
  setAiStep('reviews', 'active');
  let reviewsData = { reviews: [], rating: lead.rating || null, ratingCount: lead.ratingCount || 0, placeId: lead.placeId || '' };
  try {
    if (lead.placeId) {
      const cacheAge = lead.reviewStats?.fetchedAt ? Date.now() - lead.reviewStats.fetchedAt : Infinity;
      const cacheValid = cacheAge < 24 * 60 * 60 * 1000 && lead.reviewSummary && lead.reviewStats;

      if (cacheValid) {
        // Reconstruir el array de reviews desde reviewSummary y adjuntar _stats del caché
        const cachedLines = (lead.reviewSummary || '').split('\n').filter(Boolean);
        const cachedReviews = cachedLines.map(line => {
          const m = line.match(/^\[(\d)[\u2605★][^\]]*\]\s*(.*)/);
          return m ? { rating: parseInt(m[1]), text: m[2].slice(0, 200), time: '', ownerResponse: null } : null;
        }).filter(Boolean);
        cachedReviews._stats = lead.reviewStats;
        reviewsData.reviews = cachedReviews;
        setAiStep('reviews', 'done');
      } else {
        const reviews = await fetchGoogleReviews(lead.placeId);
        reviewsData.reviews = reviews;
        // Persistir stats en el lead para futuras generaciones
        if (reviews._stats) {
          lead.reviewStats = reviews._stats;
          saveLeads();
        }
        setAiStep('reviews', 'done');
      }
    } else {
      setAiStep('reviews', 'done');
    }
  } catch(e) {
    console.warn('Reviews fetch failed:', e);
    setAiStep('reviews', 'done');
  }

  // PASO 2: Scraping web del lead en tiempo real
  setAiStep('scrape', 'active');
  let liveWebData = { texts: [], emails: [], phones: [], recentContent: '' };
  try {
    if (lead.website) {
      const html = await fetchWithProxy(lead.website, 10000);
      if (html && html.length > 200) {
        // Extraer textos relevantes: h1, h2, párrafos principales, meta description
        const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{20,300})["']/i)?.[1] || '';
        const h1s = [...html.matchAll(/<h1[^>]*>([^<]{5,150})<\/h1>/gi)].map(m => m[1].trim()).slice(0,3);
        const h2s = [...html.matchAll(/<h2[^>]*>([^<]{5,120})<\/h2>/gi)].map(m => m[1].trim()).slice(0,5);
        const paras = [...html.matchAll(/<p[^>]*>([^<]{40,400})<\/p>/gi)]
          .map(m => m[1].replace(/<[^>]+>/g,'').trim())
          .filter(t => !/cookie|privacidad|copyright|legal/i.test(t))
          .slice(0,4);

        // Detectar señales de actualidad en el texto
        const fullText = (h1s.join(' ') + ' ' + h2s.join(' ') + ' ' + paras.join(' ')).toLowerCase();
        const freshSignals = [];
        if (/nueva|nuevo|abrimos|apertura|inaugura|estrena/i.test(fullText)) freshSignals.push('apertura/novedad detectada');
        if (/reforma|renovaci|rehabilitac|obras/i.test(fullText)) freshSignals.push('reforma en curso o reciente');
        if (/ampliaci|expandi|crecemos|nueva sede|nuevo local/i.test(fullText)) freshSignals.push('expansión detectada');
        if (/sostenib|eficiencia energética|fotovoltaic|solar/i.test(fullText)) freshSignals.push('interés en sostenibilidad');
        if (/certificac|iso|calidad|premio|award/i.test(fullText)) freshSignals.push('foco en calidad/certificaciones');

        liveWebData = {
          metaDesc,
          h1s,
          h2s,
          paras,
          freshSignals,
          recentContent: [metaDesc, ...h1s, ...h2s, ...paras].filter(Boolean).join(' | ').slice(0, 800)
        };
        setAiStep('scrape', 'done');
      } else {
        setAiStep('scrape', 'error');
      }
    } else {
      setAiStep('scrape', 'done');
    }
  } catch(e) {
    console.warn('Live scrape failed:', e.message);
    setAiStep('scrape', 'error');
  }

  // PASO 3: Búsqueda de noticias recientes via Gemini con grounding
  setAiStep('news', 'active');
  let newsContext = '';
  try {
    if (lead.company && claudeKey) {
      const newsRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${claudeKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text:
              `Busca noticias recientes (últimos 12 meses) sobre la empresa "${lead.company}" en ${lead.address || 'España'}, sector ${lead.segment}.
Busca: inauguraciones, premios, reformas, expansiones, cambios de dirección, menciones en prensa, nuevas aperturas o proyectos.
Si no encuentras nada específico de esta empresa, responde "Sin noticias relevantes encontradas."
Responde en máximo 3 frases concretas, sin inventar nada.` }] }],
            tools: [{ googleSearch: {} }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 300 }
          })
        }
      );
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        const rawNews = newsData.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim() || '';
        if (rawNews && !/sin noticias|no encontr|no hay/i.test(rawNews)) {
          newsContext = rawNews.slice(0, 500);
          setAiStep('news', 'done');
        } else {
          setAiStep('news', 'done');
        }
      } else {
        setAiStep('news', 'error');
      }
    } else {
      setAiStep('news', 'done');
    }
  } catch(e) {
    console.warn('News search failed:', e.message);
    setAiStep('news', 'error');
  }

  // PASO 4 + 5: Gemini analiza todo y redacta el email
  setAiStep('analyze', 'active');

  try {
    // Enrich liveWebData with chosen pain context
    if (painContext) liveWebData.chosenPainContext = `ENFOQUE ELEGIDO POR EL VENDEDOR — PRIORIZA ESTE ÁNGULO:\n${painContext.title}: ${painContext.why} (Gancho: ${painContext.hook})`;
    const result = await generateEmailWithClaude(lead, reviewsData, claudeKey, liveWebData, newsContext);
    setAiStep('analyze', 'done');
    setAiStep('write', 'done');

    // Mostrar resultado
    document.getElementById('ai-loading').style.display = 'none';
    document.getElementById('ai-result').style.display = 'block';
    // Auto-generate contact calendar
    generateContactCalendar(lead);

    // Poblar las 3 opciones de asunto
    const subjects = result.subjects || [result.subject];
    const subjectLabels = ['💛 Emocional', '📊 Racional', '🎯 Intriga'];
    const subjectList = document.getElementById('ai-subjects-list');
    if (subjectList) {
      subjectList.innerHTML = subjects.map((s, i) => `
        <div onclick="selectAiSubject(this, '${s.replace(/'/g,"&#39;")}')"
          style="cursor:pointer;padding:.5rem .75rem;border-radius:8px;border:1px solid var(--glass-border);
          background:var(--glass);font-size:.82rem;display:flex;gap:.5rem;align-items:center;justify-content:space-between;
          transition:border-color .15s,background .15s"
          class="subject-option${i===0?' selected-subject':''}">
          <div style="display:flex;gap:.5rem;align-items:flex-start;flex:1">
            <span style="font-size:.7rem;color:var(--text-muted);white-space:nowrap;padding-top:1px">${subjectLabels[i]||'✏️ Opción '+(i+1)}</span>
            <span>${s}</span>
          </div>
          <button onclick="event.stopPropagation();copySubjectOption('${s.replace(/'/g,"&#39;")}')" title="Copiar asunto"
            style="background:none;border:none;cursor:pointer;font-size:.75rem;color:var(--text-dim);padding:.1rem .3rem;border-radius:4px;flex-shrink:0;transition:color .15s"
            onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-dim)'">📋</button>
        </div>`).join('');
      // Auto-select first
      document.getElementById('ai-subject-out').value = subjects[0] || '';
    }

    document.getElementById('ai-body-out').value = result.body;
    // Poblar editor visual con formato HTML
    const editor = document.getElementById('ai-body-editor');
    if (editor) {
      editor.innerHTML = textToEditorHtml(result.body);
      editor.addEventListener('input', updateEmailWordCount);
    }
    // Subject change listener for spam check
    const subjEl = document.getElementById('ai-subject-out');
    if (subjEl) subjEl.addEventListener('input', () => checkSpam(subjEl.value));
    document.getElementById('ai-modal-sub').innerText = '✅ Email listo — revísalo y envíalo cuando quieras';

    // Word count + spam check
    updateEmailWordCount();
    checkSpam(result.subject);

    // Check if previous email was sent to this company
    const prevEmails = emailHistory.filter(e => e.leadId == lead.id || e.email === lead.email);
    if (prevEmails.length > 0) {
      const lastEmail = prevEmails[0];
      const daysAgo = Math.floor((Date.now() - new Date(lastEmail.date)) / 86400000);
      const fEl = document.getElementById('followup-suggestion');
      if (fEl) {
        fEl.style.display = 'flex';
        document.getElementById('followup-text').innerHTML = `Ya enviaste un email a <strong>${lead.company}</strong> hace <strong>${daysAgo} días</strong> (asunto: "${lastEmail.subject||'sin asunto'}"). Este sería su <strong>${prevEmails.length + 1}º email</strong>.`;
      }
    } else {
      const fEl = document.getElementById('followup-suggestion');
      if (fEl) fEl.style.display = 'none';
    }

    if (result.insight) {
      document.getElementById('ai-reviews-insight').innerHTML =
        `<strong style="color:var(--primary)">📊 Lo que dicen las reseñas de ${lead.company}:</strong><br>${result.insight}`;
      document.getElementById('ai-reviews-insight').style.display = 'block';
    } else {
      document.getElementById('ai-reviews-insight').style.display = 'none';
    }

  } catch(e) {
    setAiStep('analyze', 'error');
    setAiStep('write', 'error');
    document.getElementById('ai-loading').style.display = 'none';
    document.getElementById('ai-error').style.display = 'block';
    document.getElementById('ai-error-msg').innerHTML =
      `<strong>Error al generar el email:</strong><br>${e.message}<br><br>` +
      `Verifica que tu <a href="#" onclick="showView('settings');closeAiModal()" style="color:var(--primary)">API Key de Gemini</a> está correctamente configurada.<br><small style="color:var(--text-muted)">Obtén una gratis en aistudio.google.com/apikey</small>`;
    logApiError(`Email IA error: ${e.message}`);
  }
}

// ── Obtener reseñas de Google Places ──────────────────────────────────────────
async function fetchGoogleReviews(placeId) {
  if (!placeId) return [];
  const apiKey = localStorage.getItem('gordi_api_key');

  // ── Normaliza una reseña cruda a formato estándar ─────────────────────────
  function normalizeReview(r, source) {
    const text = (
      r.text || r.originalText ||
      r.text?.text || r.originalText?.text || // Places API v2 wraps in {text, languageCode}
      ''
    ).substring(0, 600).trim();
    const ownerResponse = (
      r.reviewReply?.text ||           // Places API New (JS SDK)
      r.owner_response?.text ||        // Places Details legacy REST (snake_case)
      r.ownerResponse?.text ||         // por si ya viene normalizado
      null
    );
    return {
      rating: r.rating || r.starRating || 0,
      text,
      time: r.relativePublishTimeDescription || r.relative_time_description || '',
      authorName: r.authorAttribution?.displayName || r.authorName || r.author_name || '',
      ownerResponse: ownerResponse ? ownerResponse.substring(0, 400) : null,
      _src: source,
    };
  }

  // ── Deduplica por texto (las dos APIs a veces devuelven las mismas) ─────────
  function dedup(reviews) {
    const seen = new Set();
    return reviews.filter(r => {
      if (!r.text || r.text.length < 10) return false;
      const key = r.text.slice(0, 60).toLowerCase().replace(/\s+/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ── Ordena: negativas largas primero (máxima señal de dolor) ───────────────
  function sortByPain(reviews) {
    return [...reviews].sort((a, b) => {
      const rDiff = (a.rating || 5) - (b.rating || 5);
      if (rDiff !== 0) return rDiff;
      return (b.text?.length || 0) - (a.text?.length || 0);
    });
  }

  let allReviews = [];

  // ── VÍA 1: Places API New (biblioteca JS, devuelve ~5 reseñas recientes) ───
  try {
    const { Place } = await google.maps.importLibrary('places');
    const place = new Place({ id: placeId });
    await place.fetchFields({ fields: ['reviews', 'rating', 'userRatingCount'] });
    const newApiReviews = (place.reviews || []).map(r => normalizeReview(r, 'PlacesNew'));
    allReviews.push(...newApiReviews);
  } catch(e) {
    console.warn('Places API New reviews error:', e.message);
  }

  // ── VÍA 2: Place Details legacy (REST, devuelve hasta 20 reseñas distintas) ─
  // Usa reviews_sort=newest para maximizar cobertura temporal
  if (apiKey) {
    try {
      const legacyUrls = [
        // Ordenadas por más recientes (detecta problemas actuales)
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&reviews_sort=newest&language=es&key=${apiKey}`,
        // Ordenadas por más relevantes (las que Google considera más representativas)
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&reviews_sort=most_relevant&language=es&key=${apiKey}`,
      ];

      for (const url of legacyUrls) {
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
          const data = await res.json();
          if (data.status !== 'OK') continue;
          const legacyRevs = (data.result?.reviews || []).map(r => normalizeReview(r, 'PlacesLegacy'));
          allReviews.push(...legacyRevs);
        } catch(e) {
          console.warn('Places legacy fetch error:', e.message);
        }
      }
    } catch(e) {
      console.warn('Places legacy overall error:', e.message);
    }
  }

  // ── Deduplicar, ordenar, limitar a 25 ────────────────────────────────────
  const finalReviews = sortByPain(dedup(allReviews)).slice(0, 25);

  // ── Clasificación temporal: convierte texto relativo a banda de tiempo ────
  // "hace 2 semanas" → 'reciente', "hace 8 meses" → 'medio', "hace 3 años" → 'antiguo'
  function classifyTime(timeStr) {
    if (!timeStr) return 'desconocido';
    const t = timeStr.toLowerCase();
    if (/hac[e|í]\s+\d+\s+(?:día|hora|semana|mes)s?/.test(t)) {
      const num = parseInt(t.match(/\d+/)?.[0] || '0');
      if (/hora|día/.test(t)) return 'reciente';
      if (/semana/.test(t)) return num <= 3 ? 'reciente' : 'medio';
      if (/mes/.test(t)) return num <= 6 ? 'reciente' : num <= 18 ? 'medio' : 'antiguo';
    }
    if (/hac[e|í]\s+\d+\s+a[ñn]o/.test(t)) return 'antiguo';
    if (/este año|este mes|esta semana/.test(t)) return 'reciente';
    if (/el año pasado|el a[ñn]o pasado/.test(t)) return 'medio';
    return 'desconocido';
  }

  // Añadir banda temporal a cada reseña
  finalReviews.forEach(r => { r.timeBand = classifyTime(r.time); });

  // ── Análisis estadístico de patrones (solo tiene sentido con 6+ reseñas) ──
  if (finalReviews.length >= 6) {
    const negReviews = finalReviews.filter(r => r.rating <= 3);
    const totalNeg   = finalReviews.filter(r => r.rating <= 2).length;
    const totalMid   = finalReviews.filter(r => r.rating === 3).length;
    const totalPos   = finalReviews.filter(r => r.rating >= 4).length;
    const withOwnerReply = finalReviews.filter(r => r.ownerResponse).length;

    // ── MEJORA 1: Clústeres de dolor separados por ventana temporal ──────────
    const PAIN_CLUSTERS = {
      'instalaciones eléctricas': /instalaci[oó]n|cableado|enchufes|luz|iluminaci[oó]n|electricidad|cuadro el[eé]ctrico/i,
      'temperatura/climatización': /fr[ií]o|calor|temperatura|aire acondicionado|calefacci[oó]n|t[eé]rmico/i,
      'deterioro visible':         /viejo|antiguo|deteriorado|descuidado|sucio|roto|desperfecto|anticuado|desgastado/i,
      'obras/reformas mencionadas': /obra|reforma|renovaci[oó]n|remodelado|construcci[oó]n/i,
      'ruido/acústica':            /ruido|ac[uú]stica|aisla|paredes finas|se escucha todo/i,
      'humedad/goteras':           /humedad|gotera|grieta|hongos|moho|h[uú]medo/i,
      'baños deteriorados':        /ba[ñn]o|aseo|ducha|váter|inodoro|grifo/i,
      'habitaciones/espacios':     /habitaci[oó]n peque|espacio reducido|muy peque|estrecho/i,
    };

    const painByTime = {}; // { 'ruido/acústica': { reciente: 4, medio: 1, antiguo: 2, best_snippet: '...' } }
    for (const [label, regex] of Object.entries(PAIN_CLUSTERS)) {
      const matches = negReviews.filter(r => regex.test(r.text));
      if (!matches.length) continue;
      const byBand = { reciente: 0, medio: 0, antiguo: 0, desconocido: 0 };
      matches.forEach(r => byBand[r.timeBand || 'desconocido']++);
      // Tomar el snippet de la coincidencia más reciente y negativa
      const bestMatch = matches.sort((a,b) => {
        const bandOrder = { reciente:0, medio:1, desconocido:2, antiguo:3 };
        return (bandOrder[a.timeBand]||2) - (bandOrder[b.timeBand]||2) || (a.rating||5) - (b.rating||5);
      })[0];
      painByTime[label] = {
        total: matches.length,
        reciente: byBand.reciente,
        medio: byBand.medio,
        antiguo: byBand.antiguo,
        bestSnippet: (bestMatch.text || '').slice(0, 100),
        bestRating: bestMatch.rating,
        bestTime: bestMatch.time || '',
      };
    }

    // Generar topPains con información temporal: activos (recientes) primero
    const topPains = Object.entries(painByTime)
      .sort((a, b) => {
        // Priorizar por menciones recientes, luego por total
        const recentDiff = b[1].reciente - a[1].reciente;
        return recentDiff !== 0 ? recentDiff : b[1].total - a[1].total;
      })
      .slice(0, 4)
      .map(([label, data]) => {
        const temporalNote = data.reciente >= 2
          ? `⚡ ACTIVO — ${data.reciente} menciones recientes (<6 meses)`
          : data.reciente === 1
          ? `⚡ 1 mención reciente + ${data.medio + data.antiguo} anteriores`
          : data.antiguo >= 2
          ? `⏳ HISTÓRICO — ${data.antiguo} menciones antiguas (>18 meses), puede estar resuelto`
          : `${data.total} menciones (temporalidad no determinada)`;
        return {
          label,
          temporal: temporalNote,
          total: data.total,
          reciente: data.reciente,
          snippet: data.bestSnippet,
          rating: data.bestRating,
          time: data.bestTime,
          isActive: data.reciente >= 1,
          isHistorical: data.reciente === 0 && data.antiguo >= 2,
        };
      });

    // ── MEJORA 2: Trending de rating (recientes vs antiguos) ─────────────────
    const recentRatings  = finalReviews.filter(r => r.timeBand === 'reciente').map(r => r.rating);
    const oldRatings     = finalReviews.filter(r => r.timeBand === 'antiguo').map(r => r.rating);
    let ratingTrend = null;
    if (recentRatings.length >= 3 && oldRatings.length >= 3) {
      const avgRecent = recentRatings.reduce((a,b) => a+b, 0) / recentRatings.length;
      const avgOld    = oldRatings.reduce((a,b) => a+b, 0) / oldRatings.length;
      const delta     = +(avgRecent - avgOld).toFixed(1);
      ratingTrend = { avgRecent: +avgRecent.toFixed(1), avgOld: +avgOld.toFixed(1), delta };
    }

    // ── Análisis de respuestas del propietario ────────────────────────────────
    const ownerTexts = finalReviews.filter(r => r.ownerResponse).map(r => r.ownerResponse.toLowerCase());
    const ownerAcknowledges = ownerTexts.filter(t =>
      /obra|reform|renov|arregl|mejora|trabajo|instala|pendiente|pronto|ya hemos|estamos/i.test(t)
    ).length;
    const ownerDenies = ownerTexts.filter(t =>
      /no es correcto|no correspond|incorrecto|falso|no reconocemos/i.test(t)
    ).length;

    // Lo que valoran en positivas (para contexto del email)
    const posText = finalReviews.filter(r => r.rating >= 4).map(r => r.text).join(' ').toLowerCase();
    const POSITIVE_CLUSTERS = {
      'limpieza': /limpi|aseo|impecable|pulcro/i,
      'ubicación': /ubicaci[oó]n|bien situado|c[eé]ntrico|cerca|localiz/i,
      'personal/atención': /personal|atenci[oó]n|amable|simpático|servicio|trato/i,
      'precio/calidad': /precio|calidad.precio|relación calidad|econ[oó]mic/i,
      'tranquilidad': /tranquil|silencio|descanso|paz/i,
    };
    const posValues = Object.entries(POSITIVE_CLUSTERS)
      .filter(([,regex]) => regex.test(posText))
      .map(([label]) => label)
      .slice(0, 3);

    // Adjuntar todo como _stats
    finalReviews._stats = {
      total: finalReviews.length,
      neg: totalNeg, mid: totalMid, pos: totalPos,
      withOwnerReply,
      ownerAcknowledges,
      ownerDenies,
      ownerEngagement: withOwnerReply > 0
        ? `Propietario responde (${withOwnerReply} respuestas detectadas)`
        : 'Propietario no responde a reseñas',
      topPains,       // array enriquecido con temporalidad
      posValues,      // qué valoran en las positivas
      ratingTrend,    // { avgRecent, avgOld, delta } o null
      fetchedAt: Date.now(),
    };
  }

  return finalReviews;
}

// ── Llamada a Gemini API (100% gratuito) ─────────────────────────────────────
async function generateEmailWithClaude(lead, reviewsData, claudeKey, liveWebData = {}, newsContext = '') {
  const p = getProfile();
  const firma = buildFirmaText();
  const saludo = buildSaludo(lead.name, lead.company);

  // ── MEJORA 3: Diagnóstico estructurado pre-analizado ────────────────────────
  // En vez de volcar reseñas crudas, le pasamos el análisis ya hecho + 1-2 ejemplos
  // por problema. Menos tokens, más señal, mejor email.
  let reviewsContext = '';
  if (reviewsData.reviews && reviewsData.reviews.length > 0) {
    const reviews = reviewsData.reviews;
    const stats   = reviews._stats || null;

    if (stats && stats.topPains && stats.topPains.length > 0) {
      // ── Trending de rating ────────────────────────────────────────────────
      let trendBlock = '';
      if (stats.ratingTrend) {
        const { avgRecent, avgOld, delta } = stats.ratingTrend;
        if (delta <= -0.3)
          trendBlock = `\n📉 RATING EN CAÍDA: ${avgOld}★ hace >1 año → ${avgRecent}★ últimos meses (Δ${delta}) — URGENCIA ALTA`;
        else if (delta >= 0.3)
          trendBlock = `\n📈 RATING MEJORANDO: ${avgOld}★ → ${avgRecent}★ — puede estar recuperándose solo, abordaje sutil`;
        else
          trendBlock = `\n→ Rating estable (sin tendencia clara)`;
      }

      // ── Propietario ───────────────────────────────────────────────────────
      let ownerBlock = '';
      if (stats.ownerAcknowledges >= 2)
        ownerBlock = `\n⚠️ PROPIETARIO RECONOCE PROBLEMAS EN ${stats.ownerAcknowledges} RESPUESTAS — máxima señal de apertura`;
      else if (stats.ownerDenies >= 2)
        ownerBlock = `\n· Propietario niega problemas en ${stats.ownerDenies} respuestas — abordaje sutil`;
      else if (stats.withOwnerReply === 0)
        ownerBlock = `\n· Propietario no responde reseñas — no es consciente del impacto`;

      // ── Problemas por temporalidad ────────────────────────────────────────
      const activeProblems   = stats.topPains.filter(p => p.isActive);
      const historicProblems = stats.topPains.filter(p => p.isHistorical && !p.isActive);

      const problemsBlock = [
        activeProblems.length
          ? `🎯 PROBLEMAS ACTIVOS — USAR COMO ARGUMENTO CENTRAL:\n` +
            activeProblems.map(p =>
              `  → ${p.label}: ${p.temporal}\n     Ejemplo real [${p.rating}★${p.time ? ', '+p.time : ''}]: "${p.snippet}..."`
            ).join('\n')
          : '',
        historicProblems.length
          ? `⏳ PROBLEMAS HISTÓRICOS — NO USAR como argumento (pueden estar resueltos):\n` +
            historicProblems.map(p => `  → ${p.label}: ${p.temporal}`).join('\n')
          : '',
        stats.posValues && stats.posValues.length
          ? `✅ LO QUE VALORAN (no contradecir): ${stats.posValues.join(', ')}`
          : '',
      ].filter(Boolean).join('\n\n');

      reviewsContext = `DIAGNÓSTICO DE RESEÑAS — PRE-ANALIZADO (no reanalizar, usar directamente):
Muestra: ${stats.total} reseñas · ${stats.neg} negativas · ${stats.mid} neutras · ${stats.pos} positivas
${stats.ownerEngagement}${ownerBlock}${trendBlock}

${problemsBlock}`;

    } else {
      // Fallback compacto para < 6 reseñas
      const neg = reviews.filter(r => r.rating <= 2).slice(0, 4);
      const pos = reviews.filter(r => r.rating >= 4).slice(0, 3);
      const allText = reviews.map(r => r.text).join(' ').toLowerCase();
      const painKeywords = ['ruido','calor','frío','humedad','goteras','instalación','reforma','deteriorad','antiguo','viejo'];
      const painMentions = painKeywords.filter(k => allText.includes(k)).join(', ');

      reviewsContext = `RESEÑAS DE GOOGLE (${reviews.length} disponibles, nota ${reviewsData.rating || 'N/A'}/5):
${painMentions ? `⚠️ Palabras clave: ${painMentions}\n` : ''}NEGATIVAS: ${neg.map(r => `[${r.rating}★${r.time?' '+r.time:''}] "${r.text.slice(0,120)}"${r.ownerResponse?'\n  → PROPIETARIO: "'+r.ownerResponse.slice(0,100)+'"':''}`).join('\n') || 'Ninguna'}
POSITIVAS (qué valoran): ${pos.map(r => `[${r.rating}★] "${r.text.slice(0,80)}"`).join('\n') || 'Ninguna'}`;
    }
  } else {
    reviewsContext = 'Sin reseñas disponibles. Personaliza basándote en el sector y descripción del negocio.';
  }

    const segmentTone = SEGMENT_TONE[lead.segment] || SEGMENT_TONE['Default'];

  const prompt = `Eres uno de los mejores copywriters B2B de España, especializado en ventas para empresas de reformas y construcción. Tu misión: escribir el email de prospección más personalizado y persuasivo posible para Voltium Madrid.

═══════════════════════════════════════
VOLTIUM MADRID — CONTEXTO COMPLETO
═══════════════════════════════════════
Empresa: Voltium Madrid (voltiummadrid.es)
Remitente: ${p.name} | ${p.email}
Servicios: Reforma integral llave en mano · Aislamientos acústicos y térmicos · Impermeabilizaciones · Instalaciones fotovoltaicas · Eficiencia energética · Redistribución de espacios · Mantenimiento integral de naves industriales (revisiones periódicas, correctivo y preventivo — cubriendo estructura, instalaciones eléctricas, cubierta, impermeabilización y sistemas contra incendios)
Diferenciales REALES:
  - Un único responsable técnico durante toda la obra (no subcontratan)
  - Presupuesto cerrado desde el primer día, sin sorpresas
  - Trabajan SIN interrumpir la actividad del cliente (por fases, horario nocturno, fines de semana)
  - Documentación digital del proyecto accesible en tiempo real
  - Planificación previa detallada antes de empezar
Filosofía: "La reforma como proceso previsible, controlado y bien ejecutado"
Galería: https://www.voltiummadrid.es/galer%c3%Ada

═══════════════════════════════════════
EMPRESA A CONTACTAR
═══════════════════════════════════════
Nombre: ${lead.company}
Sector: ${lead.segment}
Dirección: ${lead.address || 'Madrid'}
Web: ${lead.website || 'No disponible'}
Nota Google: ${reviewsData.rating ? reviewsData.rating + '/5 (' + (reviewsData.ratingCount || 0) + ' reseñas)' : 'Sin datos'}
Descripción: ${lead.description || 'No disponible'}
${lead.decision_maker ? 'Decisor identificado: ' + lead.decision_maker : ''}
${lead.incorporationYear ? 'Empresa fundada en: ' + lead.incorporationYear + ' (' + (new Date().getFullYear() - lead.incorporationYear) + ' años)' : ''}
${lead.domainYear ? 'Dominio registrado en: ' + lead.domainYear + ' (' + lead.domainAge + ' años)' : ''}
${lead.legalStatus ? 'Estado legal: ' + lead.legalStatus : ''}
${lead.companyType ? 'Tipo de empresa: ' + lead.companyType : ''}
${lead.signals && lead.signals.length ? 'SEÑALES DETECTADAS EN ENRIQUECIMIENTO:\n' + lead.signals.map(s => '  · ' + s).join('\n') : ''}
${lead.competitorBetter ? 'PRESIÓN COMPETITIVA: Su competidor directo "' + lead.competitorBetter.name + '" tiene ' + lead.competitorBetter.diff + ' estrellas más (' + lead.competitorBetter.rating + '★ vs ' + lead.rating + '★). Usar este dato para crear urgencia.' : ''}
${lead.reviewSummary ? 'RESEÑAS REALES SCRAPEADAS (úsalas para personalizar):\n' + lead.reviewSummary : ''}
${lead.techStack && lead.techStack.length ? 'Stack tecnológico detectado: ' + lead.techStack.join(', ') : ''}
${lead.webLoadMs && lead.webLoadMs > 2000 ? 'Web lenta (' + (lead.webLoadMs/1000).toFixed(1) + 's) — posible abandono tecnológico' : ''}
${lead.optimalContact ? 'MEJOR MOMENTO DE CONTACTO: ' + lead.optimalContact.slot + ' (' + lead.optimalContact.reason + ')' : ''}
${lead.fachadaAnalysis ? 'ANÁLISIS VISUAL FACHADA (Street View): ' + lead.fachadaAnalysis : ''}
${liveWebData.recentContent ? '\nCONTENIDO ACTUAL DE SU WEB (rastreado ahora mismo):\n' + liveWebData.recentContent : ''}
${liveWebData.freshSignals && liveWebData.freshSignals.length ? '\nSEÑALES DETECTADAS EN LA WEB HOY: ' + liveWebData.freshSignals.join(', ') : ''}
${liveWebData.chosenPainContext ? '\n\n🎯 ' + liveWebData.chosenPainContext : ''}
${newsContext ? '\nNOTICIAS RECIENTES ENCONTRADAS SOBRE ESTA EMPRESA:\n' + newsContext : ''}

${reviewsContext}

═══════════════════════════════════════
PROCESO DE ESCRITURA — SIGUE ESTE ORDEN
═══════════════════════════════════════

PASO 1 — ANALIZA TODA LA INFORMACIÓN DISPONIBLE:
A) RESEÑAS: ¿Qué problema aparece repetido? ¿Lo reconoce el propietario en sus respuestas?
B) WEB ACTUAL: ¿Qué comunican como sus prioridades ahora mismo? ¿Hay señales de cambio, expansión, renovación?
C) NOTICIAS: ¿Hay algo reciente (inauguración, premio, obra, cambio) que puedas mencionar de forma natural?
D) SEÑALES DE ENRIQUECIMIENTO: ¿La empresa es nueva (dominio reciente)? ¿Lleva muchos años? ¿Qué dice de su momento actual?
E) DECISOR: Si se identificó un decisor, personaliza el saludo y el tono para ese perfil de cargo

PASO 2 — ELIGE EL GANCHO (por este orden de prioridad):
1. Noticia reciente concreta → el gancho más potente y diferenciador, nadie más lo usa
2. Crítica recurrente en reseñas que Voltium resuelve → muy efectivo, demuestra que hiciste los deberes
3. Señal de la web actual (expansión, renovación, nueva apertura) → demuestra que conoces su momento
4. Si la empresa es nueva (< 3 años) → enfoca en construir bien desde el principio
5. Si lleva muchos años → enfoca en modernizar sin perder la identidad
6. Dolor universal del sector → solo si no hay nada más específico

PASO 3 — ESTRUCTURA DEL EMAIL (PAS evolucionado):
  PÁRRAFO 1 — RECONOCIMIENTO ESPECÍFICO: Menciona algo concreto y real que diferencia a esta empresa (no genérico). Demuestra que la conoces.
  PÁRRAFO 2 — EL PROBLEMA: Nombra la queja recurrente con empatía. Si el propietario ya la reconoció en sus respuestas, mejor todavía — úsalo.
  PÁRRAFO 3 — LA AGITACIÓN: Conecta ese problema con consecuencias reales (nota media, precio por noche, clientes perdidos, factura energética...). Hazlo sentir el coste de no actuar.
  PÁRRAFO 4 — LA SOLUCIÓN VOLTIUM: Explica brevemente cómo Voltium resuelve EXACTAMENTE ese problema. Menciona el servicio concreto (aislamiento acústico, reforma por fases, fotovoltaica...). Incluye el diferencial más relevante para este caso.
  PÁRRAFO 5 — PRUEBA / CREDIBILIDAD: Una frase con la galería de proyectos.
  PÁRRAFO 6 — CTA: Llamada de 15 minutos, sin compromiso. Directo y específico.

DOLORES UNIVERSALES POR SECTOR (usar si no hay reseñas):
  Hoteles → nota media en Booking/TripAdvisor, precio por noche, aislamiento acústico
  Retail → primeros 8 segundos del cliente, ticket medio, tiempo de permanencia
  Oficinas → productividad perdida, imagen corporativa, coste energético
  Industrial → cumplimiento normativo, eficiencia de producción, coste eléctrico, paradas de emergencia por falta de mantenimiento preventivo de la nave (cubierta, instalaciones eléctricas, sistemas contra incendios)
  Educativo → calendario lectivo imposible de interrumpir, confort de alumnos
  Deportivo → bajas de socios por instalaciones deterioradas, retención
  Cultural → plazos inamovibles, identidad del espacio, programación continua
  Comercial → cada día cerrado es dinero perdido, experiencia del cliente

═══════════════════════════════════════
PERFIL DEL SECTOR — ADAPTA TODO A ESTO
═══════════════════════════════════════
Tono para este sector: ${segmentTone.tone}
Principal dolor de este sector: ${segmentTone.pain}
Ángulo de venta más efectivo: ${segmentTone.angle}
PROHIBIDO en este sector: ${segmentTone.forbidden}

REGLAS DE ESCRITURA — NIVEL DIOS
═══════════════════════════════════════
✅ Asuntos (genera 3 MUY distintos entre sí): uno emocional, uno racional/dato, uno de curiosidad/intriga
✅ Primera frase: debe enganchar en 3 segundos. Que demuestre que conoces su negocio.
✅ Tono: adapta al perfil del sector definido arriba. No uses el mismo tono para un hotel y una nave industrial.
✅ Especificidad: cuanto más concreto, más creíble. "aislamiento acústico de tuberías" > "reformas"
✅ Longitud: máximo 220 palabras en el cuerpo. Cada frase debe ganar su sitio.
✅ Párrafos cortos: máximo 3-4 líneas cada uno. Fácil de leer en móvil.
✅ El email DEBE empezar EXACTAMENTE con: "\${saludo},"
✅ El email DEBE terminar EXACTAMENTE con: "{{FIRMA}}"

❌ NUNCA: "espero que este email te encuentre bien"
❌ NUNCA: frases genéricas que podrían enviarse a cualquier empresa
❌ NUNCA: inventar datos, nombres de clientes o cifras concretas
❌ NUNCA: mencionar a la competencia
❌ NUNCA: sonar desesperado o presionar
❌ NUNCA: ignorar el perfil del sector — el tono y el ángulo deben ser los indicados arriba

═══════════════════════════════════════
EJEMPLO DE CALIDAD OBJETIVO
═══════════════════════════════════════
(Para un hotel con críticas de ruido en reseñas)

Asunto: El Sueño del Quijote: el único punto que sus huéspedes repiten

"Sus huéspedes lo dicen sin dudar: el patio, la decoración, el trato. Hay algo genuino en ese alojamiento que no se construye con dinero.

Y sin embargo, hay una queja que aparece una y otra vez: el ruido. Las tuberías. Los pasillos. Incluso el interruptor del baño se escucha de noche.

Ustedes ya lo saben. El problema no es la voluntad, es el aislamiento acústico de la construcción.

Es exactamente lo que hacemos en Voltium Madrid. Trabajamos habitación por habitación, en los períodos de menor ocupación, con presupuesto cerrado y sin cerrar el hotel.

Una mejora acústica bien ejecutada no solo elimina la queja más recurrente — transforma directamente la nota media en Booking y la tarifa que pueden cobrar por noche."

(Ese nivel de especificidad y conexión directa entre reseñas y solución es el objetivo)

═══════════════════════════════════════

═══════════════════════════════════════
FORMATO HTML DEL EMAIL — MUY IMPORTANTE
═══════════════════════════════════════
El campo "body" debe estar en HTML, no en texto plano.

REGLAS DE FORMATO (aplícalas con criterio, no en exceso):
- Usa <strong>texto</strong> para 2-4 conceptos clave por email: el problema principal, el diferencial más relevante de Voltium, y el CTA
- Usa <u>texto</u> para subrayar 1-2 datos o frases que el lector NO debe pasar por alto
- Usa <em>texto</em> con moderación, solo si añade énfasis natural
- Separa párrafos con <br><br>
- NO formatear más del 15% del texto — el formato pierde impacto si se abusa
- El objetivo es que el ojo del lector vaya exactamente donde tú quieres

EJEMPLO DE FORMATO BIEN APLICADO:
"Sus clientes lo repiten: el trato, la decoración, el ambiente. Hay algo genuino en El Sueño del Quijote que no se construye con dinero.<br><br>Y sin embargo, hay <strong>una queja que aparece una y otra vez</strong>: el ruido. Las tuberías. Los pasillos de noche.<br><br>El problema no es la voluntad — es el <u>aislamiento acústico de la construcción</u>. Y es exactamente lo que hacemos en Voltium Madrid.<br><br>Trabajamos habitación por habitación, <strong>sin cerrar el hotel</strong>, con presupuesto cerrado desde el primer día."

Responde ÚNICAMENTE con JSON válido, sin markdown, sin texto adicional:
{"subjects":["asunto opción 1 — emocional","asunto opción 2 — dato/racional","asunto opción 3 — curiosidad/intriga"],"body":"HTML del email empezando con '${saludo},'  y terminando con '{{FIRMA}}'","insight":"2-3 frases sobre QUÉ FUENTE usaste como gancho principal (reseñas/web/noticias/señales) y cómo el tono del sector influyó en el email"}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${claudeKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8000
        }
      })
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error?.message || `Error ${response.status}`;
    if (response.status === 400) throw new Error('API Key de Gemini inválida. Verifica que la copiaste correctamente.');
    if (response.status === 429) throw new Error('Límite de peticiones alcanzado. Espera un momento e inténtalo de nuevo.');
    throw new Error(msg);
  }

  const data = await response.json();
  console.log('[VOLTFLOW DEBUG] Gemini raw response:', JSON.stringify(data).substring(0, 500));

  // Gemini 2.5 puede devolver el JSON en distintos lugares
  let rawText = '';
  const candidate = data.candidates?.[0];
  if (candidate?.content?.parts) {
    for (const part of candidate.content.parts) {
      if (part.text) { rawText = part.text; break; }
    }
  }
  // Fallback: a veces viene en promptFeedback o como objeto directo
  if (!rawText && data.candidates?.[0]?.content?.parts?.[0]) {
    rawText = JSON.stringify(data.candidates[0].content.parts[0]);
  }

  console.log('[VOLTFLOW DEBUG] rawText:', rawText.substring(0, 300));
  if (!rawText) throw new Error('Gemini no devolvió texto. Respuesta: ' + JSON.stringify(data).substring(0,200));

  // Comprobar si fue truncado por MAX_TOKENS
  const finishReason = data.candidates?.[0]?.finishReason || '';
  if (finishReason === 'MAX_TOKENS') {
    console.warn('[VOLTFLOW] Respuesta truncada por MAX_TOKENS, intentando recuperar...');
  }

  // Parsear JSON — limpiar fences y recuperar JSON parcial
  let parsed;
  // Paso 1: limpiar markdown fences
  let clean = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // Paso 2: si está truncado, intentar cerrar el JSON
  if (finishReason === 'MAX_TOKENS') {
    // Contar llaves para intentar cerrar el objeto
    let opens = (clean.match(/\{/g) || []).length;
    let closes = (clean.match(/\}/g) || []).length;
    // Quitar coma o texto suelto al final antes de cerrar
    // IMPORTANTE: no usar replace genérico que puede borrar el body
    clean = clean.replace(/,\s*$/, '');
    // Solo cerrar string si estamos claramente dentro de un valor incompleto
    // (no termina con comillas, no termina con })
    if (!clean.endsWith('"') && !clean.endsWith('}') && !clean.endsWith(']')) {
      clean += '"';
    }
    while (closes < opens) { clean += '}'; closes++; }
  }

  try {
    parsed = JSON.parse(clean);
  } catch {
    // Extraer el primer objeto JSON completo que haya
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Gemini no devolvió JSON válido. Inténtalo de nuevo.');
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch(e2) {
      throw new Error('Error al parsear respuesta. Inténtalo de nuevo.');
    }
  }

  // Handle subjects array (new) and single subject (legacy)
  if (parsed.subjects && Array.isArray(parsed.subjects) && parsed.subjects.length) {
    parsed.subject = parsed.subjects[0];
  }

  // Si body vacío, intentar extraerlo directamente del rawText como fallback
  if (!parsed.body) {
    const bodyMatch = rawText.match(/"body"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"insight"|"\s*\})/);
    if (bodyMatch) {
      try { parsed.body = JSON.parse('"' + bodyMatch[1] + '"'); } catch { parsed.body = bodyMatch[1]; }
    }
  }

  if ((!parsed.subject && !parsed.subjects) || !parsed.body)
    throw new Error('Respuesta incompleta. Inténtalo de nuevo.');

  // Aplicar firma real
  parsed.body = parsed.body.replace('{{FIRMA}}', firma);

  return parsed;
}

// ── Enviar el email generado ───────────────────────────────────────────────────
// ── Herramientas de formato del editor ────────────────────────────────────────
function formatText(cmd) {
  const editor = document.getElementById('ai-body-editor');
  if (!editor) return;
  editor.focus();
  document.execCommand(cmd, false, null);
}

function clearFormat() {
  const editor = document.getElementById('ai-body-editor');
  if (!editor) return;
  editor.focus();
  document.execCommand('removeFormat', false, null);
}

// Recibe HTML de Gemini y lo prepara para el editor visual
function textToEditorHtml(html) {
  if (!html) return '';

  // Si viene texto plano (sin etiquetas HTML), convertir parrafos
  if (!html.includes('<')) {
    return html.split('\n\n').map(function(para) {
      var trimmed = para.trim();
      if (!trimmed) return '';
      return '<p style="margin:0 0 .9em 0">' + trimmed.replace(/\n/g,'<br>') + '</p>';
    }).filter(Boolean).join('');
  }

  // Si viene HTML de Gemini: asegurar estilos visuales inline
  var out = html;

  // Normalizar saltos de parrafo
  out = out.replace(/<br>\s*<br>/gi, '</p><p style="margin:.75em 0 0 0">');
  if (!out.startsWith('<p')) out = '<p style="margin:0 0 .75em 0">' + out;
  if (!out.endsWith('</p>')) out = out + '</p>';

  // Aplicar estilos inline para que se vean bien en el editor oscuro
  out = out.replace(/<strong>/gi, '<strong style="color:#fff;font-weight:700">');
  out = out.replace(/<b>/gi, '<strong style="color:#fff;font-weight:700">');
  out = out.replace(/<\/b>/gi, '</strong>');
  out = out.replace(/<u>/gi, '<u style="text-decoration-color:#0A84FF;text-underline-offset:3px">');
  out = out.replace(/<em>/gi, '<em style="color:#c4b5fd">');

  return out;
}

// Copia el email con formato HTML al portapapeles (para Gmail/Outlook)
async function copyHtmlEmail() {
  const editor = document.getElementById('ai-body-editor');
  const subject = document.getElementById('ai-subject-out').value;
  if (!editor) return;

  // Construir HTML completo del email con estilos inline para compatibilidad
  const innerHtml = editor.innerHTML;
  const fullHtml = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#222">${innerHtml}</div>`;

  try {
    // Clipboard API moderna — copia como HTML rico
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const textBlob = new Blob([editor.innerText], { type: 'text/plain' });
    await navigator.clipboard.write([
      new ClipboardItem({ 'text/html': blob, 'text/plain': textBlob })
    ]);

    // Feedback visual en el botón
    const btn = document.getElementById('btn-copy-html');
    const orig = btn.innerText;
    btn.innerText = '✅ ¡Copiado! Pega en Gmail/Outlook';
    btn.style.background = 'rgba(16,217,124,0.2)';
    btn.style.borderColor = 'rgba(16,217,124,0.5)';
    setTimeout(() => { btn.innerText = orig; btn.style.background = ''; btn.style.borderColor = ''; }, 2500);

    // Registrar en historial
    const lead = leads.find(l => l.id == aiCurrentLeadId);
    if (lead) {
      const _doContactado = () => {
        lead.status = 'Contactado';
        lead.status_date = new Date().toISOString();
        emailHistory.unshift({ id: Date.now(), company: lead.company, email: lead.email, segment: lead.segment, date: new Date().toISOString(), status: 'Preparado (IA)', notes: `Asunto: ${subject}` });
      localStorage.setItem('gordi_email_history', JSON.stringify(emailHistory));
        saveLeads(); renderAll(); renderTracking();
      };
      confirmStatusChange(lead, 'Contactado', _doContactado);
    }
  } catch(e) {
    // Fallback: copiar texto plano
    try {
      await navigator.clipboard.writeText(editor.innerText);
      showToast('📋 Copiado como texto (sin formato) — tu navegador no soporta copia HTML');
    } catch(e2) {
      alert('No se pudo copiar. Selecciona el texto del email manualmente y copia con Ctrl+C.');
    }
  }
}


function selectAiSubject(el, subject) {
  // Deselect all
  document.querySelectorAll('.subject-option').forEach(o => {
    o.classList.remove('selected-subject');
    o.style.borderColor = '';
    o.style.background = '';
  });
  // Select clicked
  el.classList.add('selected-subject');
  el.style.borderColor = 'var(--primary)';
  el.style.background = 'rgba(10,132,255,0.08)';
  // Update input
  document.getElementById('ai-subject-out').value = subject;
  checkSpam(subject);
}

function sendAiEmail() {
  const lead = leads.find(l => l.id == aiCurrentLeadId);
  if (!lead) return;

  const subject = document.getElementById('ai-subject-out').value;
  // Leer del editor visual (texto plano)
  const editor = document.getElementById('ai-body-editor');
  const body = editor ? editor.innerText : document.getElementById('ai-body-out').value;

  window.location.href = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  emailHistory.unshift({ id: Date.now(), leadId: lead.id, company: lead.company, email: lead.email, segment: lead.segment, date: new Date().toISOString(), status: 'Enviado (IA)', subject, notes: 'Generado con IA + análisis de reseñas' });
  localStorage.setItem('gordi_email_history', JSON.stringify(emailHistory));
  // MEJORA 1: Registrar time-to-first-contact
  if (!lead.first_contact_date) {
    lead.first_contact_date = new Date().toISOString();
    lead.ttfc_hours = Math.round((Date.now() - new Date(lead.date)) / 3600000);
  }
  const oldStatus = lead.status;
  const _doSend = () => {
    lead.status_date = new Date().toISOString();
    addActivityLog(lead.id, `✉️ Email IA enviado: "${subject}"`);
    saveLeads(); renderAll(); renderTracking();
    updateStreakData();
    closeAiModal();
    showToast('✉️ Email abierto en tu gestor de correo');
  };
  if (oldStatus !== 'Visita') {
    confirmStatusChange(lead, 'Visita', () => { lead.status = 'Visita'; _doSend(); });
  } else {
    _doSend();
  }
}

// ── Regenerar ─────────────────────────────────────────────────────────────────
function regenerateAiEmail() {
  const lead = leads.find(l => l.id == aiCurrentLeadId);
  if (!lead) return;
  const editor = document.getElementById('ai-body-editor');
  if (editor) editor.innerHTML = '';
  document.getElementById('ai-loading').style.display = 'block';
  document.getElementById('ai-result').style.display = 'none';
  document.getElementById('ai-error').style.display = 'none';
  setAiStep('reviews', 'pending');
  setAiStep('analyze', 'pending');
  setAiStep('write', 'pending');
  runAiEmailGeneration(lead);
}

function retryAiEmail() { regenerateAiEmail(); }

// ══════════════════════════════════════════════════════════════════════════════
