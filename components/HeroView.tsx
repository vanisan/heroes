'use client';

import { useGame } from '@/lib/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sword, User, Package, Star, Heart, Zap, ChevronRight } from 'lucide-react';
import React from 'react';
import Image from 'next/image';
import { formatNumber } from '@/lib/utils';

export default function HeroView() {
  const { player, items } = useGame();
  const [imgError, setImgError] = React.useState(false);

  if (!player || !player.hero) return null;

  const inventorySize = 20;
  const emptySlots = Math.max(0, inventorySize - items.length);

  return (
    <div className="p-4 pt-20 mb-32 bg-slate-950 min-h-screen">
      <div className="mb-8 px-2">
        <h2 className="font-display font-bold text-xs uppercase tracking-widest text-slate-500 mb-1">Ваш Герой</h2>
        <p className="text-[10px] text-slate-600 uppercase font-bold">Улучшайте навыки и снаряжение легендарного лидера</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative shadow-2xl mb-6">
        <div className="h-40 bg-gradient-to-b from-amber-600/20 to-transparent flex flex-col items-center justify-center pt-8">
           <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-900 shadow-xl flex items-center justify-center text-5xl relative overflow-hidden">
              {!imgError ? (
                <Image 
                  src="/icons/hero/hero.webp" 
                  alt="Hero" 
                  fill 
                  className="object-cover" 
                  onError={() => setImgError(true)}
                  referrerPolicy="no-referrer"
                />
              ) : (
                '🛡️'
              )}
              <div className="absolute -bottom-2 -right-2 bg-amber-500 border-2 border-slate-900 rounded-full w-10 h-10 flex items-center justify-center text-xs font-black text-slate-950 z-10">
                 {player.hero.level}
              </div>
           </div>
        </div>

        <div className="p-6 text-center">
           <h3 className="text-xl font-display font-bold text-white uppercase italic tracking-tighter mb-1">{player.displayName}</h3>
           <p className="text-[10px] text-amber-500 font-bold uppercase tracking-[0.3em] mb-4">Легендарный Защитник</p>
           
           <div className="flex justify-center gap-6 border-y border-slate-800 py-4 my-2">
              <Stat icon={<Heart className="w-3 h-3 text-rose-500" />} label="HP" value={formatNumber(100 + (player.hero.level * 20))} />
              <Stat icon={<Sword className="w-3 h-3 text-blue-400" />} label="ATK" value={formatNumber(100 + (player.hero.level * 10))} />
              <Stat icon={<Shield className="w-3 h-3 text-amber-500" />} label="DEF" value={formatNumber(100 + (player.hero.level * 5))} />
           </div>
        </div>
      </div>

      <div className="mb-6 px-2">
        <h3 className="text-[10px] font-bold uppercase text-slate-500 mb-4 tracking-widest">Снаряжение</h3>
        <div className="grid grid-cols-2 gap-3">
          <EquipmentSlot label="Оружие" item={player.hero.equipment.weapon} icon={<Sword />} />
          <EquipmentSlot label="Броня" item={player.hero.equipment.armor} icon={<Shield />} />
        </div>
      </div>

      <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-500" />
            <h3 className="text-[10px] font-bold uppercase text-slate-300">Инвентарь</h3>
          </div>
          <span className="text-[10px] text-slate-600 font-bold">{items.length} / {inventorySize}</span>
        </div>
        
        <div className="grid grid-cols-5 gap-2">
          {items.map((item) => (
            <div key={item.id} className="aspect-square bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center text-xl relative group">
               {item.icon}
               <div className="absolute -bottom-1 -right-1 bg-slate-950 px-1 rounded text-[8px] font-bold border border-slate-800 text-slate-400">lvl 1</div>
            </div>
          ))}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square bg-slate-950/50 border border-slate-900 rounded-lg flex items-center justify-center opacity-30">
               <div className="w-4 h-4 border border-slate-800 rounded-sm"></div>
            </div>
          ))}
        </div>
        
        <p className="text-[10px] text-slate-600 text-center mt-6 uppercase font-bold tracking-tighter">Снаряжение можно найти в будущих битвах или в Лавке</p>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: any, label: string, value: any }) {
  return (
    <div className="flex flex-col items-center">
       <div className="text-slate-500 mb-1">{icon}</div>
       <div className="text-[9px] font-bold text-slate-600 uppercase mb-0.5">{label}</div>
       <div className="font-mono text-xs font-bold text-slate-200">{value}</div>
    </div>
  );
}

function EquipmentSlot({ label, item, icon }: { label: string, item: string | null, icon: any }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 relative group overflow-hidden">
       <div className="absolute inset-0 bg-amber-500 opacity-0 group-hover:opacity-[0.03] transition-opacity pointer-events-none"></div>
       <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
          <div className="text-slate-700">{React.cloneElement(icon, { className: 'w-3 h-3' })}</div>
       </div>
       <div className={`mt-1 font-bold text-xs uppercase ${item ? 'text-amber-500' : 'text-slate-700 italic'}`}>
          {item || 'Пусто'}
       </div>
       {!item && <div className="absolute bottom-2 right-2 flex items-center justify-center w-5 h-5 bg-slate-800 rounded border border-slate-700 opacity-30 group-hover:opacity-100 transition-opacity">
         <Plus className="w-3 h-3 text-slate-500" />
       </div>}
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
  );
}
