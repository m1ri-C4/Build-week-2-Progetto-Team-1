/* ============================================================
   common.js — logica condivisa tra le pagine
   ============================================================ */

/* 1. Costanti */

const API_BASE = "https://itunes.apple.com";
const STORAGE_KEY_HISTORY = "epitunes_history";
const STORAGE_KEY_FAVOURITES = "epitunes_favourites";
const STORAGE_KEY_LAST_SEARCH = "epitunes_last_search";
const MAX_HISTORY = 12;

/* 2. Helpers */

//gestisce gli errori HTTP e rete (le richieste che facciamo api)
const fetchJSON = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Errore HTTP: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Errore fetchJSON:", error);
    return { results: [], resultCount: 0 }; //nel caso di un errore ritorna un array vuoto
  }
};

// ingrandisce la foto
const bigArt = (url) => {
  if (!url) return "";
  return url.replace("100x100", "600x600");
};

//formatto il tempo
const formatTime = (ms) => {
  if (!ms || isNaN(ms)) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
};

// ritarda la ricerca
const debounce = (fn, ms) => {
  let timerId = null;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn(...args), ms);
  };
};

/* 3. Classi modello */

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

class Artist {
  constructor(raw) {
    this.id = raw.artistId;
    this.name = raw.artistName;
    this.genre = raw.primaryGenreName ?? "Genere sconosciuto";
  }
}

/* 4. Classe Player */

class Player {
  constructor() {
    this.audio = document.querySelector("#audio-element");
    this.currentTrack = null;
    this.isPlaying = false;
    //coda
    this.trackQueue = [];
    this.currentIndex = -1;
    //impostazioni di riproduzioni
    this.shuffleEnabled = false;
    this.shuffleOrder = [];
    this.shufflePosition = -1;
    this.repeatMode = "off";

    this.cover = null;
    this.title = null;
    this.artist = null;
    this.btnToggle = null;
    this.timeCurrent = null;
    this.timeTotal = null;
    this.progressBar = null;
    this.progressFill = null;
    this.volumeIcon = null;
    this.volumeBar = null;
    this.volumeFill = null;
  }

