import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Share2,
  Check,
  ArrowRight,
  ExternalLink,
  Trophy,
  Headphones,
  Clock,
  Infinity as InfinityIcon,
} from 'lucide-react';
import type { Attempt, GameMode, GameStatus, Song } from '../types';
import {
  ATTEMPT_DURATIONS,
  formatShareText,
  getTimeUntilMidnight,
} from '../utils/game';

interface ResultCardProps {
  song: Song;
  attempts: Attempt[];
  status: GameStatus;
  mode: GameMode;
  dayNumber: number;
  onNextUnlimited: () => void;
  onSwitchToUnlimited: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  song,
  attempts,
  status,
  mode,
  dayNumber,
  onNextUnlimited,
  onSwitchToUnlimited,
}) => {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(getTimeUntilMidnight());

  const isWon = status === 'won';
  const winningDuration = isWon
    ? ATTEMPT_DURATIONS[Math.max(0, attempts.length - 1)]
    : null;

  // Trigger mode-appropriate confetti on win
  useEffect(() => {
    if (isWon) {
      const palette =
        mode === 'unlimited'
          ? ['#991b1b', '#dc2626', '#ef4444', '#fca5a5', '#10b981']
          : ['#205060', '#297a94', '#3ca3c2', '#7fd4ea', '#10b981'];
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: palette,
      });
    }
  }, [isWon, mode, song.id]);

  // Update countdown every second in Daily mode
  useEffect(() => {
    if (mode !== 'daily') return;
    const interval = setInterval(() => {
      setCountdown(getTimeUntilMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, [mode]);

  const handleShare = async () => {
    const text = formatShareText(dayNumber, attempts, status);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      aria-label="Výsledek kola"
      className={`w-full rounded-2xl border p-5 sm:p-6 bg-[#0e1017]/90 backdrop-blur-xl transition-all duration-500 ${
        isWon
          ? 'border-[var(--accent-border-strong)] shadow-[0_0_40px_var(--accent-surface-strong)]'
          : 'border-rose-500/40 shadow-[0_0_40px_rgba(244,63,94,0.15)]'
      }`}
    >
      {/* Top Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl ${
              isWon
                ? 'bg-[var(--accent-surface-strong)] text-[var(--accent-pale)] border border-[var(--accent-border-strong)]'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              {isWon
                ? `Uhodnuto na ${attempts.length}. pokus (${winningDuration} s)!`
                : 'Tentokrát to nevyšlo!'}
            </h2>
            <p className="text-xs text-slate-400">
              {isWon
                ? 'Skvělá práce, poznáš Sheena během vteřiny.'
                : 'Poslechni si celou 30s ukázku níže.'}
            </p>
          </div>
        </div>

        {mode === 'daily' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-[var(--accent-light)]" />
            <span>Další song za:</span>
            <strong className="font-mono text-white">{countdown}</strong>
          </div>
        )}
      </div>

      {/* Album Cover (600x600) + Song Details */}
      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="relative group shrink-0">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[var(--accent-from)] via-[var(--accent-to)] to-[var(--accent-bright)] opacity-60 blur-lg group-hover:opacity-85 transition-opacity" />
          <img
            src={song.artworkUrl}
            alt={`${song.title} – ${song.album}`}
            className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-2xl object-cover border border-white/20 shadow-2xl"
          />
        </div>

        <div className="flex-1 text-center sm:text-left min-w-0 space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--accent-surface-strong)] text-[var(--accent-pale)] border border-[var(--accent-border)]">
              <Headphones className="w-3 h-3" />
              Hledaný track
            </span>
            {song.isFeat && (
              <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/10 text-white border border-white/20">
                Feat
              </span>
            )}
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight break-words">
            {song.title}
          </h3>

          <p className="text-sm sm:text-base font-medium text-[var(--accent-light)]">
            {song.artist}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs text-slate-300">
            <span className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10">
              Album: <strong className="text-white">{song.album}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10">
              Rok vydání: <strong className="text-white">{song.releaseYear}</strong>
            </span>
          </div>

          <div className="pt-2">
            <a
              href={song.trackViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white underline underline-offset-4 decoration-[var(--accent-bright)] hover:decoration-[var(--accent-light)] transition-colors"
            >
              <span>Poslechnout celý track na Apple Music</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        {mode === 'daily' ? (
          <>
            <button
              type="button"
              onClick={handleShare}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-from)] via-[var(--accent-via)] to-[var(--accent-to)] hover:from-[var(--accent-hover-from)] hover:to-[var(--accent-hover-to)] border border-[var(--accent-border-strong)] text-white text-sm font-bold shadow-[0_0_24px_var(--accent-glow)] transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Zkopírováno do schránky!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Sdílet výsledek</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onSwitchToUnlimited}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-red-950/60 border border-white/15 hover:border-red-500/50 text-slate-200 hover:text-white text-sm font-semibold transition-all cursor-pointer"
            >
              <InfinityIcon className="w-4 h-4 text-red-400" />
              <span>Trénovat v Nekonečném módu →</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onNextUnlimited}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[var(--accent-from)] via-[var(--accent-via)] to-[var(--accent-to)] hover:from-[var(--accent-hover-from)] hover:to-[var(--accent-hover-to)] border border-[var(--accent-border-strong)] text-white text-base font-bold shadow-[0_0_28px_var(--accent-glow)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>Hrát další song</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </section>
  );
};
