// ============ ESTADO ============
let leads = [];
let emailHistory = [];
let campaigns = [];
let emailTemplates = {};
let tempImportLeads = [];
let tempSearchResults = [];
let selectedLeadIds = new Set();
let undoBuffer = null;
let undoTimer = null;
let searchHistoryList = [];
let objectives = { leads: 20, emails: 10, replies: 3 };
let scrapingQualityLog = [];

// 🏛️ ARQUITECTURA: Bus de Eventos Simple
// Permite que los módulos se comuniquen sin estar acoplados
const VoltiumEvents = {
    _events: {},
    on(event, callback) {
        if (!this._events[event]) this._events[event] = [];
        this._events[event].push(callback);
    },
    emit(event, data) {
        if (!this._events[event]) return;
        this._events[event].forEach(callback => callback(data));
    }
};

// Helper para notificar cambios de estado
function notifyStateChange(module) {
    VoltiumEvents.emit('state:changed', { module });
}

function getGeminiKey() {
    return localStorage.getItem('gordi_gemini_key') || localStorage.getItem('gordi_claude_key') || '';
}
