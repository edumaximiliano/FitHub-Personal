/**
 * FitHub Personal — API wrapper + gerenciamento de sessão
 *
 * Carregado por login.html e app.html.
 * Endpoint do Apps Script é configurado abaixo.
 */

const API_BASE = 'https://script.google.com/macros/s/AKfycbwspUu1MHNicyeLJALo0Xl8wLXHQgx_dskrdHsPPYRH1blFC7MGYEvR7afhokYooy0/exec';

/* ===================== SESSÃO ===================== */
/* Sessão fica no localStorage. Persiste entre abas e reloads.
   O usuário só sai manualmente (botão Sair). */

const Session = {
  KEY: 'fithub:session',

  save(personal) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(personal));
    } catch (e) { console.error('Storage falhou', e); }
  },
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  clear() {
    try { localStorage.removeItem(this.KEY); } catch {}
  },
  get email()    { return this.load()?.email || ''; },
  get nome()     { return this.load()?.nome  || ''; },
  isLoggedIn()   { return !!this.load(); },
  requireLogin() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },
};

/* ===================== API CORE ===================== */

async function _call(method, action, params, body) {
  const qs = new URLSearchParams({ action, ...(params || {}) }).toString();
  const url = `${API_BASE}?${qs}`;

  const opts = { method };
  if (body) {
    // text/plain evita preflight CORS no Apps Script
    opts.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
    opts.body = JSON.stringify({ action, ...body });
  }

  let res;
  try {
    res = await fetch(url, opts);
  } catch (e) {
    throw new Error('Sem conexão com o servidor. Verifique sua internet.');
  }

  if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); }
  catch {
    throw new Error('Resposta inválida do servidor (não-JSON). URL do Apps Script pode estar errada.');
  }

  if (!data.ok) throw new Error(data.erro || 'Erro desconhecido');
  return data;
}

/* ===================== API PÚBLICA ===================== */

const API = {
  ping()                 { return _call('GET', 'ping'); },

  login(email, codigo)   { return _call('GET', 'login', { email, codigo }); },

  list(entity)           {
    return _call('GET', 'list', { entity, email: Session.email });
  },

  create(entity, fields) {
    return _call('POST', 'create', null,
      { entity, personalEmail: Session.email, ...fields });
  },

  update(entity, id, fields) {
    return _call('POST', 'update', null,
      { entity, id, personalEmail: Session.email, ...fields });
  },

  remove(entity, id) {
    return _call('POST', 'delete', null,
      { entity, id, personalEmail: Session.email });
  },
};

/* ===================== CONSTANTES COMPARTILHADAS ===================== */

const MUSCLE_GROUPS = [
  { id: 'peito',       label: 'Peito' },
  { id: 'costas',      label: 'Costas' },
  { id: 'ombros',      label: 'Ombros' },
  { id: 'biceps',      label: 'Bíceps' },
  { id: 'triceps',     label: 'Tríceps' },
  { id: 'pernas',      label: 'Pernas' },
  { id: 'gluteos',     label: 'Glúteos' },
  { id: 'abdomen',     label: 'Abdômen' },
  { id: 'panturrilha', label: 'Panturrilha' },
  { id: 'trapezio',    label: 'Trapézio' },
  { id: 'antebraco',   label: 'Antebraço' },
  { id: 'cardio',      label: 'Cardio' },
  { id: 'hiit',        label: 'HIIT' },
  { id: 'funcional',   label: 'Funcional' },
  { id: 'mobilidade',  label: 'Mobilidade' },
];

const GYM_COLORS = [
  { id: 'lime',    hex: '#bef264', name: 'Lime' },
  { id: 'orange',  hex: '#fb923c', name: 'Orange' },
  { id: 'cyan',    hex: '#22d3ee', name: 'Cyan' },
  { id: 'purple',  hex: '#a78bfa', name: 'Purple' },
  { id: 'rose',    hex: '#fb7185', name: 'Rose' },
  { id: 'emerald', hex: '#34d399', name: 'Emerald' },
  { id: 'amber',   hex: '#fbbf24', name: 'Amber' },
  { id: 'blue',    hex: '#60a5fa', name: 'Blue' },
];
const gymColor = (id) => GYM_COLORS.find(c => c.id === id) || GYM_COLORS[0];

const WEEKDAYS = [
  { id: 0, short: 'DOM', label: 'Domingo' },
  { id: 1, short: 'SEG', label: 'Segunda' },
  { id: 2, short: 'TER', label: 'Terça' },
  { id: 3, short: 'QUA', label: 'Quarta' },
  { id: 4, short: 'QUI', label: 'Quinta' },
  { id: 5, short: 'SEX', label: 'Sexta' },
  { id: 6, short: 'SAB', label: 'Sábado' },
];

// Slots de 1 hora, 06:00 às 22:00
const HOUR_SLOTS = ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'];

/* ===================== HELPERS ===================== */

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const fmtDate = (iso) => {
  if (!iso) return '';
  const [y,m,d] = String(iso).split('-');
  return `${d}/${m}/${y}`;
};
const monthLabel = (yyyymm) => {
  const [y,m] = yyyymm.split('-');
  const names = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  return `${names[+m - 1]}/${y.slice(2)}`;
};
const weekdayFromISO = (iso) => {
  const [y,m,d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
};
const slotOfTime = (hhmm) => {
  // mapeia "07:30" -> "07:00", "07:00" -> "07:00"
  if (!hhmm) return null;
  const h = hhmm.split(':')[0].padStart(2,'0');
  return `${h}:00`;
};
