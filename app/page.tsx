'use client';

import { useGame } from '@/lib/GameContext';
import HUD from '@/components/HUD';
import BuildingGrid from '@/components/BuildingGrid';
import MobileNav from '@/components/MobileNav';
import AuthOverlay from '@/components/AuthOverlay';
import CombatView from '@/components/CombatView';
import GarrisonView from '@/components/GarrisonView';
import ArenaView from '@/components/ArenaView';
import HeroView from '@/components/HeroView';
import ShopView from '@/components/ShopView';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const { user, loading } = useGame();
  const [view, setView] = useState<'base' | 'units' | 'arena' | 'hero' | 'shop'>('base');
  const [battleScenario, setBattleScenario] = useState<any>(null);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-amber-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <AuthOverlay />;
  }

  if (battleScenario) {
     return <CombatView scenario={battleScenario} onBack={() => setBattleScenario(null)} />;
  }

  return (
    <main className="min-h-screen pb-40">
      <HUD />
      
      <AnimatePresence mode="wait">
        {view === 'base' && (
          <motion.div
            key="base"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <BuildingGrid />
          </motion.div>
        )}

        {view === 'arena' && (
          <motion.div
            key="arena"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <ArenaView onStartBattle={(scenario: any) => setBattleScenario(scenario)} />
          </motion.div>
        )}

        {view === 'units' && (
          <motion.div
            key="units"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <GarrisonView />
          </motion.div>
        )}

        {view === 'hero' && (
          <motion.div
            key="hero"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <HeroView />
          </motion.div>
        )}

        {view === 'shop' && (
          <motion.div
            key="shop"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <ShopView />
          </motion.div>
        )}
      </AnimatePresence>

      <MobileNav setView={setView} currentView={view} />
    </main>
  );
}
