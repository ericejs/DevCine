const API_KEY = "d2dcb2c7a7ad97fc705e1ea9862d3449";
const API_BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const movieGrid = document.querySelector("#movie-grid");
const statusMessage = document.querySelector("#status-message");
const moviesTitle = document.querySelector("#movies-title");
const searchForm = document.querySelector(".search-form");
const searchInput = document.querySelector("#search-input");
const themeToggle = document.querySelector(".theme-toggle");
const categoryButtons = document.querySelectorAll("[data-category]");

const categoryLabels = {
  popular: "Filmes populares",
  now_playing: "Em cartaz",
  top_rated: "Mais bem avaliados",
};

let activeRequest;

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("is-error", isError);
}

function createMovieCard(movie) {
  const card = document.createElement("article");
  card.className = "movie-card";

  if (movie.poster_path) {
    const poster = document.createElement("img");
    poster.className = "movie-poster";
    poster.src = `${IMAGE_BASE_URL}${movie.poster_path}`;
    poster.alt = `Pôster do filme ${movie.title}`;
    poster.loading = "lazy";
    poster.onerror = () => {
      const placeholder = document.createElement("div");
      placeholder.className = "poster-placeholder";
      placeholder.textContent = "Imagem indisponível";
      poster.replaceWith(placeholder);
    };
    card.append(poster);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "poster-placeholder";
    placeholder.textContent = "Imagem indisponível";
    card.append(placeholder);
  }

  const info = document.createElement("div");
  info.className = "movie-info";

  const titleRow = document.createElement("div");
  titleRow.className = "movie-title-row";

  const title = document.createElement("h3");
  title.className = "movie-title";
  title.textContent = movie.title || "Título indisponível";
  titleRow.append(title);

  if (Number.isFinite(movie.vote_average) && movie.vote_average > 0) {
    const rating = document.createElement("span");
    rating.className = "movie-rating";
    rating.textContent = `★ ${movie.vote_average.toFixed(1)}`;
    rating.setAttribute("aria-label", `Nota ${movie.vote_average.toFixed(1)} de 10`);
    titleRow.append(rating);
  }

  const overview = document.createElement("p");
  overview.className = "movie-overview";
  overview.textContent = movie.overview || "Sinopse não disponível.";

  info.append(titleRow, overview);
  card.append(info);
  return card;
}

async function loadMovies(endpoint, title, query = "") {
  if (activeRequest) {
    activeRequest.abort();
  }

  activeRequest = new AbortController();
  moviesTitle.textContent = title;
  movieGrid.replaceChildren();
  setStatus("Carregando filmes...");

  const params = new URLSearchParams({
    api_key: API_KEY,
    language: "pt-BR",
    page: "1",
  });

  if (query) {
    params.set("query", query);
    params.set("include_adult", "false");
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}?${params}`, {
      signal: activeRequest.signal,
    });

    if (!response.ok) {
      throw new Error(`A API respondeu com status ${response.status}.`);
    }

    const data = await response.json();
    if (!Array.isArray(data.results)) {
      throw new Error("A resposta da API não contém uma lista de filmes válida.");
    }

    if (data.results.length === 0) {
      setStatus(query ? "Nenhum filme encontrado para essa busca." : "Nenhum filme disponível.");
      return;
    }

    const cards = data.results.map(createMovieCard);
    movieGrid.append(...cards);
    setStatus("");
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }

    console.error("Não foi possível carregar os filmes:", error);
    setStatus(
      "Não foi possível carregar os filmes. Verifique sua conexão e tente novamente.",
      true,
    );
  }
}

function selectCategory(button) {
  categoryButtons.forEach((item) => {
    const isActive = item === button;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-pressed", String(isActive));
  });
}

categoryButtons.forEach((button) => {
  button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
  button.addEventListener("click", () => {
    const category = button.dataset.category;
    selectCategory(button);
    searchInput.value = "";
    loadMovies(`/movie/${category}`, categoryLabels[category]);
  });
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();

  if (!query) {
    searchInput.focus();
    return;
  }

  categoryButtons.forEach((button) => {
    button.classList.remove("is-active");
    button.setAttribute("aria-pressed", "false");
  });
  loadMovies("/search/movie", `Resultados para “${query}”`, query);
});

function setTheme(isDark) {
  document.body.classList.toggle("dark-theme", isDark);
  themeToggle.setAttribute("aria-label", isDark ? "Ativar tema claro" : "Ativar tema escuro");
  localStorage.setItem("cine-mundo-theme", isDark ? "dark" : "light");
}

const savedTheme = localStorage.getItem("cine-mundo-theme");
setTheme(savedTheme === "dark");

themeToggle.addEventListener("click", () => {
  setTheme(!document.body.classList.contains("dark-theme"));
});

loadMovies("/movie/popular", categoryLabels.popular);