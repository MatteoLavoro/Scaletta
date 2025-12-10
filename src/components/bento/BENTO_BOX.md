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
│ [📌]  Titolo (centrato)    [⋮]  │  ← Header con pin, titolo e kebab menu
├────────────────────────────────────┤  ← Divider
│                                    │
│         Contenuto                  │  ← Area contenuto (varia per tipo)
│                                    │
└────────────────────────────────────┘
```

### Header

- **Pin Button**: A sinistra, colore tema quando attivo
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
├── BaseBentoBox.jsx       # Componente base per tutti i box (include Pin)
├── NoteBox.jsx            # Box per note testuali
├── PhotoBox.jsx           # Box per foto con carosello
├── FileBox.jsx            # Box per file generici
├── TutorialBox.jsx        # Box tutorial (primo avvio)
├── AddBentoBoxButton.jsx  # Griglia per aggiungere box (desktop)
│   └── MobileAddFab       # Barra flottante (mobile)
├── CameraFab.jsx          # FAB per scattare foto (mobile)
├── BentoGrid.jsx          # Container griglia principale
├── BentoBox.jsx           # Box semplice generico
├── bentoConstants.js      # Costanti (altezze preset)
├── useBentoLayout.js      # Hook legacy (non usato)
└── index.js               # Esportazioni pubbliche

src/hooks/
├── useBentoAnimation.js   # Hook per layout + animazioni FLIP
└── useColumnCount.js      # Hook per numero colonne responsive

src/services/
├── photos.js              # Upload/delete foto Firebase Storage
├── files.js               # Upload/delete file generici Firebase Storage
└── projects.js            # CRUD bento boxes + eliminazione cascade
```

---

## Componenti

### BaseBentoBox

Il componente base che tutti i Bento Box specifici estendono.

```jsx
<BaseBentoBox
  title="Note"
  isPinned={false}
  onPinToggle={() => handlePinToggle()}
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
>
  {/* Contenuto specifico del box */}
</BaseBentoBox>
```

**Props:**
| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `title` | `string` | `"Box"` | Titolo del box (max 50 char) |
| `isPinned` | `boolean` | `false` | Se il box è pinnato in alto |
| `onPinToggle` | `function` | - | Callback toggle pin |
| `onTitleChange` | `function` | - | Callback cambio titolo |
| `onDelete` | `function` | - | Callback eliminazione |
| `minHeight` | `number` | - | Altezza minima in pixel |
| `children` | `node` | - | Contenuto del box |
| `menuItems` | `array` | `[]` | Voci specifiche kebab menu |
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

### PhotoBox

Box specializzato per foto con carosello.

```jsx
<PhotoBox
  projectId="abc123"
  title="Screenshot"
  photos={[{ id, url, name, storagePath }, ...]}
  onTitleChange={handleTitleChange}
  onPhotosChange={handlePhotosChange}
  onDelete={handleDelete}
/>
```

**Caratteristiche:**

- **Carosello**: Navigazione con frecce e swipe touch
- **Indicatori**: Pallini per foto corrente/totale
- **Upload multiplo**: Drag & drop o selezione file (UploadModal)
- **Progress bar**: Indicatore progresso dentro il box
- **Preload immagini**: Hook `useImagePreload` per scrolling fluido
- **Formati**: JPG, PNG, GIF, WebP (max 10MB per file)
- **Eliminazione**: Conferma prima di eliminare singola foto
- **Altezza fissa**: 200px per il carosello

**Props:**
| Prop | Tipo | Descrizione |
|------|------|-------------|
| `projectId` | `string` | ID progetto per upload su Storage |
| `title` | `string` | Titolo del box |
| `photos` | `array` | Array di `{ id, url, name, storagePath }` |
| `isPinned` | `boolean` | Se il box è pinnato |
| `onPinToggle` | `function` | Callback toggle pin |
| `onTitleChange` | `function` | Callback cambio titolo |
| `onPhotosChange` | `function` | Callback quando cambiano foto |
| `onDelete` | `function` | Callback eliminazione box |

### FileBox

Box specializzato per file di qualsiasi tipo.

```jsx
<FileBox
  projectId="abc123"
  title="Documenti"
  files={[{ id, url, name, size, fileType, storagePath }, ...]}
  isPinned={false}
  onPinToggle={handlePinToggle}
  onTitleChange={handleTitleChange}
  onFilesChange={handleFilesChange}
  onDelete={handleDelete}
/>
```

**Caratteristiche:**

- **Lista file**: Ogni file mostra nome, tipo e dimensione
- **Tipi riconosciuti**: PDF, DOC, XLS, PPT, ZIP, AUDIO, VIDEO, CODE, CAD, 3D
- **Tipi CAD**: DXF, DWG, DWF, DGN
- **Tipi 3D**: STEP, STP, IGES, STL, OBJ, FBX, 3DS, GLTF, BLEND, SKP, ecc.
- **Max file size**: 50MB per file
- **Download**: Tasto colorato col tema
- **Eliminazione**: Tasto rosso con conferma
- **Upload multiplo**: Drag & drop o selezione file
- **Progress individuale**: Ogni file ha la sua barra di progresso

