# Scaletta - Documentazione del Progetto

## Panoramica

**Scaletta** è una piattaforma collaborativa che permette la creazione e gestione di gruppi di lavoro con struttura orizzontale. Ogni membro del gruppo ha gli stessi poteri e privilegi, mantenendo però traccia del fondatore originale.

---

## Stato Attuale dell'Implementazione

### ✅ Completato

- **Autenticazione Firebase** (login, registrazione, logout, modifica username)
- **Sistema Gruppi** completo (creazione, partecipazione, uscita, eliminazione)
- **Sistema Progetti** completo (creazione, modifica, stati, colori, eliminazione)
- **Sistema Tema** (chiaro/scuro + 6 colori accent)
- **PWA** (installabile su dispositivi)
- **UI/UX responsive** (mobile fullscreen, desktop centrato)
- **Sistema Modali** con gestione history browser

### 🚧 In Sviluppo

- Contenuto dettagliato dei progetti (task, note, file)

### 📋 Pianificato

- Gestione file e note nei progetti
- Notifiche
- Ricerca avanzata

---

## Concetti Fondamentali

### 1. Gruppi

Un **Gruppo** è l'entità principale dell'applicazione. Rappresenta un team di persone che collaborano insieme.

#### Caratteristiche dei Gruppi:

- **Nome del gruppo**: Modificabile da qualsiasi membro (2-50 caratteri)
- **Codice univoco**: 8 caratteri alfanumerici (A-Z, 0-9) generato automaticamente
- **Data di creazione**: Timestamp di quando il gruppo è stato creato
- **Founder (Fondatore)**: L'utente che ha creato il gruppo
- **Membri**: Lista di tutti gli utenti con `uid`, `displayName`, `email`, `joinedAt`

#### Regole dei Gruppi:

- ✅ Tutti i membri possono modificare il nome del gruppo
- ✅ Tutti i membri possono uscire dal gruppo
- ✅ Il founder viene identificato con icona corona 👑
- ✅ **Solo il founder** può eliminare il gruppo (elimina anche tutti i progetti)
- ✅ I membri possono unirsi tramite codice a 8 caratteri

#### Struttura Dati Gruppo (Firestore):

```javascript
{
  id: string,              // ID documento Firestore
  name: string,            // Nome del gruppo (2-50 caratteri)
  code: string,            // Codice 8 caratteri alfanumerici (univoco)
  createdAt: Timestamp,    // Data creazione
  founderId: string,       // UID del creatore
  founderName: string,     // Nome del creatore
  members: [               // Array di membri
    {
      uid: string,
      displayName: string,
      email: string,
      joinedAt: string     // ISO date string
    }
  ]
}
```

---

### 2. Progetti

Ogni gruppo può creare e gestire molteplici **Progetti**. Un progetto è uno spazio di lavoro dedicato a un'attività specifica.

#### Caratteristiche dei Progetti:

- **Nome progetto**: Modificabile (2-50 caratteri), univoco nel gruppo
- **Colore**: 12 colori disponibili, assegnato automaticamente (evita duplicati)
- **Stato**: 4 stati disponibili con icone e colori dedicati
- **Creatore**: Tracciato chi ha creato il progetto
- **Data creazione**: Timestamp

#### Stati dei Progetti:

| Stato      | Icona | Colore Light | Colore Dark | Descrizione             |
| ---------- | ----- | ------------ | ----------- | ----------------------- |
| In corso   | ▶️    | Verde        | Verde       | Progetto attivo         |
| Completato | ✓     | Blu          | Blu         | Progetto terminato      |
| Archiviato | 📦    | Viola        | Viola       | Progetto non più attivo |
| Cestinato  | 🗑️    | Rosso        | Rosso       | Pronto per eliminazione |

#### Ordinamento Automatico Progetti:

I progetti vengono ordinati automaticamente:

1. **Per stato** (priorità): In corso → Completato → Archiviato → Cestinato
2. **Per data** (a parità di stato): più recenti prima

