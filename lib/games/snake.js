// ============================================================
// EduPlay — Snake Game v1.1
// Carregado por: lib/reward-games.js
// ============================================================

RewardGames.snake = function(container, timeLimit, onDone) {
  const CELL = 20;

  const size = Math.min(container.clientWidth || 400, 400);
  const W = Math.floor(size / CELL) * CELL;
  const H = W;
  const COLS = W / CELL, ROWS = H / CELL;

  let snake, dir, nextDir, food, score, running, animFrame, timerId, timeLeft;
  let speed = 280;
  let lastTime = 0;

  // HUD
  const hud = document.createElement('div');
  hud.style.cssText = 'display:flex;justify-content:space-between;padding:8px 12px;font-family:var(--ep-display);font-size:1.2rem;color:var(--ep-text);';
  hud.innerHTML = '<span id="rg-score">⭐ 0</span><span id="rg-timer">⏱ ' + timeLimit + 's</span>';
  container.appendChild(hud);

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.cssText = 'border-radius:16px;display:block;margin:0 auto;max-width:100%;touch-action:none;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // D-pad mobile
  const dpad = document.createElement('div');
  dpad.style.cssText = 'display:grid;grid-template-columns:repeat(3,52px);grid-template-rows:repeat(2,52px);gap:6px;justify-content:center;margin-top:12px;';
  const arrows = [
    { label:'⬆', r:0, c:1, dx:0,  dy:-1 },
    { label:'⬅', r:1, c:0, dx:-1, dy:0  },
    { label:'⬇', r:1, c:1, dx:0,  dy:1  },
    { label:'➡', r:1, c:2, dx:1,  dy:0  },
  ];
  arrows.forEach(a => {
    const b = document.createElement('button');
    b.textContent = a.label;
    b.style.cssText = `grid-row:${a.r+1};grid-column:${a.c+1};width:52px;height:52px;border:none;border-radius:14px;background:var(--ep-primary);color:#fff;font-size:1.4rem;cursor:pointer;user-select:none;-webkit-user-select:none;`;
    const setDir = () => { if (a.dx !== -dir.x || a.dy !== -dir.y) nextDir = { x: a.dx, y: a.dy }; };
    b.ontouchstart = (e) => { e.preventDefault(); setDir(); };
    b.onmousedown  = setDir;
    dpad.appendChild(b);
  });
  container.appendChild(dpad);

  function rnd(max) { return Math.floor(Math.random() * max); }

  function placeFood() {
    do { food = { x: rnd(COLS), y: rnd(ROWS) }; }
    while (snake.some(s => s.x === food.x && s.y === food.y));
  }

  function init() {
    snake    = [{ x: Math.floor(COLS/2), y: Math.floor(ROWS/2) },
                { x: Math.floor(COLS/2)-1, y: Math.floor(ROWS/2) },
                { x: Math.floor(COLS/2)-2, y: Math.floor(ROWS/2) }];
    dir      = { x: 1, y: 0 };
    nextDir  = { x: 1, y: 0 };
    score    = 0;
    speed    = 280;
    timeLeft = timeLimit;
    running  = true;
    placeFood();
    updateHUD();
    timerId = setInterval(() => {
      timeLeft--;
      updateHUD();
      if (timeLeft <= 0) endGame();
    }, 1000);
    lastTime = 0;
    animFrame = requestAnimationFrame(loop);
  }

  function updateHUD() {
    const s = document.getElementById('rg-score');
    const t = document.getElementById('rg-timer');
    if (s) s.textContent = '⭐ ' + score;
    if (t) t.textContent = '⏱ ' + timeLeft + 's';
  }

  function loop(ts) {
    if (!running) return;
    if (ts - lastTime > speed) {
      lastTime = ts;
      update();
      if (!running) return; // endGame() foi chamado (colisão) — para aqui
      draw();
    }
    animFrame = requestAnimationFrame(loop);
  }

  function update() {
    dir = { ...nextDir };
    const head = { x: (snake[0].x + dir.x + COLS) % COLS, y: (snake[0].y + dir.y + ROWS) % ROWS };
    if (snake.some(s => s.x === head.x && s.y === head.y)) { endGame(); return; }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score++;
      speed = Math.max(70, speed - 18); // acelera progressivamente
      updateHUD();
      placeFood();
    } else {
      snake.pop();
    }
  }

  const COLORS = ['#5b8dee','#4578d5','#2d5bc4','#1a3fa0'];
  function draw() {
    ctx.fillStyle = '#e8f0ff';
    ctx.fillRect(0, 0, W, H);
    for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) {
      if ((x+y)%2===0) { ctx.fillStyle='#dde7ff'; ctx.fillRect(x*CELL, y*CELL, CELL, CELL); }
    }
    ctx.font = `${CELL+4}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🍎', food.x*CELL+CELL/2, food.y*CELL+CELL/2);
    snake.forEach((s, i) => {
      ctx.fillStyle = COLORS[Math.min(i, COLORS.length-1)];
      const r = i === 0 ? 7 : 4;
      roundRect(ctx, s.x*CELL+1, s.y*CELL+1, CELL-2, CELL-2, r);
      if (i === 0) {
        ctx.fillStyle = '#fff';
        const ex = s.x*CELL + (dir.x===0?5:dir.x>0?14:4);
        const ey = s.y*CELL + (dir.y===0?5:dir.y>0?14:4);
        ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.arc(ex+.5, ey+.5, 1.5, 0, Math.PI*2); ctx.fill();
      }
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath(); ctx.fill();
  }

  function endGame() {
    running = false;
    cancelAnimationFrame(animFrame);
    clearInterval(timerId);
    ctx.fillStyle = 'rgba(20,30,70,.65)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(W*0.09)}px Fredoka One, cursive`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Fim de Jogo!', W/2, H/2 - W*0.07);
    ctx.font = `${Math.round(W*0.06)}px Nunito, sans-serif`;
    ctx.fillText('Pontos: ' + score, W/2, H/2 + W*0.06);
    setTimeout(() => onDone && onDone(score), 1800);
  }

  // Teclado
  const keyHandler = (e) => {
    const map = { ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0} };
    if (map[e.key]) {
      const d = map[e.key];
      if (d.x !== -dir.x || d.y !== -dir.y) nextDir = d;
      e.preventDefault();
    }
  };
  document.addEventListener('keydown', keyHandler);

  // Swipe mobile
  let tx, ty;
  canvas.addEventListener('touchstart', e => { tx=e.touches[0].clientX; ty=e.touches[0].clientY; }, {passive:true});
  canvas.addEventListener('touchend', e => {
    const dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty;
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
    if (Math.abs(dx) > Math.abs(dy)) nextDir = dx>0 ? {x:1,y:0} : {x:-1,y:0};
    else nextDir = dy>0 ? {x:0,y:1} : {x:0,y:-1};
  }, {passive:true});

  init();

  return {
    destroy() {
      running = false;
      cancelAnimationFrame(animFrame);
      clearInterval(timerId);
      document.removeEventListener('keydown', keyHandler);
    }
  };
};
