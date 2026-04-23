// This file imports all game icons as static assets
// This ensures that the bundler picks them up and deploys them correctly

import mine from '../public/icons/mine.webp';
import hall from '../public/icons/hall.webp';
import barracks from '../public/icons/barracks.webp';
import granary from '../public/icons/granary.webp';

import knight from '../public/icons/knight.webp';
import archer from '../public/icons/archer.webp';
import mage from '../public/icons/mage.webp';
import berserk from '../public/icons/berserk.webp';
import dragon from '../public/icons/dragon.webp';
import titan from '../public/icons/titan.webp';

import hero from '../public/icons/hero/hero.webp';

export const ICONS = {
  buildings: {
    gold_mine: mine,
    town_hall: hall,
    barracks: barracks,
    granary: granary
  },
  units: {
    knight,
    archer,
    mage,
    berserk,
    dragon,
    titan
  },
  hero
};
