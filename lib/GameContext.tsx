'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp, collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

interface PlayerData {
  uid: string;
  displayName: string;
  gold: number;
  diamonds: number;
  tapsTotal: number;
  baseSlots: number;
  battleRating: number;
  hero: {
    level: number;
    exp: number;
    equipment: {
      weapon: string | null;
      armor: string | null;
    };
  };
  garrison: {
    knight: number;
    archer: number;
    mage: number;
    berserk: number;
    dragon: number;
  };
  createdAt: any;
  lastActive: any;
}

export interface BuildingData {
  id: string;
  type: 'town_hall' | 'barracks' | 'granary' | 'gold_mine';
  slotIndex: number;
  level: number;
  lastCollectedAt: any;
}

interface GameContextType {
  user: User | null;
  player: PlayerData | null;
  buildings: BuildingData[];
  items: any[];
  loading: boolean;
  addGold: (amount: number) => Promise<void>;
  expandBase: () => Promise<void>;
  buildStructure: (type: BuildingData['type'], slot: number, cost: number) => Promise<void>;
  upgradeBuilding: (buildingId: string) => Promise<void>;
  recruitUnit: (type: keyof PlayerData['garrison'], count: number, cost: number) => Promise<void>;
  updateGarrison: (garrison: PlayerData['garrison']) => Promise<void>;
  buyItem: (item: { name: string, rarity: string, stats: any, cost: number, icon: string }) => Promise<void>;
  startPvP: (opponentId: string) => Promise<void>;
  getLeaderboard: () => Promise<any[]>;
  sellBuilding: (buildingId: string) => Promise<void>;
  goldLimit: number;
  unitLimit: number;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  const calculateBR = (p: PlayerData) => {
    const unitPower = 
      (p.garrison?.knight || 0) * 15 + 
      (p.garrison?.archer || 0) * 15 + 
      (p.garrison?.mage || 0) * 45 +
      (p.garrison?.berserk || 0) * 60 +
      (p.garrison?.dragon || 0) * 230;
    const heroPower = (p.hero?.level || 1) * 100;
    return unitPower + heroPower;
  };

  const getGoldLimit = () => {
    let limit = 10000;
    buildings.filter(b => b.type === 'granary').forEach(b => {
      limit += 5000 * Math.pow(2, b.level - 1);
    });
    return limit;
  };

  const getUnitLimit = () => {
    let limit = 100;
    buildings.filter(b => b.type === 'barracks').forEach(b => {
      limit += 20 * Math.pow(2, b.level - 1);
    });
    return limit;
  };

  const goldLimit = getGoldLimit();
  const unitLimit = getUnitLimit();

