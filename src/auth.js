const crypto = require('crypto');

const COOKIE = 'nj_admin';
const MAX_AGE_MS = 8 * 60 * 60 * 1000; // 8 hours

const isProd = process.env.NODE_ENV === 'production';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (isProd ? '' : 'admin123');
const SECRET = process.env.SESSION_SECRET || (isProd ? '' : 'dev-only-secret-change-me');

if (isProd && (!ADMIN_PASSWORD || !SECRET || SECRET.length < 24)) {
  console.error('Set ADMIN_PASSWORD and a SESSION_SECRET (24+ chars) before running in production.');
  process.exit(1);
}
if (!isProd && (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET)) {
  console.warn('[auth] Using development defaults (password: admin123). Create a .env file before deploying.');
}

const b64 = (buf) => Buffer.from(buf).toString('base64url');
const hmac = (data) => crypto.createHmac('sha256', SECRET).update(data).digest('base64url');

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function createToken() {
  const payload = b64(JSON.stringify({ role: 'admin', exp: Date.now() + MAX_AGE_MS }));
  return `${payload}.${hmac(payload)}`;
}

function verifyToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return false;
  const [payload, sig] = token.split('.');
  if (!safeEqual(sig, hmac(payload))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.role === 'admin' && data.exp > Date.now();
  } catch { return false; }
}

const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: isProd,
  maxAge: MAX_AGE_MS,
  path: '/'
};

function checkPassword(input) {
  return !!ADMIN_PASSWORD && safeEqual(input ?? '', ADMIN_PASSWORD);
}

// Cookie + custom header. Browsers will not send a custom header cross-site
// without a CORS preflight (which this server never approves), which blocks CSRF.
function requireAdmin(req, res, next) {
  if (!verifyToken(req.cookies[COOKIE])) {
    return res.status(401).json({ error: 'Please sign in.' });
  }
  if (req.method !== 'GET' && req.get('X-Requested-With') !== 'fetch') {
    return res.status(403).json({ error: 'Missing request header.' });
  }
  next();
}

module.exports = { COOKIE, cookieOptions, createToken, verifyToken, checkPassword, requireAdmin };
