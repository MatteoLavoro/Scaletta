import { useEffect, useMemo, useRef, useState } from "react";
import {
  SearchIcon,
  CloseIcon,
  FileTextIcon,
  FileArchiveIcon,
  ImageIcon,
  ListChecksIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
} from "../icons";
import { searchBoxes, FIELD_LABELS } from "../../utils/boxSearch";

// Icona mostrata per ciascun tipo di campo/risultato
const FIELD_ICONS = {
  title: TagIcon,
  content: FileTextIcon,
  file: FileArchiveIcon,
  pdf: FileTextIcon,
  photo: ImageIcon,
  version: ClockIcon,
  checklist: ListChecksIcon,
  creator: UserIcon,
  date: ClockIcon,
};

/**
 * Evidenzia la porzione di testo che corrisponde alla query (stile pulito,
 * arrotondato e tenue).
 */
const renderSnippet = (snippet, query) => {
  if (!snippet || !query) return snippet;
  const idx = snippet.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return snippet;
  return (
    <>
      {snippet.slice(0, idx)}
      <span className="rounded-[4px] bg-primary/20 px-0.5 font-medium text-text-primary">
        {snippet.slice(idx, idx + query.length)}
      </span>
      {snippet.slice(idx + query.length)}
    </>
  );
};

/**
 * SearchBar - Pillola di ricerca che cerca tra i Bento Box di un progetto.
 *
 * Cerca in: titoli, contenuto delle note/markdown, nomi di file/PDF/foto,
 * contenuto delle versioni (controllo versione) e delle checklist.
 * Al click su un risultato invoca onSelect(boxId).
 *
 * @param {Array}    boxes        - lista di bento box del progetto
 * @param {function} onSelect     - callback(boxId) alla selezione di un risultato
 * @param {object}   projectColor - { bg, text } colore del progetto (per l'input)
 * @param {boolean}  [isMobile]   - se true, la pillola occupa tutta la larghezza
 * @param {string}   [className]  - classi extra sul contenitore
 */
const SearchBar = ({
  boxes = [],
  onSelect,
  onResultHover,
  projectColor,
  isMobile = false,
  className = "",
}) => {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Debounce dell'input
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 180);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo(
    () => (debounced.trim() ? searchBoxes(boxes, debounced) : []),
    [boxes, debounced],
  );

  // Chiudi il pannello dei risultati al click esterno
  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isOpen]);

  const clear = () => {
    setQuery("");
    setDebounced("");
    setIsOpen(false);
    onResultHover?.(null);
  };

  const handleSelect = (boxId) => {
    onSelect?.(boxId);
    clear();
  };

  const textColor = projectColor?.text || "#ffffff";
  const showDropdown = isOpen && debounced.trim().length > 0;

  return (
    <div
      ref={containerRef}
      className={`relative min-w-0 ${
        isMobile ? "w-full" : "flex-1 max-w-xl"
      } ${className}`}
    >
      {/* Pillola input (l'anello di focus avvolge icona + input + X) */}
      <div className="flex items-center gap-2 h-10 px-3 rounded-full bg-black/10 transition-shadow focus-within:ring-2 focus-within:ring-primary/40">
        <SearchIcon className="w-4 h-4 shrink-0" style={{ color: textColor }} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Cerca in titoli, note, file, versioni, checklist…"
          className="flex-1 min-w-0 bg-transparent text-sm [&::placeholder]:text-current [&::placeholder]:opacity-60"
          style={{ color: textColor, outline: "none" }}
          aria-label="Cerca nel progetto"
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full hover:bg-black/10 transition-colors"
            aria-label="Pulisci ricerca"
            style={{ color: textColor }}
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Pannello risultati */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-bg-secondary border border-border rounded-xl shadow-lg overflow-hidden animate-dropdown-in origin-top">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-text-muted">
              Nessun risultato per “{debounced.trim()}”.
            </p>
          ) : (
            <div
              className="max-h-[60vh] overflow-y-auto"
              onMouseLeave={() => onResultHover?.(null)}
            >
              {results.map((r) => {
                const FieldIcon = FIELD_ICONS[r.field] || FileTextIcon;
                return (
                  <button
                    key={`${r.boxId}-${r.field}`}
                    type="button"
                    onClick={() => handleSelect(r.boxId)}
                    onMouseEnter={() => onResultHover?.(r.boxId)}
                    onFocus={() => onResultHover?.(r.boxId)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-bg-tertiary transition-colors border-b border-border/40 last:border-b-0"
                  >
                    <FieldIcon className="w-4 h-4 shrink-0 text-text-muted" />
                    <span className="shrink-0 max-w-[38%] text-sm font-semibold text-text-primary truncate">
                      {r.title}
                    </span>
                    <span className="shrink-0 text-text-muted">|</span>
                    <span className="flex-1 min-w-0 text-xs text-text-secondary truncate">
                      {renderSnippet(r.snippet, debounced.trim())}
                    </span>
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                      {FIELD_LABELS[r.field] || r.field}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
