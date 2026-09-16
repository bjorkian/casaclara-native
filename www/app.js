/* ============================================================
   CasaClara — Lógica da aplicação
   Pensado para PHDA: baixa fricção, vitórias rápidas,
   decisões binárias e recompensa imediata.
   ============================================================ */

const STORAGE_KEY = 'casaclara_v1';

/* ---------------- ZONAS DA CASA ---------------- */
const UNIQUE_ZONES = [
  { id: 'cozinha',   name: 'Cozinha',        icon: '🍳', bg: '#fbe9e2', tasks: ['Arrumar a loiça / pôr máquina', 'Limpar bancadas (2 min)', 'Tirar o lixo', 'Limpar o fogão', 'Organizar a despensa (10 min)'] },
  { id: 'sala',      name: 'Sala',           icon: '🛋️', bg: '#e6eef5', tasks: ['Recolher o que não pertence à sala', 'Aspirar / varrer', 'Limpar pó das superfícies', 'Arrumar mantas e almofadas', 'Organizar estante (10 min)'] },
  { id: 'quarto',    name: 'Quarto',         icon: '🛏️', bg: '#f0e9f5', tasks: ['Fazer a cama (2 min)', 'Roupa suja ao cesto', 'Roupa limpa dobrada', 'Limpar mesa-de-cabeceira', 'Organizar gaveta da meia (10 min)'] },
  { id: 'wc',        name: 'Casa de Banho',  icon: '🚿', bg: '#e6f0ea', tasks: ['Limpeza rápida da sanita', 'Limpar lavatório e espelho', 'Trocar toalhas', 'Tirar cabelo do ralo', 'Organizar armário (10 min)'] },
  { id: 'escritorio',name: 'Escritório',     icon: '💻', bg: '#faf1dd', tasks: ['Limpar a secretária', 'Papelada em 3 pilhas: fica/sai/dúvida', 'Arrumar cabos e carregadores', 'Esvaziar caixa de entrada (10 min)', 'Apagar ficheiros antigos'] },
  { id: 'lavandaria',name: 'Lavandaria',     icon: '🧺', bg: '#e6eef5', tasks: ['Pôr máquina de lavar', 'Estender / dobrar roupa (10 min)', 'Guardar roupa dobrada', 'Limpar o filtro da máquina', 'Organizar produtos de limpeza'] },
  { id: 'entrada',   name: 'Entrada & Corredor', icon: '🚪', bg: '#fbe9e2', tasks: ['Sapatos no sítio certo', 'Casacos em cabides', 'Limpar o tapete', 'Esvaziar a mesa da entrada', 'Organizar gaveta de chaves (5 min)'] },
];

const ROUTINES = [
  { id: 'manha', name: '☀️ Rotina da Manhã', sub: 'max. 10 min', items: ['Fazer a cama', 'Abrir as cortinas / luz', 'Água + medicamentos se aplicável', '5 min: recolher o essencial'] },
  { id: 'noite', name: '🌙 Rotina da Noite', sub: 'max. 15 min', items: ['Lavar a loiça / ligar máquina', 'Preparar roupa de amanhã', 'Sacos/chaves à porta', '10 min: reset da sala'] },
];

const QUICK_WIN_POOL = [
  { name: 'Fazer a cama', zone: 'quarto', time: 2 },
  { name: 'Varrer o chão da cozinha', zone: 'cozinha', time: 5 },
  { name: 'Tirar o lixo', zone: 'cozinha', time: 3 },
  { name: 'Recolher copos e pratos', zone: 'sala', time: 5 },
  { name: 'Limpar o lavatório', zone: 'wc', time: 5 },
  { name: 'Dobrar uma pilha de roupa', zone: 'quarto', time: 10 },
  { name: 'Pôr uma máquina de lavar', zone: 'lavandaria', time: 5 },
  { name: 'Sapatos na entrada', zone: 'entrada', time: 3 },
];

/* ---------------- ESTADO ---------------- */
let state = loadState();

