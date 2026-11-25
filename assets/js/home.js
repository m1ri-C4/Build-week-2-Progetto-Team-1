// Inizializza la pagina (monta sidebar e player)
const player = initPage("home");

// Seleziona il contenitore principale della Home
const home = document.querySelector(".home");

/*
  renderRow(rowTitle, tracks)
  Crea una <section class="row"> con titolo <h2> e griglia e card
*/
const renderRow = (rowTitle, tracks) => {
  // Esce se manca il contenitore .home o se non ci sono brani
  if (!home || !Array.isArray(tracks) || tracks.length === 0) {
    return;
  }

  // Crea la sezione della riga
  const section = document.createElement("section");
  section.classList.add("row");

  // Crea il titolo della sezione
  const heading = document.createElement("h2");
  heading.textContent = rowTitle;

  // Crea il contenitore a griglia per le card
  const grid = document.createElement("div");
  grid.classList.add("grid");

  // Crea una card per ogni brano e la aggiunge alla griglia
  tracks.forEach((track) => {
    const card = createTrackCard(track);
    grid.appendChild(card);
  });

  // Inserisce titolo e griglia dentro la sezione
  section.appendChild(heading);
  section.appendChild(grid);

  // Aggiunge la sezione completa dentro .home
  home.appendChild(section);
};

/*
  loadHome()
*/
const loadHome = async () => {
  try {
    // Esegue le tre richieste iTunes in parallelo
    const [popRes, rockRes, hitsRes] = await Promise.all([
      fetchJSON(
        "https://itunes.apple.com/search?term=pop&entity=song&limit=12",
      ),
      fetchJSON(
        "https://itunes.apple.com/search?term=rock&entity=song&limit=12",
      ),
      fetchJSON(
        "https://itunes.apple.com/search?term=hits+pop&entity=song&limit=12",
      ),
    ]);

    // Converte i risultati grezzi in istanze di Track
    const popTracks = (popRes.results || []).map((item) => new Track(item));
    const rockTracks = (rockRes.results || []).map((item) => new Track(item));
    const hitsTracks = (hitsRes.results || []).map((item) => new Track(item));

    // Recupera cronologia e preferiti salvati in localStorage
    const history = getHistory();
    const favourites = getFavourites();

    // Mostra cronologia e preferiti solo se non sono vuoti
    if (history.length > 0) {
      renderRow("Riprodotti di recente", history);
    }

    if (favourites.length > 0) {
      renderRow("I tuoi preferiti", favourites);
    }

    // Mostra le tre righe di suggerimenti
    renderRow("Suggerimenti pop", popTracks);
    renderRow("Suggerimenti rock", rockTracks);
    renderRow("Suggerimenti hits", hitsTracks);
  } catch (error) {
    console.error("Errore durante il caricamento della Home:", error);
  }
};

// Avvia effettivamente il caricamento della Home
loadHome();
getHistory();