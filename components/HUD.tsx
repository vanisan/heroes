'use client';

import { useGame } from '@/lib/GameContext';
import { Coins, Gem, User as UserIcon, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function HUD() {
  const { player, goldLimit } = useGame();

  if (!player) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-b border-amber-600/30 p-2 flex items-center justify-between shadow-lg">
      <div className="flex gap-1.5 items-center overflow-x-auto no-scrollbar">
        <ResourceBox 
          icon="💰" 
          value={player.gold} 
          limit={goldLimit}
          color="amber"
          label="Золото"
        />
        <ResourceBox 
          icon="💎" 
          value={player.diamonds} 
          color="cyan"
          label="Алмазы"
        />
        <div className="flex flex-col items-start bg-slate-800/80 rounded px-2 py-0.5 border border-amber-500/20">
          <span className="text-[10px] text-amber-500/70 font-bold uppercase tracking-tight leading-none">БР</span>
          <span className="text-[11px] font-mono font-black text-amber-400">{(player.battleRating || 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-right hidden xs:block">
          <div className="text-[10px] uppercase text-slate-400 leading-none">Звание</div>
          <div className="text-[11px] font-bold text-amber-500 uppercase tracking-tight">Полководец {player.displayName}</div>
        </div>
        <div className="w-9 h-9 rounded-full border-2 border-amber-600 bg-slate-700 flex items-center justify-center text-lg shadow-inner ring-1 ring-black/50">
          🛡️
        </div>
      </div>
    </header>
  );
}

function ResourceBox({ icon, value, color, limit, label }: { icon: string, value: number, color: 'amber' | 'cyan', limit?: number, label?: string }) {
  const isNearLimit = limit && value >= limit;
  return (
    <div className={`flex flex-col bg-slate-900/50 rounded px-2 py-0.5 border border-slate-700 min-w-[70px] ${isNearLimit ? 'border-rose-500/50' : ''}`}>
      <div className="flex items-center">
        <span className="text-xs mr-1">{icon}</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={value}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`font-mono text-[11px] font-bold ${isNearLimit ? 'text-rose-500' : 'text-slate-200'}`}
          >
            {value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value.toLocaleString()}
          </motion.span>
        </AnimatePresence>
      </div>
      {limit && (
        <div className="text-[8px] font-mono text-slate-500 text-right leading-none -mt-0.5">
          /{limit >= 1000000 ? `${(limit / 1000000).toFixed(1)}M` : limit.toLocaleString()}
        </div>
      )}
    </div>
  );
}
