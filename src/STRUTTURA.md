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

### `modal/` - Sistema Modale

| File               | Descrizione                                             |
| ------------------ | ------------------------------------------------------- |
| `Modal.jsx`        | Modale principale (mobile fullscreen, desktop centrato) |
| `ModalHeader.jsx`  | Header con titolo e tasto chiudi                        |
| `ModalFooter.jsx`  | Footer con bottone conferma (desktop)                   |
| `ModalFab.jsx`     | FAB conferma fluttuante (mobile)                        |
| `ConfirmModal.jsx` | Modale di conferma con box colorata                     |
| `InputModal.jsx`   | Modale di immissione testo                              |
| `index.js`         | Export pubblici                                         |

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

| File                  | Descrizione                                     |
| --------------------- | ----------------------------------------------- |
| `Button.jsx`          | Bottone con varianti/sizes e stato disabilitato |
| `Input.jsx`           | Input base (usa TextField invece)               |
| `PasswordInput.jsx`   | Password base (usa PasswordField invece)        |
| `Spinner.jsx`         | Indicatore caricamento                          |
| `ThemeSwitcher.jsx`   | Toggle tema chiaro/scuro (tondo)                |
| `ColorPicker.jsx`     | Selettore colore accent (6 colori)              |
| `ThemeSelector.jsx`   | Combinato: ColorPicker + ThemeSwitcher          |
| `InfoBox.jsx`         | Box info con stile (riquadro colorato)          |
| `EditableInfoBox.jsx` | InfoBox con tasto modifica (matita)             |
| `DangerButton.jsx`    | Tasto pericoloso con conferma prima di azione   |
| `Divider.jsx`         | Linea divisoria (non arriva ai bordi)           |

### `icons/` - Icone (wrapper lucide-react)

> **Nota:** Questi wrapper non sono più necessari, usa direttamente lucide-react

| File                  | Descrizione               |
| --------------------- | ------------------------- |
| `AlertCircleIcon.jsx` | Icona alert               |
| `ArrowLeftIcon.jsx`   | Freccia indietro          |
| `CheckIcon.jsx`       | Spunta                    |
| `CloseIcon.jsx`       | X chiudi                  |
| `EyeIcon.jsx`         | Occhio (mostra)           |
| `EyeOffIcon.jsx`      | Occhio barrato (nascondi) |

---

## `contexts/`

| File               | Descrizione                         |
| ------------------ | ----------------------------------- |
| `AuthContext.jsx`  | Stato autenticazione utente         |
| `ModalContext.jsx` | Stack modali + gestione history     |
| `ThemeContext.jsx` | Tema (chiaro/scuro) + colore accent |

---

## `hooks/`

| File                   | Descrizione                     |
| ---------------------- | ------------------------------- |
| `useIsMobile.js`       | Rileva viewport mobile (<768px) |
| `useKeyboardHeight.js` | Altezza tastiera virtuale       |
| `usePWAInstall.js`     | Gestione installazione PWA      |

---

## `pages/`

| File              | Descrizione                       |
| ----------------- | --------------------------------- |
| `WelcomePage.jsx` | Pagina iniziale (non autenticato) |
| `Dashboard.jsx`   | Pagina principale (autenticato)   |
| `LoadingPage.jsx` | Schermata caricamento             |
| `index.js`        | Export pubblici                   |

---

## `services/`

| File        | Descrizione                                             |
| ----------- | ------------------------------------------------------- |
| `config.js` | Configurazione Firebase                                 |
| `auth.js`   | Funzioni auth (login, register, logout, updateUsername) |

---

## `utils/`

| File                | Descrizione                         |
| ------------------- | ----------------------------------- |
| `authValidation.js` | Validazione email/password/username |

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

## Linee Guida Stile UI

### Principi Generali

1. **Riquadri con colore leggero** - Usa InfoBox per dati readonly con sfondo colorato leggero
2. **Bordi arrotondati** - `rounded-xl` (12px) per box, `rounded-full` per toggle/icone
3. **Spaziatura coerente** - `gap-4` tra elementi, `p-4` padding interno
4. **Divisori sottili** - `Divider` per separare sezioni logiche
5. **Bottoni azione in fondo** - Azioni pericolose con `DangerButton` in fondo al modale

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

## Componenti UI Stilizzati

### InfoBox - Box informativa colorata

```jsx
import InfoBox from "../ui/InfoBox";

<InfoBox title="Email" color="blue">
  <span>utente@email.com</span>
</InfoBox>;
```

