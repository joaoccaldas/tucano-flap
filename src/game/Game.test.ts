import { beforeAll, describe, expect, it } from 'vitest';
import { Game, GameState } from './Game';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

beforeAll(() => {
  class FakeImage {
    crossOrigin = '';
    naturalWidth = 0;
    naturalHeight = 0;
    onload: null | (() => void) = null;
    onerror: null | (() => void) = null;
    set src(_value: string) {
      // Asset loading is intentionally inert in unit tests.
    }
  }
  (globalThis as unknown as { Image: typeof FakeImage }).Image = FakeImage;
});

function makeGame(): Game {
  return new Game({} as CanvasRenderingContext2D, 1280, 720);
}

describe('public game contract', () => {
  it('keeps the game state enum stable', () => {
    expect(GameState.MENU).toBe(0);
    expect(GameState.PLAYING).toBe(1);
    expect(GameState.PAUSED).toBe(2);
    expect(GameState.GAME_OVER).toBe(3);
  });

  it('does not ship the removed personal default player identity', () => {
    const source = readFileSync(fileURLToPath(new URL('./Game.ts', import.meta.url)), 'utf8');
    expect(source).not.toContain('Nono Caldas');
    expect(source).toContain('Player 1');
  });

  it('uses a synthetic fallback for blank player names', () => {
    const game = makeGame();
    game.setPlayerName('   ');
    expect(game.getPlayerName()).toBe('Player 1');

    game.setPlayerName('Tucano Pilot');
    expect(game.getPlayerName()).toBe('Tucano Pilot');
  });

  it('applies explicit difficulty profiles', () => {
    const game = makeGame() as Game & {
      gravity: number;
      flapForce: number;
      pipeSpeed: number;
      pipeSpawnRate: number;
      pipeGap: number;
    };

    game.setDifficulty('easy');
    expect(game.getDifficulty()).toBe('easy');
    expect(game.pipeSpeed).toBe(220);
    expect(game.pipeGap).toBe(250);

    game.setDifficulty('normal');
    expect(game.getDifficulty()).toBe('normal');
    expect(game.pipeSpeed).toBe(250);
    expect(game.pipeGap).toBe(220);

    game.setDifficulty('chaos');
    expect(game.getDifficulty()).toBe('chaos');
    expect(game.pipeSpeed).toBe(295);
    expect(game.pipeGap).toBe(190);
  });

  it('starts from menu and supports pause/resume transitions', () => {
    const game = makeGame() as Game & { state: GameState };
    expect(game.state).toBe(GameState.MENU);

    game.flap();
    expect(game.state).toBe(GameState.PLAYING);

    game.togglePause();
    expect(game.state).toBe(GameState.PAUSED);

    game.togglePause();
    expect(game.state).toBe(GameState.PLAYING);
  });
});