#### Colori Disponibili (12):

Organizzati in 3 righe da 4:

- Riga 1: Blue, Purple, Teal, Green
- Riga 2: Orange, Red, Pink, Indigo
- Riga 3: Yellow, Cyan, Emerald, Rose

#### Regole dei Progetti:

- ✅ Tutti i membri possono creare progetti
- ✅ Tutti i membri possono modificare nome, colore e stato
- ✅ **Founder del gruppo O creatore del progetto** possono eliminare
- ✅ L'eliminazione è possibile solo se il progetto è nello stato "Cestinato"
- ✅ Non possono esistere due progetti con lo stesso nome nello stesso gruppo

#### Struttura Dati Progetto (Firestore):

```javascript
{
  id: string,              // ID documento Firestore
  name: string,            // Nome del progetto (2-50 caratteri)
  groupId: string,         // ID del gruppo di appartenenza
  color: string,           // ID colore (blue, purple, teal, ecc.)
  status: string,          // Stato (in-corso, completato, archiviato, cestinato)
  createdAt: Timestamp,    // Data creazione
  createdBy: string,       // UID del creatore
  createdByName: string    // Nome del creatore
}
```

---

## Flusso di Utilizzo Attuale

### 1. Accesso

1. L'utente apre l'app e visualizza la **WelcomePage**
2. Può registrarsi o effettuare login con email/password
3. Dopo l'autenticazione accede alla **Dashboard**

### 2. Dashboard (Home)

- Header con logo "Scaletta" e tasto profilo tondo
- Se non ha gruppi: **EmptyGroupsCard** (card tutorial con benvenuto e tasti)
- Se ha gruppi: lista **GroupCard** espandibili + tasti crea/unisciti in basso

### 3. Creazione Gruppo

1. Click su "Crea gruppo" (tasto con sfondo colorato)
2. **InputModal**: inserimento nome (2-50 caratteri)
3. Il sistema genera automaticamente un codice 8 caratteri
4. L'utente diventa founder e primo membro

### 4. Partecipazione a Gruppo

1. Click su "Unisciti" (tasto tratteggiato)
2. **InputModal**: inserimento codice 8 caratteri (convertito in maiuscolo)
3. Validazione codice (esistenza + non già membro)
4. L'utente viene aggiunto ai membri

### 5. Gestione Gruppo

1. Click sull'icona info (i) nella **GroupCard**
2. **GroupInfoModal** mostra:
   - Nome (modificabile con matita)
   - Codice (copiabile con tasto copia)
   - Data creazione
   - Lista membri (pillole colorate, Tu con corona se founder)
   - Tasto "Elimina gruppo" (solo founder) o "Esci dal gruppo"

### 6. Visualizzazione Progetti

1. Click sulla **GroupCard** per espandere
2. Viene mostrata la **ProjectGrid** con:
   - Griglia di **ProjectCard** (3 colonne mobile, 4 tablet, 5 desktop)
   - Tasto "+" per creare nuovo progetto
3. I progetti sono ordinati: in corso → completati → archiviati → cestinati

### 7. Creazione Progetto

1. Click sul tasto "+" nella griglia progetti
2. **InputModal**: inserimento nome (2-50 caratteri, unico nel gruppo)
3. Colore assegnato automaticamente (evita duplicati)
4. Stato iniziale: "In corso"

### 8. Gestione Progetto

1. Click sulla **ProjectCard** per aprire **ProjectPage**
2. Header con:
   - Freccia indietro
   - Nome progetto centrato
   - Menu kebab (⋮) con opzioni Info e Stato
3. **ProjectInfoModal**:
   - Nome (modificabile)
   - Creato da (nome creatore)
   - Data creazione
   - Selettore colore
4. **StatusModal**:
   - Slider visuale degli stati con barra gradient
   - Tasto elimina (attivo solo se cestinato)

### 9. Profilo Utente

