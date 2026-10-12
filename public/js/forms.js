// Newsletter + contact forms (used on several pages).
import { api, $, status } from './api.js';

function wire(selector, path, toBody) {
  const form = $(selector);
  if (!form) return;
  const msg = form.querySelector('.status') || form.parentElement.querySelector('.status');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      const res = await api(path, { method: 'POST', body: toBody(form) });
      status(msg, res.message || 'Done.');
      form.reset();
    } catch (err) { status(msg, err.message, false); }
    btn.disabled = false;
  });
}

wire('#newsletter-form', '/subscribe', (f) => ({ email: f.elements.email.value }));
wire('#contact-form', '/contact', (f) => ({ name: f.elements.name.value, email: f.elements.email.value, topic: f.elements.topic.value, message: f.elements.message.value }));
