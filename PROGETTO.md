# Scaletta - Documentazione del Progetto

## Panoramica

**Scaletta** è una piattaforma collaborativa che permette la creazione e gestione di gruppi di lavoro con struttura orizzontale. Ogni membro del gruppo ha gli stessi poteri e privilegi, mantenendo però traccia del fondatore originale.

---

## Concetti Fondamentali

### 1. Gruppi

Un **Gruppo** è l'entità principale dell'applicazione. Rappresenta un team di persone che collaborano insieme.

#### Caratteristiche dei Gruppi:

- **Nome del gruppo**: Identificativo univoco del gruppo
- **Descrizione**: Breve descrizione dello scopo del gruppo
- **Data di creazione**: Timestamp di quando il gruppo è stato creato
- **Founder (Fondatore)**: L'utente che ha creato il gruppo (viene tracciato ma NON ha poteri speciali)
- **Membri**: Lista di tutti gli utenti che fanno parte del gruppo

#### Regole dei Gruppi:

- ✅ Tutti i membri hanno **gli stessi poteri e permessi**
- ✅ Il founder viene identificato e memorizzato nel sistema
- ✅ Il founder NON ha privilegi aggiuntivi rispetto agli altri membri
- ✅ Ogni membro può invitare nuovi utenti
- ✅ Ogni membro può rimuovere altri membri (incluso il founder)
- ✅ Ogni membro può modificare le impostazioni del gruppo
- ✅ Ogni membro può eliminare il gruppo

---

### 2. Progetti

Ogni gruppo può creare e gestire molteplici **Progetti**. Un progetto è uno spazio di lavoro dedicato a un'attività specifica.

#### Caratteristiche dei Progetti:

- **Nome del progetto**: Identificativo del progetto all'interno del gruppo
- **Descrizione**: Descrizione dettagliata del progetto
- **Data di creazione**: Quando il progetto è stato creato
- **Creatore**: Chi ha creato il progetto (informativo, senza privilegi speciali)
- **Stato**: Attivo, In pausa, Completato, Archiviato

#### Funzionalità dei Progetti:

##### 📁 Gestione File

- **Upload di file**: Caricamento di qualsiasi tipo di file
- **Download di file**: Scaricamento dei file caricati
- **Anteprima file**: Visualizzazione diretta di immagini, PDF, documenti
- **Organizzazione**: Possibilità di creare cartelle e sottocartelle
- **Cronologia versioni**: Tracciamento delle versioni dei file modificati

##### 📝 Note

- **Creazione note**: Aggiunta di note testuali al progetto
- **Modifica note**: Modifica delle note esistenti
- **Formattazione**: Supporto per testo formattato (grassetto, corsivo, liste, ecc.)
- **Etichette/Tag**: Categorizzazione delle note con tag
- **Ricerca**: Ricerca full-text all'interno delle note

##### 📊 Dati e Informazioni

- **Campi personalizzati**: Possibilità di aggiungere campi dati personalizzati
- **Tabelle dati**: Creazione di tabelle per organizzare informazioni
- **Metadati**: Informazioni aggiuntive associate ai file e alle note
- **Statistiche**: Dashboard con statistiche sul progetto

##### 👁️ Visualizzazione

- **Vista file**: Visualizzatore integrato per documenti e media
- **Vista galleria**: Visualizzazione a griglia per immagini
- **Vista lista**: Lista dettagliata di tutti gli elementi
- **Filtri**: Filtri per tipo, data, autore, tag
- **Ordinamento**: Ordinamento per vari criteri

---

## Struttura Dati

### Utente

```
{
  id: string
  nome: string
  email: string
  avatar: string (opzionale)
  dataRegistrazione: timestamp
}
```

### Gruppo

```
{
  id: string
  nome: string
  descrizione: string
  founderId: string (riferimento all'utente fondatore)
  membri: [userId, userId, ...] (lista di ID utenti)
  dataCreazione: timestamp
  impostazioni: object
}
```

### Progetto

```
{
  id: string
  gruppoId: string (riferimento al gruppo)
  nome: string
  descrizione: string
  creatoreId: string
  stato: "attivo" | "in_pausa" | "completato" | "archiviato"
  dataCreazione: timestamp
  dataModifica: timestamp
}
```

### File

```
{
  id: string
  progettoId: string
  nome: string
  tipo: string (mime type)
  dimensione: number (bytes)
  percorso: string (path nel sistema di storage)
  caricatoDa: userId
  dataCaricamento: timestamp
  versione: number
}
```

### Nota

```
{
  id: string
  progettoId: string
  titolo: string
  contenuto: string (HTML o Markdown)
  creatoDa: userId
  dataCreazione: timestamp
  dataModifica: timestamp
  tags: [string, string, ...]
}
```