function defaultState() {
  return {
    onboarded: false,
    tasks: [],
    quickDone: {},       // { 'YYYY-MM-DD': [idx...] }
    routineDone: {},     // { 'YYYY-MM-DD#manha': [idx...] }
    zoneTaskDone: {},    // { zoneId: [taskIdx...] }
    oneThing: '',
    declutter: { keep: 0, go: 0, box: 0, log: [] },
    streak: { last: null, days: 0 },
    notifMorning: '08:30',
    notifEvening: '21:00',
    careDone: {},
    survivalDays: {},
    supportNumber: '',
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? Object.assign(defaultState(), JSON.parse(raw)) : defaultState();
  } catch { return defaultState(); }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function todayKey() { return new Date().toISOString().slice(0, 10); }
function weekNumber() {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}

/* ---------------- TOAST & CONFETTI ---------------- */
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

function confetti() {
  const canvas = document.getElementById('confetti');
  const ctx = canvas.getContext('2d');
  canvas.width = innerWidth; canvas.height = innerHeight;
  const colors = ['#e07856', '#7fa88f', '#e3b657', '#7b9bb5'];
  const parts = Array.from({ length: 90 }, () => ({
    x: innerWidth / 2 + (Math.random() - .5) * 200,
    y: innerHeight / 3,
    vx: (Math.random() - .5) * 9,
    vy: -Math.random() * 9 - 3,
    size: 5 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 90,
  }));
  (function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of parts) {
      if (p.life <= 0) continue;
      alive = true;
      p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life--;
      ctx.globalAlpha = Math.min(1, p.life / 30);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    if (alive) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  })();
}

/* ---------------- NAVEGAÇÃO ---------------- */
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});
function switchView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  window.scrollTo({ top: 0 });
}

/* ---------------- ONBOARDING ---------------- */
function finishOnboarding() {
  state.onboarded = true;
  saveState();
  document.getElementById('onboarding').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  toast('Bem-vinda/o à CasaClara 🏠');
}

/* ---------------- DASHBOARD ---------------- */
function zoneName(id) { const z = UNIQUE_ZONES.find(z => z.id === id); return z ? z.name : id; }

