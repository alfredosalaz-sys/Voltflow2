// ============================================================
// MOTOR DE BÚSQUEDA — 3 CAPAS + SCRAPING AVANZADO
// Capa 1: Google Places API  → nombre, dirección, rating, web, teléfono, horario
// Capa 2: Web Scraping PRO   → emails, redes, decisor, descripción, JSON-LD, Schema.org
// Capa 3: Hunter.io          → verificación y búsqueda de emails corporativos
// ============================================================

// ── Proxies CORS (se prueban en orden, primer éxito gana) ────────────────────
// ── Lista de proxies CORS — actualizada 2026 ─────────────────────────────────
// Se intentan en orden; el sistema aprende cuáles funcionan mejor en la sesión
// y los sube en el ranking automáticamente.


// ══════════════════════════════════════════════════════════════════════════
// ██  MÓDULO: SCRAPING
// ──  Motor de scraping y enriquecimiento web de empresas
// ──  Funciones: CORS_PROXIES, _proxyStats, _getSortedProxies, fetchWithProxy, enrichFromWeb,
  //          enrichFromHunter, enrichFromApollo, enrichFromWhois, enrichFromOpenCorporates,
  //          enrichFromNews, enrichFromStreetView, enrichFromBorme,
  //          enrichFromEmpressite, enrichFromExperian, extractEmailWithAI
// ══════════════════════════════════════════════════════════════════════════

const CORS_PROXIES = [
  // ── Tier 1: alta fiabilidad ─────────────────────────────────────────────
  { url: 'https://api.allorigins.win/get?url=',           mode: 'allorigins' },
  { url: 'https://corsproxy.io/?',                        mode: 'raw' },
  { url: 'https://api.allorigins.win/raw?url=',           mode: 'raw' },
  // ── Tier 2: alternativos ────────────────────────────────────────────────
  { url: 'https://thingproxy.freeboard.io/fetch/',        mode: 'raw' },
  { url: 'https://cors-anywhere.hexlet.io/',              mode: 'raw' },
  { url: 'https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all', mode: 'raw' },
  { url: 'https://cors.eu.org/',                          mode: 'raw' },
  { url: 'https://api.codetabs.com/v1/proxy?quest=',      mode: 'raw' },
];

// ── Cache de Enriquecimiento (Idea 5) ────────────────────────────────────────
// Evita re-scrapear empresas en la misma sesión/días para ahorrar tiempo y APIs
const _enrichCache = {
  get: (id) => {
    try {
      const entry = JSON.parse(localStorage.getItem('gordi_enrich_cache') || '{}')[id];
      if (entry && (Date.now() - entry.ts < 1000 * 60 * 60 * 24 * 7)) return entry.data; // 7 días
    } catch(e) {}
    return null;
  },
  set: (id, data) => {
    try {
      const cache = JSON.parse(localStorage.getItem('gordi_enrich_cache') || '{}');
      cache[id] = { ts: Date.now(), data };
      // Mantener tamaño razonable (< 2MB)
      const keys = Object.keys(cache);
      if (keys.length > 500) delete cache[keys[0]];
      localStorage.setItem('gordi_enrich_cache', JSON.stringify(cache));
    } catch(e) {}
  }
};

// ── Cache de rendimiento de proxies (sesión) ─────────────────────────────────
// Aprendemos qué proxies funcionan y los priorizamos durante la sesión
const _proxyStats = {};
CORS_PROXIES.forEach((p, i) => { _proxyStats[i] = { ok: 0, fail: 0, ms: 999 }; });

function _getSortedProxies() {
  // Si el usuario tiene un proxy personalizado configurado, va siempre primero
  const customProxyUrl = localStorage.getItem('gordi_custom_proxy')?.trim();
  const base = CORS_PROXIES
    .map((p, i) => ({ proxy: p, idx: i, stats: _proxyStats[i] }))
    .sort((a, b) => {
      // Primero los que han funcionado, luego por velocidad
      const aScore = a.stats.ok * 100 - a.stats.fail * 50 - a.stats.ms / 100;
      const bScore = b.stats.ok * 100 - b.stats.fail * 50 - b.stats.ms / 100;
      return bScore - aScore;
    })
    .map(x => ({ ...x.proxy, _idx: x.idx }));

  if (customProxyUrl) {
    // El proxy personalizado ocupa la posición 0 siempre, con modo raw
    return [{ url: customProxyUrl, mode: 'raw', _idx: -1 }, ...base];
  }
  return base;
}

// ── Diagnóstico de proxies — exportado para el botón de configuración ─────────
async function testAllProxies() {
  const testUrl = 'https://httpbin.org/get';
  const results = [];
  const customProxyUrl = localStorage.getItem('gordi_custom_proxy')?.trim();
  const proxiesToTest = [
    ...(customProxyUrl ? [{ url: customProxyUrl, mode: 'raw', label: '⭐ Tu proxy' }] : []),
    ...CORS_PROXIES.map(p => ({ ...p, label: p.url.split('/')[2] })),
  ];
  for (const proxy of proxiesToTest) {
    const t0 = Date.now();
    try {
      const fullUrl = proxy.url + encodeURIComponent(testUrl);
      const res = await fetch(fullUrl, { signal: AbortSignal.timeout(7000) });
      const content = proxy.mode === 'allorigins'
        ? (await res.json()).contents || ''
        : await res.text();
      const ms = Date.now() - t0;
      results.push({ label: proxy.label, ok: res.ok && content.length > 50, ms });
    } catch (e) {
      results.push({ label: proxy.label, ok: false, ms: Date.now() - t0, err: e.message });
    }
  }
  return results;
}

async function fetchWithProxy(targetUrl, timeoutMs = 9000) {
  // FIX-SCRAPING 2026: Detección activa de proxies saturados (429/503)
  const sortedProxies = _getSortedProxies();

  for (const proxy of sortedProxies) {
    const t0 = Date.now();
    try {
      const fullUrl = proxy.url + encodeURIComponent(targetUrl);
      const res = await fetch(fullUrl, { 
        signal: AbortSignal.timeout(timeoutMs),
        headers: { 'Cache-Control': 'no-cache' } 
      });

      // Si el proxy responde que está saturado, penalizarlo fuertemente en esta sesión
      if (res.status === 429 || res.status === 503 || res.status === 403) {
        if (proxy._idx >= 0) _proxyStats[proxy._idx].fail += 5; 
        continue;
      }

      if (!res.ok) {
        if (proxy._idx >= 0) _proxyStats[proxy._idx].fail++;
        continue;
      }

      let content = '';
      if (proxy.mode === 'allorigins') {
        const j = await res.json();
        content = j.contents || '';
      } else {
        content = await res.text();
      }

      // Validación de contenido: evitar páginas de error comunes envueltas en 200 OK
      const isErrorPage = /access denied|forbidden|blocked|security check|cloudflare|hcaptcha/i.test(content.slice(0, 2000));
      
      if (content.length >= 200 && !isErrorPage) {
        const ms = Date.now() - t0;
        if (proxy._idx >= 0) {
          _proxyStats[proxy._idx].ok++;
          // Media móvil ponderada para el tiempo de respuesta
          _proxyStats[proxy._idx].ms = Math.round((_proxyStats[proxy._idx].ms * 0.6) + (ms * 0.4));
        }
        return content;
      }
      
      if (proxy._idx >= 0) _proxyStats[proxy._idx].fail++;
    } catch (err) {
      if (proxy._idx >= 0) _proxyStats[proxy._idx].fail++;
      // Si el error es timeout, es una señal de que el proxy es lento
      if (err.name === 'TimeoutError' && proxy._idx >= 0) _proxyStats[proxy._idx].ms = Math.max(_proxyStats[proxy._idx].ms, timeoutMs);
    }
  }

  // ── Idea 1: Fallback a Wayback Machine (Archive.org) ──────────────────────
  if (targetUrl.startsWith('http')) {
    try {
      const archiveUrl = `https://web.archive.org/web/2/${targetUrl}`;
      const res = await fetch(archiveUrl, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const txt = await res.text();
        if (txt.length >= 200) return txt;
      }
    } catch {}
  }

  // ── Último recurso: fetch directo ──────────────────────────────────────────
  try {
    const res = await fetch(targetUrl, {
      signal: AbortSignal.timeout(Math.min(timeoutMs, 4000)),
      mode: 'cors',
      headers: { 'Accept': 'text/html' }
    });
    if (res.ok) return await res.text();
  } catch {}
  return '';
}



// ── Palabras clave de roles decisores (ES + EN) ──────────────────────────────
const ROLE_KEYWORDS = [
  'gerente general','director general','director ejecutivo','director de operaciones',
  'director','gerente','propietario','propietaria','ceo','coo','cfo','cio',
  'responsable','manager','jefe','encargado','encargada','administrador','administradora',
  'socio','socia','fundador','fundadora','presidente','presidenta',
  'facility manager','operations manager','director de instalaciones',
  'director de compras','director de obra','project manager'
];

// ── Dominios a ignorar en emails ─────────────────────────────────────────────
const EMAIL_BLACKLIST = new Set([
  'example.com','test.com','domain.com','email.com','mail.com',
  'wixpress.com','wix.com','squarespace.com','wordpress.com','shopify.com',
  'sentry.io','google.com','googleapis.com','gstatic.com','googletagmanager.com',
  'facebook.com','twitter.com','instagram.com','linkedin.com','youtube.com',
  'w3.org','schema.org','fontawesome.com','bootstrap.com','jquery.com',
  'cloudflare.com','cdnjs.com','amazonaws.com','cloudfront.net',
  'hotjar.com','intercom.io','hubspot.com','mailchimp.com','sendgrid.net',
  'doubleclick.net','googleadservices.com','analytics.google.com',
  'gravatar.com','akismet.com','yoast.com','elementor.com',
]);

// ── Prefijos de email prioritarios (más probables que sean del decisor) ──────
const EMAIL_PRIORITY_PREFIXES = [
  'info','contacto','contact','hola','hello','direccion','director','gerencia',
  'gerente','administracion','admin','ventas','comercial','gestion',
  'oficina','secretaria','recepcion','comunicacion'
];

