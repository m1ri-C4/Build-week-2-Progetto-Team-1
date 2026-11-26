/* ============================================================
   artist.js — pagina dettaglio artista
   ============================================================
*/

const player = initPage("home");

const artistHero = document.querySelector("#artist-hero");
const topTracks = document.querySelector("#top-tracks");

const params = new URLSearchParams(window.location.search); //legge i parametri dell'URL e recupera l'id
const artistId = params.get("id"); // recupera il valore dell'id

const renderArtistHero = (artist, tracks) => {
  const cover = document.createElement("div");
  cover.classList.add("album-cover");

  const img = document.createElement("img");
  img.src = bigArt(tracks[0]?.cover);
  img.alt = artist.name;

  cover.appendChild(img);

  const info = document.createElement("div");
  info.classList.add("hero-meta");

  const p = document.createElement("p");
  p.textContent = "ARTISTA";
  p.classList.add("hero-kicker");

  const artistName = document.createElement("h1");
  artistName.textContent = artist.name;
  artistName.classList.add("hero-title");

  const details = document.createElement("p");
  const listeners = Math.floor(Math.random() * 5_000_000);

  details.textContent = `${artist.genre ?? "Genere sconosciuto"} · ${listeners.toLocaleString("it-IT")} ascoltatori mensili`; //formatto il numero secondo le convezioni linguistiche italiane
  details.classList.add("hero-sub");

  info.append(p, artistName, details);
  artistHero.append(cover, info);

  const actions = document.createElement("div");
  actions.classList.add("hero-actions");

  const playButton = document.createElement("button");
  playButton.classList.add("btn-play-big");
  playButton.textContent = "▶";

  playButton.addEventListener("click", () => {
    if (tracks.length > 0) {
      player.setQueue(tracks, 0); // imposto la coda con tutti i brani dell'artista
      player.playFromQueue(0); // avvio il primo brano della coda
    }
  });

  actions.appendChild(playButton);
  artistHero.after(actions);
};

const renderTopTracks = (tracks) => {
  topTracks.replaceChildren();

  const pop = document.createElement("h2");
  pop.textContent = "Popolari";
  topTracks.appendChild(pop);

  tracks.forEach((track, index) => {
    // index per numerare i brani utilizzando index + 1
    const row = document.createElement("div");
    row.classList.add("track-row");
    row.dataset.trackId = track.id;

    const num = document.createElement("p");
    num.textContent = index + 1;
    num.classList.add("track-num");

    const title = document.createElement("h3");
    title.textContent = track.title;
    title.classList.add("track-title");

    const time = document.createElement("p");
    time.textContent = formatTime(track.durationMs);
    time.classList.add("track-time");

    const fav = document.createElement("button");
    fav.classList.add("track-fav");
    fav.textContent = "♡";
    fav.classList.toggle("is-fav", isFavourite(track.id));
    fav.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavourite(track);
      fav.classList.toggle("is-fav", isFavourite(track.id));
    });

    row.addEventListener("click", () => {
      player.setQueue(tracks, index); // imposto la coda e la posizione del brano selezionato
      player.playFromQueue(index); // avvio il brano selezionato
    });

    topTracks.append(row);
    row.append(num, title, time, fav);
  });
};

const loadArtist = async () => {
  if (!artistId) {
    artistHero.textContent = "Nessun artista trovato";
    return;
  }

  try {
    const data = await fetchJSON(
      `https://itunes.apple.com/lookup?id=${artistId}&entity=song&limit=15?`,
    );

    if (data.results.length === 0) {
      artistHero.textContent = "Artista non trovato";
      return;
    }

    const artist = new Artist(data.results[0]); //prendo solo il primo oggetto dell'array e creo un istanza della classe Artist
    const tracks = data.results.slice(1).map((raw) => new Track(raw)); // prendo tutti gli eleementi dell'indice 1 in poi, trasformo ogni brano in un istanza della classe Track

    //richiamo i render
    renderArtistHero(artist, tracks);
    renderTopTracks(tracks);
  } catch (error) {
    console.error("Errore durante il caricamento dell'artista:", error);
  }
};

loadArtist();
