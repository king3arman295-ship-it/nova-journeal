import { api, el, $, fmtDate, status } from './api.js';

const login = $('#login'), dash = $('#dash'), panel = $('#panel'), tabs = $('#tabs');
let tab = 'posts';

// ---------- session ----------
async function boot() {
  const { admin } = await api('/admin/me');
  login.hidden = admin; dash.hidden = !admin;
  if (admin) { loadStats(); show(tab); }
}

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('#login-status');
  try {
    const form = e.currentTarget;
    await api('/admin/login', { method: 'POST', body: { password: form.elements.password.value } });
    form.reset(); status(msg, ''); boot();
  } catch (err) { status(msg, err.message, false); }
});

$('#logout').addEventListener('click', async () => {
  await api('/admin/logout', { method: 'POST', body: {} });
  boot();
});

async function guard(fn) {
  try { return await fn(); }
  catch (err) {
    if (err.status === 401) return boot();
    panel.prepend(el('p', { class: 'status err', text: err.message }));
  }
}

// ---------- stats + tabs ----------
async function loadStats() {
  const s = await api('/admin/stats');
  const items = [['Posts', s.posts], ['Drafts', s.drafts], ['Views', s.views], ['Comments', s.comments], ['Subscribers', s.subscribers], ['Messages', s.messages]];
  $('#stats').replaceChildren(...items.map(([l, v]) => el('div', { class: 'stat' }, el('strong', { text: v }), el('span', { text: l }))));
}

tabs.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-tab]');
  if (b) show(b.dataset.tab);
});

function show(name) {
  tab = name;
  tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tab === name)));
  guard(() => ({ posts: showPosts, comments: showComments, messages: showMessages, subscribers: showSubscribers })[name]());
}

// ---------- generic table ----------
function table(headers, rows) {
  return el('div', { class: 'table-wrap' }, el('table', { class: 'table' },
    el('thead', {}, el('tr', {}, headers.map((h) => el('th', { text: h })))),
    el('tbody', {}, rows)));
}
const delBtn = (label, onConfirm) =>
  el('button', { type: 'button', class: 'btn btn-sm btn-danger', text: 'Delete', 'aria-label': label,
    onclick: () => { if (confirm('Delete permanently?')) guard(async () => { await onConfirm(); loadStats(); show(tab); }); } });

// ---------- posts ----------
async function showPosts() {
  const { posts } = await api('/admin/posts');
  const rows = posts.map((p) => el('tr', {},
    el('td', {}, el('a', { href: `post.html?slug=${encodeURIComponent(p.slug)}`, target: '_blank', rel: 'noopener', text: p.title })),
    el('td', { text: p.category }),
    el('td', {}, el('span', { class: 'chip', text: p.published ? 'Published' : 'Draft' })),
    el('td', { text: p.views }), el('td', { text: p.comment_count }),
    el('td', { text: fmtDate(p.created_at) }),
    el('td', { class: 'actions' },
      el('button', { type: 'button', class: 'btn btn-sm', text: 'Edit', onclick: () => guard(() => editPost(p.id)) }),
      delBtn(`Delete ${p.title}`, () => api(`/admin/posts/${p.id}`, { method: 'DELETE' })))));
  panel.replaceChildren(
    el('div', { class: 'panel-head' }, el('h2', { text: 'Posts' }),
      el('button', { type: 'button', class: 'btn btn-primary btn-sm', text: 'New post', onclick: () => editPost(null) })),
    table(['Title', 'Category', 'Status', 'Views', 'Comments', 'Created', ''], rows));
}

