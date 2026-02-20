const TouristReviewsApp = (() => {
  const state = {
    summary: {
      totalReviews: 0,
      averageRating: 0,
      fiveStarsRate: "0%",
      monthCount: 0,
    },
    reviews: [],
  };

  const fallback = {
    summary: {
      totalReviews: 3,
      averageRating: 4.8,
      fiveStarsRate: "85%",
      monthCount: 2,
    },
    reviews: [
      {
        id: "rv_1",
        guideName: "Luis Martínez",
        tourName: "Historic Center Photo Tour",
        dateLabel: "15 Ene 2026",
        rating: 5,
        body: "Excelente experiencia. El recorrido fue claro, organizado y con recomendaciones útiles.",
        avatar: "https://i.pravatar.cc/100?u=luis",
        likes: 12,
        replies: 1,
      },
      {
        id: "rv_2",
        guideName: "Ana García",
        tourName: "Senderismo en bosque de niebla",
        dateLabel: "28 Dic 2025",
        rating: 4,
        body: "Muy buen tour. Solo faltaron más opciones de comida al final de la ruta.",
        avatar: "https://i.pravatar.cc/100?u=ana",
        likes: 6,
        replies: 0,
      },
    ],
  };

  const dom = {
    statTotal: null,
    statAverage: null,
    statFiveStars: null,
    statMonth: null,
    reviewsList: null,
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
    if (dom.statTotal) dom.statTotal.textContent = "...";
    if (dom.statAverage) dom.statAverage.textContent = "...";
    if (dom.statFiveStars) dom.statFiveStars.textContent = "...";
    if (dom.statMonth) dom.statMonth.textContent = "...";
    if (dom.reviewsList) dom.reviewsList.innerHTML = loadingMarkup("Cargando reseñas...");
  }

  function mapReview(raw) {
    return {
      id: raw.id,
      guideName: raw.guideName || raw.authorName || "Guía",
      tourName: raw.tourName || "Experiencia",
      dateLabel: raw.dateLabel || raw.date || "Reciente",
      rating: Number(raw.rating || 0),
      body: raw.body || raw.comment || "Sin comentario.",
      avatar: raw.avatarUrl || "https://i.pravatar.cc/100?u=review",
      likes: Number(raw.likes || raw.likesCount || 0),
      replies: Number(raw.replies || raw.repliesCount || 0),
    };
  }

  async function hydrateFromApi() {
    if (!window.KCTouristApi) {
      state.summary = { ...fallback.summary };
      state.reviews = fallback.reviews.slice();
      return;
    }

    try {
      const [summaryRes, listRes] = await Promise.all([
        window.KCTouristApi.reviews.getSummary(),
        window.KCTouristApi.reviews.list({ page: 0, size: 20 }),
      ]);

      const summary = summaryRes?.data || {};
      state.summary = {
        totalReviews: Number(summary.totalReviews ?? fallback.summary.totalReviews),
        averageRating: Number(summary.averageRating ?? fallback.summary.averageRating),
        fiveStarsRate: summary.fiveStarsRate || fallback.summary.fiveStarsRate,
        monthCount: Number(summary.monthCount ?? fallback.summary.monthCount),
      };

      const rows = listRes?.data?.items || listRes?.data || [];
      state.reviews = Array.isArray(rows) && rows.length
        ? rows.map(mapReview)
        : fallback.reviews.slice();
    } catch (error) {
      console.warn("Reviews API fallback enabled:", error);
      state.summary = { ...fallback.summary };
      state.reviews = fallback.reviews.slice();
    }
  }

  function renderSummary() {
    if (dom.statTotal) dom.statTotal.textContent = String(state.summary.totalReviews);
    if (dom.statAverage) dom.statAverage.textContent = state.summary.averageRating.toFixed(1);
    if (dom.statFiveStars) dom.statFiveStars.textContent = state.summary.fiveStarsRate;
    if (dom.statMonth) dom.statMonth.textContent = String(state.summary.monthCount);
  }

  function renderStars(rating) {
    const safeRating = Math.max(0, Math.min(5, rating));
    return Array.from({ length: 5 }, (_, index) => {
      const icon = index < safeRating ? "star" : "star";
      return `<span class="material-symbols-outlined">${icon}</span>`;
    }).join("");
  }

  function renderReviews() {
    if (!dom.reviewsList) return;
    dom.reviewsList.innerHTML = "";

    if (!state.reviews.length) {
      dom.reviewsList.innerHTML = `
        <div class="guide-loading guide-loading--compact" role="status" aria-live="polite" aria-busy="false">
          <span>Aún no tienes reseñas registradas.</span>
        </div>
      `;
      return;
    }

    state.reviews.forEach((review) => {
      const card = document.createElement("article");
      card.className = "review-card";
      card.innerHTML = `
        <div class="review-card__header">
          <div class="reviewer">
            <img src="${review.avatar}" alt="Avatar de ${review.guideName}" />
            <div>
              <h3>${review.guideName}</h3>
              <p>${review.tourName} · ${review.dateLabel}</p>
            </div>
          </div>
          <div class="review-stars">${renderStars(review.rating)}</div>
        </div>
        <p class="review-card__body">${review.body}</p>
        <div class="review-card__footer">
          <span><span class="material-symbols-outlined">thumb_up</span>${review.likes} útiles</span>
          <span><span class="material-symbols-outlined">chat_bubble</span>${review.replies} respuestas</span>
        </div>
      `;
      dom.reviewsList.appendChild(card);
    });
  }

  function bind() {
    dom.statTotal = document.getElementById("reviewsStatTotal");
    dom.statAverage = document.getElementById("reviewsStatAverage");
    dom.statFiveStars = document.getElementById("reviewsStatFiveStars");
    dom.statMonth = document.getElementById("reviewsStatMonth");
    dom.reviewsList = document.getElementById("reviewsList");
    dom.btnChat = document.getElementById("btnChat");
    dom.btnNewTrip = document.getElementById("btnNewTrip");

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
    renderSummary();
    renderReviews();
  }

  return { init };
})();

const bootstrapTouristReviews = () => {
  const run = () => TouristReviewsApp.init();
  const sidebarReady = window.__touristSidebarReadyPromise;

  if (sidebarReady && typeof sidebarReady.finally === "function") {
    sidebarReady.finally(run);
    return;
  }

  run();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrapTouristReviews, { once: true });
} else {
  bootstrapTouristReviews();
}
