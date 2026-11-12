/**
 * vlzo.com mail backend (Cloudflare Worker). UNTESTED starting point, review before going live.
 *
 * What it does
 *   - receives mail sent to anything@vlzo.com (Cloudflare Email Routing -> this Worker)
 *   - lets the page claim an address, read the inbox, and send mail
 *
 * SETUP (about 15 minutes)
 *   1. Own the domain vlzo.com and add it to Cloudflare (Cloudflare DNS).
 *   2. Cloudflare dashboard -> Email -> Email Routing -> enable it for vlzo.com.
 *      Add the catch-all rule: "Send to a Worker" -> this Worker.
 *   3. Create a KV namespace and bind it to this Worker with the name MAIL.
 *   4. For sending, create an account at resend.com, verify vlzo.com there (adds DNS records),
 *      then run:  npx wrangler secret put RESEND_KEY
 *   5. npm i postal-mime   and deploy with wrangler (this file is an ES module).
 *   6. Put the Worker URL in MAIL_API at the top of claim-email.html.
 *   Set ALLOW_ORIGIN below to the address of your site.
 */
import PostalMime from 'postal-mime';

const DOMAIN = 'vlzo.com';
const ALLOW_ORIGIN = '*'; // change to your site, e.g. 'https://yoursite.com'
const RESERVED = new Set('admin administrator support postmaster abuse root info hello noreply no-reply contact mail webmaster security help sales billing ecomeet vlzo team staff'.split(' '));
const HANDLE = /^[a-z0-9](?:[a-z0-9._-]{1,14})[a-z0-9]$/;

const cors = { 'access-control-allow-origin': ALLOW_ORIGIN, 'access-control-allow-headers': 'content-type, authorization', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', ...cors } });
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const sha = async s => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
const okHandle = h => typeof h === 'string' && HANDLE.test(h) && !/[._-]{2}/.test(h) && !RESERVED.has(h);

async function authed(req, env, handle) {
  const t = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const acct = await env.MAIL.get('acct:' + handle, 'json');
  return !!(t && acct && acct.hash === await sha(t));
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    const url = new URL(req.url);

    if (url.pathname === '/claim' && req.method === 'POST') {
      const { handle, call } = await req.json().catch(() => ({}));
      if (!okHandle(handle) || !/^\d{9}$/.test(String(call))) return json({ error: 'bad request' }, 400);
      if (await env.MAIL.get('acct:' + handle)) return json({ error: 'taken' }, 409);
      // one address per call number
      if (await env.MAIL.get('call:' + call)) return json({ error: 'number already has an address' }, 409);
      const token = hex(crypto.getRandomValues(new Uint8Array(24)));
      await env.MAIL.put('acct:' + handle, JSON.stringify({ call, hash: await sha(token), at: Date.now() }));
      await env.MAIL.put('call:' + call, handle);
      return json({ token });
    }

    if (url.pathname === '/inbox' && req.method === 'GET') {
      const handle = (url.searchParams.get('handle') || '').toLowerCase();
      if (!okHandle(handle) || !(await authed(req, env, handle))) return json({ error: 'unauthorized' }, 401);
      const { keys } = await env.MAIL.list({ prefix: 'msg:' + handle + ':', limit: 100 });
      const msgs = (await Promise.all(keys.map(k => env.MAIL.get(k.name, 'json')))).filter(Boolean);
      msgs.sort((a, b) => b.date - a.date);
      return json(msgs);
    }

    if (url.pathname === '/send' && req.method === 'POST') {
      const { handle, to, subject, text } = await req.json().catch(() => ({}));
      if (!okHandle(handle) || !(await authed(req, env, handle))) return json({ error: 'unauthorized' }, 401);
      if (!/^\S+@\S+\.\S+$/.test(to || '') || !text || String(text).length > 5000) return json({ error: 'bad request' }, 400);
      // simple daily cap per address, to limit abuse
      const day = new Date().toISOString().slice(0, 10), ck = 'cnt:' + handle + ':' + day;
      const n = +(await env.MAIL.get(ck) || 0);
      if (n >= 50) return json({ error: 'daily limit reached' }, 429);
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: 'Bearer ' + env.RESEND_KEY, 'content-type': 'application/json' },
        body: JSON.stringify({ from: `${handle}@${DOMAIN}`, to: [to], subject: String(subject || '(no subject)').slice(0, 150), text: String(text) }),
      });
      if (!r.ok) return json({ error: 'send failed' }, 502);
      await env.MAIL.put(ck, String(n + 1), { expirationTtl: 90000 });
      return json({ ok: true });
    }

    return json({ error: 'not found' }, 404);
  },

  // incoming mail for anything@vlzo.com
  async email(message, env) {
    const handle = message.to.split('@')[0].toLowerCase();
    if (!okHandle(handle) || !(await env.MAIL.get('acct:' + handle))) {
      message.setReject('No such mailbox');
      return;
    }
    if (message.rawSize > 5 * 1024 * 1024) { message.setReject('Message too large'); return; }
    const mail = await PostalMime.parse(message.raw);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await env.MAIL.put('msg:' + handle + ':' + id, JSON.stringify({
      id,
      from: mail.from ? (mail.from.name ? `${mail.from.name} <${mail.from.address}>` : mail.from.address) : message.from,
      subject: mail.subject || '',
      text: (mail.text || '').slice(0, 20000),
      date: Date.now(),
    }), { expirationTtl: 60 * 60 * 24 * 30 });
  },
};
