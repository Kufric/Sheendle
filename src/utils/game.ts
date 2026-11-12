import type { Attempt, GameStatus, Song, StatsData, UnlimitedFilters } from '../types';

export const DEFAULT_UNLIMITED_FILTERS: UnlimitedFilters = {
  buka: true,
  collabs: true,
  feats: true,
};

export const ATTEMPT_DURATIONS = [0.1, 0.5, 2.0, 4.0, 8.0, 15.0] as const;
export const MAX_ATTEMPTS = 6;
export const MAX_SNIPPET_DURATION = 15.0;
export const FULL_PREVIEW_DURATION = 30.0;

// Epoch chosen so 2026-11-09 is Sheendle #12
const EPOCH_DATE = new Date(2026, 9, 29); // 2026-10-29 local

export function removeDiacritics(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function getTodayDateKey(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayNumber(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  const current = new Date(y, m - 1, d);
  const diffMs = current.getTime() - EPOCH_DATE.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number): () => number {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getDailySong(songs: Song[], dateKey: string): Song {
  if (songs.length === 0) {
    throw new Error('Databáze písniček je prázdná.');
  }
  const dayNum = getDayNumber(dateKey);
  const cycleIndex = Math.floor((dayNum - 1) / songs.length);
  const posInCycle = (dayNum - 1) % songs.length;

  // Deterministically shuffle songs for each cycle so every day has a unique track
  const indices = songs.map((_, idx) => idx);
  const rng = mulberry32(hashSeed(`sheendle-cycle-${cycleIndex}-v1`));
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Ensure past pinned days remain stable without duplicates
  if (cycleIndex === 0) {
    const day13Pos = 12; // 2026-11-10 (Day 13) -> Spaceship
    const spaceshipIdx = songs.findIndex(
      (s) => s.title.toLowerCase() === 'spaceship'
    );
    if (spaceshipIdx !== -1) {
      const currentPos = indices.indexOf(spaceshipIdx);
      if (currentPos !== -1 && currentPos !== day13Pos) {
        [indices[day13Pos], indices[currentPos]] = [
          indices[currentPos],
          indices[day13Pos],
        ];
      }
    }

    const day15Pos = 14; // 2026-11-12 (Day 15) -> Vata
    const vataIdx = songs.findIndex(
      (s) => s.title.toLowerCase() === 'vata'
    );
    if (vataIdx !== -1) {
      const currentPos = indices.indexOf(vataIdx);
      if (currentPos !== -1 && currentPos !== day15Pos) {
        [indices[day15Pos], indices[currentPos]] = [
          indices[currentPos],
          indices[day15Pos],
        ];
      }
    }
  }

  // Also mix in the dateKey for any pre-epoch dates
  if (dayNum === 1 && dateKey !== '2026-10-29') {
    const fallbackIdx = hashSeed(`sheendle-date-${dateKey}`) % songs.length;
    return songs[fallbackIdx];
  }

  return songs[indices[posInCycle]];
}

export function isBukaSong(song: Song): boolean {
  const norm = removeDiacritics(`${song.artist} ${song.title} ${song.album}`);
  return (
    norm.includes('buka') ||
    norm.includes('kristyna') ||
    norm.includes('lil buca')
  );
}

export function isCollabSong(song: Song): boolean {
  const album = removeDiacritics(song.album || '');
  return (
    album.includes('roadtrip') ||
    album.includes('projekt asia') ||
    album.includes('gral')
  );
}

export function isFeatSong(song: Song): boolean {
  return Boolean(song.isFeat);
}

export function isSongMatchingFilters(
  song: Song,
  filters: UnlimitedFilters
): boolean {
  if (!filters.buka && isBukaSong(song)) return false;
  if (!filters.collabs && isCollabSong(song)) return false;
  if (!filters.feats && isFeatSong(song)) return false;
  return true;
}

export function getFilteredUnlimitedSongs(
  songs: Song[],
  filters: UnlimitedFilters
): Song[] {
  return songs.filter((s) => isSongMatchingFilters(s, filters));
}

export function getRandomUnlimitedSong(
  songs: Song[],
  recentIds: number[],
  currentId?: number
): Song {
  const maxRecent = Math.min(45, Math.floor(songs.length * 0.6));
  const recentSet = new Set(recentIds.slice(-maxRecent));
  if (currentId !== undefined) {
    recentSet.add(currentId);
  }

  const candidates = songs.filter((s) => !recentSet.has(s.id));
  const pool = candidates.length > 0 ? candidates : songs.filter((s) => s.id !== currentId);
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex] || songs[0];
}

export function formatCzechDate(dateKey: string, includeYear = true): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  return includeYear ? `${d}. ${m}. ${y}` : `${d}. ${m}.`;
}

export function formatShareText(
  dateKey: string,
  attempts: Attempt[],
  status: GameStatus
): string {
  const scoreStr = status === 'won' ? `${attempts.length}/6` : 'X/6';
  const dateStr = formatCzechDate(dateKey, true);
  const boxes: string[] = [];

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const attempt = attempts[i];
    if (!attempt) {
      boxes.push('⬜');
    } else if (attempt.type === 'correct') {
      boxes.push('🟩');
    } else if (attempt.type === 'skipped') {
      boxes.push('⬛');
    } else {
      boxes.push('🟥');
    }
  }

  return `Sheendle (${dateStr}) 🎵 ${scoreStr}\n${boxes.join('')}`;
}

export function getInitialStats(): StatsData {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0],
    unlimitedPlayed: 0,
    unlimitedWon: 0,
    unlimitedStreak: 0,
    unlimitedMaxStreak: 0,
  };
}

export function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    0,
    0,
    0,
    0
  );
  const diffSec = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  const hours = String(Math.floor(diffSec / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
  const seconds = String(diffSec % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}
