/**
 * Caricamento on-demand degli SVG delle icone lucide dal CDN jsDelivr.
 *
 * Motivo: evitare di impacchettare ~1900 icone (che genererebbe ~1900 file)
 * e non caricarle tutte in anticipo. Si scarica SOLO l'icona richiesta,
 * con cache in memoria.
 */

const CDN_BASE = "https://cdn.jsdelivr.net/npm/lucide-static@0.555.0/icons";
const TAGS_URL = "https://cdn.jsdelivr.net/npm/lucide-static@0.555.0/tags.json";

// name -> Promise<string|null>  (cache: una sola richiesta per icona)
const cache = new Map();

// Promise della mappa dei tag (name -> string[]) per la ricerca
let tagsPromise = null;

/**
 * Ripulisce l'SVG grezzo: rimuove il commento di licenza e la classe,
 * mantenendo stroke="currentColor" (eredita colore e scala via CSS).
 */
const normalizeSvg = (svg) =>
  svg
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\sclass="[^"]*"/, "")
    .trim();

/**
 * Ritorna l'SVG (stringa) di un'icona lucide, o null se non disponibile.
 * Le richieste sono cacheate: chiamate successive sono immediate.
 *
 * @param {string} name - nome kebab-case (es. "rocket")
 * @returns {Promise<string|null>}
 */
export const getIconSvg = (name) => {
  if (!name) return Promise.resolve(null);
  if (cache.has(name)) return cache.get(name);

  const promise = fetch(`${CDN_BASE}/${name}.svg`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then((text) => normalizeSvg(text))
    .catch(() => null); // non fatale: l'icona semplicemente non è disponibile

  cache.set(name, promise);
  return promise;
};

/**
 * Ritorna la mappa ufficiale dei tag delle icone lucide (name -> string[]),
 * usata per la ricerca tipo lucide.dev. Scaricata UNA SOLA VOLTA (cache).
 *
 * @returns {Promise<Object|null>}
 */
export const getTags = () => {
  if (!tagsPromise) {
    tagsPromise = fetch(TAGS_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .catch(() => {
        tagsPromise = null; // consente un nuovo tentativo in seguito
        return null;
      });
  }
  return tagsPromise;
};
