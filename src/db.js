require('./env');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const seedPosts = require('./seed-data');

const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '..', 'data', 'nova.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS posts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT    NOT NULL UNIQUE,
  title      TEXT    NOT NULL,
  excerpt    TEXT    NOT NULL DEFAULT '',
  content    TEXT    NOT NULL,
  category   TEXT    NOT NULL,
  art        TEXT    NOT NULL DEFAULT 'art-a',
  author     TEXT    NOT NULL DEFAULT 'Nova Staff',
  published  INTEGER NOT NULL DEFAULT 1,
  views      INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_posts_pub ON posts (published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_cat ON posts (category);

CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,
  body       TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments (post_id, created_at);

CREATE TABLE IF NOT EXISTS subscribers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  topic      TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'post';
}

function uniqueSlug(title, ignoreId = null) {
  const base = slugify(title);
  let slug = base, n = 2;
  const stmt = db.prepare('SELECT id FROM posts WHERE slug = ?');
  for (;;) {
    const hit = stmt.get(slug);
    if (!hit || hit.id === ignoreId) return slug;
    slug = `${base}-${n++}`;
  }
}

function seedIfEmpty() {
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM posts').get();
  if (n > 0) return false;
  const insert = db.prepare(`
    INSERT INTO posts (slug, title, excerpt, content, category, art, author, views, created_at, updated_at)
    VALUES (@slug, @title, @excerpt, @content, @category, @art, @author, @views, datetime('now', @offset), datetime('now', @offset))
  `);
  db.transaction(() => {
    seedPosts.forEach((p, i) => insert.run({
      slug: uniqueSlug(p.title), title: p.title, excerpt: p.excerpt, content: p.content,
      category: p.category, art: p.art, author: p.author,
      views: 120 + i * 37, offset: `-${p.daysAgo} days`
    }));
  })();
  return true;
}

module.exports = { db, uniqueSlug, seedIfEmpty, dbPath };
