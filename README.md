# EpiTunes - Web player musicale

![Logo EpiTunes](./assets/img/epitunes-logo.png)

**Progetto realizzato dal Team 1**

Questa repository contiene il codice sorgente di **EpiTunes**, un'applicazione web ispirata a Spotify e sviluppata per **EPICODE** durante la Build Week 2. L'app usa la **iTunes Search API** per cercare brani, album e artisti e riprodurne le anteprime audio.

**Stato del progetto:** in fase di sviluppo. Questo file viene aggiornato man mano che il progetto viene realizzato.

**Sito online:** _da compilare con il link di GitHub Pages_

## Indice

1. [Funzionalità](#funzionalità)
2. [Anteprima](#anteprima)
3. [Tecnologie utilizzate](#tecnologie-utilizzate)
4. [Come eseguire il progetto in locale](#come-eseguire-il-progetto-in-locale)
5. [Struttura del progetto](#struttura-del-progetto)
6. [Architettura](#architettura)
7. [Albero del DOM](#albero-del-dom)
8. [Come funziona](#come-funziona)
9. [Convenzioni di codice](#convenzioni-di-codice)
10. [Il Team 1 e il flusso di lavoro](#il-team-1-e-il-flusso-di-lavoro)

---

## Funzionalità

L'applicazione è divisa in tre zone fisse (sidebar, contenuto, player) e quattro pagine:

1. **Home** (`index.html`)
2. **Cerca** (`search.html`)
3. **Album** (`album.html`)
4. **Artista** (`artist.html`)

### Funzionalità principali

_Da compilare con le funzionalità realizzate._

## Anteprima

_Da compilare con gli screenshot finali di Home, Cerca, Album e Artista._

## Tecnologie utilizzate

- **HTML5:** struttura delle quattro pagine.
- **CSS3:** stile e layout.
- **JavaScript (ES6+):** logica dell'applicazione.
- **iTunes Search API:** dati e anteprime audio.

_Da completare con le tecnologie aggiunte durante il lavoro._

## Come eseguire il progetto in locale

**1. Clona il repository:**

```bash
git clone _da compilare con l'URL della repo_
```

**2. Apri l'applicazione:** apri `index.html` con **Live Server** su VS Code. Serve una connessione a internet per i dati di iTunes.

## Struttura del progetto

```text
.
├── index.html              # Home
├── search.html             # Ricerca
├── album.html              # Dettaglio album
├── artist.html             # Dettaglio artista
├── README.md
└── assets/
    ├── css/
    │   └── app.css         # Stile
    ├── img/                # Immagini
    └── js/
        ├── common.js       # Codice condiviso da tutte le pagine
        ├── home.js         # Home
        ├── search.js       # Ricerca
        ├── album.js        # Pagina album
        └── artist.js       # Pagina artista
```

## Architettura

Ogni pagina carica prima `common.js` e poi il proprio script.

- **Classi modello:** _da compilare con il codice di `Track`, `Album` e `Artist` (common.js)._
- **Classe `Player`:** _da compilare con il codice del Player (common.js)._
- **Helpers:** _da compilare con il codice di `fetchJSON()` e delle funzioni di supporto (common.js)._
- **localStorage:** _da compilare con il codice di cronologia e preferiti (common.js)._
- **Pagine:** _da compilare con il codice di home.js, search.js, album.js e artist.js._

## Albero del DOM

### Cornice comune (tutte le pagine)

```html
<div class="app">
  <aside class="sidebar"></aside>
  <main class="main">
    <header class="topbar">
      <div class="topbar-nav">
        <button class="nav-btn">‹</button>
        <button class="nav-btn">›</button>
      </div>
      <div class="user-pill">Studente Epicode</div>
    </header>
    <section class="...">...</section>   <!-- cambia per ogni pagina -->
  </main>
  <footer class="player"></footer>
</div>
<audio id="audio-element"></audio>
```

### Sidebar

_Da compilare con il codice di `renderSidebar()` (common.js)._

### Player

_Da compilare con il codice di `Player.mount()` (common.js)._

### Home

```html
<section class="home"></section>
```

_Da completare con il codice di `renderRow()` (home.js)._

### Cerca

```html
<section class="search">
  <div class="search-box">
    <input type="text" id="search-input" class="search-input" />
  </div>
  <div class="search-results">
    <section class="row" id="row-tracks" hidden>
      <h2>Brani</h2>
      <div class="grid" id="grid-tracks"></div>
    </section>
    <section class="row" id="row-albums" hidden>
      <h2>Album</h2>
      <div class="grid" id="grid-albums"></div>
    </section>
    <section class="row" id="row-artists" hidden>
      <h2>Artisti</h2>
      <div class="grid" id="grid-artists"></div>
    </section>
  </div>
</section>
```

_Da completare con il codice delle card (search.js)._

### Album

```html
<section class="album-page">
  <div class="album-hero" id="album-hero"></div>
  <div class="tracklist" id="tracklist"></div>
</section>
```

_Da completare con il codice di `loadAlbum()` (album.js)._

### Artista

```html
<section class="artist-page">
  <div class="artist-hero" id="artist-hero"></div>
  <div class="top-tracks" id="top-tracks"></div>
</section>
```

_Da completare con il codice di `loadArtist()` (artist.js)._

## Come funziona

### 1. Home

_Da compilare con il codice di home.js._

### 2. Cerca

_Da compilare con il codice di search.js._

### 3. Album

_Da compilare con il codice di album.js._

### 4. Artista

_Da compilare con il codice di artist.js._

### 5. Player

_Da compilare con il codice della classe `Player` (common.js)._

### 6. Preferiti e cronologia

_Da compilare con il codice di localStorage (common.js)._

### Aspetto grafico

_Da compilare con lo stile finale._

## Convenzioni di codice

- Variabili, funzioni e costanti in inglese, con nomi intuitivi.
- `camelCase` per variabili e funzioni, maiuscolo con trattino basso per le costanti (`MAX_HISTORY`).
- Id e classi HTML/CSS in minuscolo con i trattini (`search-input`, `track-row`).
- Solo `const` e `let`, mai `var`.
- Mai `innerHTML`: gli elementi si creano con `createElement`, `textContent`, `classList` e `appendChild`.
- `querySelector()` e `querySelectorAll()` per il DOM.
- `addEventListener()`, mai `onclick` inline nell'HTML.
- Tutti i dati dell'API passano dalle classi `Track`, `Album` e `Artist`.
- Commenti per facilitare la comprensione del codice.

## Il Team 1 e il flusso di lavoro

| Persona | Ruolo |
|---|---|
| Francesca Morrone  | Team Leader, CSS |
| Gianluca Fatigati | Gestore Git, README |
| Miriam Caridi | JavaScript |
| Louis Anthony Pagliaro | JavaScript |
| Charlie Cennie | CSS |

### Organizzazione del lavoro

- **Progettazione:** prima di scrivere il codice il team ha disegnato l'albero del DOM di ogni pagina e una scaletta dei passi in ordine di implementazione, partendo da `common.js`.
- **Live Share:** un membro del team fa da host e tutti lavorano sul codice in contemporanea.
- **Gestione Git:** una sola persona gestisce repository e commit, con il supporto del team.
- **Repository:** il progetto è ospitato sul profilo GitHub della persona che gestisce Git.

---

**EPICODE — Build Week 2 | Team 1**