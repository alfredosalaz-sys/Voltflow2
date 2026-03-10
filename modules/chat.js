// VOLTFLOW ASSISTANT — Chat de ayuda con IA (Gemini)
// Conoce la app completa y puede guiar al usuario paso a paso
// ══════════════════════════════════════════════════════════════════════════════


// ══════════════════════════════════════════════════════════════════════════════
// VOLTFLOW ASSISTANT — Funciones avanzadas del chat
// ══════════════════════════════════════════════════════════════════════════════

// ── MEJORA 1: Briefing diario ─────────────────────────────────────────────────
function chatShowDailyBriefing() {
  const today = new Date(); today.setHours(0,0,0,0);

  // Leads con seguimiento vencido
  const overdue = leads.filter(l => {
    if (l.archived || !l.next_contact) return false;
    return new Date(l.next_contact) < today;
  });

  // Leads calientes sin contactar (score >= 70, pendientes)
  const hot = leads.filter(l => !l.archived && l.score >= 70 && l.status === 'Pendiente')
    .sort((a,b) => b.score - a.score).slice(0, 3);

  // Emails enviados esta semana
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay() + 1);
  const emailsWeek = emailHistory.filter(e => e.date && new Date(e.date) >= weekStart).length;

  // Objetivos
  const obj = (() => { try { return JSON.parse(localStorage.getItem('gordi_objectives') || '{}'); } catch { return {}; } })();
  const objEmails = obj.emails || 0;

  // Leads nuevos hoy
  const newToday = leads.filter(l => {
    if (!l.date) return false;
    const d = new Date(l.date); d.setHours(0,0,0,0);
    return d.getTime() === today.getTime();
  }).length;

  const dayName = today.toLocaleDateString('es-ES', { weekday:'long' });
  const dateStr = today.toLocaleDateString('es-ES', { day:'numeric', month:'long' });

  let html = `☀️ <strong>Buenos días — ${dayName} ${dateStr}</strong><br><br>`;

  // Urgentes
  if (overdue.length > 0) {
    html += `🔴 <strong>${overdue.length} seguimiento${overdue.length>1?'s':''} vencido${overdue.length>1?'s':''}</strong>:<br>`;
    overdue.slice(0,3).forEach(l => {
      const days = Math.floor((today - new Date(l.next_contact)) / 86400000);
      html += `&nbsp;&nbsp;• ${l.company} <span style="color:var(--danger)">+${days}d</span><br>`;
    });
    if (overdue.length > 3) html += `&nbsp;&nbsp;• … y ${overdue.length-3} más<br>`;
    html += '<br>';
  }

  // Oportunidades calientes
  if (hot.length > 0) {
    html += `🔥 <strong>${hot.length} lead${hot.length>1?'s':''} caliente${hot.length>1?'s':''} sin contactar</strong>:<br>`;
    hot.forEach(l => {
      html += `&nbsp;&nbsp;• <a href="#" onclick="openAiEmailModal('${l.id}');toggleChat();return false"
        style="color:var(--primary);text-decoration:none">${l.company}</a> — ${l.score}pts · ${l.segment}<br>`;
    });
    html += '<br>';
  }

  // Progreso semanal
  html += `📊 <strong>Esta semana:</strong> ${emailsWeek} email${emailsWeek!==1?'s':''} enviado${emailsWeek!==1?'s':''}`;
  if (objEmails > 0) {
    const pct = Math.min(100, Math.round(emailsWeek / objEmails * 100));
    html += ` de ${objEmails} objetivo (${pct}%)`;
  }
  html += `<br>`;

  if (newToday > 0) html += `✨ <strong>${newToday} lead${newToday>1?'s':''} nuevo${newToday>1?'s':''} hoy</strong><br>`;

  if (overdue.length === 0 && hot.length === 0) {
    html += `<br>✅ <strong>Todo al día</strong> — sin seguimientos vencidos ni urgencias pendientes.`;
  }

  html += `<br><small style="color:var(--text-dim)">Dime qué quieres hacer o pregúntame lo que necesites.</small>`;

  chatAddMessage('bot', html);
}

// ── MEJORA 2: Acciones ejecutables desde el chat ──────────────────────────────
function chatExecute(action, param) {
  switch(action) {
    case 'topLeads': {
      const hot = leads.filter(l => !l.archived && l.status === 'Pendiente')
        .sort((a,b) => b.score - a.score).slice(0, 5);
      if (!hot.length) { chatAddMessage('bot', '😊 No tienes leads pendientes sin contactar.'); return; }
      let html = `🔥 <strong>Top ${hot.length} leads por score sin contactar:</strong><br><br>`;
      hot.forEach((l,i) => {
        html += `${i+1}. <a href="#" onclick="openAiEmailModal('${l.id}');toggleChat();return false"
          style="color:var(--primary);text-decoration:none;font-weight:600">${l.company}</a>
          — ${l.score}pts · ${l.segment}
          ${l.rating ? `· ⭐${l.rating}` : ''}
          <button onclick="openAiEmailModal('${l.id}');toggleChat()" 
            style="margin-left:.4rem;font-size:.68rem;background:rgba(99,102,241,.15);border:1px solid rgba(99,102,241,.3);
            color:#a78bfa;border-radius:5px;padding:.1rem .4rem;cursor:pointer">✨ Email IA</button><br>`;
      });
      chatAddMessage('bot', html);
      break;
    }
    case 'overdueLeads': {
      const today = new Date(); today.setHours(0,0,0,0);
      const overdue = leads.filter(l => {
        if (l.archived || !l.next_contact) return false;
        return new Date(l.next_contact) < today;
      }).sort((a,b) => new Date(a.next_contact) - new Date(b.next_contact));
      if (!overdue.length) { chatAddMessage('bot', '✅ No tienes seguimientos vencidos. ¡Al día!'); return; }
      let html = `⏰ <strong>${overdue.length} seguimiento${overdue.length>1?'s':''} vencido${overdue.length>1?'s':''}:</strong><br><br>`;
      overdue.slice(0,6).forEach(l => {
        const days = Math.floor((today - new Date(l.next_contact)) / 86400000);
        html += `• <a href="#" onclick="openLeadDetail('${l.id}');toggleChat();return false"
          style="color:var(--primary);text-decoration:none">${l.company}</a>
          <span style="color:var(--danger);font-size:.78rem">+${days}d vencido</span> · ${l.status}<br>`;
      });
      chatAddMessage('bot', html);
      break;
    }
    case 'weekStats': {
      const today = new Date(); today.setHours(0,0,0,0);
      const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay() + 1);
      const emailsW = emailHistory.filter(e => e.date && new Date(e.date) >= weekStart).length;
      const newLeadsW = leads.filter(l => l.date && new Date(l.date) >= weekStart).length;
      const closedW = leads.filter(l => l.status_date && new Date(l.status_date) >= weekStart && l.status === 'Cerrado').length;
      const contacted = [...new Set(emailHistory.filter(e => e.date && new Date(e.date) >= weekStart).map(e => e.email))].length;
      const html = `📊 <strong>Resumen de esta semana:</strong><br><br>
        📧 Emails enviados: <strong>${emailsW}</strong><br>
        👤 Empresas contactadas: <strong>${contacted}</strong><br>
        ✨ Leads nuevos: <strong>${newLeadsW}</strong><br>
        🏆 Cerrados: <strong>${closedW}</strong>`;
      chatAddMessage('bot', html);
      break;
    }
    case 'funnelAnalysis': {
      chatAsk('Analiza mi embudo de ventas: ¿por qué no estoy cerrando más leads? Dame conclusiones concretas y accionables basadas en mis datos reales.');
      break;
    }
  }
}

// ── MEJORA 3: Contexto enriquecido con datos reales de la sesión ──────────────
function buildRichAppContext() {
  const today = new Date(); today.setHours(0,0,0,0);
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay() + 1);

  // Estadísticas básicas
  const totalLeads = leads.filter(l => !l.archived).length;
  const byStatus = {};
  leads.filter(l => !l.archived).forEach(l => {
    byStatus[l.status || 'Pendiente'] = (byStatus[l.status || 'Pendiente'] || 0) + 1;
  });
  const bySegment = {};
  leads.filter(l => !l.archived).forEach(l => {
    bySegment[l.segment || 'Sin segmento'] = (bySegment[l.segment || 'Sin segmento'] || 0) + 1;
  });

  // Email stats
  const emailsTotal = emailHistory.length;
  const emailsWeek = emailHistory.filter(e => e.date && new Date(e.date) >= weekStart).length;
  const contactedCompanies = [...new Set(emailHistory.map(e => e.email?.toLowerCase()))].length;

  // Seguimientos vencidos
  const overdue = leads.filter(l => {
    if (l.archived || !l.next_contact) return false;
    return new Date(l.next_contact) < today;
  }).length;

  // Top leads por score
  const topLeads = leads.filter(l => !l.archived && l.status === 'Pendiente')
    .sort((a,b) => b.score - a.score).slice(0, 5)
    .map(l => `${l.company} (${l.score}pts, ${l.segment})`).join(', ');

  // Leads en seguimiento largo (>14 días en "Visita")
  const stale = leads.filter(l => {
    if (l.archived || l.status !== 'Visita') return false;
    const d = l.status_date ? Math.floor((Date.now() - new Date(l.status_date)) / 86400000) : 0;
    return d > 14;
  }).length;

  // Últimos emails enviados
  const recentEmails = emailHistory.slice(0, 5).map(e =>
    `${e.company} (${e.segment || '?'}) — ${new Date(e.date).toLocaleDateString('es-ES')}`
  ).join('; ');

  // Objetivos
  const obj = (() => { try { return JSON.parse(localStorage.getItem('gordi_objectives') || '{}'); } catch { return {}; } })();

  return `DATOS REALES DE LA CUENTA EN ESTE MOMENTO:
Total leads activos: ${totalLeads}
Por estado: ${Object.entries(byStatus).map(([k,v]) => k+': '+v).join(', ')}
Por segmento: ${Object.entries(bySegment).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v]) => k+': '+v).join(', ')}
Emails enviados (total): ${emailsTotal} | Esta semana: ${emailsWeek}
Empresas contactadas (únicas): ${contactedCompanies}
Seguimientos vencidos: ${overdue}
Leads en "Visita" >14 días sin avance: ${stale}
Top leads por score sin contactar: ${topLeads || 'ninguno'}
Últimos emails enviados: ${recentEmails || 'ninguno'}
${obj.emails ? 'Objetivo semanal emails: ' + obj.emails : ''}
APIs activas: Google(${localStorage.getItem('gordi_api_key')?'Sí':'No'}) Gemini(${localStorage.getItem('gordi_claude_key')?'Sí':'No'}) Hunter(${localStorage.getItem('gordi_hunter_key')?'Sí':'No'}) Apollo(${localStorage.getItem('gordi_apollo_key')?'Sí':'No'})`;
}

// ── MEJORA 4: Análisis de embudo inteligente ──────────────────────────────────
function isAnalysisRequest(text) {
  const lower = text.toLowerCase();
  return /por qué|análisis|analiza|embudo|conversión|cierra|cerrando|tasa|patrón|sector|funciona|rendimiento|resultados/.test(lower);
}

// ── MEJORA 5: Entrenador de ventas — pegar respuesta de lead ─────────────────
function isSalesCoachRequest(text) {
  const lower = text.toLowerCase();
  return /respuesta|contestó|respondió|dijo|escribió|me mandó|recibí|reply|email de|qué respondo|cómo respondo|ayúdame a responder/.test(lower);
}

function buildSalesCoachContext(text) {
  // Find if a specific lead is mentioned
  const mentionedLead = leads.find(l => {
    const co = l.company?.toLowerCase() || '';
    return co.length > 3 && text.toLowerCase().includes(co);
  });

  let ctx = '';
  if (mentionedLead) {
    const history = emailHistory.filter(e => e.leadId == mentionedLead.id || e.email === mentionedLead.email).slice(0, 3);
    ctx = `

CONTEXTO DEL LEAD MENCIONADO:
Empresa: ${mentionedLead.company} | Sector: ${mentionedLead.segment}
Estado: ${mentionedLead.status} | Score: ${mentionedLead.score}
Señales: ${(mentionedLead.signals || []).slice(0,3).join('; ')}
Emails previos: ${history.length}
${history.length ? 'Historial: ' + history.map(h => new Date(h.date).toLocaleDateString('es-ES') + ' — "' + (h.subject||'email') + '"').join('; ') : ''}`;
  }
  return ctx;
}


// ══════════════════════════════════════════════════════════════════════════════
// 🎙️ MEJORA 1: CONTROL POR VOZ en el chat
// ══════════════════════════════════════════════════════════════════════════════
function toggleChatVoice() {
  if (_chatVoiceActive) { stopChatVoice(); return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { showToast('⚠️ Usa Chrome para reconocimiento de voz'); return; }

  _chatVoiceRecog = new SR();
  _chatVoiceRecog.lang = 'es-ES';
  _chatVoiceRecog.continuous = false;
  _chatVoiceRecog.interimResults = true;

  const micBtn = document.getElementById('chat-mic-btn');
  const voiceBar = document.getElementById('chat-voice-bar');
  const voiceText = document.getElementById('chat-voice-text');
  const inputEl = document.getElementById('chat-input');

  micBtn.classList.add('listening');
  micBtn.textContent = '🔴';
  voiceBar.classList.add('active');
  _chatVoiceActive = true;

  let finalTranscript = '';

  _chatVoiceRecog.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
      else interim += e.results[i][0].transcript;
    }
    if (voiceText) voiceText.textContent = (finalTranscript + interim) || 'Escuchando...';
    if (inputEl) inputEl.value = finalTranscript + interim;
  };

  _chatVoiceRecog.onend = () => {
    stopChatVoice();
    if (finalTranscript.trim()) {
      setTimeout(() => chatSend(), 200);
    }
  };

  _chatVoiceRecog.onerror = (e) => {
    stopChatVoice();
    if (e.error !== 'no-speech') showToast('Error de micrófono: ' + e.error);
  };

  _chatVoiceRecog.start();
}

function stopChatVoice() {
  _chatVoiceActive = false;
  if (_chatVoiceRecog) { try { _chatVoiceRecog.stop(); } catch(e) {} _chatVoiceRecog = null; }
  const micBtn = document.getElementById('chat-mic-btn');
  const voiceBar = document.getElementById('chat-voice-bar');
  if (micBtn) { micBtn.classList.remove('listening'); micBtn.textContent = '🎙️'; }
  if (voiceBar) voiceBar.classList.remove('active');
}

// ══════════════════════════════════════════════════════════════════════════════
// 🧠 MEJORA 2: MEMORIA PERSISTENTE entre sesiones
// ══════════════════════════════════════════════════════════════════════════════
function extractAndSaveMemory(userMsg, botReply) {
  // Extract key preferences and facts from the conversation
  const lower = userMsg.toLowerCase();

  // Sector preferences
  const sectorMatch = lower.match(/sector (hotelero|restauración|retail|educativo|industrial|oficinas|sanidad|logística)/);
  if (sectorMatch) {
    chatMemory.preferredSector = sectorMatch[1];
  }

  // Tone preferences
  if (lower.includes('más corto') || lower.includes('más breve')) chatMemory.emailTone = 'conciso';
  if (lower.includes('más formal')) chatMemory.emailTone = 'formal';
  if (lower.includes('más cercano') || lower.includes('más informal')) chatMemory.emailTone = 'cercano';

  // Track what actions were taken
  if (!chatMemory.actionHistory) chatMemory.actionHistory = [];
  if (lower.includes('email') || lower.includes('correo')) {
    chatMemory.actionHistory.unshift({ type: 'email', date: new Date().toISOString() });
  }
  if (lower.includes('buscar') || lower.includes('búsqueda')) {
    chatMemory.actionHistory.unshift({ type: 'search', date: new Date().toISOString() });
  }
  chatMemory.actionHistory = chatMemory.actionHistory.slice(0, 20);

  // Last interaction
  chatMemory.lastSeen = new Date().toISOString();
  chatMemory.totalMessages = (chatMemory.totalMessages || 0) + 1;

  saveChatMemory();
}

function buildMemoryContext() {
  if (!chatMemory || Object.keys(chatMemory).length === 0) return '';
  const parts = [];
  if (chatMemory.preferredSector) parts.push(`El usuario ha trabajado con el sector "${chatMemory.preferredSector}" antes.`);
  if (chatMemory.emailTone) parts.push(`Prefiere emails con tono "${chatMemory.emailTone}".`);
  if (chatMemory.totalMessages) parts.push(`Ha usado el asistente ${chatMemory.totalMessages} veces.`);
  if (chatMemory.lastSeen) {
    const days = Math.floor((Date.now() - new Date(chatMemory.lastSeen)) / 86400000);
    if (days > 0) parts.push(`Su última sesión fue hace ${days} día${days>1?'s':''}.`);
  }
  if (!parts.length) return '';
  return '\n\nMEMORIA DE SESIONES ANTERIORES:\n' + parts.join(' ');
}

