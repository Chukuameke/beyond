const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let rows = [], view = [], current = null;

async function gate() {
  const { data } = await sb.auth.getSession();
  $('#login').hidden = !!data.session; $('#app').hidden = !data.session;
  if (data.session) load();
}
$('#login').onsubmit = async e => {
  e.preventDefault();
  const { error } = await sb.auth.signInWithPassword({ email: $('#em').value, password: $('#pw').value });
  $('#lm').textContent = error ? 'Sign in failed. Check your email and password.' : '';
  if (!error) gate();
};
$('#out').onclick = async () => { await sb.auth.signOut(); gate(); };

async function load() {
  const { data, error } = await sb.from('registrations').select('*').order('created_at', { ascending: false }).range(0, 4999);
  if (error) { $('#tb').innerHTML = `<tr><td colspan="8">Could not load registrations: ${esc(error.message)}</td></tr>`; return; }
  rows = data;
  const uniq = k => [...new Set(rows.map(r => r[k]).filter(Boolean))].sort();
  const opts = (id, label, a) => { const v = $(id).value; $(id).innerHTML = `<option value="">${label}</option>` + a.map(x => `<option ${x === v ? 'selected' : ''}>${esc(x)}</option>`).join(''); };
  opts('#fr', 'All Build Rooms', uniq('build_room')); opts('#fs', 'All stages', uniq('stage'));
  const today = new Date().toDateString();
  $('#k1').textContent = rows.length;
  $('#k2').textContent = rows.filter(r => new Date(r.created_at).toDateString() === today).length;
  $('#k3').textContent = new Set(rows.map(r => r.country.trim().toLowerCase())).size;
  const by = {}; rows.forEach(r => by[r.build_room] = (by[r.build_room] || 0) + 1);
  const max = Math.max(1, ...Object.values(by));
  $('#rb').innerHTML = Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<div class="rb"><span>${esc(k)}</span><i style="width:${n / max * 100}%"></i><b>${n}</b></div>`).join('') || '<p class="hint">No data yet.</p>';
  render();
}

function render() {
  const q = $('#q').value.toLowerCase(), r = $('#fr').value, s = $('#fs').value;
  view = rows.filter(x => (!r || x.build_room === r) && (!s || x.stage === s) &&
    (!q || [x.full_name, x.email, x.org_name].some(v => (v || '').toLowerCase().includes(q))));
  $('#tb').innerHTML = view.map((x, i) => `<tr tabindex="0" data-i="${i}"><td>${esc(x.full_name)}</td><td>${esc(x.email)}</td><td>${esc(x.phone)}</td><td>${esc(x.country)}</td><td>${esc(x.role)}</td><td>${esc(x.build_room)}</td><td>${esc(x.stage)}</td><td>${new Date(x.created_at).toLocaleDateString()}</td></tr>`).join('');
  $('#empty').hidden = view.length > 0;
}
['#q', '#fr', '#fs'].forEach(id => $(id).oninput = render);

function open(i) {
  current = view[i]; const x = current;
  const photo = `${SUPABASE_URL}/storage/v1/object/public/profile-photos/${x.id}.png`;
  const f = [['Email', x.email], ['Phone', x.phone], ['Location', [x.city, x.country].filter(Boolean).join(', ')], ['Profile', x.role], ['Business', x.org_name || '—'], ['Industry', x.industry], ['Stage', x.stage], ['Build Room', x.build_room], ['Wants', (x.wants || []).join(', ') || '—'], ['Challenge', x.challenge], ['Heard via', x.heard_from], ['Registered', new Date(x.created_at).toLocaleString()]];
  $('#dgc').innerHTML = `<h2 style="font-size:30px">${esc(x.full_name)}</h2><dl>${f.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}<dt>Profile image</dt><dd><a href="${photo}" target="_blank" rel="noopener"><img class="thumb" src="${photo}" alt="" onerror="this.parentNode.textContent='Not created yet'"></a></dd></dl>`;
  $('#dg').showModal();
}
$('#tb').onclick = e => { const t = e.target.closest('tr'); if (t) open(+t.dataset.i); };
$('#tb').onkeydown = e => { if (e.key === 'Enter') { const t = e.target.closest('tr'); if (t) open(+t.dataset.i); } };
$('#dc').onclick = () => $('#dg').close();
$('#dd').onclick = async () => {
  if (!current || !confirm(`Delete the registration for ${current.full_name}? This cannot be undone.`)) return;
  const { error } = await sb.from('registrations').delete().eq('id', current.id);
  if (error) { alert('Delete failed: ' + error.message); return; }
  $('#dg').close(); load();
};

$('#csv').onclick = () => {
  const cols = ['created_at', 'full_name', 'email', 'phone', 'country', 'city', 'role', 'org_name', 'industry', 'stage', 'build_room', 'wants', 'challenge', 'heard_from'];
  const cell = v => `"${String(Array.isArray(v) ? v.join('; ') : v ?? '').replace(/"/g, '""')}"`;
  const csv = [cols.join(','), ...view.map(r => cols.map(c => cell(r[c])).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'beyond-the-idea-registrations.csv'; a.click();
};
gate();
