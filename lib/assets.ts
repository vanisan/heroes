// This file imports all game icons as static assets
// This ensures that the bundler picks them up and deploys them correctly

export const ICONS = {
  buildings: {
    gold_mine: { src: '/icons/mine.webp' },
    town_hall: { src: '/icons/hall.webp' },
    barracks: { src: '/icons/barracks.webp' },
    granary: { src: '/icons/granary.webp' }
  },
  units: {
    knight: { src: '/icons/knight.webp' },
    archer: { src: '/icons/archer.webp' },
    mage: { src: '/icons/mage.webp' },
    berserk: { src: '/icons/berserk.webp' },
    dragon: { src: '/icons/dragon.webp' },
    titan: { src: '/icons/titan.webp' }
  },
  hero: { src: '/icons/hero/hero.webp' }
};