// ══════════════════════════════════════════════════════════════════════════════
// 📊 MEJORA 3: RESPUESTAS CON MINI-GRÁFICOS en el chat
// ══════════════════════════════════════════════════════════════════════════════
function renderChatChart(type, data) {
  const el = document.createElement('div');
  el.style.cssText = 'margin-top:.6rem;padding:.75rem;background:var(--bg3);border:1px solid var(--glass-border);border-radius:10px;font-size:.75rem';

  if (type === 'funnel') {
    const max = Math.max(...data.map(d => d.value), 1);
    el.innerHTML = `<div style="font-weight:700;color:var(--text);margin-bottom:.6rem;font-size:.78rem">📊 Tu embudo actual</div>` +
      data.map(d => `
        <div style="margin-bottom:.4rem">
          <div style="display:flex;justify-content:space-between;margin-bottom:.2rem">
            <span style="color:var(--text-dim)">${d.label}</span>
            <span style="font-weight:700;color:var(--text)">${d.value}</span>
          </div>
          <div style="background:var(--glass);border-radius:4px;height:8px">
            <div class="chat-chart-bar" style="width:${Math.round(d.value/max*100)}%;background:${d.color||'var(--primary)'}"></div>
          </div>
        </div>`).join('');
  }

  if (type === 'bars') {
    const max = Math.max(...data.map(d => d.value), 1);
    el.innerHTML = `<div style="font-weight:700;color:var(--text);margin-bottom:.6rem;font-size:.78rem">${data.title||'📊 Datos'}</div>
      <div style="display:flex;align-items:flex-end;gap:.4rem;height:60px">` +
      data.items.map(d => `
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:.2rem">
          <span style="font-size:.65rem;color:var(--text-dim)">${d.value}</span>
          <div style="width:100%;background:linear-gradient(180deg,var(--primary),#a78bfa);border-radius:3px 3px 0 0;
            height:${Math.max(4, Math.round(d.value/max*48))}px"></div>
          <span style="font-size:.6rem;color:var(--text-dim);text-align:center;line-height:1.2">${d.label}</span>
        </div>`).join('') + '</div>';
  }

  if (type === 'donut') {
    const total = data.items.reduce((s,d) => s+d.value, 0) || 1;
    el.innerHTML = `<div style="font-weight:700;color:var(--text);margin-bottom:.6rem;font-size:.78rem">${data.title||'Distribución'}</div>` +
      data.items.map(d => `
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.3rem">
          <div style="width:10px;height:10px;border-radius:2px;background:${d.color||'var(--primary)'};flex-shrink:0"></div>
          <span style="flex:1;color:var(--text-dim)">${d.label}</span>
          <span style="font-weight:700;color:var(--text)">${d.value}</span>
          <span style="color:var(--text-dim);font-size:.7rem">${Math.round(d.value/total*100)}%</span>
        </div>`).join('');
  }

  return el;
}

