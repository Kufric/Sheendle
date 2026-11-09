import React, { useState, useEffect, useMemo, useCallback } from 'react';
import songsData from './data/songs.json';
import type {
  Attempt,
  DailyGameState,
  GameMode,
  GameStatus,
  Song,
  StatsData,
} from './types';
import {
  getDailySong,
  getDayNumber,
  getInitialStats,
  getRandomUnlimitedSong,
  getTodayDateKey,
  MAX_ATTEMPTS,
} from './utils/game';
import { Header } from './components/Header';
import { GuessList } from './components/GuessList';
import { AudioPlayer } from './components/AudioPlayer';
import { SongSearch } from './components/SongSearch';
import { ResultCard } from './components/ResultCard';
import { StatsModal } from './components/StatsModal';
import { HelpModal } from './components/HelpModal';

const songs: Song[] = songsData as Song[];
const DAILY_STORAGE_KEY = 'sheendle_daily_v1';
const STATS_STORAGE_KEY = 'sheendle_stats_v1';
const RECENT_UNLIMITED_KEY = 'sheendle_unlimited_recent_v1';

export const App: React.FC = () => {
  const todayKey = getTodayDateKey();
  const dayNumber = getDayNumber(todayKey);
  const dailyTargetSong = useMemo(
    () => getDailySong(songs, todayKey),
    [todayKey]
  );

  const [mode, setMode] = useState<GameMode>('daily');
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Statistics state
  const [stats, setStats] = useState<StatsData>(() => {
    try {
      const raw = localStorage.getItem(STATS_STORAGE_KEY);
      if (raw) {
        return { ...getInitialStats(), ...JSON.parse(raw) };
      }
    } catch {
      // ignore corrupted storage
    }
    return getInitialStats();
  });

  // Daily game state
  const [dailyState, setDailyState] = useState<DailyGameState>(() => {
    try {
      const raw = localStorage.getItem(DAILY_STORAGE_KEY);
      if (raw) {
        const parsed: DailyGameState = JSON.parse(raw);
        if (parsed.dateKey === todayKey && parsed.songId === dailyTargetSong.id) {
          return parsed;
        }
      }
    } catch {
      // ignore corrupted storage
    }
    return {
      dateKey: todayKey,
      dayNumber,
      songId: dailyTargetSong.id,
      attempts: [],
      status: 'playing',
    };
  });

  // Unlimited game state
  const [recentUnlimitedIds, setRecentUnlimitedIds] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_UNLIMITED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [unlimitedSong, setUnlimitedSong] = useState<Song>(() =>
    getRandomUnlimitedSong(songs, recentUnlimitedIds, dailyTargetSong.id)
  );
  const [unlimitedAttempts, setUnlimitedAttempts] = useState<Attempt[]>([]);
  const [unlimitedStatus, setUnlimitedStatus] = useState<GameStatus>('playing');

  // Persist Daily state
  useEffect(() => {
    try {
      localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(dailyState));
    } catch {
      // ignore storage quota errors
    }
  }, [dailyState]);

  // Persist Stats
  useEffect(() => {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // ignore storage quota errors
    }
  }, [stats]);

  // Persist recent unlimited song IDs
  useEffect(() => {
    try {
      localStorage.setItem(
        RECENT_UNLIMITED_KEY,
        JSON.stringify(recentUnlimitedIds)
      );
    } catch {
      // ignore storage quota errors
    }
  }, [recentUnlimitedIds]);

  const activeSong = mode === 'daily' ? dailyTargetSong : unlimitedSong;
  const activeAttempts =
    mode === 'daily' ? dailyState.attempts : unlimitedAttempts;
  const activeStatus = mode === 'daily' ? dailyState.status : unlimitedStatus;

  const guessedSongIds = useMemo(() => {
    const ids = new Set<number>();
    for (const att of activeAttempts) {
      if (att.song) ids.add(att.song.id);
    }
    return ids;
  }, [activeAttempts]);

  const recordStatsOnFinish = useCallback(
    (won: boolean, attemptCount: number, gameMode: GameMode) => {
      setStats((prev) => {
        const nextDist = [...prev.guessDistribution] as [
          number,
          number,
          number,
          number,
          number,
          number,
        ];
        if (won && attemptCount >= 1 && attemptCount <= 6) {
          nextDist[attemptCount - 1] += 1;
        }

        if (gameMode === 'daily') {
          if (prev.lastCompletedDate === todayKey) return prev;
          const nextStreak = won ? prev.currentStreak + 1 : 0;
          return {
            ...prev,
            gamesPlayed: prev.gamesPlayed + 1,
            gamesWon: won ? prev.gamesWon + 1 : prev.gamesWon,
            currentStreak: nextStreak,
            maxStreak: Math.max(prev.maxStreak, nextStreak),
            guessDistribution: nextDist,
            lastCompletedDate: todayKey,
          };
        } else {
          const nextUnlimStreak = won ? prev.unlimitedStreak + 1 : 0;
          return {
            ...prev,
            unlimitedPlayed: prev.unlimitedPlayed + 1,
            unlimitedWon: won ? prev.unlimitedWon + 1 : prev.unlimitedWon,
            unlimitedStreak: nextUnlimStreak,
            unlimitedMaxStreak: Math.max(
              prev.unlimitedMaxStreak,
              nextUnlimStreak
            ),
            guessDistribution: nextDist,
          };
        }
      });
    },
    [todayKey]
  );

  const commitAttempt = useCallback(
    (newAttempt: Attempt) => {
      if (activeStatus !== 'playing') return;

      const updatedAttempts = [...activeAttempts, newAttempt];
      const isCorrect = newAttempt.type === 'correct';
      const isOutOfTries = updatedAttempts.length >= MAX_ATTEMPTS;

      const nextStatus: GameStatus = isCorrect
        ? 'won'
        : isOutOfTries
          ? 'lost'
          : 'playing';

      if (mode === 'daily') {
        setDailyState((prev) => ({
          ...prev,
          attempts: updatedAttempts,
          status: nextStatus,
        }));
      } else {
        setUnlimitedAttempts(updatedAttempts);
        setUnlimitedStatus(nextStatus);
      }

      if (nextStatus === 'won' || nextStatus === 'lost') {
        recordStatsOnFinish(nextStatus === 'won', updatedAttempts.length, mode);
        if (mode === 'unlimited') {
          setRecentUnlimitedIds((prev) =>
            [...prev, activeSong.id].slice(-50)
          );
        }
      }
    },
    [activeAttempts, activeSong.id, activeStatus, mode, recordStatsOnFinish]
  );

  const handleSubmitGuess = useCallback(
    (guessedSong: Song) => {
      if (activeStatus !== 'playing') return;
      if (guessedSongIds.has(guessedSong.id)) return;

      const isMatch = guessedSong.id === activeSong.id;
      commitAttempt({
        type: isMatch ? 'correct' : 'wrong',
        song: guessedSong,
      });
    },
    [activeSong.id, activeStatus, commitAttempt, guessedSongIds]
  );

  const handleSkip = useCallback(() => {
    if (activeStatus !== 'playing') return;
    commitAttempt({ type: 'skipped' });
  }, [activeStatus, commitAttempt]);

  const handleNextUnlimitedSong = useCallback(() => {
    const nextSong = getRandomUnlimitedSong(
      songs,
      recentUnlimitedIds,
      unlimitedSong.id
    );
    setUnlimitedSong(nextSong);
    setUnlimitedAttempts([]);
    setUnlimitedStatus('playing');
  }, [recentUnlimitedIds, unlimitedSong.id]);

  return (
    <div
      data-mode={mode}
      style={{ '--game-mode': mode } as React.CSSProperties}
      className="theme-reactive min-h-dvh flex flex-col bg-[#08090c] text-slate-100 relative overflow-x-hidden transition-colors duration-500"
    >
      {/* Ambient Background Glow over deep black (Turquoise in Daily, Red in Unlimited) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden z-0"
      >
        <div
          style={{ backgroundColor: 'var(--ambient-1)' }}
          className="absolute -top-40 left-1/4 w-[28rem] h-[28rem] rounded-full blur-[135px] transition-colors duration-700"
        />
        <div
          style={{ backgroundColor: 'var(--ambient-2)' }}
          className="absolute top-1/3 -right-32 w-[26rem] h-[26rem] rounded-full blur-[145px] transition-colors duration-700"
        />
        <div
          style={{ backgroundColor: 'var(--ambient-3)' }}
          className="absolute -bottom-40 left-1/3 w-[28rem] h-[28rem] rounded-full blur-[135px] transition-colors duration-700"
        />
      </div>

      <Header
        mode={mode}
        onModeChange={setMode}
        dayNumber={dayNumber}
        dailyCompleted={dailyState.status !== 'playing'}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      <main className="relative z-20 flex-1 w-full max-w-2xl mx-auto px-4 py-6 sm:py-8 flex flex-col gap-5">
        {/* Mode Subheader Banner */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="flex items-center gap-2">
            <span
              style={{ backgroundColor: 'var(--accent-bright)' }}
              className="w-2 h-2 rounded-full inline-block shadow-[0_0_8px_var(--accent-glow-strong)]"
            />
            {mode === 'daily'
              ? `Denní výzva #${dayNumber} • Stejný song pro všechny`
              : 'Nekonečný mód • Trénuj na celé diskografii Viktora Sheena & BUKA'}
          </span>
          <span className="font-mono text-slate-500">
            {songs.length} tracků v databázi
          </span>
        </div>

        {/* 6 Attempt Slots */}
        <GuessList
          attempts={activeAttempts}
          status={activeStatus}
          targetSong={activeSong}
        />

        {/* End of Round Result Card (Won / Lost) */}
        {activeStatus !== 'playing' && (
          <ResultCard
            song={activeSong}
            attempts={activeAttempts}
            status={activeStatus}
            mode={mode}
            dayNumber={dayNumber}
            onNextUnlimited={handleNextUnlimitedSong}
            onSwitchToUnlimited={() => setMode('unlimited')}
          />
        )}

        {/* Audio Player with 15s segmented progress bar */}
        <AudioPlayer
          song={activeSong}
          attemptIndex={activeAttempts.length}
          status={activeStatus}
          onSkip={handleSkip}
        />

        {/* Search & Autocomplete Input */}
        {activeStatus === 'playing' && (
          <SongSearch
            songs={songs}
            guessedSongIds={guessedSongIds}
            disabled={activeStatus !== 'playing'}
            onSubmitGuess={handleSubmitGuess}
          />
        )}
      </main>

      <footer className="relative z-0 mt-auto w-full py-4 text-center text-xs text-slate-500 border-t border-white/[0.06] bg-[#08090c]">
        <p>
          Sheendle • Hudební ukázky a obaly alb poskytuje Apple Music / iTunes
          API
        </p>
      </footer>

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

export default App;
