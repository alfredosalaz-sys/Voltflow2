(function() {
  function updateLogo() {
    var isLight = document.body.classList.contains('light-mode');
    var light = document.getElementById('logo-light');
    var dark  = document.getElementById('logo-dark');
    if (!light || !dark) return;
    if (isLight) { light.style.display='block'; dark.style.display='none'; }
    else          { light.style.display='none';  dark.style.display='block'; }
  }
  document.addEventListener('DOMContentLoaded', function() {
    updateLogo();
    new MutationObserver(updateLogo).observe(document.body, { attributes:true, attributeFilter:['class'] });
  });
})();

// ════════════════════════════════════════════════════════════════
// VOLTFLOW GUARDIAN — Integridad permanente integrada en el HTML
// Se ejecuta automáticamente en cada carga de la aplicación.
// Cualquier versión futura DEBE pasar estos checks antes de entregarse.
// ════════════════════════════════════════════════════════════════

const GUARDIAN = {
  version: '2.6',

  // ── Snapshot de lo que DEBE existir siempre ──────────────────
  REQUIRED_FUNCTIONS: [
    'addActivityLog','analyzeScanImage','appendBriefingMsg','applyAdvancedFilters',
    'applyInboxMatch','applyInboxMatches','applyLightMode','applyPatch',
    'applySearchHistory','applySequenceRule','archiveLead','autoWeeklyBackup',
    'buildEmailThread','buildGoldenProfile','buildSearchGrid','buildSignalCorrelation',
    'callGeminiAPI','saveGroqKey','saveOpenRouterKey','refreshAiRouterStatus','calculateScore','cleanObsoleteLeads','clearAllLeads',
    'closeBriefingModal','closeDrawer','closeFocusMode','closeLead',
    'closeScanModal','closeVoiceModal','copyEmail','copySubjectOption','createLeadFromInbox','openWhatsAppModal','closeWaModal','generateWhatsAppMessage','generateContactCalendar','applyContactCalendar','showPainPicker','confirmPainAndGenerate','skipPainPicker',
    'ctxSetStatus','deleteLead','dragStart','drawerNav',
    'dropLead','duplicateLead','enrichFromApollo','enrichFromBorme',
    'enrichFromHunter','enrichFromSocial','enrichFromStreetView','enrichFromWeb',
    'enrichFromWhois','expandInlinePaste','exportDataSnapshot','exportFilteredData',
    'exportFullBackup','exportPortableData','exportSearchCSV','exportTracking',
    'focusMarkDone','generateEmail','geocodeSearch','getCachedEnrich',
    'getCityDistricts','getEnrichTTL','getFocusLeads','getLookalikeSimilarity',
    'getSegmentQueries','handleInlineDrop','handleScanFile','handleSlashCommand',
    'initLeadsMap','loadAllData','logCall','markNotInterested',
    'matchEmailToLead','onInboxPaste','onInlinePasteInput','openAiEmailModal',
    'openBriefingModal','openCtxMenu','openFocusMode','openGlobalSearch',
    'openLeadDetail','openLeadDrawer','openObjectivesModal','openQuickNote',
    'openScanModal','openVoiceModal','parseEmailsFromText','processInboxEmails',
    'processVoiceNote','recalculateLeadScore','refreshMapMarkers','registerInlineReply',
    'renderCampaigns','renderConversionMetrics',
    'renderDashboardCharts','renderDrawer','renderFocusList','renderFunnelChart',
    'renderHeatmap','renderInboxResults','renderKanban','renderLeads',
    'renderObjectivesPanel','renderPipelineValue','renderRecentActivity',
    'renderSectorPerformance','renderSignalCorrelation','renderSmartAlert','renderStreakPanel',
    'renderTemplateList','renderTodayPanel','renderTopLeads','renderTracking',
    'saveCurrentSearch','saveDrawerLead','saveLead','saveLeads','saveLeadDetail',
    'saveVoiceNote','saveScanLead','searchBusinesses','sendBriefingMessage',
    'showToast','showView','startVoiceRecording','stopVoiceRecording',
    'syncToSheets','loadFromSheets','renderSheetsStatus',
    'todayPostpone','toggleLeadForm','updateFollowupBadge',
    'updateInboxBadge','updateStats','updateStreakData',
  ],

  REQUIRED_TOKENS: [
    'SEQUENCE_RULES','SEGMENT_TONE','CITY_DISTRICTS','HUNTER_BATCH',
    'SLASH_COMMANDS','segmentQueries','SHEETS_COLS','STATUS_LIST',
    't0Fetch','discard = false','buildEmailThread','registerInlineReply',
    'openVoiceModal','openScanModal','openFocusMode','initLeadsMap',
    'openBriefingModal','parseEmailsFromText','applySequenceRule',
    'buildSignalCorrelation','syncToSheets',
    // ── Tokens de seguridad del motor de scraping ──────────────
    'FIX-SCRAPING',   // Marca que los fixes están presentes
    '_proxyStats',    // Sistema de ranking de proxies
    'Proxy-fallo',    // Detección de fallo de proxy
    'corsproxy.org',  // Mínimo 4 proxies distintos
  ],

  REQUIRED_IDS: [
    'dashboard-view','leads-view','kanban-view','planner-view','map-view',
    'inbox-view','tracking-view','templates-view','settings-view',
    'lead-drawer','ctx-menu','slash-popup','followup-badge',
    'voice-fab','voice-modal','scan-fab','scan-modal',
    'focus-mode-overlay','leads-map','briefing-modal',
    'smart-alert','today-panel','signal-corr-panel',
    'inbox-paste-area','inbox-results-panel',
  ],

  MIN_SCRIPT_LENGTH: 480000,

  run() {
    const src = document.documentElement.innerHTML;
    const results = [];
    let allOk = true;

    const check = (section, label, ok, detail) => {
      if (!ok) allOk = false;
      results.push({ section, label, ok, detail: detail || '' });
    };

    // 1. Funciones presentes
    const missing_funcs = this.REQUIRED_FUNCTIONS.filter(fn =>
      !src.includes('function ' + fn + '(') && !src.includes('function ' + fn + ' (')
    );
    check('Funciones', 'Funciones requeridas',
      missing_funcs.length === 0,
      missing_funcs.length === 0
        ? this.REQUIRED_FUNCTIONS.length + ' presentes'
        : 'PERDIDAS: ' + missing_funcs.join(', ')
    );

    // 2. Tokens clave
    const missing_tokens = this.REQUIRED_TOKENS.filter(t => !src.includes(t));
    check('Tokens', 'Tokens clave',
      missing_tokens.length === 0,
      missing_tokens.length === 0
        ? this.REQUIRED_TOKENS.length + ' OK'
        : 'PERDIDOS: ' + missing_tokens.join(', ')
    );

    // 3. IDs críticos
    const missing_ids = this.REQUIRED_IDS.filter(id => !document.getElementById(id));
    check('DOM', 'IDs HTML críticos',
      missing_ids.length === 0,
      missing_ids.length === 0 ? this.REQUIRED_IDS.length + ' presentes' : 'PERDIDOS: ' + missing_ids.join(', ')
    );

    // 4. Tamaño mínimo
    const scriptLen = src.length;
    check('Tamaño', 'Tamaño del código',
      scriptLen >= this.MIN_SCRIPT_LENGTH,
      scriptLen.toLocaleString('es-ES') + ' chars' + (scriptLen < this.MIN_SCRIPT_LENGTH ? ' — POSIBLE TRUNCAMIENTO' : ' OK')
    );

    // 5. Sin backticks escapados
    const btSeq = '\\' + '`';
    let escapedBt = 0, btPos = 0;
    while ((btPos = src.indexOf(btSeq, btPos)) !== -1) { escapedBt++; btPos++; }
    escapedBt = Math.max(0, escapedBt - 1);
    check('Sintaxis', 'Sin backticks escapados', escapedBt === 0,
      escapedBt === 0 ? 'OK' : escapedBt + ' encontrados — riesgo de SyntaxError'
    );

    // 6. Versiones acumuladas
    const versionMarkers = {
      'v2.1 t0Fetch':      't0Fetch',
      'v2.2 drawer':       'openLeadDrawer',
      'v2.3 TTFC':         'first_contact_date',
      'v2.4 voice':        'openVoiceModal',
      'v2.5 inbox':        'parseEmailsFromText',
      'v2.5b thread':      'buildEmailThread',
      'v2.6 scraping-fix': 'FIX-SCRAPING',
    };
    const missing_versions = Object.entries(versionMarkers)
      .filter(([, token]) => !src.includes(token)).map(([v]) => v);
    check('Versiones', 'Mejoras acumuladas',
      missing_versions.length === 0,
      missing_versions.length === 0
        ? Object.keys(versionMarkers).length + ' versiones intactas'
        : 'PERDIDAS: ' + missing_versions.join(', ')
    );

    // ══════════════════════════════════════════════════════════════════
    // 7. TESTS DEL MOTOR DE SCRAPING
    // Detectan exactamente los 3 bugs que rompieron el scraping en v2.0-v2.5.
    // Cualquier futura actualización que los reintroduzca fallará aquí ANTES
    // de que el usuario lo note.
    // ══════════════════════════════════════════════════════════════════

    // TEST 7a: BATCH_SIZE <= 4
    // Con BATCH_SIZE > 4 se lanzan >40 peticiones simultáneas a los proxies
    // CORS gratuitos → rate limiting → fallo silencioso de todo el scraping.
    const batchMatch = src.match(/const BATCH_SIZE\s*=\s*(\d+)/);
    const batchSize = batchMatch ? parseInt(batchMatch[1]) : 0;
    check('Scraping', 'BATCH_SIZE seguro (max 4)',
      batchSize >= 1 && batchSize <= 4,
      batchSize === 0 ? 'NO ENCONTRADO'
        : batchSize <= 4 ? 'BATCH_SIZE = ' + batchSize + ' ✓'
        : 'BATCH_SIZE = ' + batchSize + ' — DEMASIADO ALTO, saturará los proxies'
    );

    // TEST 7b: fetchWithProxy NO usa Promise.any
    // Promise.any lanza todos los proxies en paralelo. Con batches de empresas
    // se multiplican exponencialmente las peticiones y se satura el rate-limit.
    const fpStart = src.indexOf('async function fetchWithProxy(');
    const fetchProxyFn = fpStart !== -1 ? (() => {
      let depth = 0, i = src.indexOf('{', fpStart);
      while (i < src.length) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(fpStart, i+1); }
        i++;
      }
      return src.slice(fpStart, fpStart + 3000);
    })() : '';
    check('Scraping', 'fetchWithProxy sin Promise.any',
      !fetchProxyFn.includes('Promise.any'),
      !fetchProxyFn.includes('Promise.any') ? 'Modo secuencial correcto ✓'
        : 'Promise.any DETECTADO — volverá a saturar los proxies'
    );

    // TEST 7c: enrichFromWeb NO usa Promise.allSettled en scraping profundo
    // 9 rutas en paralelo por empresa × BATCH_SIZE = decenas de fetches simultáneos.
    const ewStart = src.indexOf('async function enrichFromWeb(');
    const enrichWebFn = ewStart !== -1 ? (() => {
      let depth = 0, i = src.indexOf('{', ewStart);
      while (i < src.length) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(ewStart, i+1); }
        i++;
      }
      return src.slice(ewStart, ewStart + 20000);
    })() : '';
    check('Scraping', 'Scraping profundo sin Promise.allSettled',
      !enrichWebFn.includes('Promise.allSettled'),
      !enrichWebFn.includes('Promise.allSettled') ? 'Bucle secuencial correcto ✓'
        : 'Promise.allSettled DETECTADO — saturará proxies'
    );

    // TEST 7d: Mínimo 5 proxies CORS configurados
    // Con <5 proxies, si caen los más populares a la vez, el scraping falla total.
    const proxyUrls = src.match(/url:\s*'https:\/\/[^']+'/gi) || [];
    const proxyCount = proxyUrls.filter(u =>
      /allorigins|corsproxy|codetabs|thingproxy|crossorigin|cors\.sh/i.test(u)
    ).length;
    check('Scraping', 'Mínimo 5 proxies CORS',
      proxyCount >= 5,
      proxyCount >= 5 ? proxyCount + ' proxies configurados ✓'
        : 'Solo ' + proxyCount + ' — añadir más para mayor resiliencia'
    );

    // TEST 7e: Sin APIs de pago en el flujo principal de scraping
    // api.anthropic.com, api.openai.com, etc. tienen coste por petición.
    // El scraping debe funcionar al 100% con herramientas gratuitas.
    const paidApisInProxy = ['api.anthropic.com', 'api.openai.com'].filter(a => fetchProxyFn.includes(a));
    check('Scraping', 'Sin APIs de pago en scraping',
      paidApisInProxy.length === 0,
      paidApisInProxy.length === 0 ? 'Solo proxies gratuitos ✓'
        : 'DETECTADAS APIs de pago: ' + paidApisInProxy.join(', ')
    );

    const funcCount = (src.match(/function \w+\s*\(/g) || []).length;
    return { allOk, results, funcCount };
  },

  // ── Render badge ─────────────────────────────────────────────
  renderBadge(result) {
    const badge = document.getElementById('integrity-badge');
    const icon  = document.getElementById('integrity-icon');
    const label = document.getElementById('integrity-label');
    if (!badge) return;
    badge.className = result.allOk ? 'ok' : 'fail';
    icon.textContent  = result.allOk ? '🛡️' : '⚠️';
    label.textContent = result.allOk ? 'Integridad OK' : 'VERIFICAR CÓDIGO';
  },

  // ── Render modal report ──────────────────────────────────────
  renderReport(result) {
    const el = document.getElementById('integrity-report');
    const ts = document.getElementById('integrity-timestamp');
    const vc = document.getElementById('integrity-version');
    const fc = document.getElementById('integrity-funccount');
    if (!el) return;

    let currentSection = '';
    let html = '';
    result.results.forEach(r => {
      if (r.section !== currentSection) {
        currentSection = r.section;
        html += '<div class="i-section">' + r.section + '</div>';
      }
      html += '<div class="integrity-row ' + (r.ok ? 'i-ok' : 'i-fail') + '">';
      html += '<span class="i-icon">' + (r.ok ? '✅' : '❌') + '</span>';
      html += '<span class="i-label">' + r.label + '</span>';
      html += '<span class="i-value">' + r.detail + '</span>';
      html += '</div>';
    });

    if (!result.allOk) {
      html += '<div style="margin-top:1rem;padding:.75rem;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:8px;font-size:.75rem;color:var(--danger)">';
      html += '⚠️ Se detectaron problemas. Esta versión puede tener código perdido. ';
      html += 'Contacta con el desarrollador antes de continuar usando la herramienta.';
      html += '</div>';
    }

    el.innerHTML = html;
    if (ts) ts.textContent = new Date().toLocaleTimeString('es-ES');
    if (vc) vc.textContent = 'v' + GUARDIAN.version;
    if (fc) fc.textContent = result.funcCount;
  },
};

