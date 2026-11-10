import React, { useEffect, useRef, useState, useCallback, useId } from 'react';
import {
  Play,
  Pause,
  FastForward,
  Volume2,
  VolumeX,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import type { GameStatus, Song } from '../types';
import {
  ATTEMPT_DURATIONS,
  FULL_PREVIEW_DURATION,
  MAX_ATTEMPTS,
  MAX_SNIPPET_DURATION,
} from '../utils/game';

interface AudioPlayerProps {
  song: Song;
  attemptIndex: number;
  status: GameStatus;
  onSkip: () => void;
  onPlaybackChange?: (playing: boolean) => void;
}

// Piecewise visual positions (%) for [0, 0.1, 0.5, 2.0, 4.0, 8.0, 15.0]
const SEGMENT_TIMES = [0, 0.1, 0.5, 2.0, 4.0, 8.0, 15.0];
const SEGMENT_PERCENTS = [0, 8, 18, 34, 52, 74, 100];

function timeToVisualPercent15s(timeSec: number): number {
  const clamped = Math.max(0, Math.min(MAX_SNIPPET_DURATION, timeSec));
  for (let i = 0; i < SEGMENT_TIMES.length - 1; i++) {
    const t0 = SEGMENT_TIMES[i];
    const t1 = SEGMENT_TIMES[i + 1];
    if (clamped <= t1) {
      const ratio = (clamped - t0) / (t1 - t0);
      return (
        SEGMENT_PERCENTS[i] +
        ratio * (SEGMENT_PERCENTS[i + 1] - SEGMENT_PERCENTS[i])
      );
    }
  }
  return 100;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  song,
  attemptIndex,
  status,
  onSkip,
  onPlaybackChange,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sliderRef = useRef<HTMLInputElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const playStartWallRef = useRef<number | null>(null);
  const prevStatusRef = useRef<GameStatus>(status);
  const prevSongIdRef = useRef<number>(song.id);

  const volumeSliderId = useId();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(FULL_PREVIEW_DURATION);
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('sheendle_volume');
    return saved !== null ? Number(saved) : 80;
  });
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    onPlaybackChange?.(isPlaying);
  }, [isPlaying, onPlaybackChange]);

  const isGameOver = status === 'won' || status === 'lost';
  const clampedAttemptIdx = Math.min(attemptIndex, MAX_ATTEMPTS - 1);
  const unlockedDuration = isGameOver
    ? audioDuration
    : ATTEMPT_DURATIONS[clampedAttemptIdx];

  const nextDuration =
    clampedAttemptIdx < MAX_ATTEMPTS - 1
      ? ATTEMPT_DURATIONS[clampedAttemptIdx + 1]
      : null;
  const skipBonusSeconds =
    nextDuration !== null
      ? Number((nextDuration - unlockedDuration).toFixed(1))
      : null;

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const stopPlaybackAtLimit = useCallback(
    (limitSec: number) => {
      stopRaf();
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      playStartWallRef.current = null;
      setIsPlaying(false);
      setCurrentTime(limitSec);
    },
    [stopRaf]
  );

  const tickProgress = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.paused) {
      setIsPlaying(false);
      return;
    }

    const limit = isGameOver
      ? audio.duration || FULL_PREVIEW_DURATION
      : ATTEMPT_DURATIONS[Math.min(attemptIndex, MAX_ATTEMPTS - 1)];

    const mediaTime = audio.currentTime;
    if (mediaTime > 0 && playStartWallRef.current === null) {
      playStartWallRef.current = performance.now() - mediaTime * 1000;
    }

    const wallElapsed =
      playStartWallRef.current !== null
        ? (performance.now() - playStartWallRef.current) / 1000
        : mediaTime;

    const effectiveTime = isGameOver
      ? mediaTime
      : Math.max(mediaTime, wallElapsed);

    if (!isGameOver && effectiveTime >= limit) {
      stopPlaybackAtLimit(limit);
      return;
    }

    setCurrentTime(Math.min(effectiveTime, limit));
    rafRef.current = requestAnimationFrame(tickProgress);
  }, [attemptIndex, isGameOver, stopPlaybackAtLimit]);

  // Sync slider CSS custom properties for cross-browser track progress
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    const effectiveVol = isMuted ? 0 : volume;
    slider.style.setProperty('--attr-min', '0');
    slider.style.setProperty('--attr-max', '100');
    slider.style.setProperty('--control-value', String(effectiveVol));
  }, [volume, isMuted]);

  // Apply volume to audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume / 100;
    localStorage.setItem('sheendle_volume', String(volume));
  }, [volume, isMuted]);

  // Reset audio when song changes
  useEffect(() => {
    if (prevSongIdRef.current !== song.id) {
      prevSongIdRef.current = song.id;
      stopRaf();
      playStartWallRef.current = null;
      setIsPlaying(false);
      setIsBuffering(false);
      setIsReady(false);
      setCurrentTime(0);
      setAudioDuration(FULL_PREVIEW_DURATION);
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = song.previewUrl;
        audio.load();
      }
    }
  }, [song.id, song.previewUrl, stopRaf]);

  // Auto-play full 30s preview when round finishes (won or lost)
  useEffect(() => {
    const wasPlaying = prevStatusRef.current === 'playing';
    prevStatusRef.current = status;

    if (wasPlaying && (status === 'won' || status === 'lost')) {
      const audio = audioRef.current;
      if (!audio) return;
      stopRaf();
      playStartWallRef.current = null;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          rafRef.current = requestAnimationFrame(tickProgress);
        })
        .catch(() => {
          setIsPlaying(false);
        });
    }
  }, [status, stopRaf, tickProgress]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRaf();
    };
  }, [stopRaf]);

  const handleTogglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      stopRaf();
      audio.pause();
      if (!isGameOver) {
        audio.currentTime = 0;
        setCurrentTime(0);
      }
      playStartWallRef.current = null;
      setIsPlaying(false);
      return;
    }

    try {
      setIsBuffering(true);
      playStartWallRef.current = null;

      if (!isGameOver || audio.currentTime >= (audio.duration || 29.8)) {
        audio.currentTime = 0;
        setCurrentTime(0);
      }

      await audio.play();
      setIsBuffering(false);
      setIsPlaying(true);
      stopRaf();
      rafRef.current = requestAnimationFrame(tickProgress);
    } catch {
      setIsBuffering(false);
      setIsPlaying(false);
    }
  };

  const handleReplayFromStart = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      stopRaf();
      playStartWallRef.current = null;
      audio.currentTime = 0;
      setCurrentTime(0);
      await audio.play();
      setIsPlaying(true);
      rafRef.current = requestAnimationFrame(tickProgress);
    } catch {
      setIsPlaying(false);
    }
  };

  const unlockedVisualPercent = isGameOver
    ? 100
    : timeToVisualPercent15s(unlockedDuration);

  const playheadVisualPercent = isGameOver
    ? Math.min(100, (currentTime / (audioDuration || FULL_PREVIEW_DURATION)) * 100)
    : Math.min(unlockedVisualPercent, timeToVisualPercent15s(currentTime));

  return (
    <section
      aria-label="Audio přehrávač ukázky"
      className="w-full rounded-2xl bg-white/[0.03] border border-white/10 p-4 sm:p-5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    >
      <audio
        ref={audioRef}
        src={song.previewUrl}
        preload="auto"
        onLoadedMetadata={(e) => {
          const dur = e.currentTarget.duration;
          if (dur && Number.isFinite(dur)) {
            setAudioDuration(dur);
          }
          setIsReady(true);
        }}
        onCanPlay={() => {
          setIsReady(true);
          setIsBuffering(false);
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          if (playStartWallRef.current === null) {
            playStartWallRef.current =
              performance.now() - (audioRef.current?.currentTime || 0) * 1000;
          }
        }}
        onTimeUpdate={(e) => {
          if (!isGameOver) {
            const limit = ATTEMPT_DURATIONS[Math.min(attemptIndex, MAX_ATTEMPTS - 1)];
            if (e.currentTarget.currentTime >= limit) {
              stopPlaybackAtLimit(limit);
            }
          }
        }}
        onEnded={() => {
          stopRaf();
          playStartWallRef.current = null;
          setIsPlaying(false);
          setCurrentTime(isGameOver ? audioDuration : unlockedDuration);
        }}
      />

      {/* Timeline Header Info */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-[var(--accent-light)]">
            {currentTime.toFixed(1)}s
          </span>
          <span>/</span>
          <span className="font-mono text-slate-300">
            {isGameOver
              ? `${Math.round(audioDuration)}s (Celá ukázka)`
              : `${unlockedDuration}s odemčeno (z 15s)`}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          {isGameOver
            ? 'Ukázka odemčena naplno'
            : `Pokus ${clampedAttemptIdx + 1} z ${MAX_ATTEMPTS}`}
        </span>
      </div>

      {/* 15s Segmented Progress Bar */}
      <div className="relative w-full h-5 rounded-xl bg-[#0c0e14] border border-white/10 overflow-hidden select-none">
        {/* Unlocked Zone Highlight */}
        <div
          className="absolute inset-y-0 left-0 bg-[var(--accent-surface-strong)] border-r border-[var(--accent-border-strong)] transition-all duration-300"
          style={{ width: `${unlockedVisualPercent}%` }}
        />

        {/* Active Playback Fill */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--accent-from)] via-[var(--accent-to)] to-[var(--accent-bright)] shadow-[0_0_16px_var(--accent-glow-strong)]"
          style={{ width: `${playheadVisualPercent}%` }}
        />

        {/* Segment Divider Ticks (0.1s, 0.5s, 2s, 4s, 8s, 15s) */}
        {!isGameOver &&
          ATTEMPT_DURATIONS.map((segSec, i) => {
            const leftPct = SEGMENT_PERCENTS[i + 1];
            const isUnlockedTick = segSec <= unlockedDuration;
            return (
              <div
                key={segSec}
                style={{ left: `${leftPct}%` }}
                className={`absolute inset-y-0 w-[1.5px] -translate-x-1/2 z-10 transition-colors ${
                  isUnlockedTick
                    ? 'bg-[var(--accent-pale)]/70'
                    : 'bg-white/15'
                }`}
                title={`${i + 1}. pokus: ${segSec}s`}
              />
            );
          })}
      </div>

      {/* Segment Tick Labels below the bar */}
      {!isGameOver && (
        <div className="relative w-full h-5 mt-1 text-[10px] font-mono select-none">
          <span className="absolute left-0 text-slate-500">0s</span>
          {ATTEMPT_DURATIONS.map((segSec, i) => {
            const leftPct = SEGMENT_PERCENTS[i + 1];
            const isCurrent = i === clampedAttemptIdx;
            const isUnlocked = segSec <= unlockedDuration;
            return (
              <span
                key={segSec}
                style={{
                  left: `${leftPct}%`,
                  transform:
                    i === ATTEMPT_DURATIONS.length - 1
                      ? 'translateX(-100%)'
                      : 'translateX(-50%)',
                }}
                className={`absolute transition-colors ${
                  isCurrent
                    ? 'text-[var(--accent-light)] font-bold'
                    : isUnlocked
                      ? 'text-slate-300'
                      : 'text-slate-600'
                }`}
              >
                {segSec}s
              </span>
            );
          })}
        </div>
      )}

      {/* Player Controls Row */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Volume Control */}
        <div className="flex items-center gap-2.5 w-full sm:w-44 order-2 sm:order-1 justify-center sm:justify-start">
          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            aria-label={isMuted || volume === 0 ? 'Zapnout zvuk' : 'Ztlumit zvuk'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer shrink-0"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-[var(--accent-light)]" />
            )}
          </button>
          <label htmlFor={volumeSliderId} className="sr-only">
            Hlasitost přehrávače
          </label>
          <input
            ref={sliderRef}
            id={volumeSliderId}
            type="range"
            min={0}
            max={100}
            step={1}
            value={isMuted ? 0 : volume}
            aria-valuetext={`${isMuted ? 0 : volume} %`}
            onChange={(e) => {
              const val = Number(e.target.value);
              setVolume(val);
              if (val > 0 && isMuted) setIsMuted(false);
            }}
            className="sheendle-slider max-w-[120px]"
          />
          <span className="text-[11px] font-mono text-slate-400 w-8 text-right shrink-0">
            {isMuted ? 0 : volume}%
          </span>
        </div>

        {/* Center: Main Play/Pause Button */}
        <div className="flex items-center justify-center gap-3 order-1 sm:order-2">
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={isPlaying ? 'Zastavit přehrávání' : 'Přehrát ukázku'}
            className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[var(--accent-from)] via-[var(--accent-via)] to-[var(--accent-to)] border border-[var(--accent-border-strong)] text-white shadow-lg animate-pulse-glow hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            {isBuffering && !isReady ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          {isGameOver && (
            <button
              type="button"
              onClick={handleReplayFromStart}
              title="Přehrát od začátku"
              aria-label="Přehrát ukázku od začátku"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-[var(--accent-surface-strong)] border border-white/10 hover:border-[var(--accent-border)] text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right: Skip Button */}
        <div className="flex items-center justify-center sm:justify-end w-full sm:w-auto order-3">
          {!isGameOver && (
            <button
              type="button"
              onClick={() => {
                if (isPlaying) {
                  stopPlaybackAtLimit(0);
                }
                onSkip();
              }}
              className="w-full sm:w-auto min-w-[11.5rem] flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-[var(--accent-surface-strong)] border border-white/15 hover:border-[var(--accent-border-strong)] text-xs sm:text-[13px] font-semibold text-slate-200 hover:text-white transition-all cursor-pointer whitespace-nowrap"
            >
              <FastForward className="w-4 h-4 text-[var(--accent-light)] shrink-0" />
              <span className="whitespace-nowrap tabular-nums">
                {skipBonusSeconds !== null
                  ? `Přeskočit (+${String(skipBonusSeconds).replace('.', ',')}\u00A0s)`
                  : 'Přeskočit (Odkrýt)'}
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
