
// ============ UTILS ============
function extractDomain(url) {
  try {
    if (!url.startsWith('http')) url = 'https://'+url;
    return new URL(url).hostname.replace('www.','');
  } catch { return null; }
}

// Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
// MOTOR DE EMAIL CON IA Ã¢â‚¬â€ Lee reseÃƒÂ±as + Claude API Ã¢â€ â€™ Email hiperpersonalizado
// Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â

let aiCurrentLeadId = null;

// Ã¢â€â‚¬Ã¢â€â‚¬ Abrir modal Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
function openAiEmailModal(id) {
  aiCurrentLeadId = id;
  const lead = leads.find(l => l.id == id);
  if (!lead) return;

  const claudeKey = getGeminiKey();
  if (!claudeKey) {
    alert('Ã¢Å¡Â Ã¯Â¸Â Necesitas configurar tu API Key de Gemini en ConfiguraciÃƒÂ³n.\n\nVe a: aistudio.google.com/apikey Ã¢â€ â€™ Get API Key (gratis con tu cuenta Google)');
    showView('settings');
    return;
  }

  // Reset modal UI
  document.getElementById('ai-modal-title').innerText = `Ã¢Å“Â¨ Email IA para ${lead.company}`;
  document.getElementById('ai-modal-sub').innerHTML = lead.email 
    ? `Destinatario: <span style="color:var(--primary);cursor:pointer;text-decoration:underline" onclick="copyToClipboard('${lead.email}', 'Email: ${lead.email}')" title="Clic para copiar">${lead.email} Ã¢Â§â€°</span>`
    : 'Analizando reseÃƒÂ±as con Gemini IA (gratuito)...';
  document.getElementById('ai-loading').style.display = 'block';
  document.getElementById('ai-result').style.display = 'none';
  document.getElementById('ai-error').style.display = 'none';
  setAiStep('reviews', 'pending');
  setAiStep('analyze', 'pending');
  setAiStep('write', 'pending');

  document.getElementById('ai-email-modal').style.display = 'flex';
  // Show pain picker first Ã¢â‚¬â€ analyze weak points, then let user choose
  showPainPicker(lead);
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ NUEVAS FUNCIONES Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

// Ã¢â€â‚¬Ã¢â€â‚¬ copySubjectOption Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
function copySubjectOption(subject) {
  copyToClipboard(subject, 'Asunto copiado');
}

// Ã¢â€â‚¬Ã¢â€â‚¬ PAIN PICKER Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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
    <div class="spinner" style="margin:0 auto .75rem"></div>Analizando puntos dÃƒÂ©biles de ${lead.company}Ã¢â‚¬Â¦</div>`;

  try {
    const claudeKey = getGeminiKey();
    // Build a compact context from existing lead data
    const signals = (lead.signals || []).slice(0, 6).map(s => '  Ã‚Â· ' + s).join('\n');
    const reviews = lead.reviewSummary
      ? lead.reviewSummary.split('\n').slice(0, 5).join('\n')
      : '';
    const segT = (typeof SEGMENT_TONE !== 'undefined' && SEGMENT_TONE[lead.segment]) || {};

    const prompt = `Eres un experto en ventas B2B. Analiza esta empresa y dame EXACTAMENTE 3 posibles ÃƒÂ¡ngulos de ataque para un primer email de prospecciÃƒÂ³n de Voltium Madrid (empresa de reformas/instalaciones).

EMPRESA: ${lead.company} | Sector: ${lead.segment} | Ciudad: ${lead.address || 'Madrid'}
Rating Google: ${lead.rating ? lead.rating + '/5 (' + lead.ratingCount + ' reseÃƒÂ±as)' : 'sin datos'}
DescripciÃƒÂ³n: ${lead.description || 'N/A'}
${signals ? 'SeÃƒÂ±ales detectadas:\n' + signals : ''}
${reviews ? 'ReseÃƒÂ±as reales:\n' + reviews : ''}
${segT.pain ? 'Dolor tÃƒÂ­pico del sector: ' + segT.pain : ''}

Para cada ÃƒÂ¡ngulo, dame:
- Un tÃƒÂ­tulo corto (max 8 palabras) que resuma el enfoque
- Una frase de por quÃƒÂ© este ÃƒÂ¡ngulo es potente para esta empresa concreta (max 25 palabras)
- El tipo de gancho a usar: reseÃƒÂ±as / urgencia / oportunidad / problema visible / eficiencia

Responde SOLO JSON vÃƒÂ¡lido (sin markdown):
{"options":[
  {"title":"...", "why":"...", "hook":"reseÃƒÂ±as|urgencia|oportunidad|problema|eficiencia", "priority":1},
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

    const hookEmoji = { 'reseÃ±as':'â­', urgencia:'ðŸ”¥', oportunidad:'ðŸ’Ž', problema:'âš ï¸', eficiencia:'âš¡' };
    optionsEl.innerHTML = _painPickerOptions.map((opt, i) => `
      <div onclick="selectPainOption(this, ${i})"
        style="cursor:pointer;padding:.85rem 1rem;border-radius:10px;border:1.5px solid var(--glass-border);
        background:var(--glass);transition:all .15s" class="pain-opt-card">
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.25rem">
          <span style="font-size:.85rem">${hookEmoji[opt.hook] || 'Ã°Å¸Å½Â¯'}</span>
          <span style="font-weight:700;font-size:.85rem;color:var(--text)">${opt.title}</span>
          ${opt.priority === 1 ? '<span style="font-size:.65rem;background:rgba(99,102,241,.15);color:#a78bfa;padding:.1rem .4rem;border-radius:5px;font-weight:600">Ã¢Â­Â Top pick</span>' : ''}
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
  const claudeKey = getGeminiKey();
  if (!claudeKey || !painCtx) return;
  try {
    const prompt = `Empresa: ${lead.company} | Sector: ${lead.segment}
ÃƒÂngulo elegido: "${painCtx.title}" Ã¢â‚¬â€ ${painCtx.why}

Genera EXACTAMENTE 3 asuntos de email B2B para este ÃƒÂ¡ngulo. Cortos, sin spam, directos.
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
    const subjectLabels = ['Ã°Å¸â€™â€º Emocional', 'Ã°Å¸â€œÅ  Racional', 'Ã°Å¸Å½Â¯ Intriga'];
    const subjectList = document.getElementById('ai-subjects-list');
    if (subjectList) {
      subjectList.innerHTML = subjects.map((s, i) => `
        <div onclick="selectAiSubject(this,'${s.replace(/'/g,"&#39;")}')"
          style="cursor:pointer;padding:.5rem .75rem;border-radius:8px;border:1px solid var(--glass-border);
          background:var(--glass);font-size:.82rem;display:flex;gap:.5rem;align-items:center;justify-content:space-between;
          transition:border-color .15s,background .15s"
          class="subject-option${i===0?' selected-subject':''}">
          <div style="display:flex;gap:.5rem;align-items:flex-start;flex:1">
            <span style="font-size:.7rem;color:var(--text-muted);white-space:nowrap;padding-top:1px">${subjectLabels[i]||'Ã¢Å“ÂÃ¯Â¸Â'}</span>
            <span>${s}</span>
          </div>
          <button onclick="event.stopPropagation();copySubjectOption('${s.replace(/'/g,"&#39;")}');" title="Copiar asunto"
            style="background:none;border:none;cursor:pointer;font-size:.75rem;color:var(--text-dim);padding:.1rem .3rem;border-radius:4px;flex-shrink:0"
            onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-dim)'">Ã°Å¸â€œâ€¹</button>
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

// Ã¢â€â‚¬Ã¢â€â‚¬ CONTACT CALENDAR GENERATION Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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
    <span class="spinner" style="display:inline-block;margin-right:.3rem"></span>Generando calendario de seguimientoÃ¢â‚¬Â¦</div>`;

  try {
    const claudeKey = getGeminiKey();
    const segT = (typeof SEGMENT_TONE !== 'undefined' && SEGMENT_TONE[lead.segment]) || {};

    const prompt = `Eres un experto en ventas B2B. Genera un calendario de seguimiento para cuando el lead NO contesta el primer email.

LEAD: ${lead.company} | Sector: ${lead.segment}
Tono del sector: ${segT.tone || 'profesional y directo'}
Dolor principal: ${segT.pain || 'mejora de instalaciones'}

Genera 5 touchpoints de seguimiento, distribuidos en los prÃƒÂ³ximos 30 dÃƒÂ­as. Cada uno con un enfoque diferente y canal distinto cuando sea posible.

Reglas:
- DÃƒÂ­a 0 = hoy (primer email ya enviado)
- Cada touchpoint debe tener un ÃƒÂ¡ngulo DISTINTO (no repetir el mismo argumento)
- Alterna email y WhatsApp cuando sea apropiado
- El ÃƒÂºltimo touchpoint debe ser el "break-up" (cierre elegante)
- Asunto/texto sugerido MUY breve (max 12 palabras)

Responde SOLO JSON vÃƒÂ¡lido:
{"touchpoints":[
  {"day":3,"channel":"email","angle":"Aportar dato nuevo relevante","subject":"Frase sugerida del asunto","note":"Por quÃƒÂ© este ÃƒÂ¡ngulo ahora"},
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

  const chIcon = { email:'Ã¢Å“â€°Ã¯Â¸Â', whatsapp:'Ã°Å¸â€™Â¬', linkedin:'Ã°Å¸â€â€”', llamada:'Ã°Å¸â€œÅ¾' };
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
          <span>${chIcon[tp.channel] || 'Ã°Å¸â€œÅ’'}</span>
          <span style="font-weight:600;color:var(--text)">${tp.subject}</span>
          ${isBreakup ? '<span style="font-size:.65rem;background:rgba(239,68,68,.12);color:#f87171;padding:.1rem .35rem;border-radius:4px">Break-up</span>' : ''}
        </div>
        <div style="color:var(--text-dim);font-size:.72rem">${tp.angle} Ã¢â‚¬â€ <em>${tp.note}</em></div>
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
  addActivityLog(lead.id, `Ã°Å¸â€œâ€¦ Calendario de seguimiento generado:\n${calStr}`);
  saveLeads();
  if (typeof renderAll === 'function') renderAll();
  if (typeof renderTracking === 'function') renderTracking();
  if (typeof updateFollowupBadge === 'function') updateFollowupBadge();
  showToast('Ã¢Å“â€¦ Calendario aplicado Ã¢â‚¬â€ prÃƒÂ³ximo contacto en ' + firstTp.day + ' dÃƒÂ­as');
  document.getElementById('contact-calendar-panel').style.display = 'none';
}

// Ã¢â€â‚¬Ã¢â€â‚¬ WHATSAPP MODAL Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
let _waLead = null;

function openWhatsAppModal(leadId, event) {
  if (event) event.stopPropagation();
  const lead = leads.find(l => l.id == leadId);
  if (!lead) return;
  _waLead = lead;

  const phone = lead.whatsapp || lead.phone;
  if (!phone) { showToast('Ã¢Å¡Â Ã¯Â¸Â Este lead no tiene telÃƒÂ©fono ni WhatsApp'); return; }

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
            <span style="font-size:1.2rem">Ã°Å¸â€™Â¬</span>
            <div>
              <div style="font-weight:700;font-size:.9rem" id="wa-modal-title">WhatsApp IA</div>
              <div style="font-size:.7rem;color:var(--text-dim)" id="wa-modal-sub">Generando mensaje personalizadoÃ¢â‚¬Â¦</div>
            </div>
          </div>
          <button onclick="closeWaModal()" style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:1rem">Ã¢Å“â€¢</button>
        </div>
        <div id="wa-body" style="padding:1.25rem">
          <div style="text-align:center;padding:2rem">
            <div class="spinner" style="margin:0 auto .75rem"></div>
            <div style="font-size:.8rem;color:var(--text-dim)">Generando mensaje personalizado con IAÃ¢â‚¬Â¦</div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
  document.getElementById('wa-modal-title').textContent = `WhatsApp para ${lead.company}`;
  document.getElementById('wa-modal-sub').textContent = `Ã°Å¸â€œÂ± ${phone} Ã¢â‚¬â€ Generando mensajeÃ¢â‚¬Â¦`;
  generateWhatsAppMessage(lead);
}

function closeWaModal() {
  const m = document.getElementById('wa-modal');
  if (m) m.style.display = 'none';
}

async function generateWhatsAppMessage(lead) {
  const claudeKey = getGeminiKey();
  const phone = lead.whatsapp || lead.phone;
  const phoneClean = phone.replace(/[^0-9+]/g, '');
  const waBody = document.getElementById('wa-body');

  try {
    const segT = (typeof SEGMENT_TONE !== 'undefined' && SEGMENT_TONE[lead.segment]) || {};
    const prevEmails = emailHistory.filter(e => e.leadId == lead.id || e.email === lead.email).length;
    const p = getProfile();

    const prompt = `Eres un experto en ventas B2B. Escribe un mensaje de WhatsApp de prospecciÃƒÂ³n para ${lead.company}.

CONTEXTO:
- Empresa: ${lead.company} | Sector: ${lead.segment} | Ciudad: ${lead.address || 'Madrid'}
- Emails previos enviados: ${prevEmails}
- Rating Google: ${lead.rating ? lead.rating + '/5' : 'sin datos'}
${(lead.signals || []).slice(0, 3).map(s => '- SeÃƒÂ±al: ' + s).join('\n')}
- Tono del sector: ${segT.tone || 'profesional'}
- Dolor principal: ${segT.pain || 'mejora de instalaciones'}
- Remitente: ${p.name} de Voltium Madrid

REGLAS DEL WHATSAPP:
- MÃƒÂ¡ximo 3 pÃƒÂ¡rrafos cortos (60-90 palabras total)
- Tono cercano pero profesional Ã¢â‚¬â€ es un mensaje directo, no un email
- Primer pÃƒÂ¡rrafo: quiÃƒÂ©n eres + gancho (algo especÃƒÂ­fico de su negocio)
- Segundo pÃƒÂ¡rrafo: valor concreto que puedes aportarles
- Cierre: CTA simple y no invasivo (Ã‚Â¿te llamo 5 min esta semana?)
- NUNCA empezar con "Hola, me llamo..." Ã¢â‚¬â€ ve al grano
- Incluye un emoji ocasional (mÃƒÂ¡ximo 2-3 en todo el mensaje)
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
        <label style="font-size:.75rem;color:var(--text-dim);display:block;margin-bottom:.4rem">Mensaje generado Ã¢â‚¬â€ edita si lo necesitas</label>
        <textarea id="wa-text-editor" rows="7"
          style="width:100%;background:var(--bg3);border:1px solid var(--glass-border);border-radius:10px;
          padding:.85rem;font-size:.82rem;color:var(--text);resize:vertical;line-height:1.6;font-family:'Inter',sans-serif"
          >${msg}</textarea>
      </div>
      <div style="background:rgba(37,211,102,.06);border:1px solid rgba(37,211,102,.2);border-radius:8px;padding:.6rem .85rem;
        font-size:.75rem;margin-bottom:1rem;display:flex;align-items:center;gap:.4rem">
        Ã°Å¸â€œÂ± Se enviarÃƒÂ¡ a: <strong style="color:#25D366">${phone}</strong>
      </div>
      <div style="display:flex;gap:.6rem;flex-wrap:wrap">
        <a id="wa-send-btn" href="${waUrl}" target="_blank"
          onclick="registerWaSent()"
          style="display:inline-flex;align-items:center;gap:.4rem;background:#25D366;color:#fff;
          padding:.5rem 1.1rem;border-radius:8px;font-weight:600;font-size:.82rem;text-decoration:none;border:none;cursor:pointer">
          Ã°Å¸â€™Â¬ Abrir en WhatsApp
        </a>
        <button onclick="copyWaMessage()" class="btn-outline" style="font-size:.8rem">Ã°Å¸â€œâ€¹ Copiar mensaje</button>
        <button onclick="regenerateWaMessage()" class="btn-outline" style="font-size:.8rem">Ã°Å¸â€â€ž Regenerar</button>
      </div>`;

  } catch(e) {
    console.warn('WA generation error:', e);
    const phone2 = lead.whatsapp || lead.phone;
    const phoneClean2 = phone2.replace(/[^0-9+]/g, '');
    waBody.innerHTML = `
      <div style="color:var(--danger);font-size:.8rem;margin-bottom:1rem">Ã¢Å¡Â Ã¯Â¸Â No se pudo generar el mensaje con IA (comprueba la API key de Gemini).</div>
      <textarea id="wa-text-editor" rows="5" placeholder="Escribe tu mensaje de WhatsApp aquÃƒÂ­..."
        style="width:100%;background:var(--bg3);border:1px solid var(--glass-border);border-radius:10px;
        padding:.85rem;font-size:.82rem;color:var(--text);resize:vertical;font-family:'Inter',sans-serif"></textarea>
      <div style="margin-top:.75rem;display:flex;gap:.6rem">
        <button onclick="sendWaManual()" style="background:#25D366;color:#fff;border:none;border-radius:8px;padding:.5rem 1rem;font-weight:600;cursor:pointer;font-size:.8rem">
          Ã°Å¸â€™Â¬ Abrir en WhatsApp
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
      <div style="font-size:.8rem;color:var(--text-dim)">RegenerandoÃ¢â‚¬Â¦</div></div>`;
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
  copyToClipboard(msg, 'Mensaje copiado');
}

function registerWaSent() {
  const lead = _waLead; if (!lead) return;
  const msg = document.getElementById('wa-text-editor')?.value || '';
  addActivityLog(lead.id, `Ã°Å¸â€™Â¬ WhatsApp enviado a ${lead.whatsapp || lead.phone}`);
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

// Ã¢â€â‚¬Ã¢â€â‚¬ Control de pasos visuales Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
function setAiStep(step, state) {
  const el = document.getElementById(`aistep-${step}`);
  if (!el) return;
  el.className = `ai-step ${state}`;
  const labels = {
    reviews: { pending:'Leyendo reseÃƒÂ±as de Google...', active:'Ã°Å¸â€œâ€“ Leyendo reseÃƒÂ±as de Google...', done:'Ã¢Å“â€¦ ReseÃƒÂ±as analizadas', error:'Ã¢ÂÅ’ No se pudieron leer las reseÃƒÂ±as' },
    scrape:  { pending:'Rastreando web de la empresa...', active:'Ã°Å¸Å’Â Rastreando web de la empresa...', done:'Ã¢Å“â€¦ Web analizada', error:'Ã¢Å¡Â Ã¯Â¸Â Web no accesible' },
    news:    { pending:'Buscando noticias recientes...', active:'Ã°Å¸â€œÂ° Buscando noticias y novedades...', done:'Ã¢Å“â€¦ Contexto actualizado', error:'Ã¢Å¡Â Ã¯Â¸Â Sin noticias recientes' },
    analyze: { pending:'Analizando puntos fuertes y dÃƒÂ©biles...', active:'Ã°Å¸â€Â Analizando puntos fuertes y dÃƒÂ©biles...', done:'Ã¢Å“â€¦ AnÃƒÂ¡lisis completado', error:'Ã¢ÂÅ’ Error en el anÃƒÂ¡lisis' },
    write:   { pending:'Redactando email con copywriting...', active:'Ã¢Å“ÂÃ¯Â¸Â Redactando email hiperpersonalizado...', done:'Ã¢Å“â€¦ Email generado', error:'Ã¢ÂÅ’ Error al generar el email' },
  };
  const lbl = el.querySelector('.ai-step-label');
  if (lbl && labels[step]?.[state]) lbl.innerText = labels[step][state];
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Motor principal Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
async function runAiEmailGeneration(lead, painContext) {
  const claudeKey = getGeminiKey();

  // PASO 1: ReseÃƒÂ±as de Google Places
  // MEJORA 5: Si el lead ya tiene reviewStats del enriquecimiento reciente (<24h),
  // reutilizamos esos datos y nos saltamos el fetch Ã¢â‚¬â€ ahorra una llamada Places completa.
  setAiStep('reviews', 'active');
  let reviewsData = { reviews: [], rating: lead.rating || null, ratingCount: lead.ratingCount || 0, placeId: lead.placeId || '' };
  try {
    if (lead.placeId) {
      const cacheAge = lead.reviewStats?.fetchedAt ? Date.now() - lead.reviewStats.fetchedAt : Infinity;
      const cacheValid = cacheAge < 24 * 60 * 60 * 1000 && lead.reviewSummary && lead.reviewStats;

      if (cacheValid) {
        // Reconstruir el array de reviews desde reviewSummary y adjuntar _stats del cachÃƒÂ©
        const cachedLines = (lead.reviewSummary || '').split('\n').filter(Boolean);
        const cachedReviews = cachedLines.map(line => {
          const m = line.match(/^\[(\d)[\u2605Ã¢Ëœâ€¦][^\]]*\]\s*(.*)/);
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
        // Extraer textos relevantes: h1, h2, pÃƒÂ¡rrafos principales, meta description
        const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{20,300})["']/i)?.[1] || '';
        const h1s = [...html.matchAll(/<h1[^>]*>([^<]{5,150})<\/h1>/gi)].map(m => m[1].trim()).slice(0,3);
        const h2s = [...html.matchAll(/<h2[^>]*>([^<]{5,120})<\/h2>/gi)].map(m => m[1].trim()).slice(0,5);
        const paras = [...html.matchAll(/<p[^>]*>([^<]{40,400})<\/p>/gi)]
          .map(m => m[1].replace(/<[^>]+>/g,'').trim())
          .filter(t => !/cookie|privacidad|copyright|legal/i.test(t))
          .slice(0,4);

        // Detectar seÃƒÂ±ales de actualidad en el texto
        const fullText = (h1s.join(' ') + ' ' + h2s.join(' ') + ' ' + paras.join(' ')).toLowerCase();
        const freshSignals = [];
        if (/nueva|nuevo|abrimos|apertura|inaugura|estrena/i.test(fullText)) freshSignals.push('apertura/novedad detectada');
        if (/reforma|renovaci|rehabilitac|obras/i.test(fullText)) freshSignals.push('reforma en curso o reciente');
        if (/ampliaci|expandi|crecemos|nueva sede|nuevo local/i.test(fullText)) freshSignals.push('expansiÃƒÂ³n detectada');
        if (/sostenib|eficiencia energÃƒÂ©tica|fotovoltaic|solar/i.test(fullText)) freshSignals.push('interÃƒÂ©s en sostenibilidad');
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

  // PASO 3: BÃƒÂºsqueda de noticias recientes via Gemini con grounding
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
              `Busca noticias recientes (ÃƒÂºltimos 12 meses) sobre la empresa "${lead.company}" en ${lead.address || 'EspaÃƒÂ±a'}, sector ${lead.segment}.
Busca: inauguraciones, premios, reformas, expansiones, cambios de direcciÃƒÂ³n, menciones en prensa, nuevas aperturas o proyectos.
Si no encuentras nada especÃƒÂ­fico de esta empresa, responde "Sin noticias relevantes encontradas."
Responde en mÃƒÂ¡ximo 3 frases concretas, sin inventar nada.` }] }],
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
    if (painContext) liveWebData.chosenPainContext = `ENFOQUE ELEGIDO POR EL VENDEDOR Ã¢â‚¬â€ PRIORIZA ESTE ÃƒÂNGULO:\n${painContext.title}: ${painContext.why} (Gancho: ${painContext.hook})`;
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
    const subjectLabels = ['Ã°Å¸â€™â€º Emocional', 'Ã°Å¸â€œÅ  Racional', 'Ã°Å¸Å½Â¯ Intriga'];
    const subjectList = document.getElementById('ai-subjects-list');
    if (subjectList) {
      subjectList.innerHTML = subjects.map((s, i) => `
        <div onclick="selectAiSubject(this, '${s.replace(/'/g,"&#39;")}')"
          style="cursor:pointer;padding:.5rem .75rem;border-radius:8px;border:1px solid var(--glass-border);
          background:var(--glass);font-size:.82rem;display:flex;gap:.5rem;align-items:center;justify-content:space-between;
          transition:border-color .15s,background .15s"
          class="subject-option${i===0?' selected-subject':''}">
          <div style="display:flex;gap:.5rem;align-items:flex-start;flex:1">
            <span style="font-size:.7rem;color:var(--text-muted);white-space:nowrap;padding-top:1px">${subjectLabels[i]||'Ã¢Å“ÂÃ¯Â¸Â OpciÃƒÂ³n '+(i+1)}</span>
            <span>${s}</span>
          </div>
          <button onclick="event.stopPropagation();copySubjectOption('${s.replace(/'/g,"&#39;")}')" title="Copiar asunto"
            style="background:none;border:none;cursor:pointer;font-size:.75rem;color:var(--text-dim);padding:.1rem .3rem;border-radius:4px;flex-shrink:0;transition:color .15s"
            onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-dim)'">Ã°Å¸â€œâ€¹</button>
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
    document.getElementById('ai-modal-sub').innerText = 'Ã¢Å“â€¦ Email listo Ã¢â‚¬â€ revÃƒÂ­salo y envÃƒÂ­alo cuando quieras';

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
        document.getElementById('followup-text').innerHTML = `Ya enviaste un email a <strong>${lead.company}</strong> hace <strong>${daysAgo} dÃƒÂ­as</strong> (asunto: "${lastEmail.subject||'sin asunto'}"). Este serÃƒÂ­a su <strong>${prevEmails.length + 1}Ã‚Âº email</strong>.`;
      }
    } else {
      const fEl = document.getElementById('followup-suggestion');
      if (fEl) fEl.style.display = 'none';
    }

    if (result.insight) {
      document.getElementById('ai-reviews-insight').innerHTML =
        `<strong style="color:var(--primary)">Ã°Å¸â€œÅ  Lo que dicen las reseÃƒÂ±as de ${lead.company}:</strong><br>${result.insight}`;
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
      `Verifica que tu <a href="#" onclick="showView('settings');closeAiModal()" style="color:var(--primary)">API Key de Gemini</a> estÃƒÂ¡ correctamente configurada.<br><small style="color:var(--text-muted)">ObtÃƒÂ©n una gratis en aistudio.google.com/apikey</small>`;
    logApiError(`Email IA error: ${e.message}`);
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Obtener reseÃƒÂ±as de Google Places Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
async function fetchGoogleReviews(placeId) {
  if (!placeId) return [];
  const apiKey = localStorage.getItem('gordi_api_key');

  // Ã¢â€â‚¬Ã¢â€â‚¬ Normaliza una reseÃƒÂ±a cruda a formato estÃƒÂ¡ndar Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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

  // Ã¢â€â‚¬Ã¢â€â‚¬ Deduplica por texto (las dos APIs a veces devuelven las mismas) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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

  // Ã¢â€â‚¬Ã¢â€â‚¬ Ordena: negativas largas primero (mÃƒÂ¡xima seÃƒÂ±al de dolor) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  function sortByPain(reviews) {
    return [...reviews].sort((a, b) => {
      const rDiff = (a.rating || 5) - (b.rating || 5);
      if (rDiff !== 0) return rDiff;
      return (b.text?.length || 0) - (a.text?.length || 0);
    });
  }

  let allReviews = [];

  // Ã¢â€â‚¬Ã¢â€â‚¬ VÃƒÂA 1: Places API New (biblioteca JS, devuelve ~5 reseÃƒÂ±as recientes) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  try {
    const { Place } = await google.maps.importLibrary('places');
    const place = new Place({ id: placeId });
    await place.fetchFields({ fields: ['reviews', 'rating', 'userRatingCount'] });
    const newApiReviews = (place.reviews || []).map(r => normalizeReview(r, 'PlacesNew'));
    allReviews.push(...newApiReviews);
  } catch(e) {
    console.warn('Places API New reviews error:', e.message);
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ VÃƒÂA 2: Place Details legacy (REST, devuelve hasta 20 reseÃƒÂ±as distintas) Ã¢â€â‚¬
  // Usa reviews_sort=newest para maximizar cobertura temporal
  if (apiKey) {
    try {
      const legacyUrls = [
        // Ordenadas por mÃƒÂ¡s recientes (detecta problemas actuales)
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&reviews_sort=newest&language=es&key=${apiKey}`,
        // Ordenadas por mÃƒÂ¡s relevantes (las que Google considera mÃƒÂ¡s representativas)
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

  // Ã¢â€â‚¬Ã¢â€â‚¬ Deduplicar, ordenar, limitar a 25 Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const finalReviews = sortByPain(dedup(allReviews)).slice(0, 25);

  // Ã¢â€â‚¬Ã¢â€â‚¬ ClasificaciÃƒÂ³n temporal: convierte texto relativo a banda de tiempo Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  // "hace 2 semanas" Ã¢â€ â€™ 'reciente', "hace 8 meses" Ã¢â€ â€™ 'medio', "hace 3 aÃƒÂ±os" Ã¢â€ â€™ 'antiguo'
  function classifyTime(timeStr) {
    if (!timeStr) return 'desconocido';
    const t = timeStr.toLowerCase();
    if (/hac[e|ÃƒÂ­]\s+\d+\s+(?:dÃƒÂ­a|hora|semana|mes)s?/.test(t)) {
      const num = parseInt(t.match(/\d+/)?.[0] || '0');
      if (/hora|dÃƒÂ­a/.test(t)) return 'reciente';
      if (/semana/.test(t)) return num <= 3 ? 'reciente' : 'medio';
      if (/mes/.test(t)) return num <= 6 ? 'reciente' : num <= 18 ? 'medio' : 'antiguo';
    }
    if (/hac[e|ÃƒÂ­]\s+\d+\s+a[ÃƒÂ±n]o/.test(t)) return 'antiguo';
    if (/este aÃƒÂ±o|este mes|esta semana/.test(t)) return 'reciente';
    if (/el aÃƒÂ±o pasado|el a[ÃƒÂ±n]o pasado/.test(t)) return 'medio';
    return 'desconocido';
  }

  // AÃƒÂ±adir banda temporal a cada reseÃƒÂ±a
  finalReviews.forEach(r => { r.timeBand = classifyTime(r.time); });

  // Ã¢â€â‚¬Ã¢â€â‚¬ AnÃƒÂ¡lisis estadÃƒÂ­stico de patrones (solo tiene sentido con 6+ reseÃƒÂ±as) Ã¢â€â‚¬Ã¢â€â‚¬
  if (finalReviews.length >= 6) {
    const negReviews = finalReviews.filter(r => r.rating <= 3);
    const totalNeg   = finalReviews.filter(r => r.rating <= 2).length;
    const totalMid   = finalReviews.filter(r => r.rating === 3).length;
    const totalPos   = finalReviews.filter(r => r.rating >= 4).length;
    const withOwnerReply = finalReviews.filter(r => r.ownerResponse).length;

    // Ã¢â€â‚¬Ã¢â€â‚¬ MEJORA 1: ClÃƒÂºsteres de dolor separados por ventana temporal Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    const PAIN_CLUSTERS = {
      'instalaciones elÃƒÂ©ctricas': /instalaci[oÃƒÂ³]n|cableado|enchufes|luz|iluminaci[oÃƒÂ³]n|electricidad|cuadro el[eÃƒÂ©]ctrico/i,
      'temperatura/climatizaciÃƒÂ³n': /fr[iÃƒÂ­]o|calor|temperatura|aire acondicionado|calefacci[oÃƒÂ³]n|t[eÃƒÂ©]rmico/i,
      'deterioro visible':         /viejo|antiguo|deteriorado|descuidado|sucio|roto|desperfecto|anticuado|desgastado/i,
      'obras/reformas mencionadas': /obra|reforma|renovaci[oÃƒÂ³]n|remodelado|construcci[oÃƒÂ³]n/i,
      'ruido/acÃƒÂºstica':            /ruido|ac[uÃƒÂº]stica|aisla|paredes finas|se escucha todo/i,
      'humedad/goteras':           /humedad|gotera|grieta|hongos|moho|h[uÃƒÂº]medo/i,
      'baÃƒÂ±os deteriorados':        /ba[ÃƒÂ±n]o|aseo|ducha|vÃƒÂ¡ter|inodoro|grifo/i,
      'habitaciones/espacios':     /habitaci[oÃƒÂ³]n peque|espacio reducido|muy peque|estrecho/i,
    };

    const painByTime = {}; // { 'ruido/acÃƒÂºstica': { reciente: 4, medio: 1, antiguo: 2, best_snippet: '...' } }
    for (const [label, regex] of Object.entries(PAIN_CLUSTERS)) {
      const matches = negReviews.filter(r => regex.test(r.text));
      if (!matches.length) continue;
      const byBand = { reciente: 0, medio: 0, antiguo: 0, desconocido: 0 };
      matches.forEach(r => byBand[r.timeBand || 'desconocido']++);
      // Tomar el snippet de la coincidencia mÃƒÂ¡s reciente y negativa
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

    // Generar topPains con informaciÃƒÂ³n temporal: activos (recientes) primero
    const topPains = Object.entries(painByTime)
      .sort((a, b) => {
        // Priorizar por menciones recientes, luego por total
        const recentDiff = b[1].reciente - a[1].reciente;
        return recentDiff !== 0 ? recentDiff : b[1].total - a[1].total;
      })
      .slice(0, 4)
      .map(([label, data]) => {
        const temporalNote = data.reciente >= 2
          ? `Ã¢Å¡Â¡ ACTIVO Ã¢â‚¬â€ ${data.reciente} menciones recientes (<6 meses)`
          : data.reciente === 1
          ? `Ã¢Å¡Â¡ 1 menciÃƒÂ³n reciente + ${data.medio + data.antiguo} anteriores`
          : data.antiguo >= 2
          ? `Ã¢ÂÂ³ HISTÃƒâ€œRICO Ã¢â‚¬â€ ${data.antiguo} menciones antiguas (>18 meses), puede estar resuelto`
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

    // Ã¢â€â‚¬Ã¢â€â‚¬ MEJORA 2: Trending de rating (recientes vs antiguos) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    const recentRatings  = finalReviews.filter(r => r.timeBand === 'reciente').map(r => r.rating);
    const oldRatings     = finalReviews.filter(r => r.timeBand === 'antiguo').map(r => r.rating);
    let ratingTrend = null;
    if (recentRatings.length >= 3 && oldRatings.length >= 3) {
      const avgRecent = recentRatings.reduce((a,b) => a+b, 0) / recentRatings.length;
      const avgOld    = oldRatings.reduce((a,b) => a+b, 0) / oldRatings.length;
      const delta     = +(avgRecent - avgOld).toFixed(1);
      ratingTrend = { avgRecent: +avgRecent.toFixed(1), avgOld: +avgOld.toFixed(1), delta };
    }

    // Ã¢â€â‚¬Ã¢â€â‚¬ AnÃƒÂ¡lisis de respuestas del propietario Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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
      'ubicaciÃƒÂ³n': /ubicaci[oÃƒÂ³]n|bien situado|c[eÃƒÂ©]ntrico|cerca|localiz/i,
      'personal/atenciÃƒÂ³n': /personal|atenci[oÃƒÂ³]n|amable|simpÃƒÂ¡tico|servicio|trato/i,
      'precio/calidad': /precio|calidad.precio|relaciÃƒÂ³n calidad|econ[oÃƒÂ³]mic/i,
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
        : 'Propietario no responde a reseÃƒÂ±as',
      topPains,       // array enriquecido con temporalidad
      posValues,      // quÃƒÂ© valoran en las positivas
      ratingTrend,    // { avgRecent, avgOld, delta } o null
      fetchedAt: Date.now(),
    };
  }

  return finalReviews;
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Llamada a Gemini API (100% gratuito) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
async function generateEmailWithClaude(lead, reviewsData, claudeKey, liveWebData = {}, newsContext = '') {
  const p = getProfile();
  const firma = buildFirmaText();
  const saludo = buildSaludo(lead.name, lead.company);

  // Ã¢â€â‚¬Ã¢â€â‚¬ MEJORA 3: DiagnÃƒÂ³stico estructurado pre-analizado Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  // En vez de volcar reseÃƒÂ±as crudas, le pasamos el anÃƒÂ¡lisis ya hecho + 1-2 ejemplos
  // por problema. Menos tokens, mÃƒÂ¡s seÃƒÂ±al, mejor email.
  let reviewsContext = '';
  if (reviewsData.reviews && reviewsData.reviews.length > 0) {
    const reviews = reviewsData.reviews;
    const stats   = reviews._stats || null;

    if (stats && stats.topPains && stats.topPains.length > 0) {
      // Ã¢â€â‚¬Ã¢â€â‚¬ Trending de rating Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
      let trendBlock = '';
      if (stats.ratingTrend) {
        const { avgRecent, avgOld, delta } = stats.ratingTrend;
        if (delta <= -0.3)
          trendBlock = `\nÃ°Å¸â€œâ€° RATING EN CAÃƒÂDA: ${avgOld}Ã¢Ëœâ€¦ hace >1 aÃƒÂ±o Ã¢â€ â€™ ${avgRecent}Ã¢Ëœâ€¦ ÃƒÂºltimos meses (ÃŽâ€${delta}) Ã¢â‚¬â€ URGENCIA ALTA`;
        else if (delta >= 0.3)
          trendBlock = `\nÃ°Å¸â€œË† RATING MEJORANDO: ${avgOld}Ã¢Ëœâ€¦ Ã¢â€ â€™ ${avgRecent}Ã¢Ëœâ€¦ Ã¢â‚¬â€ puede estar recuperÃƒÂ¡ndose solo, abordaje sutil`;
        else
          trendBlock = `\nÃ¢â€ â€™ Rating estable (sin tendencia clara)`;
      }

      // Ã¢â€â‚¬Ã¢â€â‚¬ Propietario Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
      let ownerBlock = '';
      if (stats.ownerAcknowledges >= 2)
        ownerBlock = `\nÃ¢Å¡Â Ã¯Â¸Â PROPIETARIO RECONOCE PROBLEMAS EN ${stats.ownerAcknowledges} RESPUESTAS Ã¢â‚¬â€ mÃƒÂ¡xima seÃƒÂ±al de apertura`;
      else if (stats.ownerDenies >= 2)
        ownerBlock = `\nÃ‚Â· Propietario niega problemas en ${stats.ownerDenies} respuestas Ã¢â‚¬â€ abordaje sutil`;
      else if (stats.withOwnerReply === 0)
        ownerBlock = `\nÃ‚Â· Propietario no responde reseÃƒÂ±as Ã¢â‚¬â€ no es consciente del impacto`;

      // Ã¢â€â‚¬Ã¢â€â‚¬ Problemas por temporalidad Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
      const activeProblems   = stats.topPains.filter(p => p.isActive);
      const historicProblems = stats.topPains.filter(p => p.isHistorical && !p.isActive);

      const problemsBlock = [
        activeProblems.length
          ? `Ã°Å¸Å½Â¯ PROBLEMAS ACTIVOS Ã¢â‚¬â€ USAR COMO ARGUMENTO CENTRAL:\n` +
            activeProblems.map(p =>
              `  Ã¢â€ â€™ ${p.label}: ${p.temporal}\n     Ejemplo real [${p.rating}Ã¢Ëœâ€¦${p.time ? ', '+p.time : ''}]: "${p.snippet}..."`
            ).join('\n')
          : '',
        historicProblems.length
          ? `Ã¢ÂÂ³ PROBLEMAS HISTÃƒâ€œRICOS Ã¢â‚¬â€ NO USAR como argumento (pueden estar resueltos):\n` +
            historicProblems.map(p => `  Ã¢â€ â€™ ${p.label}: ${p.temporal}`).join('\n')
          : '',
        stats.posValues && stats.posValues.length
          ? `Ã¢Å“â€¦ LO QUE VALORAN (no contradecir): ${stats.posValues.join(', ')}`
          : '',
      ].filter(Boolean).join('\n\n');

      reviewsContext = `DIAGNÃƒâ€œSTICO DE RESEÃƒâ€˜AS Ã¢â‚¬â€ PRE-ANALIZADO (no reanalizar, usar directamente):
Muestra: ${stats.total} reseÃƒÂ±as Ã‚Â· ${stats.neg} negativas Ã‚Â· ${stats.mid} neutras Ã‚Â· ${stats.pos} positivas
${stats.ownerEngagement}${ownerBlock}${trendBlock}

${problemsBlock}`;

    } else {
      // Fallback compacto para < 6 reseÃƒÂ±as
      const neg = reviews.filter(r => r.rating <= 2).slice(0, 4);
      const pos = reviews.filter(r => r.rating >= 4).slice(0, 3);
      const allText = reviews.map(r => r.text).join(' ').toLowerCase();
      const painKeywords = ['ruido','calor','frÃƒÂ­o','humedad','goteras','instalaciÃƒÂ³n','reforma','deteriorad','antiguo','viejo'];
      const painMentions = painKeywords.filter(k => allText.includes(k)).join(', ');

      reviewsContext = `RESEÃƒâ€˜AS DE GOOGLE (${reviews.length} disponibles, nota ${reviewsData.rating || 'N/A'}/5):
${painMentions ? `Ã¢Å¡Â Ã¯Â¸Â Palabras clave: ${painMentions}\n` : ''}NEGATIVAS: ${neg.map(r => `[${r.rating}Ã¢Ëœâ€¦${r.time?' '+r.time:''}] "${r.text.slice(0,120)}"${r.ownerResponse?'\n  Ã¢â€ â€™ PROPIETARIO: "'+r.ownerResponse.slice(0,100)+'"':''}`).join('\n') || 'Ninguna'}
POSITIVAS (quÃƒÂ© valoran): ${pos.map(r => `[${r.rating}Ã¢Ëœâ€¦] "${r.text.slice(0,80)}"`).join('\n') || 'Ninguna'}`;
    }
  } else {
    reviewsContext = 'Sin reseÃƒÂ±as disponibles. Personaliza basÃƒÂ¡ndote en el sector y descripciÃƒÂ³n del negocio.';
  }

    const segmentTone = SEGMENT_TONE[lead.segment] || SEGMENT_TONE['Default'];

  const prompt = `Eres uno de los mejores copywriters B2B de EspaÃƒÂ±a, especializado en ventas para empresas de reformas y construcciÃƒÂ³n. Tu misiÃƒÂ³n: escribir el email de prospecciÃƒÂ³n mÃƒÂ¡s personalizado y persuasivo posible para Voltium Madrid.

Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
VOLTIUM MADRID Ã¢â‚¬â€ CONTEXTO COMPLETO
Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
Empresa: Voltium Madrid (voltiummadrid.es)
Remitente: ${p.name} | ${p.email}
Servicios: Reforma integral llave en mano Ã‚Â· Aislamientos acÃƒÂºsticos y tÃƒÂ©rmicos Ã‚Â· Impermeabilizaciones Ã‚Â· Instalaciones fotovoltaicas Ã‚Â· Eficiencia energÃƒÂ©tica Ã‚Â· RedistribuciÃƒÂ³n de espacios Ã‚Â· Mantenimiento integral de naves industriales (revisiones periÃƒÂ³dicas, correctivo y preventivo Ã¢â‚¬â€ cubriendo estructura, instalaciones elÃƒÂ©ctricas, cubierta, impermeabilizaciÃƒÂ³n y sistemas contra incendios)
Diferenciales REALES:
  - Un ÃƒÂºnico responsable tÃƒÂ©cnico durante toda la obra (no subcontratan)
  - Presupuesto cerrado desde el primer dÃƒÂ­a, sin sorpresas
  - DocumentaciÃƒÂ³n digital del proyecto accesible en tiempo real
  - PlanificaciÃƒÂ³n previa detallada antes de empezar
FilosofÃƒÂ­a: "La reforma como proceso previsible, controlado y bien ejecutado"
GalerÃƒÂ­a: https://www.voltiummadrid.es/galer%c3%Ada

Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
EMPRESA A CONTACTAR
Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
Nombre: ${lead.company}
Sector: ${lead.segment}
DirecciÃƒÂ³n: ${lead.address || 'Madrid'}
Web: ${lead.website || 'No disponible'}
Nota Google: ${reviewsData.rating ? reviewsData.rating + '/5 (' + (reviewsData.ratingCount || 0) + ' reseÃƒÂ±as)' : 'Sin datos'}
DescripciÃƒÂ³n: ${lead.description || 'No disponible'}
${lead.decision_maker ? 'Decisor identificado: ' + lead.decision_maker : ''}
${lead.incorporationYear ? 'Empresa fundada en: ' + lead.incorporationYear + ' (' + (new Date().getFullYear() - lead.incorporationYear) + ' aÃƒÂ±os)' : ''}
${lead.domainYear ? 'Dominio registrado en: ' + lead.domainYear + ' (' + lead.domainAge + ' aÃƒÂ±os)' : ''}
${lead.legalStatus ? 'Estado legal: ' + lead.legalStatus : ''}
${lead.companyType ? 'Tipo de empresa: ' + lead.companyType : ''}
${lead.signals && lead.signals.length ? 'SEÃƒâ€˜ALES DETECTADAS EN ENRIQUECIMIENTO:\n' + lead.signals.map(s => '  Ã‚Â· ' + s).join('\n') : ''}
${lead.competitorBetter ? 'PRESIÃƒâ€œN COMPETITIVA: Su competidor directo "' + lead.competitorBetter.name + '" tiene ' + lead.competitorBetter.diff + ' estrellas mÃƒÂ¡s (' + lead.competitorBetter.rating + 'Ã¢Ëœâ€¦ vs ' + lead.rating + 'Ã¢Ëœâ€¦). Usar este dato para crear urgencia.' : ''}
${lead.reviewSummary ? 'RESEÃƒâ€˜AS REALES SCRAPEADAS (ÃƒÂºsalas para personalizar):\n' + lead.reviewSummary : ''}
${lead.techStack && lead.techStack.length ? 'Stack tecnolÃƒÂ³gico detectado: ' + lead.techStack.join(', ') : ''}
${lead.webLoadMs && lead.webLoadMs > 2000 ? 'Web lenta (' + (lead.webLoadMs/1000).toFixed(1) + 's) Ã¢â‚¬â€ posible abandono tecnolÃƒÂ³gico' : ''}
${lead.optimalContact ? 'MEJOR MOMENTO DE CONTACTO: ' + lead.optimalContact.slot + ' (' + lead.optimalContact.reason + ')' : ''}
${lead.fachadaAnalysis ? 'ANÃƒÂLISIS VISUAL FACHADA (Street View): ' + lead.fachadaAnalysis : ''}
${liveWebData.recentContent ? '\nCONTENIDO ACTUAL DE SU WEB (rastreado ahora mismo):\n' + liveWebData.recentContent : ''}
${liveWebData.freshSignals && liveWebData.freshSignals.length ? '\nSEÃƒâ€˜ALES DETECTADAS EN LA WEB HOY: ' + liveWebData.freshSignals.join(', ') : ''}
${liveWebData.chosenPainContext ? '\n\nÃ°Å¸Å½Â¯ ' + liveWebData.chosenPainContext : ''}
${newsContext ? '\nNOTICIAS RECIENTES ENCONTRADAS SOBRE ESTA EMPRESA:\n' + newsContext : ''}

${reviewsContext}

Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
PROCESO DE ESCRITURA Ã¢â‚¬â€ SIGUE ESTE ORDEN
Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â

PASO 1 Ã¢â‚¬â€ ANALIZA TODA LA INFORMACIÃƒâ€œN DISPONIBLE:
A) RESEÃƒâ€˜AS: Ã‚Â¿QuÃƒÂ© problema aparece repetido? Ã‚Â¿Lo reconoce el propietario en sus respuestas?
B) WEB ACTUAL: Ã‚Â¿QuÃƒÂ© comunican como sus prioridades ahora mismo? Ã‚Â¿Hay seÃƒÂ±ales de cambio, expansiÃƒÂ³n, renovaciÃƒÂ³n?
C) NOTICIAS: Ã‚Â¿Hay algo reciente (inauguraciÃƒÂ³n, premio, obra, cambio) que puedas mencionar de forma natural?
D) SEÃƒâ€˜ALES DE ENRIQUECIMIENTO: Ã‚Â¿La empresa es nueva (dominio reciente)? Ã‚Â¿Lleva muchos aÃƒÂ±os? Ã‚Â¿QuÃƒÂ© dice de su momento actual?
E) DECISOR: Si se identificÃƒÂ³ un decisor, personaliza el saludo y el tono para ese perfil de cargo

PASO 2 Ã¢â‚¬â€ ELIGE EL GANCHO (por este orden de prioridad):
1. Noticia reciente concreta Ã¢â€ â€™ el gancho mÃƒÂ¡s potente y diferenciador, nadie mÃƒÂ¡s lo usa
2. CrÃƒÂ­tica recurrente en reseÃƒÂ±as que Voltium resuelve Ã¢â€ â€™ muy efectivo, demuestra que hiciste los deberes
3. SeÃƒÂ±al de la web actual (expansiÃƒÂ³n, renovaciÃƒÂ³n, nueva apertura) Ã¢â€ â€™ demuestra que conoces su momento
4. Si la empresa es nueva (< 3 aÃƒÂ±os) Ã¢â€ â€™ enfoca en construir bien desde el principio
5. Si lleva muchos aÃƒÂ±os Ã¢â€ â€™ enfoca en modernizar sin perder la identidad
6. Dolor universal del sector Ã¢â€ â€™ solo si no hay nada mÃƒÂ¡s especÃƒÂ­fico

PASO 3 Ã¢â‚¬â€ ESTRUCTURA DEL EMAIL (PAS evolucionado):
  PÃƒÂRRAFO 1 Ã¢â‚¬â€ RECONOCIMIENTO ESPECÃƒÂFICO: Menciona algo concreto y real que diferencia a esta empresa (no genÃƒÂ©rico). Demuestra que la conoces.
  PÃƒÂRRAFO 2 Ã¢â‚¬â€ EL PROBLEMA: Nombra la queja recurrente con empatÃƒÂ­a. Si el propietario ya la reconociÃƒÂ³ en sus respuestas, mejor todavÃƒÂ­a Ã¢â‚¬â€ ÃƒÂºsalo.
  PÃƒÂRRAFO 3 Ã¢â‚¬â€ LA AGITACIÃƒâ€œN: Conecta ese problema con consecuencias reales (nota media, precio por noche, clientes perdidos, factura energÃƒÂ©tica...). Hazlo sentir el coste de no actuar.
  PÃƒÂRRAFO 4 Ã¢â‚¬â€ LA SOLUCIÃƒâ€œN VOLTIUM: Explica brevemente cÃƒÂ³mo Voltium resuelve EXACTAMENTE ese problema. Menciona el servicio concreto (aislamiento acÃƒÂºstico, reforma por fases, fotovoltaica...). Incluye el diferencial mÃƒÂ¡s relevante para este caso.
  PÃƒÂRRAFO 5 Ã¢â‚¬â€ PRUEBA / CREDIBILIDAD: Una frase con la galerÃƒÂ­a de proyectos.
  PÃƒÂRRAFO 6 Ã¢â‚¬â€ CTA: Llamada de 15 minutos, sin compromiso. Directo y especÃƒÂ­fico.

DOLORES UNIVERSALES POR SECTOR (usar si no hay reseÃƒÂ±as):
  Hoteles Ã¢â€ â€™ nota media en Booking/TripAdvisor, precio por noche, aislamiento acÃƒÂºstico
  Retail Ã¢â€ â€™ primeros 8 segundos del cliente, ticket medio, tiempo de permanencia
  Oficinas Ã¢â€ â€™ productividad perdida, imagen corporativa, coste energÃƒÂ©tico
  Industrial Ã¢â€ â€™ cumplimiento normativo, eficiencia de producciÃƒÂ³n, coste elÃƒÂ©ctrico, paradas de emergencia por falta de mantenimiento preventivo de la nave (cubierta, instalaciones elÃƒÂ©ctricas, sistemas contra incendios)
  Educativo Ã¢â€ â€™ calendario lectivo imposible de interrumpir, confort de alumnos
  Deportivo Ã¢â€ â€™ bajas de socios por instalaciones deterioradas, retenciÃƒÂ³n
  Cultural Ã¢â€ â€™ plazos inamovibles, identidad del espacio, programaciÃƒÂ³n continua
  Comercial Ã¢â€ â€™ cada dÃƒÂ­a cerrado es dinero perdido, experiencia del cliente

Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
PERFIL DEL SECTOR Ã¢â‚¬â€ ADAPTA TODO A ESTO
Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
Tono para este sector: ${segmentTone.tone}
Principal dolor de este sector: ${segmentTone.pain}
ÃƒÂngulo de venta mÃƒÂ¡s efectivo: ${segmentTone.angle}
PROHIBIDO en este sector: ${segmentTone.forbidden}

REGLAS DE ESCRITURA Ã¢â‚¬â€ NIVEL DIOS
Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
Ã¢Å“â€¦ Asuntos (genera 3 MUY distintos entre sÃƒÂ­): uno emocional, uno racional/dato, uno de curiosidad/intriga
Ã¢Å“â€¦ Primera frase: debe enganchar en 3 segundos. Que demuestre que conoces su negocio.
Ã¢Å“â€¦ Tono: adapta al perfil del sector definido arriba. No uses el mismo tono para un hotel y una nave industrial.
Ã¢Å“â€¦ Especificidad: cuanto mÃƒÂ¡s concreto, mÃƒÂ¡s creÃƒÂ­ble. "aislamiento acÃƒÂºstico de tuberÃƒÂ­as" > "reformas"
Ã¢Å“â€¦ Longitud: mÃƒÂ¡ximo 220 palabras en el cuerpo. Cada frase debe ganar su sitio.
Ã¢Å“â€¦ PÃƒÂ¡rrafos cortos: mÃƒÂ¡ximo 3-4 lÃƒÂ­neas cada uno. FÃƒÂ¡cil de leer en mÃƒÂ³vil.
Ã¢Å“â€¦ El email DEBE empezar EXACTAMENTE con: "\${saludo},"
Ã¢Å“â€¦ El email DEBE terminar EXACTAMENTE con: "{{FIRMA}}"

Ã¢ÂÅ’ NUNCA: "espero que este email te encuentre bien"
Ã¢ÂÅ’ NUNCA: frases genÃƒÂ©ricas que podrÃƒÂ­an enviarse a cualquier empresa
Ã¢ÂÅ’ NUNCA: inventar datos, nombres de clientes o cifras concretas
Ã¢ÂÅ’ NUNCA: mencionar a la competencia
Ã¢ÂÅ’ NUNCA: sonar desesperado o presionar
Ã¢ÂÅ’ NUNCA: ignorar el perfil del sector Ã¢â‚¬â€ el tono y el ÃƒÂ¡ngulo deben ser los indicados arriba

Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
EJEMPLO DE CALIDAD OBJETIVO
Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
(Para un hotel con crÃƒÂ­ticas de ruido en reseÃƒÂ±as)

Asunto: El SueÃƒÂ±o del Quijote: el ÃƒÂºnico punto que sus huÃƒÂ©spedes repiten

"Sus huÃƒÂ©spedes lo dicen sin dudar: el patio, la decoraciÃƒÂ³n, el trato. Hay algo genuino en ese alojamiento que no se construye con dinero.

Y sin embargo, hay una queja que aparece una y otra vez: el ruido. Las tuberÃƒÂ­as. Los pasillos. Incluso el interruptor del baÃƒÂ±o se escucha de noche.

Ustedes ya lo saben. El problema no es la voluntad, es el aislamiento acÃƒÂºstico de la construcciÃƒÂ³n.

Es exactamente lo que hacemos en Voltium Madrid. Trabajamos habitaciÃƒÂ³n por habitaciÃƒÂ³n, en los perÃƒÂ­odos de menor ocupaciÃƒÂ³n, con presupuesto cerrado y sin cerrar el hotel.

Una mejora acÃƒÂºstica bien ejecutada no solo elimina la queja mÃƒÂ¡s recurrente Ã¢â‚¬â€ transforma directamente la nota media en Booking y la tarifa que pueden cobrar por noche."

(Ese nivel de especificidad y conexiÃƒÂ³n directa entre reseÃƒÂ±as y soluciÃƒÂ³n es el objetivo)

Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â

Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
FORMATO HTML DEL EMAIL Ã¢â‚¬â€ MUY IMPORTANTE
Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
El campo "body" debe estar en HTML, no en texto plano.

REGLAS DE FORMATO (aplÃƒÂ­calas con criterio, no en exceso):
- Usa <strong>texto</strong> para 2-4 conceptos clave por email: el problema principal, el diferencial mÃƒÂ¡s relevante de Voltium, y el CTA
- Usa <u>texto</u> para subrayar 1-2 datos o frases que el lector NO debe pasar por alto
- Usa <em>texto</em> con moderaciÃƒÂ³n, solo si aÃƒÂ±ade ÃƒÂ©nfasis natural
- Separa pÃƒÂ¡rrafos con <br><br>
- NO formatear mÃƒÂ¡s del 15% del texto Ã¢â‚¬â€ el formato pierde impacto si se abusa
- El objetivo es que el ojo del lector vaya exactamente donde tÃƒÂº quieres

EJEMPLO DE FORMATO BIEN APLICADO:
"Sus clientes lo repiten: el trato, la decoraciÃƒÂ³n, el ambiente. Hay algo genuino en El SueÃƒÂ±o del Quijote que no se construye con dinero.<br><br>Y sin embargo, hay <strong>una queja que aparece una y otra vez</strong>: el ruido. Las tuberÃƒÂ­as. Los pasillos de noche.<br><br>El problema no es la voluntad Ã¢â‚¬â€ es el <u>aislamiento acÃƒÂºstico de la construcciÃƒÂ³n</u>. Y es exactamente lo que hacemos en Voltium Madrid.<br><br>Trabajamos habitaciÃƒÂ³n por habitaciÃƒÂ³n, <strong>sin cerrar el hotel</strong>, con presupuesto cerrado desde el primer dÃƒÂ­a."

Responde ÃƒÅ¡NICAMENTE con JSON vÃƒÂ¡lido, sin markdown, sin texto adicional:
{"subjects":["asunto opciÃƒÂ³n 1 Ã¢â‚¬â€ emocional","asunto opciÃƒÂ³n 2 Ã¢â‚¬â€ dato/racional","asunto opciÃƒÂ³n 3 Ã¢â‚¬â€ curiosidad/intriga"],"body":"HTML del email empezando con '${saludo},'  y terminando con '{{FIRMA}}'","insight":"2-3 frases sobre QUÃƒâ€° FUENTE usaste como gancho principal (reseÃƒÂ±as/web/noticias/seÃƒÂ±ales) y cÃƒÂ³mo el tono del sector influyÃƒÂ³ en el email"}`;

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
    if (response.status === 400) throw new Error('API Key de Gemini invÃƒÂ¡lida. Verifica que la copiaste correctamente.');
    if (response.status === 429) throw new Error('LÃƒÂ­mite de peticiones alcanzado. Espera un momento e intÃƒÂ©ntalo de nuevo.');
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
  if (!rawText) throw new Error('Gemini no devolviÃƒÂ³ texto. Respuesta: ' + JSON.stringify(data).substring(0,200));

  // Comprobar si fue truncado por MAX_TOKENS
  const finishReason = data.candidates?.[0]?.finishReason || '';
  if (finishReason === 'MAX_TOKENS') {
    console.warn('[VOLTFLOW] Respuesta truncada por MAX_TOKENS, intentando recuperar...');
  }

  // Parsear JSON Ã¢â‚¬â€ limpiar fences y recuperar JSON parcial
  let parsed;
  // Paso 1: limpiar markdown fences
  let clean = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // Paso 2: si estÃƒÂ¡ truncado, intentar cerrar el JSON
  if (finishReason === 'MAX_TOKENS') {
    // Contar llaves para intentar cerrar el objeto
    let opens = (clean.match(/\{/g) || []).length;
    let closes = (clean.match(/\}/g) || []).length;
    // Quitar coma o texto suelto al final antes de cerrar
    // IMPORTANTE: no usar replace genÃƒÂ©rico que puede borrar el body
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
    if (!jsonMatch) throw new Error('Gemini no devolviÃƒÂ³ JSON vÃƒÂ¡lido. IntÃƒÂ©ntalo de nuevo.');
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch(e2) {
      throw new Error('Error al parsear respuesta. IntÃƒÂ©ntalo de nuevo.');
    }
  }

  // Handle subjects array (new) and single subject (legacy)
  if (parsed.subjects && Array.isArray(parsed.subjects) && parsed.subjects.length) {
    parsed.subject = parsed.subjects[0];
  }

  // Si body vacÃƒÂ­o, intentar extraerlo directamente del rawText como fallback
  if (!parsed.body) {
    const bodyMatch = rawText.match(/"body"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"insight"|"\s*\})/);
    if (bodyMatch) {
      try { parsed.body = JSON.parse('"' + bodyMatch[1] + '"'); } catch { parsed.body = bodyMatch[1]; }
    }
  }

  if ((!parsed.subject && !parsed.subjects) || !parsed.body)
    throw new Error('Respuesta incompleta. IntÃƒÂ©ntalo de nuevo.');

  // Aplicar firma real
  parsed.body = parsed.body.replace('{{FIRMA}}', firma);

  return parsed;
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Enviar el email generado Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Ã¢â€â‚¬Ã¢â€â‚¬ Herramientas de formato del editor Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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
    // Clipboard API moderna Ã¢â‚¬â€ copia como HTML rico
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const textBlob = new Blob([editor.innerText], { type: 'text/plain' });
    await navigator.clipboard.write([
      new ClipboardItem({ 'text/html': blob, 'text/plain': textBlob })
    ]);

    // Feedback visual en el botÃƒÂ³n
    const btn = document.getElementById('btn-copy-html');
    const orig = btn.innerText;
    btn.innerText = 'Ã¢Å“â€¦ Ã‚Â¡Copiado! Pega en Gmail/Outlook';
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
      showToast('Email copiado como texto sin formato');
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

  emailHistory.unshift({ id: Date.now(), leadId: lead.id, company: lead.company, email: lead.email, segment: lead.segment, date: new Date().toISOString(), status: 'Enviado (IA)', subject, notes: 'Generado con IA + anÃƒÂ¡lisis de reseÃƒÂ±as' });
  localStorage.setItem('gordi_email_history', JSON.stringify(emailHistory));
  // MEJORA 1: Registrar time-to-first-contact
  if (!lead.first_contact_date) {
    lead.first_contact_date = new Date().toISOString();
    lead.ttfc_hours = Math.round((Date.now() - new Date(lead.date)) / 3600000);
  }
  const oldStatus = lead.status;
  const _doSend = () => {
    lead.status_date = new Date().toISOString();
    addActivityLog(lead.id, `Ã¢Å“â€°Ã¯Â¸Â Email IA enviado: "${subject}"`);
    saveLeads(); renderAll(); renderTracking();
    updateStreakData();
    closeAiModal();
    showToast('Ã¢Å“â€°Ã¯Â¸Â Email abierto en tu gestor de correo');
  };
  if (oldStatus !== 'Visita') {
    confirmStatusChange(lead, 'Visita', () => { lead.status = 'Visita'; _doSend(); });
  } else {
    _doSend();
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Regenerar Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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

// Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â

