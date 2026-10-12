import { api, el, $ } from './api.js';
import { postRow, emptyState } from './render.js';

const params = new URLSearchParams(location.search);
const state = { category: params.get('category') || '', q: params.get('q') || '', page: 1 };
const list = $('#archive-list'), filters = $('#filters'), more = $('#load-more'), search = $('#search'), count = $('#result-count');
search.value = state.q;

async function loadFilters() {
  const { categories } = await api('/categories');
  const names = [{ name: '', label: 'All' }, ...categories.map((c) => ({ name: c.name, label: c.name }))];
  filters.replaceChildren(...names.map((c) =>
    el('button', {
      type: 'button', class: 'filter', 'data-cat': c.name,
      'aria-pressed': String(c.name === state.category), text: c.label,
      onclick: () => { state.category = c.name; state.page = 1; sync(); load(true); }
    })));
}

function sync() {
  filters.querySelectorAll('.filter').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === state.category)));
  const p = new URLSearchParams();
  if (state.category) p.set('category', state.category);
  if (state.q) p.set('q', state.q);
  history.replaceState(null, '', p.toString() ? `?${p}` : location.pathname);
}

async function load(reset) {
  more.hidden = true;
  try {
    const qs = new URLSearchParams({ page: state.page, limit: 6 });
    if (state.category) qs.set('category', state.category);
    if (state.q) qs.set('q', state.q);
    const data = await api('/posts?' + qs);
    if (reset) list.replaceChildren();
    list.append(...data.posts.map(postRow));
    if (!list.children.length) list.replaceChildren(emptyState('No articles match. Try another topic or search.'));
    count.textContent = `${data.total} ${data.total === 1 ? 'article' : 'articles'}`;
    more.hidden = state.page >= data.pages;
  } catch (err) {
    list.replaceChildren(emptyState(err.message));
  }
}

let timer;
search.addEventListener('input', () => {
  clearTimeout(timer);
  timer = setTimeout(() => { state.q = search.value.trim(); state.page = 1; sync(); load(true); }, 250);
});
more.addEventListener('click', () => { state.page += 1; load(false); });

loadFilters().then(() => { sync(); load(true); }).catch((e) => list.replaceChildren(emptyState(e.message)));
