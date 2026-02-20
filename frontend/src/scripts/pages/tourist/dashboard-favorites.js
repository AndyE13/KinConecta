const TouristFavoritesApp = (() => {
  const state = {
    activeTab: "guides",
    guides: [],
    experiences: [],
  };

  const fallback = {
    guides: [
      {
        id: "g_101",
        title: "Ana García",
        location: "Oaxaca, México",
        description: "Especialista en rutas de senderismo y cultura local.",
        priceLabel: "$420 MXN / hora",
        tags: ["Montaña", "Historia"],
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80",
      },
      {
        id: "g_102",
        title: "Luis Martínez",
        location: "CDMX",
        description: "Fotografía urbana, arquitectura y gastronomía tradicional.",
        priceLabel: "$500 MXN / hora",
        tags: ["Foto", "Arquitectura"],
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80",
      },
    ],
    experiences: [
      {
        id: "e_201",
        title: "Ruta del Tequila",
        location: "Guadalajara, Jalisco",
        description: "Experiencia cultural con degustaciones y recorrido histórico.",
        priceLabel: "$890 MXN / persona",
        tags: ["Cultura", "Gastronomía"],
        image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=900&q=80",
      },
    ],
  };

  const dom = {
    tabs: [],
    countGuides: null,
    countExperiences: null,
    cards: null,
    searchInput: null,
    btnChat: null,
    btnNewTrip: null,
  };

  const loadingMarkup = (label, compact = false) => `
    <div class="guide-loading ${compact ? "guide-loading--compact" : ""}" role="status" aria-live="polite" aria-busy="true">
      <span class="guide-loading__spinner" aria-hidden="true"></span>
      <span>${label}</span>
    </div>
  `;

  function renderLoadingState() {
    if (dom.cards) {
      dom.cards.innerHTML = loadingMarkup("Cargando favoritos...");
    }
  }

  function mapFavorite(raw) {
    return {
      id: raw.id,
      title: raw.title || raw.name || "Favorito",
      location: raw.location || "México",
      description: raw.description || "Sin descripción.",
      priceLabel: raw.priceLabel || raw.priceText || "$0 MXN",
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      image:
        raw.imageUrl ||
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80",
    };
  }

  async function hydrateFromApi() {
    if (!window.KCTouristApi) {
      state.guides = fallback.guides.slice();
      state.experiences = fallback.experiences.slice();
      return;
    }

    try {
      const [guidesRes, expRes] = await Promise.all([
        window.KCTouristApi.favorites.listGuides({ page: 0, size: 24 }),
        window.KCTouristApi.favorites.listExperiences({ page: 0, size: 24 }),
      ]);

      const guides = guidesRes?.data?.items || guidesRes?.data || [];
      const experiences = expRes?.data?.items || expRes?.data || [];
      state.guides = Array.isArray(guides) ? guides.map(mapFavorite) : fallback.guides.slice();
      state.experiences = Array.isArray(experiences)
        ? experiences.map(mapFavorite)
        : fallback.experiences.slice();
    } catch (error) {
      console.warn("Favorites API fallback enabled:", error);
      state.guides = fallback.guides.slice();
      state.experiences = fallback.experiences.slice();
    }
  }

  function getActiveCollection() {
    return state.activeTab === "guides" ? state.guides : state.experiences;
  }

  function applySearch(collection) {
    const query = dom.searchInput?.value?.trim().toLowerCase() || "";
    if (!query) return collection;

    return collection.filter((item) => {
      return (
        item.title.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }

  function updateCounters() {
    if (dom.countGuides) dom.countGuides.textContent = String(state.guides.length);
    if (dom.countExperiences) dom.countExperiences.textContent = String(state.experiences.length);
  }

  function renderCards() {
    if (!dom.cards) return;
    const rows = applySearch(getActiveCollection());
    dom.cards.innerHTML = "";

    if (!rows.length) {
      dom.cards.innerHTML = `
        <div class="guide-loading guide-loading--compact" role="status" aria-live="polite" aria-busy="false">
          <span>No tienes favoritos que coincidan con la búsqueda.</span>
        </div>
      `;
      return;
    }

    rows.forEach((item) => {
      const card = document.createElement("article");
      card.className = "favorite-card";
      card.innerHTML = `
        <div class="favorite-card__media" style="background-image:url('${item.image}');">
          <button class="favorite-card__remove" type="button" data-remove-id="${item.id}" aria-label="Quitar de favoritos">
            <span class="material-symbols-outlined">favorite</span>
          </button>
          <div class="favorite-card__tags">
            ${item.tags.map((tag) => `<span class="favorite-card__tag">${tag}</span>`).join("")}
          </div>
        </div>
        <div class="favorite-card__body">
          <div class="favorite-card__header">
            <h3 class="favorite-card__title">${item.title}</h3>
            <p class="favorite-card__price">${item.priceLabel}</p>
          </div>
          <p class="favorite-card__location">
            <span class="material-symbols-outlined">location_on</span>
            ${item.location}
          </p>
          <p class="favorite-card__description">${item.description}</p>
        </div>
      `;

      card.querySelector("[data-remove-id]")?.addEventListener("click", async (event) => {
        event.stopPropagation();
        const id = event.currentTarget.getAttribute("data-remove-id");
        try {
          if (window.KCTouristApi) {
            if (state.activeTab === "guides") {
              await window.KCTouristApi.favorites.removeGuide(id);
            } else {
              await window.KCTouristApi.favorites.removeExperience(id);
            }
          }
        } catch (error) {
          console.warn("Remove favorite pending backend implementation:", error);
        }

        if (state.activeTab === "guides") {
          state.guides = state.guides.filter((itemRow) => itemRow.id !== id);
        } else {
          state.experiences = state.experiences.filter((itemRow) => itemRow.id !== id);
        }
        updateCounters();
        renderCards();
      });

      dom.cards.appendChild(card);
    });
  }

  function setActiveTab(tabId) {
    state.activeTab = tabId;
    dom.tabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.tab === tabId);
    });
    renderCards();
  }

  function bind() {
    dom.tabs = [...document.querySelectorAll("[data-tab]")];
    dom.countGuides = document.getElementById("favoritesGuidesCount");
    dom.countExperiences = document.getElementById("favoritesExperiencesCount");
    dom.cards = document.getElementById("favoritesCards");
    dom.searchInput = document.getElementById("favoritesSearchInput");
    dom.btnChat = document.getElementById("btnChat");
    dom.btnNewTrip = document.getElementById("btnNewTrip");

    dom.tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        setActiveTab(tab.dataset.tab || "guides");
      });
    });

    dom.searchInput?.addEventListener("input", renderCards);

    dom.btnChat?.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("tourist-chat:open"));
    });

    dom.btnNewTrip?.addEventListener("click", () => {
      window.location.href = "./trips.html";
    });
  }

  async function init() {
    bind();
    renderLoadingState();
    await hydrateFromApi();
    updateCounters();
    setActiveTab("guides");
  }

  return { init };
})();

const bootstrapTouristFavorites = () => {
  const run = () => TouristFavoritesApp.init();
  const sidebarReady = window.__touristSidebarReadyPromise;

  if (sidebarReady && typeof sidebarReady.finally === "function") {
    sidebarReady.finally(run);
    return;
  }

  run();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrapTouristFavorites, { once: true });
} else {
  bootstrapTouristFavorites();
}
