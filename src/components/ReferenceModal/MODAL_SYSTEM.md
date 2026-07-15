# Sistema Modale — Guida Completa

Questa guida spiega come funziona il sistema modale, come sono stati corretti i bug di navigazione, e come creare correttamente nuovi modali.

---

## Indice

1. [Architettura](#1-architettura)
2. [Modalità di apertura modale](#2-modalità-di-apertura-modale)
3. [Usare il componente `Modal` generico](#3-usare-il-componente-modal-generico)
4. [Creare un modale annidato (standalone)](#4-creare-un-modale-annidato-standalone)
5. [Usare `ModalContext` in un nuovo file](#5-usare-modalcontext-in-un-nuovo-file)
6. [Comportamento Back/Escape per tipo di modale](#6-comportamento-backescape-per-tipo-di-modale)
7. [Bug risolti — spiegazione tecnica](#7-bug-risolti--spiegazione-tecnica)

---

## 1. Architettura

Il sistema si compone di tre livelli:

```
ModalContext (src/contexts/ModalContext.jsx)
  └── gestisce: modalStack, Back/Escape, registrazione callback, popstateHandledRef
Modal.jsx (src/components/Modal/Modal.jsx)
  └── componente base UI: overlay, focus trap, scroll lock, gestione history
Componenti modali specifici
  └── ProfileModal, TextInputModal, ConfirmationModal, ChatModal, ecc.
```

Esistono **due canali di gestione** dei modali:

| Canale                       | Quando si usa                                | API                                       |
| ---------------------------- | -------------------------------------------- | ----------------------------------------- |
| **ModalStack** (`openModal`) | Modali globali definiti nel router           | `openModal(id, props)` / `closeModal()`   |
| **Modali annidati locali**   | Modali aperti dentro altri componenti/modali | `<Modal onClose={...} skipHistory={...}>` |

### Struttura interna di ModalContext

`ModalContext` mantiene tre strutture principali:

- **`modalStack`** (useState) — array dei modali globali aperti via `openModal`
- **`nestedCloseCallbacksRef`** (useRef array) — callback `onClose` dei modali con `skipHistory=false`
- **`skipHistoryCloseCallbacksRef`** (useRef array) — callback `onClose` dei modali con `skipHistory=true`
- **`popstateHandledRef`** (useRef bool) — flag interno usato in `handlePopState` per prevenire il doppio processamento di Back rapidi consecutivi. NON è coinvolto nella chiusura via Escape o X dei modali `skipHistory` (che usano `replaceState` e non scatenano `popstate`).

Entrambi i canali annidati (`nestedClose` e `skipHistoryClose`) aggiungono una entry nella history del browser quando il modale si apre. La differenza sta in **chi consuma quella entry** alla chiusura.

---

## 2. Modalità di apertura modale

### 2a. `skipHistory={false}` (default) — modale con history gestita via Back

Il modale aggiunge un'entry alla history (`history.pushState`). Il tasto Back del browser la consuma e chiude il modale. Escape chiama `history.back()` che porta allo stesso risultato.

**Usa quando:** il modale è l'azione principale dell'utente (es. `ProfileModal`).

```jsx
<Modal isOpen={isOpen} onClose={handleClose} title="Modifica profilo">
  {/* contenuto */}
</Modal>
```

**Flusso apertura/chiusura:**

1. `isOpen → true` → `Modal.jsx` chiama `history.pushState({ nestedModal: true })` (una volta, guardata da `hasAddedHistoryRef`) e `registerNestedClose(onClose)` → callback registrata in `nestedCloseCallbacksRef`
2. **Back** → `popstate` → `handlePopState` → pop `nestedCloseCallbacksRef` → chiama `onClose()`
3. **Escape** → `handleKeyDown` → `history.back()` → `popstate` → stessa strada del punto 2
4. **X / overlay click** → `handleClose` in `Modal.jsx` → `history.back()` → `popstate` → stessa strada
5. `isOpen → false` → cleanup effect: de-registra callback, reset `hasAddedHistoryRef`

---

### 2b. `skipHistory={true}` — modale con history gestita via `replaceState`

Anche questo tipo di modale aggiunge una entry alla history, ma usa un meccanismo di chiusura diverso per i casi "non-Back" (X, Escape): invece di `go(-1)`, chiama `history.replaceState` che è sincrono e non scatena `popstate`. È registrato in uno stack separato (`skipHistoryCloseCallbacksRef`).

**Usa quando:** il modale è un overlay secondario sopra un'altra pagina o un altro modale (es. `ChatModal`, `PersonalNotificationsModal`, `TextInputModal` aperta dentro `ProfileModal`).

```jsx
<Modal isOpen={isOpen} onClose={handleClose} title="Chat" skipHistory>
  {/* contenuto */}
</Modal>
```

**Flusso apertura/chiusura:**

1. `isOpen → true` → `Modal.jsx` chiama `history.pushState({ skipHistoryModal: true })` (una volta, guardata da `hasAddedSkipHistoryRef`) e `registerSkipHistoryClose(onClose)` → callback registrata in `skipHistoryCloseCallbacksRef`
2. **Back** → `popstate` → `handlePopState` vede `skipHistoryCloseCallbacksRef` non vuoto → chiama `onClose()` direttamente. L'entry è già stata consumata dal Back stesso — nessun ulteriore `pushState` necessario.
3. **Escape** → `handleKeyDown` in `ModalContext` → chiama `history.replaceState(null, "")` per neutralizzare la entry del punto 1 in-place (senza scatenare `popstate`), poi chiama `callback()` direttamente. Nessun flag `popstateHandledRef` coinvolto.
4. **X / overlay click** → `handleClose` in `Modal.jsx` → `hasAddedSkipHistoryRef = false`, `history.replaceState(null, "")` (neutralizza la entry in-place, senza `popstate`), poi chiama `onClose()`.
5. `isOpen → false` → cleanup effect: de-registra callback, reset `hasAddedSkipHistoryRef`

> **Perché `replaceState` e non `go(-1)` / `history.back()`?**
> `history.go(-1)` è asincrono: il `popstate` risultante arriva in un macrotask successivo. Usarlo richiedeva un flag `popstateHandledRef` con reset via `setTimeout(0)` per bloccare il `popstate`. In produzione, la race tra il reset del flag e l'arrivo del `popstate` portava a chiudere il modale padre invece di quello figlio (vedi **Bug 4**). `history.replaceState` è **sincrono** e **non scatena `popstate`**: elimina la race condition alla radice.

---

### 2c. `openModal(id, props)` — modale globale da ModalContext

Apre un modale registrato nel `modalStack` globale. Non richiede `onClose` locale.

```jsx
const { openModal, closeModal } = useModal();
openModal("confirm-delete", { itemName: "Documento" });
```

Non usato correntemente nei modali comuni dell'app (tutti usano il canale locale).

---

## 3. Usare il componente `Modal` generico

### Props

| Prop                | Tipo                             | Default           | Descrizione                                                     |
| ------------------- | -------------------------------- | ----------------- | --------------------------------------------------------------- |
| `isOpen`            | `bool`                           | —                 | Controlla visibilità                                            |
| `title`             | `string`                         | —                 | Titolo dell'header                                              |
| `onClose`           | `func`                           | —                 | Callback di chiusura (X, overlay, Back, Escape)                 |
| `skipHistory`       | `bool`                           | `false`           | Se `true`, registra in `skipHistoryCloseCallbacksRef`           |
| `variant`           | `"default"\|"info"`              | `"default"`       | `"info"` = rimuove pulsante Conferma                            |
| `confirmText`       | `string`                         | `"Conferma"`      | Testo pulsante Conferma                                         |
| `onConfirm`         | `func`                           | —                 | Callback al click Conferma                                      |
| `confirmVariant`    | `"primary"\|"danger"\|"success"` | `"primary"`       | Stile pulsante                                                  |
| `confirmDisabled`   | `bool`                           | `false`           | Disabilita pulsante Conferma                                    |
| `isLoading`         | `bool`                           | `false`           | Spinner loader nel pulsante Conferma                            |
| `showConfirmButton` | `bool`                           | `true`            | Mostra/nasconde pulsante Conferma                               |
| `zIndex`            | `number`                         | auto              | z-index personalizzato                                          |
| `maxWidth`          | `string`                         | `"max-w-[440px]"` | Classe Tailwind larghezza massima                               |
| `closeRef`          | `ref`                            | —                 | Ref che espone `handleClose` al parent (chiusura programmatica) |

### Esempio base (modale informativo)

```jsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Dettagli notifica"
  variant="info"
  skipHistory
>
  <p>Contenuto informativo...</p>
</Modal>
```

### Esempio con conferma

```jsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Elimina documento"
  confirmText="Elimina"
  confirmVariant="danger"
  onConfirm={handleDelete}
  isLoading={isDeleting}
>
  <p>Sei sicuro di voler eliminare questo documento?</p>
</Modal>
```

---

## 4. Creare un modale annidato (standalone)

I modali annidati sono componenti JSX indipendenti che wrappano `Modal`. Seguono sempre questo schema:

```jsx
// src/components/Modal/MioNuovoModal.jsx

function MioNuovoModal({ isOpen, onClose /* altri props */ }) {
  const [valore, setValore] = useState("");

  // Reset stato alla chiusura
  useEffect(() => {
    if (!isOpen) setValore("");
  }, [isOpen]);

  const handleConfirm = () => {
    // ... logica
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mio Modale"
      confirmText="Salva"
      onConfirm={handleConfirm}
      skipHistory // ← aggiungere se è un overlay secondario
    >
      <input value={valore} onChange={(e) => setValore(e.target.value)} />
    </Modal>
  );
}
```

### Regole pratiche

- **Non gestire** `history.pushState`, `history.back()` o `history.go()` manualmente nel componente: ci pensa `Modal.jsx`.
- **Non aggiungere** listener `keydown` per Escape: ci pensa `ModalContext`.
- **Usare `skipHistory={true}`** per tutti i modali che si aprono SOPRA altri modali già aperti, o che sono overlay secondari (chat, notifiche, confirm dialog).
- **Usare `skipHistory={false}` (default)** per modali di primo livello aperti direttamente da sidebar o bottoni di pagina (es. `ProfileModal`).
- **Passare sempre `onClose`**: è obbligatorio sia per la registrazione nel context che per il pulsante X.

### Dove renderizzare

Renderizzare il componente nel file dove si gestisce `isOpen` e la callback `onClose`. Se lo stato è in un context (es. `ToastContext`), renderizzare nel componente che usa quel context.

```jsx
// Sidebar.jsx
const { isPersonalNotificationsOpen, closePersonalNotificationsModal } =
  useToast();

return (
  <>
    {/* sidebar JSX */}
    <PersonalNotificationsModal
      isOpen={isPersonalNotificationsOpen}
      onClose={closePersonalNotificationsModal}
    />
  </>
);
```

---

## 5. Usare `ModalContext` in un nuovo file

```jsx
import { useModal } from "../contexts/ModalContext";
// oppure via barrel:
import { useModal } from "../contexts";
```

### API disponibile

```js
const {
  // --- Modali globali ---
  openModal, // (id: string, props?: object) => void
  closeModal, // () => void
  closeAllModals, // () => void
  closeTopModal, // () => bool — chiude il modale più in alto
  currentModal, // { id, props } | null
  modalStack, // array dei modali aperti
  modalDepth, // numero totale modali aperti (stack + annidati)
  isModalOpen, // (id: string) => bool
  getModalIndex, // (id: string) => number

  // --- Modali annidati (usato internamente da Modal.jsx) ---
  registerNestedClose, // (callback) => unregister — skipHistory=false
  registerSkipHistoryClose, // (callback) => unregister — skipHistory=true

  // --- Utilità ---
  hasNestedModals, // () => bool
  wasPopstateHandled, // () => bool — true se un popstate è appena stato gestito
} = useModal();
```

### Esempio: aprire un modale dal context globale

```jsx
function MyComponent() {
  const { openModal } = useModal();
  return (
    <button onClick={() => openModal("edit-user", { userId: "abc" })}>
      Modifica utente
    </button>
  );
}
```

---

## 6. Comportamento Back/Escape per tipo di modale

| Scenario                                     | Back (browser)                                         | Escape                |
| -------------------------------------------- | ------------------------------------------------------ | --------------------- |
| Nessun modale aperto                         | Navigazione normale React Router                       | Niente                |
| Modale `skipHistory=false`                   | Chiude il modale                                       | Chiude il modale      |
| Modale `skipHistory=true` standalone         | Chiude il modale, pagina resta                         | Chiude il modale      |
| `skipHistory=true` sopra `skipHistory=false` | Chiude il top (`skipHistory=true`), quello sotto resta | Chiude il top         |
| Due modali `skipHistory=false`               | Chiude il più recente                                  | Chiude il più recente |
| Due modali `skipHistory=true`                | Chiude il più recente                                  | Chiude il più recente |

**Regola principale:** Back e Escape chiudono sempre il modale più in alto (_top of stack_), qualunque sia il tipo.

---

## 7. Bug risolti — spiegazione tecnica

### Contesto

Il `ModalProvider` è montato **fuori** dal `BrowserRouter` (in `main.jsx`), che è invece dentro `App`. React Router 7 registra il proprio listener `popstate` per gestire la navigazione. Ogni modifica alla history condivide lo stesso bus di eventi, quindi le interazioni tra `ModalContext` e React Router devono essere gestite con attenzione.

React Router 7 traccia la posizione corrente nella history tramite `history.state.idx`. Se si chiama `window.history.pushState(statoSenzaIdx)`, React Router vede un `idx = null` al prossimo `popstate` e si de-sincronizza, causando comportamenti erratici (pagina che naviga via, modali che si chiudono inaspettatamente).

---

### Bug 1 — Escape e Back ignorati per modali `skipHistory=true`

**Problema:** tutti i modali con `skipHistory=true` (ChatModal, PersonalNotificationsModal, TextInputModal, ecc.) non erano registrati nel context. Escape chiamava `history.back()` → React Router navigava alla pagina precedente. Back faceva lo stesso.

**Fix:**

- Aggiunto `skipHistoryCloseCallbacksRef` e `registerSkipHistoryClose` in `ModalContext`.
- `Modal.jsx` chiama `registerSkipHistoryClose(onClose)` quando `skipHistory=true`.
- Il handler `handleKeyDown` controlla prima `skipHistoryCloseCallbacksRef` e chiama la callback direttamente senza toccare la history.

---

### Bug 2 — Back chiudeva il modale sbagliato con modali annidati misti

**Problema:** Con `ProfileModal` (skipHistory=false) aperto e `TextInputModal` sopra (skipHistory=true), premere Back consumava la entry di `ProfileModal` → `handlePopState` trovava la callback di ProfileModal in `nestedCloseCallbacksRef` → chiudeva ProfileModal lasciando TextInputModal aperta.

**Fix:** `handlePopState` controlla **prima** `skipHistoryCloseCallbacksRef`. Se c'è un modale skipHistory in cima, chiude quello, non il modale sotto.

---

### Bug 3 — Back navigava fuori dalla pagina con modale `skipHistory=true` standalone

**Problema:** PersonalNotificationsModal e ChatModal non avevano entry nella history (skipHistory=true non faceva pushState). Premendo Back, `handlePopState` chiamava `onClose()`, ma React Router processava lo stesso `popstate` e navigava alla pagina precedente.

**Tentativo fallito:** aggiungere un `history.pushState({ modalId: "restored" })` dentro `handlePopState` dopo aver chiamato la callback. Questo ripristinava l'URL, ma lo stato pushato non aveva il campo `idx` che React Router 7 usa per calcolare i delta di navigazione (`history.state.idx`). Risultato: React Router si de-sincronizzava e i modali si chiudevano all'apertura o causavano navigazioni spurie.

**Fix corretto:**

- Anche i modali `skipHistory=true` aggiungono una entry alla history quando si aprono, **in `Modal.jsx`**, guardata da `hasAddedSkipHistoryRef` (per evitare double-push in React StrictMode):

```js
// Modal.jsx — effect per skipHistory=true
if (!hasAddedSkipHistoryRef.current) {
  window.history.pushState({ skipHistoryModal: true }, "");
  hasAddedSkipHistoryRef.current = true;
}
const unregister = registerSkipHistoryClose(onClose);
```

- `handlePopState` non fa più alcun `pushState` aggiuntivo: la entry è già lì, Back la consuma, la callback chiude il modale.
- Alla chiusura via **X** (`handleClose` in Modal.jsx): `history.go(-1)` rimuoveva la entry prima di chiamare `onClose()`. Il `popstate` risultante arrivava con lo stack già vuoto → nessuna chiusura doppia. _(In produzione questa soluzione ha esposto una race condition — vedi **Bug 4**.)_
- Alla chiusura via **Escape** (`handleKeyDown` in ModalContext): `popstateHandledRef = true`, poi `callback()`, poi `history.go(-1)`. Il `popstate` risultante veniva bloccato dall'early-return in `handlePopState`:

```js
const handlePopState = () => {
  // Escape già ha gestito la chiusura via go(-1): ignora questo popstate.
  if (popstateHandledRef.current) return;
  // ...
};
```

_(In produzione questa soluzione ha esposto una race condition — vedi **Bug 4**.)_

- `go(-1)` NON viene chiamato nel cleanup dell'effect perché React StrictMode esegue cleanup + remount anche senza una chiusura reale, il che causerebbe una navigazione spuria in development.

---

### Perché `pushState({ skipHistoryModal: true })` non corrompe React Router?

React Router legge `history.state.idx` solo al momento di un `popstate`. Quando `Modal.jsx` chiama `pushState({ skipHistoryModal: true })`, React Router non intercetta quel `pushState` (non ha un listener su di esso). React Router aggiorna il proprio `index` in memoria solo all'interno del suo `push()` wrapper. Quando arriva il successivo `popstate` (da Back o `go(-1)`), React Router legge `idx` dallo stato **precedente** (quello a cui si è tornati), che è sempre un indice valido impostato da React Router stesso. La entry con `{ skipHistoryModal: true }` viene semplicemente "saltata" senza mai causare un `popstate`, perché viene sempre neutralizzata da `history.replaceState` (o consumata da Back) prima che l'utente possa tornarci manualmente.

---

---

### Bug 4 — Race condition in produzione: Escape/X su modale `skipHistory` chiudeva il modale padre

**Problema:** Dopo il fix del Bug 3, in una build di produzione (Firebase Hosting), la chiusura via X o Escape di un modale `skipHistory` secondario (es. `AddReasonModal` aperto dentro `DdtFormModal`) chiudeva l'intero `DdtFormModal` invece di solo il modale secondario. Non riproducibile su `localhost` con Vite dev server.

**Causa:** Il meccanismo del Bug 3 usava `go(-1)` + `popstateHandledRef`. La sequenza era:

1. Escape/X chiama: `popstateHandledRef.current = true` + `setTimeout(() => { popstateHandledRef.current = false; }, 0)` + `history.go(-1)`.
2. `setTimeout(0)` è un **macrotask**: entra nella coda dei macrotask.
3. Il `popstate` generato da `go(-1)` è **anch'esso asincrono**: entra nella stessa coda.

In `localhost`, l'overhead di HMR di Vite era sufficiente perché `popstateHandledRef.current` fosse ancora `true` quando arrivava il `popstate` → `handlePopState` restituiva subito → corretto.

In **produzione** (build ottimizzata, nessun HMR), il `setTimeout(0)` veniva elaborato **prima** del `popstate`. Quando il `popstate` arrivava: il flag era già `false`, `skipHistoryCloseCallbacksRef` era vuota (React aveva già eseguito il cleanup dell'effect), quindi `handlePopState` scorreva allo step successivo e trovava la callback di `DdtFormModal` in `nestedCloseCallbacksRef` → la chiamava → chiudeva il modale padre.

**Fix:**

Sostituire `go(-1)` con `history.replaceState(null, "")` sia in `Modal.jsx` (`handleClose`) che in `ModalContext.jsx` (Escape handler per `skipHistory`):

```js
// PRIMA (race condition in produzione):
markPopstateHandled(); // popstateHandledRef = true + setTimeout(0)
history.go(-1); // async popstate, gara con il setTimeout

// DOPO (corretto):
window.history.replaceState(null, ""); // sincrono, nessun popstate emesso
onClose();
```

`replaceState` modifica la entry corrente in-place: il browser aggiorna lo stato della history entry senza generare alcun `popstate`. La race condition è strutturalmente impossibile.

---

## Riepilogo rapido: quale `skipHistory` usare?

```
Il mio modale si apre direttamente da un click nella sidebar/pagina?
  → skipHistory={false}  (default)

Il mio modale si apre DENTRO un altro modale già aperto?
  → skipHistory={true}

Il mio modale è un overlay secondario (chat, notifiche, confirm dialog)?
  → skipHistory={true}
```
