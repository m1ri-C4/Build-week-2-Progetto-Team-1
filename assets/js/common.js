/* ============================================================
   common.js — codice condiviso tra tutte le pagine
   ============================================================

   REGOLE GENERALI
   - Solo const e let (mai var)
   - DOM: querySelector / querySelectorAll
   - Eventi: addEventListener (mai onclick inline)
   - fetch + async/await + try/catch
   - localStorage: setItem / getItem / removeItem (salva sempre stringhe)
   - Pattern OOP: classi Track, Album, Artist, Player

   COSA CONTIENE QUESTO FILE
   1) Costanti (URL base API, chiavi localStorage)
   2) Helpers (fetchJSON, formatTime, bigArt, debounce)
   3) Classi modello: Track, Album, Artist
   4) Classe Player (gestisce <audio>)
   5) localStorage helpers (history, favourites)
   6) Render sidebar e player footer
   7) Inizializzazione al DOMContentLoaded 

   ESEMPIO USO DELL'ELEMENTO <audio>
   --------------------------------
     const audio = document.querySelector("#audio-element");
     audio.src = "https://...preview.m4a"; // URL della preview MP3
     audio.play();                         // avvia la riproduzione
     audio.pause();                        // mette in pausa
     audio.currentTime = 10;               // salta a 10 secondi
     audio.duration;                       // durata in secondi
     audio.volume = 0.5;                   // volume tra 0 e 1

     audio.addEventListener("timeupdate", () => {
       // chiamato continuamente durante la riproduzione
       const percent = (audio.currentTime / audio.duration) * 100;
     });

     audio.addEventListener("ended", () => {
       // brano finito
     });

   ESEMPIO USO DELL'API iTunes
   ---------------------------
     // Ricerca brani
     fetch("https://itunes.apple.com/search?term=eminem&entity=song&limit=10")

     // Ricerca album
     fetch("https://itunes.apple.com/search?term=pink+floyd&entity=album&limit=10")

     // Ricerca artisti
     fetch("https://itunes.apple.com/search?term=jovanotti&entity=musicArtist&limit=5")

     // Dettagli album (con tracce)
     fetch("https://itunes.apple.com/lookup?id=1440831203&entity=song")

     // Top tracks artista
     fetch("https://itunes.apple.com/lookup?id=909253&entity=song&limit=10")
*/

/* ============================ 1. Costanti ============================ */

const API_BASE = "https://itunes.apple.com";
const STORAGE_KEY_HISTORY = "epitunes_history";
const STORAGE_KEY_FAVOURITES = "epitunes_favourites";
const STORAGE_KEY_LAST_SEARCH = "epitunes_last_search";
const MAX_HISTORY = 12;

/* ============================ 2. Helpers ============================ */

/*
  fetchJSON(url)
  - Fa una richiesta GET e ritorna i dati JSON
  - Gestisce errori HTTP e di rete con try/catch
  - In caso di errore ritorna { results: [], resultCount: 0 } per semplificare i chiamanti
*/
const fetchJSON = async (url) => {
  try {
    const response = await fetch(url); //richiedo i dati dall'url
    if (!response.ok) {
      // se non è andato a buon fine
      throw new Error(`Errore HTTP: ${response.status}`); //genera un errore che mi dia il valore
    } // altrimenti
    const data = await response.json(); // trasforma i dati grezzi json in arrey ogetti ecc
    return data; // e ritornali
  } catch (error) {
    // se il blocco non funziona trova l'errore
    console.error("Errore durante fetchJSON:", error); // stampalo in console
    return { results: [], resultCount: 0 }; // e torna un risultato fittizzio senza stoppare
  }
};

/*
  bigArt(url)
  - L'API iTunes ritorna artwork 100x100 (artworkUrl100)
  - Sostituisce "100x100bb" con "600x600bb" per avere una cover più grande
*/
const bigArt = (url) => {
  if (!url) return "";
  return url.replace("100x100", "600x600");
};

/*
  formatTime(ms)
  - Converte millisecondi in stringa "m:ss"
  - Esempio: 65000 -> "1:05"
*/
const formatTime = (ms) => {
  if (!ms) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
};

