async function CROWD_MAIN() {
  // Living 3D crowd: team-colored fans that jump, wave their arms, hold signs, glow sticks,
  // Mexican waves, confetti cannons and stadium light pulses — all reacting to the fight.
  let R = window.__ringue;
  for (let i = 0; i < 400 && !(R && R.scene); i++) { await new Promise(r => setTimeout(r, 50)); R = window.__ringue; }
  if (!R || !R.scene) return;
  const THREE = await import('three');
  const { scene, G, F } = R;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  // hide the old dark silhouettes
  scene.traverse(o => { if (o.isInstancedMesh && o.count === 238) o.visible = false; });

  // ---------- layout ----------
  const rows = 7, perRow = 34, fans = [];
  for (let r = 0; r < rows; r++) for (let i = 0; i < perRow; i++) {
    const x = (i - perRow / 2) * 0.52 + (r % 2) * 0.26 + rnd(-0.08, 0.08);
    const side = Math.abs(x) < 0.45 ? 2 : (x < 0 ? 0 : 1);
    const mixed = Math.random() < 0.18;
    fans.push({ x, y: -0.6 + r * 0.55, z: -4.1 - r * 0.85, r, side: mixed ? 1 - (side === 2 ? 0 : side) : side,
      ph: rnd(0, 6.28), s: rnd(0.9, 1.1), arm: [0, 0], armT: [0, 0], jump: 0, stick: Math.random() < 0.45, wav: rnd(4, 7), lazy: rnd(0.3, 1) });
  }
  const N = fans.length;
  const TEAM = [[0xff2d55, 0xd6153b, 0xff6b81, 0xb3002d], [0xffc83d, 0xffa400, 0xffe08a, 0xe0a100], [0x8a7dff, 0x3df5ff, 0xffffff, 0x9b9b9b]];
  const SKIN = [0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac, 0x5c3a21];
  const HAIR = [0x1b1b1b, 0x3b2314, 0x6b4423, 0xd6b370, 0xb03a2e, 0xeeeeee];

  // ---------- meshes ----------
  const mat = () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0.05, envMapIntensity: 0.08 });
  const torsoG = new THREE.CapsuleGeometry(0.16, 0.26, 4, 10); torsoG.translate(0, 0.32, 0);
  const headG = new THREE.SphereGeometry(0.115, 14, 10);
  const hairG = new THREE.SphereGeometry(0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const armG = new THREE.CapsuleGeometry(0.045, 0.28, 3, 6); armG.translate(0, -0.18, 0);
  const stickG = new THREE.CylinderGeometry(0.025, 0.025, 0.24, 6);
  const torso = new THREE.InstancedMesh(torsoG, mat(), N), head = new THREE.InstancedMesh(headG, mat(), N), hair = new THREE.InstancedMesh(hairG, mat(), N);
  const arms = new THREE.InstancedMesh(armG, mat(), N * 2);
  const nStick = fans.filter(f => f.stick).length;
  const sticks = new THREE.InstancedMesh(stickG, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), nStick);
  const C = new THREE.Color();
  let si = 0;
  fans.forEach((f, i) => {
    const shirt = pick(TEAM[f.side]); C.setHex(shirt).multiplyScalar(f.side === 2 ? 0.1 : 0.3); torso.setColorAt(i, C); arms.setColorAt(i * 2, C); arms.setColorAt(i * 2 + 1, C);
    C.setHex(pick(SKIN)).multiplyScalar(0.3); head.setColorAt(i, C);
    C.setHex(pick(HAIR)).multiplyScalar(0.5); hair.setColorAt(i, C);
    if (f.stick) { f.si = si; C.setHex(f.side === 0 ? 0xff2d55 : f.side === 1 ? 0xffc83d : pick([0x3df5ff, 0xb9a8ff, 0x7dff9a])).multiplyScalar(2.2); sticks.setColorAt(si++, C); }
  });
  [torso, head, hair, arms, sticks].forEach(m => { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; scene.add(m); });

  // stadium wash lights (only reach the stands)
  const wash = [new THREE.PointLight(0xff2d55, 6, 5.5, 1.6), new THREE.PointLight(0xffc83d, 6, 5.5, 1.6), new THREE.PointLight(0xb9a8ff, 6, 6, 1.6)];
  wash[0].position.set(-2.6, 3.6, -7.2); wash[1].position.set(2.6, 3.6, -7.2); wash[2].position.set(0, 5, -9.5);
  wash.forEach(l => scene.add(l));

  // ---------- fan signs ----------
  const SIGNS = [['THORN!!', 0], ['GO MIDAS!', 1], ['KO! KO! KO!', 2], ["LET'S GO!", 2], ['TEAM RED 🔥', 0], ['TEAM GOLD 👑', 1], ['💥 POW 💥', 2], ['MIDAS #1', 1], ['THORN #1', 0], ['FIGHT!', 2], ['🌹🌹🌹', 0], ['🪙🪙🪙', 1]];
  function signTex(text, team) {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const x = cv.getContext('2d');
    const bg = team === 0 ? '#ff2d55' : team === 1 ? '#ffc83d' : '#ffffff', fg = team === 1 ? '#1a1000' : team === 2 ? '#14101e' : '#ffffff';
    x.fillStyle = bg; x.beginPath(); x.roundRect(6, 6, 244, 116, 14); x.fill();
    x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 6; x.stroke();
    x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
    let fs = 64; do { x.font = `900 ${fs}px Impact, "Arial Black", sans-serif`; fs -= 2; } while (x.measureText(text).width > 224 && fs > 20);
    x.fillText(text, 128, 68);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const signG = new THREE.PlaneGeometry(0.62, 0.31), poleG = new THREE.CylinderGeometry(0.012, 0.012, 0.35, 5);
  const poleM = new THREE.MeshBasicMaterial({ color: 0x9a7b55 });
  const holders = fans.filter(f => Math.abs(f.x) < 3.1 && f.r >= 1 && f.r <= 5).sort(() => Math.random() - 0.5).slice(0, 8);
  const signs = holders.map((f, k) => {
    const [text, team] = SIGNS[k % SIGNS.length];
    const fan = (team === 2) ? f : (fans.filter(o => o.side === team && Math.abs(o.x) < 3.1 && o.r >= 1 && o.r <= 5 && !o.sign).sort(() => Math.random() - 0.5)[0] || f);
    if (fan.sign) return null;
    const g = new THREE.Group();
    const p = new THREE.Mesh(signG, new THREE.MeshBasicMaterial({ map: signTex(text, team), side: THREE.DoubleSide, toneMapped: false, transparent: true }));
    p.position.y = 0.5; p.scale.setScalar(0.8); p.material.color.setScalar(0.62);
    const pole = new THREE.Mesh(poleG, poleM); pole.position.y = 0.2;
    g.add(p, pole); scene.add(g); fan.sign = g; fan.stick = false; return { g, fan, panel: p };
  }).filter(Boolean);

  // ---------- confetti ----------
  const CN = 600, conf = [];
  const confM = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.06, 0.035), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, toneMapped: false }), CN);
  confM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); confM.frustumCulled = false;
  const CCOL = [0xff2d55, 0xffc83d, 0x3df5ff, 0xb9a8ff, 0x7dff9a, 0xffffff, 0xff7a1f];
  for (let i = 0; i < CN; i++) { conf.push({ on: false, p: new THREE.Vector3(), v: new THREE.Vector3(), rot: new THREE.Euler(), w: new THREE.Vector3() }); C.setHex(pick(CCOL)).multiplyScalar(1.4); confM.setColorAt(i, C); }
  scene.add(confM);
  let cHead = 0;
  function burst(n, x, y, z, up, spread, colors) {
    for (let k = 0; k < n; k++) {
      const c = conf[cHead]; cHead = (cHead + 1) % CN;
      c.on = true; c.life = rnd(2.5, 4.5); c.p.set(x + rnd(-0.1, 0.1), y, z + rnd(-0.1, 0.1));
      c.v.set(rnd(-spread, spread) + (x < 0 ? 0.9 : x > 0 ? -0.9 : 0) * Math.abs(spread) * 0.6, rnd(up * 0.7, up), rnd(-0.4, 1.4));
      c.rot.set(rnd(0, 6), rnd(0, 6), rnd(0, 6)); c.w.set(rnd(-9, 9), rnd(-9, 9), rnd(-9, 9));
      if (colors) { C.setHex(pick(colors)).multiplyScalar(1.4); confM.setColorAt(cHead === 0 ? CN - 1 : cHead - 1, C); }
    }
    confM.instanceColor.needsUpdate = true;
  }
  function cannons(colors, n = 120) { burst(n, -1.9, 0.2, -1.4, 7.5, 1.4, colors); burst(n, 1.9, 0.2, -1.4, 7.5, 1.4, colors); }
  function rain(n, colors) { for (let k = 0; k < n; k++) burst(1, rnd(-2.2, 2.2), rnd(5.5, 7.5), rnd(-2, 1.5), 0.2, 0.4, colors); }

  // ---------- state tracking ----------
  const ex = [0, 0]; let wave = -99, lastHp = [F[0].hp, F[1].hp], lastPhase = G.phase, lastSpot = null, lastFury = G.fury, lastRound = G.round, nextWave = 14, flash = [0, 0];
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(), P = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  let last = performance.now(), T = 0;
  function cheer(side, amt) { if (side === 2) { ex[0] = Math.min(1.4, ex[0] + amt); ex[1] = Math.min(1.4, ex[1] + amt); } else ex[side] = Math.min(1.4, ex[side] + amt); }
  function startWave() { wave = T; }

  function tick() {
    requestAnimationFrame(tick);
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt;
    // --- react to the fight ---
    for (let i = 0; i < 2; i++) {
      const d = lastHp[i] - F[i].hp;
      if (d > 0.5) { cheer(1 - i, Math.min(0.9, 0.25 + d * 0.04)); flash[1 - i] = 1; }
      lastHp[i] = F[i].hp;
    }
    if (G.phase === 'ko' && lastPhase !== 'ko') {
      const w = F[0].state === 'win' ? 0 : 1; cheer(w, 1.4); cheer(1 - w, 0.2);
      cannons(w === 0 ? [0xff2d55, 0xff6b81, 0xffffff, 0xffc0cb] : [0xffc83d, 0xffe08a, 0xffffff, 0xffa400], 160); setTimeout(() => rain(140), 500); flash[w] = 1.5;
    }
    if (G.round !== lastRound && G.round > 0) { startWave(); setTimeout(() => cannons(null, 70), 900); }
    if (G.spot && G.spot !== lastSpot) { cheer(2, 0.8); rain(90); flash[0] = flash[1] = 1; }
    if (G.fury > 0 && lastFury <= 0) { cheer(2, 1.2); startWave(); cannons(null, 90); }
    lastPhase = G.phase; lastSpot = G.spot; lastFury = G.fury; lastRound = G.round;
    if (T > nextWave) { startWave(); nextWave = T + rnd(16, 26); }
    ex[0] = Math.max(0, ex[0] - dt * 0.35); ex[1] = Math.max(0, ex[1] - dt * 0.35);
    flash[0] = Math.max(0, flash[0] - dt * 2.5); flash[1] = Math.max(0, flash[1] - dt * 2.5);
    const hype = (G.crowdHype || 0) + (G.fury > 0 ? 0.6 : 0), ko = G.phase === 'ko';

    // --- lights ---
    const beat = Math.pow(Math.max(0, Math.sin(T * Math.PI * 128 / 60)), 8);
    wash[0].intensity = 4 + hype * 6 + flash[0] * 22 + beat * 3 * (1 + hype);
    wash[1].intensity = 4 + hype * 6 + flash[1] * 22 + beat * 3 * (1 + hype);
    wash[2].intensity = 4 + (G.fury > 0 ? 12 * (0.5 + 0.5 * Math.sin(T * 12)) : 0);
    wash[2].color.setHex(G.fury > 0 ? 0xff5a1f : 0xb9a8ff);

    // --- fans ---
    for (let i = 0; i < N; i++) {
      const f = fans[i];
      const mine = f.side === 2 ? Math.max(ex[0], ex[1]) * 0.7 : ex[f.side];
      const winner = ko && f.side !== 2 && F[f.side].state === 'win', loser = ko && f.side !== 2 && F[f.side].state === 'ko';
      let e = Math.min(1.5, 0.12 * f.lazy + mine + hype * 0.45 + (winner ? 1.2 : 0));
      if (loser) e = 0.05;
      const wv = Math.max(0, 1 - Math.abs((T - wave) * 7 - (f.x + 9)) / 1.6);       // Mexican wave travelling left→right
      const bounce = Math.max(0, Math.sin(T * f.wav + f.ph)) * 0.16 * e;
      const lift = bounce + wv * 0.28;
      // arms: up when excited / in the wave, waving side-to-side
      const want = Math.min(1, e * 0.9 + wv + (Math.sin(T * 0.7 + f.ph * 3) > 0.93 ? 0.8 : 0));
      for (let a = 0; a < 2; a++) { f.arm[a] += ((a ? want : Math.max(want, (f.stick && e > 0.3) ? 1 : 0)) - f.arm[a]) * Math.min(1, dt * 7); }
      const sc = f.s * (loser ? 0.97 : 1);
      // torso
      P.set(f.x, f.y + lift, f.z); E.set(0, 0, Math.sin(T * 2.2 + f.ph) * 0.06 * e - (loser ? 0 : 0)); Q.setFromEuler(E); S.setScalar(sc); M.compose(P, Q, S); torso.setMatrixAt(i, M);
      // head (droops for losing fans)
      P.set(f.x + Math.sin(T * 2.2 + f.ph) * 0.02 * e, f.y + lift + 0.68 * sc - (loser ? 0.06 : 0), f.z + (loser ? 0.04 : 0)); Q.identity(); M.compose(P, Q, S); head.setMatrixAt(i, M);
      P.y += 0.035; M.compose(P, Q, S); hair.setMatrixAt(i, M);
      // arms (pivot at the shoulder)
      for (let a = 0; a < 2; a++) {
        const sx = a ? 1 : -1, up = f.arm[a];
        const wag = Math.sin(T * (6 + f.lazy * 4) + f.ph + a * 1.7) * 0.35 * up;
        P.set(f.x + sx * 0.17 * sc, f.y + lift + 0.5 * sc, f.z);
        E.set(-0.2 * up, 0, sx * (0.18 + up * 2.6) + wag); Q.setFromEuler(E); M.compose(P, Q, S); arms.setMatrixAt(i * 2 + a, M);
        if (a === 1 && f.stick) {
          // glow stick / phone light in the right hand
          const L = 0.36 * sc, ang = sx * (0.18 + up * 2.6) + wag;
          P.set(f.x + sx * 0.17 * sc + Math.sin(ang) * L, f.y + lift + 0.5 * sc - Math.cos(ang) * L, f.z + 0.02);
          E.set(0, 0, ang); Q.setFromEuler(E); M.compose(P, Q, S); sticks.setMatrixAt(f.si, M);
        }
        if (a === 1 && f.sign) {
          const sway = Math.sin(T * 3 + f.ph) * (0.12 + e * 0.15);
          f.sign.position.set(f.x + sx * 0.12 * sc, f.y + lift + 0.5 * sc + 0.15 + Math.max(0, Math.sin(T * 5 + f.ph)) * 0.08 * e, f.z + 0.05);
          f.sign.rotation.z = sway; f.sign.scale.setScalar(sc);
        }
      }
    }
    [torso, head, hair, arms, sticks].forEach(m => { m.instanceMatrix.needsUpdate = true; });

    // --- confetti physics ---
    for (let i = 0; i < CN; i++) {
      const c = conf[i];
      if (!c.on) { M.makeScale(0, 0, 0); confM.setMatrixAt(i, M); continue; }
      c.life -= dt; if (c.life <= 0 || c.p.y < -1) { c.on = false; continue; }
      c.v.y -= 6.5 * dt; c.v.multiplyScalar(1 - Math.min(0.9, dt * 1.8)); if (c.v.y < -1.1) c.v.y = -1.1;
      c.v.x += Math.sin(T * 3 + i) * dt * 0.8;
      c.p.addScaledVector(c.v, dt); c.rot.x += c.w.x * dt; c.rot.y += c.w.y * dt; c.rot.z += c.w.z * dt;
      Q.setFromEuler(c.rot); S.setScalar(Math.min(1, c.life * 2)); M.compose(c.p, Q, S); confM.setMatrixAt(i, M);
    }
    confM.instanceMatrix.needsUpdate = true;
  }
  requestAnimationFrame(tick);
  window.__crowd = { cheer, startWave, cannons, rain };

  // ---------- TEAM WAR bar (who is supporting more this round) ----------
  const st = document.createElement('style');
  st.textContent = '#war{position:fixed;z-index:3;pointer-events:none;display:none;transform:translateX(-50%);font-family:Teko,Impact,sans-serif;font-weight:700;color:#fff;letter-spacing:.04em;white-space:nowrap}' +
    '#war .row{display:flex;align-items:center;justify-content:space-between;font-size:1em;line-height:1;margin-bottom:.12em;text-shadow:0 2px 6px #000}' +
    '#war .r{color:#ff2d55}#war .g{color:#ffc83d}#war .mid{font-size:.75em;opacity:.85}' +
    '#war .bar{position:relative;height:.62em;border-radius:1em;overflow:hidden;background:#ffc83d;box-shadow:0 0 14px rgba(0,0,0,.7),0 0 0 2px rgba(255,255,255,.18)}' +
    '#war .fill{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#b3002d,#ff2d55);transition:width .5s cubic-bezier(.2,1.3,.4,1)}' +
    '#war .bar:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);background-size:40% 100%;background-repeat:no-repeat;animation:wsh 2.2s linear infinite}' +
    '#war .knob{position:absolute;top:50%;width:1.1em;height:1.1em;margin:-.55em 0 0 -.55em;border-radius:50%;background:#fff;box-shadow:0 0 12px #fff;display:flex;align-items:center;justify-content:center;font-size:.75em;transition:left .5s cubic-bezier(.2,1.3,.4,1)}' +
    '#war .lead{text-align:center;font-size:.78em;margin-top:.15em;height:1em;text-shadow:0 0 10px currentColor}' +
    '#war.bump .bar{animation:wbump .35s}' +
    '@keyframes wsh{0%{background-position:-60% 0}100%{background-position:160% 0}}@keyframes wbump{50%{transform:scale(1.06)}}';
  document.head.appendChild(st);
  const war = document.createElement('div'); war.id = 'war';
  war.innerHTML = '<div class="row"><span class="r">🌹 THORN <b class="rv">0</b></span><span class="mid">TEAM WAR</span><span class="g"><b class="gv">0</b> MIDAS 🪙</span></div><div class="bar"><div class="fill"></div><div class="knob">⚔️</div></div><div class="lead"></div>';
  document.body.appendChild(war);
  const rv = war.querySelector('.rv'), gv = war.querySelector('.gv'), fill = war.querySelector('.fill'), knob = war.querySelector('.knob'), lead = war.querySelector('.lead');
  const LT = { en: ['TEAM WAR', 'RED IS WINNING THE WAR!', 'GOLD IS WINNING THE WAR!', "IT'S A TIE!"], pt: ['GUERRA DE TIMES', 'VERMELHO ESTÁ VENCENDO!', 'DOURADO ESTÁ VENCENDO!', 'EMPATADO!'], es: ['GUERRA DE EQUIPOS', '¡EL ROJO VA GANANDO!', '¡EL DORADO VA GANANDO!', '¡EMPATE!'] };
  let lastTot = -1;
  setInterval(() => {
    const hud = document.getElementById('hud'), setup = document.getElementById('setup');
    if (!G.started || !hud || (setup && !setup.classList.contains('hidden'))) { war.style.display = 'none'; return; }
    const r = hud.getBoundingClientRect();
    war.style.display = 'block'; war.style.left = (r.left + r.width / 2) + 'px'; war.style.top = (r.top + r.height * 0.805) + 'px';
    war.style.width = (r.width * 0.84) + 'px'; war.style.fontSize = Math.round(r.width * 0.043) + 'px';
    const tot = [0, 0];
    for (const v of G.roundSup.values()) { const sd = G.team.has(v.u.uid) ? G.team.get(v.u.uid) : null; if (sd === 0 || sd === 1) tot[sd] += v.coins; }
    const sum = tot[0] + tot[1], pct = sum ? Math.max(6, Math.min(94, tot[0] / sum * 100)) : 50;
    rv.textContent = tot[0]; gv.textContent = tot[1]; fill.style.width = pct + '%'; knob.style.left = pct + '%';
    const L = LT[(R.cfg && R.cfg.lang) || 'en'] || LT.en; war.querySelector('.mid').textContent = L[0];
    lead.textContent = !sum ? '' : tot[0] > tot[1] ? L[1] : tot[1] > tot[0] ? L[2] : L[3];
    lead.style.color = tot[0] > tot[1] ? '#ff2d55' : tot[1] > tot[0] ? '#ffc83d' : '#fff';
    if (sum !== lastTot && lastTot >= 0) { war.classList.remove('bump'); void war.offsetWidth; war.classList.add('bump'); }
    lastTot = sum;
    war.style.opacity = (G.phase === 'ko' || G.spot) ? '0.2' : '1';
  }, 200);
}
