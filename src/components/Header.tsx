import React from 'react';
import { BarChart3, CircleHelp, Calendar, Infinity as InfinityIcon, Disc3, CheckCircle2 } from 'lucide-react';
import type { GameMode } from '../types';

interface HeaderProps {
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  dateLabel: string;
  dailyCompleted: boolean;
  onOpenStats: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  dateLabel,
  dailyCompleted,
  onOpenStats,
  onOpenHelp,
}) => {
  return (
    <header className="w-full border-b border-white/10 bg-[#08090c]/85 backdrop-blur-xl sticky top-0 z-30">
      <div className="max-w-3xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand Title */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-from)] to-[var(--accent-to)] border border-[var(--accent-border-strong)] shadow-[0_0_20px_var(--accent-glow)] transition-all duration-500">
              <Disc3 className="w-5 h-5 text-[var(--accent-pale)] animate-[spin_10s_linear_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-[var(--accent-pale)] to-[var(--accent-bright)] bg-clip-text text-transparent transition-all duration-500">
                  SHEENDLE
                </h1>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent-surface-strong)] text-[var(--accent-pale)] border border-[var(--accent-border)] transition-all duration-500">
                  {mode === 'daily' ? 'CZ' : '∞'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-none mt-0.5">
                Poznej track Viktora Sheena podle zvuku
              </p>
            </div>
          </div>

          {/* Mobile utility buttons */}
          <div className="flex items-center gap-1.5 sm:hidden">
            <button
              type="button"
              onClick={onOpenStats}
              aria-label="Zobrazit statistiky"
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-[var(--accent-surface-strong)] text-slate-300 hover:text-white border border-white/10 hover:border-[var(--accent-border)] transition-colors cursor-pointer"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onOpenHelp}
              aria-label="Jak hrát"
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-[var(--accent-surface-strong)] text-slate-300 hover:text-white border border-white/10 hover:border-[var(--accent-border)] transition-colors cursor-pointer"
            >
              <CircleHelp className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Switcher & Desktop Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
          <div
            role="tablist"
            aria-label="Herní režim"
            className="grid grid-cols-2 w-full sm:w-auto p-1 rounded-xl bg-white/[0.04] border border-white/10"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'daily'}
              onClick={() => onModeChange('daily')}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                mode === 'daily'
                  ? 'bg-gradient-to-r from-[#164758] via-[#205060] to-[#297a94] text-white border border-[#3ca3c2]/50 shadow-[0_0_16px_rgba(41,122,148,0.5)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>Denní ({dateLabel})</span>
              {dailyCompleted && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              )}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={mode === 'unlimited'}
              onClick={() => onModeChange('unlimited')}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                mode === 'unlimited'
                  ? 'bg-gradient-to-r from-[#6b141a] via-[#991b1b] to-[#dc2626] text-white border border-red-400/50 shadow-[0_0_16px_rgba(220,38,38,0.5)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <InfinityIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Nekonečný mód</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenStats}
              title="Statistiky"
              aria-label="Zobrazit statistiky"
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-[var(--accent-surface-strong)] text-slate-300 hover:text-white border border-white/10 hover:border-[var(--accent-border)] transition-all cursor-pointer"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onOpenHelp}
              title="Jak hrát"
              aria-label="Jak hrát"
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-[var(--accent-surface-strong)] text-slate-300 hover:text-white border border-white/10 hover:border-[var(--accent-border)] transition-all cursor-pointer"
            >
              <CircleHelp className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