/*
  debounce(fn, ms)
  - Restituisce una nuova funzione che chiama fn solo dopo "ms" millisecondi
    di pausa rispetto all'ultima chiamata. Usata per la ricerca al type.
*/
const debounce = (fn, ms) => {
  let timerId = null;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn(...args), ms);
  };
};

/* ============================ 3. Classi modello ============================ */

/* Classe Track */
class Track {
  constructor(raw) {
    this.id = raw.trackId;
    this.title = raw.trackName;
    this.artist = raw.artistName;
    this.album = raw.collectionName;
    this.albumId = raw.collectionId;
    this.artistId = raw.artistId;
    this.cover = raw.artworkUrl100;
    this.previewUrl = raw.previewUrl;
    this.durationMs = raw.trackTimeMillis;
  }
}

/* Classe Album */
class Album {
  constructor(raw) {
    this.id = raw.collectionId;
    this.title = raw.collectionName;
    this.artist = raw.artistName;
    this.cover = raw.artworkUrl100;
    this.releaseDate = raw.releaseDate;
    this.trackCount = raw.trackCount;
  }
}

/* Classe Artist */
class Artist {
  constructor(raw) {
    this.id = raw.artistId;
    this.name = raw.artistName;
    this.genre = raw.primaryGenreName ?? 'Genere sconosciuto';
  }
}

/* ============================ 4. Classe Player ============================ */
class Player {
  constructor() {
    this.audio = document.querySelector("#audio-element");
    this.currentTrack;
    this.isPlaying = false; //stato della riproduzione non attivo

    //richiamiamo una proprietà che esiste, ma non ha ancora un valore assegnato
    this.cover;
    this.title;
    this.artist;

    // Opzionali per controlli futuri:
    // this.btnShuffle;
    // this.btnPrev;
    // this.btnNext;
    // this.btnRepeat;

    this.btnToggle;
    this.timeCurrent;
    this.timeTotal;
    this.progressBar;
    this.progressFill;
    this.volumeIcon;
    this.volumeBar;
    this.volumeFill;
  }

