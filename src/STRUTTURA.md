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

### Pattern Implementativo

```jsx
const ParentModal = ({ isOpen }) => {
  const [isChildOpen, setIsChildOpen] = useState(false);

  // Apertura modale figlio
  const openChild = () => {
    setIsChildOpen(true);
  };

  // Chiusura modale figlio (chiamata da onClose)
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
        onClose={closeChild} // <-- Chiave: gestisce X e annulla
      />
    </>
  );
};
```

### Chiusura Corretta

- **X / Annulla**: Il modale chiama `onClose` → setta stato a false → torna al padre
- **Conferma/Salva**: `setIsChildOpen(false)` direttamente → resta nel padre
- **Niente pushState/popstate**: La navigazione history non è più usata per modali annidati

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
3. **Divisore** prima di azioni pericolose
4. **Azione pericolosa** in fondo con DangerButton
