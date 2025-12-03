/**
 * Validazione per i gruppi
 */

/**
 * Valida il nome del gruppo
 * @param {string} name - Nome da validare
 * @returns {string|null} - Messaggio di errore o null se valido
 */
export const validateGroupName = (name) => {
  if (!name || !name.trim()) {
    return "Il nome del gruppo è obbligatorio";
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return "Il nome deve avere almeno 2 caratteri";
  }

  if (trimmedName.length > 50) {
    return "Il nome non può superare i 50 caratteri";
  }

  return null;
};

/**
 * Valida il codice del gruppo
 * @param {string} code - Codice da validare
 * @returns {string|null} - Messaggio di errore o null se valido
 */
export const validateGroupCode = (code) => {
  if (!code || !code.trim()) {
    return "Il codice è obbligatorio";
  }

  const trimmedCode = code.trim().toUpperCase();

  // Deve essere esattamente 8 caratteri alfanumerici
  if (!/^[A-Z0-9]{8}$/.test(trimmedCode)) {
    return "Il codice deve essere di 8 caratteri";
  }

  return null;
};
