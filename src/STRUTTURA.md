# Struttura Cartella `src/`

## File Principali

| File        | Descrizione                            |
| ----------- | -------------------------------------- |
| `main.jsx`  | Entry point React                      |
| `App.jsx`   | Componente root con providers          |
| `index.css` | Tailwind + variabili tema + animazioni |

---

## `components/`

### `auth/`

| File            | Descrizione                |
| --------------- | -------------------------- |
| `AuthModal.jsx` | Modale login/registrazione |
| `index.js`      | Export pubblici            |

### `bento/` - Sistema Bento Box

| File                    | Descrizione                                   |
| ----------------------- | --------------------------------------------- |
| `BaseBentoBox.jsx`      | Componente base per tutti i tipi di box       |
| `NoteBox.jsx`           | Box per note testuali                         |
| `PhotoBox.jsx`          | Box per foto con carosello e ImageModal       |
| `PdfBox.jsx`            | Box per PDF con anteprima e carosello         |
| `FileBox.jsx`           | Box per file generici con icone per tipo      |
| `ChecklistBox.jsx`      | Box per liste di task con checkbox            |
| `AnagraficaBox.jsx`     | Box per dati cliente con campi strutturati    |
| `TutorialBox.jsx`       | Box tutorial (primo avvio)                    |
| `AddBentoBoxButton.jsx` | Griglia 2x2 per aggiungere box + MobileAddFab |
| `CameraFab.jsx`         | FAB per scattare foto (mobile)                |
| `BentoGrid.jsx`         | Container griglia principale                  |
| `BentoBox.jsx`          | Box semplice generico                         |
| `bentoConstants.js`     | Costanti (altezze preset)                     |
| `useBentoLayout.js`     | Hook legacy (non usato)                       |
| `BENTO_BOX.md`          | Documentazione dettagliata sistema Bento      |
| `index.js`              | Export pubblici                               |

### `form/` - Componenti Form Standard

| File                | Descrizione                          |
| ------------------- | ------------------------------------ |
| `TextField.jsx`     | Input testo con label/hint/error     |
| `PasswordField.jsx` | Input password con toggle visibilità |
| `TextArea.jsx`      | Textarea multilinea                  |
| `InfoField.jsx`     | Campo di sola lettura (semplice)     |
| `FormField.jsx`     | Container per un campo               |
| `FormSection.jsx`   | Raggruppa campi con titolo           |
| `FormLabel.jsx`     | Etichetta campo                      |
| `FormHint.jsx`      | Testo aiuto sotto campo              |
| `FormError.jsx`     | Messaggio errore (inline/box)        |
| `FormDivider.jsx`   | Linea separatrice (interna form)     |
| `index.js`          | Export pubblici                      |

### `groups/` - Sistema Gruppi

| File                    | Descrizione                                       |
| ----------------------- | ------------------------------------------------- |
| `GroupCard.jsx`         | Card espandibile con griglia progetti             |
| `GroupInfoModal.jsx`    | Modale info gruppo (nome, codice, membri, azioni) |
| `CreateGroupButton.jsx` | Tasto con sfondo colorato per creare gruppo       |
| `JoinGroupButton.jsx`   | Tasto tratteggiato per unirsi a un gruppo         |
| `EmptyGroupsCard.jsx`   | Card tutorial per stato vuoto (no gruppi)         |
| `index.js`              | Export pubblici                                   |

### `projects/` - Sistema Progetti

| File                      | Descrizione                                         |
| ------------------------- | --------------------------------------------------- |
| `ProjectCard.jsx`         | Card progetto quadrata con icona stato e colore     |
| `ProjectGrid.jsx`         | Griglia progetti (3 col mobile, 4 tablet, 5 desk)   |
| `CreateProjectButton.jsx` | Tasto + per creare progetto                         |
| `ProjectInfoModal.jsx`    | Modale info progetto (nome, creatore, data, colore) |
| `StatusModal.jsx`         | Modale gestione stato con slider e elimina          |
| `index.js`                | Export pubblici                                     |

