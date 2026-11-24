(() => {
const WORDS = window.WORDS.map(x => ({ ...x, id: x.w }));
const BY = Object.fromEntries(WORDS.map(x => [x.id, x]));
const $app = document.getElementById('app');

/* ── icons: 단색 라인 아이콘 ── */
const P = {
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  quiz: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 115 .6c0 1.7-2.5 2-2.5 3.6M12 17v.1"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
  eyeoff: '<path d="M3 3l18 18M10 6a9 9 0 012-.5c6 0 9.5 6.5 9.5 6.5a16 16 0 01-3 3.7M6.3 7.6A16 16 0 002.5 12S6 18.5 12 18.5a9 9 0 004-.9"/>',
  book: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5C4.7 19 4 19.7 4 20.5V5.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5.7 1.5 1.5V5.5z"/>',
  seal: '<rect x="4.5" y="4.5" width="15" height="15" rx="1.5"/><path d="M9 9h6M12 9v6M9 15h6"/>',
  image: '<rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5"/>',
  note: '<path d="M6 3.5h9l4 4V20.5H6z"/><path d="M14.5 3.5V8H19M9 12.5h7M9 16h5"/>',
  link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
  retry: '<path d="M20 12a8 8 0 11-2.6-5.9M20 4v5h-5"/>'
};
const ico = n => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;

/* ── 저장소 ── */
const store = {
  get() { try { return JSON.parse(localStorage.getItem('malgyeol') || '{}'); } catch { return {}; } },
  set(s) { try { localStorage.setItem('malgyeol', JSON.stringify(s)); } catch {} }
};
const S = () => { const s = store.get(); s.done = s.done || {}; s.wrong = s.wrong || {}; return s; };
const markDone = id => { const s = S(); s.done[id] = 1; store.set(s); };
const addWrong = id => { const s = S(); s.wrong[id] = (s.wrong[id] || 0) + 1; store.set(s); };
const clearWrong = id => { const s = S(); delete s.wrong[id]; store.set(s); };

/* ── 유틸 ── */
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const uniq = a => [...new Set(a)];
const rnd = a => a[Math.random() * a.length | 0];
const sentHTML = (t, mode = 'mark') => t.replace(/\[\[(.+?)\]\]/g, (_, w) =>
  mode === 'mark' ? `<mark>${w}</mark>` : `<button class="blank" data-w="${w}" aria-label="빈칸 보기">${w}</button>`);
const blankText = t => t.replace(/\[\[(.+?)\]\]/g, '＿＿＿＿');
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const chosung = s => [...s].map(c => { const k = c.charCodeAt(0) - 0xAC00; return k >= 0 && k < 11172 ? CHO[k / 588 | 0] : c; }).join('');
const setNav = k => document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === k));
const hj = w => w.h ? `<span class="qh">${w.h}</span>` : '';

/* ── 퀴즈 유형 ── */
const KINDS = [
  ['mix', '종합', '모든 유형을 섞어서'],
  ['meaning', '뜻 → 단어', '뜻을 보고 단어 고르기'],
  ['word2mean', '단어 → 뜻', '단어의 알맞은 뜻 고르기'],
  ['blank', '문장 빈칸', '문장에 어울리는 단어'],
  ['sensemean', '예문 속 뜻', '문장 속 단어의 뜻'],
  ['colloc', '어울리는 말', '짝이 되는 표현 완성'],
  ['hanja', '한자 풀이', '한자 풀이로 단어 찾기'],
  ['hanjaeum', '한자 훈음', '한자의 훈과 음 맞히기'],
  ['syn', '비슷한 말', '유의어 찾기'],
  ['ant', '반대말', '반의어 찾기'],
  ['chosung', '초성 퀴즈', '직접 입력해서 맞히기'],
  ['ox', 'O / X', '설명이 맞는지 판단'],
  ['match', '짝 맞추기', '단어와 뜻 연결하기']
];
const KIND_LABEL = Object.fromEntries(KINDS.map(k => [k[0], k[1]]));
const applicable = (w, kind) => {
  if (kind === 'syn') return w.syn.length > 0;
  if (kind === 'ant') return w.ant.length > 0;
  if (kind === 'hanja' || kind === 'hanjaeum') return w.parts.length > 0;
  if (kind === 'colloc') return w.colloc.some(c => c.includes(w.w));
  return true;
};
const sameLv = w => WORDS.filter(x => x.id !== w.id && x.lv === w.lv);
const pickWords = (w, n = 3) => shuffle(sameLv(w)).slice(0, n);
const choose = (ans, pool, n = 3) => shuffle([ans, ...shuffle(uniq(pool.filter(x => x !== ans))).slice(0, n)]);
const expl = w => `<b>${w.w}</b>${w.h ? ` (${w.h})` : ''} — ${w.mean}`;

