'use client';

import React, { useState } from 'react';
import { useGame } from '@/lib/GameContext';
import { motion, useAnimation } from 'motion/react';
import { Sword, Package, Landmark, User as UserIcon, Store } from 'lucide-react';

export default function MobileNav({ setView, currentView }: { setView: (v: any) => void, currentView: string }) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 w-full bg-slate-900 border-t border-slate-800 h-16 flex items-stretch shadow-[0_-10px_25px_rgba(0,0,0,0.3)] safe-area-pb">
      <NavButton icon={<Landmark />} label="Царство" onClick={() => setView('base')} active={currentView === 'base'} />
      <NavButton icon={<Package />} label="Армия" onClick={() => setView('units')} active={currentView === 'units'} />
      <NavButton icon={<Sword />} label="Бой" onClick={() => setView('arena')} active={currentView === 'arena'} />
      <NavButton icon={<UserIcon />} label="Герой" onClick={() => setView('hero')} active={currentView === 'hero'} />
      <NavButton icon={<Store />} label="Лавка" onClick={() => setView('shop')} active={currentView === 'shop'} />
    </footer>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactElement, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center flex-1 transition-all border-r last:border-r-0 border-slate-800 hover:bg-slate-800/50 min-w-0 px-1
        ${active ? 'bg-amber-600/10 text-amber-500' : 'text-slate-500'}
      `}
    >
      {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: `w-5 h-5 mb-1 ${active ? 'animate-pulse' : ''}` })}
      <span className="text-[9px] font-bold uppercase tracking-tighter truncate w-full">{label}</span>
      {active && <motion.div layoutId="nav-active" className="absolute bottom-0 w-8 h-0.5 bg-amber-500 rounded-full" />}
    </button>
  );
}
