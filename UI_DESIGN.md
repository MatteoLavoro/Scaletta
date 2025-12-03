# Scaletta - Specifiche UI/UX

## Filosofia di Design

L'interfaccia di Scaletta segue principi di **design moderno** con focus primario sulla **User Experience (UX)**. L'obiettivo è creare un'applicazione intuitiva, veloce e piacevole da usare sia su dispositivi mobili che desktop.

---

## Sistema di Temi e Colori

### Supporto Tema Chiaro/Scuro

L'applicazione offre **supporto completo** per entrambi i temi:

| Tema               | Descrizione                                 |
| ------------------ | ------------------------------------------- |
| 🌙 **Tema Scuro**  | Sfondo scuro con testi chiari - **DEFAULT** |
| ☀️ **Tema Chiaro** | Sfondo chiaro con testi scuri               |

**Comportamento:**

- Il tema di default è **Scuro**
- L'utente può cambiare tema dalle impostazioni (ProfileModal)
- La preferenza viene salvata in localStorage
- Transizione fluida tra i temi

### Colore Principale Personalizzabile

L'utente può scegliere il **colore principale** (accent color) tra 6 opzioni.

**Colore di Default:** 🟢 **Teal (Verde Acqua)**

**Colori Disponibili:**

| Colore | Nome   | Light Mode | Dark Mode  |
| ------ | ------ | ---------- | ---------- |
| 🟢     | Teal   | `#00796b`  | `#00bcd4`  |
| 🔵     | Blue   | `#1565c0`  | `#42a5f5`  |
| 🟣     | Purple | `#7b1fa2`  | `#ba68c8`  |
| 🔴     | Red    | `#c62828`  | `#ef5350`  |
| 🟠     | Orange | `#ef6c00`  | `#ffa726`  |
| 🟢     | Green  | `#2e7d32`  | `#66bb6a`  |

> I colori seguono Material Design 3: tone 40 per light mode, tone 80 per dark mode

### Palette Tema Scuro (Default)

```css
--bg-primary: #121212;
--bg-secondary: #1e1e1e;
--bg-tertiary: #2d2d2d;
--text-primary: #ffffff;
--text-secondary: #b3b3b3;
--text-muted: #666666;
--border: #333333;
--divider: #404040;
```

### Palette Tema Chiaro

```css
--bg-primary: #fafafa;
--bg-secondary: #ffffff;
--bg-tertiary: #f0f0f0;
--text-primary: #1a1a1a;
--text-secondary: #525252;
--text-muted: #737373;
--border: #d4d4d4;
--divider: #a3a3a3;
```

---

## Layout Principale

### Header (Dashboard)

```
┌─────────────────────────────────────────┐
│  Scaletta          [Profilo tondo]      │
└─────────────────────────────────────────┘
```

- Logo "Scaletta" a sinistra (text-primary colorato)
- Tasto profilo a destra: cerchio con icona User
- Sfondo `bg-secondary`, bordo inferiore `border`
- Sticky top con z-index 50

### Contenuto Principale

- Padding 20px (`p-5`)
- Max-width 672px (`max-w-2xl`) centrato
- Gap 12px (`space-y-3`) tra elementi

---

## Componenti Gruppi

### EmptyGroupsCard (Stato Vuoto)

Card tutorial che appare quando l'utente non ha gruppi:

```
┌─────────────────────────────────────────┐
│            [Icona Users]                │
│                                         │
│      Benvenuto in Scaletta!             │
│   Non fai ancora parte di nessun gruppo │
│   Crea un nuovo gruppo o unisciti...    │
├─────────────────────────────────────────┤
│  [+ Crea gruppo]  [Unisciti tratteggiato]│
└─────────────────────────────────────────┘
```

- Icona Users in cerchio colorato `bg-primary/10`
- Testo di benvenuto centrato
- Due tasti:
  - **Crea gruppo**: sfondo `bg-primary/10`, bordo `border-primary/30`
  - **Unisciti**: bordo tratteggiato `border-dashed`

### GroupCard (Card Gruppo)

```
┌─────────────────────────────────────────┐
│  Nome Gruppo           ˅       [i]      │
│  👥 3 membri                            │
├─────────────────────────────────────────┤
│  (Contenuto espandibile)                │
└─────────────────────────────────────────┘
```

- **Header cliccabile** per espandere/contrarre
- **Nome gruppo** a sinistra (truncate se lungo)
- **Contatore membri** sotto il nome
- **Chevron** centrato orizzontalmente (absolute)
- **Tasto info** (i) a destra
- **Contenuto espandibile** con animazione `grid-rows-[1fr]`

