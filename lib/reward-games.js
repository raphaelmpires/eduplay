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
  list: ['snake', 'tetris', 'tictactoe'],

  labels: {
    snake:     '🐍 Cobra',
    tetris:    '🟦 Tetris',
    tictactoe: '⭕ Jogo da Velha',
  },

  instructions: {
    snake:     'Use as setas do teclado ou o d-pad para mover a cobra. Coma as maçãs!',
    tetris:    'Use ← → para mover, ↑ para girar, ↓ para acelerar.',
    tictactoe: 'Clique nas células para jogar. Consiga três em linha para vencer!',
  },
};
