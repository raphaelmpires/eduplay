# 🎮 EduPlay

> Ambiente interativo de estudo gamificado para crianças — feito com carinho para **Charlie** (6 anos) e **Soso** (8 anos).

EduPlay é uma plataforma educacional 100% web (HTML + CSS + JS puro, sem frameworks) onde cada jogo é uma unidade de aprendizado temática. Os jogos rodam diretamente no navegador, sem instalação, e salvam o progresso localmente via `localStorage`.

---

## 📁 Estrutura do Projeto

```
Eduplay/
│
├── index.html              # Hub central — lista e filtra os jogos por jogador
│
├── lib/                    # Biblioteca compartilhada EduPlay
│   ├── eduplay.css         # Estilos globais e componentes reutilizáveis
│   ├── themes.css          # Sistema de temas (spider-man, stitch, ...)
│   ├── eduplay.js          # Motor JS: TTS, Progress, QuizEngine, UI helpers
│   └── reward-games.js     # Mini-jogos de recompensa (Snake, Tetris, Jogo da Velha)
│
└── games/                  # Pasta dos jogos educativos
    └── charlie-unit1/
        └── index.html      # Unidade 1 do Charlie: Escola & Aventuras
```

---

## 🏠 Hub Principal (`index.html`)

A tela inicial permite:
- **Filtrar por jogador** — "Todos", Charlie 🕷️ ou Sophia 🐾
- **Ver os jogos disponíveis** em cards com título, descrição, badge de unidade e estrelas de progresso
- **Acessar jogos bloqueados** (exibidos com cadeado, desbloqueados conforme o conteúdo cresce)

O registro de jogos fica no array `GAMES_REGISTRY` dentro do próprio `index.html`. Para adicionar um novo jogo, basta incluir uma entrada nesse array.

### Estrutura de uma entrada no GAMES_REGISTRY

```js
{
  id: 'charlie-unit2',        // identificador único (usado no localStorage)
  title: 'Título do Jogo',
  desc: 'Descrição curta.',
  avatarHtml: `<svg ...>`,    // ícone SVG do personagem
  avatarBg: 'linear-gradient(...)',
  player: 'charlie',          // 'charlie' | 'sophia'
  unit: 'Unit 2',
  badgeBg: '#d32f2f',
  stripe: 'linear-gradient(90deg, #d32f2f, #1565c0)',
  url: 'games/charlie-unit2/index.html',
  locked: false,
}
```

---

## 📚 Biblioteca EduPlay (`lib/`)

### `eduplay.css` — Design System

Importa as fontes **Nunito** e **Fredoka One** e define variáveis CSS globais utilizadas em todo o projeto:

| Variável         | Uso                          |
|------------------|------------------------------|
| `--ep-primary`   | Azul principal (#5b8dee)     |
| `--ep-success`   | Verde de acerto (#43c97e)    |
| `--ep-danger`    | Vermelho de erro (#ff5c6a)   |
| `--ep-warning`   | Amarelo destaque (#ffd93d)   |
| `--ep-display`   | Fonte título (Fredoka One)   |
| `--ep-font`      | Fonte corpo (Nunito)         |

**Componentes prontos:**

| Classe CSS            | Descrição                                      |
|-----------------------|------------------------------------------------|
| `.ep-card`            | Card branco com sombra e bordas arredondadas   |
| `.ep-btn`, `.ep-btn-primary` | Botões estilizados com hover animado  |
| `.ep-play-btn`        | Botão redondo de áudio (TTS)                   |
| `.ep-progress` / `.ep-progress-fill` | Barra de progresso animada   |
| `.ep-stars` / `.ep-star.lit` | Sistema de estrelas de pontuação      |
| `.ep-overlay` / `.ep-overlay-box` | Modal/overlay de recompensa ou fim  |
| `.ep-feedback-ok/err` | Toast de acerto/erro (animado, auto-remove)    |
| `.ep-confetti`        | Partícula de confete (gerada por JS)           |

---

### `themes.css` — Sistema de Temas

Aplique uma classe ao `<body>` para ativar um tema. O tema sobrescreve as variáveis CSS do EduPlay.

```html
<body class="theme-spider-man">  <!-- Jogo do Charlie -->
<body class="theme-stitch">     <!-- Jogo da Sophia -->
```

| Classe              | Personagem        | Cor primária      |
|---------------------|-------------------|-------------------|
| `theme-spider-man`  | Homem-Aranha 🕷️  | Vermelho `#CC0000` |
| `theme-stitch`      | Stitch 🐾         | Azul `#4488DD`    |

**Para criar um novo tema**, adicione uma classe a `lib/themes.css` sobrescrevendo as variáveis desejadas:

```css
.theme-meu-tema {
  --ep-primary:   #6200ea;  /* roxo, por exemplo */
  --ep-bg:        #f3f0ff;
  /* ... demais variáveis conforme necessário */
}
```

---

### `eduplay.js` — Motor JavaScript

Expõe o objeto global `window.EduPlay` com os seguintes módulos:

#### `EduPlay.TTS` — Text-to-Speech
```js
EduPlay.TTS.speak('Hello!', 'en-US', 0.85); // fala o texto
EduPlay.TTS.stop();                          // para a fala
```

#### `EduPlay.Progress` — Persistência de Progresso por Usuário
Salva e recupera dados de cada jogo usando `localStorage`. O progresso é isolado **por usuário** — o nome digitado na tela inicial define o namespace.
```js
EduPlay.Progress.save('charlie-unit1', { stars: 3, score: 42 });
EduPlay.Progress.load('charlie-unit1'); // → { stars: 3, score: 42 }
EduPlay.Progress.clear('charlie-unit1');
EduPlay.Progress.clearAll();            // apaga todo o progresso do usuário atual
```
A chave no `localStorage` segue o padrão: `eduplay_<nome>_progress_<gameId>`.

#### `EduPlay.QuizEngine` — Motor de Quiz
Gerencia seções de perguntas, embaralha questões, repete erros e dispara callbacks.

```js
const engine = new EduPlay.QuizEngine(sections, {
  maxRepeats: 2,               // quantas vezes uma questão errada volta
  onSectionComplete(idx, score) { /* seção concluída → exibir recompensa */ },
  onAllComplete(score)          { /* jogo completo → salvar estrelas */ },
});

engine.current();              // questão atual
engine.answer('q1', true);     // registra resposta (true = correta)
engine.advanceAfterReward();   // avança para a próxima seção após recompensa
engine.progress();             // { section, totalSections, done, total }
```

**Formato de `sections`:**
```js
[
  {
    title: 'Seção 1 — Animais',
    questions: [
      { id: 'q1', word: 'cat', answer: 'gato', options: ['gato','cão','peixe'] },
      // ...
    ]
  }
]
```

#### `EduPlay.UI` — Helpers de Interface
```js
// Botão de áudio (retorna um <button> pronto)
const btn = EduPlay.UI.playBtn('cat', 'en-US');

// Confete animado dentro de um container
EduPlay.UI.confetti(document.body, 80);

// Toast de feedback (+/-)
EduPlay.UI.feedback(document.body, true,  '✅ Correto!');
EduPlay.UI.feedback(document.body, false, '❌ Tente de novo!');
```

---

### `reward-games.js` — Mini-jogos de Recompensa

Jogos curtos exibidos entre seções do quiz como recompensa. Cada jogo recebe um container HTML, um tempo limite (segundos) e um callback `onDone(score)`.

| Jogo                          | Chave               | Controles                              |
|-------------------------------|---------------------|----------------------------------------|
| 🐍 Snake                      | `snake`             | Setas do teclado / swipe mobile        |
| 🟦 Tetris                     | `tetris`            | Setas / botões na tela                 |
| ⭕ Jogo da Velha (vs IA)       | `tictactoe`         | Clique nas células                     |

```js
// Exemplo de uso
const game = RewardGames.snake(containerEl, 30, (score) => {
  console.log('Pontuação:', score);
  // avançar para a próxima seção
});

game.destroy(); // limpa listeners e animações
```

---

## 🎮 Convenção para Novos Jogos

```
games/
└── <player>-unit<N>/
    └── index.html
```

- **`<player>`**: `charlie` ou `sophia`
- **`<N>`**: número sequencial da unidade (ex: `unit1`, `unit2`)
- Cada `index.html` é **autocontido** (pode usar `../../lib/eduplay.css`, `../../lib/eduplay.js` e `../../lib/reward-games.js`)
- Ao finalizar, salvar progresso com `EduPlay.Progress.save(gameId, { stars })` para que as estrelas apareçam no hub

---

## 🎯 Princípios Pedagógicos

> Decisões de design que devem ser mantidas em todos os jogos futuros.

| Princípio | Regra |
|-----------|-------|
| **Leitura obrigatória** | Os **emojis NÃO aparecem nas opções de resposta** (botões do quiz). O emoji fica apenas na pergunta, para contextualizar. O aluno deve ler o texto em inglês para escolher a resposta certa — sem atalho visual. |
| **Áudio como apoio** | Cada opção tem um botão 🔊 de escuta. O aluno pode ouuvir a pronúncia, mas precisa ler para responder. |
| **Repetição de erros** | Questões erradas voltam à fila (até `maxRepeats` vezes) para reforço imediato. |
| **Recompensa entre seções** | Mini-jogos (Snake, Tetris, Jogo da Velha) aparecem entre seções como motivação, sem relação com o conteúdo educativo. |

---

## 👦👧 Jogadores

| Jogador | Idade | Avatar              | Cor principal |
|---------|-------|---------------------|---------------|
| Charlie | 6 anos | Homem-Aranha 🕷️   | Vermelho `#d32f2f` |
| Sophia (Soso) | 8 anos | Stitch 🐾 | Azul `#1a6fc4` |

---

## 🚀 Como Rodar

Abra `index.html` diretamente no navegador — não é necessário servidor local.  
Para desenvolvimento recomenda-se a extensão **Live Server** (VS Code).

```
# Alternativa rápida com Python
python -m http.server 8080
# Acesse: http://localhost:8080
```

---

## 📝 Roadmap de Jogos

| Jogo                        | Jogador   | Status        |
|-----------------------------|-----------|---------------|
| Escola & Aventuras (Unit 1) | Charlie   | ✅ Disponível  |
| *(próximas unidades)*       | Charlie   | 🔒 Em breve   |
| *(unidades Sophia)*         | Sophia    | 🔒 Em breve   |
