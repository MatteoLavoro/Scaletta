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
├── PhotoBox.jsx           # Box per foto con carosello e ImageModal
├── PdfBox.jsx             # Box per PDF con anteprima e carosello
├── FileBox.jsx            # Box per file generici con icone per tipo
├── ChecklistBox.jsx       # Box per liste di task con checkbox
├── AnagraficaBox.jsx      # Box per dati cliente strutturati
├── TutorialBox.jsx        # Box tutorial (primo avvio)
├── AddBentoBoxButton.jsx  # Griglia per aggiungere box (desktop)
│   └── MobileAddFab       # Barra flottante (mobile)
├── CameraFab.jsx          # FAB per scattare foto (mobile)
├── BentoGrid.jsx          # Container griglia principale
├── BentoBox.jsx           # Box semplice generico
├── bentoConstants.js      # Costanti (altezze preset)
├── useBentoLayout.js      # Hook legacy (non usato)
└── index.js               # Esportazioni pubbliche

src/components/modal/
├── ImageModal.jsx         # Visualizzatore immagini fullscreen
├── PdfUploadModal.jsx     # Upload PDF
├── FileUploadModal.jsx    # Upload file generici
├── MoreBoxesModal.jsx     # Selezione tipi di box aggiuntivi
└── ...

src/hooks/
├── useBentoAnimation.js   # Hook per layout + animazioni FLIP
└── useColumnCount.js      # Hook per numero colonne responsive

src/services/
├── photos.js              # Upload/delete foto Firebase Storage
├── pdfs.js                # Upload/delete PDF Firebase Storage
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
- **Visualizzazione fullscreen**: Click su foto apre ImageModal

**ImageModal Features:**

- Fullscreen con sfondo nero
- Toolbar centrale (counter, ruota, download, elimina)
- Rotazione 90° in senso orario
- Preload immagini adiacenti
- Eliminazione con ConfirmModal (skipHistory per non interferire)
- Mobile: tasto back | Desktop: tasto X

### PdfBox

Box specializzato per PDF con carosello e anteprima.

```jsx
<PdfBox
  projectId="abc123"
  title="Documenti"
  pdfs={[{ id, url, name, storagePath }, ...]}
  onTitleChange={handleTitleChange}
  onPdfsChange={handlePdfsChange}
  onDelete={handleDelete}
/>
```

**Caratteristiche:**

- **Carosello**: Navigazione con frecce e swipe touch
- **Anteprima**: Rendering prima pagina con react-pdf
- **Click per aprire**: Apre il PDF in una nuova scheda
- **Upload multiplo**: PdfUploadModal con selezione multipla
- **Progress bar**: Indicatore progresso durante upload
- **Error Boundary**: Gestione errori compatibile con React 19 Strict Mode
- **Altezza fissa**: 200px per il carosello

### FileBox

Box specializzato per file generici.

```jsx
<FileBox
  projectId="abc123"
  title="Allegati"
  files={[{ id, url, name, storagePath, size }, ...]}
  onTitleChange={handleTitleChange}
  onFilesChange={handleFilesChange}
  onDelete={handleDelete}
/>
```

**Caratteristiche:**

- **Lista verticale**: Elenco file con icona, nome, dimensione
- **Icone per tipo**: Riconoscimento automatico per:
  - 🖼️ Immagini (jpg, png, gif, webp, svg)
  - 📄 PDF
  - 📝 Documenti (doc, docx, odt, rtf, txt)
  - 📊 Fogli di calcolo (xls, xlsx, csv)
  - 📽️ Presentazioni (ppt, pptx)
  - 🎵 Audio (mp3, wav, ogg, m4a)
  - 🎬 Video (mp4, avi, mkv, mov)
  - 📦 Archivi (zip, rar, 7z)
  - 💻 Codice (js, py, html, css, ecc.)
  - 📐 File 3D (obj, stl, fbx, blend, ecc.)
- **Upload multiplo**: FileUploadModal (max 50MB per file)
- **Download diretto**: Click su icona download
- **Eliminazione**: Conferma prima di eliminare

### ChecklistBox

Box specializzato per liste di task.

```jsx
<ChecklistBox
  title="Todo"
  items={[{ id, text, completed }, ...]}
  onTitleChange={handleTitleChange}
  onItemsChange={handleItemsChange}
  onDelete={handleDelete}
/>
```

**Caratteristiche:**

- **Lista task**: Elementi con checkbox, testo, modifica ed eliminazione
- **Toggle completamento**: Click su checkbox
- **Stile completato**: Checkbox colorato, testo barrato
- **Aggiunta task**: Tasto + per aggiungere elementi
- **Modifica inline**: Tasto matita per modificare
- **Elimina**: Tasto cestino con conferma

### AnagraficaBox

Box specializzato per dati cliente strutturati.