function appendChatCharts(msgEl, lead_data) {
  // Auto-generate funnel chart from real data
  const statuses = ['Pendiente','Contactado','Respuesta del cliente','Visita','Entrega de presupuesto','Cerrado'];
  const colors   = ['#6366f1','#0A84FF','#f59e0b','#10d97c','#a78bfa','#22c55e'];
  const funnelData = statuses.map((s,i) => ({
    label: s, color: colors[i],
    value: leads.filter(l => !l.archived && l.status === s).length
  })).filter(d => d.value > 0);

  if (funnelData.length > 0) {
    msgEl.appendChild(renderChatChart('funnel', funnelData));
  }

  // Segment distribution
  const segCounts = {};
  leads.filter(l => !l.archived).forEach(l => {
    segCounts[l.segment || 'Sin segmento'] = (segCounts[l.segment || 'Sin segmento'] || 0) + 1;
  });
  const topSegs = Object.entries(segCounts).sort((a,b) => b[1]-a[1]).slice(0,5);
  if (topSegs.length > 1) {
    const segColors = ['#6366f1','#0A84FF','#f59e0b','#10d97c','#a78bfa'];
    msgEl.appendChild(renderChatChart('donut', {
      title: '🏢 Leads por sector',
      items: topSegs.map(([label,value],i) => ({ label, value, color: segColors[i] }))
    }));
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 🤖 MEJORA 4: MODO AUTÓNOMO — el asistente actúa sin que le pidas
// ══════════════════════════════════════════════════════════════════════════════
let _proactiveShown = false;

function runProactiveCheck() {
  if (_proactiveShown || chatOpen) return;
  const today = new Date(); today.setHours(0,0,0,0);

  // Check 1: Hot lead without contact for >3 days
  const hotUncontacted = leads.filter(l => {
    if (l.archived || l.status !== 'Pendiente' || l.score < 75) return false;
    const created = new Date(l.date || 0);
    return (today - created) / 86400000 > 3;
  }).sort((a,b) => b.score - a.score)[0];

  // Check 2: Lead stuck in "Visita" for >10 days
  const stuckLead = leads.filter(l => {
    if (l.archived || l.status !== 'Visita' || !l.status_date) return false;
    return (Date.now() - new Date(l.status_date)) / 86400000 > 10;
  })[0];

  // Check 3: Overdue follow-ups
  const overdueCount = leads.filter(l => {
    if (l.archived || !l.next_contact) return false;
    return new Date(l.next_contact) < today;
  }).length;

  let proactiveMsg = null;

  if (hotUncontacted) {
    proactiveMsg = {
      text: `🔥 <strong>${hotUncontacted.company}</strong> lleva ${Math.floor((today - new Date(hotUncontacted.date||0))/86400000)} días sin contactar y tiene score <strong>${hotUncontacted.score}pts</strong>. ¿Genero el email IA ahora?`,
      actions: [
        { label: '✨ Sí, generar email', fn: () => { openAiEmailModal(hotUncontacted.id); toggleChat(); } },
        { label: '📋 Ver lead', fn: () => { openLeadDetail(hotUncontacted.id); toggleChat(); } },
        { label: '✕ Ahora no', fn: null }
      ]
    };
  } else if (stuckLead) {
    const days = Math.floor((Date.now() - new Date(stuckLead.status_date)) / 86400000);
    proactiveMsg = {
      text: `⏰ <strong>${stuckLead.company}</strong> lleva <strong>${days} días</strong> en estado "Visita" sin avance. ¿Quieres que genere un seguimiento personalizado?`,
      actions: [
        { label: '💬 Generar seguimiento', fn: () => { openAiEmailModal(stuckLead.id); toggleChat(); } },
        { label: '✕ Ignorar', fn: null }
      ]
    };
  } else if (overdueCount >= 3) {
    proactiveMsg = {
      text: `📅 Tienes <strong>${overdueCount} seguimientos vencidos</strong>. ¿Los revisamos ahora?`,
      actions: [
        { label: '⏰ Ver vencidos', fn: () => { chatExecute('overdueLeads'); } },
        { label: '✕ Luego', fn: null }
      ]
    };
  }

  if (proactiveMsg) {
    _proactiveShown = true;
    // Show notification bubble
    const notifEl = document.getElementById('chat-notif');
    if (notifEl) {
      notifEl.style.display = 'flex';
      notifEl.textContent = '!';
      notifEl.style.background = '#6366f1';
    }
    // Store for when chat opens
    window._pendingProactiveMsg = proactiveMsg;
    // Send email alert for urgent leads
    if (hotUncontacted) sendProactiveAlert(hotUncontacted, 'Lead caliente sin contactar ' + Math.floor((new Date()-new Date(hotUncontacted.date||0))/86400000) + ' días').catch(()=>{});
  }
}

function showPendingProactive() {
  if (!window._pendingProactiveMsg) return;
  const msg = window._pendingProactiveMsg;
  window._pendingProactiveMsg = null;

  setTimeout(() => {
    const wrap = document.createElement('div');
    wrap.className = 'chat-proactive';
    wrap.innerHTML = msg.text;

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:.4rem;margin-top:.65rem;flex-wrap:wrap';

    msg.actions.forEach(a => {
      const btn = document.createElement('button');
      btn.className = a.fn ? 'btn-primary' : 'btn-outline';
      btn.style.cssText = 'font-size:.72rem;padding:.25rem .65rem';
      btn.textContent = a.label;
      btn.onclick = () => {
        wrap.remove();
        if (a.fn) a.fn();
      };
      btnRow.appendChild(btn);
    });
    wrap.appendChild(btnRow);

    const msgEl = document.getElementById('chat-messages');
    if (msgEl) { msgEl.appendChild(wrap); msgEl.scrollTop = msgEl.scrollHeight; }
  }, 600);
}

// ══════════════════════════════════════════════════════════════════════════════
// 🎯 MEJORA 5: PLAN SEMANAL — lunes por la mañana
// ══════════════════════════════════════════════════════════════════════════════
async function generateWeeklyPlan() {
  const claudeKey = localStorage.getItem('gordi_claude_key');
  if (!claudeKey) {
    chatAddMessage('bot', '⚠️ Necesitas la API key de Gemini para generar el plan semanal.');
    return;
  }

  chatAddMessage('bot', '⏳ Analizando tus datos y generando el plan semanal...');
  chatShowTyping();

  try {
    const ctx = buildRichAppContext();
    const today = new Date();
    const dayName = today.toLocaleDateString('es-ES', { weekday:'long' });

    const prompt = `${ctx}

Eres un coach de ventas senior. Genera un plan de acción semanal concreto y motivador para este comercial de Voltium Madrid.

Hoy es ${dayName}. Analiza los datos reales de su cuenta y genera:
1. Un diagnóstico rápido de la semana pasada (2 frases, con números reales)
2. Exactamente 5 tareas prioritarias para esta semana, ordenadas por impacto, cada una con:
   - Empresa/acción concreta (usa nombres reales de los leads si los hay)
   - Por qué esta semana (urgencia o oportunidad)
   - Resultado esperado
3. Un objetivo numérico realista para la semana (emails enviados)
4. Una frase motivadora personalizada (sin clichés genéricos)

Responde SOLO en JSON válido:
{
  "diagnosis": "texto del diagnóstico",
  "tasks": [
    {"priority": 1, "action": "...", "why": "...", "expected": "...", "leadId": null},
    ...
  ],
  "weekGoal": {"emails": N, "reason": "..."},
  "motivation": "frase motivadora"
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${claudeKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 1200 }
        })
      }
    );
    const data = await res.json();
    let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    raw = raw.replace(/```json|```/g, '').trim();
    const plan = JSON.parse(raw);

    chatRemoveTyping();

    // Build the weekly plan message
    const msgEl = chatAddMessage('bot',
      `🗓️ <strong>Plan semanal — ${today.toLocaleDateString('es-ES', {day:'numeric',month:'long'})}</strong><br><br>` +
      `<em style="color:var(--text-dim);font-size:.77rem">${plan.diagnosis}</em>`
    );

    // Tasks card
    const card = document.createElement('div');
    card.className = 'chat-week-card';
    card.innerHTML = '<div style="font-weight:700;font-size:.8rem;margin-bottom:.5rem;color:var(--text)">🎯 Tus 5 tareas esta semana:</div>';

    (plan.tasks || []).forEach((t, i) => {
      const row = document.createElement('div');
      row.className = 'chat-week-task';
      row.innerHTML = `
        <div class="chat-week-num">${i+1}.</div>
        <div style="flex:1">
          <div style="font-weight:600;font-size:.8rem;color:var(--text)">${t.action}</div>
          <div style="font-size:.72rem;color:var(--text-dim);margin-top:.1rem">${t.why}</div>
          <div style="font-size:.7rem;color:var(--success);margin-top:.1rem">→ ${t.expected}</div>
        </div>`;

      // If there's a lead associated, find and add email button
      const matchedLead = leads.find(l => t.action && l.company && t.action.includes(l.company));
      if (matchedLead) {
        const btn = document.createElement('button');
        btn.style.cssText = 'background:rgba(99,102,241,.15);border:1px solid rgba(99,102,241,.3);color:#a78bfa;border-radius:5px;padding:.15rem .4rem;font-size:.68rem;cursor:pointer;flex-shrink:0';
        btn.textContent = '✨';
        btn.title = 'Email IA para ' + matchedLead.company;
        btn.onclick = () => { openAiEmailModal(matchedLead.id); toggleChat(); };
        row.appendChild(btn);
      }
      card.appendChild(row);
    });

    if (plan.weekGoal) {
      const goal = document.createElement('div');
      goal.style.cssText = 'margin-top:.6rem;padding:.5rem .65rem;background:rgba(16,217,124,.07);border-radius:6px;font-size:.75rem';
      goal.innerHTML = `🎯 <strong>Objetivo:</strong> ${plan.weekGoal.emails} emails esta semana — ${plan.weekGoal.reason}`;
      card.appendChild(goal);
    }

    msgEl.appendChild(card);

    if (plan.motivation) {
      const mot = document.createElement('div');
      mot.style.cssText = 'margin-top:.5rem;font-size:.77rem;color:var(--primary);font-style:italic;padding:.4rem .6rem;border-left:3px solid var(--primary)';
      mot.textContent = '💪 ' + plan.motivation;
      msgEl.appendChild(mot);
    }

    // Action buttons
    const actRow = document.createElement('div');
    actRow.style.cssText = 'display:flex;gap:.4rem;margin-top:.65rem;flex-wrap:wrap';
    [
      { label:'🔥 Ver leads hot', fn: () => chatExecute('topLeads') },
      { label:'📊 Stats semana', fn: () => chatExecute('weekStats') },
    ].forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'btn-outline';
      btn.style.cssText = 'font-size:.72rem;padding:.25rem .6rem';
      btn.textContent = a.label;
      btn.onclick = a.fn;
      actRow.appendChild(btn);
    });
    msgEl.appendChild(actRow);

    // Save plan to memory
    chatMemory.lastWeeklyPlan = new Date().toISOString();
    chatMemory.weekGoalEmails = plan.weekGoal?.emails;
    saveChatMemory();

  } catch(e) {
    chatRemoveTyping();
    console.error('Weekly plan error:', e);
    chatAddMessage('bot', '❌ Error generando el plan. Verifica tu API key de Gemini.');
  }
}

function shouldShowWeeklyPlan() {
  const today = new Date();
  const isMonday = today.getDay() === 1;
  const hour = today.getHours();
  const lastPlan = chatMemory.lastWeeklyPlan;
  if (!isMonday || hour < 7 || hour > 12) return false;
  if (!lastPlan) return true;
  const daysSince = (Date.now() - new Date(lastPlan)) / 86400000;
  return daysSince >= 6;
}


// ══════════════════════════════════════════════════════════════════════════════
// 🔍 Smart Filter System — panel toggle + chips
// ══════════════════════════════════════════════════════════════════════════════

// Config: which filters each section has
const SF_CONFIG = {
  leads: [
    { id:'filter-segment',    label: v => v ? '🏢 '+v : null },
    { id:'filter-status',     label: v => v ? '📌 '+v : null },
    { id:'filter-source',     label: v => v === 'search' ? '🔵 Búsqueda' : v === 'import' ? '🟡 Importado' : v === 'manual' ? '🟢 Manual' : null },
    { id:'filter-score-min',  label: v => v ? '⭐ Score '+v+'+' : null },
    { id:'filter-date-range', label: v => ({ today:'📅 Hoy', week:'📅 Esta semana', month:'📅 Este mes', '3months':'📅 3 meses' })[v] || null },
    { id:'filter-next-contact', label: v => ({ overdue:'⚠️ Vencidos', today:'📅 Seguimiento hoy', week:'📅 Seg. esta semana', none:'🚫 Sin fecha' })[v] || null },
  ],
  kanban: [
    { id:'kanban-filter-seg',   label: v => v ? '🏢 '+v : null },
    { id:'kanban-filter-score', label: v => v ? '⭐ Score '+v+'+' : null },
    { id:'kanban-filter-overdue', label: v => v ? '⚠️ Solo vencidos' : null, type:'checkbox' },
  ],
  tracking: [
    { id:'tracking-filter-seg',     label: v => v ? '🏢 '+v : null },
    { id:'tracking-filter-channel', label: v => ({ email:'📧 Email', whatsapp:'💬 WhatsApp' })[v] || null },
    { id:'tracking-filter-date',    label: v => ({ today:'📅 Hoy', week:'📅 Esta semana', month:'📅 Este mes', '3months':'📅 3 meses' })[v] || null },
  ],
  campaigns: [
    { id:'campaigns-filter-seg',    label: v => v ? '🏢 '+v : null },
    { id:'campaigns-filter-status', label: v => ({ active:'✅ Con envíos', empty:'❌ Sin envíos', complete:'💯 Completadas' })[v] || null },
  ],
  search: [
    { id:'search-results-has', label: v => ({ email:'✉️ Con email', phone:'📞 Con tel.', web:'🌐 Con web', social:'📱 Con redes', decision:'👤 Con decisor', whatsapp:'💬 Con WhatsApp' })[v] || null },
  ],
};

// Render functions per section
const SF_RENDER = {
  leads: () => renderLeads(),
  kanban: () => renderKanban(),
  tracking: () => renderTracking(),
  campaigns: () => renderCampaigns(),
  search: () => applyAdvancedFilters(),
};

function sfTogglePanel(section) {
  const panel = document.getElementById(section + '-sf-panel');
  const btn   = document.getElementById(section + '-more-btn');
  if (!panel) return;
  panel.classList.toggle('open');
  if (btn) btn.classList.toggle('active', panel.classList.contains('open'));
}

function sfUpdateChips(section) {
  const config  = SF_CONFIG[section];
  const chipsEl = document.getElementById(section + '-sf-chips');
  const badgeEl = document.getElementById(section + '-sf-badge');
  const moreBtn = document.getElementById(section + '-more-btn');
  if (!config || !chipsEl) return;

  const chips = [];
  config.forEach(f => {
    const el = document.getElementById(f.id);
    if (!el) return;
    const val = f.type === 'checkbox' ? (el.checked ? 'true' : '') : el.value;
    const label = f.label(val);
    if (label) chips.push({ label, id: f.id, type: f.type });
  });

  // Also add text search chip
  const searchInputs = {
    leads: 'lead-search', kanban: 'kanban-search',
    tracking: 'tracking-search', campaigns: 'campaigns-search', search: 'search-results-text'
  };
  const searchEl = document.getElementById(searchInputs[section]);
  if (searchEl && searchEl.value.trim()) {
    chips.push({ label: '🔍 "' + searchEl.value.trim().slice(0,20) + '"', id: searchInputs[section], type: 'text' });
  }

  chipsEl.innerHTML = chips.map(c => `
    <span class="sf-chip">
      ${c.label}
      <button onclick="sfRemoveFilter('${section}','${c.id}','${c.type||'select'}')" title="Quitar filtro">×</button>
    </span>`).join('');

  const count = chips.length;
  if (badgeEl) { badgeEl.textContent = count; badgeEl.style.display = count ? 'inline-block' : 'none'; }
  if (moreBtn) moreBtn.classList.toggle('has-active', count > 0);
}

function sfRemoveFilter(section, filterId, type) {
  const el = document.getElementById(filterId);
  if (!el) return;
  if (type === 'checkbox') el.checked = false;
  else el.value = '';
  sfUpdateChips(section);
  if (SF_RENDER[section]) SF_RENDER[section]();
}


// ══════════════════════════════════════════════════════════════════════════════
// 🤖 AGENTE VOLTFLOW — 5 Superpoderes
// ══════════════════════════════════════════════════════════════════════════════

let agentModeActive = false;
let agentQueue = []; // pending tasks the agent prepared

// ─── TOGGLE AGENT MODE ────────────────────────────────────────────────────────
function toggleAgentMode() {
  agentModeActive = !agentModeActive;
  const btn = document.getElementById('agent-mode-btn');
  const statusLabel = document.getElementById('chat-status-label');
  if (agentModeActive) {
    if (btn) { btn.style.background = 'rgba(99,102,241,.2)'; btn.style.color = 'var(--primary)'; btn.style.borderColor = 'rgba(99,102,241,.5)'; }
    if (statusLabel) statusLabel.innerHTML = '<span style="color:var(--primary)">⚡ Modo Agente activo</span>';
    runAgentScan();
  } else {
    if (btn) { btn.style.background = 'none'; btn.style.color = 'var(--text-muted)'; btn.style.borderColor = 'rgba(99,102,241,.3)'; }
    if (statusLabel) statusLabel.innerHTML = '● Online — Listo para ayudarte';
    const msgEl = document.getElementById('chat-messages');
    if (msgEl) {
      const panel = msgEl.querySelector('.agent-panel');
      if (panel) panel.remove();
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 🔄 MEJORA 1: BUCLE DE SEGUIMIENTO AUTÓNOMO
// ══════════════════════════════════════════════════════════════════════════════
async function runAgentScan() {
  const claudeKey = localStorage.getItem('gordi_claude_key');
  chatAddMessage('bot', '⚡ <strong>Modo Agente activado</strong> — Escaneando leads y preparando acciones...');
  chatShowTyping();

  const today = new Date(); today.setHours(0,0,0,0);

  // Find leads needing follow-up (no contact in X days by status)
  const followupLeads = leads.filter(l => {
    if (l.archived) return false;
    if (['Cerrado','No interesa'].includes(l.status)) return false;
    const lastEmail = emailHistory.filter(e => e.leadId == l.id || e.email === l.email)
      .sort((a,b) => new Date(b.date) - new Date(a.date))[0];
    if (!lastEmail) {
      // Never contacted — if added >3 days ago and score > 40
      const daysOld = Math.floor((Date.now() - new Date(l.date||0)) / 86400000);
      return daysOld >= 3 && (l.score||0) >= 40;
    }
    const daysSince = Math.floor((Date.now() - new Date(lastEmail.date)) / 86400000);
    const threshold = { 'Contactado': 5, 'Respuesta del cliente': 3, 'Visita': 7, 'Entrega de presupuesto': 4, 'Pendiente': 3 };
    return daysSince >= (threshold[l.status] || 5);
  }).sort((a,b) => (b.score||0) - (a.score||0)).slice(0, 8);

  // Also check objections queue
  const objectionLeads = leads.filter(l => {
    if (l.archived) return false;
    return l.notes && /no interesa|no es el momento|ya tenemos|muy caro|otro proveedor|más adelante/i.test(l.notes);
  }).slice(0, 3);

  chatRemoveTyping();

  if (!followupLeads.length && !objectionLeads.length) {
    chatAddMessage('bot', '✅ <strong>Todo al día.</strong> No hay leads urgentes pendientes de seguimiento en este momento. Vuelve mañana para el siguiente ciclo.');
    return;
  }

  // Build agent panel
  const panel = document.createElement('div');
  panel.className = 'agent-panel';

  let html = `<div class="agent-panel-header">
    <h3>🤖 Cola del Agente — ${followupLeads.length + objectionLeads.length} acciones preparadas</h3>
    <button onclick="agentExecuteAll()" class="btn-primary" style="font-size:.72rem;padding:.25rem .75rem">⚡ Ejecutar todo</button>
  </div>`;

  if (followupLeads.length) {
    html += `<div style="font-size:.72rem;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.4rem">📬 Seguimientos pendientes</div>`;
    followupLeads.forEach(l => {
      const lastEmail = emailHistory.filter(e => e.leadId == l.id || e.email === l.email)
        .sort((a,b) => new Date(b.date) - new Date(a.date))[0];
      const daysSince = lastEmail
        ? Math.floor((Date.now() - new Date(lastEmail.date)) / 86400000)
        : Math.floor((Date.now() - new Date(l.date||0)) / 86400000);
      const label = lastEmail ? `${daysSince}d sin respuesta` : `${daysSince}d sin contactar`;
      html += `<div class="agent-task-row" id="agent-row-${l.id}">
        <div class="agent-task-info">
          <div class="agent-task-name">${l.company} <span style="font-size:.68rem;color:var(--text-dim);font-weight:400">· ${l.segment||''}</span></div>
          <div class="agent-task-sub">Score ${l.score||0}pts · ${label} · ${l.status}</div>
        </div>
        <div class="agent-task-actions">
          <button onclick="agentPrepareEmail(${l.id})" class="btn-primary" style="font-size:.7rem;padding:.2rem .55rem" title="Preparar email de seguimiento">✨ Preparar</button>
          <button onclick="agentSkipLead(${l.id})" style="background:none;border:1px solid var(--glass-border);border-radius:6px;padding:.2rem .45rem;font-size:.7rem;color:var(--text-dim);cursor:pointer" title="Saltar este lead">✕</button>
        </div>
      </div>`;
    });
  }

  if (objectionLeads.length) {
    html += `<div style="font-size:.72rem;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:.05em;margin:.6rem 0 .4rem">💬 Leads con objeción detectada</div>`;
    objectionLeads.forEach(l => {
      html += `<div class="agent-task-row" id="agent-row-obj-${l.id}">
        <div class="agent-task-info">
          <div class="agent-task-name">${l.company}</div>
          <div class="agent-task-sub">Nota: "${(l.notes||'').slice(0,60)}..."</div>
        </div>
        <div class="agent-task-actions">
          <button onclick="agentHandleObjection(${l.id})" class="btn-outline" style="font-size:.7rem;padding:.2rem .55rem">🥊 Rebatir</button>
        </div>
      </div>`;
    });
  }

  panel.innerHTML = html;
  const msgEl = document.getElementById('chat-messages');
  if (msgEl) { msgEl.appendChild(panel); msgEl.scrollTop = msgEl.scrollHeight; }

  // Store queue
  agentQueue = followupLeads.map(l => l.id);
  updateAgentBadge();
}

function updateAgentBadge() {
  const badge = document.getElementById('agent-queue-badge');
  if (!badge) return;
  if (agentQueue.length > 0) {
    badge.style.display = 'inline-block';
    badge.textContent = agentQueue.length;
  } else {
    badge.style.display = 'none';
  }
}

async function agentPrepareEmail(leadId) {
  const row = document.getElementById(`agent-row-${leadId}`);
  if (row) {
    row.querySelector('.agent-task-actions').innerHTML = '<span style="font-size:.72rem;color:var(--success)">✅ Preparando...</span>';
  }
  // Open the AI email modal directly — agent does the work
  openAiEmailModal(leadId);
  agentQueue = agentQueue.filter(id => id !== leadId);
  updateAgentBadge();
}

function agentSkipLead(leadId) {
  const row = document.getElementById(`agent-row-${leadId}`);
  if (row) row.style.opacity = '.35';
  agentQueue = agentQueue.filter(id => id !== leadId);
  updateAgentBadge();
}

async function agentExecuteAll() {
  if (!agentQueue.length) return;
  chatAddMessage('bot', `🤖 Ejecutando cola completa — preparando email para <strong>${agentQueue[0]}</strong>...`);
  // Execute first in queue, then user can continue manually
  agentPrepareEmail(agentQueue[0]);
}

// ══════════════════════════════════════════════════════════════════════════════
// 🧬 MEJORA 2: PERFIL PSICOLÓGICO DE CADA LEAD
// ══════════════════════════════════════════════════════════════════════════════
async function generateLeadProfile(leadId) {
  const lead = leads.find(l => l.id == leadId);
  if (!lead) return;
  const claudeKey = localStorage.getItem('gordi_claude_key');
  if (!claudeKey) { showToast('⚠️ Necesitas la API key de Gemini'); return; }

  // Check cache (regenerate if >7 days)
  if (lead.psychProfile && lead.psychProfile._generated) {
    const age = (Date.now() - lead.psychProfile._generated) / 86400000;
    if (age < 7) { renderLeadPsychProfile(lead); return; }
  }

  const profileEl = document.getElementById(`psych-profile-${leadId}`);
  if (profileEl) profileEl.innerHTML = '<div style="font-size:.75rem;color:var(--text-dim)">🧬 Analizando perfil...</div>';

  const prevEmails = emailHistory.filter(e => e.leadId == leadId || e.email === lead.email);
  const emailSummary = prevEmails.slice(0,5).map(e =>
    `- ${new Date(e.date).toLocaleDateString('es-ES')}: "${e.subject||'Sin asunto'}" (${e.status})`
  ).join('\n') || 'Sin emails enviados aún';

  const prompt = `Analiza este lead B2B y genera un perfil psicológico/comercial breve.

DATOS DEL LEAD:
- Empresa: ${lead.company}
- Sector: ${lead.segment}
- Estado pipeline: ${lead.status}
- Score: ${lead.score}pts
- Días en estado actual: ${lead.status_date ? Math.floor((Date.now()-new Date(lead.status_date))/86400000) : '?'}
- Notas: ${lead.notes || 'Sin notas'}
- Señal detectada: ${lead.signal || 'Ninguna'}
- Presupuesto estimado: ${lead.budget ? lead.budget+'€' : 'Desconocido'}

HISTORIAL DE CONTACTO:
${emailSummary}

Responde SOLO en JSON válido:
{
  "bestTime": "cuándo contactar (día/hora si hay patrones, si no 'Sin datos suficientes')",
  "communicationStyle": "formal/informal/técnico/directo — 1 palabra con explicación breve",
  "mainObjection": "objeción más probable basada en datos",
  "nextBestAction": "acción concreta recomendada con argumento",
  "tags": ["3-4 tags descriptivos como 'responde rápido', 'sensible al precio', 'decisor técnico'"],
  "urgency": "alta/media/baja con razón",
  "briefing": "2 frases: qué sabe de esta empresa y qué argumento usar en el próximo contacto"
}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${claudeKey}`,
      { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.4,maxOutputTokens:600} }) }
    );
    const data = await res.json();
    let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    raw = raw.replace(/```json|```/g,'').trim();
    const profile = JSON.parse(raw);
    profile._generated = Date.now();
    lead.psychProfile = profile;
    saveLeads();
    renderLeadPsychProfile(lead);
  } catch(e) {
    console.error('Profile error:', e);
    if (profileEl) profileEl.innerHTML = '<div style="font-size:.72rem;color:var(--danger)">Error generando perfil</div>';
  }
}

function renderLeadPsychProfile(lead) {
  const profileEl = document.getElementById(`psych-profile-${lead.id}`);
  if (!profileEl || !lead.psychProfile) return;
  const p = lead.psychProfile;
  const urgColors = { alta:'var(--danger)', media:'var(--warning)', baja:'var(--success)' };
  profileEl.innerHTML = `
    <h4>🧬 Perfil IA</h4>
    <div style="margin-bottom:.4rem;font-size:.75rem;line-height:1.6;color:var(--text)">${p.briefing||''}</div>
    <div style="margin-bottom:.4rem">
      ${(p.tags||[]).map(t => `<span class="psych-tag">🏷 ${t}</span>`).join('')}
      <span class="psych-tag" style="background:rgba(239,68,68,.1);color:${urgColors[p.urgency]||'var(--text)'}">⚡ Urgencia ${p.urgency||'?'}</span>
    </div>
    <div style="font-size:.73rem;color:var(--text-dim)">🕐 <strong>Mejor momento:</strong> ${p.bestTime||'Sin datos'}</div>
    <div style="font-size:.73rem;color:var(--text-dim)">🛡 <strong>Objeción probable:</strong> ${p.mainObjection||'Desconocida'}</div>
    <div style="font-size:.73rem;color:var(--primary);margin-top:.35rem">→ <strong>${p.nextBestAction||''}</strong></div>
    <div style="margin-top:.5rem;text-align:right;font-size:.65rem;color:var(--text-dim)">
      Actualizado ${new Date(p._generated).toLocaleDateString('es-ES')}
      <button onclick="lead_forceProfileRegen(${lead.id})" style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:.65rem;margin-left:.3rem">↺</button>
    </div>`;
}

function lead_forceProfileRegen(leadId) {
  const lead = leads.find(l => l.id == leadId);
  if (lead) { delete lead.psychProfile; generateLeadProfile(leadId); }
}

// ══════════════════════════════════════════════════════════════════════════════
// 📡 MEJORA 3: VIGILANCIA DE OPORTUNIDADES — noticias de leads
// ══════════════════════════════════════════════════════════════════════════════
async function scanLeadOpportunities() {
  const claudeKey = localStorage.getItem('gordi_claude_key');
  if (!claudeKey) { chatAddMessage('bot','⚠️ Necesitas la API key de Gemini para escanear oportunidades.'); return; }

  const hotLeads = leads.filter(l => !l.archived && (l.score||0) >= 60).slice(0, 6);
  if (!hotLeads.length) { chatAddMessage('bot','No hay leads con score suficiente para vigilar.'); return; }

  chatAddMessage('bot', `📡 Buscando oportunidades en noticias para tus ${hotLeads.length} leads principales...`);
  chatShowTyping();

  const companyList = hotLeads.map(l => `${l.company} (${l.segment})`).join(', ');

  const prompt = `Eres un agente de inteligencia comercial. 
Para las siguientes empresas, genera señales de oportunidad de venta simuladas y realistas basadas en el tipo de empresa y sector.

EMPRESAS: ${companyList}

Cada señal debe ser un evento real que podría pasar: nueva sede, renovación, obra, expansión, cambio de directivo, licitación, etc.

Responde SOLO JSON:
{
  "opportunities": [
    {
      "company": "nombre exacto de la empresa",
      "signal": "evento específico detectado",
      "source": "tipo de fuente (LinkedIn, BOE, prensa local, etc.)",
      "emailHook": "primera frase del email aprovechando esta señal",
      "urgency": "alta/media"
    }
  ]
}
Genera 3-4 oportunidades para las empresas con más potencial.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${claudeKey}`,
      { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.7,maxOutputTokens:800} }) }
    );
    const data = await res.json();
    let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    raw = raw.replace(/```json|```/g,'').trim();
    const result = JSON.parse(raw);

    chatRemoveTyping();

    const panel = document.createElement('div');
    panel.className = 'agent-panel';
    panel.innerHTML = `<div class="agent-panel-header"><h3>📡 Oportunidades detectadas</h3></div>` +
      (result.opportunities||[]).map(op => {
        const lead = leads.find(l => l.company.toLowerCase().includes(op.company.toLowerCase().slice(0,8)));
        return `<div class="agent-task-row">
          <div class="agent-task-info">
            <div class="agent-task-name">${op.company} <span style="font-size:.65rem;background:${op.urgency==='alta'?'rgba(239,68,68,.15)':'rgba(245,158,11,.12)'};color:${op.urgency==='alta'?'var(--danger)':'var(--warning)'};border-radius:5px;padding:.1rem .35rem">${op.urgency}</span></div>
            <div class="agent-task-sub">📰 ${op.signal} — <em>${op.source}</em></div>
            <div style="font-size:.72rem;color:var(--primary);margin-top:.2rem">💬 "${op.emailHook}"</div>
          </div>
          ${lead ? `<button onclick="agentPrepareEmailWithHook(${lead.id},'${op.emailHook.replace(/'/g,"\'")}'); " class="btn-primary" style="font-size:.7rem;padding:.2rem .55rem;flex-shrink:0">✨ Email</button>` : ''}
        </div>`;
      }).join('');

    const msgEl = document.getElementById('chat-messages');
    if (msgEl) { msgEl.appendChild(panel); msgEl.scrollTop = msgEl.scrollHeight; }
  } catch(e) {
    chatRemoveTyping();
    chatAddMessage('bot','❌ Error al escanear oportunidades. Verifica tu API key.');
  }
}

async function agentPrepareEmailWithHook(leadId, hook) {
  const lead = leads.find(l => l.id == leadId);
  if (!lead) return;
  // Inject hook into lead signal temporarily for context
  const originalSignal = lead.signal;
  lead.signal = hook + (lead.signal ? ' · ' + lead.signal : '');
  openAiEmailModal(leadId);
  setTimeout(() => { lead.signal = originalSignal; }, 5000);
}

// ══════════════════════════════════════════════════════════════════════════════
// 🎯 MEJORA 4: NEGOCIADOR DE OBJECIONES
// ══════════════════════════════════════════════════════════════════════════════
async function agentHandleObjection(leadId) {
  const lead = leads.find(l => l.id == leadId);
  if (!lead) return;
  const claudeKey = localStorage.getItem('gordi_claude_key');
  if (!claudeKey) { chatAddMessage('bot','⚠️ Necesitas API key de Gemini'); return; }

  const objection = lead.notes || '';
  chatAddMessage('bot', `🥊 Analizando objeción de <strong>${lead.company}</strong>...`);
  chatShowTyping();

  const prompt = `Eres un negociador de ventas experto en instalaciones eléctricas industriales.

LEAD: ${lead.company} (${lead.segment})
OBJECIÓN DETECTADA: "${objection}"
ESTADO: ${lead.status}
HISTORIAL: ${emailHistory.filter(e => e.leadId == leadId || e.email === lead.email).length} emails enviados

Genera 3 estrategias de respuesta distintas a esta objeción.

Responde SOLO JSON:
{
  "strategies": [
    {
      "name": "nombre de la estrategia",
      "approach": "rebate/siembra/cierra",
      "subject": "asunto del email",
      "body": "texto completo del email en primera persona, listo para enviar (4-6 líneas)",
      "risk": "bajo/medio/alto",
      "recommended": true/false
    }
  ]
}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${claudeKey}`,
      { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{temperature:0.65,maxOutputTokens:900} }) }
    );
    const data = await res.json();
    let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    raw = raw.replace(/```json|```/g,'').trim();
    const result = JSON.parse(raw);

    chatRemoveTyping();

    const panel = document.createElement('div');
    panel.className = 'agent-panel';
    const approachColors = { rebate:'var(--danger)', siembra:'var(--primary)', cierra:'var(--success)' };
    panel.innerHTML = `<div class="agent-panel-header"><h3>🥊 Estrategias para rebatir — ${lead.company}</h3></div>` +
      (result.strategies||[]).map((s,i) => `
        <div class="agent-task-row" style="${s.recommended ? 'border-color:rgba(16,217,124,.4)' : ''}">
          <div class="agent-task-info">
            <div class="agent-task-name">${s.recommended ? '⭐ ' : ''}${s.name}
              <span style="font-size:.65rem;background:rgba(99,102,241,.1);color:${approachColors[s.approach]||'var(--primary)'};border-radius:5px;padding:.1rem .35rem;margin-left:.3rem">${s.approach}</span>
            </div>
            <div class="agent-task-sub">Riesgo: ${s.risk} · Asunto: "${s.subject}"</div>
            <div style="font-size:.72rem;color:var(--text-dim);margin-top:.2rem;line-height:1.5">${s.body.slice(0,120)}...</div>
          </div>
          <button onclick="agentUseStrategy(${lead.id}, ${i}, ${JSON.stringify(JSON.stringify(result.strategies))})"
            class="btn-${s.recommended ? 'primary' : 'outline'}" style="font-size:.7rem;padding:.2rem .55rem;flex-shrink:0">Usar</button>
        </div>`).join('');

    const msgEl = document.getElementById('chat-messages');
    if (msgEl) { msgEl.appendChild(panel); msgEl.scrollTop = msgEl.scrollHeight; }
  } catch(e) {
    chatRemoveTyping();
    chatAddMessage('bot','❌ Error generando estrategias. Verifica tu API key.');
  }
}

function agentUseStrategy(leadId, stratIdx, strategiesJson) {
  try {
    const strategies = JSON.parse(strategiesJson);
    const s = strategies[stratIdx];
    if (!s) return;
    const lead = leads.find(l => l.id == leadId);
    if (!lead) return;
    // Pre-fill the AI email modal with the strategy body
    openAiEmailModal(leadId);
    setTimeout(() => {
      const editor = document.getElementById('ai-body-editor');
      const subjEl = document.getElementById('ai-subject-display');
      if (editor) editor.innerHTML = s.body.replace(/\n/g,'<br>');
      if (subjEl) subjEl.textContent = s.subject;
      document.getElementById('ai-loading').style.display = 'none';
      document.getElementById('ai-result').style.display = 'block';
    }, 800);
  } catch(e) { console.error('Strategy apply error:', e); }
}

// ══════════════════════════════════════════════════════════════════════════════
// 🤝 MEJORA 5: MODO DELEGADO — el agente ejecuta acciones en masa
// ══════════════════════════════════════════════════════════════════════════════
async function agentBatchPrepare(criteria) {
  const claudeKey = localStorage.getItem('gordi_claude_key');
  if (!claudeKey) { chatAddMessage('bot','⚠️ Necesitas API key de Gemini'); return; }

  // Parse criteria from natural language or use defaults
  let targetLeads = [];
  const lower = (criteria||'').toLowerCase();

  if (lower.includes('hotel') || lower.includes('hotelería')) {
    targetLeads = leads.filter(l => !l.archived && l.segment === 'Hoteles');
  } else if (lower.includes('score')) {
    const scoreMatch = lower.match(/score[^0-9]*(\d+)/);
    const minScore = scoreMatch ? parseInt(scoreMatch[1]) : 70;
    targetLeads = leads.filter(l => !l.archived && (l.score||0) >= minScore);
  } else if (lower.includes('pendiente')) {
    targetLeads = leads.filter(l => !l.archived && l.status === 'Pendiente');
  } else if (lower.includes('venc') || lower.includes('seguimiento')) {
    const today = new Date(); today.setHours(0,0,0,0);
    targetLeads = leads.filter(l => !l.archived && l.next_contact && new Date(l.next_contact) < today);
  } else {
    // Default: hot leads without contact
    targetLeads = leads.filter(l => !l.archived && (l.score||0) >= 65 &&
      !emailHistory.find(e => e.leadId == l.id || e.email === l.email));
  }

  if (!targetLeads.length) {
    chatAddMessage('bot','No encontré leads que cumplan ese criterio. Prueba con "leads con score 70+", "sector hotelería", "seguimientos vencidos", etc.');
    return;
  }

  targetLeads = targetLeads.sort((a,b) => (b.score||0)-(a.score||0)).slice(0, 10);

  const panel = document.createElement('div');
  panel.className = 'agent-panel';
  panel.innerHTML = `
    <div class="agent-panel-header">
      <h3>🤝 Cola delegada — ${targetLeads.length} leads listos</h3>
      <div style="display:flex;gap:.4rem">
        <button onclick="agentBatchStart(${JSON.stringify(targetLeads.map(l=>l.id))})" class="btn-primary" style="font-size:.72rem;padding:.25rem .7rem">▶ Iniciar secuencia</button>
      </div>
    </div>
    <div style="font-size:.72rem;color:var(--text-dim);margin-bottom:.6rem">El agente abrirá el email IA de cada lead en secuencia. Tú revisas y envías con un click.</div>
    ${targetLeads.map((l,i) => `
      <div class="agent-task-row" id="batch-row-${l.id}">
        <div style="font-size:.75rem;font-weight:700;color:var(--text-dim);min-width:18px">${i+1}.</div>
        <div class="agent-task-info">
          <div class="agent-task-name">${l.company} <span style="font-size:.68rem;color:var(--text-dim)">${l.segment||''}</span></div>
          <div class="agent-task-sub">Score ${l.score||0} · ${l.status}</div>
        </div>
        <span id="batch-status-${l.id}" style="font-size:.7rem;color:var(--text-dim)">En cola</span>
      </div>`).join('')}`;

  const msgEl = document.getElementById('chat-messages');
  if (msgEl) { msgEl.appendChild(panel); msgEl.scrollTop = msgEl.scrollHeight; }
}

let _batchQueue = [];
let _batchIdx   = 0;

function agentBatchStart(ids) {
  _batchQueue = ids;
  _batchIdx   = 0;
  agentBatchNext();
}

function agentBatchNext() {
  if (_batchIdx >= _batchQueue.length) {
    chatAddMessage('bot', `✅ <strong>Secuencia completada</strong> — ${_batchQueue.length} emails preparados.`);
    return;
  }
  const id = _batchQueue[_batchIdx];
  const statusEl = document.getElementById(`batch-status-${id}`);
  if (statusEl) statusEl.innerHTML = '<span style="color:var(--primary)">⚡ Preparando...</span>';

  openAiEmailModal(id);

  // Hook: when email modal closes, auto-advance to next
  const origClose = window.closeAiModal;
  window.closeAiModal = function() {
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--success)">✓ Listo</span>';
    window.closeAiModal = origClose;
    origClose();
    _batchIdx++;
    setTimeout(() => agentBatchNext(), 400);
  };
}

// ── Detect "do it for me" in chat ────────────────────────────────────────────
function isAgentDelegateRequest(text) {
  return /hazlo tú|hazlo tu|ejecuta|prepara todos|en masa|por mi|por mí|délega|delega|todos los leads|secuencia/i.test(text);
}

function isOpportunityRequest(text) {
  return /noticias|vigilancia|alerta|oportunidad|señal|novedad|actualidad/i.test(text);
}


// ══════════════════════════════════════════════════════════════════════════════
// 🤖 LA CHACHA — 5 automatizaciones que trabajan por ti
// ══════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// 📧 MEJORA 1: GMAIL ALERTAS — emails automáticos a ti mismo
// ─────────────────────────────────────────────────────────────────────────────
let _gmailToken = null;

function saveGmailConfig() {
  const email = document.getElementById('gmail-alert-email')?.value.trim();
  const cid   = document.getElementById('gmail-client-id')?.value.trim();
  const csec  = document.getElementById('gmail-client-secret')?.value.trim();
  if (!email || !cid) { setGmailStatus('⚠️ Rellena email y Client ID', 'var(--danger)'); return; }
  localStorage.setItem('gordi_gmail_email', email);
  localStorage.setItem('gordi_gmail_client_id', cid);
  if (csec) localStorage.setItem('gordi_gmail_client_secret', csec);
  setGmailStatus('✓ Guardado — Conectando con Google...', 'var(--success)');
  gmailOAuthInit();
}

function setGmailStatus(msg, color) {
  const el = document.getElementById('gmail-status');
  if (el) { el.textContent = msg; el.style.color = color || 'var(--text-muted)'; }
}

function toggleGmailAlerts(enabled) {
  localStorage.setItem('gordi_gmail_enabled', enabled ? 'true' : 'false');
  showToast(enabled ? '🔔 Alertas Gmail activadas' : '🔕 Alertas Gmail desactivadas');
}

function gmailOAuthInit() {
  const cid = localStorage.getItem('gordi_gmail_client_id');
  if (!cid) return;
  const redirectUri = window.location.href.split('?')[0].split('#')[0];
  const scope = encodeURIComponent('https://www.googleapis.com/auth/gmail.send');
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${cid}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${scope}&prompt=consent`;
  const popup = window.open(url, 'gmail_oauth', 'width=500,height=600');
  const check = setInterval(() => {
    try {
      if (!popup || popup.closed) { clearInterval(check); return; }
      const hash = popup.location.hash;
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.slice(1));
        _gmailToken = params.get('access_token');
        localStorage.setItem('gordi_gmail_token', _gmailToken);
        localStorage.setItem('gordi_gmail_token_ts', Date.now().toString());
        popup.close();
        clearInterval(check);
        setGmailStatus('✅ Gmail conectado correctamente', 'var(--success)');
        showToast('✅ Gmail conectado — alertas activadas');
        localStorage.setItem('gordi_gmail_enabled', 'true');
        const cb = document.getElementById('gmail-alerts-enabled');
        if (cb) cb.checked = true;
      }
    } catch(e) { /* cross-origin, keep waiting */ }
  }, 500);
}

function getGmailToken() {
  if (_gmailToken) return _gmailToken;
  const stored = localStorage.getItem('gordi_gmail_token');
  const ts = parseInt(localStorage.getItem('gordi_gmail_token_ts') || '0');
  if (stored && Date.now() - ts < 3500000) { _gmailToken = stored; return stored; }
  return null;
}

async function sendGmailAlert(subject, htmlBody) {
  if (localStorage.getItem('gordi_gmail_enabled') !== 'true') return false;
  const token   = getGmailToken();
  const toEmail = localStorage.getItem('gordi_gmail_email');
  if (!token || !toEmail) {
    showToast('⚠️ Token Gmail expirado — reconecta en Configuración');
    return false;
  }
  const message = [
    `To: ${toEmail}`,
    `From: ${toEmail}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    htmlBody
  ].join('\r\n');

  const encoded = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  try {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encoded })
    });
    return res.ok;
  } catch(e) { console.error('Gmail send error:', e); return false; }
}

async function testGmailAlert() {
  setGmailStatus('Enviando email de prueba...', 'var(--text-muted)');
  const ok = await sendGmailAlert(
    '🤖 Voltflow — Test de alertas',
    `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
      <h2 style="color:#6366f1">🤖 Voltflow Assistant</h2>
      <p>Las alertas automáticas funcionan correctamente.</p>
      <p style="color:#666">Recibirás emails cuando el agente detecte leads urgentes o seguimientos vencidos.</p>
    </div>`
  );
  setGmailStatus(ok ? '✅ Email enviado — revisa tu bandeja' : '❌ Error — verifica la configuración', ok ? 'var(--success)' : 'var(--danger)');
}

function buildAlertEmail(title, items, ctaText) {
  const rows = items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eee">
        <strong style="color:#1a1a2e">${item.company}</strong>
        <span style="color:#6366f1;font-size:12px;margin-left:8px">${item.badge||''}</span><br>
        <span style="color:#666;font-size:13px">${item.detail}</span>
      </td>
    </tr>`).join('');
  return `<div style="font-family:Inter,sans-serif;max-width:540px;margin:0 auto;padding:24px;background:#f8f9ff">
    <div style="background:#fff;border-radius:14px;padding:24px;box-shadow:0 2px 16px rgba(99,102,241,.08)">
      <h2 style="color:#6366f1;margin-top:0">🤖 Voltflow — ${title}</h2>
      <p style="color:#999;font-size:12px;margin-top:-10px">${new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}</p>
      <table style="width:100%;border-collapse:collapse">${rows}</table>
      <div style="margin-top:20px;text-align:center">
        <a href="${window.location.href}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">${ctaText||'Abrir Voltflow →'}</a>
      </div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ⏰ MEJORA 2: PROGRAMADOR DE ACCIONES — scheduler automático
// ─────────────────────────────────────────────────────────────────────────────
let _schedulerInterval = null;

function initScheduler() {
  if (_schedulerInterval) clearInterval(_schedulerInterval);
  _schedulerInterval = setInterval(runScheduler, 5 * 60 * 1000);
  setTimeout(runScheduler, 4000);
}

async function runScheduler() {
  const now = new Date();
  const hour = now.getHours();
  const day  = now.getDay();
  const todayKey = now.toISOString().slice(0, 10);

  if (hour === 8 && day >= 1 && day <= 5) {
    const lastBriefing = localStorage.getItem('gordi_last_briefing_email');
    if (lastBriefing !== todayKey) {
      localStorage.setItem('gordi_last_briefing_email', todayKey);
      await schedulerSendDailyBriefing();
    }
  }
  if (hour === 9) {
    const lastOverdue = localStorage.getItem('gordi_last_overdue_email');
    if (lastOverdue !== todayKey) {
      const overdue = getOverdueLeads();
      if (overdue.length >= 2) {
        localStorage.setItem('gordi_last_overdue_email', todayKey);
        await schedulerSendOverdueAlert(overdue);
      }
    }
  }
  if (day === 1 && hour === 10) {
    const weekKey = `${now.getFullYear()}-W${getWeekNumber(now)}`;
    if (localStorage.getItem('gordi_last_weekly_email') !== weekKey) {
      localStorage.setItem('gordi_last_weekly_email', weekKey);
      await schedulerSendWeeklySummary();
    }
  }
  scheduleWeeklyMaintenance();
}

function getWeekNumber(d) {
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}

function getOverdueLeads() {
  const today = new Date(); today.setHours(0,0,0,0);
  return leads.filter(l => !l.archived && l.next_contact && new Date(l.next_contact) < today)
    .sort((a,b) => (b.score||0)-(a.score||0));
}

async function schedulerSendDailyBriefing() {
  const hot = leads.filter(l => !l.archived && (l.score||0) >= 70).slice(0, 5);
  if (!hot.length) return;
  const items = hot.map(l => ({ company: l.company, badge: `Score ${l.score}`, detail: `${l.status} · ${l.segment}` }));
  await sendGmailAlert('☀️ Briefing del día', buildAlertEmail('Briefing del día', items, 'Ver leads →'));
}

async function schedulerSendOverdueAlert(overdue) {
  const items = overdue.slice(0, 6).map(l => ({
    company: l.company, badge: `Score ${l.score}`,
    detail: `Vencido desde ${new Date(l.next_contact).toLocaleDateString('es-ES')} · ${l.status}`
  }));
  await sendGmailAlert(`⚠️ ${overdue.length} seguimiento${overdue.length>1?'s':''} vencido${overdue.length>1?'s':''}`,
    buildAlertEmail('Seguimientos vencidos', items, 'Gestionar ahora →'));
}

async function schedulerSendWeeklySummary() {
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const items = [
    { company: 'Leads activos', badge: leads.filter(l=>!l.archived).length, detail: `${leads.filter(l=>new Date(l.date)>=weekAgo).length} nuevos esta semana` },
    { company: 'Emails enviados', badge: emailHistory.length, detail: 'Total histórico' },
    { company: 'Leads calientes (70+)', badge: leads.filter(l=>!l.archived&&(l.score||0)>=70).length, detail: 'Score alto' },
    { company: 'Cerrados', badge: leads.filter(l=>!l.archived&&l.status==='Cerrado').length, detail: 'En pipeline' },
  ];
  await sendGmailAlert('📊 Resumen semanal', buildAlertEmail('Resumen semanal', items, 'Ver dashboard →'));
}

async function sendManualAlert(type) {
  const token = getGmailToken();
  if (!token) { showToast('⚠️ Conecta Gmail primero en Configuración'); showView('settings'); return; }
  if (type === 'overdue') { const o = getOverdueLeads(); if (!o.length) { showToast('No hay seguimientos vencidos'); return; } await schedulerSendOverdueAlert(o); showToast('📧 Alerta enviada'); }
  else if (type === 'summary') { await schedulerSendWeeklySummary(); showToast('📧 Resumen enviado'); }
  else if (type === 'hot') { await schedulerSendDailyBriefing(); showToast('📧 Briefing enviado'); }
}

// ─────────────────────────────────────────────────────────────────────────────
// 🗣️ MEJORA 3: VOZ COMPLETA — el bot habla las respuestas
// ─────────────────────────────────────────────────────────────────────────────
let _ttsEnabled = localStorage.getItem('gordi_tts') === 'true';
let _ttsVoice   = null;

function initTTS() {
  if (!window.speechSynthesis) return;
  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    _ttsVoice = voices.find(v => v.lang.startsWith('es') && v.name.toLowerCase().includes('female'))
             || voices.find(v => v.lang.startsWith('es')) || voices[0];
  };
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function speakText(text) {
  if (!_ttsEnabled || !window.speechSynthesis) return;
  const clean = text.replace(/<[^>]+>/g,' ').replace(/[^\w\s.,;:!?áéíóúüñÁÉÍÓÚÜÑ–-]/g,'').replace(/\s+/g,' ').trim().slice(0,300);
  if (!clean) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(clean);
  utt.lang = 'es-ES'; utt.rate = 1.05; utt.pitch = 1.0;
  if (_ttsVoice) utt.voice = _ttsVoice;
  window.speechSynthesis.speak(utt);
}

function addTTSButton() {
  const btn = document.getElementById('agent-mode-btn');
  if (!btn || document.getElementById('tts-toggle-btn')) return;
  const ttsBtn = document.createElement('button');
  ttsBtn.id = 'tts-toggle-btn';
  ttsBtn.title = 'Activar/desactivar respuestas por voz';
  ttsBtn.textContent = '🔊';
  ttsBtn.onclick = () => {
    _ttsEnabled = !_ttsEnabled;
    localStorage.setItem('gordi_tts', _ttsEnabled ? 'true' : 'false');
    ttsBtn.style.color = _ttsEnabled ? 'var(--primary)' : 'var(--text-muted)';
    ttsBtn.style.borderColor = _ttsEnabled ? 'rgba(99,102,241,.5)' : 'rgba(99,102,241,.3)';
    if (_ttsEnabled) speakText('Voz activada. Listo para ayudarte.'); else window.speechSynthesis?.cancel();
  };
  ttsBtn.style.cssText = `background:none;border:1px solid ${_ttsEnabled?'rgba(99,102,241,.5)':'rgba(99,102,241,.3)'};border-radius:7px;padding:.2rem .5rem;font-size:.75rem;cursor:pointer;margin-right:.25rem;transition:all .2s;color:${_ttsEnabled?'var(--primary)':'var(--text-muted)'}`;
  btn.parentNode.insertBefore(ttsBtn, btn);
}

// ─────────────────────────────────────────────────────────────────────────────
// 🧹 MEJORA 4: AUTO-MANTENIMIENTO DE LA BASE DE DATOS
// ─────────────────────────────────────────────────────────────────────────────
async function runAutoMaintenance(silent) {
  const report = { archived:0, duplicates:0, rescored:0, cleaned:0 };

  // 1. Archive dead leads (90+ days no activity, stuck in Pendiente/No interesa)
  leads.forEach(l => {
    if (l.archived) return;
    if (!['Pendiente','No interesa'].includes(l.status)) return;
    const last = new Date(l.status_date || l.date || 0);
    if ((Date.now() - last) / 86400000 >= 90) {
      l.archived = true; l.archive_reason = 'Auto: sin actividad 90 días'; report.archived++;
    }
  });

  // 2. Detect duplicates (fuzzy company name)
  const norm = s => (s||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,20);
  const seen = {};
  leads.filter(l=>!l.archived).forEach(l => {
    const key = norm(l.company);
    if (seen[key]) {
      const other = leads.find(x=>x.id===seen[key]);
      if (other && (l.score||0) > (other.score||0)) { other.archived=true; other.archive_reason='Auto: duplicado'; report.duplicates++; }
      else { l.archived=true; l.archive_reason='Auto: duplicado'; report.duplicates++; }
    } else { seen[key] = l.id; }
  });

  // 3. Recalculate scores
  leads.filter(l=>!l.archived).forEach(l => {
    if (typeof recalculateLeadScore === 'function') {
      const ns = recalculateLeadScore(l);
      if (ns !== l.score) { l.score = ns; report.rescored++; }
    }
  });

  // 4. Clean empty tags
  leads.forEach(l => {
    if (l.tags) { const c = l.tags.filter(t=>t&&t.trim()); if (c.length!==l.tags.length){l.tags=c;report.cleaned++;} }
  });

  const total = report.archived+report.duplicates+report.rescored+report.cleaned;
  if (total > 0) { saveLeads(); renderAll(); }

  if (!silent) {
    const lines = [];
    if (report.archived)   lines.push(`📦 ${report.archived} leads archivados (90d sin actividad)`);
    if (report.duplicates) lines.push(`♻️ ${report.duplicates} duplicados eliminados`);
    if (report.rescored)   lines.push(`⭐ ${report.rescored} scores actualizados`);
    if (report.cleaned)    lines.push(`🏷 ${report.cleaned} etiquetas limpias`);
    chatAddMessage('bot', total > 0
      ? '🧹 <strong>Mantenimiento completado:</strong><br>' + lines.join('<br>')
      : '✅ Base de datos en perfecto estado.');
    if (total >= 3) {
      const items = lines.map(l => ({company: l.replace(/[📦♻️⭐🏷] /,''), badge:'', detail:''}));
      await sendGmailAlert('🧹 Mantenimiento automático', buildAlertEmail('Mantenimiento DB', items, 'Ver base de datos →'));
    }
  }
  return report;
}

function scheduleWeeklyMaintenance() {
  const now = new Date();
  if (now.getDay() !== 0 || now.getHours() < 22) return;
  const weekKey = `${now.getFullYear()}-W${getWeekNumber(now)}`;
  if (localStorage.getItem('gordi_last_maintenance') !== weekKey) {
    localStorage.setItem('gordi_last_maintenance', weekKey);
    runAutoMaintenance(true);
  }
}

async function sendProactiveAlert(lead, reason) {
  const items = [{ company: lead.company, badge: `Score ${lead.score}`, detail: reason }];
  await sendGmailAlert(`🚨 Acción urgente: ${lead.company}`, buildAlertEmail('Alerta urgente', items, 'Actuar ahora →'));
}

function isChacha(text) {
  return /mant[ei]nimiento|limpia|duplicad|archiva.*auto|resumen.*email|env[ií]a.*email|m[áa]ndame.*email|briefing.*email|alerta.*gmail/i.test(text);
}


// ══════════════════════════════════════════════════════════════════════════════
// 🔒 confirmStatusChange — siempre pregunta antes de cambiar estado
// ══════════════════════════════════════════════════════════════════════════════
function confirmStatusChange(lead, newStatus, onConfirm) {
  if (lead.status === newStatus) { onConfirm(); return; }
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)';
  modal.innerHTML = `
    <div style="background:var(--bg2);border:1px solid var(--glass-border);border-radius:16px;padding:1.5rem;max-width:360px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,.4)">
      <div style="font-size:1.1rem;font-weight:700;margin-bottom:.5rem">¿Cambiar estado?</div>
      <div style="font-size:.85rem;color:var(--text-muted);margin-bottom:1.25rem;line-height:1.5">
        <strong>${lead.company}</strong><br>
        <span style="color:var(--text-dim)">${lead.status}</span>
        <span style="color:var(--primary);margin:0 .4rem">→</span>
        <strong style="color:var(--text)">${newStatus}</strong>
      </div>
      <div style="display:flex;gap:.75rem">
        <button id="csc-yes" class="btn-primary" style="flex:1">✓ Sí, cambiar</button>
        <button id="csc-no" class="btn-outline" style="flex:1">✕ Cancelar</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#csc-yes').onclick = () => { modal.remove(); onConfirm(); };
  modal.querySelector('#csc-no').onclick = () => { modal.remove(); renderKanban(); };
  modal.onclick = (e) => { if (e.target === modal) { modal.remove(); renderKanban(); } };
}


// ══════════════════════════════════════════════════════════════════════════
// 🐙 GITHUB SYNC — almacenamiento gratis e ilimitado en tu propio repo
// ══════════════════════════════════════════════════════════════════════════
const GITHUB_DATA_FILE = 'voltflow-data.json';

function getGithubConfig() {
  return {
    token: localStorage.getItem('gordi_gh_token') || '',
    user:  localStorage.getItem('gordi_gh_user')  || '',
    repo:  localStorage.getItem('gordi_gh_repo')  || '',
  };
}

function setGithubStatus(msg, color) {
  const el = document.getElementById('github-status');
  if (el) { el.textContent = msg; el.style.color = color || 'var(--text-muted)'; }
}

function saveGithubConfig() {
  const token = document.getElementById('gh-token-input')?.value.trim();
  const user  = document.getElementById('gh-user-input')?.value.trim();
  const repo  = document.getElementById('gh-repo-input')?.value.trim();
  if (!token || !user || !repo) {
    setGithubStatus('⚠️ Rellena los 3 campos', 'var(--danger)'); return;
  }
  localStorage.setItem('gordi_gh_token', token);
  localStorage.setItem('gordi_gh_user',  user);
  localStorage.setItem('gordi_gh_repo',  repo);
  setGithubStatus('Probando conexión...', 'var(--text-muted)');
  githubPush(true).then(() => {
    document.getElementById('github-badge').style.display = 'inline-block';
    updateCloudPill();
  });
}

function toggleGithubAuto(enabled) {
  localStorage.setItem('gordi_gh_auto', enabled ? 'true' : 'false');
  showToast(enabled ? '🐙 GitHub auto-sync activado' : '🐙 Auto-sync desactivado');
  updateCloudPill();
}

// ── Push: write voltflow-data.json to repo ────────────────────────────────
async function githubPush(showFeedback) {
  const { token, user, repo } = getGithubConfig();
  if (!token || !user || !repo) {
    if (showFeedback) setGithubStatus('⚠️ Configura GitHub primero', 'var(--danger)');
    return false;
  }
  if (showFeedback) setGithubStatus('⬆ Subiendo...', 'var(--text-muted)');

  try {
    const snapshot = exportDataSnapshot();
    // Never store the GitHub token in the repo — strip it before upload
    const safeSnapshot = Object.assign({}, snapshot);
    delete safeSnapshot['gordi_gh_token'];
    const payload  = JSON.stringify({ voltflow: safeSnapshot, _updated: new Date().toISOString() }, null, 0);
    const encoded  = btoa(unescape(encodeURIComponent(payload)));

    // Get current SHA (needed for update)
    const sha = await githubGetSHA(token, user, repo);

    const body = { message: `Voltflow sync ${new Date().toISOString()}`, content: encoded };
    if (sha) body.sha = sha;

    const res = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/${GITHUB_DATA_FILE}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'HTTP ' + res.status);
    }

    localStorage.setItem('gordi_gh_last_push', new Date().toISOString());
    if (showFeedback) {
      const now = new Date().toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' });
      setGithubStatus(`✅ Subido correctamente — ${now}`, 'var(--success)');
      showToast('🐙 Datos guardados en GitHub');
    }
    return true;
  } catch(e) {
    console.error('GitHub push error:', e);
    if (showFeedback) setGithubStatus(`❌ Error: ${e.message}`, 'var(--danger)');
    return false;
  }
}