### Dato Personalizzato

```
{
  id: string
  progettoId: string
  chiave: string
  valore: any
  tipo: "testo" | "numero" | "data" | "booleano" | "lista"
  creatoDa: userId
  dataCreazione: timestamp
}
```

---

## Flusso di Utilizzo

### 1. Registrazione/Login

1. L'utente si registra o effettua il login
2. Accede alla dashboard personale

### 2. Creazione Gruppo

1. L'utente clicca su "Crea Nuovo Gruppo"
2. Inserisce nome e descrizione
3. Il sistema lo registra automaticamente come **founder** e primo membro
4. Può invitare altri utenti tramite email o link

### 3. Gestione Membri

1. Qualsiasi membro può invitare nuovi utenti
2. Qualsiasi membro può rimuovere altri membri
3. Il founder viene mostrato con un badge identificativo ma senza poteri extra

### 4. Creazione Progetto

1. Da dentro un gruppo, qualsiasi membro clicca "Nuovo Progetto"
2. Inserisce nome e descrizione
3. Il progetto viene creato e associato al gruppo

### 5. Lavoro sul Progetto

1. I membri accedono al progetto
2. Possono:
   - Caricare/scaricare file
   - Creare/modificare note
   - Aggiungere dati personalizzati
   - Visualizzare contenuti
   - Organizzare materiali in cartelle

---

## Permessi e Sicurezza

### Principio di Uguaglianza

- **Ogni membro ha pieni poteri** su tutte le risorse del gruppo
- Non esistono ruoli differenziati (admin, editor, viewer)
- Il founder è solo un'informazione storica

### Azioni Disponibili a Tutti i Membri

| Azione                         | Disponibile |
| ------------------------------ | ----------- |
| Creare progetti                | ✅          |
| Eliminare progetti             | ✅          |
| Caricare file                  | ✅          |
| Eliminare file (anche altrui)  | ✅          |
| Creare note                    | ✅          |
| Modificare note (anche altrui) | ✅          |
| Eliminare note (anche altrui)  | ✅          |
| Invitare membri                | ✅          |
| Rimuovere membri               | ✅          |
| Modificare impostazioni gruppo | ✅          |
| Eliminare il gruppo            | ✅          |

### Tracciabilità

- Ogni azione viene loggata con timestamp e autore
- È possibile vedere chi ha creato/modificato cosa
- Cronologia delle modifiche disponibile

---

## Interfaccia Utente (UI)

### Pagine Principali

1. **Dashboard**

   - Lista dei gruppi a cui l'utente appartiene
   - Attività recenti
   - Accesso rapido ai progetti recenti

2. **Pagina Gruppo**

   - Informazioni del gruppo
   - Lista membri (con badge founder)
   - Lista progetti
   - Impostazioni gruppo

3. **Pagina Progetto**

   - Tabs per: File, Note, Dati
   - Area di visualizzazione principale
   - Sidebar con filtri e navigazione
   - Toolbar con azioni rapide

4. **Visualizzatore File**
   - Anteprima documenti
   - Player per audio/video
   - Galleria immagini

---

## Tecnologie Suggerite

### Frontend (già configurato con Vite + React)

- React.js per l'interfaccia
- React Router per la navigazione
- Context API o Zustand per lo stato globale
- Axios per le chiamate API

### Backend (da implementare)

- Node.js + Express oppure
- Firebase/Supabase per backend-as-a-service

### Storage File

- Firebase Storage oppure
- AWS S3 oppure
- Cloudinary

### Database

- Firestore (NoSQL) oppure
- PostgreSQL (SQL) oppure
- MongoDB

---

## Roadmap di Sviluppo

### Fase 1 - Base

- [ ] Sistema di autenticazione
- [ ] CRUD Gruppi
- [ ] Gestione membri
- [ ] CRUD Progetti base

### Fase 2 - File Management

- [ ] Upload file
- [ ] Download file
- [ ] Anteprima file
- [ ] Organizzazione cartelle

### Fase 3 - Note e Dati

- [ ] Sistema note con editor
- [ ] Campi dati personalizzati
- [ ] Sistema di tag

### Fase 4 - Miglioramenti

- [ ] Ricerca avanzata
- [ ] Notifiche
- [ ] Cronologia attività
- [ ] Versioning file

### Fase 5 - Polish

- [ ] Ottimizzazione performance
- [ ] UI/UX refinements
- [ ] Mobile responsiveness
- [ ] PWA support

---

## Note Finali

Il nome **Scaletta** richiama l'idea di una struttura organizzativa (come una scaletta di un evento o programma) dove ogni elemento ha la sua importanza e tutti contribuiscono al risultato finale, senza gerarchie di potere ma con tracciabilità delle origini.