function renderDashboard() {
  const h = new Date().getHours();
  document.getElementById('greeting').textContent =
    h < 6 ? 'Boa madrugada' : h < 12 ? 'Bom dia' : h < 19 ? 'Boa tarde' : 'Boa noite';
  document.getElementById('dashDate').textContent =
    new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });

  // Banner modo sobrevivência
  const zoneCard = document.getElementById('zoneTodayCard');
  document.getElementById('survivalBanner')?.remove();
  if (state.survivalDays && state.survivalDays[todayKey()]) {
    zoneCard.insertAdjacentHTML('beforebegin', `
      <div class="survival-banner" id="survivalBanner">
        <strong>🌱 Modo sobrevivência ativo</strong>
        <p>Hoje conta só <strong>1 coisa de 2 minutos</strong>. Escolhe a mais pequena das vitórias rápidas e já está. O resto é bónus — e amanhã é um novo dia.</p>
        <button class="btn-ghost btn-sm" onclick="switchView('cheer')">Ver modo cheer up →</button>
      </div>`);
  }

  // Zona da semana
  const zi = weekNumber() % UNIQUE_ZONES.length;
  const zWeek = UNIQUE_ZONES[zi];
  const doneCount = (state.zoneTaskDone[zWeek.id] || []).length;
  document.getElementById('zoneTodayCard').innerHTML = `
    <div class="zone-badge" style="background:${zWeek.bg}">${zWeek.icon}</div>
    <div style="flex:1;min-width:200px">
      <h3>Zona da semana: ${zWeek.name}</h3>
      <p>${doneCount}/${zWeek.tasks.length} micro-tarefas feitas. Só esta zona importa esta semana — as outras esperam por ti.</p>
    </div>
    <button class="btn-ghost" onclick="switchView('zones')">Ver zona →</button>`;

  // Vitórias rápidas (4 por dia, estáveis por data)
  const key = todayKey();
  if (!state._qwSeed || state._qwSeedDate !== key) {
    const seed = weekNumber() * 7 + new Date().getDay();
    state._qwSeed = seed;
    state._qwSeedDate = key;
    saveState();
  }
  const wins = [0, 1, 2, 3].map(i => QUICK_WIN_POOL[(state._qwSeed + i * 2) % QUICK_WIN_POOL.length]);
  const doneSet = new Set(state.quickDone[key] || []);
  document.getElementById('quickWins').innerHTML = wins.map((w, i) => `
    <button class="qw-card ${doneSet.has(i) ? 'done' : ''}" onclick="toggleQuickWin(${i})">
      <span class="qw-check">${doneSet.has(i) ? '✓' : ''}</span>
      <span><span class="qw-name">${w.name}</span><span class="qw-meta">${zoneName(w.zone)}</span></span>
      <span class="qw-time">${w.time} min</span>
    </button>`).join('');

  // Uma coisa
  document.getElementById('oneThingBody').innerHTML = `
    <input type="text" id="oneThingInput" placeholder="Se hoje só fizeres uma coisa em casa, qual é?"
      value="${escapeHtml(state.oneThing)}">
    <button class="btn-primary" onclick="saveOneThing()">Guardar</button>`;

  // Rotinas
  document.getElementById('routines').innerHTML = ROUTINES.map(r => {
    const rDone = state.routineDone[`${key}#${r.id}`] || [];
    return `<div class="routine">
      <h4>${r.name}<small>${r.sub} · ${rDone.length}/${r.items.length}</small></h4>
      ${r.items.map((item, i) => `
        <label class="routine-item ${rDone.includes(i) ? 'done' : ''}">
          <input type="checkbox" ${rDone.includes(i) ? 'checked' : ''}
            onchange="toggleRoutineItem('${r.id}', ${i})"><span>${item}</span>
        </label>`).join('')}
    </div>`;
  }).join('');

  updateRing();
  document.getElementById('streakDays').textContent = state.streak.days;
}

function toggleQuickWin(i) {
  const key = todayKey();
  state.quickDone[key] = state.quickDone[key] || [];
  const arr = state.quickDone[key];
  const idx = arr.indexOf(i);
  if (idx >= 0) arr.splice(idx, 1);
  else { arr.push(i); confetti(); toast('Vitória rápida! ⚡'); checkStreak(); }
  saveState(); renderDashboard();
}

function toggleRoutineItem(rid, i) {
  const key = `${todayKey()}#${rid}`;
  state.routineDone[key] = state.routineDone[key] || [];
  const arr = state.routineDone[key];
  const idx = arr.indexOf(i);
  if (idx >= 0) arr.splice(idx, 1);
  else { arr.push(i); toast('Feito ✓'); checkStreak(); }
  saveState(); renderDashboard();
}

function saveOneThing() {
  state.oneThing = document.getElementById('oneThingInput').value.trim();
  saveState();
  toast('Definida. Uma coisa de cada vez 🎯');
}

function dayProgress() {
  const key = todayKey();
  const qw = (state.quickDone[key] || []).length;
  const rout = ROUTINES.reduce((n, r) => n + (state.routineDone[`${key}#${r.id}`] || []).length, 0);
  const routTotal = ROUTINES.reduce((n, r) => n + r.items.length, 0);
  const base = qw + rout + Math.min(state.tasks.filter(t => t.done && t.doneDate === key).length, 4);
  const total = 4 + routTotal + 4;
  return Math.min(100, Math.round(base / total * 100));
}

function updateRing() {
  const pct = dayProgress();
  const C = 2 * Math.PI * 34;
  document.getElementById('ringFg').style.strokeDashoffset = C - (C * pct / 100);
  document.getElementById('ringPct').textContent = pct + '%';
}

