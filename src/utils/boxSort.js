/**
 * Ordinamento dei Bento Box di un progetto.
 *
 * La modalità "standard" non riordina: lascia l'ordine manuale dell'utente
 * (pinnati → sortOrder → createdAt), già applicato a monte.
 */

// Opzioni mostrate nel menù di ordinamento
export const BOX_SORT_OPTIONS = [
  { id: "standard", label: "Standard (il mio ordine)" },
  { id: "created-desc", label: "Cronologico (recenti prima)" },
  { id: "type", label: "Per tipo" },
  { id: "updated-desc", label: "Per ultima modifica" },
  { id: "alpha", label: "Alfabetico (A → Z)" },
];

// Ordine canonico dei tipi di box per la modalità "Per tipo"
export const BOX_TYPE_ORDER = [
  "note",
  "markdown",
  "photo",
  "pdf",
  "file",
  "checklist",
  "anagrafica",
  "version",
];

/** Converte un Timestamp/Date/stringa in millisecondi (0 se assente). */
const getTime = (value) => {
  if (!value) return 0;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
};

export const DEFAULT_BOX_SORT = "standard";

/**
 * Restituisce una nuova lista ordinata secondo la modalità richiesta.
 * Non gestisce i pinnati: quelli restano in testa, gestiti dal chiamante.
 *
 * @param {Array} boxes - box non-pinnati
 * @param {string} mode - id modalità (vedi BOX_SORT_OPTIONS)
 * @returns {Array} nuova lista ordinata
 */
export const sortBoxes = (boxes, mode) => {
  const arr = [...boxes];
  switch (mode) {
    case "created-desc":
      return arr.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));

    case "updated-desc":
      return arr.sort(
        (a, b) =>
          getTime(b.updatedAt ?? b.createdAt) -
          getTime(a.updatedAt ?? a.createdAt),
      );

    case "type":
      return arr.sort((a, b) => {
        const ia = BOX_TYPE_ORDER.indexOf(a.boxType);
        const ib = BOX_TYPE_ORDER.indexOf(b.boxType);
        const ra = ia === -1 ? BOX_TYPE_ORDER.length : ia;
        const rb = ib === -1 ? BOX_TYPE_ORDER.length : ib;
        if (ra !== rb) return ra - rb;
        return getTime(a.createdAt) - getTime(b.createdAt);
      });

    case "alpha":
      return arr.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "", "it", {
          sensitivity: "base",
          numeric: true,
        }),
      );

    case "standard":
    default:
      return arr;
  }
};
