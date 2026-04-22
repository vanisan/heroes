'use client';

import { useGame } from '@/lib/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Trophy, Shield, User, ChevronRight, Skull } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import React, { useEffect, useState } from 'react';

export default function ArenaView({ onStartBattle }: { onStartBattle: (scenario: any) => void }) {
  const { player, getLeaderboard } = useGame();
  const [mode, setMode] = useState<'hub' | 'pvp' | 'mobs' | 'boss'>('hub');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === 'pvp') {
      const load = async () => {
        setLoading(true);
        const data = await getLeaderboard();
        setLeaderboard(data);
        setLoading(false);
      };
      load();
    }
  }, [mode, getLeaderboard]);

  if (!player) return null;

  if (mode === 'hub') {
    return (
      <div className="p-4 pt-20 mb-32 bg-slate-950 min-h-screen">
        <div className="mb-8 px-2">
          <h2 className="font-display font-bold text-xs uppercase tracking-widest text-slate-500 mb-1">Центр Сражений</h2>
          <p className="text-[10px] text-slate-600 uppercase font-bold">Выберите тип битвы для получения славы и ресурсов</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <CombatModeCard 
            title="Охота на Монстров" 
            desc="Очистите окрестности от монстров и получите золото."
            icon="👹"
            color="emerald"
            onClick={() => onStartBattle({ type: 'mobs', enemyName: 'Монстры' })}
          />
          <CombatModeCard 
            title="Арена (PvP)" 
            desc="Сразитесь с другими игроками за место в рейтинге."
            icon="🏆"
            color="amber"
            onClick={() => setMode('pvp')}
          />
          <CombatModeCard 
            title="Мировые Боссы" 
            desc="Легендарные существа с ценным лутом. Требуется сильная армия."
            icon="🐉"
            color="rose"
            onClick={() => setMode('boss')}
          />
        </div>
      </div>
    );
  }

  if (mode === 'pvp') {
    return (
      <div className="p-4 pt-20 mb-32 bg-slate-950 min-h-screen">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setMode('hub')} className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
            <ChevronRight className="w-4 h-4 text-slate-400 rotate-180" />
          </button>
          <h2 className="font-display font-bold text-sm uppercase text-amber-500 tracking-widest">PvP Арена</h2>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-12 flex justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {leaderboard.map((other, index) => {
                const isSelf = other.uid === player.uid;
                return (
                  <div key={other.uid} className={`flex items-center justify-between p-4 ${isSelf ? 'bg-amber-600/5' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-6 text-center font-mono text-sm font-bold text-slate-500">
                        {index + 1}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                        {isSelf ? '👑' : '🛡️'}
                      </div>
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-tight ${isSelf ? 'text-amber-500' : 'text-white'}`}>
                          {other.displayName}
                        </p>
                        <div className="flex items-center gap-1.5 grayscale opacity-70">
                           <Shield className="w-3 h-3 text-amber-500" />
                           <span className="text-[10px] font-mono font-bold text-amber-500">{other.battleRating?.toLocaleString() || 0} БР</span>
                        </div>
                      </div>
                    </div>

                    {!isSelf && (
                      <button 
                        onClick={() => onStartBattle({
                          type: 'pvp',
                          enemyName: other.displayName,
                          enemyGarrison: other.garrison || { knight: 5 }
                        })}
                        className="px-3 py-1.5 bg-rose-600/10 border border-rose-500/20 rounded text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1.5 active:scale-95 hover:bg-rose-600/20"
                      >
                        <Sword className="w-3 h-3" />
                        Напасть
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (mode === 'boss') {
    return (
      <div className="p-4 pt-20 mb-32 bg-slate-950 min-h-screen">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setMode('hub')} className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
            <ChevronRight className="w-4 h-4 text-slate-400 rotate-180" />
          </button>
          <h2 className="font-display font-bold text-sm uppercase text-rose-500 tracking-widest tracking-widest">Мировые Боссы</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
           {[
             { name: 'Гигантский Паук', diff: 1, reward: 5000, drop: '0.25%', icon: '🕷️', color: 'rose' },
             { name: 'Древний Голем', diff: 3, reward: 15000, drop: '33%', icon: '🗿', color: 'rose' },
             { name: 'Повелитель Бездны', diff: 10, reward: 50000, drop: '50%', icon: '👿', color: 'rose' },
             { name: 'Император Драконов', diff: 25, reward: 200000, drop: '80%', icon: '👑', color: 'rose' },
           ].map(boss => (
             <button 
               key={boss.name}
               onClick={() => onStartBattle({ type: 'boss', enemyName: boss.name, difficulty: boss.diff })}
               className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-6 text-left active:scale-[0.98]"
             >
                <div className="text-4xl">{boss.icon}</div>
                <div className="flex-1">
                  <h3 className="font-bold text-white uppercase text-sm mb-1">{boss.name}</h3>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-rose-500 uppercase">Сложность: {boss.diff}</span>
                    <span className="text-[10px] font-bold text-amber-500 uppercase">Награда: {formatNumber(boss.reward)} зл.</span>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase">Шанс Алмаза: {boss.drop}</span>
                  </div>
                </div>
                <Sword className="w-5 h-5 text-slate-700" />
             </button>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-20 mb-32 bg-slate-950 min-h-screen">
       {/* ... existing mobs placeholder if any ... */}
    </div>
  );
}

function CombatModeCard({ title, desc, icon, color, onClick }: { title: string, desc: string, icon: string, color: string, onClick: () => void }) {
  const colorMap: any = {
    emerald: 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400',
    amber: 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500',
    rose: 'border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500'
  };

  return (
    <button 
      onClick={onClick}
      className={`p-6 rounded-2xl border flex items-center gap-6 text-left transition-all active:scale-[0.98] ${colorMap[color] || ''}`}
    >
      <div className="text-4xl">{icon}</div>
      <div>
        <h3 className="font-display font-bold text-lg uppercase tracking-tight mb-1 text-white">{title}</h3>
        <p className="text-[10px] opacity-60 leading-relaxed font-bold uppercase tracking-tighter">{desc}</p>
      </div>
    </button>
  );
}
