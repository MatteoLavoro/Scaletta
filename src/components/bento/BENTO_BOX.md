# Sistema Bento Box - Documentazione

## Panoramica

Il sistema **Bento Box** è un layout dinamico a griglia che organizza i contenuti in riquadri (box) di varie altezze distribuiti su colonne. L'obiettivo è creare un layout visivamente bilanciato dove le colonne abbiano altezze il più simili possibile.

---

## Principi di Design

### 1. Griglia a Colonne Fisse

- **Larghezza colonne**: Tutte le colonne hanno la stessa larghezza (distribuzione equa dello spazio)
- **Altezza box**: Fissa e standard per ogni box - non si modifica in base allo schermo
- **Numero colonne responsive**:
  - 📱 **Mobile** (< 640px): 1 colonna
  - 📱 **Tablet** (640px - 1023px): 2 colonne
  - 💻 **Desktop** (≥ 1024px): 3 colonne

### 2. Distribuzione Bilanciata

L'algoritmo distribuisce i box nelle colonne in modo che l'altezza totale di ogni colonna sia il più simile possibile. Questo crea un layout esteticamente piacevole senza grandi spazi vuoti.

**Algoritmo di distribuzione**:

1. Ordina i box per altezza (decrescente) - i box più alti vengono posizionati prima
2. Per ogni box, trova la colonna con l'altezza totale minore
3. Aggiungi il box a quella colonna
4. Ripeti fino a posizionare tutti i box

### 3. Altezze Standard

Ogni box ha un'altezza fissa che può essere:

- **Piccolo (sm)**: 100px
- **Medio (md)**: 200px - default
- **Grande (lg)**: 300px
- **Extra-large (xl)**: 400px
- **Personalizzata**: Altezza specifica in pixel

---

## Struttura del Bento Box

Ogni Bento Box ha una struttura standard:

```
┌────────────────────────────────────┐
│  Titolo (centrato)           [⋮]  │  ← Header con titolo e kebab menu
├────────────────────────────────────┤  ← Divider
│                                    │
│         Contenuto                  │  ← Area contenuto (varia per tipo)
│                                    │
├────────────────────────────────────┤  ← Divider (opzionale)
│  [ Azione 1 ]  [ Azione 2 ]        │  ← Azioni rapide (opzionali)
└────────────────────────────────────┘
```

### Header

- **Titolo**: Centrato, testo semibold
- **Kebab Menu**: A destra, con opzioni del box
  - "Cambia titolo" (sempre presente)
  - Altre opzioni specifiche per tipo di box

### Contenuto

- Area centrale scrollabile
- Contenuto specifico per ogni tipo di box (note, file, immagini, etc.)

### Azioni Rapide (opzionali)

- Tasti in fondo al box per azioni comuni
- Varianti: default, primary, danger

---

## Architettura Componenti

```
src/components/bento/
├── BENTO_BOX.md          # Questa documentazione
├── BaseBentoBox.jsx      # Componente base (ereditato da tutti i box)
├── BentoGrid.jsx         # Container griglia principale
├── BentoBox.jsx          # Box semplice (senza struttura)
├── bentoConstants.js     # Costanti (altezze, etc.)
├── useBentoLayout.js     # Hook per calcolo layout
└── index.js              # Esportazioni pubbliche
```

### BaseBentoBox (Componente Base)

Il componente che tutti i Bento Box specifici erediteranno.

```jsx
<BaseBentoBox
  title="Note"
  height={200}
  onTitleChange={(newTitle) => handleTitleChange(newTitle)}
  menuItems={[
    {
      label: "Elimina",
      icon: <TrashIcon />,
      danger: true,
      onClick: handleDelete,
    },
  ]}
  actions={[
    {
      label: "Aggiungi",
      icon: <PlusIcon />,
      variant: "primary",
      onClick: handleAdd,
    },
  ]}
>
  {/* Contenuto specifico del box */}
</BaseBentoBox>
```