function checkStreak() {
  const key = todayKey();
  if (state.streak.last === key) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  const yKey = y.toISOString().slice(0, 10);
  state.streak.days = (state.streak.last === yKey) ? state.streak.days + 1 : 1;
  state.streak.last = key;
  saveState();
  if (state.streak.days > 1) toast(`🔥 ${state.streak.days} dias seguidos!`);
}

/* ---------------- ZONAS ---------------- */
const openZones = new Set();
function renderZones() {
  const zi = weekNumber() % UNIQUE_ZONES.length;
  document.getElementById('zonesGrid').innerHTML = UNIQUE_ZONES.map((z, i) => {
    const done = state.zoneTaskDone[z.id] || [];
    const pct = Math.round(done.length / z.tasks.length * 100);
    return `<div class="zone-card ${i === zi ? 'week-zone' : ''} ${openZones.has(z.id) ? 'open' : ''}" id="zone-${z.id}">
      <button class="zone-head" onclick="toggleZone('${z.id}')">
        <span class="zone-ico" style="background:${z.bg}">${z.icon}</span>
        <span><strong>${z.name}${i === zi ? ' <span class="tag" style="background:var(--accent-soft);color:var(--accent)">ZONA DA SEMANA</span>' : ''}</strong>
        <small>${done.length}/${z.tasks.length} tarefas</small></span>
        <span class="zone-arrow">›</span>
      </button>
      <div class="zone-bar"><i style="width:${pct}%"></i></div>
      <div class="zone-tasks">
        ${z.tasks.map((t, ti) => `
          <label class="routine-item ${done.includes(ti) ? 'done' : ''}">
            <input type="checkbox" ${done.includes(ti) ? 'checked' : ''}
              onchange="toggleZoneTask('${z.id}', ${ti})"><span>${t}</span>
          </label>`).join('')}
      </div>
    </div>`;
  }).join('');
}

function toggleZone(id) {
  openZones.has(id) ? openZones.delete(id) : openZones.add(id);
  document.getElementById('zone-' + id).classList.toggle('open');
}

function toggleZoneTask(zid, ti) {
  state.zoneTaskDone[zid] = state.zoneTaskDone[zid] || [];
  const arr = state.zoneTaskDone[zid];
  const idx = arr.indexOf(ti);
  if (idx >= 0) arr.splice(idx, 1);
  else { arr.push(ti); toast('Zona a ficar mais leve ✨'); checkStreak(); }
  saveState(); renderZones(); renderDashboard();
}

/* ---------------- TAREFAS ---------------- */
function seedTasks() {
  if (state.tasks.length) return;
  state.tasks = [
    { id: uid(), name: 'Dobrar a roupa limpa', zone: 'quarto', time: 15, done: false },
    { id: uid(), name: 'Limpar o frigorífico', zone: 'cozinha', time: 30, done: false },
    { id: uid(), name: 'Repor produtos de limpeza', zone: 'lavandaria', time: 10, done: false },
  ];
  saveState();
}
function uid() { return Math.random().toString(36).slice(2, 9); }

let taskFilter = 'all';
function renderTasks() {
  const sel = document.getElementById('newTaskZone');
  if (!sel.options.length) sel.innerHTML = UNIQUE_ZONES.map(z => `<option value="${z.id}">${z.icon} ${z.name}</option>`).join('');

  let list = [...state.tasks].sort((a, b) => a.done - b.done || b.created - a.created);
  if (taskFilter === 'done') list = state.tasks.filter(t => t.done);
  if (taskFilter === 'quick') list = list.filter(t => t.time <= 15 && !t.done);
  if (taskFilter === 'today') list = list.filter(t => !t.done);

  const zoneTag = z => { const zz = UNIQUE_ZONES.find(x => x.id === z); return zz ? `<span class="tag" style="background:${zz.bg}">${zz.icon} ${zz.name}</span>` : ''; };
  document.getElementById('taskList').innerHTML = list.length ? list.map(t => `
    <div class="task-item ${t.done ? 'done' : ''}">
      <span class="task-check" onclick="toggleTask('${t.id}')">${t.done ? '✓' : ''}</span>
      <div><div class="task-name">${escapeHtml(t.name)}</div>
      <div class="task-tags">${zoneTag(t.zone)}<span class="tag" style="background:var(--surface-2);color:var(--ink-soft)">⏱ ${t.time} min</span></div></div>
      <button class="task-del" onclick="deleteTask('${t.id}')" title="Apagar">✕</button>
    </div>`).join('')
  : `<div class="empty-state"><span>🌤️</span>Nada aqui. Aproveita o silêncio — ou adiciona uma tarefa acima.</div>`;

  renderFocusOptions();
}