### `modal/` - Sistema Modale

| File                  | Descrizione                                             |
| --------------------- | ------------------------------------------------------- |
| `Modal.jsx`           | Modale principale (mobile fullscreen, desktop centrato) |
| `ModalHeader.jsx`     | Header con titolo e tasto chiudi                        |
| `ModalFooter.jsx`     | Footer con bottone conferma (desktop)                   |
| `ModalFab.jsx`        | FAB conferma fluttuante (mobile)                        |
| `ConfirmModal.jsx`    | Modale di conferma con box colorata                     |
| `InputModal.jsx`      | Modale di input con validazione e exactLength           |
| `UploadModal.jsx`     | Modale upload foto con drag & drop e preview            |
| `PdfUploadModal.jsx`  | Modale upload PDF con drag & drop                       |
| `FileUploadModal.jsx` | Modale upload file generici                             |
| `ImageModal.jsx`      | Visualizzatore immagini fullscreen con toolbar          |
| `MoreBoxesModal.jsx`  | Modale per selezionare altri tipi di box                |
| `index.js`            | Export pubblici                                         |

### `profile/` - Componenti Profilo

| File               | Descrizione           |
| ------------------ | --------------------- |
| `ProfileModal.jsx` | Modale profilo utente |
| `index.js`         | Export pubblici       |

### `pwa/` - Componenti PWA

| File               | Descrizione                                     |
| ------------------ | ----------------------------------------------- |
| `InstallModal.jsx` | Modale per installare l'app (istruzioni per OS) |
| `index.js`         | Export pubblici                                 |

### `ui/` - Componenti UI Base

| File                     | Descrizione                                           |
| ------------------------ | ----------------------------------------------------- |
| `Button.jsx`             | Bottone con varianti/sizes e stato disabilitato       |
| `Input.jsx`              | Input base                                            |
| `PasswordInput.jsx`      | Password base con toggle                              |
| `Spinner.jsx`            | Indicatore caricamento                                |
| `ThemeSwitcher.jsx`      | Toggle tema chiaro/scuro (tondo)                      |
| `ColorPicker.jsx`        | Selettore colore accent (6 colori)                    |
| `ThemeSelector.jsx`      | Combinato: ColorPicker + ThemeSwitcher                |
| `InfoBox.jsx`            | Box info con stile (supporta titleExtra)              |
| `EditableInfoBox.jsx`    | InfoBox con tasto modifica (matita) centrato          |
| `CopyableInfoBox.jsx`    | InfoBox con tasto copia (clipboard) centrato          |
| `MemberPillList.jsx`     | Lista pillole membri (Tu/founder/altri differenziati) |
| `DangerButton.jsx`       | Tasto pericoloso con conferma prima di azione         |
| `Divider.jsx`            | Linea divisoria (non arriva ai bordi)                 |
| `StatusSlider.jsx`       | Slider stati progetto con barra gradient              |
| `ProjectColorPicker.jsx` | Griglia 4x3 colori progetto (12 colori)               |
| `DropdownMenu.jsx`       | Menu dropdown posizionabile (per kebab menu)          |
| `index.js`               | Export pubblici                                       |

### `icons/` - Icone (wrapper lucide-react)

Wrapper React per icone lucide-react che garantiscono consistenza nell'utilizzo.

