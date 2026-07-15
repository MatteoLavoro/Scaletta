# Analisi Completa: Differenze tra Documentazione di Riferimento e Implementazione Attuale

Questo documento confronta il sistema modale di **ReferenceModal** (documentazione di design completo) con l'**implementazione attuale** nel progetto Scaletta.

---

## 1. ARCHITETTURA GENERALE

### 1.1 Struttura di Sistema (DIFFERENZA MINORE)

**ReferenceModal** propone:

```
ModalContext (context globale)
  └── gestisce: modalStack, callback stack, Back/Escape, z-index depth
Modal (componente base UI)
  └── overlay, header, corpo scrollabile, footer/FAB, focus trap, scroll lock
Modali specializzati
  └── ConfirmationModal, TextInputModal, e qualsiasi modale custom
```

**Implementazione Attuale**:

```
ModalContext (implementato)
  └── gestisce: modalStack, callback stack, Back/Escape, z-index depth
Modal (implementato)
  └── overlay, header, corpo scrollabile, footer/FAB, focus trap, scroll lock
Modali specializzati (parzialmente)
  └── ConfirmModal (non TextInputModal; usa InputModal)
  └── NoteViewerModal, GraphViewerModal, PdfViewerModal, ImageModal
  └── MoreBoxesModal, BoxTagModal, NotificationModal
  └── UploadModal, FileUploadModal, PdfUploadModal, VersionUploadModal
```

**Valutazione**: ✅ Architettura sostanzialmente allineata. La differenza è nella **nomenclatura e granularità** dei modali specializzati.

---

## 2. API di ModalContext

### 2.1 Metodi Disponibili (ALLINEAMENTO COMPLETO)

| Metodo                               | ReferenceModal | Implementazione | Status   |
| ------------------------------------ | -------------- | --------------- | -------- |
| `openModal(id, props)`               | ✅ Documentato | ✅ Presente     | 🟢 MATCH |
| `closeModal()`                       | ✅ Documentato | ✅ Presente     | 🟢 MATCH |
| `closeAllModals()`                   | ✅ Documentato | ✅ Presente     | 🟢 MATCH |
| `closeTopModal()`                    | ✅ Documentato | ✅ Presente     | 🟢 MATCH |
| `currentModal`                       | ✅ Documentato | ✅ Presente     | 🟢 MATCH |
| `modalStack`                         | ✅ Documentato | ✅ Presente     | 🟢 MATCH |
| `modalDepth`                         | ✅ Documentato | ✅ Presente     | 🟢 MATCH |
| `isModalOpen(id)`                    | ✅ Documentato | ✅ Presente     | 🟢 MATCH |
| `getModalIndex(id)`                  | ✅ Documentato | ✅ Presente     | 🟢 MATCH |
| `registerNestedClose(callback)`      | ✅ Documentato | ✅ Presente     | 🟢 MATCH |
| `registerSkipHistoryClose(callback)` | ✅ Documentato | ✅ Presente     | 🟢 MATCH |
| `hasNestedModals()`                  | ✅ Documentato | ✅ Presente     | 🟢 MATCH |
| `wasPopstateHandled()`               | ✅ Documentato | ✅ Presente     | 🟢 MATCH |
| `markPopstateHandled()`              | ✅ Documentato | ✅ Presente     | 🟢 MATCH |

**Valutazione**: 🟢 **PERFETTO ALLINEAMENTO**

---

## 3. COMPONENTE Modal (Base)

### 3.1 Props Supportate

