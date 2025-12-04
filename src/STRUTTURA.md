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

### `groups/` - Sistema Gruppi

| File                    | Descrizione                                       |
| ----------------------- | ------------------------------------------------- |
| `GroupCard.jsx`         | Card espandibile con griglia progetti             |
| `GroupInfoModal.jsx`    | Modale info gruppo (nome, codice, membri, azioni) |
| `CreateGroupButton.jsx` | Tasto con sfondo colorato per creare gruppo       |
| `JoinGroupButton.jsx`   | Tasto tratteggiato per unirsi a un gruppo         |
| `EmptyGroupsCard.jsx`   | Card tutorial per stato vuoto (no gruppi)         |
| `index.js`              | Export pubblici                                   |

### `projects/` - Sistema Progetti

| File                      | Descrizione                                         |
| ------------------------- | --------------------------------------------------- |
| `ProjectCard.jsx`         | Card progetto quadrata con icona stato e colore     |
| `ProjectGrid.jsx`         | Griglia progetti (3 col mobile, 4 tablet, 5 desk)   |
| `CreateProjectButton.jsx` | Tasto + per creare progetto                         |
| `ProjectInfoModal.jsx`    | Modale info progetto (nome, creatore, data, colore) |
| `StatusModal.jsx`         | Modale gestione stato con slider e elimina          |
| `index.js`                | Export pubblici                                     |

### `modal/` - Sistema Modale

| File               | Descrizione                                             |
| ------------------ | ------------------------------------------------------- |
| `Modal.jsx`        | Modale principale (mobile fullscreen, desktop centrato) |
| `ModalHeader.jsx`  | Header con titolo e tasto chiudi                        |
| `ModalFooter.jsx`  | Footer con bottone conferma (desktop)                   |
| `ModalFab.jsx`     | FAB conferma fluttuante (mobile)                        |
| `ConfirmModal.jsx` | Modale di conferma con box colorata                     |
| `InputModal.jsx`   | Modale di input con validazione e exactLength           |
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

| File                     | Descrizione                                           |
| ------------------------ | ----------------------------------------------------- |
| `Button.jsx`             | Bottone con varianti/sizes e stato disabilitato       |
| `Input.jsx`              | Input base                                            |
| `PasswordInput.jsx`      | Password base con toggle                              |
| `Spinner.jsx`            | Indicatore caricamento                                |
| `ThemeSwitcher.jsx`      | Toggle tema chiaro/scuro (tondo)                      |
| `ColorPicker.jsx`        | Selettore colore accent (6 colori)                    |
| `ThemeSelector.jsx`      | Combinato: ColorPicker + ThemeSwitcher                |
| `InfoBox.jsx`            | Box info con stile (supporta titleExtra)              |
| `EditableInfoBox.jsx`    | InfoBox con tasto modifica (matita) centrato          |
| `CopyableInfoBox.jsx`    | InfoBox con tasto copia (clipboard) centrato          |
| `MemberPillList.jsx`     | Lista pillole membri (Tu/founder/altri differenziati) |
| `DangerButton.jsx`       | Tasto pericoloso con conferma prima di azione         |
| `Divider.jsx`            | Linea divisoria (non arriva ai bordi)                 |
| `StatusSlider.jsx`       | Slider stati progetto con barra gradient              |
| `ProjectColorPicker.jsx` | Griglia 4x3 colori progetto (12 colori)               |
| `DropdownMenu.jsx`       | Menu dropdown posizionabile (per kebab menu)          |
| `index.js`               | Export pubblici                                       |

### `icons/` - Icone (wrapper lucide-react)

Wrapper React per icone lucide-react che garantiscono consistenza nell'utilizzo.

| File                    | Descrizione                    |
| ----------------------- | ------------------------------ |
| `AlertCircleIcon.jsx`   | Icona alert cerchio            |
| `AlertTriangleIcon.jsx` | Icona alert triangolo          |
| `ArrowLeftIcon.jsx`     | Freccia indietro               |
| `CheckIcon.jsx`         | Spunta                         |
| `CheckCircleIcon.jsx`   | Spunta in cerchio (completato) |
| `CloseIcon.jsx`         | X chiudi                       |
| `CopyIcon.jsx`          | Copia clipboard                |
| `CrownIcon.jsx`         | Corona (founder)               |
| `DownloadIcon.jsx`      | Download                       |
| `EyeIcon.jsx`           | Occhio (mostra)                |
| `EyeOffIcon.jsx`        | Occhio barrato (nascondi)      |
| `InfoIcon.jsx`          | Info cerchio                   |
| `LogOutIcon.jsx`        | Logout                         |
| `MoreVerticalIcon.jsx`  | Tre puntini verticali (kebab)  |
| `PencilIcon.jsx`        | Matita (modifica)              |
| `PlusIcon.jsx`          | Più                            |
| `PlayIcon.jsx`          | Play (in corso)                |
| `ArchiveIcon.jsx`       | Archivio                       |
| `TrashIcon.jsx`         | Cestino                        |
| `SettingsIcon.jsx`      | Ingranaggio                    |
| `UsersIcon.jsx`         | Utenti                         |
| `UserIcon.jsx`          | Utente singolo                 |
| `UserPlusIcon.jsx`      | Aggiungi utente                |
| `ChevronDownIcon.jsx`   | Freccia giù                    |
| `SunIcon.jsx`           | Sole (tema chiaro)             |
| `MoonIcon.jsx`          | Luna (tema scuro)              |
| `index.js`              | Export pubblici                |

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