| File                      | Descrizione                     |
| ------------------------- | ------------------------------- |
| `AlertCircleIcon.jsx`     | Icona alert cerchio             |
| `AlertTriangleIcon.jsx`   | Icona alert triangolo           |
| `ArchiveIcon.jsx`         | Archivio                        |
| `ArrowLeftIcon.jsx`       | Freccia indietro                |
| `CameraIcon.jsx`          | Fotocamera                      |
| `CheckIcon.jsx`           | Spunta                          |
| `CheckCircleIcon.jsx`     | Spunta in cerchio (completato)  |
| `ChevronDownIcon.jsx`     | Freccia giù                     |
| `ChevronLeftIcon.jsx`     | Freccia sinistra                |
| `ChevronRightIcon.jsx`    | Freccia destra                  |
| `CloseIcon.jsx`           | X chiudi                        |
| `CodeIcon.jsx`            | Codice sorgente                 |
| `CopyIcon.jsx`            | Copia clipboard                 |
| `CrownIcon.jsx`           | Corona (founder)                |
| `DownloadIcon.jsx`        | Download                        |
| `EyeIcon.jsx`             | Occhio (mostra)                 |
| `EyeOffIcon.jsx`          | Occhio barrato (nascondi)       |
| `FileArchiveIcon.jsx`     | File archivio compresso         |
| `FileSpreadsheetIcon.jsx` | File foglio di calcolo          |
| `FileTextIcon.jsx`        | File documento                  |
| `FileTypeIcon.jsx`        | File generico                   |
| `FolderIcon.jsx`          | Cartella                        |
| `IdCardIcon.jsx`          | Carta d'identità (cod. fiscale) |
| `ImageIcon.jsx`           | Immagine                        |
| `InfoIcon.jsx`            | Info cerchio                    |
| `ListChecksIcon.jsx`      | Lista checklist                 |
| `LogOutIcon.jsx`          | Logout                          |
| `MailIcon.jsx`            | Email                           |
| `MapPinIcon.jsx`          | Segnaposto mappa                |
| `MoonIcon.jsx`            | Luna (tema scuro)               |
| `MoreHorizontalIcon.jsx`  | Tre puntini orizzontali         |
| `MoreVerticalIcon.jsx`    | Tre puntini verticali (kebab)   |
| `MusicIcon.jsx`           | Audio/musica                    |
| `PencilIcon.jsx`          | Matita (modifica)               |
| `PercentIcon.jsx`         | Percentuale (IVA)               |
| `PhoneIcon.jsx`           | Telefono                        |
| `PinIcon.jsx`             | Pin/fissato                     |
| `PlayIcon.jsx`            | Play (in corso)                 |
| `PlusIcon.jsx`            | Più                             |
| `PresentationIcon.jsx`    | Presentazione                   |
| `RotateCwIcon.jsx`        | Ruota in senso orario           |
| `RulerIcon.jsx`           | Righello (file 3D)              |
| `SettingsIcon.jsx`        | Ingranaggio                     |
| `SunIcon.jsx`             | Sole (tema chiaro)              |
| `TrashIcon.jsx`           | Cestino                         |
| `UploadIcon.jsx`          | Upload                          |
| `UserIcon.jsx`            | Utente singolo                  |
| `UserPlusIcon.jsx`        | Aggiungi utente                 |
| `UsersIcon.jsx`           | Utenti                          |
| `VideoIcon.jsx`           | Video                           |
| `ZapIcon.jsx`             | Fulmine (azione rapida)         |
| `index.js`                | Export pubblici                 |

---

## `contexts/`

| File               | Descrizione                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| `AuthContext.jsx`  | Stato autenticazione utente con Firebase Auth                               |
| `ModalContext.jsx` | Stack modali + gestione history + modali annidati (nested callbacks)        |
| `ThemeContext.jsx` | Tema (chiaro/scuro) + colore accent + aggiornamento variabili CSS dinamiche |

### AuthContext

**Stato fornito:**

```javascript
{
  user: object | null,           // Utente Firebase corrente
  isAuthenticated: boolean,      // true se user esiste
  loading: boolean,              // true durante verifica iniziale
  updateUsername: (name) => {}   // Funzione per aggiornare displayName
}
```

### ModalContext

**Funzioni principali:**

