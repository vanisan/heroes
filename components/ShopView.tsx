'use client';

import React, { useState } from 'react';
import { useGame } from '@/lib/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, ShoppingBag, Sparkles, Shield, Sword, Gem } from 'lucide-react';
import Image from 'next/image';
import { formatNumber } from '@/lib/utils';

const SHOP_ITEMS = [
  {
    id: 'sword_1',
    name: 'Стальной Меч',
    type: 'weapon',
    rarity: 'common',
    stats: { attack: 15 },
    cost: 1500,
    description: 'Надежное оружие для начинающего героя.',
    icon: '⚔️',
    webp: '/icons/items/sword_1.webp'
  },
  {
    id: 'armor_1',
    name: 'Кожаный Доспех',
    type: 'armor',
    rarity: 'common',
    stats: { defense: 10 },
    cost: 1200,
    description: 'Легкая броня, не сковывающая движений.',
    icon: '🛡️',
    webp: '/icons/items/armor_1.webp'
  },
  {
    id: 'sword_2',
    name: 'Пылающий Клинок',
    type: 'weapon',
    rarity: 'rare',
    stats: { attack: 45, fire: 10 },
    cost: 8000,
    description: 'Меч, выкованный в недрах вулкана.',
    icon: '🔥',
    webp: '/icons/items/sword_2.webp'
  },
  {
    id: 'armor_2',
    name: 'Латный Доспех',
    type: 'armor',
    rarity: 'rare',
    stats: { defense: 40 },
    cost: 7500,
    description: 'Тяжелая сталь для настоящих паладинов.',
    icon: '⛓️',
    webp: '/icons/items/armor_2.webp'
  }
];

export default function ShopView() {
  const { player, buyItem } = useGame();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!player) return null;

  const handleBuy = async (item: typeof SHOP_ITEMS[0]) => {
    try {
      await buyItem({
        name: item.name,
        type: item.type as any,
        rarity: item.rarity,
        stats: item.stats,
        cost: item.cost,
        icon: item.icon
      });
      setSuccessMsg(`Вы купили ${item.name}!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  return (
    <div className="p-4 pt-20 mb-32 bg-slate-950 min-h-screen">
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-4 right-4 z-50 bg-emerald-600 text-white p-3 rounded-lg text-center font-bold text-xs uppercase tracking-widest shadow-2xl"
          >
            {successMsg}
          </motion.div>
        )}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-4 right-4 z-50 bg-rose-600 text-white p-3 rounded-lg text-center font-bold text-xs uppercase tracking-widest shadow-2xl"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8 px-2 flex justify-between items-end">
        <div>
          <h2 className="font-display font-bold text-xs uppercase tracking-widest text-slate-500 mb-1">Лавка Артефактов</h2>
          <p className="text-[10px] text-slate-600 uppercase font-bold">Снарядите своего героя лучшим оружием</p>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full shadow-inner">
           <Coins className="w-3.5 h-3.5 text-amber-500" />
           <span className="text-xs font-mono font-bold text-amber-500">{formatNumber(player.gold)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {SHOP_ITEMS.map((item) => {
          const canAfford = player.gold >= item.cost;
          const rarityColor = item.rarity === 'rare' ? 'text-purple-400 border-purple-500/30 bg-purple-500/5' : 'text-slate-400 border-slate-700 bg-slate-800/20';
          
          return (
            <div key={item.id} className={`p-4 rounded-xl border flex gap-4 transition-all ${rarityColor}`}>
              <div className="w-16 h-16 shrink-0 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center text-3xl relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                 {item.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h3 className="font-bold text-sm text-white uppercase tracking-tight">{item.name}</h3>
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-50">{item.rarity}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins className="w-3 h-3 text-amber-600" />
                    <span className="text-[11px] font-mono font-bold text-amber-500">{formatNumber(item.cost)}</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 mb-3 italic leading-tight">{item.description}</p>
                
                <div className="flex items-center gap-4 mb-4">
                  {Object.entries(item.stats).map(([stat, val]) => (
                    <div key={stat} className="flex items-center gap-1 bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800">
                      <span className="text-[8px] uppercase font-bold text-slate-500">{stat}:</span>
                      <span className="text-[10px] font-mono font-bold text-white">+{val}</span>
                    </div>
                  ))}
                </div>

                <button
                  disabled={!canAfford}
                  onClick={() => handleBuy(item)}
                  className={`w-full py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all active:scale-[0.98]
                    ${canAfford ? 'bg-amber-600 border border-amber-500 text-slate-950 hover:bg-amber-500 shadow-lg shadow-amber-900/20' : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed grayscale'}
                  `}
                >
                  {canAfford ? 'Купить Артефакт' : 'Недостаточно Золота'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-slate-900/50 border border-slate-800 border-dashed rounded-2xl flex flex-col items-center text-center">
         <div className="p-3 bg-slate-800 rounded-full mb-3 opacity-50">
           <ShoppingBag className="w-6 h-6 text-slate-500" />
         </div>
         <p className="text-xs text-slate-500 uppercase font-bold tracking-tight">Новые товары прибудут завтра</p>
         <p className="text-[9px] text-slate-600 mt-1 uppercase font-medium">Следите за обновлениями лавки</p>
      </div>
    </div>
  );
}
