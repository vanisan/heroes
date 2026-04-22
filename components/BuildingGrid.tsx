'use client';

import { useGame, BuildingData } from '@/lib/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Hammer, X, Pickaxe, Landmark, Sword, Warehouse, Gem, Coins, Trash2 } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { formatNumber } from '@/lib/utils';

const BUILDING_TYPES = [
  { 
    type: 'gold_mine', 
    name: 'Золотой рудник', 
    icon: <Pickaxe className="w-6 h-6" />, 
    webp: '/icons/mine.webp', 
    cost: 100, 
    color: 'amber',
    description: 'Добывает золото для казны.'
  },
  { 
    type: 'town_hall', 
    name: 'Ратуша', 
    icon: <Landmark className="w-6 h-6" />, 
    webp: '/icons/hall.webp', 
    cost: 500, 
    color: 'blue',
    description: 'Центр вашего города. Позволяет расширяться.'
  },
  { 
    type: 'barracks', 
    name: 'Казармы', 
    icon: <Sword className="w-6 h-6" />, 
    webp: '/icons/barracks.webp', 
    cost: 250, 
    color: 'red',
    description: 'Увеличивает лимит армии на +20 (умножается при улучшении).'
  },
  { 
    type: 'granary', 
    name: 'Амбар', 
    icon: <Warehouse className="w-6 h-6" />, 
    webp: '/icons/granary.webp', 
    cost: 150, 
    color: 'emerald',
    description: 'Вместимость золота: (5000 * уровень) + 5000.'
  },
] as const;