```jsx
<AnagraficaBox
  title="Anagrafica"
  anagrafica={{
    cliente: "Mario Rossi",
    luogo: "Milano",
    iva: "22",
    email: "mario@email.com",
    telefono: "123456789",
    codiceFiscale: "RSSMRA80A01F205X",
    customFields: [{ key: "...", label: "...", value: "..." }],
  }}
  onTitleChange={handleTitleChange}
  onAnagraficaChange={handleAnagraficaChange}
  onDelete={handleDelete}
/>
```

**Caratteristiche:**

- **Campi predefiniti**:
  - 👤 Cliente (UserIcon)
  - 📍 Luogo (MapPinIcon)
  - % IVA (PercentIcon)
  - ✉️ Email (MailIcon)
  - 📞 Telefono (PhoneIcon)
  - 🪪 Codice Fiscale (IdCardIcon)
- **Campi custom**: Possibilità di aggiungere campi personalizzati
- **Copia valore**: Tasto copia per ogni campo con valore
- **Modifica inline**: Tasto matita per modificare
- **Svuota campo**: Tasto cestino per rimuovere valore

**Props:**
| Prop | Tipo | Descrizione |
|------|------|-------------|
| `projectId` | `string` | ID progetto per upload su Storage |
| `title` | `string` | Titolo del box |
| `photos` | `array` | Array di `{ id, url, name, storagePath }` |
| `onTitleChange` | `function` | Callback cambio titolo |
| `onPhotosChange` | `function` | Callback quando cambiano foto |
| `onDelete` | `function` | Callback eliminazione box |

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
| `getItemStyle` | `function` | Funzione per ottenere stile item (opacity fade-in) |

### Algoritmo di Distribuzione

**"Shortest Column First"**:

1. Inizializza array altezze colonne a `[0, 0, 0, ...]`
2. Per ogni item (in ordine):
   - Trova indice colonna con altezza minima: `Math.min(...heights)`
   - Assegna item a quella colonna
   - Aggiorna altezza: `heights[index] += itemHeight + gap`
3. Ritorna array di colonne

**Esempio con 3 colonne:**

```
Item 1 (h:200) → Col 0 [0,0,0]     → [216,0,0]
Item 2 (h:150) → Col 1 [216,0,0]   → [216,166,0]
Item 3 (h:180) → Col 2 [216,166,0] → [216,166,196]
Item 4 (h:120) → Col 1 [216,166,196] → [216,302,196]
Item 5 (h:100) → Col 2 [216,302,196] → [216,302,312]
...
```

### ResizeObserver

**Monitoraggio altezze:**

```javascript
const resizeObserver = new ResizeObserver((entries) => {
  entries.forEach((entry) => {
    const id = entry.target.getAttribute("data-bento-id");
    const height = entry.target.offsetHeight;

    // Aggiorna solo se cambio > 2px (threshold)
    if (Math.abs(heightsRef.current.get(id) - height) > 2) {
      heightsRef.current.set(id, height);
      setHeights(new Map(heightsRef.current));
    }
  });
});

// Osserva tutti i box
container.querySelectorAll("[data-bento-id]").forEach((el) => {
  resizeObserver.observe(el);
});
```

**Threshold 2px**: Evita ricalcoli per cambiamenti minimi (rendering sub-pixel, font rendering).

### Animazioni FLIP

**FLIP Technique** (First-Last-Invert-Play):

1. **First**: Registra posizione iniziale di ogni box

   ```javascript
   const rect = element.getBoundingClientRect();
   positionsRef.current.set(id, { x: rect.left, y: rect.top });
   ```

2. **Last**: Cambia il layout (riassegna colonne)

3. **Invert**: Calcola delta e applica transform senza transizione

   ```javascript
   const deltaX = oldPos.x - newPos.x;
   const deltaY = oldPos.y - newPos.y;
   element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
   element.style.transition = "none";
   ```

4. **Play**: Rimuovi transform con transizione CSS
   ```javascript
   requestAnimationFrame(() => {
     element.style.transition = "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)";
     element.style.transform = "";
   });
   ```

**Vantaggi FLIP:**

- Animazioni fluide 60fps (GPU-accelerate)
- Nessun layout reflow durante l'animazione
- Funziona con qualsiasi cambio di posizione

### Gestione Fade-in Nuovi Box

**Problema**: Nuovi box appaiono di colpo, senza transizione.

**Soluzione**: Fade-in con opacity.

1. **Identificazione nuovi box** (PRIMA del render):

   ```javascript
   const newItemIds = useMemo(() => {
     const currentIds = new Set(items.map((i) => i.id));
     const prevIds = prevItemIdsRef.current;

     const newIds = new Set();
     if (prevIds.size > 0) {
       // Non al primo render
       currentIds.forEach((id) => {
         if (!prevIds.has(id)) newIds.add(id);
       });
     }

     prevItemIdsRef.current = currentIds;
     return newIds;
   }, [items]);
   ```

