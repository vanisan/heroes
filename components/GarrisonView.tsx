'use client';

import React from 'react';
import { useGame } from '@/lib/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Shield, Wand2, Plus, Coins, Flame, Zap, Heart } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

const UNIT_DESCRIPTIONS = [
  { 
    type: 'knight' as const, 
    name: 'Рыцарь', 
    description: 'Ближний бой, высокая защита.', 
    cost: 50, 
    hp: 30, atk: 5, def: 10,
    icon: <Shield className="w-5 h-5" />,
    webp: '/api/get-image?name=knight.webp',
    color: 'amber'
  },
  { 
    type: 'archer' as const, 
    name: 'Лучник', 
    description: 'Дальний бой, низкое здоровье.', 
    cost: 40, 
    hp: 20, atk: 10, def: 5,
    icon: <Sword className="w-5 h-5 rotate-45" />,
    webp: '/api/get-image?name=archer.webp',
    color: 'blue'
  },
  { 
    type: 'mage' as const, 
    name: 'Маг', 
    description: 'Огромный урон по площади.', 
    cost: 150, 
    hp: 40, atk: 30, def: 3,
    icon: <Wand2 className="w-5 h-5" />,
    webp: '/api/get-image?name=mage.webp',
    color: 'purple'
  },
  { 
    type: 'berserk' as const, 
    name: 'Берсерк', 
    description: 'Невероятная скорость атаки.', 
    cost: 200, 
    hp: 50, atk: 50, def: 10,
    icon: <Zap className="w-5 h-5" />,
    webp: '/api/get-image?name=berserk.webp',
    color: 'orange'
  },
  { 
    type: 'dragon' as const, 
    name: 'Дракон', 
    description: 'Легендарное существо, сжигает всё.', 
    cost: 700, 
    hp: 200, atk: 100, def: 30,
    icon: <Flame className="w-5 h-5" />,
    webp: '/api/get-image?name=dragon.webp',
    color: 'rose'
  },
  {
    type: 'titan' as const,
    name: 'Титан',
    description: 'Молотом крушит целые ряды врагов.',
    cost: 5000,
    hp: 800, atk: 250, def: 100,
    icon: <Wand2 className="w-5 h-5" />, // placeholder icon, visual relies on webp
    webp: '/api/get-image?name=titan.webp',
    color: 'emerald'
  }
];