```javascript
{
  modalStack: array,                        // Stack modali aperti
  currentModal: object | null,              // Modale in cima allo stack
  openModal: (id, props) => {},             // Apre modale e aggiunge a history
  closeModal: () => {},                     // Chiude modale in cima
  closeAllModals: () => {},                 // Chiude tutti i modali
  registerNestedClose: (callback) => {},    // Registra callback per modali annidati
  closeTopModal: () => {}                   // Chiude modale annidato o normale
}
```

**Gestione History:**

- Ogni `openModal()` esegue `history.pushState()`
- Evento `popstate` chiama automaticamente la callback appropriata
- Supporta tasto indietro browser e Android
- Gestisce ESC su desktop

**Modali Annidati:**

- Usa `nestedCloseCallbacksRef` per stack locale
- Modali annidati non entrano in `modalStack`
- `closeTopModal()` chiude prima annidati, poi normali

### ThemeContext

**Stato fornito:**

```javascript
{
  theme: 'light' | 'dark',                  // Tema corrente
  accentColor: string,                      // ID colore accent ('teal', 'blue', ...)
  isDark: boolean,                          // true se tema scuro
  toggleTheme: () => {},                    // Cambia tra light e dark
  setAccentColor: (color) => {}             // Imposta colore accent
}
```

**Persistenza:**

- `localStorage.getItem('scaletta-theme-mode')`
- `localStorage.getItem('scaletta-accent-color')`

**Variabili CSS:**

- Aggiorna `document.documentElement.style` quando cambia tema/colore
- Es: `--theme-primary`, `--theme-bg-primary`, `--theme-text-primary`

---

## `hooks/`

| File                   | Descrizione                                                                      |
| ---------------------- | -------------------------------------------------------------------------------- |
| `useBentoAnimation.js` | Layout Bento + animazioni FLIP + distribuzione "shortest column first" + fade-in |
| `useColumnCount.js`    | Calcola colonne responsive (1-4) in base a larghezza viewport                    |
| `useIsMobile.js`       | Rileva viewport mobile (<768px) con debounce                                     |
| `useKeyboardHeight.js` | Altezza tastiera virtuale (mobile) usando visualViewport API                     |
| `usePWAInstall.js`     | Gestione installazione PWA (beforeinstallprompt, isInstalled, device detection)  |

### useBentoAnimation

**Parametri:**

```javascript
useBentoAnimation(items, columnCount, (gap = 16));
```

- `items`: Array con `.id` univoco
- `columnCount`: Numero colonne (1-4)
- `gap`: Gap tra box in px

**Return:**

```javascript
{
  containerRef: ref,          // Ref da applicare al container
  columns: array[],           // Array di colonne (ogni colonna = array di items)
  getItemStyle: (id) => {}    // Funzione per ottenere stile item (opacity per fade-in)
}
```

**Algoritmo:**

1. **ResizeObserver**: Monitora altezze di ogni box (threshold 2px)
2. **Distribuzione**: "Shortest column first" - ogni box va nella colonna più corta
3. **FLIP Animation**: First-Last-Invert-Play per transizioni fluide
4. **Fade-in**: Nuovi box iniziano con `opacity: 0`, poi fade-in 300ms

### useColumnCount

**Breakpoints:**

```javascript
< 640px:   1 colonna   // Mobile
640-1023:  2 colonne   // Tablet
1024-1343: 3 colonne   // Desktop
≥ 1344px:  4 colonne   // Large desktop
```

### usePWAInstall

**Return:**

```javascript
{
  isInstallable: boolean,     // beforeinstallprompt disponibile
  isInstalled: boolean,       // display-mode = standalone
  install: () => {},          // Triggera prompt installazione
  deviceInfo: {               // Info dispositivo
    isIOS: boolean,
    isAndroid: boolean,
    isDesktop: boolean
  }
}
```

---

## `pages/`

| File              | Descrizione                                                       |
| ----------------- | ----------------------------------------------------------------- |
| `WelcomePage.jsx` | Pagina iniziale (non autenticato) con logo e tasti login/register |
| `Dashboard.jsx`   | Pagina principale (autenticato) con lista gruppi e progetti       |
| `ProjectPage.jsx` | Pagina singolo progetto con header colorato e BentoGrid           |
| `LoadingPage.jsx` | Schermata caricamento con spinner                                 |
| `index.js`        | Export pubblici                                                   |