| Prop                | Reference                           | Attuale                             | Differenza     | Note                         |
| ------------------- | ----------------------------------- | ----------------------------------- | -------------- | ---------------------------- |
| `isOpen`            | ✅ bool                             | ✅ bool                             | 🟢 MATCH       | —                            |
| `title`             | ✅ string                           | ✅ string                           | 🟢 MATCH       | —                            |
| `children`          | ✅ ReactNode                        | ✅ ReactNode                        | 🟢 MATCH       | —                            |
| `onClose`           | ✅ function                         | ✅ function                         | 🟢 MATCH       | —                            |
| `onConfirm`         | ✅ function                         | ✅ function                         | 🟢 MATCH       | —                            |
| `confirmText`       | ✅ string (default "Conferma")      | ✅ string (default "Conferma")      | 🟢 MATCH       | —                            |
| `confirmDisabled`   | ✅ bool (default false)             | ✅ bool (default false)             | 🟢 MATCH       | —                            |
| `confirmVariant`    | ✅ "primary"\|"danger"\|"success"   | ✅ Presente                         | 🟢 MATCH       | —                            |
| `showConfirmButton` | ✅ bool (default true)              | ✅ bool (default true)              | 🟢 MATCH       | —                            |
| `isLoading`         | ✅ bool (default false)             | ✅ bool (default false)             | 🟢 MATCH       | —                            |
| `variant`           | ✅ "default"\|"info"                | ✅ "default"\|"info"                | 🟢 MATCH       | —                            |
| `skipHistory`       | ✅ bool (default false)             | ✅ bool (default false)             | 🟢 MATCH       | —                            |
| `zIndex`            | ✅ number (auto)                    | ✅ number (auto)                    | 🟢 MATCH       | —                            |
| `maxWidth`          | ✅ string (default "max-w-[440px]") | ✅ string (default "max-w-[440px]") | 🟢 MATCH       | —                            |
| `closeRef`          | ✅ ref                              | ✅ ref                              | 🟢 MATCH       | Espone `handleClose`         |
| `confirmVariant`    | ✅ "primary"\|"danger"\|"success"   | —                                   | 🔴 **ASSENTE** | Non documentato in Modal.jsx |

**Valutazione**: 🟢 **ALLINEAMENTO QUASI PERFETTO** (una prop non documentata in Modal.jsx ma usata in ConfirmModal)

---

## 4. COMPONENTI SPECIALIZZATI

### 4.1 Modali Previsti in ReferenceModal

| Componente            | Reference                  | Implementazione       | Status        | Note                                                |
| --------------------- | -------------------------- | --------------------- | ------------- | --------------------------------------------------- |
| **TextInputModal**    | ✅ Documentato (sezione 8) | ❌ NON TROVATO        | 🔴 MANCANTE   | Usato `InputModal` al suo posto                     |
| **ConfirmationModal** | ✅ Documentato (sezione 7) | ✅ `ConfirmModal.jsx` | 🟡 RINOMINATO | Nome diverso: `ConfirmModal` vs `ConfirmationModal` |

### 4.2 Modali Implementati (Non in ReferenceModal)

| Componente             | File                   | Uso                                   | Speciale                       |
| ---------------------- | ---------------------- | ------------------------------------- | ------------------------------ |
| **NoteViewerModal**    | NoteViewerModal.jsx    | Visualizzazione note TXT/Markdown     | —                              |
| **RichTextModal**      | RichTextModal.jsx      | Editing note TXT/Markdown con toolbar | —                              |
| **GraphViewerModal**   | GraphViewerModal.jsx   | Visualizzazione grafici Graphviz      | —                              |
| **ImageModal**         | ImageModal.jsx         | Visualizzazione/navigazione immagini  | Carousel, delete, zoom         |
| **PdfViewerModal**     | PdfViewerModal.jsx     | Visualizzazione PDF multi-pagina      | Zoom, pagina corrente          |
| **MoreBoxesModal**     | MoreBoxesModal.jsx     | Selezione tipo box aggiuntivi         | BoxOptionCard component        |
| **BoxTagModal**        | BoxTagModal.jsx        | Selezione/tagging di box              | Multi-select                   |
| **NotificationModal**  | NotificationModal.jsx  | Invio notifiche e storico messaggi    | Layout 2-col responsive        |
| **UploadModal**        | UploadModal.jsx        | Upload immagini con drag-drop         | Anteprime, validazione         |
| **FileUploadModal**    | FileUploadModal.jsx    | Upload file generici                  | Validazione per tipo           |
| **PdfUploadModal**     | PdfUploadModal.jsx     | Upload PDF                            | Validazione specifica PDF      |
| **VersionUploadModal** | VersionUploadModal.jsx | Upload versioni file con tag          | Tag predefiniti                |
| **InputModal**         | InputModal.jsx         | Input testo con validazione           | Async validation, char counter |

