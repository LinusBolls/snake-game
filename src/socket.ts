import type { Direction, SerializedGameState } from './game';

export interface ServerToClientEvents {
  tick: (data: SerializedGameState) => void;
  pong: () => void;
}

export interface ClientToServerEvents {
  spawn: (data: { name: string; color: string }) => void;
  turn: (data: { direction: Direction }) => void;
  ping: () => void;
}