2. **Applicazione stile iniziale**:

   ```javascript
   const getItemStyle = (id) => {
     if (newItemIds.has(id)) return { opacity: 0 };
     return {};
   };
   ```

3. **Attivazione fade-in** (dopo mount):

   ```javascript
   useLayoutEffect(() => {
     if (newItemIds.size > 0) {
       // Aggiungi classe animate-bento-in dopo un frame
       requestAnimationFrame(() => {
         setFadingInIds(new Set(newItemIds));
       });
     }
   }, [newItemIds]);
   ```

4. **CSS Animation**:
   ```css
   @keyframes bento-in {
     from {
       opacity: 0;
       transform: translateY(20px) scale(0.95);
     }
     to {
       opacity: 1;
       transform: translateY(0) scale(1);
     }
   }
   .animate-bento-in {
     animation: bento-in 300ms ease-out forwards;
   }
   ```

### Flusso Completo Aggiornamento

```
1. Item cambia altezza
   ↓
2. ResizeObserver triggera
   ↓
3. heightsRef.current aggiornato
   ↓
4. setHeights() triggera re-render
   ↓
5. useMemo ricalcola distribuzione colonne
   ↓
6. useLayoutEffect registra posizioni FIRST
   ↓
7. DOM aggiornato con nuove posizioni (LAST)
   ↓
8. useLayoutEffect calcola delta (INVERT) e applica transform
   ↓
9. requestAnimationFrame rimuove transform con transition (PLAY)
   ↓
10. Animazione fluida 300ms
```

### Performance

**Ottimizzazioni implementate:**

1. **useMemo** per distribuzione colonne (evita ricalcolo ad ogni render)
2. **ResizeObserver** threshold 2px (evita ricalcoli per cambiamenti minimi)
3. **useLayoutEffect** per FLIP (evita flash di contenuto)
4. **requestAnimationFrame** per animazioni (sincronizzato con browser)
5. **GPU-accelerated transforms** (transform invece di top/left)
6. **Set per tracking animazioni** (O(1) lookup)
7. **Refs per dati non visuali** (evita re-render inutili)

**Complessità algoritmo:**

- Distribuzione: O(n) dove n = numero item
- Trova colonna più corta: O(k) dove k = numero colonne (max 4)
- Totale per distribuzione: O(n \* k) ≈ O(n) con k costante

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
              ├── boxType: "note" | "photo"
              ├── content: string         // Solo per NoteBox
              ├── photos: [               // Solo per PhotoBox
              │   { id, url, name, storagePath }
              │ ]
              └── createdAt: timestamp
```

### Struttura Storage (Foto)

```
projects/
  └── {projectId}/
      └── photos/
          └── {photoId}.{ext}
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
deleteBentoBox(projectId, boxId)

// Eliminazione cascade
deleteProject(projectId)  // Elimina anche foto da Storage
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

---

## Tipi di Box (Roadmap)

| Tipo                 | Stato     | Descrizione                     |
| -------------------- | --------- | ------------------------------- |
| 📝 **NoteBox**       | ✅ Attivo | Note testuali                   |
| 🖼️ **PhotoBox**      | ✅ Attivo | Foto con carosello e fullscreen |
| 📄 **PdfBox**        | ✅ Attivo | PDF con anteprima               |
| 📁 **FileBox**       | ✅ Attivo | File generici con icone         |
| ✅ **ChecklistBox**  | ✅ Attivo | Liste di task                   |
| 👤 **AnagraficaBox** | ✅ Attivo | Dati cliente strutturati        |
| 🔗 **LinkBox**       | 🔜 Futuro | Link esterni con preview        |

---

## Performance

### Ottimizzazioni Implementate

1. **useMemo**: Distribuzione colonne memoizzata
2. **ResizeObserver**: Solo su cambio altezza effettivo (threshold 2px)
3. **FLIP animations**: Transizioni GPU-accelerate
4. **Real-time sync**: Solo dati modificati via `onSnapshot`

---

## Changelog

### v2.0.0 (Gennaio 2025)

- 📄 **PdfBox**: Nuovo box per PDF con anteprima react-pdf
- 📁 **FileBox**: Nuovo box per file generici con icone per tipo
- ✅ **ChecklistBox**: Nuovo box per liste di task
- 👤 **AnagraficaBox**: Nuovo box per dati cliente strutturati
- 🖼️ **ImageModal**: Visualizzatore fullscreen con toolbar
- 🔄 Rotazione immagini 90° in senso orario
- ⬇️ Download immagini diretto
- 🗑️ Eliminazione immagini da fullscreen (con skipHistory)
- 🔮 Preload immagini adiacenti in ImageModal
- 🪪 Aggiunto campo Codice Fiscale in AnagraficaBox
- 📐 Icone per file 3D (OBJ, STL, FBX, ecc.) in FileBox

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
