'use client';

import { useGame } from '@/lib/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sword, User, Package, Star, Heart, Zap, ChevronRight, X, Coins, ArrowUp } from 'lucide-react';
import React, { useState } from 'react';
import { formatNumber } from '@/lib/utils';

export default function HeroView() {
  const { player, items, equipItem, unequipItem, sellItem, upgradeItem } = useGame();
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [imgError, setImgError] = useState(false);
  
  if (!player || !player.hero) return null;

  const inventorySize = 20;
  const emptySlots = Math.max(0, inventorySize - items.length);

  const handleEquip = async (item: any) => {
    await equipItem(item);
    setSelectedItem(null);
  };
  
  const handleSell = async (item: any) => {
    // refund 50% of cost roughly, or base gold
    const refund = Math.floor((item.cost || 1000) * 0.5 * (item.level || 1));
    await sellItem(item.id, refund);
    setSelectedItem(null);
  };

  const handleUpgrade = async (item: any) => {
    const cost = Math.floor((item.cost || 1500) * 0.8 * (item.level || 1));
    if (player.gold >= cost) {
       await upgradeItem(item.id, cost);
       // Close modal or keep it open? Let's close to force refresh of selected item state easily
       setSelectedItem(null);
    } else {
       alert("Недостаточно золота для улучшения");
    }
  };

  const calculateTotalHeroStats = () => {
    let hp = 100 + (player.hero.level * 20);
    let atk = 100 + (player.hero.level * 10);
    let def = 100 + (player.hero.level * 5);
    
    if (player.hero.equipment.weapon?.stats) {
      atk += (player.hero.equipment.weapon.stats.attack || 0);
      hp += (player.hero.equipment.weapon.stats.hp || 0);
      def += (player.hero.equipment.weapon.stats.defense || 0);
    }
    if (player.hero.equipment.armor?.stats) {
      atk += (player.hero.equipment.armor.stats.attack || 0);
      hp += (player.hero.equipment.armor.stats.hp || 0);
      def += (player.hero.equipment.armor.stats.defense || 0);
    }
    
    return { hp, atk, def };
  };

  const stats = calculateTotalHeroStats();

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
                <img 
                  src="/game-assets/hero/hero.webp" 
                  alt="Hero" 
                  className="w-full h-full object-cover" 
                  onError={() => setImgError(true)}
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
              <Stat icon={<Heart className="w-3 h-3 text-rose-500" />} label="HP" value={formatNumber(stats.hp)} />
              <Stat icon={<Sword className="w-3 h-3 text-blue-400" />} label="ATK" value={formatNumber(stats.atk)} />
              <Stat icon={<Shield className="w-3 h-3 text-amber-500" />} label="DEF" value={formatNumber(stats.def)} />
           </div>
        </div>
      </div>

      <div className="mb-6 px-2">
        <h3 className="text-[10px] font-bold uppercase text-slate-500 mb-4 tracking-widest">Снаряжение</h3>
        <div className="grid grid-cols-2 gap-3">
          <EquipmentSlot label="Оружие" type="weapon" item={player.hero.equipment.weapon} icon={<Sword />} onUnequip={() => unequipItem('weapon')} onClick={() => player.hero.equipment.weapon && setSelectedItem(player.hero.equipment.weapon)} />
          <EquipmentSlot label="Броня" type="armor" item={player.hero.equipment.armor} icon={<Shield />} onUnequip={() => unequipItem('armor')} onClick={() => player.hero.equipment.armor && setSelectedItem(player.hero.equipment.armor)} />
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
            <button key={item.id} onClick={() => setSelectedItem(item)} className="aspect-square bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center text-3xl relative group hover:bg-slate-800 transition-colors">
               {item.icon}
               <div className="absolute -bottom-1 -right-1 bg-slate-950 px-1 rounded text-[8px] font-bold border border-slate-800 text-slate-400">lvl {item.level || 1}</div>
               {((player.hero.equipment.weapon?.id === item.id) || (player.hero.equipment.armor?.id === item.id)) && (
                 <div className="absolute -top-1 -left-1 bg-emerald-500 w-2 h-2 rounded-full border border-slate-900"></div>
               )}
            </button>
          ))}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square bg-slate-950/50 border border-slate-900 rounded-lg flex items-center justify-center opacity-30">
               <div className="w-4 h-4 border border-slate-800 rounded-sm"></div>
            </div>
          ))}
        </div>
        
        <p className="text-[10px] text-slate-600 text-center mt-6 uppercase font-bold tracking-tighter">Снаряжение можно найти в Лавке</p>
      </div>

      <AnimatePresence>
        {selectedItem && (
           <ItemModal 
              item={selectedItem} 
              player={player}
              onClose={() => setSelectedItem(null)} 
              onEquip={() => handleEquip(selectedItem)}
              onUnequip={() => unequipItem(selectedItem.type)}
              onSell={() => handleSell(selectedItem)}
              onUpgrade={() => handleUpgrade(selectedItem)}
              isEquipped={player.hero.equipment.weapon?.id === selectedItem.id || player.hero.equipment.armor?.id === selectedItem.id}
           />
        )}
      </AnimatePresence>
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