document.getElementById('addTaskForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('newTaskName').value.trim();
  if (!name) return;
  state.tasks.push({
    id: uid(), name,
    zone: document.getElementById('newTaskZone').value,
    time: +document.getElementById('newTaskTime').value,
    done: false, created: Date.now(),
  });
  document.getElementById('newTaskName').value = '';
  saveState(); renderTasks();
  toast('Tarefa adicionada ✓');
});

document.getElementById('taskFilters').addEventListener('click', e => {
  if (!e.target.dataset.filter) return;
  taskFilter = e.target.dataset.filter;
  document.querySelectorAll('#taskFilters .chip').forEach(c => c.classList.toggle('active', c === e.target));
  renderTasks();
});

function toggleTask(id) {
  const t = state.tasks.find(t => t.id === id);
  if (!t) return;
  t.done = !t.done;
  t.doneDate = t.done ? todayKey() : null;
  if (t.done) { confetti(); toast('Mais uma fora da lista! 🎉'); checkStreak(); }
  saveState(); renderTasks(); renderDashboard();
}
function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveState(); renderTasks();
}

/* ---------------- MODO FOCO ---------------- */
let timer = { total: 25 * 60, left: 25 * 60, running: false, int: null };

function renderFocusOptions() {
  const sel = document.getElementById('focusTask');
  const open = state.tasks.filter(t => !t.done);
  const current = sel.value;
  sel.innerHTML = open.length
    ? open.map(t => `<option value="${t.id}">${escapeHtml(t.name)} (${t.time} min)</option>`).join('')
    : `<option value="">Sem tarefas pendentes — descansa ou usa o timer livre ☕</option>`;
  if (open.find(t => t.id === current)) sel.value = current;
}

document.querySelectorAll('.timer-modes .chip').forEach(c => {
  c.addEventListener('click', () => {
    document.querySelectorAll('.timer-modes .chip').forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    stopTimer();
    timer.total = timer.left = +c.dataset.min * 60;
    paintTimer();
  });
});

document.getElementById('timerStartBtn').addEventListener('click', () => {
  timer.running ? stopTimer() : startTimer();
});
document.getElementById('timerResetBtn').addEventListener('click', () => {
  stopTimer(); timer.left = timer.total; paintTimer();
});

function startTimer() {
  timer.running = true;
  const btn = document.getElementById('timerStartBtn');
  btn.textContent = '⏸ Pausar';
  document.getElementById('timerDisplay').classList.add('running');
  timer.int = setInterval(() => {
    timer.left--;
    paintTimer();
    if (timer.left <= 0) {
      stopTimer();
      timer.left = timer.total;
      paintTimer();
      confetti();
      toast('⏰ Bloco terminado — podes parar sem culpa!');
      beep();
    }
  }, 1000);
}
function stopTimer() {
  timer.running = false;
  clearInterval(timer.int);
  document.getElementById('timerStartBtn').textContent = '▶ Começar';
  document.getElementById('timerDisplay').classList.remove('running');
}
function paintTimer() {
  const m = String(Math.floor(timer.left / 60)).padStart(2, '0');
  const s = String(timer.left % 60).padStart(2, '0');
  document.getElementById('timerDisplay').textContent = `${m}:${s}`;
}
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, .25, .5].forEach(d => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.setValueAtTime(.15, ctx.currentTime + d);
      g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + d + .2);
      o.start(ctx.currentTime + d); o.stop(ctx.currentTime + d + .22);
    });
  } catch {}
}