### CreateGroupButton / JoinGroupButton

```
┌─────────────────────┐ ┌─────────────────────┐
│   + Crea gruppo     │ │   Unisciti          │
└─────────────────────┘ └─────────────────────┘
```

- Stesso padding della card (`p-4`)
- Bordo tratteggiato (`border-dashed`)
- Hover: `border-primary`, `text-primary`, `bg-primary/5`
- Appaiono sotto la lista gruppi (solo quando ci sono gruppi)

---

## GroupInfoModal

Modale informazioni gruppo con struttura:

```
┌─────────────────────────────────────────┐
│  Info Gruppo                          × │
├─────────────────────────────────────────┤
│                                         │
│  ┌─ NOME GRUPPO ─────────────────[✎]┐  │
│  │         Mio Gruppo                │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ CODICE GRUPPO ───────────────[📋]┐  │
│  │         ABC12DEF                  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ DATA CREAZIONE ──────────────────┐  │
│  │       3 dicembre 2025             │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌─ MEMBRI (3) ──────────────────────┐  │
│  │   [👑 Tu] [Mario] [Lucia]         │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  [ 🗑️ Elimina gruppo ]  (solo founder)  │
│  [ 🚪 Esci dal gruppo ] (solo membri)   │
│                                         │
└─────────────────────────────────────────┘
```

### Componenti InfoBox

#### InfoBox (Base)
- Riquadro con sfondo colorato leggero (`bg-{color}-500/10`)
- Bordo colorato (`border-{color}-600/25`)
- Titolo uppercase piccolo centrato
- Contenuto centrato
- Supporta `titleExtra` per contatore

#### EditableInfoBox
- Come InfoBox ma con tasto matita a destra
- Testo centrato indipendentemente dal tasto
- Apre InputModal per modifica

#### CopyableInfoBox
- Come InfoBox ma con tasto copia a destra
- Testo monospace per codici
- Feedback visivo (checkmark) dopo copia

### MemberPillList

Lista pillole membri con stili differenziati:

| Membro      | Stile                                      |
| ----------- | ------------------------------------------ |
| Tu + Founder| Sfondo amber, corona 👑, testo "Tu"        |
| Tu          | Sfondo primary, icona User, testo "Tu"     |
| Founder     | Sfondo amber, corona 👑, nome              |
| Altri       | Sfondo gray, nome                          |

- Pillole ordinate: Tu prima, poi founder, poi altri
- Se Tu sei founder: pillola unica amber con corona

---

## Differenze UI Founder vs Membri

| Elemento              | Membri Normali        | Founder               |
| --------------------- | --------------------- | --------------------- |
| Pillola membri        | Primary + "Tu"        | Amber + corona + "Tu" |
| Azione gruppo         | "Esci dal gruppo"     | "Elimina gruppo"      |
| Icona azione          | LogOut                | Trash2                |
| Colore azione         | Rosso (danger)        | Rosso (danger)        |

---

## Sistema Modale Generico

Il sistema di modali è il componente fondamentale dell'interfaccia. Tutti i modali dell'applicazione **ereditano** dal modale generico, garantendo consistenza e familiarità per l'utente.

### Struttura del Modale

La struttura varia in base alla piattaforma (vedi sezioni Mobile e Desktop sotto).

**Elementi comuni:**

- Header con titolo centrato e tasto chiudi
- Linea di divisione sotto l'header
- Area contenuto scrollabile
- Tasto conferma

---

## Comportamento Responsive

### 📱 Smartphone (Mobile)

```
┌──────────────────────────┐
│ ← TITOLO MODALE          │
├──────────────────────────┤
│                          │
│                          │
│   CONTENUTO DEL MODALE   │
│                          │
│                          │
│                          │
│                          │
│                          │
│                          │
│                          │
│                    ┌───┐ │
│                    │ ✓ │ │  ← Tasto fluttuante
│                    └───┘ │
└──────────────────────────┘
```

**Caratteristiche Mobile:**

- Il modale occupa **tutto lo schermo** (come una nuova pagina)
- **Solo freccia ← indietro** posizionata in **alto a sinistra** (NO tasto ×)
- **Titolo** centrato in alto
- Linea di divisione sotto header
- **Contenuto** scrollabile
- **Tasto conferma fluttuante** in basso a destra
  - Si sposta **sopra la tastiera** quando questa è visibile
  - Torna **in basso** quando la tastiera si chiude

### 💻 Desktop (PC)

