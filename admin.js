const SUPABASE_URL = 'https://tldabolvqdtlylgwpgst.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsZGFib2x2cWR0bHlsZ3dwZ3N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNTIwMzIsImV4cCI6MjEwNjYyODAzMn0.eFyW_do1SIBbL4NrVln8QLBJnM1HedeQzc423L1n4RY';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const list = v => Array.isArray(v) ? v.join(', ') : (v ?? '');
const STATUS = ['new', 'contacted', 'accepted', 'declined'];
let rows = [], view = [], sp = [], spView = [], current = null, mode = 'reg';

/* ---------- auth ---------- */
async function gate() {
  const { data } = await sb.auth.getSession();
  $('#login').hidden = !!data.session; $('#app').hidden = !data.session;
  if (data.session) { load(); loadSp(); }
}
$('#login').onsubmit = async e => {
  e.preventDefault();
  const { error } = await sb.auth.signInWithPassword({ email: $('#em').value, password: $('#pw').value });
  $('#lm').textContent = error ? 'Sign in failed. Check your email and password.' : '';
  if (!error) gate();
};
$('#out').onclick = async () => { await sb.auth.signOut(); gate(); };

/* ---------- tabs ---------- */
function setMode(m) {
  mode = m;
  $('#viewReg').hidden = m !== 'reg'; $('#viewSp').hidden = m !== 'sp';
  $('#tabReg').classList.toggle('ghost', m !== 'reg');
  $('#tabSp').classList.toggle('ghost', m !== 'sp');
  $('#title').textContent = m === 'reg' ? 'Registrations' : 'Sponsors';
}
$('#tabReg').onclick = () => setMode('reg');
$('#tabSp').onclick = () => setMode('sp');

/* ---------- registrations ---------- */
async function load() {
  const { data, error } = await sb.from('registrations').select('*').order('created_at', { ascending: false }).range(0, 4999);
  if (error) { $('#tb').innerHTML = `<tr><td colspan="8">Could not load registrations: ${esc(error.message)}</td></tr>`; return; }
  rows = data;
  const uniq = k => [...new Set(rows.flatMap(r => Array.isArray(r[k]) ? r[k] : [r[k]]).filter(Boolean))].sort();
  const opts = (id, label, a) => {
    const v = $(id).value;
    $(id).innerHTML = `<option value="">${label}</option>` + a.map(x => `<option ${x === v ? 'selected' : ''}>${esc(x)}</option>`).join('');
  };
  opts('#fr', 'All Build Rooms', uniq('build_room'));
  opts('#fs', 'All stages', uniq('stage'));

  const today = new Date().toDateString();
  $('#k1').textContent = rows.length;
  $('#k2').textContent = rows.filter(r => new Date(r.created_at).toDateString() === today).length;
  $('#k3').textContent = new Set(rows.map(r => (r.country || '').trim().toLowerCase()).filter(Boolean)).size;

  const by = {}; rows.forEach(r => by[r.build_room] = (by[r.build_room] || 0) + 1);
  const max = Math.max(1, ...Object.values(by));
  $('#rb').innerHTML = Object.entries(by).sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `<div class="rb"><span>${esc(k)}</span><i style="width:${n / max * 100}%"></i><b>${n}</b></div>`).join('')
    || '<p class="hint">No data yet.</p>';
  render();
}

function render() {
  const q = $('#q').value.toLowerCase(), r = $('#fr').value, s = $('#fs').value;
  view = rows.filter(x =>
    (!r || x.build_room === r) &&
    (!s || (x.stage || []).includes(s)) &&
    (!q || [x.full_name, x.email, x.organization].some(v => (v || '').toLowerCase().includes(q))));
  $('#tb').innerHTML = view.map((x, i) =>
    `<tr tabindex="0" data-i="${i}"><td>${esc(x.full_name)}</td><td>${esc(x.email)}</td><td>${esc(x.phone)}</td><td>${esc(x.country)}</td><td>${esc(list(x.describes_you))}</td><td>${esc(x.build_room)}</td><td>${esc(list(x.stage))}</td><td>${new Date(x.created_at).toLocaleDateString()}</td></tr>`).join('');
  $('#empty').hidden = view.length > 0;
}
['#q', '#fr', '#fs'].forEach(id => $(id).oninput = render);

