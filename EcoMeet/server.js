// EcoMeet email-code server. Node 18+.  Setup: npm install  then  node server.js
const http = require("http"), crypto = require("crypto"), nodemailer = require("nodemailer");
const E = process.env, PORT = +E.PORT || 8787, ORIGIN = E.ALLOW_ORIGIN || "*";
const DRY = E.MAIL_DRY === "1"; // prints codes in this window instead of emailing (testing only)
const port = +E.SMTP_PORT || 465;
const mail = DRY ? null : nodemailer.createTransport({
  host: E.SMTP_HOST || "smtp.gmail.com", port, secure: port === 465,
  auth: { user: E.SMTP_USER, pass: E.SMTP_PASS },
});
const codes = new Map(), last = new Map(), hits = new Map();
const hash = (s) => crypto.createHash("sha256").update(s + (E.SECRET || "ecomeet")).digest("hex");
const same = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const validEmail = (e) => typeof e === "string" && e.length <= 254 && /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(e);

async function sendCode(kind, email) {
  const key = kind + ":" + email, now = Date.now();
  if (now - (last.get(key) || 0) < 30000) throw Object.assign(new Error("wait"), { code: 429 });
  const code = String(crypto.randomInt(100000, 1000000));
  codes.set(key, { h: hash(key + code), exp: now + 600000, tries: 0 });
  last.set(key, now);
  if (DRY) return console.log(`[test mode] code for ${email}: ${code}`);
  await mail.sendMail({
    from: E.MAIL_FROM || E.SMTP_USER, to: email,
    subject: `Your EcoMeet code: ${code}`,
    text: `Your EcoMeet verification code is ${code}.\nIt expires in 10 minutes. If you did not ask for it, ignore this email and do not share the code.`,
  });
}
function check(kind, email, code) {
  const key = kind + ":" + email, c = codes.get(key);
  if (!c || Date.now() > c.exp) return false;
  if (++c.tries > 5) { codes.delete(key); return false; }
  if (same(c.h, hash(key + String(code).trim()))) { codes.delete(key); return true; }
  return false;
}
const routes = {
  "/mfa/send": async (b) => { if (b.channel !== "email") throw Object.assign(new Error("email only"), { code: 400 }); await sendCode("mfa", b.email); return { ok: true }; },
  "/mfa/verify": async (b) => ({ ok: check("mfa", b.email, b.code) }),
  "/send": async (b) => { await sendCode("su", b.email); return { ok: true }; },
  "/verify": async (b) => ({ ok: check("su", b.email, b.emailCode) }),
  "/tts": async (b) => {
    const t = String(b.text || "").slice(0, 600), lang = String(b.lang || "");
    if (!t || !/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(lang)) throw Object.assign(new Error("bad"), { code: 400 });
    const post = (url, o, hd = {}) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...hd }, body: JSON.stringify(o) });
    if (E.GOOGLE_TRANSLATE_KEY) {
      const lc = { "bn-BD": "bn-IN" }[lang] || lang;
      const r = await post("https://texttospeech.googleapis.com/v1/text:synthesize?key=" + encodeURIComponent(E.GOOGLE_TRANSLATE_KEY), { input: { text: t }, voice: { languageCode: lc }, audioConfig: { audioEncoding: "MP3" } });
      if (r.ok) return { audio: (await r.json()).audioContent };
      console.error("google tts", r.status);
    }
    if (E.OPENAI_API_KEY) {
      const r = await post("https://api.openai.com/v1/audio/speech", { model: E.OPENAI_TTS_MODEL || "tts-1", voice: "alloy", input: t, response_format: "mp3" }, { Authorization: "Bearer " + E.OPENAI_API_KEY });
      if (r.ok) return { audio: Buffer.from(await r.arrayBuffer()).toString("base64") };
      console.error("openai tts", r.status);
    }
    throw Object.assign(new Error("no voice provider set"), { code: 501 });
  },
  "/submit": async () => ({ status: "pending" }),
  "/translate": async (b) => {
    const t = String(b.text || "").slice(0, 600), f = String(b.from || ""), to = String(b.to || ""), ok = /^[A-Za-z-]{2,10}$/;
    if (!t || !ok.test(f) || !ok.test(to)) throw Object.assign(new Error("bad"), { code: 400 });
    const post = (url, o) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(o) });
    if (E.GOOGLE_TRANSLATE_KEY) {
      const r = await post("https://translation.googleapis.com/language/translate/v2?key=" + encodeURIComponent(E.GOOGLE_TRANSLATE_KEY), { q: t, source: f, target: to, format: "text" });
      if (!r.ok) throw new Error("google " + r.status);
      return { text: (await r.json()).data.translations[0].translatedText };
    }
    if (E.LIBRETRANSLATE_URL) {
      const z = (x) => x.replace(/^zh-.*/, "zh");
      const r = await post(E.LIBRETRANSLATE_URL.replace(/\/$/, "") + "/translate", { q: t, source: z(f), target: z(to), format: "text", api_key: E.LIBRETRANSLATE_KEY || "" });
      if (!r.ok) throw new Error("libre " + r.status);
      return { text: (await r.json()).translatedText };
    }
    throw Object.assign(new Error("no translation provider set"), { code: 501 });
  },
};
http.createServer((req, res) => {
  const send = (c, o) => { res.writeHead(c, { "Content-Type": "application/json", "Access-Control-Allow-Origin": ORIGIN, "Access-Control-Allow-Headers": "Content-Type" }); res.end(JSON.stringify(o)); };
  if (req.method === "OPTIONS") return send(204, {});
  const tr = req.url === "/translate" || req.url === "/tts", hk = (tr ? "t" : "m") + req.socket.remoteAddress, n = (hits.get(hk) || []).filter((t) => Date.now() - t < 600000);
  n.push(Date.now()); hits.set(hk, n);
  if (n.length > (tr ? 600 : 40)) return send(429, { error: "slow down" });
  const fn = routes[req.url];
  if (req.method !== "POST" || !fn) return send(404, { error: "not found" });
  let body = "";
  req.on("data", (d) => { body += d; if (body.length > 8e6) req.destroy(); });
  req.on("end", async () => {
    try {
      const b = JSON.parse(body || "{}");
      const needEmail = req.url !== "/submit" && !tr;
      if (needEmail) b.email = String(b.email || "").trim().toLowerCase();
      if (needEmail && !validEmail(b.email)) return send(400, { error: "bad email" });
      send(200, await fn(b));
    } catch (e) { console.error(e.message); send(e.code >= 400 && e.code < 600 ? e.code : 500, { error: "failed" }); }
  });
}).listen(PORT, () => console.log(`EcoMeet code server on http://localhost:${PORT}${DRY ? " (TEST MODE: no email is sent)" : ""}`));
