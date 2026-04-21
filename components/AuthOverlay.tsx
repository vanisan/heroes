'use client';

import { auth, googleProvider, signInWithPopup } from '@/lib/firebase';
import { motion } from 'motion/react';
import { LogIn, ShieldCheck } from 'lucide-react';

export default function AuthOverlay() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-amber-600/5 pointer-events-none"></div>
        <div className="w-16 h-16 bg-amber-600/20 border border-amber-600/50 rounded-2xl flex items-center justify-center mx-auto mb-6 relative">
          <ShieldCheck className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="font-display text-2xl font-bold mb-2 uppercase tracking-tight text-white italic">Герои Мира</h1>
        <p className="text-slate-400 mb-8 text-[11px] uppercase tracking-widest font-bold">
          Куй свою легенду. Командуй на рубеже.
        </p>
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-amber-600 hover:bg-amber-500 active:scale-95 transition-all text-slate-950 font-bold py-4 rounded-xl shadow-lg shadow-amber-600/20"
        >
          <LogIn className="w-5 h-5" />
          Войти через Google
        </button>
        <p className="mt-6 text-[9px] text-slate-600 uppercase tracking-[0.2em] font-bold">
          Защищенная игровая сессия
        </p>
      </motion.div>
    </div>
  );
}
