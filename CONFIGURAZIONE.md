# Scaletta - Configurazione Tecnica

Questa guida contiene i dettagli tecnici di configurazione del progetto, utile per sviluppatori e maintainer.

---

## Indice

- [Firebase](#firebase)
- [Vite](#vite)
- [Tailwind CSS](#tailwind-css)
- [ESLint](#eslint)
- [Service Worker](#service-worker)
- [Variabili d'Ambiente](#variabili-dambiente)

---

## Firebase

### Configurazione

**File**: `src/services/config.js`

```javascript
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "scaletta-1.firebaseapp.com",
  projectId: "scaletta-1",
  storageBucket: "scaletta-1.firebasestorage.app",
  messagingSenderId: "...",
  appId: "...",
};

const app = initializeApp(firebaseConfig);
export default app;
```

### Servizi Abilitati

- **Authentication**: Email/Password
- **Firestore Database**: Mode Production
- **Storage**: Regole custom per foto/PDF/file
- **Hosting**: Deploy automatico da CLI

### Struttura Dati

#### Firestore Collections

```
/groups/{groupId}
  ├─ id: string
  ├─ name: string
  ├─ code: string (8 char)
  ├─ createdAt: timestamp
  ├─ founderId: string
  ├─ founderName: string
  └─ members: array<object>

/projects/{projectId}
  ├─ id: string
  ├─ name: string
  ├─ groupId: string
  ├─ color: string
  ├─ status: string
  ├─ createdAt: timestamp
  ├─ createdBy: string
  ├─ createdByName: string
  └─ /bentoBoxes/{boxId}
      ├─ id: string
      ├─ title: string
      ├─ boxType: string
      ├─ content: string (per NoteBox)
      ├─ photos: array (per PhotoBox)
      ├─ pdfs: array (per PdfBox)
      ├─ files: array (per FileBox)
      ├─ items: array (per ChecklistBox)
      ├─ anagrafica: object (per AnagraficaBox)
      └─ createdAt: timestamp
```

#### Storage Paths

```
/projects/{projectId}/photos/{photoId}.{ext}
/projects/{projectId}/pdfs/{pdfId}.pdf
/projects/{projectId}/files/{fileId}.{ext}
```

### Regole di Sicurezza

#### Firestore Rules (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Gruppi
    match /groups/{groupId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() &&
        request.resource.data.founderId == request.auth.uid;
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated() &&
        resource.data.founderId == request.auth.uid;
    }

    // Progetti
    match /projects/{projectId} {
      allow read, write: if isAuthenticated();

      match /bentoBoxes/{boxId} {
        allow read, write: if isAuthenticated();
      }
    }
  }
}
```

#### Storage Rules (`storage.rules`)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }

    function isPDF() {
      return request.resource.contentType == 'application/pdf';
    }

    function isUnderMaxSize() {
      return request.resource.size < 10 * 1024 * 1024; // 10MB
    }

    function isUnderFileMaxSize() {
      return request.resource.size < 50 * 1024 * 1024; // 50MB
    }

    // Foto
    match /projects/{projectId}/photos/{photoId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isImage() && isUnderMaxSize();
      allow delete: if isAuthenticated();
    }

    // PDF
    match /projects/{projectId}/pdfs/{pdfId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isPDF() && isUnderFileMaxSize();
      allow delete: if isAuthenticated();
    }

    // File generici
    match /projects/{projectId}/files/{fileId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isUnderFileMaxSize();
      allow delete: if isAuthenticated();
    }
  }
}
```

### Hosting Configuration (`firebase.json`)

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  },
  "firestore": {
    "rules": "firestore.rules"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

---

## Vite

### Configurazione (`vite.config.js`)

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - librerie esterne
          "vendor-react": ["react", "react-dom"],
          "vendor-firebase-core": ["firebase/app", "firebase/auth"],
          "vendor-firebase-db": ["firebase/firestore"],
          "vendor-firebase-storage": ["firebase/storage"],
          "vendor-pdf": ["react-pdf", "pdfjs-dist"],
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
});
```

### Code Splitting

Il progetto utilizza **manual chunks** per ottimizzare il caricamento:

| Chunk                     | Librerie                    | Dimensione Tipica |
| ------------------------- | --------------------------- | ----------------- |
| `vendor-react`            | react, react-dom            | ~150KB            |
| `vendor-firebase-core`    | firebase/app, firebase/auth | ~100KB            |
| `vendor-firebase-db`      | firebase/firestore          | ~200KB            |
| `vendor-firebase-storage` | firebase/storage            | ~50KB             |
| `vendor-pdf`              | react-pdf, pdfjs-dist       | ~400KB            |
| `vendor-icons`            | lucide-react                | ~50KB             |

**Vantaggi:**

- Caricamento parallelo dei chunk
- Caching efficiente (vendor code cambia raramente)
- Riduzione dimensione bundle principale
- Lazy loading possibile per chunk non critici

---

## Tailwind CSS

### Configurazione

Tailwind CSS 4 viene configurato tramite il plugin Vite `@tailwindcss/vite`.

**File**: `vite.config.js`

```javascript
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

### Variabili Tema Custom

**File**: `src/index.css`

```css
@import "tailwindcss";

@theme {
  /* Primary color - dinamico */
  --color-primary: var(--theme-primary, #00bcd4);
  --color-primary-light: var(--theme-primary-light, #4dd0e1);
  --color-primary-dark: var(--theme-primary-dark, #0097a7);

  /* Background colors - dinamici */
  --color-bg-primary: var(--theme-bg-primary, #121212);
  --color-bg-secondary: var(--theme-bg-secondary, #1e1e1e);
  --color-bg-tertiary: var(--theme-bg-tertiary, #2d2d2d);

  /* Text colors - dinamici */
  --color-text-primary: var(--theme-text-primary, #ffffff);
  --color-text-secondary: var(--theme-text-secondary, #b3b3b3);
  --color-text-muted: var(--theme-text-muted, #666666);

  /* Border colors - dinamici */
  --color-border: var(--theme-border, #333333);
  --color-divider: var(--theme-divider, #404040);

  /* Status colors - fissi */
  --color-error: #f44336;
  --color-success: #4caf50;
}
```

**Come vengono usate:**

- `ThemeContext` imposta le variabili su `document.documentElement.style`
- Tailwind le espone tramite `bg-primary`, `text-primary`, ecc.
- Cambio tema istantaneo senza reload

---

## ESLint

### Configurazione (`eslint.config.js`)

```javascript
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{js,jsx}"],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    rules: {
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],
    },
  },
]);
```

### Regole Custom

- `no-unused-vars`: Ignora variabili che iniziano con maiuscola o underscore
  - Utile per costanti globali (es. `const MODAL_AUTH = "auth"`)
  - Utile per parametri non usati nelle callback (es. `const handleClick = (_e) => {}`)

### Plugins

- `eslint-plugin-react-hooks`: Verifica rules of hooks
- `eslint-plugin-react-refresh`: Ottimizzazioni per Fast Refresh

---

## Service Worker

### File (`public/sw.js`)

```javascript
const CACHE_NAME = "scaletta-v4";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  // ... icone
];
```

### Strategia di Caching

**Network-First con Fallback a Cache:**

1. Prova a prendere risorsa dalla rete
2. Se successo: aggiorna cache + ritorna risposta
3. Se fallimento: ritorna da cache
4. Se nemmeno in cache: errore

**Richieste escluse dal caching:**

- Richieste Firebase (firestore, storage, auth)
- Richieste non-GET
- Protocolli non-HTTP(S)
- Richieste crossorigin

**Motivo esclusione Firebase:**

```javascript
// Skip Firebase - non devono essere cachate per sync real-time
if (
  url.hostname.includes("firestore.googleapis.com") ||
  url.hostname.includes("firebase") ||
  url.hostname.includes("firebaseio.com") ||
  url.hostname.includes("googleapis.com")
) {
  return;
}
```

### Lifecycle

1. **Install**: Cache assets statici
2. **Activate**: Pulisce vecchie cache
3. **Fetch**: Intercetta richieste

### Versioning

Quando si aggiorna il Service Worker:

1. Cambia `CACHE_NAME` (es: `scaletta-v5`)
2. Evento `activate` elimina automaticamente vecchie cache
3. Utenti ottengono nuova versione al prossimo caricamento

---

## Variabili d'Ambiente

### Persistenza Locale

#### sessionStorage

Dati temporanei (durano solo la sessione corrente):

| Chiave                         | Contenuto         | Tipo   |
| ------------------------------ | ----------------- | ------ |
| `scaletta_current_project`     | Progetto corrente | JSON   |
| `scaletta_current_group`       | Gruppo corrente   | JSON   |
| `scaletta_install_popup_shown` | Popup mostrato    | String |

#### localStorage

Preferenze persistenti (durano per sempre):

| Chiave                  | Contenuto     | Valori                                                                   |
| ----------------------- | ------------- | ------------------------------------------------------------------------ |
| `scaletta-theme-mode`   | Tema UI       | `'light'` \| `'dark'`                                                    |
| `scaletta-accent-color` | Colore accent | `'teal'` \| `'blue'` \| `'purple'` \| `'red'` \| `'orange'` \| `'green'` |

### Environment Variables (.env)

Il progetto **non usa** file `.env` in quanto le configurazioni Firebase sono pubbliche (apiKey è sicura anche se esposta nel frontend).

Se in futuro si volessero aggiungere variabili sensibili:

```env
# .env.local (non committare!)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
```

```javascript
// src/services/config.js
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // ...
};
```

---

## Deploy

### Build Produzione

```bash
npm run build
```

Output in `dist/`:

- `index.html`
- `assets/index-[hash].js` (main bundle)
- `assets/vendor-react-[hash].js`
- `assets/vendor-firebase-core-[hash].js`
- ... altri vendor chunks
- Assets statici (icone, manifest, sw.js)

### Deploy Firebase

```bash
# Prima volta
firebase login

# Deploy
firebase deploy

# Solo hosting
firebase deploy --only hosting

# Solo rules
firebase deploy --only firestore:rules,storage:rules
```

### CI/CD (Opzionale)

Per automatizzare il deploy con GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: "${{ secrets.GITHUB_TOKEN }}"
          firebaseServiceAccount: "${{ secrets.FIREBASE_SERVICE_ACCOUNT }}"
          channelId: live
          projectId: scaletta-1
```

---

## Note Tecniche

### React 19 Features Usate

- **New JSX Transform**: Import automatico di React
- **Concurrent Features**: useTransition, useDeferredValue (non usati al momento)
- **Strict Mode**: Attivo, doppio render in dev per trovare side effects

### Vite Features Usate

- **Hot Module Replacement (HMR)**: Aggiornamenti istantanei senza reload
- **Fast Refresh**: Mantiene stato componenti durante HMR
- **Code Splitting**: Manual chunks per vendor libraries
- **Asset Optimization**: Immagini, font, CSS ottimizzati automaticamente

### Tailwind 4 Features Usate

- **@theme directive**: Definizione variabili custom
- **Vite Plugin**: Integrazione nativa senza PostCSS config
- **JIT Mode**: Generazione on-demand delle utility classes

### Firebase SDK v10+ (Modular)

Il progetto usa la versione modulare di Firebase per tree-shaking ottimale:

```javascript
// ❌ Vecchio modo (SDK v8)
import firebase from "firebase/app";
import "firebase/firestore";

// ✅ Nuovo modo (SDK v10+)
import { getFirestore, doc, getDoc } from "firebase/firestore";
```

Vantaggi:

- Bundle size ridotto (~60% più piccolo)
- Tree-shaking automatico
- TypeScript support migliorato
