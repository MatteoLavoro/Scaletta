# Sistema Modale

Sistema di gestione modali con supporto per annidamento, history browser e responsive design.

## ✨ Caratteristiche

- Modali annidati con z-index automatico
- Gestione browser back button
- Focus trap e keyboard navigation
- Responsive (full screen mobile, centrato desktop)
- Animazioni smooth
- Mobile keyboard aware

---

## 📖 Utilizzo

```jsx
import { useState } from "react";
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

## 🔧 Props Principali

| Prop              | Tipo        | Default           | Descrizione                                                                    |
| ----------------- | ----------- | ----------------- | ------------------------------------------------------------------------------ |
| `isOpen`          | `boolean`   | -                 | **Required.** Stato apertura                                                   |
| `title`           | `string`    | -                 | **Required.** Titolo                                                           |
| `children`        | `ReactNode` | -                 | **Required.** Contenuto                                                        |
| `onClose`         | `function`  | -                 | **Required.** Callback chiusura                                                |
| `onConfirm`       | `function`  | -                 | Callback conferma                                                              |
| `confirmText`     | `string`    | `"Conferma"`      | Testo bottone conferma                                                         |
| `confirmDisabled` | `boolean`   | `false`           | Disabilita conferma                                                            |
| `confirmVariant`  | `string`    | `"primary"`       | Stile bottone: `"primary"` \| `"danger"` \| `"success"`                        |
| `isLoading`       | `boolean`   | `false`           | Mostra spinner                                                                 |
| `variant`         | `string`    | `"default"`       | `"default"` o `"info"` (nasconde il bottone Conferma)                          |
| `maxWidth`        | `string`    | `"max-w-[440px]"` | Larghezza max desktop                                                          |
| `skipHistory`     | `boolean`   | `false`           | Se `true`, chiude senza `history.back()`. Usare per modali sopra altri modali. |
| `closeRef`        | `ref`       | -                 | Ref che espone `handleClose` al parent (chiusura programmatica)                |

## 🔄 Modali Annidati

Per aprire un modale sopra un altro:

```jsx
function ParentModal({ isOpen, onClose }) {
  const [isChildOpen, setIsChildOpen] = useState(false);

  return (
    <>
      <Modal isOpen={isOpen} title="Padre" onClose={onClose}>
        <button onClick={() => setIsChildOpen(true)}>Apri Annidato</button>
      </Modal>

      {/* Il modale figlio è sempre un sibling nel Fragment, mai un child del padre */}
      <Modal
        isOpen={isChildOpen}
        title="Annidato"
        onClose={() => setIsChildOpen(false)}
        maxWidth="max-w-[380px]"
        skipHistory
      >
        <p>Contenuto annidato</p>
      </Modal>
    </>
  );
}
```

Z-index, history e focus trap sono gestiti automaticamente.

---

## 🎨 Varianti

### Standard

```jsx
<Modal isOpen={isOpen} title="Azione" onConfirm={save} onClose={close}>
  <input type="text" />
</Modal>
```

### Informativo (senza conferma)

```jsx
<Modal isOpen={isOpen} title="Info" variant="info" onClose={close}>
  <p>Informazione importante</p>
</Modal>
```

### Con Loading

```jsx
<Modal
  isOpen={isOpen}
  title="Salvataggio"
  onConfirm={save}
  onClose={close}
  isLoading={saving}
  confirmDisabled={saving}
>
  <p>Contenuto...</p>
</Modal>
```

---

## ⌨️ Keyboard & Accessibilità

- **ESC**: Chiude modale attivo
- **Tab/Shift+Tab**: Naviga elementi (focus trap)
- **Back Button**: Chiude modale
- **ARIA**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`

---

## 💡 Note

**Mobile:**

- Full screen
- FAB flottante che si sposta sopra la tastiera
- Animazione slide-up

**Desktop:**

- Centrato con overlay
- Max 85vh con scroll interno
- Footer con pulsanti
- Animazione scale + fade
