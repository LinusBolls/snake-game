import { io, type Socket } from 'socket.io-client';

import type { ClientToServerEvents, ServerToClientEvents } from '../socket';

const SERVER_URL = window.location.protocol + '//' + window.location.host;

const AUTH_STORAGE_KEY = 'snake:player';

export async function getPlayer(): Promise<{
  playerId: string;
  token: string;
}> {
  const storedPlayer = localStorage.getItem(AUTH_STORAGE_KEY);

  if (storedPlayer) return JSON.parse(storedPlayer);

  const res = await fetch(SERVER_URL + '/join', { method: 'POST' });

  const data = await res.json();

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.data));

  return data.data.token;
}

export async function getSocket(
  token: string
): Promise<Socket<ServerToClientEvents, ClientToServerEvents>> {
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
    SERVER_URL,
    {
      transports: ['websocket'],
      auth: { token },
    }
  );
  return socket;
}