async function editPost(id) {
  const post = id ? (await api(`/admin/posts/${id}`)).post
    : { title: '', category: '', excerpt: '', content: '', art: 'art-a', author: 'Nova Staff', published: 1 };
  const f = (label, control, hint) => el('div', {}, el('label', { text: label }), control, hint ? el('small', { class: 'meta', text: hint }) : null);
  const title = el('input', { class: 'input', required: true, maxlength: 140, value: post.title });
  const category = el('input', { class: 'input', required: true, maxlength: 40, value: post.category, list: 'cats' });
  const author = el('input', { class: 'input', maxlength: 80, value: post.author });
  const excerpt = el('textarea', { class: 'textarea', maxlength: 400, style: 'min-height:80px', text: post.excerpt });
  const content = el('textarea', { class: 'textarea', required: true, style: 'min-height:340px', text: post.content });
  const art = el('select', { class: 'select' }, ['art-a', 'art-b', 'art-c', 'art-d', 'art-e', 'art-f'].map((a, i) =>
    el('option', { value: a, selected: a === post.art, text: `Cover style ${i + 1}` })));
  const pub = el('input', { type: 'checkbox', id: 'pub', checked: !!post.published });
  const msg = el('p', { class: 'status', hidden: true });
  const cats = el('datalist', { id: 'cats' }, ['AI', 'Space', 'Hardware', 'Cities', 'Design'].map((c) => el('option', { value: c })));
  const form = el('form', { class: 'panel form-grid', onsubmit: async (e) => {
    e.preventDefault();
    const body = { title: title.value, category: category.value, author: author.value, excerpt: excerpt.value,
      content: content.value, art: art.value, published: pub.checked };
    try {
      await api(id ? `/admin/posts/${id}` : '/admin/posts', { method: id ? 'PUT' : 'POST', body });
      loadStats(); show('posts');
    } catch (err) { status(msg, err.message, false); }
  } },
    el('h2', { text: id ? 'Edit post' : 'New post' }),
    f('Title', title), f('Category', category), f('Author', author), f('Cover style', art),
    f('Short summary', excerpt, 'Shown on cards and in search results.'),
    f('Content', content, 'Blank line = new paragraph. "## " = heading. "> " = quote. Wrap code in ``` lines.'),
    el('div', { class: 'check' }, pub, el('label', { for: 'pub', text: 'Published (untick to save as a draft)' })),
    msg, cats,
    el('div', { class: 'actions' },
      el('button', { class: 'btn btn-primary', type: 'submit', text: id ? 'Save changes' : 'Create post' }),
      el('button', { class: 'btn', type: 'button', text: 'Cancel', onclick: () => show('posts') })));
  panel.replaceChildren(form);
  title.focus();
}

// ---------- comments / messages / subscribers ----------
async function showComments() {
  const { comments } = await api('/admin/comments');
  panel.replaceChildren(el('div', { class: 'panel-head' }, el('h2', { text: 'Comments' })),
    comments.length ? table(['Name', 'Comment', 'On article', 'Date', ''], comments.map((c) => el('tr', {},
      el('td', { text: c.name }), el('td', { class: 'wide', text: c.body }),
      el('td', {}, el('a', { href: `post.html?slug=${encodeURIComponent(c.post_slug)}`, target: '_blank', rel: 'noopener', text: c.post_title })),
      el('td', { text: fmtDate(c.created_at) }),
      el('td', { class: 'actions' }, delBtn(`Delete comment by ${c.name}`, () => api(`/admin/comments/${c.id}`, { method: 'DELETE' })))))) :
      el('p', { class: 'empty', text: 'No comments yet.' }));
}

async function showMessages() {
  const { messages } = await api('/admin/messages');
  panel.replaceChildren(el('div', { class: 'panel-head' }, el('h2', { text: 'Messages' })),
    messages.length ? table(['From', 'Topic', 'Message', 'Date', ''], messages.map((m) => el('tr', {},
      el('td', {}, el('strong', { text: m.name }), el('br'), el('a', { href: `mailto:${m.email}`, text: m.email })),
      el('td', { text: m.topic }), el('td', { class: 'wide', text: m.message }), el('td', { text: fmtDate(m.created_at) }),
      el('td', { class: 'actions' }, delBtn(`Delete message from ${m.name}`, () => api(`/admin/messages/${m.id}`, { method: 'DELETE' })))))) :
      el('p', { class: 'empty', text: 'No messages yet.' }));
}

async function showSubscribers() {
  const { subscribers } = await api('/admin/subscribers');
  const csv = () => {
    const blob = new Blob(['email,subscribed\n' + subscribers.map((s) => `${s.email},${s.created_at}`).join('\n')], { type: 'text/csv' });
    const a = el('a', { href: URL.createObjectURL(blob), download: 'subscribers.csv' });
    a.click(); URL.revokeObjectURL(a.href);
  };
  panel.replaceChildren(
    el('div', { class: 'panel-head' }, el('h2', { text: 'Subscribers' }),
      subscribers.length ? el('button', { type: 'button', class: 'btn btn-sm', text: 'Download CSV', onclick: csv }) : null),
    subscribers.length ? table(['Email', 'Joined', ''], subscribers.map((s) => el('tr', {},
      el('td', { text: s.email }), el('td', { text: fmtDate(s.created_at) }),
      el('td', { class: 'actions' }, delBtn(`Remove ${s.email}`, () => api(`/admin/subscribers/${s.id}`, { method: 'DELETE' })))))) :
      el('p', { class: 'empty', text: 'No subscribers yet.' }));
}

boot().catch((err) => { login.hidden = false; status($('#login-status'), err.message, false); });
