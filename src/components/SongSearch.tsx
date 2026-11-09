import React, { useState, useMemo, useRef, useEffect, useId } from 'react';
import { Search, Send, X, Check } from 'lucide-react';
import type { Song } from '../types';
import { removeDiacritics } from '../utils/game';

interface SongSearchProps {
  songs: Song[];
  guessedSongIds: Set<number>;
  disabled: boolean;
  onSubmitGuess: (song: Song) => void;
}

export const SongSearch: React.FC<SongSearchProps> = ({
  songs,
  guessedSongIds,
  disabled,
  onSubmitGuess,
}) => {
  const inputId = useId();
  const listboxId = useId();

  const [query, setQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  // Filter tracks accent-insensitively by song title, album name, or artist
  const filteredSongs = useMemo(() => {
    const normalizedQuery = removeDiacritics(query);
    if (!normalizedQuery) {
      return songs.slice(0, 30);
    }

    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

    return songs
      .filter((song) => {
        const searchable = removeDiacritics(
          `${song.title} ${song.album} ${song.artist}`
        );
        return tokens.every((token) => searchable.includes(token));
      })
      .sort((a, b) => {
        const aTitle = removeDiacritics(a.title);
        const bTitle = removeDiacritics(b.title);
        const aStarts = aTitle.startsWith(normalizedQuery);
        const bStarts = bTitle.startsWith(normalizedQuery);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.title.localeCompare(b.title, 'cs');
      })
      .slice(0, 35);
  }, [songs, query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll active item into view when navigating with arrow keys
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const activeEl = listRef.current.children[activeIndex] as
      | HTMLElement
      | undefined;
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex, isOpen]);

  const handleSelectSong = (song: Song, submitImmediately = false) => {
    if (guessedSongIds.has(song.id)) return;
    if (submitImmediately) {
      onSubmitGuess(song);
      setQuery('');
      setSelectedSong(null);
      setIsOpen(false);
      return;
    }
    setSelectedSong(song);
    setQuery(song.title);
    setIsOpen(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    if (selectedSong && !guessedSongIds.has(selectedSong.id)) {
      onSubmitGuess(selectedSong);
      setQuery('');
      setSelectedSong(null);
      setIsOpen(false);
      return;
    }

    const candidate =
      filteredSongs[activeIndex] &&
      !guessedSongIds.has(filteredSongs[activeIndex].id)
        ? filteredSongs[activeIndex]
        : filteredSongs.find((s) => !guessedSongIds.has(s.id));

    if (candidate && query.trim().length > 0) {
      onSubmitGuess(candidate);
      setQuery('');
      setSelectedSong(null);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(0);
      } else if (filteredSongs.length > 0) {
        setActiveIndex((prev) => (prev + 1) % filteredSongs.length);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(Math.max(0, filteredSongs.length - 1));
      } else if (filteredSongs.length > 0) {
        setActiveIndex(
          (prev) => (prev - 1 + filteredSongs.length) % filteredSongs.length
        );
      }
      return;
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    // IME-safe Enter handling (modern-web-guidance: ime-safe-enter-submit)
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.nativeEvent.isComposing || e.keyCode === 229) {
        return;
      }

      if (selectedSong && !guessedSongIds.has(selectedSong.id) && !isOpen) {
        onSubmitGuess(selectedSong);
        setQuery('');
        setSelectedSong(null);
        setIsOpen(false);
        return;
      }

      const highlighted = filteredSongs[activeIndex];
      if (highlighted && !guessedSongIds.has(highlighted.id)) {
        onSubmitGuess(highlighted);
        setQuery('');
        setSelectedSong(null);
        setIsOpen(false);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full z-20">
      <form onSubmit={handleFormSubmit} className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <label htmlFor={inputId} className="sr-only">
            Vyhledej písničku nebo album Viktora Sheena
          </label>
          <Search className="w-4 h-4 text-[var(--accent-light)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            disabled={disabled}
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedSong(null);
              setIsOpen(true);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Zadej název tracku nebo alba (např. Černobílej svět, Safír...)"
            autoComplete="off"
            className="w-full pl-10 pr-9 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] focus:bg-[#11131a] border border-white/15 focus:border-[var(--accent-bright)] text-sm text-white placeholder:text-slate-500 outline-none transition-all shadow-inner disabled:opacity-50"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedSong(null);
                setIsOpen(true);
                setActiveIndex(0);
                inputRef.current?.focus();
              }}
              aria-label="Vymazat hledání"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={
            disabled ||
            (!selectedSong && (!query.trim() || filteredSongs.length === 0))
          }
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-from)] via-[var(--accent-via)] to-[var(--accent-to)] hover:from-[var(--accent-hover-from)] hover:to-[var(--accent-hover-to)] border border-[var(--accent-border-strong)] disabled:from-zinc-900 disabled:to-zinc-900 disabled:border-white/10 disabled:text-slate-600 text-white text-sm font-semibold shadow-[0_0_20px_var(--accent-glow)] disabled:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          <Send className="w-4 h-4" />
          <span>Hádat</span>
        </button>
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && !disabled && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Návrhy písniček"
          className="sheendle-scroll absolute left-0 right-0 mt-2 max-h-72 overflow-y-auto rounded-2xl bg-[#0e1017]/95 backdrop-blur-2xl border border-[var(--accent-border)] shadow-[0_16px_48px_rgba(0,0,0,0.85)] divide-y divide-white/[0.06]"
        >
          {filteredSongs.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-slate-400">
              Žádný track neodpovídá hledání „{query}“
            </li>
          ) : (
            filteredSongs.map((song, idx) => {
              const alreadyGuessed = guessedSongIds.has(song.id);
              const isHighlighted = idx === activeIndex;
              const isSelected = selectedSong?.id === song.id;

              return (
                <li
                  key={song.id}
                  role="option"
                  aria-selected={isHighlighted}
                  aria-disabled={alreadyGuessed}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    if (!alreadyGuessed) {
                      handleSelectSong(song, false);
                    }
                  }}
                  onDoubleClick={() => {
                    if (!alreadyGuessed) {
                      handleSelectSong(song, true);
                    }
                  }}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 transition-colors ${
                    alreadyGuessed
                      ? 'opacity-45 cursor-not-allowed bg-white/[0.01]'
                      : isHighlighted
                        ? 'bg-[var(--accent-surface-strong)] cursor-pointer'
                        : 'hover:bg-white/[0.05] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={song.artworkUrl}
                      alt={song.album}
                      loading="lazy"
                      className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {song.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {song.album} • {song.releaseYear}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {alreadyGuessed ? (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/10 text-slate-400">
                        Již tipováno
                      </span>
                    ) : isSelected ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-[var(--accent-pale)] bg-[var(--accent-surface-strong)] px-2 py-1 rounded-lg border border-[var(--accent-border-strong)]">
                        <Check className="w-3.5 h-3.5" />
                        Vybráno
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectSong(song, true);
                        }}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[var(--accent-surface)] hover:bg-[var(--accent-to)] text-[var(--accent-pale)] hover:text-white border border-[var(--accent-border)] transition-colors cursor-pointer"
                      >
                        Tipnout
                      </button>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
};
