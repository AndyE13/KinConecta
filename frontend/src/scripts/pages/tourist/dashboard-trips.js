const TouristTripsApp = (() => {
  const state = {
    featuredTrip: null,
    trips: [],
  };

  const fallbackTrips = [
    {
      id: "trip_1",
      title: "Historic Center Photo Tour",
      location: "Ciudad de México",
      dateLabel: "15 Feb 2026",
      status: "confirmed",
      statusLabel: "Confirmado",
      guideName: "Luis Martínez",
      guideAvatar: "https://i.pravatar.cc/100?u=luis",
      image: "https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "trip_2",
      title: "Ruta de pueblos mágicos",
      location: "San Miguel de Allende",
      dateLabel: "24 Mar 2026",
      status: "pending",
      statusLabel: "Pendiente",
      guideName: "Carmen Ríos",
      guideAvatar: "https://i.pravatar.cc/100?u=carmen",
      image: "https://images.unsplash.com/photo-1591009175999-95a754c1f6f2?auto=format&fit=crop&w=1200&q=80",
    },
    {
      id: "trip_3",
      title: "Escapada a costa oaxaqueña",
      location: "Puerto Escondido",
      dateLabel: "10 Ene 2026",
      status: "cancelled",
      statusLabel: "Cancelado",
      guideName: "René Cruz",
      guideAvatar: "https://i.pravatar.cc/100?u=rene",
      image: "https://images.unsplash.com/photo-1510097467424-192d713fd8b2?auto=format&fit=crop&w=1200&q=80",
    },
  ];

  const dom = {
    featuredImage: null,
    featuredTitle: null,
    featuredLocation: null,
    featuredDate: null,
    featuredGuideName: null,
    featuredGuideAvatar: null,
    list: null,
    btnFeaturedDetails: null,
    btnFeaturedChat: null,
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
    if (dom.featuredImage) {
      dom.featuredImage.style.backgroundImage = "";
      dom.featuredImage.innerHTML = loadingMarkup("Cargando próximo viaje...", true);
    }
    if (dom.featuredTitle) dom.featuredTitle.textContent = "Cargando viaje...";
    if (dom.featuredLocation) dom.featuredLocation.textContent = "Ubicación en proceso...";
    if (dom.featuredDate) dom.featuredDate.textContent = "Fecha en proceso...";
    if (dom.featuredGuideName) dom.featuredGuideName.textContent = "Guía en proceso...";
    if (dom.list) dom.list.innerHTML = loadingMarkup("Cargando historial de viajes...");
  }

  function mapTrip(raw) {
    return {
      id: raw.id,
      title: raw.title || "Viaje",
      location: raw.location || "México",
      dateLabel: raw.dateLabel || raw.date || "Sin fecha",
      status: raw.status || "pending",
      statusLabel: raw.statusLabel || raw.status || "Pendiente",
      guideName: raw.guide?.name || raw.guideName || "Guía por asignar",
      guideAvatar: raw.guide?.avatarUrl || raw.guideAvatar || "https://i.pravatar.cc/100?u=guide",
      image:
        raw.imageUrl ||
        "https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?auto=format&fit=crop&w=1200&q=80",
    };
  }

  async function hydrateFromApi() {
    if (!window.KCTouristApi) {
      state.trips = fallbackTrips.slice();
      state.featuredTrip = state.trips[0];
      return;
    }

    try {
      const response = await window.KCTouristApi.trips.list({ page: 0, size: 20 });
      const data = response?.data?.items || response?.data || [];
      state.trips = Array.isArray(data) && data.length
        ? data.map(mapTrip)
        : fallbackTrips.slice();
      state.featuredTrip = state.trips[0] || null;
    } catch (error) {
      console.warn("Trips API fallback enabled:", error);
      state.trips = fallbackTrips.slice();
      state.featuredTrip = state.trips[0];
    }
  }

  function renderFeatured() {
    const trip = state.featuredTrip;
    if (!trip) return;

    if (dom.featuredImage) {
      dom.featuredImage.innerHTML = "";
      dom.featuredImage.style.backgroundImage = `url('${trip.image}')`;
    }
    if (dom.featuredTitle) dom.featuredTitle.textContent = trip.title;
    if (dom.featuredLocation) dom.featuredLocation.textContent = trip.location;
    if (dom.featuredDate) dom.featuredDate.textContent = trip.dateLabel;
    if (dom.featuredGuideName) dom.featuredGuideName.textContent = trip.guideName;
    if (dom.featuredGuideAvatar) dom.featuredGuideAvatar.src = trip.guideAvatar;
  }

  function renderTripList() {
    if (!dom.list) return;
    dom.list.innerHTML = "";

    if (!state.trips.length) {
      dom.list.innerHTML = `
        <div class="guide-loading guide-loading--compact" role="status" aria-live="polite" aria-busy="false">
          <span>No hay viajes para mostrar por ahora.</span>
        </div>
      `;
      return;
    }

    state.trips.forEach((trip) => {
      const row = document.createElement("article");
      const statusClass =
        trip.status === "cancelled"
          ? "is-cancelled"
          : trip.status === "pending"
            ? "is-pending"
            : "";
      row.className = "trip-item";
      row.innerHTML = `
        <div class="trip-item__top">
          <h3 class="trip-item__title">${trip.title}</h3>
          <span class="trip-item__status ${statusClass}">${trip.statusLabel}</span>
        </div>
        <p class="trip-item__meta">
          <span><span class="material-symbols-outlined">location_on</span>${trip.location}</span>
          <span><span class="material-symbols-outlined">calendar_month</span>${trip.dateLabel}</span>
          <span><span class="material-symbols-outlined">person</span>${trip.guideName}</span>
        </p>
        <div class="trip-item__actions">
          <button type="button" data-action="details" data-trip-id="${trip.id}">Ver detalles</button>
          <button type="button" data-action="chat" data-trip-id="${trip.id}">Contactar guía</button>
          <button type="button" data-action="cancel" data-trip-id="${trip.id}">Solicitar cambio</button>
        </div>
      `;

      row.querySelectorAll("[data-action]").forEach((button) => {
        button.addEventListener("click", async (event) => {
          const action = event.currentTarget.getAttribute("data-action");
          const tripId = event.currentTarget.getAttribute("data-trip-id");
          if (action === "details") {
            // TODO(BACKEND): navegar a detalle real.
            return;
          }
          if (action === "chat") {
            window.dispatchEvent(new CustomEvent("tourist-chat:open"));
            return;
          }
          if (action === "cancel") {
            try {
              if (window.KCTouristApi) {
                await window.KCTouristApi.trips.cancel(tripId, { reason: "request_change" });
              }
            } catch (error) {
              console.warn("Trip update pending backend implementation:", error);
            }
          }
        });
      });

      dom.list.appendChild(row);
    });
  }

  function bind() {
    dom.featuredImage = document.getElementById("featuredTripImage");
    dom.featuredTitle = document.getElementById("featuredTripTitle");
    dom.featuredLocation = document.getElementById("featuredTripLocation");
    dom.featuredDate = document.getElementById("featuredTripDate");
    dom.featuredGuideName = document.getElementById("featuredTripGuideName");
    dom.featuredGuideAvatar = document.getElementById("featuredTripGuideAvatar");
    dom.list = document.getElementById("tripsList");
    dom.btnFeaturedDetails = document.getElementById("btnFeaturedDetails");
    dom.btnFeaturedChat = document.getElementById("btnFeaturedChat");
    dom.btnChat = document.getElementById("btnChat");
    dom.btnNewTrip = document.getElementById("btnNewTrip");

    dom.btnFeaturedDetails?.addEventListener("click", () => {
      // TODO(BACKEND): navegar a detalle del viaje.
    });
    dom.btnFeaturedChat?.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("tourist-chat:open"));
    });
    dom.btnChat?.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("tourist-chat:open"));
    });
    dom.btnNewTrip?.addEventListener("click", () => {
      // TODO(BACKEND): wizard de nuevo viaje.
    });
  }

  async function init() {
    bind();
    renderLoadingState();
    await hydrateFromApi();
    renderFeatured();
    renderTripList();
  }

  return { init };
})();

const bootstrapTouristTrips = () => {
  const run = () => TouristTripsApp.init();
  const sidebarReady = window.__touristSidebarReadyPromise;

  if (sidebarReady && typeof sidebarReady.finally === "function") {
    sidebarReady.finally(run);
    return;
  }

  run();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrapTouristTrips, { once: true });
} else {
  bootstrapTouristTrips();
}