/* ---------------- DESAPEGO ---------------- */
function decide(verdict) {
  const input = document.getElementById('declutterItem');
  const name = input.value.trim() || 'Item sem nome';
  state.declutter[verdict === 'box' ? 'box' : verdict]++; // keep/go/box
  state.declutter.log.unshift({ name, verdict, at: Date.now() });
  state.declutter.log = state.declutter.log.slice(0, 20);
  input.value = '';
  input.focus();
  saveState(); renderDeclutter();
  const msgs = { keep: 'Fica — usa e abraça ✓', box: 'Na caixa de dúvida. 90 dias de prazo 📦', go: 'Sai. A tua casa agradece ⇢' };
  toast(msgs[verdict]);
  if (verdict === 'go') checkStreak();
}

function renderDeclutter() {
  document.getElementById('statKept').textContent = state.declutter.keep;
  document.getElementById('statGone').textContent = state.declutter.go;
  document.getElementById('statBox').textContent = state.declutter.box;
  const icons = { keep: ['✓', 'log-keep'], box: ['📦', 'log-box'], go: ['⇢', 'log-go'] };
  document.getElementById('declutterLog').innerHTML = state.declutter.log.length
    ? state.declutter.log.map(l => `
      <div class="log-item">
        <span class="log-badge ${icons[l.verdict][1]}">${icons[l.verdict][0]}</span>
        <span>${escapeHtml(l.name)}</span>
        <small style="margin-left:auto;color:var(--ink-soft)">${new Date(l.at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}</small>
      </div>`).join('')
    : `<div class="empty-state"><span>🍃</span>As tuas decisões aparecem aqui.</div>`;
}

/* ---------------- UTILS ---------------- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------------- MODO ESCURO ---------------- */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === 'dark';
  const icon = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  if (icon) icon.textContent = dark ? '☀️' : '🌙';
  if (label) label.textContent = dark ? 'Modo claro' : 'Modo escuro';
  try { localStorage.setItem('casaclara_theme', theme); } catch {}
}
function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  toast(next === 'dark' ? 'Modo escuro 🌙' : 'Modo claro ☀️');
}
(function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem('casaclara_theme'); } catch {}
  const pref = (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  applyTheme(saved || pref);
})();

/* ---------------- NOTIFICAÇÕES ---------------- */
/* Bridge nativa (Capacitor) com fallback para a Notification API da web */
const isNativeApp = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const LocalNotif = (isNativeApp && window.Capacitor.Plugins) ? window.Capacitor.Plugins.LocalNotifications : null;
let nativeNotifGranted = false;

async function nativeNotifInit() {
  if (!LocalNotif) return;
  try {
    const st = await LocalNotif.checkPermissions();
    nativeNotifGranted = st.display === 'granted';
  } catch {}
}
nativeNotifInit();

function paintNotifUI() {
  const granted = isNativeApp ? nativeNotifGranted : ('Notification' in window && Notification.permission === 'granted');
  const supported = isNativeApp ? !!LocalNotif : ('Notification' in window);
  const btn = document.getElementById('notifBtn');
  const times = document.getElementById('notifTimes');
  const hint = document.getElementById('notifHint');
  if (!supported) {
    btn.textContent = 'Indisponível';
    btn.disabled = true;
    hint.textContent = 'Este dispositivo não suporta notificações.';
    return;
  }
  const denied = !isNativeApp && Notification.permission === 'denied';
  btn.textContent = granted ? 'Ativas ✓' : (denied ? 'Bloqueadas ⚠️' : 'Ativar');
  if (denied) {
    hint.textContent = 'Bloqueadas nas definições do browser — permite em 🔒 Definições do site.';
  }
  times.classList.toggle('hidden', !granted);
  if (granted) {
    document.getElementById('notifMorning').value = state.notifMorning || '08:30';
    document.getElementById('notifEvening').value = state.notifEvening || '21:00';
  }
}