```
        ╔═══════════════════════════════════════════╗
        ║                TITOLO MODALE            × ║
        ╠═══════════════════════════════════════════╣
        ║                                           ║
        ║                                           ║
        ║           CONTENUTO DEL MODALE            ║
        ║                                           ║
        ║                                           ║
        ╠═══════════════════════════════════════════╣
        ║ [            CONFERMA                   ] ║
        ╚═══════════════════════════════════════════╝
```

**Caratteristiche Desktop:**

- Il modale si apre **al centro della pagina**
- Dimensioni contenute (non fullscreen)
- **Solo × chiudi** posizionata in **alto a destra** (NO freccia indietro)
- **Titolo** centrato in alto
- Linea di divisione sotto header
- **Contenuto** scrollabile
- Linea di divisione sopra footer
- **Tasto conferma centrale** che occupa **tutta la larghezza** del modale
- **Sfondo sfumato/oscurato** dietro il modale

---

## Comportamenti e Interazioni

### Apertura Modale

1. Il modale appare (con eventuale animazione)
2. Lo **scroll della pagina sottostante viene bloccato**
3. Su desktop: lo sfondo si **sfuma/oscura**
4. Il focus viene spostato all'interno del modale

### Chiusura Modale

Il modale può essere chiuso tramite:

| Metodo                 | Piattaforma | Comportamento               |
| ---------------------- | ----------- | --------------------------- |
| Tasto ← nel modale     | Mobile      | ✅ Chiude il modale         |
| Tasto × nel modale     | Desktop     | ✅ Chiude il modale         |
| Tasto ESC tastiera     | Desktop     | ✅ Chiude il modale         |
| Tasto Indietro Android | Mobile      | ✅ Chiude il modale         |
| Tasto Indietro Browser | Tutti       | ✅ Chiude il modale         |
| Click fuori dal modale | Tutti       | ❌ **NON** chiude il modale |

> **Importante**: Cliccare al di fuori del modale **NON** deve chiudere il modale. Questo previene chiusure accidentali e perdita di dati.

---

## Sistema di Modali Innestati

L'applicazione supporta **modali innestati** (un modale aperto sopra un altro modale).

### Regole di Gestione

1. **Ordine di apertura**: I modali si impilano uno sopra l'altro
2. **Ordine di chiusura**: Si chiude **sempre** solo il modale più in alto
3. **Gerarchia**: Il sistema mantiene uno stack dei modali aperti

### Esempio di Flusso

```
Home
  │
  └─▶ Apri Modale 1
        │
        └─▶ Apri Modale 2
              │
              └─▶ [Premi Indietro]
                    │
                    └─▶ Torna a Modale 1
                          │
                          └─▶ Apri Modale 3
                                │
                                └─▶ Apri Modale 4
                                      │
                                      └─▶ [Premi Indietro]
                                            │
                                            └─▶ Torna a Modale 3
                                                  │
                                                  └─▶ [Premi Indietro]
                                                        │
                                                        └─▶ Torna a Modale 1
                                                              │
                                                              └─▶ [Premi Indietro]
                                                                    │
                                                                    └─▶ Torna a Home
```

### Gestione Stack Modali

```javascript
// Esempio concettuale dello stack
modalStack = []

// Apertura modale
openModal(modal1)  → stack = [modal1]
openModal(modal2)  → stack = [modal1, modal2]

// Chiusura (indietro)
closeTopModal()    → stack = [modal1]        // modal2 chiuso

// Nuova apertura
openModal(modal3)  → stack = [modal1, modal3]
openModal(modal4)  → stack = [modal1, modal3, modal4]

// Chiusure successive
closeTopModal()    → stack = [modal1, modal3] // modal4 chiuso
closeTopModal()    → stack = [modal1]         // modal3 chiuso
closeTopModal()    → stack = []               // modal1 chiuso, torna a home
```

---

## Integrazione con Browser History

Per supportare il tasto indietro del browser (Chrome, Android, ecc.):

1. **Apertura modale normale**: `openModal()` esegue `pushState` nella history
2. **Apertura modale annidato**: Il componente `Modal` esegue automaticamente `pushState` quando ha prop `onClose`
3. **Chiusura modale**: Tutti i metodi (X, ESC, back button) usano `history.back()` che triggera `popstate`
4. **Gestione `popstate`**: Il `ModalContext` intercetta l'evento e chiama la callback `onClose` appropriata

```
URL: /dashboard
  └─▶ Apri ProfileModal → URL: /dashboard (history +1)
        └─▶ Apri InputModal (annidato) → URL: /dashboard (history +2)
              └─▶ Browser Back → popstate → onClose() → Chiude InputModal (history -1)
                    └─▶ Browser Back → popstate → closeModal() → Chiude ProfileModal (history -1)
```