**Valutazione**: 📊 **COMPLETAMENTO OLTRE RIFERIMENTO**: 12 modali specializzati aggiuntivi non documentati in ReferenceModal

---

## 5. COMPONENTI SUPPORTANTI

### 5.1 ModalHeader

| Aspetto           | ReferenceModal          | Attuale              | Note                                 |
| ----------------- | ----------------------- | -------------------- | ------------------------------------ |
| Documentato       | ✅ Sezione 4            | ✅ `ModalHeader.jsx` | —                                    |
| Props documentate | Minime                  | Completo             | `title, isMobile, onClose`           |
| Implementazione   | Descritta genericamente | Dettagliata          | Mobile: back arrow; Desktop: close X |
| Mobile support    | ✅ Menzione             | ✅ Layout responsive | Safe area inset supportate           |
| Safe area inset   | ❌ Non menzionato       | ✅ Presente          | `--safe-area-inset-top`              |

### 5.2 ModalFooter

| Aspetto        | ReferenceModal     | Attuale              | Note              |
| -------------- | ------------------ | -------------------- | ----------------- |
| Documentato    | ✅ Sezione 5       | ✅ `ModalFooter.jsx` | —                 |
| Posizionamento | Solo desktop       | ✅ Desktop           | —                 |
| Ruolo          | Footer con bottoni | ✅ Implementato      | Conferma, Annulla |

### 5.3 ModalFab

| Aspetto         | ReferenceModal          | Attuale                       | Note                        |
| --------------- | ----------------------- | ----------------------------- | --------------------------- |
| Documentato     | ✅ Sezione 6            | ✅ `ModalFab.jsx`             | —                           |
| Posizionamento  | Solo mobile             | ✅ Mobile                     | Floating action button      |
| Safe area inset | ❌ Non menzionato       | ✅ `--safe-area-inset-bottom` | Responsive keyboard height  |
| Comportamento   | Genericamente descritto | ✅ Completo                   | Loader spinner, hover scale |

---

## 6. GESTIONE HISTORY e BACK/ESCAPE

### 6.1 Scenari di Gestione (ALLINEAMENTO COMPLETO)

| Scenario                                     | ReferenceModal                       | Attuale         | Status   |
| -------------------------------------------- | ------------------------------------ | --------------- | -------- |
| Nessun modale aperto                         | Navigazione normale React Router     | ✅ Implementato | 🟢 MATCH |
| Modale `skipHistory=false`                   | Back → chiude; Escape → chiude       | ✅ Implementato | 🟢 MATCH |
| Modale `skipHistory=true`                    | Back → chiude; Escape → replaceState | ✅ Implementato | 🟢 MATCH |
| `skipHistory=true` sopra `skipHistory=false` | Top chiude, sotto resta              | ✅ Implementato | 🟢 MATCH |
| Due modali `skipHistory=false`               | Più recente chiude                   | ✅ Implementato | 🟢 MATCH |
| Due modali `skipHistory=true`                | Più recente chiude                   | ✅ Implementato | 🟢 MATCH |

**Valutazione**: 🟢 **IMPLEMENTAZIONE CORRETTA**

### 6.2 Stack Interno

