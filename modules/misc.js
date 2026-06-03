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
    'closeScanModal','closeVoiceModal','copyToClipboard','copySubjectOption','createLeadFromInbox','openWhatsAppModal','closeWaModal','generateWhatsAppMessage','generateContactCalendar','applyContactCalendar','showPainPicker','confirmPainAndGenerate','skipPainPicker',
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
    'updateInboxBadge','updateStats','updateStreakData','populateSegmentDropdowns',
  ],

  REQUIRED_TOKENS: [
    'SEQUENCE_RULES','SEGMENT_TONE','CITY_DISTRICTS','HUNTER_BATCH',
    'SLASH_COMMANDS','segmentQueries','SHEETS_COLS','STATUS_LIST','SEGMENT_LABELS',
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

  // ── Construye la fuente de búsqueda combinando HTML + funciones globales ──────
  // En la arquitectura modular el JS está en archivos externos, no inline.
  // Usamos dos fuentes complementarias:
  //   • src  = innerHTML del documento (HTML + scripts inline si los hay)
  //   • fnSrc = lista de nombres de funciones globales definidas en window
  // Para los tokens de scraping usamos la representación string de la función global.
  _buildSrc() {
    const htmlSrc = document.documentElement.innerHTML;
    // Recopilar todos los nombres de funciones globales como texto "function X("
    // para que los checks de REQUIRED_FUNCTIONS sigan funcionando igual
    const globalFnNames = Object.keys(window)
      .filter(k => typeof window[k] === 'function')
      .map(k => 'function ' + k + '(')
      .join('\n');
    // Para tokens de contenido (REQUIRED_TOKENS, scraping checks) necesitamos
    // el source real de las funciones clave — obtenemos toString() de las globales
    let fnBodies = '';
    const KEY_FNS = [
      'fetchWithProxy','enrichFromWeb','searchBusinesses','fetchPlaces',
      'purgeStaleCaches','buildSearchGrid','getCityDistricts',
    ];
    KEY_FNS.forEach(name => {
      if (typeof window[name] === 'function') {
        try { fnBodies += window[name].toString() + '\n'; } catch(e) {}
      }
    });
    // Constantes globales relevantes (CORS_PROXIES, BATCH_SIZE, etc.)
    const KEY_CONSTS = ['CORS_PROXIES','BATCH_SIZE','SEQUENCE_RULES','SEGMENT_TONE',
      'CITY_DISTRICTS','HUNTER_BATCH','SLASH_COMMANDS','SHEETS_COLS','STATUS_LIST'];
    let constBodies = '';
    KEY_CONSTS.forEach(name => {
      if (typeof window[name] !== 'undefined') {
        try { constBodies += name + ' = ' + JSON.stringify(window[name]) + '\n'; } catch(e) {}
      }
    });
    return htmlSrc + '\n' + globalFnNames + '\n' + fnBodies + '\n' + constBodies;
  },

  run() {
    // En arquitectura modular el JS está en archivos externos — usar fuente combinada
    const src = this._buildSrc();
    const results = [];
    let allOk = true;

    const check = (section, label, ok, detail) => {
      if (!ok) allOk = false;
      results.push({ section, label, ok, detail: detail || '' });
    };

    // 1. Funciones presentes — chequeo contra window (modular) o innerHTML (monolito)
    const missing_funcs = this.REQUIRED_FUNCTIONS.filter(fn => {
      // Primero comprobar si la función existe en el scope global (módulos cargados)
      if (typeof window[fn] === 'function') return false;
      // Fallback: buscar en el texto combinado (funciones locales, métodos, etc.)
      return !src.includes('function ' + fn + '(') && !src.includes('function ' + fn + ' (');
    });
    check('Funciones', 'Funciones requeridas',
      missing_funcs.length === 0,
      missing_funcs.length === 0
        ? this.REQUIRED_FUNCTIONS.length + ' presentes'
        : 'PERDIDAS: ' + missing_funcs.join(', ')
    );

    // 2. Tokens clave — buscar en fuente combinada (incluye toString de funciones clave)
    const missing_tokens = this.REQUIRED_TOKENS.filter(t => !src.includes(t));
    check('Tokens', 'Tokens clave',
      missing_tokens.length === 0,
      missing_tokens.length === 0
        ? this.REQUIRED_TOKENS.length + ' OK'
        : 'PERDIDOS: ' + missing_tokens.join(', ')
    );

    // 3. IDs críticos — siempre correcto, usa DOM real
    const missing_ids = this.REQUIRED_IDS.filter(id => !document.getElementById(id));
    check('DOM', 'IDs HTML críticos',
      missing_ids.length === 0,
      missing_ids.length === 0 ? this.REQUIRED_IDS.length + ' presentes' : 'PERDIDOS: ' + missing_ids.join(', ')
    );

    // 4. Tamaño del código — en versión modular contar funciones globales en vez de chars
    // El monolito tenía ~480k chars inline; en modular contamos funciones cargadas en window
    const globalFnCount = Object.keys(window).filter(k => typeof window[k] === 'function').length;
    const MIN_GLOBAL_FNS = 80; // umbral conservador para la versión modular
    const isModular = !document.querySelector('script:not([src])') ||
      document.querySelectorAll('script[src*="modules/"]').length > 0;
    if (isModular) {
      check('Tamaño', 'Módulos cargados',
        globalFnCount >= MIN_GLOBAL_FNS,
        globalFnCount + ' funciones globales cargadas' +
          (globalFnCount < MIN_GLOBAL_FNS ? ' — POSIBLE MÓDULO SIN CARGAR' : ' ✓')
      );
    } else {
      const scriptLen = document.documentElement.innerHTML.length;
      check('Tamaño', 'Tamaño del código',
        scriptLen >= this.MIN_SCRIPT_LENGTH,
        scriptLen.toLocaleString('es-ES') + ' chars' +
          (scriptLen < this.MIN_SCRIPT_LENGTH ? ' — POSIBLE TRUNCAMIENTO' : ' OK')
      );
    }

    // 5. Sin backticks escapados — solo aplica al monolito (inline JS)
    if (!isModular) {
      const htmlSrc = document.documentElement.innerHTML;
      const btSeq = '\\' + '`';
      let escapedBt = 0, btPos = 0;
      while ((btPos = htmlSrc.indexOf(btSeq, btPos)) !== -1) { escapedBt++; btPos++; }
      escapedBt = Math.max(0, escapedBt - 1);
      check('Sintaxis', 'Sin backticks escapados', escapedBt === 0,
        escapedBt === 0 ? 'OK' : escapedBt + ' encontrados — riesgo de SyntaxError'
      );
    } else {
      check('Sintaxis', 'Arquitectura modular', true, 'Módulos JS externos — check inline N/A ✓');
    }

    // 6. Versiones acumuladas — tokens buscados en fuente combinada
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
    // Ahora usan el toString() de las funciones globales (válido en modular).
    // ══════════════════════════════════════════════════════════════════

    // TEST 7a: BATCH_SIZE <= 4
    const batchMatch = src.match(/const BATCH_SIZE\s*=\s*(\d+)/);
    // También intentar leer directamente de window si está definido
    const batchDirect = typeof window.BATCH_SIZE !== 'undefined' ? window.BATCH_SIZE : null;
    const batchSize = batchDirect !== null ? batchDirect : (batchMatch ? parseInt(batchMatch[1]) : 0);
    check('Scraping', 'BATCH_SIZE seguro (max 4)',
      batchSize >= 1 && batchSize <= 4,
      batchSize === 0 ? 'NO ENCONTRADO'
        : batchSize <= 4 ? 'BATCH_SIZE = ' + batchSize + ' ✓'
        : 'BATCH_SIZE = ' + batchSize + ' — DEMASIADO ALTO, saturará los proxies'
    );

    // TEST 7b: fetchWithProxy NO usa Promise.any
    const fetchProxyFn = typeof window.fetchWithProxy === 'function'
      ? window.fetchWithProxy.toString()
      : (() => {
          const fpStart = src.indexOf('async function fetchWithProxy(');
          if (fpStart === -1) return '';
          let depth = 0, i = src.indexOf('{', fpStart);
          while (i < src.length) {
            if (src[i] === '{') depth++;
            else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(fpStart, i+1); }
            i++;
          }
          return src.slice(fpStart, fpStart + 3000);
        })();
    check('Scraping', 'fetchWithProxy sin Promise.any',
      !fetchProxyFn.includes('Promise.any'),
      !fetchProxyFn.includes('Promise.any') ? 'Modo secuencial correcto ✓'
        : 'Promise.any DETECTADO — volverá a saturar los proxies'
    );

    // TEST 7c: enrichFromWeb NO usa Promise.allSettled
    const enrichWebFn = typeof window.enrichFromWeb === 'function'
      ? window.enrichFromWeb.toString()
      : (() => {
          const ewStart = src.indexOf('async function enrichFromWeb(');
          if (ewStart === -1) return '';
          let depth = 0, i = src.indexOf('{', ewStart);
          while (i < src.length) {
            if (src[i] === '{') depth++;
            else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(ewStart, i+1); }
            i++;
          }
          return src.slice(ewStart, ewStart + 20000);
        })();
    check('Scraping', 'Scraping profundo sin Promise.allSettled',
      !enrichWebFn.includes('Promise.allSettled'),
      !enrichWebFn.includes('Promise.allSettled') ? 'Bucle secuencial correcto ✓'
        : 'Promise.allSettled DETECTADO — saturará proxies'
    );

    // TEST 7d: Mínimo 5 proxies CORS configurados
    // En modular: leer directamente CORS_PROXIES si está en window
    let proxyCount = 0;
    if (Array.isArray(window.CORS_PROXIES)) {
      proxyCount = window.CORS_PROXIES.filter(p =>
        p.url && /allorigins|corsproxy|codetabs|thingproxy|crossorigin|cors\.sh/i.test(p.url)
      ).length;
    } else {
      const proxyUrls = src.match(/url:\s*'https:\/\/[^']+'/gi) || [];
      proxyCount = proxyUrls.filter(u =>
        /allorigins|corsproxy|codetabs|thingproxy|crossorigin|cors\.sh/i.test(u)
      ).length;
    }
    check('Scraping', 'Mínimo 5 proxies CORS',
      proxyCount >= 5,
      proxyCount >= 5 ? proxyCount + ' proxies configurados ✓'
        : 'Solo ' + proxyCount + ' — añadir más para mayor resiliencia'
    );

    // TEST 7e: Sin APIs de pago en fetchWithProxy
    const paidApisInProxy = ['api.anthropic.com', 'api.openai.com'].filter(a => fetchProxyFn.includes(a));
    check('Scraping', 'Sin APIs de pago en scraping',
      paidApisInProxy.length === 0,
      paidApisInProxy.length === 0 ? 'Solo proxies gratuitos ✓'
        : 'DETECTADAS APIs de pago: ' + paidApisInProxy.join(', ')
    );

    // 8. CHECK NUEVO: source 'propio' registrado en leads.js
    const srcLabelsOk = typeof window.renderLeads === 'function'
      ? window.renderLeads.toString().includes('propio')
      : src.includes("propio");
    check('Módulos', "source 'propio' en leads.js",
      srcLabelsOk,
      srcLabelsOk ? "srcLabels incluye 'propio' ✓" : "FALTA entrada 'propio' en srcLabels — leads importados sin emoji"
    );

    // 9. CHECK NUEVO: search-history.js cargado
    const shLoaded = typeof window.loadSearchHistory === 'function' ||
      typeof window.saveSearchHistory === 'function';
    check('Módulos', 'search-history.js cargado',
      shLoaded,
      shLoaded ? 'Historial de búsquedas disponible ✓' : 'MÓDULO NO CARGADO — añadir <script src="modules/search-history.js">'
    );

    // 10. CHECK NUEVO: restoreBackup con soporte dual-format
    const restoreFn = typeof window.restoreBackup === 'function'
      ? window.restoreBackup.toString() : '';
    const hasDualFormat = restoreFn.includes('gordi_leads') || restoreFn.includes('Formato B') ||
      restoreFn.includes('_voltflow_version');
    check('Módulos', 'restoreBackup dual-format',
      hasDualFormat,
      hasDualFormat ? 'Soporta backup completo + datos portátiles ✓'
        : 'SOLO formato nuevo — no puede restaurar backups del index.html antiguo'
    );

    const funcCount = Object.keys(window).filter(k => typeof window[k] === 'function').length;
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

