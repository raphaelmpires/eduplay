// ============================================================
// EduPlay — Tic-Tac-Toe Game v1.1
// Carregado por: lib/reward-games.js
// ============================================================

RewardGames.tictactoe = function(container, timeLimit, onDone) {
  let board, turn, gameOver, timerId, timeLeft;

  const hud = document.createElement('div');
  hud.style.cssText='text-align:center;font-family:var(--ep-display);font-size:1.1rem;color:var(--ep-text);padding:8px;';
  container.appendChild(hud);

  const cellSize = Math.min(90, Math.floor((Math.min(container.clientWidth || 300, 300) - 24) / 3));

  const grid = document.createElement('div');
  grid.style.cssText=`display:grid;grid-template-columns:repeat(3,${cellSize}px);gap:8px;justify-content:center;`;
  container.appendChild(grid);

  const status = document.createElement('div');
  status.style.cssText='text-align:center;margin-top:12px;font-family:var(--ep-display);font-size:1.3rem;min-height:44px;';
  container.appendChild(status);

  function init() {
    board=Array(9).fill(null); turn='X'; gameOver=false;
    timeLeft=timeLimit;
    updateHUD(); renderGrid();
    timerId=setInterval(()=>{ timeLeft--; updateHUD(); if(timeLeft<=0) finish(); },1000);
  }

  function updateHUD() {
    hud.textContent = `⏱ ${timeLeft}s`;
  }

  function renderGrid() {
    grid.innerHTML='';
    const symbols={X:'😊',O:'🤖'};
    board.forEach((v,i)=>{
      const cell=document.createElement('div');
      cell.style.cssText=`width:${cellSize}px;height:${cellSize}px;border-radius:16px;
        background:${v?'#f0f4ff':'#fff'};
        box-shadow:0 4px 12px rgba(91,141,238,.15);
        display:flex;align-items:center;justify-content:center;
        font-size:${Math.round(cellSize*0.5)}px;
        cursor:${v||gameOver?'default':'pointer'};
        transition:transform .12s;border:2px solid #dce6ff;`;
      if(!v&&!gameOver) { cell.onmouseenter=()=>cell.style.transform='scale(1.06)'; cell.onmouseleave=()=>cell.style.transform='scale(1)'; }
      cell.textContent=v?symbols[v]:'';
      if(!v&&!gameOver) {
        cell.onclick=()=>play(i);
        cell.ontouchend=(e)=>{ e.preventDefault(); play(i); };
      }
      grid.appendChild(cell);
    });
  }

  function play(i) {
    if (board[i]||gameOver) return;
    board[i]=turn;
    const winner=checkWin();
    if(winner) { status.textContent=`${winner==='X'?'Você ganhou! 🎉':'Robô ganhou! 🤖'}`; gameOver=true; renderGrid(); setTimeout(finish,1500); return; }
    if(board.every(v=>v)) { status.textContent='Empate! 🤝'; gameOver=true; renderGrid(); setTimeout(finish,1500); return; }
    turn=turn==='X'?'O':'X';
    status.textContent=turn==='O'?'Vez do Robô 🤖':'Sua vez 😊';
    renderGrid();
    if(turn==='O') setTimeout(aiMove,500);
  }

  function aiMove() {
    if(gameOver) return;
    let best=-Infinity, bestIdx=-1;
    board.forEach((_,i)=>{ if(!board[i]){ board[i]='O'; const s=minimax(board,0,false); board[i]=null; if(s>best){best=s;bestIdx=i;} } });
    if(bestIdx>=0) play(bestIdx);
  }

  function minimax(b,depth,isMax) {
    const w=checkWin(b);
    if(w==='O') return 10-depth;
    if(w==='X') return depth-10;
    if(b.every(v=>v)) return 0;
    if(isMax){
      let best=-Infinity;
      b.forEach((_,i)=>{ if(!b[i]){ b[i]='O'; best=Math.max(best,minimax(b,depth+1,false)); b[i]=null; } });
      return best;
    } else {
      let best=Infinity;
      b.forEach((_,i)=>{ if(!b[i]){ b[i]='X'; best=Math.min(best,minimax(b,depth+1,true)); b[i]=null; } });
      return best;
    }
  }

  function checkWin(b=board) {
    const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for(const [a,c,d] of lines) if(b[a]&&b[a]===b[c]&&b[a]===b[d]) return b[a];
    return null;
  }

  function finish() {
    clearInterval(timerId); gameOver=true;
    onDone&&onDone(0);
  }

  init();
  return { destroy(){ clearInterval(timerId); } };
};
