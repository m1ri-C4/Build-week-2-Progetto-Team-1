/* ============================================================
   artist.js — pagina dettaglio artista
   ============================================================

   COSA DEVI FARE
   1) initPage("home")
   2) Leggi l'id dell'artista dalla query string (URLSearchParams).
   3) Se manca l'id -> messaggio "Artista non trovato" e stop.
   4) fetch /lookup?id=ID&entity=song&limit=15
      - results[0] è l'artist
      - results[1..] sono le top track
   5) Costruisci #artist-hero:
      - kicker "ARTISTA"
      - nome artista grande
      - genere (primaryGenreName) + numero ascoltatori (random, es. Math.random() * 5_000_000)
      - button "Play" -> player.play(prima track)
   6) Costruisci #top-tracks come tracklist (uguale a album).
*/

const player = initPage("home");

const artistHero = document.querySelector("#artist-hero");
const topTracks = document.querySelector("#top-tracks");

const params = new URLSearchParams(window.location.search); //legge i parametri dell'URL e recupera l'id
const artistId = params.get("id"); // recupera il valore dell'id

const renderArtistHero = (artist, tracks) => {
  const img = document.createElement("img");
  // img.textContent =

  const info = document.createElement("div");
  info.classList.add('hero-meta');

  const p = document.createElement("p");
  p.textContent = 'ARTISTA'
  p.classList.add('hero-kicker');

  const artistName = document.createElement("h1");
  artistName.textContent = artist.name;

  const details = document.createElement("p")
  details.textContent = artist.genre

   info.appendChild(p, artistName, details);
   artistHero.appendChild(img);
   artistHero.appendChild(info);

  tracks.forEach((track) => {
    const row = document.createElement("div");

    row.classList.add("track-row");
    row.dataset.trackId = track.id;

    // Creazione degli elementi interni della riga

    row.addEventListener("click", () => {
      player.play(track);
    });

    topTracks.appendChild(row);
  });
};

const loadArtist = async () => {
  if (!artistId) {
    artistHero.textContent = "Nessun artista trovato";
    return;
  }

  try {
    const data = await fetchJSON(
      `https://itunes.apple.com//lookup?id=${artistId}&entity=song&limit=15?`,
    );

    if (data.results.length === 0) {
      artistHero.textContent = "Artista non trovato";
      return;
    }

    const artist = new Artist(data.results[0]); //prendo solo il primo oggetto dell'array e creo un istanza della classe Artist
    const tracks = data.results.slice(1).map((raw) => new Track(raw)); // prendo tutti gli eleementi dell'indice 1 in poi, trasformo ogni brano in un istanza della classe Track
   

  } catch (error) {
    console.error("Errore durante il caricamento dell'artista:", error);
  }
};

loadArtist();