  mount() {
    const footer = document.querySelector(".player");
    if (!footer) return;

    footer.replaceChildren();

    // Info brano
    const playerTrack = document.createElement("div");
    playerTrack.classList.add("player-track");

    const playerCover = document.createElement("div");
    playerCover.classList.add("player-cover");

    const coverImg = document.createElement("img");
    coverImg.id = "player-cover-img";
    coverImg.alt = "Copertina brano";

    playerCover.appendChild(coverImg);

    const playerMeta = document.createElement("div");
    playerMeta.classList.add("player-meta");

    const playerTitle = document.createElement("p");
    playerTitle.classList.add("player-title", "text-truncate");
    playerTitle.id = "player-title";
    playerTitle.textContent = "Seleziona un brano";

    const playerArtist = document.createElement("p");
    playerArtist.classList.add("player-artist", "text-truncate");
    playerArtist.id = "player-artist";
    playerArtist.textContent = "—";

    playerMeta.appendChild(playerTitle);
    playerMeta.appendChild(playerArtist);
    playerTrack.appendChild(playerCover);
    playerTrack.appendChild(playerMeta);

    // Controlli e progress bar
    const playerCenter = document.createElement("div");
    playerCenter.classList.add("player-center");

    const playerControls = document.createElement("div");
    playerControls.classList.add("player-controls");

    const btnShuffle = document.createElement("button");
    btnShuffle.classList.add("btn-ctrl");
    btnShuffle.id = "btn-shuffle";
    btnShuffle.setAttribute("aria-label", "Shuffle");
    btnShuffle.textContent = "⇄";

    const btnPrev = document.createElement("button");
    btnPrev.classList.add("btn-ctrl");
    btnPrev.id = "btn-prev";
    btnPrev.setAttribute("aria-label", "Precedente");
    btnPrev.textContent = "⏮";

    const btnToggle = document.createElement("button");
    btnToggle.classList.add("btn-play");
    btnToggle.id = "btn-toggle";
    btnToggle.setAttribute("aria-label", "Play/Pausa");
    btnToggle.textContent = "▶";

    const btnNext = document.createElement("button");
    btnNext.classList.add("btn-ctrl");
    btnNext.id = "btn-next";
    btnNext.setAttribute("aria-label", "Successivo");
    btnNext.textContent = "⏭";

    const btnRepeat = document.createElement("button");
    btnRepeat.classList.add("btn-ctrl");
    btnRepeat.id = "btn-repeat";
    btnRepeat.setAttribute("aria-label", "Ripeti");
    btnRepeat.textContent = "↻";

    playerControls.append(btnShuffle, btnPrev, btnToggle, btnNext, btnRepeat);

    const playerProgress = document.createElement("div");
    playerProgress.classList.add("player-progress");

    const timeCurrent = document.createElement("span");
    timeCurrent.id = "time-current";
    timeCurrent.textContent = "0:00";

    const progressBar = document.createElement("div");
    progressBar.classList.add("progress-bar");
    progressBar.id = "progress-bar";

    const progressFill = document.createElement("div");
    progressFill.classList.add("progress-fill");
    progressFill.id = "progress-fill";

    progressBar.appendChild(progressFill);

    const timeTotal = document.createElement("span");
    timeTotal.id = "time-total";
    timeTotal.textContent = "0:00";

    playerProgress.append(timeCurrent, progressBar, timeTotal);
    playerCenter.append(playerControls, playerProgress);

    // Volume
    const playerRight = document.createElement("div");
    playerRight.classList.add("player-right");

    const volumeIcon = document.createElement("button");
    volumeIcon.classList.add("btn-ctrl");
    volumeIcon.id = "volume-icon";
    volumeIcon.textContent = "🔊";

    const volumeBar = document.createElement("div");
    volumeBar.classList.add("volume-bar");
    volumeBar.id = "volume-bar";

    const volumeFill = document.createElement("div");
    volumeFill.classList.add("volume-fill");
    volumeFill.id = "volume-fill";
    volumeFill.style.width = "40%";

    volumeBar.appendChild(volumeFill);
    playerRight.append(volumeIcon, volumeBar);

    footer.append(playerTrack, playerCenter, playerRight);

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

    this.previousVolume = 0.4; // memorizza l'audio da ripristinare
    this.setVolume(0.4);
    this._bindEvents();

    // ripristina l'ultimo brano in cronologia senza avviarlo
    const lastTrack = getHistory()[0];
    if (lastTrack) {
      this.currentTrack = lastTrack;
      this.audio.src = lastTrack.previewUrl || "";
      if (this.cover) {
        this.cover.src = bigArt(lastTrack.cover);
        this.cover.alt = lastTrack.title;
      }
      if (this.title) this.title.textContent = lastTrack.title;
      if (this.artist) this.artist.textContent = lastTrack.artist;
      if (this.timeTotal)
        this.timeTotal.textContent = formatTime(lastTrack.durationMs);
    }
  }

  // crea la coda
  setQueue(tracks, startIndex = 0) {
    this.trackQueue = tracks;
    this.currentIndex = startIndex;

    // se Shuffle è attivo, crea un nuovo ordine casuale per la coda
    if (this.shuffleEnabled) {
      this.createShuffleOrder();
    }
  }

  // riproduce un brano partendo dalla sua posizione nella coda
  playFromQueue(index) {
    const track = this.trackQueue[index];

    if (!track) return;

    this.currentIndex = index;

    // se Shuffle è attivo, aggiorna la posizione del brano nell'ordine casuale
    if (this.shuffleEnabled) {
      this.shufflePosition = this.shuffleOrder.indexOf(index);
    }

    this.play(track);
  }

  // vai al brano successivo
  nextTrack() {
    console.log("Coda:", this.trackQueue);
    console.log("Indice attuale:", this.currentIndex);

    // se Shuffle è attivo, segue l'ordine casuale
    if (this.shuffleEnabled) {
      // passa alla posizione successiva nell'ordine casuale
      if (this.shufflePosition < this.shuffleOrder.length - 1) {
        this.shufflePosition++;
        this.playFromQueue(this.shuffleOrder[this.shufflePosition]);

        // se Repeat All è attivo, riparte dall'inizio dell'ordine casuale
      } else if (this.repeatMode === "all" && this.shuffleOrder.length > 0) {
        this.shufflePosition = 0;
        this.playFromQueue(this.shuffleOrder[this.shufflePosition]);
      }

      return;
    }

    // se Shuffle è disattivato, segue l'ordine originale
    if (this.currentIndex < this.trackQueue.length - 1) {
      this.playFromQueue(this.currentIndex + 1);

      // se Repeat All è attivo, riparte dal primo brano
    } else if (this.repeatMode === "all" && this.trackQueue.length > 0) {
      this.playFromQueue(0);
    }
  }