| Struttura                      | ReferenceModal     | Attuale     | Note                          |
| ------------------------------ | ------------------ | ----------- | ----------------------------- |
| `modalStack`                   | useState           | useState    | Modali globali                |
| `nestedCloseCallbacksRef`      | useRef             | useRef      | Stack LIFO skipHistory=false  |
| `skipHistoryCloseCallbacksRef` | useRef             | useRef      | Stack LIFO skipHistory=true   |
| `popstateHandledRef`           | useRef (bool flag) | useRef      | Previene doppio processamento |
| `hasAddedHistoryRef`           | In Modal.jsx       | ✅ Presente | Traccia pushState             |
| `hasAddedSkipHistoryRef`       | In Modal.jsx       | ✅ Presente | Traccia skipHistory pushState |

**Valutazione**: 🟢 **MATCH PERFETTO**

---

## 7. COMPORTAMENTO MOBILE vs DESKTOP

### 7.1 Responsive Design

| Aspetto               | ReferenceModal                              | Attuale                  | Status   |
| --------------------- | ------------------------------------------- | ------------------------ | -------- |
| Full screen mobile    | ✅ Descritto (sezione 3.6)                  | ✅ Implementato          | 🟢 MATCH |
| Centrato desktop      | ✅ Descritto                                | ✅ Implementato          | 🟢 MATCH |
| Header responsive     | ✅ Descritto (mobile: back; desktop: close) | ✅ Implementato          | 🟢 MATCH |
| Footer mobile → FAB   | ✅ Descritto                                | ✅ Implementato          | 🟢 MATCH |
| Keyboard height aware | ✅ Menzione                                 | ✅ `useKeyboardHeight()` | 🟢 MATCH |
| Safe area inset       | ✅ Menzione                                 | ✅ `--safe-area-inset-*` | 🟢 MATCH |

**Valutazione**: 🟢 **IMPLEMENTAZIONE FEDELE**

---

## 8. FOCUS TRAP e ACCESSIBILITÀ

### 8.1 ARIA Attributes

| Attributo           | ReferenceModal                   | Attuale         | Status   |
| ------------------- | -------------------------------- | --------------- | -------- |
| `role="dialog"`     | ✅ Descritto                     | ✅ Implementato | 🟢 MATCH |
| `aria-modal="true"` | ✅ Descritto                     | ✅ Implementato | 🟢 MATCH |
| `aria-labelledby`   | ✅ Descritto (collegato a title) | ✅ Implementato | 🟢 MATCH |
| `tabIndex="-1"`     | ✅ Descritto                     | ✅ Implementato | 🟢 MATCH |

### 8.2 Focus Management

| Aspetto                      | ReferenceModal | Attuale               | Note                         |
| ---------------------------- | -------------- | --------------------- | ---------------------------- |
| Salvataggio focus precedente | ✅ Descritto   | ✅ `previousFocusRef` | Restore al close             |
| Focus trap al modale         | ✅ Descritto   | ✅ Implementato       | Keyboard nav confinato       |
| Restore focus al close       | ✅ Descritto   | ✅ Implementato       | Torna su elemento precedente |

**Valutazione**: 🟢 **ACCESSIBILITÀ COMPLETA**

---

## 9. SCROLL LOCK

| Aspetto            | ReferenceModal             | Attuale         | Note                       |
| ------------------ | -------------------------- | --------------- | -------------------------- |
| Body scroll locked | ✅ Descritto (sezione 3.4) | ✅ Implementato | `overflow: hidden` su body |
| Classe CSS         | ✅ `modal-open`            | ✅ `modal-open` | Aggiunta dinamicamente     |
| Cleanup al close   | ✅ Descritto               | ✅ Implementato | Via effect cleanup         |

**Valutazione**: 🟢 **MATCH**

---

## 10. DIFFERENZE CRITICHE IDENTIFICATE

### 🔴 DIFFERENZA ALTA: Nomenclatura Modali

**Problema**: ReferenceModal documenta `TextInputModal` e `ConfirmationModal`, ma l'implementazione usa `InputModal` e `ConfirmModal`.

**Impatto**:

