import { describe, expect, it } from 'vitest';

import { Game, getNextDirectionClockwise, getOppositeDirection } from './game';

describe('game', () => {
  it('initializes with 0 players and 1 apple', () => {
    const game = new Game();

    expect(game.players.length).toEqual(0);
    expect(game.tiles.length).toEqual(1);
  });
  it('serializes and unserializes', () => {});

  describe('snakes', () => {
    it('spawns a snake', () => {
      const game = new Game();

      game.spawnPlayer('foo', 'lime', 'linus');

      expect(game.players.length).toEqual(1);

      expect(game.players[0].id).toEqual('foo');
      expect(game.players[0].color).toEqual('lime');
    });
    it("can't turn 180 degrees in a single tick", () => {
      const game = new Game();

      game.spawnPlayer('foo', 'lime', 'linus');

      const facing = game.players[0].facing;

      // the game should ignore this
      game.setPlayerFacing('foo', getOppositeDirection(facing));

      expect(game.players[0].facing).toEqual(facing);
    });
    it("can't perform two inputs on a single tick", () => {
      const game = new Game();

      game.spawnPlayer('foo', 'lime', 'linus');

      const facing = game.players[0].facing;

      const newFacing = getNextDirectionClockwise(facing);

      game.setPlayerFacing('foo', newFacing);

      // the game should ignore this
      game.setPlayerFacing('foo', getNextDirectionClockwise(newFacing));

      expect(game.players[0].facing).toEqual(newFacing);
    });
  });
});