// ── Patrones redes sociales (más robustos, capturan URL completa limpia) ─────
const SOCIAL_REGEXES = {
  instagram: [
    /https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9_.]{1,30})\/?(?:[^"'\s<>])?/gi,
    /instagram\.com\/([A-Za-z0-9_.]{1,30})/gi,
  ],
  facebook: [
    /https?:\/\/(?:www\.)?facebook\.com\/([A-Za-z0-9_./-]{2,60})\/?(?:[^"'\s<>])?/gi,
    /fb\.com\/([A-Za-z0-9_./-]{2,40})/gi,
  ],
  linkedin: [
    /https?:\/\/(?:www\.)?linkedin\.com\/(company|in)\/([A-Za-z0-9_.-]{2,60})\/?/gi,
  ],
  twitter: [
    /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/([A-Za-z0-9_]{1,30})\/?/gi,
  ],
  youtube: [
    /https?:\/\/(?:www\.)?youtube\.com\/(?:channel|c|user)\/([A-Za-z0-9_-]{2,60})\/?/gi,
    /https?:\/\/(?:www\.)?youtube\.com\/@([A-Za-z0-9_.-]{2,40})\/?/gi,
  ],
};

// Cuentas genéricas de redes a ignorar
const SOCIAL_BLACKLIST = new Set([
  'sharer','share','login','signup','intent','hashtag',
  'home','feed','search','explore','reels','stories',
  'pages','groups','events','marketplace','watch','shorts',
]);

// ── Helper: extraer URL social limpia ────────────────────────────────────────
function extractSocialUrl(html, network) {
  const regexes = SOCIAL_REGEXES[network] || [];
  const candidates = new Set();
  for (const regex of regexes) {
    let match;
    regex.lastIndex = 0;
    while ((match = regex.exec(html)) !== null) {
      const handle = (match[2] || match[1] || '').toLowerCase().replace(/\/$/, '');
      if (!handle || handle.length < 2) continue;
      if (SOCIAL_BLACKLIST.has(handle)) continue;
      if (/^(p|r|s|\d{1,2})$/.test(handle)) continue; // paths cortos probablemente no son handles
      candidates.add(match[0].split(/['"?\s]/)[0]); // URL limpia
    }
  }
  return [...candidates][0] || '';
}

// ── Helper: limpiar texto HTML ────────────────────────────────────────────────
function stripHtml(str) {
  return str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ─── CAPA 1: Google Places — Multi-query con dedup ──────────────────────────
// Radio center coordinates (set when geocoding location)
let radiusCenterCoords = null;

function clearRadiusCenter() {
  radiusCenterCoords = null;
  const lbl = document.getElementById('radius-center-label');
  if (lbl) lbl.textContent = 'Centrado en la ciudad introducida';
}



// ══════════════════════════════════════════════════════════════════════════
// ██  MÓDULO: SEARCH
// ──  Búsqueda de empresas via Google Places API
// ──  Funciones: geocodeLocation, buildSearchGrid, fetchPlaces, searchBusinesses
// ══════════════════════════════════════════════════════════════════════════

async function geocodeLocation(locationStr) {
  // Use Google Geocoding API to get lat/lng for the location string
  const apiKey = localStorage.getItem('gordi_api_key');
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationStr)}&key=${apiKey}&language=es`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    if (data.results?.[0]?.geometry?.location) {
      return data.results[0].geometry.location; // { lat, lng }
    }
  } catch {}
  return null;
}

// ─── Haversine — distancia real en km entre dos coordenadas ──────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ─── Enriquecer distancias reales desde el centro de búsqueda ────────────────
async function enrichDistances(companies, locationStr) {
  try {
    const center = await geocodeLocation(locationStr);
    if (!center) return companies;
    radiusCenterCoords = center;
    return companies.map(c => {
      if (c.lat != null && c.lng != null) {
        return { ...c, distKm: Math.round(haversineKm(center.lat, center.lng, c.lat, c.lng) * 10) / 10 };
      }
      return c;
    });
  } catch { return companies; }
}

// ─── HELPERS GRID SEARCH ────────────────────────────────────────────────────
// Geocodifica una dirección y devuelve {lat, lng}
// ── Esperar a que el SDK de Google Maps esté disponible ──────────────────────
// Race condition: loadGoogleMapsScript inyecta un <script> asíncrono.
// Si el usuario pulsa "Buscar" antes de que cargue, google es undefined → crash.
// Esta función espera hasta 15 segundos antes de lanzar un error claro.
async function waitForGoogleMaps(timeoutMs = 15000) {
  if (typeof google !== 'undefined' && google.maps) return; // ya cargado

  // Si no hay API Key ni script en el DOM, cargar ahora
  const apiKey = localStorage.getItem('gordi_api_key');
  if (apiKey && !document.getElementById('google-maps-script')) {
    loadGoogleMapsScript(apiKey);
  }
  if (!apiKey) {
    throw new Error('API Key de Google no configurada. Ve a Configuración → API Keys.');
  }

  // Esperar con polling cada 200ms hasta que google.maps esté disponible
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      if (typeof google !== 'undefined' && google.maps) {
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        reject(new Error('Google Maps tardó demasiado en cargar. Recarga la página (F5) e inténtalo de nuevo.'));
      } else {
        setTimeout(check, 200);
      }
    };
    check();
  });
}

async function geocodeSearch(locationStr) {
  await waitForGoogleMaps();
  const { Geocoder } = await google.maps.importLibrary('geocoding');
  const geocoder = new Geocoder();
  return new Promise((resolve, reject) => {
    geocoder.geocode({ address: locationStr, language: 'es' }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location;
        resolve({ lat: loc.lat(), lng: loc.lng() });
      } else {
        reject(new Error('No se pudo geocodificar: ' + locationStr));
      }
    });
  });
}

// FIX 5: Mapa de distritos reales por ciudad
// Las ciudades tienen formas irregulares — un grid cuadrado cubre mal las zonas periféricas.
// Usar distritos reales garantiza cobertura uniforme y más resultados únicos.
const CITY_DISTRICTS = {
  'madrid': [
    'Salamanca Madrid','Chamberí Madrid','Retiro Madrid','Centro Madrid',
    'Tetuán Madrid','Carabanchel Madrid','Vallecas Madrid','Hortaleza Madrid',
    'Alcobendas Madrid','Pozuelo de Alarcón','Getafe Madrid','Leganés Madrid',
    'Las Rozas Madrid','Majadahonda Madrid','Alcorcón Madrid'
  ],
  'barcelona': [
    'Eixample Barcelona','Gràcia Barcelona','Sants Barcelona','Sant Martí Barcelona',
    'Sarrià Sant Gervasi Barcelona','Nou Barris Barcelona','Sant Andreu Barcelona',
    'Horta Guinardó Barcelona','Les Corts Barcelona','Hospitalet de Llobregat'
  ],
  'valencia': [
    'Eixample Valencia','Campanar Valencia','Rascanya Valencia',
    'Benicalap Valencia','Poblats Marítims Valencia','Quatre Carreres Valencia',
    'Jesús Valencia','Patraix Valencia','L\'Olivereta Valencia'
  ],
  'sevilla': [
    'Centro Sevilla','Triana Sevilla','Nervión Sevilla','Los Remedios Sevilla',
    'Macarena Sevilla','Cerro Amate Sevilla','San Pablo Santa Justa Sevilla'
  ],
  'bilbao': [
    'Abando Bilbao','Deusto Bilbao','Begoña Bilbao','Uribarri Bilbao',
    'Basurto Bilbao','Getxo Bilbao','Barakaldo Bilbao'
  ],
  'zaragoza': [
    'Centro Zaragoza','Delicias Zaragoza','Universidad Zaragoza',
    'Oliver Valdefierro Zaragoza','La Almozara Zaragoza'
  ],
  'málaga': [
    'Centro Málaga','Cruz de Humilladero Málaga','Campanillas Málaga',
    'Palma Palmilla Málaga','Martiricos La Trinidad Málaga'
  ],
};

// Devuelve distritos adicionales si la ciudad está en el mapa
function getCityDistricts(locationStr) {
  const loc = locationStr.toLowerCase().trim();
  for (const [city, districts] of Object.entries(CITY_DISTRICTS)) {
    if (loc.includes(city) || loc === city) return districts;
  }
  return [];
}

// ─── HELPER CENTRALIZADO: locationBias para Google Places API v3 ──────────────
// IMPORTANTE: La Places API v3 (Place.searchByText) NO acepta el formato
// { circle: { center, radius } } — solo acepta un bounding box rectangular.
// Esta función es el ÚNICO lugar donde se construye locationBias.
// Si Google cambia el formato en el futuro, solo hay que tocar AQUÍ.
//
// @param {number} lat       - Latitud del centro
// @param {number} lng       - Longitud del centro
// @param {number} radiusM   - Radio en METROS
// @returns {Object}         - Bounding box { south, west, north, east }
function buildLocationBias(lat, lng, radiusM) {
  const latDelta = radiusM / 111320;
  const lngDelta = radiusM / (111320 * Math.cos(lat * Math.PI / 180));
  return {
    south: lat - latDelta,
    west:  lng - lngDelta,
    north: lat + latDelta,
    east:  lng + lngDelta,
  };
}

// Genera una cuadrícula de puntos dentro del radio dado (en km)
// gridSize = número de celdas por lado (2=4 puntos, 3=9 puntos, 4=16 puntos...)
function buildSearchGrid(centerLat, centerLng, radiusKm, gridSize) {
  const points = [];
  // 1° lat ≈ 111 km; 1° lng ≈ 111 km * cos(lat)
  const latDeg = radiusKm / 111;
  const lngDeg = radiusKm / (111 * Math.cos(centerLat * Math.PI / 180));
  const step = 2 / (gridSize - 1 || 1);
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = centerLat + latDeg * (-1 + i * step);
      const lng = centerLng + lngDeg * (-1 + j * step);
      // Solo incluir puntos dentro del círculo (distancia al centro <= radio)
      const dLat = (lat - centerLat) * 111;
      const dLng = (lng - centerLng) * 111 * Math.cos(centerLat * Math.PI / 180);
      if (Math.sqrt(dLat*dLat + dLng*dLng) <= radiusKm * 1.1) {
        points.push({ lat, lng });
      }
    }
  }
  return points;
}

// Convierte un resultado de Place API a objeto empresa normalizado
function normalizePlaceResult(p) {
  return {
    name:          p.displayName || 'Sin nombre',
    address:       p.formattedAddress || '',
    rating:        p.rating || null,
    ratingCount:   p.userRatingCount || 0,
    website:       p.websiteURI || '',
    placeId:       p.id || '',
    phone:         p.internationalPhoneNumber || p.nationalPhoneNumber || '',
    types:         (p.types || []).join(', '),
    status:        p.businessStatus || '',
    description:   p.editorialSummary || '',
    priceLevel:    p.priceLevel || null,
    hasParking:    p.parkingOptions ? Object.values(p.parkingOptions).some(v => v === true) : null,
    isAccessible:  p.accessibilityOptions?.wheelchairAccessibleEntrance || null,
    lat:           p.location?.lat() ?? null,
    lng:           p.location?.lng() ?? null,
    signals:       [],
    webLoadMs:     null,
    sslValid:      null,
    hasSitemap:    false,
    techStack:     [],
    email: '', emails: [],
    decision_maker: '',
    instagram: '', facebook: '', linkedin: '', twitter: '', youtube: '',
    distKm:        null,
    enriched: false, enrichSource: [],
  };
}

async function fetchPlaces(segment, location, maxResults) {
  const apiKey = localStorage.getItem('gordi_api_key');
  if (!apiKey) throw new Error('API Key de Google no configurada. Ve a Configuración.');

  await waitForGoogleMaps();
  const { Place } = await google.maps.importLibrary('places');
  const queries = getSegmentQueries(segment);
  const seenIds = new Set();
  const allPlaces = [];
  const exhaustive = maxResults >= 9999;
  const effectiveMax = exhaustive ? 500 : maxResults; // Cap a 500 en modo exhaustivo

  // Determinar radio de búsqueda del usuario
  const radiusKm = parseInt(document.getElementById('plan-radius')?.value || 10);

  // Decidir estrategia según maxResults
  // ≤20 → búsqueda simple (1 punto central)
  // ≤100 → grid 2×2 (4 puntos)
  // ≤200 → grid 3×3 (9 puntos)
  // ≤500 / exhaustivo → grid 4×4 (16 puntos)
  let gridSize = 1;
  if (effectiveMax > 20)  gridSize = 2;
  if (effectiveMax > 100) gridSize = 3;
  if (effectiveMax > 200) gridSize = 4;

  // Geocodificar el centro de búsqueda
  let searchPoints = [{ lat: null, lng: null, label: location }];
  try {
    const center = await geocodeSearch(location);
    if (gridSize === 1) {
      searchPoints = [{ ...center, label: location }];
    } else {
      const grid = buildSearchGrid(center.lat, center.lng, radiusKm, gridSize);
      searchPoints = grid.map((pt, i) => ({ ...pt, label: location }));
      logEnrich(`  → Grid ${gridSize}×${gridSize}: ${grid.length} subzonas sobre ${radiusKm}km de radio`);
    }

    // FIX 5: Añadir distritos reales de la ciudad si están disponibles
    // Un grid cuadrado cubre mal ciudades irregulares (Madrid, Barcelona...)
    // Los distritos garantizan cobertura real donde están los negocios
    const districts = getCityDistricts(location);
    if (districts.length && effectiveMax > 50) {
      const districtPoints = districts.map(d => ({ lat: null, lng: null, label: d }));
      searchPoints = [...searchPoints, ...districtPoints];
      logEnrich(`  → ${districts.length} distritos de ${location} añadidos como puntos de búsqueda extra`);
    }
  } catch(e) {
    // Si falla el geocoding, usar búsqueda simple por nombre
    logEnrich(`  ⚠️ Geocoding falló, usando búsqueda central: ${e.message}`);
    searchPoints = [{ lat: null, lng: null, label: location }];
  }

  // Iterar sobre puntos del grid × queries del segmento
  for (const point of searchPoints) {
    if (!exhaustive && allPlaces.length >= effectiveMax) break;

    for (const query of queries) {
      if (!exhaustive && allPlaces.length >= effectiveMax) break;
      try {
        const request = {
          textQuery: point.lat
            ? `${query} en ${point.label || location}`   // Incluir ubicación siempre, aunque haya locationBias
            : `${query} en ${location}`,
          fields: [
            'displayName','formattedAddress','rating','websiteURI','id',
            'nationalPhoneNumber','internationalPhoneNumber',
            'regularOpeningHours','types','userRatingCount','businessStatus',
            'editorialSummary','priceLevel','parkingOptions','accessibilityOptions','location',
          ],
          language: 'es',
          maxResultCount: 20, // Máximo que permite la API por llamada
        };

        // Añadir bias geográfico — usar SIEMPRE buildLocationBias(), nunca construir aquí
        if (point.lat) {
          const cellRadiusM = Math.max(500, (radiusKm * 1000) / gridSize);
          request.locationBias = buildLocationBias(point.lat, point.lng, cellRadiusM);
        }

        const { places } = await Place.searchByText(request);
        if (!places?.length) continue;

        // ── FILTRO DE EXCLUSIÓN: tipos de negocio no deseados ──────────────────
        // Se aplica ANTES de añadir al resultado para no contaminar el pool.
        const EXCLUDED_TYPES = new Set([
          'car_repair','car_dealer','car_wash','auto_parts_store',
          'car_rental','taxi_service','moving_company','storage',
          'gas_station','parking','vehicle_registration','driving_school',
          'motorcycle_dealer','bicycle_store',
        ]);
        const EXCLUDED_NAME_PATTERNS = /taller\s*(mecánico|mecanico|auto|automovil|automóvil|coches?|vehiculos?|motor)|mecánico|mecanico\s+auto|chapa\s*y\s*pintura|automoción|autoservice|car\s*service|garaje\s*(mecán|taller)|talleres?\s+\w+\s+(s\.?l\.?|s\.?a\.?)/i;

        let newInThisQuery = 0;
        for (const p of places) {
          if (seenIds.has(p.id)) continue;
          if (p.businessStatus === 'CLOSED_PERMANENTLY') continue;
          // Excluir tipos de negocio no deseados
          const pTypes = (p.types || []);
          if (pTypes.some(t => EXCLUDED_TYPES.has(t))) continue;
          // Excluir por nombre si coincide con patrón de taller mecánico
          const pName = (p.displayName || '').toLowerCase();
          if (EXCLUDED_NAME_PATTERNS.test(pName)) continue;
          seenIds.add(p.id);
          allPlaces.push(normalizePlaceResult(p));
          newInThisQuery++;
          if (!exhaustive && allPlaces.length >= effectiveMax) break;
        }

        // Log de progreso en modo exhaustivo
        if (exhaustive || effectiveMax > 100) {
          logEnrich(`  → ${allPlaces.length} empresas únicas encontradas...`);
        }

        await sleep(250); // Pausa entre llamadas API
      } catch(e) {
        console.warn('Query fallida:', query, e.message);
      }
    }
    if (gridSize > 1) await sleep(100); // Pausa entre puntos del grid
  }

  logEnrich(`✅ Cobertura total: ${allPlaces.length} empresas únicas (${seenIds.size} IDs deduplicados)`, 'ok');
  return allPlaces;
}

// ─── CACHÉ DE ENRIQUECIMIENTO — TTL ADAPTATIVO ────────────────────────────────
// MEJORA 5: TTL adaptativo según calidad:
//   · Con email confirmado → 30 días (dato fiable, raramente cambia)
//   · Enriquecido pero sin email → 7 días (igual que antes)
//   · Sin enriquecer / falló → 2 días (vale la pena reintentar pronto)
const ENRICH_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // fallback base (7 días)

function getEnrichTTL(data) {
  if (data && data.email) return 30 * 24 * 60 * 60 * 1000;  // 30 días — email confirmado
  if (data && data.enriched) return 7 * 24 * 60 * 60 * 1000; // 7 días — enriquecido sin email
  return 2 * 24 * 60 * 60 * 1000;                            // 2 días — falló / sin datos
}

function getCachedEnrich(domain) {
  try {
    const key = 'gordi_ecache_' + domain.replace(/[^a-z0-9]/gi, '_').slice(0, 60);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, ttl, data } = JSON.parse(raw);
    // MEJORA 5: respetar el TTL guardado junto al dato (adaptativo), o fallback base
    const effectiveTTL = ttl || ENRICH_CACHE_TTL;
    if (Date.now() - ts > effectiveTTL) { localStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
}

function setCachedEnrich(domain, data) {
  try {
    const key = 'gordi_ecache_' + domain.replace(/[^a-z0-9]/gi, '_').slice(0, 60);
    // Guardar solo los campos enriquecidos (no todo el objeto company)
    const toCache = {
      email: data.email, emails: data.emails, phone: data.phone,
      decision_maker: data.decision_maker, description: data.description,
      instagram: data.instagram, facebook: data.facebook,
      linkedin: data.linkedin, twitter: data.twitter, youtube: data.youtube,
      signals: data.signals, techStack: data.techStack,
      enrichSource: data.enrichSource, enriched: data.enriched,
      domainAge: data.domainAge, domainYear: data.domainYear,
      hasSitemap: data.hasSitemap, webLoadMs: data.webLoadMs,
    };
    // MEJORA 5: TTL adaptativo según calidad del resultado
    const ttl = getEnrichTTL(toCache);
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), ttl, data: toCache }));
  } catch { /* localStorage lleno, ignorar */ }
}

function purgeStaleCaches() {
  try {
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('gordi_ecache_')) continue;
      try {
        const { ts } = JSON.parse(localStorage.getItem(k) || '{}');
        if (!ts || Date.now() - ts > ENRICH_CACHE_TTL) toRemove.push(k);
      } catch { toRemove.push(k); }
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  } catch {}
}

// ─── CAPA 2: Web Scraping PRO ─────────────────────────────────────────────────
async function enrichFromWeb(company) {
  if (!company.website) return company;

  // ── Comprobar caché ──────────────────────────────────────────────────────
  const domainKey = extractDomain(company.website) || company.website;
  const cached = getCachedEnrich(domainKey);
  if (cached) {
    // Mezclar datos cacheados con los actuales (no sobreescribir si ya tenemos datos)
    Object.keys(cached).forEach(k => {
      if (cached[k] !== undefined && cached[k] !== null && cached[k] !== '') {
        if (Array.isArray(cached[k]) && Array.isArray(company[k])) {
          company[k] = [...new Set([...company[k], ...cached[k]])];
        } else if (!company[k]) {
          company[k] = cached[k];
        }
      }
    });
    if (!company.enrichSource.includes('Caché')) company.enrichSource.push('Caché');
    return company;
  }

  let html = '';
  // FIX 1: Medir el tiempo del fetch original — antes se hacía un 2º fetch idéntico
  // solo para medir velocidad (línea ~3892), duplicando todas las peticiones al proxy.
  // Ahora medimos el tiempo del fetch que ya necesitamos hacer de todas formas.
  const t0Fetch = Date.now();
  try {
    html = await fetchWithProxy(company.website, 10000); // 10s: proxy añade ~2-4s de latencia extra
  } catch { return company; }
  company.webLoadMs = Date.now() - t0Fetch;
  if (!html || html.length < 200) {
    // Todos los proxies fallaron — marcar como intento fallido para no reintentar desde caché
    company.enrichSource.push('Proxy-fallo');
    return company;
  }

  // ─── 0. SSL / HTTPS check ────────────────────────────────────────────────
  try {
    const url = company.website;
    if (/^http:\/\//i.test(url)) {
      company.sslValid = false;
      company.signals.push('🔓 Sin HTTPS — web sin cifrar, señal de abandono tecnológico');
      if (!company.enrichSource.includes('SSL:HTTP')) company.enrichSource.push('SSL:HTTP');
    } else if (/^https:\/\//i.test(url)) {
      if (/certificate|ssl.*error|expired.*cert|cert.*expired|ssl_error/i.test(html)) {
        company.sslValid = false;
        company.signals.push('⚠️ SSL caducado detectado — web con certificado expirado');
      } else {
        company.sslValid = true;
      }
    }
  } catch {}

  const domain = extractDomain(company.website) || '';
  const domainRoot = domain.split('.')[0] || '';

  // ─── 1. JSON-LD / Schema.org (fuente más fiable) ─────────────────────────
  const jsonLdBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of jsonLdBlocks) {
    try {
      const ld = JSON.parse(block[1].trim());
      const items = Array.isArray(ld) ? ld : [ld, ...(ld['@graph'] || [])];
      for (const item of items) {
        if (!item) continue;
        // Email
        if (item.email && !company.email) {
          const e = item.email.replace('mailto:','').trim().toLowerCase();
          if (isValidEmail(e)) { company.email = e; company.enrichSource.push('JSON-LD'); }
        }
        // Teléfono
        if (item.telephone && !company.phone) company.phone = item.telephone.trim();
        // Descripción
        if (item.description && !company.description)
          company.description = stripHtml(item.description).slice(0, 220);
        // Nombre alternativo
        if (item.name && !company.description)
          company.description = stripHtml(item.name).slice(0, 220);
        // Fundador / director
        if (!company.decision_maker) {
          const person = item.founder || item.employee || item.author || item.creator;
          if (person?.name) {
            const role = item.founder ? 'Fundador/a' : (item.jobTitle || 'Responsable');
            company.decision_maker = `${person.name} (${role})`;
          }
        }
        // Redes sociales en sameAs
        const sameAs = Array.isArray(item.sameAs) ? item.sameAs : (item.sameAs ? [item.sameAs] : []);
        for (const url of sameAs) {
          if (!company.instagram && /instagram\.com/i.test(url)) company.instagram = url;
          if (!company.facebook  && /facebook\.com/i.test(url))  company.facebook  = url;
          if (!company.linkedin  && /linkedin\.com/i.test(url))  company.linkedin  = url;
          if (!company.twitter   && /(?:twitter|x)\.com/i.test(url)) company.twitter = url;
          if (!company.youtube   && /youtube\.com/i.test(url))   company.youtube   = url;
        }
      }
    } catch { /* JSON malformado, ignorar */ }
  }

  // ─── 2. Meta tags ────────────────────────────────────────────────────────
  if (!company.description) {
    const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{20,300})["']/i)
                  || html.match(/<meta[^>]+content=["']([^"']{20,300})["'][^>]+name=["']description["']/i);
    if (metaDesc) company.description = metaDesc[1].trim();
  }
  if (!company.description) {
    const og = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']{20,300})["']/i)
             || html.match(/<meta[^>]+content=["']([^"']{20,300})["'][^>]+property=["']og:description["']/i);
    if (og) company.description = og[1].trim();
  }

  // ─── 3. Extracción de emails ─────────────────────────────────────────────
  // Deshabilitar obfuscación tipo "info [at] empresa [dot] com"
  const deobfHtml = html
    .replace(/\[at\]/gi, '@').replace(/\(at\)/gi, '@').replace(/ at /gi, '@')
    .replace(/\[dot\]/gi, '.').replace(/\(dot\)/gi, '.').replace(/ dot /gi, '.');

  // Buscar también en atributos href="mailto:..."
  const mailtoEmails = [...deobfHtml.matchAll(/href=["']mailto:([^"'?\s]+)/gi)]
    .map(m => m[1].toLowerCase().trim());

  // Regex general
  const rawRegex = /[a-zA-Z0-9._%+\-]{1,64}@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,10}/g;
  const rawEmails = [...new Set([
    ...mailtoEmails,
    ...(deobfHtml.match(rawRegex) || []).map(e => e.toLowerCase()),
  ])];

  const validEmails = rawEmails.filter(e => {
    const parts = e.split('@');
    if (parts.length !== 2) return false;
    const [local, dom] = parts;
    if (local.length < 2 || dom.length < 4) return false;
    if (!dom.includes('.')) return false;
    // Ignorar dominios de bibliotecas/plataformas
    const domLower = dom.toLowerCase();
    for (const bl of EMAIL_BLACKLIST) { if (domLower === bl || domLower.endsWith('.'+bl)) return false; }
    // Ignorar emails con extensiones de archivo
    if (/\.(png|jpg|jpeg|gif|svg|css|js|woff|ttf|eot|ico|webp)$/i.test(e)) return false;
    return true;
  });

  // Ordenar: primero los del dominio propio, luego por prefijo prioritario
  const ownEmails = validEmails.filter(e => {
    const d = e.split('@')[1] || '';
    return d === domain || d.endsWith('.'+domain) || (domainRoot && d.includes(domainRoot));
  });
  const otherEmails = validEmails.filter(e => !ownEmails.includes(e));

  // Priorizar dentro de ownEmails los que tienen prefijos conocidos
  ownEmails.sort((a, b) => {
    const pa = EMAIL_PRIORITY_PREFIXES.findIndex(p => a.startsWith(p));
    const pb = EMAIL_PRIORITY_PREFIXES.findIndex(p => b.startsWith(p));
    return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
  });

  company.emails = [...new Set([...ownEmails, ...otherEmails])].slice(0, 6);
  if (!company.email && company.emails.length) {
    company.email = company.emails[0];
    company.enrichSource.push('Web-email');
  }

  // ─── 3b. Emails ocultos en atributos HTML (alt, title, data-*) ───────────
  if (!company.email) {
    const attrEmailRegex = /(?:alt|title|data-email|data-mail|data-mailto|aria-label)=["']([^"']{5,80}@[^"']{3,40}\.[a-z]{2,8})["']/gi;
    const attrMatches = [...deobfHtml.matchAll(attrEmailRegex)].map(m => m[1].toLowerCase().trim());
    const validAttr = attrMatches.filter(isValidEmail);
    if (validAttr.length) {
      company.email = validAttr[0];
      company.emails = [...new Set([...company.emails, ...validAttr])].slice(0, 6);
      company.enrichSource.push('HTML-attr');
    }
  }

  // ─── 3c. Emails en comentarios HTML ──────────────────────────────────────
  if (!company.email) {
    const commentMatches = [...deobfHtml.matchAll(/<!--[\s\S]*?([a-zA-Z0-9._%+\-]{2,64}@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,10})[\s\S]*?-->/g)]
      .map(m => m[1].toLowerCase()).filter(isValidEmail);
    if (commentMatches.length) {
      company.email = commentMatches[0];
      company.enrichSource.push('HTML-comment');
    }
  }

  // ─── 4. Teléfonos ────────────────────────────────────────────────────────
  if (!company.phone) {
    // href="tel:..."
    const telHref = html.match(/href=["']tel:([\d\s+\-().]{7,20})["']/i);
    if (telHref) {
      company.phone = telHref[1].trim();
    } else {
      // Patrones ES: móviles 6xx/7xx, fijos 8xx/9xx, con o sin +34
      const phoneRegex = /(?:\+34|0034)?[\s.-]?(?:6\d{2}|7[0-9]\d|8\d{2}|9\d{2})[\s.-]?\d{3}[\s.-]?\d{3}/g;
      const phones = deobfHtml.match(phoneRegex);
      if (phones?.length) company.phone = phones[0].replace(/[\s.-]/g, '');
    }
  }

  // ─── 4b. Teléfonos adicionales y WhatsApp ────────────────────────────────
  {
    const phoneRegexAll = /(?:\+34|0034)?[\s.-]?(?:6\d{2}|7[0-9]\d|8\d{2}|9\d{2})[\s.-]?\d{3}[\s.-]?\d{3}/g;
    const allRawPhones = (deobfHtml.match(phoneRegexAll) || [])
      .map(p => p.replace(/[\s.-]/g, '').replace(/^0034/, '+34'));
    company.phones = [...new Set(allRawPhones)].slice(0, 4);

    // WhatsApp: wa.me/XXXXXXXXX o whatsapp.com/send?phone=XXXXXXXXX
    if (!company.whatsapp) {
      const waMatch = html.match(/wa\.me\/(\d{9,15})|whatsapp[^"']*[?&]phone=(\d{9,15})/i);
      if (waMatch) {
        const num = waMatch[1] || waMatch[2];
        company.whatsapp = num.startsWith('34') ? '+' + num : (num.length === 9 ? '+34' + num : '+' + num);
        if (!company.enrichSource.includes('WhatsApp')) company.enrichSource.push('WhatsApp');
      }
    }
  }

  // ─── 5. Redes sociales ───────────────────────────────────────────────────
  if (!company.instagram) company.instagram = extractSocialUrl(html, 'instagram');
  if (!company.facebook)  company.facebook  = extractSocialUrl(html, 'facebook');
  if (!company.linkedin)  company.linkedin  = extractSocialUrl(html, 'linkedin');
  if (!company.twitter)   company.twitter   = extractSocialUrl(html, 'twitter');
  if (!company.youtube)   company.youtube   = extractSocialUrl(html, 'youtube');

  // ─── 6. Decisor — detección avanzada ────────────────────────────────────
  if (!company.decision_maker) {
    // Patrón: "Cargo: Nombre Apellido" o "Nombre Apellido, Cargo"
    const namePattern = /([A-ZÁÉÍÓÚÑÀÈÌÒÙÜ][a-záéíóúñàèìòùü]{1,20}\s+(?:[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{1,20}\s+)?[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{1,25})/;
    const roleStr = ROLE_KEYWORDS.join('|');

    // Patrón 1: Cargo seguido de nombre
    const p1 = new RegExp(`(${roleStr})[^a-záéíóúñ]{0,30}(?:[:–|]\\s*)${namePattern.source}`, 'i');
    const m1 = html.match(p1);
    if (m1) { company.decision_maker = `${m1[2]} (${m1[1]})`; }

    // Patrón 2: Nombre seguido de cargo (típico en páginas de equipo)
    if (!company.decision_maker) {
      const p2 = new RegExp(`${namePattern.source}[^a-záéíóúñ]{0,40}(${roleStr})`, 'i');
      const m2 = html.match(p2);
      if (m2) { company.decision_maker = `${m2[1]} (${m2[2]})`; }
    }

    // Patrón 3: Buscar en meta "author"
    if (!company.decision_maker) {
      const author = html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']{3,60})["']/i);
      if (author) company.decision_maker = `${author[1].trim()} (Autor/a web)`;
    }
  }

  // ─── 7. Descripción fallback: primer párrafo relevante ──────────────────
  if (!company.description) {
    // Buscar primer <p> con contenido razonable
    const paras = [...html.matchAll(/<p[^>]*>([\s\S]{50,400}?)<\/p>/gi)];
    for (const p of paras) {
      const txt = stripHtml(p[1]).trim();
      if (txt.length > 60 && !/copyright|cookie|privacidad|legal|aviso/i.test(txt)) {
        company.description = txt.slice(0, 220);
        break;
      }
    }
  }

  // ─── 8. Scraping profundo: equipo, nosotros, contacto ───────────────────
  // OPTIMIZACIÓN v2.1.1: Procesamos en paralelo para mayor velocidad
  if (!company.email || !company.decision_maker) {
    const baseUrl = company.website.replace(/\/$/, '');
    const deepPaths = ['/contacto', '/contact', '/about', '/nosotros', '/equipo'];
    try {
      const results = await Promise.allSettled(deepPaths.map(path => fetchWithProxy(baseUrl + path, 6000)));
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value && result.value.length > 200) {
          const pageHtml = result.value;
          const path = deepPaths[idx];
          // Extracción de emails
          if (!company.email) {
            const deobf = pageHtml.replace(/\[at\]/gi,'@').replace(/\(at\)/gi,'@').replace(/ at /gi,'@')
              .replace(/\[dot\]/gi,'.').replace(/\(dot\)/gi,'.').replace(/ dot /gi,'.');
            const mailtos = [...deobf.matchAll(/href=["']mailto:([^"'?\s]+)/gi)].map(m=>m[1].toLowerCase().trim());
            const rawEmails = [...new Set([...mailtos, ...(deobf.match(/[a-zA-Z0-9._%+\-]{1,64}@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,10}/g)||[]).map(e=>e.toLowerCase())])];
            const validCtEmails = rawEmails.filter(isValidEmail);
            if (validCtEmails.length) {
              company.email = validCtEmails[0];
              company.emails = [...new Set([...company.emails, ...validCtEmails])].slice(0, 6);
              if (!company.enrichSource.includes('Pág-profunda')) company.enrichSource.push('Pág-profunda');
            }
          }
          // Extracción de decisor
          if (!company.decision_maker && /equipo|team|nosotros|about/i.test(path)) {
            const roleStr = ROLE_KEYWORDS.join('|');
            const namePattern = /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{1,20}\s+(?:[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{1,20}\s+)?[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{1,25})/;
            const p1 = new RegExp(`(${roleStr})[^a-z]{0,30}[:–|]?\\s*${namePattern.source}`, 'i');
            const p2 = new RegExp(`${namePattern.source}[^a-z]{0,40}(${roleStr})`, 'i');
            const m1 = pageHtml.match(p1);
            const m2 = pageHtml.match(p2);
            if (m1) company.decision_maker = `${m1[2]} (${m1[1]})`;
            else if (m2) company.decision_maker = `${m2[1]} (${m2[2]})`;
          }
        }
      });
    } catch {}
  }
  // ─── 8b. Tech Stack Detection (Idea 5) ─────────────────────────────────
  company.techStack = [];
  if (/wp-content|wp-includes|wordpress/i.test(html)) company.techStack.push('WordPress');
  if (/wix\.com|wixstatic/i.test(html)) company.techStack.push('Wix');
  if (/squarespace/i.test(html)) company.techStack.push('Squarespace');
  if (/shopify/i.test(html)) company.techStack.push('Shopify');
  if (/google-analytics|ga4|googletagmanager/i.test(html)) company.techStack.push('Google Analytics');
  if (/facebook-jssdk|fbevents\.js/i.test(html)) company.techStack.push('Facebook Pixel');
  if (company.techStack.length > 0) {
    company.signals.push(`🛠️ Stack: ${company.techStack.join(', ')}`);
  } else {
    company.signals.push('🕸️ Web básica o personalizada (sin CMS detectado)');
  }
  // Detección de web antigua
  if (/<meta[^>]+name=["']generator["'][^>]+content=["'](?:frontpage|dreamweaver|adobe)/i.test(html) || /<table[^>]+border=["']0["'][^>]*>\s*<tr>\s*<td>/i.test(html)) {
    company.signals.push('🦖 Tecnología web obsoleta detectada — urgente modernización');
    company.techStack.push('Legacy');
  }

  // ─── 9. Detección de señales de oportunidad ──────────────────────────────
  if (!company.signals) company.signals = [];

  // Señal: rating bajo (oportunidad de mejora)
  if (company.rating && company.rating < 3.8 && company.ratingCount > 5)
    company.signals.push(`⚠️ Rating bajo (${company.rating}★) — oportunidad de mejora`);

  // Señal: muchas reseñas → negocio activo
  if (company.ratingCount > 100)
    company.signals.push(`🔥 Negocio activo (${company.ratingCount} reseñas)`);

  // Señal: sin web → potencial de digitalización
  if (!company.website)
    company.signals.push('🌐 Sin web detectada — alta necesidad de digitalización');

  // Señal: keywords de reforma/obras en descripción
  if (company.description && /reforma|renovac|ampliación|traslado|nueva sede|obra|apertura/i.test(company.description))
    company.signals.push('🏗️ Señal de obra/reforma detectada en descripción');

  // ─── 10. Detección de tecnología web ampliada (CMS + PMS + Reservas) ────────
  if (html) {
    if (!company.techStack) company.techStack = [];
    // CMS
    if (/wp-content|wordpress/i.test(html))       company.techStack.push('WordPress');
    else if (/shopify/i.test(html))               company.techStack.push('Shopify');
    else if (/wix\.com|wixsite/i.test(html))      company.techStack.push('Wix');
    else if (/squarespace/i.test(html))           company.techStack.push('Squarespace');
    else if (/webflow/i.test(html))               company.techStack.push('Webflow');
    else if (/prestashop/i.test(html))            company.techStack.push('PrestaShop');
    else if (/joomla/i.test(html))                company.techStack.push('Joomla');
    // PMS / Reservas (hoteles)
    if (/cloudbeds/i.test(html))                  company.techStack.push('PMS:Cloudbeds');
    else if (/mews\.com|mewssystems/i.test(html)) company.techStack.push('PMS:Mews');
    else if (/opera.*pms|oracle.*hospitality/i.test(html)) company.techStack.push('PMS:Opera');
    else if (/siteminder/i.test(html))            company.techStack.push('PMS:SiteMinder');
    else if (/booking\.com.*widget|bwidget/i.test(html)) company.techStack.push('Reservas:Booking-Widget');
    // Analítica
    if (/gtag|google-analytics|G-[A-Z0-9]+/i.test(html)) company.techStack.push('GA4');
    if (/fbq|facebook.*pixel/i.test(html))         company.techStack.push('MetaPixel');
    // Sin sistema de reservas online = señal de digitalización baja
    if (company.techStack.length === 0 || company.techStack.every(t => /WordPress|Wix|Joomla|Squarespace/.test(t)))
      company.signals.push('📱 Sin sistema de reservas digital detectado');
    if (company.techStack.length) company.enrichSource.push('Tech:' + company.techStack[0]);
  }

  // ─── 11. Sitemap.xml — detección de páginas clave ──────────────────────────
  // MEJORA — Early-exit de sitemap:
  // El sitemap solo aporta valor en dos casos: (a) encontrar decisor vía teamUrl,
  // (b) detectar URLs con año reciente como señal de actividad.
  // Si ya tenemos email + decisor desde una fuente fiable (JSON-LD / Hunter / Apollo / caché)
  // nos ahorramos el fetch de 5000ms por empresa → en un batch de 3 = hasta 15s ganados.
  const _sitemapSources = company.enrichSource || [];
  const _skipSitemap = !!(
    company.email &&
    company.decision_maker &&
    _sitemapSources.some(s => /JSON-LD|Hunter|Apollo|Caché/.test(s))
  );
  try {
    if (_skipSitemap) { /* early-exit: datos completos, no merece el fetch */ }
    else {
    const sitemapUrl = company.website.replace(/\/$/, '') + '/sitemap.xml';
    const sitemapHtml = await fetchWithProxy(sitemapUrl, 7000); // sitemap puede tardar más via proxy
    if (sitemapHtml && /<loc>/i.test(sitemapHtml)) {
      company.hasSitemap = true;
      const urls = [...sitemapHtml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(m => m[1].trim());
      // Buscar URLs de equipo, blog reciente, inauguraciones
      const teamUrl   = urls.find(u => /equipo|team|nosotros|about|staff/i.test(u));
      const blogUrls  = urls.filter(u => /blog|noticias|news|post/i.test(u)).slice(0, 3);
      const freshUrls = urls.filter(u => /202[34]|202[56]/i.test(u)).slice(0, 3); // URLs con año reciente

      if (freshUrls.length) company.signals.push(`📰 ${freshUrls.length} páginas de contenido reciente (${new Date().getFullYear()-1}-${new Date().getFullYear()})`);

      // Scraping de página de equipo desde sitemap
      if (teamUrl && !company.decision_maker) {
        try {
          const teamHtml = await fetchWithProxy(teamUrl, 7000);
          if (teamHtml) {
            const roleStr = ROLE_KEYWORDS.join('|');
            const namePattern = /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{1,20}\s+(?:[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{1,20}\s+)?[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{1,25})/;
            const p1 = new RegExp(`(${roleStr})[^a-z]{0,30}[:–|]?\s*${namePattern.source}`, 'i');
            const m1 = teamHtml.match(p1);
            if (m1) { company.decision_maker = `${m1[2]} (${m1[1]})`; company.enrichSource.push('Sitemap'); }
          }
        } catch {}
      }
    }
    } // end else (!_skipSitemap)
  } catch {}

  // ─── 12. Velocidad web como señal de abandono tecnológico ───────────────────
  // FIX 1: webLoadMs ya fue medido en el fetch inicial (sin petición extra)
  {
    const loadMs = company.webLoadMs || 0;
    if (loadMs > 4000) {
      company.signals.push(`🐢 Web muy lenta (${(loadMs/1000).toFixed(1)}s) — posible abandono tecnológico`);
    } else if (loadMs > 2000) {
      company.signals.push(`⏱️ Web lenta (${(loadMs/1000).toFixed(1)}s)`);
    }
  }

  // ─── 13. PriceLevel × Rating — señal de oportunidad cruzada ────────────────
  if (company.priceLevel !== null && company.rating) {
    // Hotel caro con rating bajo = en riesgo, máxima urgencia
    if (company.priceLevel >= 3 && company.rating < 4.0)
      company.signals.push(`⚡ Precio alto + rating bajo (${company.rating}★) — riesgo de pérdida de clientes`);
    // Hotel barato con muchas reseñas = potencial sin explotar
    if (company.priceLevel <= 2 && company.ratingCount > 80 && company.rating >= 4.2)
      company.signals.push(`💎 Buena reputación a precio bajo — potencial de subida de categoría`);
  }

  company.enriched = true;

  // ── Guardar en caché ─────────────────────────────────────────────────────
  setCachedEnrich(domainKey, company);

  return company;
}

// ── Validador de email ────────────────────────────────────────────────────────
function isValidEmail(e) {
  if (!e || !e.includes('@')) return false;
  const [local, dom] = e.split('@');
  if (!local || local.length < 2 || !dom || !dom.includes('.')) return false;
  const domLower = dom.toLowerCase();
  for (const bl of EMAIL_BLACKLIST) { if (domLower === bl || domLower.endsWith('.'+bl)) return false; }
  if (/\.(png|jpg|jpeg|gif|svg|css|js|woff)$/i.test(e)) return false;
  return true;
}

// ─── CAPA 3: Hunter.io ────────────────────────────────────────────────────────
async function enrichFromHunter(company) {
  const hunterKey = localStorage.getItem('gordi_hunter_key');
  if (!hunterKey || !company.website) return company;

  try {
    const domain = extractDomain(company.website);
    if (!domain) return company;

    const res = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${hunterKey}&limit=5`,
      { signal: AbortSignal.timeout(8000) }
    );
    const data = await res.json();

    if (data.data?.emails?.length) {
      const hunterEmails = data.data.emails;

      // Elegir mejor email: prioridad a director/manager/ceo
      const priorityEmail = hunterEmails.find(e =>
        /director|ceo|gerente|manager|owner|founder|president/i.test(e.position || '')
      ) || hunterEmails[0];

      if (!company.email) {
        company.email = priorityEmail.value;
        company.enrichSource.push('Hunter.io');
      }

      // Decisor desde Hunter
      if (!company.decision_maker && priorityEmail.first_name) {
        const full = [priorityEmail.first_name, priorityEmail.last_name].filter(Boolean).join(' ');
        const pos  = priorityEmail.position || '';
        company.decision_maker = pos ? `${full} (${pos})` : full;
      }

      // Añadir todos los emails de Hunter (sin duplicados)
      const newEmails = hunterEmails.map(e => e.value).filter(Boolean);
      company.emails = [...new Set([...company.emails, ...newEmails])].slice(0, 6);
    }

    // Descripción de Hunter (tipo empresa)
    if (data.data?.organization && !company.description)
      company.description = data.data.organization;

    // Twitter de Hunter
    if (data.data?.twitter && !company.twitter)
      company.twitter = `https://twitter.com/${data.data.twitter}`;

  } catch (err) {
    console.warn(`Hunter fallido para ${company.name}:`, err.message);
  }

  return company;
}


// ─── CAPA 4: Apollo.io (gratuito, 50 créditos/mes) ────────────────────────────
async function enrichFromApollo(company) {
  const apolloKey = localStorage.getItem('gordi_apollo_key');
  if (!apolloKey || !company.website) return company;

  try {
    const domain = extractDomain(company.website);
    if (!domain) return company;

    // Apollo People Search por dominio — endpoint público
    const res = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': apolloKey,
      },
      body: JSON.stringify({
        api_key: apolloKey,
        q_organization_domains: domain,
        page: 1,
        per_page: 5,
        person_titles: ['director','gerente','ceo','owner','propietario','manager','presidente','coo','responsable'],
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return company;
    const data = await res.json();
    const people = data.people || [];

    if (people.length) {
      // Buscar el de mayor seniority
      const priority = ['c_suite','vp','director','manager','individual_contributor'];
      const best = people.sort((a, b) => {
        const ai = priority.indexOf(a.seniority || '');
        const bi = priority.indexOf(b.seniority || '');
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      })[0];

      // Email (Apollo lo devuelve si está verificado)
      if (!company.email && best.email) {
        company.email = best.email;
        company.enrichSource.push('Apollo.io');
      }

      // Decisor
      if (!company.decision_maker && best.name) {
        const title = best.title || best.seniority || '';
        company.decision_maker = title ? `${best.name} (${title})` : best.name;
        if (!company.enrichSource.includes('Apollo.io')) company.enrichSource.push('Apollo.io');
      }

      // LinkedIn del decisor
      if (!company.linkedin && best.linkedin_url) {
        company.linkedin = best.linkedin_url;
      }

      // Añadir todos los emails encontrados
      const apolloEmails = people.map(p => p.email).filter(Boolean);
      company.emails = [...new Set([...company.emails, ...apolloEmails])].slice(0, 8);

      // Señal: tamaño de empresa
      const orgSize = best.organization?.estimated_num_employees;
      if (orgSize && !company.signals.find(s => s.includes('empleados'))) {
        company.signals.push(`👥 ~${orgSize} empleados (Apollo)`);
      }
    }

    // Datos de la organización
    if (data.organizations?.length) {
      const org = data.organizations[0];
      if (!company.description && org.short_description)
        company.description = org.short_description.slice(0, 220);
      if (!company.linkedin && org.linkedin_url)
        company.linkedin = org.linkedin_url;
    }

  } catch (err) {
    console.warn(`Apollo fallido para ${company.name}:`, err.message);
  }

  return company;
}


// ─── CAPA 5: WHOIS / RDAP (sin key, gratis total) ────────────────────────────
async function enrichFromWhois(company) {
  if (!company.website) return company;
  try {
    const domain = extractDomain(company.website);
    if (!domain) return company;
    // RDAP es el sucesor oficial de WHOIS, API pública sin autenticación
    const res = await fetch(`https://rdap.org/domain/${domain}`, {
      signal: AbortSignal.timeout(6000),
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return company;
    const data = await res.json();

    // Fecha de registro del dominio
    const events = data.events || [];
    const regEvent = events.find(e => e.eventAction === 'registration');
    const updEvent = events.find(e => e.eventAction === 'last changed');
    if (regEvent?.eventDate) {
      const regYear = new Date(regEvent.eventDate).getFullYear();
      const age = new Date().getFullYear() - regYear;
      company.domainAge = age;
      company.domainYear = regYear;
      if (age <= 2) {
        company.signals.push(`🆕 Dominio muy reciente (${regYear}) — empresa nueva`);
      } else if (age >= 15) {
        company.signals.push(`🏛️ Empresa consolidada (web desde ${regYear})`);
      }
    }

    // Registrante (a veces disponible)
    const entities = data.entities || [];
    for (const entity of entities) {
      if (!company.decision_maker && entity.vcardArray) {
        const vcard = entity.vcardArray[1] || [];
        const nameProp = vcard.find(p => p[0] === 'fn');
        const orgProp  = vcard.find(p => p[0] === 'org');
        const candidate = nameProp?.[3] || orgProp?.[3];
        if (candidate && candidate.length > 2 && candidate.length < 60
            && !/privacy|redacted|whoisguard|protect/i.test(candidate)) {
          company.decision_maker = `${candidate} (Registrante)`;
          company.enrichSource.push('WHOIS');
        }
      }
    }

  } catch(e) {
    console.warn('WHOIS fallido:', e.message);
  }
  return company;
}

// ─── CAPA 6: OpenCorporates (sin key para búsquedas básicas) ─────────────────
async function enrichFromOpenCorporates(company) {
  if (!company.name) return company;
  try {
    const query = encodeURIComponent(company.name.split(' ').slice(0,4).join(' '));
    const res = await fetch(
      `https://api.opencorporates.com/v0.4/companies/search?q=${query}&jurisdiction_code=es&per_page=3`,
      { signal: AbortSignal.timeout(7000) }
    );
    if (!res.ok) return company;
    const data = await res.json();
    const companies = data.results?.companies || [];
    if (!companies.length) return company;

    // Buscar el match más probable por nombre similar
    const best = companies.find(r => {
      const ocName = (r.company?.name || '').toLowerCase();
      const ourName = company.name.toLowerCase();
      return ocName.includes(ourName.split(' ')[0]) || ourName.includes(ocName.split(' ')[0]);
    }) || companies[0];

    const corp = best?.company;
    if (!corp) return company;

    // Año de incorporación
    if (corp.incorporation_date) {
      const yr = new Date(corp.incorporation_date).getFullYear();
      company.incorporationYear = yr;
      const age = new Date().getFullYear() - yr;
      if (!company.signals.find(s => s.includes('años')))
        company.signals.push(`🏢 Empresa de ${age} años (fundada ${yr})`);
    }

    // Estado legal
    if (corp.current_status) {
      company.legalStatus = corp.current_status;
      if (/dissolv|liquidat|struck/i.test(corp.current_status)) {
        company.signals.push('⚠️ Empresa en proceso de disolución');
      } else if (/active|activa/i.test(corp.current_status)) {
        if (!company.enrichSource.includes('OpenCorporates'))
          company.enrichSource.push('OpenCorporates');
      }
    }

    // Tipo de empresa
    if (corp.company_type) company.companyType = corp.company_type;

    // Número de registro
    if (corp.company_number) company.regNumber = corp.company_number;

  } catch(e) {
    console.warn('OpenCorporates fallido:', e.message);
  }
  return company;
}

// ─── CAPA 7: Clearbit Logo (sin key, gratis) ──────────────────────────────────
function getClearbitLogo(website) {
  if (!website) return '';
  try {
    const domain = extractDomain(website);
    if (!domain) return '';
    return `https://logo.clearbit.com/${domain}`;
  } catch { return ''; }
}

// ─── DEDUPLICACIÓN por nombre similar ────────────────────────────────────────
// ─── CAPA 7: IA Email Rescue (Gemini Flash) ─────────────────────────────────
async function extractEmailWithAI(websiteUrl, companyName, geminiKey) {
  if (!geminiKey || !websiteUrl) return null;
  try {
    // Obtener HTML de la página web usando el proxy existente
    const html = await fetchWithProxy(websiteUrl, 10000);
    if (!html || html.length < 200) return null;

    // Limpiar HTML → solo texto visible (máximo 3000 chars para no gastar tokens)
    const textSnippet = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000);

    if (textSnippet.length < 100) return null;

    const prompt = `Eres un experto extrayendo emails de contacto de webs de empresas. Busca el email de contacto de la empresa "${companyName}" en este texto extraído de su web. Responde ÚNICAMENTE con el email encontrado, o con la palabra "null" si no hay ninguno. No añadas explicaciones ni texto adicional.\n\nTexto:\n${textSnippet}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(12000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const answer = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim().toLowerCase();

    // Validar que la respuesta sea un email real
    if (answer === 'null' || !answer.includes('@')) return null;
    const emailMatch = answer.match(/[a-zA-Z0-9._%+\-]{1,64}@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,10}/);
    if (emailMatch && isValidEmail(emailMatch[0])) return emailMatch[0];
  } catch { /* Gemini falló, continuar */ }
  return null;
}

function deduplicateResults(results) {
  const seen = new Map(); // normalized name → index
  const deduped = [];

  for (const company of results) {
    // Normalizar nombre: quitar acentos, lowercase, quitar puntuación y sufijos legales
    const normalized = company.name
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/(sl|sa|slp|sau|slu|sll|sc|cb|soc coop|ltd|s\.l\.|s\.a\.)/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Comparar con nombres ya vistos usando similitud básica
    let isDuplicate = false;
    for (const [seenName, seenIdx] of seen.entries()) {
      // Si uno contiene al otro o son muy similares (Levenshtein simplificado)
      if (normalized === seenName ||
          (normalized.length > 5 && seenName.length > 5 &&
           (normalized.startsWith(seenName.substring(0,8)) || seenName.startsWith(normalized.substring(0,8))))) {
        // Conservar el que tenga más datos
        const existing = deduped[seenIdx];
        if ((company.rating || 0) > (existing.rating || 0) ||
            (company.email && !existing.email) ||
            (company.ratingCount || 0) > (existing.ratingCount || 0)) {
          deduped[seenIdx] = company; // Reemplazar con la versión mejor
        }
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seen.set(normalized, deduped.length);
      deduped.push(company);
    }
  }

  return deduped;
}


// ─── CAPA SOCIAL: LinkedIn + Instagram + Facebook Ads + Name Change ───────────
async function enrichFromSocial(company) {
  // ── 3. LinkedIn Company Page (público, sin key) ──────────────────────────
  if (company.linkedin && !company.decision_maker) {
    try {
      const liHtml = await fetchWithProxy(company.linkedin, 8000);
      if (liHtml) {
        // Buscar "Recently hired" o cargos directivos en la página pública
        const expansionSignals = [];
        if (/hiring|contratando|we.re growing|estamos creciendo/i.test(liHtml))
          expansionSignals.push('🚀 Empresa en contratación activa (LinkedIn)');
        if (/new office|nueva oficina|nueva sede|new location/i.test(liHtml))
          expansionSignals.push('🏢 Apertura de nueva sede detectada (LinkedIn)');
        if (/award|premio|reconocimiento|certified/i.test(liHtml))
          expansionSignals.push('🏆 Premio o certificación reciente (LinkedIn)');
        expansionSignals.forEach(s => {
          if (!company.signals.includes(s)) company.signals.push(s);
        });
        // Tamaño de empresa desde LinkedIn
        const sizeMatch = liHtml.match(/(\d[\d,]+)\s*(?:employee|empleado)/i);
        if (sizeMatch && !company.signals.find(s => s.includes('empleados'))) {
          const n = parseInt(sizeMatch[1].replace(',',''));
          if (n > 0) company.signals.push(`👥 ~${n} empleados (LinkedIn)`);
        }
        if (expansionSignals.length) company.enrichSource.push('LinkedIn');
      }
    } catch {}
  }

  // ── 4. Instagram bio — email directo y señales ───────────────────────────
  if (company.instagram && !company.email) {
    try {
      const igUrl = company.instagram.replace(/\/$/, '') + '/';
      const igHtml = await fetchWithProxy(igUrl, 7000);
      if (igHtml) {
        // Email en bio de Instagram
        const bioMatch = igHtml.match(/"biography":"([^"]{0,300})"/);
        if (bioMatch) {
          const bio = bioMatch[1];
          const bioEmail = bio.match(/[a-zA-Z0-9._%+\-]{1,64}@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,10}/);
          if (bioEmail && isValidEmail(bioEmail[0])) {
            company.email = bioEmail[0].toLowerCase();
            company.enrichSource.push('Instagram-bio');
          }
          // Señales en bio
          if (/nuevo|nueva|abrimos|apertura|inauguramos/i.test(bio))
            company.signals.push('📸 Apertura o novedad detectada en bio de Instagram');
          if (/reforma|renovaci|obras/i.test(bio))
            company.signals.push('🏗️ Reforma mencionada en Instagram bio');
        }
        // Número de posts como indicador de actividad
        const postsMatch = igHtml.match(/"edge_owner_to_timeline_media":\{"count":(\d+)/);
        if (postsMatch) {
          const posts = parseInt(postsMatch[1]);
          if (posts < 10) company.signals.push('📱 Instagram poco activo (< 10 publicaciones)');
          else if (posts > 500) company.signals.push('📸 Instagram muy activo (+500 posts) — negocio con presencia digital');
        }
      }
    } catch {}
  }

  // ── 7. Facebook Ads Library — detectar si invierte en publicidad ──────────
  if (company.name) {
    try {
      const q = encodeURIComponent(company.name.split(' ').slice(0,3).join(' '));
      const adRes = await fetch(
        `https://www.facebook.com/ads/library/api/?fields=ad_archive_id,page_name,ad_delivery_start_time&search_terms=${q}&ad_reached_countries=ES&ad_active_status=ACTIVE&limit=3`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (adRes.ok) {
        const adData = await adRes.json();
        const ads = adData.data || [];
        if (ads.length > 0) {
          company.signals.push(`💰 ${ads.length} anuncio(s) activo(s) en Facebook/Instagram — empresa con presupuesto de marketing`);
          company.enrichSource.push('FB-Ads');
        }
      }
    } catch {}
  }

  // ── 10. Detección de cambio de nombre ────────────────────────────────────
  if (company.website && company.name) {
    try {
      const domain = extractDomain(company.website) || '';
      const domainName = domain.split('.')[0].toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
      const companyNorm = company.name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');

      // Si el nombre en Google Maps es muy distinto al dominio web = posible cambio de nombre
      if (domainName.length > 4 && companyNorm.length > 4) {
        const overlap = [...domainName].filter(c => companyNorm.includes(c)).length;
        const similarity = overlap / Math.max(domainName.length, companyNorm.length);
        if (similarity < 0.35) {
          company.signals.push(`🔄 Posible cambio de nombre reciente (Maps: "${company.name}" vs dominio: "${domain}") — nueva gestión`);
        }
      }
    } catch {}
  }

  return company;
}


// ─── CAPA REVIEWS: Análisis de reseñas Google para detectar dolor real ────────
async function enrichFromReviews(company) {
  const apiKey = localStorage.getItem('gordi_api_key');
  if (!apiKey || !company.placeId) return company;
  try {
    // Usar fetchGoogleReviews para aprovechar la doble fuente (Places New + legacy)
    // y el análisis estadístico cuando hay 8+ reseñas
    const reviews = await fetchGoogleReviews(company.placeId);
    if (!reviews.length) return company;

    const PAIN_KEYWORDS = {
      instalaciones: /instalaci[oó]n(?:es)?|cableado|enchufes|luz|iluminaci[oó]n|electricidad|cuadro el[eé]ctrico/i,
      temperatura:   /fr[ií]o|calor(?:es)?|temperatura|aire acondicionado|calefacci[oó]n|t[eé]rmico/i,
      deterioro:     /viejo|antiguo|deteriorado|descuidado|sucio|roto|desperfecto|anticuado|desgastado/i,
      obras:         /obra|reforma|renovaci[oó]n|remodelado|remodelaci[oó]n|construcci[oó]n/i,
      ruido:         /ruido|ac[uú]stica|aisla(?:miento)?|paredes finas|se escucha todo/i,
      humedad:       /humedad|gotera|grieta|hongos|moho|h[uú]medo/i,
      baños:         /ba[ñn]o|aseo|ducha|váter|inodoro|grifo/i,
    };

    // Analizar TODAS las reseñas negativas disponibles (no solo las primeras 5)
    const negativeReviews = reviews.filter(r => r.rating <= 3);
    const painCounts = {}; // {tipo: [{snippet, rating}]}

    for (const review of negativeReviews) {
      const text = review.text || '';
      for (const [type, regex] of Object.entries(PAIN_KEYWORDS)) {
        if (regex.test(text)) {
          if (!painCounts[type]) painCounts[type] = [];
          painCounts[type].push({
            snippet: text.replace(/\n/g, ' ').slice(0, 90),
            rating: review.rating,
            time: review.time || '',
          });
          break; // una reseña = un tipo de dolor (el primero que coincide)
        }
      }
    }

    // Ordenar tipos de dolor por frecuencia (el más mencionado primero)
    const painFound = Object.entries(painCounts)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([type, instances]) => ({
        type,
        count: instances.length,
        snippet: instances[0].snippet,
        rating: Math.min(...instances.map(i => i.rating)),
        instances,
      }));

    if (painFound.length) {
      const top = painFound[0];
      // Señal con temporalidad real si hay stats disponibles
      const isActive   = reviews._stats?.topPains?.find(p => p.label?.includes(top.type))?.isActive;
      const isHistoric = reviews._stats?.topPains?.find(p => p.label?.includes(top.type))?.isHistorical;
      const freqNote = top.count >= 3 ? ` · ${top.count}x mencionado` : '';
      const timeNote = isActive ? ' · ACTIVO (reciente)' : isHistoric ? ' · histórico (puede estar resuelto)' : '';
      company.signals.push(
        `🔥 Problema recurrente: ${top.type}${freqNote}${timeNote} — "${top.snippet.slice(0, 60)}..."`
      );
      company.reviewPain = painFound;
      if (!company.enrichSource.includes('Reviews-Pain')) company.enrichSource.push('Reviews-Pain');
    }

    // Señal de trending si está disponible
    if (reviews._stats?.ratingTrend) {
      const { avgRecent, avgOld, delta } = reviews._stats.ratingTrend;
      if (delta <= -0.4)
        company.signals.push(`📉 Rating cayendo: ${avgOld}★ → ${avgRecent}★ en últimos meses — urgencia alta`);
      else if (delta >= 0.4)
        company.signals.push(`📈 Rating mejorando: ${avgOld}★ → ${avgRecent}★ — puede estar recuperándose`);
    }

    // reviewSummary usa el conjunto completo ahora disponible
    company.reviewSummary = reviews
      .filter(r => r.text)
      .slice(0, 20)
      .map(r => `[${r.rating}\u2605${r.time ? ' \u00B7 ' + r.time : ''}] ${r.text.slice(0, 120)}`)
      .join('\n');

    // Guardar estadísticas si están disponibles (8+ reseñas)
    if (reviews._stats) company.reviewStats = reviews._stats;

  } catch(e) {
    console.warn('enrichFromReviews error:', e.message);
  }
  return company;
}

// ─── CAPA COMPETENCIA: Detectar competidores directos con mejor rating ────────
async function enrichCompetitivePressure(company, location) {
  const apiKey = localStorage.getItem('gordi_api_key');
  if (!apiKey || !company.rating || !company.name) return company;
  try {
    await waitForGoogleMaps();
    const { Place } = await google.maps.importLibrary('places');
    const typeRaw = (company.types || '').split(',')[0]?.trim().replace(/_/g, ' ') || 'negocio';
    const { places } = await Place.searchByText({
      textQuery: `${typeRaw} en ${location}`,
      fields: ['displayName','rating','userRatingCount','id'],
      maxResultCount: 6,
    });

    const competitors = (places || [])
      .filter(p => p.id !== company.placeId && p.rating && p.rating > (company.rating + 0.3) && (p.userRatingCount || 0) > 10)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 2);

    if (competitors.length) {
      const best = competitors[0];
      const diff = (best.rating - company.rating).toFixed(1);
      company.signals.push(
        `\u2694\uFE0F "${best.displayName}" (competidor) tiene +${diff}\u2605 \u00B7 ${best.rating}\u2605 vs ${company.rating}\u2605 — presión competitiva`
      );
      company.competitorBetter = { name: best.displayName, rating: best.rating, diff: parseFloat(diff) };
      if (!company.enrichSource.includes('Competencia')) company.enrichSource.push('Competencia');
    }
  } catch(e) {
    console.warn('enrichCompetitivePressure error:', e.message);
  }
  return company;
}

