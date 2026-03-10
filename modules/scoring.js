// ============ SCORING ============
// ══════════════════════════════════════════════════════════════════════════════
// SCORING DINÁMICO — NIVEL 1
// Puntuación basada en señales reales, no solo cargo y tamaño
// ══════════════════════════════════════════════════════════════════════════════

// ── Pesos de scoring por sector ──────────────────────────────────────────────
const SECTOR_WEIGHTS = {
  'hotel':         { multiplier: 1.8, newsBonus: 15, hasReservationsBonus: 10 },
  'hostel':        { multiplier: 1.6, newsBonus: 12, hasReservationsBonus: 8  },
  'restaurante':   { multiplier: 1.3, newsBonus: 10, hasReservationsBonus: 5  },
  'bar':           { multiplier: 1.1, newsBonus: 8,  hasReservationsBonus: 3  },
  'gimnasio':      { multiplier: 1.4, newsBonus: 10, hasReservationsBonus: 6  },
  'clinica':       { multiplier: 1.5, newsBonus: 8,  hasReservationsBonus: 4  },
  'hospital':      { multiplier: 2.0, newsBonus: 12, hasReservationsBonus: 10 },
  'oficina':       { multiplier: 1.5, newsBonus: 10, hasReservationsBonus: 5  },
  'coworking':     { multiplier: 1.6, newsBonus: 12, hasReservationsBonus: 6  },
  'supermercado':  { multiplier: 1.9, newsBonus: 8,  hasReservationsBonus: 3  },
  'almacen':       { multiplier: 1.7, newsBonus: 8,  hasReservationsBonus: 3  },
  'fabrica':       { multiplier: 1.8, newsBonus: 10, hasReservationsBonus: 3  },
  'colegio':       { multiplier: 1.6, newsBonus: 8,  hasReservationsBonus: 4  },
  'default':       { multiplier: 1.0, newsBonus: 5,  hasReservationsBonus: 3  },
};

function getSectorWeights(segment) {
  if (!segment) return SECTOR_WEIGHTS['default'];
  const seg = segment.toLowerCase();
  for (const key of Object.keys(SECTOR_WEIGHTS)) {
    if (key !== 'default' && seg.includes(key)) return SECTOR_WEIGHTS[key];
  }
  return SECTOR_WEIGHTS['default'];
}

function calculateScore(role, size, signal, extraData) {
  let s = 0;
  const ex = extraData || {};

  // ── Cargo del decisor (0-25 pts) ─────────────────────────────────────────
  if (role === 'director') s += 25;
  else if (role === 'manager') s += 15;
  else s += 5;

  // ── Tamaño / potencial económico (0-20 pts) ───────────────────────────────
  if (size === 'grande') s += 20;
  else if (size === 'mediano') s += 12;
  else s += 4;

  // ── Señales de oportunidad (0-30 pts) ────────────────────────────────────
  const sig = (signal || '').toLowerCase();
  // Rating bajo = instalaciones deterioradas = oportunidad reforma
  if (ex.rating && ex.rating < 3.5) s += 15;
  else if (ex.rating && ex.rating < 4.2) s += 8;
  // Muchas reseñas = negocio activo con visibilidad
  if (ex.ratingCount && ex.ratingCount > 100) s += 8;
  else if (ex.ratingCount && ex.ratingCount > 30) s += 4;
  // Señal manual con contenido relevante
  if (sig.length > 80) s += 7;
  else if (sig.length > 30) s += 3;
  // Señales urgentes en texto
  const urgentKeywords = ['reforma','renovaci','instalaci','obra','ampliac','traslado','apertura','nuevo local','nueva sede'];
  if (urgentKeywords.some(k => sig.includes(k))) s += 10;

  // ── Datos de contacto (0-15 pts) ─────────────────────────────────────────
  if (ex.email) s += 8;
  if (ex.phone) s += 4;
  if (ex.decision_maker) s += 3;

  // ── Señales enriquecidas de scraping (0-20 pts bonus) ────────────────────
  // Web lenta = abandono tecnológico
  if (ex.webLoadMs && ex.webLoadMs > 4000) s += 6;
  // Anuncios activos en Facebook = presupuesto disponible
  if ((ex.enrichSource || []).includes('FB-Ads')) s += 7;
  // Cambio de nombre = nueva gestión = máxima oportunidad
  const signalStrFull = (ex.signals || []).join(' ').toLowerCase();
  if (signalStrFull.includes('cambio de nombre')) s += 12;
  // En expansión o contratando = presupuesto en movimiento
  if (signalStrFull.includes('contratación activa') || signalStrFull.includes('apertura')) s += 8;

  // ── Señales enriquecidas de scraping originales ─────────────────────────
  const signals = ex.signals || [];
  const signalStr = signals.join(' ').toLowerCase();
  // Dominio reciente = empresa nueva, muy alta necesidad
  if (signalStr.includes('dominio muy reciente')) s += 12;
  // Empresa con años = consolidada, solvente
  if (signalStr.includes('empresa consolidada') || signalStr.includes('empresa de')) s += 5;
  // Señal de obra detectada en scraping
  if (signalStr.includes('obra') || signalStr.includes('reforma')) s += 10;
  // Sin web = altísima oportunidad digitalización + reforma
  if (signalStr.includes('sin web')) s += 8;
  // Negocio muy activo
  if (signalStr.includes('negocio activo')) s += 5;
  // Empresa con datos de Apollo = muy cualificada
  if ((ex.enrichSource || []).includes('Apollo.io')) s += 8;
  // Empresa verificada en OpenCorporates y activa
  if (ex.legalStatus && /active|activa/i.test(ex.legalStatus)) s += 5;
  // Empresa en disolución = penalizar
  if (signalStr.includes('proceso de disolución')) s -= 20;

  // ── Bonus por noticias recientes (Google News) ────────────────────────────
  if (signalStr.includes('en prensa') || signalStr.includes('apertura reciente') ||
      signalStr.includes('contrato') || signalStr.includes('operación corporativa') ||
      signalStr.includes('obra/reforma en prensa')) {
    const weights = getSectorWeights(ex.segment || '');
    s += weights.newsBonus;
  }

  // ── Multiplicador por sector ─────────────────────────────────────────────
  // Solo aplica si hay dato de segmento en extraData
  if (ex.segment) {
    const weights = getSectorWeights(ex.segment);
    // Aplicar multiplicador de forma suave (no duplicar el score, sino bonificar)
    const bonus = Math.round((s * (weights.multiplier - 1)) * 0.4);
    s += bonus;
  }

  // ── Lookalike bonus — similitud con clientes ya convertidos (hasta +15 pts)
  const _llB = getLookalikeSimilarity(ex);
  if (_llB >= 80) s += 15;
  else if (_llB >= 60) s += 8;
  else if (_llB >= 40) s += 4;

  return Math.min(Math.max(Math.round(s), 0), 100);
}

// Recalcula el score de un lead con todos sus datos
function recalculateLeadScore(lead) {
  return calculateScore(
    lead.role || 'otros',
    lead.size || 'mediano',
    lead.signal || '',
    {
      rating: lead.rating,
      ratingCount: lead.ratingCount,
      email: lead.email,
      phone: lead.phone,
      decision_maker: lead.decision_maker || lead.name
    }
  );
}

