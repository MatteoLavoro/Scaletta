# Scaletta

**Scaletta** è una piattaforma collaborativa per la gestione di gruppi di lavoro con struttura orizzontale.

## 🚀 Tecnologie

- **Frontend**: React 19 + Vite 7
- **Styling**: Tailwind CSS 4 con variabili CSS custom
- **Backend**: Firebase (Authentication + Firestore)
- **Icone**: Lucide React
- **PWA**: Service Worker per installazione

## ✨ Funzionalità Implementate

### Autenticazione

- Registrazione con email/password
- Login
- Logout
- Modifica nome utente

### Gruppi

- Creazione gruppo con codice univoco (8 caratteri alfanumerici)
- Partecipazione tramite codice
- Modifica nome gruppo
- Uscita dal gruppo
- Eliminazione gruppo (solo founder)
- Lista membri con identificazione founder (corona 👑)

### Personalizzazione

- Tema chiaro/scuro
- 6 colori accent: Teal, Blue, Purple, Red, Orange, Green
- Preferenze salvate in localStorage

### PWA

- Installabile su dispositivi
- Service Worker per caching
- Manifest con icone

## 🛠️ Sviluppo

```bash
# Installa dipendenze
npm install

# Avvia dev server
npm run dev

# Build produzione
npm run build

# Deploy su Firebase
firebase deploy
```

## 📁 Struttura Progetto

```
src/
├── components/
│   ├── auth/        # Autenticazione
│   ├── form/        # Componenti form
│   ├── groups/      # Sistema gruppi
│   ├── modal/       # Sistema modale
│   ├── profile/     # Profilo utente
│   ├── pwa/         # Installazione PWA
│   └── ui/          # Componenti UI base
├── contexts/        # React contexts
├── hooks/           # Custom hooks
├── pages/           # Pagine app
├── services/        # Firebase services
└── utils/           # Utility functions
```

## 📚 Documentazione

- [PROGETTO.md](./PROGETTO.md) - Documentazione completa del progetto
- [UI_DESIGN.md](./UI_DESIGN.md) - Specifiche UI/UX
- [src/STRUTTURA.md](./src/STRUTTURA.md) - Struttura codice sorgente

## 🔗 Link Utili

- [Firebase Console](https://console.firebase.google.com/project/scaletta-1)
- [Vite Documentation](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