function makeQ(w, kind) {
  if (!applicable(w, kind)) kind = 'meaning';
  const base = { id: w.id, word: w, type: 'choice', kindKey: kind, kind: KIND_LABEL[kind] };
  const wordOpts = () => choose(w.w, pickWords(w).map(x => x.w));
  switch (kind) {
    case 'word2mean':
      return { ...base, text: `‘${w.w}’${hj(w)}의 뜻으로 알맞은 것은?`, opts: choose(w.mean, pickWords(w, 3).map(x => x.mean)), ans: w.mean, long: true, exp: expl(w) };
    case 'blank': {
      const s = rnd(w.s);
      return { ...base, text: blankText(s[0]), opts: wordOpts(), ans: w.w, exp: sentHTML(s[0]) };
    }
    case 'sensemean': {
      const s = rnd(w.s);
      return { ...base, text: `${sentHTML(s[0])}<br><span class="qsub">여기서 밑줄 친 말의 뜻은?</span>`, opts: choose(w.mean, pickWords(w, 3).map(x => x.mean)), ans: w.mean, long: true, exp: expl(w) };
    }
    case 'colloc': {
      const c = rnd(w.colloc.filter(c => c.includes(w.w)));
      return { ...base, text: `빈칸에 알맞은 단어는?<br><span class="qbig">${c.replace(w.w, '＿＿＿＿')}</span>`, opts: wordOpts(), ans: w.w, exp: `<b>${c}</b> — ${w.mean}` };
    }
    case 'hanja':
      return { ...base, text: w.parts.map(p => `<span class="qc">${p[0]}</span>(${p[1]} ${p[2]})`).join(' + ') + ' 의 풀이를 가진 단어는?', opts: wordOpts(), ans: w.w, exp: expl(w) };
    case 'hanjaeum': {
      const p = rnd(w.parts), key = p[1] + ' ' + p[2];
      const pool = uniq(WORDS.flatMap(x => x.parts.map(q => q[1] + ' ' + q[2])));
      return { ...base, text: `‘${w.h}’에서 <span class="qc">${p[0]}</span>의 훈과 음은?`, opts: choose(key, pool), ans: key, exp: `<b>${p[0]}</b> = ${key} — ${expl(w)}` };
    }
    case 'syn': {
      const ans = rnd(w.syn);
      const ban = new Set([w.w, ...w.syn, ...w.ant]);
      const pool = WORDS.flatMap(x => x.id === w.id ? [] : [x.w, ...x.syn]).filter(x => !ban.has(x));
      return { ...base, text: `‘${w.w}’${hj(w)}와(과) 뜻이 비슷한 말은?`, opts: choose(ans, pool), ans, exp: `${expl(w)}<br>비슷한 말: ${w.syn.join(', ')}` };
    }
    case 'ant': {
      const ans = rnd(w.ant);
      const ban = new Set([w.w, ...w.syn, ...w.ant]);
      const pool = WORDS.flatMap(x => x.id === w.id ? [] : [...x.ant, ...x.syn]).filter(x => !ban.has(x));
      return { ...base, text: `‘${w.w}’${hj(w)}와(과) 뜻이 반대되는 말은?`, opts: choose(ans, pool), ans, exp: `${expl(w)}<br>반대말: ${w.ant.join(', ')}` };
    }
    case 'chosung':
      return { ...base, type: 'type', text: `뜻을 읽고 단어를 입력하세요.<br><span class="qbig">${chosung(w.w)}</span><span class="qsub">${w.mean}</span>`, ans: w.w, exp: expl(w) };
    case 'ox': {
      const yes = Math.random() < .5, o = rnd(sameLv(w));
      return { ...base, text: `‘${w.w}’${hj(w)}은(는) “${yes ? w.mean : o.mean}” 라는 뜻이다.`, opts: ['맞다', '틀리다'], ans: yes ? '맞다' : '틀리다', exp: expl(w) };
    }
    case 'match': {
      const set = [w, ...pickWords(w, 3)];
      return { ...base, type: 'match', text: '단어와 뜻을 짝지어 보세요.', set, ans: '', exp: set.map(expl).join('<br>') };
    }
    default:
      return { ...base, kindKey: 'meaning', kind: KIND_LABEL.meaning, text: `“${w.mean}”<br><span class="qsub">이라는 뜻의 단어는?</span>`, opts: wordOpts(), ans: w.w, exp: expl(w) };
  }
}

