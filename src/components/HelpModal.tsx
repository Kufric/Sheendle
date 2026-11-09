import React, { useEffect, useRef, useId } from 'react';
import { X, CircleHelp, Headphones, FastForward, Sparkles } from 'lucide-react';
import { ATTEMPT_DURATIONS } from '../utils/game';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
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
            <CircleHelp className="w-5 h-5" />
          </div>
          <h2 id={titleId} className="text-lg font-extrabold text-white">
            Jak hrát Sheendle
          </h2>
        </div>

        <form method="dialog">
          <button
            type="submit"
            autoFocus
            aria-label="Zavřít nápovědu"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <div className="flex items-start gap-3">
          <Headphones className="w-5 h-5 text-[var(--accent-light)] shrink-0 mt-0.5" />
          <p>
            Poslechni si krátkou ukázku písničky z diskografie{' '}
            <strong className="text-white">Viktora Sheena</strong> (včetně
            společných projektů jako <em>ROADTRIP</em> nebo <em>Projekt Asia</em>)
            a zkus ji uhodnout na co nejméně pokusů.
          </p>
        </div>

        <div className="flex items-start gap-3">
          <FastForward className="w-5 h-5 text-[var(--accent-bright)] shrink-0 mt-0.5" />
          <p>
            Každý špatný tip nebo kliknutí na{' '}
            <strong className="text-white">Přeskočit</strong> odemkne delší část
            zvukové ukázky. Celkem máš <strong className="text-white">6 pokusů</strong>:
          </p>
        </div>

        {/* 6 Intervals Pill Grid */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {ATTEMPT_DURATIONS.map((sec, idx) => (
            <div
              key={sec}
              className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 text-center"
            >
              <p className="text-[11px] text-slate-400">{idx + 1}. pokus</p>
              <p className="text-sm font-mono font-bold text-[var(--accent-light)]">
                {sec} s
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 pt-1">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="mb-1">
              <strong className="text-[#7fd4ea]">Denní výzva:</strong> Každý den o
              půlnoci se odemkne 1 společný track pro všechny hráče (tyrkysový režim).
            </p>
            <p>
              <strong className="text-red-400">Nekonečný mód:</strong> Hraj bez
              omezení náhodné tracky z celé diskografie pořád dokola (červený režim).
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/10">
        <form method="dialog">
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent-from)] via-[var(--accent-via)] to-[var(--accent-to)] hover:from-[var(--accent-hover-from)] hover:to-[var(--accent-hover-to)] border border-[var(--accent-border-strong)] text-white font-bold text-sm transition-all cursor-pointer"
          >
            Jdeme hrát!
          </button>
        </form>
      </div>
    </dialog>
  );
};