// ─── CAPA NEWS: Google News RSS (sin key, gratis) ────────────────────────────
async function enrichFromNews(company) {
  if (!company.name) return company;
  try {
    const q = encodeURIComponent('"' + company.name.split(' ').slice(0, 3).join(' ') + '"');
    const rss = await fetchWithProxy(
      `https://news.google.com/rss/search?q=${q}&hl=es&gl=ES&ceid=ES:es`, 5000
    );
    if (!rss || rss.length < 100) return company;

    // Extraer títulos y fechas de publicación
    const titles   = [...rss.matchAll(/<title><!\[CDATA\[([^\]]{10,200})\]\]><\/title>/gi)].slice(1, 6);
    const titles2  = titles.length ? titles : [...rss.matchAll(/<title>([^<]{10,200})<\/title>/gi)].slice(1, 6);
    const pubDates = [...rss.matchAll(/<pubDate>([^<]+)<\/pubDate>/gi)];

    for (let i = 0; i < titles2.length; i++) {
      const title   = stripHtml(titles2[i][1]).trim();
      const pubDate = pubDates[i] ? new Date(pubDates[i][1]) : null;
      const daysAgo = pubDate && !isNaN(pubDate) ? Math.floor((Date.now() - pubDate) / 86400000) : 999;

      if (daysAgo <= 60) {
        let signal = '';
        if (/inaugura|abre|apertura|nuevo local|nueva sede|abierto/i.test(title))
          signal = `📰 Apertura reciente (hace ${daysAgo}d): "${title.slice(0, 60)}"`;
        else if (/contrato|adjudicac|licitac|concurso público/i.test(title))
          signal = `📋 Contrato/licitación (hace ${daysAgo}d): "${title.slice(0, 60)}"`;
        else if (/venta|adquiere|compra|fusión|nuevo propietario/i.test(title))
          signal = `🔄 Operación corporativa (hace ${daysAgo}d): "${title.slice(0, 60)}"`;
        else if (/reforma|renovac|obra|ampliación/i.test(title))
          signal = `🏗️ Obra/reforma en prensa (hace ${daysAgo}d): "${title.slice(0, 60)}"`;
        else if (daysAgo <= 14)
          signal = `🗞️ En prensa esta semana (hace ${daysAgo}d): "${title.slice(0, 60)}"`;

        if (signal && !company.signals.some(s => s.includes(title.slice(0, 20)))) {
          company.signals.push(signal);
          if (!company.enrichSource.includes('Google-News')) company.enrichSource.push('Google-News');
          break; // Solo la noticia más reciente relevante
        }
      }
    }
  } catch { /* Google News falló, ignorar */ }
  return company;
}