  useEffect(() => {
    // Watchdog timer: if loading is still true after 12 seconds, force it to false
    // so the user can at least see the AuthOverlay or a potential error message.
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('GameContext: Initial load timed out, forcing UI... Check connectivity or Firebase config.');
        setLoading(false);
      }
    }, 12000);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setPlayer(null);
        setBuildings([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const playerRef = doc(db, 'players', user.uid);
    const buildingsRef = collection(db, 'players', user.uid, 'buildings');
    const itemsRef = collection(db, 'players', user.uid, 'items');

    const unsubscribePlayer = onSnapshot(playerRef, async (docSnap) => {
      try {
        if (docSnap.exists()) {
          const data = docSnap.data() as PlayerData;
          // Migration: Initialize garrison and hero if missing
          let needsUpdate = false;
          const updates: any = {};

          if (!data.garrison) {
            data.garrison = { knight: 10, archer: 5, mage: 0, berserk: 0, dragon: 0 };
            updates.garrison = data.garrison;
            needsUpdate = true;
          } else {
            // Check for missing units
            if (data.garrison.berserk === undefined || data.garrison.dragon === undefined) {
              data.garrison = { 
                ...data.garrison, 
                berserk: data.garrison.berserk || 0,
                dragon: data.garrison.dragon || 0
              };
              updates.garrison = data.garrison;
              needsUpdate = true;
            }
          }
          if (!data.hero) {
            data.hero = { level: 1, exp: 0, equipment: { weapon: null, armor: null } };
            updates.hero = data.hero;
            needsUpdate = true;
          }
          if (data.battleRating === undefined) {
            data.battleRating = calculateBR(data);
            updates.battleRating = data.battleRating;
            needsUpdate = true;
          }

          if (needsUpdate) {
            await updateDoc(playerRef, updates);
          }
          setPlayer(data);
        } else {
          const newPlayer: PlayerData = {
            uid: user.uid,
            displayName: user.displayName || 'Игрок',
            gold: 1000,
            diamonds: 50,
            tapsTotal: 0,
            baseSlots: 6,
            garrison: {
              knight: 10,
              archer: 5,
              mage: 0,
              berserk: 0,
              dragon: 0
            },
            hero: { level: 1, exp: 0, equipment: { weapon: null, armor: null } },
            battleRating: 0, // Will be updated on first load or recalculated
            createdAt: serverTimestamp(),
            lastActive: serverTimestamp(),
          };
          await setDoc(playerRef, newPlayer);
        }
      } catch (err) {
        setLoading(false);
        handleFirestoreError(err, 'write', `players/${user.uid}`);
      }
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, 'get', `players/${user.uid}`);
    });

    const unsubscribeBuildings = onSnapshot(buildingsRef, (snap) => {
      const bList = snap.docs.map(d => ({ id: d.id, ...d.data() } as BuildingData));
      setBuildings(bList);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, 'list', `players/${user.uid}/buildings`);
    });

    const unsubscribeItems = onSnapshot(itemsRef, (snap) => {
      const iList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(iList);
    }, (error) => {
      setLoading(false); // Even item error shouldn't block the UI
      handleFirestoreError(error, 'list', `players/${user.uid}/items`);
    });

    return () => {
      unsubscribePlayer();
      unsubscribeBuildings();
      unsubscribeItems();
    };
  }, [user]);

  const addGold = async (amount: number) => {
    if (!user || !player) return;
    try {
      const playerRef = doc(db, 'players', user.uid);
      const newGold = Math.min(goldLimit, player.gold + amount);
      if (newGold === player.gold && amount > 0) return; // Already at limit

      const newBR = calculateBR(player); // Recalculate just in case
      await updateDoc(playerRef, {
        gold: newGold,
        tapsTotal: player.tapsTotal + 1,
        battleRating: newBR,
        lastActive: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, 'update', `players/${user.uid}`);
    }
  };

  const expandBase = async () => {
    if (!user || !player) return;
    const cost = 10;
    if (player.diamonds < cost) throw new Error("Недостаточно алмазов");
    
    try {
      const playerRef = doc(db, 'players', user.uid);
      await updateDoc(playerRef, {
        diamonds: player.diamonds - cost,
        baseSlots: player.baseSlots + 2,
        lastActive: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, 'update', `players/${user.uid}`);
    }
  };

  const buildStructure = async (type: BuildingData['type'], slot: number, cost: number) => {
    if (!user || !player) return;
    if (player.gold < cost) throw new Error("Недостаточно золота");

    try {
      const playerRef = doc(db, 'players', user.uid);
      const buildingsRef = collection(db, 'players', user.uid, 'buildings');

      await updateDoc(playerRef, { gold: player.gold - cost });
      await addDoc(buildingsRef, {
        ownerId: user.uid,
        type,
        slotIndex: slot,
        level: 1,
        lastCollectedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, 'write', `players/${user.uid}/buildings`);
    }
  };

  const upgradeBuilding = async (buildingId: string) => {
    if (!user || !player) return;
    const building = buildings.find(b => b.id === buildingId);
    if (!building) return;

    const cost = building.level * 500;
    if (player.gold < cost) throw new Error(`Недостаточно золота для улучшения (${cost})`);

    try {
      const playerRef = doc(db, 'players', user.uid);
      const buildingRef = doc(db, 'players', user.uid, 'buildings', buildingId);

      await updateDoc(playerRef, { gold: player.gold - cost });
      await updateDoc(buildingRef, {
        level: building.level + 1,
        lastCollectedAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, 'update', `players/${user.uid}/buildings/${buildingId}`);
    }
  };

  const recruitUnit = async (type: keyof PlayerData['garrison'], count: number, cost: number) => {
    if (!user || !player) return;
    if (player.gold < cost) throw new Error("Недостаточно золота");

    const currentTotalUnits = Object.values(player.garrison).reduce((a, b) => a + b, 0);
    if (currentTotalUnits + count > unitLimit) throw new Error(`Достигнут лимит войск (${unitLimit}). Постройте или улучшите казармы.`);

    try {
      const playerRef = doc(db, 'players', user.uid);
      const newGarrison = { ...player.garrison, [type]: (player.garrison[type] || 0) + count };
      const newBR = calculateBR({ ...player, garrison: newGarrison });
      
      await updateDoc(playerRef, {
        gold: player.gold - cost,
        garrison: newGarrison,
        battleRating: newBR,
        lastActive: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, 'update', `players/${user.uid}`);
    }
  };

  const updateGarrison = async (newGarrison: PlayerData['garrison']) => {
    if (!user || !player) return;
    try {
      const playerRef = doc(db, 'players', user.uid);
      const newBR = calculateBR({ ...player, garrison: newGarrison });
      await updateDoc(playerRef, {
        garrison: newGarrison,
        battleRating: newBR,
        lastActive: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, 'update', `players/${user.uid}`);
    }
  };

  const buyItem = async (item: { name: string, rarity: string, stats: any, cost: number, icon: string }) => {
    if (!user || !player) return;
    if (player.gold < item.cost) throw new Error("Недостаточно золота");

    try {
      const playerRef = doc(db, 'players', user.uid);
      const itemsRef = collection(db, 'players', user.uid, 'items');

      await updateDoc(playerRef, { gold: player.gold - item.cost });
      await addDoc(itemsRef, {
        ownerId: user.uid,
        name: item.name,
        rarity: item.rarity,
        stats: item.stats,
        icon: item.icon,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, 'write', `players/${user.uid}/items`);
    }
  };

  const startPvP = async (opponentId: string) => {
    // Placeholder for PvP logic
    console.log("Starting PvP with", opponentId);
  };

  const getLeaderboard = async () => {
    try {
      const q = query(collection(db, 'players'), orderBy('battleRating', 'desc'), limit(20));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data());
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const sellBuilding = async (buildingId: string) => {
    if (!user || !player) return;
    const building = buildings.find(b => b.id === buildingId);
    if (!building) return;

    // Refund 50% of the cost based on level
    const refund = Math.floor((building.level * 250) / 2);

    try {
      const playerRef = doc(db, 'players', user.uid);
      const buildingRef = doc(db, 'players', user.uid, 'buildings', buildingId);

      await deleteDoc(buildingRef);
      await updateDoc(playerRef, {
        gold: Math.min(goldLimit, player.gold + refund),
        lastActive: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, 'delete', `players/${user.uid}/buildings/${buildingId}`);
    }
  };

  return (
    <GameContext.Provider value={{ 
      user, player, buildings, items, loading, 
      addGold, expandBase, buildStructure, upgradeBuilding, sellBuilding, recruitUnit, updateGarrison, buyItem, startPvP, getLeaderboard,
      goldLimit, unitLimit
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

export function handleFirestoreError(error: any, operationType: string, path: string | null) {
  if (error.code === 'permission-denied') {
    const errorInfo = {
      error: error.message,
      operationType,
      path,
      authInfo: {
        userId: auth.currentUser?.uid || 'none',
        email: auth.currentUser?.email || 'none',
        emailVerified: auth.currentUser?.emailVerified || false,
        isAnonymous: auth.currentUser?.isAnonymous || false,
        providerInfo: auth.currentUser?.providerData.map(p => ({
          providerId: p.providerId,
          displayName: p.displayName,
          email: p.email
        })) || []
      }
    };
    throw new Error(JSON.stringify(errorInfo));
  }
  throw error;
}