async function askNotificationPermission() {
  if (isNativeApp) {
    if (!LocalNotif) { toast('Notificações indisponíveis neste dispositivo'); return; }
    if (nativeNotifGranted) { scheduleDailyNotifications(); toast('Já estão ativas ✓'); paintNotifUI(); return; }
    try {
      const st = await LocalNotif.requestPermissions();
      nativeNotifGranted = st.display === 'granted';
      paintNotifUI();
      if (nativeNotifGranted) { scheduleDailyNotifications(); toast('Lembretes ativados 🔔'); }
      else toast('Sem problema — a app funciona igual');
    } catch { toast('Não foi possível pedir permissão'); }
    return;
  }
  if (!('Notification' in window)) { toast('Browser sem suporte a notificações'); return; }
  if (Notification.permission === 'granted') { scheduleDailyNotifications(); toast('Já estão ativas ✓'); paintNotifUI(); return; }
  if (Notification.permission === 'denied') { toast('Bloqueadas nas definições do browser ⚠️'); return; }
  Notification.requestPermission().then(p => {
    paintNotifUI();
    if (p === 'granted') { scheduleDailyNotifications(); toast('Lembretes ativados 🔔'); }
    else toast('Sem problema — a app funciona igual');
  });
}

function saveNotifTimes() {
  state.notifMorning = document.getElementById('notifMorning').value;
  state.notifEvening = document.getElementById('notifEvening').value;
  saveState(); scheduleDailyNotifications();
  toast('Horários guardados 🔔');
}

let notifTimeouts = [];
function scheduleDailyNotifications() {
  notifTimeouts.forEach(clearTimeout); notifTimeouts = [];
  const reminders = [
    { time: state.notifMorning || '08:30', title: '☀️ Rotina da manhã', body: '5 minutos de manhã mudam o dia. A CasaClara está contigo.' },
    { time: state.notifEvening || '21:00', title: '🌙 Reset da noite', body: '10 minutos e amanhã acordas a uma casa mais leve.' },
  ];
  if (isNativeApp) {
    if (!LocalNotif || !nativeNotifGranted) return;
    (async () => {
      try {
        const pending = await LocalNotif.getPending();
        if (pending.notifications.length) {
          await LocalNotif.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
        }
        const list = [];
        reminders.forEach((r, i) => {
          const [h, m] = r.time.split(':').map(Number);
          list.push({ id: 100 + i, title: r.title, body: r.body, schedule: { on: { hour: h, minute: m }, repeats: true, allowWhileIdle: true } });
        });
        await LocalNotif.schedule({ notifications: list });
      } catch {}
    })();
    return;
  }
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const now = new Date();
  for (const r of reminders) {
    const [h, m] = r.time.split(':').map(Number);
    const at = new Date(now); at.setHours(h, m, 0, 0);
    if (at <= now) continue; // hoje já passou — agenda-se amanhã ao reabrir
    notifTimeouts.push(setTimeout(() => {
      try { new Notification(r.title, { body: r.body, icon: '⌂' }); } catch {}
    }, at - now));
  }
}

function testNotification() {
  if (isNativeApp) {
    if (!LocalNotif || !nativeNotifGranted) { toast('Primeiro ativa as notificações'); return; }
    LocalNotif.schedule({ notifications: [{ id: 999, title: '🔔 CasaClara', body: 'Os lembretes estão a funcionar. Até já!', schedule: { at: new Date(Date.now() + 1500) } }] }).catch(() => {});
    toast('Notificação de teste enviada 🔔');
    return;
  }
  if (!('Notification' in window) || Notification.permission !== 'granted') { toast('Primeiro ativa as notificações'); return; }
  new Notification('🔔 CasaClara', { body: 'Os lembretes estão a funcionar. Até já!' });
  toast('Notificação de teste enviada 🔔');
}

/* ---------------- MODO CHEER UP ---------------- */
const CARE_ITEMS = [
  'Beber um copo de água',
  'Abrir a janela 2 minutos',
  'Lavar a cara / escovar os dentes',
  'Mandar mensagem a alguém',
  'Comer qualquer coisa simples',
  'Deitar 10 minutos sem culpa',
];