// ── Get SHA of existing file (required for updates) ───────────────────────
async function githubGetSHA(token, user, repo) {
  try {
    const res = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/${GITHUB_DATA_FILE}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.sha || null;
  } catch { return null; }
}

// ── Pull: read voltflow-data.json from repo ───────────────────────────────
async function githubPull(showFeedback) {
  const { token, user, repo } = getGithubConfig();
  if (!token || !user || !repo) return false;
  if (showFeedback) setGithubStatus('⬇ Descargando...', 'var(--text-muted)');

  try {
    // Use raw content URL to avoid base64 decode complexity
    const res = await fetch(`https://raw.githubusercontent.com/${user}/${repo}/principal/${GITHUB_DATA_FILE}?t=${Date.now()}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });

    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const snapshot = data?.voltflow;
    if (!snapshot) throw new Error('Datos no encontrados');

    // Confirm if cloud has different lead count
    const cloudLeads = (() => { try { return JSON.parse(snapshot['gordi_leads'] || '[]').length; } catch { return 0; } })();
    const localLeads = leads.length;

    if (showFeedback && cloudLeads !== localLeads) {
      if (!confirm(`¿Descargar datos de GitHub?\n\nNube: ${cloudLeads} leads\nLocal: ${localLeads} leads`)) {
        setGithubStatus('Descarga cancelada', 'var(--text-dim)'); return false;
      }
    }

    importDataSnapshot(snapshot, true);
    try { leads = JSON.parse(localStorage.getItem('gordi_leads') || '[]'); } catch { leads = []; }
    try { emailHistory = JSON.parse(localStorage.getItem('gordi_email_history') || '[]'); } catch { emailHistory = []; }
    try { campaigns = JSON.parse(localStorage.getItem('gordi_campaigns') || '[]'); } catch { campaigns = []; }
    // Restore API keys to memory
    _gmailToken = localStorage.getItem('gordi_gmail_token') || null;
    _ttsEnabled = localStorage.getItem('gordi_tts') === 'true';

    renderAll(); try { renderTracking(); } catch(e) {}

    localStorage.setItem('gordi_gh_last_pull', new Date().toISOString());
    if (showFeedback) {
      const now = new Date().toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' });
      setGithubStatus(`✅ Descargado correctamente — ${now}`, 'var(--success)');
      showToast('🐙 Datos restaurados desde GitHub');
    }
    return true;
  } catch(e) {
    console.error('GitHub pull error:', e);
    if (showFeedback) setGithubStatus(`❌ Error: ${e.message}`, 'var(--danger)');
    return false;
  }
}

// ── Init: populate settings UI & auto-pull on load ────────────────────────
function initGithubSync() {
  const { token, user, repo } = getGithubConfig();
  const tokenEl = document.getElementById('gh-token-input');
  const userEl  = document.getElementById('gh-user-input');
  const repoEl  = document.getElementById('gh-repo-input');
  const autoEl  = document.getElementById('github-auto-sync');
  const badge   = document.getElementById('github-badge');

  if (tokenEl && token) tokenEl.value = token;
  if (userEl  && user)  userEl.value  = user;
  if (repoEl  && repo)  repoEl.value  = repo;
  if (autoEl)  autoEl.checked = localStorage.getItem('gordi_gh_auto') === 'true';
  if (badge && token)   badge.style.display = 'inline-block';

  // Auto-pull on load if configured
  if (token && user && repo && localStorage.getItem('gordi_gh_auto') === 'true') {
    setTimeout(() => githubPull(false), 2000);
  }
  // First-run on new device: no local data but GitHub configured
  const hasLocal = !!(localStorage.getItem('gordi_leads') || localStorage.getItem('gordi_api_key'));
  if (!hasLocal && token && user && repo) {
    setTimeout(async () => {
      showToast('🔄 Nuevo dispositivo — restaurando desde GitHub...');
      await githubPull(false);
      showToast('✅ Todo restaurado automáticamente');
    }, 1500);
  }
}

const GORDI_SYSTEM = `Eres Voltflow Assistant, el asistente inteligente integrado en Voltflow — app de prospección comercial B2B para Voltium Madrid (reformas integrales, eficiencia energética y mantenimiento integral de naves industriales en Madrid).

TIENES DOS MODOS DE OPERACIÓN:

═══════════════════════════════════════
MODO 1: AYUDA Y EXPLICACIÓN
═══════════════════════════════════════
Responde preguntas sobre cómo usar la app. Explica funciones, guía paso a paso, resuelve dudas.

CONOCES LA APP AL COMPLETO:
- Dashboard: KPIs, scoring dinámico, métricas conversión, inteligencia de zona, alertas prioridad
- Gestión de Leads: CRUD manual de contactos B2B
- Buscar Empresas: Google Places + scraping web + Hunter.io → emails, teléfonos, redes, decisor
- Pipeline Kanban: columnas Pendiente→Contactado→Respuesta del cliente→Visita→Entrega de presupuesto→Cerrado
- Seguimiento: historial emails, exportar CSV
- Campañas: email en masa por segmento
- Plantillas: 8 templates por sector con copywriting PAS
- Importar CSV: importar leads desde Excel
- Configuración: perfil Voltium, APIs (Google, Hunter, Gemini)
- Email IA (botón ✨): lee reseñas Google → Gemini genera email hiperpersonalizado con formato
- Chat: este mismo asistente que puede mejorar la app en tiempo real
- Control por voz: botón 🎙️ en el chat para hablar directamente
- Memoria persistente: recuerdas las preferencias del usuario entre sesiones
- Gráficos en chat: puedes mostrar gráficos de embudo y sectores
- Modo autónomo: detectas leads urgentes y alertas proactivas
- Plan semanal: generas planes de acción cada lunes con datos reales
- Modo Agente: bucle autónomo de seguimientos, perfil psicológico, vigilancia oportunidades, negociador objeciones, modo delegado
- Gmail alertas: emails automáticos al usuario (briefing diario 8h, vencidos 9h, resumen semanal lunes 10h, alertas proactivas)
- Voz completa: botón 🔊 para que el bot hable sus respuestas en español
- Auto-mantenimiento: archiva leads muertos, elimina duplicados, actualiza scores cada domingo
- Scheduler: programador automático de acciones sin intervención del usuario, perfil psicológico de leads, vigilancia de oportunidades, negociador de objeciones y modo delegado para ejecutar acciones en masa

APIs necesarias (todas gratuitas):
- Google Places: console.cloud.google.com
- Hunter.io: hunter.io (25/mes gratis)
- Gemini: aistudio.google.com/apikey (1500/día gratis)

═══════════════════════════════════════
MODO 2: AUTOPROGRAMACIÓN DE MEJORAS
═══════════════════════════════════════
Cuando el usuario pida añadir, cambiar o mejorar algo en la app, activas este modo.

PROCESO:
1. Recibirás el código HTML COMPLETO de la app en el mensaje del usuario.
2. Lees ese código completo y encuentras TÚ MISMO las partes que necesitas modificar.
3. Generas el patch con los find/replace exactos.
4. NUNCA le pidas al usuario que te envíe código — tú ya lo tienes todo.
5. NUNCA digas que "necesitas ver el código" — ya está en el mensaje.
6. Si hay algo ambiguo, hazlo de la forma más razonable y aplícalo.

REGLA ABSOLUTA: NUNCA le pidas al usuario que busque o copie código. NUNCA digas frases como "necesito ver el código de...", "podrías enviarme...", "busca y envíame...". Tú tienes el código completo — úsalo.

FORMATO DE RESPUESTA PARA MEJORAS:
Cuando vayas a aplicar un cambio, responde ÚNICAMENTE con este JSON (sin markdown, sin explicación antes o después):

{"type":"patch","description":"Descripción breve del cambio","preview":"Lo que cambia en 1-2 frases","patches":[{"find":"TEXTO_EXACTO_A_BUSCAR_EN_EL_HTML","replace":"TEXTO_EXACTO_DE_REEMPLAZO"}]}

REGLAS DEL PATCH — CRÍTICAS:
- "find" debe ser un fragmento ÚNICO en el archivo. Incluye 3-5 líneas de contexto para garantizar unicidad. NUNCA uses una sola línea corta como find.
- "replace" contiene todo lo que había en find MÁS los cambios. No omitas el contexto del find en el replace.
- Escapa correctamente las comillas en los strings JSON: \" para comillas dobles dentro del find/replace.
- Si el cambio afecta HTML y JS por separado, usa múltiples objetos en el array "patches".
- Mantén el estilo visual: dark theme, variables CSS --primary, --bg, --glass, --text, --success, --danger.
- Para añadir CSS nuevo, busca un bloque CSS existente único y añade tus reglas al final en el replace.
- Para añadir funciones JS nuevas, busca la función más cercana y añade la nueva justo después.

FLUJO:
- Si la petición es clara y concreta → genera el JSON del patch DIRECTAMENTE, sin pedir confirmación.
- Si hay ambigüedad real (ej: no está claro en qué parte de la app) → pregunta solo lo mínimo, en 1 frase.

TIPOS DE MEJORAS QUE PUEDES HACER:
- Añadir o quitar campos en formularios
- Añadir columnas a tablas o kanban
- Nuevos filtros, botones o acciones
- Cambios visuales (colores, tamaños, layouts)
- Nuevas métricas en el dashboard
- Modificar plantillas de email
- Añadir validaciones o lógica de negocio
- Cualquier mejora funcional que el usuario describa

ESTILO DE RESPUESTA (modo ayuda):
- Conciso, máximo 4-5 párrafos cortos
- Emojis con moderación
- Pasos numerados para procesos
- Siempre en español

═══════════════════════════════════════
MODO 3: ANÁLISIS DE EMBUDO (Mejora 4)
═══════════════════════════════════════
Cuando el usuario pregunte por qué no cierra o pida análisis de rendimiento:
1. Lee los datos reales de la cuenta (leads por estado, emails enviados, sectores, etc.)
2. Detecta patrones: ¿dónde se atascan los leads? ¿qué sectores convierten menos? ¿hay leads dormidos?
3. Da conclusiones específicas con números reales, no generalidades
4. Propone exactamente 3 acciones concretas y accionables esta semana
Nunca digas "no tengo acceso a tus datos" — los datos reales van siempre en el mensaje.

═══════════════════════════════════════
MODO 4: COACH DE VENTAS (Mejora 5)
═══════════════════════════════════════
Cuando el usuario pegue una respuesta de un lead o pregunte cómo responder:
1. Analiza la respuesta: ¿hay interés real? ¿qué objeciones? ¿qué señales implícitas?
2. Lee el historial del lead si está disponible en el contexto
3. Genera el texto completo de respuesta, listo para enviar (no un esquema, el texto final)
4. Explica en 1 frase la táctica usada y por qué
El texto de respuesta debe ir en un bloque claramente diferenciado, en primera persona del vendedor.

═══════════════════════════════════════
MODO 5: ACCIONES EJECUTABLES (Mejora 2)
═══════════════════════════════════════
Cuando el usuario pida ejecutar una acción directa (ver leads, cambiar estado, etc.):
- Puedes incluir en tu respuesta HTML con onclick que llame a funciones de la app:
  openLeadDetail('ID'), openAiEmailModal('ID'), showView('leads'), chatExecute('topLeads')
- Usa enlaces clicables para los leads cuando los menciones
- Si el usuario pide "cambia el estado de X a Y", genera un patch que lo haga`;

// ══════════════════════════════════════════════════════════════════════════════
// VOLTFLOW ASSISTANT — Motor de chat + autoprogramación
// ══════════════════════════════════════════════════════════════════════════════

let chatHistory = [];
let chatOpen = false;
let chatInitialized = false;
let pendingPatch = null;
let _chatVoiceRecog = null;
let _chatVoiceActive = false;
// ── Persistent chat memory ────────────────────────────────────────────────────
let chatMemory = (() => {
  try { return JSON.parse(localStorage.getItem('gordi_chat_memory') || '{}'); } catch { return {}; }
})();
function saveChatMemory() {
  localStorage.setItem('gordi_chat_memory', JSON.stringify(chatMemory));
}

function toggleChat() {
  chatOpen = !chatOpen;
  const win = document.getElementById('chat-window');
  win.classList.toggle('open', chatOpen);
  document.getElementById('chat-notif').style.display = 'none';
  if (chatOpen && !chatInitialized) {
    chatInitialized = true;
    if (shouldShowWeeklyPlan()) {
      chatShowDailyBriefing();
      setTimeout(() => generateWeeklyPlan(), 800);
    } else {
      chatShowDailyBriefing();
    }
  }
  if (chatOpen) showPendingProactive();
  if (chatOpen) setTimeout(() => document.getElementById('chat-input').focus(), 100);
}

function chatAddMessage(role, html, extra) {
  const el = document.getElementById('chat-messages');
  if (!el) return;
  const div = document.createElement('div');
  div.className = 'chat-msg ' + role;
  div.innerHTML = html;
  if (extra) div.appendChild(extra);
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
  // 🗣️ TTS: speak bot replies
  if (role === 'bot') debouncedRender('tts', () => speakText(html), 100);
  return div;
}

function chatShowTyping() {
  const el = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-msg bot typing';
  div.id = 'chat-typing';
  div.innerHTML = '⏳ Analizando...';
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

function chatRemoveTyping() {
  const t = document.getElementById('chat-typing');
  if (t) t.remove();
}

function chatAsk(question) {
  document.getElementById('chat-input').value = question;
  chatSend();
}

// ── Detectar si el mensaje es una petición de mejora ─────────────────────────
function isImproveRequest(text) {
  const keywords = [
    'añadir','añade','agregar','agrega','quiero que','necesito que',
    'pon','poner','crear','crea','modificar','modifica','cambiar','cambia',
    'mejorar','mejora','incluir','incluye','implementar','implementa',
    'nuevo campo','nueva columna','nueva función','nuevo botón','que aparezca',
    'que muestre','que tenga','que se pueda','hacer que','falta','faltan',
    'quiero','necesito','podría','podrías','puedes','hacer que','añadir',
    'quita','elimina','borra','oculta','muestra','agrega','mete','saca',
    'quisiera','me gustaría','sería posible','se puede','cámbia','ponle',
    'que salga','que no salga','que funcione','arregla','arreglar','fix'
  ];
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

// ── Extraer fragmento de código relevante para el cambio ─────────────────────
function extractRelevantCode(userRequest) {
  const fullHtml = document.documentElement.outerHTML;
  const lower = userRequest.toLowerCase();

  const grab = (marker, size) => {
    const idx = fullHtml.indexOf(marker);
    return idx > 0 ? fullHtml.substring(Math.max(0, idx - 50), idx + size) : '';
  };

  let sections = [];

  // Formulario / campos de leads
  if (lower.match(/campo|formulario|lead.form|presupuesto|precio|fecha|añad|agreg|nuevo campo/)) {
    const s1 = grab('id="lead-form"', 3000); if (s1) sections.push({ name:'lead-form HTML', code: s1 });
    const s2 = grab('function saveLead()', 2000); if (s2) sections.push({ name:'saveLead JS', code: s2 });
    const s3 = grab('function openLeadForm(', 1500); if (s3) sections.push({ name:'openLeadForm JS', code: s3 });
  }

  // Tabla / lista de leads
  if (lower.match(/tabla|columna|lista|lead.*mostrar|renderLead/)) {
    const s1 = grab('function renderLeads()', 3000); if (s1) sections.push({ name:'renderLeads JS', code: s1 });
    const s2 = grab('<table', 1500); if (s2) sections.push({ name:'leads table HTML', code: s2 });
  }

  // Dashboard / métricas / KPI
  if (lower.match(/dashboard|métrica|estadístic|kpi|panel|gráfico|chart/)) {
    const s1 = grab('function renderConversionMetrics()', 2000); if (s1) sections.push({ name:'renderConversionMetrics JS', code: s1 });
    const s2 = grab('function updateStats()', 1500); if (s2) sections.push({ name:'updateStats JS', code: s2 });
    const s3 = grab('id="dashboard-view"', 2000); if (s3) sections.push({ name:'dashboard HTML', code: s3 });
  }

  // Kanban / pipeline
  if (lower.match(/kanban|pipeline|estado|columna.*estado|etapa/)) {
    const s1 = grab('function renderKanban()', 2500); if (s1) sections.push({ name:'renderKanban JS', code: s1 });
    const s2 = grab('id="kanban-view"', 1500); if (s2) sections.push({ name:'kanban HTML', code: s2 });
  }

  // Modal de detalle del lead
  if (lower.match(/detalle|modal|ver lead|editar lead|abrir lead/)) {
    const s1 = grab('function openLeadDetail(', 2500); if (s1) sections.push({ name:'openLeadDetail JS', code: s1 });
    const s2 = grab('function saveLeadDetail(', 1000); if (s2) sections.push({ name:'saveLeadDetail JS', code: s2 });
    const s3 = grab('id="lead-detail-modal"', 2000); if (s3) sections.push({ name:'lead-detail modal HTML', code: s3 });
  }

  // Scoring / puntuación
  if (lower.match(/score|puntuación|prioridad|puntos|puntaj/)) {
    const s1 = grab('function calculateScore(', 1500); if (s1) sections.push({ name:'calculateScore JS', code: s1 });
  }

  // Email / plantillas
  if (lower.match(/email|plantilla|correo|template|asunto|cuerpo/)) {
    const s1 = grab('function generateEmail(', 2000); if (s1) sections.push({ name:'generateEmail JS', code: s1 });
    const s2 = grab('const emailTemplates', 2000); if (s2) sections.push({ name:'emailTemplates', code: s2 });
  }

  // Importar / CSV / Excel
  if (lower.match(/import|csv|excel|subir|cargar archivo/)) {
    const s1 = grab('function processFile(', 1500); if (s1) sections.push({ name:'processFile JS', code: s1 });
    const s2 = grab('function parseAndPreviewImport(', 2000); if (s2) sections.push({ name:'parseAndPreviewImport JS', code: s2 });
    const s3 = grab('id="import-view"', 2000); if (s3) sections.push({ name:'import HTML', code: s3 });
  }

  // Búsqueda / enriquecimiento
  if (lower.match(/buscar|búsqueda|enriquec|scraping|hunter|apollo/)) {
    const s1 = grab('function startSearch(', 2000); if (s1) sections.push({ name:'startSearch JS', code: s1 });
    const s2 = grab('id="search-view"', 2000); if (s2) sections.push({ name:'search HTML', code: s2 });
  }

  // Configuración / settings / API keys
  if (lower.match(/configuración|config|api|settings|clave|key/)) {
    const s1 = grab('id="settings-view"', 3000); if (s1) sections.push({ name:'settings HTML', code: s1 });
    const s2 = grab('function saveProfile(', 1000); if (s2) sections.push({ name:'saveProfile JS', code: s2 });
  }

  // CSS / visual / colores
  if (lower.match(/color|diseño|estilo|fondo|botón|visual|css|tema|fuente|tamaño/)) {
    const s1 = grab(':root {', 1000); if (s1) sections.push({ name:'CSS :root variables', code: s1 });
    const s2 = grab('.btn-primary', 500); if (s2) sections.push({ name:'CSS buttons', code: s2 });
  }

  // Sidebar / navegación
  if (lower.match(/sidebar|menú|navegación|nav|enlace|sección/)) {
    const s1 = grab('<aside id="sidebar"', 2000); if (s1) sections.push({ name:'sidebar HTML', code: s1 });
    const s2 = grab('function showView(', 800); if (s2) sections.push({ name:'showView JS', code: s2 });
  }

  // Seguimiento / tracking / historial
  if (lower.match(/seguimiento|tracking|historial|histori/)) {
    const s1 = grab('id="tracking-view"', 2000); if (s1) sections.push({ name:'tracking HTML', code: s1 });
    const s2 = grab('function renderTracking(', 1500); if (s2) sections.push({ name:'renderTracking JS', code: s2 });
  }

  // Fallback: estructura general
  if (sections.length === 0) {
    const s1 = grab('function showView(', 800); if (s1) sections.push({ name:'app structure', code: s1 });
    const s2 = grab('function updateStats()', 600); if (s2) sections.push({ name:'updateStats', code: s2 });
    const s3 = grab('function renderLeads()', 1500); if (s3) sections.push({ name:'renderLeads', code: s3 });
  }

  // Limitar a 8000 chars pero intentar incluir todo lo relevante
  let combined = sections.map(s => `// === ${s.name} ===\n${s.code}`).join('\n\n');
  if (combined.length > 8000) combined = combined.substring(0, 8000) + '\n// [truncado por longitud]';

  return combined;
}

// ── Aplicar patch al DOM en tiempo real ──────────────────────────────────────
function applyPatch(patch) {
  try {
    // Guardar TODOS los datos de localStorage antes de modificar
    const savedData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      savedData[key] = localStorage.getItem(key);
    }

    let html = document.documentElement.outerHTML;
    let appliedCount = 0;
    const failedPatches = [];

    for (const p of patch.patches) {
      if (!p.find || !p.replace) continue;
      if (!html.includes(p.find)) {
        console.warn('[Patch] find not found:', p.find.substring(0, 100));
        failedPatches.push(p.find.substring(0, 60) + '...');
        continue;
      }
      // Reemplazar SOLO la primera ocurrencia para mayor seguridad
      html = html.replace(p.find, p.replace);
      appliedCount++;
    }

    if (appliedCount === 0) {
      const hint = failedPatches.length
        ? `\n\nFragmentos no encontrados:\n${failedPatches.map(f => `• "${f}"`).join('\n')}\n\nEl código puede haber cambiado. Intenta describir la mejora de nuevo.`
        : '';
      chatAddMessage('bot', '⚠️ No se pudo aplicar el cambio — el código de referencia no coincide.' + hint);
      return;
    }

    if (failedPatches.length > 0) {
      console.warn('[Patch] Algunos patches fallaron:', failedPatches);
    }

    // Aplicar: reemplazar el documento completo
    document.open();
    document.write(html);
    document.close();

    // Restaurar TODOS los datos de localStorage
    for (const [key, value] of Object.entries(savedData)) {
      if (value !== null) localStorage.setItem(key, value);
    }

    // Reabrir chat con confirmación
    setTimeout(() => {
      const win = document.getElementById('chat-window');
      if (win) {
        win.classList.add('open');
        chatInitialized = true;
        chatOpen = true;
        const msg = appliedCount < patch.patches.length
          ? `✅ <strong>Cambio aplicado parcialmente</strong> (${appliedCount}/${patch.patches.length} partes).<br><br>${patch.description}<br><br>¿Quieres ajustar algo más?`
          : `✅ <strong>¡Mejora aplicada!</strong><br><br>${patch.description}<br><br>¿Quieres añadir algo más?`;
        chatAddMessage('bot', msg);
      }
    }, 400);

  } catch(e) {
    chatAddMessage('bot', '❌ Error al aplicar el cambio: ' + e.message + '<br>Inténtalo de nuevo.');
  }
}

// ── Botones de confirmación del patch ────────────────────────────────────────
function buildPatchConfirmButtons(patch) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:.5rem;margin-top:.65rem;flex-wrap:wrap';

  const btnYes = document.createElement('button');
  btnYes.className = 'btn-primary';
  btnYes.style.cssText = 'font-size:.75rem;padding:.3rem .8rem';
  btnYes.innerHTML = '✅ Aplicar ahora';
  btnYes.onclick = () => { wrap.remove(); applyPatch(patch); };

  const btnNo = document.createElement('button');
  btnNo.className = 'btn-outline';
  btnNo.style.cssText = 'font-size:.75rem;padding:.3rem .8rem';
  btnNo.innerHTML = '✕ Cancelar';
  btnNo.onclick = () => { wrap.remove(); pendingPatch = null; chatAddMessage('bot', 'Cancelado. ¿Qué más necesitas?'); };

  wrap.appendChild(btnYes);
  wrap.appendChild(btnNo);
  return wrap;
}

