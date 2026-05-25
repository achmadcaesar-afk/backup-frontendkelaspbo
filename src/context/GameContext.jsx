import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../services/websocket';

const GameContext = createContext(null);

export const GameProvider = ({ children }) => {
  // Cek apakah ada sesi tersimpan di localStorage
  const storedUser = api.getStoredUser();

  const [playerName, setPlayerName] = useState(storedUser?.username || '');
  const [mowerColor, setMowerColor] = useState(
    storedUser?.lastColor ? storedUser.lastColor.toLowerCase() : 'red'
  );
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [isHost, setIsHost] = useState(false);

  // Auth state
  const [authUser, setAuthUser] = useState(storedUser); // { id, username, lastColor }
  const isLoggedIn = !!authUser;

  const handleLogin = useCallback((userData) => {
    setAuthUser(userData);
    setPlayerName(userData.username);
    setMowerColor(userData.lastColor.toLowerCase());
  }, []);

  const handleLogout = useCallback(() => {
    api.logout();
    setAuthUser(null);
    setPlayerName('');
    setMowerColor('red');
    setMyPlayerId(null);
    setRoomCode(null);
    setIsHost(false);
  }, []);

  // Update warna di backend saat warna berubah (hanya kalau sudah login)
  const handleColorChange = useCallback((color) => {
    setMowerColor(color);
    if (authUser) {
      // Update lastColor di backend (fire and forget)
      api.updateLastColor(color.toUpperCase()).catch(() => {});
      // Update localStorage
      const updated = { ...authUser, lastColor: color.toUpperCase() };
      setAuthUser(updated);
      localStorage.setItem('auth_user', JSON.stringify(updated));
    }
  }, [authUser]);

  const reset = useCallback(() => {
    setMyPlayerId(null);
    setRoomCode(null);
    setIsHost(false);
  }, []);

  return (
    <GameContext.Provider value={{
      playerName, setPlayerName,
      mowerColor, setMowerColor: handleColorChange,
      myPlayerId, setMyPlayerId,
      roomCode, setRoomCode,
      isHost, setIsHost,
      authUser,
      isLoggedIn,
      handleLogin,
      handleLogout,
      reset,
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used within GameProvider');
  return ctx;
};
