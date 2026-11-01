const API = 'https://claude.ai/api/organizations';

async function getJson(url) {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
  if (res.status === 401 || res.status === 403) throw new Error('login');
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

function resetText(iso) {
  if (!iso) return '';
  const ms = new Date(iso) - Date.now();
  if (!(ms > 0)) return 'Resetting now';
  const m = Math.ceil(ms / 60000), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60);
  return 'Resets in ' + (d ? d + 'd ' : '') + (h ? h + 'h ' : '') + (m % 60) + 'm';
}

function render(id, w) {
  const row = document.getElementById(id);
  const pct = Math.max(0, Math.min(100, Math.round(Number(w?.utilization) || 0)));
  row.querySelector('.pct').textContent = pct + '%';
  const fill = row.querySelector('.fill');
  fill.style.width = pct + '%';
  fill.style.background = pct >= 90 ? '#d64545' : pct >= 70 ? '#e0912f' : '#2e9e5b';
  row.querySelector('.reset').textContent = resetText(w?.resets_at);
}

(async () => {
  const msg = document.getElementById('msg');
  try {
    const orgs = await getJson(API);
    const org = orgs.find((o) => o.capabilities?.includes('chat')) ?? orgs[0];
    // trust boundary: only ever put a real UUID into the request path
    if (!/^[0-9a-f-]{36}$/i.test(org?.uuid ?? '')) throw new Error('No organization found');
    const usage = await getJson(`${API}/${org.uuid}/usage`);
    render('five_hour', usage.five_hour);
    render('seven_day', usage.seven_day);
    msg.hidden = true;
    document.getElementById('data').hidden = false;
  } catch (e) {
    if (e.message === 'login') {
      msg.textContent = 'Not logged in. ';
      const a = Object.assign(document.createElement('a'), { href: 'https://claude.ai/login', target: '_blank', textContent: 'Log in to claude.ai' });
      msg.append(a);
    } else {
      msg.textContent = 'Could not load usage: ' + e.message;
    }
  }
})();
