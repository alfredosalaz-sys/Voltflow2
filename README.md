# Voltium CRM

Aplicación web CRM modular servida via GitHub Pages.

## Estructura

```
voltium/
├── index.html              # HTML limpio (~2.500 líneas)
├── styles/
│   └── main.css            # Todo el CSS (~3.400 líneas)
└── modules/
    ├── state.js            # Estado global compartido
    ├── email-templates.js  # Plantillas de email
    ├── scoring.js          # Motor de scoring de leads
    ├── init.js             # Inicialización, navegación, perfil, API keys
    ├── search.js           # Motor de búsqueda 3 capas + scraping
    ├── leads.js            # CRUD leads + modal detalle
    ├── dashboard.js        # Dashboard, kanban, tracking, campañas
    ├── ai-email.js         # Motor email IA + utils
    ├── chat.js             # VoltFlow Assistant (chat IA)
    ├── ui.js               # Toast, light mode, bulk, backup, PIN
    ├── inbox.js            # Bandeja entrada + hilo emails
    ├── ai-router.js        # Router IA multi-proveedor v2
    └── misc.js             # Mejoras de usabilidad y rendimiento
```

## Deploy en GitHub Pages

1. Sube este repo a GitHub
2. Ve a **Settings → Pages**
3. En *Source* selecciona `main` branch, carpeta `/` (root)
4. Guarda — en ~1 minuto estará en `https://tuusuario.github.io/voltium`

## Desarrollo local

Necesitas un servidor local (no funciona abriendo el HTML directamente por CORS):

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .
```

Luego abre `http://localhost:8080`
