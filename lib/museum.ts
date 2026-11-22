import works from '../data/paintings.json';

export const paintings = works;
export type Painting = (typeof paintings)[number];
export const rooms = [
  ['Paintings With Aura', 'paintings-with-aura'],
  ['The Coldest Paintings', 'the-coldest-paintings'],
  ['Medieval & Gothic', 'medieval-and-gothic'],
  ['Forgotten Masterpieces', 'forgotten-masterpieces'],
  ['Dark & Haunting', 'dark-and-haunting'],
  ['Mythology & Legends', 'mythology-and-legends'],
  ['Beautifully Melancholic', 'beautifully-melancholic'],
  ['Beautiful Chaos', 'beautiful-chaos'],
] as const;
export const imageOf = (p: Painting, small = false) =>
  '/art/' + p.id + (small ? '-sm' : '') + '.webp';
export const plate = (n: number) => String(n).padStart(2, '0');
export const findPainting = (id: string) => paintings.find((p) => p.id === id);