export default function GarrisonView() {
  const { player, recruitUnit, recruitAllUnits, unitLimit } = useGame();
  const [errorVisible, setErrorVisible] = React.useState<string | null>(null);

  if (!player) return null;

  return (
    <div className="p-4 pt-20 mb-32 bg-slate-950">
      <AnimatePresence>
        {errorVisible && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="fixed top-20 left-4 right-4 z-[100] bg-rose-600 text-white p-3 rounded-lg text-center font-bold text-xs uppercase tracking-widest shadow-2xl border border-rose-400"
          >
            {errorVisible}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8 px-2">
        <h2 className="font-display font-bold text-xs uppercase tracking-widest text-slate-500 mb-1">Гарнизон</h2>
        <p className="text-[10px] text-slate-600 uppercase font-bold">Нанимайте больше войск для будущих битв</p>
      </div>

      <div className="space-y-3">
        {UNIT_DESCRIPTIONS.map((unit) => {
          return (
            <UnitRow key={unit.type} unit={unit} player={player} recruitUnit={recruitUnit} recruitAllUnits={recruitAllUnits} setErrorVisible={setErrorVisible} />
          );
        })}
      </div>

      <div className="mt-8 bg-amber-600/5 border border-amber-600/20 rounded-xl p-4">
        <h4 className="text-[10px] font-bold uppercase text-amber-500 mb-2">Статистика Армии</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase leading-none mb-1">Всего</p>
            <p className="font-mono text-lg font-bold text-white">
              {formatNumber(Object.values(player.garrison).reduce((a, b: any) => a + b, 0))}
            </p>
          </div>
          <div className="text-center border-x border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase leading-none mb-1">Мощь</p>
            <p className="font-mono text-lg font-bold text-amber-400">
              {formatNumber((player.garrison?.knight || 0) * 15 + 
               (player.garrison?.archer || 0) * 15 + 
               (player.garrison?.mage || 0) * 45 +
               (player.garrison?.berserk || 0) * 60 +
               (player.garrison?.dragon || 0) * 230 +
               (player.garrison?.titan || 0) * 850)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-500 uppercase leading-none mb-1">Лимит</p>
            <p className="font-mono text-lg font-bold text-slate-600">{formatNumber(unitLimit)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UnitRow({ unit, player, recruitUnit, recruitAllUnits, setErrorVisible }: { unit: any, player: any, recruitUnit: any, recruitAllUnits: any, setErrorVisible: any }) {
  const [imgError, setImgError] = React.useState(false);
  const currentCount = player.garrison?.[unit.type] || 0;
  const canAfford = player.gold >= unit.cost;

  // Reset error on unit type change
  React.useEffect(() => {
    setImgError(false);
  }, [unit.type]);

  const imagePath = unit.webp;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-white/5 pointer-events-none opacity-0 hover:opacity-100 transition-opacity"></div>
      
      <div className={`w-12 h-12 rounded-xl border border-${unit.color}-500/30 bg-${unit.color}-500/10 flex items-center justify-center text-${unit.color}-400 overflow-hidden relative`}>
        {!imgError && imagePath ? (
          <img 
            src={imagePath} 
            alt={unit.name} 
            width={48}
            height={48}
            className="w-full h-full object-contain p-1"
            onError={(e) => {
              console.error(`[UNIT-IMG-FAIL] ${imagePath} for ${unit.type}. Full URL:`, (e.target as HTMLImageElement).src);
              setImgError(true);
            }}
          />
        ) : (
          unit.icon
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-sm text-white uppercase tracking-tight">{unit.name}</h3>
          <span className="font-mono text-xs font-bold text-amber-500">x{formatNumber(currentCount)}</span>
        </div>
        <p className="text-[10px] text-slate-500 truncate">{unit.description}</p>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            <Heart className="w-2.5 h-2.5 text-rose-500" />
            <span className="text-[9px] font-mono font-bold text-slate-400">{unit.hp}</span>
          </div>
          <div className="flex items-center gap-1">
            <Sword className="w-2.5 h-2.5 text-blue-400" />
            <span className="text-[9px] font-mono font-bold text-slate-400">{unit.atk}</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-2.5 h-2.5 text-amber-500" />
            <span className="text-[9px] font-mono font-bold text-slate-400">{unit.def}</span>
          </div>
          <div className="ml-2 flex items-center gap-1">
            <Coins className="w-3 h-3 text-amber-600" />
            <span className="text-[10px] font-mono font-bold text-slate-400">{formatNumber(unit.cost)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={async () => {
            try {
              await recruitAllUnits(unit.type, unit.cost);
            } catch (err: any) {
              setErrorVisible(err.message);
              setTimeout(() => setErrorVisible(null), 3000);
            }
          }}
          className="h-10 px-3 rounded border border-amber-900/50 bg-amber-950/30 text-amber-500 font-bold text-[10px] transition-all hover:border-amber-500/50 active:scale-95 uppercase tracking-widest"
        >
          Max
        </button>
        <button
          disabled={!canAfford}
          onClick={async () => {
            try {
              await recruitUnit(unit.type, 1, unit.cost);
            } catch (err: any) {
              setErrorVisible(err.message);
              setTimeout(() => setErrorVisible(null), 3000);
            }
          }}
          className={`h-10 px-4 rounded border font-bold text-xs transition-all active:scale-95
            ${canAfford ? 'bg-slate-800 border-slate-700 text-amber-500 hover:border-amber-500/50' : 'bg-slate-950 border-slate-900 text-slate-700 cursor-not-allowed'}
          `}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