Colori disponibili: `teal`, `blue`, `purple`, `red`, `orange`, `green`, `gray`

### EditableInfoBox - Box modificabile

```jsx
import EditableInfoBox from "../ui/EditableInfoBox";

<EditableInfoBox
  title="Nome utente"
  value="MioNome"
  color="purple"
  onEdit={() => setEditModalOpen(true)}
/>;
```

### Divider - Linea di separazione

```jsx
import Divider from "../ui/Divider";

// Spaziatura: "sm" | "md" | "lg"
<Divider spacing="sm" />;
```

Il Divider ha margine laterale e non arriva fino ai bordi.

### DangerButton - Tasto con conferma

```jsx
import DangerButton from "../ui/DangerButton";

<DangerButton
  confirmTitle="Esci"
  confirmMessage="Sei sicuro?"
  confirmText="Esci"
  onConfirm={handleLogout}
  zIndex={1010} // Per modali annidati
>
  <LogOut className="w-5 h-5" />
  Esci
</DangerButton>;
```

---

## Modali Annidati

### Concetto

Quando un modale apre un altro modale (es. ProfileModal → InputModal):

1. **z-Index**: Il modale padre usa z-index inferiore, il figlio superiore
2. **Blur**: Il modale padre applica blur al contenuto
3. **onClose callback**: Il modale figlio riceve `onClose` per tornare al padre
4. **History sincronizzata**: Ogni modale (anche annidato) aggiunge un entry nella browser history

### Sistema di Chiusura Modali e Browser History

Il sistema gestisce automaticamente la browser history per garantire che tutti i metodi di chiusura funzionino correttamente (tasto X, ESC, back button Chrome, back Android):

| Metodo di Chiusura  | Comportamento                                         |
| ------------------- | ----------------------------------------------------- |
| Tasto × / ←         | `history.back()` → trigghera `popstate` → `onClose()` |
| Tasto ESC           | `history.back()` → trigghera `popstate` → `onClose()` |
| Back button browser | `popstate` event → `onClose()`                        |
| Back Android        | `popstate` event → `onClose()`                        |

**Come funziona internamente:**

1. **Apertura modale normale** (`openModal`): Aggiunge entry nella history con `pushState`
2. **Apertura modale annidato** (con `onClose`): Aggiunge entry nella history con `pushState` + registra callback in `nestedCloseCallbacksRef`
3. **Chiusura** (qualsiasi metodo): Usa sempre `history.back()` che triggera `popstate`
4. **`popstate` handler**: Controlla prima i modali annidati, poi quelli normali, e chiama la callback appropriata

Questo garantisce che la browser history sia sempre sincronizzata con lo stato dei modali.

### Pattern Implementativo

```jsx
const ParentModal = ({ isOpen }) => {
  const [isChildOpen, setIsChildOpen] = useState(false);

  // Apertura modale figlio
  const openChild = () => {
    setIsChildOpen(true);
  };

  // Chiusura modale figlio (chiamata automaticamente da popstate)
  const closeChild = () => {
    setIsChildOpen(false);
  };

  // Salvataggio: chiude figlio e torna al padre
  const handleSave = async (value) => {
    await saveData(value);
    setIsChildOpen(false);
  };

  return (
    <>
      <Modal isOpen={isOpen} zIndex={isChildOpen ? 990 : 1000}>
        <div className={isChildOpen ? "blur-sm pointer-events-none" : ""}>
          {/* Contenuto */}
          <button onClick={openChild}>Modifica</button>
        </div>
      </Modal>

      <InputModal
        isOpen={isChildOpen}
        zIndex={1010}
        onConfirm={handleSave}
        onClose={closeChild} // <-- IMPORTANTE: gestisce TUTTI i metodi di chiusura
      />
    </>
  );
};
```

### Regole Importanti

1. **Passa sempre `onClose`** ai modali annidati - il sistema aggiungerà automaticamente un entry nella history e gestirà la chiusura
2. **z-Index**: Il modale figlio deve avere z-index maggiore del padre (es. padre 990, figlio 1010)
3. **Blur**: Applica `blur-sm pointer-events-none` al contenuto del padre quando il figlio è aperto
4. **Non chiamare mai `onClose()` direttamente** per chiudere - usa sempre il tasto X/← che fa `history.back()`

---

## Come Creare un Nuovo Modale