// ─── VENTANA DE CONTACTO ÓPTIMA (síncrona, sin API extra) ────────────────────
function detectOptimalContactWindow(company) {
  const type = (company.types || '').toLowerCase();
  let w = null;
  if (/restaurant|bar|cafe|cafeter|bakery|food/.test(type))
    w = { slot: 'Lun–Mié 10:00–11:30', reason: 'Antes del servicio de comidas' };
  else if (/hotel|hostel|lodging|aparthotel/.test(type))
    w = { slot: 'Mar–Jue 09:00–10:00', reason: 'Antes del check-in matinal' };
  else if (/gym|fitness|sports_complex/.test(type))
    w = { slot: 'Lun–Mié 14:00–16:00', reason: 'Hueco entre turno mañana y tarde' };
  else if (/school|university|education|training/.test(type))
    w = { slot: 'Mar–Jue 08:30–09:30', reason: 'Antes de la jornada lectiva' };
  else if (/hospital|clinic|doctor|health|medical/.test(type))
    w = { slot: 'Lun–Mié 13:00–14:00', reason: 'Pausa entre consultas' };
  else if (/store|shop|retail|supermarket/.test(type))
    w = { slot: 'Mar–Jue 09:30–10:30', reason: 'Apertura antes de la afluencia' };
  else
    w = { slot: 'Mar–Mié 08:30–09:30', reason: 'Primera hora antes del trabajo operativo' };
  if (company.decision_maker) {
    const dm = (company.decision_maker || '').toLowerCase();
    if (/director|gerente|ceo|propietario|dueño|owner/.test(dm))
      w = { slot: 'Mar–Mié 07:30–08:30', reason: 'Directivos revisan email antes del día operativo' };
    else if (/manager|jefe|responsable/.test(dm))
      w = { slot: 'Mar–Jue 08:30–09:30', reason: 'Managers activos en primera hora' };
  }
  company.optimalContact = w;
  if (w) company.signals.push('🕐 Mejor contacto: ' + w.slot + ' · ' + w.reason);
  return company;
}

// ─── GOLDEN PROFILE + LOOKALIKE SCORE ────────────────────────────────────────
function buildGoldenProfile() {
  const converted = leads.filter(l =>
    (l.status === 'Cliente' || l.status === 'Convertido' || l.status === 'Cerrado ganado') && !l.archived
  );
  if (converted.length < 2) return null;
  const avgRating      = converted.reduce((s,l) => s + (l.rating     || 0), 0) / converted.length;
  const avgRatingCount = converted.reduce((s,l) => s + (l.ratingCount || 0), 0) / converted.length;
  const segs = converted.map(l => l.segment).filter(Boolean);
  const segCounts = segs.reduce((acc,s) => { acc[s]=(acc[s]||0)+1; return acc; }, {});
  const commonSegments = Object.entries(segCounts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(e=>e[0]);
  const hasEmailRatio  = converted.filter(l => l.email).length          / converted.length;
  const hasDMRatio     = converted.filter(l => l.decision_maker).length / converted.length;
  const allWords = converted.flatMap(l => (l.signals||[]).join(' ').toLowerCase().split(/\s+/));
  const wc = allWords.reduce((acc,w) => { if (w.length>5) acc[w]=(acc[w]||0)+1; return acc; }, {});
  const topKeywords = Object.entries(wc).sort((a,b)=>b[1]-a[1]).slice(0,10).map(e=>e[0]);
  return { avgRating, avgRatingCount, commonSegments, hasEmailRatio, hasDMRatio, topKeywords, count: converted.length };
}

let _goldenProfile = null;

function getLookalikeSimilarity(company) {
  if (!_goldenProfile) _goldenProfile = buildGoldenProfile();
  if (!_goldenProfile) return 0;
  const gp = _goldenProfile;
  let sim = 0;
  sim += Math.max(0, Math.round(30 - Math.abs((company.rating||0) - gp.avgRating) * 20));
  if (gp.commonSegments.includes(company.segment)) sim += 20;
  if (company.email && gp.hasEmailRatio > 0.6) sim += 15;
  if (company.decision_maker && gp.hasDMRatio > 0.5) sim += 10;
  sim += Math.round(Math.min(1, (company.ratingCount||0) / Math.max(1, gp.avgRatingCount)) * 15);
  const sigText = (company.signals||[]).join(' ').toLowerCase();
  sim += Math.min(10, gp.topKeywords.filter(k => sigText.includes(k)).length * 3);
  return Math.min(100, Math.round(sim));
}

// ─── CAPA STREETVIEW: Análisis visual de fachada con Gemini Vision ────────────
async function enrichFromStreetView(company) {
  const apiKey    = localStorage.getItem('gordi_api_key');
  const geminiKey = localStorage.getItem('gordi_gemini_key');
  if (!apiKey || !geminiKey || !company.address) return company;
  try {
    const svUrl = 'https://maps.googleapis.com/maps/api/streetview?size=640x400'
      + '&location=' + encodeURIComponent(company.address)
      + '&fov=90&pitch=0&return_error_code=true&key=' + apiKey;
    const imgRes = await fetch(svUrl, { signal: AbortSignal.timeout(8000) });
    if (!imgRes.ok || !(imgRes.headers.get('content-type')||'').includes('image')) return company;
    const blob   = await imgRes.blob();
    const base64 = await new Promise(res => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });
    if (!base64 || base64.length < 500) return company;
    const gemRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + geminiKey,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [
          { inline_data: { mime_type: 'image/jpeg', data: base64 } },
          { text: 'Analiza esta fachada. ¿Ves signos de deterioro (pintura, óxido, cables sueltos, iluminación vieja)? ¿Parece un local vacío o en obras? Responde en una frase corta enfocada en necesidades de reforma.' }
        ]}]}),
        signal: AbortSignal.timeout(14000) }
    );
    const gemData = await gemRes.json();
    const analysis = gemData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (!analysis) return company;
    company.fachadaAnalysis = analysis;
    company.signals.push('📸 Fachada: ' + analysis.slice(0, 100));
    if (!company.enrichSource.includes('StreetView')) company.enrichSource.push('StreetView');
  } catch(e) { console.warn('enrichFromStreetView:', e.message); }
  return company;
}

// ─── CAPA BORME: Trámites y cambios societarios recientes ─────────────────────
async function enrichFromBorme(company) {
  if (!company.name) return company;
  try {
    const q = encodeURIComponent(company.name.split(' ').slice(0,3).join(' '));
    const d = new Date();
    const url = 'https://boe.es/borme/datos/dias/' + d.getFullYear() + '/'
      + String(d.getMonth()+1).padStart(2,'0') + '/borme_json.php?q=' + q;
    const raw = await fetchWithProxy(url, 6000);
    if (!raw || raw.length < 50) return company;
    let data; try { data = JSON.parse(raw); } catch { return company; }
    const actos = data?.actos || data?.results || [];
    const firstWord = company.name.toLowerCase().split(' ')[0];
    for (const acto of actos.slice(0, 8)) {
      const texto  = (acto.texto || acto.descripcion || '').toLowerCase();
      const nombre = (acto.razon_social || acto.nombre || '').toLowerCase();
      if (firstWord.length > 3 && !nombre.includes(firstWord)) continue;
      if (/constituci.n|nueva sociedad/.test(texto))
        { company.signals.push('🎉 Empresa recién constituida (BORME)'); company.enrichSource.push('BORME'); break; }
      else if (/ampliaci.n de capital/.test(texto))
        { company.signals.push('💰 Ampliación de capital (BORME) — presupuesto disponible'); company.enrichSource.push('BORME'); break; }
      else if (/cambio de domicilio|traslado/.test(texto))
        { company.signals.push('📍 Cambio domicilio (BORME) — mudanza/obra probable'); company.enrichSource.push('BORME'); break; }
      else if (/disoluci.n|liquidaci.n/.test(texto))
        { company.signals.push('⚠️ En disolución (BORME) — descartar'); company.enrichSource.push('BORME'); break; }
      else if (/nombramiento|nuevo administrador/.test(texto))
        { company.signals.push('👤 Nuevo administrador (BORME) — cambio de gestión'); company.enrichSource.push('BORME'); break; }
    }
  } catch(e) {}
  return company;
}

// ─── CAPA LINKEDIN DORKING: Encontrar decisores reales (Idea 3 - Gratis) ──────
async function enrichFromLinkedInDorking(company) {
  if (!company.name || company.decision_maker) return company;
  try {
    // Buscamos Gerentes/Directores de la empresa en LinkedIn via proxy de búsqueda
    const q = encodeURIComponent(`site:linkedin.com/in "Gerente" OR "Director" OR "CEO" "${company.name}"`);
    const searchUrl = `https://api.allorigins.win/get?url=${encodeURIComponent('https://www.google.com/search?q=' + q)}`;
    const res = await fetch(searchUrl);
    const j = await res.json();
    const html = j.contents || '';
    
    // Extraer nombres probables de los títulos de LinkedIn
    const names = html.match(/>([^<|]+)\s*-\s*[^<]*LinkedIn</gi);
    if (names && names.length > 0) {
      const bestMatch = names[0].replace(/>/,'').split('-')[0].trim();
      if (bestMatch.length > 5 && bestMatch.length < 40) {
        company.decision_maker = bestMatch;
        company.signals.push(`👤 Decisor probable (LinkedIn Dorking): ${bestMatch}`);
        company.enrichSource.push('LinkedIn-Dork');
      }
    }
  } catch(e) {}
  return company;
}

// ─── CAPA EMPRESITE: Directorio empresarial español (gratis, sin key) ─────────
// Fuente: empresite.eleconomista.es
// Datos: NIF/CIF, CNAE, empleados, facturación estimada, año fundación, actividad
async function enrichFromEmpressite(company) {
  if (!company.name) return company;
  try {
    // Construir query: primeras 4 palabras del nombre para mejor matching
    const q = encodeURIComponent(
      company.name
        .replace(/\b(SL|SA|SLU|SLL|SLP|SC|CB|AIE|LTD|S\.L\.|S\.A\.)\b\.?/gi, '')
        .trim()
        .split(/\s+/)
        .slice(0, 4)
        .join(' ')
    );

    // Empresite tiene una página por empresa en formato slug
    // también tiene búsqueda por nombre
    const searchUrl = `https://empresite.eleconomista.es/${encodeURIComponent(
      company.name.split(' ').slice(0, 3).join('-').toUpperCase()
    )}/`;

    const html = await fetchWithProxy(searchUrl, 8000);
    if (!html || html.length < 500) {
      // Fallback: búsqueda general
      const searchFallback = `https://empresite.eleconomista.es/busqueda/?q=${q}`;
      const searchHtml = await fetchWithProxy(searchFallback, 8000);
      if (!searchHtml) return company;
      return _parseEmpressiteHtml(company, searchHtml, true);
    }
    return _parseEmpressiteHtml(company, html, false);
  } catch(e) {
    console.warn('Empresite error:', e.message);
  }
  return company;
}

