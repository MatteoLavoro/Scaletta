# Scaletta - Documentazione del Progetto

## Panoramica

**Scaletta** è una piattaforma collaborativa che permette la creazione e gestione di gruppi di lavoro con struttura orizzontale. Ogni membro del gruppo ha gli stessi poteri e privilegi, mantenendo però traccia del fondatore originale.

---

## Stato Attuale dell'Implementazione

### ✅ Completato

- **Autenticazione Firebase** (login, registrazione, logout, modifica username)
- **Sistema Gruppi** completo (creazione, partecipazione, uscita, eliminazione)
- **Sistema Tema** (chiaro/scuro + 6 colori accent)
- **PWA** (installabile su dispositivi)
- **UI/UX responsive** (mobile fullscreen, desktop centrato)
- **Sistema Modali** con gestione history browser

### 🚧 In Sviluppo

- Contenuto espandibile delle card gruppo (placeholder attuale)
- Sistema Progetti

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
- ✅ **Solo il founder** può eliminare il gruppo
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

### 2. Progetti (Futuro)

Ogni gruppo potrà creare e gestire molteplici **Progetti**. Un progetto è uno spazio di lavoro dedicato a un'attività specifica.

#### Funzionalità Pianificate:

- **Gestione File**: Upload, download, anteprima, cartelle
- **Note**: Creazione, modifica, formattazione, tag
- **Dati Personalizzati**: Campi custom, tabelle
- **Visualizzazione**: Vista file, galleria, lista, filtri

---

## Flusso di Utilizzo Attuale

### 1. Accesso

1. L'utente apre l'app e visualizza la **WelcomePage**
2. Può registrarsi o effettuare login con email/password
3. Dopo l'autenticazione accede alla **Dashboard**

### 2. Dashboard (Home)

- Header con logo "Scaletta" e tasto profilo tondo
- Se non ha gruppi: **EmptyGroupsCard** (card tutorial con benvenuto e tasti)
- Se ha gruppi: lista **GroupCard** + tasti crea/unisciti in basso

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

### 6. Profilo Utente

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
```

### Differenze UI Founder vs Membri

| Azione              | Membri Normali | Founder     |
| ------------------- | -------------- | ----------- |
| Modificare nome     | ✅ Visibile    | ✅ Visibile |
| Copiare codice      | ✅ Visibile    | ✅ Visibile |
| Uscire dal gruppo   | ✅ Visibile    | ❌ Nascosto |
| Eliminare il gruppo | ❌ Nascosto    | ✅ Visibile |

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

### Fase 2 - Progetti (Prossima)

- [ ] CRUD Progetti base
- [ ] Contenuto espandibile card gruppi
- [ ] Vista progetti nel gruppo

### Fase 3 - File Management

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
