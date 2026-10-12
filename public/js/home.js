import { api, $ } from './api.js';
import { postRow, featuredMain, featuredSide, emptyState } from './render.js';
import { el } from './api.js';

async function load() {
  const featured = $('#featured'), list = $('#latest'), topics = $('#topics'), card = $('#orbit-card');
  try {
    const [{ posts }, { categories }] = await Promise.all([api('/posts?limit=8'), api('/categories')]);
    if (!posts.length) {
      featured.replaceChildren(emptyState('No articles yet. Add one from the admin page.'));
      return;
    }
    const [first, ...rest] = posts;
    card.href = `post.html?slug=${encodeURIComponent(first.slug)}`;
    $('#orbit-title').textContent = first.title;
    $('#hero-link').href = card.href;
    featured.replaceChildren(featuredMain(first), ...rest.slice(0, 2).map(featuredSide));
    list.replaceChildren(...rest.slice(2).map(postRow));
    if (!rest.slice(2).length) list.replaceChildren(emptyState('More articles are on the way.'));
    topics.replaceChildren(...categories.map((c) =>
      el('a', { class: 'topic', href: `blog.html?category=${encodeURIComponent(c.name)}` },
        c.name, el('span', { text: `${c.count} ${c.count === 1 ? 'article' : 'articles'}` }))));
  } catch (err) {
    featured.replaceChildren(emptyState(err.message));
  }
}
load();
