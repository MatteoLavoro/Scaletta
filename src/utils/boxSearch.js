/**
 * Ricerca testuale tra i Bento Box di un progetto.
 *
 * Campi cercati (come da specifica):
 *  - titolo di ogni box
 *  - contenuto delle note (note semplici e markdown)
 *  - nome dei file (file generici, PDF, foto)
 *  - contenuto delle note in controllo versione (nome + descrizione)
 *  - contenuto delle checklist
 */

// Etichette leggibili per il campo in cui è avvenuto il match
export const FIELD_LABELS = {
  title: "Titolo",
  content: "Nota",
  file: "File",
  pdf: "PDF",
  photo: "Foto",
  version: "Versione",
  checklist: "Checklist",
  creator: "Creato da",
  date: "Data",
};

const normalize = (s) => (s == null ? "" : String(s)).toLowerCase();

/** Formatta un Timestamp/Date in gg/mm/aaaa (stringa vuota se assente). */
const formatDate = (ts) => {
  if (!ts) return "";
  let d;
  if (typeof ts?.toDate === "function") d = ts.toDate();
  else if (ts instanceof Date) d = ts;
  else d = new Date(ts);
  if (!d || Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
};

/**
 * Estrae i campi ricercabili di un box.
 * @returns {{ field: string, text: string }[]}
 */
export const getBoxSearchFields = (box) => {
  const fields = [];
  if (box?.title) fields.push({ field: "title", text: box.title });

  if (typeof box?.content === "string" && box.content.trim()) {
    fields.push({ field: "content", text: box.content });
  }

  (box?.files || []).forEach((f) => {
    if (f?.name) fields.push({ field: "file", text: f.name });
  });
  (box?.pdfs || []).forEach((p) => {
    if (p?.name) fields.push({ field: "pdf", text: p.name });
  });
  (box?.photos || []).forEach((p) => {
    if (p?.name) fields.push({ field: "photo", text: p.name });
  });
  (box?.versions || []).forEach((v) => {
    if (v?.name) fields.push({ field: "version", text: v.name });
    if (v?.description) fields.push({ field: "version", text: v.description });
  });
  (box?.checklistItems || []).forEach((i) => {
    if (i?.text) fields.push({ field: "checklist", text: i.text });
  });

  // Metadati della card: creatore e data di creazione
  if (box?.createdByName) {
    fields.push({ field: "creator", text: box.createdByName });
  }
  const dateStr = formatDate(box?.createdAt);
  if (dateStr) fields.push({ field: "date", text: dateStr });

  return fields;
};

/** Ritaglia uno snippet attorno alla posizione del match. */
const makeSnippet = (text, index, length, radius = 45) => {
  const flat = text.replace(/\s+/g, " ").trim();
  // indice approssimato sullo stringa "flat" (il trimming può spostare di poco)
  const start = Math.max(0, index - radius);
  const end = Math.min(flat.length, index + length + radius);
  let s = flat.slice(start, end);
  if (start > 0) s = "… " + s;
  if (end < flat.length) s = s + " …";
  return s;
};

/**
 * Cerca tra i box e ritorna i match (uno per campo che matcha).
 *
 * @param {Array} boxes - lista di bento box
 * @param {string} query - testo cercato
 * @param {number} [limit=40] - numero massimo di risultati
 * @returns {{ boxId, boxType, title, field, snippet, query }[]}
 */
export const searchBoxes = (boxes, query, limit = 40) => {
  const q = normalize(query).trim();
  if (!q) return [];

  const results = [];
  for (const box of boxes) {
    const fields = getBoxSearchFields(box);
    // Un solo risultato per box: preferisci il match sul titolo, poi il primo
    let best = null;
    for (const f of fields) {
      const idx = normalize(f.text).indexOf(q);
      if (idx === -1) continue;
      const candidate = {
        boxId: box.id,
        boxType: box.boxType,
        title: box.title || "Senza titolo",
        field: f.field,
        snippet: makeSnippet(f.text, idx, q.length),
        query: q,
      };
      if (f.field === "title") {
        best = candidate;
        break;
      }
      if (!best) best = candidate;
    }
    if (best) results.push(best);
    if (results.length >= limit) break;
  }
  return results;
};