  //metondo mount() renderizza il footer a schermo
  mount() {
    const footer = document.querySelector(".player");
    if (!footer) return;

    // contenitore del brano
    const playerTrack = document.createElement("div");
    playerTrack.classList.add("player-track");

    // copertina
    const playerCover = document.createElement("div");
    playerCover.classList.add("player-cover");

    const coverImg = document.createElement("img");
    coverImg.id = "player-cover-img";
    coverImg.alt = "img";

    playerCover.appendChild(coverImg);

    // informazioni del brano
    const playerMeta = document.createElement("div");
    playerMeta.classList.add("player-meta");

    const playerTitle = document.createElement("p");
    playerTitle.classList.add("player-title");
    playerTitle.id = "player-title";
    playerTitle.textContent = "Seleziona un brano";

    const playerArtist = document.createElement("p");
    playerArtist.classList.add("player-artist");
    playerArtist.id = "player-artist";
    playerArtist.textContent = "—";

    playerMeta.appendChild(playerTitle);
    playerMeta.appendChild(playerArtist);

    playerTrack.appendChild(playerCover);
    playerTrack.appendChild(playerMeta);

    // contenitore
    const playerCenter = document.createElement("div");
    playerCenter.classList.add("player-center");

    // controlli del player
    const playerControls = document.createElement("div");
    playerControls.classList.add("player-controls");

    // bottone shuffle
    const btnShuffle = document.createElement("button");
    btnShuffle.classList.add("btn-ctrl");
    btnShuffle.id = "btn-shuffle";
    btnShuffle.setAttribute("aria-label", "Shuffle");
    btnShuffle.textContent = "⇄";

    // precedente
    const btnPrev = document.createElement("button");
    btnPrev.classList.add("btn-ctrl");
    btnPrev.id = "btn-prev";
    btnPrev.setAttribute("aria-label", "Precedente");
    btnPrev.textContent = "⏮";

    // play/pause
    const btnToggle = document.createElement("button");
    btnToggle.classList.add("btn-play");
    btnToggle.id = "btn-toggle";
    btnToggle.setAttribute("aria-label", "Play/Pausa");
    btnToggle.textContent = "▶";

    // successivo
    const btnNext = document.createElement("button");
    btnNext.classList.add("btn-ctrl");
    btnNext.id = "btn-next";
    btnNext.setAttribute("aria-label", "Successivo");
    btnNext.textContent = "⏭";

    // ripeti
    const btnRepeat = document.createElement("button");
    btnRepeat.classList.add("btn-ctrl");
    btnRepeat.id = "btn-repeat";
    btnRepeat.setAttribute("aria-label", "Ripeti");
    btnRepeat.textContent = "↻";

    playerControls.appendChild(btnShuffle);
    playerControls.appendChild(btnPrev);
    playerControls.appendChild(btnToggle);
    playerControls.appendChild(btnNext);
    playerControls.appendChild(btnRepeat);

    // barra di avanzamento
    const playerProgress = document.createElement("div");
    playerProgress.classList.add("player-progress");

    // tempo
    const timeCurrent = document.createElement("span");
    timeCurrent.id = "time-current";
    timeCurrent.textContent = "0:00";

    // progress bar
    const progressBar = document.createElement("div");
    progressBar.classList.add("progress-bar");
    progressBar.id = "progress-bar";

    const progressFill = document.createElement("div");
    progressFill.classList.add("progress-fill");
    progressFill.id = "progress-fill";

    progressBar.appendChild(progressFill);

    // tempo totale
    const timeTotal = document.createElement("span");
    timeTotal.id = "time-total";
    timeTotal.textContent = "0:00";

    playerProgress.appendChild(timeCurrent);
    playerProgress.appendChild(progressBar);
    playerProgress.appendChild(timeTotal);

    playerCenter.appendChild(playerControls);
    playerCenter.appendChild(playerProgress);

    // contenitore del volume
    const playerRight = document.createElement("div");
    playerRight.classList.add("player-right");

    const volumeIcon = document.createElement("button");
    volumeIcon.classList.add("btn-ctrl");
    volumeIcon.textContent = "🔊";
    volumeIcon.id = "volume-icon";

    const volumeBar = document.createElement("div");
    volumeBar.classList.add("volume-bar");
    volumeBar.id = "volume-bar";

    const volumeFill = document.createElement("div");
    volumeFill.classList.add("volume-fill");
    volumeFill.id = "volume-fill";
    volumeFill.style.width = "40%";

    volumeBar.appendChild(volumeFill);

    playerRight.appendChild(volumeIcon);
    playerRight.appendChild(volumeBar);

    // assemblamento html
    footer.appendChild(playerTrack);
    footer.appendChild(playerCenter);
    footer.appendChild(playerRight);

    // salva i riferimenti agli elementi del footer dopo averli montati
    this.cover = document.querySelector("#player-cover-img");
    this.title = document.querySelector(".player-title");
    this.artist = document.querySelector(".player-artist");
    this.btnToggle = document.querySelector("#btn-toggle");
    this.timeCurrent = document.querySelector("#time-current");
    this.timeTotal = document.querySelector("#time-total");
    this.progressBar = document.querySelector("#progress-bar");
    this.progressFill = document.querySelector("#progress-fill");
    this.volumeBar = document.querySelector("#volume-bar");
    this.volumeFill = document.querySelector("#volume-fill");
    this.volumeIcon = document.querySelector("#volume-icon");

    this.previousVolume = 0.4;
    this.setVolume(0.4); // volume iniziale 40%
    this._bindEvents();

    //refresh con ultimo brano in play
    const lastTrack = getHistory()[0];
    if (lastTrack) {
      this.currentTrack = lastTrack;
      this.audio.src = lastTrack.previewUrl || "";
      this.cover.src = bigArt(lastTrack.cover);
      this.cover.alt = lastTrack.title;
      this.title.textContent = lastTrack.title;
      this.artist.textContent = lastTrack.artist;
      this.timeTotal.textContent = formatTime(lastTrack.durationMs);
    }
  }

