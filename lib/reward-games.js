// ============================================================
// EduPlay Reward Games — Agregador v1.2
//
// Este arquivo inicializa o objeto global RewardGames com os
// metadados dos jogos. Cada jogo é carregado do seu próprio
// arquivo em lib/games/:
//
//   lib/games/snake.js      → RewardGames.snake
//   lib/games/tetris.js     → RewardGames.tetris
//   lib/games/tictactoe.js  → RewardGames.tictactoe
// ============================================================

window.RewardGames = {
  list: ['snake', 'tetris', 'tictactoe', 'builder'],

  labels: {
    snake:     '🐍 Snake',
    tetris:    '🟦 Tetris',
    tictactoe: '⭕ Tic-Tac-Toe',
    builder:   '🧱 Builder',
  },

  instructions: {
    snake:     'Use the arrow keys or the d-pad to move the snake. Eat the apples!',
    tetris:    'Use ← → to move, ↑ to rotate, ↓ to accelerate.',
    tictactoe: 'Click the cells to play. Get three in a row to win!',
    builder:   'Click on the screen to place blocks. Use the buttons below to change the block color!',
  },
};
