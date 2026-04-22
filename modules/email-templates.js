// ============ PLANTILLAS EMAIL — VOLTIUM MADRID ============
// Copywriting profesional: estructura PAS + prueba social + CTA de baja fricción
// Personalización por sector usando datos reales de la empresa contactada
const defaultTemplates = {

  // ── OFICINAS ─────────────────────────────────────────────────────────────────
  // Pain: la reforma paraliza la empresa. Hook: nosotros no paramos nada.
  "Oficinas": {
    subjectA: "Una pregunta rápida sobre las oficinas de {{Company}}",
    subjectB: "{{Company}}: ¿cuánto cuesta mantener unas oficinas que ya no funcionan?",
    body: `{{SALUDO}},

Le escribo con una pregunta directa: ¿cuánto está costando a {{Company}} trabajar en unas instalaciones que ya no están a la altura?

No me refiero solo al coste económico. Me refiero al impacto diario: la imagen que transmite a los clientes que visitan las oficinas, la productividad que se pierde con espacios mal distribuidos, o el coste energético de unas instalaciones obsoletas.

En Voltium Madrid llevamos años resolviendo exactamente ese problema para empresas como la suya. Lo hacemos de una forma que casi nadie ofrece: ejecutamos toda la reforma sin detener su actividad — trabajando por fases, en horario nocturno o en fin de semana, según lo que mejor encaje con su operativa.

Sin improvisaciones. Presupuesto cerrado desde el primer día. Un único interlocutor durante todo el proyecto. Y toda la documentación de la obra en un apartado web privado al que puede acceder cuando quiera.

¿El resultado? Oficinas renovadas sin haber perdido un solo día de trabajo.

Puede ver algunos proyectos en: https://www.voltiummadrid.es/galer%c3%Ada

Si le parece, podemos hablar 15 minutos esta semana. Sin compromiso. Solo para ver si tiene sentido explorar opciones juntos.

{{FIRMA}}`
  },

  // ── HOTELES ──────────────────────────────────────────────────────────────────
  // Pain: bajar la nota media destruye el RevPAR. Hook: la reforma es inversión, no gasto.
  "Hoteles": {
    subjectA: "Una reforma en {{Company}} que pague sola en 18 meses",
    subjectB: "{{Company}}: lo que dicen las reseñas sobre sus instalaciones",
    body: `{{SALUDO}},

En el sector hotelero hay una relación directa y documentada entre el estado de las instalaciones y el precio medio por noche que el establecimiento puede cobrar.

Cada punto de valoración en Booking o TripAdvisor tiene un impacto real en la tarifa y en la ocupación. Y muchas veces, la diferencia entre un 8,2 y un 8,7 está en cosas concretas: el estado del baño de las habitaciones, la primera impresión del hall, o el confort de las zonas comunes.

En Voltium Madrid nos especializamos en reformas hoteleras con una premisa clara: que la obra no interfiera con la operativa del establecimiento. Trabajamos planta por planta, o durante la temporada baja, con plazos garantizados por contrato y presupuesto cerrado desde el primer día.

Incluimos también mejoras de eficiencia energética — aislamientos, instalaciones, fotovoltaica — que reducen el consumo y mejoran la rentabilidad a largo plazo.

Puede ver algunos de nuestros proyectos aquí: https://www.voltiummadrid.es/galer%c3%Ada

¿Le parece bien una llamada de 15 minutos para ver qué tiene más sentido para {{Company}}?

{{FIRMA}}`
  },

  // ── RETAIL ───────────────────────────────────────────────────────────────────
  // Pain: el cliente decide en los primeros 8 segundos. Hook: el espacio vende o espanta.
  "Retail": {
    subjectA: "{{Company}}: el espacio que ahora tiene está vendiendo menos de lo que podría",
    subjectB: "Una pregunta sobre el local de {{Company}}",
    body: `{{SALUDO}},

Los estudios de comportamiento del consumidor son claros: el cliente decide si entra o no en un establecimiento en menos de 8 segundos. Y una vez dentro, el entorno físico influye directamente en cuánto tiempo se queda y cuánto gasta.

El problema es que cuando un local lleva años igual, uno deja de verlo como lo ven los clientes nuevos.

En Voltium Madrid trabajamos con comercios para renovar espacios de venta con un criterio claro: cada decisión de diseño y distribución tiene que servir para vender más. Fachadas, escaparates, distribución interior, iluminación, materiales — todo pensado para que el cliente entre, se quede y vuelva.

Ejecutamos la reforma minimizando los días de cierre, o directamente sin cerrar, trabajando en tramos horarios que no afecten a la actividad.

Presupuesto cerrado, un único responsable de obra y toda la documentación del proyecto accesible para usted en todo momento.

Puede ver ejemplos de nuestro trabajo en: https://www.voltiummadrid.es/galer%c3%Ada

¿Le gustaría que le mostrásemos qué podría hacerse en el local de {{Company}}? Una visita sin compromiso, y le damos una valoración inicial el mismo día.

{{FIRMA}}`
  },

  // ── INDUSTRIAL ───────────────────────────────────────────────────────────────
  // Pain: la normativa no espera, y una paralización cuesta mucho más que la obra.
  "Industrial": {
    subjectA: "{{Company}}: instalaciones industriales y cumplimiento normativo",
    subjectB: "Una cuestión técnica sobre las instalaciones de {{Company}}",
    body: `{{SALUDO}},

Le escribo porque en Voltium Madrid trabajamos habitualmente con instalaciones industriales en la zona y hay una tendencia que estamos viendo con frecuencia: muchas naves y centros de producción acumulan necesidades de adecuación normativa que se van aplazando — hasta que dejan de poder aplazarse.

Una inspección, un cambio de actividad, una ampliación o simplemente el paso del tiempo acaban poniendo sobre la mesa obras que conviene haber planificado con antelación.

Lo que ofrecemos es exactamente eso: un diagnóstico técnico previo, una planificación que minimiza el impacto en la producción, y una ejecución con plazos garantizados por contrato.

Trabajamos en instalaciones eléctricas, aislamientos, impermeabilizaciones, redistribución de espacios y mejoras de eficiencia energética — incluyendo soluciones fotovoltaicas que reducen el coste eléctrico de forma significativa.

También ofrecemos mantenimiento integral de naves: revisiones periódicas que detectan problemas — filtraciones, deterioro de cubierta, instalaciones obsoletas, sistemas contra incendios — antes de que paren la producción. Un único responsable técnico, calendario fijo y presupuesto cerrado.

Sin parar la producción. Sin sorpresas de presupuesto. Con un único interlocutor técnico durante todo el proceso.

Puede ver proyectos similares en: https://www.voltiummadrid.es/galer%c3%Ada

¿Tendría sentido una visita técnica gratuita a las instalaciones de {{Company}}? Sin compromiso — solo para ver qué situación tienen y si podemos ser de ayuda.

{{FIRMA}}`
  },

  // ── EDUCATIVO ────────────────────────────────────────────────────────────────
  // Pain: la obra no puede convivir con el centro en funcionamiento. Hook: solo trabajamos cuando no estáis.
  "Educativo": {
    subjectA: "Reforma de {{Company}} en verano — sin afectar al curso",
    subjectB: "{{Company}}: instalaciones educativas y el problema del tiempo de obra",
    body: `{{SALUDO}},

El mayor obstáculo que tienen los centros educativos para mejorar sus instalaciones no es el presupuesto. Es el tiempo.

Una obra en un colegio o academia no puede convivir con el funcionamiento normal del centro. Y eso deja una ventana muy estrecha: el verano, Navidad, Semana Santa.

En Voltium Madrid llevamos años especializándonos exactamente en eso. Planificamos la obra con meses de antelación, la ajustamos al calendario lectivo del centro y la ejecutamos en los periodos no lectivos, con plazos cerrados por contrato.

Trabajamos en reformas integrales, mejora de aislamientos, renovación de instalaciones, impermeabilizaciones y eficiencia energética — incluyendo instalaciones fotovoltaicas que pueden reducir significativamente la factura eléctrica del centro.

Presupuesto claro desde el principio. Un único responsable de proyecto. Y toda la documentación accesible en un espacio web privado durante toda la obra.

Puede ver algunos de nuestros trabajos aquí: https://www.voltiummadrid.es/galer%c3%Ada

¿Le parece bien que hablemos 15 minutos para ver qué necesidades tiene {{Company}} y si podemos ayudarles de cara a este verano?

{{FIRMA}}`
  },

  // ── DEPORTIVO ────────────────────────────────────────────────────────────────
  // Pain: las bajas de socios por instalaciones deterioradas cuestan más que la reforma.
  "Deportivo": {
    subjectA: "{{Company}}: lo que cuesta no renovar las instalaciones",
    subjectB: "Una propuesta para las instalaciones de {{Company}}",
    body: `{{SALUDO}},

En el sector del fitness y los centros deportivos hay un dato que se repite: la principal razón por la que un socio no renueva no es el precio. Es la percepción de que las instalaciones no están al nivel de lo que paga.

Vestuarios deteriorados, maquinaria vieja, zonas comunes sin actualizar — son señales que el socio recibe cada día y que acaban pesando más que cualquier oferta de fidelización.

La buena noticia es que una reforma bien planificada no requiere cerrar el centro. En Voltium Madrid ejecutamos las obras por fases — primero una zona, luego otra — para que la actividad pueda seguir durante todo el proceso.

Trabajamos en redistribución de espacios, renovación de vestuarios e instalaciones, mejora del aislamiento acústico y térmico, y eficiencia energética — incluyendo instalaciones fotovoltaicas que reducen el coste operativo del centro.

Presupuesto cerrado, un único responsable de obra y plazos garantizados.

Puede ver proyectos similares en: https://www.voltiummadrid.es/galer%c3%Ada

¿Le viene bien una llamada de 10 minutos para contarle cómo lo haríamos en {{Company}}?

{{FIRMA}}`
  },

  // ── CULTURAL ─────────────────────────────────────────────────────────────────
  // Pain: los espacios culturales tienen restricciones únicas. Hook: sabemos trabajar con ellas.
  "Cultural": {
    subjectA: "{{Company}}: reforma de espacios con actividad en marcha",
    subjectB: "Una propuesta de reforma para {{Company}}",
    body: `{{SALUDO}},

Los espacios culturales tienen una exigencia que pocos contratistas saben gestionar bien: la obra no puede interferir con la programación, los plazos son inamovibles y el espacio tiene una identidad que hay que preservar.

En Voltium Madrid trabajamos con esta lógica desde el principio. Antes de tocar nada, planificamos con detalle: qué fases se ejecutan, en qué momentos, y cómo se protege la actividad del espacio durante el proceso.

Trabajamos en redistribución y mejora de espacios, renovación de instalaciones, aislamientos acústicos y térmicos, impermeabilizaciones e incluyendo en su caso soluciones de eficiencia energética.

Un único responsable técnico durante toda la obra. Presupuesto cerrado. Documentación completa del proyecto accesible en todo momento.

Puede ver algunos de nuestros trabajos aquí: https://www.voltiummadrid.es/galer%c3%Ada

¿Tienen previsto alguna actuación en las instalaciones de {{Company}} este año? Me gustaría conocer la situación y ver si podemos ser de ayuda.

{{FIRMA}}`
  },

  // ── COMERCIAL ────────────────────────────────────────────────────────────────
  // Pain: un día cerrado es dinero perdido. Hook: reformamos sin que cierres.
  "Comercial": {
    subjectA: "{{Company}}: reforma integral sin un día de cierre",
    subjectB: "Una pregunta sobre las instalaciones de {{Company}}",
    body: `{{SALUDO}},

En centros y espacios comerciales, cada día de cierre por obras tiene un coste directo: ventas que no se producen, clientes que van a la competencia y no siempre vuelven.

Por eso en Voltium Madrid trabajamos de una forma diferente: planificamos la reforma por fases y en horarios que no afectan a la actividad, para que {{Company}} pueda seguir operando durante todo el proceso.

Nos encargamos de la reforma integral — redistribución de espacios, renovación de instalaciones, mejora de aislamientos, actualización de acabados — con un único responsable de proyecto, presupuesto cerrado desde el primer día y plazos garantizados por contrato.

También evaluamos mejoras de eficiencia energética que pueden tener un impacto significativo en los costes operativos a medio plazo.

Puede ver algunos de nuestros proyectos en: https://www.voltiummadrid.es/galer%c3%Ada

¿Tiene sentido que hablemos 15 minutos para ver qué opciones existen para {{Company}}?

{{FIRMA}}`
  },

  // ── DEFAULT ──────────────────────────────────────────────────────────────────
  "Default": {
    subjectA: "Una propuesta para las instalaciones de {{Company}}",
    subjectB: "{{Company}}: reforma integral sin sorpresas — Voltium Madrid",
    body: `{{SALUDO}},

Me pongo en contacto con usted porque en Voltium Madrid trabajamos con empresas e instituciones para gestionar reformas integrales de principio a fin — con toda la planificación, coordinación y control que ese tipo de proyectos requiere.

Lo que nos diferencia es la forma en que trabajamos: presupuesto cerrado desde el primer día, un único responsable técnico durante toda la obra, y toda la documentación del proyecto accesible en un espacio privado para el cliente.

Sin improvisaciones. Sin sorpresas. Sin tener que estar encima de varios gremios a la vez.

También incluimos en nuestros proyectos mejoras de eficiencia energética — aislamientos, instalaciones, y en su caso fotovoltaica — que reducen los costes operativos a largo plazo.

Puede ver algunos de nuestros trabajos en: https://www.voltiummadrid.es/galer%c3%Ada

¿Tienen previsto alguna actuación en las instalaciones de {{Company}} este año o el próximo? Me gustaría conocer la situación y ver si tiene sentido explorar opciones juntos.

{{FIRMA}}`
  }
};

