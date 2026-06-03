# Voltium CRM

Aplicacion web CRM modular. El proyecto puede estar en GitHub para distribuir y actualizar el codigo, pero el trabajo diario debe hacerse en local desde la misma URL del navegador para conservar los datos guardados.

## Estructura

```text
voltium/
├── app.html
├── index.html
├── styles/
│   └── main.css
└── modules/
    ├── state.js
    ├── email-templates.js
    ├── scoring.js
    ├── init.js
    ├── search.js
    ├── leads.js
    ├── dashboard.js
    ├── ai-email.js
    ├── chat.js
    ├── ui.js
    ├── inbox.js
    ├── ai-router.js
    ├── misc.js
    └── smart-import.js
```

## Flujo Correcto

GitHub debe ser el canal de actualizacion del codigo. El usuario no debe trabajar un dia en GitHub Pages y otro dia en local si espera ver los mismos leads.

El navegador guarda `localStorage` por URL exacta. Estas direcciones no comparten datos entre si:

```text
https://usuario.github.io/proyecto/app.html
http://localhost:8765/app.html
http://127.0.0.1:8765/app.html
file:///C:/.../app.html
```

## Uso Local Estable

Desde la carpeta del proyecto:

```bash
python -m http.server 8765 --bind 127.0.0.1
```

Abrir siempre:

```text
http://127.0.0.1:8765/app.html
```

## Actualizar Sin Perder Datos

1. Cerrar la herramienta.
2. Actualizar los archivos desde GitHub en la misma carpeta local.
3. Arrancar el servidor con el mismo host y puerto.
4. Abrir exactamente `http://127.0.0.1:8765/app.html`.

La app conserva leads, scraping, seguimiento, campanas, memoria comercial y API keys en el navegador bajo esa URL. Tambien crea snapshots y rescates criticos automaticos antes de actualizaciones, importaciones y guardados peligrosos.

## Recuperacion

En `Configuracion -> Gestion de Datos` hay herramientas para:

- Diagnosticar almacenamiento.
- Ver rescates criticos.
- Exportar rescate critico.
- Restaurar backup.
- Pegar backup JSON.
- Exportar datos portatiles.