/* ── 퀴즈 진행 ── */
function runQuiz(el, qs, onEnd, meta = {}) {
  let i = 0, ok = 0; const wrongIds = [];
  const show = () => {
    const q = qs[i];
    el.innerHTML = `<div class="qwrap"><div class="qmeta"><span>${meta.title || '퀴즈'}</span><span>${i + 1} / ${qs.length}</span></div>
      <div class="bar"><i style="width:${i / qs.length * 100}%"></i></div>
      <div class="qbox"><div class="qkind">${q.kind}</div><p class="qtext">${q.text}</p>
      <div id="qa"></div><div class="fb" id="fb"></div></div></div>`;
    const qa = el.querySelector('#qa');
    const resolve = (right, msg, wrongList = [q.id]) => {
      if (right) { ok++; q.type === 'match' ? q.set.forEach(x => clearWrong(x.id)) : clearWrong(q.id); }
      else wrongList.forEach(id => { addWrong(id); wrongIds.push(id); });
      el.querySelector('#fb').innerHTML = `<b>${right ? '정답입니다.' : msg}</b><div class="exp">${q.exp}</div>
        <div style="margin-top:16px"><button class="btn" id="nx">${i + 1 < qs.length ? '다음' : '결과 보기'} ${ico('next')}</button></div>`;
      el.querySelector('#nx').onclick = () => { i++; i < qs.length ? show() : onEnd(ok, qs.length, uniq(wrongIds)); };
      el.querySelector('#nx').focus();
    };
    if (q.type === 'choice') {
      qa.innerHTML = `<div class="opts ${q.long ? 'long' : ''}">${q.opts.map((o, k) => `<button class="opt" data-k="${k}">${o}</button>`).join('')}</div>`;
      qa.querySelectorAll('.opt').forEach(b => b.onclick = () => {
        const right = q.opts[b.dataset.k] === q.ans;
        qa.querySelector('.opts').classList.add('lock');
        qa.querySelectorAll('.opt').forEach(x => { if (q.opts[x.dataset.k] === q.ans) x.classList.add('ok'); });
        if (!right) b.classList.add('no');
        resolve(right, `정답은 ‘${q.ans}’입니다.`);
      });
    } else if (q.type === 'type') {
      qa.innerHTML = `<form class="tform" autocomplete="off"><input id="ti" class="tin" placeholder="정답 입력" aria-label="정답 입력"><button class="btn" type="submit">확인</button><button class="btn ghost" type="button" id="skip">모르겠어요</button></form>`;
      const inp = qa.querySelector('#ti'); inp.focus();
      const lock = () => { inp.disabled = true; qa.querySelectorAll('button').forEach(b => b.disabled = true); };
      qa.querySelector('form').onsubmit = e => {
        e.preventDefault();
        const v = inp.value.replace(/\s/g, ''); if (!v) return;
        const right = v === q.ans; lock(); inp.classList.add(right ? 'okin' : 'noin');
        resolve(right, `정답은 ‘${q.ans}’입니다.`);
      };
      qa.querySelector('#skip').onclick = () => { lock(); resolve(false, `정답은 ‘${q.ans}’입니다.`); };
    } else if (q.type === 'match') {
      const L = shuffle(q.set), R = shuffle(q.set);
      let sel = null, left = q.set.length; const bad = new Set();
      qa.innerHTML = `<div class="match"><div class="mcol">${L.map(x => `<button class="mbtn" data-s="L" data-id="${x.id}">${x.w}</button>`).join('')}</div>
        <div class="mcol">${R.map(x => `<button class="mbtn sm" data-s="R" data-id="${x.id}">${x.mean}</button>`).join('')}</div></div>`;
      qa.querySelectorAll('.mbtn').forEach(b => b.onclick = () => {
        if (b.classList.contains('ok')) return;
        if (b.dataset.s === 'L') { qa.querySelectorAll('[data-s="L"]').forEach(x => x.classList.remove('sel')); sel = b; b.classList.add('sel'); return; }
        if (!sel) return;
        if (sel.dataset.id === b.dataset.id) {
          sel.classList.remove('sel'); sel.classList.add('ok'); b.classList.add('ok'); sel = null;
          if (--left === 0) resolve(bad.size === 0, '몇 개를 잘못 연결했어요.', [...bad]);
        } else {
          bad.add(sel.dataset.id); b.classList.add('no'); setTimeout(() => b.classList.remove('no'), 500);
        }
      });
    }
  };
  show();
}

