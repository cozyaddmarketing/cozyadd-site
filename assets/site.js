const STORE_URL = 'https://smartstore.naver.com/cozyadd';
const PRODUCTS = window.COZYADD_PRODUCTS || [];
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function imgStyle(el, p) {
  if (p.image) {
    el.style.backgroundImage = `url("assets/img/${encodeURI(p.image)}")`;
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', p.name);
  } else {
    el.textContent = '제품 사진 자리';
  }
}

function storeLink(p, text) {
  const a = document.createElement('a');
  a.href = p.store || STORE_URL;
  a.target = '_blank';
  a.rel = 'noopener';
  a.textContent = text;
  return a;
}

// 포털 첫 화면: 모든 값이 스크롤 위치에 묶여 있어서 위로 올리면 다시 닫힌다
const portal = document.getElementById('portal');
if (portal && !calm) {
  portal.classList.add('on');
  const s = portal.querySelector('.stage').style;
  const copy = document.getElementById('hero-copy');
  const disc = document.querySelector('.disc');
  const titleA = portal.querySelector('.title .a');
  const titleB = portal.querySelector('.title .b');
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  let ticking = false;
  const draw = () => {
    ticking = false;
    const run = portal.offsetHeight - innerHeight;
    const p = clamp((scrollY - portal.offsetTop) / run, 0, 1);
    const open = ease(clamp(p / 0.7, 0, 1));
    s.setProperty('--pl', `${-open * 101}%`);
    s.setProperty('--pr', `${open * 101}%`);
    s.setProperty('--img-scale', (1.14 - 0.14 * open).toFixed(4));
    s.setProperty('--duo', (0.22 * open).toFixed(3));
    s.setProperty('--dax', `${-open * 38}vw`);
    s.setProperty('--day', `${-open * 34}vh`);
    s.setProperty('--dbx', `${open * 38}vw`);
    s.setProperty('--dby', `${open * 34}vh`);
    s.setProperty('--t-scale', (1 + 0.16 * open).toFixed(4));
    s.setProperty('--track', `${(0.06 - 0.1 * open).toFixed(4)}em`);
    // 반쪽들이 화면 밖으로 잘리지 않게, 자기 너비의 절반과 남은 여백 중 작은 만큼만 벌린다
    const tScale = 1 + 0.16 * open;
    const room = Math.max(0, (innerWidth / tScale - titleA.offsetWidth - titleB.offsetWidth) / 2 - 20 / tScale);
    const shift = Math.min(titleA.offsetWidth / 2, room);
    s.setProperty('--ta', `${-open * shift}px`);
    s.setProperty('--tb', `${open * shift}px`);
    const c = clamp((p - 0.45) / 0.3, 0, 1);
    s.setProperty('--copy', c.toFixed(3));
    copy.classList.toggle('hide', c < 0.05);
    if (disc) {
      const r = disc.getBoundingClientRect();
      const d = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      disc.style.setProperty('--disc-y', `${(d * -80).toFixed(1)}px`);
      disc.style.setProperty('--disc-r', `${(d * -30).toFixed(1)}deg`);
    }
  };
  const ask = () => { if (!ticking) { ticking = true; requestAnimationFrame(draw); } };
  addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', ask);
  draw();
}

// 한 번만 나타나는 등장 효과. 움직임 줄이기 설정이면 처음부터 다 보인다
if (!calm && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('motion');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
}

