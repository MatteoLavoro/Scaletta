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
- **NoteBox**: Note testuali con editor
- **PhotoBox**: Carosello foto con upload multiplo e drag & drop

### Personalizzazione

- Tema chiaro/scuro
- 6 colori accent: Teal, Blue, Purple, Red, Orange, Green
- Preferenze salvate in localStorage

### PWA

- Installabile su dispositivi
- Service Worker per caching
- Manifest con icone

## 🛠️ Sviluppo

### Prerequisiti

- Node.js 18+
- npm 8+
- Account Firebase (per backend)

### Setup Locale

```bash
# Clona repository
git clone <url>
cd scaletta

# Installa dipendenze
npm install

# Configura Firebase
# 1. Crea progetto su console.firebase.google.com
# 2. Abilita Authentication (Email/Password)
# 3. Abilita Firestore Database
# 4. Abilita Storage
# 5. Copia configurazione in src/services/config.js

# Avvia dev server
npm run dev
# Server disponibile su http://localhost:5173
```

### Comandi Disponibili

```bash
# Sviluppo
npm run dev          # Avvia Vite dev server con HMR

# Build
npm run build        # Build produzione (output: dist/)
npm run preview      # Preview build locale

# Qualità codice
npm run lint         # ESLint check

# Deploy
firebase login       # Login Firebase CLI (una volta)
firebase deploy      # Deploy su Firebase Hosting
```

### Build Ottimizzato

Il progetto usa **code splitting** per ottimizzare i tempi di caricamento:

- `vendor-react`: React core
- `vendor-firebase-*`: Firebase SDK diviso in 3 chunk
- `vendor-pdf`: react-pdf e pdfjs-dist
- `vendor-icons`: lucide-react

Risultato: caricamento iniziale più veloce + caching efficiente.

## 📁 Struttura Progetto

```
src/
├── components/
│   ├── auth/        # Autenticazione (AuthModal)
│   ├── bento/       # Sistema Bento Box (NoteBox, PhotoBox, PdfBox, FileBox, ecc.)
│   ├── form/        # Componenti form standard
│   ├── groups/      # Sistema gruppi (GroupCard, CreateGroupButton, ecc.)
│   ├── icons/       # Wrapper icone Lucide (100+ icone)
│   ├── modal/       # Sistema modale (Modal, ConfirmModal, InputModal, ecc.)
│   ├── profile/     # Profilo utente (ProfileModal)
│   ├── projects/    # Sistema progetti (ProjectCard, StatusModal, ecc.)
│   ├── pwa/         # Installazione PWA (InstallModal)
│   └── ui/          # Componenti UI base (Button, InfoBox, ColorPicker, ecc.)
├── contexts/        # React contexts
│   ├── AuthContext.jsx      # Autenticazione Firebase
│   ├── ModalContext.jsx     # Stack modali + history management
│   └── ThemeContext.jsx     # Tema chiaro/scuro + colore accent
├── hooks/           # Custom hooks
│   ├── useBentoAnimation.js # Layout Bento + FLIP animations
│   ├── useColumnCount.js    # Colonne responsive
│   ├── useIsMobile.js       # Rilevamento mobile
│   ├── useKeyboardHeight.js # Altezza tastiera mobile
│   └── usePWAInstall.js     # Installazione PWA
├── pages/           # Pagine app
│   ├── WelcomePage.jsx      # Landing page
│   ├── Dashboard.jsx        # Home autenticato (lista gruppi)
│   ├── ProjectPage.jsx      # Dettaglio progetto
│   └── LoadingPage.jsx      # Loading
├── services/        # Firebase services
│   ├── config.js            # Configurazione Firebase
│   ├── auth.js              # Auth (login, register, logout)
│   ├── groups.js            # CRUD gruppi
│   ├── projects.js          # CRUD progetti + bento boxes
│   ├── photos.js            # Upload/delete foto Storage
│   ├── pdfs.js              # Upload/delete PDF Storage
│   └── files.js             # Upload/delete file Storage
├── utils/           # Utility functions
│   ├── authValidation.js    # Validazione auth
│   ├── groupValidation.js   # Validazione gruppi
│   ├── projectValidation.js # Validazione progetti
│   ├── projectColors.js     # 12 colori progetti
│   └── projectStatuses.js   # 4 stati progetti
├── App.jsx          # Componente root + routing interno
├── main.jsx         # Entry point React
└── index.css        # Tailwind + variabili tema + animazioni

public/
├── manifest.json    # PWA manifest
├── sw.js            # Service Worker
└── *.png            # Icone PWA (192x192, 512x512, apple-touch, favicon)
```