/* ── 홈 ── */
const view = { lv: '전체', st: '전체', q: '', n: 60 };
function home() {
  setNav('home');
  const s = S();
  const doneN = WORDS.filter(x => s.done[x.id]).length;
  const list = () => WORDS.filter(x =>
    (view.lv === '전체' || x.lv === view.lv) &&
    (view.st === '전체' || (view.st === '학습 완료' ? s.done[x.id] : !s.done[x.id])) &&
    (!view.q || x.w.includes(view.q) || x.h.includes(view.q) || x.mean.includes(view.q)))
    .sort((a, b) => a.w.localeCompare(b.w, 'ko'));
  const seg = (key, arr) => `<div class="seg" data-k="${key}">${arr.map(v => `<button class="${view[key] === v ? 'on' : ''}" data-v="${v}">${v}</button>`).join('')}</div>`;
  $app.innerHTML = `
    <section class="hero"><div>
      <p class="eyebrow">Korean Vocabulary</p>
      <h1>어휘의 결을 따라,<br>문장으로 익히는 국어</h1>
      <p>중급·고급 어휘를 한자 풀이와 쉬운 설명으로 이해하고, 서로 다른 맥락의 문장 속에서 쓰임을 몸에 익힙니다.</p>
    </div>
    <div class="stat"><div><b>${WORDS.length}</b><span>수록 어휘</span></div><div><b>${doneN}</b><span>학습 완료</span></div></div></section>
    <div class="bar"><i style="width:${doneN / WORDS.length * 100}%"></i></div>
    <div class="tools">
      ${seg('lv', ['전체', '중급', '고급'])}${seg('st', ['전체', '미학습', '학습 완료'])}
      <label class="search">${ico('search')}<input id="q" placeholder="단어·한자·뜻 검색" value="${view.q}"></label>
      <span class="spacer"></span>
      <button class="btn" id="go">${ico('play')} 이어서 학습</button>
    </div>
    <div id="grid"></div>`;
  const draw = () => {
    const L = list();
    const g = document.getElementById('grid');
    if (!L.length) { g.innerHTML = '<p class="empty">조건에 맞는 단어가 없습니다.</p>'; return; }
    g.innerHTML = `<div class="grid">${L.slice(0, view.n).map(x => `
      <a class="wcard" href="#/word/${encodeURIComponent(x.id)}">
        ${s.done[x.id] ? `<span class="done">${ico('check')}</span>` : ''}
        <div class="w">${x.w}<span class="h">${x.h}</span></div>
        <div class="m">${x.mean}</div>
        <span class="tag ${x.lv === '고급' ? 'hi' : ''}">${x.lv}</span></a>`).join('')}</div>
      ${L.length > view.n ? `<button class="btn ghost more" id="more">더 보기 (${L.length - view.n})</button>` : ''}`;
    const m = document.getElementById('more'); if (m) m.onclick = () => { view.n += 60; draw(); };
  };
  draw();
  $app.querySelectorAll('.seg').forEach(sg => sg.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    view[sg.dataset.k] = b.dataset.v; view.n = 60; home();
  });
  document.getElementById('q').oninput = e => { view.q = e.target.value.trim(); view.n = 60; draw(); };
  document.getElementById('go').onclick = () => {
    const pool = WORDS.filter(x => (view.lv === '전체' || x.lv === view.lv) && !s.done[x.id]);
    const w = (pool.length ? pool : WORDS)[0];
    location.hash = '#/word/' + encodeURIComponent(w.id);
  };
}

