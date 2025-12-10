# Scaletta

**Scaletta** è una piattaforma collaborativa per la gestione di gruppi di lavoro con struttura orizzontale.

## 🚀 Tecnologie

- **Frontend**: React 19 + Vite 7
- **Styling**: Tailwind CSS 4 con variabili CSS custom
- **Backend**: Firebase (Authentication + Firestore + Storage)
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
- Eliminazione gruppo (solo founder, elimina anche progetti e foto)
- Lista membri con identificazione founder (corona 👑)

### Progetti

- Creazione con colore automatico (evita duplicati)
- 12 colori disponibili
- 4 stati: In corso, Completato, Archiviato, Cestinato
- Ordinamento automatico per stato e data
- Eliminazione con pulizia automatica di contenuti e foto

### Bento Box (Contenuto Progetti)

- **Layout dinamico**: Griglia responsive 1-4 colonne
- **Algoritmo "shortest column first"**: Distribuzione ottimale
- **Animazioni FLIP**: Transizioni fluide
- **Sincronizzazione real-time**: Modifiche istantanee tra dispositivi
- **Sistema Pin**: Fissa i box importanti in alto
- **Auto-delete**: Box vuoti eliminati dopo 10 minuti
- **NoteBox**: Note testuali con editor
- **PhotoBox**: Carosello foto con upload multiplo e drag & drop
- **FileBox**: File di qualsiasi tipo (CAD, 3D, documenti, max 50MB)
- **CameraFab**: Scatta foto direttamente da mobile

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
│   ├── bento/       # Sistema Bento Box (NoteBox, PhotoBox, FileBox, ecc.)
│   ├── form/        # Componenti form
│   ├── groups/      # Sistema gruppi
│   ├── icons/       # Wrapper icone Lucide
│   ├── modal/       # Sistema modale (Modal, InputModal, UploadModal, FileUploadModal)
│   ├── profile/     # Profilo utente
│   ├── projects/    # Sistema progetti
│   ├── pwa/         # Installazione PWA
│   └── ui/          # Componenti UI base
├── contexts/        # React contexts (Auth, Modal, Theme)
├── hooks/           # Custom hooks (useBentoAnimation, useColumnCount, ecc.)
├── pages/           # Pagine app (Dashboard, ProjectPage, ecc.)
├── services/        # Firebase services (auth, groups, projects, photos, files)
└── utils/           # Utility functions (validation, colors, statuses)
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
