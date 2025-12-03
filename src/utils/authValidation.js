// Firebase error codes to Italian messages
const errorMessages = {
  "auth/email-already-in-use": "Questa email è già registrata",
  "auth/invalid-email": "Email non valida",
  "auth/operation-not-allowed": "Operazione non consentita",
  "auth/weak-password": "La password è troppo debole",
  "auth/user-disabled": "Questo account è stato disabilitato",
  "auth/user-not-found": "Nessun account trovato con questa email",
  "auth/wrong-password": "Password errata",
  "auth/invalid-credential": "Credenziali non valide",
  "auth/too-many-requests": "Troppi tentativi. Riprova più tardi",
};

export const getAuthErrorMessage = (errorCode) => {
  return errorMessages[errorCode] || "Si è verificato un errore. Riprova.";
};

export const validateEmail = (email) => {
  if (!email.trim()) return "Inserisci la tua email";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return "Inserisci un'email valida";
  return null;
};

export const validateUsername = (username) => {
  if (!username.trim()) return "Inserisci un nome utente";
  if (username.trim().length < 3)
    return "Il nome utente deve avere almeno 3 caratteri";
  return null;
};

export const validatePassword = (password) => {
  if (!password) return "Inserisci la password";
  if (password.length < 6) return "La password deve avere almeno 6 caratteri";
  return null;
};
