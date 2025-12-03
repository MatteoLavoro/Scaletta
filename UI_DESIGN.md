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
- L'utente può cambiare tema dalle impostazioni
- La preferenza viene salvata e mantenuta tra le sessioni
- Transizione fluida tra i temi (animazione fade)

### Colore Principale Personalizzabile

L'utente può scegliere il **colore principale** (accent color) dell'interfaccia.

**Colore di Default:** 🟢 **Verde Acqua (Teal/Cyan)**

```css
/* Colore principale di default */
--color-primary: #00bcd4; /* Cyan/Teal */
--color-primary-light: #4dd0e1;
--color-primary-dark: #0097a7;
```

**Colori Disponibili (esempi):**

| Colore | Nome                  | Codice HEX |
| ------ | --------------------- | ---------- |
| 🟢     | Verde Acqua (Default) | `#00BCD4`  |
| 🔵     | Blu                   | `#2196F3`  |
| 🟣     | Viola                 | `#9C27B0`  |
| 🔴     | Rosso                 | `#F44336`  |
| 🟠     | Arancione             | `#FF9800`  |
| 🟡     | Giallo                | `#FFEB3B`  |
| 🟢     | Verde                 | `#4CAF50`  |
| 🩷      | Rosa                  | `#E91E63`  |

**Utilizzo del Colore Principale:**

- Tasti primari (conferma, salva, ecc.)
- Link e elementi interattivi
- Indicatori di selezione/focus
- Badge e notifiche
- FAB (Floating Action Button)
- Barra di caricamento/progresso
- Elementi di navigazione attivi

### Palette Tema Scuro (Default)

```css
:root[data-theme="dark"] {
  /* Background */
  --bg-primary: #121212;
  --bg-secondary: #1e1e1e;
  --bg-tertiary: #2d2d2d;

  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;
  --text-muted: #666666;

  /* Accent - Verde Acqua */
  --color-primary: #00bcd4;
  --color-primary-light: #4dd0e1;
  --color-primary-dark: #0097a7;

  /* Borders & Dividers */
  --border-color: #333333;
  --divider-color: #404040;
}
```

### Palette Tema Chiaro

```css
:root[data-theme="light"] {
  /* Background */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-tertiary: #eeeeee;

  /* Text */
  --text-primary: #212121;
  --text-secondary: #757575;
  --text-muted: #9e9e9e;

  /* Accent - Verde Acqua */
  --color-primary: #00bcd4;
  --color-primary-light: #4dd0e1;
  --color-primary-dark: #0097a7;

  /* Borders & Dividers */
  --border-color: #e0e0e0;
  --divider-color: #bdbdbd;
}
```

### Impostazioni Tema

Nelle impostazioni utente sarà disponibile:

1. **Selettore Tema**: Toggle tra Chiaro/Scuro (o Auto basato su sistema)
2. **Selettore Colore**: Griglia di colori per scegliere l'accent color
3. **Anteprima**: Preview in tempo reale delle modifiche

---

## Differenze UI basate sul Ruolo

### Founder vs Membri Regolari

Nonostante tutti i membri abbiano tecnicamente gli stessi poteri a livello di sistema, la UI presenta alcune differenze per il **founder**:

| Azione                | Membri Regolari | Founder     |
| --------------------- | --------------- | ----------- |
| Eliminare il gruppo   | ❌ Nascosto     | ✅ Visibile |
| Eliminare un progetto | ❌ Nascosto     | ✅ Visibile |
| Rimuovere un membro   | ❌ Nascosto     | ✅ Visibile |
| Tutte le altre azioni | ✅ Visibile     | ✅ Visibile |

> **Nota**: Questa è puramente una scelta di UI per semplificare l'interfaccia e prevenire azioni accidentali. A livello di backend, tutti i membri mantengono gli stessi permessi.

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
