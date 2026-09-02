# Piano: Condivisione Progetti tra Gruppi

## Stato: Da Implementare

---

## 1. Modello Dati

### 1.1 Modifiche al documento `projects/{projectId}`

Aggiungere i campi:

```javascript
{
  // ... campi esistenti ...
  shareCode: string,        // 10 char maiuscoli (es. "AB3X7KQ9MN"), unico globalmente
  sharedGroupIds: string[], // Array piatto di groupId per query Firestore (array-contains)
  sharedGroups: [           // Array dettagliato per il modale di gestione
    {
      groupId: string,
      groupName: string,
      role: "pending" | "viewer" | "editor",
      requestedAt: Timestamp,
      requestedBy: string,      // uid di chi ha inserito il codice
      requestedByName: string,
      members: [                // Snapshot dei membri al momento della richiesta
        { uid: string, displayName: string, email: string }
      ]
    }
  ]
}
```

### 1.2 Ruoli

| Ruolo     | Chi                               | Cosa può fare                                                |
| --------- | --------------------------------- | ------------------------------------------------------------ |
| `owner`   | Utente del gruppo originale       | Tutto (incluso elimina, gestisci condivisione)               |
| `editor`  | Gruppo promosso                   | Tutto tranne eliminare il progetto e gestire la condivisione |
| `viewer`  | Gruppo appena accettato (default) | Solo visualizzare + scrivere in chat                         |
| `pending` | Gruppo in attesa                  | Vede la card con icona orologio, non può aprire il progetto  |

### 1.3 `shareCode` per progetti esistenti

I progetti già esistenti non avranno `shareCode`. La funzione `generateProjectShareCode()` viene chiamata:

- Alla creazione del progetto
- La prima volta che si apre `ProjectInfoModal` su un progetto senza `shareCode` (lazy generation)

---

## 2. File da Creare

### 2.1 `src/components/icons/LinkIcon.jsx`

Icona a catena (due anelli collegati), usata per:

- Badge progetti condivisi nella `ProjectCard`
- Tasto "Nuovo progetto condiviso" in `ProjectGrid`

### 2.2 `src/components/projects/JoinSharedProjectButton.jsx`

Tasto quadrato tratteggiato identico a `CreateProjectButton` ma con:

- Icona: combinazione di icona progetto + `LinkIcon`
- Testo: "Progetto condiviso"
- Posizione: subito dopo `CreateProjectButton` nella griglia

### 2.3 `src/components/projects/ProjectShareModal.jsx`

Modale "Gestione Condivisione" — visibile solo agli owner.
Struttura:

```
┌─────────────────────────────────────┐
│ Gestione Condivisione               │
├─────────────────────────────────────┤
│ [CopyableInfoBox] Codice condivisione│
│ "Condividi questo codice per dare   │
│  accesso ad altri gruppi"           │
├─────────────────────────────────────┤
│ Richieste in attesa (N)             │
│  ┌───────────────────────────────┐  │
│  │ Nome Gruppo                   │  │
│  │ Membri: Mario, Luigi, Peach   │  │
│  │              [Accetta] [Nega] │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│ Gruppi con accesso (N)              │
│  ┌───────────────────────────────┐  │
│  │ Nome Gruppo    [viewer▾] [✕]  │  │
│  │ Membri: Mario, Luigi          │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

Il role selector `[viewer▾]` è un dropdown che permette:

- viewer → editor (promuovi)
- editor → viewer (retrocedi)

---

## 3. File da Modificare

### 3.1 `src/services/projects.js`

**Nuove funzioni:**

```javascript
// Genera codice shareCode unico a 10 caratteri
generateProjectShareCode(): Promise<string>

// Assegna shareCode a un progetto (lazy, se mancante)
ensureProjectShareCode(projectId): Promise<string>

// Trova progetto per shareCode
getProjectByShareCode(shareCode: string): Promise<project | null>

// Aggiunge una richiesta di accesso (stato "pending")
requestJoinSharedProject(
  projectId: string,
  requestingGroup: { groupId, groupName, members },
  requestingUser: { uid, displayName }
): Promise<void>

// Accetta una richiesta pending → diventa "viewer"
acceptSharedGroup(projectId: string, groupId: string): Promise<void>

// Nega/rimuove un gruppo condiviso
removeSharedGroup(projectId: string, groupId: string): Promise<void>

// Cambia ruolo di un gruppo condiviso
updateSharedGroupRole(
  projectId: string,
  groupId: string,
  role: "viewer" | "editor"
): Promise<void>

