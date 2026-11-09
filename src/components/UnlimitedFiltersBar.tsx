import React from 'react';
import { Check, SlidersHorizontal } from 'lucide-react';
import type { UnlimitedFilters } from '../types';

interface UnlimitedFiltersBarProps {
  filters: UnlimitedFilters;
  onChange: (key: keyof UnlimitedFilters) => void;
  categoryCounts: {
    buka: number;
    collabs: number;
    feats: number;
    solo: number;
  };
  totalActive: number;
}

interface CategoryOption {
  key: keyof UnlimitedFilters;
  label: string;
  subtitle: string;
  count: number;
  description: string;
}

export const UnlimitedFiltersBar: React.FC<UnlimitedFiltersBarProps> = ({
  filters,
  onChange,
  categoryCounts,
  totalActive,
}) => {
  const categories: CategoryOption[] = [
    {
      key: 'buka',
      label: 'BUKA',
      subtitle: 'Album & featy',
      count: categoryCounts.buka,
      description: 'Písničky a features interpreta BUKA / Lil Buca Near',
    },
    {
      key: 'collabs',
      label: 'COLLABY',
      subtitle: 'ROADTRIP & Asia',
      count: categoryCounts.collabs,
      description: 'Společná alba s jinými interprety (Calin, Renne Dang)',
    },
    {
      key: 'feats',
      label: 'FEATS',
      subtitle: 'Hostovačky',
      count: categoryCounts.feats,
      description: 'Písničky ostatních interpretů, kde hostuje Viktor nebo BUKA',
    },
  ];

  const allChecked = filters.buka && filters.collabs && filters.feats;
  const noneChecked = !filters.buka && !filters.collabs && !filters.feats;

  return (
    <div
      aria-label="Filtry nekonečného módu"
      className="w-full rounded-2xl bg-[#0d0f15]/85 border border-white/[0.08] p-3 sm:p-4 backdrop-blur-xl shadow-lg transition-all duration-300"
    >
      {/* Header with Title and Track Count */}
      <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Kategorie k procvičování
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {noneChecked
            ? `Pouze sólo alba (${totalActive} tracků)`
            : allChecked
              ? `Vše zahrnuto (${totalActive} tracků)`
              : `Aktivní: ${totalActive} tracků`}
        </span>
      </div>

      {/* 3 Interactive Toggle Filter Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {categories.map((cat) => {
          const isChecked = filters[cat.key];

          return (
            <button
              key={cat.key}
              type="button"
              role="checkbox"
              aria-checked={isChecked}
              aria-label={`${cat.label} - ${isChecked ? 'zahrnuto' : 'odškrtnuto'}`}
              title={cat.description}
              onClick={() => onChange(cat.key)}
              className={`group relative flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer select-none ${
                isChecked
                  ? 'bg-red-500/12 border-red-500/40 text-slate-100 shadow-[0_0_15px_rgba(239,68,68,0.12)] hover:bg-red-500/18 hover:border-red-500/60'
                  : 'bg-white/[0.02] border-white/[0.08] text-slate-400 opacity-60 hover:opacity-90 hover:border-white/20 hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-1">
                {/* Styled Checkbox Box */}
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                    isChecked
                      ? 'bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                      : 'border border-slate-600 bg-black/40 text-transparent'
                  }`}
                >
                  <Check
                    className={`w-3 h-3 stroke-[3] transition-transform ${
                      isChecked ? 'scale-100' : 'scale-0'
                    }`}
                  />
                </div>

                {/* Category Name & Subtitle */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-black tracking-wide ${
                        isChecked
                          ? 'text-red-200'
                          : 'text-slate-400 line-through decoration-slate-600'
                      }`}
                    >
                      {cat.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    {cat.subtitle}
                  </p>
                </div>
              </div>

              {/* Count Badge */}
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md shrink-0 ${
                  isChecked
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-white/[0.04] text-slate-500 border border-white/[0.06]'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Helper text explaining that unchecking keeps solo albums */}
      <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-500">
        <span>Odškrtnutím vyřadíš kategorii z hádání i vyhledávání</span>
        <span className="text-[10px] text-slate-400">
          Sólo alba: <strong className="text-slate-300 font-mono">{categoryCounts.solo}</strong>
        </span>
      </div>
    </div>
  );
};
