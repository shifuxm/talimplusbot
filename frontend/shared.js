/* shared.js - O'quv Markazi CRM */

const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

function getTid() { return tg?.initDataUnsafe?.user?.id?.toString() || null; }

async function api(method, path, body) {
  const r = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-telegram-id': getTid() || '' },
    body: body ? JSON.stringify(body) : undefined
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Xatolik');
  return d;
}
const G = p => api('GET', p);
const P = (p, b) => api('POST', p, b);
const U = (p, b) => api('PUT', p, b);
const D = p => api('DELETE', p);

function fmt(n) { return Number(n).toLocaleString('ru-RU') + " so'm"; }

function mLabel(my) {
  if (!my) return '';
  const [y, m] = my.split('-');
  const ms = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr'];
  return ms[parseInt(m) - 1] + ' ' + y;
}

function sixMonths() {
  const now = new Date(), res = [];
  for (let i = -2; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    if (k >= '2026-04') res.push(k);
  }
  return res;
}
function nowMonth() { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`; }

let _toastTimer;
function toast(msg, ms = 2800) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; t.style.display = 'block';
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.style.display = 'none', ms);
}

function ld() { return `<div style="display:flex;justify-content:center;padding:48px"><svg style="animation:spin .7s linear infinite" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#07568A" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg></div>`; }
function em(msg) { return `<div style="text-align:center;padding:48px 20px;color:#9ca3af"><div style="font-size:48px;margin-bottom:12px">📭</div><div style="font-size:14px">${msg}</div></div>`; }

function openModal(title, html) {
  closeModal();
  const d = document.createElement('div');
  d.id = 'modal';
  d.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:500;display:flex;align-items:flex-end';
  d.innerHTML = `<div style="background:#fff;border-radius:24px 24px 0 0;width:100%;max-height:92vh;overflow-y:auto;animation:slideUp .25s ease;overscroll-behavior:contain">
    <div style="padding:12px 20px 16px;border-bottom:1px solid #f3f4f6;position:sticky;top:0;background:#fff;z-index:10">
      <div style="width:40px;height:4px;background:#e5e7eb;border-radius:2px;margin:0 auto 14px"></div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:18px;font-weight:700">${title}</div>
        <button onclick="closeModal()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#9ca3af;padding:0">×</button>
      </div>
    </div>
    <div style="padding:16px 20px 32px">${html}</div>
  </div>`;
  d.addEventListener('click', e => { if (e.target === d) closeModal(); });
  document.body.appendChild(d);
}
function closeModal() { const m = document.getElementById('modal'); if (m) m.remove(); }

// SVG Icons
const ICONS = {
  menu: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  back: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`,
  search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
  chevron: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>`,
  plus: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  stats: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>`,
  users: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  staff: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  calendar: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  money: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  settings: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 12 2a10 10 0 0 0-7.07 2.93"/><path d="M4.93 4.93A10 10 0 0 0 2 12a10 10 0 0 0 2.93 7.07"/><path d="M19.07 19.07A10 10 0 0 0 22 12a10 10 0 0 0-2.93-7.07"/><path d="M12 22a10 10 0 0 0 7.07-2.93"/></svg>`,
  trash: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  book: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  check: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  groups: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-5-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  edit: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  avatar: `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>`,
};

const CSS = `
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f7fa;color:#1f2937;overflow-x:hidden}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}

.sidebar{position:fixed;top:0;left:0;width:280px;height:100vh;background:#07568A;z-index:400;transform:translateX(-100%);transition:transform .3s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;overflow-y:auto;overscroll-behavior:contain}
.sidebar.open{transform:translateX(0)}
.sb-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:399;display:none}
.sb-overlay.open{display:block}

.topbar{position:sticky;top:0;z-index:50;background:#07568A;color:#fff;padding:0 16px;height:56px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 2px 8px rgba(7,86,138,.3)}
.topbar-title{font-size:17px;font-weight:600}
.ham-btn{width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.15);border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center}
.ham-btn:active{background:rgba(255,255,255,.25)}

.nav-link{display:flex;align-items:center;gap:12px;padding:13px 20px;color:rgba(255,255,255,.7);font-size:14px;font-weight:500;cursor:pointer;border-left:3px solid transparent;transition:all .15s;user-select:none}
.nav-link:hover,.nav-link.active{background:rgba(255,255,255,.12);color:#fff}
.nav-link.active{border-left-color:#fff}
.nav-icon{width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.nav-link.active .nav-icon{background:rgba(255,255,255,.22)}

.card{background:#fff;border-radius:16px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.card-p{padding:16px}

.li{display:flex;align-items:center;padding:14px 16px;background:#fff;border-bottom:1px solid #f3f4f6;cursor:pointer;transition:background .1s;user-select:none}
.li:first-child{border-radius:16px 16px 0 0}
.li:last-child{border-bottom:none;border-radius:0 0 16px 16px}
.li:only-child{border-radius:16px}
.li:active{background:#f9fafb}
.li-ic{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:12px}
.li-t{font-size:15px;font-weight:500;color:#1f2937}
.li-s{font-size:12px;color:#9ca3af;margin-top:2px}

.inp{width:100%;padding:12px 14px;border:1.5px solid #e5e7eb;border-radius:12px;font-size:15px;outline:none;background:#fff;color:#1f2937;transition:border-color .15s;-webkit-appearance:none}
.inp:focus{border-color:#07568A}
.inp-g{margin-bottom:16px}
.inp-lbl{font-size:12px;font-weight:700;color:#6b7280;margin-bottom:6px;display:block;text-transform:uppercase;letter-spacing:.4px}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 20px;border-radius:12px;border:none;font-size:15px;font-weight:600;cursor:pointer;transition:all .15s;width:100%}
.btn:active{transform:scale(.98)}
.btn-p{background:#07568A;color:#fff}.btn-p:active{background:#054870}
.btn-s{background:#f3f4f6;color:#374151}
.btn-d{background:#fee2e2;color:#ef4444}
.btn-sm{padding:8px 14px;font-size:13px;width:auto;border-radius:10px}

.tabs{display:flex;gap:4px;background:#f3f4f6;border-radius:12px;padding:4px;margin-bottom:16px}
.tab{flex:1;padding:9px;text-align:center;border-radius:9px;font-size:13px;font-weight:500;cursor:pointer;border:none;background:transparent;color:#6b7280;transition:all .15s}
.tab.active{background:#fff;color:#07568A;box-shadow:0 1px 3px rgba(0,0,0,.1)}

.chk-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #f3f4f6;cursor:pointer}
.chk-row:last-child{border-bottom:none}
.chk{width:24px;height:24px;border-radius:7px;border:2px solid #d1d5db;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s}
.chk.on{background:#22c55e;border-color:#22c55e;color:#fff;font-size:13px}

.mpills{display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;margin-bottom:16px;scrollbar-width:none}
.mpills::-webkit-scrollbar{display:none}
.mpill{flex-shrink:0;padding:8px 16px;border-radius:20px;border:1.5px solid #e5e7eb;font-size:13px;font-weight:500;cursor:pointer;background:#fff;color:#6b7280;white-space:nowrap;transition:all .15s}
.mpill.active{background:#07568A;color:#fff;border-color:#07568A}

.sb-box{display:flex;align-items:center;gap:10px;background:#f3f4f6;border-radius:12px;padding:11px 14px;margin-bottom:16px}
.sb-box input{border:none;background:transparent;outline:none;font-size:15px;flex:1;color:#1f2937}

#toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#1f2937;color:#fff;padding:11px 22px;border-radius:24px;font-size:14px;font-weight:500;z-index:9999;white-space:nowrap;display:none;box-shadow:0 4px 12px rgba(0,0,0,.2)}

.cal-day{aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:14px;cursor:pointer;transition:all .15s}
.cal-day.sel{background:#07568A;color:#fff;font-weight:600}
.cal-day.today-mark{font-weight:700;color:#07568A}
.cal-day.past{color:#d1d5db;pointer-events:none}

.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
.badge-b{background:#dbeafe;color:#1d4ed8}
.badge-g{background:#dcfce7;color:#15803d}
.badge-gray{background:#f3f4f6;color:#6b7280}

.sec-t{font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px}
.pv{padding:16px;padding-bottom:32px}
</style>`;
