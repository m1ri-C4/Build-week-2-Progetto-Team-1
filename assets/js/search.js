/* ============================================================
   search.js — ricerca con debounce
   ============================================================

   COSA DEVI FARE
   1) initPage("search")
   2) Recupera l'ultima query da localStorage (STORAGE_KEY_LAST_SEARCH).
      Se presente, popola l'input e lancia la ricerca.
   3) Aggancia l'evento "input" all'input #search-input con debounce 400ms.
   4) doSearch(term):
      - se term è vuoto -> nascondi i 3 row e svuota i grid
      - altrimenti fetch in PARALLELO (Promise.all):
          - tracks   = search?term=...&entity=song&limit=12
          - albums   = search?term=...&entity=album&limit=8
          - artists  = search?term=...&entity=musicArtist&limit=8
      - mostra ciascuna sezione solo se i risultati sono > 0
      - salva l'ultima query in localStorage
   5) Per ogni risultato crea una card:
      - track  -> click = player.play(track)
      - album  -> click = window.location.href = "album.html?id=" + albumId
      - artist -> click = window.location.href = "artist.html?id=" + artistId
*/

const player = initPage("search");

const input = document.querySelector("#search-input");
const error = document.querySelector("#error");
const rowTracks = document.querySelector("#row-tracks");
const rowAlbums = document.querySelector("#row-albums");
const rowArtists = document.querySelector("#row-artists");
const gridTracks = document.querySelector("#grid-tracks");
const gridAlbums = document.querySelector("#grid-albums");
const gridArtists = document.querySelector("#grid-artists");

const renderAlbumCard = (album) => {
  const card = document.createElement("div");
  card.classList.add("card");
  card.dataset.albumId = album.id;
  //indirizza all'HTML album al click
  card.addEventListener("click", () => {
    window.location.href = "album.html?id=" + album.id;
  });

  const cardImageWrap = document.createElement("div");
  cardImageWrap.classList.add("card-image-wrap");

  const cardImg = document.createElement("img");
  cardImg.src = bigArt(album.cover);
  cardImg.alt = album.title;

  cardImageWrap.appendChild(cardImg);

  const cardTitle = document.createElement("p");
  cardTitle.classList.add("card-title");
  cardTitle.textContent = album.title;

  const cardSub = document.createElement("p");
  cardSub.classList.add("card-sub");
  cardSub.textContent = album.artist;

  card.appendChild(cardImageWrap);
  card.appendChild(cardTitle);
  card.appendChild(cardSub);

  return card;
};

const renderArtistCard = (artist) => {
  const card = document.createElement("div");
  card.classList.add("card");
  card.dataset.artistId = artist.id;
  //indirizza all'HTML artist al click
  card.addEventListener("click", () => {
    window.location.href = "artist.html?id=" + artist.id;
  });

  const cardImageWrap = document.createElement("div");
  cardImageWrap.classList.add("card-image-wrap", "round");

  cardImageWrap.textContent = artist.name[0];

  const cardTitle = document.createElement("p");
  cardTitle.classList.add("card-title");
  cardTitle.textContent = artist.name;

  const cardSub = document.createElement("p");
  cardSub.classList.add("card-sub");
  cardSub.textContent = artist.genre;

  card.appendChild(cardImageWrap);
  card.appendChild(cardTitle);
  card.appendChild(cardSub);

  return card;
};

const doSearch = async (term) => {
  if (!term) {
    error.textContent = "";

    rowTracks.hidden = true; //nasconde la sezione
    rowAlbums.hidden = true;
    rowArtists.hidden = true;

    gridTracks.replaceChildren(); // elimina le card generate dalla ricerca precedente
    gridAlbums.replaceChildren();
    gridArtists.replaceChildren();

    return; // interrompe
  }

  try {
    const [tracks, albums, artists] = await Promise.all([
      fetchJSON(
        `https://itunes.apple.com/search?term=${term}&entity=song&limit=12`,
      ),
      fetchJSON(
        `https://itunes.apple.com/search?term=${term}&entity=album&limit=8`,
      ),
      fetchJSON(
        `https://itunes.apple.com/search?term=${term}&entity=musicArtist&limit=8`,
      ),
    ]);

    //richiamo le classi da common.js
    const trackList = tracks.results.map((raw) => new Track(raw));
    const albumList = albums.results.map((raw) => new Album(raw));
    const artistList = artists.results.map((raw) => new Artist(raw));

    // messaggio di errore
    if (
      trackList.length === 0 &&
      albumList.length === 0 &&
      artistList.length === 0
    ) {
      error.textContent = "Nessun risultato, prova con un altro nome";
    } else {
      error.textContent = "";
    }

    rowTracks.hidden = tracks.results.length === 0 ? true : false; // 0 = true (nasconde), =>1 = false (mostra)
    rowAlbums.hidden = albums.results.length === 0 ? true : false;
    rowArtists.hidden = artists.results.length === 0 ? true : false;

    gridTracks.replaceChildren(...trackList.map(createTrackCard)); // genera una card per ogni risultato con map(), con lo spread operetor prendo singolarmente le card e sostituisco le precedenti con le nuove con replace children
    gridAlbums.replaceChildren(...albumList.map(renderAlbumCard));
    gridArtists.replaceChildren(...artistList.map(renderArtistCard));

    localStorage.setItem(STORAGE_KEY_LAST_SEARCH, term); //salvo ultima ricerca
  } catch (error) {
    console.error("Errore durante la ricerca:", error);
  }
};

const debouncedSearch = debounce(doSearch, 400);

input.addEventListener("input", (event) => {
  debouncedSearch(event.target.value.trim());
});

// recupero ultima ricerca
const lastQuery = localStorage.getItem(STORAGE_KEY_LAST_SEARCH);

if (lastQuery) {
  input.value = lastQuery;
  doSearch(lastQuery);
}