| File              | Descrizione                        |
| ----------------- | ---------------------------------- |
| `WelcomePage.jsx` | Pagina iniziale (non autenticato)  |
| `Dashboard.jsx`   | Pagina principale (autenticato)    |
| `ProjectPage.jsx` | Pagina singolo progetto con header |
| `LoadingPage.jsx` | Schermata caricamento              |
| `index.js`        | Export pubblici                    |

---

## `services/`

| File          | Descrizione                                                         |
| ------------- | ------------------------------------------------------------------- |
| `config.js`   | Configurazione Firebase                                             |
| `auth.js`     | Funzioni auth (login, register, logout, updateUsername)             |
| `groups.js`   | Funzioni CRUD gruppi (crea, unisciti, esci, elimina, aggiorna nome) |
| `projects.js` | Funzioni CRUD progetti (crea, modifica nome/colore/stato, elimina)  |

---

## `utils/`

| File                   | Descrizione                                                   |
| ---------------------- | ------------------------------------------------------------- |
| `authValidation.js`    | Validazione email/password/username                           |
| `groupValidation.js`   | Validazione nome gruppo (2-50 char) e codice (8 char alfanum) |
| `projectValidation.js` | Validazione nome progetto (2-50 char)                         |
| `projectColors.js`     | Definizione 12 colori progetto (light/dark)                   |
| `projectStatuses.js`   | Definizione 4 stati progetto con icone e colori               |

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

## Colori InfoBox e Pillole

I componenti `InfoBox`, `EditableInfoBox`, `CopyableInfoBox` e `MemberPillList` supportano colori con varianti light/dark:

```jsx
// Colori disponibili
const colors = ["teal", "blue", "purple", "red", "orange", "green", "gray"];

// Esempio
<InfoBox title="Email" color="blue">
  <span>utente@email.com</span>
</InfoBox>;
```

Ogni colore ha:

- `bg`: Sfondo leggero (`bg-{color}-500/10` light, `bg-{color}-500/15` dark)
- `border`: Bordo colorato (`border-{color}-600/25` light, `border-{color}-500/30` dark)
- `text`: Testo colorato (`text-{color}-700` light, `text-{color}-400` dark)

---

## Linee Guida Stile UI

### Principi Generali

1. **Riquadri con colore leggero** - Usa InfoBox per dati readonly con sfondo colorato leggero
2. **Bordi arrotondati** - `rounded-xl` (12px) per box, `rounded-full` per toggle/icone
3. **Spaziatura coerente** - `gap-4` tra elementi, `p-4` padding interno
4. **Divisori sottili** - `Divider` per separare sezioni logiche
5. **Bottoni azione in fondo** - Azioni pericolose con `DangerButton` in fondo al modale
6. **Testo centrato indipendente** - In EditableInfoBox/CopyableInfoBox il testo è centrato rispetto al riquadro, non influenzato dal tasto

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

## Struttura GroupInfoModal

```jsx
<Modal title="Info Gruppo" variant="info">
  <EditableInfoBox title="Nome gruppo" value={name} color="purple" onEdit={...} />
  <CopyableInfoBox title="Codice gruppo" value={code} color="blue" />
  <InfoBox title="Data creazione" color="gray">...</InfoBox>
  <InfoBox title="Membri" titleExtra="(3)" color="teal">
    <MemberPillList members={...} currentUserId={...} founderId={...} />
  </InfoBox>
  <Divider spacing="sm" />
  <DangerButton>Elimina/Esci gruppo</DangerButton>
</Modal>
```

---

## MemberPillList - Stili Differenziati

```jsx
// Ordine visualizzazione: Tu prima, poi founder, poi altri

// Se Tu sei il founder
<pill amber crown>Tu</pill>

// Se Tu NON sei founder
<pill primary ring user-icon>Tu</pill>
<pill amber crown>NomeFounder</pill>

// Altri membri
<pill gray>NomeMembro</pill>
```

---

## Modali Annidati

### Pattern Implementativo

```jsx
const ParentModal = ({ isOpen }) => {
  const [isChildOpen, setIsChildOpen] = useState(false);

  return (
    <>
      <Modal isOpen={isOpen} zIndex={isChildOpen ? 990 : 1000}>
        <div className={isChildOpen ? "blur-sm pointer-events-none" : ""}>
          {/* Contenuto */}
          <button onClick={() => setIsChildOpen(true)}>Modifica</button>
        </div>
      </Modal>

      <InputModal
        isOpen={isChildOpen}
        zIndex={1010}
        onConfirm={handleSave}
        onClose={() => setIsChildOpen(false)}
      />
    </>
  );
};
```

### Regole

1. **z-Index**: Padre < Figlio (es. 990 vs 1010)
2. **Blur**: Applica `blur-sm pointer-events-none` al contenuto del padre
3. **onClose**: Sempre passare callback per gestione history

---

## PWA (Progressive Web App)

### File in `public/`

| File                     | Descrizione                |
| ------------------------ | -------------------------- |
| `manifest.json`          | Manifest PWA               |
| `sw.js`                  | Service Worker             |
| `favicon.svg/ico`        | Icone favicon              |
| `apple-touch-icon.png`   | Icona iOS                  |
| `web-app-manifest-*.png` | Icone PWA 192x192, 512x512 |

### Hook `usePWAInstall`

```jsx
const { isInstallable, isInstalled, install, deviceInfo } = usePWAInstall();
```

### InstallModal

Mostra istruzioni specifiche per dispositivo (iOS manual, Android/Desktop direct se disponibile).