/* ── 단어 학습 ── */
function wordView(id, step = 1) {
  setNav('home');
  const w = BY[id]; if (!w) return home();
  const idx = WORDS.indexOf(w);
  $app.innerHTML = `
    <a class="crumb" href="#/">${ico('back')} 어휘 목록</a>
    <div class="wh"><div><div class="big">${w.w}${w.h ? `<small>${w.h}</small>` : ''}</div><p class="pos">${w.lv} · ${w.pos}</p></div>
      <span class="tag ${w.lv === '고급' ? 'hi' : ''}">${w.lv}</span></div>
    <div class="steps" id="steps">
      <button data-s="1"><i>1</i>단어 풀이</button><button data-s="2"><i>2</i>예문 학습</button><button data-s="3"><i>3</i>확인 문제</button></div>
    <div class="panel" id="panel"></div>`;
  const P1 = () => `
    <p class="lead">${w.mean}</p>
    ${w.parts.length ? `<div class="hanjas">${w.parts.map((p, i) => `${i ? '<span class="plus">+</span>' : ''}<div class="hj"><b>${p[0]}</b><span>${p[1]} ${p[2]}</span></div>`).join('')}</div>` : ''}
    <div class="blocks">
      <div class="blk accent"><h3>${ico('book')} 쉽게 풀어 보면</h3><p>${w.easy}</p></div>
      <div class="two">
        <div class="blk"><h3>${ico('image')} 이렇게 떠올려 보세요</h3><p>${w.img}</p></div>
        <div class="blk"><h3>${ico('note')} 뉘앙스와 주의</h3><p>${w.nuance}</p></div>
      </div>
      <div class="two">
        <div class="blk"><h3>${ico('link')} 자주 어울리는 말</h3><div class="chips">${w.colloc.map(c => `<span class="chip">${c}</span>`).join('')}</div></div>
        <div class="blk"><h3>${ico('seal')} 비슷한 말 · 반대말</h3><div class="chips">
          ${w.syn.map(c => `<span class="chip">${c}</span>`).join('')}${w.ant.map(c => `<span class="chip" style="border-style:dashed">↔ ${c}</span>`).join('') || ''}</div></div>
      </div>
    </div>
    <div class="nextbar"><span></span><button class="btn" data-go="2">예문으로 익히기 ${ico('next')}</button></div>`;
  const P2 = () => `
    <p class="hint">같은 단어가 서로 다른 맥락에서 어떻게 쓰이는지 살펴보세요. ‘빈칸으로 연습’을 켜고 빈칸을 눌러 떠올려 본 뒤 확인할 수 있어요.</p>
    <div class="tools"><button class="btn ghost" id="tg">${ico('eyeoff')} 빈칸으로 연습</button></div>
    <div class="sents" id="sents">${sentList(false)}</div>
    <div class="nextbar"><button class="btn ghost" data-go="1">${ico('back')} 단어 풀이</button><button class="btn" data-go="3">확인 문제 ${ico('next')}</button></div>`;
  const sentList = blank => w.s.map((t, i) => `
    <div class="sent"><span class="no">${i + 1}</span><div class="tx">${sentHTML(t[0], blank ? 'blank' : 'mark')}<div class="ctx">${t[1]}</div></div></div>`).join('');
  const P3 = () => `<div id="qz"></div>`;
  const go = s => { wordView(id, s); };
  const panel = document.getElementById('panel');
  panel.innerHTML = [P1, P2, P3][step - 1]();
  document.querySelectorAll('#steps button').forEach(b => { b.classList.toggle('on', +b.dataset.s === step); b.onclick = () => go(+b.dataset.s); });
  panel.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { go(+b.dataset.go); window.scrollTo({ top: 0 }); });
  if (step === 2) {
    let blank = false;
    document.getElementById('tg').onclick = e => {
      blank = !blank;
      document.getElementById('sents').innerHTML = sentList(blank);
      e.currentTarget.innerHTML = blank ? `${ico('eye')} 단어 보이기` : `${ico('eyeoff')} 빈칸으로 연습`;
    };
    document.getElementById('sents').onclick = e => { const b = e.target.closest('.blank'); if (b) b.classList.toggle('show'); };
  }
  if (step === 3) {
    const kinds = shuffle(['word2mean', 'blank', 'sensemean', 'colloc', 'hanja', 'hanjaeum', 'syn', 'ant', 'chosung', 'ox', 'match'].filter(k => applicable(w, k))).slice(0, 5);
    const qs = [makeQ(w, 'meaning'), ...kinds.map(k => makeQ(w, k))];
    runQuiz(document.getElementById('qz'), qs, (ok, n) => {
      const pass = ok >= Math.ceil(n * .6);
      if (pass) markDone(id);
      const next = WORDS[(idx + 1) % WORDS.length];
      document.getElementById('qz').innerHTML = `<div class="result"><div class="score">${ok}<span style="font-size:.4em;color:var(--sub)"> / ${n}</span></div>
        <p>${pass ? `‘${w.w}’을(를) 학습 완료로 기록했어요.` : '조금 더 익힌 뒤 다시 도전해 보세요.'}</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="btn ghost" data-go="1">${ico('retry')} 다시 학습</button>
        <a class="btn" href="#/word/${encodeURIComponent(next.id)}">다음 단어 ‘${next.w}’ ${ico('next')}</a></div></div>`;
      document.querySelectorAll('#qz [data-go]').forEach(b => b.onclick = () => go(+b.dataset.go));
    }, { title: `${w.w} 확인 문제` });
  }
}