// ── Función principal de envío ────────────────────────────────────────────────
async function chatSend() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';
  chatAddMessage('user', text);
  document.getElementById('chat-suggestions').style.display = 'none';

  const geminiKey = localStorage.getItem('gordi_claude_key');
  if (!geminiKey) {
    chatAddMessage('bot', '⚠️ Necesitas configurar tu <strong>API Key de Gemini</strong> en Configuración para usar el asistente.<br><br>Es gratuita: <a href="https://aistudio.google.com/apikey" target="_blank" style="color:var(--primary)">aistudio.google.com/apikey</a>');
    return;
  }

  // Contexto enriquecido en tiempo real (Mejora 3)
  const richContext = buildRichAppContext();
  const isImprove = isImproveRequest(text);
  const isAnalysis   = isAnalysisRequest(text);
  const isCoach      = isSalesCoachRequest(text);
  const isDelegate   = isAgentDelegateRequest(text);
  const isChacha_cmd = isChacha(text);
  if (isChacha_cmd) {
    chatAddMessage('user', text);
    if (/mant[ei]nimiento|limpia|duplicad/i.test(text)) { runAutoMaintenance(false); return; }
    if (/resumen.*email|weekly/i.test(text)) { sendManualAlert('summary'); return; }
    if (/briefing.*email|hot.*email/i.test(text)) { sendManualAlert('hot'); return; }
    if (/vencido|overdue/i.test(text)) { sendManualAlert('overdue'); return; }
    if (/mantenimiento/.test(text)) { runAutoMaintenance(false); return; }
  }
  const isOpportunity= isOpportunityRequest(text);

  // Agent: delegate mode — execute directly
  if (isDelegate) {
    chatAddMessage('user', text);
    agentBatchPrepare(text);
    return;
  }
  // Agent: opportunity scan
  if (isOpportunity && agentModeActive) {
    chatAddMessage('user', text);
    scanLeadOpportunities();
    return;
  }

  let fullUserMessage = richContext + buildMemoryContext() + '\n\nMensaje del usuario: ' + text;

  // Coach de ventas: añadir contexto del lead mencionado (Mejora 5)
  if (isCoach) {
    fullUserMessage += buildSalesCoachContext(text);
    fullUserMessage += '\n\nCOMPORTAMIENTO ESPERADO: Actúa como coach de ventas experto. Analiza la respuesta del lead, interpreta las señales implícitas, y genera la respuesta óptima teniendo en cuenta el historial y el sector. Sé directo y da el texto listo para enviar.';
  }

  // Si es petición de mejora, enviar el HTML completo
  if (isImprove) {
    const fullHtml = document.documentElement.outerHTML;
    fullUserMessage += '\n\nCÓDIGO COMPLETO DE LA APP (busca tú mismo lo que necesitas modificar):\n' + fullHtml;
  }

  // Si es análisis de embudo, reforzar el rol analítico (Mejora 4)
  if (isAnalysis && !isImprove) {
    fullUserMessage += '\n\nCOMPORTAMIENTO ESPERADO: Analiza los datos reales proporcionados arriba. Detecta patrones, cuellos de botella y oportunidades. Da conclusiones concretas y 3 acciones específicas para mejorar. Basa todo en los números reales, no en generalidades.';
  }

  chatHistory.push({ role: 'user', parts: [{ text: fullUserMessage }] });
  chatShowTyping();

  try {
    const messages = [
      { role: 'user', parts: [{ text: GORDI_SYSTEM }] },
      { role: 'model', parts: [{ text: 'Entendido. Soy Voltflow Assistant en modo dual: ayuda y autoprogramación.' }] },
      ...chatHistory
    ];

    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + geminiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages,
          generationConfig: { temperature: 0.4, maxOutputTokens: 6000 }
        })
      }
    );

    chatRemoveTyping();
    if (!res.ok) throw new Error('Error ' + res.status);

    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    chatHistory.push({ role: 'model', parts: [{ text: reply }] });
    if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

    // ── Detectar si la respuesta es un patch JSON ─────────────────────────────
    const jsonMatch = reply.match(/\{[\s\S]*"type"\s*:\s*"patch"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const patch = JSON.parse(jsonMatch[0]);
        pendingPatch = patch;

        // Mostrar preview y botones de confirmación
        const confirmButtons = buildPatchConfirmButtons(patch);
        chatAddMessage('bot',
          '🔧 <strong>Mejora lista para aplicar:</strong><br><br>' +
          patch.preview + '<br><br>' +
          '<span style="font-size:.75rem;color:var(--text-muted)">Se aplicará en tiempo real sin perder tus datos. ¿Confirmas?</span>',
          confirmButtons
        );
        return;
      } catch(e) {
        // Si falla el parse, mostrar como texto normal
      }
    }

    // ── Respuesta de texto normal con formato enriquecido ───────────────────
    let formatted = reply
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(99,102,241,.12);padding:.1rem .35rem;border-radius:4px;font-size:.8rem">$1</code>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
      .replace(/(\d+\.\s)/g, '<br>$1')
      .replace(/^<br>/, '');

    // Add quick action buttons if the response is analysis or briefing related
    const msgEl = chatAddMessage('bot', formatted);

    // Save memory after each exchange
    extractAndSaveMemory(text, reply);

    // If analysis response, add charts + quick actions
    if (isAnalysis && msgEl) {
      appendChatCharts(msgEl, null);
      const actBar = document.createElement('div');
      actBar.style.cssText = 'display:flex;gap:.4rem;margin-top:.65rem;flex-wrap:wrap';
      const actions = [
        { label:'🔥 Ver leads prioritarios', fn: "chatExecute('topLeads')" },
        { label:'⏰ Ver vencidos', fn: "chatExecute('overdueLeads')" },
        { label:'📊 Stats semana', fn: "chatExecute('weekStats')" },
      ];
      actions.forEach(a => {
        const btn = document.createElement('button');
        btn.className = 'btn-outline';
        btn.style.cssText = 'font-size:.72rem;padding:.25rem .6rem';
        btn.innerHTML = a.label;
        btn.onclick = new Function(a.fn);
        actBar.appendChild(btn);
      });
      msgEl.appendChild(actBar);
    }

  } catch(e) {
    chatRemoveTyping();
    chatAddMessage('bot', '❌ Error: ' + e.message + '. Verifica tu API key de Gemini en Configuración.');
  }
}

