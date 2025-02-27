import type { Score } from '../server/leaderboard';
import type { GameClient } from './gameClient';

interface LeaderboardData {
  all: Score[];
  personalBest: Score | undefined;
}

export class Leaderboard {
  // public get playerCurrentScore() {}
  // public get playerPersonalBest() {}
  // public get topSpots() {}
  // public get allTimeRecords() {}

  public initialData: LeaderboardData;

  private game: GameClient;

  constructor(game: GameClient, initialData: LeaderboardData) {
    this.game = game;
    this.initialData = initialData;

    this.game.events.on('tick', () => {
      const ourPlayersScore = this.game.player.snake?.score;

      const currentRoundIsPersonalBest =
        ourPlayersScore != null &&
        ourPlayersScore >= (this.initialData.personalBest?.score ?? 0);

      if (currentRoundIsPersonalBest) {
      }
    });
  }
}