/* ── 종합 퀴즈 ── */
const qopt = { kind: 'mix', scope: '전체', n: 10 };
function quizView(msg = '') {
  setNav('quiz');
  const seg = (key, arr) => `<div class="seg" data-k="${key}">${arr.map(v => `<button class="${qopt[key] === v ? 'on' : ''}" data-v="${v}">${v}${key === 'n' ? '문제' : ''}</button>`).join('')}</div>`;
  $app.innerHTML = `<div class="qhub"><p class="eyebrow">Quiz</p><h1 style="font-size:clamp(28px,4vw,38px);margin-bottom:10px">퀴즈</h1>
    <p class="hint" style="font-size:15px">13가지 유형 중에서 골라 풀거나, 종합으로 모든 유형을 섞어 풀어 보세요. 틀린 문제는 오답 노트에 쌓여요.</p>
    <div class="kinds">${KINDS.map(k => `<button class="kind ${qopt.kind === k[0] ? 'on' : ''}" data-k="${k[0]}"><b>${k[1]}</b><span>${k[2]}</span></button>`).join('')}</div>
    <div class="tools" style="margin-top:22px">${seg('scope', ['전체', '중급', '고급', '오답만'])}${seg('n', [10, 20, 30])}
      <span class="spacer"></span><button class="btn" id="start">${ico('play')} 시작</button></div>
    <p class="hint" id="qm" style="color:var(--bad)">${msg}</p></div>`;
  $app.querySelectorAll('.kind').forEach(b => b.onclick = () => { qopt.kind = b.dataset.k; quizView(); });
  $app.querySelectorAll('.seg').forEach(sg => sg.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    qopt[sg.dataset.k] = sg.dataset.k === 'n' ? parseInt(b.dataset.v) : b.dataset.v; quizView();
  });
  document.getElementById('start').onclick = startQuiz;
}
function startQuiz() {
  const s = S();
  let pool = WORDS.filter(x => qopt.scope === '전체' || (qopt.scope === '오답만' ? s.wrong[x.id] : x.lv === qopt.scope));
  const kinds = qopt.kind === 'mix' ? KINDS.slice(1).map(k => k[0]) : [qopt.kind];
  if (qopt.kind !== 'mix') pool = pool.filter(x => applicable(x, qopt.kind));
  if (pool.length < 4) return quizView(qopt.scope === '오답만' ? '오답 노트에 단어가 4개 이상 쌓이면 풀 수 있어요.' : '조건에 맞는 단어가 부족해요.');
  const picked = shuffle(pool).slice(0, qopt.n);
  let order = [];
  const qs = picked.map(w => {
    if (!order.length) order = shuffle(kinds);
    let k = order.pop();
    if (!applicable(w, k)) k = rnd(kinds.filter(x => applicable(w, x)));
    return makeQ(w, k);
  });
  runQuiz($app, qs, (ok, n, wr) => {
    $app.innerHTML = `<div class="qwrap result"><p class="eyebrow">Result</p><div class="score">${ok}<span style="font-size:.4em;color:var(--sub)"> / ${n}</span></div>
      <p>${wr.length ? `틀린 단어 ${wr.length}개는 오답 노트에 담았어요.` : '모두 맞혔어요. 훌륭합니다.'}</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="btn" id="again">${ico('retry')} 한 번 더</button>
      <button class="btn ghost" id="cfg">유형 바꾸기</button><a class="btn ghost" href="#/review">오답 노트</a></div></div>`;
    document.getElementById('again').onclick = startQuiz;
    document.getElementById('cfg').onclick = () => quizView();
  }, { title: `${KIND_LABEL[qopt.kind]} 퀴즈 · ${qopt.scope}` });
}