  // metodo che collega gli event listener
  _bindEvents() {
    //evento 1 = play/pausa
    if (this.btnToggle) {
      this.btnToggle.addEventListener("click", () => {
        this.togglePlay();
      });
    }

    //evento 2 = click progress bar
    if (this.progressBar) {
      this.progressBar.addEventListener("click", (e) => {
        const clickPosition = e.offsetX; // recupera la posizione del click all'interno della barra
        const barWidth = this.progressBar.clientWidth; // recupera la larghezza della barra
        if (barWidth <= 0) return; // interrompe la funzione se la larghezza è <=0
        const percent = clickPosition / barWidth; // calcola la proporzione della barra selezionata (da 0 a 1)
        this.seek(percent); // sposta la riproduzione nel punto selezionato
      });
    }

    // evento 3 = gestione del volume
    if (this.volumeBar) {
      const updateVolume = (e) => {
        const position = e.offsetX; // recupera la posizione del mouse nella barra
        const barWidth = this.volumeBar.clientWidth; // recupera la larghezza della barra
        if (barWidth <= 0) return; // evita una divisione per zero
        const volume = position / barWidth; // calcola il livello del volume
        this.setVolume(volume); // aggiorna il volume
      };
      this.volumeBar.addEventListener("click", updateVolume); // modifica il volume con un semplice click
      // modifica il volume durante il trascinamento
      this.volumeBar.addEventListener("mousemove", (e) => {
        if (e.buttons !== 1) return;
        updateVolume(e);
      });
    }

    //evento 4 = timeupdate
    if (this.audio) {
      this.audio.addEventListener("timeupdate", () => {
        // recuperiamo il tempo trascorso e la durata totale, se il valore non è disponibile o è false, utilizziamo 0
        const current = this.audio.currentTime || 0;
        const duration = this.audio.duration || 0;

        if (this.timeCurrent) {
          this.timeCurrent.textContent = formatTime(current * 1000); // formattiamo il tempo da ms in sec
        }

        if (this.progressFill) {
          const percent = duration > 0 ? (current / duration) * 100 : 0;
          this.progressFill.style.width = `${percent}%`; //aggiorno la larghezza del riempimento con percent
        }
      });

      //evento 5 = click icona volume
      if (this.volumeIcon) {
        this.volumeIcon.addEventListener("click", () => {
          if (this.audio.volume > 0) {
            this.previousVolume = this.audio.volume;
            this.setVolume(0);
          } else {
            this.setVolume(this.previousVolume);
          }
        });
      }

      //evento 6 = quando termina la produzione ripristina graficamente il player
      this.audio.addEventListener("ended", () => {
        this.isPlaying = false;
        if (this.btnToggle) {
          this.btnToggle.textContent = "▶";
        }
        if (this.progressFill) {
          this.progressFill.style.width = "0%";
        }
        if (this.timeCurrent) {
          this.timeCurrent.textContent = "0:00";
        }
        this._updateTrackRows();
      });
    }
  }

  // il metodo play(), riceve come parametro 'track' oggetto che contiene le informazioni della canzone
  play(track) {
    if (!track || !this.audio) return;

    this.currentTrack = track;
    this.audio.src = track.previewUrl || "";
    this.audio.play().catch((err) => {
      console.error("Errore durante l'avvio della riproduzione:", err);
    });

    this.isPlaying = true;

    if (this.cover) {
      this.cover.src = bigArt(track.cover);
      this.cover.alt = track.title || "Copertina brano";
    }
    if (this.title) {
      this.title.textContent = track.title || "Titolo sconosciuto";
    }
    if (this.artist) {
      this.artist.textContent = track.artist || "Artista sconosciuto";
    }
    if (this.timeTotal) {
      this.timeTotal.textContent = formatTime(track.durationMs || 30000);
    }
    if (this.btnToggle) {
      this.btnToggle.textContent = "⏸";
    }

    // aggiorna la cronologia
    if (typeof addToHistory === "function") {
      addToHistory(track);
    }

    //aggiorna lo stato grafico
    this._updateTrackRows();
  }

  // metodo che alterna play e pausa
  togglePlay() {
    if (!this.audio || !this.currentTrack) return;

    if (this.audio.paused) {
      this.audio.play().catch((err) => {
        console.error("Errore durante la ripresa della riproduzione:", err);
      });
      this.isPlaying = true;
      if (this.btnToggle) {
        this.btnToggle.textContent = "⏸";
      }
    } else {
      this.audio.pause();
      this.isPlaying = false;
      if (this.btnToggle) {
        this.btnToggle.textContent = "▶";
      }
    }

    this._updateTrackRows();
  }

