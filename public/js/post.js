import { api, el, $, fmtDate, readTime, status } from './api.js';
import { relatedCard, renderContent, emptyState } from './render.js';

const slug = new URLSearchParams(location.search).get('slug');
const root = $('#article');

function commentNode(c) {
  return el('li', { class: 'comment' },
    el('strong', { text: c.name }), el('span', { class: 'meta', text: ' ' + fmtDate(c.created_at) }),
    el('p', { text: c.body }));
}

async function loadComments() {
  const { comments } = await api(`/posts/${encodeURIComponent(slug)}/comments`);
  const ul = $('#comment-list');
  $('#comment-count').textContent = `${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`;
  ul.replaceChildren(...comments.map(commentNode));
}

async function load() {
  if (!slug) { root.replaceChildren(el('div', { class: 'wrap section' }, emptyState('No article selected.'), el('a', { class: 'btn', href: 'blog.html', text: 'Browse articles' }))); return; }
  try {
    const { post, related } = await api(`/posts/${encodeURIComponent(slug)}`);
    document.title = `${post.title} | Nova Journal`;
    $('meta[name="description"]').setAttribute('content', post.excerpt);
    $('#post-chip').textContent = post.category;
    $('#post-title').textContent = post.title;
    $('#post-byline').textContent = `By ${post.author} \u00b7 ${fmtDate(post.created_at)} \u00b7 ${readTime(post.content)} \u00b7 ${post.views} views`;
    $('#post-cover').className = `article-cover art ${post.art}`;
    const headings = renderContent($('#post-body'), post.content);
    const toc = $('#toc-list');
    toc.replaceChildren(...headings.map((h) => el('li', {}, el('a', { href: '#' + h.id, text: h.text }))));
    if (!headings.length) $('#toc').hidden = true;
    $('#post-author').textContent = post.author;
    $('#related').replaceChildren(...related.map(relatedCard));
    $('#article-wrap').hidden = false;
    $('#related-section').hidden = !related.length;
    await loadComments();
  } catch (err) {
    document.title = 'Not found | Nova Journal';
    root.replaceChildren(el('div', { class: 'wrap section' }, el('h1', { text: err.status === 404 ? 'Article not found' : 'Something went wrong' }), emptyState(err.message), el('a', { class: 'btn', href: 'blog.html', text: 'Browse articles' })));
  }
}

$('#comment-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget, msg = $('#comment-status'), btn = form.querySelector('button');
  btn.disabled = true;
  try {
    await api(`/posts/${encodeURIComponent(slug)}/comments`, { method: 'POST', body: { name: form.elements.name.value, body: form.elements.body.value } });
    form.elements.body.value = '';
    status(msg, 'Comment posted.');
    await loadComments();
  } catch (err) { status(msg, err.message, false); }
  btn.disabled = false;
});

load();
