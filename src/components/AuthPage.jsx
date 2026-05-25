// components/AuthPage.jsx
import { useState } from 'react';
import BushBackground from './BushBackground';
import WoodenButton from './WoodenButton';
import { api } from '../services/websocket';
import { useGameContext } from '../context/GameContext';

const AuthPage = ({ onSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setPlayerName, setMowerColor } = useGameContext();

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Username dan password tidak boleh kosong');
      return;
    }
    setError('');
    setLoading(true);

    try {
      let data;
      if (mode === 'login') {
        data = await api.login(username.trim(), password);
      } else {
        data = await api.register(username.trim(), password);
      }

      // Set nama dan warna dari data akun
      setPlayerName(data.username);
      setMowerColor(data.lastColor.toLowerCase());

      onSuccess(data);
    } catch (err) {
      // Parse pesan error dari backend
      try {
        const parsed = JSON.parse(err.message);
        setError(parsed.message || 'Terjadi kesalahan');
      } catch {
        setError(err.message || 'Terjadi kesalahan');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <BushBackground className="w-full max-w-sm">
        {/* Title */}
        <h1
          className="font-black text-white text-center mb-2"
          style={{
            fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif',
            fontSize: 'clamp(2rem, 6vw, 2.8rem)',
            textShadow: '3px 3px 0px #1a5c1a, -1px -1px 0px #32CD32',
            WebkitTextStroke: '1px #0d3d0d',
          }}
        >
          LawnMower
        </h1>
        <p
          className="text-white/80 text-center mb-6 font-bold"
          style={{ fontFamily: '"Comic Sans MS", sans-serif', fontSize: '1.1rem' }}
        >
          Quiz Game
        </p>

        {/* Tab switch */}
        <div className="flex mb-6 rounded-xl overflow-hidden border-2 border-green-600">
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 font-bold text-sm transition-colors ${
              mode === 'login'
                ? 'bg-green-600 text-white'
                : 'bg-green-900/40 text-white/60 hover:bg-green-800/40'
            }`}
          >
            LOGIN
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 font-bold text-sm transition-colors ${
              mode === 'register'
                ? 'bg-green-600 text-white'
                : 'bg-green-900/40 text-white/60 hover:bg-green-800/40'
            }`}
          >
            DAFTAR
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-3 mb-4">
          <div>
            <label className="text-white/80 text-sm font-semibold block mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Masukkan username..."
              maxLength={20}
              className="w-full px-4 py-2 rounded-lg border-2 border-green-600 bg-white/90 text-green-900 font-semibold focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-green-700/50"
            />
          </div>
          <div>
            <label className="text-white/80 text-sm font-semibold block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Masukkan password..."
              className="w-full px-4 py-2 rounded-lg border-2 border-green-600 bg-white/90 text-green-900 font-semibold focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-green-700/50"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-3 py-2 bg-red-500/30 border border-red-400 rounded-lg">
            <p className="text-red-200 text-sm font-semibold text-center">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-center">
          {loading ? (
            <p className="text-white font-bold animate-pulse">Memproses...</p>
          ) : (
            <WoodenButton
              text={mode === 'login' ? 'MASUK' : 'DAFTAR'}
              onClick={handleSubmit}
            />
          )}
        </div>

        {mode === 'register' && (
          <p className="text-white/50 text-xs text-center mt-4">
            Username 3-20 karakter, password minimal 4 karakter
          </p>
        )}
      </BushBackground>
    </div>
  );
};

export default AuthPage;