1. Click sul tasto tondo nell'header
2. **ProfileModal** mostra:
   - Email (readonly)
   - Nome utente (modificabile)
   - Selettore tema (chiaro/scuro + 6 colori)
   - Tasto "Installa app" (se non installata)
   - Tasto "Esci" (logout)

---

## Permessi e Sicurezza

### Regole Firestore

```javascript
// Gruppi
read: if isAuthenticated()              // Tutti possono leggere (filtro client-side)
create: if founder == auth.uid          // Solo creatore può creare
update: if isAuthenticated()            // Tutti i membri (verificato lato client)
delete: if founder == auth.uid          // Solo founder può eliminare

// Progetti
read: if isAuthenticated()              // Tutti possono leggere
create: if isAuthenticated()            // Tutti i membri del gruppo
update: if isAuthenticated()            // Tutti i membri del gruppo
delete: if founder == auth.uid          // Founder gruppo O creatore progetto
```

### Differenze UI Founder vs Membri

| Azione              | Membri Normali | Founder     |
| ------------------- | -------------- | ----------- |
| Modificare nome     | ✅ Visibile    | ✅ Visibile |
| Copiare codice      | ✅ Visibile    | ✅ Visibile |
| Uscire dal gruppo   | ✅ Visibile    | ❌ Nascosto |
| Eliminare il gruppo | ❌ Nascosto    | ✅ Visibile |

### Differenze Eliminazione Progetti

| Utente                | Può eliminare progetto |
| --------------------- | ---------------------- |
| Founder del gruppo    | ✅ Sempre              |
| Creatore del progetto | ✅ Solo i propri       |
| Altri membri          | ❌ Mai                 |

> L'eliminazione richiede che il progetto sia nello stato "Cestinato"

---

## Tecnologie Utilizzate

### Frontend

- **React 19** + **Vite 7** (build tool)
- **Tailwind CSS 4** con variabili CSS custom per temi
- **Lucide React** per icone
- **PWA** con Service Worker

### Backend

- **Firebase Authentication** (email/password)
- **Cloud Firestore** (database NoSQL)
- **Firebase Hosting** (deployment)

### Configurazione

- **ESLint** per linting
- **Prettier** (implicito tramite editor)

---

## Roadmap di Sviluppo

### Fase 1 - Base ✅ COMPLETATA

- [x] Sistema di autenticazione
- [x] CRUD Gruppi (crea, leggi, modifica nome, elimina)
- [x] Gestione membri (join, leave)
- [x] Codice univoco 8 caratteri per inviti
- [x] Sistema tema chiaro/scuro + colori accent
- [x] PWA installabile

### Fase 2 - Progetti ✅ COMPLETATA

- [x] CRUD Progetti (crea, leggi, modifica, elimina)
- [x] Sistema stati (in-corso, completato, archiviato, cestinato)
- [x] Sistema colori (12 colori, assegnazione automatica)
- [x] Ordinamento automatico (per stato + data)
- [x] Contenuto espandibile card gruppi (ProjectGrid)
- [x] ProjectPage con header colorato
- [x] StatusSlider con barra gradient
- [x] Permessi eliminazione (founder gruppo O creatore progetto)
- [x] Validazione nomi duplicati

### Fase 3 - File Management (Prossima)

- [ ] Upload file
- [ ] Download file
- [ ] Anteprima file
- [ ] Organizzazione cartelle

### Fase 4 - Note e Dati

- [ ] Sistema note con editor
- [ ] Campi dati personalizzati
- [ ] Sistema di tag

### Fase 5 - Miglioramenti

- [ ] Ricerca avanzata
- [ ] Notifiche
- [ ] Cronologia attività

---

## Note Finali

Il nome **Scaletta** richiama l'idea di una struttura organizzativa (come una scaletta di un evento o programma) dove ogni elemento ha la sua importanza e tutti contribuiscono al risultato finale, senza gerarchie di potere ma con tracciabilità delle origini.
