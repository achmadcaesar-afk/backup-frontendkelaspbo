import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const WS_URL  = import.meta.env.VITE_WS_URL  || 'http://localhost:8080/ws';

let stompClient = null;
let subscriptions = {};

// ---- Helper: ambil token dari localStorage ----
function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // ---- Auth ----
  async register(username, password) {
    return fetchJson(`${API_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async login(username, password) {
    const data = await fetchJson(`${API_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    // Simpan token dan data user ke localStorage
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify({
      id: data.id,
      username: data.username,
      lastColor: data.lastColor,
    }));
    return data;
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  getStoredUser() {
    const raw = localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  },

  async updateLastColor(color) {
    return fetchJson(`${API_URL}/auth/me/color`, {
      method: 'PUT',
      body: JSON.stringify({ color }),
    });
  },

  // ---- Room ----
  async createRoom(playerName, color) {
    return fetchJson(`${API_URL}/rooms`, {
      method: 'POST',
      body: JSON.stringify({ playerName, color: color.toUpperCase() }),
    });
  },

  async joinRoom(playerName, color, roomCode) {
    return fetchJson(`${API_URL}/rooms/join`, {
      method: 'POST',
      body: JSON.stringify({ playerName, color: color.toUpperCase(), roomCode }),
    });
  },

  async getRoom(code, playerId) {
    return fetchJson(`${API_URL}/rooms/${code}?playerId=${playerId}`);
  },

  async disbandRoom(code) {
    return fetchJson(`${API_URL}/rooms/${code}`, { method: 'DELETE' });
  },

  // ---- Game ----
  async startGame(roomCode) {
    return fetchJson(`${API_URL}/game/${roomCode}/start`, { method: 'POST' });
  },

  async retryGame(roomCode) {
    return fetchJson(`${API_URL}/game/${roomCode}/retry`, { method: 'POST' });
  },

  async getStats(playerId) {
    return fetchJson(`${API_URL}/game/stats/${playerId}`);
  },
};

export const ws = {
  connect(onConnected, onError) {
    stompClient = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 3000,
      connectHeaders: getAuthHeaders(),
      onConnect: () => {
        console.log('WebSocket connected');
        onConnected?.();
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame);
        onError?.(frame);
      },
    });
    stompClient.activate();
  },

  disconnect() {
    Object.values(subscriptions).forEach(sub => sub?.unsubscribe());
    subscriptions = {};
    stompClient?.deactivate();
    stompClient = null;
  },

  subscribeRoom(roomCode, onMessage) {
    if (!stompClient?.connected) return;
    const key = `room-${roomCode}`;
    subscriptions[key]?.unsubscribe();
    subscriptions[key] = stompClient.subscribe(
      `/topic/room/${roomCode}`,
      (msg) => onMessage(JSON.parse(msg.body))
    );
  },

  subscribePowerUp(roomCode, onMessage) {
    if (!stompClient?.connected) return;
    const key = `powerup-${roomCode}`;
    subscriptions[key]?.unsubscribe();
    subscriptions[key] = stompClient.subscribe(
      `/topic/room/${roomCode}/powerup`,
      (msg) => onMessage(JSON.parse(msg.body))
    );
  },

  sendInput(roomCode, playerId, direction, activatePowerUp = false) {
    if (!stompClient?.connected) return;
    stompClient.publish({
      destination: `/app/game/${roomCode}/input`,
      body: JSON.stringify({ playerId, direction, activatePowerUp }),
    });
  },

  sendQuizAnswer(roomCode, playerId, selectedIndex) {
    if (!stompClient?.connected) return;
    stompClient.publish({
      destination: `/app/game/${roomCode}/quiz-answer`,
      body: JSON.stringify({ playerId, selectedIndex }),
    });
  },

  isConnected() {
    return stompClient?.connected ?? false;
  },
};
