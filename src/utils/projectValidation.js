/**
 * Validazione per i progetti
 */

/**
 * Valida il nome del progetto
 * @param {string} name - Nome da validare
 * @returns {string|null} - Messaggio di errore o null se valido
 */
export const validateProjectName = (name) => {
  if (!name || !name.trim()) {
    return "Il nome del progetto è obbligatorio";
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
