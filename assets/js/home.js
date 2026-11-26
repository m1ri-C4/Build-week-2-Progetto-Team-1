const player = initPage("home");
const home = document.querySelector(".home");

const renderRow = (rowTitle, tracks, rowId = null) => {
  if (!home || !Array.isArray(tracks) || tracks.length === 0) {
    return;
  }

  const section = document.createElement("section");
  section.classList.add("row");

  if (rowId) {
    section.id = rowId;
  }

  const heading = document.createElement("h2");
  heading.textContent = rowTitle;

  const grid = document.createElement("div");
  grid.classList.add("grid");

  tracks.forEach((track, index) => {
    const card = createTrackCard(track, tracks, index);
    grid.appendChild(card);
  });

  section.appendChild(heading);
  section.appendChild(grid);

  if (rowId === "favourites-row") {
    home.prepend(section);
  } else {
    home.appendChild(section);
  }
};

const renderFavouritesRow = () => {
  const oldRow = document.querySelector("#favourites-row");
  if (oldRow) {
    oldRow.remove();
  }

  const favourites = getFavourites();
  if (favourites.length > 0) {
    renderRow("I tuoi preferiti", favourites, "favourites-row");
  }
};

const renderHistoryRow = () => {
  const oldRow = document.querySelector("#history-row");
  if (oldRow) {
    oldRow.remove();
  }

  const history = getHistory();
  if (history.length > 0) {
    renderRow("Riprodotti di recente", history, "history-row");
  }
};

const loadHome = async () => {
  try {
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

    const popTracks = (popRes.results || []).map((item) => new Track(item));
    const rockTracks = (rockRes.results || []).map((item) => new Track(item));
    const hitsTracks = (hitsRes.results || []).map((item) => new Track(item));

    renderHistoryRow();
    renderFavouritesRow();

    renderRow("Suggerimenti pop", popTracks);
    renderRow("Suggerimenti rock", rockTracks);
    renderRow("Suggerimenti hits", hitsTracks);
  } catch (error) {
    console.error("Errore durante il caricamento della Home:", error);
  }
};

window.addEventListener("favouritesUpdated", renderFavouritesRow);
loadHome();
