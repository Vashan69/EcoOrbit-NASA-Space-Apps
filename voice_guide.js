/* VLZO Voice Guide: speaks a welcome and describes whatever you hover over.
   Uses your browser's built-in speech voices. Nothing is recorded or sent anywhere. */
(() => {
  if (window.__vg) return;
  window.__vg = 1;
  const ss = window.speechSynthesis,
    KEY = "vlzo_voice",
    CFG = "vlzo_voice_cfg";
  let st = null,
    sst = null;
  try {
    st = localStorage;
  } catch (e) {}
  try {
    sst = sessionStorage;
  } catch (e) {}
  const rd = (k, d) => {
    try {
      return JSON.parse(st.getItem(k)) ?? d;
    } catch (e) {
      return d;
    }
  };
  let on = !(st && st.getItem(KEY) === "off"),
    armed = false,
    blocked = false,
    started = false,
    lastT = "",
    lastAt = 0,
    timer,
    voices = [];
  let cfg = Object.assign({ voice: "", rate: 1 }, rd(CFG, {}));

  /* Avatar shown above the orb once the guide is on. Default filename can be overridden with
   <script src="voice_guide.js" data-avatar="my.png" defer></script> without touching this file. */
  const _s = document.currentScript;
  const AVATAR = (_s && _s.dataset && _s.dataset.avatar) || "Omar_Chatbot.png";

  const KNOWN = [
    ["#home", "Home. Take me back to the top of the page."],
    [
      "Privacy_and_Safety",
      "Privacy and Safety. See what data we keep and how you control it.",
    ],
    ["Our_Services", "Our Services. Browse everything we offer."],
    ["VLZO_TV", "VLZO TV. Watch our hackathon presentation."],
    [
      "Test_Yourself",
      "Test Yourself. Take the cyber security test and earn a certificate.",
    ],
    ["ijisrt.com", "Story. Read the story behind this project."],
    ["VASHAN", "VASHAN Antivirus. Scan a file for known threats."],
    ["project/web", "Explore the 3D globe and live data."],
  ];

  const page = (document.title || "").toLowerCase();
  const WELCOME = page.includes("services")
    ? "Welcome to Our Services. Hover over any card to hear about it, then click it for the full details."
    : page.includes("vlzo tv")
      ? "Welcome to VLZO TV. Pick a video, and hover over anything to hear what it does."
      : page.includes("privacy")
        ? "Welcome to Privacy and Safety. Your data stays in your control. Hover over anything and I will explain it."
        : page.includes("test yourself")
          ? "Welcome to the cyber security test. Tick one box per question. Get all twenty right to earn your certificate."
          : "Welcome to The Third World Peace VLZO UFO. I am Omar Ibne Abdullah, the Team Leader of The Third World Peace VLZO UFO. Hover over anything and I will tell you what it is.";

  const css = document.createElement("style");
  css.textContent = `#vg{position:fixed;left:20px;bottom:20px;z-index:2147483000;display:flex;flex-direction:column;align-items:flex-start;gap:10px;font-family:Inter,system-ui,sans-serif}
#vg .r{display:flex;align-items:center;gap:10px}
#vg .av{display:none;align-items:flex-end;gap:10px;max-width:min(420px,calc(100vw - 40px))}
#vg .av.show{display:flex}
#vg .av img{width:64px;height:64px;flex:none;border-radius:50%;object-fit:cover;border:2px solid #4fd1ff;box-shadow:0 8px 24px #4fd1ff55;background:#0c1630}
#vg .cap{max-width:min(260px,calc(100vw - 130px));background:#0c1630ee;color:#e8eefc;border:1px solid #1e2e57;border-radius:14px;border-bottom-left-radius:4px;padding:9px 13px;font-size:13px;line-height:1.5;white-space:normal;overflow-wrap:anywhere;word-wrap:break-word;opacity:0;transform:translateY(6px);transition:opacity .25s,transform .25s}
#vg .cap.show{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){#vg .cap{transition:none}}
#vg .o{position:relative;width:58px;height:58px;border-radius:50%;border:0;cursor:pointer;background:linear-gradient(135deg,#4fd1ff,#7c5cff);color:#04101f;display:grid;place-items:center;box-shadow:0 10px 30px #4fd1ff44;transition:transform .15s,filter .2s}
#vg .o:hover{transform:scale(1.08)}#vg :focus-visible{outline:3px solid #fff;outline-offset:3px}
#vg .o:not(.on){filter:grayscale(.9) brightness(.85)}
#vg .o i{position:absolute;inset:0;border-radius:50%;border:2px solid #4fd1ff;opacity:0}
#vg .o.talk i{animation:vgp 1.2s ease-out infinite}#vg .o.talk i+i{animation-delay:.6s}
@keyframes vgp{0%{transform:scale(1);opacity:.8}100%{transform:scale(1.9);opacity:0}}
#vg .t{font-size:12.5px;color:#e8eefc;background:#0c1630ee;border:1px solid #1e2e57;padding:5px 11px;border-radius:99px}
#vg .g{width:34px;height:34px;border-radius:50%;border:1px solid #1e2e57;background:#0c1630ee;color:#a3b3d6;cursor:pointer;font-size:16px}
#vg .p{display:none;width:270px;background:#0c1630;color:#e8eefc;border:1px solid #1e2e57;border-radius:14px;padding:14px;box-shadow:0 12px 40px #0009;font-size:13.5px}
#vg .p.s{display:block}#vg .p label{display:block;color:#a3b3d6;margin:8px 0 4px}
#vg .p select,#vg .p button{width:100%;padding:8px 10px;border-radius:9px;border:1px solid #1e2e57;background:#050b1a;color:#e8eefc;font:inherit}
#vg .p input{width:100%}#vg .p button{margin-top:12px;background:#4fd1ff;color:#04101f;border:0;font-weight:600;cursor:pointer}
@media(prefers-reduced-motion:reduce){#vg .o.talk i{animation:none;opacity:.6}}
/* UFO + Omar tour guide. During the tour the saucer flies across the site with Omar hidden inside it.
   When it lands beside a section, the beam drops and Omar steps out to point at it (.out). */
#vgufo{position:fixed;left:0;top:0;z-index:2147483400;display:flex;align-items:flex-start;gap:10px;opacity:0;pointer-events:none;
  transform:translate(-420px,110px);transition:transform 1.5s cubic-bezier(.45,.05,.25,1),opacity .4s}
#vgufo.show{opacity:1}
#vgufo[data-side=R]{flex-direction:row-reverse;--nudge:-7px}#vgufo[data-side=L]{--nudge:7px}
#vgufo .stack{position:relative;display:flex;flex-direction:column;align-items:center;width:150px;transition:transform .45s}
#vgufo.fly .stack{transform:rotate(var(--tilt,8deg))}
#vgufo .saucer{width:104px;height:34px;border-radius:50%;background:radial-gradient(ellipse at 30% 30%,#bfeaff,#4fd1ff 55%,#1c6fa8);
  box-shadow:0 0 24px 4px #4fd1ff99,inset 0 -4px 10px #04101f66;position:relative;z-index:2;animation:vgUfoBob 2.6s ease-in-out infinite}
#vgufo .saucer i{position:absolute;top:6px;width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 0 8px 2px #fff}
#vgufo .saucer i:nth-child(1){left:14px}#vgufo .saucer i:nth-child(2){left:44px;background:#ffef8a;box-shadow:0 0 8px 2px #ffef8a}#vgufo .saucer i:nth-child(3){left:74px}
#vgufo .dome{position:absolute;left:50%;top:-16px;transform:translateX(-50%);width:46px;height:26px;border-radius:50% 50% 0 0;
  background:linear-gradient(180deg,#ffffffcc,#4fd1ff88);border:1px solid #ffffff55}
#vgufo .beam{width:70px;height:64px;background:linear-gradient(180deg,#4fd1ff77,#4fd1ff00);clip-path:polygon(30% 0,70% 0,100% 100%,0 100%);
  transform:scaleY(0);transform-origin:top;transition:transform .4s .3s ease;animation:vgBeamPulse 1.6s ease-in-out infinite}
#vgufo.out .beam{transform:scaleY(1);transition-delay:0s}
#vgufo .omarwrap{position:relative;z-index:1;width:96px;height:96px;margin-top:-6px;opacity:0;transform:translateY(-118px) scale(.2);
  transition:transform .5s cubic-bezier(.5,0,.8,.4),opacity .25s .25s}
#vgufo.out .omarwrap{opacity:1;transform:none;transition:transform .7s .3s cubic-bezier(.2,1.3,.4,1),opacity .2s .3s}
#vgufo img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 6px 10px #04101faa)}
#vgufo .hand{position:absolute;top:34px;font-size:26px;line-height:1;animation:vgPoint .7s ease-in-out infinite alternate}
#vgufo[data-side=R] .hand{left:-30px}#vgufo[data-side=L] .hand{right:-30px}
#vgufo .bubble{max-width:230px;background:#0c1630ee;color:#e8eefc;border:1px solid #4fd1ff55;border-radius:14px;
  border-top-left-radius:4px;padding:10px 14px;font-size:12.5px;line-height:1.45;margin-top:18px;box-shadow:0 10px 26px #0007;opacity:0}
#vgufo[data-side=R] .bubble{border-top-left-radius:14px;border-top-right-radius:4px}
#vgufo.out .bubble{animation:vgBubbleIn .4s .5s ease forwards}
#vgufo .bubble b{color:#4fd1ff}
@keyframes vgUfoBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes vgBeamPulse{0%,100%{opacity:.6}50%{opacity:1}}
@keyframes vgPoint{to{transform:translateX(var(--nudge,6px))}}
@keyframes vgBubbleIn{0%{opacity:0}100%{opacity:1}}
.vg-target-glow{outline:3px solid #4fd1ffcc!important;outline-offset:3px;border-radius:18px;animation:vgTargetPulse 1.4s ease-in-out infinite}
@keyframes vgTargetPulse{0%,100%{box-shadow:0 0 0 0 #4fd1ff66}50%{box-shadow:0 0 0 14px #4fd1ff00}}
@media(prefers-reduced-motion:reduce){#vgufo,#vgufo *,.vg-target-glow{animation:none!important;transition:none!important}}
@media(max-width:640px){#vgufo .stack{width:110px}#vgufo .saucer{width:78px;height:26px}#vgufo .omarwrap{width:72px;height:72px;transform:translateY(-100px) scale(.2)}#vgufo .bubble{max-width:170px;font-size:11.5px}}
#vg .p .h{margin:8px 0 0;color:#a3b3d6;font-size:12px;line-height:1.45}
/* Site-tour portal: a spinning wormhole the UFO flies into before a page changes, and out of
   right after the next page loads, so the tour feels continuous across real page navigations. */
#vgportal{position:fixed;left:50%;top:50%;width:210px;height:210px;margin:-105px 0 0 -105px;
  z-index:2147483450;opacity:0;pointer-events:none;transition:opacity .3s}
#vgportal.show{opacity:1}
#vgportal .scaler{width:100%;height:100%;transform:scale(.08);transition:transform .55s cubic-bezier(.3,1.5,.4,1)}
#vgportal.open .scaler{transform:scale(1)}
#vgportal .ring{position:absolute;inset:0;border-radius:50%;
  background:conic-gradient(from 0deg,#4fd1ff,#7c5cff,#00f2fe,#4fd1ff);
  box-shadow:0 0 60px 14px #4fd1ff88,inset 0 0 30px #04101f;animation:vgPortalSpin 1.6s linear infinite}
#vgportal .hole{position:absolute;inset:14%;border-radius:50%;background:radial-gradient(circle,#0c1a3a,#02040c 75%)}
@keyframes vgPortalSpin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){#vgportal,#vgportal *{animation:none!important;transition:none!important}}
/* Result window shown when the recorded tour is ready */
#vgres{position:fixed;inset:0;z-index:2147483600;display:none;place-items:center;background:#02060fcc;padding:16px;font-family:Inter,system-ui,sans-serif}
#vgres.s{display:grid}
#vgres .box{width:min(760px,100%);max-height:100%;overflow:auto;background:#0c1630;color:#e8eefc;border:1px solid #1e2e57;border-radius:16px;padding:18px;box-shadow:0 20px 60px #000a}
#vgres h3{margin:0 0 10px;font-size:17px;font-weight:600}
#vgres video{width:100%;aspect-ratio:16/9;border-radius:10px;background:#000}
#vgres .m{margin:10px 0 0;font-size:13px;min-height:18px;color:#4fd1ff}#vgres .h{margin:6px 0 0;font-size:12px;color:#a3b3d6}
#vgres .b{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
#vgres .b button,#vgres .b a{padding:9px 14px;border-radius:99px;border:1px solid #1e2e57;background:#050b1a;color:#e8eefc;font:600 13.5px Inter,system-ui,sans-serif;cursor:pointer;text-decoration:none}
#vgres .b .pri{background:#4fd1ff;color:#04101f;border:0}
#vgres :focus-visible{outline:3px solid #4fd1ff;outline-offset:2px}`;
  document.head.appendChild(css);

  const box = document.createElement("div");
  box.id = "vg";
  box.innerHTML =
    '<div class="av" id="vgav"><img id="vgavimg" src="' +
    AVATAR +
    '" alt="Voice guide"><div class="cap" id="vgcap"></div></div><div class="p" id="vgp"><b>Voice settings</b><label for="vgv">Voice (pick the most natural one)</label><select id="vgv"></select><label for="vgr">Speed</label><input type="range" id="vgr" min="0.7" max="1.3" step="0.05"><button id="vgt2">Preview voice</button><button id="vgtour">\u{1F3AC} Record the tour with Omar</button><button id="vginsta">\u26A1 Insta Tour \u2014 get the video fast (~25s)</button><button id="vgsitetour">\u{1F300} Tour the whole site with Omar</button><p class="h">Your browser will ask to share your screen \u2014 <b>share whatever it asks for</b> (a tab or your whole screen) and leave audio sharing switched on; which one depends on whether your device has an online voice. Works best in Chrome or Edge; Firefox and Safari can\u2019t share any audio. We automatically switch to an \u201Conline\u201D voice while recording when one is available, since those are the most reliably captured, even if you\u2019ve picked an offline one above.</p></div><div class="r"><button class="o" id="vgo" aria-pressed="false" aria-label="Voice guide"><i></i><i></i><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg></button><span class="t" id="vgl"></span><button class="g" id="vgg" aria-label="Voice settings" aria-expanded="false">⚙</button></div>';
  document.body.appendChild(box);

  /* UFO + Omar/Zara: a small flying-saucer guide that beams a character down next to whatever
   section the tour is currently narrating, pointing at it with a caption bubble. Omar handles
   right-side content (he parks on the left and points right); Zara handles left-side content
   (she parks on the right and points left), so whichever one is out matches which way the
   pointing hand faces, and the other stays tucked inside the saucer. */
  const OMAR_PHOTO = (_s && _s.dataset && _s.dataset.omar) || "Omar-Photoroom.png";
  const ZARA_PHOTO = (_s && _s.dataset && _s.dataset.zara) || "Zara.png";
  const ufo = document.createElement("div");
  ufo.id = "vgufo";
  ufo.dataset.side = "R";
  ufo.innerHTML =
    '<div class="stack"><div class="saucer"><i></i><i></i><i></i><div class="dome"></div></div><div class="beam"></div><div class="omarwrap"><img id="vgufoimg" src="' +
    OMAR_PHOTO +
    '" alt="Omar, your guide"><span class="hand" id="vgufohand" aria-hidden="true"></span></div></div><div class="bubble" id="vgufobubble"></div>';
  document.body.appendChild(ufo);
  document.getElementById("vgufoimg").onerror = function () {
    this.style.display = "none";
  };

  const portal = document.createElement("div");
  portal.id = "vgportal";
  portal.setAttribute("aria-hidden", "true");
  portal.innerHTML =
    '<div class="scaler"><div class="ring"></div><div class="hole"></div></div>';
  document.body.appendChild(portal);

  const $ = (id) => document.getElementById(id),
    orb = $("vgo"),
    lab = $("vgl"),
    avWrap = $("vgav"),
    cap = $("vgcap");
  $("vgavimg").onerror = () => {
    avWrap.style.display = "none";
  };
  function ui() {
    orb.classList.toggle("on", on);
    orb.setAttribute("aria-pressed", on);
    lab.textContent = on
      ? blocked
        ? "Click anywhere to hear me"
        : "Voice guide on"
      : "Turn on voice guide";
    avWrap.classList.toggle("show", on);
    if (!on) endCaptions();
  }

  /* Captions: show what the guide is saying next to its avatar, up to 10 words at a time,
   word-wrapped inside a fixed-width bubble so it never spills across the page. Each group
   fades out and the next fades in, timed to roughly match the speech. */
  let capTimer = null;
  function endCaptions() {
    clearTimeout(capTimer);
    capTimer = null;
    cap.classList.remove("show");
  }
  function showCaptions(text, rate) {
    endCaptions();
    if (!on) return;
    const words = text
      .replace(/[\u{1F000}-\u{1FAFF}\u2600-\u27BF\uFE0F]/gu, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!words.length) return;
    const groups = [];
    for (let i = 0; i < words.length; i += 10)
      groups.push(words.slice(i, i + 10).join(" "));
    const wpm = 165 * (rate || 1);
    let gi = 0;
    function showGroup() {
      if (gi >= groups.length) {
        cap.classList.remove("show");
        return;
      }
      const g = groups[gi++],
        n = g.split(" ").length,
        dur = Math.max(900, (n / wpm) * 60000);
      cap.textContent = g;
      cap.classList.add("show");
      capTimer = setTimeout(hideThenNext, dur);
    }
    function hideThenNext() {
      cap.classList.remove("show");
      capTimer = setTimeout(showGroup, gi < groups.length ? 200 : 0);
    }
    showGroup();
  }

  /* 4-minute full EcoOrbit site tour: a scripted, condensed walkthrough of everything on the site and
   how to use it. While it plays, the normal hover/focus/selection speech is paused so it
   doesn't talk over itself; hovering goes back to normal the moment the tour ends. */
  const TOUR_SECONDS = 240;
  const TOUR_TEXT =
    "Full EcoOrbit guided presentation. Hi, I’m Omar Ibne Abdullah, Team Leader of The Third World Peace VLZO UFO. Welcome to EcoOrbit, a prototype and educational visualization for orbital sustainability, not an operational flight control system.  Here’s the problem. Earth’s orbit is getting crowded. Retired spacecraft, spent rocket stages, and fragments travel at extreme speed, so even a small piece of debris matters. Responsible operators plan for passivation, collision avoidance, and end of life disposal, so a mission’s responsibility doesn’t end when the mission does.  At the top of EcoOrbit is the Satellite and Debris Simulator, a three dimensional globe built with Three point js, showing simulated satellites, NASA related objects, and debris. Select a node and the Node Inspector shows altitude, velocity, estimated carbon cost, and a collision risk index. These are educational estimates, not certified operational data.  Next to it, the Mission Telemetry Dashboard turns a single object into an analytical view. Ground track, altitude history, closest debris distance, and a timeline you can pause, scrub, and export as a CSV file.  The Sustainability Score Calculator lets you pick an example operator, or build a custom constellation with satellite count, launch cadence, de-orbit compliance, and autonomous collision avoidance, then generates a score, a grade, an estimated carbon figure, and a green credit style output. It’s a prototype model, not a universal standard.  Collision Prediction is our educational decision support layer. It estimates an approach to debris and shows a simulated avoidance action. Real conjunction assessment needs authoritative tracking data and expert review; this demonstrates the concept.  Under the hood, the front end runs on HTML, Tailwind style CSS, JavaScript, and Three point js, with browser side charts, PDF reporting, local storage, and this voice guide, all built so each piece can evolve on its own.  The Video Pitch section is the presentation hub. This EcoOrbit tour can be recorded right from the browser, previewed, downloaded, and, only if you choose, saved for VLZO TV or the pitch player. It never replaces your existing video automatically, so your current presentation stays safe until you promote a new one.  From here the site connects outward. Our Services collects every capability in one place. Privacy and Safety explains what stays local and what doesn’t. VASHAN Antivirus is a browser based file scanning workflow. Test Yourself turns the project into a quiz with a certificate. VLZO TV is our lightweight media platform, and the Story page carries the narrative behind the build.  So, the core idea. EcoOrbit is a visual platform for exploring orbital sustainability: simulation, telemetry, sustainability scoring, collision risk education, reporting, and presentation tools, connected into one understandable experience. Looking ahead, a production version could ingest authoritative orbital catalogs, validated propagation, and independently verified environmental accounting.  Quick recap. The three D globe shows the environment. The Node Inspector explains a selected object. Telemetry shows it over time. The calculator demonstrates a scoring model. Collision prediction demonstrates decision support. And the Voice Guide ties it all together.  One last reminder: EcoOrbit’s simulated values, carbon figures, and risk indexes are model outputs for learning, not certified real world measurements. Real operations depend on authoritative data and expert review.  Thank you for joining the EcoOrbit tour. I’m Omar Ibne Abdullah. Explore the globe, select an object, try the calculator, and open the project story. Welcome to EcoOrbit.";
  /* Timeline for the flying UFO guide: at roughly the moment the narration above reaches
   each part of the site, the page auto-scrolls there and Omar beams down out of the UFO
   to point at what's being described. Fractions are each stop's position (0-1) through
   TOUR_TEXT, worked out from word count so the visit lines up with the voice. */
  const TOUR_STOPS = [
    { frac: 0.01, sel: "#simulator", cap: "<b>Welcome to EcoOrbit</b> — problem, mission, and orbital context." },
    { frac: 0.15, sel: "#simulator", cap: "<b>3D Orbital Environment</b> — inspect simulated satellites and debris." },
    { frac: 0.25, sel: "#telemetry", cap: "<b>Mission Telemetry</b> — ground track, altitude, debris distance, and timeline." },
    { frac: 0.32, sel: "#calculator", cap: "<b>Sustainability Calculator</b> — explore the prototype scoring model." },
    { frac: 0.40, sel: "#collision", cap: "<b>Collision Prediction</b> — educational decision-support visualization." },
    { frac: 0.47, sel: "#techstack", cap: "<b>Technology Stack</b> — browser UI, Three.js, AI/ML concepts, reporting." },
    { frac: 0.54, sel: "#pitch", hi: '[onclick*="4min EcoOrbit Tour"]', cap: "<b>Short-form presentation</b> — this new full-length EcoOrbit guided tour." },
    { frac: 0.60, sel: "#pitch", cap: "<b>Presentation workflow</b> — the new tour never replaces media automatically." },
    { frac: 0.64, sel: "#simulator", cap: "<b>Supporting pages</b> — Services, Privacy, VASHAN, Test Yourself, VLZO TV, and Story." },
    { frac: 0.90, sel: "#vg", pin: "orb", cap: "<b>Voice Guide</b> — change voice, speed, and replay the tour." }
  ];
  /* ---- Insta Tour: a ~25-second condensed highlights reel. Same recording pipeline as the
   full 4-minute tour, just with a short script, fewer UFO stops, and shorter intro/outro
   cards, so the finished, downloadable video is ready in well under a minute. ---- */
  const TEASER_SECONDS = 25;
  const TEASER_TEXT =
    "Quick EcoOrbit highlights. Hi, I\u2019m Omar Ibne Abdullah, Team Leader of The Third World Peace VLZO UFO. EcoOrbit is a prototype for orbital sustainability: a live three D debris simulator, mission telemetry, a sustainability score calculator, and educational collision prediction. Explore the globe, select an object, and try the calculator. Thanks for the quick look \u2014 welcome to EcoOrbit.";
  const TEASER_STOPS = [
    { frac: 0.03, sel: "#simulator", cap: "<b>EcoOrbit</b> \u2014 orbital sustainability, in 25 seconds." },
    { frac: 0.4, sel: "#calculator", cap: "<b>Sustainability Calculator</b> \u2014 the scoring model, at a glance." },
    { frac: 0.68, sel: "#collision", cap: "<b>Collision Prediction</b> \u2014 educational decision support." },
    { frac: 0.88, sel: "#vg", pin: "orb", cap: "<b>Voice Guide</b> \u2014 powered by Omar." },
  ];
  const TEASER_CHAPTERS = [
    "Welcome",
    "Sustainability Calculator",
    "Collision Prediction",
    "Meet the Voice Guide",
  ];
  const TEASER_INTRO_MS = 1100,
    TEASER_OUTRO_MS = 2500;
  /* ---- End card info. Fill in address / email / website here (or set window.VLZO_ABOUT before this
     script loads). Empty fields are skipped. ---- */
  const ABOUT = Object.assign(
    {
      name: "The Third World Peace VLZO UFO",
      event: "NASA Space Apps Challenge 2026 \u2022 The Next Frontier",
      lead: "Omar Ibne Abdullah, Team Leader",
      address: "",
      email: "",
      website: "",
    },
    window.VLZO_ABOUT || {},
  );
  const CHAPTERS = [
    "Welcome",
    "Satellite & Debris Simulator",
    "Sustainability Score Calculator",
    "Collision Prediction",
    "Tech Stack",
    "Full EcoOrbit Tour",
    "30-Second Teaser",
    "Site Menu",
    "Meet the Voice Guide",
  ];
  const INTRO_MS = 3500,
    OUTRO_MS = 8000;

  /* ---- Whole-site portal tour: Omar and the UFO fly through a wormhole from page to page,
     narrating each one in turn, in this order. `match` identifies the current page from its
     filename (works no matter which of a page's linked names actually loaded it). `file` is
     the exact link used to reach the next page. `stops` reuses the normal UFO-visit format. ---- */
  const SITE_TOUR = [
    {
      match: (fn) => fn === "" || fn.includes("ecoorbit"),
      file: "EcoOrbit_10.html",
      text: "Welcome to EcoOrbit, home of The Third World Peace VLZO UFO. I'm Omar Ibne Abdullah, Team Leader. This is our satellite and debris simulator: a live three-D globe with simulated orbital objects, a sustainability calculator, and collision-risk education, all in one place. Let's hop through the rest of the site together.",
      stops: [
        { frac: 0.06, sel: "#simulator", cap: "<b>3D Orbital Simulator</b> — the interactive globe." },
        { frac: 0.55, sel: "#calculator", cap: "<b>Sustainability Calculator</b> — score any mission." },
        { frac: 0.85, sel: "#collision", cap: "<b>Collision Prediction</b> — educational risk demo." },
      ],
    },
    {
      match: (fn) => fn.includes("about_us"),
      file: "About_Us_final (1).html",
      text: "Welcome to About Us. We're a four-person team building The Third World Peace VLZO UFO for the NASA Space Apps Challenge, focused on orbital awareness, sustainability, and education first. Omar Ibne Abdullah leads the project, Amira Mozumder Zara supports the experience, Abdullah Al Mahmud Mozumder advises, and Sabekun Naher keeps the team organized. This is an independent NASA Space Apps Challenge entry, not affiliated with NASA.",
      stops: [
        { frac: 0.05, sel: ".hero h1", cap: "<b>Meet the team</b> behind the mission." },
        { frac: 0.4, sel: "#team", cap: "<b>The team</b> — four people, one mission." },
        { frac: 0.85, sel: ".note h2", cap: "<b>NASA Space Apps Challenge</b> — an independent entry." },
      ],
    },
    {
      match: (fn) => fn.includes("privacy"),
      file: "Privacy_and_Safety.html",
      text: "Welcome to Privacy and Safety. Here's what stays on your device and what doesn't: see what we collect, control your saved data with a download or full delete, follow our staying-safe checklist, and read about security and your rights. Nothing here leaves your browser unless you choose to share it.",
      stops: [
        { frac: 0.06, sel: "#overview", cap: "<b>Overview</b> — how your data is handled." },
        { frac: 0.35, sel: "#controls", cap: "<b>Your controls</b> — download or delete anytime." },
        { frac: 0.62, sel: "#safety", cap: "<b>Staying safe</b> — a quick checklist." },
        { frac: 0.86, sel: "#rights", cap: "<b>Your rights</b> — plain and simple." },
      ],
    },
    {
      match: (fn) => fn.includes("our_services"),
      file: "Our_Services.html",
      text: "Welcome to Our Services, everything we offer in one place. Track satellites and debris on the 3D globe, score a mission's sustainability, explore carbon credit offsets, check collision risk alerts, scan a file with VASHAN Antivirus, review Privacy and Safety, test yourself with our cyber security quiz, or watch VLZO TV. Search or filter by category, then click any card for the full details.",
      stops: [
        { frac: 0.05, sel: ".hero h1", cap: "<b>Everything we offer</b> — in one place." },
        { frac: 0.42, sel: "#chips", cap: "<b>Filter by category</b> — Tracking, Sustainability, Security, Media." },
        { frac: 0.78, sel: "#grid", cap: "<b>Browse every service</b> — click a card to open it." },
      ],
    },
    {
      match: (fn) => fn.includes("vlzo_tv"),
      file: "VLZO_TV.html",
      text: "Welcome to VLZO TV, our own little video platform. Watch the full EcoOrbit guided tour, like and comment, and see what's coming up next. New videos and surprises are on the way, so check back soon.",
      stops: [
        { frac: 0.12, sel: "#player", cap: "<b>The player</b> — watch our EcoOrbit tour." },
        { frac: 0.58, sel: ".info", cap: "<b>Like, share, and comment</b> below the video." },
        { frac: 0.86, sel: ".next", cap: "<b>Up next</b> — more videos are coming." },
      ],
    },
    {
      match: (fn) => fn.includes("test_yourself"),
      file: "Test_Yourself.html",
      text: "And finally, Test Yourself: twenty questions about staying safe online. Get every one right and you'll unlock an official certificate and digital badge; miss a few and we'll show you exactly which ones so you can try again. That's the full tour of The Third World Peace VLZO UFO. Thanks for flying with me — I'm Omar Ibne Abdullah. Go explore!",
      stops: [
        { frac: 0.12, sel: ".intro h1", cap: "<b>Cyber security test</b> — twenty quick questions." },
        { frac: 0.65, sel: "#sub", cap: "<b>Submit your answers</b> to see your score." },
      ],
    },
  ];
  const SITE_TOUR_KEY = "vlzo_site_tour";
  function siteTourActive() {
    try {
      return sst && sst.getItem(SITE_TOUR_KEY) === "1";
    } catch (e) {
      return false;
    }
  }
  function setSiteTourActive(v) {
    try {
      if (v) sst.setItem(SITE_TOUR_KEY, "1");
      else sst.removeItem(SITE_TOUR_KEY);
    } catch (e) {}
  }
  function siteTourIdx() {
    let fn = "";
    try {
      fn = decodeURIComponent(location.pathname.split("/").pop() || "").toLowerCase();
    } catch (e) {
      fn = (location.pathname.split("/").pop() || "").toLowerCase();
    }
    return SITE_TOUR.findIndex((p) => p.match(fn));
  }

  const canRec = !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getDisplayMedia &&
    window.MediaRecorder
  );
  let touring = false,
    tourTimer = null,
    ufoTimers = [],
    chap = -1,
    R = null,
    side = "R";
  /* Which script/timing/stops the recorder is currently using \u2014 swapped between the full
   tour and the Insta Tour by startTour(mode) before recording begins. */
  let curText = TOUR_TEXT,
    curSeconds = TOUR_SECONDS,
    curStops = TOUR_STOPS,
    curChapters = CHAPTERS,
    curIntro = INTRO_MS,
    curOutro = OUTRO_MS,
    curFileBase = "VLZO_Tour_4min",
    curLabel = "Full site tour";
  const reduced = () =>
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clearGlow = () =>
    document
      .querySelectorAll(".vg-target-glow")
      .forEach((e) => e.classList.remove("vg-target-glow"));

  /* ---- Flying UFO. Omar rides inside while it moves and steps out when it lands. ---- */
  function ufoGo(x, y) {
    const from = ufo._x == null ? -420 : ufo._x;
    ufo.style.setProperty("--tilt", (x > from ? 9 : -9) + "deg");
    ufo._x = x;
    ufo._y = y;
    ufo.style.transform = "translate(" + x + "px," + y + "px)";
  }
  function ufoVisit(stop, i, immediate) {
    const el = document.querySelector(stop.sel);
    if (!el) return;
    const hi = stop.hi ? document.querySelector(stop.hi) : stop.pin ? null : el;
    const fast = reduced() || immediate;
    ufo.classList.remove("out"); /* Omar climbs back into the saucer */
    clearGlow();
    ufoTimers.push(
      setTimeout(() => {
        if (!touring) return;
        chap = i;
        if (R) R.chapAt = performance.now();
        if (!stop.pin)
          (hi || el).scrollIntoView({
            behavior: fast ? "auto" : "smooth",
            block: "center",
          });
        $("vgufobubble").innerHTML = stop.cap;
        ufo.classList.add("show", "fly");
        ufoTimers.push(
          setTimeout(() => {
            if (!touring) return;
            /* Scroll has settled: pick a spot beside the target and fly there. */
            const r = (hi || el).getBoundingClientRect(),
              w = ufo.offsetWidth || 400,
              cx = r.left + r.width / 2,
              mid =
                (Math.max(r.top, 0) + Math.min(r.bottom, innerHeight)) / 2;
            side = stop.pin
              ? "L"
              : r.width > innerWidth * 0.6
                ? side === "R"
                  ? "L"
                  : "R"
                : cx < innerWidth / 2
                  ? "R"
                  : "L";
            ufo.dataset.side = side;
            $("vgufohand").textContent = stop.pin
              ? "\u{1F447}"
              : side === "R"
                ? "\u{1F448}"
                : "\u{1F449}";
            /* Right-side content -> Omar parks left, points right.
               Left-side content -> Zara parks right, points left, and Omar sits this one out. */
            const guideImg = $("vgufoimg");
            if (guideImg) {
              const showZara = !stop.pin && side === "R";
              const src = showZara ? ZARA_PHOTO : OMAR_PHOTO;
              if (guideImg.getAttribute("src") !== src) guideImg.src = src;
              guideImg.alt = showZara ? "Zara, your guide" : "Omar, your guide";
            }
            ufoGo(
              side === "R" ? Math.max(8, innerWidth - w - 14) : 14,
              stop.pin
                ? Math.max(84, innerHeight - 390)
                : Math.max(84, Math.min(innerHeight - 260, mid - 92)),
            );
            ufoTimers.push(
              setTimeout(() => {
                if (!touring) return;
                ufo.classList.remove("fly");
                ufo.classList.add("out"); /* beam drops, Omar steps out and points */
                if (hi) hi.classList.add("vg-target-glow");
              }, fast ? 50 : 1600),
            );
          }, fast ? 50 : 1000),
        );
      }, fast ? 0 : 750),
    );
  }
  function scheduleUfoTimeline(ms) {
    ufoTimers.forEach(clearTimeout);
    ufoTimers = [];
    /* Start each move a few seconds early so Omar is out just as the narration reaches the section. */
    curStops.forEach((stop, i) =>
      ufoTimers.push(
        setTimeout(
          () => {
            if (touring) ufoVisit(stop, i);
          },
          Math.max(0, stop.frac * ms - (reduced() ? 0 : 3300)),
        ),
      ),
    );
  }
  /* ---- Portal open/close + UFO fly-in/fly-out, used to bridge two real page loads. ---- */
  function showPortal(openNow) {
    portal.classList.add("show");
    requestAnimationFrame(() => portal.classList.toggle("open", !!openNow));
  }
  function hidePortal() {
    portal.classList.remove("open");
    setTimeout(() => portal.classList.remove("show"), reduced() ? 0 : 400);
  }
  function flyIntoPortal(cb) {
    const fast = reduced();
    const cx = innerWidth / 2 - (ufo.offsetWidth || 150) / 2,
      cy = innerHeight / 2 - 110;
    ufo.classList.remove("out");
    ufo.style.transition = fast
      ? "none"
      : "transform .9s cubic-bezier(.5,0,.8,.4), opacity .7s";
    ufo.style.transform = `translate(${cx}px,${cy}px) scale(.12)`;
    ufo.style.opacity = "0";
    setTimeout(
      () => {
        ufo.classList.remove("show", "fly");
        ufo.style.opacity = "";
        ufo.style.transition = "";
        cb && cb();
      },
      fast ? 30 : 950,
    );
  }
  function flyOutOfPortal() {
    const fast = reduced();
    const cx = innerWidth / 2 - (ufo.offsetWidth || 150) / 2,
      cy = innerHeight / 2 - 110;
    ufo.style.transition = "none";
    ufo.style.transform = `translate(${cx}px,${cy}px) scale(.12)`;
    ufo.style.opacity = "0";
    ufo.classList.add("show");
    ufo._x = cx;
    ufo._y = cy;
    void ufo.offsetWidth; // force reflow so the reset above applies before animating out
    requestAnimationFrame(() => {
      ufo.style.transition = fast
        ? "none"
        : "transform 1s cubic-bezier(.2,1.3,.4,1), opacity .5s";
      ufo.style.opacity = "1";
      const rx = Math.max(8, innerWidth - (ufo.offsetWidth || 150) - 14),
        ry = Math.max(84, innerHeight - 260);
      setTimeout(() => ufoGo(rx, ry), fast ? 0 : 60);
    });
  }
  function portalOut(next) {
    showPortal(true);
    setTimeout(
      () => {
        flyIntoPortal(() => {
          hidePortal();
          setTimeout(next, reduced() ? 0 : 250);
        });
      },
      reduced() ? 0 : 550,
    );
  }
  function portalIn(next) {
    portal.classList.add("show", "open");
    flyOutOfPortal();
    setTimeout(
      () => {
        hidePortal();
        next();
      },
      reduced() ? 100 : 1350,
    );
  }

  /* ---- Omar & Zara voices: pick a male-ish voice for Omar and a female-ish one for Zara from
   whatever's installed, so each character actually sounds like who they are. If the browser
   only offers one usable voice, a pitch shift keeps the two audibly distinct anyway. ---- */
  const FEMALE_VOICE_RE =
    /\bfemale\b|aria|jenny|ava|samantha|zira|emma|jessica|amy|joanna|salli|kimberly|susan|karen|victoria|fiona|moira|tessa|catherine|michelle|laura|sonia|hazel|libby/i;
  function qualityScore(v) {
    const n = v.name;
    let s = 0;
    if (/natural|neural|online/i.test(n)) s += 50;
    if (/google/i.test(n)) s += 30;
    if (/premium|enhanced|siri/i.test(n)) s += 25;
    if (/^en-US/i.test(v.lang)) s += 5;
    if (!v.localService) s += 3;
    return s;
  }
  function bestFemaleVoice(onlineOnly) {
    const pool = voices.filter(
      (v) => FEMALE_VOICE_RE.test(v.name) && (!onlineOnly || !v.localService),
    );
    return pool.length
      ? pool.slice().sort((a, b) => qualityScore(b) - qualityScore(a))[0]
      : null;
  }
  /* Omar keeps whatever voice the person picked in Settings, same as always. Zara gets the
   best matching female voice; while recording, both prefer an "online" voice, for the same
   tab-audio-capture reason recordingVoice() above exists. */
  function omarVoice() {
    return R ? recordingVoice() : cur();
  }
  function zaraVoice() {
    return (R && bestFemaleVoice(true)) || bestFemaleVoice(false) || omarVoice();
  }
  function voiceFor(kind) {
    return kind === "zara" ? zaraVoice() : omarVoice();
  }
  function pitchFor(kind) {
    return kind === "zara" ? 1.22 : 0.92;
  }
  /* Splits a tour's narration into chunks at the same word-count fractions used for the UFO's
   stops, so whichever chunk plays while Zara or Omar is out gets spoken in their own voice.
   Everything before the first stop \u2014 the opening "I'm Omar..." line \u2014 always stays
   Omar's. The side prediction mirrors ufoVisit's exactly, and only needs an element's
   horizontal position, which doesn't change as the page scrolls, so it's safe to work out
   up front instead of waiting for each stop's real flight animation. */
  function buildVoiceSegments(text, stops) {
    const words = text.split(/\s+/).filter(Boolean);
    const total = words.length;
    if (!stops || !stops.length) return [{ text, kind: "omar" }];
    const bounds = stops.map((s) =>
      Math.max(0, Math.min(total, Math.round(s.frac * total))),
    );
    const segs = [];
    if (bounds[0] > 0)
      segs.push({ text: words.slice(0, bounds[0]).join(" "), kind: "omar" });
    let simSide = side;
    for (let i = 0; i < stops.length; i++) {
      const st = stops[i];
      let s2 = simSide;
      if (st.pin) s2 = "L";
      else {
        const el = document.querySelector(st.sel);
        const hi = st.hi ? document.querySelector(st.hi) : el;
        if (hi || el) {
          const r = (hi || el).getBoundingClientRect();
          const cx = r.left + r.width / 2;
          s2 =
            r.width > innerWidth * 0.6
              ? simSide === "R"
                ? "L"
                : "R"
              : cx < innerWidth / 2
                ? "R"
                : "L";
        }
      }
      simSide = s2;
      const start = bounds[i],
        end = i < stops.length - 1 ? bounds[i + 1] : total;
      const chunk = words.slice(start, end).join(" ");
      if (chunk)
        segs.push({
          text: chunk,
          kind: s2 === "R" ? "zara" : "omar",
          stopIndex: i,
        });
    }
    return segs.length ? segs : [{ text, kind: "omar" }];
  }
  /* Speaks a list of {text, kind} chunks back to back, each in its matching voice. Calls onEnd
   once the last chunk finishes, or onBlocked immediately if autoplay is refused (same
   not-allowed error the single-utterance version used to watch for), so callers can retry
   exactly as before. */
  function speakSegments(segs, rate, onEnd, onBlocked, onSegStart) {
    let i = 0,
      firstStart = true;
    const goNext = () => {
      if (i >= segs.length) {
        onEnd();
        return;
      }
      const seg = segs[i++];
      const u = new SpeechSynthesisUtterance(seg.text);
      const v = voiceFor(seg.kind);
      if (v) {
        u.voice = v;
        u.lang = v.lang;
      } else u.lang = "en-US";
      u.rate = rate;
      u.pitch = pitchFor(seg.kind);
      u.onstart = () => {
        if (firstStart) {
          firstStart = false;
          started = true;
          orb.classList.add("talk");
        }
        if (onSegStart) onSegStart(seg);
      };
      u.onend = goNext;
      u.onerror = (e) => {
        if (e && e.error === "not-allowed" && onBlocked) {
          onBlocked();
          return;
        }
        goNext();
      };
      ss.speak(u);
    };
    goNext();
  }

  /* ---- Whole-site portal tour driver: narrates the current page (reusing the same UFO-visit
     machinery as the single-page tour), then opens a portal and loads the next real page. ---- */
  function narrateSitePage(entry, onDone) {
    if (!ss) {
      onDone();
      return;
    }
    touring = true;
    armed = true;
    blocked = false;
    chap = -1;
    avWrap.classList.add("show");
    curStops = entry.stops || [];
    const rate = Math.max(0.7, Math.min(1.3, +cfg.rate || 1));
    const segs = buildVoiceSegments(entry.text, curStops);
    showCaptions(entry.text, rate);
    ufoTimers.forEach(clearTimeout);
    ufoTimers = [];
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      orb.classList.remove("talk");
      endCaptions();
      clearGlow();
      ufoTimers.forEach(clearTimeout);
      ufoTimers = [];
      touring = false;
      onDone();
    };
    ss.cancel();
    setTimeout(
      () =>
        speakSegments(
          segs,
          rate,
          finish,
          () => {
            /* Autoplay speech can be blocked right after a fresh page load until the person
               interacts once; wait for that one tap/click/key, then try this same page again. */
            if (!siteTourActive()) {
              finish();
              return;
            }
            lab.textContent = "Tap anywhere to continue the tour";
            const retry = () => {
              document.removeEventListener("pointerdown", retry, true);
              document.removeEventListener("keydown", retry, true);
              narrateSitePage(entry, onDone);
            };
            document.addEventListener("pointerdown", retry, true);
            document.addEventListener("keydown", retry, true);
          },
          (seg) => {
            if (touring && seg.stopIndex >= 0)
              ufoVisit(curStops[seg.stopIndex], seg.stopIndex, true);
          },
        ),
      50,
    );
  }
  function goSiteTourStep() {
    const idx = siteTourIdx();
    if (idx < 0) {
      setSiteTourActive(false);
      return;
    }
    const entry = SITE_TOUR[idx];
    portalIn(() => {
      narrateSitePage(entry, () => {
        const next = SITE_TOUR[idx + 1];
        if (next) {
          portalOut(() => {
            location.href = next.file;
          });
        } else {
          setSiteTourActive(false);
          speak(
            "That's the full tour of the site. Thanks for flying with me!",
            true,
          );
        }
      });
    });
  }
  function stopSiteTour() {
    setSiteTourActive(false);
    ufoTimers.forEach(clearTimeout);
    ufoTimers = [];
    touring = false;
    clearGlow();
    hidePortal();
    ufo.classList.remove("show", "fly", "out");
  }
  function startSiteTour() {
    if (!ss) return;
    setSiteTourActive(true);
    const p = $("vgp");
    if (p) p.classList.remove("s");
    $("vgg") && $("vgg").setAttribute("aria-expanded", "false");
    on = true;
    saveOn();
    armed = true;
    blocked = false;
    ui();
    goSiteTourStep();
  }

  function endTour() {
    if (!touring) return;
    touring = false;
    clearTimeout(tourTimer);
    tourTimer = null;
    ufoTimers.forEach(clearTimeout);
    ufoTimers = [];
    orb.classList.remove("talk");
    endCaptions();
    clearGlow();
    ufo.classList.remove("out"); /* Omar goes in, then the saucer leaves */
    setTimeout(
      () => {
        if (touring) return;
        ufo.classList.add("fly");
        ufoGo(innerWidth + 60, ufo._y == null ? 110 : ufo._y);
      },
      reduced() ? 0 : 700,
    );
    setTimeout(
      () => {
        if (touring) return;
        ufo.classList.remove("show", "fly");
        ufo.style.transition = "none";
        ufo.style.transform = "translate(-420px,110px)";
        ufo._x = -420;
        void ufo.offsetWidth;
        ufo.style.transition = "";
      },
      reduced() ? 50 : 2500,
    );
    ui();
    setTimeout(() => {
      if (!touring) window.scrollTo({ top: 0, behavior: "smooth" });
    }, 900);
    if (R) {
      R.started ? R.outro() : R.abort();
      R = null;
    }
  }
  async function startTour(mode) {
    if (!ss || touring) return;
    const teaser = mode === "teaser";
    curText = teaser ? TEASER_TEXT : TOUR_TEXT;
    curSeconds = teaser ? TEASER_SECONDS : TOUR_SECONDS;
    curStops = teaser ? TEASER_STOPS : TOUR_STOPS;
    curChapters = teaser ? TEASER_CHAPTERS : CHAPTERS;
    curIntro = teaser ? TEASER_INTRO_MS : INTRO_MS;
    curOutro = teaser ? TEASER_OUTRO_MS : OUTRO_MS;
    curFileBase = teaser ? "VLZO_Tour_Insta" : "VLZO_Tour_Full";
    curLabel = teaser ? "Insta Tour" : "Full site tour";
    $("vgp").classList.remove("s");
    $("vgg").setAttribute("aria-expanded", "false");
    clearTimeout(timer);
    ss.cancel();
    endCaptions();
    /* Ask to record the screen. If the person says no (or the browser can't), the tour still plays. */
    if (canRec && document.querySelector("#simulator")) {
      try {
        R = await beginRecording();
      } catch (e) {
        R = null;
        lab.textContent =
          e && e.name === "NotAllowedError"
            ? "Recording not allowed. Playing the tour without it."
            : "Recording isn't available here. Playing the tour without it.";
      }
    }
    touring = true;
    armed = true;
    blocked = false;
    chap = -1;
    avWrap.classList.add("show");
    const begin = () => {
      if (!touring) return;
      if (R) {
        R.started = true;
        lab.textContent = R.noAudio
          ? "Recording (no narration audio)\u2026"
          : teaser
            ? "Recording the tour\u2026"
            : "Recording \u2014 click the orb or press Esc to stop\u2026";
      }
      const words = curText.split(/\s+/).filter(Boolean);
      /* Insta Tour is a fixed-length highlight reel, so its rate is tuned to land near
       TEASER_SECONDS. The full tour has no fixed length \u2014 it's unlimited until the
       person stops it \u2014 so it just speaks at the chosen rate; curSeconds below becomes
       an estimate (from that rate) used only to pace the UFO stops and progress bar. */
      let rate;
      if (teaser) {
        const targetWpm = 150;
        const timingRate = Math.max(0.78, Math.min(1.15, words.length / (curSeconds / 60) / targetWpm));
        rate = Math.max(0.7, Math.min(1.3, timingRate * (+cfg.rate || 1)));
      } else {
        rate = Math.max(0.7, Math.min(1.3, +cfg.rate || 1));
        const estWpm = 150 * rate;
        curSeconds = Math.max(30, (words.length / estWpm) * 60);
      }
      const ov = omarVoice();
      if (R && ov && ov.localService)
        lab.textContent = "Recording (this voice may not capture \u2014 try an \u201Conline\u201D one)\u2026";
      showCaptions(curText, rate);
      ufoTimers.forEach(clearTimeout);
      ufoTimers = [];
      speakSegments(
        buildVoiceSegments(curText, curStops),
        rate,
        endTour,
        endTour,
        (seg) => {
          if (touring && seg.stopIndex >= 0)
            ufoVisit(curStops[seg.stopIndex], seg.stopIndex, true);
        },
      );
      clearTimeout(tourTimer);
      /* The teaser is a fixed ~25s highlight reel, so it's still force-ended at its target
       length in case speech synthesis runs long. The full tour is unlimited: it ends only
       when the narration naturally finishes (u.onend above) or the person stops it
       (clicking the orb or pressing Esc, handled elsewhere), never on a timer. */
      if (teaser) tourTimer = setTimeout(endTour, curSeconds * 1000);
    };
    if (R) {
      window.scrollTo(0, 0);
      lab.textContent = "Recording starts\u2026";
      setTimeout(begin, curIntro);
    } else begin();
  }

  /* ---- Screen recording + automatic presentation styling ----
     The shared screen is redrawn onto a canvas with a title card, a framed video, chapter labels,
     subtitles and a progress bar, then an end card with the About info. That canvas is what gets
     recorded, so the finished video is already styled.

     Audio is the fragile part, and it comes in two flavors:
     - "Online"/remote voices (Google, etc.) play their audio through the tab's own render
       pipeline, so sharing just "Chrome Tab" with "Share tab audio" reliably captures them.
     - "Local"/offline system voices are handed off to the OS's own TTS engine and never touch
       the tab's audio pipeline at all \u2014 tab-audio capture is always silent for these, even
       though a (silent) audio track still gets returned. The only way to catch that audio is
       to capture the whole computer's system audio instead.
     So beginRecording() picks its strategy based on whether an online voice exists: if one does,
     it asks for the tab (clean recording, works in any Chromium browser); if not, it asks for the
     whole screen with system audio (the OS-level narration only shows up there). Either way, once
     the share dialog closes we don't just trust that an audio track exists \u2014 we sample its
     actual level for a moment after narration should have started, and only then tell the person
     the recording genuinely has sound. */
  async function requestDisplay(mode) {
    return navigator.mediaDevices.getDisplayMedia(
      mode === "system"
        ? {
            video: { frameRate: 30, displaySurface: "monitor" },
            audio: { suppressLocalAudioPlayback: false },
            systemAudio: "include",
            preferCurrentTab: false,
            selfBrowserSurface: "exclude",
            surfaceSwitching: "exclude",
          }
        : {
            video: { frameRate: 30, displaySurface: "browser" },
            audio: { suppressLocalAudioPlayback: false },
            systemAudio: "include",
            preferCurrentTab: true,
            selfBrowserSurface: "include",
            surfaceSwitching: "exclude",
          },
    );
  }
  /* Samples the shared audio track's real level ~700ms after narration should have started.
   A present-but-silent track (the local-voice case above) still passes the "has a track" check,
   so this is the only way to know the recording will actually have sound. */
  function checkAudible(track, cb) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const actx = new Ctx();
      const src = actx.createMediaStreamSource(new MediaStream([track]));
      const analyser = actx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      let peak = 0,
        n = 0;
      const iv = setInterval(() => {
        analyser.getByteTimeDomainData(data);
        for (let j = 0; j < data.length; j++)
          peak = Math.max(peak, Math.abs(data[j] - 128));
        if (++n >= 8) {
          clearInterval(iv);
          try {
            actx.close();
          } catch (e) {}
          cb(peak >= 3);
        }
      }, 90);
    } catch (e) {
      cb(true); /* can't verify in this browser \u2014 don't false-alarm */
    }
  }
  /* MP3 export: the exact same narration audio that gets muxed into the video is also tapped as
   raw PCM (via a silent Web Audio graph, so it never echoes out of the speakers) and encoded to a
   standalone MP3 with lamejs, loaded on demand from a CDN. That way "Download audio" is the same
   take as the video, not a re-recording. */
  let lamePromise = null;
  function loadLame() {
    if (window.lamejs) return Promise.resolve(window.lamejs);
    if (lamePromise) return lamePromise;
    lamePromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.0/lame.min.js";
      s.onload = () => (window.lamejs ? resolve(window.lamejs) : reject(new Error("lamejs load failed")));
      s.onerror = () => reject(new Error("lamejs load failed"));
      document.head.appendChild(s);
    });
    return lamePromise;
  }
  async function encodeMp3(chunksL, chunksR, sampleRate, stereo) {
    if (!chunksL.length) return null;
    const lame = await loadLame();
    const merge = (chunks) => {
      let len = 0;
      for (const c of chunks) len += c.length;
      const out = new Float32Array(len);
      let o = 0;
      for (const c of chunks) {
        out.set(c, o);
        o += c.length;
      }
      return out;
    };
    const toInt16 = (f32) => {
      const out = new Int16Array(f32.length);
      for (let i = 0; i < f32.length; i++) {
        const v = Math.max(-1, Math.min(1, f32[i]));
        out[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
      }
      return out;
    };
    const left = toInt16(merge(chunksL));
    const right = stereo && chunksR.length ? toInt16(merge(chunksR)) : null;
    const encoder = new lame.Mp3Encoder(right ? 2 : 1, Math.round(sampleRate), 128);
    const blockSize = 1152,
      parts = [];
    for (let i = 0; i < left.length; i += blockSize) {
      const l = left.subarray(i, i + blockSize),
        buf = right
          ? encoder.encodeBuffer(l, right.subarray(i, i + blockSize))
          : encoder.encodeBuffer(l);
      if (buf.length) parts.push(buf);
    }
    const tail = encoder.flush();
    if (tail.length) parts.push(tail);
    return new Blob(parts, { type: "audio/mpeg" });
  }
  async function beginRecording() {
    const remoteVoice = bestRemoteVoice();
    const mode = remoteVoice ? "tab" : "system";
    let disp = await requestDisplay(mode);
    let noAudio = !disp.getAudioTracks().length;
    if (noAudio) {
      disp.getTracks().forEach((t) => t.stop());
      const retry = confirm(
        mode === "system"
          ? "No audio was shared, so the recording would have no sound.\n\nThis device has no \u201Conline\u201D voice installed, so Omar's narration only plays through your computer's system audio, not this browser tab.\n\nClick OK to try again \u2014 in the next window share your Entire Screen (not a window or tab) and make sure \u201CShare system audio\u201D is turned on.\n\nClick Cancel to record picture only, with no narration audio.\n\n(System audio sharing works best in Chrome or Edge on Windows. It's limited on macOS/Linux, and Firefox and Safari can't share any audio at all.)"
          : "No audio was shared, so the recording would have no sound.\n\nClick OK to try again \u2014 in the next window choose \u201CChrome Tab,\u201D pick THIS tab, and make sure \u201CShare tab audio\u201D is turned on.\n\nClick Cancel to record picture only, with no narration audio.\n\n(Firefox and Safari can't share tab audio at all \u2014 use Chrome or Edge for a recording with sound.)",
      );
      if (retry) {
        disp = await requestDisplay(mode);
        noAudio = !disp.getAudioTracks().length;
      }
    }
    const W = 1280,
      H = 720,
      FONT = "Sora,Inter,system-ui,sans-serif",
      cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const g = cv.getContext("2d"),
      vid = document.createElement("video");
    g.textBaseline = "middle";
    vid.muted = true;
    vid.playsInline = true;
    vid.srcObject = new MediaStream(disp.getVideoTracks());
    vid.style.cssText =
      "position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none";
    document.body.appendChild(vid);
    try {
      await vid.play();
    } catch (e) {}
    const stars = Array.from({ length: 90 }, () => [
      Math.random() * W,
      Math.random() * H,
      Math.random() * 1.6 + 0.3,
      Math.random(),
    ]);
    const outS = cv.captureStream(30);
    disp.getAudioTracks().forEach((t) => outS.addTrack(t));
    /* Silent Web Audio tap: same audio track, kept out of the speakers via a zero-gain node,
     just so we can collect its raw PCM alongside the video recording for the MP3 export. */
    let pcmCtx = null,
      pcmProc = null,
      pcmSrc = null,
      pcmSilent = null,
      pcmStereo = false,
      pcmRate = 44100;
    const pcmL = [],
      pcmR = [];
    if (disp.getAudioTracks().length) {
      try {
        pcmCtx = new (window.AudioContext || window.webkitAudioContext)();
        pcmRate = pcmCtx.sampleRate;
        pcmSrc = pcmCtx.createMediaStreamSource(new MediaStream([disp.getAudioTracks()[0]]));
        pcmProc = pcmCtx.createScriptProcessor(4096, 2, 2);
        pcmSilent = pcmCtx.createGain();
        pcmSilent.gain.value = 0;
        pcmSrc.connect(pcmProc);
        pcmProc.connect(pcmSilent);
        pcmSilent.connect(pcmCtx.destination);
        pcmProc.onaudioprocess = (e) => {
          pcmStereo = pcmStereo || e.inputBuffer.numberOfChannels > 1;
          pcmL.push(e.inputBuffer.getChannelData(0).slice());
          if (e.inputBuffer.numberOfChannels > 1)
            pcmR.push(e.inputBuffer.getChannelData(1).slice());
        };
        loadLame().catch(() => {}); /* start fetching the encoder now so it's ready by the time we stop */
      } catch (e) {
        pcmCtx = null;
      }
    }
    /* Prefer MP4 (H.264/AAC) so the download is playable everywhere without conversion.
     Safari, and recent Chrome/Edge builds, can record MP4 directly; where that isn't
     supported we fall back to WebM, which every browser can record and every modern
     player (including phones) can still open. */
    const mime =
      [
        "video/mp4;codecs=avc1.640028,mp4a.40.2",
        "video/mp4;codecs=h264,aac",
        "video/mp4",
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ].find((m) => MediaRecorder.isTypeSupported(m)) || "";
    const mr = new MediaRecorder(
        outS,
        Object.assign({ videoBitsPerSecond: 2500000 }, mime ? { mimeType: mime } : {}),
      ),
      chunks = [],
      S = { started: false, done: false, discard: false, noAudio, outAt: 0, chapAt: 0, tourAt: performance.now() + curIntro };
    let iv = null;
    mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    mr.onstop = () => {
      clearInterval(iv);
      disp.getTracks().forEach((t) => t.stop());
      vid.remove();
      if (pcmProc) {
        try {
          pcmProc.disconnect();
          pcmSrc.disconnect();
          pcmSilent.disconnect();
        } catch (e) {}
      }
      S.done = true;
      if (!S.discard) {
        const videoBlob = new Blob(chunks, { type: mr.mimeType || "video/webm" });
        lab.textContent = "Preparing your video and audio\u2026";
        encodeMp3(pcmL, pcmR, pcmRate, pcmStereo)
          .catch(() => null)
          .then((mp3Blob) => showResult(videoBlob, S.noAudio, mp3Blob));
      }
      if (pcmCtx) {
        try {
          pcmCtx.close();
        } catch (e) {}
      }
    };
    S.outro = () => {
      S.outAt = performance.now();
      setTimeout(() => mr.state !== "inactive" && mr.stop(), curOutro);
    };
    S.abort = () => {
      S.discard = true;
      if (mr.state !== "inactive") mr.stop();
    };
    disp.getVideoTracks()[0].onended = () => {
      if (S.done) return;
      if (touring) endTour();
      else if (!S.outAt) S.abort();
    };

    function wrapLines(text, maxW) {
      const out = [];
      let l = "";
      text.split(/\s+/).forEach((w) => {
        const t = l ? l + " " + w : w;
        if (l && g.measureText(t).width > maxW) {
          out.push(l);
          l = w;
        } else l = t;
      });
      if (l) out.push(l);
      return out;
    }
    function rr(x, y, w, h, r) {
      g.beginPath();
      g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h);
    }
    function bg() {
      const gr = g.createLinearGradient(0, 0, W, H),
        n = performance.now() / 1000;
      gr.addColorStop(0, "#070d1c");
      gr.addColorStop(1, "#16244a");
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
      g.fillStyle = "#cfe8ff";
      stars.forEach((s) => {
        g.globalAlpha = 0.25 + 0.5 * Math.abs(Math.sin(n * s[3] * 2 + s[0]));
        g.beginPath();
        g.arc(s[0], s[1], s[2], 0, 7);
        g.fill();
      });
      g.globalAlpha = 1;
    }
    function saucer(x, y, s) {
      g.save();
      g.shadowColor = "#4fd1ff";
      g.shadowBlur = 30;
      const gr = g.createRadialGradient(x - 20 * s, y - 6 * s, 2, x, y, 60 * s);
      gr.addColorStop(0, "#bfeaff");
      gr.addColorStop(0.55, "#4fd1ff");
      gr.addColorStop(1, "#1c6fa8");
      g.fillStyle = gr;
      g.beginPath();
      g.ellipse(x, y, 60 * s, 18 * s, 0, 0, 7);
      g.fill();
      g.shadowBlur = 0;
      g.fillStyle = "rgba(255,255,255,.55)";
      g.beginPath();
      g.ellipse(x, y - 10 * s, 24 * s, 15 * s, 0, Math.PI, 2 * Math.PI);
      g.fill();
      g.restore();
    }
    function chip(text, x, y, right, a) {
      g.save();
      g.globalAlpha = a;
      g.font = "600 17px Inter,system-ui,sans-serif";
      const w = g.measureText(text).width + 24,
        bx = right ? x - w : x;
      g.fillStyle = "rgba(4,16,31,.74)";
      rr(bx, y, w, 34, 17);
      g.fill();
      g.strokeStyle = "#4fd1ff66";
      g.lineWidth = 1;
      g.stroke();
      g.fillStyle = "#eaf0ff";
      g.textAlign = "left";
      g.fillText(text, bx + 12, y + 17.5);
      g.restore();
    }
    /* Title card (before the tour) and end card with the About info (after it). */
    function card(a, outro) {
      const t = performance.now() / 1000,
        rows = [],
        add = (s, sz, wt, col, gap) => s && rows.push([s, sz, wt, col, gap == null ? 8 : gap]);
      if (outro) {
        add("Thanks for touring", 24, 500, "#4fd1ff", 6);
        add(ABOUT.name, 46, 700, "#eaf0ff", 16);
        add(ABOUT.event, 24, 500, "#a3b3d6", 4);
        add(ABOUT.lead, 24, 500, "#a3b3d6", 22);
        if (ABOUT.address) {
          add("Address", 18, 600, "#7d8fb8", 2);
          add(ABOUT.address, 26, 600, "#eaf0ff", 14);
        }
        add(ABOUT.email, 24, 500, "#4fd1ff", 6);
        add(ABOUT.website, 24, 500, "#4fd1ff", 6);
      } else {
        add(curLabel, 24, 500, "#4fd1ff", 8);
        add(ABOUT.name, 56, 700, "#eaf0ff", 14);
        add(ABOUT.event, 26, 500, "#a3b3d6", 6);
        add("Guided by " + ABOUT.lead, 24, 500, "#a3b3d6", 0);
      }
      const items = [];
      rows.forEach(([s, sz, wt, col, gap]) => {
        g.font = wt + " " + sz + "px " + FONT;
        const ls = wrapLines(s, 1040);
        ls.forEach((l, i) => items.push([l, sz, wt, col, i === ls.length - 1 ? gap : 0]));
      });
      const total = items.reduce((n, it) => n + it[1] * 1.3 + it[4], 0);
      g.save();
      g.globalAlpha = a;
      bg();
      saucer(W / 2, 110 + Math.sin(t * 2) * 6, 1);
      g.textAlign = "center";
      let y = Math.max(210, 180 + (H - 180 - total) / 2);
      items.forEach(([l, sz, wt, col, gap]) => {
        g.font = wt + " " + sz + "px " + FONT;
        g.fillStyle = col;
        g.fillText(l, W / 2, y + sz * 0.65);
        y += sz * 1.3 + gap;
      });
      g.restore();
    }
    /* The recorded screen inside a glowing frame, with brand chip, chapter label, subtitles, progress. */
    function frame(now) {
      bg();
      let x = 20, y = 20, w = W - 40, h = H - 40;
      if (vid.videoWidth && vid.readyState >= 2) {
        const sc = Math.min(w / vid.videoWidth, h / vid.videoHeight);
        w = vid.videoWidth * sc;
        h = vid.videoHeight * sc;
        x = (W - w) / 2;
        y = (H - h) / 2;
        g.save();
        g.shadowColor = "#4fd1ff88";
        g.shadowBlur = 28;
        g.fillStyle = "#000";
        rr(x, y, w, h, 16);
        g.fill();
        g.restore();
        g.save();
        rr(x, y, w, h, 16);
        g.clip();
        g.drawImage(vid, x, y, w, h);
        g.restore();
        g.strokeStyle = "#4fd1ff66";
        g.lineWidth = 2;
        rr(x, y, w, h, 16);
        g.stroke();
      }
      chip(ABOUT.name, x + 16, y + 16, false, 1);
      chip(chap < 0 ? curChapters[0] : curChapters[chap], x + w - 16, y + 16, true, Math.min(1, (now - S.chapAt) / 400));
      if (cap.classList.contains("show") && cap.textContent) {
        g.font = "600 26px Inter,system-ui,sans-serif";
        const ls = wrapLines(cap.textContent, 980),
          bh = ls.length * 34 + 20,
          by = y + h - bh - 26;
        g.fillStyle = "rgba(4,16,31,.84)";
        rr(W / 2 - 510, by, 1020, bh, 14);
        g.fill();
        g.fillStyle = "#fff";
        g.textAlign = "center";
        ls.forEach((l, i) => g.fillText(l, W / 2, by + 27 + i * 34));
      }
      const p = Math.max(0, Math.min(1, (now - S.tourAt) / (curSeconds * 1000)));
      g.fillStyle = "rgba(255,255,255,.14)";
      g.fillRect(0, H - 5, W, 5);
      g.fillStyle = "#4fd1ff";
      g.fillRect(0, H - 5, W * p, 5);
    }
    function draw() {
      const now = performance.now();
      frame(now);
      if (S.outAt) card(Math.min(1, (now - S.outAt) / 600), true);
      else if (now < S.tourAt) card(Math.min(1, (S.tourAt - now) / 500), false);
    }
    mr.start(1000);
    iv = setInterval(draw, 1000 / 30);
    if (disp.getAudioTracks().length) {
      const track = disp.getAudioTracks()[0];
      setTimeout(() => {
        if (S.done) return;
        checkAudible(track, (audible) => {
          if (!audible) {
            S.noAudio = true;
            if (touring)
              lab.textContent = "\u26A0\ufe0f Recording \u2014 no narration sound detected\u2026";
          }
        });
      }, curIntro + 1600);
    }
    return S;
  }

  /* ---- Result window: preview, download, or place the video on VLZO TV / the 4min pitch. ----
     "Place" saves the video inside this browser (IndexedDB); VLZO TV and the home page pitch read it from there. */
  const idb = () =>
    new Promise((res, rej) => {
      const q = indexedDB.open("vlzo_media", 1);
      q.onupgradeneeded = () => q.result.createObjectStore("v");
      q.onsuccess = () => res(q.result);
      q.onerror = () => rej(q.error);
    });
  const idbGet = (k) =>
    idb().then(
      (db) =>
        new Promise((res, rej) => {
          const r = db.transaction("v").objectStore("v").get(k);
          r.onsuccess = () => res(r.result);
          r.onerror = () => rej(r.error);
        }),
    );
  const idbPut = (k, val) =>
    idb().then(
      (db) =>
        new Promise((res, rej) => {
          const t = db.transaction("v", "readwrite");
          t.objectStore("v").put(val, k);
          t.oncomplete = res;
          t.onerror = t.onabort = () => rej(t.error);
        }),
    );
  function fixDur(v) {
    /* Recorded WebM has no length in its header; this makes the seek bar work. */
    v.addEventListener("loadedmetadata", () => {
      if (v.duration === Infinity) {
        v.currentTime = 1e9;
        v.addEventListener("timeupdate", function f() {
          v.removeEventListener("timeupdate", f);
          v.currentTime = 0;
        });
      }
    });
  }
  window.VLZOTour = {
    fixDur,
    async get(where) {
      try {
        const use = await idbGet("use");
        return use && use[where] ? (await idbGet("tourLong")) || null : null;
      } catch (e) {
        return null;
      }
    },
  };
  let resBlob = null,
    resUrl = "",
    resAudioUrl = "";
  const say = (s) => ($("vgresm").textContent = s);
  function closeRes() {
    const v = $("vgresv");
    v.pause();
    $("vgres").classList.remove("s");
    if (resUrl) URL.revokeObjectURL(resUrl);
    if (resAudioUrl) URL.revokeObjectURL(resAudioUrl);
    resUrl = "";
    resAudioUrl = "";
  }
  function showResult(blob, noAudio, mp3Blob) {
    resBlob = blob;
    let d = $("vgres");
    if (!d) {
      d = document.createElement("div");
      d.id = "vgres";
      d.setAttribute("role", "dialog");
      d.setAttribute("aria-modal", "true");
      d.setAttribute("aria-labelledby", "vgrest");
      d.innerHTML =
        '<div class="box"><h3 id="vgrest">Your tour video is ready</h3><video id="vgresv" controls playsinline></video><label class="h" style="display:block;margin-top:10px">Video playback speed <input id="vgplayrate" type="range" min="0.7" max="1.3" step="0.05" value="1" style="width:180px;vertical-align:middle"></label><p class="m" id="vgresm" role="status"></p><p class="h">For narration audio, always pick <b>Chrome Tab</b> \u2014 not Window or Entire Screen \u2014 and leave <b>Share tab audio</b> switched on. The captions stay embedded in the video either way, and the same narration is also offered below as a standalone MP3.</p><div class="b"><a class="pri" id="vgresd" download="VLZO_Tour_4min.webm">Download video</a><a id="vgresma" download="VLZO_Tour_4min.mp3" style="display:none">Download audio (MP3)</a><button id="vgrestv">Use on VLZO TV</button><button id="vgresp">Use as 4min pitch video</button><button id="vgresr">Remove saved video</button><button id="vgresx">Close</button></div></div>';
      document.body.appendChild(d);
      const save = async (where, ok) => {
        try {
          await idbPut("tourLong", resBlob);
          const u = (await idbGet("use").catch(() => null)) || {};
          u[where] = true;
          await idbPut("use", u);
          say(ok);
        } catch (e) {
          say("This browser could not save the video. Download it and put the file in your videos folder instead.");
        }
      };
      $("vgrestv").onclick = () =>
        save("tv", "Saved. VLZO TV now plays this video in this browser.");
      $("vgresp").onclick = () =>
        save("pitch", "Saved. The pitch on the home page now plays this video in this browser.");
      $("vgresr").onclick = () =>
        idbPut("use", {}).then(() =>
          say("Removed. Removed. VLZO TV and the pitch deck are back to their original videos."),
        );
      $("vgresx").onclick = closeRes;
      d.addEventListener("keydown", (e) => e.key === "Escape" && closeRes());
      fixDur($("vgresv"));
      $("vgplayrate").oninput = () => $("vgresv").playbackRate = +$("vgplayrate").value;
    }
    resUrl = URL.createObjectURL(blob);
    const isMp4 = /mp4/i.test(blob.type),
      ext = isMp4 ? "mp4" : "webm";
    $("vgrest").textContent = "Your " + curLabel + " is ready";
    $("vgresv").src = resUrl;
    $("vgresd").href = resUrl;
    $("vgresd").download = curFileBase + "." + ext;
    if (resAudioUrl) {
      URL.revokeObjectURL(resAudioUrl);
      resAudioUrl = "";
    }
    const ma = $("vgresma");
    if (mp3Blob) {
      resAudioUrl = URL.createObjectURL(mp3Blob);
      ma.href = resAudioUrl;
      ma.download = curFileBase + ".mp3";
      ma.style.display = "";
    } else {
      ma.removeAttribute("href");
      ma.style.display = "none";
    }
    say(
      "Video size: " + (blob.size / 1048576).toFixed(1) + " MB \u00b7 Format: " +
        ext.toUpperCase() +
        (isMp4 ? "" : " (your browser can only record WebM; it plays in any modern video app and browser, and converts to MP4 with any free video tool if you need that exact extension)") +
        (noAudio
          ? " \u00b7 \u26a0\ufe0f No narration audio was captured. Record again, keep audio sharing turned on the whole time, and make sure an \u201Conline\u201D voice is selected in settings if one is available on this device."
          : mp3Blob
            ? " \u00b7 \u{1F3A4} Omar's voice recorded: MP3, " + (mp3Blob.size / 1048576).toFixed(1) + " MB"
            : " \u00b7 \u26a0\ufe0f Narration audio was captured, but the MP3 couldn't be encoded (the encoder script may be blocked or you're offline). The video's own audio track still has the voice \u2014 try downloading again once you're online."),
    );
    d.classList.add("s");
    $("vgresd").focus();
  }
  function saveOn() {
    try {
      st && st.setItem(KEY, on ? "on" : "off");
    } catch (e) {}
  }
  function saveCfg() {
    try {
      st && st.setItem(CFG, JSON.stringify(cfg));
    } catch (e) {}
  }

  /* Rank voices: natural / neural / Google / premium voices sound most like an AI assistant. */
  function score(v) {
    const n = v.name;
    let s = 0;
    if (/natural|neural|online/i.test(n)) s += 50;
    if (/google/i.test(n)) s += 30;
    if (/premium|enhanced|siri/i.test(n)) s += 25;
    if (/\bmale\b/i.test(n)) s += 45;
    if (/\bfemale\b/i.test(n)) s -= 45;
    if (
      /guy|davis|brian|ryan|christopher|eric|roger|andrew|liam|tony|alex|daniel|thomas|fred|david|mark|matthew|george|william|james|kevin|paul|steve|sean|neil|oliver|henry/i.test(
        n,
      )
    )
      s += 15;
    if (
      /aria|jenny|ava|samantha|zira|emma|jessica|amy|joanna|salli|kimberly|susan|karen|victoria|fiona|moira|tessa|catherine|michelle|laura|sonia|hazel|libby/i.test(
        n,
      )
    )
      s -= 15;
    if (/^en-US/i.test(v.lang)) s += 5;
    if (!v.localService) s += 3;
    return s;
  }
  function load() {
    if (!ss) return;
    voices = ss
      .getVoices()
      .filter((v) => /^en/i.test(v.lang))
      .sort((a, b) => score(b) - score(a));
    const s = $("vgv");
    s.innerHTML = voices
      .map(
        (v) =>
          `<option value="${v.name}">${v.name} (${v.lang})${v.localService ? "" : " \u2014 records reliably"}</option>`,
      )
      .join("");
    if (!voices.length)
      s.innerHTML = "<option>No English voices found</option>";
    if (cfg.voice && voices.some((v) => v.name === cfg.voice))
      s.value = cfg.voice;
    else if (voices[0]) s.value = voices[0].name;
  }
  function cur() {
    return voices.find((v) => v.name === $("vgv").value) || voices[0] || null;
  }
  /* Chrome's tab-audio capture only reliably picks up "online"/"remote" voices, because their
   audio actually plays through the tab's normal audio pipeline. Many "local"/offline system
   voices (the OS's built-in TTS) bypass that pipeline entirely, so a recording made with one
   can come out silent even though the share dialog looked fine. So whenever we're recording,
   we swap in the best available remote voice for the narration only \u2014 the person's chosen
   voice for everyday hover narration is left untouched. */
  function bestRemoteVoice() {
    const remote = voices.filter((v) => !v.localService);
    if (!remote.length) return null;
    return remote.slice().sort((a, b) => score(b) - score(a))[0];
  }
  function recordingVoice() {
    const chosen = cur();
    if (chosen && !chosen.localService) return chosen;
    return bestRemoteVoice() || chosen;
  }
  if (ss) {
    load();
    ss.addEventListener && ss.addEventListener("voiceschanged", load);
  }
  $("vgr").value = cfg.rate;
  $("vgv").onchange = () => {
    cfg.voice = $("vgv").value;
    saveCfg();
    speak("Hello, this is how I sound.", true);
  };
  $("vgr").onchange = () => {
    cfg.rate = +$("vgr").value;
    saveCfg();
    speak("Hello, this is how fast I speak.", true);
  };
  $("vgt2").onclick = () =>
    speak(
      "Hello! I am Omar Ibne Abdullah, the Team Leader of The Third World Peace VLZO UFO. Hover over anything and I will tell you about it.",
      true,
    );
  $("vgg").onclick = () => {
    const o = $("vgp").classList.toggle("s");
    $("vgg").setAttribute("aria-expanded", o);
  };
  $("vgtour").onclick = () => startTour("long");
  $("vginsta").onclick = () => startTour("teaser");
  $("vgsitetour").onclick = () => startSiteTour();

  function speak(t, force) {
    if (!ss || !t) return;
    if (!force && t === lastT && Date.now() - lastAt < 8000) return;
    lastT = t;
    lastAt = Date.now();
    ss.cancel();
    const u = new SpeechSynthesisUtterance(t),
      v = cur();
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    } else u.lang = "en-US";
    u.rate = +cfg.rate || 1;
    u.pitch = 1;
    u.onstart = () => {
      started = true;
      orb.classList.add("talk");
      showCaptions(t, u.rate);
    };
    u.onend = () => {
      orb.classList.remove("talk");
      endCaptions();
    };
    u.onerror = (e) => {
      orb.classList.remove("talk");
      endCaptions();
      if (e && e.error === "not-allowed") {
        armed = false;
        blocked = true;
        ui();
      }
    };
    setTimeout(() => ss.speak(u), 40);
  }

  const SEL =
    "[data-say],a,button,h1,h2,h3,h4,summary,label,img[alt],input,select,textarea,li,td,th,p,[aria-label],[title]";
  function textOf(el) {
    const d = el.closest("[data-say]");
    if (d) return d.dataset.say;
    if (el.tagName === "A") {
      const h = el.getAttribute("href") || "";
      for (const [k, v] of KNOWN) if (h.includes(k)) return v;
    }
    let t =
      el.getAttribute("aria-label") ||
      (el.tagName === "IMG" ? el.alt : "") ||
      (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)
        ? el.placeholder || "Input field"
        : "") ||
      el.innerText ||
      el.title ||
      "";
    t = t
      .replace(/[\u{1F000}-\u{1FAFF}\u2600-\u27BF\uFE0F]/gu, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!t) return "";
    if (t.length > 170) {
      const c = t.slice(0, 170),
        i = Math.max(c.lastIndexOf(". "), c.lastIndexOf("? "));
      t = i > 60 ? c.slice(0, i + 1) : c.replace(/\s\S*$/, "");
    }
    if (el.tagName === "A") t += ", link";
    else if (el.tagName === "BUTTON") t += ", button";
    return t;
  }
  function target(e) {
    const el = e.target && e.target.closest ? e.target.closest(SEL) : null;
    return el && !el.closest("#vg") ? el : null;
  }

  document.addEventListener(
    "mouseover",
    (e) => {
      if (!on || !armed || touring) return;
      const el = target(e);
      if (!el) return;
      const a = document.activeElement;
      if (
        a &&
        /^(INPUT|TEXTAREA)$/.test(a.tagName) &&
        a.type !== "checkbox" &&
        a.type !== "radio"
      )
        return;
      clearTimeout(timer);
      timer = setTimeout(() => speak(textOf(el)), 380);
    },
    true,
  );
  document.addEventListener("mouseout", () => clearTimeout(timer), true);
  document.addEventListener("focusin", (e) => {
    if (!on || !armed || touring) return;
    const el = target(e);
    if (el) speak(textOf(el));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && ss) {
      ss.cancel();
      orb.classList.remove("talk");
      endCaptions();
      if (siteTourActive()) stopSiteTour();
      else if (touring) endTour();
    }
  });

  /* Browsers only allow speech after you interact with the page once. */
  function wake(e) {
    if (!on || armed || siteTourActive()) return;
    if (e.target.closest && e.target.closest("#vg")) return;
    armed = true;
    blocked = false;
    ui();
    speak(WELCOME, true);
  }
  ["pointerdown", "keydown", "touchstart"].forEach((ev) =>
    document.addEventListener(ev, wake, true),
  );

  orb.onclick = () => {
    on = !on;
    saveOn();
    ui();
    if (siteTourActive()) stopSiteTour();
    if (touring) endTour();
    if (on) {
      armed = true;
      speak(WELCOME, true);
    } else {
      if (ss) ss.cancel();
      orb.classList.remove("talk");
      endCaptions();
    }
  };
  /* When you select something, the guide tells you what it is. */
  const sel = () =>
    (window.getSelection ? getSelection().toString() : "")
      .replace(/\s+/g, " ")
      .trim();
  document.addEventListener("mouseup", (e) => {
    if (
      !on ||
      !armed ||
      touring ||
      (e.target.closest && e.target.closest("#vg"))
    )
      return;
    setTimeout(() => {
      const t = sel();
      if (t.length > 1)
        speak(
          "You selected: " +
            (t.length > 200 ? t.slice(0, 200).replace(/\s\S*$/, "") : t),
          true,
        );
    }, 20);
  });
  document.addEventListener(
    "click",
    (e) => {
      if (!on || !armed || touring || sel()) return;
      const el = target(e);
      if (!el || el.tagName === "A") return;
      const t = textOf(el);
      if (t) speak("You selected: " + t.replace(/, (button|link)$/, ""), true);
    },
    true,
  );

  /* Welcome as soon as the page opens. If the browser blocks it, the first click will trigger it.
     If a whole-site portal tour is mid-flight, this page continues it instead of the normal
     welcome — the portal opens, the UFO flies out, and Omar narrates this page. */
  if (siteTourActive()) {
    on = true;
    saveOn();
    setTimeout(goSiteTourStep, 500);
  } else if (on)
    setTimeout(() => {
      armed = true;
      started = false;
      speak(WELCOME, true);
      setTimeout(() => {
        if (!started && on) {
          armed = false;
          blocked = true;
          ui();
        }
      }, 2500);
    }, 700);

  ui();
})();