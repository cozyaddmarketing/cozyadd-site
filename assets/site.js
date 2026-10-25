const STORE_URL = 'https://smartstore.naver.com/cozyadd';
const PRODUCTS = window.COZYADD_PRODUCTS || [];
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

// 제품 목록: data-look="6"이면 앞의 6개만, 숫자가 없으면 전체
document.querySelectorAll('[data-look]').forEach((box) => {
  const n = Number(box.dataset.look) || PRODUCTS.length;
  PRODUCTS.slice(0, n).forEach((p) => {
    const item = document.createElement('article');
    item.className = 'look-item rise';
    const link = document.createElement('a');
    link.className = 'card-link';
    link.href = p.store || STORE_URL;
    link.target = '_blank';
    link.rel = 'noopener';
    const frame = document.createElement('div');
    frame.className = 'look-img';
    const img = document.createElement('div');
    if (p.image) {
      img.style.backgroundImage = `url("assets/img/${encodeURI(p.image)}")`;
      img.setAttribute('role', 'img');
      img.setAttribute('aria-label', p.name);
    } else {
      img.textContent = '제품 사진 자리';
    }
    frame.append(img);
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = p.name;
    const meta = document.createElement('p');
    meta.className = 'meta-line';
    meta.textContent = `${p.size} / ${p.fabric}`;
    const store = document.createElement('div');
    store.className = 'store';
    store.textContent = '가격은 스마트스토어에서';
    link.append(frame, name, meta, store);
    item.append(link);
    box.append(item);
  });
});

// 아래에서 밀려 올라오는 등장. 한 번 나타나면 다시 숨지 않는다
if (!calm && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('motion');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.rise').forEach((el) => { if (!el.closest('.hero')) io.observe(el); });
}

// 문의 폼
const form = document.getElementById('inquiry-form');
if (form) {
  const msg = document.getElementById('inquiry-msg');
  const show = (text, ok) => { msg.className = 'msg ' + (ok ? 'ok' : 'err'); msg.textContent = text; msg.hidden = false; };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const f = form.elements;
    msg.hidden = true;
    if (!f['name'].value.trim() || !f['contact'].value.trim()) return show('이름과 연락처를 적어 주세요');
    if (!f['consent'].checked) return show('개인정보 수집·이용에 동의해 주세요');
    btn.disabled = true;
    try {
      const body = { name: f['name'].value, contact: f['contact'].value, message: f['message'].value, website: f['website'].value, consent: f['consent'].checked };
      const r = await fetch('/api/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || '보내지 못했어요. 잠시 뒤 다시 시도하거나 카카오톡으로 문의해 주세요.');
      form.reset();
      show('문의가 접수됐어요. 확인 후 연락드릴게요.', true);
    } catch (err) {
      show(err.message || '보내지 못했어요. 잠시 뒤 다시 시도하거나 카카오톡으로 문의해 주세요.');
    } finally {
      btn.disabled = false;
    }
  });
}