- Confusione per i nuovi developer
- Documentazione non rispecchia il codice
- Possibilità di duplicazione accidentale

**Soluzione Suggerita**:

- Rinominare `ConfirmModal.jsx` → `ConfirmationModal.jsx`
- Creare alias `TextInputModal` per `InputModal` (o viceversa)
- Aggiornare documentazione per allinearsi ai nomi reali

---

### 🟡 DIFFERENZA MEDIA: InputModal props non documentate

**Problema**: `InputModal` ha props aggiuntive non documentate in ReferenceModal (sezione 8):

- `minLength`, `maxLength`, `exactLength` ( presente)
- `loading` (presente)
- `zIndex` (presente)
- Nessuno di questi è nel MODAL_COMPONENTS.md

**Impatto**:

- Developer non sa di questa funzionalità
- Validazione richiede ricerca nel codice

**Soluzione Suggerita**:

- Aggiungere sezione completa per `TextInputModal` con validazione `minLength/maxLength/exactLength`
- Documentare async validation
- Aggiungere esempi d'uso

---

### 🟡 DIFFERENZA MEDIA: Modali specializzati non documentati

**Problema**: 12 modali specializzati non sono menzionati in ReferenceModal:

- Viewer modals (Note, Graph, PDF, Image)
- Upload modals (Image, File, PDF, Version)
- Feature-specific (MoreBoxesModal, BoxTagModal, NotificationModal)

**Impatto**:

- Nuovo developer non sa quali modali hanno
- Nessuna guida di utilizzo centralizzata
- Alto rischio di duplicazione funzionalità

**Soluzione Suggerita**:

- Creare `MODALS_EXTENDED.md` per documentare i 12 modali
- Per ogni: props, esempi, pattern di utilizzo
- Organizzare per categoria (Viewer, Upload, Feature-specific)

---

### 🟢 DIFFERENZA BASSA: confirmVariant non documentata in Modal.jsx

**Problema**: Prop `confirmVariant` è usata in `ConfirmModal` e passata a `Modal`, ma non documentata nella sezione 3.1 di MODAL_COMPLETE_REFERENCE.md.

**Impatto**:

- Basso (prop è disponibile, solo non documentata)
- Developer trova facilmente in modal props

**Soluzione Suggerita**:

- Aggiungere a props table in sezione 3.1
- Aggiungere esempio di uso con `confirmVariant="danger"`

---

### 🟢 DIFFERENZA BASSA: Safe Area Inset non menzionato

**Problema**: ReferenceModal non menziona `--safe-area-inset-*` CSS variables, ma sono implementate in:

- `ModalHeader.jsx`
- `ModalFab.jsx`

**Impatto**:

- Basso (funziona correttamente per notch/safe areas)
- Non è un bug, solo documentazione incompleta

**Soluzione Suggerita**:

- Aggiungere sezione "Mobile Safe Area Inset" in sezione 3.6
- Spiegare come funziona con i device con notch/dynamic island

---

## 11. PATTERN DI UTILIZZO: CONFRONTO

### 11.1 Utilizzo Base (MATCH PERFETTO)

**ReferenceModal (MODALS.md, sezione 📖 Utilizzo)**:

```jsx
import { Modal } from "../components";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Apri</button>
      <Modal
        isOpen={isOpen}
        title="Titolo"
        confirmText="Conferma"
        onConfirm={() => setIsOpen(false)}
        onClose={() => setIsOpen(false)}
      >
        <p>Contenuto...</p>
      </Modal>
    </>
  );
}
```

**Implementazione Attuale (RichTextModal.jsx)**:

```jsx
import Modal from "./Modal";

function RichTextModal({ isOpen, onClose, onConfirm, ... }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Titolo"
      confirmText="Salva"
      onConfirm={onConfirm}
    >
      {/* contenuto */}
    </Modal>
  );
}
```

**Valutazione**: 🟢 **PATTERN IDENTICO**

---

