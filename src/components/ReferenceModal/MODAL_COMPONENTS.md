# Componenti Modal

Componenti modali specializzati.

---

## 📦 Disponibili

- **Modal** - Base component (vedi [MODALS.md](./MODALS.md))
- **TextInputModal** - Input con validazione
- **ConfirmationModal** - Conferma azioni

---

## 📝 TextInputModal

Input testuale con validazione avanzata.

### Features

- Validazione sync/async
- Vincoli lunghezza (min/max/exact)
- Character counter
- Enter to submit
- Auto-focus
- Smart disable (se valore non cambiato)

### Props

| Prop           | Tipo              | Default           | Descrizione                                                                     |
| -------------- | ----------------- | ----------------- | ------------------------------------------------------------------------------- |
| `isOpen`       | `boolean`         | -                 | **Required.** Stato                                                             |
| `title`        | `string`          | `"Modifica"`      | Titolo                                                                          |
| `label`        | `string`          | -                 | Label input                                                                     |
| `placeholder`  | `string`          | `""`              | Placeholder del campo                                                           |
| `initialValue` | `string`          | `""`              | Valore iniziale                                                                 |
| `confirmText`  | `string`          | `"Salva"`         | Testo bottone conferma                                                          |
| `description`  | `string`          | -                 | Descrizione opzionale sotto il titolo                                           |
| `onConfirm`    | `function(value)` | -                 | **Required.** Callback                                                          |
| `onClose`      | `function`        | -                 | **Required.** Callback chiusura                                                 |
| `validate`     | `function(value)` | -                 | Validazione custom                                                              |
| `minLength`    | `number`          | -                 | Lunghezza minima                                                                |
| `maxLength`    | `number`          | -                 | Lunghezza massima                                                               |
| `exactLength`  | `number`          | -                 | Lunghezza esatta (prioritaria)                                                  |
| `type`         | `string`          | `"text"`          | Tipo input                                                                      |
| `loading`      | `boolean`         | `false`           | Stato caricamento                                                               |
| `zIndex`       | `number`          | -                 | z-index personalizzato                                                          |
| `skipHistory`  | `boolean`         | `false`           | Se `true`, non usa `history.back()`. Usare quando aperto sopra un altro modale. |
| `maxWidth`     | `string`          | `"max-w-[440px]"` | Classe Tailwind larghezza massima                                               |

### Esempio Base

```jsx
import { useState } from "react";
import { TextInputModal } from "../components";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState("Mario");

  const handleSave = async (newValue) => {
    await saveUsername(newValue);
    setUserName(newValue);
    setIsOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Modifica</button>
      <TextInputModal
        isOpen={isOpen}
        title="Modifica Nome"
        label="Nome"
        initialValue={userName}
        onConfirm={handleSave}
        onClose={() => setIsOpen(false)}
        minLength={2}
        maxLength={50}
      />
    </>
  );
}
```

### Con Validazione Async

```jsx
const validateEmail = async (email) => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Email non valida";
  }

  const isAvailable = await checkEmailAvailability(email);
  if (!isAvailable) return "Email già in uso";

  return null;
};

<TextInputModal
  isOpen={isOpen}
  title="Modifica Email"
  label="Email"
  type="email"
  initialValue={email}
  onConfirm={handleSave}
  onClose={() => setIsOpen(false)}
  validate={validateEmail}
/>;
```

---

## ✅ ConfirmationModal

Conferma azioni con design moderno e icona.

### Props

| Prop          | Tipo        | Default           | Descrizione                                                                     |
| ------------- | ----------- | ----------------- | ------------------------------------------------------------------------------- |
| `isOpen`      | `boolean`   | -                 | **Required.** Stato                                                             |
| `title`       | `string`    | `"Conferma"`      | Titolo                                                                          |
| `message`     | `string`    | -                 | **Required.** Messaggio                                                         |
| `confirmText` | `string`    | `"Conferma"`      | Testo bottone conferma                                                          |
| `onConfirm`   | `function`  | -                 | **Required.** Callback conferma                                                 |
| `onCancel`    | `function`  | -                 | **Required.** Callback annulla (chiamata da X e Back)                           |
| `isDanger`    | `boolean`   | `false`           | Usa colori rossi (danger)                                                       |
| `loading`     | `boolean`   | `false`           | Stato caricamento                                                               |
| `icon`        | `ReactNode` | auto              | Icona custom                                                                    |
| `zIndex`      | `number`    | -                 | z-index personalizzato                                                          |
| `skipHistory` | `boolean`   | `false`           | Se `true`, non usa `history.back()`. Usare quando aperto sopra un altro modale. |
| `maxWidth`    | `string`    | `"max-w-[360px]"` | Classe Tailwind larghezza massima                                               |

### Esempio

```jsx
import { useState } from "react";
import { ConfirmationModal } from "../components";

function MyComponent() {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleConfirm = async () => {
    await performAction();
    setIsConfirmOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsConfirmOpen(true)}>Esegui Azione</button>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        title="Conferma Operazione"
        message="Sei sicuro di voler procedere con questa operazione?"
        confirmText="Continua"
        onConfirm={handleConfirm}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </>
  );
}
```

### Esempi Uso

```jsx
// Azione pericolosa
<ConfirmationModal isOpen={isOpen} title="Elimina DDT"
  message="Questa azione è irreversibile."
  confirmText="Elimina" isDanger={true}
  onConfirm={handleDelete} onCancel={handleCancel} />

// Con loading
<ConfirmationModal isOpen={isOpen} loading={isLoading}
  onConfirm={handleAsyncAction} />

// Icona custom
<ConfirmationModal icon={CheckCircle} />

// Modali annidati: sempre siblings in un Fragment, mai children
<>
  <TextInputModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} ... />
  <ConfirmationModal
    isOpen={isConfirmOpen}
    onCancel={() => setIsConfirmOpen(false)}
    skipHistory
  />
</>
```

---

## 🎨 Design Guidelines

| Variante   | Background Box | Icona BG  | Icona Color |
| ---------- | -------------- | --------- | ----------- |
| **Info**   | `#1c2f42`      | `#2d3e50` | `#4a9eff`   |
| **Danger** | `#311f1f`      | `#4d3232` | `#e57373`   |

**UX**: Messaggi chiari, conferme esplicite per azioni distruttive, loading feedback, focus trap.  
**A11y**: Keyboard navigation (Tab, Enter, ESC), ARIA labels, focus management, contrasto WCAG 2.1 AA.

**Sistema Modal Base**: History integrato, modali annidati, responsive, animazioni, FAB mobile con keyboard offset.

---

## 📄 License

MIT - DDT Manager Project
