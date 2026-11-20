import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve(process.cwd(), 'data');
const storeFile = path.join(dataDir, 'store.json');

function seed() {
  return {
    movies: [
      { id: 'm1', title: 'Iron Man', releaseYear: 2008, runtimeMinutes: 126, prerequisites: [], watched: false },
      { id: 'm2', title: 'Captain America: The First Avenger', releaseYear: 2011, runtimeMinutes: 124, prerequisites: [], watched: false },
      { id: 'm3', title: 'The Avengers', releaseYear: 2012, runtimeMinutes: 143, prerequisites: ['m1', 'm2'], watched: false },
      { id: 'm4', title: 'Captain America: Civil War', releaseYear: 2016, runtimeMinutes: 147, prerequisites: ['m3'], watched: false },
      { id: 'm5', title: 'Thor: Ragnarok', releaseYear: 2017, runtimeMinutes: 120, prerequisites: [], watched: false },
      { id: 'm6', title: 'Avengers: Infinity War', releaseYear: 2018, runtimeMinutes: 149, prerequisites: ['m4', 'm5'], watched: false },
      { id: 'm7', title: 'Avengers: Endgame', releaseYear: 2019, runtimeMinutes: 181, prerequisites: ['m6'], watched: false },
      { id: 'm8', title: 'Avengers: Doomsday', releaseYear: 2026, runtimeMinutes: 160, prerequisites: ['m7'], watched: false },
    ],
    cinemas: [
      { id: 'c1', name: 'Opening Night Grand', bundleSizes: [2, 5] },
    ],
  };
}

export function loadStore() {
  if (!fs.existsSync(storeFile)) {
    const initial = seed();
    saveStore(initial);
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(storeFile, 'utf8'));
  } catch {
    const initial = seed();
    saveStore(initial);
    return initial;
  }
}

export function saveStore(store) {
  fs.mkdirSync(dataDir, { recursive: true });
  const temp = `${storeFile}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(store, null, 2));
  fs.renameSync(temp, storeFile);
}

export function nextId(items, prefix) {
  const highest = items.reduce((max, item) => {
    const number = Number.parseInt(String(item.id).replace(prefix, ''), 10);
    return Number.isNaN(number) ? max : Math.max(max, number);
  }, 0);
  return `${prefix}${highest + 1}`;
}