// Múltiples queries por segmento para mayor cobertura y variedad
const segmentQueries = {
  // ── MEJORA 2: Queries ampliadas con sinónimos ES-España + variantes EN ──────
  // Las queries en inglés activan más nodos del índice de Places aunque estemos en España
  "Industrial": [
    "naves industriales logística", "almacenes industriales",
    "polígono industrial empresa", "fábrica producción industrial",
    "industrial warehouse storage", "manufacturing plant factory",
    "taller mecánico industrial", "empresa fabricación producción",
    "logistics company warehouse", "planta industrial nave"
  ],
  "Retail": [
    "tiendas retail locales comerciales", "boutique moda tienda",
    "comercio minorista local", "franquicia tienda retail",
    "retail store shop boutique", "clothing store fashion shop",
    "local comercial negocio", "tienda especializada comercio",
    "concept store tienda", "shop local business retail"
  ],
  "Oficinas": [
    "oficinas corporativas empresa", "sede empresarial oficina",
    "coworking centro de negocios", "asesoría consultoría oficina",
    "corporate office headquarters", "business center coworking",
    "despacho profesional empresa", "consultora agencia empresa",
    "gestoría asesoría despacho", "empresa servicios profesionales"
  ],
  "Hoteles": [
    "hotel boutique", "hotel negocio",
    "hostal pensión alojamiento", "apartahotel turismo",
    "hotel business travel", "boutique hotel accommodation",
    "hotel cuatro estrellas", "hotel tres estrellas",
    "alojamiento turístico rural", "hotel spa resort"
  ],
  "Educativo": [
    "colegio privado concertado", "academia formación centro",
    "guardería escuela infantil", "universidad escuela master",
    "private school academy", "training center education",
    "centro formación profesional", "escuela de negocios",
    "instituto educativo privado", "centro de estudios academia"
  ],
  "Deportivo": [
    "gimnasio fitness centro deportivo", "club deportivo instalaciones",
    "piscina pádel tenis club", "crossfit box deportivo",
    "gym fitness center sport", "sports club padel tennis",
    "polideportivo instalaciones deportivas", "club de golf natación",
    "wellness center spa gym", "pilates yoga estudio"
  ],
  "Cultural": [
    "museo galería arte cultural", "teatro sala espectáculos",
    "centro cultural fundación", "sala exposiciones arte",
    "museum gallery art center", "theater concert hall venue",
    "espacio cultural eventos", "sala de conciertos teatro",
    "galería de arte contemporáneo", "fundación cultural espacio"
  ],
  "Comercial": [
    "centro comercial galería", "supermercado hipermercado",
    "gran superficie comercial", "mercado municipal retail",
    "shopping center mall", "supermarket hypermarket",
    "galería comercial tiendas", "parque comercial outlet",
    "mercado gourmet alimentación", "comercial plaza tiendas"
  ]
};

