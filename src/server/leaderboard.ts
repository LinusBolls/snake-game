import fs from 'fs';
import path from 'path';

const leaderboardPath = path.resolve(
  __dirname,
  '../../static/leaderboard.json'
);

export interface Score {
  playerId: string;
  name: string;
  score: number;
  causeOfDeath: string;

  playedAt: number;
}

class Leaderboard {
  private scores: Score[] = [];

  constructor() {
    this.load();
  }

  public load(): void {
    if (fs.existsSync(leaderboardPath)) {
      const data = fs.readFileSync(leaderboardPath, 'utf8');
      this.scores = JSON.parse(data).scores;
    }
  }

  private save(): void {
    fs.writeFileSync(leaderboardPath, JSON.stringify({ scores: this.scores }));
  }

  public addScore(
    playerId: string,
    name: string,
    score: number,
    causeOfDeath: string
  ): void {
    const playedAt = Date.now();

    this.scores.push({ playerId, name, score, causeOfDeath, playedAt });

    this.save();
  }

  public getTop(n: number): Score[] {
    return this.scores.sort((a, b) => b.score - a.score).slice(0, n);
  }

  public getBestByPlayerId(playerId: string): Score | undefined {
    return this.scores
      .filter((score) => score.playerId === playerId)
      .sort((a, b) => b.score - a.score)[0];
  }
}
export const leaderboard = new Leaderboard();