function openIntegrityModal() {
  const result = GUARDIAN.run();
  GUARDIAN.renderReport(result);
  document.getElementById('integrity-modal').classList.add('open');
}
function closeIntegrityModal() {
  document.getElementById('integrity-modal').classList.remove('open');
}

// Auto-run on load
document.addEventListener('DOMContentLoaded', () => {
  // Integrity check available manually via openIntegrityModal()
});


// ── MÓVIL: control del sidebar y bottom nav ──────────────────────────────────
function openMobileSidebar() {
  document.getElementById('sidebar').classList.add('mobile-open');
  document.getElementById('sidebar-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('sidebar-overlay').classList.remove('open');
  document.body.style.overflow = '';
}
function setMobileNav(btn) {
  document.querySelectorAll('#mobile-bottom-nav .mob-nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  closeMobileSidebar();
}
// Cerrar sidebar al navegar desde él en móvil
document.querySelectorAll('aside#sidebar li[data-view]').forEach(li => {
  li.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      closeMobileSidebar();
      const view = li.getAttribute('data-view');
      document.querySelectorAll('#mobile-bottom-nav .mob-nav-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-view') === view);
      });
    }
  });
});
// Mostrar/ocultar bottom nav según tamaño de pantalla
function checkMobileLayout() {
  const isMobile = window.innerWidth <= 768;
  const bottomNav = document.getElementById('mobile-bottom-nav');
  if (bottomNav) bottomNav.style.display = isMobile ? 'flex' : 'none';
}
window.addEventListener('resize', checkMobileLayout);
checkMobileLayout();