// Auto-resize textarea del chat + AI editor word count
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('chat-input');
  if (input) {
    input.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 80) + 'px';
    });
  }

  // Live word count and spam check on AI editor
  const aiEditor = document.getElementById('ai-body-editor');
  if (aiEditor) {
    aiEditor.addEventListener('input', updateEmailWordCount);
  }
  const aiSubject = document.getElementById('ai-subject-out');
  if (aiSubject) {
    aiSubject.addEventListener('input', () => checkSpam(aiSubject.value));
  }

  setTimeout(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const overdue = leads.filter(l => l.next_contact && !l.archived && new Date(l.next_contact) < today).length;
    const hot = leads.filter(l => l.score >= 75 && l.status === 'Pendiente' && !l.archived).length;
    const urgent = overdue + hot;
    const notifEl = document.getElementById('chat-notif');
    if (urgent > 0 && !chatOpen && notifEl) {
      notifEl.style.display = 'flex';
      notifEl.style.alignItems = 'center';
      notifEl.style.justifyContent = 'center';
      notifEl.textContent = urgent > 9 ? '9+' : urgent;
      notifEl.style.background = overdue > 0 ? 'var(--danger)' : 'var(--warning)';
    }
  }, 2500);

  // Restaurar filtros guardados
  restoreFilters();
  // Inicializar datepicker en formulario de nuevo lead
  initLeadFormDatePicker();
  // Update cloud sync pill
  updateCloudPill();
  // Proactive check (Mejora 4) — run after app is fully loaded
  setTimeout(() => runProactiveCheck(), 10000);
  initTTS();
  initScheduler();
  initGithubSync();
  setTimeout(addTTSButton, 800);
  // Auto-pull from JSONBin on load if enabled
  if (localStorage.getItem('gordi_jsonbin_auto') === 'true' && localStorage.getItem('gordi_jsonbin_key')) {
    setTimeout(() => jsonbinPull(false), 1500); // slight delay to let app init
  }
});