export default function BuildingGrid() {
  const { player, buildings, buildStructure, expandBase, addGold, upgradeBuilding, sellBuilding } = useGame();
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [inspectBuilding, setInspectBuilding] = useState<BuildingData | null>(null);
  const [errorVisible, setErrorVisible] = useState<string | null>(null);

  const slots = Array.from({ length: player?.baseSlots || 0 }, (_, i) => i);

  // Auto-collection logic for Gold Mines
  useEffect(() => {
    if (!player || buildings.length === 0) return;

    const interval = setInterval(() => {
      const goldMines = buildings.filter(b => b.type === 'gold_mine');
      if (goldMines.length === 0) return;

      let totalGold = 0;
      goldMines.forEach(mine => {
        // Match the getGoldPerHour formula: 500 * (1.5 ^ (level - 1)) / 720 ticks per hour
        const hourlyRate = 500 * Math.pow(1.5, mine.level - 1);
        const amount = Math.max(1, Math.floor(hourlyRate / 720)); 
        totalGold += amount;
        
        // Trigger local animation events
        window.dispatchEvent(new CustomEvent('gold-mine-tap', { 
          detail: { slotIndex: mine.slotIndex, amount } 
        }));
      });

      if (totalGold > 0) {
        addGold(totalGold);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [player, buildings, addGold]);

  const handleExpand = async () => {
    try {
      await expandBase();
    } catch (err: any) {
      setErrorVisible(err.message);
      setTimeout(() => setErrorVisible(null), 3000);
    }
  };

  if (!player) return null;

  return (
    <div className="p-2 pt-16 mb-32 bg-slate-950">
      <AnimatePresence>
        {errorVisible && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-4 right-4 z-[100] bg-rose-600 text-white p-3 rounded-lg text-center font-bold text-xs uppercase tracking-widest shadow-2xl border border-rose-400"
          >
            {errorVisible}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="font-display font-bold text-xs uppercase tracking-widest text-slate-500">Ваши Владения</h2>
        <button 
          onClick={handleExpand}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold active:scale-95 transition-transform uppercase tracking-tighter border
            ${player.diamonds >= 10 * Math.pow(2, (player.baseSlots || 6) - 6) ? 'bg-cyan-900/30 border-cyan-500/30 text-cyan-400' : 'bg-slate-900 border-slate-800 text-slate-500'}
          `}
        >
          <Plus className="w-2.5 h-2.5" />
          Расширить ({formatNumber(10 * Math.pow(2, (player.baseSlots || 6) - 6))} <Gem className="w-2.5 h-2.5 inline" />)
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {slots.map((slot) => {
          const building = buildings.find(b => b.slotIndex === slot);
          return (
            <BuildingSlot 
              key={slot} 
              slot={slot} 
              building={building} 
              onSelectBuilding={() => building && setInspectBuilding(building)}
              onSelectEmpty={() => setSelectedSlot(slot)}
            />
          );
        })}
      </div>

      <AnimatePresence>
        {inspectBuilding && (
          <InspectModal 
            building={inspectBuilding}
            onClose={() => setInspectBuilding(null)}
            onUpgrade={async () => {
              try {
                await upgradeBuilding(inspectBuilding.id);
                setInspectBuilding(null);
              } catch (err: any) {
                setErrorVisible(err.message);
                setTimeout(() => setErrorVisible(null), 3000);
              }
            }}
            onSell={async () => {
              try {
                await sellBuilding(inspectBuilding.id);
                setInspectBuilding(null);
              } catch (err: any) {
                setErrorVisible(err.message);
                setTimeout(() => setErrorVisible(null), 3000);
              }
            }}
            onTap={() => {
              const amount = 1 + (inspectBuilding.level - 1) * 2;
              addGold(amount);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedSlot !== null && (
          <BuildModal 
            slot={selectedSlot} 
            onClose={() => setSelectedSlot(null)} 
            onBuild={async (type, cost) => {
              try {
                await buildStructure(type, selectedSlot, cost);
                setSelectedSlot(null);
              } catch (err: any) {
                setErrorVisible(err.message);
                setTimeout(() => setErrorVisible(null), 3000);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BuildingSlot({ slot, building, onSelectBuilding, onSelectEmpty }: { slot: number, building: BuildingData | undefined, onSelectBuilding: () => void, onSelectEmpty: () => void }) {
  const { addGold } = useGame();
  const [floatingTaps, setFloatingTaps] = useState<{ id: number, amount: number }[]>([]);

  useEffect(() => {
    const handleAutoTap = (e: any) => {
      if (e.detail.slotIndex === slot) {
        const id = Date.now() + Math.random();
        setFloatingTaps(prev => [...prev, { id, amount: e.detail.amount }]);
        setTimeout(() => {
          setFloatingTaps(prev => prev.filter(t => t.id !== id));
        }, 1500);
      }
    };

    window.addEventListener('gold-mine-tap', handleAutoTap);
    return () => window.removeEventListener('gold-mine-tap', handleAutoTap);
  }, [slot]);

  return (
    <motion.div
      layoutId={`slot-${slot}`}
      onClick={() => {
        if (building) {
          const manualAmount = 1 + (building.level - 1) * 2;
          addGold(manualAmount);
          const id = Date.now() + Math.random();
          setFloatingTaps(prev => [...prev, { id, amount: manualAmount }]);
          setTimeout(() => setFloatingTaps(prev => prev.filter(t => t.id !== id)), 1500);
          onSelectBuilding();
        } else {
          onSelectEmpty();
        }
      }}
      className={`aspect-square rounded border transition-all flex flex-col items-center justify-center relative group cursor-pointer
        ${building ? 'bg-slate-800/80 border-amber-600/20 active:scale-95' : 'bg-slate-900/40 border-slate-800 border-dashed hover:border-slate-700 hover:bg-slate-900/60'}
      `}
    >
      <AnimatePresence>
        {floatingTaps.map(tap => (
          <motion.div
            key={tap.id}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -50 }}
            exit={{ opacity: 0 }}
            className="absolute z-10 text-amber-500 font-mono font-bold pointer-events-none"
          >
            +{formatNumber(tap.amount)}
          </motion.div>
        ))}
      </AnimatePresence>

      {building ? (
        <>
          <BuildingIcon type={building.type} level={building.level} />
          <motion.div 
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute -top-1 -right-1 bg-amber-500 rounded-full w-4 h-4 flex items-center justify-center shadow-lg"
          >
            <Coins className="w-2.5 h-2.5 text-slate-900" />
          </motion.div>
        </>
      ) : (
        <div className="flex flex-col items-center opacity-40 group-hover:opacity-100 transition-opacity">
          <span className="text-2xl mb-1">🏗️</span>
          <span className="text-[9px] text-slate-500 font-bold uppercase">Пусто</span>
        </div>
      )}
    </motion.div>
  );
}

function BuildingIcon({ type, level }: { type: string, level: number }) {
  const config = BUILDING_TYPES.find(b => b.type === type);
  const [imgError, setImgError] = useState(false);
  
  const emojis: Record<string, string> = {
    gold_mine: '⛏️',
    town_hall: '🏰',
    barracks: '⚔️',
    granary: '🌾'
  };

  const names: Record<string, string> = {
    gold_mine: 'Золотой рудник',
    town_hall: 'Ратуша',
    barracks: 'Казармы',
    granary: 'Амбар'
  };

  if (!config) return null;

  return (
    <div className="flex flex-col items-center gap-0.5 text-center px-1">
      <div className="relative w-12 h-12 mb-1 flex items-center justify-center">
        {!imgError && config.webp ? (
          <img 
            src={`${config.webp}?v=2`} 
            alt={names[type]} 
            className="w-full h-full object-contain drop-shadow-md"
            onError={(e) => {
              console.error('Failed to load image [BuildingIcon]:', (e.target as HTMLImageElement).src);
              setImgError(true);
            }}
          />
        ) : (
          <span className="text-4xl drop-shadow-md">{emojis[type] || '🏛️'}</span>
        )}
      </div>
      <p className="text-[9px] font-bold uppercase tracking-tight text-slate-200 truncate w-full">{names[type] || config.name}</p>
      <div className="bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
        <p className="text-[8px] font-mono text-amber-500 font-bold uppercase">Ур. {level}</p>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-500/20 rounded-b"></div>
    </div>
  );
}

function BuildModal({ slot, onClose, onBuild }: { slot: number, onClose: () => void, onBuild: (type: any, cost: number) => void }) {
  const { player } = useGame();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-sm p-2 pb-0">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="w-full max-w-sm bg-slate-900 border-t border-x border-slate-800 rounded-t-2xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-bold text-lg uppercase tracking-tight text-white">Инфраструктура</h3>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest leading-none">Участок #{slot + 1}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center border border-slate-700">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
          {BUILDING_TYPES.map((b) => {
            const canAfford = (player?.gold || 0) >= b.cost;
            return (
              <button
                key={b.type}
                disabled={!canAfford}
                onClick={() => onBuild(b.type, b.cost)}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left relative overflow-hidden group
                  ${canAfford ? 'bg-slate-800/40 border-slate-700 hover:border-amber-500/50 active:scale-[0.98] hover:bg-slate-800' : 'opacity-40 grayscale cursor-not-allowed bg-slate-950 border-slate-900'}
                `}
              >
                <div className={`w-16 h-16 shrink-0 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center relative overflow-hidden ${canAfford ? 'group-hover:border-amber-500/30' : ''}`}>
                   <BuildModalIcon type={b.type} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-bold uppercase tracking-tight text-white group-hover:text-amber-400 transition-colors truncate">
                      {b.name}
                    </p>
                    <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                      <Coins className={`w-3 h-3 ${canAfford ? 'text-amber-500' : 'text-slate-600'}`} />
                      <span className={`text-[11px] font-mono font-bold ${canAfford ? 'text-amber-500' : 'text-slate-600'}`}>{b.cost.toLocaleString('ru-RU')}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight line-clamp-2 italic">
                    {b.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function BuildModalIcon({ type }: { type: string }) {
  const config = BUILDING_TYPES.find(b => b.type === type);
  const [imgError, setImgError] = useState(false);
  
  if (!config) return null;

  return (
    <>
      {!imgError && config.webp ? (
        <img 
          src={`${config.webp}?v=2`} 
          alt={config.name} 
          className="w-full h-full object-contain p-2"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="opacity-50">
          {React.cloneElement(config.icon as React.ReactElement<{ className?: string }>, { className: 'w-8 h-8' })}
        </div>
      )}
    </>
  );
}

function InspectModal({ building, onClose, onUpgrade, onSell, onTap }: { building: BuildingData, onClose: () => void, onUpgrade: () => void, onSell: () => void, onTap: () => void }) {
  const { player } = useGame();
  const config = BUILDING_TYPES.find(b => b.type === building.type);
  if (!config) return null;

  const upgradeCost = Math.floor(500 * Math.pow(1.8, building.level));
  const sellRefund = Math.floor((500 * Math.pow(1.8, building.level - 1)) / 2);
  const canAfford = (player?.gold || 0) >= upgradeCost;
  const goldPerTap = 1 + (building.level - 1) * 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center relative overflow-hidden">
               <BuildModalIcon type={building.type} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-white uppercase">{config.name}</h3>
              <p className="text-xs font-mono text-amber-500">Уровень {building.level}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                onSell();
              }} 
              className="p-2 bg-rose-950/30 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-900/50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 bg-slate-800 rounded-lg border border-slate-700">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700 mb-6">
           <p className="text-xs text-slate-400 mb-3 leading-relaxed">{config.description}</p>
           {building.type === 'gold_mine' && (
             <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500">
               <Coins className="w-3 h-3 text-amber-500" />
               Доход за тап: <span className="text-white">+{formatNumber(goldPerTap)} золота</span>
             </div>
           )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => {
              onTap();
              // Multiple taps possible? User said "box on building"
              // Add a small feedback animation maybe
            }}
            className="flex flex-col items-center justify-center gap-1.5 p-4 bg-slate-800 rounded-xl border border-slate-700 hover:bg-slate-700 active:scale-95 transition-all"
          >
            <Pickaxe className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] font-bold text-white uppercase">Добыча</span>
          </button>

          <button 
            disabled={!canAfford}
            onClick={onUpgrade}
            className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border transition-all active:scale-95
              ${canAfford ? 'bg-amber-600 border-amber-500 text-slate-950 hover:bg-amber-500' : 'bg-slate-950 border-slate-900 text-slate-700 opacity-50'}
            `}
          >
            <Plus className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase whitespace-nowrap">Улучшить</span>
            <span className="text-[9px] opacity-70">{formatNumber(upgradeCost)} 💰</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