function _parseEmpressiteHtml(company, html, isSearch) {
  try {
    // ── NIF / CIF ────────────────────────────────────────────────────────────
    const nifMatch = html.match(/\b([A-Z]\d{7}[A-Z0-9]|\d{8}[A-Z])\b/);
    if (nifMatch && !company.nif) {
      company.nif = nifMatch[1];
    }

    // ── CNAE / Actividad ─────────────────────────────────────────────────────
    const cnaeMatch = html.match(/CNAE[:\s-]+(\d{4})/i) ||
                      html.match(/actividad[^<]{0,80}?(\d{4})/i);
    if (cnaeMatch && !company.cnae) {
      company.cnae = cnaeMatch[1];
    }

    // ── Número de empleados ──────────────────────────────────────────────────
    const empMatch = html.match(/(\d[\d.]+)\s*(?:empleados?|trabajadores?|personas?)/i) ||
                     html.match(/empleados?[^<]{0,30}?(\d[\d.]+)/i);
    if (empMatch && !company.signals.find(s => s.includes('empleados'))) {
      const n = parseInt(empMatch[1].replace(/\./g, ''));
      if (n > 0 && n < 500000) {
        company.employeeCount = n;
        company.signals.push(`👥 ${n.toLocaleString('es-ES')} empleados (Empresite)`);
      }
    }

    // ── Facturación / Ingresos ───────────────────────────────────────────────
    const revMatch = html.match(/facturaci[oó]n[^<]{0,60}?([\d,.]+)\s*(?:M|millones?|€|euros?|K)/i) ||
                     html.match(/([\d,.]+)\s*(?:M|millones?)\s*(?:de\s*)?€/i) ||
                     html.match(/ingresos?[^<]{0,60}?([\d,.]+)/i);
    if (revMatch && !company.revenue) {
      const rawNum = revMatch[1].replace(/\./g, '').replace(',', '.');
      const val = parseFloat(rawNum);
      if (!isNaN(val) && val > 0) {
        company.revenue = val;
        const label = val >= 1 ? `${val}M €` : `${Math.round(val * 1000)}K €`;
        company.signals.push(`💶 Facturación ~${label} (Empresite)`);
      }
    }

    // ── Año de fundación ─────────────────────────────────────────────────────
    const yearMatch = html.match(/(?:fundada?|constituida?|a[ñn]o\s+de\s+(?:creaci[oó]n|fundaci[oó]n))[^<]{0,30}?(\d{4})/i) ||
                      html.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
    if (yearMatch && !company.incorporationYear) {
      const yr = parseInt(yearMatch[1]);
      if (yr >= 1950 && yr <= new Date().getFullYear()) {
        company.incorporationYear = yr;
        const age = new Date().getFullYear() - yr;
        if (!company.signals.find(s => s.includes('años') || s.includes('fundada'))) {
          company.signals.push(`🏢 Fundada en ${yr} (${age} años) — Empresite`);
        }
      }
    }

    // ── Dirección / municipio ────────────────────────────────────────────────
    if (!company.address) {
      const addrMatch = html.match(/(?:direcci[oó]n|domicilio)[^<]{0,10}?<[^>]+>([^<]{10,80})</i) ||
                        html.match(/C\/?\.?\s+[A-ZÁÉÍÓÚ][a-záéíóú]+[^<]{5,50},\s*\d{5}/);
      if (addrMatch) {
        const addr = addrMatch[1].trim().replace(/\s+/g, ' ');
        if (addr.length > 8 && addr.length < 100) company.address = addr;
      }
    }

    // ── Señal: empresa destacada o activa ────────────────────────────────────
    if (/destacada|premium|verificada|activa/i.test(html)) {
      if (!company.enrichSource.includes('Empresite'))
        company.enrichSource.push('Empresite');
    } else if (nifMatch || empMatch || revMatch) {
      company.enrichSource.push('Empresite');
    }

  } catch(e) {
    console.warn('Empresite parse error:', e.message);
  }
  return company;
}

// ─── CAPA EXPERIAN: Riesgo crediticio y señales financieras (gratis) ──────────
// Fuente: www.experian.es/empresas (parte pública, sin registro)
// Datos: score de riesgo, morosidades, cambios recientes, tamaño estimado
async function enrichFromExperian(company) {
  if (!company.name) return company;
  try {
    // Experian España permite búsqueda pública de empresas por nombre/NIF
    const q = encodeURIComponent(
      company.name
        .replace(/\b(SL|SA|SLU|SLL|SLP|SC|CB|AIE|S\.L\.|S\.A\.)\b\.?/gi, '')
        .trim()
        .split(/\s+/)
        .slice(0, 4)
        .join(' ')
    );

    // Endpoint público de búsqueda de Experian España
    const url = `https://www.experian.es/empresas/informe-empresas?nombre=${q}${company.nif ? '&nif=' + encodeURIComponent(company.nif) : ''}`;
    const html = await fetchWithProxy(url, 9000);
    if (!html || html.length < 300) return company;

    return _parseExperianHtml(company, html);
  } catch(e) {
    console.warn('Experian error:', e.message);
  }
  return company;
}

function _parseExperianHtml(company, html) {
  try {
    // ── Score / Rating de riesgo ──────────────────────────────────────────────
    // Experian muestra un semáforo o puntuación pública de riesgo
    const riskMatch = html.match(/(?:riesgo|score|puntuaci[oó]n)[^<]{0,50}?(\d{1,3})\s*(?:\/\s*100)?/i) ||
                      html.match(/\b(muy\s+(?:bajo|alto)|bajo|medio|alto|m[ií]nimo|m[aá]ximo)\s+riesgo/i);
    if (riskMatch) {
      const raw = riskMatch[1].toLowerCase();
      if (!isNaN(parseInt(raw))) {
        const score = parseInt(raw);
        company.creditScore = score;
        if (score >= 70) {
          company.signals.push(`✅ Riesgo financiero bajo (${score}/100) — Experian`);
        } else if (score >= 40) {
          company.signals.push(`⚠️ Riesgo financiero medio (${score}/100) — Experian`);
        } else {
          company.signals.push(`🔴 Riesgo financiero alto (${score}/100) — Experian`);
        }
      } else {
        const label = raw.includes('bajo') ? 'bajo' : raw.includes('alto') ? 'alto' : 'medio';
        if (label === 'alto') {
          company.signals.push('🔴 Riesgo financiero alto detectado — Experian');
        } else if (label === 'bajo') {
          company.signals.push('✅ Empresa con riesgo financiero bajo — Experian');
        }
      }
    }

    // ── Incidencias / Morosidad ───────────────────────────────────────────────
    const moraMatch = html.match(/(\d+)\s*(?:incidencia[s]?|morosidad|impagos?|deuda[s]?)/i) ||
                      html.match(/(?:incidencia[s]?|morosidad)[^<]{0,40}?(\d+)/i);
    if (moraMatch) {
      const n = parseInt(moraMatch[1]);
      if (n > 0) {
        company.signals.push(`⚠️ ${n} incidencia(s) de morosidad registradas — Experian`);
      }
    }

    // ── Sin incidencias (señal positiva) ─────────────────────────────────────
    if (/sin\s+incidencias?|0\s+incidencias?|no\s+(?:constan|hay)\s+incidencias?/i.test(html)) {
      if (!company.signals.find(s => s.includes('morosidad') || s.includes('incidencia'))) {
        company.signals.push('✅ Sin incidencias de morosidad — Experian');
      }
    }

    // ── Tamaño / Clasificación ────────────────────────────────────────────────
    const sizeMatch = html.match(/(?:tama[ñn]o|clasificaci[oó]n)[^<]{0,40}?(microempresa|peque[ñn]a|mediana|grande)/i);
    if (sizeMatch && !company.companySize) {
      company.companySize = sizeMatch[1].toLowerCase();
    }

    // ── Cambios recientes (nuevo administrador, cambio domicilio) ────────────
    if (/nuevo\s+administrador|cambio\s+(?:de\s+)?(?:administrador|titular)/i.test(html)) {
      if (!company.signals.find(s => s.includes('administrador'))) {
        company.signals.push('👤 Cambio de administrador reciente — Experian (nueva gestión = oportunidad)');
      }
    }
    if (/cambio\s+(?:de\s+)?domicilio|traslado|nueva\s+sede/i.test(html)) {
      if (!company.signals.find(s => s.includes('domicilio') || s.includes('traslado'))) {
        company.signals.push('📍 Cambio de domicilio reciente — Experian (obra probable)');
      }
    }

    // ── NIF si no lo teníamos ─────────────────────────────────────────────────
    if (!company.nif) {
      const nifMatch = html.match(/\b([A-Z]\d{7}[A-Z0-9]|\d{8}[A-Z])\b/);
      if (nifMatch) company.nif = nifMatch[1];
    }

    // ── Año de constitución ───────────────────────────────────────────────────
    if (!company.incorporationYear) {
      const yrMatch = html.match(/(?:constituci[oó]n|fundaci[oó]n|alta)[^<]{0,30}?(\d{4})/i);
      if (yrMatch) {
        const yr = parseInt(yrMatch[1]);
        if (yr >= 1950 && yr <= new Date().getFullYear()) {
          company.incorporationYear = yr;
        }
      }
    }

    // ── Marcar fuente ─────────────────────────────────────────────────────────
    if (riskMatch || moraMatch || sizeMatch ||
        html.includes('Experian') || html.length > 1000) {
      company.enrichSource.push('Experian');
    }

  } catch(e) {
    console.warn('Experian parse error:', e.message);
  }
  return company;
}

// ─── SINCRONIZACIÓN GOOGLE SHEETS ─────────────────────────────────────────────
const SHEETS_HEADERS = ['ID','Empresa','Nombre','Email','Teléfono','Estado','Score',
  'Segmento','Dirección','Web','Rating','Reseñas','Decisor','Señales','Fuentes','Fecha','Notas','Próximo contacto'];

async function syncToSheets(leadsToSync) {
  const sheetsId = localStorage.getItem('gordi_sheets_id');
  const token    = localStorage.getItem('gordi_sheets_token');
  if (!sheetsId || !token) return;
  try {
    const rows = leadsToSync.filter(l => !l.archived).map(l => [
      l.id, l.company||'', l.name||'', l.email||'', l.phone||'',
      l.status||'Pendiente', l.score||0, l.segment||'', l.address||'', l.website||'',
      l.rating||'', l.ratingCount||'', l.decision_maker||'',
      (l.signals||[]).join(' | ').slice(0,300), (l.enrichSource||[]).join(', '),
      l.date ? new Date(l.date).toLocaleDateString('es-ES') : '',
      (l.notes||'').replace(/\n/g,' ').slice(0,200), l.next_contact||''
    ]);
    const res = await fetch(
      'https://sheets.googleapis.com/v4/spreadsheets/' + sheetsId + '/values/'
        + encodeURIComponent('Voltflow!A1:R' + (rows.length+1)) + '?valueInputOption=RAW',
      { method: 'PUT',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [SHEETS_HEADERS, ...rows] }),
        signal: AbortSignal.timeout(10000) }
    );
    if (res.ok) showToast('✅ Sheets sincronizado (' + rows.length + ' leads)');
    else showToast('⚠️ Error Sheets ' + res.status + ' — verifica el token');
  } catch(e) { console.warn('Sheets sync:', e.message); }
}

function initSheetsOAuth(silent) {
  const cid = localStorage.getItem('gordi_sheets_client_id');
  if (!cid) { if (!silent) showToast('⚠️ Configura tu Client ID de Google en Ajustes'); return; }
  const sc = encodeURIComponent('https://www.googleapis.com/auth/spreadsheets');
  const redirectUri = location.href.split('?')[0].replace(/\/$/, '');
  const popup = window.open('https://accounts.google.com/o/oauth2/v2/auth?client_id=' + cid
    + '&redirect_uri=' + encodeURIComponent(redirectUri)
    + '&response_type=token&scope=' + sc
    + '&prompt=none', '_blank', 'width=500,height=600');
  if (!silent) showToast('🔑 Autorizando con Google...');
  const timer = setInterval(() => {
    try {
      if (popup && popup.location && popup.location.href && popup.location.href.includes('access_token')) {
        const hash = popup.location.hash || popup.location.href.split('#')[1] || '';
        const params = new URLSearchParams(hash.replace('#',''));
        const token = params.get('access_token');
        const expiresIn = parseInt(params.get('expires_in') || '3600');
        if (token) {
          localStorage.setItem('gordi_sheets_token', token);
          localStorage.setItem('gordi_sheets_token_expiry', Date.now() + (expiresIn - 120) * 1000);
          const el = document.getElementById('sheets-token-input');
          if (el) el.value = token;
          popup.close();
          clearInterval(timer);
          if (!silent) showToast('✅ Token renovado. ¡Ya puedes sincronizar!');
          scheduleTokenRenewal();
        }
      }
      if (popup && popup.closed) { clearInterval(timer); }
    } catch(e) {}
  }, 500);
}

function isTokenValid() {
  const token = localStorage.getItem('gordi_sheets_token');
  const expiry = parseInt(localStorage.getItem('gordi_sheets_token_expiry') || '0');
  return token && Date.now() < expiry;
}

function scheduleTokenRenewal() {
  const expiry = parseInt(localStorage.getItem('gordi_sheets_token_expiry') || '0');
  const msUntilRenew = expiry - Date.now();
  if (msUntilRenew > 0) {
    setTimeout(() => {
      showToast('🔄 Renovando token de Google automáticamente...');
      initSheetsOAuth(true);
    }, msUntilRenew);
  }
}

function saveSheetsConfig() {
  const id  = document.getElementById('sheets-id-input')?.value?.trim();
  const cid = document.getElementById('sheets-client-input')?.value?.trim();
  const tok = document.getElementById('sheets-token-input')?.value?.trim();
  if (id)  localStorage.setItem('gordi_sheets_id', id);
  if (cid) localStorage.setItem('gordi_sheets_client_id', cid);
  if (tok) localStorage.setItem('gordi_sheets_token', tok);
  showToast('✅ Configuración de Sheets guardada');
}

(function detectOAuthToken() {
  const hash = location.hash;
  const mToken = hash.match(/access_token=([^&]+)/);
  const mExpiry = hash.match(/expires_in=([^&]+)/);
  if (mToken) {
    const expiresIn = parseInt(mExpiry ? mExpiry[1] : '3600');
    localStorage.setItem('gordi_sheets_token', mToken[1]);
    localStorage.setItem('gordi_sheets_token_expiry', Date.now() + (expiresIn - 120) * 1000);
    history.replaceState(null, '', location.pathname);
    showToast('✅ Token de Google Sheets guardado');
    scheduleTokenRenewal();
  }
})();