---

## `services/`

| File          | Descrizione                                                            |
| ------------- | ---------------------------------------------------------------------- |
| `config.js`   | Configurazione Firebase (initializeApp)                                |
| `auth.js`     | Funzioni auth: login, register, logout, updateUsername                 |
| `groups.js`   | CRUD gruppi: create, join, leave, delete (con cascade progetti e foto) |
| `projects.js` | CRUD progetti + bento boxes + eliminazione foto automatica             |
| `photos.js`   | Upload/delete foto Firebase Storage con progress callback              |
| `pdfs.js`     | Upload/delete PDF Firebase Storage con progress callback               |
| `files.js`    | Upload/delete file generici Firebase Storage                           |

### groups.js

**Funzioni principali:**

```javascript
createGroup(name, creator); // Crea gruppo con codice 8 char univoco
getGroupByCode(code); // Trova gruppo tramite codice
joinGroup(code, user); // Unisciti a gruppo
getUserGroups(userId); // Ottieni gruppi utente (filtra membri)
subscribeToUserGroups(userId, callback); // Real-time listener
updateGroupName(groupId, newName); // Modifica nome
leaveGroup(groupId, userId); // Esci da gruppo
deleteGroup(groupId); // Elimina gruppo + progetti + foto (cascade)
```

**Codice gruppo:**

- 8 caratteri alfanumerici (A-Z, 0-9)
- Generato random
- Univoco (verifica esistenza)
- Max 10 tentativi

**Eliminazione cascade:**

1. Trova tutti i progetti del gruppo
2. Per ogni progetto: elimina foto da Storage + documento Firestore
3. Elimina documento gruppo

### projects.js

**Funzioni principali:**

```javascript
getRandomAvailableColor(groupId); // Colore random non usato
createProject(name, groupId, creator); // Crea progetto con colore auto
getProjectsByGroup(groupId); // Lista progetti ordinati
getProjectById(projectId); // Singolo progetto
subscribeToProject(projectId, callback); // Real-time listener
updateProjectName(projectId, newName); // Modifica nome
updateProjectColor(projectId, color); // Modifica colore
updateProjectStatus(projectId, status); // Modifica stato
deleteProject(projectId); // Elimina con foto Storage

// Bento Boxes
subscribeToBentoBoxes(projectId, callback); // Real-time listener
createBentoBox(projectId, boxData); // Crea box
updateBentoBoxTitle(projectId, boxId, title);
updateBentoBoxContent(projectId, boxId, content);
updateBentoBoxPhotos(projectId, boxId, photos);
deleteBentoBox(projectId, boxId); // Elimina box
deleteProjectWithContents(projectId); // Elimina tutto (usata da groups.js)
```

**Ordinamento progetti:**

1. Per stato: in-corso (0) → completato (1) → archiviato (2) → cestinato (3)
2. Per data: più recenti prima

### photos.js

**Funzioni:**

```javascript
uploadPhoto(projectId, file, onProgress); // Upload singolo con callback progress
uploadPhotos(projectId, files, onProgress, onPhotoUploaded); // Upload multiplo
deletePhoto(storagePath); // Elimina singola
deletePhotos(photos); // Elimina multiple
validateImageFile(file); // Valida formato/dimensione
```

**Validazione:**

- Formati: JPG, PNG, GIF, WebP, SVG
- Max: 10MB

**Progress:**

- Callback chiamata con percentuale 0-100
- Upload multiplo: progress = media dei singoli upload

### pdfs.js / files.js

Struttura simile a `photos.js` ma per PDF (max 50MB) e file generici (max 50MB).

---

## `utils/`

