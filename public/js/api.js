// Small helpers shared by every page.
export async function api(path, { method = 'GET', body } = {}) {
  const opts = { method, headers: { 'X-Requested-With': 'fetch' }, credentials: 'same-origin' };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  let res;
  try { res = await fetch('/api' + path, opts); }
  catch { throw new Error('Cannot reach the server. Is it running?'); }
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// el('a', { href: '/x', class: 'btn' }, 'Text', childNode) -> element. Text is always inserted safely.
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

export const $ = (sel, root = document) => root.querySelector(sel);

export function fmtDate(sqlDate) {
  // SQLite stores UTC as "YYYY-MM-DD HH:MM:SS"
  const d = new Date(sqlDate.replace(' ', 'T') + 'Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function readTime(text) {
  return Math.max(1, Math.round((text || '').split(/\s+/).length / 200)) + ' min read';
}

export function status(node, message, ok = true) {
  node.textContent = message;
  node.className = 'status ' + (ok ? 'ok' : 'err');
  node.hidden = !message;
}