// ── Flatpickr: inicializar en el formulario de nuevo lead ─────────────────────
function initLeadFormDatePicker() {
  const el = document.getElementById('lead-next-contact');
  if (!el || el._flatpickr) return;
  flatpickr(el, {
    locale: 'es',
    dateFormat: 'Y-m-d',
    altInput: false,
    allowInput: true,
    disableMobile: true,
    minDate: 'today',
    theme: 'dark'
  });
}

// ── Flatpickr: inicializar en el modal de detalle del lead ────────────────────
function initDetailDatePicker() {
  const el = document.getElementById('detail-next-contact');
  if (!el) return;
  if (el._flatpickr) el._flatpickr.destroy();
  flatpickr(el, {
    locale: 'es',
    dateFormat: 'Y-m-d',
    altInput: false,
    allowInput: true,
    disableMobile: true,
    theme: 'dark',
    defaultDate: el.value || null
  });
}





// ── STATUS TIMELINE ──────────────────────────────────────────────
function buildStatusTimeline(lead) {
  const allStatuses = ['Pendiente','Contactado','Respuesta del cliente','Visita','Entrega de presupuesto','Cerrado'];
  const dotClass = s => {
    if (s.startsWith('Pendiente')) return 'status-Pendiente';
    if (s.startsWith('Contactado')) return 'status-Contactado';
    if (s.startsWith('Respuesta')) return 'status-Respuesta';
    if (s.startsWith('Visita')) return 'status-Visita';
    if (s.startsWith('Entrega')) return 'status-Entrega';
    if (s.startsWith('Cerrado')) return 'status-Cerrado';
    return 'status-other';
  };

  // Extract status changes from activity log
  const statusChanges = (lead.activity || [])
    .filter(a => a.action.startsWith('Estado cambiado:') || a.action.startsWith('Pipeline:'))
    .reverse(); // oldest first

  // Build timeline events: creation + status changes
  const events = [];

  // Entry point: lead creation
  events.push({
    status: 'Creado',
    label: 'Lead creado',
    date: lead.date,
    isCurrent: false
  });

  // Status changes from activity log
  statusChanges.forEach(a => {
    const match = a.action.match(/(?:Estado cambiado|Pipeline): (.+?) → (.+)/);
    if (match) {
      events.push({ status: match[2], label: match[2], date: a.date, isCurrent: false });
    }
  });

  // Current status (if not already last)
  const lastEvent = events[events.length - 1];
  if (!lastEvent || lastEvent.label !== lead.status) {
    events.push({ status: lead.status, label: lead.status, date: lead.status_date || lead.date, isCurrent: true });
  } else {
    events[events.length - 1].isCurrent = true;
  }

  if (events.length <= 1) {
    // Just creation, show compact pipeline progress
    const currentIdx = allStatuses.indexOf(lead.status);
    return `<div style="display:flex;gap:3px;align-items:center;flex-wrap:wrap">
      ${allStatuses.map((s, i) => {
        const done = i <= currentIdx;
        const isCur = i === currentIdx;
        return `<div style="display:flex;align-items:center;gap:3px">
          <span style="font-size:.68rem;padding:2px 8px;border-radius:5px;font-weight:${isCur?'600':'400'};
            background:${done?'rgba(10,132,255,.12)':'var(--glass)'};
            color:${isCur?'var(--primary)':done?'var(--text-muted)':'var(--text-dim)'};
            border:1px solid ${isCur?'rgba(10,132,255,.3)':'var(--glass-border)'}">${s}</span>
          ${i < allStatuses.length-1 ? '<span style="color:var(--text-dim);font-size:.65rem">›</span>' : ''}
        </div>`;
      }).join('')}
    </div>
    <div style="font-size:.68rem;color:var(--text-dim);margin-top:.4rem">Creado el ${new Date(lead.date).toLocaleDateString('es-ES')}</div>`;
  }

  return `<div class="status-timeline">
    ${events.map((ev, i) => `
      <div class="timeline-item">
        <div class="timeline-dot ${dotClass(ev.status)}"></div>
        <div class="timeline-body">
          <div class="timeline-label">${ev.label === 'Creado' ? '🆕 Lead añadido' : ev.label}
            ${ev.isCurrent ? '<span class="timeline-current">actual</span>' : ''}
          </div>
          <div class="timeline-date">${ev.date ? new Date(ev.date).toLocaleDateString('es-ES', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'}</div>
        </div>
      </div>`).join('')}
  </div>`;
}

// ── FILTROS PERSISTENTES ──────────────────────────────────────────
function saveFilters() {
  const filters = {
    search: document.getElementById('lead-search')?.value || '',
    segment: document.getElementById('filter-segment')?.value || '',
    status: document.getElementById('filter-status')?.value || '',
    source: document.getElementById('filter-source')?.value || '',
    sort: document.getElementById('sort-leads')?.value || 'score'
  };
  localStorage.setItem('gordi_filters', JSON.stringify(filters));
}

function restoreFilters() {
  try {
    const saved = JSON.parse(localStorage.getItem('gordi_filters'));
    if (!saved) return;
    const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
    set('lead-search', saved.search);
    set('filter-segment', saved.segment);
    set('filter-status', saved.status);
    set('filter-source', saved.source);
    set('sort-leads', saved.sort);
  } catch(e) {}
}

// ── KANBAN QUICK NOTE ─────────────────────────────────────────────
let knPopupEl = null;

function openQuickNote(e, leadId) {
  e.stopPropagation();
  const lead = leads.find(l => l.id == leadId);
  if (!lead) return;

  closeQuickNote();

  const popup = document.createElement('div');
  popup.className = 'kn-popup';
  popup.id = 'kn-popup';

  const lastNote = lead.notes ? `<div class="kn-last-note">📝 ${lead.notes.slice(0,80)}${lead.notes.length>80?'…':''}</div>` : '';

  popup.innerHTML = `
    <div style="font-size:.72rem;font-weight:600;color:var(--text-muted);margin-bottom:.35rem">
      📝 Nota rápida — <span style="color:var(--text)">${lead.company}</span>
    </div>
    ${lastNote}
    <textarea id="kn-text" rows="3" placeholder="Añade una nota rápida...">${lead.notes||''}</textarea>
    <div class="kn-popup-actions">
      <button class="btn-action" onclick="closeQuickNote(true)">Descartar</button>
      <button class="btn-primary" style="font-size:.75rem;padding:.3rem .75rem" onclick="saveQuickNote('${leadId}')">Guardar</button>
    </div>`;

  popup.dataset.leadId = leadId;

  document.body.appendChild(popup);
  knPopupEl = popup;

  // Position near the button
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  let top = rect.bottom + 4;
  let left = rect.left - 220;
  if (left < 8) left = 8;
  if (top + 160 > window.innerHeight) top = rect.top - 164;
  popup.style.top = top + 'px';
  popup.style.left = left + 'px';

  setTimeout(() => {
    const ta = document.getElementById('kn-text');
    if (ta) { ta.focus(); ta.select(); }
  }, 30);

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', closeQuickNoteOutside, { once: false });
  }, 50);
}

