import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon, CloseIcon } from "../icons";
import { PROJECT_ICONS } from "../../utils/projectIcons";
import { PROJECT_ICON_NAMES } from "../../utils/projectIconNames";
import { getTags } from "../../utils/lucideCdn";
import ProjectIcon from "./ProjectIcon";

// Parole chiave italiane per le icone "preferite" (ricerca in italiano)
const FAVORITE_KEYWORDS = new Map(PROJECT_ICONS.map((e) => [e.key, e.k]));
const FAVORITE_KEYS = PROJECT_ICONS.map((e) => e.key);

/**
 * IconPicker - Menù a tendina per scegliere (e cercare) l'icona di un progetto.
 *
 * Vista iniziale: icone preferite (incluse nel bundle, istantanee).
 * Ricerca: su TUTTE le icone lucide (~1900); l'SVG viene scaricato on-demand
 * dal CDN solo per le icone mostrate (vedi ProjectIcon).
 *
 * @param {string}   value        - chiave icona corrente
 * @param {function} onChange     - callback(chiave) alla selezione
 * @param {string}   [buttonColor]- colore dell'icona nel trigger
 * @param {ReactNode}[trigger]    - contenuto custom del trigger (default: icona corrente)
 * @param {string}   [ariaLabel]
 */
const IconPicker = ({
  value,
  onChange,
  buttonColor,
  trigger,
  ariaLabel = "Scegli icona progetto",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  // Chiudi al click esterno
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

  // Tag ufficiali lucide (name -> string[]), caricati una volta all'apertura
  const [tags, setTags] = useState(null);

  useEffect(() => {
    if (!isOpen || tags) return;
    let alive = true;
    getTags().then((t) => {
      if (alive && t) setTags(t);
    });
    return () => {
      alive = false;
    };
  }, [isOpen, tags]);

  // Indice di ricerca precalcolato (nome + tag + parole chiave IT).
  // Si costruisce una sola volta per set di tag → filtro velocissimo.
  const searchIndex = useMemo(
    () =>
      PROJECT_ICON_NAMES.map((name) => ({
        name,
        hay: `${name.replace(/-/g, " ")} ${(tags?.[name] || []).join(" ")} ${
          FAVORITE_KEYWORDS.get(name) || ""
        }`,
      })),
    [tags],
  );

  // L'input usa `query` (aggiornato subito) mentre il filtro usa un valore
  // DIFFERITO: la digitazione resta fluida anche filtrando molte icone.
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase().replace(/\s+/g, " ");
    if (!q) return FAVORITE_KEYS;

    const terms = q.split(" ");
    const out = [];
    for (const entry of searchIndex) {
      let match = true;
      for (const t of terms) {
        if (!entry.hay.includes(t)) {
          match = false;
          break;
        }
      }
      if (match) out.push(entry.name);
    }
    return out;
  }, [deferredQuery, searchIndex]);

  const select = (name) => {
    onChange?.(name);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center justify-center w-full h-full rounded-full hover:bg-black/10 active:bg-black/20 transition-colors"
        style={{ color: buttonColor }}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {trigger || <ProjectIcon name={value} className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-50 w-80 max-w-[calc(100vw-1rem)] bg-bg-secondary border border-border rounded-xl shadow-lg overflow-hidden animate-dropdown-in origin-top-left">
          {/* Barra di ricerca */}
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 h-10 px-3 rounded-full bg-bg-tertiary transition-shadow focus-within:ring-2 focus-within:ring-primary/40">
              <SearchIcon className="w-4 h-4 text-text-muted shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cerca tra tutte le icone…"
                className="flex-1 min-w-0 bg-transparent text-sm text-text-primary [&::placeholder]:text-text-muted"
                style={{ outline: "none" }}
                aria-label="Cerca icona"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-text-muted hover:bg-divider transition-colors"
                  aria-label="Pulisci ricerca"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Griglia icone */}
          <div className="max-h-72 overflow-y-auto p-2 grid grid-cols-8 gap-1">
            {results.length === 0 ? (
              <p className="col-span-8 text-center text-xs text-text-muted py-4">
                Nessuna icona trovata
              </p>
            ) : (
              results.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => select(name)}
                  className={`aspect-square flex items-center justify-center rounded-lg transition-colors ${
                    value === name
                      ? "bg-primary/15 ring-1 ring-primary"
                      : "hover:bg-bg-tertiary"
                  }`}
                  title={name}
                  aria-label={name}
                >
                  <ProjectIcon
                    name={name}
                    className="w-5 h-5 text-text-primary"
                  />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default IconPicker;