// Ottieni progetto singolo in tempo reale (per ProjectShareModal)
subscribeToProject(projectId: string, callback): () => void
```

**Funzioni modificate:**

- `createProject()`: aggiunge `shareCode`, `sharedGroups: []`, `sharedGroupIds: []`
- `subscribeToGroupProjects(groupId, callback)`: diventa **due listener paralleli** che vengono uniti:
  1. `where("groupId", "==", groupId)` → progetti propri
  2. `where("sharedGroupIds", "array-contains", groupId)` → progetti condivisi

  Il risultato unito viene passato alla callback. I progetti condivisi avranno un campo `_sharedRole` aggiunto lato client (calcolato da `sharedGroups`).

  > **Attenzione**: I due listener devono essere sincronizzati — entrambi devono essersi risolti almeno una volta prima di emettere il primo update. Usare un pattern con `Promise.all` o contatori di inizializzazione.

### 3.2 `src/components/projects/ProjectGrid.jsx`

- Aggiungere stato `isJoinModalOpen`
- Aggiungere `JoinSharedProjectButton` dopo `CreateProjectButton` nella griglia
- Handler `handleJoinSharedProject(code)`:
  1. `getProjectByShareCode(code)`
  2. Controlla se già membro/pending → errore
  3. `requestJoinSharedProject(...)`
  4. Chiude modale
- Passare a `ProjectCard` il flag `isShared = project.groupId !== groupId` e il `role` (`project._sharedRole`)

### 3.3 `src/components/projects/ProjectCard.jsx`

- Aggiungere prop `isShared: boolean` e `sharedRole: string`
- Se `isShared && sharedRole === "pending"`:
  - Overlay semi-trasparente sulla card
  - Icona orologio invece dello stato
  - Click: non aprire il progetto (o aprire con messaggio "In attesa di approvazione")
- Se `isShared && (sharedRole === "viewer" || sharedRole === "editor")`:
  - Badge catena (`LinkIcon`) in alto a destra, sopra il badge notifiche
- Click disabilitato se `pending`

### 3.4 `src/components/projects/ProjectInfoModal.jsx`

- Aggiungere `CopyableInfoBox` per il `shareCode`
  - Titolo: "Codice condivisione"
  - Subtext: "Condividendo questo codice dai accesso al progetto ad altri gruppi"
  - Color: "indigo" o "purple"
- Se il progetto non ha `shareCode` ancora, chiamare `ensureProjectShareCode()` all'apertura del modale e mostrare spinner
- Questo campo è visibile a tutti (owner, viewer, editor) perché tutti possono condividere il codice...

  > **Decisione**: Solo gli owner vedono il codice di condivisione, gli altri no. Un viewer non dovrebbe poter espandere ulteriormente l'accesso. Passare prop `isOwner` al modale.

### 3.5 `src/pages/ProjectPage.jsx`

**Nuova prop**: `userRole: "owner" | "editor" | "viewer"`  
(Aggiunta tramite App.jsx — vedi §3.7)

**Modifiche basate su `userRole`:**

Se `userRole === "viewer"`:

- Nascondere `MobileAddFab` e `DesktopAddFab`
- Nascondere `CameraFab`
- Disabilitare drag & drop (`handleDragEnter` non fa nulla)
- Kebab menu del progetto: solo "Info progetto", **non** "Gestisci stato", **non** "Gestione condivisione"
- Passare `isViewer={true}` a tutti i componenti BentoBox

Se `userRole === "editor"`:

- Tutto abilitato tranne:
  - Nel kebab menu del progetto: non mostrare "Gestione condivisione"
  - Non mostrare opzione elimina progetto (già gestita da `isFounder`)

Se `userRole === "owner"`:

- Tutto come ora, più:
  - Nuova voce nel kebab menu: "Gestione condivisione" (LinkIcon) → apre `ProjectShareModal`

**Aggiornamento kebab menu:**

```javascript
const menuItems = [
  { label: "Info progetto", ... },
  ...(userRole !== "viewer" ? [{ separator: true }, { label: "Gestisci stato", ... }] : []),
  ...(userRole === "owner" ? [{ separator: true }, { label: "Gestione condivisione", icon: <LinkIcon />, onClick: ... }] : []),
];
```

**Cleanup dei box vuoti**: I viewer non creano box, quindi `cleanupEmptyBoxes` non deve fare nulla se `userRole === "viewer"`.

### 3.6 `src/components/bento/BaseBentoBox.jsx`

Aggiungere prop `isViewer: boolean` (default `false`).

Se `isViewer === true`, il `buildMenuItems()` restituisce **solo**:

```javascript
[
  // "Messaggio da box" se onSendMessageFromBox è definito
  { label: "Messaggio da box", ... },
  // "Creato da ..." (voce informativa, non cliccabile)
  { label: `Creato da ${createdByName}`, disabled: true, ... },
]
```

Tutti gli altri item (modifica titolo, elimina, pin, item specifici) vengono soppressi.

> Tutti i BentoBox specifici (`NoteBox`, `PhotoBox`, ecc.) passano già `menuItems` e `onDelete` a `BaseBentoBox`. Sarà necessario anche far sì che i componenti specifici non mostrino i propri controlli di modifica quando `isViewer=true`. Vedere §3.8.

### 3.7 `src/App.jsx`

Aggiungere calcolo del ruolo:

```javascript
// Quando currentProject e currentGroup sono settati:
const computeUserRole = (project, group) => {
  if (!project || !group) return "owner";
  if (project.groupId === group.id) return "owner";
  const sharedEntry = project.sharedGroups?.find((g) => g.groupId === group.id);
  return sharedEntry?.role || "viewer"; // pending non dovrebbe arrivare qui
};

