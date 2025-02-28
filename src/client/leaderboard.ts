import type { Score } from '../server/leaderboard';
import type { GameClient } from './gameClient';

const LEADERBOARD_SPOTS = 10;

// Score type with optional playedAt and causeOfDeath
type LiveScore = Omit<Score, 'playedAt' | 'causeOfDeath'> &
  Partial<Pick<Score, 'playedAt' | 'causeOfDeath'>>;

export interface LeaderboardData {
  all: (LiveScore | null)[];
  personalBest: LiveScore | undefined;
}

export class Leaderboard {
  private game: GameClient;
  private data: LeaderboardData;

  public get playerCurrentScore(): number | undefined {
    return this.game.player.snake?.score;
  }
  public get personalBest(): number | undefined {
    return this.data.personalBest?.score;
  }
  public get all(): (LiveScore | null)[] {
    return this.data.all;
  }

  constructor(game: GameClient, initialData: LeaderboardData) {
    this.game = game;
    this.data = initialData;

    this.game.events.on('tick', () => {
      const ourPlayersScore = this.game.player.snake?.score;

      const currentRoundIsPersonalBest =
        ourPlayersScore != null &&
        ourPlayersScore >= (this.data.personalBest?.score ?? 0);

      if (currentRoundIsPersonalBest) {
        this.data.personalBest = {
          playerId: this.game.player.id,
          name: this.game.player.snake?.name ?? 'Unknown',
          score: ourPlayersScore,
        };
      }

      // partially update the leaderboard with the current scores of all players, if the players are on the leaderboard:
      const sache = this.data.all
        .filter((i) => i != null && i.causeOfDeath != null)
        .concat(
          this.game.state.players.map((i) => ({
            playerId: i.id,
            name: i.name,
            score: i.score,
          }))
        )
        .toSorted((a, b) => b!.score - a!.score)
        .slice(0, Math.max(this.data.all.length, LEADERBOARD_SPOTS));

      // if sache has fewer than LEADERBOARD_SPOTS entries, fill it up with null
      this.data.all = sache.concat(
        Array.from({ length: LEADERBOARD_SPOTS - sache.length }, () => null)
      );
    });
    this.game.events.on('playerDeath', (player) => {
      const deadPlayerScore = {
        playerId: player.player.id,
        name: player.player.name,
        score: player.player.score,
        causeOfDeath: player.cause,
        playedAt: Date.now(),
      };
      const sache = this.data.all
        .filter((i) => i != null && i.causeOfDeath != null)
        .concat([deadPlayerScore])
        .concat(
          this.game.state.players.map((i) => ({
            playerId: i.id,
            name: i.name,
            score: i.score,
          }))
        )
        .toSorted((a, b) => b!.score - a!.score)
        .slice(0, Math.max(this.data.all.length, LEADERBOARD_SPOTS));

      // if sache has fewer than LEADERBOARD_SPOTS entries, fill it up with null
      this.data.all = sache.concat(
        Array.from({ length: LEADERBOARD_SPOTS - sache.length }, () => null)
      );
    });
  }
}
