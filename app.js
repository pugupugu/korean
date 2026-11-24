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
const sentHTML = (t, mode = 'mark') => t.replace(/\[\[(.+?)\]\]/g, (_, w) =>
  mode === 'mark' ? `<mark>${w}</mark>` : `<button class="blank" data-w="${w}" aria-label="빈칸 보기">${w}</button>`);
const blankText = t => t.replace(/\[\[(.+?)\]\]/g, '＿＿＿＿');
const stem = t => (t.match(/\[\[(.+?)\]\]/) || [])[1];
const setNav = k => document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === k));

/* ── 퀴즈 문항 ── */
function distract(word, n = 3) {
  const same = WORDS.filter(x => x.id !== word.id && x.lv === word.lv);
  const pool = shuffle(same).slice(0, n);
  return pool;
}
function makeQ(word, kind) {
  const wrong = distract(word);
  const opts = shuffle([word, ...wrong]).map(x => x.w);
  if (kind === 'blank') {
    const sent = shuffle(word.s)[0];
    return { id: word.id, kind: '문장 속 빈칸', text: blankText(sent[0]), opts, ans: word.w, fb: sent[0], word };
  }
  if (kind === 'hanja' && word.parts.length) {
    return { id: word.id, kind: '한자 풀이로 단어 찾기', text: word.parts.map(p => `${p[0]}(${p[1]} ${p[2]})`).join(' + ') + ' 의 풀이를 가진 단어는?', opts, ans: word.w, fb: word.easy, word };
  }
  return { id: word.id, kind: '뜻으로 단어 찾기', text: `“${word.mean}” 이라는 뜻의 단어는?`, opts, ans: word.w, fb: word.easy, word };
}
function runQuiz(el, qs, onEnd, meta = {}) {
  let i = 0, ok = 0; const wrongIds = [];
  const show = () => {
    const q = qs[i];
    el.innerHTML = `<div class="qwrap"><div class="qmeta"><span>${meta.title || '퀴즈'}</span><span>${i + 1} / ${qs.length}</span></div>
      <div class="bar"><i style="width:${i / qs.length * 100}%"></i></div>
      <div class="qbox"><div class="qkind">${q.kind}</div><p class="qtext">${q.text}</p>
      <div class="opts">${q.opts.map(o => `<button class="opt" data-o="${o}">${o}</button>`).join('')}</div>
      <div class="fb" id="fb"></div></div></div>`;
    el.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const right = b.dataset.o === q.ans;
      el.querySelector('.opts').classList.add('lock');
      el.querySelectorAll('.opt').forEach(x => { if (x.dataset.o === q.ans) x.classList.add('ok'); });
      if (!right) { b.classList.add('no'); addWrong(q.id); wrongIds.push(q.id); } else { ok++; clearWrong(q.id); }
      const fb = el.querySelector('#fb');
      fb.innerHTML = `<b>${right ? '정답입니다.' : `정답은 ‘${q.ans}’입니다.`}</b> ${sentHTMLFb(q)}
        <div style="margin-top:14px"><button class="btn" id="nx">${i + 1 < qs.length ? '다음' : '결과 보기'} ${ico('next')}</button></div>`;
      el.querySelector('#nx').onclick = () => { i++; i < qs.length ? show() : end(); };
    });
  };
  const sentHTMLFb = q => q.kind.startsWith('문장') ? `<br>${sentHTML(q.fb)}` : `<br>${q.word.mean}`;
  const end = () => onEnd(ok, qs.length, wrongIds);
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
  const go = s => { wordView(id, s); history.replaceState(null, '', '#/word/' + encodeURIComponent(id)); };
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
    const qs = [makeQ(w, 'meaning'), makeQ(w, 'blank'), makeQ(w, 'blank')];
    if (w.parts.length) qs.splice(1, 0, makeQ(w, 'hanja'));
    runQuiz(document.getElementById('qz'), qs, (ok, n) => {
      if (ok >= Math.ceil(n * .6)) markDone(id);
      const next = WORDS[(idx + 1) % WORDS.length];
      document.getElementById('qz').innerHTML = `<div class="result"><div class="score">${ok}<span style="font-size:.4em;color:var(--sub)"> / ${n}</span></div>
        <p>${ok >= Math.ceil(n * .6) ? `‘${w.w}’을(를) 학습 완료로 기록했어요.` : '조금 더 익힌 뒤 다시 도전해 보세요.'}</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="btn ghost" data-go="1">${ico('retry')} 다시 학습</button>
        <a class="btn" href="#/word/${encodeURIComponent(next.id)}">다음 단어 ‘${next.w}’ ${ico('next')}</a></div></div>`;
      document.querySelectorAll('#qz [data-go]').forEach(b => b.onclick = () => go(+b.dataset.go));
    }, { title: `${w.w} 확인 문제` });
  }
}

/* ── 종합 퀴즈 ── */
function quizView() {
  setNav('quiz');
  const start = (lv) => {
    const pool = shuffle(WORDS.filter(x => lv === '전체' || x.lv === lv)).slice(0, 10);
    const kinds = ['meaning', 'blank', 'hanja'];
    const qs = pool.map((x, i) => makeQ(x, kinds[i % 3]));
    runQuiz($app, qs, (ok, n, wr) => {
      $app.innerHTML = `<div class="qwrap result"><p class="eyebrow">Result</p><div class="score">${ok}<span style="font-size:.4em;color:var(--sub)"> / ${n}</span></div>
        <p>${wr.length ? `틀린 ${wr.length}개는 오답 노트에 담았어요.` : '모두 맞혔어요. 훌륭합니다.'}</p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="btn" id="again">${ico('retry')} 한 번 더</button><a class="btn ghost" href="#/review">오답 노트</a></div></div>`;
      document.getElementById('again').onclick = quizView;
    }, { title: `종합 퀴즈 · ${lv}` });
  };
  $app.innerHTML = `<div class="qwrap"><p class="eyebrow">Quiz</p><h1 style="font-size:34px;margin-bottom:10px">종합 퀴즈</h1>
    <p class="hint" style="font-size:15px">전체 어휘에서 10문제를 무작위로 냅니다. 뜻 찾기, 한자 풀이, 문장 빈칸이 섞여 나와요.</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px">
      <button class="btn" data-lv="전체">${ico('quiz')} 전체</button><button class="btn ghost" data-lv="중급">중급만</button><button class="btn ghost" data-lv="고급">고급만</button></div></div>`;
  $app.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => start(b.dataset.lv));
}

/* ── 오답 노트 ── */
function reviewView() {
  setNav('review');
  const s = S();
  const ids = Object.keys(s.wrong).filter(id => BY[id]);
  $app.innerHTML = `<p class="eyebrow">Review</p><h1 style="font-size:34px;margin-bottom:22px">오답 노트</h1>` +
    (ids.length ? ids.map(id => { const w = BY[id]; return `<div class="rev"><div><div class="w">${w.w} <span class="h" style="font:400 14px var(--serif);color:var(--sub)">${w.h}</span></div><div class="m">${w.mean}</div></div>
      <a class="btn ghost" href="#/word/${encodeURIComponent(id)}">다시 학습</a></div>`; }).join('') : '<p class="empty">틀린 문제가 아직 없어요. 퀴즈를 풀어 보세요.</p>');
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
