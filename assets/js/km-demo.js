/* Креаметрика — scripted product demo для первого экрана.
   Статический JS без зависимостей. <km-demo mode="desktop|mobile"></km-demo>
   Без атрибута mode: до 900px — мобильный прогон без курсора. */
(() => {
if (customElements.get('km-demo')) return;

const E = 'cubic-bezier(.16,1,.3,1)';
const easeOut = p => 1 - Math.pow(1 - p, 3);
const easeInOut = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
const easeCursor = p => 1 - Math.pow(1 - p, 3.4);
const fmt = v => v.toFixed(1).replace('.', ',');

const FUN = [
  { l: 'ПОКАЗ',    v0: 4.1,  v1: 4.1,  w0: 100, w1: 100 },
  { l: 'КЛИК',     v0: 88.0, v1: 88.0, w0: 72,  w1: 72 },
  { l: 'КАРТОЧКА', v0: 5.3,  v1: 7.9,  w0: 60,  w1: 60, hot: 1 },
  { l: 'КОРЗИНА',  v0: 61.0, v1: 63.5, w0: 20,  w1: 30 },
  { l: 'ЗАКАЗ',    v0: 83.0, v1: 83.0, w0: 15,  w1: 23 }
];
const CARDS = [
  ['SKU-0412', 'left:34%;right:34%;top:18%;bottom:14%'],
  ['SKU-0413', 'left:24%;right:24%;top:34%;bottom:18%'],
  ['SKU-0414', 'left:38%;right:38%;top:14%;bottom:12%'],
  ['SKU-0415', 'left:22%;right:30%;top:26%;bottom:22%'],
  ['SKU-0416', 'left:30%;right:30%;top:30%;bottom:14%'],
  ['SKU-0418', 'left:36%;right:28%;top:20%;bottom:16%'],
  ['SKU-0417', 'left:32%;right:32%;top:22%;bottom:14%'],
  ['SKU-0419', 'left:26%;right:26%;top:28%;bottom:20%']
];
const BAD = [1, 6], TARGET = 6;
const REASONS = [
  'Первый экран не закрывает возражение о составе',
  'Характеристики видны только после прокрутки',
  'Вопросы о размере в отзывах остались без ответа'
];
const PLAN = [
  ['Первый экран: закрыть возражение о составе', 'ПРОВЕРЯЕМ: В КОРЗИНУ'],
  ['Характеристики: вынести в инфографику', 'ПРОВЕРЯЕМ: В КОРЗИНУ'],
  ['Отзывы: ответить на вопросы о размере', 'ПРОВЕРЯЕМ: В ЗАКАЗ']
];

const css = `
:host{display:block;--e:${E};font-family:'JetBrains Mono',ui-monospace,monospace}
*{box-sizing:border-box}
.panel{position:relative;width:100%;aspect-ratio:1/1;background:#0E0E0E;overflow:hidden;contain:paint}
.panel.m{aspect-ratio:360/400}
.inner{position:absolute;left:0;top:0;width:600px;height:600px;transform-origin:0 0;color:#F4F2EE;font-variant-numeric:tabular-nums}
.m .inner{width:360px;height:400px}
.top{position:absolute;left:0;right:0;top:0;height:40px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;border-bottom:1px solid #262422;font-size:10px;letter-spacing:.14em;color:#8C8880;white-space:nowrap}
.top b{font-weight:500;color:#F4F2EE}
.m .top{padding:0 14px}.m .top .lft{display:none}
.stage{position:absolute;left:0;right:0;top:40px;bottom:0}
.fx{transition:opacity .85s var(--e),transform .85s var(--e),clip-path .85s var(--e)}
.L{opacity:0;transform:translateY(10px)}
.L.on{opacity:1;transform:none}
.nt,.nt *{transition:none!important}
.s-tile{position:absolute;inset:0;display:grid;place-items:center;opacity:0}
.s-tile.on{opacity:1}
.s-tile.out{opacity:0;transform:scale(1.3)}
.m .s-tile,.m .s-grid{display:none}
.tile{width:232px;border:1px solid #3A3734;background:#151412;padding:20px 20px 14px}
.t1{font:800 17px/1 Manrope,sans-serif;letter-spacing:-.01em;text-transform:uppercase}
.t2{font-size:10px;letter-spacing:.14em;color:#8C8880;margin-top:9px}
.t3{display:flex;justify-content:space-between;border-top:1px solid #2A2826;margin-top:18px;padding-top:10px;font-size:10px;letter-spacing:.12em;color:#8C8880}
.s-grid{position:absolute;inset:18px 20px 20px;display:grid;grid-template-rows:auto 1fr 1fr;gap:12px}
.s-grid.out{opacity:0;transform:scale(1.07)}
.s-grid.gone{opacity:0}
.gh{display:flex;align-items:center;gap:8px}
.chip{border:1px solid #3A3734;border-radius:999px;padding:6px 10px;font-size:10px;letter-spacing:.1em;color:#B5B0AA;white-space:nowrap}
.chip.a{background:#F4F2EE;border-color:#F4F2EE;color:#0E0E0E}
.prog{margin-left:auto;display:grid;gap:7px;justify-items:end}
.pl{font-size:10px;letter-spacing:.12em;color:#8C8880;white-space:nowrap}
.pl b{color:#F4F2EE;font-weight:500}
.pt{width:132px;height:2px;background:#2A2826;overflow:hidden}
.pf{display:block;height:100%;background:#F4F2EE;transform:scaleX(0);transform-origin:0 0}
.gr{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;min-height:0}
.card{border:1px solid #262422;background:#131210;padding:8px;display:flex;flex-direction:column;gap:6px;min-height:0}
.cth{flex:1;background:#1D1C1A;position:relative;min-height:0}
.cth i{position:absolute;background:#34312D}
.csku{font-size:10px;letter-spacing:.08em;color:#B5B0AA}
.cl{height:3px;background:#262422;width:82%}.cl.s{width:54%}
.cst{height:18px;display:flex;align-items:center}
.cst span{font-size:10px;letter-spacing:.12em;color:#4A4743}
.cst.ok span{color:#B5B0AA}
.cst.bad span{background:#F8211F;color:#fff;padding:3px 6px}
.cst.set span{animation:none}
.scan{position:absolute;left:-20px;right:-20px;top:0;height:1px;background:#F8211F;opacity:0;transition:opacity .3s linear}
.s-fun{position:absolute;inset:18px 20px 20px}
.m .s-fun{inset:14px}
.fh{display:flex;justify-content:space-between;font-size:10px;letter-spacing:.14em;color:#8C8880;padding-bottom:10px;border-bottom:1px solid #262422;white-space:nowrap}
.fh b{color:#F4F2EE;font-weight:500}
.fb{display:grid;grid-template-columns:1.45fr 1fr;gap:22px;margin-top:16px}
.m .fb{grid-template-columns:1fr;margin-top:12px}
.m .fr{display:none}
.row{display:grid;grid-template-columns:1fr 50px;gap:10px;height:30px;margin-bottom:6px}
.m .row{height:24px;margin-bottom:5px}
.trk{position:relative;background:#141311;border:1px solid #221F1D}
.bar,.hotb{position:absolute;inset:0;clip-path:inset(0 100% 0 0);transition:clip-path .9s var(--e),opacity .6s var(--e)}
.bar{background:#34312D}
.hotb{background:#F8211F;opacity:0}
.hotb.on{opacity:1}
.lb{position:absolute;left:10px;top:0;bottom:0;display:flex;align-items:center;font-size:10px;letter-spacing:.12em;color:#F4F2EE}
.cap{position:absolute;right:8px;top:0;bottom:0;display:flex;align-items:center;text-align:right;font-size:10px;line-height:1.15;letter-spacing:.02em;color:#F4F2EE;opacity:0;transition:opacity .6s var(--e)}
.cap.on{opacity:1}
.val{align-self:center;text-align:right;font-size:12px}
.rsn{margin-top:16px}
.rh{font-size:10px;letter-spacing:.14em;color:#8C8880;margin-bottom:6px}
.rs{display:grid;grid-template-columns:24px 1fr;gap:6px;padding:7px 0;border-top:1px solid #262422;font:500 12px/1.35 'Golos Text',sans-serif;color:#E9E6E0}
.rs em{font:normal 10px 'JetBrains Mono',monospace;color:#8C8880;letter-spacing:.1em;padding-top:2px}
.thumb{position:relative;aspect-ratio:1/1;border:1px solid #2A2826;overflow:hidden}
.bf,.af{position:absolute;inset:0}
.bf{background:#1C1B19}
.af{background:#F4F2EE;clip-path:inset(0 0 0 88%)}
.bf i,.af i{position:absolute;display:block}
.tg{position:absolute;top:8px;font-size:10px;letter-spacing:.14em}
.bf .tg{left:8px;color:#F4F2EE}.af .tg{right:8px;color:#0E0E0E}
.dv{position:absolute;top:0;bottom:0;left:0;width:1px;background:#F4F2EE}
.dv b{position:absolute;top:50%;left:-9px;width:19px;height:19px;margin-top:-9px;background:#0E0E0E;border:1px solid #F4F2EE;display:grid;place-items:center;font-size:10px;font-weight:400;color:#F4F2EE}
.tc{display:flex;justify-content:space-between;font-size:10px;letter-spacing:.12em;color:#8C8880;margin-top:8px}
.build{margin-top:14px;width:100%;height:36px;border:1px solid #F4F2EE;background:transparent;color:#F4F2EE;font:500 10px 'JetBrains Mono',monospace;letter-spacing:.16em;padding:0}
.build.p{background:#F4F2EE;color:#0E0E0E}
.plan{position:absolute;left:0;right:0;bottom:0;height:47%;background:#F4F2EE;color:#0E0E0E;padding:16px 20px 12px;transform:translateY(101%);transition:transform .9s var(--e)}
.plan.on{transform:none}
.m .plan{height:46%;padding:12px 14px}
.ph{display:flex;justify-content:space-between;font-size:10px;letter-spacing:.14em;color:#6B6762;padding-bottom:10px;white-space:nowrap}
.pr{display:grid;grid-template-columns:34px 1fr auto;gap:10px;align-items:baseline;padding:11px 0;border-top:1px solid #DCD8D1}
.pr .n{font:800 17px/1 Manrope,sans-serif}
.pr .t{font:500 13px/1.3 'Golos Text',sans-serif}
.pr .k{font-size:10px;letter-spacing:.1em;color:#6B6762;white-space:nowrap}
.m .pr{grid-template-columns:26px 1fr;padding:8px 0}
.m .pr .k,.m .pf2{display:none}
.m .pr .t{font-size:12px}
.pf2{position:absolute;left:20px;right:20px;bottom:14px;font-size:10px;letter-spacing:.12em;color:#6B6762;border-top:1px solid #DCD8D1;padding-top:10px}
.cur{position:absolute;left:-2px;top:-2px;width:20px;height:22px;transform-origin:2px 2px;opacity:0;transition:opacity .4s linear;pointer-events:none;z-index:5}
.ring{position:absolute;left:0;top:0;width:32px;height:32px;border:1px solid #F4F2EE;border-radius:50%;opacity:0;pointer-events:none;z-index:4}
.m .cur,.m .ring{display:none}
.foot{display:flex;justify-content:space-between;align-items:center;gap:16px}
.rp{min-height:44px;background:none;border:0;padding:0;font:500 11px 'JetBrains Mono',monospace;letter-spacing:.14em;color:#0E0E0E;cursor:pointer}
.rp:hover{color:#F8211F}
.fn{font-size:10px;letter-spacing:.14em;color:#6B6762}
`;

const html = `
<div class="panel"><div class="inner">
  <div class="top"><span class="lft"><b>КРЕАМЕТРИКА</b> — РАЗБОР</span><span>ПРИМЕР РАЗБОРА · ДАННЫЕ УСЛОВНЫЕ</span></div>
  <div class="stage">
    <div class="s-tile fx"><div class="tile"><div class="t1">Кабинет селлера</div><div class="t2">WB · OZON</div><div class="t3"><span>8 ТОВАРОВ</span><span>ОТКРЫТЬ →</span></div></div></div>
    <div class="s-grid fx">
      <div class="gh fx L"><span class="chip a">ВСЕ ТОВАРЫ · 8</span><span class="chip">WB · OZON</span><span class="chip">ПО ВЫДАЧЕ</span>
        <div class="prog"><span class="pl">ПРОВЕРЕНО <b class="pn">00</b> ПАРАМЕТРОВ</span><span class="pt"><i class="pf"></i></span></div></div>
      ${[0, 1].map(r => `<div class="gr fx L">${CARDS.slice(r * 4, r * 4 + 4).map(([s, st]) => `
        <div class="card"><div class="cth"><i style="${st}"></i></div><div class="csku">${s}</div><div class="cl"></div><div class="cl s"></div><div class="cst"><span>···</span></div></div>`).join('')}</div>`).join('')}
      <div class="scan"></div>
    </div>
    <div class="s-fun">
      <div class="fh fx L"><span><b>SKU-0417</b> · РАЗБОР ВОРОНКИ</span><span>ПЕРЕХОД ДАЛЬШЕ, %</span></div>
      <div class="fb">
        <div class="fl">
          ${FUN.map(f => `<div class="row fx L"><div class="trk"><div class="bar"></div>${f.hot ? '<div class="hotb"></div>' : ''}<span class="lb">${f.l}</span>${f.hot ? '<span class="cap">ЗДЕСЬ ТЕРЯЕТСЯ<br>БОЛЬШЕ ВСЕГО</span>' : ''}</div><div class="val">0,0</div></div>`).join('')}
          <div class="rsn"><div class="rh fx L">ПРИЧИНЫ ПОТЕРЬ</div>
            ${REASONS.map((r, i) => `<div class="rs fx L"><em>0${i + 1}</em><span>${r}</span></div>`).join('')}</div>
        </div>
        <div class="fr fx L">
          <div class="thumb">
            <div class="bf"><span class="tg">ДО</span>
              <i style="left:34%;right:34%;top:24%;bottom:16%;background:#3A3734"></i>
              <i style="left:8%;top:12%;width:42%;height:5%;background:#4A4743"></i>
              <i style="left:8%;top:20%;width:28%;height:4%;background:#3A3734"></i>
              <i style="left:68%;top:12%;width:24%;height:14%;border:1px solid #6B6762"></i>
              <i style="left:6%;top:62%;width:22%;height:12%;border:1px solid #6B6762"></i>
              <i style="left:70%;top:66%;width:22%;height:20%;background:#4A4743"></i>
              <i style="left:8%;top:84%;width:52%;height:3%;background:#3A3734"></i>
              <i style="left:8%;top:90%;width:36%;height:3%;background:#3A3734"></i>
            </div>
            <div class="af"><span class="tg">ПОСЛЕ</span>
              <i style="left:40%;right:14%;top:24%;bottom:10%;background:#0E0E0E"></i>
              <i style="left:8%;top:12%;width:58%;height:7%;background:#0E0E0E"></i>
              <i style="left:8%;top:23%;width:30%;height:3%;background:#6B6762"></i>
              <i style="left:8%;top:60%;width:4%;height:4%;background:#0E0E0E"></i><i style="left:15%;top:60.5%;width:18%;height:3%;background:#6B6762"></i>
              <i style="left:8%;top:69%;width:4%;height:4%;background:#0E0E0E"></i><i style="left:15%;top:69.5%;width:20%;height:3%;background:#6B6762"></i>
              <i style="left:8%;top:78%;width:4%;height:4%;background:#0E0E0E"></i><i style="left:15%;top:78.5%;width:15%;height:3%;background:#6B6762"></i>
            </div>
            <div class="dv"><b>↔</b></div>
          </div>
          <div class="tc"><span>ПЕРВЫЙ ЭКРАН</span><span>SKU-0417</span></div>
          <button class="build fx L" tabindex="-1">СОБРАТЬ ПЛАН</button>
        </div>
      </div>
    </div>
    <div class="plan">
      <div class="ph"><span>ПЛАН ПРИОРИТЕТОВ · SKU-0417</span><span>ПО ВЛИЯНИЮ</span></div>
      ${PLAN.map((p, i) => `<div class="pr fx L"><span class="n">0${i + 1}</span><span class="t">${p[0]}</span><span class="k">${p[1]}</span></div>`).join('')}
      <div class="pf2">ПОКАЗАТЕЛИ «ДО» ЗАФИКСИРОВАНЫ — ЭФФЕКТ ПРОВЕРЯЕМ ПОСЛЕ ИЗМЕНЕНИЙ</div>
    </div>
  </div>
  <div class="ring"></div>
  <svg class="cur" viewBox="0 0 20 22" width="20" height="22"><path d="M2 2 L2 17.5 L6.2 13.6 L9.1 20.2 L11.9 19 L9 12.6 L14.6 12.6 Z" fill="#fff" stroke="#0E0E0E" stroke-width="1" stroke-linejoin="round"/></svg>
</div></div>
<div class="foot"><button class="rp">↻ ПОКАЗАТЬ СНОВА</button><span class="fn">ДЕМОНСТРАЦИЯ МЕТОДА</span></div>`;

class KmDemo extends HTMLElement {
  connectedCallback() {
    if (this._r) return;
    const r = this._r = this.attachShadow({ mode: 'open' });
    r.innerHTML = `<style>${css}</style>${html}`;
    const q = s => r.querySelector(s), qa = s => [...r.querySelectorAll(s)];
    Object.assign(this, {
      panel: q('.panel'), inner: q('.inner'), tile: q('.s-tile'), grid: q('.s-grid'), gh: q('.gh'),
      rows: qa('.gr'), cards: qa('.card'), sts: qa('.cst'), scan: q('.scan'), pn: q('.pn'), pf: q('.pf'),
      fh: q('.fh'), frows: qa('.row'), bars: qa('.bar'), hotb: q('.hotb'), cap: q('.cap'), vals: qa('.val'),
      rh: q('.rh'), rs: qa('.rs'), fr: q('.fr'), thumb: q('.thumb'), af: q('.af'), dv: q('.dv'),
      build: q('.build'), plan: q('.plan'), prs: qa('.pr'), cur: q('.cur'), ring: q('.ring')
    });
    this.run = 0; this.clock = 0; this.last = null; this.waiters = []; this.visible = false; this.cx = 660; this.cy = 420; this.cs = 1;
    this.io = new IntersectionObserver(e => { this.visible = e[0].isIntersecting; }, { threshold: .2 });
    this.io.observe(this.panel);
    this.ro = new ResizeObserver(() => this.fit()); this.ro.observe(this.panel);
    q('.rp').addEventListener('click', () => this.start());
    this.mq = matchMedia('(max-width: 900px)');
    this.mq.addEventListener && this.mq.addEventListener('change', () => this.start());
    this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(() => this.start(), 250));
  }
  disconnectedCallback() { this.dead = true; this.run++; this.io && this.io.disconnect(); this.ro && this.ro.disconnect(); }

  loop(ts) {
    if (this.dead) return;
    if (this.last == null) this.last = ts;
    const dt = Math.min(ts - this.last, 50); this.last = ts;
    if (this.visible && !document.hidden) this.clock += dt;
    const c = this.clock;
    this.waiters = this.waiters.filter(w => {
      if (w.run !== this.run) return false;
      if (w.tick) { if (w.tick(c)) { w.res(); return false; } return true; }
      if (c >= w.at) { w.res(); return false; }
      return true;
    });
    requestAnimationFrame(this.loop);
  }
  wait(ms) { return new Promise(res => this.waiters.push({ run: this.run, at: this.clock + ms, res })); }
  tween(ms, fn, ease = easeInOut) {
    const t0 = this.clock; fn(0);
    return new Promise(res => this.waiters.push({ run: this.run, res, tick: c => { const p = Math.min(1, (c - t0) / ms); fn(ease(p)); return p >= 1; } }));
  }
  later(ms, fn) { this.wait(ms).then(fn); }
  stagger(els, gap, cls = 'on') { els.forEach((el, i) => this.later(i * gap, () => el.classList.add(cls))); }

  get W() { return this.m ? 360 : 600; }
  fit() { const k = this.panel.clientWidth / this.W; this.k = k; this.inner.style.transform = `scale(${k})`; }
  pt(el, fx = .5, fy = .5) {
    const ir = this.inner.getBoundingClientRect(), er = el.getBoundingClientRect(), k = ir.width / this.W;
    return [(er.left - ir.left + er.width * fx) / k, (er.top - ir.top + er.height * fy) / k];
  }
  setCursor(x, y, s) {
    this.cx = x; this.cy = y; if (s != null) this.cs = s;
    this.cur.style.transform = `translate3d(${x}px,${y}px,0) scale(${this.cs})`;
  }
  async moveTo([tx, ty], ms) {
    const sx = this.cx, sy = this.cy, dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    const ox = tx + ux * 3, oy = ty + uy * 3, bend = Math.min(80, d * .22);
    const mx = (sx + ox) / 2 - uy * bend, my = (sy + oy) / 2 + ux * bend;
    await this.tween(ms, p => { const a = (1 - p) * (1 - p), b = 2 * (1 - p) * p, c = p * p; this.setCursor(a * sx + b * mx + c * ox, a * sy + b * my + c * oy); }, easeCursor);
    await this.tween(170, p => this.setCursor(ox + (tx - ox) * p, oy + (ty - oy) * p));
  }
  ringAt() {
    const r = this.ring, tr = s => `translate3d(${this.cx - 16}px,${this.cy - 16}px,0) scale(${s})`;
    r.style.transition = 'none'; r.style.opacity = '.9'; r.style.transform = tr(.3); void r.offsetWidth;
    r.style.transition = `transform .3s ${E}, opacity .3s linear`; r.style.opacity = '0'; r.style.transform = tr(1);
  }
  async click() { this.ringAt(); await this.tween(180, p => this.setCursor(this.cx, this.cy, 1 - .18 * Math.sin(p * Math.PI)), p => p); this.setCursor(this.cx, this.cy, 1); }

  setBars(after, dur) {
    FUN.forEach((f, i) => {
      const w = after ? f.w1 : f.w0, clip = `inset(0 ${100 - w}% 0 0)`;
      this.bars[i].style.transitionDuration = dur || ''; this.bars[i].style.clipPath = clip;
      if (f.hot) { this.hotb.style.transitionDuration = dur || ''; this.hotb.style.clipPath = clip; }
    });
  }
  setVals(p, from, to) { FUN.forEach((f, i) => { this.vals[i].textContent = fmt(f[from] + (f[to] - f[from]) * p); }); }
  setCount(p) { FUN.forEach((f, i) => { this.vals[i].textContent = fmt(f.v0 * p); }); }
  setSplit(x) { this.af.style.clipPath = `inset(0 0 0 ${x}%)`; this.dv.style.transform = `translateX(${x / 100 * this.thumb.clientWidth}px)`; }
  setStatus(i) { const s = this.sts[i]; const bad = BAD.includes(i); s.className = 'cst ' + (bad ? 'bad' : 'ok'); s.firstChild.textContent = bad ? 'ПОТЕРИ' : 'НОРМА'; }

  reset() {
    const all = this._r.querySelectorAll('.on,.out,.gone,.p');
    this.inner.classList.add('nt');
    all.forEach(el => el.classList.remove('on', 'out', 'gone', 'p'));
    this.sts.forEach(s => { s.className = 'cst'; s.firstChild.textContent = '···'; });
    this.pn.textContent = '00'; this.pf.style.transform = 'scaleX(0)';
    this.scan.style.opacity = '0'; this.scan.style.transform = 'translateY(0)';
    this.bars.forEach(b => b.style.clipPath = 'inset(0 100% 0 0)'); this.hotb.style.clipPath = 'inset(0 100% 0 0)';
    this.setVals(0, 'v0', 'v0'); this.vals.forEach(v => v.textContent = '0,0');
    this.setSplit(88);
    this.cur.style.opacity = '0'; this.setCursor(660, 430, 1);
    void this.inner.offsetWidth; this.inner.classList.remove('nt');
  }
  final() {
    this.reset(); this.inner.classList.add('nt');
    this.tile.classList.add('out'); this.grid.classList.add('gone');
    [this.fh, ...this.frows, this.rh, ...this.rs, this.plan, ...this.prs, this.hotb, this.cap].forEach(el => el.classList.add('on'));
    if (this.m) { this.setBars(false); this.setVals(1, 'v0', 'v0'); }
    else { this.fr.classList.add('on'); this.build.classList.add('on', 'p'); this.setBars(true); this.setVals(1, 'v1', 'v1'); this.setSplit(10); }
    void this.inner.offsetWidth; this.inner.classList.remove('nt');
  }

  start() {
    if (!this._r) return;
    this.run++; this.waiters = [];
    const mode = this.getAttribute('mode') || this.mode;
    this.m = mode === 'mobile' || (mode !== 'desktop' && this.mq.matches);
    this.panel.classList.toggle('m', this.m); this.fit();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { this.final(); return; }
    this.reset();
    (this.m ? this.runMobile() : this.runDesktop()).catch(() => {});
  }

  async runMobile() {
    this.fh.classList.add('on');
    await this.wait(300);
    this.stagger(this.frows, 60); this.setBars(false);
    await this.tween(1000, p => this.setCount(p), easeOut);
    await this.wait(400);
    this.hotb.classList.add('on'); this.cap.classList.add('on');
    await this.wait(500);
    this.stagger([this.rh, ...this.rs], 90);
    await this.wait(1700);
    this.plan.classList.add('on');
    await this.wait(250);
    this.stagger(this.prs, 60);
  }

  async runDesktop() {
    await this.wait(250);
    this.tile.classList.add('on');                                   // такт 0
    await this.wait(750);
    this.cur.style.opacity = '1';                                    // такт 1
    await this.moveTo(this.pt(this.tile.firstElementChild, .62, .55), 1150);
    await this.wait(120);
    await this.click();                                              // такт 2
    this.tile.classList.remove('on'); this.tile.classList.add('out');
    this.stagger([this.gh, ...this.rows], 40);
    await this.wait(620);
    const gTop = this.pt(this.grid, 0, 0)[1], gH = this.grid.clientHeight;   // такт 3
    const rowMid = this.rows.map(r => this.pt(r, .5, .5)[1] - gTop);
    const fired = [false, false];
    this.scan.style.opacity = '1';
    await this.tween(2100, p => {
      const y = p * gH;
      this.scan.style.transform = `translateY(${y}px)`;
      this.pn.textContent = String(Math.round(48 * p)).padStart(2, '0');
      this.pf.style.transform = `scaleX(${p})`;
      rowMid.forEach((m, r) => { if (!fired[r] && y > m - 40) { fired[r] = true; [0, 1, 2, 3].forEach(j => this.later(j * 90, () => this.setStatus(r * 4 + j))); } });
    }, p => p);
    this.scan.style.opacity = '0';
    await this.wait(300);
    const card = this.cards[TARGET];                                 // такт 4
    await this.moveTo(this.pt(card, .5, .42), 720);
    await this.wait(80);
    await this.click();
    const [gx, gy] = this.pt(this.grid, 0, 0), [cx, cy] = this.pt(card);
    this.grid.style.transformOrigin = `${cx - gx}px ${cy - gy}px`;
    this.grid.classList.add('out');
    await this.wait(220);
    this.fh.classList.add('on');
    await this.wait(120);
    this.stagger(this.frows, 60);
    this.later(60, () => this.setBars(false));
    await this.tween(950, p => this.setCount(p), easeOut);
    await this.wait(250);
    this.hotb.classList.add('on');                                   // такт 5
    await this.wait(350);
    this.cap.classList.add('on');
    await this.wait(250);
    this.stagger([this.rh, ...this.rs], 90);
    await this.wait(1050);
    this.fr.classList.add('on');                                     // такт 6
    await this.wait(450);
    const [tx, ty] = this.pt(this.thumb, 0, .5), tw = this.thumb.getBoundingClientRect().width / this.k;
    await this.moveTo([tx + tw * .88, ty], 620);
    await this.tween(110, p => this.setCursor(this.cx, this.cy, 1 - .1 * p));
    this.setBars(true, '1.25s');
    await this.tween(1250, p => { const x = 88 - 78 * p; this.setSplit(x); this.setCursor(tx + tw * x / 100, ty); this.setVals(p, 'v0', 'v1'); });
    await this.tween(110, p => this.setCursor(this.cx, this.cy, .9 + .1 * p));
    await this.wait(250);
    this.build.classList.add('on');                                  // такт 7
    await this.wait(450);
    await this.moveTo(this.pt(this.build, .5, .5), 600);
    await this.click();
    this.build.classList.add('p');
    await this.wait(100);
    this.plan.classList.add('on');
    await this.wait(260);
    this.stagger(this.prs, 60);
    await this.wait(700);
    await this.moveTo([660, this.cy - 60], 900);                     // такт 8
    this.cur.style.opacity = '0';
  }
}
customElements.define('km-demo', KmDemo);
})();