// 카드 덱: 끌어서 던지거나 ← → 키로 넘긴다
const deck = document.getElementById('deck');
if (deck && PRODUCTS.length) {
  const dotsBox = document.getElementById('deck-dots');
  let order = PRODUCTS.map((_, i) => i);
  const cards = PRODUCTS.map((p) => {
    const c = document.createElement('article');
    c.className = 'card';
    const img = document.createElement('div');
    img.className = 'img';
    imgStyle(img, p);
    const txt = document.createElement('div');
    txt.className = 'txt';
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = p.name;
    const spec = document.createElement('div');
    spec.className = 'spec';
    spec.textContent = `${p.size} / ${p.fabric}`;
    txt.append(name, spec, storeLink(p, '스마트스토어에서 가격 보기'));
    c.append(img, txt);
    deck.append(c);
    return c;
  });
  PRODUCTS.forEach(() => dotsBox.append(document.createElement('span')));

  const layout = () => {
    order.forEach((idx, depth) => {
      const c = cards[idx];
      const d = Math.min(depth, 4);
      c.style.zIndex = String(PRODUCTS.length - depth);
      c.style.transform = `translate(${d * 10}px, ${-d * 8}px) scale(${1 - d * 0.04}) rotate(${d * 1.6}deg)`;
      c.style.opacity = depth > 4 ? '0' : '1';
      c.setAttribute('aria-hidden', String(depth !== 0));
      c.querySelectorAll('a').forEach((a) => { a.tabIndex = depth === 0 ? 0 : -1; });
    });
    [...dotsBox.children].forEach((d, i) => d.classList.toggle('on', i === order[0]));
  };

  const throwTop = (dir) => {
    const top = cards[order[0]];
    const w = deck.offsetWidth;
    top.classList.remove('drag');
    top.style.transform = `translate(${dir * w * 1.1}px, -40px) rotate(${dir * 22}deg)`;
    top.style.opacity = '0';
    const moved = order.shift();
    order.push(moved);
    setTimeout(layout, calm ? 0 : 320);
  };
  const back = () => { order.unshift(order.pop()); layout(); };

  let start = null;
  deck.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a')) return;
    const top = cards[order[0]];
    start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    deck.setPointerCapture(e.pointerId);
    top.classList.add('drag');
  });
  deck.addEventListener('pointermove', (e) => {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x;
    const dy = (e.clientY - start.y) * 0.3;
    cards[order[0]].style.transform = `translate(${dx}px, ${dy}px) rotate(${dx * 0.06}deg) scale(1.02)`;
  });
  const end = (e) => {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x;
    start = null;
    if (Math.abs(dx) > deck.offsetWidth * 0.1) throwTop(Math.sign(dx));
    else { cards[order[0]].classList.remove('drag'); layout(); }
  };
  deck.addEventListener('pointerup', end);
  deck.addEventListener('pointercancel', end);
  deck.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); throwTop(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
  });
  layout();
}

// 룩북 페이지: 전 제품 목록
document.querySelectorAll('[data-look]').forEach((box) => {
  PRODUCTS.forEach((p) => {
    const item = document.createElement('article');
    item.className = 'look-item';
    const img = document.createElement('div');
    img.className = 'look-img';
    imgStyle(img, p);
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = p.name;
    const meta = document.createElement('div');
    meta.className = 'meta-line';
    meta.textContent = `${p.size} / ${p.fabric}`;
    const link = storeLink(p, '스마트스토어에서 가격 보기');
    link.className = 'store';
    item.append(img, name, meta, link);
    box.append(item);
  });
});

// 문의 폼
const form = document.getElementById('inquiry-form');
if (form) {
  const msg = document.getElementById('inquiry-msg');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const f = form.elements;
    msg.hidden = true;
    if (!f['name'].value.trim() || !f['contact'].value.trim()) {
      msg.className = 'msg err'; msg.textContent = '이름과 연락처를 적어 주세요'; msg.hidden = false; return;
    }
    if (!f['consent'].checked) {
      msg.className = 'msg err'; msg.textContent = '개인정보 수집·이용에 동의해 주세요'; msg.hidden = false; return;
    }
    btn.disabled = true;
    try {
      const body = { name: f['name'].value, contact: f['contact'].value, message: f['message'].value, website: f['website'].value, consent: f['consent'].checked };
      const r = await fetch('/api/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || '보내지 못했어요. 잠시 뒤 다시 시도하거나 카카오톡으로 문의해 주세요.');
      form.reset();
      msg.className = 'msg ok';
      msg.textContent = '문의가 접수됐어요. 확인 후 연락드릴게요.';
    } catch (err) {
      msg.className = 'msg err';
      msg.textContent = err.message || '보내지 못했어요. 잠시 뒤 다시 시도하거나 카카오톡으로 문의해 주세요.';
    } finally {
      msg.hidden = false;
      btn.disabled = false;
    }
  });
}