| File                   | Descrizione                                                             |
| ---------------------- | ----------------------------------------------------------------------- |
| `authValidation.js`    | Validazione email/password/username                                     |
| `groupValidation.js`   | Validazione nome gruppo (2-50 char) e codice (8 char alfanum maiuscolo) |
| `projectValidation.js` | Validazione nome progetto (2-50 char)                                   |
| `projectColors.js`     | Definizione 12 colori progetto (light/dark) + ordine griglia 4x3        |
| `projectStatuses.js`   | Definizione 4 stati progetto con icone, colori, priorità                |

### authValidation.js

```javascript
validateEmail(email); // Verifica formato email
validatePassword(password); // Min 6 caratteri
validateUsername(username); // Min 2 caratteri
validateLoginForm(email, password); // Entrambi non vuoti
validateRegisterForm(email, password, confirmPassword, username);
```

### projectColors.js

**12 colori organizzati in griglia 4x3:**

```javascript
PROJECT_COLOR_ORDER = [
  ["blue", "purple", "teal", "green"], // Riga 1
  ["orange", "red", "pink", "indigo"], // Riga 2
  ["yellow", "cyan", "emerald", "rose"], // Riga 3
];
```

Ogni colore ha:

- `id`: stringa identificativa
- `light`: valore hex per tema chiaro (tone 40 Material Design 3)
- `dark`: valore hex per tema scuro (tone 80)

### projectStatuses.js

**4 stati con priorità ordinamento:**

```javascript
{
  'in-corso': { priority: 0, label: 'In corso', icon: Play, color: 'green' },
  'completato': { priority: 1, label: 'Completato', icon: CheckCircle, color: 'blue' },
  'archiviato': { priority: 2, label: 'Archiviato', icon: Archive, color: 'purple' },
  'cestinato': { priority: 3, label: 'Cestinato', icon: Trash, color: 'red' }
}
```

Default: `'in-corso'`

---

## Sistema Tema

Il tema è gestito da `ThemeContext`:

- **6 colori accent**: teal, blue, purple, red, orange, green
- **2 temi**: light e dark
- I colori variano in base al tema (Material Design 3: tone 40 light, tone 80 dark)
- Preferenze salvate in localStorage

```jsx
import { useTheme } from "../contexts/ThemeContext";

const MioComponente = () => {
  const { theme, toggleTheme, accentColor, setAccentColor, isDark } =
    useTheme();
  // ...
};
```

---

## Colori InfoBox e Pillole

I componenti `InfoBox`, `EditableInfoBox`, `CopyableInfoBox` e `MemberPillList` supportano colori con varianti light/dark:

```jsx
// Colori disponibili
const colors = ["teal", "blue", "purple", "red", "orange", "green", "gray"];

// Esempio
<InfoBox title="Email" color="blue">
  <span>utente@email.com</span>
</InfoBox>;
```

Ogni colore ha:

- `bg`: Sfondo leggero (`bg-{color}-500/10` light, `bg-{color}-500/15` dark)
- `border`: Bordo colorato (`border-{color}-600/25` light, `border-{color}-500/30` dark)
- `text`: Testo colorato (`text-{color}-700` light, `text-{color}-400` dark)

---

## Linee Guida Stile UI

### Principi Generali

1. **Riquadri con colore leggero** - Usa InfoBox per dati readonly con sfondo colorato leggero
2. **Bordi arrotondati** - `rounded-xl` (12px) per box, `rounded-full` per toggle/icone
3. **Spaziatura coerente** - `gap-4` tra elementi, `p-4` padding interno
4. **Divisori sottili** - `Divider` per separare sezioni logiche
5. **Bottoni azione in fondo** - Azioni pericolose con `DangerButton` in fondo al modale
6. **Testo centrato indipendente** - In EditableInfoBox/CopyableInfoBox il testo è centrato rispetto al riquadro, non influenzato dal tasto

### Stato Disabilitato

Tutti i bottoni quando disabilitati:

