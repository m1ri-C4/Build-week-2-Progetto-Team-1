/* ============================================================
   search.js — ricerca con debounce
   ============================================================
*/

const player = initPage("search");

const input = document.querySelector("#search-input");
const topBarInput = document.querySelector("#topbar-search");
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
  cardImg.classList.add("w-100", "h-100", "object-fit-cover", "d-block");
  cardImg.src = bigArt(album.cover);
  cardImg.alt = album.title;

  cardImageWrap.appendChild(cardImg);

  const cardTitle = document.createElement("p");
  cardTitle.classList.add("card-title", "text-truncate");
  cardTitle.textContent = album.title;

  const cardSub = document.createElement("p");
  cardSub.classList.add("card-sub", "text-truncate");
  cardSub.textContent = album.artist;

  card.appendChild(cardImageWrap);
  card.appendChild(cardTitle);
  card.appendChild(cardSub);

  return card;
};

const renderArtistCard = async (artist) => {
  const card = document.createElement("div");
  card.classList.add("card");
  card.dataset.artistId = artist.id;
  //indirizza all'HTML artist al click
  card.addEventListener("click", () => {
    window.location.href = "artist.html?id=" + artist.id;
  });

  const cover = document.createElement("div");
  cover.classList.add("card-image-wrap", "round");

  // prendo l'immagine della copertina del primo brano
  const data = await fetchJSON(
    `https://itunes.apple.com/lookup?id=${artist.id}&entity=song&limit=1`, // limit=1: richiedo un solo brano
  );
  const track = data.results[1]; // contiene il primo brano

  const img = document.createElement("img");
  img.classList.add("w-100", "h-100", "object-fit-cover", "d-block");
  img.src = bigArt(track?.artworkUrl100);
  img.alt = artist.name;

  cover.appendChild(img);

  const cardTitle = document.createElement("p");
  cardTitle.classList.add("card-title");
  cardTitle.textContent = artist.name;

  const cardSub = document.createElement("p");
  cardSub.classList.add("card-sub", "text-truncate");
  cardSub.textContent = artist.genre;

  card.appendChild(cover);
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

    // genero una card per ogni brano trovato con map()
    // track = singolo brano, index = posizione del brano nella lista
    gridTracks.replaceChildren(
      ...trackList.map(
        (
          track,
          index, //scorre tutti i brani trovati e crea una card per ciascuno (recupera il brano corrente e la sua posizione)
        ) =>
          // creo la card passando anche tutta la lista e l'indice
          // così il player può gestire la coda dei brani della ricerca
          createTrackCard(track, trackList, index), //rea la card e passa al player le informazioni necessarie per la coda.
      ),
    );
    gridAlbums.replaceChildren(...albumList.map(renderAlbumCard)); //distribuisce le card create come singoli elementi. ostituisce le card della ricerca precedente con quelle nuove.

    const artistCards = await Promise.all(artistList.map(renderArtistCard)); //uso promise.all perchè il render è una funzione asincrona e map() restituisce un array di promise
    gridArtists.replaceChildren(...artistCards);

    localStorage.setItem(STORAGE_KEY_LAST_SEARCH, term); //salvo ultima ricerca
  } catch (error) {
    console.error("Errore durante la ricerca:", error);
  }
};

const debouncedSearch = debounce(doSearch, 400);

input.addEventListener("input", (event) => {
  debouncedSearch(event.target.value.trim());
});

topBarInput.addEventListener("input", (event) => {
  input.value = event.target.value;
  debouncedSearch(event.target.value.trim());
});

// recupero ultima ricerca
const lastQuery = localStorage.getItem(STORAGE_KEY_LAST_SEARCH);

if (lastQuery) {
  input.value = lastQuery;
  doSearch(lastQuery);
}