  // torna al brano precedente nella coda
  previousTrack() {
    // se Shuffle è attivo, torna indietro nell'ordine casuale
    if (this.shuffleEnabled) {
      if (this.shufflePosition > 0) {
        this.shufflePosition--;
        this.playFromQueue(this.shuffleOrder[this.shufflePosition]);
      }

      return;
    }

    // se Shuffle è disattivato, segue l'ordine originale
    if (this.currentIndex > 0) {
      this.playFromQueue(this.currentIndex - 1);
    }
  }

  // crea un ordine casuale per la coda
  createShuffleOrder() {
    this.shuffleOrder = [];

    // aggiunge alla nuova lista tutti gli indici tranne quello attuale
    for (let i = 0; i < this.trackQueue.length; i++) {
      if (i !== this.currentIndex) {
        this.shuffleOrder.push(i);
      }
    }

    // mescola casualmente gli indici
    for (let i = this.shuffleOrder.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(Math.random() * (i + 1));

      const temp = this.shuffleOrder[i];
      this.shuffleOrder[i] = this.shuffleOrder[randomIndex];
      this.shuffleOrder[randomIndex] = temp;
    }

    // mantiene il brano attuale come primo elemento
    if (this.currentIndex !== -1) {
      this.shuffleOrder.unshift(this.currentIndex);
      this.shufflePosition = 0;
    } else {
      this.shufflePosition = -1;
    }
  }

  // attiva e disattiva la riproduzione casuale
  toggleShuffle() {
    this.shuffleEnabled = !this.shuffleEnabled;

    if (this.shuffleEnabled) {
      this.createShuffleOrder();
    } else {
      this.shuffleOrder = [];
      this.shufflePosition = -1;
    }

    const btnShuffle = document.querySelector("#btn-shuffle");

    if (btnShuffle) {
      btnShuffle.classList.toggle("active", this.shuffleEnabled);
    }

    console.log("Shuffle:", this.shuffleEnabled);
  }

  // cambia la modalità di ripetizione
  toggleRepeat() {
    if (this.repeatMode === "off") {
      this.repeatMode = "all";
    } else if (this.repeatMode === "all") {
      this.repeatMode = "one";
    } else {
      this.repeatMode = "off";
    }

    const btnRepeat = document.querySelector("#btn-repeat");

    if (btnRepeat) {
      btnRepeat.classList.toggle("active", this.repeatMode !== "off");
      btnRepeat.classList.toggle("repeat-one", this.repeatMode === "one");
    }

    console.log("Modalità Repeat:", this.repeatMode);
  }

