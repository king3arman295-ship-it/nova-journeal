# Nova Journal (full stack)

A futuristic blog with a Node.js + Express backend and an SQLite database.
The frontend is plain HTML, CSS and a little browser JavaScript (no build step).

## Run it

You need Node.js 18 or newer.

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm start
```

Open http://localhost:3000. The first start creates `data/nova.db` and adds six sample articles.

Admin panel: http://localhost:3000/admin.html
In development the password is `admin123` until you set `ADMIN_PASSWORD` in `.env`.
Change it before you put the site online.

## Folder layout

```
server.js            Express app, security headers, static files
src/
  db.js              SQLite connection, tables, slug helper, seeding
  seed-data.js       The sample articles
  auth.js            Admin login (signed httpOnly cookie)
  routes.js          Public API and admin API
  env.js             Reads .env
public/              The website
  *.html  css/  js/
data/nova.db         Created automatically (your content lives here)
```

## Database tables

| Table       | Holds                                                    |
|-------------|----------------------------------------------------------|
| posts       | title, slug, excerpt, content, category, cover, author, published, views |
| comments    | name, body, linked to a post (deleted with the post)     |
| subscribers | newsletter emails (unique)                               |
| messages    | contact form submissions                                 |

Back up the site by copying `data/nova.db`.

## Public API

| Method | Path                         | Notes                                      |
|--------|------------------------------|--------------------------------------------|
| GET    | /api/posts                   | `?category=AI&q=text&page=1&limit=10`      |
| GET    | /api/posts/:slug             | Full article, adds one view, related posts |
| GET    | /api/categories              | Topic names with counts                    |
| GET    | /api/posts/:slug/comments    | Comments for an article                    |
| POST   | /api/posts/:slug/comments    | `{ name, body }`                           |
| POST   | /api/subscribe               | `{ email }`                                |
| POST   | /api/contact                 | `{ name, email, topic, message }`          |

## Admin API (needs sign-in)

`POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/me`,
`GET /api/admin/stats`, and create / read / update / delete for
`/api/admin/posts`, plus list and delete for `/comments`, `/messages`, `/subscribers`.

Changing requests must send the header `X-Requested-With: fetch` (the admin page does this for you).

## Writing articles

In the admin page, choose **New post**. The content box uses a tiny format:

- A blank line starts a new paragraph.
- `## Heading` makes a heading (headings fill the "On this page" list).
- `> text` makes a pull quote.
- Lines between two lines of three backticks become a code block.

Untick **Published** to keep a post as a draft that visitors cannot see.

## Security notes

- All database queries use prepared statements.
- Visitor text is shown with `textContent`, never as HTML, so it cannot inject scripts.
- Admin session: signed, httpOnly, SameSite=Strict cookie that expires after 8 hours.
- Sign-in, comments, subscribe and contact are rate limited.
- Helmet adds security headers, including a Content-Security-Policy.
- Behind HTTPS, set `NODE_ENV=production`. The server then refuses to start without a real
  `ADMIN_PASSWORD` and a `SESSION_SECRET` of 24+ characters.
- Behind a proxy such as Nginx, add `app.set('trust proxy', 1)` in `server.js`
  so rate limiting sees the real visitor address.

## Useful commands

```bash
npm run dev                 # restart automatically when files change
npm run seed -- --reset     # wipe posts and comments, then re-add samples
```