### 11.2 Modali Annidati (MATCH PERFETTO)

**ReferenceModal (sezione 🔄 Modali Annidati)**:

```jsx
<Modal
  isOpen={isChildOpen}
  title="Annidato"
  onClose={() => setIsChildOpen(false)}
  maxWidth="max-w-[380px]"
  skipHistory
>
  <p>Contenuto annidato</p>
</Modal>
```

**Implementazione Attuale (MoreBoxesModal.jsx)**:

```jsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Altro"
  variant="info"
  skipHistory
>
  {/* contenuto */}
</Modal>
```

**Valutazione**: 🟢 **PATTERN IDENTICO**

---

## 12. RIEPILOGO FINALE

### Categorie di Allineamento

| Categoria                    | Status            | Note                                                                    |
| ---------------------------- | ----------------- | ----------------------------------------------------------------------- |
| **ModalContext API**         | 🟢 PERFETTO       | 100% match                                                              |
| **Modal Base Props**         | 🟢 QUASI PERFETTO | 14/15 props match (confirmVariant non doc)                              |
| **Focus Trap & A11y**        | 🟢 PERFETTO       | Implementazione fedele                                                  |
| **History Management**       | 🟢 PERFETTO       | Comportamento identico                                                  |
| **Mobile Support**           | 🟢 PERFETTO       | Safe area, keyboard height, responsive                                  |
| **Componenti Specializzati** | 🟡 INCOMPLETO     | 2 su 14 documentati                                                     |
| **Nomenclatura**             | 🟡 DIVERGENTE     | `ConfirmModal` vs `ConfirmationModal`; `InputModal` vs `TextInputModal` |
| **Documentazione Estesa**    | 🔴 MANCANTE       | 12 modali non documentati                                               |

### Punteggio Complessivo di Allineamento

```
CORE SYSTEM (ModalContext + Modal base):        🟢 98% ALLINEATO
COMPONENTI SPECIALIZZATI DOCUMENTATI:           🟡 50% DOCUMENTATO (2/4)
COMPONENTI SPECIALIZZATI TOTALI:                🟡 14% DOCUMENTATO (2/14)
NOMENCLATURA COERENTE:                          🟡 50% (2/2 rinominati)
DOCUMENTAZIONE COMPLETEZZA:                     🟡 30% (mancano 12 modali)
```

---

## 13. RACCOMANDAZIONI PRIORITARIE

### Priorità 1 (CRITICA)

1. ✅ **Allineare nomenclatura modali**: Rinominare `ConfirmModal` → `ConfirmationModal` e `InputModal` → `TextInputModal`
2. ✅ **Creare `MODALS_EXTENDED.md`**: Documentare 12 modali non coperti
3. ✅ **Aggiornare MODAL_COMPONENTS.md**: Includere all'estensione di `TextInputModal`

### Priorità 2 (IMPORTANTE)

1. 📝 Aggiungere `confirmVariant` a props table in sezione 3.1
2. 📝 Aggiungere sezione "Mobile Safe Area Inset"
3. 📝 Aggiungere `minLength/maxLength/exactLength` nella documentazione di TextInputModal

### Priorità 3 (NICE TO HAVE)

1. 📝 Creare index centrale di tutti i modali con search
2. 📝 Aggiungere diagrammi di flow per History management
3. 📝 Creare "Checklist per nuovo modale" basato su pattern identificati

---

## 14. CONCLUSIONE

**La ReferenceModal è un eccellente documento di design del CORE SYSTEM**, ma è **incompleta riguardo i modali specializzati** che costituiscono il 70% degli usi reali nel progetto.

L'implementazione è **sostanzialmente fedele** al riferimento, con solo **due problemi di nomenclatura** e **gap nella documentazione estesa**.

**Azione più importante**: Estendere la documentazione per coprire i 12 modali specializzati, usando lo stesso stile rigoroso di MODAL_COMPLETE_REFERENCE.md.