// ─── MOTOR PRINCIPAL ─────────────────────────────────────────────────────────
async function searchBusinesses() {
  const segment  = document.getElementById('plan-segment').value;
  const location = document.getElementById('plan-location').value.trim();
  const maxRes   = parseInt(document.getElementById('plan-max').value);
  const enrichMode = document.getElementById('plan-enrich').value;

  if (!location) { alert('Introduce una ciudad o zona.'); return; }
  saveSearchHistory(segment, location);

  // UI: mostrar pipeline
  document.getElementById('enrich-pipeline').style.display = 'block';
  document.getElementById('search-results-panel').style.display = 'none';
  document.getElementById('enrich-stats-bar').style.display = 'none';
  document.getElementById('search-dup-info')?.remove();
  document.getElementById('result-filters').style.display = 'none';
  const siBox = document.getElementById('session-intel-box');
  if (siBox) siBox.style.display = 'none';
  document.getElementById('btn-search').disabled = true;
  document.getElementById('btn-search').textContent = '⏳ Buscando...';
  tempSearchResults = [];
  setProgress(0);
  logEnrich('', 'clear');

  const setStep = (step, state, msg) => {
    const el = document.getElementById(`step-${step}`);
    const st = document.getElementById(`st-${step}`);
    if (el) { el.className = `pipeline-step ${state}`; }
    if (st) st.textContent = msg;
  };

  // ── Capa 1 ───────────────────────────────────────────────
  setStep('places','active','Buscando...');
  logEnrich('🔍 Google Places: buscando empresas en ' + location);

  let places = [];
  try {
    places = await fetchPlaces(segment, location, maxRes);
    // Calcular distancias reales con Haversine desde el centro de búsqueda
    places = await enrichDistances(places, location);
    // Ventana de contacto óptima (síncrona, datos de Places ya disponibles)
    places = places.map(c => detectOptimalContactWindow(c));
    setStep('places','done', places.length + ' encontradas');
    logEnrich(`✅ ${places.length} empresas encontradas`, 'ok');
    setProgress(20);
  } catch (err) {
    setStep('places','error','Error');
    logEnrich('❌ ' + err.message, 'err');
    resetSearchBtn();
    return;
  }

  if (!places.length) {
    setStep('places','done','0 resultados');
    logEnrich('⚠️ Sin resultados. Prueba otra zona.', 'warn');
    resetSearchBtn();
    return;
  }

  // ── Idea 5: Aplicar Cache de Enriquecimiento (Recuperar datos previos) ──────
  places = places.map(c => {
    const cached = _enrichCache.get(c.id);
    if (cached) {
      logEnrich(`♻️ Datos recuperados de cache para: ${c.name}`);
      return { ...c, ...cached, fromCache: true };
    }
    return c;
  });

  tempSearchResults = places;

  // Renderizar resultado rápido de Places mientras enriquecemos
  renderSearchCards();
  showResultsPanel();
  updateEnrichStats();

  // ── MEJORA 3: Pre-caché de logos + dominios en paralelo (capa 0) ─────────
  // Los primeros 20 resultados reciben logos y dominios inmediatamente,
  // sin esperar al batch de enriquecimiento completo
  places.slice(0, 20).forEach(c => {
    if (!c.logo && c.website) c.logo = getClearbitLogo(c.website);
    if (!c.domain) c.domain = extractDomain(c.website);
  });
  renderSearchCards(); // re-render con logos ya listos

  // ── Modo Turbo: Solo Places — salida instantánea sin enriquecimiento ──────
  if (enrichMode === 'none') {
    setStep('places','done', places.length + ' listas');
    // Marcar todos los steps restantes como omitidos para UI limpia
    ['web','hunter','apollo','social','whois','opencorp'].forEach(s => setStep(s,'done','Omitido'));
    setStep('done','done', places.length + ' listas ⚡');
    setProgress(100);
    document.getElementById('result-filters').style.display = 'flex';
    const sfb1 = document.getElementById('search-sf-wrap'); if(sfb1) sfb1.style.display='block';
    logEnrich(`⚡ Modo Turbo: ${places.length} empresas en segundos. Pulsa ✨ en cada card para enriquecer individualmente.`, 'ok');
    // Añadir logos Clearbit también en modo turbo
    tempSearchResults.forEach(c => { if (!c.logo) c.logo = getClearbitLogo(c.website); });
    renderSearchCards();
    updateEnrichStats();
    resetSearchBtn();
    return;
  }

  // ── Capa 2: Web Scraping (paralelo, batches de 8 con retry) ─────────────
  if (enrichMode === 'all' || enrichMode === 'web') {
    setStep('web','active','Procesando...');
    logEnrich('🌐 Web scraping: extrayendo datos de ' + places.length + ' webs...');
    let done = 0;
    // FIX-SCRAPING: BATCH_SIZE reducido a 3 para no saturar los proxies CORS gratuitos.
    const BATCH_SIZE = 3;

    // Reordenar por potencial — mejores leads se enriquecen primero
    const enrichOrder = [...tempSearchResults.keys()].sort((a, b) => {
      const ca = tempSearchResults[a], cb = tempSearchResults[b];
      const scoreA = (ca.rating||0)*20 + Math.min(ca.ratingCount||0,200)/10 + (ca.website?15:0);
      const scoreB = (cb.rating||0)*20 + Math.min(cb.ratingCount||0,200)/10 + (cb.website?15:0);
      return scoreB - scoreA;
    });
    logEnrich(`  → Procesando en orden de potencial (rating + reseñas + web)`);

    for (let b = 0; b < enrichOrder.length; b += BATCH_SIZE) {
      const batchIndices = enrichOrder.slice(b, b + BATCH_SIZE);

      // Marcar todas las cards del batch como "enriqueciendo"
      batchIndices.forEach(i => { if (tempSearchResults[i].website) markCardEnriching(i, true); });

      // Procesar batch en paralelo con RETRY automático
      await Promise.all(batchIndices.map(async i => {
        const company = tempSearchResults[i];
        if (!company.website) { done++; return; }
        try {
          tempSearchResults[i] = await enrichFromWeb(company);
        } catch (e1) {
          // Retry automático con proxy alternativo tras pausa corta
          try {
            await sleep(1500); 
            tempSearchResults[i] = await enrichFromWeb(company);
          } catch (e2) {
            console.warn('Enrich failed after retry:', company.name);
          }
        }
        done++;
      }));

      // Actualizar UI y deduplicar PROGRESIVAMENTE
      // (Si detectamos duplicados por website o email que Places no pilló)
      batchIndices.forEach(i => {
        markCardEnriching(i, false);
        updateCard(i);
        const c = tempSearchResults[i];
        const proxyFail = (c.enrichSource||[]).includes('Proxy-fallo');
        logEnrich(`  → ${c.name}: ${c.email ? '✉️ ' + c.email : '—'}${proxyFail ? ' ⚠️retry-needed' : ''}`);
      });

      setProgress(20 + Math.round(done / tempSearchResults.length * 40));
      setStep('web','active', `${done}/${tempSearchResults.length}`);
      updateEnrichStats();

      // Pausa adaptativa para no quemar proxies
      if (b + BATCH_SIZE < enrichOrder.length) {
        await sleep(tempSearchResults.length > 30 ? 2000 : 1000);
      }
    // Guardar en cache tras scraping web
    tempSearchResults.forEach(c => {
      if (!c.fromCache) _enrichCache.set(c.id, c);
    });

    // DEDUP FINAL post-scraping (Places no detecta cadenas que comparten misma web)
    const originalLen = tempSearchResults.length;
    tempSearchResults = deduplicateResults(tempSearchResults);
    if (tempSearchResults.length < originalLen) {
      logEnrich(`✨ Deduplicación inteligente: eliminadas ${originalLen - tempSearchResults.length} sucursales duplicadas detectadas por web/email`, 'ok');
      renderSearchCards();
      updateEnrichStats();
    }

    setStep('web','done', done + ' procesadas');
    setProgress(60);
  }

  // ── Capa 3: Hunter & Apollo (Pipeline Priorizado) ──────────────────────────
  // Agrupamos Hunter y Apollo para evitar loops redundantes y priorizar leads sin email
  const hunterKey = localStorage.getItem('gordi_hunter_key');
  const apolloKey = localStorage.getItem('gordi_apollo_key');

  if (enrichMode === 'all' || enrichMode === 'hunter' || enrichMode === 'apollo') {
    const externalCandidates = tempSearchResults
      .map((c, i) => ({ i, c }))
      .filter(x => x.c.website && (!x.c.email || !x.c.decision_maker))
      .sort((a, b) => (b.c.rating || 0) - (a.c.rating || 0));

    if (externalCandidates.length > 0) {
      logEnrich(`🔍 Capas Externas (Hunter/Apollo): procesando ${externalCandidates.length} candidatos...`);
      setStep('hunter', hunterKey ? 'active' : 'done', hunterKey ? 'Buscando...' : 'Omitido');
      setStep('apollo', apolloKey ? 'active' : 'done', apolloKey ? 'Buscando...' : 'Omitido');

      let extDone = 0;
      for (const item of externalCandidates) {
        const i = item.i;
        markCardEnriching(i, true);
        
        // Hunter.io (solo si no hay email)
        if (hunterKey && !tempSearchResults[i].email) {
          tempSearchResults[i] = await enrichFromHunter(tempSearchResults[i]);
        }
        
        // Apollo.io (si no hay decisor o email después de Hunter)
        if (apolloKey && (!tempSearchResults[i].email || !tempSearchResults[i].decision_maker)) {
          tempSearchResults[i] = await enrichFromApollo(tempSearchResults[i]);
        }

        markCardEnriching(i, false);
        updateCard(i);
        extDone++;
        if (extDone % 3 === 0) updateEnrichStats();
        await sleep(600); // Evitar rate-limits de APIs externas
      }
      setStep('hunter','done', 'Completado');
      setStep('apollo','done', 'Completado');
    }
  }

  // ── Capa Social & Señales (Pipeline de Análisis de Bajo Coste) ─────────────
  // Consolidamos News, Social, Whois, OpenCorp y Reviews en un solo flujo eficiente
  if (enrichMode === 'all') {
    setStep('social','active','Pipeline Señales...');
    logEnrich('🧠 Pipeline de Señales: ejecutando análisis multicapa...');
    
    // Procesar en pequeños grupos para mantener la UI fluida pero rápida
    const SIGNAL_BATCH = 2; 
    for (let i = 0; i < tempSearchResults.length; i += SIGNAL_BATCH) {
      const batch = tempSearchResults.slice(i, i + SIGNAL_BATCH);
      await Promise.all(batch.map(async (c, idx) => {
        const realIdx = i + idx;
        // 1. Social & Web Signals
        tempSearchResults[realIdx] = await enrichFromSocial(tempSearchResults[realIdx]);
        // 2. Google News (solo si no tenemos muchas señales aún)
        if (tempSearchResults[realIdx].signals.length < 3) {
          tempSearchResults[realIdx] = await enrichFromNews(tempSearchResults[realIdx]);
        }
        // 3. Whois (edad de dominio)
        if (tempSearchResults[realIdx].website) {
          tempSearchResults[realIdx] = await enrichFromWhois(tempSearchResults[realIdx]);
        }
        // 4. OpenCorporates (registro legal)
        tempSearchResults[realIdx] = await enrichFromOpenCorporates(tempSearchResults[realIdx]);
        // 5. Análisis de Reseñas (dolor del cliente)
        tempSearchResults[realIdx] = await enrichFromReviews(tempSearchResults[realIdx]);
        
        updateCard(realIdx);
      }));
      
      setProgress(80 + Math.round((i / tempSearchResults.length) * 20));
      await sleep(400); 
    }
    setStep('social', 'done', 'Analizado');
    ['news', 'whois', 'opencorp'].forEach(s => {
      const el = document.getElementById(`step-${s}`);
      if (el) el.className = 'pipeline-step done';
    });
  }

  // ── Capa Especial Avanzada (Borme + Street View + LinkedIn + IA Rescue) ────
  const geminiKey = localStorage.getItem('gordi_gemini_key');
  if (enrichMode === 'all') {
    logEnrich('💎 Capas Avanzadas: ejecutando análisis de alto valor...');
    setStep('empresite', 'active', 'Consultando...');
    setStep('experian', 'active', 'Consultando...');
    
    let empresiteOk = 0, experianOk = 0;
    for (let i = 0; i < tempSearchResults.length; i++) {
      if (tempSearchResults[i].fromCache) continue;

      // 1. LinkedIn Dorking (Idea 3 - Decisor probable)
      tempSearchResults[i] = await enrichFromLinkedInDorking(tempSearchResults[i]);

      // 2. BORME (Trámites legales reales)
      tempSearchResults[i] = await enrichFromBorme(tempSearchResults[i]);
      
      // 3. Empresite (NIF, empleados, facturación)
      tempSearchResults[i] = await enrichFromEmpressite(tempSearchResults[i]);
      if (tempSearchResults[i].enrichSource.includes('Empresite')) empresiteOk++;

      // 4. Experian (Riesgo, morosidad)
      tempSearchResults[i] = await enrichFromExperian(tempSearchResults[i]);
      if (tempSearchResults[i].enrichSource.includes('Experian')) experianOk++;

      // 5. Street View Vision (Idea 4 - Análisis necesidades reforma)
      if (geminiKey && tempSearchResults[i].address) {
        tempSearchResults[i] = await enrichFromStreetView(tempSearchResults[i]);
      }
      
      // 6. IA Email Rescue (Último recurso con Gemini)
      if (geminiKey && !tempSearchResults[i].email && tempSearchResults[i].website) {
        const rescued = await extractEmailWithAI(tempSearchResults[i].website, tempSearchResults[i].name, geminiKey);
        if (rescued) {
          tempSearchResults[i].email = rescued;
          tempSearchResults[i].enrichSource.push('IA-Rescue');
        }
      }
      
      if (i % 2 === 0) updateCard(i);
      await sleep(tempSearchResults.length > 20 ? 300 : 100);
    }
    setStep('empresite', 'done', empresiteOk + ' enriquecidas');
    setStep('experian',  'done', experianOk  + ' con datos');
  }

  // ── Mostrar info de duplicados ──────────────────────────────────────────────
  const normN = n => (n||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,25);
  const dupCount = tempSearchResults.filter(c =>
    leads.find(l => !l.archived && (
      (c.placeId && l.placeId && l.placeId === c.placeId) ||
      normN(l.company) === normN(c.name)
    ))
  ).length;
  if (dupCount > 0) {
    const dupBar = document.createElement('div');
    dupBar.id = 'search-dup-info';
    dupBar.style.cssText = 'margin-bottom:.75rem;padding:.6rem 1rem;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.25);border-radius:10px;display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;font-size:.82rem';
    dupBar.innerHTML = `<span>📋 <strong>${dupCount}</strong> empresa${dupCount>1?'s':''} de los resultados ya ${dupCount>1?'están':'está'} en tu CRM</span>
      <label style="display:flex;align-items:center;gap:.4rem;cursor:pointer;color:var(--text-muted)">
        <input type="checkbox" id="filter-no-leads" onchange="applyAdvancedFilters()" checked style="cursor:pointer">
        Mostrando solo nuevas (clic para ver todas)
      </label>`;
    const statsBar = document.getElementById('enrich-stats-bar');
    if (statsBar && statsBar.parentNode) {
      statsBar.parentNode.insertBefore(dupBar, statsBar.nextSibling);
    }
    // Aplicar filtro automáticamente — ocultar duplicados por defecto
    setTimeout(() => applyAdvancedFilters(), 50);
  }

  // ── Deduplicación final por nombre similar ───────────────
  const before = tempSearchResults.length;
  tempSearchResults = deduplicateResults(tempSearchResults);
  const removed = before - tempSearchResults.length;
  if (removed > 0) logEnrich(`🔁 ${removed} duplicados eliminados por nombre similar`, 'warn');

  // ── Añadir logos Clearbit a los resultados ───────────────
  tempSearchResults.forEach(c => { if (!c.logo) c.logo = getClearbitLogo(c.website); });

  // ── Finalizar ─────────────────────────────────────────────
  setProgress(100);
  const withEmail = tempSearchResults.filter(c => c.email).length;
  setStep('done','done', `${withEmail} con email`);
  logEnrich(`✅ Enriquecimiento completado. ${withEmail}/${tempSearchResults.length} empresas con email.`, 'ok');
  renderSearchCards();
  renderSearchTable();
  document.getElementById('result-filters').style.display = 'flex';
  const sfb2 = document.getElementById('search-sf-wrap'); if(sfb2) sfb2.style.display='block';
  updateEnrichStats();
  
  // ── Guardar todo en cache (Final) ──────────────────────────
  tempSearchResults.forEach(c => {
    if (!c.fromCache) _enrichCache.set(c.id, c);
  });

  resetSearchBtn();

  // ── Inteligencia de sesión (asíncrona, no bloquea el pipeline) ────────────
  generateSessionIntel(tempSearchResults, segment, location);
}

// ─── UI HELPERS ──────────────────────────────────────────────────────────────

function resetSearchBtn() {
  const btn = document.getElementById('btn-search');
  btn.disabled = false;
  btn.textContent = '🔍 Buscar y Enriquecer';
}

// ── Enriquecimiento individual bajo demanda (para Modo Turbo) ─────────────────
async function enrichSingleCard(idx) {
  if (idx < 0 || idx >= tempSearchResults.length) return;
  const btn = document.getElementById(`rebtn-${idx}`);
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="reenrich-icon">⏳</span> Buscando...'; }
  markCardEnriching(idx, true);

  const hunterKey  = localStorage.getItem('gordi_hunter_key');
  const apolloKey  = localStorage.getItem('gordi_apollo_key');
  const geminiKey  = localStorage.getItem('gordi_gemini_key');

  // Ejecutar capas disponibles en secuencia
  tempSearchResults[idx] = await enrichFromWeb(tempSearchResults[idx]);
  if (hunterKey && !tempSearchResults[idx].email)
    tempSearchResults[idx] = await enrichFromHunter(tempSearchResults[idx]);
  if (apolloKey && (!tempSearchResults[idx].email || !tempSearchResults[idx].decision_maker))
    tempSearchResults[idx] = await enrichFromApollo(tempSearchResults[idx]);
  tempSearchResults[idx] = await enrichFromSocial(tempSearchResults[idx]);
  tempSearchResults[idx] = await enrichFromNews(tempSearchResults[idx]);
  tempSearchResults[idx] = await enrichFromBorme(tempSearchResults[idx]);
  tempSearchResults[idx] = await enrichFromEmpressite(tempSearchResults[idx]);
  tempSearchResults[idx] = await enrichFromExperian(tempSearchResults[idx]);
  if (!tempSearchResults[idx].email && geminiKey)
    tempSearchResults[idx].email = await extractEmailWithAI(
      tempSearchResults[idx].website, tempSearchResults[idx].name, geminiKey
    ) || '';
  if (!tempSearchResults[idx].logo)
    tempSearchResults[idx].logo = getClearbitLogo(tempSearchResults[idx].website);

  markCardEnriching(idx, false);
  updateCard(idx);
  updateEnrichStats();

  const c = tempSearchResults[idx];
  showToast(`${c.name}: ${c.email ? '✉️ ' + c.email : 'sin email'} ${c.decision_maker ? '· 👤 ' + c.decision_maker.split('(')[0] : ''} ✓`);
}

// ── Panel de Inteligencia de Sesión (Gemini) ───────────────────────────────────
async function generateSessionIntel(results, segment, location) {
  const geminiKey = localStorage.getItem('gordi_gemini_key');
  const el = document.getElementById('session-intel-box');
  if (!geminiKey || !results.length || !el) return;

  // Ocultar si ya había inteligencia de sesión previa
  el.style.display = 'block';
  el.innerHTML = '<div style="font-size:.78rem;color:var(--text-muted);display:flex;align-items:center;gap:.5rem"><span style="animation:spin 1s linear infinite;display:inline-block">⏳</span> Generando inteligencia de sesión con IA...</div>';

  // Top 5 leads por score
  const top = [...results]
    .map((c, i) => ({ ...c, _idx: i }))
    .sort((a, b) => ((b.score || 0) - (a.score || 0)) || ((b.signals?.length || 0) - (a.signals?.length || 0)))
    .slice(0, 5);

  const summary = top.map((c, i) => {
    const painSnippet = c.reviewPain?.length ? ` | Dolor detectado: "${c.reviewPain[0].snippet.slice(0, 60)}"` : '';
    const compSnippet = c.competitorBetter ? ` | Competidor: ${c.competitorBetter.name} (+${c.competitorBetter.diff}★)` : '';
    const newsSnippet = (c.signals || []).find(s => s.includes('prensa') || s.includes('Apertura') || s.includes('Contrato')) || '';
    return `${i+1}. ${c.name} | ${c.rating ? c.rating + '★ (' + c.ratingCount + ' reseñas)' : 'Sin rating'} | Email:${c.email ? 'SÍ' : 'NO'} | Decisor:${c.decision_maker ? 'SÍ' : 'NO'}${painSnippet}${compSnippet}${newsSnippet ? ' | Prensa: ' + newsSnippet.slice(0, 60) : ''}`;
  }).join('\n');

  const prompt = `Eres un experto en ventas B2B para Voltium Madrid, empresa de instalaciones eléctricas y reformas integrales. Analiza los ${top.length} mejores leads encontrados en "${location}" (sector: ${segment}) y crea un briefing ejecutivo CONCISO. Para cada lead: una frase de por qué es prioritario y una frase con el mejor ángulo de primer contacto. Sin listas con guiones, sin markdown, texto en prosa con saltos de línea entre leads. Máximo 220 palabras.\n\nLeads:\n${summary}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(18000),
      }
    );
    const data = await res.json();
    const intel = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!intel) { el.style.display = 'none'; return; }

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.6rem">
        <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.1em;color:var(--primary);font-weight:700">🧠 Inteligencia de sesión — Top ${top.length} leads</div>
        <button onclick="document.getElementById('session-intel-box').style.display='none'" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:.85rem;padding:0">✕</button>
      </div>
      <div style="font-size:.8rem;line-height:1.65;color:var(--text)">${intel.replace(/\n\n/g,'<br><br>').replace(/\n/g,'<br>')}</div>`;
  } catch {
    el.style.display = 'none';
  }
}

function setProgress(pct) {
  const el = document.getElementById('enrich-progress-fill');
  if (el) el.style.width = pct + '%';
}