function openReg(i) {
  current = view[i]; const x = current;
  const f = [
    ['Email', x.email], ['Phone', x.phone],
    ['Location', [x.state_city, x.country].filter(Boolean).join(', ')],
    ['Describes them', list(x.describes_you)], ['Business', x.organization || '—'],
    ['Industry', list(x.industry)], ['Stage', list(x.stage)], ['Build Room', x.build_room],
    ['Wants to gain', list(x.gain)], ['Challenge', list(x.challenge)],
    ['Heard via', list(x.heard_from)], ['Registered', new Date(x.created_at).toLocaleString()]
  ];
  $('#dgc').innerHTML = `<h2 style="font-size:30px">${esc(x.full_name)}</h2><dl>${f.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v || '—')}</dd>`).join('')}</dl>`;
  $('#dd').textContent = 'Delete registration';
  $('#dg').showModal();
}
$('#tb').onclick = e => { const t = e.target.closest('tr'); if (t) openReg(+t.dataset.i); };
$('#tb').onkeydown = e => { if (e.key === 'Enter') { const t = e.target.closest('tr'); if (t) openReg(+t.dataset.i); } };

/* ---------- sponsors ---------- */
async function loadSp() {
  const { data, error } = await sb.from('sponsors').select('*').order('created_at', { ascending: false }).range(0, 4999);
  if (error) { $('#stb').innerHTML = `<tr><td colspan="5">Could not load sponsors: ${esc(error.message)}</td></tr>`; return; }
  sp = data;
  $('#s1').textContent = sp.length;
  $('#s2').textContent = sp.filter(x => x.status === 'new').length;
  $('#s3').textContent = sp.filter(x => x.status === 'accepted').length;
  renderSp();
}

function renderSp() {
  const q = $('#sq').value.toLowerCase(), f = $('#sf').value;
  spView = sp.filter(x =>
    (!f || x.status === f) &&
    (!q || [x.company_name, x.company_email, x.proposal].some(v => (v || '').toLowerCase().includes(q))));
  $('#stb').innerHTML = spView.map((x, i) =>
    `<tr tabindex="0" data-i="${i}"><td>${esc(x.company_name)}</td><td>${esc(x.company_email)}</td><td>${esc(x.phone)}</td><td class="cap">${esc(x.status)}</td><td>${new Date(x.created_at).toLocaleDateString()}</td></tr>`).join('');
  $('#sempty').hidden = spView.length > 0;
}
['#sq', '#sf'].forEach(id => $(id).oninput = renderSp);

function openSp(i) {
  current = spView[i]; const x = current;
  $('#dgc').innerHTML = `
    <h2 style="font-size:30px">${esc(x.company_name)}</h2>
    <dl>
      <dt>Email</dt><dd><a href="mailto:${esc(x.company_email)}">${esc(x.company_email)}</a></dd>
      <dt>Phone</dt><dd>${esc(x.phone)}</dd>
      <dt>Received</dt><dd>${new Date(x.created_at).toLocaleString()}</dd>
      <dt>Proposal</dt><dd class="pre">${esc(x.proposal)}</dd>
    </dl>
    <div class="stat">
      <select id="st" aria-label="Status">${STATUS.map(s => `<option value="${s}" ${s === x.status ? 'selected' : ''}>${s[0].toUpperCase() + s.slice(1)}</option>`).join('')}</select>
      <button class="btn" id="sv">Save status</button>
    </div>`;
  $('#sv').onclick = async () => {
    const { error } = await sb.from('sponsors').update({ status: $('#st').value }).eq('id', current.id);
    if (error) { alert('Could not save status: ' + error.message); return; }
    $('#dg').close(); loadSp();
  };
  $('#dd').textContent = 'Delete application';
  $('#dg').showModal();
}
$('#stb').onclick = e => { const t = e.target.closest('tr'); if (t) openSp(+t.dataset.i); };
$('#stb').onkeydown = e => { if (e.key === 'Enter') { const t = e.target.closest('tr'); if (t) openSp(+t.dataset.i); } };

/* ---------- shared: close, delete, CSV ---------- */
$('#dc').onclick = () => $('#dg').close();
$('#dd').onclick = async () => {
  if (!current) return;
  const isSp = mode === 'sp';
  const name = isSp ? current.company_name : current.full_name;
  if (!confirm(`Delete ${isSp ? 'the application from' : 'the registration for'} ${name}? This cannot be undone.`)) return;
  const { error } = await sb.from(isSp ? 'sponsors' : 'registrations').delete().eq('id', current.id);
  if (error) { alert('Delete failed: ' + error.message); return; }
  $('#dg').close(); isSp ? loadSp() : load();
};

$('#csv').onclick = () => {
  const isSp = mode === 'sp';
  const cols = isSp
    ? ['created_at', 'company_name', 'company_email', 'phone', 'status', 'proposal']
    : ['created_at', 'full_name', 'email', 'phone', 'country', 'state_city', 'describes_you', 'organization', 'industry', 'stage', 'build_room', 'gain', 'challenge', 'heard_from'];
  const data = isSp ? spView : view;
  const cell = v => `"${String(Array.isArray(v) ? v.join('; ') : v ?? '').replace(/"/g, '""')}"`;
  const csv = [cols.join(','), ...data.map(r => cols.map(c => cell(r[c])).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = isSp ? 'beyond-the-idea-sponsors.csv' : 'beyond-the-idea-registrations.csv';
  a.click();
};

gate();
