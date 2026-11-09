export interface Song {
  id: number;
  title: string;
  artist: string;
  album: string;
  releaseYear: number;
  artworkUrl: string;
  previewUrl: string;
  trackViewUrl: string;
  isFeat?: boolean;
}

export type AttemptType = 'wrong' | 'skipped' | 'correct';

export interface Attempt {
  type: AttemptType;
  song?: Song;
}

export type GameMode = 'daily' | 'unlimited';

export type GameStatus = 'playing' | 'won' | 'lost';

export interface DailyGameState {
  dateKey: string;
  dayNumber: number;
  songId: number;
  attempts: Attempt[];
  status: GameStatus;
}

export interface StatsData {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: [number, number, number, number, number, number];
  lastCompletedDate?: string;
  unlimitedPlayed: number;
  unlimitedWon: number;
  unlimitedStreak: number;
  unlimitedMaxStreak: number;
}