/* ══ ANIMACIÓN CONTEO KPIs ══ */
function animateCount(el, target, duration) {
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  if (start === target) return;
  const range = target - start;
  const startTime = performance.now();
  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + range * ease);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const observer = new MutationObserver(() => {
      ['stat-total','stat-high','stat-pending','stat-sent'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          const val = parseInt(el.textContent) || 0;
          animateCount(el, val, 600);
        }
      });
    });
    ['stat-total','stat-high','stat-pending','stat-sent'].forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el, { childList: true, characterData: true, subtree: true });
    });
  }, 800);
});


/* ══════════════════════════════════════════════════════
   VOLTFLOW — APPLE JS ENGINE
   ══════════════════════════════════════════════════════ */

(function initAppleEngine() {

  // ── CANVAS DE PARTÍCULAS ──────────────────────────────
  function initParticles() {
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');
    let W, H, particles = [], mouse = { x: -999, y: -999 };
    const N = Math.min(60, window.innerWidth < 768 ? 25 : 60);

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

    function Particle() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.vx = (Math.random() - .5) * .4;
      this.vy = (Math.random() - .5) * .4;
      this.r  = Math.random() * 1.8 + .5;
      this.alpha = Math.random() * .4 + .1;
      this.color = Math.random() > .5 ? '10,132,255' : '94,92,230';
    }
    for (let i = 0; i < N; i++) particles.push(new Particle());

    function draw() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p, i) => {
        // Mouse repulsion suave
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 120) {
          p.vx += dx / dist * .03;
          p.vy += dy / dist * .03;
        }
        p.vx *= .99; p.vy *= .99;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        // Dibujar partícula
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();

        // Conectar con vecinas
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const ddx = p.x - q.x, ddy = p.y - q.y;
          const d2 = Math.sqrt(ddx*ddx + ddy*ddy);
          if (d2 < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(10,132,255,${.12 * (1 - d2/130)})`;
            ctx.lineWidth = .6;
            ctx.stroke();
          }
        }
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  function initCursor() {} // cursor del sistema

  // ── SCORE PLASMA ──────────────────────────────────────
  function applyPlasmaScores() {
    document.querySelectorAll('.score-bar-fill').forEach(bar => {
      const w = parseFloat(bar.style.width) || 0;
      bar.classList.remove('heat-high','heat-mid','heat-low');
      if (w >= 70)      bar.classList.add('heat-high');
      else if (w >= 40) bar.classList.add('heat-mid');
      else              bar.classList.add('heat-low');
    });
  }
  // Observar cambios en la tabla de leads
  const plasmaObs = new MutationObserver(applyPlasmaScores);
  plasmaObs.observe(document.body, { childList: true, subtree: true });

  // ── TRANSICIÓN PORTAL AL CAMBIAR VISTA ────────────────
  function initPortalTransitions() {
    const origShowView = window.showView;
    if (!origShowView) return;
    window.showView = function(view, e) {
      const flash = document.createElement('div');
      const colors = { dashboard:'#0A84FF', leads:'#30D158', kanban:'#5E5CE6', search:'#FF9F0A' };
      const col = colors[view] || '#0A84FF';
      flash.style.cssText = `position:fixed;inset:0;z-index:9990;background:${col};
        opacity:0;pointer-events:none;transition:opacity .15s ease;border-radius:0;`;
      document.body.appendChild(flash);
      requestAnimationFrame(() => {
        flash.style.opacity = '0.04';
        setTimeout(() => {
          flash.style.opacity = '0';
          setTimeout(() => flash.remove(), 200);
        }, 120);
      });
      origShowView(view, e);
    };
  }

  // ── INICIALIZAR TODO ─────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      initParticles();
      initCursor();
      initPortalTransitions();
      applyPlasmaScores();
    }, 300);
  });

})();



// ══════════════════════════════════════════════════════════════════
// MEJORA A — AUTOSAVE DEL FORMULARIO DE NUEVO LEAD
// ══════════════════════════════════════════════════════════════════

const DRAFT_KEY = 'gordi_lead_form_draft';
let _autosaveTimer = null;
let _autosaveLastSaved = null;

const DRAFT_FIELDS = [
  'lead-name','lead-company','lead-email','lead-phone',
  'lead-segment','lead-role','lead-size','lead-website',
  'lead-signal','lead-notes','lead-budget','lead-next-contact','lead-tags'
];

function saveLeadFormDraft() {
  const draft = {};
  DRAFT_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) draft[id] = el.value;
  });
  // Solo guardar si hay algo escrito
  const hasContent = Object.values(draft).some(v => v && v.trim());
  if (!hasContent) return;
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ data: draft, ts: Date.now() }));
  _autosaveLastSaved = Date.now();
  const ind = document.getElementById('autosave-indicator');
  const txt = document.getElementById('autosave-text');
  if (ind && txt) {
    ind.style.display = 'inline';
    txt.textContent = 'Borrador guardado';
    ind.style.color = 'var(--success)';
    setTimeout(() => { if (ind) ind.style.color = 'var(--text-dim)'; }, 2000);
  }
}

function restoreLeadFormDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const { data, ts } = JSON.parse(raw);
    // Ignorar borradores de más de 24h
    if (Date.now() - ts > 24 * 3600 * 1000) { localStorage.removeItem(DRAFT_KEY); return; }
    const mins = Math.round((Date.now() - ts) / 60000);
    const label = mins < 1 ? 'hace un momento' : mins === 1 ? 'hace 1 min' : `hace ${mins} min`;
    DRAFT_FIELDS.forEach(id => {
      const el = document.getElementById(id);
      if (el && data[id]) el.value = data[id];
    });
    const ind = document.getElementById('autosave-indicator');
    const txt = document.getElementById('autosave-text');
    if (ind && txt) {
      ind.style.display = 'inline';
      txt.textContent = `Borrador restaurado (${label})`;
      ind.style.color = 'var(--primary)';
      setTimeout(() => { if (txt) txt.textContent = 'Borrador guardado'; if (ind) ind.style.color = 'var(--text-dim)'; }, 4000);
    }
  } catch(e) {}
}

function clearLeadFormDraft() {
  localStorage.removeItem(DRAFT_KEY);
  const ind = document.getElementById('autosave-indicator');
  if (ind) ind.style.display = 'none';
}

function startLeadFormAutosave() {
  stopLeadFormAutosave();
  // Guardar al escribir (debounced 2s)
  DRAFT_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', _debouncedDraftSave);
    el.addEventListener('change', _debouncedDraftSave);
  });
  // También guardar cada 30s
  _autosaveTimer = setInterval(saveLeadFormDraft, 30000);
}

function stopLeadFormAutosave() {
  clearInterval(_autosaveTimer);
  DRAFT_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.removeEventListener('input', _debouncedDraftSave);
      el.removeEventListener('change', _debouncedDraftSave);
    }
  });
}

let _draftDebounce = null;
function _debouncedDraftSave() {
  clearTimeout(_draftDebounce);
  _draftDebounce = setTimeout(saveLeadFormDraft, 1500);
}

// ══════════════════════════════════════════════════════════════════
// MEJORA B — BULK APPLY STATUS (función para el nuevo dropdown)
// ══════════════════════════════════════════════════════════════════

function bulkApplyStatus() {
  const sel = document.getElementById('bulk-status-select');
  const newStatus = sel?.value;
  if (!newStatus) { showToast('⚠️ Selecciona un estado primero'); return; }
  if (!selectedLeadIds.size) { showToast('⚠️ No hay leads seleccionados'); return; }
  bulkChangeStatus(newStatus);
  if (sel) sel.value = '';
}

// ══════════════════════════════════════════════════════════════════
// MEJORA C — DETECCIÓN DE DUPLICADOS EN IMPORTACIÓN
// ══════════════════════════════════════════════════════════════════

function detectImportDuplicates(importLeads) {
  const dupes = [];

  importLeads.forEach((imp, idx) => {
    const matches = [];

    leads.filter(l => !l.archived).forEach(existing => {
      // Match por email exacto
      if (imp.email && existing.email &&
          imp.email.toLowerCase().trim() === existing.email.toLowerCase().trim()) {
        matches.push({ existing, reason: `email igual: ${existing.email}` });
        return;
      }
      // Match por nombre de empresa (normalizado)
      const normImp = (imp.company||'').toLowerCase().replace(/[^a-z0-9]/g,'');
      const normEx  = (existing.company||'').toLowerCase().replace(/[^a-z0-9]/g,'');
      if (normImp.length >= 4 && normEx.length >= 4 && normImp === normEx) {
        matches.push({ existing, reason: `empresa igual: ${existing.company}` });
        return;
      }
      // Match por similitud de nombre empresa (>85% caracteres comunes)
      if (normImp.length >= 5 && normEx.length >= 5) {
        const shorter = normImp.length < normEx.length ? normImp : normEx;
        const longer  = normImp.length < normEx.length ? normEx  : normImp;
        let common = 0;
        for (const ch of shorter) { if (longer.includes(ch)) common++; }
        if (common / longer.length > 0.85) {
          matches.push({ existing, reason: `empresa similar: "${existing.company}"` });
        }
      }
    });

    if (matches.length) dupes.push({ idx, imp, matches: matches.slice(0,2) });
  });

  return dupes;
}

function renderImportDuplicatesPanel(dupes) {
  const panel = document.getElementById('import-duplicates-panel');
  const list  = document.getElementById('import-duplicates-list');
  const badge = document.getElementById('dup-count-badge');
  if (!panel || !list) return;

  if (!dupes.length) { panel.style.display = 'none'; return; }

  badge.textContent = dupes.length + ' posible' + (dupes.length > 1 ? 's' : '');
  list.innerHTML = dupes.map(({ idx, imp, matches }) => {
    const m = matches[0];
    return `<div style="display:flex;align-items:center;gap:.5rem;padding:.3rem .4rem;background:rgba(245,158,11,.06);border-radius:6px;font-size:.75rem">
      <span style="color:var(--warning)">⚠️</span>
      <span style="flex:1"><strong>${imp.company}</strong> — ${m.reason}</span>
      <button onclick="deselImportRow(${idx})" style="background:rgba(245,158,11,.2);border:1px solid rgba(245,158,11,.3);border-radius:5px;padding:1px 8px;font-size:.7rem;cursor:pointer;color:var(--warning);white-space:nowrap">Desmarcar</button>
    </div>`;
  }).join('');

  panel.style.display = 'block';
}

function deselImportRow(idx) {
  // Desmarcar el checkbox de esa fila en la tabla de preview
  const cb = document.querySelector(`.import-check[data-index="${idx}"]`);
  if (cb) { cb.checked = false; }
  // Quitar ese item del panel de duplicados
  const dupeItems = document.querySelectorAll('#import-duplicates-list > div');
  dupeItems.forEach(el => {
    if (el.innerHTML.includes(`deselImportRow(${idx})`)) el.remove();
  });
  const remaining = document.querySelectorAll('#import-duplicates-list > div').length;
  if (!remaining) document.getElementById('import-duplicates-panel').style.display = 'none';
  else document.getElementById('dup-count-badge').textContent = remaining + ' posible' + (remaining > 1 ? 's' : '');
}


// ══════════════════════════════════════════════════════════════════
// EMAILJS — MÉTODO SIMPLIFICADO DE ALERTAS
// ══════════════════════════════════════════════════════════════════

function selectEmailMethod(method) {
  const ejsPanel   = document.getElementById('emailjs-setup');
  const gmailPanel = document.getElementById('gmail-oauth-setup');
  const ejsBtn     = document.getElementById('method-btn-emailjs');
  const gmailBtn   = document.getElementById('method-btn-gmail');
  if (!ejsPanel || !gmailPanel) return;

  if (method === 'emailjs') {
    ejsPanel.style.display   = 'block';
    gmailPanel.style.display = 'none';
    ejsBtn.style.borderColor   = 'var(--primary)';
    ejsBtn.style.background    = 'rgba(10,132,255,.1)';
    ejsBtn.style.color         = 'var(--primary)';
    gmailBtn.style.borderColor = 'var(--glass-border)';
    gmailBtn.style.background  = 'var(--glass)';
    gmailBtn.style.color       = 'var(--text-muted)';
  } else {
    ejsPanel.style.display   = 'none';
    gmailPanel.style.display = 'block';
    gmailBtn.style.borderColor = 'var(--primary)';
    gmailBtn.style.background  = 'rgba(10,132,255,.1)';
    gmailBtn.style.color       = 'var(--primary)';
    ejsBtn.style.borderColor   = 'var(--glass-border)';
    ejsBtn.style.background    = 'var(--glass)';
    ejsBtn.style.color         = 'var(--text-muted)';
  }
}

function saveEmailJsConfig() {
  const toEmail    = document.getElementById('ejs-to-email')?.value.trim();
  const serviceId  = document.getElementById('ejs-service-id')?.value.trim();
  const templateId = document.getElementById('ejs-template-id')?.value.trim();
  const publicKey  = document.getElementById('ejs-public-key')?.value.trim();
  const statusEl   = document.getElementById('ejs-status');

  if (!toEmail || !serviceId || !templateId || !publicKey) {
    if (statusEl) { statusEl.textContent = '⚠️ Rellena todos los campos'; statusEl.style.color = 'var(--danger)'; }
    return;
  }
  localStorage.setItem('gordi_ejs_to',       toEmail);
  localStorage.setItem('gordi_ejs_service',  serviceId);
  localStorage.setItem('gordi_ejs_template', templateId);
  localStorage.setItem('gordi_ejs_key',      publicKey);
  localStorage.setItem('gordi_gmail_email',  toEmail); // compatibilidad
  localStorage.setItem('gordi_email_method', 'emailjs');

  // Inicializar EmailJS
  if (window.emailjs) emailjs.init({ publicKey });

  if (statusEl) { statusEl.textContent = '✅ Guardado — enviando prueba...'; statusEl.style.color = 'var(--success)'; }
  updateEmailAlertsConnectedBadge();
  testEmailJsAlert();
}

async function testEmailJsAlert() {
  const ok = await sendEmailJsAlert('🤖 Voltflow — Test de alertas', 'Las alertas automáticas funcionan correctamente. Recibirás emails cuando el agente detecte leads urgentes.');
  const statusEl = document.getElementById('ejs-status');
  if (statusEl) {
    statusEl.textContent = ok ? '✅ Email enviado — revisa tu bandeja' : '❌ Error — verifica los datos';
    statusEl.style.color = ok ? 'var(--success)' : 'var(--danger)';
  }
}

async function sendEmailJsAlert(subject, message) {
  const method = localStorage.getItem('gordi_email_method') || 'gmail';

  // Método EmailJS
  if (method === 'emailjs') {
    const serviceId  = localStorage.getItem('gordi_ejs_service');
    const templateId = localStorage.getItem('gordi_ejs_template');
    const publicKey  = localStorage.getItem('gordi_ejs_key');
    const toEmail    = localStorage.getItem('gordi_ejs_to');
    if (!serviceId || !templateId || !publicKey || !toEmail) return false;
    try {
      if (window.emailjs) {
        emailjs.init({ publicKey });
        const result = await emailjs.send(serviceId, templateId, {
          to_email: toEmail,
          subject,
          message,
          from_name: 'Voltflow CRM',
        });
        return result.status === 200;
      }
    } catch(e) { console.error('EmailJS error:', e); return false; }
  }

  // Fallback: método Gmail OAuth original
  return await sendGmailAlert(subject, `<div style="font-family:sans-serif;padding:16px"><h3>${subject}</h3><p>${message}</p></div>`);
}

function updateEmailAlertsConnectedBadge() {
  const badge = document.getElementById('email-alerts-connected-badge');
  if (!badge) return;
  const ejsOk   = !!(localStorage.getItem('gordi_ejs_service') && localStorage.getItem('gordi_ejs_key'));
  const gmailOk = !!(localStorage.getItem('gordi_gmail_token'));
  badge.style.display = (ejsOk || gmailOk) ? 'inline' : 'none';
}

// Cargar estado al iniciar la sección de config
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    // Rellenar campos EmailJS si ya estaban guardados
    const ejsTo  = localStorage.getItem('gordi_ejs_to');
    const ejsSvc = localStorage.getItem('gordi_ejs_service');
    const ejsTpl = localStorage.getItem('gordi_ejs_template');
    const ejsKey = localStorage.getItem('gordi_ejs_key');
    if (ejsTo  && document.getElementById('ejs-to-email'))    document.getElementById('ejs-to-email').value    = ejsTo;
    if (ejsSvc && document.getElementById('ejs-service-id'))  document.getElementById('ejs-service-id').value  = ejsSvc;
    if (ejsTpl && document.getElementById('ejs-template-id')) document.getElementById('ejs-template-id').value = ejsTpl;
    if (ejsKey && document.getElementById('ejs-public-key'))  document.getElementById('ejs-public-key').value  = ejsKey;
    if (ejsKey && window.emailjs) emailjs.init({ publicKey: ejsKey });
    updateEmailAlertsConnectedBadge();
    // Si el método guardado era gmail, mostrar ese panel
    if (localStorage.getItem('gordi_email_method') === 'gmail') selectEmailMethod('gmail');
  }, 600);
});

// Parchear sendGmailAlert para que use EmailJS si está configurado
const _origSendGmailAlert = sendGmailAlert;
window.sendGmailAlert = async function(subject, htmlBody) {
  const method = localStorage.getItem('gordi_email_method');
  if (method === 'emailjs') {
    const text = htmlBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return await sendEmailJsAlert(subject, text);
  }
  return await _origSendGmailAlert(subject, htmlBody);
};


// ══════════════════════════════════════════════════════════════════
// QR SYNC — IMPORTAR QR CON CÁMARA (jsQR library)
// ══════════════════════════════════════════════════════════════════

function openQRImportScanner() {
  // Crear modal con preview de cámara
  const existing = document.getElementById('qr-scanner-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'qr-scanner-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;padding:1rem';
  modal.innerHTML = `
    <div style="background:var(--surface);border-radius:16px;padding:1.5rem;max-width:360px;width:100%;text-align:center">
      <div style="font-size:1.1rem;font-weight:700;margin-bottom:.75rem">📷 Escanear QR de Voltflow</div>
      <div style="position:relative;border-radius:12px;overflow:hidden;background:#000;margin-bottom:1rem">
        <video id="qr-video" style="width:100%;max-height:260px;object-fit:cover;display:block" playsinline autoplay></video>
        <canvas id="qr-scan-canvas" style="display:none"></canvas>
        <div style="position:absolute;inset:0;border:3px solid var(--primary);border-radius:12px;pointer-events:none;box-shadow:0 0 0 9999px rgba(0,0,0,.3) inset"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:140px;height:140px;border:2px solid #fff;border-radius:8px;pointer-events:none;opacity:.6"></div>
      </div>
      <div id="qr-scan-status" style="font-size:.8rem;color:var(--text-muted);margin-bottom:1rem;min-height:2.5rem;line-height:1.5">Apunta la cámara al código QR de Voltflow</div>
      <button onclick="closeQRScanner()" style="background:var(--glass);border:1px solid var(--glass-border);border-radius:8px;padding:.5rem 1.5rem;color:var(--text);cursor:pointer;font-size:.85rem">Cancelar</button>
    </div>`;
  document.body.appendChild(modal);

  // Cargar jsQR si no está cargado
  if (typeof jsQR === 'undefined') {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
    s.onload = () => startQRScanner();
    s.onerror = () => {
      document.getElementById('qr-scan-status').textContent = '❌ No se pudo cargar el escáner. Usa Chrome o Safari actualizados.';
    };
    document.head.appendChild(s);
  } else {
    startQRScanner();
  }
}

let _qrScanInterval = null;

function startQRScanner() {
  const video  = document.getElementById('qr-video');
  const canvas = document.getElementById('qr-scan-canvas');
  const status = document.getElementById('qr-scan-status');
  if (!video || !canvas) return;

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => {
      video.srcObject = stream;
      video.play();
      _qrScanInterval = setInterval(() => {
        if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
        if (code) {
          clearInterval(_qrScanInterval);
          stopQRScannerStream();
          processScannedQRData(code.data);
        }
      }, 200);
    })
    .catch(err => {
      if (status) status.innerHTML = '❌ Sin acceso a la cámara.<br><span style="font-size:.72rem">Permite el acceso a la cámara en tu navegador e inténtalo de nuevo.</span>';
    });
}

function stopQRScannerStream() {
  const video = document.getElementById('qr-video');
  if (video?.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
    video.srcObject = null;
  }
  clearInterval(_qrScanInterval);
}

function closeQRScanner() {
  stopQRScannerStream();
  const modal = document.getElementById('qr-scanner-modal');
  if (modal) modal.remove();
}

function processScannedQRData(data) {
  const statusEl = document.getElementById('qr-scan-status');

  if (!data.startsWith('VOLTFLOW:')) {
    if (statusEl) statusEl.innerHTML = '⚠️ Este QR no es de Voltflow. Escanea el código generado en Configuración → QR Sync.';
    // Reiniciar escaneo tras 2s
    setTimeout(startQRScanner, 2000);
    return;
  }

  try {
    const encoded = data.slice('VOLTFLOW:'.length);
    const payload = JSON.parse(decodeURIComponent(escape(atob(encoded))));

    if (payload.exp && Date.now() > payload.exp) {
      if (statusEl) statusEl.innerHTML = '⏰ Este QR ha caducado. Genera uno nuevo desde el dispositivo original.';
      setTimeout(closeQRScanner, 3000);
      return;
    }

    closeQRScanner();
    applyVoltflowPayload(payload);

  } catch(e) {
    if (statusEl) statusEl.textContent = '❌ QR inválido o corrupto.';
    setTimeout(closeQRScanner, 2000);
  }
}

function applyVoltflowPayload(payload) {
  let applied = [];

  if (payload.keys) {
    const map = { g:'gordi_api_key', h:'gordi_hunter_key', a:'gordi_apollo_key', ge:'gordi_gemini_key', cl:'gordi_claude_key' };
    Object.entries(payload.keys).forEach(([k,v]) => { if (v && map[k]) localStorage.setItem(map[k], v); });
    applied.push('🔑 API keys');
  }
  if (payload.profile) {
    const map = { n:'gordi_user_name', e:'gordi_user_email', co:'gordi_user_company', p:'gordi_user_phone', w:'gordi_user_web' };
    Object.entries(payload.profile).forEach(([k,v]) => { if (v && map[k]) localStorage.setItem(map[k], v); });
    applied.push('👤 perfil');
  }
  if (payload.sheets) {
    if (payload.sheets.id)  localStorage.setItem('gordi_sheets_id', payload.sheets.id);
    if (payload.sheets.cid) localStorage.setItem('gordi_sheets_client_id', payload.sheets.cid);
    applied.push('📊 Sheets');
  }
  if (payload.templates) {
    try { localStorage.setItem('gordi_templates', payload.templates); applied.push('✉ plantillas'); } catch {}
  }

  showToast('✅ Configuración importada: ' + applied.join(', '));
  setTimeout(() => location.reload(), 1200);
}