// ============================================================
// BRUTAL SALES UPGRADES
// Radar, attack plan, competitive spy, lost opportunities, dossier
// ============================================================

function bfEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function bfModal(title, html, maxWidth = 780) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay brutal-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.68);backdrop-filter:blur(8px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:1rem';
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div style="width:min(${maxWidth}px,96vw);max-height:90vh;overflow:auto;background:var(--bg-card);border:1px solid var(--glass-border);border-radius:16px;box-shadow:0 24px 80px rgba(0,0,0,.5)">
      <div style="position:sticky;top:0;background:var(--bg-card);z-index:1;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 1.2rem;border-bottom:1px solid var(--glass-border)">
        <h2 style="margin:0;font-size:1.05rem">${title}</h2>
        <button class="btn-outline btn-sm" onclick="this.closest('.brutal-modal').remove()">Cerrar</button>
      </div>
      <div style="padding:1.2rem">${html}</div>
    </div>`;
  document.body.appendChild(modal);
  return modal;
}

function bfLeadAgeDays(lead) {
  return lead?.date ? Math.floor((Date.now() - new Date(lead.date)) / 86400000) : 0;
}

function bfLastActivityDays(lead) {
  const dates = [
    lead?.status_date,
    lead?.first_contact_date,
    ...(lead?.activity || []).map(a => a.date)
  ].filter(Boolean).map(d => new Date(d).getTime()).filter(Boolean);
  if (!dates.length) return bfLeadAgeDays(lead);
  return Math.floor((Date.now() - Math.max(...dates)) / 86400000);
}

function bfSentEmailsForLead(lead) {
  return (emailHistory || []).filter(e => e.leadId == lead.id || (lead.email && e.email === lead.email));
}

function bfLeadPainSignals(lead) {
  const parts = [
    lead.signal, lead.description, lead.reviewSummary, lead.fachadaAnalysis,
    ...(lead.signals || []), ...(lead.reviewPain || []), ...(lead.techStack || [])
  ].filter(Boolean).join(' ').toLowerCase();
  const out = [];
  if (/lento|velocidad|wordpress|wix|joomla|prestashop|web/i.test(parts)) out.push('web/captacion mejorable');
  if (/reseñ|resen|queja|mal|espera|sucio|antigu|deterior|dolor/i.test(parts)) out.push('dolor visible en reputacion');
  if (/reforma|obra|apertura|traslado|ampliac|nuevo local|nueva sede/i.test(parts)) out.push('momento de cambio');
  if (!lead.website) out.push('sin web clara');
  if (!lead.email) out.push('sin email directo');
  if (lead.rating && lead.rating < 4) out.push('rating mejorable');
  return [...new Set(out)].slice(0, 5);
}

function runOpportunityRadar() {
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem('gordi_saved_searches') || '[]'); } catch { return []; }
  })();
  const seenCompanies = new Set((leads || []).filter(l => !l.archived).map(l => (l.company || '').toLowerCase().trim()));
  const candidates = [];

  saved.forEach(s => {
    (s.results || []).forEach((r, idx) => {
      const name = (r.name || r.company || '').trim();
      if (!name || seenCompanies.has(name.toLowerCase())) return;
      const score = r.opportunityScore || r.score || ((r.email ? 25 : 0) + (r.phone ? 10 : 0) + (r.website ? 10 : 0) + Math.min(r.ratingCount || 0, 100) / 4 + (r.rating || 0) * 8);
      candidates.push({ ...r, _savedId: s.id, _savedLabel: s.label || `${s.segment || ''} ${s.location || ''}`.trim(), _idx: idx, _radarScore: Math.round(score) });
    });
  });

  (tempSearchResults || []).forEach((r, idx) => {
    const name = (r.name || '').trim();
    if (!name || seenCompanies.has(name.toLowerCase())) return;
    candidates.push({ ...r, _idx: idx, _savedLabel: 'busqueda actual', _radarScore: r.opportunityScore || r.score || 40 });
  });

  candidates.sort((a, b) => (b._radarScore || 0) - (a._radarScore || 0));
  localStorage.setItem('gordi_radar_last_run', new Date().toISOString());

  const html = `
    <div style="font-size:.86rem;color:var(--text-muted);line-height:1.55;margin-bottom:1rem">
      Revisa busquedas guardadas y resultados actuales para detectar empresas nuevas que aun no estan en el CRM.
    </div>
    <div style="display:grid;gap:.55rem">
      ${candidates.slice(0, 30).map(c => `
        <div style="display:flex;gap:.75rem;align-items:flex-start;justify-content:space-between;padding:.75rem;border:1px solid var(--glass-border);border-radius:10px;background:rgba(255,255,255,.03)">
          <div style="min-width:0">
            <strong>${bfEscape(c.name || c.company)}</strong>
            <div style="font-size:.75rem;color:var(--text-muted);margin-top:.15rem">${bfEscape(c.address || c.website || c._savedLabel || '')}</div>
            <div style="font-size:.72rem;color:var(--text-dim);margin-top:.25rem">${bfEscape((c.signals || []).slice(0, 2).join(' | ') || c.description || 'Sin senal ampliada')}</div>
          </div>
          <div style="display:flex;gap:.45rem;align-items:center;flex-shrink:0">
            <strong style="color:${(c._radarScore || 0) >= 70 ? 'var(--success)' : 'var(--warning)'}">${c._radarScore || 0}</strong>
            ${typeof c._idx === 'number' && c._savedLabel === 'busqueda actual' ? `<button class="btn-action" onclick="quickImportOne(${c._idx});this.closest('.brutal-modal')?.remove()">Volcar</button>` : ''}
            ${c._savedId && typeof loadSavedSearch === 'function' ? `<button class="btn-action secondary" onclick="loadSavedSearch('${c._savedId}')">Cargar</button>` : ''}
          </div>
        </div>`).join('') || '<div style="color:var(--text-muted)">No hay oportunidades nuevas. Guarda busquedas o ejecuta una busqueda para alimentar el radar.</div>'}
    </div>`;
  bfModal('Radar de empresas calientes', html, 900);
  showToast(`Radar: ${candidates.length} oportunidades detectadas`);
}

function buildLeadAttackPlan(lead) {
  const pains = bfLeadPainSignals(lead);
  const angle = lead.opportunityAngle || lead.signal || pains[0] || 'mejora comercial y operativa';
  const saludo = typeof buildSaludo === 'function' ? buildSaludo(lead.name, lead.company) : `Hola ${lead.name || 'equipo'}`;
  const email = `${saludo},\n\nHe revisado ${lead.company} y veo una oportunidad clara alrededor de ${angle}.\n\nLa idea no es venderte nada a ciegas: te propondria una revision rapida de 10 minutos para identificar donde se puede ganar mas captacion, confianza o eficiencia.\n\nSi tiene sentido, te paso 2-3 mejoras concretas para vuestro caso.\n\nUn saludo.`;
  const whatsapp = `Hola ${lead.name || 'equipo'}, soy ${localStorage.getItem('gordi_user_name') || 'Hector'}. He visto ${lead.company} y creo que hay una mejora rapida en ${angle}. Te puedo pasar 2 ideas concretas sin compromiso?`;
  return {
    angle,
    diagnosis: pains.length ? pains : ['lead con informacion suficiente para contacto consultivo'],
    email,
    whatsapp,
    call: [
      `Apertura: "He revisado ${lead.company} y queria contrastar una oportunidad concreta."`,
      'Pregunta: "Ahora mismo que os pesa mas: captar mas clientes, mejorar conversion o resolver incidencias operativas?"',
      'Cierre: "Si te encaja, preparo una mini auditoria y vemos si hay proyecto real."'
    ],
    objections: [
      ['No tenemos tiempo', 'Por eso lo planteo en 10 minutos y con 2 mejoras ya filtradas.'],
      ['Ya tenemos proveedor', 'Perfecto; mi propuesta es revisar si hay margen que vuestro proveedor no esta cubriendo.'],
      ['Mandame informacion', 'Te mando algo breve, pero antes prefiero confirmar que el enfoque encaja con vuestra situacion.']
    ],
    next: lead.email ? 'Enviar email y programar seguimiento a 3 dias.' : lead.phone ? 'Llamar primero y pedir email directo.' : 'Buscar decisor/email antes de contactar.'
  };
}

function openLeadAttackPlan(id) {
  const lead = (leads || []).find(l => l.id == id);
  if (!lead) return;
  const plan = buildLeadAttackPlan(lead);
  if (typeof addActivityLog === 'function') addActivityLog(lead.id, 'Plan de ataque generado');
  if (typeof saveLeads === 'function') saveLeads();
  const html = `
    <div style="display:grid;gap:1rem">
      <section style="padding:1rem;border:1px solid var(--glass-border);border-radius:10px;background:rgba(255,255,255,.03)">
        <strong>Diagnostico</strong>
        <ul style="margin:.6rem 0 0 1.1rem;color:var(--text-muted)">${plan.diagnosis.map(x => `<li>${bfEscape(x)}</li>`).join('')}</ul>
      </section>
      <section style="padding:1rem;border:1px solid var(--glass-border);border-radius:10px;background:rgba(255,255,255,.03)">
        <strong>Email inicial</strong>
        <textarea style="width:100%;min-height:150px;margin-top:.6rem;background:var(--glass);border:1px solid var(--glass-border);border-radius:8px;color:var(--text);padding:.75rem">${bfEscape(plan.email)}</textarea>
      </section>
      <section style="padding:1rem;border:1px solid var(--glass-border);border-radius:10px;background:rgba(255,255,255,.03)">
        <strong>WhatsApp</strong>
        <textarea style="width:100%;min-height:75px;margin-top:.6rem;background:var(--glass);border:1px solid var(--glass-border);border-radius:8px;color:var(--text);padding:.75rem">${bfEscape(plan.whatsapp)}</textarea>
      </section>
      <section style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div style="padding:1rem;border:1px solid var(--glass-border);border-radius:10px;background:rgba(255,255,255,.03)">
          <strong>Llamada</strong>
          <ol style="margin:.6rem 0 0 1.1rem;color:var(--text-muted)">${plan.call.map(x => `<li>${bfEscape(x)}</li>`).join('')}</ol>
        </div>
        <div style="padding:1rem;border:1px solid var(--glass-border);border-radius:10px;background:rgba(255,255,255,.03)">
          <strong>Objeciones</strong>
          ${plan.objections.map(([o, r]) => `<div style="margin-top:.55rem"><b>${bfEscape(o)}</b><br><span style="color:var(--text-muted);font-size:.84rem">${bfEscape(r)}</span></div>`).join('')}
        </div>
      </section>
      <div style="padding:1rem;border:1px solid rgba(16,217,124,.25);border-radius:10px;background:rgba(16,217,124,.07)"><strong>Siguiente paso:</strong> ${bfEscape(plan.next)}</div>
    </div>`;
  bfModal(`Plan de ataque - ${bfEscape(lead.company)}`, html, 920);
}

function openCompetitiveSpyForLead(id) {
  const lead = (leads || []).find(l => l.id == id);
  if (!lead) return;
  const pool = [
    ...(leads || []).filter(l => l.id != id && !l.archived && (!lead.segment || l.segment === lead.segment)).map(l => ({ ...l, _kind: 'CRM', _name: l.company, _score: l.score || 0 })),
    ...(tempSearchResults || []).filter(r => (r.name || '').toLowerCase() !== (lead.company || '').toLowerCase()).map(r => ({ ...r, _kind: 'Busqueda', _name: r.name, _score: r.opportunityScore || r.score || ((r.rating || 0) * 15) }))
  ].sort((a, b) => (b._score || 0) - (a._score || 0)).slice(0, 5);
  const html = `
    <div style="font-size:.86rem;color:var(--text-muted);line-height:1.55;margin-bottom:1rem">Compara este lead con empresas parecidas del CRM y la busqueda actual.</div>
    <div style="display:grid;gap:.65rem">
      ${pool.map(c => {
        const wins = [];
        if ((c.rating || 0) > (lead.rating || 0)) wins.push('mejor rating');
        if ((c.ratingCount || 0) > (lead.ratingCount || 0)) wins.push('mas resenas');
        if (c.website && !lead.website) wins.push('web visible');
        if ((c.score || c._score || 0) > (lead.score || 0)) wins.push('mayor score');
        if ((c.signals || []).length > (lead.signals || []).length) wins.push('mas senales');
        return `<div style="padding:.8rem;border:1px solid var(--glass-border);border-radius:10px;background:rgba(255,255,255,.03)">
          <div style="display:flex;justify-content:space-between;gap:1rem"><strong>${bfEscape(c._name || c.company || c.name)}</strong><span style="color:var(--primary);font-size:.75rem">${bfEscape(c._kind)}</span></div>
          <div style="font-size:.78rem;color:var(--text-muted);margin-top:.35rem">Score ${Math.round(c._score || c.score || 0)} - Rating ${c.rating || '-'} - Resenas ${c.ratingCount || 0} - ${c.website ? 'web si' : 'web no'}</div>
          <div style="margin-top:.45rem;color:${wins.length ? 'var(--warning)' : 'var(--text-dim)'};font-size:.8rem">${wins.length ? `Gana en: ${wins.join(', ')}` : 'No supera claramente al lead; usar como comparativa defensiva.'}</div>
        </div>`;
      }).join('') || '<div style="color:var(--text-muted)">No hay competidores comparables. Ejecuta una busqueda del mismo sector para alimentar este modulo.</div>'}
    </div>`;
  bfModal(`Espionaje competitivo - ${bfEscape(lead.company)}`, html, 860);
}

function openLostOpportunitiesPanel() {
  const rows = (leads || []).filter(l => !l.archived && l.status !== 'Cerrado' && l.status !== 'No interesa').map(l => {
    const reasons = [];
    const lastDays = bfLastActivityDays(l);
    if ((l.score || 0) >= 70 && !bfSentEmailsForLead(l).length) reasons.push('score alto sin email enviado');
    if (!l.next_contact) reasons.push('sin proximo contacto');
    if (lastDays >= 7) reasons.push(`${lastDays} dias sin actividad`);
    if (l.status === 'Pendiente' && bfLeadAgeDays(l) >= 3) reasons.push('pendiente demasiado tiempo');
    if (l.email && l.status === 'Pendiente') reasons.push('tiene email y aun no esta contactado');
    return { lead: l, reasons, urgency: (l.score || 0) + reasons.length * 18 + lastDays };
  }).filter(x => x.reasons.length).sort((a, b) => b.urgency - a.urgency);

  const html = `
    <div style="font-size:.86rem;color:var(--text-muted);line-height:1.55;margin-bottom:1rem">Lista priorizada de leads buenos que se estan enfriando por falta de accion, seguimiento o fecha de proximo contacto.</div>
    <div style="display:grid;gap:.55rem">
      ${rows.slice(0, 40).map(x => `<div style="display:flex;gap:.75rem;justify-content:space-between;align-items:flex-start;padding:.75rem;border:1px solid var(--glass-border);border-radius:10px;background:rgba(255,255,255,.03)">
        <div>
          <strong>${bfEscape(x.lead.company)}</strong>
          <div style="font-size:.75rem;color:var(--text-muted);margin-top:.2rem">${x.reasons.map(bfEscape).join(' - ')}</div>
        </div>
        <div style="display:flex;gap:.4rem;align-items:center">
          <strong style="color:var(--warning)">${Math.round(x.urgency)}</strong>
          <button class="btn-action" onclick="openLeadDetail('${x.lead.id}')">Ver</button>
          <button class="btn-action secondary" onclick="openLeadAttackPlan('${x.lead.id}')">Plan</button>
        </div>
      </div>`).join('') || '<div style="color:var(--text-muted)">No hay oportunidades perdidas ahora mismo.</div>'}
    </div>`;
  bfModal('Bandeja de oportunidades perdidas', html, 920);
}

function openLeadDossier(id) {
  const lead = (leads || []).find(l => l.id == id);
  if (!lead) return;
  const plan = buildLeadAttackPlan(lead);
  const emails = bfSentEmailsForLead(lead);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Dossier ${bfEscape(lead.company)}</title>
    <style>body{font-family:Arial,sans-serif;color:#111;margin:32px;line-height:1.45}h1{margin-bottom:4px}.muted{color:#666}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.box{border:1px solid #ddd;border-radius:8px;padding:14px;margin:12px 0}ul{margin-top:8px}@media print{button{display:none}}</style></head>
    <body>
      <button onclick="window.print()" style="float:right;padding:10px 16px">Imprimir / guardar PDF</button>
      <h1>${bfEscape(lead.company)}</h1>
      <div class="muted">${bfEscape(lead.segment || '')} - Score ${lead.score || 0} - ${bfEscape(lead.website || '')}</div>
      <div class="grid">
        <div class="box"><h3>Contacto</h3><p>${bfEscape(lead.name || 'Responsable')}<br>${bfEscape(lead.email || 'Sin email')}<br>${bfEscape(lead.phone || 'Sin telefono')}</p></div>
        <div class="box"><h3>Estado</h3><p>${bfEscape(lead.status || '')}<br>Proximo contacto: ${bfEscape(lead.next_contact || 'sin fecha')}<br>Emails enviados: ${emails.length}</p></div>
      </div>
      <div class="box"><h3>Diagnostico</h3><ul>${plan.diagnosis.map(x => `<li>${bfEscape(x)}</li>`).join('')}</ul></div>
      <div class="box"><h3>Senal detectada</h3><p>${bfEscape(lead.signal || lead.description || 'Sin senal registrada')}</p></div>
      <div class="box"><h3>Plan recomendado</h3><p><strong>Angulo:</strong> ${bfEscape(plan.angle)}</p><p><strong>Siguiente paso:</strong> ${bfEscape(plan.next)}</p></div>
      <div class="box"><h3>Email sugerido</h3><pre style="white-space:pre-wrap;font-family:Arial">${bfEscape(plan.email)}</pre></div>
      <div class="box"><h3>Notas internas</h3><p>${bfEscape(lead.notes || 'Sin notas')}</p></div>
    </body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    bfModal('Dossier comercial', `<div style="color:var(--text-muted);margin-bottom:1rem">El navegador bloqueo la ventana. Usa este boton para abrir el dossier.</div><a class="btn-primary" href="${url}" target="_blank">Abrir dossier</a>`, 520);
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// ============================================================
// FREE DAILY AUTONOMOUS COPILOT
// Runs in-browser with local rules. Existing AI keys are optional.
// ============================================================

function dcGetSavedSearches() {
  try { return JSON.parse(localStorage.getItem('gordi_saved_searches') || '[]'); } catch { return []; }
}

function dcDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function dcLeadActionReason(lead) {
  const reasons = [];
  const lastDays = typeof bfLastActivityDays === 'function' ? bfLastActivityDays(lead) : 0;
  if (lead.next_contact && new Date(lead.next_contact) <= new Date()) reasons.push('seguimiento vencido/hoy');
  if ((lead.score || 0) >= 75 && lead.status === 'Pendiente') reasons.push('score alto sin contactar');
  if (lead.email && lead.status === 'Pendiente') reasons.push('email disponible');
  if (!lead.next_contact) reasons.push('sin proxima accion');
  if (lastDays >= 7) reasons.push(`${lastDays} dias sin actividad`);
  return reasons;
}

function buildDailyCopilotAgenda() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const activeLeads = (leads || []).filter(l => !l.archived && l.status !== 'Cerrado' && l.status !== 'No interesa');
  const due = activeLeads.filter(l => l.next_contact && new Date(l.next_contact) <= today)
    .sort((a, b) => (b.score || 0) - (a.score || 0));
  const hot = activeLeads.filter(l => (l.score || 0) >= 70 && l.status === 'Pendiente')
    .sort((a, b) => (b.score || 0) - (a.score || 0));
  const coldRisk = activeLeads.map(l => ({ lead: l, reasons: dcLeadActionReason(l) }))
    .filter(x => x.reasons.length)
    .sort((a, b) => ((b.lead.score || 0) + b.reasons.length * 12) - ((a.lead.score || 0) + a.reasons.length * 12));

  const saved = dcGetSavedSearches();
  const staleSearches = saved
    .map(s => ({ ...s, ageDays: s.date ? Math.floor((Date.now() - new Date(s.date)) / 86400000) : 999 }))
    .filter(s => s.ageDays >= 2 || !s.date)
    .sort((a, b) => b.ageDays - a.ageDays)
    .slice(0, 5);

  const knownCompanies = new Set((leads || []).map(l => (l.company || '').toLowerCase().trim()));
  const radar = [];
  saved.forEach(s => (s.results || []).forEach(r => {
    const name = (r.name || r.company || '').trim();
    if (!name || knownCompanies.has(name.toLowerCase())) return;
    const score = r.opportunityScore || r.score || ((r.email ? 20 : 0) + (r.website ? 10 : 0) + (r.rating || 0) * 8 + Math.min(r.ratingCount || 0, 100) / 5);
    radar.push({ ...r, sourceSearch: s.label || s.location || s.segment || 'busqueda guardada', score: Math.round(score) });
  }));
  radar.sort((a, b) => (b.score || 0) - (a.score || 0));

  const actions = [
    ...due.slice(0, 4).map(l => ({ type: 'followup', lead: l, title: `Seguir ${l.company}`, detail: 'Seguimiento pendiente o vencido', priority: 100 + (l.score || 0) })),
    ...hot.slice(0, 4).map(l => ({ type: 'contact', lead: l, title: `Contactar ${l.company}`, detail: dcLeadActionReason(l).join(' - ') || 'Lead caliente', priority: 80 + (l.score || 0) })),
    ...coldRisk.slice(0, 4).map(x => ({ type: 'rescue', lead: x.lead, title: `Rescatar ${x.lead.company}`, detail: x.reasons.join(' - '), priority: 50 + (x.lead.score || 0) + x.reasons.length * 8 })),
    ...staleSearches.slice(0, 3).map(s => ({ type: 'search', search: s, title: `Relanzar ${s.label || s.location || s.segment}`, detail: `${s.ageDays} dias desde la ultima busqueda`, priority: 45 })),
    ...radar.slice(0, 3).map(r => ({ type: 'radar', company: r, title: `Revisar ${r.name || r.company}`, detail: `${r.sourceSearch} - score ${r.score}`, priority: 40 + (r.score || 0) }))
  ].sort((a, b) => b.priority - a.priority);

  return {
    date: dcDateKey(),
    generatedAt: new Date().toISOString(),
    summary: {
      due: due.length,
      hot: hot.length,
      coldRisk: coldRisk.length,
      staleSearches: staleSearches.length,
      radar: radar.length,
      activeLeads: activeLeads.length
    },
    actions: actions.slice(0, 12),
    aiBriefing: ''
  };
}

function dcSaveAgenda(agenda) {
  localStorage.setItem('gordi_daily_copilot_agenda', JSON.stringify(agenda));
  localStorage.setItem('gordi_daily_copilot_last_run', agenda.date);
}

function dcLoadAgenda() {
  try { return JSON.parse(localStorage.getItem('gordi_daily_copilot_agenda') || 'null'); } catch { return null; }
}

function dcActionHtml(action, idx) {
  const p = action.priority || 0;
  const color = p >= 140 ? 'var(--danger)' : p >= 100 ? 'var(--warning)' : 'var(--primary)';
  const leadBtns = action.lead ? `
    <button class="btn-action" onclick="openLeadDetail('${action.lead.id}')">Ver</button>
    <button class="btn-action secondary" onclick="openLeadAttackPlan('${action.lead.id}')">Plan</button>
    ${action.lead.email ? `<button class="btn-action secondary" onclick="generateEmail('${action.lead.id}')">Email</button>` : ''}` : '';
  const searchBtn = action.search && typeof loadSavedSearch === 'function'
    ? `<button class="btn-action" onclick="loadSavedSearch('${action.search.id}')">Cargar</button>` : '';
  const radarBtn = action.company
    ? `<button class="btn-action secondary" onclick="runOpportunityRadar()">Radar</button>` : '';
  return `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem;padding:.75rem;border:1px solid var(--glass-border);border-radius:10px;background:rgba(255,255,255,.03)">
      <div style="min-width:0">
        <div style="display:flex;gap:.45rem;align-items:center;flex-wrap:wrap">
          <strong>${idx + 1}. ${bfEscape(action.title)}</strong>
          <span style="font-size:.68rem;color:${color};border:1px solid ${color}55;border-radius:999px;padding:1px 7px">${bfEscape(action.type)}</span>
        </div>
        <div style="font-size:.76rem;color:var(--text-muted);margin-top:.25rem">${bfEscape(action.detail || '')}</div>
      </div>
      <div style="display:flex;gap:.35rem;flex-wrap:wrap;justify-content:flex-end;flex-shrink:0">${leadBtns}${searchBtn}${radarBtn}</div>
    </div>`;
}

function renderDailyCopilotPanel(agenda = dcLoadAgenda()) {
  const el = document.getElementById('daily-copilot-content');
  if (!el) return;
  if (!agenda) agenda = runDailyCopilot(false, true);
  const s = agenda.summary || {};
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(115px,1fr));gap:.55rem">
      ${[
        ['Seguimientos', s.due || 0],
        ['Hot leads', s.hot || 0],
        ['En riesgo', s.coldRisk || 0],
        ['Busquedas', s.staleSearches || 0],
        ['Radar', s.radar || 0]
      ].map(([k,v]) => `<div style="padding:.65rem;border:1px solid var(--glass-border);border-radius:10px;background:rgba(255,255,255,.03)"><div style="font-weight:800;font-size:1.05rem">${v}</div><div style="font-size:.68rem;color:var(--text-dim)">${k}</div></div>`).join('')}
    </div>
    ${agenda.aiBriefing ? `<div style="padding:.85rem;border:1px solid rgba(99,102,241,.28);border-radius:10px;background:rgba(99,102,241,.08);white-space:pre-wrap;font-size:.84rem;line-height:1.55">${bfEscape(agenda.aiBriefing)}</div>` : ''}
    <div style="display:grid;gap:.55rem">
      ${(agenda.actions || []).map(dcActionHtml).join('') || '<div style="color:var(--text-muted)">No hay acciones criticas. Buen momento para lanzar una busqueda guardada.</div>'}
    </div>
    <div style="font-size:.7rem;color:var(--text-dim)">Generado: ${new Date(agenda.generatedAt || Date.now()).toLocaleString('es-ES')} · Todo funciona localmente; la IA solo se usa si pulsas "Mejorar con IA".</div>`;
}

