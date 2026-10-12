import { el, fmtDate } from './api.js';

const postUrl = (slug) => `post.html?slug=${encodeURIComponent(slug)}`;
const art = (style, extra = '') =>
  el('div', { class: `art ${style}`, role: 'img', 'aria-label': 'Cover art', style: extra || false });

export function postRow(p) {
  return el('a', { class: 'post-row', href: postUrl(p.slug) },
    art(p.art, 'height:90px;border-radius:12px'),
    el('div', {}, el('h3', { text: p.title }), el('p', { text: p.excerpt })),
    el('div', { class: 'side' },
      el('span', { class: 'chip', text: p.category }),
      el('span', { class: 'meta', text: `${fmtDate(p.created_at)} \u00b7 ${p.comment_count} comments` })));
}

export function featuredMain(p) {
  return el('a', { class: 'f-main', href: postUrl(p.slug) },
    art(p.art),
    el('div', { class: 'body' },
      el('span', { class: 'chip', text: p.category }),
      el('h3', { text: p.title }),
      el('p', { class: 'meta', style: 'margin:0', text: `${p.excerpt} ${fmtDate(p.created_at)}` })));
}

export function featuredSide(p) {
  return el('a', { class: 'f-side', href: postUrl(p.slug) },
    art(p.art),
    el('div', {},
      el('span', { class: 'chip', text: p.category }),
      el('h3', { text: p.title }),
      el('span', { class: 'meta', text: fmtDate(p.created_at) })));
}

export function relatedCard(p) {
  return el('a', { href: postUrl(p.slug) }, art(p.art), el('h3', { text: p.title }));
}

export function emptyState(text) {
  return el('p', { class: 'empty', text });
}

// Safe article renderer: builds DOM nodes, never injects HTML.
// Supports: blank-line paragraphs, "## " headings, "> " quotes, ``` code fences.
export function renderContent(container, text) {
  container.replaceChildren();
  const headings = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let para = [], code = null;

  const flush = () => {
    if (para.length) { container.append(el('p', { text: para.join(' ') })); para = []; }
  };

  for (const raw of lines) {
    if (raw.trim().startsWith('```')) {
      if (code) { container.append(el('pre', {}, el('code', { text: code.join('\n') }))); code = null; }
      else { flush(); code = []; }
      continue;
    }
    if (code) { code.push(raw); continue; }
    const line = raw.trim();
    if (!line) { flush(); continue; }
    if (line.startsWith('## ')) {
      flush();
      const id = 'sec-' + (headings.length + 1);
      headings.push({ id, text: line.slice(3) });
      container.append(el('h2', { id, text: line.slice(3) }));
    } else if (line.startsWith('> ')) {
      flush();
      container.append(el('blockquote', { text: line.slice(2) }));
    } else para.push(line);
  }
  if (code) container.append(el('pre', {}, el('code', { text: code.join('\n') })));
  flush();
  return headings;
}