function logEnrich(msg, type='') {
  const log = document.getElementById('enrich-log');
  if (!log) return;
  if (type === 'clear') { log.innerHTML = ''; return; }
  const line = document.createElement('span');
  line.className = `enrich-log-line ${type}`;
  line.textContent = msg;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

function showResultsPanel() {
  document.getElementById('search-results-panel').style.display = 'block';
  document.getElementById('enrich-stats-bar').style.display = 'flex';
  document.getElementById('search-count').innerText = `${tempSearchResults.length} empresas`;
}

function updateEnrichStats() {
  const r = tempSearchResults;
  const s = id => { const el = document.getElementById(id); if (el) el.textContent = 0; };
  document.getElementById('es-total').textContent = r.length;
  document.getElementById('es-email').textContent = r.filter(c => c.email).length;
  document.getElementById('es-phone').textContent = r.filter(c => c.phone).length;
  document.getElementById('es-social').textContent = r.filter(c => c.instagram || c.facebook || c.linkedin).length;
  document.getElementById('es-desc').textContent = r.filter(c => c.description).length;
}

function markCardEnriching(idx, on) {
  const card = document.getElementById(`sc-${idx}`);
  if (card) card.classList.toggle('enriching', on);
}

function updateCard(idx) {
  const card = document.getElementById(`sc-${idx}`);
  if (!card) return;
  card.outerHTML = buildCardHTML(tempSearchResults[idx], idx);
}

function buildCardHTML(c, i) {
  const initials = (c.name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const ratingStr = c.rating ? `⭐ ${c.rating} (${c.ratingCount})` : '';
  const enrichStatus = c.email
    ? `<span class="sc-enrich-status enriched">● Enriquecida</span>`
    : c.enriched
    ? `<span class="sc-enrich-status partial">◐ Parcial</span>`
    : `<span class="sc-enrich-status pending">○ Sin enriquecer</span>`;

  // Check if already in leads — por placeId (fiable) o nombre normalizado (fallback)
  const normName = n => (n||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,25);
  const alreadyIn = leads.find(l => !l.archived && (
    (c.placeId && l.placeId && l.placeId === c.placeId) ||
    normName(l.company) === normName(c.name)
  ));

  // Color y texto según estado del lead existente
  const statusColors = {
    'Pendiente':      'rgba(245,158,11,.15)',
    'Contactado':     'rgba(10,132,255,.15)',
    'En negociación': 'rgba(94,92,230,.15)',
    'Cliente':        'rgba(16,217,124,.15)',
    'Convertido':     'rgba(16,217,124,.15)',
    'Descartado':     'rgba(239,68,68,.12)',
    'Archivado':      'rgba(100,100,100,.15)',
  };
  const statusTextColors = {
    'Pendiente':      'var(--warning)',
    'Contactado':     'var(--primary)',
    'En negociación': 'var(--secondary)',
    'Cliente':        'var(--success)',
    'Convertido':     'var(--success)',
    'Descartado':     'var(--danger)',
    'Archivado':      'var(--text-muted)',
  };
  const sBg   = alreadyIn ? (statusColors[alreadyIn.status]      || 'rgba(16,217,124,.15)') : '';
  const sTxt  = alreadyIn ? (statusTextColors[alreadyIn.status]  || 'var(--success)') : '';
  const daysSinceAdded = alreadyIn ? Math.floor((Date.now() - new Date(alreadyIn.date)) / 86400000) : 0;
  const addedAgo = daysSinceAdded === 0 ? 'hoy' : daysSinceAdded === 1 ? 'ayer' : `hace ${daysSinceAdded}d`;
  const alreadyBadge = alreadyIn
    ? `<span style="font-size:.65rem;background:${sBg};color:${sTxt};padding:2px 8px;border-radius:10px;border:1px solid ${sBg.replace(',.15','.4').replace(',.12','.35')};cursor:pointer" onclick="openLeadDetail('${alreadyIn.id}')" title="Ver lead · añadido ${addedAgo}">
        📋 Ya en CRM · <strong>${alreadyIn.status}</strong> · ${addedAgo}
        ${alreadyIn.email ? ' · ✉️' : ''}${alreadyIn.phone ? ' · 📞' : ''}
      </span>`
    : '';

  // Keyword detection in description
  const oppKeywords = ['reforma','renovaci','instalaci','obra','ampliac','traslado','apertura','nuevo local','nueva sede','abierto recientemente'];
  const hasOpp = oppKeywords.some(k => (c.description||'').toLowerCase().includes(k));
  const oppBadge = hasOpp ? `<span style="font-size:.65rem;background:rgba(245,158,11,.15);color:var(--warning);padding:1px 7px;border-radius:10px;border:1px solid rgba(245,158,11,.3)">🔥 Señal de oportunidad</span>` : '';

  // Possible chain/franchise detection
  const chainLeads = tempSearchResults.filter(r => r !== c && r.name === c.name);
  const chainBadge = chainLeads.length ? `<span style="font-size:.65rem;background:rgba(94,92,230,.15);color:var(--secondary);padding:1px 7px;border-radius:10px">⛓️ Posible cadena</span>` : '';

  const _ll = getLookalikeSimilarity(c);
  const llBadge = (_ll >= 70 && _goldenProfile)
    ? `<span style="font-size:.65rem;background:rgba(16,217,124,.15);color:var(--success);padding:1px 7px;border-radius:10px;border:1px solid rgba(16,217,124,.3)">🎯 ${_ll}% lookalike</span>`
    : '';

  // MEJORA 1: Temperatura del Lead
  const temp = calculateLeadTemperature(c);
  const tempBadge = `<span style="font-size:.65rem;background:${temp.color}22;color:${temp.color};padding:2px 8px;border-radius:10px;border:1px solid ${temp.color}44" title="${temp.desc}">
    ${temp.icon} ${temp.label}
  </span>`;

  const socials = [
    c.instagram ? `<a href="${c.instagram}" target="_blank" class="sc-social-badge instagram">📸 IG</a>` : '',
    c.facebook  ? `<a href="${c.facebook}"  target="_blank" class="sc-social-badge facebook">👍 FB</a>` : '',
    c.linkedin  ? `<a href="${c.linkedin}"  target="_blank" class="sc-social-badge linkedin">💼 LI</a>` : '',
    c.twitter   ? `<a href="${c.twitter}"   target="_blank" class="sc-social-badge twitter">🐦 TW</a>` : '',
    c.youtube   ? `<a href="${c.youtube}"   target="_blank" class="sc-social-badge youtube">▶️ YT</a>` : '',
  ].filter(Boolean).join('');

  const sources = c.enrichSource?.length
    ? `<span style="font-size:.65rem;color:var(--text-dim);margin-left:auto">${c.enrichSource.join(' · ')}</span>`
    : '';

  const signalBadges = (c.signals && c.signals.length)
    ? `<div style="margin-top:.4rem;display:flex;flex-wrap:wrap;gap:.3rem">${c.signals.map(s =>
        `<span style="font-size:.62rem;background:rgba(245,158,11,.12);color:var(--warning);padding:1px 6px;border-radius:8px;border:1px solid rgba(245,158,11,.25)">${s}</span>`
      ).join('')}</div>`
    : '';

  const emailsExtra = c.emails?.length > 1
    ? c.emails.slice(1).map(e => `<span style="font-size:.7rem;color:var(--text-muted)">${e}</span>`).join(' ')
    : '';

  return `<div class="search-card" id="sc-${i}" data-idx="${i}" ${alreadyIn ? 'style="opacity:.65"' : ''} onclick="if(!event.target.closest('button') && !event.target.closest('a') && !event.target.closest('input')) openSidePanel(${i})">
    <input type="checkbox" class="search-check sc-check search-card-check" data-index="${i}" ${alreadyIn ? '' : 'checked'}>
    ${alreadyBadge || oppBadge || chainBadge || llBadge || tempBadge ? `<div style="display:flex;gap:.3rem;flex-wrap:wrap;margin-bottom:.4rem">${alreadyBadge}${tempBadge}${oppBadge}${chainBadge}${llBadge}</div>` : ''}
    <div class="sc-header">
      <div class="sc-avatar" style="${c.logo ? 'padding:0;overflow:hidden' : ''}">
        ${c.logo
          ? `<img src="${c.logo}" alt="${c.name}" style="width:100%;height:100%;object-fit:contain;border-radius:inherit"
               onerror="this.parentNode.innerHTML='${initials}';this.parentNode.style.padding='';">`
          : initials}
      </div>
      <div>
        <div class="sc-name">${c.name}</div>
        <div class="sc-addr">${c.address}${c.distKm !== null && c.distKm !== undefined ? ` <span style="font-size:.62rem;background:rgba(10,132,255,.1);color:var(--primary);padding:1px 5px;border-radius:4px;margin-left:3px">📍 ${c.distKm}km</span>` : ''}</div>
        ${ratingStr ? `<div class="sc-rating">${ratingStr}</div>` : ''}
        ${c.domainAge !== undefined ? `<div style="font-size:.65rem;color:var(--text-dim)">🌐 Dominio: ${c.domainYear} (${c.domainAge} años)</div>` : ''}
        ${c.incorporationYear ? `<div style="font-size:.65rem;color:var(--text-dim)">🏢 Fundada: ${c.incorporationYear}${c.legalStatus ? ' · ' + c.legalStatus : ''}</div>` : ''}
        ${c.techStack && c.techStack.length ? `<div style="font-size:.63rem;color:var(--text-dim)">⚙️ ${c.techStack.join(' · ')}</div>` : ''}
        ${c.webLoadMs && c.webLoadMs > 2000 ? `<div style="font-size:.63rem;color:${c.webLoadMs > 4000 ? 'var(--danger)' : 'var(--warning)'}">⏱️ Web: ${(c.webLoadMs/1000).toFixed(1)}s</div>` : ''}
      </div>
    </div>
    <div class="sc-data">
      <div class="sc-row">
        <span class="sc-icon">✉️</span>
        <div class="sc-val ${c.email ? '' : 'empty'}">
          ${c.email
            ? `<span style="display:flex;align-items:center;gap:.3rem;flex-wrap:wrap">${c.email}${emailsExtra ? '<br>' + emailsExtra : ''}<button onclick="event.stopPropagation(); copyToClipboard('${c.email.split('<br>')[0]}', 'Email: ${c.email.split('<br>')[0]}')" title="Copiar email al portapapeles" class="sc-copy-email-btn">📋 Copiar</button></span>`
            : `<input type="email" placeholder="Añadir email..." onchange="tempSearchResults[${i}].email=this.value;updateEnrichStats()" style="background:none;border:none;border-bottom:1px solid var(--glass-border);padding:.15rem 0;color:var(--text);font-size:.78rem;outline:none;width:100%">`
          }
        </div>
      </div>
      <div class="sc-row">
        <span class="sc-icon">📞</span>
        <div class="sc-val ${c.phone ? '' : 'empty'}">
          ${c.phone || `<input type="text" placeholder="Añadir teléfono..." onchange="tempSearchResults[${i}].phone=this.value" style="background:none;border:none;border-bottom:1px solid var(--glass-border);padding:.15rem 0;color:var(--text);font-size:.78rem;outline:none;width:100%">`}
          ${c.whatsapp ? `<a href="https://wa.me/${c.whatsapp.replace(/[^0-9]/g,'')}" target="_blank" style="margin-left:6px;font-size:.68rem;color:#25d366;background:rgba(37,211,102,.1);padding:1px 6px;border-radius:8px;text-decoration:none">💬 WA</a>` : ''}
        </div>
      </div>
      ${c.decision_maker ? `<div class="sc-row"><span class="sc-icon">👤</span><div class="sc-val">${c.decision_maker}</div></div>` : ''}
      ${c.description ? `<div class="sc-row"><span class="sc-icon">ℹ️</span><div class="sc-val" style="font-size:.78rem;color:var(--text-muted)">${c.description.slice(0,120)}...</div></div>` : ''}
      ${c.website ? `<div class="sc-row"><span class="sc-icon">🌐</span><div class="sc-val"><a href="${c.website}" target="_blank">${c.website.replace(/^https?:\/\//,'').slice(0,40)}</a></div></div>` : ''}
    </div>
    ${socials ? `<div class="sc-socials">${socials}</div>` : ''}
    <div class="sc-footer">
      ${enrichStatus}
      ${sources}
      </div>${signalBadges}
      <div class="reenrich-progress" id="rep-${i}"><div class="reenrich-progress-fill" id="repf-${i}"></div></div>
      <div class="reenrich-log-mini" id="rel-${i}"></div>
      <div style="display:flex;gap:.4rem;margin-top:.4rem;align-items:center;flex-wrap:wrap">
        ${!c.email || !c.decision_maker ? `<button class="btn-reenrich" id="rebtn-${i}" onclick="${c.enriched ? 'reEnrichOne' : 'enrichSingleCard'}(${i})" title="${c.enriched ? 'Reintentar scraping' : 'Enriquecer esta empresa'}">
          <span class="reenrich-icon">${c.enriched ? '🔄' : '✨'}</span> ${!c.email ? (c.enriched ? 'Buscar email' : 'Enriquecer') : 'Buscar decisor'}
        </button>` : `<span style="font-size:.65rem;color:var(--success)">✅ Completo</span>`}
        ${c.email ? `<button class="btn-action" style="font-size:.7rem;margin-left:auto" onclick="quickImportOne(${i})">Volcar →</button>` : ''}
        <button class="btn-action secondary" style="padding:0 8px;font-size:.7rem" onclick="showMicroAudit(${i})" title="Ver Auditoría">📋</button>
        <button class="btn-action secondary" style="padding:0 8px;font-size:.7rem" onclick="findSimilarLeads(${i})" title="Buscar Similares">🔍</button>
      </div>
    </div>
  </div>`;
}

function renderSearchCards() {
  const grid = document.getElementById('search-cards-grid');
  if (!grid) return;
  grid.innerHTML = tempSearchResults.map((c, i) => buildCardHTML(c, i)).join('');
}

function renderSearchTable() {
  const tbody = document.getElementById('search-results-body');
  if (!tbody) return;
  tbody.innerHTML = tempSearchResults.map((c, i) => {
    const bc = c.email ? 'badge-high' : 'badge-low';
    const socLinks = [
      c.instagram ? `<a href="${c.instagram}" target="_blank" class="sc-social-badge instagram" style="font-size:.68rem">IG</a>` : '',
      c.facebook  ? `<a href="${c.facebook}"  target="_blank" class="sc-social-badge facebook"  style="font-size:.68rem">FB</a>` : '',
      c.linkedin  ? `<a href="${c.linkedin}"  target="_blank" class="sc-social-badge linkedin"  style="font-size:.68rem">LI</a>` : '',
    ].filter(Boolean).join(' ');
    const temp = calculateLeadTemperature(c);
    return `<tr onclick="if(!event.target.closest('button') && !event.target.closest('a') && !event.target.closest('input')) openSidePanel(${i})" style="cursor:pointer">
      <td><input type="checkbox" class="search-check" data-index="${i}" checked></td>
      <td>
        <div class="lead-name">${temp.icon} ${c.name}</div>
        <div class="lead-company">${c.address}</div>
        ${c.website ? `<a href="${c.website}" target="_blank" style="color:var(--primary);font-size:.7rem">🔗 web</a>` : ''}
      </td>
      <td style="font-size:.8rem">${c.phone || '—'}</td>
      <td style="font-size:.78rem;color:${c.email ? 'var(--success)' : 'var(--text-dim)'}">
        ${c.email ? `<span style="display:inline-flex;align-items:center;gap:.3rem">${c.email}<button onclick="event.stopPropagation(); copyToClipboard('${c.email}', 'Email: ${c.email}')" title="Copiar email" style="background:none;border:none;cursor:pointer;color:var(--text-dim);font-size:.8rem;padding:2px;line-height:1">⧉</button></span>` : `<input type="email" placeholder="añadir..." onchange="tempSearchResults[${i}].email=this.value;updateEnrichStats()" style="background:none;border:none;border-bottom:1px solid var(--glass-border);color:var(--text);font-size:.78rem;outline:none;width:130px">`}
      </td>
      <td style="font-size:.78rem;color:var(--text-muted)">${c.decision_maker || '—'}</td>
      <td>${socLinks || '—'}</td>
      <td style="color:${c.rating ? 'var(--warning)' : 'var(--text-dim)'}">
        ${c.rating ? '⭐ ' + c.rating : '—'}
      </td>
      <td>
        <button class="btn-action" style="font-size:.72rem" onclick="quickImportOne(${i})">Volcar</button>
        <button class="btn-action secondary" style="font-size:.72rem;padding:2px 5px" onclick="showMicroAudit(${i})">📋</button>
        <button class="btn-action secondary" style="font-size:.72rem;padding:2px 5px" onclick="findSimilarLeads(${i})">🔍</button>
      </td>
    </tr>`;
  }).join('');
}

function switchResultView(view) {
  document.getElementById('results-cards-view').style.display = view === 'cards' ? 'block' : 'none';
  document.getElementById('results-table-view').style.display = view === 'table' ? 'block' : 'none';
  document.getElementById('vtog-cards').classList.toggle('active', view === 'cards');
  document.getElementById('vtog-table').classList.toggle('active', view === 'table');
  if (view === 'table') renderSearchTable();
}

let currentResultFilter = 'all';
function filterResults(type, btn) {
  currentResultFilter = type;
  document.querySelectorAll('.rfilt').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  applyAdvancedFilters();
}

function applyAdvancedFilters() {
  const type       = currentResultFilter || 'all';
  const ratingMin  = parseFloat(document.getElementById('filter-rating-min')?.value || 0);
  const reviewsMin = parseInt(document.getElementById('filter-reviews-min')?.value || 0);
  const distMax    = parseFloat(document.getElementById('filter-dist-max')?.value || 50);
  const hasWeb     = document.getElementById('filter-has-web')?.checked || false;
  const noLeads    = document.getElementById('filter-no-leads')?.checked || false;
  const srText     = (document.getElementById('search-results-text')?.value || '').toLowerCase();
  const srHas      = document.getElementById('search-results-has')?.value || '';
  const srSort     = document.getElementById('search-results-sort')?.value || 'default';

  const cards = document.querySelectorAll('.search-card');
  let visibleCount = 0;

  cards.forEach((card, i) => {
    const c = tempSearchResults[i];
    if (!c) return;
    let show = true;

    // Filtros de tipo (quick filters)
    if (type === 'email')      show = !!c.email;
    if (type === 'phone')      show = !!c.phone;
    if (type === 'social')     show = !!(c.instagram || c.facebook || c.linkedin);
    if (type === 'noemail')    show = !c.email;
    if (type === 'decision')   show = !!c.decision_maker;
    if (type === 'signals')    show = !!(c.signals && c.signals.length > 0);
    if (type === 'new_domain') show = !!(c.domainAge !== undefined && c.domainAge <= 2);
    if (type === 'verified')   show = !!(c.legalStatus && /active|activa/i.test(c.legalStatus));

    // Filtros avanzados
    if (show && ratingMin > 0)  show = !!(c.rating && c.rating >= ratingMin);
    if (show && reviewsMin > 0) show = !!(c.ratingCount && c.ratingCount >= reviewsMin);
    if (show && distMax < 50 && c.distKm != null) show = c.distKm <= distMax;
    if (show && hasWeb) show = !!c.website;
    if (show && noLeads) {
      const _nn = n => (n||'').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,25);
      show = !leads.find(l => !l.archived && (
        (c.placeId && l.placeId && l.placeId === c.placeId) ||
        _nn(l.company) === _nn(c.name)
      ));
    }
    // Text search filter
    if (show && srText) {
      const hay = [c.name, c.email, c.website, c.phone, c.address,
        c.decision_maker, ...(c.signals||[])].join(' ').toLowerCase();
      if (!hay.includes(srText)) show = false;
    }
    // Has filter
    if (show && srHas) {
      if (srHas === 'email' && !c.email) show = false;
      if (srHas === 'phone' && !c.phone) show = false;
      if (srHas === 'web' && !c.website) show = false;
      if (srHas === 'social' && !(c.instagram||c.facebook||c.linkedin)) show = false;
      if (srHas === 'decision' && !c.decision_maker) show = false;
      if (srHas === 'whatsapp' && !c.whatsapp) show = false;
    }

    card.style.display = show ? 'block' : 'none';
    if (show) visibleCount++;
  });

  // Sort cards if needed
  if (srSort !== 'default' && tempSearchResults.length > 0) {
    const grid = document.getElementById('search-cards-grid');
    if (grid) {
      const cardEls = Array.from(grid.querySelectorAll('.search-card'));
      cardEls.sort((a, b) => {
        const ai = parseInt(a.dataset.index || 0);
        const bi = parseInt(b.dataset.index || 0);
        const ca = tempSearchResults[ai] || {};
        const cb = tempSearchResults[bi] || {};
        if (srSort === 'rating_desc')   return (cb.rating||0) - (ca.rating||0);
        if (srSort === 'reviews_desc')  return (cb.ratingCount||0) - (ca.ratingCount||0);
        if (srSort === 'name_asc')      return (ca.name||'').localeCompare(cb.name||'');
        if (srSort === 'distance_asc')  return (ca.distKm||999) - (cb.distKm||999);
        return 0;
      });
      cardEls.forEach(c => grid.appendChild(c));
    }
  }

  // Update count
  const cntEl = document.getElementById('search-results-count');
  if (cntEl) cntEl.textContent = `${visibleCount} resultados`;

  // Actualizar tabla también si está visible
  renderSearchTable();
}

function resetSearchResultsFilters() {
  ['search-results-text','search-results-sort','search-results-has'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = id === 'search-results-sort' ? 'default' : '';
  });
  applyAdvancedFilters();
}

function resetAdvancedFilters() {
  const ratingEl = document.getElementById('filter-rating-min');
  const reviewsEl = document.getElementById('filter-reviews-min');
  const distEl   = document.getElementById('filter-dist-max');
  const distValEl = document.getElementById('filter-dist-val');
  const webEl = document.getElementById('filter-has-web');
  const leadsEl = document.getElementById('filter-no-leads');
  const valEl = document.getElementById('filter-rating-val');
  if (ratingEl) ratingEl.value = 0;
  if (reviewsEl) reviewsEl.value = 0;
  if (distEl) distEl.value = 50;
  if (distValEl) distValEl.textContent = '50km';
  if (webEl) webEl.checked = false;
  if (leadsEl) leadsEl.checked = false;
  if (valEl) valEl.textContent = '0';
  filterResults('all', document.querySelector('.rfilt'));
}


function toggleAllSearch(checked) {
  document.querySelectorAll('.search-check').forEach(c => c.checked = checked);
}

// ─── VOLCAR A LEADS ───────────────────────────────────────────────────────────
async function importSelectedSearch() {
  // Safe fallbacks for segment/location (may be empty in some search modes)
  const segEl  = document.getElementById('plan-segment');
  const locEl  = document.getElementById('plan-location');
  const segment  = segEl?.value  || 'Otros';
  const location = locEl?.value?.trim() || 'búsqueda';
  const checked = document.querySelectorAll('.search-check:checked');
  const indices = [...new Set([...checked].map(c => parseInt(c.getAttribute('data-index'))))];

  if (!indices.length) { showToast('⚠️ Selecciona al menos una empresa'); return; }

  let imported = 0;
  indices.forEach(i => {
    const c = tempSearchResults[i];
    if (!c) return;
    // Skip if already in leads
    if (leads.some(l => l.company === c.name && !l.archived)) return;
    const socials = [c.instagram, c.facebook, c.linkedin, c.twitter].filter(Boolean).join(' | ');
    const signal = [
      c.address ? `Ubicación: ${c.address}` : '',
      c.rating  ? `Rating: ${c.rating}/5 (${c.ratingCount} reseñas)` : '',
      c.description ? c.description.slice(0,120) : '',
    ].filter(Boolean).join('. ');

    leads.unshift({
      id: Date.now() + Math.random(),
      name: c.decision_maker?.split('(')[0]?.trim() || 'Responsable',
      company: c.name,
      email: c.email || '',
      phone: c.phone || '',
      segment, website: c.website || '',
      signal: signal || `Encontrado en ${location}`,
      score: calculateScore(c.decision_maker ? 'manager' : 'otros', 'mediano', signal, { rating: c.rating, ratingCount: c.ratingCount, email: c.email, phone: c.phone, signals: c.signals || [], enrichSource: c.enrichSource || [], segment }),
      status: 'Pendiente',
      date: new Date().toISOString(),
      status_date: new Date().toISOString(),
      notes: `Redes: ${socials || '—'}\nEmails adicionales: ${c.emails?.join(', ')||'—'}`,
      activity: [{ action: `Volcado desde búsqueda "${location}"`, date: new Date().toISOString() }],
      source: 'search',
      rating: c.rating || null,
      ratingCount: c.ratingCount || 0,
      placeId: c.placeId || '',
      address: c.address || '',
      description: c.description || '',
      tags: [], budget: 0, next_contact: ''
    });
    imported++;
  });

  saveLeads();
  renderAll();
  renderDashboardCharts();
  updateStreakData();
  showToast(`✅ ${imported} empresas volcadas a Leads`);
}

function quickImportOne(idx) {
  const c = tempSearchResults[idx];
  if (!c) return;
  if (leads.some(l => l.company === c.name && !l.archived)) { showToast(`${c.name} ya está en Leads`); return; }
  const segment = document.getElementById('plan-segment').value;
  const location = document.getElementById('plan-location').value.trim();

  // Construir señal con toda la info disponible
  let signalParts = [];
  if (c.description) signalParts.push(c.description.slice(0,120));
  if (c.signals?.length) signalParts.push(c.signals.join(' | '));
  if (c.domainAge !== undefined) signalParts.push(`Dominio ${c.domainYear} (${c.domainAge} años)`);
  if (c.incorporationYear) signalParts.push(`Fundada ${c.incorporationYear}`);
  if (!signalParts.length) signalParts.push(`Encontrado en ${location}`);

  const extraData = {
    rating: c.rating,
    ratingCount: c.ratingCount,
    email: c.email,
    phone: c.phone,
    decision_maker: c.decision_maker,
    signals: c.signals || [],
    techStack: c.techStack || [],
    webLoadMs: c.webLoadMs || null,
    hasSitemap: c.hasSitemap || false,
    enrichSource: c.enrichSource || [],
    legalStatus: c.legalStatus || '',
    segment,
  };

  leads.unshift({
    id: Date.now(),
    name: c.decision_maker?.split('(')[0]?.trim() || 'Responsable',
    company: c.name,
    email: c.email || '',
    phone: c.phone || '',
    segment,
    website: c.website || '',
    signal: signalParts.join(' — ').slice(0, 300),
    score: calculateScore(c.decision_maker ? 'manager' : 'otros', 'mediano', signalParts.join(' '), extraData),
    status: 'Pendiente',
    date: new Date().toISOString(),
    notes: '',
    rating: c.rating,
    ratingCount: c.ratingCount,
    placeId: c.placeId || '',
    decision_maker: c.decision_maker || '',
    instagram: c.instagram || '',
    facebook: c.facebook || '',
    linkedin: c.linkedin || '',
    twitter: c.twitter || '',
    youtube: c.youtube || '',
    domainAge: c.domainAge,
    domainYear: c.domainYear,
    incorporationYear: c.incorporationYear,
    legalStatus: c.legalStatus || '',
    logo: c.logo || '',
    signals: c.signals || [],
    techStack: c.techStack || [],
    webLoadMs: c.webLoadMs || null,
    hasSitemap: c.hasSitemap || false,
    enrichSource: c.enrichSource || [],
    address: c.address || '',
    description: c.description || '',
    tags: [], budget: 0, next_contact: '',
    source: 'busqueda',
    activity: [{ action: `Lead importado desde búsqueda en ${location}`, date: new Date().toISOString() }],
    reviewSummary: c.reviewSummary || '',
    reviewPain: c.reviewPain || [],
    competitorBetter: c.competitorBetter || null,
    distKm: c.distKm || null,
    sslValid: c.sslValid,
    optimalContact: c.optimalContact || null,
    fachadaAnalysis: c.fachadaAnalysis || '',
  });
  saveLeads();
  renderLeads();
  updateStats();
  updateStreakData();
  showToast(`✅ ${c.name} añadida a Leads`);
}


function exportSearchCSV() {
  if (!tempSearchResults.length) { showToast('No hay resultados que exportar'); return; }

  const headers = [
    'Empresa','Dirección','Rating','Reseñas','Email','Teléfono','Web',
    'Decisor','LinkedIn','Instagram','Facebook','Twitter','WhatsApp',
    'Descripción','Señales','Fuentes','TechStack','CMS',
    'Año dominio','Edad dominio','Año fundación','Estado legal',
    'Velocidad web (ms)','Emails adicionales','Teléfonos adicionales'
  ];

  const rows = tempSearchResults.map(c => [
    c.name || '',
    c.address || '',
    c.rating || '',
    c.ratingCount || '',
    c.email || '',
    c.phone || '',
    c.website || '',
    c.decision_maker || '',
    c.linkedin || '',
    c.instagram || '',
    c.facebook || '',
    c.twitter || '',
    c.whatsapp || '',
    (c.description || '').replace(/"/g, '""').slice(0, 200),
    (c.signals || []).join(' | ').replace(/"/g, '""'),
    (c.enrichSource || []).join(', '),
    (c.techStack || []).join(', '),
    (c.techStack || []).find(t => /WordPress|Wix|Shopify|Squarespace|Webflow|PrestaShop|Joomla/i.test(t)) || '',
    c.domainYear || '',
    c.domainAge !== undefined ? c.domainAge + ' años' : '',
    c.incorporationYear || '',
    c.legalStatus || '',
    c.webLoadMs || '',
    (c.emails || []).slice(1).join(' | '),
    (c.phones || []).slice(1).join(' | '),
  ]);

  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  // BOM para que Excel en Windows abra correctamente con tildes
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `voltflow_${document.getElementById('plan-segment').value}_${document.getElementById('plan-location').value}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`CSV exportado: ${tempSearchResults.length} empresas con ${headers.length} columnas ✓`);
}



// ══════════════════════════════════════════════════════════════════════════
// ██  MÓDULO: UTILS
// ──  Utilidades generales (sleep, formateo, validación, helpers)
// ──  Funciones: sleep, stripHtml, extractDomain, isValidEmail, formatPhone, normalizeText,
  //          scoreEmail, buildSignalCorrelation, applyContactWindow
// ══════════════════════════════════════════════════════════════════════════

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============ GOOGLE MAPS LOADER ============
function loadGoogleMapsScript(apiKey) {
  if (document.getElementById('google-maps-script')) return;
  const script = document.createElement('script');
  script.id = 'google-maps-script';
  script.textContent = `(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]);for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src="https://maps.googleapis.com/maps/api/js?"+e.toString();d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once."):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({key:"${apiKey}",v:"weekly"});`;
  document.head.appendChild(script);
}



// ══════════════════════════════════════════════════════════════════════════
// ██  MÓDULO: SEGMENT QUERIES
// ──  segmentQueries y getSegmentQueries están definidas en email-templates.js
// ──  (cargado antes que este módulo) — no redeclarar aquí.
// ══════════════════════════════════════════════════════════════════════════

// ── Parche: añadir sectores extendidos a getSegmentQueries ───────────────
// Extiende la función original de email-templates.js sin modificar ese archivo.
// Sectores añadidos: Residencias, Dental, Medico, Estetico, Deportivo
(function patchExtendedSegmentQueries() {
  const _originalGetSegmentQueries = (typeof getSegmentQueries === 'function')
    ? getSegmentQueries
    : null;

  // ── Mapa de queries por sector ────────────────────────────────────────────
  // Cada array combina términos generales + específicos para maximizar cobertura
  // en Google Places API (textQuery). Orden: más probable → menos probable.
  const EXTENDED_QUERIES = {

    // ── Residencias de Ancianos ────────────────────────────────────────────
    'Residencias': [
      'residencia de ancianos',
      'residencia de mayores',
      'centro de mayores',
      'centro geriátrico',
      'geriátrico',
      'residencia tercera edad',
      'centro día mayores',
    ],

    // ── Clínicas Dentales ─────────────────────────────────────────────────
    // Captura desde clínicas premium hasta dentistas de barrio y ortodoncias
    'Dental': [
      'clínica dental',
      'dentista',
      'clínica odontológica',
      'odontólogo',
      'ortodoncia',
      'implantes dentales clínica',
      'clínica de odontología',
      'dental clínica',
      'clínica estomatológica',
      'estomatólogo',
      'ortopedia dental',
      'clínica dental infantil',
    ],

    // ── Centros Médicos ───────────────────────────────────────────────────
    // Captura clínicas generales, policlínicas, especialidades y centros privados
    'Medico': [
      'centro médico',
      'clínica médica',
      'policlínica',
      'clínica privada',
      'consulta médica',
      'médico especialista',
      'centro de salud privado',
      'clínica especialidades médicas',
      'clínica traumatología',
      'clínica dermatología',
      'clínica ginecología',
      'clínica oftalmología',
      'clínica psicología',
      'clínica fisioterapia',
      'unidad médica',
    ],

    // ── Centros Estéticos ─────────────────────────────────────────────────
    // Captura centros de belleza, medicina estética, peluquerías premium y spas
    'Estetico': [
      'centro estético',
      'clínica de estética',
      'medicina estética',
      'centro de belleza',
      'spa',
      'salón de belleza',
      'peluquería y estética',
      'micropigmentación',
      'depilación láser centro',
      'tratamientos faciales centro',
      'centro estetica corporal',
      'instituto de belleza',
      'centro de depilación',
      'clínica estética corporal',
    ],

    // ── Centros Deportivos ────────────────────────────────────────────────
    // Captura gimnasios, clubs deportivos, centros de fitness y piscinas
    'Deportivo': [
      'gimnasio',
      'centro deportivo',
      'club deportivo',
      'polideportivo',
      'fitness center',
      'centro de fitness',
      'piscina municipal',
      'pádel club',
      'club de tenis',
      'yoga studio',
      'pilates centro',
      'crossfit box',
      'box fitness',
      'academia de artes marciales',
      'club de natación',
      'instalaciones deportivas',
    ],
  };

  window.getSegmentQueries = function(segment) {
    // Buscar primero en el mapa extendido
    if (EXTENDED_QUERIES[segment]) {
      return EXTENDED_QUERIES[segment];
    }
    // Delegar al original para el resto de segmentos (Industrial, Retail, Oficinas, etc.)
    if (_originalGetSegmentQueries) return _originalGetSegmentQueries(segment);
    return [segment]; // fallback de seguridad
  };
})();


// ── MEJORA: Panel Lateral de Vista Rápida (Side Panel) ──────────────────────
function openQuickView(lead, index) {
  let panel = document.getElementById('gordi-side-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'gordi-side-panel';
    panel.style = `
      position:fixed; top:0; right:-450px; width:450px; height:100%;
      background:var(--bg-card); border-left:1px solid var(--glass-border);
      box-shadow:-10px 0 30px rgba(0,0,0,0.3); z-index:9000;
      transition:right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display:flex; flex-direction:column; overflow:hidden; backdrop-filter:blur(15px);
    `;
    document.body.appendChild(panel);
  }

  const socials = [
    lead.instagram ? `<a href="${lead.instagram}" target="_blank">📸 IG</a>` : '',
    lead.facebook ? `<a href="${lead.facebook}" target="_blank">📘 FB</a>` : '',
    lead.linkedin ? `<a href="${lead.linkedin}" target="_blank">💼 LI</a>` : '',
  ].filter(Boolean).join(' · ');

  panel.innerHTML = `
    <div style="padding:25px; border-bottom:1px solid var(--glass-border); background:linear-gradient(to bottom right, rgba(255,255,255,0.05), transparent)">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px">
        <button onclick="closeQuickView()" style="background:none; border:none; color:var(--text-dim); font-size:20px; cursor:pointer">✕</button>
        <div style="display:flex; gap:10px">
          <button class="btn-action" onclick="quickImportOne(${index}); closeQuickView()">📥 Importar</button>
          <button class="btn-action" onclick="showMicroAudit(${index})">📋 Auditoría</button>
        </div>
      </div>
      <h2 style="margin:0; font-size:22px; color:var(--text)">${lead.name}</h2>
      <div style="color:var(--primary); font-weight:600; font-size:14px; margin-top:5px">${lead.category || 'Empresa'}</div>
    </div>
    
    <div style="flex:1; overflow-y:auto; padding:25px">
      <div style="display:grid; gap:20px">
        <section>
          <h3 style="font-size:12px; text-transform:uppercase; color:var(--text-dim); margin-bottom:10px">Información de Contacto</h3>
          <div style="background:rgba(255,255,255,0.03); padding:15px; border-radius:12px; border:1px solid rgba(255,255,255,0.05)">
            <div style="margin-bottom:8px">✉️ <a href="mailto:${lead.email}" style="color:var(--text)">${lead.email || 'No disponible'}</a></div>
            <div style="margin-bottom:8px">📞 ${lead.phone || 'No disponible'}</div>
            <div style="margin-bottom:8px">🌐 <a href="${lead.website}" target="_blank" style="color:var(--text)">${lead.website || 'No disponible'}</a></div>
            <div style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(255,255,255,0.05)">${socials || 'Sin redes detectadas'}</div>
          </div>
        </section>

        <section>
          <h3 style="font-size:12px; text-transform:uppercase; color:var(--text-dim); margin-bottom:10px">Análisis de Oportunidad</h3>
          <div style="display:flex; gap:10px; margin-bottom:15px">
             <div style="flex:1; text-align:center; padding:10px; background:rgba(255,255,255,0.03); border-radius:10px">
                <div style="font-size:18px; font-weight:bold">${lead.rating || '—'}</div>
                <div style="font-size:10px; color:var(--text-dim)">RATING</div>
             </div>
             <div style="flex:1; text-align:center; padding:10px; background:rgba(255,255,255,0.03); border-radius:10px">
                <div style="font-size:18px; font-weight:bold">${lead.ratingCount || '0'}</div>
                <div style="font-size:10px; color:var(--text-dim)">RESEÑAS</div>
             </div>
          </div>
          <div style="background:rgba(255,255,255,0.03); padding:15px; border-radius:12px; border:1px solid rgba(255,255,255,0.05)">
            <p style="margin:0; font-size:13px; line-height:1.5; color:var(--text-dim)">${lead.description || 'Sin descripción disponible.'}</p>
          </div>
        </section>

        <section>
          <h3 style="font-size:12px; text-transform:uppercase; color:var(--text-dim); margin-bottom:10px">Señales de Ventas</h3>
          <div style="display:flex; flex-wrap:wrap; gap:8px">
            ${(lead.signals || []).map(s => `<span style="font-size:11px; background:rgba(10, 132, 255, 0.1); color:var(--primary); padding:4px 10px; border-radius:20px; border:1px solid rgba(10, 132, 255, 0.2)">${s}</span>`).join('')}
            ${(lead.techStack || []).slice(0,5).map(t => `<span style="font-size:11px; background:rgba(255,255,255,0.05); color:var(--text-dim); padding:4px 10px; border-radius:20px">${t}</span>`).join('')}
          </div>
        </section>
      </div>
    </div>

    <div style="padding:20px; border-top:1px solid var(--glass-border); display:flex; gap:10px">
       <button class="btn-primary" style="flex:1" onclick="quickImportOne(${index}); closeQuickView()">Añadir a mi Pipeline</button>
       <button class="btn-outline" onclick="findSimilarLeads(${index})">🔍 Similares</button>
    </div>
  `;

  setTimeout(() => panel.style.right = '0', 10);
}

function closeQuickView() {
  const panel = document.getElementById('gordi-side-panel');
  if (panel) panel.style.right = '-450px';
}

// ── MEJORA: Filtros Inteligentes de Un Clic ──────────────────────────────
function injectQuickFilters() {
  const container = document.querySelector('.search-results-header');
  if (!container || document.getElementById('gordi-quick-filters')) return;

  const filters = document.createElement('div');
  filters.id = 'gordi-quick-filters';
  filters.style = "display:flex; gap:10px; margin:15px 0; overflow-x:auto; padding-bottom:5px; scrollbar-width:none";
  filters.innerHTML = `
    <button class="btn-outline btn-sm q-filt" onclick="applyQuickFilter('hot')" style="border-radius:20px; white-space:nowrap">🔥 Muy Caliente</button>
    <button class="btn-outline btn-sm q-filt" onclick="applyQuickFilter('old')" style="border-radius:20px; white-space:nowrap">🦖 Web Obsoleta</button>
    <button class="btn-outline btn-sm q-filt" onclick="applyQuickFilter('low_rating')" style="border-radius:20px; white-space:nowrap">⭐ Rating Bajo</button>
    <button class="btn-outline btn-sm q-filt" onclick="applyQuickFilter('no_web')" style="border-radius:20px; white-space:nowrap">🌐 Sin Web</button>
    <button class="btn-outline btn-sm q-filt" onclick="applyQuickFilter('all')" style="border-radius:20px; white-space:nowrap; background:var(--glass)">Todos</button>
  `;
  container.after(filters);
}

function applyQuickFilter(type) {
  // Reset de filtros avanzados primero
  resetAdvancedFilters();
  
  const ratingEl = document.getElementById('filter-rating-min');
  const webEl = document.getElementById('filter-has-web');
  const srTextEl = document.getElementById('search-results-text');

  if (type === 'hot') {
    ratingEl.value = 4;
  } else if (type === 'old') {
    srTextEl.value = 'obsoleta';
  } else if (type === 'low_rating') {
    // Para rating bajo, usamos el filtro de texto o invertimos la lógica (custom)
    // Aquí simplificamos usando una señal específica
    srTextEl.value = 'rating bajo';
  } else if (type === 'no_web') {
    // Este requeriría un filtro "Does NOT have web" que no existe, lo simulamos
    // Pero para no romper, usamos un trigger que applyAdvancedFilters entienda
  }

  // Estética de botones
  document.querySelectorAll('.q-filt').forEach(b => b.style.background = 'none');
  event.target.style.background = 'var(--glass)';

  applyAdvancedFilters();
}

// ── MEJORA: Sugerencias de Búsqueda Predictiva ──────────────────────────
const GORDI_SUGGESTIONS = [
  'Clinica Dental', 'Reforma Viviendas', 'Gimnasio Crossfit', 
  'Residencia Mayores', 'Centro Estética', 'Abogados Laborales',
  'Taller Mecánico', 'Restaurante con Terraza', 'Escuela Infantil'
];

function initPredictiveSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;

  const datalist = document.createElement('datalist');
  datalist.id = 'gordi-search-suggestions';
  GORDI_SUGGESTIONS.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    datalist.appendChild(opt);
  });
  document.body.appendChild(datalist);
  input.setAttribute('list', 'gordi-search-suggestions');
}