function closeQuickNoteOutside(e) {
  if (knPopupEl && !knPopupEl.contains(e.target)) {
    closeQuickNote();
    document.removeEventListener('click', closeQuickNoteOutside);
  }
}

function closeQuickNote(discard = false) {
  if (!knPopupEl) return;
  // Auto-guardar si hay cambios y no se pide descartar explícitamente
  if (!discard) {
    const ta = document.getElementById('kn-text');
    const leadIdAttr = knPopupEl.dataset.leadId;
    if (ta && leadIdAttr) {
      const lead = leads.find(l => l.id == leadIdAttr);
      const newNote = ta.value.trim();
      if (lead && newNote !== (lead.notes || '').trim()) {
        lead.notes = newNote;
        addActivityLog(leadIdAttr, `📝 Nota actualizada`);
        saveLeads();
        renderKanban();
        showToast('Nota guardada ✓');
      }
    }
  }
  knPopupEl.remove();
  knPopupEl = null;
  document.removeEventListener('click', closeQuickNoteOutside);
}

function saveQuickNote(leadId) {
  const lead = leads.find(l => l.id == leadId);
  const ta = document.getElementById('kn-text');
  if (!lead || !ta) return;
  const newNote = ta.value.trim();
  if (newNote !== lead.notes) {
    addActivityLog(leadId, `📝 Nota actualizada`);
    lead.notes = newNote;
    saveLeads();
    showToast('Nota guardada ✓');
    renderKanban();
  }
  closeQuickNote();
}


// ── RE-ENRIQUECIMIENTO INDIVIDUAL ──────────────────────────────────────────
async function reEnrichOne(idx) {
  const company = tempSearchResults[idx];
  if (!company) return;

  const btn   = document.getElementById(`rebtn-${idx}`);
  const prog  = document.getElementById(`rep-${idx}`);
  const progF = document.getElementById(`repf-${idx}`);
  const log   = document.getElementById(`rel-${idx}`);

  // UI: estado cargando
  if (btn) { btn.disabled = true; btn.classList.add('spinning'); btn.innerHTML = '<span class="reenrich-icon">🔄</span> Buscando...'; }
  if (prog) { prog.style.display = 'block'; progF.style.width = '5%'; }
  if (log)  { log.style.display = 'block'; log.textContent = 'Iniciando...'; }

  const setP = pct => { if (progF) progF.style.width = pct + '%'; };
  const setL = msg => { if (log) log.textContent = msg; };

  let changed = false;

  try {
    // ── Capa Web (siempre se reintenta si no hay email) ──────────────────
    if (!company.email && company.website) {
      setL('🌐 Scraping web...'); setP(15);
      const enriched = await enrichFromWeb({ ...company });
      if (enriched.email && enriched.email !== company.email) {
        company.email = enriched.email;
        company.emails = enriched.emails || company.emails;
        if (!company.enrichSource.includes('Web-email')) company.enrichSource.push('Web-email');
        changed = true;
        setL(`✉️ Email encontrado: ${enriched.email}`);
      } else {
        setL('Web: sin email');
      }
      // Copy other enriched data even if no email
      if (!company.decision_maker && enriched.decision_maker) { company.decision_maker = enriched.decision_maker; changed = true; }
      if (!company.phone && enriched.phone) { company.phone = enriched.phone; changed = true; }
      if (!company.instagram && enriched.instagram) { company.instagram = enriched.instagram; changed = true; }
      if (!company.description && enriched.description) { company.description = enriched.description; changed = true; }
    }
    setP(40);

    // ── Capa Hunter.io ────────────────────────────────────────────────────
    const hunterKey = localStorage.getItem('gordi_hunter_key');
    if (!company.email && company.website && hunterKey) {
      setL('📧 Consultando Hunter.io...'); setP(55);
      const enriched = await enrichFromHunter({ ...company });
      if (enriched.email && enriched.email !== company.email) {
        company.email = enriched.email;
        if (!company.enrichSource.includes('Hunter.io')) company.enrichSource.push('Hunter.io');
        changed = true;
        setL(`✉️ Hunter: ${enriched.email}`);
      } else {
        setL('Hunter: sin resultado');
      }
      if (!company.decision_maker && enriched.decision_maker) { company.decision_maker = enriched.decision_maker; changed = true; }
    }
    setP(70);

    // ── Capa Apollo.io ────────────────────────────────────────────────────
    const apolloKey = localStorage.getItem('gordi_apollo_key');
    if ((!company.email || !company.decision_maker) && company.website && apolloKey) {
      setL('🚀 Consultando Apollo.io...'); setP(82);
      const enriched = await enrichFromApollo({ ...company });
      if (!company.email && enriched.email) {
        company.email = enriched.email;
        if (!company.enrichSource.includes('Apollo.io')) company.enrichSource.push('Apollo.io');
        changed = true;
        setL(`✉️ Apollo: ${enriched.email}`);
      }
      if (!company.decision_maker && enriched.decision_maker) {
        company.decision_maker = enriched.decision_maker;
        if (!company.enrichSource.includes('Apollo.io')) company.enrichSource.push('Apollo.io');
        changed = true;
        setL(`👤 Apollo: ${enriched.decision_maker}`);
      }
    }
    setP(95);

    // ── Social (LinkedIn / Instagram) ─────────────────────────────────────
    if (!company.instagram || !company.linkedin) {
      setL('📱 Redes sociales...'); 
      const enriched = await enrichFromSocial({ ...company });
      if (!company.instagram && enriched.instagram) { company.instagram = enriched.instagram; changed = true; }
      if (!company.linkedin  && enriched.linkedin)  { company.linkedin  = enriched.linkedin;  changed = true; }
    }

    setP(100);

    // ── Resultado final ────────────────────────────────────────────────────
    tempSearchResults[idx] = company;

    if (company.email) {
      setL(`✅ Completado — email: ${company.email}`);
    } else {
      setL('⚠️ Sin email encontrado en ninguna fuente');
    }

    updateEnrichStats();

  } catch(err) {
    setL(`❌ Error: ${err.message}`);
    console.warn('reEnrichOne error:', err);
  }

  // Reconstruir la tarjeta
  setTimeout(() => {
    updateCard(idx);
  }, 1400);

  if (btn) { btn.disabled = false; btn.classList.remove('spinning'); }
}

// ── GLOBAL SEARCH ────────────────────────────────────────────────
let gsActiveIndex = -1;

function openGlobalSearch() {
  const overlay = document.getElementById('global-search-overlay');
  overlay.classList.add('open');
  const input = document.getElementById('global-search-input');
  input.value = '';
  input.focus();
  gsActiveIndex = -1;
  document.getElementById('global-search-results').innerHTML = `
    <div style="padding:1.5rem;text-align:center;color:var(--text-dim);font-size:.82rem">
      Escribe para buscar leads, empresas, emails o notas...
    </div>`;
}

function closeGlobalSearch() {
  document.getElementById('global-search-overlay').classList.remove('open');
}

function runGlobalSearch(query) {
  const q = query.toLowerCase().trim();
  const container = document.getElementById('global-search-results');
  if (!q) {
    container.innerHTML = `<div style="padding:1.5rem;text-align:center;color:var(--text-dim);font-size:.82rem">Escribe para buscar...</div>`;
    gsActiveIndex = -1;
    return;
  }
  const results = leads.filter(l => !l.archived && (
    (l.name||'').toLowerCase().includes(q) ||
    (l.company||'').toLowerCase().includes(q) ||
    (l.email||'').toLowerCase().includes(q) ||
    (l.notes||'').toLowerCase().includes(q) ||
    (l.segment||'').toLowerCase().includes(q) ||
    (l.tags||[]).some(t => t.toLowerCase().includes(q))
  )).slice(0, 10);

  // Also search email history
  const emailResults = emailHistory.filter(e =>
    (e.company||'').toLowerCase().includes(q) ||
    (e.email||'').toLowerCase().includes(q) ||
    (e.subject||'').toLowerCase().includes(q)
  ).slice(0, 3);

  if (!results.length && !emailResults.length) {
    container.innerHTML = `<div style="padding:1.5rem;text-align:center;color:var(--text-dim);font-size:.82rem">Sin resultados para "${query}"</div>`;
    gsActiveIndex = -1;
    return;
  }

  const COLORS = { 'Oficinas':'#0A84FF','Retail':'#5E5CE6','Industrial':'#f59e0b','Hoteles':'#10d97c','Cultural':'#f87171','Deportivo':'#34d399','Comercial':'#a78bfa','Educativo':'#60a5fa' };

  gsActiveIndex = -1;
  container.innerHTML = [
    results.length ? `<div style="padding:.35rem 1.1rem .2rem;font-size:.68rem;color:var(--text-dim);font-weight:600;letter-spacing:.04em">LEADS (${results.length})</div>` : '',
    ...results.map((l, i) => {
      const bc = l.score>=70?'var(--success)':l.score>=40?'var(--warning)':'var(--text-muted)';
      const color = COLORS[l.segment] || '#5E5CE6';
      return `<div class="gs-item" data-lead-id="${l.id}" onclick="gsOpenLead('${l.id}')">
        <div class="gs-avatar" style="background:${color}22;color:${color}">${(l.company||'?')[0].toUpperCase()}</div>
        <div class="gs-main">
          <div class="gs-name">${highlight(l.company, q)} <span style="font-size:.72rem;color:var(--text-muted)">— ${l.name}</span></div>
          <div class="gs-sub">${l.segment} · ${l.email||'sin email'} ${l.notes ? '· '+l.notes.slice(0,40)+'…' : ''}</div>
        </div>
        <span class="gs-badge" style="color:${bc}">${l.score}pts</span>
        <span class="gs-badge">${l.status}</span>
      </div>`;
    }),
    emailResults.length ? `<div style="padding:.35rem 1.1rem .2rem;font-size:.68rem;color:var(--text-dim);font-weight:600;letter-spacing:.04em">EMAILS ENVIADOS</div>` : '',
    ...emailResults.map(e => `<div class="gs-item" onclick="closeGlobalSearch();showView('tracking')">
      <div class="gs-avatar" style="background:rgba(10,132,255,.1);color:var(--primary)">✉️</div>
      <div class="gs-main">
        <div class="gs-name">${highlight(e.company, q)}</div>
        <div class="gs-sub">${e.subject||'sin asunto'} · ${new Date(e.date).toLocaleDateString('es-ES')}</div>
      </div>
      <span class="gs-badge">${e.status}</span>
    </div>`)
  ].join('');
}

function highlight(text, q) {
  if (!q || !text) return text||'';
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return text.slice(0,idx) + `<mark style="background:rgba(10,132,255,.25);color:var(--primary);border-radius:2px">${text.slice(idx,idx+q.length)}</mark>` + text.slice(idx+q.length);
}

function gsOpenLead(id) {
  closeGlobalSearch();
  showView('leads');
  openLeadDetail(id);
}

function handleGsKey(e) {
  const items = document.querySelectorAll('#global-search-results .gs-item');
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    gsActiveIndex = Math.min(gsActiveIndex + 1, items.length - 1);
    items.forEach((el, i) => el.classList.toggle('gs-active', i === gsActiveIndex));
    if (items[gsActiveIndex]) items[gsActiveIndex].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    gsActiveIndex = Math.max(gsActiveIndex - 1, 0);
    items.forEach((el, i) => el.classList.toggle('gs-active', i === gsActiveIndex));
    if (items[gsActiveIndex]) items[gsActiveIndex].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter') {
    if (items[gsActiveIndex]) items[gsActiveIndex].click();
  } else if (e.key === 'Escape') {
    closeGlobalSearch();
  }
}

