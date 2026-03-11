// ============================================================
// EduPlay — Builder Game v1.0
// Carregado por: lib/reward-games.js
// ============================================================

RewardGames.builder = function(container, timeLimit, onDone) {
  const CELL = 32;
  const COLS = 12; // Grid width
  const ROWS = 8;  // Grid height
  const W = COLS * CELL;
  const H = ROWS * CELL;

  // Blocks palette
  const BLOCKS = [
    { id: 1, name: 'Dirt', color: '#8B5A2B', border: '#70421A' },
    { id: 2, name: 'Grass', color: '#43c97e', border: '#2e8b57', top: '#5cdb95' },
    { id: 3, name: 'Wood', color: '#c19a6b', border: '#8b5a2b' },
    { id: 4, name: 'Leaves', color: '#228b22', border: '#006400' },
    { id: 5, name: 'Stone', color: '#888888', border: '#555555' },
    { id: 6, name: 'Diamond', color: '#00ffff', border: '#00ced1', top: '#e0ffff' }
  ];

  let board, score, running, animFrame, timerId, timeLeft;
  let currentBlockIdx = 1; // Default to Grass

  const maxW = Math.min(container.clientWidth || W, W);
  const scale = maxW / W;
  const CW = Math.round(W * scale);
  const CH = Math.round(H * scale);

  const hud = document.createElement('div');
  hud.style.cssText = 'display:flex;justify-content:space-between;padding:8px 12px;font-family:var(--ep-display);font-size:1.2rem;color:var(--ep-text);';
  hud.innerHTML = '<span id="rg-score">⭐ 0</span><span id="rg-timer">⏱ ' + timeLimit + 's</span>';
  container.appendChild(hud);

  const canvasWrap = document.createElement('div');
  canvasWrap.style.cssText = 'position:relative;display:block;margin:0 auto;width:' + CW + 'px;height:' + CH + 'px;';

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  canvas.style.cssText = 'border-radius:12px;width:100%;height:100%;box-shadow:inset 0 0 20px rgba(0,0,0,0.1);background:#e0f7fa;cursor:crosshair;';
  canvasWrap.appendChild(canvas);
  container.appendChild(canvasWrap);

  const ctx = canvas.getContext('2d');

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.style.cssText = 'display:flex;gap:6px;justify-content:center;margin-top:12px;flex-wrap:wrap;padding:4px;';
  
  const toolBtns = [];
  BLOCKS.forEach((blk, idx) => {
    const btn = document.createElement('button');
    btn.style.cssText = `width:40px;height:40px;border:3px solid transparent;border-radius:8px;background:${blk.color};cursor:pointer;box-shadow:inset 0 -4px 0 rgba(0,0,0,0.2);transition:transform 0.1s;`;
    if (idx === currentBlockIdx) btn.style.borderColor = '#1a6fc4';
    
    btn.onclick = () => {
      currentBlockIdx = idx;
      toolBtns.forEach(b => b.style.borderColor = 'transparent');
      btn.style.borderColor = '#1a6fc4';
      btn.style.transform = 'scale(1.1)';
      setTimeout(() => btn.style.transform = 'scale(1)', 150);
    };
    toolBtns.push(btn);
    toolbar.appendChild(btn);
  });
  container.appendChild(toolbar);

  function getGridCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    return {
      col: Math.floor((x / CW) * COLS),
      row: Math.floor((y / CH) * ROWS)
    };
  }

  function handleInput(e) {
    if (!running) return;
    e.preventDefault();
    const { col, row } = getGridCoords(e);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;

    if (board[row][col] === 0) {
      // Place block
      board[row][col] = BLOCKS[currentBlockIdx].id;
      score += 5;
    } else {
      // Break block
      board[row][col] = 0;
      score = Math.max(0, score - 2); // Small penalty, but keeps it rewarding
    }

    const s = document.getElementById('rg-score');
    if (s) s.textContent = '⭐ ' + score;
    draw();
  }

  canvas.addEventListener('mousedown', handleInput);
  canvas.addEventListener('touchstart', handleInput, { passive: false });

  function init() {
    board = Array.from({length:ROWS}, () => new Array(COLS).fill(0));
    // Start with a basic floor
    for (let c = 0; c < COLS; c++) {
      board[ROWS - 1][c] = 2; // Grass
      board[ROWS - 2][c] = 1; // Dirt partially
      if (Math.random() > 0.5) board[ROWS - 2][c] = 2; // Some grass variations
    }

    score = 0; timeLeft = timeLimit; running = true;
    
    timerId = setInterval(() => {
      timeLeft--;
      const t = document.getElementById('rg-timer');
      if (t) t.textContent = '⏱ ' + timeLeft + 's';
      if (timeLeft <= 0) endGame();
    }, 1000);
    draw(); // Static drawing until clicked
  }

  function draw() {
    // Sky
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, W, H);

    // Grid (faint)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for(let x=0; x<=COLS; x++) { ctx.beginPath(); ctx.moveTo(x*CELL, 0); ctx.lineTo(x*CELL, H); ctx.stroke(); }
    for(let y=0; y<=ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y*CELL); ctx.lineTo(W, y*CELL); ctx.stroke(); }

    // Blocks
    board.forEach((row, y) => row.forEach((v, x) => {
      if (v > 0) {
        const blk = BLOCKS.find(b => b.id === v);
        if (blk) drawBlock(x, y, blk);
      }
    }));
  }

  function drawBlock(x, y, blk) {
    const px = x * CELL;
    const py = y * CELL;
    const s = CELL;

    // Base color
    ctx.fillStyle = blk.color;
    ctx.fillRect(px, py, s, s);

    // Top detail (like grass or shiny diamond top)
    if (blk.top) {
      ctx.fillStyle = blk.top;
      ctx.fillRect(px, py, s, 6);
    }

    // Border
    ctx.strokeStyle = blk.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, py + 1, s - 2, s - 2);

    // Inner shadow/highlight for blocky feel
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(px + s - 4, py, 4, s); // Right shadow
    ctx.fillRect(px, py + s - 4, s, 4); // Bottom shadow
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(px, py, 4, s); // Left highlight
  }

  function endGame() {
    running = false; clearInterval(timerId);
    
    // Dim overlay
    ctx.fillStyle = 'rgba(20, 30, 70, 0.7)'; 
    ctx.fillRect(0, 0, W, H);
    
    ctx.fillStyle = '#fff'; 
    ctx.font = 'bold 28px "Fredoka One", cursive';
    ctx.textAlign = 'center'; 
    ctx.textBaseline = 'middle';
    ctx.fillText('Time\'s Up!', W / 2, H / 2 - 20);
    
    ctx.font = '18px Nunito, sans-serif';
    ctx.fillText('Creativity: ' + score + ' pts', W / 2, H / 2 + 18);
    
    setTimeout(() => { if (onDone) onDone(score); }, 1800);
  }

  init();
  return {
    destroy() {
      running = false;
      clearInterval(timerId);
      canvas.removeEventListener('mousedown', handleInput);
      canvas.removeEventListener('touchstart', handleInput);
      if (toolbar.parentNode) toolbar.parentNode.removeChild(toolbar);
    }
  };
};
