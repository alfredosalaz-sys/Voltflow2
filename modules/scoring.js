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
  'residencia':    { multiplier: 1.7, newsBonus: 10, hasReservationsBonus: 6  },
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


// ── Lookalike Similarity — similitud con clientes convertidos ─────────────────
function getLookalikeSimilarity(extraData) {
  try {
    const converted = (leads || []).filter(l => l.status === 'Convertido' || l.status === 'Cliente');
    if (!converted.length) return 0;
    const ex = extraData || {};
    let totalScore = 0;
    for (const client of converted) {
      let sim = 0;
      if (ex.segment && client.segment && ex.segment.toLowerCase() === client.segment.toLowerCase()) sim += 40;
      if (ex.size    && client.size    && ex.size    === client.size)    sim += 20;
      if (ex.role    && client.role    && ex.role    === client.role)    sim += 20;
      const rDiff = Math.abs((ex.rating || 0) - (client.rating || 0));
      if (rDiff < 0.5) sim += 20;
      else if (rDiff < 1) sim += 10;
      totalScore = Math.max(totalScore, sim);
    }
    return Math.min(totalScore, 100);
  } catch { return 0; }
}

// ── Lead Temperature — Idea 1 (Gélido, Templado, Hirviendo) ──────────────────
function calculateLeadTemperature(lead) {
  const s = lead.score || lead.priority || 0;
  const signals = [...(lead.signals || []), ...(lead.enrichSource || [])].join(' ').toLowerCase();
  const hasUrgent = /reforma|obra|deterioro|obsoleto|vacío|alquiler|nuevo|legacy/.test(signals);
  
  if (s >= 75 || (s >= 50 && hasUrgent)) {
    return { label: 'HIRVIENDO', color: '#ef4444', icon: '🔥', class: 'temp-hot' };
  } else if (s >= 40 || hasUrgent) {
    return { label: 'TEMPLADO', color: '#f59e0b', icon: '🌡️', class: 'temp-warm' };
  } else {
    return { label: 'GÉLIDO', color: '#3b82f6', icon: '❄️', class: 'temp-cold' };
  }
}

// ── Micro-Auditoría (Idea 2) ──────────────────────────────────────────────────
function generateMicroAuditHtml(lead) {
  const temp = calculateLeadTemperature(lead);
  const signalsHtml = (lead.signals || []).map(s => `<li>${s}</li>`).join('');
  const tech = (lead.techStack || []).join(', ') || 'Desconocida';
  
  return `
    <div class="audit-report" style="font-family:sans-serif;color:#1e293b;line-height:1.5;padding:20px;background:#fff;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:2px solid #f1f5f9;padding-bottom:15px;">
        <div>
           <h2 style="margin:0;color:#0f172a;font-size:20px;">${lead.company || lead.name}</h2>
           <p style="margin:2px 0 0 0;font-size:12px;color:#64748b;">${lead.website || 'Sin web'}</p>
        </div>
        <div style="background:${temp.color}22;color:${temp.color};padding:6px 14px;border-radius:20px;font-size:13px;font-weight:bold;border:1px solid ${temp.color}44">
          ${temp.icon} ${temp.label}
        </div>
      </div>
      
      <div style="background:#f8fafc;padding:15px;border-radius:8px;margin-bottom:20px;border-left:4px solid #3b82f6">
        <h3 style="margin:0 0 10px 0;font-size:15px;color:#334155">Diagnóstico de Oportunidad</h3>
        <p style="margin:0;font-size:14px;color:#475569">${lead.description || 'Analizando potencial de reforma y mejora energética...'}</p>
      </div>

      <div style="margin-bottom:20px">
        <h4 style="margin:0 0 10px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">Señales de Valor</h4>
        <ul style="margin:0;padding-left:20px;font-size:13px;color:#334155;">
          ${signalsHtml || '<li>Detectando señales de mercado...</li>'}
        </ul>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:20px">
        <div style="background:#f1f5f9;padding:12px;border-radius:6px">
          <span style="display:block;font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:4px">Tecnología Web</span>
          <strong style="font-size:13px;color:#0f172a">${tech}</strong>
        </div>
        <div style="background:#f1f5f9;padding:12px;border-radius:6px">
          <span style="display:block;font-size:10px;color:#64748b;text-transform:uppercase;margin-bottom:4px">Presencia Google</span>
          <strong style="font-size:13px;color:#0f172a">${lead.rating || '4.0'}⭐ (${lead.ratingCount || 10} reseñas)</strong>
        </div>
      </div>

      <div style="background:#0f172a;color:#fff;padding:15px;border-radius:8px;text-align:center;">
        <p style="margin:0 0 10px 0;font-size:13px;opacity:0.9">Propuesta sugerida: Renovación de iluminación LED y modernización de fachada.</p>
        <div style="font-size:14px;font-weight:bold;">Interlocutor: ${lead.decision_maker || 'Gerencia'}</div>
      </div>
    </div>
  `;
}