  // metodo della gestione del volume, il valore 'v' reappresenta il volume desiderato
  setVolume(v) {
    const clamped = Math.max(0, Math.min(1, v));
    /* il volume è compreso tra 0 e 1,   
    Math.min() restituisce il valore più piccolo tra 1 e v,
    Math.max restituisce il valore più grande tra 0 e il risultato di Math.min,
    esempio: v = 1.5, Math.min = 1, Math.max = 1, volume finale = 100%
    */
    if (this.audio) {
      this.audio.volume = clamped;
    }
    if (this.volumeFill) {
      this.volumeFill.style.width = `${clamped * 100}%`;
    }
    if (this.volumeIcon) {
      this.volumeIcon.textContent = clamped === 0 ? "🔇" : "🔊";
    }
  }

  // il metodo seek viene richiamato al click sulla progress bar
  seek(percent) {
    //se almeno una condizione è vera, il metodo viene interrotto
    if (
      !this.audio ||
      !Number.isFinite(this.audio.duration) || //la durata non è un numero finito valido (NaN o infinity)
      this.audio.duration <= 0
    ) {
      return;
    }
    const clamped = Math.max(0, Math.min(1, percent));
    this.audio.currentTime = this.audio.duration * clamped;
  }

  // evidenzia il brano in riproduzione e sincronizza la grafica delle righe con lo stato della riproduzione
  _updateTrackRows() {
    const rows = document.querySelectorAll(".track-row"); // identifica le righe dei brani nel DOM
    rows.forEach((row) => {
      const rowTrackId = String(row.dataset.trackId || "");
      const isCurrent =
        this.currentTrack &&
        this.isPlaying &&
        rowTrackId !== "" &&
        rowTrackId === String(this.currentTrack.id);
      row.classList.toggle("is-playing", Boolean(isCurrent));
    });
  }
}

/* ============================ 5. localStorage helpers ============================ */

/*
  getHistory() -> array di Track (al più MAX_HISTORY)
  addToHistory(track) -> aggiunge in testa, rimuove duplicati, taglia a MAX_HISTORY
  getFavourites() -> array di Track
  isFavourite(trackId) -> bool
  toggleFavourite(track) -> aggiunge o rimuove
*/

//funzione utility per gestire gli errori
const readArray = (key) => {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);
    return parsed;
  } catch (error) {
    console.error("Errore:", error);
    return [];
  }
};

const getHistory = () => {
  return readArray(STORAGE_KEY_HISTORY);
};
//funzione per aggiungere un brano alla cronologia al click di play
const addToHistory = (track) => {
  const filtered = getHistory().filter(
    (t) => Number(t.id) !== Number(track.id),
  );

  filtered.unshift(track); //per spostare l'ultima ascoltata in alto
  const sliced = filtered.slice(0, MAX_HISTORY); //ne salva solo 12
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(sliced));
};

const getFavourites = () => {
  return readArray(STORAGE_KEY_FAVOURITES);
};

//definisce se un brano si trova già tra i preferiti
const isFavourite = (trackId) => {
  return getFavourites().some((t) => Number(t.id) === Number(trackId));
};

const toggleFavourite = (track) => {
  const favs = getFavourites();
  const exists = favs.some((t) => Number(t.id) === Number(track.id));

  //lista aggiornata
  let updated;
  if (exists) {
    updated = favs.filter((t) => Number(t.id) !== Number(track.id));
  } else {
    updated = [track, ...favs];
  }

  localStorage.setItem(STORAGE_KEY_FAVOURITES, JSON.stringify(updated));
};

/* ============================ 5b. Reusable components ============================ */

