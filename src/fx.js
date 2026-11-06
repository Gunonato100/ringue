function FX_MAIN() {
  // Arena soundtrack + reactive sound effects. Original procedural music (no copyrighted tracks).
  let AC = null, out = null, musicBus = null, fxBus = null, duck = null, noise = null, amb = null, ambGain = null;
  let enabled = true;
  try { enabled = localStorage.getItem('ringue.music') !== 'false'; } catch (e) {}
  const box = document.getElementById('music');
  if (box) { box.checked = enabled; box.addEventListener('change', () => { enabled = box.checked; try { localStorage.setItem('ringue.music', String(enabled)); } catch (e) {} applyEnabled(); }); }

  function init() {
    if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    out = AC.createGain(); out.gain.value = enabled ? 1 : 0; out.connect(AC.destination);
    const comp = AC.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(out);
    duck = AC.createGain(); duck.connect(comp);
    musicBus = AC.createGain(); musicBus.gain.value = 0.34; musicBus.connect(duck);
    fxBus = AC.createGain(); fxBus.gain.value = 0.55; fxBus.connect(comp);
    noise = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // crowd ambience bed
    amb = AC.createBufferSource(); amb.buffer = noise; amb.loop = true;
    const af = AC.createBiquadFilter(); af.type = 'bandpass'; af.frequency.value = 520; af.Q.value = 0.6;
    ambGain = AC.createGain(); ambGain.gain.value = 0.015;
    amb.connect(af); af.connect(ambGain); ambGain.connect(fxBus); amb.start();
    nextTime = AC.currentTime + 0.1;
    setInterval(scheduler, 25);
  }
  function applyEnabled() { if (out) out.gain.setTargetAtTime(enabled ? 1 : 0, AC.currentTime, 0.05); }
  ['pointerdown', 'touchend', 'keydown'].forEach(ev => document.addEventListener(ev, init, { passive: true }));

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  function nz(t, dur, type, freq, q, peak, bus, sweep) {
    const s = AC.createBufferSource(); s.buffer = noise;
    const f = AC.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q; if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    const g = AC.createGain(); env(g, t, 0.003, peak, dur);
    s.connect(f); f.connect(g); g.connect(bus || fxBus); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  function tone(t, type, f0, f1, dur, peak, bus, a = 0.004) {
    const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, a, peak, dur); o.connect(g); g.connect(bus || fxBus); o.start(t); o.stop(t + a + dur + 0.05);
  }
  // ---- drum + synth voices (music bus) ----
  function kick(t) {
    tone(t, 'sine', 155, 42, 0.32, 1.0, musicBus, 0.002);
    duck.gain.cancelScheduledValues(t); duck.gain.setValueAtTime(0.45, t); duck.gain.linearRampToValueAtTime(1, t + 0.22);
  }
  function clap(t) { for (let i = 0; i < 3; i++) nz(t + i * 0.011, 0.14, 'bandpass', 1500, 0.9, 0.5, musicBus); }
  function hat(t, open, v = 0.16) { nz(t, open ? 0.22 : 0.035, 'highpass', 7500, 0.7, v, musicBus); }
  function bass(t, m, dur, bright) {
    const o = AC.createOscillator(), o2 = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
    o.type = 'sawtooth'; o2.type = 'square'; o.frequency.value = mtof(m); o2.frequency.value = mtof(m - 12);
    f.type = 'lowpass'; f.Q.value = 6; f.frequency.setValueAtTime(260 + bright * 900, t); f.frequency.exponentialRampToValueAtTime(140, t + dur);
    env(g, t, 0.005, 0.32, dur); o.connect(f); o2.connect(f); f.connect(g); g.connect(musicBus);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  function lead(t, m, dur) {
    const o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
    o.type = 'square'; o.frequency.value = mtof(m); f.type = 'lowpass'; f.frequency.value = 2600; f.Q.value = 2;
    env(g, t, 0.004, 0.07, dur); o.connect(f); f.connect(g); g.connect(musicBus); o.start(t); o.stop(t + dur + 0.05);
  }
  function stab(t, notes) {
    for (const m of notes) for (const det of [-7, 7]) {
      const o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
      o.type = 'sawtooth'; o.frequency.value = mtof(m + 12); o.detune.value = det;
      f.type = 'lowpass'; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(500, t + 0.3);
      env(g, t, 0.004, 0.035, 0.32); o.connect(f); f.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.4);
    }
  }
  // ---- sequencer ----
  const BPM = 128, STEP = 60 / BPM / 4;
  const ROOTS = [45, 41, 43, 40];                       // A  F  G  E
  const CHORDS = [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]];
  const BASSPAT = [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1];
  const OCT = [0, 0, 12, 0, 0, 12, 0, 0, 0, 0, 12, 0, 0, 12, 0, 7];
  let step = 0, nextTime = 0, level = 1;
  function scheduler() {
    if (!AC || !enabled) { if (AC) nextTime = AC.currentTime + 0.05; return; }
    while (nextTime < AC.currentTime + 0.12) { playStep(step, nextTime); nextTime += STEP; step++; }
  }
  function playStep(s, t) {
    const R = window.__ringue, G = R && R.G;
    const phase = G ? G.phase : 'fight';
    if (phase === 'ko') { if (s % 16 === 0) stab(t, CHORDS[0].map(n => n - 12)); return; }
    level = !G ? 1 : (G.fury > 0 || G.crowdHype > 0.65) ? 2 : phase === 'intro' ? 0 : 1;
    const i = s % 16, bar = Math.floor(s / 16) % 4, root = ROOTS[bar], ch = CHORDS[bar];
    if (i % 4 === 0) kick(t);
    if (level >= 1 && (i === 4 || i === 12)) clap(t);
    if (level === 0 ? i % 4 === 2 : level === 1 ? i % 2 === 0 : true) hat(t, level >= 2 && i % 4 === 2, i % 4 === 2 ? 0.2 : 0.11);
    if (BASSPAT[i]) bass(t, root + OCT[i], STEP * 1.6, level / 2);
    if (level >= 1 && (i === 0 || i === 10) && bar % 2 === 0) stab(t, ch);
    if (level >= 2) lead(t, ch[i % 3] + (i % 8 < 4 ? 12 : 24), STEP * 0.9);
  }
  // ---- reactive sound effects ----
  function riser(t, dur) { nz(t, dur, 'bandpass', 300, 1.2, 0.35, fxBus, 6000); }
  function crash(t) { nz(t, 1.3, 'highpass', 3500, 0.5, 0.35); }
  function roar(t, amp, dur) {
    const s = AC.createBufferSource(); s.buffer = noise; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 0.4;
    const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(amp, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(fxBus); s.start(t, Math.random()); s.stop(t + dur + 0.1);
  }
  function airhorn(t) {
    for (let b = 0; b < 3; b++) { const tt = t + b * 0.28, len = b === 2 ? 0.6 : 0.2;
      for (const f of [466, 587, 698]) { const o = AC.createOscillator(), g = AC.createGain(), lf = AC.createOscillator(), lg = AC.createGain();
        o.type = 'sawtooth'; o.frequency.value = f; lf.frequency.value = 6; lg.gain.value = 6; lf.connect(lg); lg.connect(o.frequency);
        g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.06, tt + 0.02); g.gain.setValueAtTime(0.06, tt + len); g.gain.exponentialRampToValueAtTime(0.0001, tt + len + 0.08);
        o.connect(g); g.connect(fxBus); o.start(tt); lf.start(tt); o.stop(tt + len + 0.1); lf.stop(tt + len + 0.1); } }
  }
  function chime(t) { tone(t, 'triangle', 1568, null, 0.25, 0.18); tone(t + 0.07, 'triangle', 2093, null, 0.35, 0.16); tone(t + 0.14, 'sine', 3136, null, 0.3, 0.08); }
  function blip(t) { tone(t, 'sine', 660, 1320, 0.18, 0.14); }
  function pop(t) { tone(t, 'sine', 900 + Math.random() * 300, 500, 0.08, 0.08); }
  function boom(t) { tone(t, 'sine', 90, 35, 0.9, 0.7); nz(t, 0.5, 'lowpass', 900, 0.7, 0.4); tone(t + 0.05, 'triangle', 1200, 2400, 0.4, 0.05); }
  function announce(text) {
    const R = window.__ringue; if (!R || !R.cfg || !R.cfg.voice || !enabled || !('speechSynthesis' in window)) return;
    try { const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.92; u.pitch = 0.6; const v = speechSynthesis.getVoices().find(v => /en-US/i.test(v.lang)); if (v) u.voice = v; speechSynthesis.speak(u); } catch (e) {}
  }
  // watch game state and react
  const S = { round: -1, phase: '', fury: 0, spot: null, feedTop: null, feedCount: 0, hearts: 0, shake: 0, combo: [0, 0], lastPop: 0 };
  function watch() {
    requestAnimationFrame(watch);
    const R = window.__ringue; if (!R || !AC || !enabled) return;
    const G = R.G, F = R.F, t = AC.currentTime;
    ambGain.gain.setTargetAtTime(0.012 + G.crowdHype * 0.07 + (G.fury > 0 ? 0.04 : 0), t, 0.3);
    if (G.round !== S.round && G.round > 0) { riser(t, 0.9); crash(t + 0.9); roar(t + 0.9, 0.35, 2.2); announce('Round ' + G.round + '. Fight!'); }
    if (G.phase === 'ko' && S.phase !== 'ko') { crash(t); boom(t); roar(t + 0.1, 0.55, 3.5); }
    if (G.fury > 0 && S.fury <= 0) { airhorn(t); roar(t, 0.45, 2.5); }
    if (G.spot && G.spot !== S.spot) { boom(t); chime(t + 0.1); }
    const top = G.feed[0];
    if (top && (top !== S.feedTop || top.count !== S.feedCount)) { if (top.gift) chime(t); else blip(t); }
    S.feedTop = top; S.feedCount = top ? top.count : 0;
    if (G.hearts.length > S.hearts && G.time - S.lastPop > 0.12) { pop(t); S.lastPop = G.time; }
    S.hearts = G.hearts.length;
    if (G.shake > 0.12 && S.shake <= 0.12) roar(t, 0.3, 1.4);
    for (let i = 0; i < 2; i++) { const c = F[i].comboN; if (c >= 5 && c % 5 === 0 && c !== S.combo[i]) { roar(t, 0.25, 1.2); tone(t, 'square', 523, 1046, 0.25, 0.05); } S.combo[i] = c; }
    S.round = G.round; S.phase = G.phase; S.fury = G.fury; S.spot = G.spot; S.shake = G.shake;
  }
  requestAnimationFrame(watch);
  // ---- "how to play" sign on the ring ----
  const css = document.createElement('style');
  css.textContent = '#howto{position:fixed;z-index:3;width:max-content;pointer-events:none;display:none;transform:translate(-50%,-50%);text-align:center;font-family:Teko,Impact,sans-serif;font-weight:700;line-height:.95;letter-spacing:.04em;white-space:nowrap}' +
    '#howto .card{padding:.18em .7em .12em;border-radius:.5em;background:rgba(6,4,12,.82);border:2px solid var(--c);box-shadow:0 0 18px var(--c),inset 0 0 14px rgba(0,0,0,.6);animation:hpulse 1.2s ease-in-out infinite}' +
    '#howto .q{font-size:.62em;color:#fff;opacity:.9}#howto .a{font-size:1em;color:var(--c);text-shadow:0 0 12px var(--c)}' +
    '#howto .card.swap{animation:hin .35s cubic-bezier(.2,1.4,.4,1),hpulse 1.2s ease-in-out .35s infinite}' +
    '@keyframes hpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}@keyframes hin{0%{transform:scale(.4) rotate(-6deg);opacity:0}100%{transform:scale(1);opacity:1}}';
  document.head.appendChild(css);
  const sign = document.createElement('div'); sign.id = 'howto'; sign.innerHTML = '<div class="card"><div class="q"></div><div class="a"></div></div>'; document.body.appendChild(sign);
  const card = sign.firstChild, q = card.firstChild, a = card.lastChild;
  const TXT = {
    en: [['WANT RED TO WIN?', 'SEND A 🌹 {A}'], ['WANT GOLD TO WIN?', 'SEND A 🪙 {B}'], ['PICK YOUR FIGHTER', 'COMMENT 1 OR 2'], ['BIGGER GIFTS =', 'SPECIAL MOVES ⚡']],
    pt: [['QUER QUE O VERMELHO GANHE?', 'MANDE UMA 🌹 {A}'], ['QUER QUE O DOURADO GANHE?', 'MANDE UM 🪙 {B}'], ['ESCOLHA SEU LUTADOR', 'COMENTE 1 OU 2'], ['PRESENTES MAIORES =', 'GOLPES ESPECIAIS ⚡']],
    es: [['¿QUIERES QUE GANE EL ROJO?', 'ENVÍA UNA 🌹 {A}'], ['¿QUIERES QUE GANE EL DORADO?', 'ENVÍA UN 🪙 {B}'], ['ELIGE TU LUCHADOR', 'COMENTA 1 O 2'], ['REGALOS MAYORES =', 'GOLPES ESPECIALES ⚡']],
  };
  const COL = ['#ff2d55', '#ffc83d', '#b9a8ff', '#3df5ff'];
  const DANGER = { en: ['⚠️ {N} IS IN DANGER!', '{G} = FIGHT BACK'], pt: ['⚠️ {N} ESTÁ EM PERIGO!', '{G} = REAGIR'], es: ['⚠️ ¡{N} EN PELIGRO!', '{G} = CONTRAATACA'] };
  let idx = -1, lastSwap = 0;
  function placeSign() {
    const R = window.__ringue, hud = document.getElementById('hud'), setup = document.getElementById('setup');
    if (!R || !R.G || !R.G.started || !hud || (setup && !setup.classList.contains('hidden'))) { sign.style.display = 'none'; return; }
    const r = hud.getBoundingClientRect();
    sign.style.display = 'block'; sign.style.left = (r.left + r.width / 2) + 'px'; sign.style.top = (r.top + r.height * 0.735) + 'px'; const fs0 = r.width * 0.075, maxW = r.width * 0.92; sign.style.fontSize = (sign._fs || fs0) + 'px';
    const busy = R.G.phase === 'ko' || !!R.G.spot; sign.style.opacity = busy ? '0.15' : '1'; sign.style.transition = 'opacity .3s';
    const now = performance.now();
    const lowI = R.G.phase === 'fight' ? (R.F[0].hp < 25 ? 0 : R.F[1].hp < 25 ? 1 : -1) : -1;
    if (lowI >= 0) {
      const cfg = R.cfg || {}, D = DANGER[cfg.lang] || DANGER.en, nm = lowI ? 'MIDAS' : 'THORN';
      const qq = D[0].replace('{N}', nm), aa = D[1].replace('{G}', lowI ? '🪙 ' + String(cfg.giftB || 'TikTok').toUpperCase() : '🌹 ' + String(cfg.giftA || 'Rose').toUpperCase());
      if (q.textContent !== qq) { q.textContent = qq; a.textContent = aa; card.style.setProperty('--c', COL[lowI]); card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap'); idx = -1; }
      sign.style.transform = 'translate(-50%,-50%) scale(' + (1.04 + Math.sin(now / 90) * 0.04) + ')';
      return;
    }
    sign.style.transform = 'translate(-50%,-50%)';
    if (now - lastSwap > 3800 || idx < 0) {
      lastSwap = now; const cfg = R.cfg || {}, list = TXT[cfg.lang] || TXT.en;
      const order = [0, 1, 0, 1, 2, 3]; idx = (idx + 1) % order.length; const k = order[idx];
      q.textContent = list[k][0]; a.textContent = list[k][1].replace('{A}', String(cfg.giftA || 'Rose').toUpperCase()).replace('{B}', String(cfg.giftB || 'TikTok').toUpperCase());
      card.style.setProperty('--c', COL[k]); card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap');
    }
  }
  setInterval(() => {
    placeSign();
    const hud = document.getElementById('hud'); if (!hud || sign.style.display === 'none') return;
    const r = hud.getBoundingClientRect(), fs0 = r.width * 0.075, maxW = r.width * 0.92;
    sign.style.fontSize = fs0 + 'px'; const w = card.offsetWidth; const fs = w > maxW ? fs0 * maxW / w : fs0; sign._fs = fs; sign.style.fontSize = fs + 'px';
  }, 100);
}
