# Sistema Bento Box - Documentazione

## Panoramica

Il sistema **Bento Box** è un layout dinamico a griglia che organizza i contenuti in riquadri (box) di varie altezze distribuiti su colonne. L'obiettivo è creare un layout visivamente bilanciato dove le colonne abbiano altezze il più simili possibile.

**Caratteristiche principali:**

- 📱 Layout responsive (1-3 colonne)
- 🔄 Sincronizzazione in tempo reale tra dispositivi (Firestore `onSnapshot`)
- ✨ Animazioni FLIP per transizioni fluide
- 📏 Algoritmo "shortest column first" per distribuzione ottimale

---

## Principi di Design

### 1. Griglia a Colonne Fisse

- **Larghezza colonne**: `BOX_WIDTH = 320px` (desktop), `100%` (mobile)
- **Gap tra box**: `GAP = 16px`
- **Altezza box**: Auto-dimensionante in base al contenuto
- **Numero colonne responsive**:
  - 📱 **Mobile** (< 640px): 1 colonna (100% larghezza)
  - 📱 **Tablet** (640px - 1023px): 2 colonne
  - 💻 **Desktop** (1024px - 1343px): 3 colonne
  - 🖥️ **Large** (≥ 1344px): 4 colonne

### 2. Distribuzione "Shortest Column First"

L'algoritmo distribuisce i box nelle colonne in modo che l'altezza totale di ogni colonna sia il più simile possibile.

**Algoritmo di distribuzione**:

1. Per ogni box (in ordine di creazione):
   - Trova la colonna con l'altezza totale minore
   - Aggiungi il box a quella colonna
   - Aggiorna l'altezza totale della colonna
2. Quando un box cambia altezza, ricalcola la distribuzione
3. Anima le transizioni con tecnica FLIP

### 3. Sincronizzazione Real-Time

I box sono sincronizzati in tempo reale tra tutti i dispositivi usando Firebase Firestore:

- **`onSnapshot`**: Listener per aggiornamenti istantanei
- **Nessun refresh necessario**: Le modifiche da PC appaiono subito su mobile e viceversa
- **Struttura dati**: `projects/{projectId}/bentoBoxes/{boxId}`

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

- **Titolo**: Centrato, testo semibold (max 50 caratteri)
- **Kebab Menu**: A destra, in cerchietto grigio
  - Items specifici del tipo di box (in cima)
  - Separatore (se ci sono items specifici)
  - "Cambia titolo" (universale)
  - "Elimina box" (universale, in rosso)

### Contenuto

- Area centrale con padding
- Contenuto specifico per ogni tipo di box

### Azioni Rapide (opzionali)

- Tasti in fondo al box per azioni comuni
- Varianti: `default`, `primary`, `danger`

---

## Architettura Componenti

```
src/components/bento/
├── BENTO_BOX.md           # Questa documentazione
├── BaseBentoBox.jsx       # Componente base per tutti i box
├── NoteBox.jsx            # Box per note testuali
├── TutorialBox.jsx        # Box tutorial (primo avvio)
├── AddBentoBoxButton.jsx  # Griglia 2x2 per aggiungere box (desktop)
│   └── MobileAddFab       # Barra flottante (mobile)
├── BentoGrid.jsx          # Container griglia principale
├── BentoBox.jsx           # Box semplice generico
├── bentoConstants.js      # Costanti (altezze preset)
├── useBentoLayout.js      # Hook legacy (non usato)
└── index.js               # Esportazioni pubbliche

src/hooks/
└── useBentoAnimation.js   # Hook per layout + animazioni FLIP
```

---

## Componenti

### BaseBentoBox

Il componente base che tutti i Bento Box specifici estendono.

```jsx
<BaseBentoBox
  title="Note"
  onTitleChange={(newTitle) => handleTitleChange(newTitle)}
  onDelete={() => handleDelete()}
  minHeight={120}
  menuItems={[
    {
      label: "Modifica nota",
      icon: <PencilIcon />,
      onClick: handleEdit,
    },
  ]}
  actions={[
    {
      label: "Salva",
      icon: <CheckIcon />,
      variant: "primary",
      onClick: handleSave,
    },
  ]}
>
  {/* Contenuto specifico del box */}
</BaseBentoBox>
```

**Props:**
| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `title` | `string` | `"Box"` | Titolo del box (max 50 char) |
| `onTitleChange` | `function` | - | Callback cambio titolo |
| `onDelete` | `function` | - | Callback eliminazione |
| `minHeight` | `number` | - | Altezza minima in pixel |
| `children` | `node` | - | Contenuto del box |
| `menuItems` | `array` | `[]` | Voci specifiche kebab menu |
| `actions` | `array` | `[]` | Azioni rapide in fondo |
| `className` | `string` | `""` | Classi CSS aggiuntive |

### NoteBox

Box specializzato per note testuali.

```jsx
<NoteBox
  title="Appunti riunione"
  content="Testo della nota..."
  onTitleChange={handleTitleChange}
  onContentChange={handleContentChange}
  onDelete={handleDelete}
/>
```

**Caratteristiche:**

