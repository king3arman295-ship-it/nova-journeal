const express = require('express');
const rateLimit = require('express-rate-limit');
const { db, uniqueSlug } = require('./db');
const auth = require('./auth');

const ART_STYLES = ['art-a', 'art-b', 'art-c', 'art-d', 'art-e', 'art-f'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ---------- helpers ----------
const clean = (v, max) => (typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : '');
const toInt = (v, fallback, min, max) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback;
};
const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => '\\' + c);
const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });
const wrap = (fn) => (req, res, next) => {
  try { fn(req, res, next); } catch (err) { next(err); }
};

const writeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, limit: 12, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests. Please try again in a few minutes.' }
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Try again later.' }
});

// ---------- prepared statements ----------
const LIST_COLS = `p.id, p.slug, p.title, p.excerpt, p.category, p.art, p.author, p.views, p.created_at,
  (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count`;

// =====================================================
// Public API
// =====================================================
const publicApi = express.Router();

publicApi.get('/health', (req, res) => res.json({ ok: true }));

publicApi.get('/posts', wrap((req, res) => {
  const where = ['p.published = 1'];
  const params = [];
  const category = clean(req.query.category, 40);
  const q = clean(req.query.q, 80);
  if (category) { where.push('p.category = ?'); params.push(category); }
  if (q) {
    where.push(`(p.title LIKE ? ESCAPE '\\' OR p.excerpt LIKE ? ESCAPE '\\')`);
    const like = `%${escapeLike(q)}%`;
    params.push(like, like);
  }
  const limit = toInt(req.query.limit, 10, 1, 50);
  const page = toInt(req.query.page, 1, 1, 10000);
  const clause = where.join(' AND ');
  const { total } = db.prepare(`SELECT COUNT(*) AS total FROM posts p WHERE ${clause}`).get(...params);
  const posts = db.prepare(
    `SELECT ${LIST_COLS} FROM posts p WHERE ${clause} ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, (page - 1) * limit);
  res.json({ posts, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}));

publicApi.get('/categories', wrap((req, res) => {
  const rows = db.prepare(
    'SELECT category AS name, COUNT(*) AS count FROM posts WHERE published = 1 GROUP BY category ORDER BY count DESC, name'
  ).all();
  res.json({ categories: rows });
}));

publicApi.get('/posts/:slug', wrap((req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE slug = ? AND published = 1').get(req.params.slug);
  if (!post) return bad(res, 'Article not found.', 404);
  db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(post.id);
  post.views += 1;
  const related = db.prepare(
    `SELECT ${LIST_COLS} FROM posts p WHERE p.published = 1 AND p.id != ?
     ORDER BY (p.category = ?) DESC, p.created_at DESC LIMIT 3`
  ).all(post.id, post.category);
  res.json({ post, related });
}));

publicApi.get('/posts/:slug/comments', wrap((req, res) => {
  const post = db.prepare('SELECT id FROM posts WHERE slug = ? AND published = 1').get(req.params.slug);
  if (!post) return bad(res, 'Article not found.', 404);
  const comments = db.prepare(
    'SELECT id, name, body, created_at FROM comments WHERE post_id = ? ORDER BY created_at DESC, id DESC LIMIT 200'
  ).all(post.id);
  res.json({ comments });
}));

publicApi.post('/posts/:slug/comments', writeLimiter, wrap((req, res) => {
  const post = db.prepare('SELECT id FROM posts WHERE slug = ? AND published = 1').get(req.params.slug);
  if (!post) return bad(res, 'Article not found.', 404);
  const name = clean(req.body.name, 60);
  const body = clean(req.body.body, 2000);
  if (!name) return bad(res, 'Please enter your name.');
  if (body.length < 2) return bad(res, 'Please write a comment.');
  const info = db.prepare('INSERT INTO comments (post_id, name, body) VALUES (?, ?, ?)').run(post.id, name, body);
  const comment = db.prepare('SELECT id, name, body, created_at FROM comments WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ comment });
}));

publicApi.post('/subscribe', writeLimiter, wrap((req, res) => {
  const email = clean(req.body.email, 200).toLowerCase();
  if (!EMAIL_RE.test(email)) return bad(res, 'Please enter a valid email address.');
  const info = db.prepare('INSERT OR IGNORE INTO subscribers (email) VALUES (?)').run(email);
  res.status(info.changes ? 201 : 200).json({
    ok: true,
    message: info.changes ? 'You are on the list. See you on Friday.' : 'You are already subscribed.'
  });
}));

publicApi.post('/contact', writeLimiter, wrap((req, res) => {
  const name = clean(req.body.name, 80);
  const email = clean(req.body.email, 200);
  const topic = clean(req.body.topic, 60) || 'Something else';
  const message = clean(req.body.message, 4000);
  if (!name) return bad(res, 'Please enter your name.');
  if (!EMAIL_RE.test(email)) return bad(res, 'Please enter a valid email address.');
  if (message.length < 5) return bad(res, 'Please write a longer message.');
  db.prepare('INSERT INTO messages (name, email, topic, message) VALUES (?, ?, ?, ?)').run(name, email, topic, message);
  res.status(201).json({ ok: true, message: 'Message sent. We reply within two working days.' });
}));

// =====================================================
// Admin API
// =====================================================
const adminApi = express.Router();

adminApi.post('/login', loginLimiter, (req, res) => {
  if (!auth.checkPassword(clean(req.body.password, 200))) return bad(res, 'Wrong password.', 401);
  res.cookie(auth.COOKIE, auth.createToken(), auth.cookieOptions);
  res.json({ ok: true });
});

adminApi.post('/logout', (req, res) => {
  res.clearCookie(auth.COOKIE, { path: '/' });
  res.json({ ok: true });
});

adminApi.get('/me', (req, res) => res.json({ admin: auth.verifyToken(req.cookies[auth.COOKIE]) }));

// everything below needs a valid session
adminApi.use(auth.requireAdmin);

adminApi.get('/stats', wrap((req, res) => {
  const one = (sql) => db.prepare(sql).get().n;
  res.json({
    posts: one('SELECT COUNT(*) AS n FROM posts'),
    drafts: one('SELECT COUNT(*) AS n FROM posts WHERE published = 0'),
    views: one('SELECT COALESCE(SUM(views),0) AS n FROM posts'),
    comments: one('SELECT COUNT(*) AS n FROM comments'),
    subscribers: one('SELECT COUNT(*) AS n FROM subscribers'),
    messages: one('SELECT COUNT(*) AS n FROM messages')
  });
}));

function readPostBody(body) {
  const title = clean(body.title, 140);
  const content = typeof body.content === 'string' ? body.content.replace(/\u0000/g, '').trim().slice(0, 60000) : '';
  const category = clean(body.category, 40);
  const excerpt = clean(body.excerpt, 400);
  const author = clean(body.author, 80) || 'Nova Staff';
  const art = ART_STYLES.includes(body.art) ? body.art : 'art-a';
  const published = body.published === false || body.published === 0 ? 0 : 1;
  if (!title) return { error: 'Title is required.' };
  if (!category) return { error: 'Category is required.' };
  if (content.length < 20) return { error: 'Content must be at least 20 characters.' };
  return { value: { title, content, category, excerpt, author, art, published } };
}

adminApi.get('/posts', wrap((req, res) => {
  const posts = db.prepare(
    `SELECT p.id, p.slug, p.title, p.category, p.published, p.views, p.created_at, p.updated_at,
     (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
     FROM posts p ORDER BY p.created_at DESC, p.id DESC`
  ).all();
  res.json({ posts });
}));

adminApi.get('/posts/:id', wrap((req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return bad(res, 'Post not found.', 404);
  res.json({ post });
}));

adminApi.post('/posts', wrap((req, res) => {
  const { error, value: v } = readPostBody(req.body);
  if (error) return bad(res, error);
  const info = db.prepare(
    `INSERT INTO posts (slug, title, excerpt, content, category, art, author, published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(uniqueSlug(v.title), v.title, v.excerpt, v.content, v.category, v.art, v.author, v.published);
  res.status(201).json({ post: db.prepare('SELECT * FROM posts WHERE id = ?').get(info.lastInsertRowid) });
}));

adminApi.put('/posts/:id', wrap((req, res) => {
  const existing = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!existing) return bad(res, 'Post not found.', 404);
  const { error, value: v } = readPostBody(req.body);
  if (error) return bad(res, error);
  const slug = v.title === existing.title ? existing.slug : uniqueSlug(v.title, existing.id);
  db.prepare(
    `UPDATE posts SET slug=?, title=?, excerpt=?, content=?, category=?, art=?, author=?, published=?,
     updated_at = datetime('now') WHERE id = ?`
  ).run(slug, v.title, v.excerpt, v.content, v.category, v.art, v.author, v.published, existing.id);
  res.json({ post: db.prepare('SELECT * FROM posts WHERE id = ?').get(existing.id) });
}));

adminApi.delete('/posts/:id', wrap((req, res) => {
  const info = db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  if (!info.changes) return bad(res, 'Post not found.', 404);
  res.json({ ok: true });
}));

adminApi.get('/comments', wrap((req, res) => {
  const comments = db.prepare(
    `SELECT c.id, c.name, c.body, c.created_at, p.title AS post_title, p.slug AS post_slug
     FROM comments c JOIN posts p ON p.id = c.post_id ORDER BY c.created_at DESC, c.id DESC LIMIT 300`
  ).all();
  res.json({ comments });
}));

adminApi.delete('/comments/:id', wrap((req, res) => {
  const info = db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
  if (!info.changes) return bad(res, 'Comment not found.', 404);
  res.json({ ok: true });
}));

adminApi.get('/messages', wrap((req, res) => {
  res.json({ messages: db.prepare('SELECT * FROM messages ORDER BY created_at DESC, id DESC LIMIT 300').all() });
}));

adminApi.delete('/messages/:id', wrap((req, res) => {
  const info = db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
  if (!info.changes) return bad(res, 'Message not found.', 404);
  res.json({ ok: true });
}));

adminApi.get('/subscribers', wrap((req, res) => {
  res.json({ subscribers: db.prepare('SELECT id, email, created_at FROM subscribers ORDER BY created_at DESC, id DESC').all() });
}));

adminApi.delete('/subscribers/:id', wrap((req, res) => {
  const info = db.prepare('DELETE FROM subscribers WHERE id = ?').run(req.params.id);
  if (!info.changes) return bad(res, 'Subscriber not found.', 404);
  res.json({ ok: true });
}));

module.exports = { publicApi, adminApi };
