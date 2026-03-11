// ============================================================
// EduPlay — Tetris Game v1.1
// Carregado por: lib/reward-games.js
// ============================================================

RewardGames.tetris = function(container, timeLimit, onDone) {
  const CELL = 24;
  const COLS = 10;
  const ROWS = 18;
  const W = COLS * CELL;
  const H = ROWS * CELL;

  const PIECES = [
    { shape: [[1,1,1,1]], color: '#4ecdc4' },
    { shape: [[1,1],[1,1]], color: '#ffd93d' },
    { shape: [[0,1,0],[1,1,1]], color: '#9b5de5' },
    { shape: [[1,0],[1,0],[1,1]], color: '#ff6b6b' },
    { shape: [[0,1],[0,1],[1,1]], color: '#5b8dee' },
    { shape: [[1,1,0],[0,1,1]], color: '#ff922b' },
    { shape: [[0,1,1],[1,1,0]], color: '#43c97e' },
  ];

  let board, current, currentX, currentY, score, running, animFrame, timerId, timeLeft, dropCounter, lastTime;

  const maxW = Math.min(container.clientWidth || W, W);
  const scale = maxW / W;
  const CW = Math.round(W * scale);
  const CH = Math.round(H * scale);

  const hud = document.createElement('div');
  hud.style.cssText = 'display:flex;justify-content:space-between;padding:8px 12px;font-family:var(--ep-display);font-size:1.2rem;color:var(--ep-text);';
  hud.innerHTML = '<span id="rg-score">⭐ 0</span><span id="rg-timer">⏱ ' + timeLimit + 's</span>';
  container.appendChild(hud);

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.cssText = `border-radius:16px;display:block;margin:0 auto;width:${CW}px;height:${CH}px;max-width:100%;`;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Controles mobile
  const ctrl = document.createElement('div');
  ctrl.style.cssText = 'display:flex;gap:8px;justify-content:center;margin-top:10px;flex-wrap:wrap;';
  [['⬅',moveL],['⬇',moveDown],['➡',moveR],['↻',rotate]].forEach(([lbl, fn]) => {
    const b = document.createElement('button');
    b.textContent = lbl;
    b.style.cssText = 'width:56px;height:56px;border:none;border-radius:14px;background:var(--ep-primary);color:#fff;font-size:1.4rem;cursor:pointer;touch-action:manipulation;';
    b.ontouchstart = (e) => { e.preventDefault(); fn(); };
    b.onmousedown  = fn;
    ctrl.appendChild(b);
  });
  container.appendChild(ctrl);

  function newPiece() {
    const p = PIECES[Math.floor(Math.random()*PIECES.length)];
    current = { shape: p.shape.map(r=>[...r]), color: p.color };
    currentX = Math.floor(COLS/2) - Math.floor(current.shape[0].length/2);
    currentY = 0;
    if (collides(current.shape, currentX, currentY)) endGame();
  }

  function collides(shape, ox, oy) {
    for (let y=0;y<shape.length;y++) for (let x=0;x<shape[y].length;x++) {
      if (!shape[y][x]) continue;
      const nx=ox+x, ny=oy+y;
      if (nx<0||nx>=COLS||ny>=ROWS) return true;
      if (ny>=0 && board[ny][nx]) return true;
    }
    return false;
  }

  function place() {
    current.shape.forEach((row,y)=>row.forEach((v,x)=>{ if(v) board[currentY+y][currentX+x]=current.color; }));
    let cleared=0;
    for (let y=ROWS-1;y>=0;y--) {
      if (board[y].every(v=>v)) { board.splice(y,1); board.unshift(new Array(COLS).fill(0)); cleared++; y++; }
    }
    score += cleared*10;
    const s = document.getElementById('rg-score');
    if (s) s.textContent = '⭐ ' + score;
    newPiece();
  }

  function rotate() {
    const s=current.shape;
    const r=s[0].map((_,i)=>s.map(row=>row[i]).reverse());
    if (!collides(r,currentX,currentY)) current.shape=r;
  }
  function moveL()    { if (!collides(current.shape,currentX-1,currentY)) currentX--; }
  function moveR()    { if (!collides(current.shape,currentX+1,currentY)) currentX++; }
  function moveDown() { if (!collides(current.shape,currentX,currentY+1)) currentY++; else place(); }

  function init() {
    board = Array.from({length:ROWS},()=>new Array(COLS).fill(0));
    score=0; timeLeft=timeLimit; running=true; dropCounter=0; lastTime=0;
    newPiece();
    timerId=setInterval(()=>{
      timeLeft--;
      const t = document.getElementById('rg-timer');
      if (t) t.textContent = '⏱ '+timeLeft+'s';
      if (timeLeft<=0) endGame();
    }, 1000);
    requestAnimationFrame(loop);
  }

  function loop(ts=0) {
    if (!running) return;
    dropCounter += ts - lastTime; lastTime = ts;
    if (dropCounter > 600) { moveDown(); dropCounter=0; }
    draw();
    animFrame = requestAnimationFrame(loop);
  }

  function draw() {
    ctx.fillStyle='#1a1a2e'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(255,255,255,.05)';
    for(let x=0;x<COLS;x++){ctx.beginPath();ctx.moveTo(x*CELL,0);ctx.lineTo(x*CELL,H);ctx.stroke();}
    for(let y=0;y<ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*CELL);ctx.lineTo(W,y*CELL);ctx.stroke();}
    board.forEach((row,y)=>row.forEach((v,x)=>{ if(v){drawBlock(x,y,v);} }));
    if (current) current.shape.forEach((row,y)=>row.forEach((v,x)=>{ if(v) drawBlock(currentX+x,currentY+y,current.color); }));
  }

  function drawBlock(x,y,color) {
    ctx.fillStyle=color;
    ctx.fillRect(x*CELL+1,y*CELL+1,CELL-2,CELL-2);
    ctx.fillStyle='rgba(255,255,255,.3)';
    ctx.fillRect(x*CELL+1,y*CELL+1,CELL-2,4);
  }

  function endGame() {
    running=false; cancelAnimationFrame(animFrame); clearInterval(timerId);
    ctx.fillStyle='rgba(20,30,70,.7)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff'; ctx.font='bold 28px Fredoka One, cursive';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('Fim de Jogo!',W/2,H/2-20);
    ctx.font='18px Nunito, sans-serif';
    ctx.fillText('Pontos: '+score,W/2,H/2+18);
    setTimeout(()=>onDone&&onDone(score),1800);
  }

  const keyH=(e)=>{
    if(e.key==='ArrowLeft') { moveL(); e.preventDefault(); }
    else if(e.key==='ArrowRight') { moveR(); e.preventDefault(); }
    else if(e.key==='ArrowDown') { moveDown(); e.preventDefault(); }
    else if(e.key==='ArrowUp'||e.key===' ') { rotate(); e.preventDefault(); }
  };
  document.addEventListener('keydown',keyH);

  init();
  return {
    destroy() {
      running=false;
      cancelAnimationFrame(animFrame);
      clearInterval(timerId);
      document.removeEventListener('keydown',keyH);
      if (ctrl.parentNode) ctrl.parentNode.removeChild(ctrl);
    }
  };
};