### Modale Standard con Conferma

```jsx
import { Modal } from "../modal";
import { TextField, FormSection } from "../form";

const MioModale = ({ isOpen }) => {
  const [valore, setValore] = useState("");

  return (
    <Modal
      isOpen={isOpen}
      title="Titolo"
      confirmText="Conferma"
      onConfirm={handleSubmit}
      confirmDisabled={!valore.trim()} // Bottone grigio se vuoto
      isLoading={loading}
    >
      <FormSection>
        <TextField
          label="Campo"
          value={valore}
          onChange={(e) => setValore(e.target.value)}
        />
      </FormSection>
    </Modal>
  );
};
```

### Modale Informativo (senza bottone conferma)

```jsx
<Modal isOpen={isOpen} title="Info" variant="info">
  <InfoBox title="Dati" color="teal">
    <span>Contenuto</span>
  </InfoBox>
</Modal>
```

### Modale di Conferma

Design con box colorata + icona:

```jsx
import { ConfirmModal } from "../modal";

<ConfirmModal
  isOpen={isOpen}
  title="Conferma eliminazione"
  message="Sei sicuro di voler eliminare questo elemento? L'azione non può essere annullata."
  confirmText="Elimina"
  cancelText="Annulla"
  onConfirm={handleDelete}
  onCancel={() => setIsOpen(false)}
  isDanger={true} // Box rossa con AlertTriangle
  zIndex={1010} // Per modali annidati
/>;
```

### Modale di Input

```jsx
import { InputModal } from "../modal";

<InputModal
  isOpen={isOpen}
  title="Modifica nome"
  label="Nome"
  placeholder="Inserisci nome"
  initialValue={currentValue}
  confirmText="Salva"
  onConfirm={handleSave}
  validate={(v) => (v.length < 3 ? "Min 3 caratteri" : null)}
  zIndex={1010} // Per modali annidati
/>;
```

---

## Struttura Modale Profilo (Riferimento)

Il ProfileModal è il modello di riferimento per strutturare i modali:

```
┌─────────────────────────────────────┐
│  Header: Titolo + X                 │
├─────────────────────────────────────┤
│                                     │
│  InfoBox "Email" (blue, readonly)   │
│                                     │
│  EditableInfoBox "Nome" (purple)    │
│                                     │
│  InfoBox "Aspetto" (teal)           │
│    └── ThemeSelector                │
│                                     │
│  ──────── Divider ────────          │
│                                     │
│  DangerButton "Esci"                │
│                                     │
└─────────────────────────────────────┘
```

Principi:

1. **Dati utente** in alto con InfoBox colorate
2. **Impostazioni** con ThemeSelector
3. **Bottone Installa App** (visibile solo se non installata)
4. **Divisore** prima di azioni pericolose
5. **Azione pericolosa** in fondo con DangerButton

---

## PWA (Progressive Web App)

L'app è configurata come PWA con le seguenti funzionalità:

### File PWA in `public/`

| File                           | Descrizione                       |
| ------------------------------ | --------------------------------- |
| `manifest.json`                | Manifest PWA con icone e metadata |
| `sw.js`                        | Service Worker per caching        |
| `favicon.svg`                  | Icona vettoriale                  |
| `favicon.ico`                  | Icona classica                    |
| `favicon-96x96.png`            | Icona 96x96                       |
| `apple-touch-icon.png`         | Icona per iOS                     |
| `web-app-manifest-192x192.png` | Icona PWA 192x192                 |
| `web-app-manifest-512x512.png` | Icona PWA 512x512                 |

### Hook `usePWAInstall`

```jsx
import { usePWAInstall } from "../hooks/usePWAInstall";

const MioComponente = () => {
  const { isInstallable, isInstalled, install, deviceInfo } = usePWAInstall();

  // isInstallable: true se il browser supporta l'installazione diretta
  // isInstalled: true se l'app è già installata
  // install(): avvia il prompt di installazione
  // deviceInfo: { isIOS, isAndroid, isMobile, needsManualInstall }
};
```

### InstallModal

Modale che mostra istruzioni per installare l'app, adattate al dispositivo:

- **iOS**: Istruzioni manuali (Condividi → Aggiungi a Home)
- **Android**: Installazione diretta se disponibile, altrimenti istruzioni
- **Desktop**: Installazione diretta se disponibile, altrimenti istruzioni

```jsx
import { InstallModal } from "../components/pwa";

<InstallModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
```