/* ── 오답 노트 ── */
function reviewView() {
  setNav('review');
  const s = S();
  const ids = Object.keys(s.wrong).filter(id => BY[id]);
  $app.innerHTML = `<p class="eyebrow">Review</p><h1 style="font-size:34px;margin-bottom:22px">오답 노트</h1>` +
    (ids.length ? ids.map(id => { const w = BY[id]; return `<div class="rev"><div><div class="w">${w.w} <span class="h" style="font:400 14px var(--serif);color:var(--accent)">${w.h}</span></div><div class="m">${w.mean}</div></div>
      <a class="btn ghost" href="#/word/${encodeURIComponent(id)}">다시 학습</a></div>`; }).join('') +
      `<div style="margin-top:20px"><button class="btn" id="rq">${ico('quiz')} 오답만 퀴즈로 풀기</button></div>` : '<p class="empty">틀린 문제가 아직 없어요. 퀴즈를 풀어 보세요.</p>');
  const rq = document.getElementById('rq');
  if (rq) rq.onclick = () => { qopt.scope = '오답만'; qopt.kind = 'mix'; location.hash = '#/quiz'; };
}

/* ── 라우터 ── */
function route() {
  const h = location.hash.replace(/^#/, '') || '/';
  window.scrollTo({ top: 0 });
  if (h.startsWith('/word/')) return wordView(decodeURIComponent(h.slice(6)));
  if (h === '/quiz') return quizView();
  if (h === '/review') return reviewView();
  home();
}
window.addEventListener('hashchange', route);
route();
})();
