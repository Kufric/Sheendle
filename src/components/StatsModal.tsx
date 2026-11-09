import React, { useEffect, useRef, useId } from 'react';
import { X, BarChart3, Flame, Trophy, Percent, Hash } from 'lucide-react';
import type { StatsData } from '../types';
import { ATTEMPT_DURATIONS } from '../utils/game';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: StatsData;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Fallback for browsers without native closedby="any" support (modern-web-guidance: light-dismiss-a-dialog)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onClose();
    };

    dialog.addEventListener('close', handleClose);

    let handleBackdropClick: ((e: MouseEvent) => void) | undefined;
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      handleBackdropClick = (event: MouseEvent) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (!isDialogContent) {
          dialog.close();
        }
      };
      dialog.addEventListener('click', handleBackdropClick);
    }

    return () => {
      dialog.removeEventListener('close', handleClose);
      if (handleBackdropClick) {
        dialog.removeEventListener('click', handleBackdropClick);
      }
    };
  }, [onClose]);

  const totalPlayed = stats.gamesPlayed + stats.unlimitedPlayed;
  const totalWon = stats.gamesWon + stats.unlimitedWon;
  const winRate =
    totalPlayed > 0 ? Math.round((totalWon / totalPlayed) * 100) : 0;

  const maxDistributionVal = Math.max(1, ...stats.guessDistribution);

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
      aria-labelledby={titleId}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-[#0e1017] text-slate-100 border border-white/15 p-6 shadow-[0_24px_64px_rgba(0,0,0,0.9)] outline-none"
    >
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[var(--accent-surface-strong)] text-[var(--accent-light)] border border-[var(--accent-border)]">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h2 id={titleId} className="text-lg font-extrabold text-white">
            Tvoje statistiky
          </h2>
        </div>

        <form method="dialog">
          <button
            type="submit"
            autoFocus
            aria-label="Zavřít statistiky"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Top KPI Grid */}
      <div className="grid grid-cols-4 gap-2.5 mb-6">
        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 text-center">
          <Hash className="w-4 h-4 text-[var(--accent-light)] mx-auto mb-1" />
          <p className="text-xl font-black text-white">{totalPlayed}</p>
          <p className="text-[11px] text-slate-400">Odehráno</p>
        </div>

        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 text-center">
          <Percent className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <p className="text-xl font-black text-white">{winRate}%</p>
          <p className="text-[11px] text-slate-400">Úspěšnost</p>
        </div>

        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 text-center">
          <Flame className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <p className="text-xl font-black text-white">
            {Math.max(stats.currentStreak, stats.unlimitedStreak)}
          </p>
          <p className="text-[11px] text-slate-400">Akt. série</p>
        </div>

        <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 text-center">
          <Trophy className="w-4 h-4 text-[var(--accent-bright)] mx-auto mb-1" />
          <p className="text-xl font-black text-white">
            {Math.max(stats.maxStreak, stats.unlimitedMaxStreak)}
          </p>
          <p className="text-[11px] text-slate-400">Max série</p>
        </div>
      </div>

      {/* Mode Breakdown */}
      <div className="grid grid-cols-2 gap-2.5 mb-6 text-xs">
        <div className="rounded-xl bg-[#164758]/30 border border-[#3ca3c2]/35 p-3">
          <p className="font-bold text-[#7fd4ea] mb-1">Denní výzva</p>
          <p className="text-slate-300">
            Výhry: <strong className="text-white">{stats.gamesWon}</strong> /{' '}
            {stats.gamesPlayed}
          </p>
          <p className="text-slate-300">
            Série: <strong className="text-white">{stats.currentStreak}</strong>{' '}
            (max {stats.maxStreak})
          </p>
        </div>

        <div className="rounded-xl bg-red-950/35 border border-red-500/35 p-3">
          <p className="font-bold text-red-300 mb-1">Nekonečný mód</p>
          <p className="text-slate-300">
            Výhry: <strong className="text-white">{stats.unlimitedWon}</strong> /{' '}
            {stats.unlimitedPlayed}
          </p>
          <p className="text-slate-300">
            Série:{' '}
            <strong className="text-white">{stats.unlimitedStreak}</strong> (max{' '}
            {stats.unlimitedMaxStreak})
          </p>
        </div>
      </div>

      {/* Guess Distribution Bar Chart */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Rozložení uhodnutých pokusů (1–6)
        </h3>
        <div className="space-y-2">
          {stats.guessDistribution.map((count, idx) => {
            const widthPct = Math.max(8, Math.round((count / maxDistributionVal) * 100));
            return (
              <div key={idx} className="flex items-center gap-2.5 text-xs">
                <span className="w-14 font-mono text-slate-400 shrink-0">
                  {idx + 1}. ({ATTEMPT_DURATIONS[idx]}s)
                </span>
                <div className="flex-1 bg-white/[0.04] rounded-lg overflow-hidden h-6 p-0.5 border border-white/5">
                  <div
                    style={{ width: `${widthPct}%` }}
                    className={`h-full rounded-md flex items-center justify-end px-2 font-mono font-bold text-xs transition-all duration-500 ${
                      count > 0
                        ? 'bg-gradient-to-r from-[var(--accent-from)] via-[var(--accent-to)] to-[var(--accent-bright)] text-white'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </dialog>
  );
};
