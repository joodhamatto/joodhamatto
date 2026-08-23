const gameArea = document.getElementById('gameArea');
const player = document.getElementById('player');
const scoreValue = document.getElementById('scoreValue');
const timeValue = document.getElementById('timeValue');
const statusText = document.getElementById('statusText');
const restartButton = document.getElementById('restartButton');
const startButton = document.getElementById('startButton');

const state = {
  score: 0,
  timeLeft: 45,
  running: false,
  bugs: [],
  playerX: 0,
  pointerX: 0,
  animationId: 0,
  lastSpawn: 0,
  lastTick: 0,
  startTime: 0,
  keys: {
    left: false,
    right: false,
  },
};

function setPlayerPosition(x) {
  const width = player.offsetWidth;
  const maxX = gameArea.clientWidth - width;
  const clampedX = Math.min(Math.max(0, x), maxX);
  player.style.left = `${clampedX}px`;
  state.playerX = clampedX;
}

function movePlayerBy(delta) {
  const nextX = state.playerX + delta;
  setPlayerPosition(nextX);
}

function updatePointerFromMouse(event) {
  const rect = gameArea.getBoundingClientRect();
  const x = event.clientX - rect.left - player.offsetWidth / 2;
  state.pointerX = x;
  setPlayerPosition(x);
}

function updatePointerFromTouch(event) {
  const rect = gameArea.getBoundingClientRect();
  const touch = event.touches[0];
  const x = touch.clientX - rect.left - player.offsetWidth / 2;
  state.pointerX = x;
  setPlayerPosition(x);
}

function handleKeyChange(event, isPressed) {
  if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
    state.keys.left = isPressed;
  }
  if (event.key === 'ArrowRight' || event.key === 'd' || event.key === 'D') {
    state.keys.right = isPressed;
  }
}

gameArea.addEventListener('mousemove', updatePointerFromMouse);
gameArea.addEventListener('touchmove', updatePointerFromTouch, { passive: true });
document.addEventListener('keydown', (event) => handleKeyChange(event, true));
document.addEventListener('keyup', (event) => handleKeyChange(event, false));

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function createBug() {
  const bug = document.createElement('div');
  bug.className = 'bug';
  bug.textContent = '!';

  const size = randomBetween(22, 32);
  const x = randomBetween(0, Math.max(1, gameArea.clientWidth - size));
  bug.style.width = `${size}px`;
  bug.style.height = `${size}px`;
  bug.style.left = `${x}px`;
  bug.style.top = '-32px';

  gameArea.appendChild(bug);
  state.bugs.push({
    element: bug,
    x,
    y: -32,
    size,
    speed: randomBetween(1.3, 2.8),
  });
}

function checkCollision(bug) {
  const playerBottom = gameArea.clientHeight - 18;
  const playerLeft = state.playerX;
  const playerRight = state.playerX + player.offsetWidth;
  const bugLeft = bug.x;
  const bugRight = bug.x + bug.size;
  const bugBottom = bug.y + bug.size;

  return bugBottom >= playerBottom - 20 && bugRight >= playerLeft && bugLeft <= playerRight;
}

function finishRound(message) {
  state.running = false;
  statusText.textContent = message;
  startButton.textContent = 'Start again';
  startButton.disabled = false;
}

function updateGame(timestamp) {
  if (!state.running) return;

  const delta = timestamp - (state.lastTick || timestamp);
  state.lastTick = timestamp;

  if (state.keys.left) {
    movePlayerBy(-9);
  }
  if (state.keys.right) {
    movePlayerBy(9);
  }

  if (timestamp - state.lastSpawn > 700) {
    createBug();
    state.lastSpawn = timestamp;
  }

  for (let i = state.bugs.length - 1; i >= 0; i -= 1) {
    const bug = state.bugs[i];
    bug.y += bug.speed * (delta / 16.67);
    bug.element.style.top = `${bug.y}px`;

    if (checkCollision(bug)) {
      state.score += 1;
      scoreValue.textContent = String(state.score);
      bug.element.remove();
      state.bugs.splice(i, 1);
      continue;
    }

    if (bug.y + bug.size >= gameArea.clientHeight) {
      bug.element.remove();
      state.bugs.splice(i, 1);
      finishRound(`A bug escaped. Final score: ${state.score}.`);
      return;
    }
  }

  state.timeLeft = Math.max(0, 45 - (timestamp - state.startTime) / 1000);
  timeValue.textContent = String(Math.ceil(state.timeLeft));

  if (state.timeLeft <= 0) {
    finishRound(`Round complete! Final score: ${state.score}.`);
    return;
  }

  state.animationId = requestAnimationFrame(updateGame);
}

function startGame() {
  state.score = 0;
  state.timeLeft = 45;
  state.running = true;
  state.bugs.forEach((bug) => bug.element.remove());
  state.bugs = [];
  scoreValue.textContent = '0';
  timeValue.textContent = '45';
  statusText.textContent = 'Catch the bugs before they reach the stack.';
  setPlayerPosition(gameArea.clientWidth / 2 - player.offsetWidth / 2);
  state.startTime = performance.now();
  state.lastSpawn = 0;
  state.lastTick = 0;

  if (state.animationId) {
    cancelAnimationFrame(state.animationId);
  }

  startButton.disabled = true;
  state.animationId = requestAnimationFrame(updateGame);
}

function resetGame() {
  if (state.animationId) {
    cancelAnimationFrame(state.animationId);
  }
  state.bugs.forEach((bug) => bug.element.remove());
  state.bugs = [];
  state.score = 0;
  state.timeLeft = 45;
  state.running = false;
  scoreValue.textContent = '0';
  timeValue.textContent = '45';
  statusText.textContent = 'Press Start and catch the bugs before they reach the stack.';
  startButton.textContent = 'Start';
  startButton.disabled = false;
  setPlayerPosition(gameArea.clientWidth / 2 - player.offsetWidth / 2);
}

setPlayerPosition(gameArea.clientWidth / 2 - player.offsetWidth / 2);
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', () => {
  if (state.running) {
    resetGame();
    startGame();
  } else {
    resetGame();
    startGame();
  }
});
window.addEventListener('resize', () => {
  const desiredX = Math.min(Math.max(state.playerX, 0), gameArea.clientWidth - player.offsetWidth);
  setPlayerPosition(desiredX);
});

resetGame();