// Devuelve array de queries para el segmento
function getSegmentQueries(segment) {
  const q = segmentQueries[segment];
  if (!q) return [segment];
  return Array.isArray(q) ? q : [q];
}

const SEGMENT_COLORS = {
  "Oficinas": "#0A84FF",
  "Retail": "#f59e0b",
  "Industrial": "#a78bfa",
  "Hoteles": "#f472b6",
  "Educativo": "#34d399",
  "Deportivo": "#fb923c",
  "Cultural": "#e879f9",
  "Comercial": "#38bdf8",
  "Default": "#7a8ba0"
};

// ─── TONOS Y CONTEXTO POR SEGMENTO ───────────────────────────────────────────
const SEGMENT_TONE = {
  "Hoteles": {
    tone: "elegante y orientado a la experiencia del huésped. Habla de 'experiencia', 'confort', 'valoraciones', 'precio por noche', 'ocupación'. El decisor suele ser el director de operaciones o propietario. Son muy sensibles a su reputación online.",
    pain: "las quejas recurrentes en reseñas (ruido, instalaciones antiguas, temperatura) que bajan directamente su nota media y su tarifa por habitación.",
    angle: "cada punto de rating perdido en Booking equivale a X€ menos por noche. La reforma no es un gasto, es una inversión con ROI medible.",
    forbidden: "nunca mencionar 'clientes' — son 'huéspedes'. No decir 'barato' ni 'económico'."
  },
  "Retail": {
    tone: "directo y orientado a conversión. Habla de 'ticket medio', 'tiempo de permanencia', 'primeros 8 segundos', 'experiencia de compra', 'tráfico'. El decisor es el propietario o director comercial.",
    pain: "cada día con el local cerrado por obras son ventas perdidas. La imagen del espacio afecta directamente a cuánto está dispuesto a pagar el cliente.",
    angle: "Voltium trabaja por fases sin cerrar el local. La reforma del espacio aumenta el ticket medio y la permanencia.",
    forbidden: "no hablar de 'estructura' ni 'normativa' — aburre. Foco en cómo se ve y cómo vende."
  },
  "Oficinas": {
    tone: "profesional y racional. Habla de 'productividad', 'imagen corporativa', 'coste energético', 'retención de talento', 'employer branding'. El decisor es el facility manager, director de operaciones o CEO.",
    pain: "oficinas obsoletas aumentan la rotación de empleados y dañan la imagen en reuniones con clientes. El coste energético de instalaciones antiguas es mensurable.",
    angle: "reforma que se amortiza en X meses por ahorro energético + mejora de productividad demostrable.",
    forbidden: "no ser demasiado informal. Este sector valora la seriedad y los datos concretos."
  },
  "Industrial": {
    tone: "técnico y enfocado en eficiencia. Habla de 'producción', 'cumplimiento normativo', 'coste eléctrico', 'seguridad laboral', 'eficiencia', 'continuidad operativa', 'mantenimiento preventivo'. El decisor es el director de planta, gerente o propietario.",
    pain: "instalaciones antiguas generan paradas de producción, multas por incumplimiento normativo y facturas eléctricas disparadas. Muchos propietarios de naves no tienen un plan de mantenimiento preventivo — y los problemas (filtraciones, fallos eléctricos, deterioro de cubierta) se acumulan hasta que obligan a paradas de emergencia que cuestan mucho más que haberlos evitado.",
    angle: "dos ángulos fuertes: (1) instalación fotovoltaica que reduce la factura eléctrica entre un 40-70%, ROI en 3-5 años, sin parar la producción; (2) contrato de mantenimiento integral de la nave — visitas periódicas que detectan problemas antes de que paren la producción, con un único interlocutor técnico y presupuesto cerrado. Usa el ángulo que mejor encaje con las señales del lead.",
    forbidden: "no hablar de estética. En industrial solo importa lo funcional, lo seguro y lo rentable."
  },
  "Educativo": {
    tone: "empático y orientado al bienestar. Habla de 'alumnos', 'confort térmico', 'acústica', 'calendario lectivo', 'comunidad educativa'. El decisor es el director o gerente del centro.",
    pain: "el calendario lectivo no se puede interrumpir. Las obras deben hacerse en verano o fines de semana sin afectar a las clases.",
    angle: "Voltium planifica toda la obra antes de empezar y ejecuta en períodos no lectivos. Sin sorpresas, sin retrasos.",
    forbidden: "no mencionar 'precio' en las primeras líneas. Primero el beneficio para alumnos y familias."
  },
  "Deportivo": {
    tone: "energético y enfocado en socios. Habla de 'socios', 'retención', 'bajas', 'competencia', 'instalaciones de referencia'. El decisor es el gerente o propietario.",
    pain: "los socios se van cuando las instalaciones están deterioradas. La competencia con instalaciones nuevas les gana clientes cada mes.",
    angle: "reforma por fases sin cerrar el centro. Los socios no se van porque siguen entrenando durante la obra.",
    forbidden: "no hablar de 'reducción de costes' como argumento principal — aquí el argumento es retener y atraer socios."
  },
  "Cultural": {
    tone: "respetuoso con la identidad del espacio. Habla de 'programación', 'plazos', 'identidad del espacio', 'experiencia cultural'. El decisor es el director artístico, gerente o propietario.",
    pain: "los plazos en espacios culturales son inamovibles — el evento está programado y vendido. Cualquier retraso en obra es un desastre.",
    angle: "Voltium entrega con presupuesto y plazo cerrados desde el día 1. Documentación en tiempo real. Sin sorpresas.",
    forbidden: "no hablar de 'modernizar' si el espacio tiene identidad histórica — se dice 'rehabilitar' o 'poner en valor'."
  },
  "Comercial": {
    tone: "orientado a rentabilidad del espacio. Habla de 'afluencia', 'ocupación de locales', 'experiencia del visitante', 'zonas comunes'. El decisor es el director del centro o property manager.",
    pain: "las zonas comunes deterioradas reducen el atractivo del centro y afectan a la renovación de contratos con inquilinos.",
    angle: "reforma de zonas comunes que aumenta la afluencia y justifica rentas más altas a los inquilinos.",
    forbidden: "no dirigirse como si fuera un local pequeño — son gestores de activos inmobiliarios, lenguaje más corporativo."
  },
  "Default": {
    tone: "profesional y directo. Adapta el lenguaje al contexto del negocio.",
    pain: "el problema más recurrente que detectes en reseñas o en la web.",
    angle: "cómo Voltium resuelve exactamente ese problema con sus diferenciales.",
    forbidden: "frases genéricas que podrían enviarse a cualquier empresa."
  }
};



