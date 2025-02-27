import type { Score } from '../server/leaderboard';
import type { GameClient } from './gameClient';

export interface Leaderboard {
  all: Score[];
  personalBest: Score | undefined;
}

export class Renderer {
  public debug = false;
  private canvas: HTMLCanvasElement;
  private game: GameClient;
  private highscores: Leaderboard;

  public setDebug(debug: boolean): void {
    this.debug = debug;
  }

  constructor(
    canvas: HTMLCanvasElement,
    game: GameClient,
    highscores: Leaderboard
  ) {
    this.canvas = canvas;
    this.game = game;
    this.highscores = highscores;
  }

  private get ctx(): CanvasRenderingContext2D {
    return this.canvas.getContext('2d')!;
  }
  private get scale(): number {
    return Math.min(
      this.canvas.width / this.game.state.size.width,
      this.canvas.height / this.game.state.size.height
    );
  }

  public init(): void {
    this.game.events.on('tick', this.render.bind(this));
  }

  private setColor(color: string, bloom = true): void {
    this.ctx.shadowBlur = bloom ? 20 : 0;
    this.ctx.shadowColor = color;
    this.ctx.fillStyle = color;
  }

  public async render(): Promise<void> {
    const renderStart = performance.now();

    if (!this.game.isLoaded) return;

    if (this.debug) {
      this.setColor('red', false);

      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.setColor('orange', false);

      this.ctx.fillRect(
        0,
        0,
        this.game.state.size.width * this.scale,
        this.game.state.size.height * this.scale
      );
    } else {
      this.setColor('black', false);

      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    for (const player of this.game.state.players) {
      this.setColor(player.color);

      for (const segment of player.segments) {
        this.ctx.fillRect(
          segment.pos.x * this.scale,
          segment.pos.y * this.scale,
          this.scale,
          this.scale
        );
      }
    }
    for (const tile of this.game.state.tiles) {
      this.setColor('red');

      this.ctx.fillRect(
        tile.pos.x * this.scale,
        tile.pos.y * this.scale,
        this.scale,
        this.scale
      );
    }
    const ourPlayer = this.game.state.players.find(
      (player) => player.id === this.game.player.id
    );

    if (!ourPlayer) {
      // draw the leaderboard using the canvas ctx
      this.setColor('white');
      this.ctx.font = '12px monospace';

      for (const [index, score] of this.highscores.all.entries()) {
        this.ctx.fillText(
          `${index + 1}. ${score.name} - ${score.score}`,
          10,
          50 + index * 20
        );
      }
      // this.ctx.fillText('Leaderboard', 10, 20);
      // this.ctx.fillText('All', 10, 40);
      // this.ctx.fillText('Personal Best', 10, 60);
      // this.ctx.fillText('Rank', 100, 20);
      // this.ctx.fillText('Score', 150, 20);
      // this.ctx.fillText('Name', 200, 20);
      // this.ctx.fillText('Rank', 100, 40);
      // this.ctx.fillText('Score', 150, 40);
      // this.ctx.fillText('Name', 200, 40);
      // this.ctx.fillText('Rank', 100, 60);
      // this.ctx.fillText('Score', 150, 60);
      // this.ctx.fillText('Name', 200, 60);

      // document.querySelector('[data-display="your-score"]').style.display =
      //   'none';
    } else {
      this.setColor('lime');
      this.ctx.font = 'bold 16px monospace';

      this.ctx.fillText(`Your Score: ${ourPlayer.score}`, 10, 100);
      this.ctx.fillText(
        `Personal Best: ${this.highscores.personalBest?.score ?? 0}`,
        10,
        120
      );
      this.ctx.fillText(
        `Highscore: ${this.highscores.all[0]?.score ?? 0}`,
        10,
        140
      );
      // document.querySelector('[data-display="your-score"]').style.display =
      //   'block';

      // document.querySelector('[data-display="your-score"]').innerHTML =
      //   'Your Score: ' + ourPlayer.segments.length;
    }
    const renderEnd = performance.now();

    if (this.debug) {
      this.setColor('white');

      this.ctx.font = '12px monospace';
      this.ctx.fillText(
        `Render time: ${Math.round(renderEnd - renderStart)}ms`,
        10,
        20
      );
      this.ctx.fillText(`Ping: ${Math.floor(this.game.getPing())}ms`, 10, 40);
    }
  }
}
