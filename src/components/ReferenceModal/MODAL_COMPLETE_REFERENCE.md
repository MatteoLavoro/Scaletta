# Sistema Modale — Riferimento Completo

Documentazione tecnica esaustiva del sistema modale: architettura, context, componente base, componenti derivati, gestione della history del browser, comportamento mobile/desktop, accessibilità e pattern di utilizzo.

---

## Indice

1. [Panoramica e architettura](#1-panoramica-e-architettura)
2. [ModalContext](#2-modalcontext)
   - 2.1 [Stato interno](#21-stato-interno)
   - 2.2 [API esposta](#22-api-esposta)
   - 2.3 [Gestione Escape e Back](#23-gestione-escape-e-back)
   - 2.4 [Come usare `useModal`](#24-come-usare-usemodal)
3. [Componente `Modal` (base)](#3-componente-modal-base)
   - 3.1 [Props](#31-props)
   - 3.2 [Struttura interna](#32-struttura-interna)
   - 3.3 [Gestione z-index](#33-gestione-z-index)
   - 3.4 [Scroll lock](#34-scroll-lock)
   - 3.5 [Focus trap](#35-focus-trap)
   - 3.6 [Comportamento mobile vs desktop](#36-comportamento-mobile-vs-desktop)
   - 3.7 [Gestione history: `skipHistory`](#37-gestione-history-skiphistory)
4. [ModalHeader](#4-modalheader)
5. [ModalFooter](#5-modalfooter)
6. [ModalFab](#6-modalfab)
7. [Componente `ConfirmationModal`](#7-componente-confirmationmodal)
   - 7.1 [Props](#71-props)
   - 7.2 [Design e varianti](#72-design-e-varianti)
   - 7.3 [Esempi](#73-esempi)
8. [Componente `TextInputModal`](#8-componente-textinputmodal)
   - 8.1 [Props](#81-props)
   - 8.2 [Logica di validazione](#82-logica-di-validazione)
   - 8.3 [Character counter](#83-character-counter)
   - 8.4 [Esempi](#84-esempi)
9. [Canali di apertura modale](#9-canali-di-apertura-modale)
   - 9.1 [`skipHistory=false` — modale con history standard](#91-skiphistoryfalse--modale-con-history-standard)
   - 9.2 [`skipHistory=true` — modale secondario/annidato](#92-skiphistorytrue--modale-secondarioannidato)
   - 9.3 [`openModal` — modale globale dallo stack](#93-openmodal--modale-globale-dallo-stack)
10. [Modali annidati](#10-modali-annidati)
    - 10.1 [Regola del sibling](#101-regola-del-sibling)
    - 10.2 [Ordine di chiusura con Back/Escape](#102-ordine-di-chiusura-con-backescape)
11. [Creare un modale personalizzato](#11-creare-un-modale-personalizzato)
12. [Tabella riassuntiva: Back e Escape per scenario](#12-tabella-riassuntiva-back-e-escape-per-scenario)
13. [Errori comuni da evitare](#13-errori-comuni-da-evitare)

---

## 1. Panoramica e architettura

Il sistema modale è composto da tre livelli sovrapposti:

```
ModalContext  (context globale)
  └── gestisce: modalStack, callback stack, Back/Escape, z-index depth
Modal         (componente base UI)
  └── overlay, header, corpo scrollabile, footer/FAB, focus trap, scroll lock
Modali specializzati
  └── ConfirmationModal, TextInputModal, e qualsiasi modale custom
```

### Due canali di gestione

| Canale                     | Quando si usa                                                         | API                                      |
| -------------------------- | --------------------------------------------------------------------- | ---------------------------------------- |
| **ModalStack globale**     | Modali registrati centralmente, aperti da qualsiasi punto dell'app    | `openModal(id, props)` / `closeModal()`  |
| **Modali annidati locali** | Modali aperti da un componente specifico (es. dentro un altro modale) | `<Modal onClose={fn}>` con `skipHistory` |

Il canale più comune in uso quotidiano è quello dei **modali annidati locali**: ogni componente gestisce il proprio stato `isOpen` con `useState` e passa `onClose` direttamente al `<Modal>`.

---

## 2. ModalContext

`ModalContext` è il cuore del sistema. Va montato come **provider** a livello radice dell'applicazione, fuori dal router, così da essere accessibile ovunque.

```jsx
// Esempio di montaggio a livello radice
<ModalProvider>
  <App />
</ModalProvider>
```

### 2.1 Stato interno

| Struttura                      | Tipo            | Descrizione                                                                                                             |
| ------------------------------ | --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `modalStack`                   | `useState([])`  | Array dei modali globali aperti via `openModal`. Ogni elemento ha la forma `{ id, props }`.                             |
| `nestedModalCount`             | `useState(0)`   | Contatore sincronizzato con `nestedCloseCallbacksRef.current.length`. Usato per calcolare `modalDepth`.                 |
| `skipHistoryCount`             | `useState(0)`   | Contatore sincronizzato con `skipHistoryCloseCallbacksRef.current.length`. Usato per calcolare `modalDepth`.            |
| `nestedCloseCallbacksRef`      | `useRef([])`    | Stack (array) delle callback `onClose` dei modali con `skipHistory=false`. LIFO: l'ultimo registrato è il primo chiuso. |
| `skipHistoryCloseCallbacksRef` | `useRef([])`    | Stack delle callback `onClose` dei modali con `skipHistory=true`. LIFO.                                                 |
| `popstateHandledRef`           | `useRef(false)` | Flag interno per prevenire il doppio processamento di eventi `popstate` rapidi consecutivi.                             |

**Perché `useRef` e non `useState` per i callback stack?**  
Le callback devono essere aggiornate in modo sincrono, senza causare re-render. `useRef` permette di modificare `current` immediatamente, mentre `useState` schedula un aggiornamento asincrono. Per la gestione degli eventi `popstate`, la sincronicità è essenziale.

### 2.2 API esposta

```js
const {
  // --- Modali globali (openModal/closeModal) ---
  openModal, // (id: string, props?: object) => void
  closeModal, // () => void — chiude il top del modalStack
  closeAllModals, // () => void — svuota completamente lo stack
  closeTopModal, // () => boolean — chiude il top (annidato o globale)
  currentModal, // { id, props } | null — modale globale corrente
  modalStack, // array — tutti i modali globali aperti
  modalDepth, // number — totale modali aperti (globali + annidati + skipHistory)
  isModalOpen, // (id: string) => boolean
  getModalIndex, // (id: string) => number (−1 se non trovato)

  // --- Usato internamente da Modal.jsx ---
  registerNestedClose, // (callback) => unregisterFn — per skipHistory=false
  registerSkipHistoryClose, // (callback) => unregisterFn — per skipHistory=true

  // --- Utilità ---
  hasNestedModals, // () => boolean — true se ci sono modali annidati aperti
  wasPopstateHandled, // () => boolean — true se un popstate è appena stato gestito
  markPopstateHandled, // () => void — segna il prossimo popstate come già gestito
} = useModal();
```

#### `openModal(id, props)`

Aggiunge un modale allo stack globale. Chiama anche `history.pushState` con `{ modalId, stackIndex }`.

```jsx
openModal("confirm-delete", { itemId: "abc123", itemName: "Documento" });
```

#### `closeModal()`

Rimuove l'ultimo modale dallo stack globale. Se lo stack diventa vuoto, rimuove la classe `modal-open` dal body.

#### `closeAllModals()`

Svuota `modalStack` e `nestedCloseCallbacksRef`, resetta `nestedModalCount` a 0 e rimuove la classe `modal-open` dal body. **Non** azzera `skipHistoryCloseCallbacksRef` (i modali `skipHistory` aperti eventualmente rimangono registrati). Usato per reset di emergenza.

#### `closeTopModal()`

Chiude il modale più in alto. Controlla prima `nestedCloseCallbacksRef` (modali locali), poi `modalStack`. Ritorna `true` se ha chiuso qualcosa.

#### `registerNestedClose(callback)` e `registerSkipHistoryClose(callback)`

Usate internamente da `Modal.jsx`. Aggiungono la `onClose` callback allo stack appropriato. Restituiscono una funzione di de-registrazione.

La de-registrazione di `registerNestedClose` ritorna:

- `true` se la callback era ancora registrata (chiusura normale via X o Escape)
- `false` se era già stata consumata dal gestore `popstate` (chiusura via Back del browser)

Questo valore di ritorno viene usato da `Modal.jsx` per decidere se resettare `hasAddedHistoryRef`.

#### `modalDepth`

```
modalDepth = modalStack.length + nestedModalCount + skipHistoryCount
```

Usato da `Modal.jsx` per calcolare automaticamente lo z-index dei modali senza prop esplicita: `1000 + modalDepth * 10`.

### 2.3 Gestione Escape e Back

Il context registra due event listener globali su `window`:

#### Listener `keydown` (Escape)

```
Escape premuto
  │
  ├─ skipHistoryCloseCallbacksRef non vuoto?
  │    └─ YES: history.replaceState(null, "")  ← neutralizza la entry in-place (sincrono, nessun popstate)
  │           + chiama callback top dello stack
  │
  └─ NO: nestedCloseCallbacksRef non vuoto OPPURE modalStack non vuoto?
           └─ YES: history.back()  ← genera popstate → handlePopState lo gestisce
```

**Perché `replaceState` per `skipHistory` ed `history.back()` per gli altri?**  
`history.back()` è asincrono: il `popstate` risultante arriva in un macrotask successivo. Per i modali `skipHistory`, questo crea una race condition: in build di produzione (senza overhead di dev server), un `setTimeout(0)` di reset flag potrebbe essere elaborato prima del `popstate`, lasciando quest'ultimo senza protezione e causando la chiusura del modale padre. `history.replaceState` è **sincrono** e **non emette `popstate`**: elimina la race condition alla radice.

#### Listener `popstate` (Back del browser)

```
popstate ricevuto
  │
  ├─ popstateHandledRef = true? → return (già gestito)
  │
  ├─ skipHistoryCloseCallbacksRef non vuoto?
  │    └─ imposta popstateHandledRef, chiama callback top dello stack
  │       (la entry history è già stata consumata dal Back — non serve altro)
  │
  ├─ nestedCloseCallbacksRef non vuoto?
  │    └─ imposta popstateHandledRef, pop callback, chiamala
  │
  └─ modalStack non vuoto?
       └─ imposta popstateHandledRef, closeModal()
```

**Priorità di chiusura:**  
`skipHistory` > `nestedClose` > `modalStack`  
Il modale più in alto (più recente) viene sempre chiuso per primo, indipendentemente dal tipo.

**Differenza di rimozione tra i due stack:**

- `nestedCloseCallbacksRef`: usa `.pop()` → la callback viene rimossa esplicitamente al momento della chiamata.
- `skipHistoryCloseCallbacksRef`: usa accesso per indice (legge senza rimuovere) → la callback rimane nello stack e viene rimossa in seguito dal cleanup `unregister` di `Modal.jsx` quando `isOpen` diventa `false`.

`popstateHandledRef` viene resettato a `false` via `setTimeout(0)` dopo ogni chiusura, per permettere la gestione di Back consecutivi rapidi.

### 2.4 Come usare `useModal`

```jsx
import { useModal } from "../contexts"; // o dal percorso diretto

function MyComponent() {
  const { openModal, closeModal, modalDepth, isModalOpen } = useModal();

  return (
    <>
      <button onClick={() => openModal("edit-profile")}>
        Modifica profilo
      </button>
      {isModalOpen("edit-profile") && <span>Profilo aperto</span>}
    </>
  );
}
```

---

## 3. Componente `Modal` (base)

`Modal` è il componente UI fondamentale. Gestisce: overlay, header, contenuto scrollabile, footer (desktop) o FAB (mobile), focus trap, scroll lock, z-index e integrazione con `ModalContext`.

### 3.1 Props

| Prop                | Tipo                                 | Default           | Obbligatoria | Descrizione                                                                                        |
| ------------------- | ------------------------------------ | ----------------- | :----------: | -------------------------------------------------------------------------------------------------- |
| `isOpen`            | `boolean`                            | —                 |      ✅      | Controlla la visibilità del modale                                                                 |
| `title`             | `string`                             | —                 |      ✅      | Titolo mostrato nell'header                                                                        |
| `children`          | `ReactNode`                          | —                 |      ✅      | Contenuto del corpo del modale                                                                     |
| `onClose`           | `function`                           | —                 |      ✅      | Callback di chiusura (X, Back, Escape)                                                             |
| `onConfirm`         | `function`                           | —                 |      ❌      | Callback al click del pulsante di conferma                                                         |
| `confirmText`       | `string`                             | `"Conferma"`      |      ❌      | Testo del pulsante di conferma                                                                     |
| `confirmDisabled`   | `boolean`                            | `false`           |      ❌      | Disabilita il pulsante di conferma                                                                 |
| `confirmVariant`    | `"primary" \| "danger" \| "success"` | `"primary"`       |      ❌      | Stile cromatico del pulsante di conferma                                                           |
| `showConfirmButton` | `boolean`                            | `true`            |      ❌      | Mostra/nasconde il pulsante di conferma                                                            |
| `isLoading`         | `boolean`                            | `false`           |      ❌      | Mostra spinner nel pulsante di conferma                                                            |
| `variant`           | `"default" \| "info"`                | `"default"`       |      ❌      | `"info"` rimuove completamente il pulsante di conferma                                             |
| `skipHistory`       | `boolean`                            | `false`           |      ❌      | Se `true`: usa `replaceState` per la chiusura non-Back; registra in `skipHistoryCloseCallbacksRef` |
| `zIndex`            | `number`                             | auto              |      ❌      | z-index personalizzato; se omesso viene calcolato da `modalDepth`                                  |
| `maxWidth`          | `string`                             | `"max-w-[440px]"` |      ❌      | Classe CSS per la larghezza massima (solo desktop)                                                 |
| `closeRef`          | `React.ref`                          | —                 |      ❌      | Ref che espone `handleClose` al componente padre per chiusura programmatica                        |

#### Differenza tra `variant="info"` e `showConfirmButton={false}`

Entrambe nascondono il pulsante di conferma, ma `variant="info"` è semanticamente esplicito: indica un modale puramente informativo, senza alcuna azione di conferma. `showConfirmButton={false}` è un override esplicito per casi specifici.

#### `closeRef` — chiusura programmatica dall'esterno

```jsx
function ParentComponent() {
  const closeRef = useRef(null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeRef={closeRef} title="...">
      <button onClick={() => closeRef.current?.()}>Chiudi dall'interno</button>
    </Modal>
  );
}
```

### 3.2 Struttura interna

```
<Modal>
  ├── Overlay (div fisso, z-index − 1 rispetto al modale)
  │    └── Solo su desktop, o su mobile se è un modale annidato
  └── Contenitore principale (div fisso, tabIndex=−1, role="dialog", aria-modal="true")
       ├── <ModalHeader> — titolo + pulsante chiusura
       ├── Divisore orizzontale
       ├── Area contenuto scrollabile (flex-1, overflow-y-auto)
       │    └── {children}
       ├── <ModalFooter> (solo desktop, solo se showConfirm=true)
       └── <ModalFab>    (solo mobile,   solo se showConfirm=true)
```

Il contenitore principale ha attributi ARIA:

- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby="modal-title"` (collegato all'`id` del tag `<h2>` nell'header)

### 3.3 Gestione z-index

Lo z-index viene calcolato **una sola volta** al momento della prima apertura e poi fissato per tutta la durata della sessione aperta (tramite `fixedZIndexRef`):

```
zIndex = prop zIndex ?? (1000 + modalDepth * 10)
```

Con più modali aperti contemporaneamente, ogni nuovo modale ottiene automaticamente uno z-index 10 punti più alto del precedente. Alla chiusura, `fixedZIndexRef` viene resettato a `null`.

L'overlay (sfondo scuro) ha z-index uguale a `computedZIndex − 1`.

### 3.4 Scroll lock

Quando un modale si apre, il componente imposta:

```js
document.documentElement.style.overflow = "hidden";
document.body.style.overflow = "hidden";
```

All'effetto di cleanup, lo scroll viene ripristinato **solo se** non ci sono altri modali annidati aperti (controllato via `hasNestedModals()`). Questo evita che la chiusura di un modale figlio riabiliti lo scroll mentre il modale padre è ancora aperto.

> **Nota:** anche `registerNestedClose` in `ModalContext` imposta `overflow: hidden` in modo ridondante ogni volta che un modale annidato si registra. I due meccanismi si sovrappongono senza conflitti: entrambi impostano lo stesso valore.

### 3.5 Focus trap

Il modale implementa un focus trap completo:

1. **Focus automatico all'apertura**: dopo 50ms, il contenitore del modale riceve il focus.
2. **Salvataggio del focus precedente**: `document.activeElement` viene salvato in `previousFocusRef` e ripristinato alla chiusura.
3. **Tab/Shift+Tab trap**: un listener `keydown` impedisce al focus di uscire dal modale. Se il focus esce (es. tramite un portal interno), viene reindirizzato al primo o all'ultimo elemento focusabile.
4. **Elementi focusabili** considerati: `button`, `[href]`, `input`, `select`, `textarea`, `[tabindex]:not([tabindex="-1"])`.

### 3.6 Comportamento mobile vs desktop

La distinzione mobile/desktop è determinata da `useIsMobile()` (breakpoint: `window.innerWidth < 768px`).

| Aspetto                      | Mobile (`< 768px`)                                              | Desktop (`≥ 768px`)                                             |
| ---------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------- |
| **Posizione**                | Occupa tutta la schermata (`inset-0`)                           | Centrato con `margin: auto`, `w-90%`, `max-width` configurabile |
| **Altezza**                  | 100vh (fullscreen)                                              | `max-h-85vh` con scroll interno                                 |
| **Animazione**               | `slide-in-bottom` (sale dal basso)                              | `modal-scale` (scale + fade)                                    |
| **Overlay**                  | Assente (il modale è fullscreen) — eccetto per modali annidati  | Presente (sfondo scuro semitrasparente)                         |
| **Pulsante chiusura header** | Freccia sinistra (← back arrow) a sinistra                      | X (close) a destra                                              |
| **Pulsante conferma**        | `ModalFab` — floating action button circolare in basso a destra | `ModalFooter` — pulsante full-width nel footer                  |
| **Tastiera virtuale**        | FAB si sposta sopra la tastiera (usa `useKeyboardHeight`)       | Non applicabile                                                 |

#### `useKeyboardHeight`

Hook che stima l'altezza della tastiera virtuale su mobile sfruttando la `visualViewport` API:

```js
keyboardHeight = Math.max(0, window.innerHeight − window.visualViewport.height)
```

Il `ModalFab` usa questo valore per il proprio `bottom` offset:

```js
bottomOffset = keyboardHeight > 0 ? keyboardHeight + 20 : 20;
```

### 3.7 Gestione history: `skipHistory`

`Modal.jsx` gestisce autonomamente le entry della `history` del browser. **Non bisogna mai chiamare** `history.pushState`, `history.back()` o `history.go()` manualmente all'interno dei componenti che usano `Modal`.

#### `skipHistory=false` (default)

```
Apertura:
  hasAddedHistoryRef = false → history.pushState({ nestedModal: true })
  hasAddedHistoryRef = true
  registerNestedClose(onClose) → callback in nestedCloseCallbacksRef

Chiusura via X (handleClose):
  history.back() → scatena popstate → handlePopState → chiama onClose

Chiusura via Back:
  popstate → handlePopState → .pop() nestedCloseCallbacksRef → chiama onClose

Chiusura via Escape:
  handleKeyDown → history.back() → popstate → handlePopState → chiama onClose

Cleanup effect (isOpen → false):
  unregister() → ritorna wasStillRegistered
  se false: hasAddedHistoryRef = false (già consumata da Back)
```

#### `skipHistory=true`

```
Apertura:
  hasAddedSkipHistoryRef = false → history.pushState({ skipHistoryModal: true })
  hasAddedSkipHistoryRef = true
  registerSkipHistoryClose(onClose) → callback in skipHistoryCloseCallbacksRef

Chiusura via X (handleClose):
  SE hasAddedSkipHistoryRef=true:
    hasAddedSkipHistoryRef = false
    history.replaceState(null, "")  ← sincrono, nessun popstate
  onClose()

Chiusura via Back:
  popstate → handlePopState → legge (senza pop) top di skipHistoryCloseCallbacksRef → chiama onClose
  (la entry è già consumata dal Back; la rimozione dallo stack avviene nel cleanup di Modal.jsx)

Chiusura via Escape:
  handleKeyDown → history.replaceState(null, "") ← sincrono, nessun popstate
  chiama callback direttamente

Cleanup effect:
  unregister() dal skipHistoryCloseCallbacksRef
  (go(-1) NON viene chiamato in cleanup per evitare navigazioni spurie in React StrictMode)
```

**Quando usare `skipHistory=true`:**

- Il modale si apre sopra un altro modale già aperto
- Il modale è un overlay secondario (chat, notifiche, dialog di conferma)
- Il modale è un "sotto-passo" dentro un flusso già in corso

**Quando usare `skipHistory=false` (default):**

- Il modale è il punto di ingresso principale di un'azione (es. "modifica profilo")
- Il modale si apre direttamente da un'azione dell'utente su una pagina, non da dentro un altro modale

---

## 4. ModalHeader

Componente interno del modale. Non va usato direttamente nelle implementazioni custom; è già incluso in `Modal`.

**Struttura:**

- Mobile: freccia ← a sinistra (pulsante di chiusura), titolo centrato, spacer a destra
- Desktop: spacer a sinistra, titolo centrato, X a destra (pulsante di chiusura)

Il titolo ha `id="modal-title"` per il collegamento ARIA con `aria-labelledby` del contenitore.

Su mobile, il padding superiore include `var(--safe-area-inset-top)` per rispettare la safe area dei dispositivi con notch.

---

## 5. ModalFooter

Componente interno, reso solo su **desktop** quando il pulsante di conferma è visibile.

**Struttura:** divisore orizzontale + `<footer>` con un singolo pulsante full-width.

**Props:**

| Prop          | Tipo                                 | Default     | Descrizione            |
| ------------- | ------------------------------------ | ----------- | ---------------------- |
| `confirmText` | `string`                             | —           | Testo del pulsante     |
| `onConfirm`   | `function`                           | —           | Callback al click      |
| `disabled`    | `boolean`                            | —           | Stato disabilitato     |
| `loading`     | `boolean`                            | —           | Spinner di caricamento |
| `variant`     | `"primary" \| "danger" \| "success"` | `"primary"` | Stile cromatico        |

---

## 6. ModalFab

Componente interno, reso solo su **mobile** quando il pulsante di conferma è visibile.

Floating action button circolare (`w-14 h-14`, `border-radius: 100%`), posizionato `fixed` in basso a destra. Si sposta dinamicamente in base all'altezza della tastiera virtuale.

**Varianti cromatiche:**

| Variante  | Background        | Testo     | Ombra        |
| --------- | ----------------- | --------- | ------------ |
| `primary` | `#42a5ff` (blu)   | nero      | `#42a5ff/40` |
| `danger`  | `#ff5252` (rosso) | `#ffe5e5` | `#ff5252/40` |
| `success` | `#3dd156` (verde) | `#e5ffe5` | `#3dd156/40` |

Quando `disabled` o `loading`: sfondo `divider`, testo `text-muted`, `cursor: default`, nessuna ombra.

Quando `loading`: spinner animato al posto dell'icona check.

---

## 7. Componente `ConfirmationModal`

`ConfirmationModal` è un wrapper di `Modal` specializzato per dialoghi di conferma. Presenta una box colorata con icona centrale e messaggio, senza input o contenuto custom.

### 7.1 Props

| Prop          | Tipo            | Default           | Obbligatoria | Descrizione                                                                                                           |
| ------------- | --------------- | ----------------- | :----------: | --------------------------------------------------------------------------------------------------------------------- |
| `isOpen`      | `boolean`       | —                 |      ✅      | Stato apertura                                                                                                        |
| `message`     | `string`        | —                 |      ✅      | Messaggio di conferma mostrato nella box                                                                              |
| `onConfirm`   | `function`      | —                 |      ✅      | Callback al click del pulsante di conferma                                                                            |
| `onCancel`    | `function`      | —                 |      ✅      | Callback annulla (chiamata da X, Back e Escape)                                                                       |
| `title`       | `string`        | `"Conferma"`      |      ❌      | Titolo nell'header                                                                                                    |
| `confirmText` | `string`        | `"Conferma"`      |      ❌      | Testo del pulsante di conferma                                                                                        |
| `isDanger`    | `boolean`       | `false`           |      ❌      | Usa tema rosso danger                                                                                                 |
| `loading`     | `boolean`       | `false`           |      ❌      | Stato caricamento (disabilita conferma + spinner)                                                                     |
| `icon`        | `ComponentType` | auto              |      ❌      | Componente React da usare come icona (es. da lucide-react); se omesso usa `AlertTriangle` (danger) o `Info` (default) |
| `zIndex`      | `number`        | —                 |      ❌      | z-index personalizzato                                                                                                |
| `skipHistory` | `boolean`       | `false`           |      ❌      | Passato al `Modal` interno                                                                                            |
| `maxWidth`    | `string`        | `"max-w-[360px]"` |      ❌      | Larghezza massima desktop                                                                                             |

**Nota:** `onCancel` è usato come `onClose` nel `Modal` interno. Viene chiamato cliccando X, tramite Back del browser o tramite Escape. L'overlay NON ha un gestore click.

### 7.2 Design e varianti

Il corpo del modale è composto da un'unica box centrata con bordo e sfondo colorati:

| Proprietà      | Variante default (`isDanger=false`) | Variante danger (`isDanger=true`) |
| -------------- | ----------------------------------- | --------------------------------- |
| Sfondo box     | `#1c2f42`                           | `#311f1f`                         |
| Bordo box      | `#4169a0`                           | `#904040`                         |
| Sfondo icona   | `#314559`                           | `#532828`                         |
| Colore icona   | `#42a5ff` (primary)                 | `#ff5252` (red)                   |
| Stile pulsante | `primary` (blu)                     | `danger` (rosso)                  |
| Icona default  | `Info`                              | `AlertTriangle`                   |

Il testo del messaggio è centrato nella box, colore `#e8f4ff`.

### 7.3 Esempi

```jsx
// Conferma semplice
<ConfirmationModal
  isOpen={isOpen}
  title="Conferma operazione"
  message="Sei sicuro di voler procedere con questa operazione?"
  confirmText="Procedi"
  onConfirm={handleConfirm}
  onCancel={() => setIsOpen(false)}
/>

// Azione pericolosa
<ConfirmationModal
  isOpen={isDeleteOpen}
  title="Elimina elemento"
  message="Questa azione è irreversibile. L'elemento verrà eliminato definitivamente."
  confirmText="Elimina"
  isDanger
  loading={isDeleting}
  onConfirm={handleDelete}
  onCancel={() => setIsDeleteOpen(false)}
/>

// Con icona personalizzata
import { Trash2 } from "lucide-react";

<ConfirmationModal
  isOpen={isOpen}
  message="Confermi l'eliminazione?"
  icon={Trash2}
  isDanger
  onConfirm={handleDelete}
  onCancel={handleCancel}
/>

// Modale annidato (aperto sopra un altro modale)
<ConfirmationModal
  isOpen={isConfirmOpen}
  message="Vuoi davvero uscire dall'organizzazione?"
  isDanger
  skipHistory       // ← obbligatorio se aperto dentro un altro modale
  onConfirm={handleLeave}
  onCancel={() => setIsConfirmOpen(false)}
/>
```

---

## 8. Componente `TextInputModal`

`TextInputModal` è un wrapper di `Modal` specializzato per la raccolta e modifica di un singolo valore testuale. Gestisce internamente stato del valore, validazione (sincrona e asincrona), messaggi di errore e contatore caratteri.

### 8.1 Props

| Prop           | Tipo                                                                 | Default           | Obbligatoria | Descrizione                                                        |
| -------------- | -------------------------------------------------------------------- | ----------------- | :----------: | ------------------------------------------------------------------ |
| `isOpen`       | `boolean`                                                            | —                 |      ✅      | Stato apertura                                                     |
| `onConfirm`    | `function(value: string)`                                            | —                 |      ✅      | Callback conferma; riceve il valore trimmed                        |
| `onClose`      | `function`                                                           | —                 |      ✅      | Callback chiusura                                                  |
| `title`        | `string`                                                             | `"Modifica"`      |      ❌      | Titolo nell'header                                                 |
| `label`        | `string`                                                             | —                 |      ❌      | Etichetta del campo input                                          |
| `placeholder`  | `string`                                                             | `""`              |      ❌      | Placeholder del campo                                              |
| `initialValue` | `string`                                                             | `""`              |      ❌      | Valore iniziale pre-compilato                                      |
| `confirmText`  | `string`                                                             | `"Salva"`         |      ❌      | Testo del pulsante di conferma                                     |
| `description`  | `string`                                                             | —                 |      ❌      | Testo descrittivo opzionale sotto il titolo                        |
| `validate`     | `function(value: string): string \| null \| Promise<string \| null>` | —                 |      ❌      | Funzione di validazione custom (sync o async)                      |
| `minLength`    | `number`                                                             | —                 |      ❌      | Lunghezza minima (caratteri dopo trim)                             |
| `maxLength`    | `number`                                                             | —                 |      ❌      | Lunghezza massima; blocca anche l'input in eccesso                 |
| `exactLength`  | `number`                                                             | —                 |      ❌      | Lunghezza esatta richiesta; ha priorità su `minLength`/`maxLength` |
| `type`         | `string`                                                             | `"text"`          |      ❌      | Tipo HTML dell'input (`email`, `tel`, `number`, ecc.)              |
| `loading`      | `boolean`                                                            | `false`           |      ❌      | Stato caricamento esterno                                          |
| `zIndex`       | `number`                                                             | —                 |      ❌      | z-index personalizzato                                             |
| `skipHistory`  | `boolean`                                                            | `false`           |      ❌      | Passato al `Modal` interno                                         |
| `maxWidth`     | `string`                                                             | `"max-w-[440px]"` |      ❌      | Larghezza massima desktop                                          |

### 8.2 Logica di validazione

Il pulsante di conferma è **disabilitato** se almeno una di queste condizioni è vera:

| Condizione            | Descrizione                                                |
| --------------------- | ---------------------------------------------------------- |
| `loading = true`      | Stato caricamento esterno attivo                           |
| `isValidating = true` | Validazione async in corso                                 |
| `!isLengthValid`      | Il valore trimmed non rispetta `minLength` / `exactLength` |
| `!hasChanged`         | Il valore trimmed è identico a `initialValue.trim()`       |

La logica `!hasChanged` evita salvataggi inutili quando l'utente non ha effettivamente modificato il valore.

**Flusso di validazione al click "Salva":**

```
1. Trim del valore
2. Controllo minLength / exactLength (lato inferiore)
3. Controllo maxLength / exactLength (lato superiore)
4. Controllo exactLength (lunghezza esatta)
5. validate(trimmedValue) → se ritorna stringa non vuota: setError(msg), return
6. onConfirm(trimmedValue)
```

La funzione `validate` può restituire:

- `null` o `undefined`: nessun errore
- `string`: messaggio di errore da mostrare
- `Promise<string | null>`: validazione asincrona (es. chiamata API per verificare disponibilità)

In caso di errore durante la `Promise`, viene mostrato il messaggio generico `"Errore di validazione"`.

**Reset del campo:** il valore viene resettato a `initialValue` ogni volta che il modale passa da chiuso (`isOpen=false`) ad aperto (`isOpen=true`). Questo comportamento è controllato tramite `wasOpen` per distinguere il reset intenzionale da render multipli.

**Gestione `maxLength` durante la digitazione:** se `maxLength` o `exactLength` è definito, i caratteri in eccesso vengono troncati in tempo reale (`newValue.slice(0, effectiveMaxLength)`).

**Tasto Invio:** premere Invio nel campo di testo chiama `handleConfirm` se il pulsante non è disabilitato.

### 8.3 Character counter

Se `exactLength` è definito, sotto il campo appare un contatore con tre stati:

| Stato              | Condizione                     | Colore             |
| ------------------ | ------------------------------ | ------------------ |
| Lunghezza corretta | `value.length === exactLength` | `#3dd156` (verde)  |
| Troppo lungo       | `value.length > exactLength`   | `#ff5252` (rosso)  |
| In progress        | `value.length < exactLength`   | `#8ba3b8` (grigio) |

A destra viene sempre mostrato `X / exactLength` (es. `7 / 10`) nello stesso colore.

### 8.4 Esempi

```jsx
// Modifica nome semplice
<TextInputModal
  isOpen={isOpen}
  title="Modifica Nome"
  label="Nome utente"
  initialValue={currentName}
  onConfirm={async (newName) => {
    await updateName(newName);
    setIsOpen(false);
  }}
  onClose={() => setIsOpen(false)}
  minLength={2}
  maxLength={50}
/>

// Con validazione async
<TextInputModal
  isOpen={isOpen}
  title="Modifica Email"
  label="Email"
  type="email"
  initialValue={currentEmail}
  onConfirm={handleSave}
  onClose={() => setIsOpen(false)}
  validate={async (email) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Formato email non valido";
    }
    const available = await checkEmailAvailability(email);
    if (!available) return "Email già in uso";
    return null;
  }}
/>

// Con lunghezza esatta (es. codice a 6 cifre)
<TextInputModal
  isOpen={isOpen}
  title="Inserisci codice"
  label="Codice"
  description="Inserisci il codice a 6 cifre ricevuto via email."
  exactLength={6}
  type="text"
  onConfirm={handleCode}
  onClose={() => setIsOpen(false)}
/>

// Modale annidato (aperto sopra un altro modale)
<TextInputModal
  isOpen={isEditOpen}
  title="Modifica campo"
  initialValue={field}
  onConfirm={handleSave}
  onClose={() => setIsEditOpen(false)}
  skipHistory   // ← obbligatorio se aperto dentro un altro modale
/>
```

---

## 9. Canali di apertura modale

### 9.1 `skipHistory=false` — modale con history standard

Il canale più comune per modali "di primo livello" aperti da una pagina o dalla sidebar.

**Caratteristiche:**

- Aggiunge una entry nella `history` con `{ nestedModal: true }`
- Callback registrata in `nestedCloseCallbacksRef`
- Chiusura via Back/Escape: `history.back()` → `popstate` → callback
- Chiusura via X: `history.back()` → `popstate` → callback

**Usa quando:**

- Il modale è l'azione principale dell'utente (es. "modifica profilo", "crea documento")
- Il modale si apre direttamente da un pulsante o link di pagina
- Vuoi che il pulsante Back del browser torni al "contesto precedente" all'apertura del modale

### 9.2 `skipHistory=true` — modale secondario/annidato

Per overlay secondari che non devono "consumare" un passo nella cronologia di navigazione.

**Caratteristiche:**

- Aggiunge una entry nella `history` con `{ skipHistoryModal: true }` (per gestire Back)
- Callback registrata in `skipHistoryCloseCallbacksRef`
- Chiusura via Back: `popstate` → callback (entry già consumata da Back; callback letta ma non pop-pata, rimossa dal cleanup)
- Chiusura via X: `history.replaceState(null, "")` se entry ancora presente (sincrono, nessun popstate) → callback
- Chiusura via Escape: `history.replaceState(null, "")` (sincrono) → callback

**Usa quando:**

- Il modale si apre sopra un altro modale già aperto (`skipHistory=false`)
- Il modale è un overlay secondario (chat, notifiche, pannello informativo)
- Il modale è un dialogo di conferma (ConfirmationModal) aperto inside un form modale
- Non vuoi che Back "salti" un passo aggiuntivo nella navigazione dopo la chiusura

### 9.3 `openModal` — modale globale dallo stack

Canale per modali registrati globalmente, accessibili da qualsiasi componente nell'app.

```jsx
// Apertura
const { openModal } = useModal();
openModal("delete-confirm", {
  documentId: "doc-123",
  documentName: "DDT #001",
});

// Rendering (solitamente in un componente di layout radice)
const { currentModal, closeModal } = useModal();

if (currentModal?.id === "delete-confirm") {
  return (
    <ConfirmationModal
      isOpen
      title="Elimina documento"
      message={`Eliminare "${currentModal.props.documentName}"?`}
      isDanger
      onConfirm={() => {
        deleteDoc(currentModal.props.documentId);
        closeModal();
      }}
      onCancel={closeModal}
    />
  );
}
```

---

## 10. Modali annidati

### 10.1 Regola del sibling

**Il modale figlio deve sempre essere un sibling del modale padre nel JSX, mai un suo child.**

```jsx
// ✅ CORRETTO — siblings in un Fragment
function ParentModal({ isOpen, onClose }) {
  const [isChildOpen, setIsChildOpen] = useState(false);

  return (
    <>
      <Modal isOpen={isOpen} title="Padre" onClose={onClose} variant="info">
        <button onClick={() => setIsChildOpen(true)}>Apri figlio</button>
      </Modal>

      <ConfirmationModal
        isOpen={isChildOpen}
        message="Confermi?"
        onConfirm={handleConfirm}
        onCancel={() => setIsChildOpen(false)}
        skipHistory   // ← sempre skipHistory per modali annidati
      />
    </>
  );
}

// ❌ SBAGLIATO — figlio dentro children del padre
function ParentModal({ isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} title="Padre" onClose={onClose}>
      {/* Questo causa problemi con z-index, scroll lock e focus trap */}
      <ConfirmationModal isOpen={isChildOpen} ... />
    </Modal>
  );
}
```

**Perché?**  
Il `Modal` padre gestisce scroll lock, focus trap e z-index sul proprio contenitore. Un modale figlio reso all'interno del `children` eredita queste restrizioni e non può posizionarsi correttamente sopra l'overlay del padre. Come sibling, ogni modale è un figlio diretto del DOM root (o del suo genitore immediato) e gestisce indipendentemente il proprio z-index.

### 10.2 Ordine di chiusura con Back/Escape

Con più modali aperti, Back e Escape chiudono sempre il modale **più recente** (top of stack):

```
Stato:       [ProfileModal (skipHistory=false)] + [ConfirmationModal (skipHistory=true)]
Back/Escape: chiude ConfirmationModal → rimane ProfileModal
Back/Escape: chiude ProfileModal
```

La priorità nell'handler `popstate` è: `skipHistory` stack > `nested` stack > `modalStack` globale.

---

## 11. Creare un modale personalizzato

Schema consigliato per un nuovo modale che wrappa `Modal`:

```jsx
import { useState, useEffect } from "react";
import Modal from "./Modal"; // o dal barrel export

/**
 * NuovoModal — descrizione sintetica dello scopo
 *
 * @param {boolean} isOpen       - Stato apertura
 * @param {function} onClose     - Callback chiusura
 * @param {boolean} [skipHistory=false] - Usare true se aperto sopra altri modali
 */
function NuovoModal({ isOpen, onClose, skipHistory = false, zIndex }) {
  const [localState, setLocalState] = useState("");

  // Reset stato quando il modale si apre
  useEffect(() => {
    if (isOpen) {
      setLocalState("");
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    // logica di salvataggio
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Titolo del modale"
      confirmText="Salva"
      onConfirm={handleConfirm}
      onClose={onClose}
      skipHistory={skipHistory}
      zIndex={zIndex}
      // confirmDisabled={!isValid}
      // isLoading={isSaving}
      // confirmVariant="danger"
      // maxWidth="max-w-[500px]"
    >
      {/* Contenuto del modale */}
      <div className="space-y-4 py-2">{/* ... */}</div>
    </Modal>
  );
}

export default NuovoModal;
```

**Checklist per un nuovo modale:**

- [ ] Props `isOpen`, `onClose` sempre presenti
- [ ] Stato locale resettato quando `isOpen` diventa `true`
- [ ] `skipHistory={true}` se il modale si apre sopra un altro modale
- [ ] `skipHistory` e `zIndex` ricevuti come props per permettere flessibilità al chiamante
- [ ] Nessuna manipolazione manuale di `history`, `pushState`, `history.back()`
- [ ] Nessun listener `keydown` per Escape (gestito globalmente da `ModalContext`)
- [ ] Se annidato, reso come **sibling** e non come child del modale padre
- [ ] Il componente padre gestisce `isOpen` con `useState` e passa `onClose` come `() => setIsOpen(false)`

---

## 12. Tabella riassuntiva: Back e Escape per scenario

| Scenario                                      | Back (browser)                               | Escape (tastiera)              |
| --------------------------------------------- | -------------------------------------------- | ------------------------------ |
| Nessun modale aperto                          | Navigazione normale (React Router)           | Niente                         |
| Un modale `skipHistory=false`                 | Chiude il modale                             | Chiude il modale               |
| Un modale `skipHistory=true`                  | Chiude il modale, pagina resta               | Chiude il modale, pagina resta |
| `skipHistory=true` sopra `skipHistory=false`  | Chiude il `skipHistory=true`, il padre resta | Stesso                         |
| `skipHistory=false` sopra `skipHistory=false` | Chiude il più recente                        | Stesso                         |
| `skipHistory=true` sopra `skipHistory=true`   | Chiude il più recente                        | Stesso                         |
| Due modali globali (`openModal`)              | Chiude il top del `modalStack`               | Stesso                         |

**Regola universale:** Back e Escape chiudono sempre il modale più in alto, qualunque sia la sua configurazione.

---

## 13. Errori comuni da evitare

### ❌ Non gestire history manualmente

```jsx
// SBAGLIATO
const handleClose = () => {
  history.back(); // interferisce con ModalContext
  setIsOpen(false);
};

// CORRETTO
// Lascia fare tutto a Modal.jsx: passa solo onClose={() => setIsOpen(false)}
```

### ❌ Non aggiungere listener Escape locali

```jsx
// SBAGLIATO
useEffect(() => {
  const handler = (e) => {
    if (e.key === "Escape") setIsOpen(false);
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, []);

// CORRETTO
// ModalContext gestisce già Escape per tutti i modali registrati.
// Non serve nessun listener aggiuntivo.
```

### ❌ Non usare skipHistory=false per un modale annidato

```jsx
// SBAGLIATO — apertura di ConfirmationModal sopra ProfileModal senza skipHistory
<ConfirmationModal isOpen={isOpen} onCancel={...} onConfirm={...} />
// Il Back browser chiude ProfileModal invece di ConfirmationModal

// CORRETTO
<ConfirmationModal isOpen={isOpen} skipHistory onCancel={...} onConfirm={...} />
```

### ❌ Non renderizzare il figlio come child del padre

```jsx
// SBAGLIATO
<Modal isOpen={parentOpen} ...>
  <ConfirmationModal isOpen={childOpen} ... />  {/* SBAGLIATO */}
</Modal>

// CORRETTO
<>
  <Modal isOpen={parentOpen} ...>
    {/* contenuto padre */}
  </Modal>
  <ConfirmationModal isOpen={childOpen} skipHistory ... />
</>
```

### ❌ Non chiamare onClose e history.back() insieme

```jsx
// SBAGLIATO — doppia chiusura
const handleConfirm = () => {
  doSomething();
  history.back(); // Modal.jsx lo chiama già tramite handleClose
  onClose(); // doppio trigger
};

// CORRETTO
const handleConfirm = () => {
  doSomething();
  onClose(); // solo questo, e solo se necessario
  // oppure lascia che Modal.jsx lo chiami via onConfirm
};
```

### ❌ Non dimenticare il reset dello stato locale

```jsx
// SBAGLIATO — il valore rimane dal precedente utilizzo
function MyModal({ isOpen, onClose, initialValue }) {
  const [value, setValue] = useState(initialValue);
  // nessun reset
}

// CORRETTO
function MyModal({ isOpen, onClose, initialValue }) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    if (isOpen) setValue(initialValue);
  }, [isOpen, initialValue]);
}
```