  //metodo che collega gli event listener
  _bindEvents() {
    //evento 1 = play/pausa
    if (this.btnToggle) {
      this.btnToggle.addEventListener("click", () => {
        this.togglePlay();
      });
    }
    const btnNext = document.querySelector("#btn-next");

    // evento = bottone avanti
    if (btnNext) {
      btnNext.addEventListener("click", () => {
        console.log("Click su Successivo");
        this.nextTrack();
      });
    }
    // evento = pulsante Precedente
    const btnPrev = document.querySelector("#btn-prev");

    if (btnPrev) {
      btnPrev.addEventListener("click", () => {
        this.previousTrack();
      });
    }

    // evento = pulsante Shuffle
    const btnShuffle = document.querySelector("#btn-shuffle");

    if (btnShuffle) {
      btnShuffle.addEventListener("click", () => {
        this.toggleShuffle();
      });
    }

    // evento = pulsante Repeat
    const btnRepeat = document.querySelector("#btn-repeat");

    if (btnRepeat) {
      btnRepeat.addEventListener("click", () => {
        this.toggleRepeat();
      });
    }

    //evento 2 = click progress bar
    if (this.progressBar) {
      this.progressBar.addEventListener("click", (e) => {
        const barWidth = this.progressBar.clientWidth; // recupero la larghezza della barra in px
        if (barWidth <= 0) return; // se è <=0 interrompo
        this.seek(e.offsetX / barWidth); // calcolo la posizione del click rispetto alla larghezza della barra e la passo a seek()
      });
    }

    //evento 3 = gestione del volume
    if (this.volumeBar) {
      const updateVolume = (e) => {
        const barWidth = this.volumeBar.clientWidth;
        if (barWidth <= 0) return;
        this.setVolume(e.offsetX / barWidth);
      };
      this.volumeBar.addEventListener("click", updateVolume); // modifica il volume al click
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
          this.timeCurrent.textContent = formatTime(current * 1000); //formatto da ms a sec
        }
        if (this.progressFill) {
          const percent = duration > 0 ? (current / duration) * 100 : 0;
          this.progressFill.style.width = `${percent}%`; // aggiorno la larghezza del riempimento con percent
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

      //evento 6 = quando termina la riproduzione
      this.audio.addEventListener("ended", () => {
        // Repeat One
        if (this.repeatMode === "one") {
          this.play(this.currentTrack);
          return;
        }

        // Repeat All
        if (this.repeatMode === "all" && this.trackQueue.length > 0) {
          // passa al brano successivo rispettando Shuffle
          this.nextTrack();
          return;
        }

        // Repeat Off
        this.isPlaying = false;
        if (this.btnToggle) this.btnToggle.textContent = "▶";
        if (this.progressFill) this.progressFill.style.width = "0%";
        if (this.timeCurrent) this.timeCurrent.textContent = "0:00";
        this._updateTrackRows();
      });
    }
  }

  // il metodo play(), riceve come parametro track, oggetto che contiene le informazioni della canzone
  play(track) {
    if (!track || !this.audio) return;

    this.currentTrack = track;
    // aggiorna la posizione del brano nella coda
    const trackIndex = this.trackQueue.findIndex(
      (item) => Number(item.id) === Number(track.id),
    );

    if (trackIndex !== -1) {
      this.currentIndex = trackIndex;
    }
    this.audio.src = track.previewUrl || "";
    this.audio.play().catch((err) => {
      console.error("Errore riproduzione:", err);
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

    // aggiorna lo stato grafico
    this._updateTrackRows();
  }

  //metodo che alterna play/pausa
  togglePlay() {
    if (!this.audio || !this.currentTrack) return;

    if (this.audio.paused) {
      this.audio.play().catch((err) => {
        console.error("Errore ripresa riproduzione:", err);
      });
      this.isPlaying = true;
      if (this.btnToggle) this.btnToggle.textContent = "⏸";
    } else {
      this.audio.pause();
      this.isPlaying = false;
      if (this.btnToggle) this.btnToggle.textContent = "▶";
    }

    this._updateTrackRows();
  }

  // metodo della gestione volume, il valore 'v' rappresenta il volume desiderato
  setVolume(v) {
    const clamped = Math.max(0, Math.min(1, v));
    if (this.audio) this.audio.volume = clamped;
    if (this.volumeFill) this.volumeFill.style.width = `${clamped * 100}%`;
    if (this.volumeIcon) {
      this.volumeIcon.textContent = clamped === 0 ? "🔇" : "🔊";
    }
  }

  // il metodo seek() viene richiamato al click sulla progress bar
  seek(percent) {
    //se almeno una condizione è vera, interrompe
    if (
      !this.audio ||
      !Number.isFinite(this.audio.duration) || // la durata non è un numero finito valido (NaN o ifinity)
      this.audio.duration <= 0
    ) {
      return;
    }
    const clamped = Math.max(0, Math.min(1, percent));
    this.audio.currentTime = this.audio.duration * clamped;
  }

  // evidenzia graficamente il brano in riproduzione
  _updateTrackRows() {
    const rows = document.querySelectorAll(".track-row");
    rows.forEach((row) => {
      const rowTrackId = String(row.dataset.trackId || ""); // recupero l'id del brano associato alla riga e lo converto in stringa

      //verififico che tutte le condizioni siano vere
      const isCurrent =
        this.currentTrack &&
        this.isPlaying &&
        rowTrackId !== "" &&
        rowTrackId === String(this.currentTrack.id);

      // aggiungo la classe is-playing se le condizioni sono vere, altrimenti la rimuovo
      row.classList.toggle("is-playing", Boolean(isCurrent));
    });
  }
}

/* 5. localStorage helpers */

const readArray = (key) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Errore lettura localStorage:", error);
    return [];
  }
};

