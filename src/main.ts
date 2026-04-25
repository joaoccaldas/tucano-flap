import { Game } from './game/Game.js';

// Samsung TV Browser compatibility
declare global {
  interface Window {
    tizen?: unknown;
    webapis?: unknown;
  }
}

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const landing = document.getElementById('landing-screen') as HTMLDivElement | null;
const nameInput = document.getElementById('player-name') as HTMLInputElement | null;
const startButton = document.getElementById('start-game') as HTMLButtonElement | null;
const menuName = document.getElementById('menu-name') as HTMLSpanElement | null;
const animalSelect = document.getElementById('animal-select') as HTMLSelectElement | null;
const difficultySelect = document.getElementById('difficulty-select') as HTMLSelectElement | null;
const menuAnimal = document.getElementById('menu-animal') as HTMLSpanElement | null;
const menuDifficulty = document.getElementById('menu-difficulty') as HTMLSpanElement | null;
const animalPreview = document.getElementById('animal-preview') as HTMLImageElement | null;

// Animal preview images mapping - use absolute paths for GitHub Pages
const animalImages: Record<string, string> = {
  jow: 'sprites/jow.jpg',
  thais: 'sprites/thais.jpg',
};

function updateAnimalPreview(): void {
  const selectedAnimal = animalSelect?.value || 'tucano';
  if (animalPreview && animalImages[selectedAnimal]) {
    animalPreview.src = animalImages[selectedAnimal];
    animalPreview.classList.remove('hidden');
  } else if (animalPreview) {
    animalPreview.classList.add('hidden');
    animalPreview.src = '';
  }
}

if (!canvas) {
  throw new Error('Canvas not found');
}

// Set canvas size to match display resolution for crisp rendering
const dpr = window.devicePixelRatio || 1;
const targetWidth = 1920;
const targetHeight = 1080;

canvas.width = targetWidth * dpr;
canvas.height = targetHeight * dpr;
canvas.style.width = '100%';
canvas.style.height = '100%';

const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error('Could not get canvas context');
}

// Scale context for high DPI displays
ctx.scale(dpr, dpr);

// Initialize game
const game = new Game(ctx, targetWidth, targetHeight);

if (nameInput) {
  nameInput.value = game.getPlayerName();
}
if (menuName) {
  menuName.textContent = game.getPlayerName();
}
if (animalSelect) {
  animalSelect.value = game.getAnimal();
}
if (menuAnimal) {
  menuAnimal.textContent = game.getAnimal();
}
if (difficultySelect) {
  difficultySelect.value = game.getDifficulty();
}
if (menuDifficulty) {
  menuDifficulty.textContent = game.getDifficulty();
}

// Initial preview update
updateAnimalPreview();

function syncMenu(): void {
  const nextName = nameInput?.value || 'Nono Caldas';
  game.setPlayerName(nextName);
  game.setAnimal((animalSelect?.value as 'tucano' | 'arara' | 'capivara' | 'jaguar' | 'jow' | 'thais') || 'tucano');
  game.setDifficulty((difficultySelect?.value as 'easy' | 'normal' | 'chaos') || 'easy');
  updateAnimalPreview();
  if (nameInput) {
    nameInput.value = game.getPlayerName();
  }
  if (menuName) {
    menuName.textContent = game.getPlayerName();
  }
  if (menuAnimal) {
    menuAnimal.textContent = game.getAnimal();
  }
  if (menuDifficulty) {
    menuDifficulty.textContent = game.getDifficulty();
  }
}

function hideLanding(): void {
  syncMenu();
  if (landing) {
    landing.classList.add('hidden');
  }
  canvas.focus();
}

// Samsung TV remote support
// Standard key codes for TV browsers
const TV_KEYS = {
  OK: 13,      // Enter
  UP: 38,      // Arrow Up
  DOWN: 40,    // Arrow Down
  LEFT: 37,    // Arrow Left
  RIGHT: 39,   // Arrow Right
  BACK: 10009, // Samsung TV back
  EXIT: 27,    // Escape
  RED: 403,    // Red button
  GREEN: 404,  // Green button
  YELLOW: 405, // Yellow button
  BLUE: 406,   // Blue button
};

// Input handling
function handleInput(e: KeyboardEvent): void {
  const keyCode = e.keyCode || e.which;

  if (landing && !landing.classList.contains('hidden')) {
    if (keyCode === TV_KEYS.OK || keyCode === 13) {
      hideLanding();
      e.preventDefault();
    }
    return;
  }
  
  switch (keyCode) {
    case TV_KEYS.OK:
    case 32: // Spacebar (fallback)
      game.flap();
      e.preventDefault();
      break;
    case TV_KEYS.BACK:
    case TV_KEYS.EXIT:
      game.togglePause();
      e.preventDefault();
      break;
    case TV_KEYS.UP:
    case TV_KEYS.DOWN:
    case TV_KEYS.LEFT:
    case TV_KEYS.RIGHT:
      // Menu navigation handled in menu state
      game.navigate(keyCode);
      e.preventDefault();
      break;
  }
}

// Also support pointer/touch for testing
function handlePointer(_e: PointerEvent): void {
  if (landing && !landing.classList.contains('hidden')) {
    hideLanding();
    return;
  }
  game.flap();
}

// Event listeners
window.addEventListener('keydown', handleInput);
canvas.addEventListener('pointerdown', handlePointer);

nameInput?.addEventListener('input', syncMenu);
animalSelect?.addEventListener('change', syncMenu);
difficultySelect?.addEventListener('change', syncMenu);
nameInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    hideLanding();
    e.preventDefault();
  }
});
startButton?.addEventListener('click', hideLanding);

// Prevent default browser zoom/pan
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());
document.addEventListener('gestureend', (e) => e.preventDefault());

// Start game loop
game.start();

// Log for debugging
console.log('🐦 Tucano Flap initialized');
console.log('Press OK/Enter to flap, BACK/Escape to pause');

// Samsung TV specific: prevent screen timeout
if (window.tizen) {
  // @ts-ignore
  window.tizen.power.request('SCREEN', 'SCREEN_NORMAL');
}

// Expose for debugging
(window as any).game = game;
