'use client';

import Image from 'next/image';
import { useGame } from '@/lib/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Shield, Heart, Trophy, ChevronRight, ChevronLeft, Skull, Wand2, Zap, Flame, User } from 'lucide-react';
import React, { useState, useEffect } from 'react';

const UNIT_DATA = {
  knight: { 
    name: 'Рыцарь', 
    webp: '/icons/knight.webp', 
    icon: <Shield className="w-5 h-5 text-amber-500" />,
    color: 'amber'
  },
  archer: { 
    name: 'Лучник', 
    webp: '/icons/archer.webp', 
    icon: <Sword className="w-5 h-5 rotate-45 text-blue-400" />,
    color: 'blue'
  },
  mage: { 
    name: 'Маг', 
    webp: '/icons/mage.webp', 
    icon: <Wand2 className="w-5 h-5 text-purple-400" />,
    color: 'purple'
  },
  berserk: {
    name: 'Берсерк',
    webp: '/icons/berserk.webp',
    icon: <Zap className="w-5 h-5 text-orange-500" />,
    color: 'orange'
  },
  dragon: {
    name: 'Дракон',
    webp: '/icons/dragon.webp',
    icon: <Flame className="w-5 h-5 text-rose-500" />,
    color: 'rose'
  }
};

interface Unit {
  id: string;
  type: 'knight' | 'archer' | 'mage' | 'berserk' | 'dragon' | 'enemy' | 'boss' | 'hero';
  displayName: string;
  side: 'player' | 'enemy';
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  atkFreq: number;
  lastAtkTime: number;
  range: number;
  speed: number;
  pos: { x: number, y: number };
}

export interface CombatScenario {
  type: 'pvp' | 'mobs' | 'boss';
  enemyName: string;
  enemyGarrison?: Record<string, number>;
  difficulty?: number;
}

type BattleState = 'preparation' | 'fighting' | 'finished';