- Auto-dimensionamento in base al contenuto
- Mostra pulsante "Aggiungi nota" se vuoto
- Menu con "Modifica nota"
- Max 2000 caratteri

### TutorialBox

Box informativo che appare quando il progetto è vuoto.

```jsx
<TutorialBox isMobile={false} />
```

**Caratteristiche:**

- Spiega come aggiungere il primo box
- Scompare automaticamente dopo il primo box
- Adatta il messaggio per mobile/desktop

### AddBentoBoxButton (Desktop)

Griglia 2x2 per selezionare il tipo di box da aggiungere.

```jsx
<AddBentoBoxButton onAddNote={handleAddNote} />
```

**Caratteristiche:**

- Aspect ratio quadrato (come un box)
- 4 slot per tipi di box (solo "Nota" attivo)
- Slot futuri disabilitati (grayed out)

### MobileAddFab

Barra flottante per mobile, posizionata in basso.

```jsx
<MobileAddFab onAddNote={handleAddNote} />
```

**Caratteristiche:**

- Fisso in basso, centrato
- Usa il colore del tema profilo (accent color)
- Testo auto-contrast (chiaro/scuro in base allo sfondo)
- Icona + testo "Aggiungi nota"

---

## Hook useBentoAnimation

Hook che gestisce layout e animazioni FLIP.

```jsx
const { containerRef, columns } = useBentoAnimation(items, columnCount, gap);
```

**Parametri:**
| Param | Tipo | Default | Descrizione |
|-------|------|---------|-------------|
| `items` | `array` | - | Array di elementi con `id` univoco |
| `columnCount` | `number` | - | Numero di colonne |
| `gap` | `number` | `16` | Gap tra i box |

**Return:**
| Prop | Tipo | Descrizione |
|------|------|-------------|
| `containerRef` | `ref` | Ref da applicare al container |
| `columns` | `array[]` | Array di array, ogni sub-array è una colonna |

**Funzionamento:**

1. **ResizeObserver**: Monitora le altezze di ogni box
2. **Distribuzione**: Ricalcola quando cambiano le altezze
3. **FLIP Animation**: Anima le transizioni di posizione

---

## Costanti

```javascript
// hooks/useColumnCount.js
export const BOX_WIDTH = 320; // Larghezza box desktop
export const GAP = 16; // Gap tra i box

// components/bento/bentoConstants.js
export const HEIGHT_PRESETS = {
  sm: 100, // Piccolo
  md: 200, // Medio (default)
  lg: 300, // Grande
  xl: 400, // Extra-large
};
```

---

## Sincronizzazione Firebase

### Struttura Dati

```
projects/
  └── {projectId}/
      └── bentoBoxes/
          └── {boxId}/
              ├── id: string
              ├── title: string
              ├── boxType: "note" | "generic"
              ├── content: string
              ├── height: number
              └── createdAt: timestamp
```

### Funzioni Service

```javascript
// services/projects.js

// Sottoscrizione real-time
subscribeToBentoBoxes(projectId, onUpdate) → unsubscribe

// CRUD operations
createBentoBox(projectId, boxData) → box
updateBentoBoxTitle(projectId, boxId, newTitle)
updateBentoBoxContent(projectId, boxId, newContent)
deleteBentoBox(projectId, boxId)
```

---

## Tipi di Box (Roadmap)

| Tipo                | Stato     | Descrizione           |
| ------------------- | --------- | --------------------- |
| 📝 **NoteBox**      | ✅ Attivo | Note testuali         |
| 🖼️ **ImageBox**     | 🔜 Futuro | Foto, screenshot      |
| 📄 **FileBox**      | 🔜 Futuro | Documenti con preview |
| 👤 **ContactBox**   | 🔜 Futuro | Anagrafiche persone   |
| 🔗 **LinkBox**      | 🔜 Futuro | Link esterni          |
| ✅ **ChecklistBox** | 🔜 Futuro | Liste di task         |

---

## Performance

### Ottimizzazioni Implementate

1. **useMemo**: Distribuzione colonne memoizzata
2. **ResizeObserver**: Solo su cambio altezza effettivo (threshold 2px)
3. **FLIP animations**: Transizioni GPU-accelerate
4. **Real-time sync**: Solo dati modificati via `onSnapshot`

---

## Changelog

### v1.3.0 (Dicembre 2025)

- ⚡ Sincronizzazione real-time con `onSnapshot`
- 🔧 Rimosso caching Firebase dal Service Worker
- 📱 Colonne mobile a 100% larghezza

### v1.2.0 (Dicembre 2025)

- 🎨 MobileAddFab con colore tema profilo
- 🔤 Auto-contrast testo (chiaro/scuro)
- 📐 Bottom padding aumentato per visibilità
- 🍔 Kebab menu riorganizzato (specifici → universali)

### v1.1.0 (Dicembre 2025)

- ✨ Algoritmo "shortest column first"
- 🎬 Animazioni FLIP
- 📏 ResizeObserver per altezze dinamiche

### v1.0.0 (Dicembre 2025)

- 🎉 Implementazione iniziale
- 📱 Griglia responsive 1-4 colonne
- 📝 NoteBox come primo tipo di box
