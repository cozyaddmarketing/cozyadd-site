// 회원가입·로그인 공통. 공개 키는 /api/auth-config에서 받아 온다(코드에 값을 적지 않는다).
const TOKEN_KEY = 'cozyadd_member_token';
let authConf = null;

async function getConf() {
  if (authConf) return authConf;
  const r = await fetch('/api/auth-config');
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || '로그인 설정을 불러오지 못했어요.');
  authConf = data;
  return data;
}

async function authFetch(path, body, token) {
  const { url, key } = await getConf();
  const headers = { apikey: key, 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(url + path, { method: 'POST', headers, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

function showMsg(el, text, ok) {
  el.className = 'msg ' + (ok ? 'ok' : 'err');
  el.textContent = text;
  el.hidden = false;
}

// 회원가입
const signupForm = document.getElementById('signup-form');
if (signupForm) {
  const msg = document.getElementById('signup-msg');
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = signupForm.elements;
    if (f['password'].value.length < 8) return showMsg(msg, '비밀번호는 8자 이상으로 정해 주세요.');
    if (!f['consent'].checked) return showMsg(msg, '개인정보 수집·이용에 동의해 주세요.');
    try {
      const { ok, data } = await authFetch('/auth/v1/signup', {
        email: f['email'].value.trim(),
        password: f['password'].value,
        data: { consent: true, consent_at: new Date().toISOString() },
      });
      if (!ok) return showMsg(msg, data.msg && /registered/i.test(data.msg) ? '이미 가입한 이메일이에요. 로그인해 주세요.' : '가입하지 못했어요. 이메일과 비밀번호를 확인해 주세요.');
      signupForm.reset();
      if (data.access_token) {
        sessionStorage.setItem(TOKEN_KEY, data.access_token);
        location.href = 'members.html';
      } else {
        showMsg(msg, '확인 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요.', true);
      }
    } catch (err) { showMsg(msg, err.message); }
  });
}

// 로그인
const loginForm = document.getElementById('login-form');
if (loginForm) {
  const msg = document.getElementById('login-msg');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = loginForm.elements;
    try {
      const { ok, data } = await authFetch('/auth/v1/token?grant_type=password', { email: f['email'].value.trim(), password: f['password'].value });
      if (!ok || !data.access_token) {
        f['password'].value = '';
        return showMsg(msg, '이메일 또는 비밀번호가 맞지 않아요.');
      }
      sessionStorage.setItem(TOKEN_KEY, data.access_token);
      location.href = 'members.html';
    } catch (err) { showMsg(msg, err.message); }
  });

  const recover = document.getElementById('recover');
  recover.addEventListener('click', async () => {
    const email = loginForm.elements['email'].value.trim();
    if (!email) return showMsg(msg, '이메일을 먼저 적어 주세요.');
    try {
      await authFetch('/auth/v1/recover', { email });
      showMsg(msg, '메일을 확인해 주세요.', true);
    } catch (err) { showMsg(msg, err.message); }
  });
}

// 회원 페이지
const membersBox = document.getElementById('members-box');
if (membersBox) {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) location.replace('login.html');
  else {
    fetch('/api/members', { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (r.status === 401) { sessionStorage.removeItem(TOKEN_KEY); location.replace('login.html'); return; }
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || '불러오지 못했어요.');
        document.getElementById('member-email').textContent = data.email;
        const list = document.getElementById('benefits');
        (data.benefits || []).forEach((b) => { const li = document.createElement('li'); li.textContent = b; list.append(li); });
        document.getElementById('member-content').textContent = data.content || '';
        membersBox.hidden = false;
      })
      .catch((err) => { document.getElementById('member-content').textContent = err.message; membersBox.hidden = false; });
  }

  document.getElementById('logout').addEventListener('click', async () => {
    try { await authFetch('/auth/v1/logout', null, sessionStorage.getItem(TOKEN_KEY)); } catch {}
    sessionStorage.removeItem(TOKEN_KEY);
    location.href = '/';
  });
}