const createTrackCard = (track) => {
  const card = document.createElement("div");
  card.classList.add("card");
  card.dataset.trackId = track.id;
  card.addEventListener("click", (e) => {
    e.stopPropagation();
    if (window.player) {
      window.player.play(track);
    }
  });
  const cardImageWrap = document.createElement("div");
  cardImageWrap.classList.add("card-image-wrap");

  const cardImg = document.createElement("img");
  cardImg.src = bigArt(track.cover);
  cardImg.alt = track.title;

  cardImageWrap.appendChild(cardImg);

  //button.card-play["▶"]
  const cardPlay = document.createElement("button");
  cardPlay.classList.add("card-play");
  cardPlay.textContent = "▶";
  cardPlay.addEventListener("click", (e) => {
    e.stopPropagation();
    if (window.player) {
      window.player.play(track);
    }
  });

  //button.card-fav["♡"]
  const cardFav = document.createElement("button");
  cardFav.classList.add("card-fav");
  cardFav.textContent = "♡";
  cardFav.classList.toggle("is-fav", isFavourite(track.id));
  cardFav.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavourite(track);
    cardFav.classList.toggle("is-fav", isFavourite(track.id));
  });

  const cardTitle = document.createElement("p");
  cardTitle.classList.add("card-title");
  cardTitle.textContent = track.title;

  const cardSub = document.createElement("p");
  cardSub.classList.add("card-sub");
  cardSub.textContent = track.artist;

  //-appendChild in ordine: riquadro(img), card(riquadro + play + cuore + titolo + artista)-

  card.appendChild(cardImageWrap);
  card.appendChild(cardPlay);
  card.appendChild(cardFav);
  card.appendChild(cardTitle);
  card.appendChild(cardSub);

  return card;
};

/* ============================ 6. Render sidebar ============================ */

// renderSidebar(activePage per evidenziare il link attivo)

const renderSidebar = (activePage) => {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  // svuota la sidebar
  sidebar.replaceChildren();

  // brand
  const brand = document.createElement("div");
  brand.classList.add("brand");

  const brandMark = document.createElement("div");
  brandMark.classList.add("brand-mark");
  brandMark.textContent = "E";

  const brandText = document.createElement("span");
  brandText.classList.add("brand-text");
  brandText.textContent = "EpiTunes";

  brand.appendChild(brandMark);
  brand.appendChild(brandText);

  // nav
  const sidebarNav = document.createElement("nav");
  sidebarNav.classList.add("sidebar-nav");

  // link home
  const homeLink = document.createElement("a");
  homeLink.href = "index.html";
  homeLink.dataset.page = "home";

  homeLink.classList.toggle("active", activePage === "home"); //toggle

  const homeIcon = document.createElement("span");
  homeIcon.classList.add("ico");
  homeIcon.textContent = "🏠";

  const homeText = document.createElement("span");
  homeText.textContent = "Home";

  homeLink.appendChild(homeIcon);
  homeLink.appendChild(homeText);

  // link cerca
  const searchLink = document.createElement("a");
  searchLink.href = "search.html";
  searchLink.dataset.page = "search";

  searchLink.classList.toggle("active", activePage === "search"); //toggle

  const searchIcon = document.createElement("span");
  searchIcon.classList.add("ico");
  searchIcon.textContent = "🔍";

  const searchText = document.createElement("span");
  searchText.textContent = "Cerca";

  searchLink.appendChild(searchIcon);
  searchLink.appendChild(searchText);

  sidebarNav.appendChild(homeLink);
  sidebarNav.appendChild(searchLink);

  // preferiti
  const sidebarTitle = document.createElement("p");
  sidebarTitle.classList.add("sidebar-section-title");
  sidebarTitle.textContent = "I tuoi preferiti";

  const sidebarFavs = document.createElement("ul");
  sidebarFavs.classList.add("sidebar-list");
  sidebarFavs.id = "sidebar-favs";

  // assemblaggio
  sidebar.appendChild(brand);
  sidebar.appendChild(sidebarNav);
  sidebar.appendChild(sidebarTitle);
  sidebar.appendChild(sidebarFavs);
  // TODO (opzionale): popola #sidebar-favs con i titoli dei preferiti
};

/* ============================ 7. Inizializzazione ============================ */

/* initPage(activePage)
    - Chiamata da home.js / search.js / album.js / artist.js
    - Monta sidebar, monta player, restituisce il player per essere usato. */
const initPage = (activePage) => {
  renderSidebar(activePage);
  const player = new Player();
  player.mount();
  window.player = player;
  return player;
};