- **Colore**: Sfondo grigio (`bg-divider`), testo sfumato (`text-text-muted`)
- **Cursore**: Normale (non `not-allowed`)
- **Interazione**: Non cliccabile (`pointer-events-none`)

```jsx
// Il Button gestisce automaticamente lo stato disabilitato
<Button disabled={!isValid}>Conferma</Button>

// ModalFab e ModalFooter ereditano lo stesso stile
<Modal confirmDisabled={!value}>...</Modal>
```

---

## Struttura GroupInfoModal

```jsx
<Modal title="Info Gruppo" variant="info">
  <EditableInfoBox title="Nome gruppo" value={name} color="purple" onEdit={...} />
  <CopyableInfoBox title="Codice gruppo" value={code} color="blue" />
  <InfoBox title="Data creazione" color="gray">...</InfoBox>
  <InfoBox title="Membri" titleExtra="(3)" color="teal">
    <MemberPillList members={...} currentUserId={...} founderId={...} />
  </InfoBox>
  <Divider spacing="sm" />
  <DangerButton>Elimina/Esci gruppo</DangerButton>
</Modal>
```

---

## MemberPillList - Stili Differenziati

```jsx
// Ordine visualizzazione: Tu prima, poi founder, poi altri

// Se Tu sei il founder
<pill amber crown>Tu</pill>

// Se Tu NON sei founder
<pill primary ring user-icon>Tu</pill>
<pill amber crown>NomeFounder</pill>

// Altri membri
<pill gray>NomeMembro</pill>
```

---

## Modali Annidati

### Pattern Implementativo

```jsx
const ParentModal = ({ isOpen }) => {
  const [isChildOpen, setIsChildOpen] = useState(false);

  return (
    <>
      <Modal isOpen={isOpen} zIndex={isChildOpen ? 990 : 1000}>
        <div className={isChildOpen ? "blur-sm pointer-events-none" : ""}>
          {/* Contenuto */}
          <button onClick={() => setIsChildOpen(true)}>Modifica</button>
        </div>
      </Modal>

      <InputModal
        isOpen={isChildOpen}
        zIndex={1010}
        onConfirm={handleSave}
        onClose={() => setIsChildOpen(false)}
      />
    </>
  );
};
```

### Regole

1. **z-Index**: Padre < Figlio (es. 990 vs 1010)
2. **Blur**: Applica `blur-sm pointer-events-none` al contenuto del padre
3. **onClose**: Sempre passare callback per gestione history
4. **skipHistory**: Usa `skipHistory={true}` per modali "volatili" sopra altri modali (es. ConfirmModal sopra ImageModal)

### skipHistory - Modali Volatili

Per modali che si aprono sopra altri modali senza aggiungere entry alla history:

```jsx
// ImageModal aperto → ConfirmModal si apre sopra
<ConfirmModal
  isOpen={isDeleteConfirmOpen}
  zIndex={2100}
  skipHistory={true} // Non aggiunge entry alla history
  onCancel={() => setIsDeleteConfirmOpen(false)}
  onConfirm={handleDelete}
/>
```

**Comportamento con skipHistory:**

- Il modale si chiude direttamente tramite callback, senza `history.back()`
- Il modale padre (es. ImageModal) rimane aperto
- Utile per conferme rapide che non devono interferire con la navigazione

---

## PWA (Progressive Web App)

### File in `public/`

| File                     | Descrizione                |
| ------------------------ | -------------------------- |
| `manifest.json`          | Manifest PWA               |
| `sw.js`                  | Service Worker             |
| `favicon.svg/ico`        | Icone favicon              |
| `apple-touch-icon.png`   | Icona iOS                  |
| `web-app-manifest-*.png` | Icone PWA 192x192, 512x512 |

### Hook `usePWAInstall`

```jsx
const { isInstallable, isInstalled, install, deviceInfo } = usePWAInstall();
```

### InstallModal

Mostra istruzioni specifiche per dispositivo (iOS manual, Android/Desktop direct se disponibile).