export default function CombatView({ scenario, onBack }: { scenario: CombatScenario, onBack: () => void }) {
  const { player, updateGarrison, addGold } = useGame();
  const [battleState, setBattleState] = useState<BattleState>('preparation');
  const [selectedUnits, setSelectedUnits] = useState({ knight: 0, archer: 0, mage: 0, berserk: 0, dragon: 0 });
  const [activeUnits, setActiveUnits] = useState<Unit[]>([]);
  const [initialGarrison, setInitialGarrison] = useState({ knight: 0, archer: 0, mage: 0, berserk: 0, dragon: 0 });

  useEffect(() => {
    if (!player || battleState !== 'fighting') return;

    const interval = setInterval(() => {
      setActiveUnits(prev => {
        const next = prev.map(u => ({ ...u, pos: { ...u.pos } }));
        let playerAlive = 0;
        let enemyAlive = 0;

        const currentTime = Date.now();

        next.forEach(u => {
          if (u.hp <= 0) return;
          if (u.side === 'player') playerAlive++; else enemyAlive++;

          const enemies = next.filter(target => target.side !== u.side && target.hp > 0);
          if (enemies.length === 0) return;

          const closest = enemies.reduce((prev, curr) => {
            const d1 = Math.sqrt(Math.pow(u.pos.x - prev.pos.x, 2) + Math.pow(u.pos.y - prev.pos.y, 2));
            const d2 = Math.sqrt(Math.pow(u.pos.x - curr.pos.x, 2) + Math.pow(u.pos.y - curr.pos.y, 2));
            return d1 < d2 ? prev : curr;
          });

          const dist = Math.sqrt(Math.pow(u.pos.x - closest.pos.x, 2) + Math.pow(u.pos.y - closest.pos.y, 2));

          if (dist <= u.range) {
            const cooldown = (1 / u.atkFreq) * 1000;
            if (currentTime - u.lastAtkTime >= cooldown) {
               // Calculate damage with defense reduction
               const reduction = Math.min(0.9, closest.def / 1000);
               const finalDamage = u.atk * (1 - reduction);
               closest.hp = Math.max(0, closest.hp - finalDamage);
               u.lastAtkTime = currentTime;
            }
          } else {
            u.pos.x += ((closest.pos.x - u.pos.x) / dist) * u.speed;
            u.pos.y += ((closest.pos.y - u.pos.y) / dist) * u.speed;
          }
        });

        if (playerAlive === 0 || enemyAlive === 0) {
          setBattleState('finished');
          if (!player) return next;

          const survivors: any = { knight: 0, archer: 0, mage: 0, berserk: 0, dragon: 0 };
          next.forEach(u => {
            if (u.side === 'player' && u.hp > 0) {
              if (survivors[u.type] !== undefined) survivors[u.type]++;
            }
          });
          
          const newGarrison = {
            knight: (player.garrison.knight - initialGarrison.knight) + survivors.knight,
            archer: (player.garrison.archer - initialGarrison.archer) + survivors.archer,
            mage: (player.garrison.mage - initialGarrison.mage) + survivors.mage,
            berserk: (player.garrison.berserk - initialGarrison.berserk) + survivors.berserk,
            dragon: (player.garrison.dragon - initialGarrison.dragon) + survivors.dragon,
          };
          updateGarrison(newGarrison);
          
          if (enemyAlive === 0) {
            const reward = scenario.type === 'pvp' ? 1000 : scenario.type === 'mobs' ? 300 : 5000;
            addGold(reward);
          }
        }

        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [battleState, player, initialGarrison, updateGarrison, addGold, scenario]);

  if (!player) return null;

  const startBattle = () => {
    setInitialGarrison({ ...selectedUnits });
    const newUnits: Unit[] = [];
    
    // Stats constant
    const stats: Record<string, any> = {
      knight: { hp: 30, atk: 5, def: 10, freq: 0.5, range: 0.6, speed: 0.05, name: 'Рыцарь' },
      archer: { hp: 20, atk: 10, def: 5, freq: 0.5, range: 3.5, speed: 0.03, name: 'Лучник' },
      mage: { hp: 40, atk: 30, def: 3, freq: 0.5, range: 2.5, speed: 0.02, name: 'Маг' },
      berserk: { hp: 50, atk: 50, def: 10, freq: 1.0, range: 0.6, speed: 0.08, name: 'Берсерк' },
      dragon: { hp: 200, atk: 100, def: 30, freq: 0.25, range: 2.0, speed: 0.04, name: 'Дракон' },
      hero: { 
        hp: 100 + (player.hero.level * 20), 
        atk: 100 + (player.hero.level * 10), 
        def: 100 + (player.hero.level * 5), 
        freq: 1.0, 
        range: 0.8, 
        speed: 0.06, 
        name: player?.displayName || 'Герой' 
      }
    };

    // Spawn Hero (Always)
    const h = stats.hero;
    newUnits.push({
      id: 'hero-unit',
      type: 'hero',
      displayName: h.name,
      side: 'player',
      hp: h.hp,
      maxHp: h.hp,
      atk: h.atk,
      def: h.def,
      atkFreq: h.freq,
      lastAtkTime: 0,
      range: h.range,
      speed: h.speed,
      pos: { x: 0.2, y: 2.5 }
    });

    // Spawn Player Units
    let spawnIdx = 0;
    (Object.keys(selectedUnits) as (keyof typeof selectedUnits)[]).forEach(type => {
      const count = selectedUnits[type];
      for(let i=0; i<count; i++) {
        const s = stats[type];
        newUnits.push({
          id: `p-${type}-${i}`,
          type: type as any,
          displayName: s.name,
          side: 'player',
          hp: s.hp,
          maxHp: s.hp,
          atk: s.atk,
          def: s.def,
          atkFreq: s.freq,
          lastAtkTime: 0,
          range: s.range,
          speed: s.speed,
          pos: { x: 0.5 + (Math.random() * 0.5), y: (spawnIdx % 5) + (Math.random() * 0.5) }
        });
        spawnIdx++;
      }
    });

    // Spawn Enemy Units
    if (scenario.type === 'boss') {
      const bStats: Record<string, any> = {
        'Гигантский Паук': { atk: 220, def: 200, hp: 5000, freq: 1.0, range: 1.5 },
        'Древний Голем': { atk: 300, def: 300, hp: 10000, freq: 0.5, range: 1.2 },
        'Повелитель Бездны': { atk: 500, def: 400, hp: 20000, freq: 2.0, range: 2.0 },
      };
      const b = bStats[scenario.enemyName] || { atk: 100, def: 50, hp: 1000, freq: 1 };
      
      newUnits.push({
        id: 'world-boss',
        type: 'boss',
        displayName: scenario.enemyName,
        side: 'enemy',
        hp: b.hp,
        maxHp: b.hp,
        atk: b.atk,
        def: b.def,
        atkFreq: b.freq,
        lastAtkTime: 0,
        range: b.range,
        speed: 0.02,
        pos: { x: 4.0, y: 2.5 }
      });
    } else if (scenario.type === 'pvp' && scenario.enemyGarrison) {
      // Enemy Hero
      newUnits.push({
        id: 'enemy-hero',
        type: 'boss',
        displayName: scenario.enemyName,
        side: 'enemy',
        hp: h.hp,
        maxHp: h.hp,
        atk: h.atk,
        def: h.def,
        atkFreq: h.freq,
        lastAtkTime: 0,
        range: h.range,
        speed: h.speed,
        pos: { x: 4.5, y: 2.5 }
      });

      let eSpawnIdx = 0;
      Object.entries(scenario.enemyGarrison).forEach(([type, count]) => {
        for(let i=0; i<count; i++) {
          const s = stats[type] || stats.knight;
          newUnits.push({
            id: `e-${type}-${i}`,
            type: 'enemy',
            displayName: s.name,
            side: 'enemy',
            hp: s.hp,
            maxHp: s.hp,
            atk: s.atk,
            def: s.def,
            atkFreq: s.freq,
            lastAtkTime: 0,
            range: s.range,
            speed: s.speed,
            pos: { x: 4.5 - (Math.random() * 0.5), y: (eSpawnIdx % 5) + (Math.random() * 0.5) }
          });
          eSpawnIdx++;
        }
      });
    } else {
      // Mobs (Random)
      const mobTypes = ['knight', 'archer', 'mage'];
      for(let i=0; i<5; i++) {
        const rType = mobTypes[Math.floor(Math.random() * mobTypes.length)];
        const s = stats[rType];
        newUnits.push({
          id: `mob-${i}`,
          type: 'enemy',
          displayName: `Монстр ${s.name}`,
          side: 'enemy',
          hp: s.hp * 1.5,
          maxHp: s.hp * 1.5,
          atk: s.atk * 1.2,
          def: s.def,
          atkFreq: s.freq,
          lastAtkTime: 0,
          range: s.range,
          speed: s.speed,
          pos: { x: 4.5 - (Math.random() * 0.5), y: (i % 5) + (Math.random() * 0.5) }
        });
      }
    }

    setActiveUnits(newUnits);
    setBattleState('fighting');
  };

  const toggleSelection = (type: keyof typeof selectedUnits, delta: number) => {
    const current = selectedUnits[type];
    const available = player.garrison?.[type] || 0;
    const nextValue = Math.max(0, Math.min(available, current + delta));
    setSelectedUnits(prev => ({ ...prev, [type]: nextValue }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col pt-14 p-2 pb-24 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="font-display font-bold text-lg uppercase italic tracking-tight text-white">
          {battleState === 'preparation' ? 'Подготовка к битве' : battleState === 'fighting' ? 'Сражение' : 'Результаты'}
        </h2>
        <button onClick={onBack} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-1.5 border border-slate-800 rounded bg-slate-900/50">В Царство</button>
      </div>

      <AnimatePresence mode="wait">
        {battleState === 'preparation' && (
          <motion.div 
            key="prep"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex-1">
              <h3 className="text-xs font-bold uppercase text-amber-500 mb-6">Выберите отряды</h3>
              
              <div className="space-y-6">
                {(['knight', 'archer', 'mage', 'berserk', 'dragon'] as const).map(type => (
                  <UnitSelectionRow 
                    key={type} 
                    type={type} 
                    player={player} 
                    selectedUnits={selectedUnits} 
                    onToggle={toggleSelection} 
                  />
                ))}
              </div>

              <div className="mt-12 p-4 bg-amber-600/5 border border-amber-600/20 rounded-lg">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase mb-2">
                  <span className="text-slate-500">Общая мощь отряда</span>
                  <span className="text-amber-500">
                    {selectedUnits.knight * 10 + selectedUnits.archer * 15 + selectedUnits.mage * 25 + selectedUnits.berserk * 20 + selectedUnits.dragon * 100}
                  </span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: '40%' }}></div>
                </div>
              </div>
            </div>

            <button 
              disabled={Object.values(selectedUnits).every(v => v === 0)}
              onClick={startBattle}
              className="mt-4 w-full bg-amber-600 text-slate-950 font-bold py-4 rounded-xl shadow-lg shadow-amber-600/20 active:scale-95 transition-transform uppercase tracking-tighter disabled:opacity-50"
            >
              Вступить в бой
            </button>
          </motion.div>
        )}

        {battleState === 'fighting' && (
          <motion.div 
            key="fight"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-inner"
          >
            {/* Grid */}
            <div className="absolute inset-0 grid grid-cols-5 grid-rows-5 opacity-5">
              {Array.from({ length: 25 }).map((_, i) => <div key={i} className="border border-slate-700" />)}
            </div>

            {/* Units */}
            {activeUnits.filter(u => u.hp > 0).map(u => (
              <motion.div
                key={u.id}
                initial={false}
                animate={{ left: `${(u.pos.x / 5) * 100}%`, top: `${(u.pos.y / 5) * 100}%` }}
                className="absolute w-8 h-8 -ml-4 -mt-4 transition-all"
              >
                <div className={`p-1 border overflow-hidden relative w-full h-full ${
                  u.type === 'hero' ? 'hero-neon bg-blue-950 border-blue-400 z-10 rounded-full' :
                  u.side === 'player' ? 'bg-blue-900/40 border-blue-500/50 text-blue-400 rounded' : 
                  'bg-rose-900/40 border-rose-500/50 text-rose-400 shadow-[0_0_10px_rgba(225,29,72,0.3)] rounded'
                }`}>
                  <BattleUnitIcon u={u} />
                </div>
                <div className="w-full h-1 bg-slate-800 mt-1 rounded-full overflow-hidden border border-black/30">
                  <motion.div 
                    animate={{ width: `${(u.hp / u.maxHp) * 100}%` }}
                    className={`h-full ${u.side === 'player' ? 'bg-blue-500' : 'bg-rose-600'}`} 
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {battleState === 'finished' && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col gap-4"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center shadow-2xl flex-1">
              {activeUnits.some(u => u.side === 'enemy' && u.hp > 0) ? (
                 <>
                   <div className="w-16 h-16 bg-rose-600/20 border border-rose-600/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                     <Skull className="w-8 h-8 text-rose-500" />
                   </div>
                   <h3 className="text-xl font-display font-bold mb-2 uppercase tracking-tight text-white italic">Поражение</h3>
                   <p className="text-xs text-slate-500 uppercase font-bold tracking-widest leading-relaxed mb-8">Ваши войска были разбиты. Отступите для перегруппировки.</p>
                 </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-amber-600/20 border border-amber-600/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Trophy className="w-8 h-8 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-display font-bold mb-2 uppercase tracking-tight text-white italic">Триумфальная победа</h3>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-8 leading-relaxed">Враг повержен. Рубеж зачищен. Добыто 1000 золота!</p>
                </>
              )}

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 text-left">
                <h4 className="text-[10px] font-bold uppercase text-slate-600 mb-4 tracking-[0.2em]">Статистика потерь</h4>
                <div className="space-y-3">
                  {(['knight', 'archer', 'mage', 'berserk', 'dragon'] as const).map(type => {
                    const lost = initialGarrison[type] - activeUnits.filter(u => u.side === 'player' && u.type === type && u.hp > 0).length;
                    if (initialGarrison[type] === 0) return null;
                    return (
                      <div key={type} className="flex justify-between items-center bg-slate-900/50 p-2 rounded">
                         <span className="text-[11px] font-bold text-slate-400 uppercase">{UNIT_DATA[type].name}</span>
                         <span className="font-mono text-sm font-bold text-rose-500">-{lost}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <button 
              onClick={onBack}
              className="w-full bg-slate-800 border border-slate-700 text-white font-bold py-4 rounded-xl active:scale-95 transition-transform uppercase tracking-tighter"
            >
              Вернуться в город
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UnitSelectionRow({ type, player, selectedUnits, onToggle }: { type: 'knight'|'archer'|'mage'|'berserk'|'dragon', player: any, selectedUnits: any, onToggle: any }) {
  const [imgError, setImgError] = useState(false);
  const data = UNIT_DATA[type];

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center relative overflow-hidden`}>
          {data.webp && !imgError ? (
            <Image 
              src={data.webp} 
              alt={data.name} 
              fill 
              className="object-contain p-1.5"
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
             data.icon
          )}
        </div>
        <div>
          <p className="text-xs font-bold text-white uppercase">{data.name}</p>
          <p className="text-[10px] text-slate-500 uppercase">Доступно: {player.garrison?.[type] || 0}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-slate-950 p-1 rounded-lg border border-slate-800">
        <button onClick={() => onToggle(type, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white"><ChevronLeft /></button>
        <span className="font-mono font-bold text-amber-500 w-8 text-center">{selectedUnits[type]}</span>
        <button onClick={() => onToggle(type, 1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white"><ChevronRight /></button>
      </div>
    </div>
  );
}

function BattleUnitIcon({ u }: { u: Unit }) {
  const [imgError, setImgError] = useState(false);
  const type = u.type as 'knight' | 'archer' | 'mage' | 'berserk' | 'dragon' | 'enemy' | 'boss' | 'hero';
  const data = (type !== 'enemy' && type !== 'boss' && type !== 'hero') ? UNIT_DATA[type] : null;

  if (type === 'hero') {
    return (
       <div className="w-full h-full flex items-center justify-center bg-amber-500/20 rounded-full overflow-hidden relative">
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
           <User className="w-5 h-5 text-amber-500" />
         )}
       </div>
    );
  }

  if ((u.side === 'enemy' && type !== 'boss') || !data || imgError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        {u.type === 'knight' ? <Shield className="w-4 h-4" /> : 
         u.type === 'archer' ? <Sword className="w-4 h-4 rotate-45" /> : 
         u.type === 'mage' ? <Wand2 className="w-4 h-4" /> : 
         u.type === 'berserk' ? <Zap className="w-4 h-4" /> :
         u.type === 'dragon' ? <Flame className="w-4 h-4" /> :
         u.type === 'boss' ? <Skull className="w-6 h-6 text-rose-500 animate-pulse" /> :
         <Skull className="w-4 h-4" />}
      </div>
    );
  }

  return (
    <Image 
      src={data.webp} 
      alt={data.name} 
      fill 
      className="object-contain p-0.5"
      onError={() => setImgError(true)}
      referrerPolicy="no-referrer"
    />
  );
}
