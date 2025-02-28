import type { GameClient } from './gameClient';
import type { Leaderboard } from './leaderboard';
import { UiState } from './uiState';

const themes: Record<string, { palette: string[] }> = {
  pride: {
    palette: ['#E50104', '#FE8B00', '#FEEC01', '#008029', '#004CFF', '#760789'],
  },
  trans: {
    palette: ['#57CCFB', '#F6AAB5', '#FFFFFE', '#F4AAB5'],
  },
};

export class Renderer {
  public debug = false;
  private canvas: HTMLCanvasElement;
  private game: GameClient;
  private leaderboard: Leaderboard;
  private uiState: UiState;

  public setDebug(debug: boolean): void {
    this.debug = debug;
  }

  constructor(
    canvas: HTMLCanvasElement,
    game: GameClient,
    leaderboard: Leaderboard,
    uiState: UiState
  ) {
    this.canvas = canvas;
    this.game = game;
    this.leaderboard = leaderboard;
    this.uiState = uiState;
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

  public renderUiButton(text: string, y: number, active = false): void {
    this.ctx.textAlign = 'center';
    // this.ctx.reset()

    this.setColor(active ? 'white' : 'gray');

    this.ctx.fillText(text, this.canvas.width / 2, y);

    this.ctx.textAlign = 'left';
  }

  private renderLeaderboard(x = 10, y = 20): void {
    this.setColor('white');
    this.ctx.font = '12px monospace';

    this.ctx.fillText('==== LEADERBOARD ====', x, y);

    const longestRank = this.leaderboard.all.length.toString().length;

    const longestName = this.leaderboard.all.reduce(
      (acc, score) => Math.max(acc, score?.name.length ?? 0),
      0
    );
    const longestScore = this.leaderboard.all[0]?.score.toString().length ?? 1;

    for (const [index, score] of this.leaderboard.all.entries()) {
      this.ctx.fillText(
        score
          ? `${((index + 1).toString() + '.').padEnd(longestRank + 1)}  ${score.name.toUpperCase().padEnd(longestName)}  -  ${score.score.toString().padEnd(longestScore)}`
          : `${((index + 1).toString() + '.').padEnd(longestRank + 1)}  --`,
        x,
        y + 20 + index * 20
      );
    }
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
      if (player.color.startsWith('theme:')) {
        const palette = themes[player.color.split(':')[1]]?.palette ?? [
          '#FFFFFF',
        ];

        for (const [idx, segment] of player.segments.entries()) {
          this.setColor(palette[idx % palette.length]);

          this.ctx.fillRect(
            segment.pos.x * this.scale,
            segment.pos.y * this.scale,
            this.scale,
            this.scale
          );
        }
      } else {
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
      this.renderLeaderboard();

      if (this.uiState.isGameOver) {
        this.ctx.font = 'bold 32px monospace';
        this.renderUiButton(
          'SCORE: ' + this.uiState.playerDeath!.player.score,
          this.canvas.height / 2 - 110,
          true
        );
        this.ctx.font = 'bold 16px monospace';
        this.renderUiButton(
          'PERSONAL BEST: ' + (this.leaderboard.personalBest ?? 0),
          this.canvas.height / 2 - 80
        );
      }

      if (this.uiState.isStartMenuOpen) {
        this.ctx.font = 'bold 16px monospace';
        this.renderUiButton(
          `[PRESS SPACE TO PLAY${this.uiState.isGameOver ? ' AGAIN' : ''}]`,
          this.canvas.height / 2 + 80,
          this.uiState.startMenuSelectedOption === 0
        );
        this.renderUiButton(
          '[PRESS R TO RENAME]',
          this.canvas.height / 2 + 110,
          this.uiState.startMenuSelectedOption === 1
        );
        this.renderUiButton(
          '[PRESS C TO CHANGE COLOR]',
          this.canvas.height / 2 + 140,
          this.uiState.startMenuSelectedOption === 2
        );
      } else if (this.uiState.isNameMenuOpen) {
        this.ctx.font = 'bold 16px monospace';
        this.renderUiButton(
          'ENTER YOUR NAME: ' +
            this.uiState.userName.toUpperCase() +
            (this.uiState.showBlinkingCursor() ? '_' : ' '),
          this.canvas.height / 2 - 50,
          true
        );
      }

      if (this.uiState.isGameOver) {
        this.setColor('white');

        this.ctx.textAlign = 'center';

        // bar in the center of the screen that fills the whole width
        this.ctx.fillRect(0, this.canvas.height / 2 - 5, this.canvas.width, 50);

        // text thats centered inside the bar
        this.setColor('black', false);
        this.ctx.font = 'bold 32px monospace';
        this.ctx.fillText(
          'GAME OVER',
          this.canvas.width / 2,
          this.canvas.height / 2 + 32
        );

        this.ctx.textAlign = 'left';
      }
    } else {
      this.ctx.textAlign = 'center';
      this.setColor('white');
      this.ctx.font = 'bold 16px monospace';

      this.ctx.fillText(
        `Your Score: ${this.leaderboard.playerCurrentScore ?? 0}`,
        this.canvas.width / 2,
        20
      );
      this.ctx.fillText(
        `Personal Best: ${this.leaderboard.personalBest ?? 0}`,
        this.canvas.width / 2,
        50
      );
      this.ctx.fillText(
        `Highscore: ${this.leaderboard.all[0]?.score ?? 0}`,
        this.canvas.width / 2,
        80
      );
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
