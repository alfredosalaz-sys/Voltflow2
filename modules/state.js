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