function renderCheer() {
  const key = todayKey();
  state.careDone = state.careDone || {};
  const done = new Set(state.careDone[key] || []);
  document.getElementById('careList').innerHTML = CARE_ITEMS.map((c, i) => `
    <div class="care-item ${done.has(i) ? 'done' : ''}" onclick="toggleCare(${i})">
      <span class="care-check">${done.has(i) ? '✓' : ''}</span><span>${c}</span>
    </div>`).join('');

  const survival = state.survivalDays && state.survivalDays[key];
  const btn = document.getElementById('survivalBtn');
  btn.textContent = survival ? 'Ativo hoje ✓ — desativar' : 'Ativar para hoje';
  btn.classList.toggle('btn-ghost', !!survival);

  const num = state.supportNumber;
  if (num) document.getElementById('callLink').href = 'tel:' + num;
}

function toggleCare(i) {
  const key = todayKey();
  state.careDone = state.careDone || {};
  state.careDone[key] = state.careDone[key] || [];
  const arr = state.careDone[key];
  const idx = arr.indexOf(i);
  if (idx >= 0) arr.splice(idx, 1);
  else { arr.push(i); toast('Cuidar de ti conta ✨'); }
  saveState(); renderCheer();
}

function toggleSurvival() {
  const key = todayKey();
  state.survivalDays = state.survivalDays || {};
  if (state.survivalDays[key]) {
    delete state.survivalDays[key];
    toast('Modo normal restaurado 💪');
  } else {
    state.survivalDays[key] = true;
    toast('Modo sobrevivência ativo 🌱 Só 1 coisa conta hoje.');
  }
  saveState(); renderCheer(); renderDashboard();
}

function setSupportNumber(e) {
  if (state.supportNumber) return; // já configurado
  e.preventDefault();
  const num = prompt('Número de telefone de alguém de confiança (com indicativo, ex.: +351…):');
  if (num && num.trim()) {
    state.supportNumber = num.trim();
    saveState();
    document.getElementById('callLink').href = 'tel:' + state.supportNumber;
    toast('Contacto guardado 💛');
  }
}

/* Respiração 4-4-6 */
const BREATHE_PHASES = [
  { text: 'Inspira…', dur: 4000, cls: 'inhale' },
  { text: 'Segura…', dur: 4000, cls: 'hold' },
  { text: 'Expira…', dur: 6000, cls: 'exhale' },
];
let breathe = { running: false, timeout: null };

function toggleBreathe() {
  breathe.running ? stopBreathe() : startBreathe();
}
function startBreathe() {
  breathe.running = true;
  document.getElementById('breatheBtn').textContent = '⏸ Parar';
  runPhase(0);
}
function runPhase(i) {
  if (!breathe.running) return;
  const phase = BREATHE_PHASES[i % BREATHE_PHASES.length];
  const circle = document.getElementById('breatheCircle');
  circle.className = 'breathe-circle ' + phase.cls;
  document.getElementById('breatheText').textContent = phase.text;
  breathe.timeout = setTimeout(() => runPhase(i + 1), phase.dur);
}
function stopBreathe() {
  breathe.running = false;
  clearTimeout(breathe.timeout);
  const circle = document.getElementById('breatheCircle');
  circle.className = 'breathe-circle';
  document.getElementById('breatheText').textContent = 'Pronta/o?';
  document.getElementById('breatheBtn').textContent = '▶ Começar';
}

/* ---------------- INIT ---------------- */
(function init() {
  seedTasks();
  if (state.onboarded) {
    document.getElementById('onboarding').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
  }
  renderDashboard();
  renderZones();
  renderTasks();
  renderDeclutter();
  renderCheer();
  if (isNativeApp) {
    nativeNotifInit().then(() => { paintNotifUI(); scheduleDailyNotifications(); });
  } else {
    paintNotifUI();
    scheduleDailyNotifications();
  }
  paintTimer();
})();