const userProjectRole = useMemo(
  () => computeUserRole(currentProject, currentGroup),
  [currentProject, currentGroup],
);
```

Passare `userRole={userProjectRole}` a `<ProjectPage />`.

### 3.8 BentoBox specifici (NoteBox, PhotoBox, PdfBox, FileBox, ChecklistBox, AnagraficaBox, VersionBox, MarkdownBox)

Aggiungere prop `isViewer: boolean` e propagarla a `BaseBentoBox`.

Per ciascuno, se `isViewer`:

- Non passare `onTitleChange`, `onDelete`, `onPinToggle`
- Non passare `menuItems` specifici del box (es. opzioni modifica contenuto)
- Disabilitare interazioni (es. checkbox in `ChecklistBox`, textarea in `NoteBox`, upload in `PhotoBox`)
- Mostrare il contenuto in modalità sola lettura

> Questo è il lavoro più articolato. Ogni box deve gestire il prop `isViewer`. I box più semplici come `NoteBox` richiedono solo disabilitare la textarea. I box come `PhotoBox` richiedono nascondere i tasti upload/elimina foto.

### 3.9 `src/components/projects/index.js`

Esportare `JoinSharedProjectButton` e `ProjectShareModal`.

### 3.10 `src/components/icons/index.js`

Esportare `LinkIcon`.

### 3.11 `firestore.rules`

Aggiornare per permettere lettura dei progetti condivisi:

```javascript
match /projects/{projectId} {
  // Owner (gruppo originale) o gruppo con accesso condiviso può leggere
  allow read: if isAuthenticated();

  // Scrittura: solo utenti autenticati (la logica di ruolo è applicata lato client/service)
  // In futuro: rafforzare con check su sharedGroupIds
  allow write: if isAuthenticated();

  match /bentoBoxes/{boxId} {
    allow read, write: if isAuthenticated();
  }
}
```

> **Nota sicurezza**: Le regole attuali sono permissive (qualsiasi autenticato può scrivere). Per una implementazione più sicura, le regole dovrebbero verificare che l'utente appartenga al gruppo originale o a un gruppo con ruolo `editor`/`owner`. Questo richiede strutture dati aggiuntive nelle regole. Per ora si mantiene la logica di autorizzazione lato applicazione, come già fatto per i gruppi.

---

## 4. Flussi Completi

### 4.1 Condivisione di un progetto

```
Owner apre ProjectInfoModal
    ↓
Vede "Codice condivisione: AB3X7KQ9MN" con tasto copia
    ↓
Copia e condivide il codice (es. via WhatsApp)
    ↓
Membro di un altro gruppo clicca "Progetto condiviso" nella sua GroupCard
    ↓
InputModal (10 char) → requestJoinSharedProject()
    ↓
Firestore: progetto.sharedGroups += { groupId, role: "pending", members: [...] }
           progetto.sharedGroupIds += groupId
    ↓
Nella ProjectGrid del richiedente: card visibile con icona orologio (pending)
    ↓
Owner apre "Gestione condivisione" dal kebab menu
    ↓
Vede la richiesta → clicca "Accetta"
    ↓
acceptSharedGroup() → role cambia da "pending" a "viewer"
    ↓
Nella ProjectGrid del richiedente: card diventa cliccabile con badge catena
```

### 4.2 Apertura progetto come viewer

```
Viewer clicca sulla ProjectCard condivisa
    ↓
onProjectClick({ project, group }) in App.jsx
    ↓
computeUserRole() → "viewer" (project.groupId !== group.id, role="viewer")
    ↓
ProjectPage montata con userRole="viewer"
    ↓
- Nessun FAB visibile
- Kebab menu: solo "Info progetto"
- Tutti i BentoBox in modalità read-only
- Chat disponibile
```

### 4.3 Promozione a editor

```
Owner apre "Gestione condivisione"
    ↓
Vede Gruppo X con ruolo "viewer"
    ↓
Clicca dropdown → "Promuovi a editor"
    ↓
updateSharedGroupRole(projectId, groupId, "editor")
    ↓
