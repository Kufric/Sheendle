import React, { useEffect, useRef, useId } from 'react';
import { X, ShieldAlert, Music, Mail, Cookie, Heart } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
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
      aria-labelledby={titleId}
      className="m-auto p-0 bg-transparent text-slate-100 max-w-lg w-[calc(100%-2rem)] rounded-2xl shadow-2xl overflow-hidden focus:outline-none"
    >
      <div className="bg-[#0e1017] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-5 max-h-[85vh] overflow-y-auto sheendle-scroll">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--accent-surface-strong)] text-[var(--accent-light)] border border-[var(--accent-border)]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 id={titleId} className="text-lg font-bold text-white leading-tight">
                O projektu & Právní informace
              </h2>
              <p className="text-xs text-slate-400">
                Transparentní informace o hře Sheendle
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zavřít"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Section 1: Fan project disclaimer */}
          <section className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Heart className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Neoficiální fanouškovský projekt</span>
            </div>
            <p className="text-xs text-slate-300">
              Sheendle je nekomerční fanouškovská hra vytvořená pro radost komunity a fanoušků české rapové scény. Tento projekt <strong>není žádným způsobem spojen, schválen, sponzorován ani provozován</strong> Viktorem Sheenem, hudebním labelem MIKE ROFT Records, ani žádnými jejich partnery či zástupci.
            </p>
          </section>

          {/* Section 2: Music Copyright & Source */}
          <section className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Music className="w-4 h-4 text-[var(--accent-light)] shrink-0" />
              <span>Autorská práva k hudbě & zdroj dat</span>
            </div>
            <p className="text-xs text-slate-300">
              Veškerá práva k hudbě, textům, zvukovým nahrávkám a obalům alb náleží jejich autorům a příslušným držitelům práv. Tento web na svých serverech <strong>neukládá ani nehostuje žádné audio soubory</strong> — krátké hudební ukázky (30 s) a obaly alb jsou načítány z oficiálního veřejného API služby Apple Music v souladu s jejich podmínkami pro vývojáře.
            </p>
          </section>

          {/* Section 3: Notice & Takedown */}
          <section className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-emerald-300">
              <Mail className="w-4 h-4 shrink-0" />
              <span>Kontakt a odstranění obsahu (Notice & Takedown)</span>
            </div>
            <p className="text-xs text-emerald-100/90">
              Pokud jste autorem či vlastníkem autorských práv k jakémukoliv obsahu použitému v této hře a přejete si jej upravit nebo odstranit, kontaktujte mne prosím na{' '}
              <a
                href="mailto:kufriccz@gmail.com"
                className="font-semibold text-white underline underline-offset-2 hover:text-emerald-200"
              >
                kufriccz@gmail.com
              </a>{' '}
              a žádosti neprodleně vyhovím.
            </p>
          </section>

          {/* Section 4: GDPR & Privacy */}
          <section className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Cookie className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Ochrana soukromí a cookies</span>
            </div>
            <p className="text-xs text-slate-300">
              Tento web neshromažďuje žádné osobní údaje, nevyžaduje registraci ani nepoužívá sledovací nebo marketingové cookies. Herní postup a statistiky jsou ukládány <strong>výhradně lokálně ve vašem prohlížeči</strong> (<code className="text-slate-200 bg-white/10 px-1 py-0.5 rounded text-[11px]">localStorage</code>).
            </p>
          </section>

          {/* Section 5: Non-commercial */}
          <p className="text-center text-xs text-slate-500 pt-1">
            Hra je 100% bezplatná, nezisková a neobsahuje žádné reklamy ani monetizaci.
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white font-medium text-sm transition-colors border border-white/10 cursor-pointer"
        >
          Rozumím
        </button>
      </div>
    </dialog>
  );
};
