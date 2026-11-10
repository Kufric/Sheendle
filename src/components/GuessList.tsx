import React from 'react';
import { CheckCircle2, XCircle, FastForward, Volume2, Lock } from 'lucide-react';
import type { Attempt, GameStatus, Song } from '../types';
import { ATTEMPT_DURATIONS, MAX_ATTEMPTS } from '../utils/game';

interface GuessListProps {
  attempts: Attempt[];
  status: GameStatus;
  targetSong: Song;
}

export const GuessList: React.FC<GuessListProps> = ({
  attempts,
  status,
  targetSong,
}) => {
  const slots = Array.from({ length: MAX_ATTEMPTS }, (_, index) => {
    const attempt = attempts[index];
    const duration = ATTEMPT_DURATIONS[index];
    const isCurrentActive = status === 'playing' && index === attempts.length;
    return { index, attempt, duration, isCurrentActive };
  });

  return (
    <section aria-label="Historie pokusů" className="w-full space-y-2">
      {slots.map(({ index, attempt, duration, isCurrentActive }) => {
        if (attempt) {
          if (attempt.type === 'correct' && attempt.song) {
            return (
              <div
                key={index}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/50 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all duration-300"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <img
                    src={attempt.song.artworkUrl}
                    alt={attempt.song.album}
                    className="w-9 h-9 rounded-lg object-cover border border-emerald-400/30 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white truncate">
                        {attempt.song.title}
                      </p>
                      {attempt.song.isFeat && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 shrink-0">
                          Feat
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-300/90 truncate">
                      {attempt.song.album} ({attempt.song.releaseYear})
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 shrink-0">
                  {duration}s
                </span>
              </div>
            );
          }

          if (attempt.type === 'wrong' && attempt.song) {
            const isSameAlbum =
              attempt.song.album.toLowerCase() === targetSong.album.toLowerCase();

            return (
              <div
                key={index}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/35 text-rose-100 transition-all duration-300"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <img
                    src={attempt.song.artworkUrl}
                    alt={attempt.song.album}
                    className="w-9 h-9 rounded-lg object-cover border border-rose-400/25 shrink-0 opacity-90"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-rose-100 truncate">
                        {attempt.song.title}
                      </p>
                      {attempt.song.isFeat && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-200 border border-rose-400/30 shrink-0">
                          Feat
                        </span>
                      )}
                      {isSameAlbum && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                          Stejné album
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-rose-300/75 truncate">
                      {attempt.song.album} ({attempt.song.releaseYear})
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-rose-300/75 px-2 py-0.5 rounded-md bg-rose-500/15 shrink-0">
                  {duration}s
                </span>
              </div>
            );
          }

          // Skipped attempt
          return (
            <div
              key={index}
              className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <FastForward className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-slate-400">
                  PŘESKOČENO
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500 px-2 py-0.5 rounded-md bg-white/[0.04] shrink-0">
                {duration}s
              </span>
            </div>
          );
        }

        // Active current attempt slot
        if (isCurrentActive) {
          return (
            <div
              key={index}
              className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl bg-[#0b0d13]/90 backdrop-blur-md border border-[var(--accent-border-strong)] shadow-[0_0_22px_var(--accent-surface-strong)] transition-all duration-300"
            >
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-[var(--accent-light)] animate-pulse shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-[var(--accent-pale)]">
                  {index + 1}. pokus — odemčena ukázka{' '}
                  <strong className="text-white font-semibold">{duration} s</strong>
                </span>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-[var(--accent-surface-strong)] text-[var(--accent-pale)] border border-[var(--accent-border)] shrink-0">
                {duration}s
              </span>
            </div>
          );
        }

        // Empty future slot
        return (
          <div
            key={index}
            className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-[#0b0d13]/88 backdrop-blur-sm border border-white/[0.07] text-slate-500"
          >
            <div className="flex items-center gap-2.5">
              <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="text-xs sm:text-sm text-slate-500">
                {index + 1}. pokus
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded-md bg-white/[0.04] shrink-0">
              {duration}s
            </span>
          </div>
        );
      })}
    </section>
  );
};
