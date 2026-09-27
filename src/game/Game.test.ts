import { describe, expect, it } from 'vitest';
import { GameState } from './Game';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

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
});