const getHistory = () => readArray(STORAGE_KEY_HISTORY);

//funzione per aggiungere un brano alla cronologia al click di play
const addToHistory = (track) => {
  const filtered = getHistory().filter(
    (t) => Number(t.id) !== Number(track.id),
  );

  filtered.unshift(track); //per spostare l'ultima ascoltata in alto
  const sliced = filtered.slice(0, MAX_HISTORY); //ne salva solo 12
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(sliced));

  window.dispatchEvent(new CustomEvent("historyUpdated"));
};

const getFavourites = () => readArray(STORAGE_KEY_FAVOURITES);

//definisce se un brano si trova già tra i preferiti
const isFavourite = (trackId) => {
  return getFavourites().some((t) => Number(t.id) === Number(trackId));
};

const toggleFavourite = (track) => {
  const favs = getFavourites();
  const exists = favs.some((t) => Number(t.id) === Number(track.id));

  //lista aggiornata
  const updated = exists
    ? favs.filter((t) => Number(t.id) !== Number(track.id))
    : [track, ...favs];

  localStorage.setItem(STORAGE_KEY_FAVOURITES, JSON.stringify(updated));

  window.dispatchEvent(new CustomEvent("favouritesUpdated"));
};

/* 5b. Componenti riutilizzabili */

const createTrackCard = (track, tracks = null, index = 0) => {
  const card = document.createElement("div");
  card.classList.add("card");
  card.dataset.trackId = track.id;
  card.addEventListener("click", (e) => {
    e.stopPropagation();
    if (window.player) {
      if (tracks) {
        window.player.setQueue(tracks, index);
        window.player.playFromQueue(index);
      } else {
        window.player.play(track);
      }
    }
  });

  const cardImageWrap = document.createElement("div");
  cardImageWrap.classList.add("card-image-wrap");

  const cardImg = document.createElement("img");
  cardImg.classList.add("w-100", "h-100", "object-fit-cover", "d-block");
  cardImg.src = bigArt(track.cover);
  cardImg.alt = track.title;

  cardImageWrap.appendChild(cardImg);

  //button.card-play["▶"]
  const cardPlay = document.createElement("button");
  cardPlay.type = "button";
  cardPlay.classList.add("card-play");
  cardPlay.textContent = "▶";
  cardPlay.addEventListener("click", (e) => {
    e.stopPropagation();
    if (window.player) {
      if (tracks) {
        window.player.setQueue(tracks, index);
        window.player.playFromQueue(index);
      } else {
        window.player.play(track);
      }
    }
  });

  //button.card-fav["♡"]
  const cardFav = document.createElement("button");
  cardFav.type = "button";
  cardFav.classList.add("card-fav");
  cardFav.textContent = "♡";
  cardFav.classList.toggle("is-fav", isFavourite(track.id));

  cardFav.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavourite(track);

    // Aggiorna tutti i cuori legati allo stesso brano nella pagina
    const favourite = isFavourite(track.id);
    const favButtons = document.querySelectorAll(
      `.card[data-track-id="${track.id}"] .card-fav, .track-row[data-track-id="${track.id}"] .track-fav`,
    );
    favButtons.forEach((button) => {
      button.classList.toggle("is-fav", favourite);
    });
  });

  const cardTitle = document.createElement("p");
  cardTitle.classList.add("card-title", "text-truncate");
  cardTitle.textContent = track.title;

  const cardSub = document.createElement("a");
  cardSub.classList.add("card-sub", "text-truncate");
  cardSub.textContent = track.artist;
  cardSub.href = "artist.html?id=" + track.artistId; // al click mi porta all'html dell'artista

  cardSub.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  card.append(cardImageWrap, cardPlay, cardFav, cardTitle, cardSub);
  return card;
};

/* 6. Render sidebar */