**Props:**
| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `title` | `string` | `"Box"` | Titolo del box |
| `onTitleChange` | `function` | - | Callback cambio titolo (abilita modifica) |
| `height` | `number\|string` | `"md"` | Altezza in pixel o preset |
| `children` | `node` | - | Contenuto del box |
| `menuItems` | `array` | `[]` | Voci aggiuntive kebab menu |
| `actions` | `array` | `[]` | Azioni rapide in fondo al box |
| `className` | `string` | `""` | Classi CSS aggiuntive |

### BentoAction (Tasto Azione)

Componente per le azioni rapide in fondo al box.

```jsx
<BentoAction
  label="Aggiungi nota"
  icon={<PlusIcon />}
  variant="primary"
  onClick={handleAdd}
/>
```

**Props:**
| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `label` | `string` | - | Testo del tasto |
| `icon` | `node` | - | Icona (opzionale) |
| `onClick` | `function` | - | Handler click |
| `variant` | `string` | `"default"` | Variante: "default" \| "primary" \| "danger" |

### BentoGrid

Il componente container che gestisce la griglia responsive.

```jsx
<BentoGrid items={boxes} gap={16}>
  {(box) => (
    <BaseBentoBox key={box.id} title={box.title} height={box.height}>
      {box.content}
    </BaseBentoBox>
  )}
</BentoGrid>
```

**Props:**
| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `items` | `array` | `[]` | Array di oggetti box con `id` e `height` |
| `children` | `function` | - | Render function che riceve ogni box |
| `gap` | `number` | `16` | Spazio tra i box in pixel |
| `className` | `string` | `""` | Classi CSS aggiuntive |

### useBentoLayout (Hook)

Hook per calcolare la distribuzione ottimale dei box.

```jsx
const { columns, columnCount } = useBentoLayout(items, gap);
```

---

## Tipi di Bento Box (Futuro)

Il sistema è progettato per supportare vari tipi di contenuto:

| Tipo                   | Descrizione            | Altezza Tipica |
| ---------------------- | ---------------------- | -------------- |
| 📝 **NoteBentoBox**    | Testo libero, markdown | md/lg          |
| 🖼️ **ImageBentoBox**   | Foto, screenshot       | md/lg          |
| 📄 **FileBentoBox**    | Documenti con preview  | lg             |
| 👤 **ContactBentoBox** | Anagrafiche persone    | md             |
| 🔗 **LinkBentoBox**    | Link esterni           | sm             |
| 📊 **DataBentoBox**    | Dati strutturati       | variabile      |

---

## Esempio di Implementazione Box Specifico

```jsx
// NoteBentoBox.jsx - Box per note testuali
import { BaseBentoBox, BentoAction } from "../bento";
import { PlusIcon, TrashIcon } from "../icons";

const NoteBentoBox = ({ id, title, content, onTitleChange, onDelete }) => {
  return (
    <BaseBentoBox
      title={title}
      height="md"
      onTitleChange={onTitleChange}
      menuItems={[
        { separator: true },
        {
          label: "Elimina",
          icon: <TrashIcon />,
          danger: true,
          onClick: onDelete,
        },
      ]}
      actions={[{ label: "Modifica", variant: "primary", onClick: () => {} }]}
    >
      <p className="text-sm text-text-secondary">
        {content || "Nessuna nota..."}
      </p>
    </BaseBentoBox>
  );
};

export default NoteBentoBox;
```

---

## Performance

### Ottimizzazioni Implementate

1. **Ricalcolo solo quando necessario**: Il layout viene ricalcolato solo quando cambiano gli items o il numero di colonne
2. **useMemo per distribuzione**: L'algoritmo di distribuzione è memoizzato
3. **Debounce resize**: Il cambio colonne su resize è debounced per evitare troppi ricalcoli

---

## Changelog

### v1.1.0 (Dicembre 2025)

- Aggiunto `BaseBentoBox` come componente base
- Struttura standard con header, divider, contenuto, azioni
- Kebab menu con opzione "Cambia titolo"
- Rimossa struttura di test

### v1.0.0 (Dicembre 2025)

- Implementazione iniziale
- Griglia responsive 1/2/3 colonne
- Algoritmo distribuzione bilanciata