**Props:**
| Prop | Tipo | Descrizione |
|------|------|-------------|
| `projectId` | `string` | ID progetto per upload su Storage |
| `title` | `string` | Titolo del box |
| `files` | `array` | Array di `{ id, url, name, size, fileType, storagePath }` |
| `isPinned` | `boolean` | Se il box è pinnato |
| `onPinToggle` | `function` | Callback toggle pin |
| `onTitleChange` | `function` | Callback cambio titolo |
| `onFilesChange` | `function` | Callback quando cambiano file |
| `onDelete` | `function` | Callback eliminazione box |

### CameraFab

FAB (Floating Action Button) per scattare foto direttamente da mobile.

```jsx
<CameraFab onCapture={handleCameraCapture} />
```

**Caratteristiche:**

- Visibile solo su mobile
- Apre la fotocamera del dispositivo
- Crea automaticamente un nuovo PhotoBox con la foto scattata
- Usa colore tema del profilo

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

### Struttura Dati Firestore

```
projects/
  └── {projectId}/
      └── bentoBoxes/
          └── {boxId}/
              ├── id: string
              ├── title: string
              ├── boxType: "note" | "photo" | "file"
              ├── content: string         // Solo per NoteBox
              ├── photos: [               // Solo per PhotoBox
              │   { id, url, name, storagePath }
              │ ]
              ├── files: [                // Solo per FileBox
              │   { id, url, name, size, fileType, storagePath }
              │ ]
              ├── isPinned: boolean       // Se pinnato in alto
              ├── pinnedAt: number        // Timestamp pin
              └── createdAt: timestamp
```

### Struttura Storage (Firebase Storage)

```
projects/
  └── {projectId}/
      ├── photos/
      │   └── {photoId}.{ext}
      └── files/
          └── {fileId}.{ext}
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
updateBentoBoxPhotos(projectId, boxId, photos)
updateBentoBoxFiles(projectId, boxId, files)
updateBentoBoxPin(projectId, boxId, isPinned, pinnedAt)
deleteBentoBox(projectId, boxId)

// Eliminazione cascade
deleteProject(projectId)  // Elimina anche foto/file da Storage
```

```javascript
// services/photos.js

// Upload singolo con progress
uploadPhoto(projectId, file, onProgress) → { id, url, name, storagePath }

// Upload multiplo con progress totale
uploadPhotos(projectId, files, onProgress, onPhotoUploaded) → photos[]

// Eliminazione
deletePhoto(storagePath)
deletePhotos(photos[])

// Validazione
validateImageFile(file) → { valid, error? }
```

```javascript
// services/files.js

// Upload singolo con progress
uploadFile(projectId, file, onProgress) → { id, url, name, size, fileType, storagePath }

// Upload multiplo (in parallelo)
uploadFiles(projectId, files, onProgress, onFileUploaded) → files[]

// Eliminazione
deleteFile(storagePath)
deleteFiles(files[])

// Download
downloadFile(url, filename)

// Utility
validateFile(file) → { valid, error? }
getFileType(filename) → string  // PDF, DOC, CAD, 3D, ecc.
formatFileSize(bytes) → string  // "1.5 MB"
```

---

## Tipi di Box (Roadmap)

| Tipo                | Stato     | Descrizione              |
| ------------------- | --------- | ------------------------ |
| 📝 **NoteBox**      | ✅ Attivo | Note testuali            |
| 🖼️ **PhotoBox**     | ✅ Attivo | Foto con carosello       |
| 📁 **FileBox**      | ✅ Attivo | File generici (max 50MB) |
| ✅ **ChecklistBox** | 🔜 Futuro | Liste di task            |
| 🔗 **LinkBox**      | 🔜 Futuro | Link esterni con preview |
| 👤 **ContactBox**   | 🔜 Futuro | Anagrafiche persone      |

---

## Performance

### Ottimizzazioni Implementate

1. **useMemo**: Distribuzione colonne memoizzata
2. **ResizeObserver**: Solo su cambio altezza effettivo (threshold 2px)
3. **FLIP animations**: Transizioni GPU-accelerate
4. **Real-time sync**: Solo dati modificati via `onSnapshot`

---

## Changelog

### v1.5.0 (Dicembre 2025)

- 📁 **FileBox**: Nuovo tipo di box per file generici
- 📌 **Sistema Pin**: Fissa box importanti in alto
- 📷 **CameraFab**: Scatta foto direttamente da mobile
- 🗑️ **Auto-delete**: Box vuoti eliminati dopo 10 minuti
- 🎯 **Empty states uniformi**: UI coerente per tutti i box vuoti
- 🛠️ Tipi file CAD (DXF, DWG) e 3D (STEP, STL, OBJ, ecc.)
- 📊 Progress bar individuale per ogni file in upload

### v1.4.0 (Dicembre 2025)

- 🖼️ **PhotoBox**: Nuovo tipo di box per foto
- 📸 Carosello foto con swipe touch e frecce
- 📤 Upload multiplo con drag & drop
- 📊 Progress bar dentro il box durante upload
- 🚀 Preload immagini per scrolling fluido
- 🗑️ Eliminazione automatica foto su delete box/progetto/gruppo
- 📏 Altezze stimate per distribuzione più accurata

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