// Inyectar al cargar
setTimeout(() => {
  injectQuickFilters();
  initPredictiveSearch();
}, 2000);

// ─── MEJORAS DE USABILIDAD (Side Panel, Temperature, Audit) ──────────────────

function calculateLeadTemperature(c) {
  let score = 0;
  if (c.email) score += 30;
  if (c.phone) score += 10;
  if (c.decision_maker) score += 20;
  if (c.rating && c.rating < 4) score += 15; // Oportunidad de mejora
  if (c.ratingCount && c.ratingCount > 50) score += 10; // Empresa establecida
  if (c.signals && c.signals.length > 0) score += 15;

  if (score >= 70) return { label: 'Hirviendo', icon: '🔥', color: '#ff4d4d', desc: 'Lead de alta prioridad con múltiples señales de cierre.' };
  if (score >= 40) return { label: 'Templado', icon: '⛅', color: '#ffa500', desc: 'Lead interesado con datos de contacto verificados.' };
  return { label: 'Gélido', icon: '❄️', color: '#00ccff', desc: 'Lead frío, requiere más investigación o primer contacto.' };
}

function openSidePanel(idx) {
  const c = tempSearchResults[idx];
  if (!c) return;

  let panel = document.getElementById('search-side-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'search-side-panel';
    panel.className = 'glass-panel';
    panel.style = "position:fixed;top:0;right:-450px;width:450px;height:100%;z-index:2000;background:rgba(15,15,20,0.95);backdrop-filter:blur(20px);border-left:1px solid var(--glass-border);box-shadow:-10px 0 30px rgba(0,0,0,0.5);transition:right 0.4s cubic-bezier(0.16, 1, 0.3, 1);padding:2rem;overflow-y:auto";
    document.body.appendChild(panel);
  }

  const temp = calculateLeadTemperature(c);
  const initials = (c.name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();

  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem">
      <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted)">Ficha del Lead</div>
      <button onclick="closeSidePanel()" style="background:none;border:none;color:var(--text);cursor:pointer;font-size:1.5rem">×</button>
    </div>

    <div style="display:flex;gap:1.5rem;align-items:center;margin-bottom:2rem">
      <div class="sc-avatar" style="width:80px;height:80px;font-size:1.5rem">
        ${c.logo ? `<img src="${c.logo}" onerror="this.parentElement.innerHTML='${initials}'">` : initials}
      </div>
      <div>
        <h2 style="margin:0;font-size:1.4rem">${c.name}</h2>
        <div style="display:flex;gap:0.5rem;margin-top:0.5rem">
           <span style="background:${temp.color}22;color:${temp.color};padding:2px 10px;border-radius:12px;font-size:0.75rem;border:1px solid ${temp.color}44">${temp.icon} ${temp.label}</span>
           ${c.rating ? `<span style="background:rgba(255,215,0,0.1);color:#ffd700;padding:2px 10px;border-radius:12px;font-size:0.75rem;border:1px solid rgba(255,215,0,0.3)">⭐ ${c.rating}</span>` : ''}
        </div>
      </div>
    </div>

    <div class="panel-section" style="margin-bottom:2rem">
      <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem">Descripción</div>
      <div style="font-size:0.9rem;line-height:1.6">${c.description || 'Sin descripción detallada.'}</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:2rem">
      <div class="info-box" style="background:rgba(255,255,255,0.03);padding:1rem;border-radius:12px;border:1px solid var(--glass-border)">
        <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:0.3rem">Email</div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:.5rem">
          <div style="font-size:0.85rem;word-break:break-all">${c.email || '—'}</div>
          ${c.email ? `<button onclick="copyToClipboard('${c.email}', 'Email: ${c.email}')" title="Copiar email" style="background:none;border:none;cursor:pointer;color:var(--text-dim);font-size:.9rem;padding:2px">⧉</button>` : ''}
        </div>
      </div>
      <div class="info-box" style="background:rgba(255,255,255,0.03);padding:1rem;border-radius:12px;border:1px solid var(--glass-border)">
        <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:0.3rem">Teléfono</div>
        <div style="font-size:0.85rem">${c.phone || '—'}</div>
      </div>
      <div class="info-box" style="background:rgba(255,255,255,0.03);padding:1rem;border-radius:12px;border:1px solid var(--glass-border)">
        <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:0.3rem">Web</div>
        <div style="font-size:0.85rem">${c.website ? `<a href="${c.website}" target="_blank" style="color:var(--primary)">${c.website.replace(/^https?:\/\/(www\.)?/,'').split('/')[0]}</a>` : '—'}</div>
      </div>
      <div class="info-box" style="background:rgba(255,255,255,0.03);padding:1rem;border-radius:12px;border:1px solid var(--glass-border)">
        <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:0.3rem">Decisor</div>
        <div style="font-size:0.85rem">${c.decision_maker || '—'}</div>
      </div>
    </div>

    <div style="margin-top:auto;display:flex;flex-direction:column;gap:0.75rem">
      <button class="btn-action" style="width:100%;padding:1rem" onclick="quickImportOne(${idx})">Volcar al CRM</button>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
        <button class="btn-action secondary" onclick="showMicroAudit(${idx})">📋 Auditoría</button>
        <button class="btn-action secondary" onclick="findSimilarLeads(${idx})">🔍 Similares</button>
      </div>
    </div>
  `;

  panel.style.right = '0';
}

function closeSidePanel() {
  const panel = document.getElementById('search-side-panel');
  if (panel) panel.style.right = '-450px';
}

function showMicroAudit(idx) {
  const c = tempSearchResults[idx];
  if (!c) return;
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);backdrop-filter:blur(8px);z-index:3000;display:flex;align-items:center;justify-content:center;padding:2rem";
  
  const content = document.createElement('div');
  content.className = 'glass-card';
  content.style = "max-width:600px;width:100%;padding:2.5rem;position:relative;max-height:90vh;overflow-y:auto";
  
  const temp = calculateLeadTemperature(c);
  
  content.innerHTML = `
    <button onclick="this.closest('.modal-overlay').remove()" style="position:absolute;top:1.5rem;right:1.5rem;background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.2rem">×</button>
    <div style="text-align:center;margin-bottom:2rem">
      <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.2em;color:var(--primary);margin-bottom:0.5rem">Micro-Auditoría de Lead</div>
      <h2 style="margin:0">${c.name}</h2>
    </div>

    <div style="display:grid;gap:1.5rem">
      <div class="audit-item">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">
          <span>Temperatura Comercial</span>
          <strong style="color:${temp.color}">${temp.label}</strong>
        </div>
        <div style="height:6px;background:rgba(255,255,255,0.1);border-radius:3px">
          <div style="width:${temp.label==='Hirviendo'?'100%':temp.label==='Templado'?'60%':'30%'};height:100%;background:${temp.color};border-radius:3px"></div>
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.03);padding:1.5rem;border-radius:15px;border:1px solid var(--glass-border)">
        <h4 style="margin:0 0 1rem 0">Puntos Fuertes</h4>
        <ul style="margin:0;padding-left:1.2rem;font-size:0.85rem;line-height:1.8;color:var(--text-muted)">
          ${c.email ? '<li>Email verificado y listo para outreach</li>' : ''}
          ${c.phone ? '<li>Teléfono de contacto directo disponible</li>' : ''}
          ${c.decision_maker ? '<li>Persona de decisión identificada</li>' : ''}
          ${c.rating && c.rating > 4.5 ? '<li>Reputación excelente en el mercado</li>' : ''}
          ${c.signals?.length ? c.signals.map(s => `<li>Señal detectada: ${s}</li>`).join('') : '<li>Empresa establecida en la zona</li>'}
        </ul>
      </div>

      <div style="background:rgba(245,158,11,0.05);padding:1.5rem;border-radius:15px;border:1px solid rgba(245,158,11,0.2)">
        <h4 style="margin:0 0 1rem 0;color:var(--warning)">Ángulo de Venta Recomendado</h4>
        <p style="margin:0;font-size:0.85rem;line-height:1.6">${getAngleRecommendation(c)}</p>
      </div>
    </div>

    <button class="btn-action" style="width:100%;margin-top:2rem" onclick="quickImportOne(${idx});this.closest('.modal-overlay').remove()">Importar y Generar Email</button>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
}

function getAngleRecommendation(c) {
  if (c.rating && c.rating < 3.5) return "Tienen una puntuación baja. El ángulo ideal es ofrecerles una mejora estética o de infraestructura que mejore la experiencia percibida de sus clientes.";
  if (c.signals?.some(s => s.toLowerCase().includes('apertura'))) return "Señal de local nuevo. El ángulo es ofrecer servicios de mantenimiento preventivo y puesta a punto de instalaciones para asegurar que el arranque sea perfecto.";
  if (c.decision_maker) return `Contacto directo con ${c.decision_maker.split('(')[0]}. El ángulo debe ser profesional y centrado en la eficiencia operativa y ahorro energético de sus instalaciones.`;
  return "Empresa consolidada. El ángulo es la modernización de sistemas eléctricos para mejorar la eficiencia y cumplir con normativas actuales.";
}

function findSimilarLeads(idx) {
  const c = tempSearchResults[idx];
  if (!c) return;
  
  const query = c.name + " " + (c.segment || "");
  showToast(`🔍 Buscando empresas similares a ${c.name}...`);
  
  // Pre-rellenar buscador y disparar
  const input = document.getElementById('search-input');
  if (input) {
    input.value = query;
    const btn = document.getElementById('btn-search');
    if (btn) btn.click();
  }
}