function EquipmentSlot({ label, type, item, icon, onUnequip, onClick }: { label: string, type: string, item: any, icon: any, onUnequip: () => void, onClick: () => void }) {
  return (
    <div onClick={onClick} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 relative group overflow-hidden cursor-pointer active:scale-[0.98] transition-transform">
       <div className="absolute inset-0 bg-amber-500 opacity-0 group-hover:opacity-[0.03] transition-opacity pointer-events-none"></div>
       <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
          <div className="text-slate-700">{React.cloneElement(icon, { className: 'w-3 h-3' })}</div>
       </div>
       <div className={`mt-1 font-bold text-[10px] uppercase truncate ${item ? 'text-amber-500' : 'text-slate-700 italic'}`}>
          {item ? <div className="flex items-center gap-2"><span className="text-xl">{item.icon}</span> <span>{item.name}</span></div> : 'Пусто'}
       </div>
       {item && (
         <button onClick={(e) => { e.stopPropagation(); onUnequip(); }} className="absolute bottom-2 right-2 flex items-center justify-center bg-rose-900/50 hover:bg-rose-600 text-rose-500 hover:text-white rounded border border-rose-800/50 p-1 text-[8px] uppercase tracking-widest font-bold transition-all">
           Снять
         </button>
       )}
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

function ItemModal({ item, player, onClose, onEquip, onUnequip, onSell, onUpgrade, isEquipped }: { item: any, player: any, onClose: () => void, onEquip: () => void, onUnequip: () => void, onSell: () => void, onUpgrade: () => void, isEquipped: boolean }) {
  const refundCost = Math.floor((item.cost || 1000) * 0.5 * (item.level || 1));
  const upgradeCost = Math.floor((item.cost || 1500) * 0.8 * (item.level || 1));
  const maxLevel = 10;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-white z-10"><X className="w-4 h-4" /></button>
        
        <div className="pt-8 pb-4 flex flex-col items-center bg-slate-800/50">
           <div className="w-20 h-20 text-5xl bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              {item.icon}
           </div>
           <h3 className="font-bold text-lg text-white uppercase text-center leading-tight mx-8">{item.name}</h3>
           <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 mt-1">Уровень {item.level || 1}</p>
        </div>

        <div className="p-6">
           <div className="flex gap-2 mb-6">
             {item.stats && Object.entries(item.stats).map(([k, v]) => (
                <div key={k} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-center flex flex-col">
                   <span className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">{k}</span>
                   <span className="font-mono font-bold text-white text-lg">+{(v as number)}</span>
                </div>
             ))}
           </div>

           <div className="flex flex-col gap-3">
              {isEquipped ? (
                 <button onClick={onUnequip} className="w-full py-4 bg-slate-800 border border-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest text-white shadow hover:bg-slate-700 active:scale-95 transition-all">
                   Снять
                 </button>
              ) : (
                 <button onClick={onEquip} className="w-full py-4 bg-indigo-600 border border-indigo-500 rounded-xl font-bold text-xs uppercase tracking-widest text-white shadow-lg shadow-indigo-900/50 hover:bg-indigo-500 active:scale-95 transition-all">
                   Экипировать
                 </button>
              )}

              <button 
                onClick={onUpgrade} 
                disabled={player.gold < upgradeCost || (item.level >= maxLevel)}
                className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg text-slate-950 ${player.gold < upgradeCost || (item.level >= maxLevel) ? 'bg-slate-700 cursor-not-allowed opacity-50 text-slate-400' : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-900/30 active:scale-95'}`}
              >
                <ArrowUp className="w-4 h-4" />
                {item.level >= maxLevel ? 'Макс. Уровень' : `Улучшить`}
                {item.level < maxLevel && (
                  <span className="flex items-center gap-1 font-mono bg-black/20 px-2 py-0.5 rounded text-white ml-2">
                    <Coins className="w-3 h-3" /> {formatNumber(upgradeCost)}
                  </span>
                )}
              </button>

              <button onClick={onSell} className="w-full py-4 bg-rose-600/10 border border-rose-600/30 rounded-xl font-bold text-[10px] uppercase tracking-widest text-rose-500 hover:bg-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2">
                Продать 
                <span className="flex items-center gap-1 font-mono text-amber-500"><Coins className="w-3 h-3" /> +{formatNumber(refundCost)}</span>
              </button>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
