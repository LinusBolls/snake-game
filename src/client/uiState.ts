import type { PlayerDeath } from '../game';
import type { GameClient } from './gameClient';

const numStartMenuOptions = 3;

export class UiState {
  private game: GameClient;

  constructor(game: GameClient) {
    this.game = game;
  }

  public get isGameOver(): boolean {
    return this.playerDeath != null;
  }

  public startMenuSelectedOption = 0;
  public colorSelectedOption = 0;

  public userName = localStorage.getItem('snake:name') || '';

  public playerDeath: PlayerDeath | null = null;

  public selectNextStartMenuOption(): void {
    this.startMenuSelectedOption =
      (this.startMenuSelectedOption + 1) % numStartMenuOptions;
  }
  public selectPreviousStartMenuOption(): void {
    this.startMenuSelectedOption =
      (this.startMenuSelectedOption - 1 + numStartMenuOptions) %
      numStartMenuOptions;
  }
  public selectNextColorOption(): void {
    this.colorSelectedOption = (this.colorSelectedOption + 1) % 3;
  }
  public selectPreviousColorOption(): void {
    this.colorSelectedOption = (this.colorSelectedOption - 1 + 3) % 3;
  }
  public setUserName(name: string): void {
    this.userName = name;
    localStorage.setItem('snake:name', name);
  }
  public setGameOver(playerDeath: PlayerDeath): void {
    this.playerDeath = playerDeath;
  }

  public isColorMenuOpen = false;
  public isNameMenuOpen = false;

  public openColorMenu(): void {
    this.isColorMenuOpen = true;
    this.isNameMenuOpen = false;
  }
  public openNameMenu(): void {
    this.isColorMenuOpen = false;
    this.isNameMenuOpen = true;
  }
  public goToStartMenu(): void {
    this.isColorMenuOpen = false;
    this.isNameMenuOpen = false;
  }

  public handleNextOption(): void {
    if (this.isColorMenuOpen) {
      this.selectNextColorOption();
    } else if (this.isStartMenuOpen) {
      this.selectNextStartMenuOption();
    }
  }
  public handlePreviousOption(): void {
    if (this.isColorMenuOpen) {
      this.selectPreviousColorOption();
    } else if (this.isStartMenuOpen) {
      this.selectPreviousStartMenuOption();
    }
  }

  public get isStartMenuOpen(): boolean {
    return !this.isColorMenuOpen && !this.isNameMenuOpen;
  }

  public handleCurrentOption(): void {
    if (this.isStartMenuOpen) {
      switch (this.startMenuSelectedOption) {
        case 0:
          this.game.player.spawn({
            name: localStorage.getItem('snake:name') || 'Unknown',
            color: localStorage.getItem('snake:color') || 'lime',
          });
          break;
        case 1:
          this.openNameMenu();
          break;
        case 2:
          this.openColorMenu();
          break;
      }
    }
  }

  public showBlinkingCursor(): boolean {
    return this.isNameMenuOpen && Math.floor(performance.now() / 500) % 2 === 0;
  }
}
