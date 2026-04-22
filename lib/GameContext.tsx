'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp, collection, addDoc, getDocs, query, orderBy, limit, deleteDoc, increment, getDocFromServer } from 'firebase/firestore';

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
      weapon: any | null;
      armor: any | null;
    };
  };
  garrison: {
    knight: number;
    archer: number;
    mage: number;
    berserk: number;
    dragon: number;
    titan?: number;
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
  addDiamonds: (amount: number) => Promise<void>;
  expandBase: () => Promise<void>;
  buildStructure: (type: BuildingData['type'], slot: number, cost: number) => Promise<void>;
  upgradeBuilding: (buildingId: string) => Promise<void>;
  recruitUnit: (type: keyof PlayerData['garrison'], count: number, cost: number) => Promise<void>;
  recruitAllUnits: (type: keyof PlayerData['garrison'], costPerUnit: number) => Promise<void>;
  updateGarrison: (garrison: PlayerData['garrison']) => Promise<void>;
  buyItem: (item: { name: string, type: 'weapon'|'armor', rarity: string, stats: any, cost: number, icon: string }) => Promise<void>;
  equipItem: (item: any) => Promise<void>;
  unequipItem: (slot: 'weapon' | 'armor') => Promise<void>;
  sellItem: (itemId: string, refund: number) => Promise<void>;
  upgradeItem: (itemId: string, cost: number) => Promise<void>;
  startPvP: (opponentId: string) => Promise<void>;
  getLeaderboard: () => Promise<any[]>;
  sellBuilding: (buildingId: string) => Promise<void>;
  goldLimit: number;
  unitLimit: number;
  goldPerHour: number;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  const calculateBR = useCallback((p: PlayerData) => {
    const unitPower = 
      (p.garrison?.knight || 0) * 15 + 
      (p.garrison?.archer || 0) * 15 + 
      (p.garrison?.mage || 0) * 45 +
      (p.garrison?.berserk || 0) * 60 +
      (p.garrison?.dragon || 0) * 230 +
      (p.garrison?.titan || 0) * 850;
    const heroPower = (p.hero?.level || 1) * 100;
    return unitPower + heroPower;
  }, []);

  const getGoldLimit = useCallback(() => {
    let limit = 10000;
    buildings.filter(b => b.type === 'granary').forEach(b => {
      limit += (5000 * b.level) + 5000;
    });
    return limit;
  }, [buildings]);

  const getUnitLimit = useCallback(() => {
    let limit = 100;
    buildings.filter(b => b.type === 'barracks').forEach(b => {
      limit += 20 * Math.pow(2, b.level - 1);
    });
    return limit;
  }, [buildings]);

  const getGoldPerHour = useCallback(() => {
    let total = 0;
    buildings.filter(b => b.type === 'gold_mine').forEach(b => {
      // Made gold mines significantly more effective and noticeable 
      total += Math.floor(1000 * Math.pow(1.8, b.level - 1));
    });
    return total;
  }, [buildings]);

  const goldLimit = getGoldLimit();
  const unitLimit = getUnitLimit();
  const goldPerHour = getGoldPerHour();

  // Reference for background income tracking
  const stateRef = useRef({ rate: 0, limit: 0, lastTick: Date.now() });
  
  useEffect(() => {
    stateRef.current.rate = goldPerHour;
    stateRef.current.limit = goldLimit;
  }, [goldPerHour, goldLimit]);

  // Passive income effect (online & background robust)
  useEffect(() => {
    if (!user?.uid) return;

    stateRef.current.lastTick = Date.now();

    const interval = setInterval(async () => {
      try {
        const now = Date.now();
        const deltaSeconds = (now - stateRef.current.lastTick) / 1000;
        stateRef.current.lastTick = now;

        const currentRate = stateRef.current.rate;
        if (currentRate <= 0 || deltaSeconds <= 0) return;
        
        // Calculate exact fraction of gold generated since last tick
        // Even if browser throttles the tab to 1 tick per minute, deltaSeconds will be 60 and it will give correct amount!
        const earned = Math.max(1, Math.floor(currentRate * (deltaSeconds / 3600))); 
        
        if (earned > 0) {
          await updateDoc(doc(db, 'players', user.uid), {
             gold: increment(earned),
             lastActive: serverTimestamp() // updating lastActive constantly so offline logic syncs nicely
          });
          console.log(`Passive income synced: +${earned} gold over ${Math.floor(deltaSeconds)}s (Rate: ${currentRate}/h)`);
        }

      } catch (err) {
        console.warn("Passive income sync error:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user?.uid]);


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
            data.garrison = { knight: 10, archer: 5, mage: 0, berserk: 0, dragon: 0, titan: 0 };
            updates.garrison = data.garrison;
            needsUpdate = true;
          } else {
            // Check for missing units
            if (data.garrison.berserk === undefined || data.garrison.dragon === undefined || data.garrison.titan === undefined) {
              data.garrison = { 
                ...data.garrison, 
                berserk: data.garrison.berserk || 0,
                dragon: data.garrison.dragon || 0,
                titan: data.garrison.titan || 0
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

          // OFFLINE EARNINGS CALCULATION
          if (data.lastActive && stateRef.current.rate > 0) {
            const lastActiveDate = data.lastActive.toDate ? data.lastActive.toDate() : new Date(data.lastActive);
            const now = new Date();
            const diffMs = now.getTime() - lastActiveDate.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            
            if (diffHours > 0.01) { // More than 36 seconds
              const earned = Math.floor(diffHours * stateRef.current.rate);
              if (earned > 0) {
                const newGold = Math.min(stateRef.current.limit, data.gold + earned);
                if (newGold > data.gold) {
                  await updateDoc(playerRef, {
                    gold: newGold,
                    lastActive: serverTimestamp() // Update to prevent double collection
                  });
                  console.log(`Earned ${earned} gold while offline!`);
                }
              }
            }
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
            garrison: { knight: 10, archer: 5, mage: 0, berserk: 0, dragon: 0, titan: 0 },
            hero: { level: 1, exp: 0, equipment: { weapon: null, armor: null } },
            battleRating: 150 + 75 + 100, // Hardcoded initial calc
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
  }, [user?.uid, calculateBR]);

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

  const addDiamonds = async (amount: number) => {
    if (!user || !player) return;
    try {
      const playerRef = doc(db, 'players', user.uid);
      await updateDoc(playerRef, {
        diamonds: player.diamonds + amount,
        lastActive: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, 'update', `players/${user.uid}`);
    }
  };

  const expandBase = async () => {
    if (!user || !player) return;
    const currentSlots = player.baseSlots || 6;
    const cost = 10 * Math.pow(2, currentSlots - 6);
    if (player.diamonds < cost) throw new Error("Недостаточно алмазов");
    
    try {
      const playerRef = doc(db, 'players', user.uid);
      await updateDoc(playerRef, {
        diamonds: player.diamonds - cost,
        baseSlots: player.baseSlots + 1,
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

      await updateDoc(playerRef, { gold: increment(-cost), lastActive: serverTimestamp() });
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

    const cost = Math.floor(500 * Math.pow(1.8, building.level));
    if (player.gold < cost) throw new Error(`Недостаточно золота для улучшения (${cost})`);

    try {
      const playerRef = doc(db, 'players', user.uid);
      const buildingRef = doc(db, 'players', user.uid, 'buildings', buildingId);

      await updateDoc(playerRef, { gold: increment(-cost), lastActive: serverTimestamp() });
      await updateDoc(buildingRef, {
        level: increment(1),
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
        gold: increment(-cost),
        garrison: newGarrison,
        battleRating: newBR,
        lastActive: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, 'update', `players/${user.uid}`);
    }
  };

  const recruitAllUnits = async (type: keyof PlayerData['garrison'], costPerUnit: number) => {
    if (!user || !player) return;
    
    const currentTotalUnits = Object.values(player.garrison).reduce((a, b) => a + b, 0);
    const availableSlots = unitLimit - currentTotalUnits;
    if (availableSlots <= 0) throw new Error("Нет свободных мест в гарнизоне");

    const affordableCount = Math.floor(player.gold / costPerUnit);
    const countToRecruit = Math.min(availableSlots, affordableCount);
    
    if (countToRecruit <= 0) throw new Error("Недостаточно золота для найма хотя бы одного юнита");

    const cost = countToRecruit * costPerUnit;

    try {
      const playerRef = doc(db, 'players', user.uid);
      const newGarrison = { ...player.garrison, [type]: (player.garrison[type] || 0) + countToRecruit };
      const newBR = calculateBR({ ...player, garrison: newGarrison });
      
      await updateDoc(playerRef, {
        gold: increment(-cost),
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

  const buyItem = async (item: { name: string, type: 'weapon'|'armor', rarity: string, stats: any, cost: number, icon: string }) => {
    if (!user || !player) return;
    if (player.gold < item.cost) throw new Error("Недостаточно золота");

    try {
      const playerRef = doc(db, 'players', user.uid);
      const itemsRef = collection(db, 'players', user.uid, 'items');

      await updateDoc(playerRef, { gold: increment(-item.cost), lastActive: serverTimestamp() });
      await addDoc(itemsRef, {
        ownerId: user.uid,
        name: item.name,
        type: item.type,
        rarity: item.rarity,
        stats: item.stats,
        icon: item.icon,
        level: 1,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, 'write', `players/${user.uid}/items`);
    }
  };

  const equipItem = async (item: any) => {
    if (!user || !player || !item || !item.type) return;
    const playerRef = doc(db, 'players', user.uid);
    try {
      const newEquip = { ...player.hero.equipment, [item.type]: item };
      await updateDoc(playerRef, {
        'hero.equipment': newEquip,
        lastActive: serverTimestamp()
      });
    } catch(err) {
      handleFirestoreError(err, 'update', `players/${user.uid}`);
    }
  };

  const unequipItem = async (slot: 'weapon'|'armor') => {
    if (!user || !player) return;
    const playerRef = doc(db, 'players', user.uid);
    try {
      const newEquip = { ...player.hero.equipment, [slot]: null };
      await updateDoc(playerRef, {
        'hero.equipment': newEquip,
        lastActive: serverTimestamp()
      });
    } catch(err) {
      handleFirestoreError(err, 'update', `players/${user.uid}`);
    }
  };

  const sellItem = async (itemId: string, refund: number) => {
    if (!user || !player) return;
    try {
      const playerRef = doc(db, 'players', user.uid);
      const itemRef = doc(db, 'players', user.uid, 'items', itemId);
      
      const itemToSell = items.find(i => i.id === itemId);
      if(itemToSell) {
         // check if equipped, if yes, unequip
         if (player.hero.equipment.weapon?.id === itemId) await unequipItem('weapon');
         if (player.hero.equipment.armor?.id === itemId) await unequipItem('armor');
      }

      await deleteDoc(itemRef);
      await updateDoc(playerRef, { 
        gold: increment(refund),
        lastActive: serverTimestamp()
      });
    } catch(err) {
      handleFirestoreError(err, 'delete', `players/${user.uid}/items/${itemId}`);
    }
  };

  const upgradeItem = async (itemId: string, cost: number) => {
    if (!user || !player) return;
    if (player.gold < cost) throw new Error("Недостаточно золота");
    try {
      const playerRef = doc(db, 'players', user.uid);
      const itemRef = doc(db, 'players', user.uid, 'items', itemId);
      
      const item = items.find(i => i.id === itemId);
      if(!item) return;

      const newFields = { level: increment(1) };
      
      // Upgrade stats (multiply by ~1.2)
      if (item.stats) {
         const newStats: any = {};
         for (const [k, v] of Object.entries(item.stats)) {
           newStats[k] = Math.floor((v as number) * 1.2);
         }
         (newFields as any).stats = newStats;
      }

      await updateDoc(playerRef, { gold: increment(-cost), lastActive: serverTimestamp() });
      await updateDoc(itemRef, newFields);

      // If equipped, re-equip to update stats in hero
      const typeKey = item.type as 'weapon'|'armor';
      if (player.hero.equipment[typeKey]?.id === itemId) {
         const updatedItem = { ...item, level: (item.level||1) + 1, stats: (newFields as any).stats };
         const newEquip = { ...player.hero.equipment, [typeKey]: updatedItem };
         await updateDoc(playerRef, { 'hero.equipment': newEquip });
      }
    } catch(err) {
      handleFirestoreError(err, 'update', `players/${user.uid}/items/${itemId}`);
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
      // We will increment the refund amount. Firebase rules prevent going below 0, but selling only adds gold.
      // However to respect the client's concept of a limit without writing complex rules, we can just do a max fetch or let them exceed slightly.
      // For now, incrementing refund is safe and avoids races.
      await updateDoc(playerRef, {
        gold: increment(refund),
        lastActive: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, 'delete', `players/${user.uid}/buildings/${buildingId}`);
    }
  };

  return (
    <GameContext.Provider value={{ 
      user, player, buildings, items, loading, 
      addGold, addDiamonds, expandBase, buildStructure, upgradeBuilding, sellBuilding, recruitUnit, recruitAllUnits, updateGarrison, buyItem, equipItem, unequipItem, sellItem, upgradeItem, startPvP, getLeaderboard,
      goldLimit, unitLimit, goldPerHour
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