### Principio Fondamentale

**Tutti i metodi di chiusura usano sempre `history.back()`**, mai chiamate dirette a `onClose()`. Questo garantisce che la browser history sia sempre sincronizzata con lo stato dei modali.

| Metodo di Chiusura  | Azione                                   |
| ------------------- | ---------------------------------------- |
| Tasto × / ←         | `history.back()` → `popstate` → callback |
| Tasto ESC           | `history.back()` → `popstate` → callback |
| Back button browser | `popstate` → callback                    |
| Back Android        | `popstate` → callback                    |

---

## Specifiche Tecniche del Modale

### CSS/Styling

```css
/* Concetto di stile - Mobile */
.modal-mobile {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 1000;
}

/* Concetto di stile - Desktop */
.modal-desktop {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 12px;
  max-width: 500px;
  max-height: 80vh;
  z-index: 1000;
}

/* Overlay sfumato desktop */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

/* Blocco scroll body */
body.modal-open {
  overflow: hidden;
}

/* Tasto fluttuante mobile */
.floating-confirm-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  /* Si sposta quando keyboard è visibile */
}
```

### Gestione Tastiera Mobile

```javascript
// Concetto di gestione keyboard
visualViewport.addEventListener("resize", () => {
  const keyboardHeight = window.innerHeight - visualViewport.height;
  if (keyboardHeight > 0) {
    // Tastiera visibile: sposta il bottone sopra
    floatingButton.style.bottom = `${keyboardHeight + 20}px`;
  } else {
    // Tastiera nascosta: bottone in basso
    floatingButton.style.bottom = "20px";
  }
});
```

---

## Componenti del Modale

### Header

- **Mobile**: Solo freccia ← a sinistra, titolo centrato (NO ×)
- **Desktop**: Titolo centrato, solo × a destra (NO freccia)
- Altezza fissa
- Linea divisoria sotto

### Content

- Area scrollabile
- Padding consistente
- Può contenere qualsiasi contenuto

### Footer (solo Desktop)

- Linea divisoria sopra
- **Tasto conferma centrale** che occupa **tutta la larghezza**
- Altezza fissa

### Floating Action Button (solo Mobile)

- Posizione fissa in basso a destra
- Si adatta alla tastiera
- Icona o testo breve
- Ombra per distinguerlo dal contenuto

---

## Accessibilità

- **Focus trap**: Il focus rimane all'interno del modale
- **ARIA labels**: Attributi appropriati per screen reader
- **Keyboard navigation**: Navigazione completa da tastiera
- **Contrast**: Contrasti adeguati per leggibilità

---

## Animazioni

### Apertura

- **Mobile**: Slide da destra o dal basso
- **Desktop**: Fade in + leggero scale up

### Chiusura

- **Mobile**: Slide verso destra o verso il basso
- **Desktop**: Fade out + leggero scale down

### Durata

- Animazioni rapide: 200-300ms
- Easing: ease-out per apertura, ease-in per chiusura

---

## Tipi di Modali nell'Applicazione

Tutti ereditano dal modale generico:

1. **Modale Creazione Gruppo**
2. **Modale Modifica Gruppo**
3. **Modale Eliminazione Gruppo** (solo founder)
4. **Modale Creazione Progetto**
5. **Modale Modifica Progetto**
6. **Modale Eliminazione Progetto** (solo founder)
7. **Modale Invito Membro**
8. **Modale Rimozione Membro** (solo founder)
9. **Modale Upload File**
10. **Modale Creazione Nota**
11. **Modale Modifica Nota**
12. **Modale Conferma Azioni Distruttive**
13. **Modale Impostazioni**
14. **Modale Profilo Utente**

---

## Riepilogo Comportamenti

| Comportamento        | Mobile                  | Desktop                         |
| -------------------- | ----------------------- | ------------------------------- |
| Dimensione modale    | Fullscreen              | Centrato, contenuto             |
| Tasto chiudi         | Solo ← alto sinistra    | Solo × alto destra              |
| Sfondo               | Nessuno (fullscreen)    | Sfumato/oscurato                |
| Tasto conferma       | Fluttuante basso-destra | Centrale, full-width nel footer |
| Keyboard awareness   | Sì (sposta bottone)     | N/A                             |
| ESC chiude           | N/A                     | Sì                              |
| Back Android chiude  | Sì                      | N/A                             |
| Back Browser chiude  | Sì                      | Sì                              |
| Click fuori chiude   | No                      | No                              |
| Scroll body bloccato | Sì                      | Sì                              |
| Modali innestati     | Sì                      | Sì                              |
