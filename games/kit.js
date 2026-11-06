// HypeArena game kit: shared setup screen, TikTok LIVE connection, demo mode, feed, banners,
// confetti, avatars, music and sound effects. Every game page loads this file and calls Kit.start({...}).
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const store = {
    get(k, d) { try { const v = localStorage.getItem('ha.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('ha.' + k, JSON.stringify(v)); } catch {} },
  };

  // ---------------- styles ----------------
  const css = `
  :root{--ha-pink:#ff2e7e;--ha-org:#ff8a3d;--ha-amb:#ffb547;--ha-ink:#fbf7f4;--ha-mut:#b3aab8;--ha-bg:#0b0910}
  html,body{margin:0;height:100%;background:var(--ha-bg);color:var(--ha-ink);overflow:hidden;font-family:Inter,-apple-system,system-ui,sans-serif;-webkit-user-select:none;user-select:none;touch-action:manipulation}
  .ha-disp{font-family:Teko,Impact,"Arial Black",sans-serif;font-weight:700;letter-spacing:.02em;line-height:.95}
  #ha-setup{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:16px;background:radial-gradient(120% 70% at 50% 0%,rgba(255,46,126,.22),transparent 60%),rgba(11,9,16,.96);overflow:auto}
  #ha-setup.hide{display:none}
  .ha-card{width:100%;max-width:420px;background:#15111c;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:22px 20px;box-shadow:0 30px 80px rgba(0,0,0,.6)}
  .ha-card .logo{font:900 13px Inter,sans-serif;letter-spacing:.16em;color:var(--ha-org);text-transform:uppercase}
  .ha-card h1{font-family:Teko,Impact,sans-serif;font-size:54px;margin:2px 0 0;line-height:.9;background:linear-gradient(90deg,var(--ha-pink),var(--ha-amb));-webkit-background-clip:text;background-clip:text;color:transparent}
  .ha-card p{color:var(--ha-mut);font-size:14px;line-height:1.45;margin:8px 0 12px}
  .ha-card ul{margin:0 0 6px;padding-left:18px;color:#e9e3ea;font-size:14px;line-height:1.6}
  .ha-card label{display:block;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--ha-mut);margin:14px 0 6px}
  .ha-card input[type=text],.ha-card select{width:100%;box-sizing:border-box;background:#0b0910;color:#fff;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px;font-size:16px;font-family:inherit;outline:none}
  .ha-chk{display:flex!important;align-items:center;gap:10px;text-transform:none!important;letter-spacing:0!important;font-size:14px!important;color:#fff!important;font-weight:600!important}
  .ha-chk input{width:20px;height:20px;accent-color:var(--ha-pink)}
  .ha-btns{display:flex;gap:10px;margin-top:18px}
  .ha-btns button{flex:1;border:0;border-radius:12px;padding:14px;font-size:16px;font-weight:800;font-family:inherit;cursor:pointer}
  #ha-go{background:linear-gradient(90deg,var(--ha-pink),var(--ha-org));color:#fff}
  #ha-demo{background:#241c2c;color:#fff}
  #ha-status{margin-top:12px;font-size:13px;color:var(--ha-mut);min-height:18px}
  #ha-menu{position:fixed;right:10px;bottom:10px;z-index:40;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.08);color:#fff;border:0;font-size:16px;opacity:.35}
  #ha-feed{position:fixed;left:10px;top:16%;z-index:20;display:flex;flex-direction:column;gap:6px;pointer-events:none;width:min(62vw,280px)}
  .ha-toast{display:flex;align-items:center;gap:8px;padding:5px 12px 5px 5px;border-radius:999px;background:rgba(11,9,16,.82);border:1.5px solid var(--c,#ff2e7e);box-shadow:0 6px 20px rgba(0,0,0,.4);animation:ha-in .35s cubic-bezier(.2,1.4,.4,1);transition:opacity .5s,transform .5s}
  .ha-toast.out{opacity:0;transform:translateX(-30px)}
  .ha-toast .av{width:32px;height:32px;border-radius:50%;flex:none;background:#2a2230 center/cover;border:2px solid var(--c,#ff2e7e);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px}
  .ha-toast .t{font-size:12px;line-height:1.2;min-width:0}
  .ha-toast .t b{display:block;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ha-toast .t span{color:var(--c,#ff2e7e);font-weight:700}
  .ha-toast .gift{width:26px;height:26px;margin-left:auto;flex:none}
  @keyframes ha-in{0%{transform:translateX(-40px) scale(.8);opacity:0}100%{transform:none;opacity:1}}
  #ha-banner{position:fixed;left:50%;top:42%;z-index:30;transform:translate(-50%,-50%);text-align:center;pointer-events:none;width:94vw}
  #ha-banner .b{font-family:Teko,Impact,sans-serif;font-weight:700;font-size:min(15vw,96px);line-height:.9;color:#fff;text-shadow:0 0 30px var(--c,#ff2e7e),0 6px 0 rgba(0,0,0,.4);animation:ha-pop .6s cubic-bezier(.2,1.6,.4,1)}
  #ha-banner .s{font-weight:800;font-size:min(4.6vw,22px);margin-top:6px;color:var(--c,#ffb547);text-shadow:0 2px 10px #000}
  @keyframes ha-pop{0%{transform:scale(.3) rotate(-6deg);opacity:0}100%{transform:none;opacity:1}}
  #ha-tip{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 9%);z-index:15;transform:translateX(-50%);pointer-events:none;text-align:center;width:max-content;max-width:92vw}
  #ha-tip .c{padding:.25em .9em .2em;border-radius:.5em;background:rgba(11,9,16,.86);border:2px solid var(--c);box-shadow:0 0 22px var(--c);font-family:Teko,Impact,sans-serif;font-weight:700;line-height:.95;animation:ha-pulse 1.3s ease-in-out infinite}
  #ha-tip .q{font-size:min(5.6vw,28px);color:#fff;white-space:nowrap}#ha-tip .a{font-size:min(8vw,42px);color:var(--c);white-space:nowrap}
  #ha-tip .c.swap{animation:ha-pop .45s cubic-bezier(.2,1.5,.4,1),ha-pulse 1.3s ease-in-out .45s infinite}
  @keyframes ha-pulse{50%{transform:scale(1.04)}}
  #ha-fx{position:fixed;inset:0;z-index:25;pointer-events:none}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  if (!document.querySelector('link[href*="Teko"]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Teko:wght@500;700&family=Inter:wght@600;800&display=swap'; document.head.appendChild(l); }

  // ---------------- audio ----------------
  let AC = null, master = null, musicGain = null, musicOn = store.get('music', true), seqTimer = null;
  function audio() {
    if (AC) { if (AC.state === 'suspended') AC.resume(); return AC; }
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
    master = AC.createGain(); master.gain.value = 0.6;
    const comp = AC.createDynamicsCompressor(); master.connect(comp); comp.connect(AC.destination);
    musicGain = AC.createGain(); musicGain.gain.value = musicOn ? 0.28 : 0; musicGain.connect(master);
    startMusic(); return AC;
  }
  ['pointerdown', 'touchend', 'keydown'].forEach(ev => window.addEventListener(ev, () => audio(), { passive: true }));
  function tone(f0, f1, dur, type = 'sine', vol = 0.2, delay = 0, dest) {
    if (!AC) return; const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, f, vol = 0.15, delay = 0, q = 1, dest) {
    if (!AC) return; const t = AC.currentTime + delay;
    const b = AC.createBuffer(1, Math.max(1, AC.sampleRate * dur), AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = AC.createBufferSource(); s.buffer = b; const fl = AC.createBiquadFilter(); fl.type = 'bandpass'; fl.Q.value = q; fl.frequency.setValueAtTime(f, t);
    const g = AC.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(fl); fl.connect(g); g.connect(dest || master); s.start(t);
  }
  const sfx = {
    pop: () => { tone(420, 1100, 0.12, 'triangle', 0.2); },
    tick: () => tone(1700, 1200, 0.05, 'square', 0.05),
    coin: () => { tone(988, null, 0.08, 'square', 0.09); tone(1319, null, 0.3, 'square', 0.09, 0.07); },
    whoosh: () => noise(0.35, 500, 0.18, 0, 0.8),
    boom: () => { tone(140, 40, 0.5, 'sine', 0.5); noise(0.4, 200, 0.3); },
    hit: () => { tone(220, 60, 0.15, 'square', 0.25); noise(0.12, 1200, 0.2); },
    win: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, null, 0.35, 'triangle', 0.14, i * 0.09)); noise(0.9, 900, 0.12, 0.1); },
    wrong: () => { tone(300, 150, 0.3, 'sawtooth', 0.12); },
    cheer: () => { noise(1.2, 1100, 0.12, 0, 0.5); noise(1.2, 2200, 0.06, 0.05, 0.6); },
    gift: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, null, 0.2, 'triangle', 0.12, i * 0.06)); },
    drum: () => { tone(160, 50, 0.25, 'sine', 0.4); },
  };
  // light 4-chord loop: kick, hats, bass and plucks
  function startMusic() {
    if (!AC || seqTimer) return;
    const bpm = 120, step = 60 / bpm / 4; let n = 0, next = AC.currentTime + 0.1;
    const roots = [45, 41, 48, 43], chords = [[0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7]];
    const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
    seqTimer = setInterval(() => {
      while (next < AC.currentTime + 0.2) {
        const s = n % 16, bar = Math.floor(n / 16) % 4, r = roots[bar], t = next - AC.currentTime;
        if (s % 4 === 0) tone(150, 45, 0.22, 'sine', 0.55, t, musicGain);
        if (s % 2 === 1) noise(0.04, 8000, 0.05, t, 0.7, musicGain);
        if (s === 0 || s === 6 || s === 10) tone(mf(r - 12), null, 0.25, 'sawtooth', 0.1, t, musicGain);
        if (s % 4 === 2) chords[bar].forEach(iv => tone(mf(r + 12 + iv), null, 0.18, 'triangle', 0.045, t, musicGain));
        next += step; n++;
      }
    }, 50);
  }
  function setMusic(on) { musicOn = on; store.set('music', on); if (musicGain) musicGain.gain.value = on ? 0.28 : 0; }

  // ---------------- avatars ----------------
  const IMG = new Map();
  function img(url) {
    if (!url) return null; let a = IMG.get(url);
    if (!a) { a = { img: new Image(), ok: false }; a.img.decoding = 'async'; a.img.onload = () => { a.ok = true; }; a.img.src = /^https?:/.test(url) ? '/img?u=' + encodeURIComponent(url) : url; IMG.set(url, a); if (IMG.size > 300) IMG.delete(IMG.keys().next().value); }
    return a;
  }
  const initial = (u) => String((u && u.nick) || '?').replace(/^@/, '').charAt(0).toUpperCase();
  const COLORS = ['#ff2e7e', '#ff8a3d', '#ffb547', '#3dd6ff', '#9b7bff', '#5be38f', '#ff5a6a', '#f7f7f7'];
  const colorOf = (u) => { let h = 0; const s = String((u && u.uid) || ''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return COLORS[Math.abs(h) % COLORS.length]; };
  function drawAvatar(ctx, x, y, r, u, ring) {
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r + Math.max(1.5, r * 0.12), 0, Math.PI * 2); ctx.fillStyle = ring || colorOf(u); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    const a = u && img(u.pic);
    if (a && a.ok) ctx.drawImage(a.img, x - r, y - r, r * 2, r * 2);
    else { ctx.fillStyle = '#241c2c'; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(r * 1.05)}px Inter,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(initial(u), x, y + r * 0.06); }
    ctx.restore();
  }

  // ---------------- overlay: feed / banner / tips / confetti ----------------
  let feedEl, bannerEl, tipEl, fx, fxx;
  function overlays() {
    feedEl = document.createElement('div'); feedEl.id = 'ha-feed'; document.body.appendChild(feedEl);
    bannerEl = document.createElement('div'); bannerEl.id = 'ha-banner'; document.body.appendChild(bannerEl);
    tipEl = document.createElement('div'); tipEl.id = 'ha-tip'; tipEl.innerHTML = '<div class="c"><div class="q"></div><div class="a"></div></div>'; tipEl.style.display = 'none'; document.body.appendChild(tipEl);
    fx = document.createElement('canvas'); fx.id = 'ha-fx'; document.body.appendChild(fx); fxx = fx.getContext('2d');
  }
  function toast(u, text, color, giftPic) {
    if (!feedEl) return; const el = document.createElement('div'); el.className = 'ha-toast'; el.style.setProperty('--c', color || '#ff2e7e');
    const a = u && u.pic ? img(u.pic) : null;
    el.innerHTML = `<div class="av" style="${a ? `background-image:url('${a.img.src}')` : ''}">${a ? '' : initial(u)}</div><div class="t"><b>@${String((u && u.nick) || '').replace(/[<>&]/g, '')}</b><span></span></div>${giftPic ? `<img class="gift" src="${img(giftPic).img.src}">` : ''}`;
    el.querySelector('span').textContent = text;
    feedEl.prepend(el); while (feedEl.children.length > (Kit.feedMax || 3)) feedEl.lastChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 500); }, 5200);
  }
  let bannerT = null;
  function banner(big, small, color, ms = 2200) {
    if (!bannerEl) return; bannerEl.style.setProperty('--c', color || '#ff2e7e');
    bannerEl.innerHTML = `<div class="b"></div>${small ? '<div class="s"></div>' : ''}`; bannerEl.querySelector('.b').textContent = big; if (small) bannerEl.querySelector('.s').textContent = small;
    bannerEl.style.opacity = 1; clearTimeout(bannerT); bannerT = setTimeout(() => { bannerEl.style.transition = 'opacity .4s'; bannerEl.style.opacity = 0; setTimeout(() => { bannerEl.style.transition = ''; }, 450); }, ms);
  }
  let tips = [], tipI = -1, tipTimer = null, tipHold = 0;
  function setTips(list) { tips = list || []; tipI = -1; if (tipTimer) clearInterval(tipTimer); if (!tips.length) { tipEl.style.display = 'none'; return; } nextTip(); tipTimer = setInterval(nextTip, 3800); }
  function nextTip() {
    if (!tips.length || Date.now() < tipHold) return; tipI = (tipI + 1) % tips.length; const [q, a, c] = tips[tipI];
    const card = tipEl.firstChild; card.style.setProperty('--c', c || '#ff2e7e'); card.children[0].textContent = q; card.children[1].textContent = a;
    card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap'); tipEl.style.display = 'block';
  }
  function showTip(q, a, c, ms = 4000) { tipHold = Date.now() + ms; const card = tipEl.firstChild; card.style.setProperty('--c', c || '#ff2e7e'); card.children[0].textContent = q; card.children[1].textContent = a; card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap'); tipEl.style.display = 'block'; }
  function hideTips(h) { tipEl.style.visibility = h ? 'hidden' : 'visible'; }
  let P = [];
  function confetti(x, y, n = 120, power = 1) {
    const C = ['#ff2e7e', '#ff8a3d', '#ffb547', '#ffffff', '#3dd6ff', '#5be38f'];
    for (let i = 0; i < n; i++) P.push({ x, y, vx: rand(-9, 9) * power, vy: rand(-15, -4) * power, r: rand(0, 6), w: rand(-0.3, 0.3), s: rand(5, 10), c: pick(C), l: rand(80, 140) });
  }
  function fxLoop() {
    requestAnimationFrame(fxLoop); if (!fx) return;
    const d = Math.min(2, window.devicePixelRatio || 1); if (fx.width !== innerWidth * d) { fx.width = innerWidth * d; fx.height = innerHeight * d; }
    fxx.setTransform(d, 0, 0, d, 0, 0); fxx.clearRect(0, 0, innerWidth, innerHeight);
    P = P.filter(p => p.l-- > 0);
    for (const p of P) { p.vy += 0.42; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.w; fxx.save(); fxx.translate(p.x, p.y); fxx.rotate(p.r); fxx.globalAlpha = Math.min(1, p.l / 30); fxx.fillStyle = p.c; fxx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); fxx.restore(); }
  }

  // ---------------- events ----------------
  function norm(e) {
    const u = { uid: e.uid || e.nick || '?', nick: e.nick || e.uid || '?', pic: e.pic || '' };
    if (e.type === 'gift') { const count = Math.max(1, e.count | 0), coins = Math.max(1, e.diamonds | 0); return { type: 'gift', u, gift: { name: e.giftName || 'Gift', coins, count, total: coins * count, pic: e.giftPic || '' } }; }
    if (e.type === 'like') return { type: 'like', u, count: Math.max(1, e.count | 0) };
    if (e.type === 'chat') return { type: 'chat', u, text: String(e.comment || '') };
    return { type: e.type, u };
  }
  // ---------------- demo ----------------
  const DEMO_NICKS = ['ana_luz', 'pedrinho77', 'mari.gamer', 'texas_tom', 'katy_fan', 'luis.mx', 'sofia.xo', 'TheRealMike', 'bia_rosa', 'davi99', 'jenny.k', 'marcus_tx', 'yuki.jp', 'amara_ng', 'rafa_co', 'lil.jay', 'bri_nyc', 'coach_dan'];
  const DEMO_GIFTS = [['Rose', 1], ['Rose', 1], ['Rose', 1], ['TikTok', 1], ['Finger Heart', 5], ['Doughnut', 30], ['Perfume', 20], ['Hand Hearts', 100]];
  function demoUser() { const n = pick(DEMO_NICKS); return { uid: 'demo_' + n, nick: n, pic: '' }; }

  // ---------------- canvas + loop helpers ----------------
  function canvas() {
    const cv = document.createElement('canvas'); cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;height:100dvh;display:block'; document.body.prepend(cv);
    const S = { cv, ctx: cv.getContext('2d'), W: 390, H: 760, u: 1, dpr: 1 };
    function rs() { S.W = innerWidth; S.H = innerHeight; S.dpr = Math.min(2, window.devicePixelRatio || 1); S.u = Math.min(S.W / 390, S.H / 760); cv.width = Math.round(S.W * S.dpr); cv.height = Math.round(S.H * S.dpr); S.ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0); S.onResize && S.onResize(); }
    addEventListener('resize', rs); rs(); return S;
  }
  function loop(fn) { let last = performance.now(); (function f() { requestAnimationFrame(f); const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; fn(dt, now / 1000); })(); }
  function text(ctx, s, x, y, size, color, align = 'center', font = 'teko', maxW) {
    ctx.font = font === 'teko' ? `700 ${size}px Teko, Impact, sans-serif` : font === 'emoji' ? `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif` : `800 ${size}px Inter, system-ui, sans-serif`;
    ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
    if (maxW) { const w = ctx.measureText(s).width; if (w > maxW) { ctx.save(); ctx.translate(x, y); ctx.scale(maxW / w, 1); ctx.fillText(s, 0, 0); ctx.restore(); return; } }
    ctx.fillText(s, x, y);
  }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function board(ctx, S, rows, x, y, w, title, color) {
    // leaderboard panel: rows = [{u, v, sub}]
    const u = S.u, h = 26 * u; rrect(ctx, x, y, w, 26 * u + rows.length * h + 6 * u, 12 * u); ctx.fillStyle = 'rgba(11,9,16,.72)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1; ctx.stroke();
    text(ctx, title, x + w / 2, y + 14 * u, 17 * u, color || '#ffb547');
    rows.forEach((r, i) => { const yy = y + 26 * u + i * h + h / 2; text(ctx, String(i + 1), x + 12 * u, yy + 1, 15 * u, i === 0 ? '#ffb547' : '#fff'); drawAvatar(ctx, x + 32 * u, yy, 9 * u, r.u); text(ctx, '@' + String(r.u.nick).slice(0, 14), x + 46 * u, yy, 11 * u, '#fff', 'left', 'inter', w - 92 * u); text(ctx, String(r.v), x + w - 8 * u, yy + 1, 16 * u, '#ffb547', 'right'); });
  }

  // ---------------- public API ----------------
  const Kit = window.Kit = { canvas, loop, text, rrect, board, rand, pick, store, sfx, img, drawAvatar, colorOf, toast, banner, setTips, showTip, hideTips, confetti, demoUser, setMusic, live: false, demo: false, user: '' };
  Kit.start = function (o) {
    overlays(); requestAnimationFrame(fxLoop);
    if (o.feedTop != null) feedEl.style.top = (o.feedTop * 100) + '%';
    if (o.feedMax) Kit.feedMax = o.feedMax;
    if (o.tipBottom != null) tipEl.style.bottom = (o.tipBottom * 100) + '%';
    const setup = document.createElement('div'); setup.id = 'ha-setup';
    setup.innerHTML = `<div class="ha-card"><div class="logo">⚡ HypeArena</div><h1>${o.title}</h1><p>${o.desc || ''}</p>${o.rules ? '<ul>' + o.rules.map(r => `<li>${r}</li>`).join('') + '</ul>' : ''}
      <label for="ha-user">Your TikTok @</label><input id="ha-user" type="text" placeholder="yourusername" autocapitalize="off" autocorrect="off" spellcheck="false">
      ${o.options || ''}
      <label class="ha-chk"><input id="ha-music" type="checkbox"> Music and sound effects</label>
      <div class="ha-btns"><button id="ha-go">Start live</button><button id="ha-demo">Demo</button></div><div id="ha-status"></div></div>`;
    document.body.appendChild(setup);
    const menu = document.createElement('button'); menu.id = 'ha-menu'; menu.textContent = '⚙︎'; menu.onclick = () => setup.classList.remove('hide'); document.body.appendChild(menu);
    $('#ha-user').value = store.get('user', ''); $('#ha-music').checked = musicOn;
    $('#ha-music').onchange = (e) => setMusic(e.target.checked);
    const status = (m, c) => { $('#ha-status').textContent = m; $('#ha-status').style.color = c || '#b3aab8'; };
    let ws = null, retry = 0, demoT = null;
    function connect() {
      try { if (ws) { ws.onclose = null; ws.close(); } } catch {}
      const url = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws?user=' + encodeURIComponent(Kit.user);
      try { ws = new WebSocket(url); } catch { status('Could not reach the server.', '#ff6b6b'); return; }
      ws.onopen = () => { retry = 0; };
      ws.onmessage = (m) => { let e; try { e = JSON.parse(m.data); } catch { return; } if (e.type === 'status') { status(e.msg, e.state === 'connected' ? '#5be38f' : '#ffb547'); return; } o.onEvent && o.onEvent(norm(e)); };
      ws.onclose = () => setTimeout(connect, Math.min(15000, 1000 * Math.pow(2, retry++)));
    }
    function begin(demo) {
      Kit.user = $('#ha-user').value.trim().replace(/^@/, ''); store.set('user', Kit.user);
      if (!demo && !Kit.user) { status('Type your TikTok @ first.', '#ff6b6b'); return; }
      audio(); setup.classList.add('hide'); Kit.demo = demo; Kit.live = !demo;
      o.onOptions && o.onOptions(setup);
      if (demoT) { clearInterval(demoT); demoT = null; }
      if (demo) demoT = setInterval(() => { const e = o.demo ? o.demo() : null; if (e) o.onEvent(e); }, o.demoEvery || 700);
      else connect();
      if (!Kit.started) { Kit.started = true; o.onStart && o.onStart(); }
    }
    $('#ha-go').onclick = () => begin(false); $('#ha-demo').onclick = () => begin(true);
    if (o.tips) setTips(o.tips);
    // demo helpers
    Kit.demoChat = (text) => ({ type: 'chat', u: demoUser(), text });
    Kit.demoGift = () => { const [name, coins] = pick(DEMO_GIFTS), count = Math.random() < 0.25 ? Math.ceil(rand(2, 6)) : 1; return { type: 'gift', u: demoUser(), gift: { name, coins, count, total: coins * count, pic: '' } }; };
    Kit.demoLike = () => ({ type: 'like', u: demoUser(), count: Math.ceil(rand(3, 25)) });
    if (new URLSearchParams(location.search).has('demo')) begin(true);
  };
})();
