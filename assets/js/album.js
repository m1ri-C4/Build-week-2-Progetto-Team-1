/* ============================================================
   album.js — pagina dettaglio album
   ============================================================
*/

const player = initPage("home");

const albumHero = document.querySelector("#album-hero");
const tracklist = document.querySelector("#tracklist");

const params = new URLSearchParams(window.location.search); //legge i parametri dell'URL e recupera l'id
const albumId = params.get("id"); // recupera il valore dell'id

const renderAlbumHero = (album, tracks) => {
  const cover = document.createElement("div");
  cover.classList.add("album-cover");

  const img = document.createElement("img");
  img.src = bigArt(album.cover);
  img.alt = album.title;

  cover.appendChild(img);

  const info = document.createElement("div");
  info.classList.add("hero-meta");

  const p = document.createElement("p");
  p.textContent = "ALBUM";
  p.classList.add("hero-kicker");

  const albumName = document.createElement("h1");
  albumName.textContent = album.title;
  albumName.classList.add("hero-title");

  //sotto riga
  const details = document.createElement("p");
  const year = new Date(album.releaseDate).getFullYear(); // formatto la data
  const totalDuration = tracks.reduce((acc, track) => {
    // sommo la durata di tutti i brani
    return acc + track.durationMs;
  }, 0);
  details.textContent = `${album.artist} · ${year}  · ${album.trackCount} brani · ${formatTime(totalDuration)}`;
  details.classList.add("hero-sub");

  info.append(p, albumName, details);
  albumHero.append(cover, info);

  const actions = document.createElement("div");
  actions.classList.add("hero-actions");

  const playButton = document.createElement("button");
  playButton.classList.add("btn-play-big");
  playButton.textContent = "▶";

  playButton.addEventListener("click", () => {
    if (tracks.length > 0) {
      player.playFromQueue(0);
    }
  });

  actions.appendChild(playButton);
  albumHero.after(actions);
};

const rendertracklist = (tracks) => {
  tracklist.replaceChildren();

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
      player.playFromQueue(index);
    });

    tracklist.append(row);
    row.append(num, title, time, fav);
  });
};

const loadAlbum = async () => {
  if (!albumId) {
    albumHero.textContent = "Nessun album trovato";
    return;
  }

  try {
    const data = await fetchJSON(
      `https://itunes.apple.com/lookup?id=${albumId}&entity=song`,
    );

    if (data.results.length === 0) {
      albumHero.textContent = "Album non trovato";
      return;
    }

    const album = new Album(data.results[0]); //prendo solo il primo oggetto dell'array e creo un istanza della classe Album
    const tracks = data.results.slice(1).map((raw) => new Track(raw)); // prendo tutti gli eleementi dell'indice 1 in poi, trasformo ogni brano in un istanza della classe Track
    // Creo la coda dei brani dell'album
    player.setQueue(tracks, 0);

    //richiamo i render
    renderAlbumHero(album, tracks);
    rendertracklist(tracks);
  } catch (error) {
    console.error("Errore durante il caricamento dell'album:", error);
  }
};

loadAlbum();