function runDailyCopilot(manual = false, returnAgenda = false) {
  const agenda = buildDailyCopilotAgenda();
  dcSaveAgenda(agenda);
  renderDailyCopilotPanel(agenda);
  if (manual) showToast('Copiloto diario regenerado');
  return returnAgenda ? agenda : undefined;
}

async function enhanceDailyCopilotWithAI() {
  const agenda = dcLoadAgenda() || buildDailyCopilotAgenda();
  const key = typeof getGeminiKey === 'function' ? getGeminiKey() : '';
  const hasAnyAI = key || localStorage.getItem('gordi_groq_key') || localStorage.getItem('gordi_openrouter_key');
  if (!hasAnyAI || typeof callGeminiAPI !== 'function') {
    showToast('Configura Gemini, Groq u OpenRouter para mejorar con IA');
    return;
  }
  const el = document.getElementById('daily-copilot-content');
  if (el) el.insertAdjacentHTML('afterbegin', '<div id="dc-ai-loading" style="padding:.7rem;border:1px solid var(--glass-border);border-radius:10px;color:var(--text-muted)">Generando briefing IA...</div>');
  const prompt = `Actua como director comercial. Resume esta agenda diaria en español, muy accionable, maximo 10 lineas. Prioriza llamadas, emails, busquedas y rescates. Agenda JSON:\n${JSON.stringify(agenda).slice(0, 12000)}`;
  try {
    agenda.aiBriefing = await callGeminiAPI(prompt, key);
    agenda.generatedAt = new Date().toISOString();
    dcSaveAgenda(agenda);
    renderDailyCopilotPanel(agenda);
    showToast('Briefing IA generado');
  } catch (e) {
    document.getElementById('dc-ai-loading')?.remove();
    showToast('No se pudo generar el briefing IA');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const last = localStorage.getItem('gordi_daily_copilot_last_run');
    const saved = dcLoadAgenda();
    if (last !== dcDateKey() || !saved) runDailyCopilot(false);
    else renderDailyCopilotPanel(saved);
  }, 1200);
});