## 📚 Documentazione

- **[PROGETTO.md](./PROGETTO.md)** - Documentazione completa del progetto
  - Panoramica e stato implementazione
  - Concetti fondamentali (gruppi, progetti, bento box)
  - Flusso di utilizzo
  - Permessi e sicurezza
  - Build e deployment
  - PWA e Service Worker
  - Gestione stato e persistenza
- **[UI_DESIGN.md](./UI_DESIGN.md)** - Specifiche UI/UX
  - Sistema temi e colori
  - Layout responsive
  - Componenti UI dettagliati
  - Sistema modale (desktop/mobile)
  - Modali annidati e gestione history
  - Animazioni CSS
- **[CONFIGURAZIONE.md](./CONFIGURAZIONE.md)** - Configurazione tecnica
  - Firebase (setup, regole, struttura dati)
  - Vite (build, code splitting)
  - Tailwind CSS (variabili custom)
  - ESLint (regole e plugins)
  - Service Worker (caching strategy)
  - Deploy e CI/CD
- **[src/STRUTTURA.md](./src/STRUTTURA.md)** - Struttura codice sorgente
  - Organizzazione cartelle e file
  - Descrizione di ogni componente
  - Dettagli contexts, hooks, services, utils
- **[src/components/bento/BENTO_BOX.md](./src/components/bento/BENTO_BOX.md)** - Sistema Bento Box
  - Layout dinamico e algoritmo di distribuzione
  - Animazioni FLIP dettagliate
  - Implementazione useBentoAnimation
  - ResizeObserver e performance
  - Tipi di box disponibili (Note, Photo, PDF, File, Checklist, Anagrafica)
  - Sincronizzazione real-time

### Architettura Tecnica

**Frontend:**

- React 19 con Hooks
- Tailwind CSS 4 con variabili custom
- Vite 7 per build ottimizzato
- Code splitting manuale per vendor chunks

**Backend:**

- Firebase Authentication (email/password)
- Cloud Firestore per dati (real-time sync con onSnapshot)
- Firebase Storage per file (foto, PDF, file generici)
- Firebase Hosting per deploy

**Sicurezza:**

- Regole Firestore: autenticazione richiesta per read/write
- Regole Storage: validazione formati e dimensioni file
- Filtraggio lato client per membri gruppo

**PWA:**

- Manifest.json con icone 192x192 e 512x512
- Service Worker con strategia network-first
- Installabile su Android, iOS, Desktop
- Popup installazione automatico

### Pattern Architetturali

**State Management:**

- Context API per stato globale (Auth, Modal, Theme)
- sessionStorage per persistenza temporanea (progetto corrente)
- localStorage per preferenze utente (tema)

**Real-time Sync:**

- Firestore `onSnapshot` per aggiornamenti live
- Sincronizzazione automatica tra dispositivi
- Nessun refresh manuale necessario

**Animazioni:**

- CSS keyframes per transizioni
- FLIP technique per layout Bento
- ResizeObserver per altezze dinamiche

## 🔗 Link Utili

- [Firebase Console](https://console.firebase.google.com/project/scaletta-1)
- [Vite Documentation](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