const renderSidebar = (activePage) => {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  sidebar.replaceChildren();

  const brand = document.createElement("div");
  brand.classList.add(
    "brand",
    "d-flex",
    "align-items-center",
    "gap-2",
    "px-2",
    "pb-4",
    "fs-5",
    "fw-bold",
  );

  const brandMark = document.createElement("div");
  brandMark.classList.add("brand-mark");
  // brandMark.textContent = "E";

  const brandLogo = document.createElement("img");
  brandLogo.src = "assets/img/epitunes-logo.svg";
  brandMark.appendChild(brandLogo);

  const brandText = document.createElement("span");
  brandText.classList.add("brand-text");
  brandText.textContent = "EpiTunes";

  brand.append(brandMark, brandText);

  const sidebarNav = document.createElement("nav");
  sidebarNav.classList.add(
    "sidebar-nav",
    "d-flex",
    "flex-column",
    "gap-1",
    "mb-4",
  );

  const homeLink = document.createElement("a");
  homeLink.href = "index.html";
  homeLink.dataset.page = "home";
  homeLink.classList.add("d-flex", "align-items-center", "fw-semibold");
  homeLink.classList.toggle("active", activePage === "home");

  const homeIcon = document.createElement("span");
  homeIcon.classList.add("ico");
  homeIcon.textContent = "🏠";

  const homeText = document.createElement("span");
  homeText.textContent = "Home";

  homeLink.append(homeIcon, homeText);

  const searchLink = document.createElement("a");
  searchLink.href = "search.html";
  searchLink.dataset.page = "search";
  searchLink.classList.add("d-flex", "align-items-center", "fw-semibold");
  searchLink.classList.toggle("active", activePage === "search");

  const searchIcon = document.createElement("span");
  searchIcon.classList.add("ico");
  searchIcon.textContent = "🔍";

  const searchText = document.createElement("span");
  searchText.textContent = "Cerca";

  searchLink.append(searchIcon, searchText);

  sidebarNav.append(homeLink, searchLink);

  const sidebarTitle = document.createElement("p");
  sidebarTitle.classList.add("sidebar-section-title");
  sidebarTitle.textContent = "I tuoi preferiti";

  const sidebarFavs = document.createElement("ul");
  sidebarFavs.classList.add("sidebar-list");
  sidebarFavs.id = "sidebar-favs";
  sidebar.append(brand, sidebarNav, sidebarTitle, sidebarFavs);
  renderSidebarFavourites();
};

// titoli dei preferiti
const renderSidebarFavourites = () => {
  const sidebarFavs = document.querySelector("#sidebar-favs");

  if (!sidebarFavs) return;

  sidebarFavs.replaceChildren();

  const tracks = getFavourites();

  tracks.forEach((track, index) => {
    const list = document.createElement("li");
    const titleFavs = document.createElement("a");

    //al click ti riporta alla sezione preferiti
    titleFavs.textContent = track.title;
    titleFavs.href = "./index.html#favourites-row";

    titleFavs.addEventListener("click", (e) => {
      //play al click
      if (window.player) {
        window.player.setQueue(tracks, index);
        window.player.playFromQueue(index);
      }
    });

    list.append(titleFavs);
    sidebarFavs.append(list);
  });
};

/* pulsanti avanti e indietro tra le pagine */
const back = document.querySelector("#back");
const forward = document.querySelector("#forward");

if (back) {
  back.addEventListener("click", () => {
    window.history.back();
  });
}

if (forward) {
  forward.addEventListener("click", () => {
    window.history.forward();
  });
}

/* 7. Inizializzazione */

// barra di ricerca per mobile
const initTopbarSearch = (activePage) => {
  const topbarSearch = document.querySelector("#topbar-search");
  if (!topbarSearch) return;

  if (activePage === "search") {
    topbarSearch.value = localStorage.getItem(STORAGE_KEY_LAST_SEARCH) || "";
    return;
  }

  const goToSearch = (term) => {
    if (!term) return;
    localStorage.setItem(STORAGE_KEY_LAST_SEARCH, term);
    window.location.href = "search.html";
  };

  const debouncedGoToSearch = debounce(goToSearch, 400);

  topbarSearch.addEventListener("input", (e) => {
    debouncedGoToSearch(e.target.value.trim());
  });
};

const initPage = (activePage) => {
  renderSidebar(activePage);
  initTopbarSearch(activePage);

  window.addEventListener("favouritesUpdated", renderSidebarFavourites); //intercetto l'evento e lo renderizzo

  const player = new Player();
  player.mount();
  window.player = player;
  return player;
};