Il gruppo X, alla prossima apertura del progetto, avrà ruolo "editor"
```

---

## 5. Problemi e Decisioni Aperte

### 5.1 Sincronizzazione ruolo in tempo reale

Se un owner cambia il ruolo di un gruppo mentre un membro di quel gruppo sta visualizzando il progetto, il `userProjectRole` in `App.jsx` è calcolato da `currentProject` che è stale (settato al momento del click).

**Soluzione**: In `ProjectPage`, aggiungere un `onSnapshot` sul documento del progetto corrente per ricevere aggiornamenti. Se il ruolo cambia, aggiornare lo stato della pagina (o reindirizzare alla home con messaggio).

### 5.2 Eliminazione progetto da gruppo condiviso

Se un owner elimina il progetto, i gruppi che lo avevano condiviso lo vedranno sparire dalla loro griglia (grazie al listener real-time). Non serve azione aggiuntiva.

Se un owner esce dal gruppo originale, il progetto rimane ma nessuno nel gruppo originale sarà più founder. Questo è un edge case già presente nel sistema dei gruppi (founder che lascia).

### 5.3 Rimozione da gruppo condiviso

Se un owner rimuove un gruppo condiviso (`removeSharedGroup`), `sharedGroupIds` e `sharedGroups` vengono aggiornati. Il listener del gruppo rimosso emetterà un update e la card sparirà dalla griglia.

### 5.4 `subscribeToGroupProjects` — due listener

I due listener (progetti propri + condivisi) possono emettere update in momenti diversi. Il merge lato client deve gestire lo stato in cui uno dei due non ha ancora risposto. Usare un ref per ciascun listener e mergiare solo quando entrambi hanno ricevuto il primo update.

### 5.5 Progetti esistenti senza `shareCode`

Generare il `shareCode` in modo lazy: la prima volta che `ProjectInfoModal` viene aperto su un progetto senza `shareCode`, chiamare `ensureProjectShareCode()`. In alternativa, uno script di migrazione one-time.

### 5.6 `isViewer` nei BentoBox — NoteBox e MarkdownBox

Se viewer, la textarea è disabled. Ma l'editor RichTextModal/NoteViewerModal si apre comunque al click → assicurarsi che aprire il modal in viewer mode mostri solo la visualizzazione (non l'editor).

### 5.7 Pulizia box vuoti per viewer

`cleanupEmptyBoxes()` non deve essere chiamata per i viewer (non hanno creato box). Già gestito se si condiziona la chiamata a `userRole === "owner" || userRole === "editor"`.

---

## 6. Ordine di Implementazione Consigliato

1. **`LinkIcon.jsx`** + export in `icons/index.js`
2. **`services/projects.js`**:
   - `generateProjectShareCode`, `ensureProjectShareCode`
   - `getProjectByShareCode`
   - Aggiornare `createProject` (aggiunge shareCode, sharedGroups, sharedGroupIds)
   - `requestJoinSharedProject`, `acceptSharedGroup`, `removeSharedGroup`, `updateSharedGroupRole`
   - Aggiornare `subscribeToGroupProjects` (due listener)
   - `subscribeToProject`
3. **`ProjectCard.jsx`**: aggiungere prop `isShared` e `sharedRole`, badge catena, stato pending
4. **`ProjectInfoModal.jsx`**: aggiungere sezione codice condivisione
5. **`JoinSharedProjectButton.jsx`** + aggiornamento `ProjectGrid.jsx`
6. **`ProjectShareModal.jsx`**
7. **`ProjectPage.jsx`**: aggiungere prop `userRole`, modificare kebab menu e FABs, aggiungere `ProjectShareModal`
8. **`App.jsx`**: calcolo `userProjectRole`, passare a `ProjectPage`
9. **BentoBox specifici**: aggiungere prop `isViewer` e modalità read-only (lavoro più lungo — uno alla volta)
10. **Test end-to-end** del flusso completo

---

## 7. Stima Complessità per Sezione

| Sezione                        | Complessità    | Note                          |
| ------------------------------ | -------------- | ----------------------------- |
| Data model + services          | Media          | Due listener da sincronizzare |
| ProjectCard pending/shared     | Bassa          | Solo UI                       |
| ProjectInfoModal shareCode     | Bassa          | Riuso CopyableInfoBox         |
| JoinSharedProjectButton + Grid | Bassa          | Riuso pattern esistente       |
| ProjectShareModal              | Media          | Logica accept/deny/promote    |
| ProjectPage viewer mode        | Bassa          | Condizioni su props           |
| App.jsx role computation       | Bassa          | Pura logica                   |
| BentoBox isViewer              | **Alta**       | 8 componenti da modificare    |
| Firestore rules                | Bassa          | Già permissive                |
| **TOTALE**                     | **Media-Alta** | ~4-6 sessioni                 |
