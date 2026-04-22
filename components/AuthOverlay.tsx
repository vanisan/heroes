'use client';

import React, { useState } from 'react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, ShieldCheck, UserPlus, Key } from 'lucide-react';

export default function AuthOverlay() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    if (username.length < 3) {
      setAuthError('Логин должен быть не менее 3 символов');
      return;
    }
    if (password.length < 6) {
      setAuthError('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);

    // Create a fake email using the given username under the hood
    // This removes the need for actual emails while meeting Firebase requirements
    const safeUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = `${safeUsername}@heroes-game.local`;

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: username });
        window.location.reload(); // Hard reload to fetch the new player profile correctly
      }
    } catch (err: any) {
      console.error('Auth failed', err);
      
      if (err.code === 'auth/operation-not-allowed') {
        setAuthError(`ВХОД ПО ЛОГИНУ ОТКЛЮЧЕН!\n\nЗайдите в консоль Firebase -> Authentication -> Sign-in method -> и включите "Email/Password".`);
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setAuthError('Неверный логин или пароль.');
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError('Игрок с таким логином уже существует. Попробуйте другой или войдите.');
      } else if (err.code === 'auth/weak-password') {
        setAuthError('Пароль слишком простой (нужно минимум 6 символов).');
      } else {
        setAuthError(`Ошибка входа: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-amber-600/5 pointer-events-none"></div>
        
        <div className="w-16 h-16 bg-amber-600/20 border border-amber-600/50 rounded-2xl flex items-center justify-center mx-auto mb-6 relative">
          <ShieldCheck className="w-8 h-8 text-amber-500" />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold mb-1 uppercase tracking-tight text-white italic">Герои Мира</h1>
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
            {isLogin ? 'Возвращение полководца' : 'Регистрация героя'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl overflow-hidden focus-within:border-amber-500/50 transition-colors flex items-center px-4">
            <UserPlus className="w-4 h-4 text-slate-500 shrink-0" />
            <input 
              type="text" 
              placeholder="Придумайте логин"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="w-full bg-transparent border-none text-white text-sm font-bold py-4 px-3 outline-none placeholder:text-slate-600"
            />
          </div>

          <div className="bg-slate-950/50 border border-slate-800 rounded-xl overflow-hidden focus-within:border-amber-500/50 transition-colors flex items-center px-4">
            <Key className="w-4 h-4 text-slate-500 shrink-0" />
            <input 
              type="password" 
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full bg-transparent border-none text-white text-sm font-bold py-4 px-3 outline-none placeholder:text-slate-600"
            />
          </div>

          <AnimatePresence>
            {authError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-[10px] bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 text-rose-500 font-bold whitespace-pre-line"
              >
                {authError}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 active:scale-95 transition-all text-slate-950 font-bold py-4 rounded-xl shadow-lg shadow-amber-600/20 mt-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : isLogin ? (
              <><LogIn className="w-4 h-4" /> Войти в игру</>
            ) : (
              <><ShieldCheck className="w-4 h-4" /> Создать аккаунт</>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => { setIsLogin(!isLogin); setAuthError(null); }}
            disabled={loading}
            className="text-[11px] text-slate-400 hover:text-amber-500 font-bold uppercase tracking-widest transition-colors"
          >
            {isLogin ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
