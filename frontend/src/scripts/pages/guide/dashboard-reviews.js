/* =========================================================
   Guía - Reseñas
   API-first para overview, listado y respuesta a reseñas.
   ========================================================= */

const GuideReviewsApp = (() => {
  const state = {
    guideId: "guide_001", // TODO(AUTH): reemplazar con id del usuario autenticado
    overview: {
      total: 2,
      average: 4.8,
      fiveStarRate: "85%",
      thisMonth: 2,
    },
    reviews: [
      {
        id: "rev_1",
        author: "Sarah Johnson",
        tourName: "Recorrido a pie por Ciudad de México",
        dateLabel: "18 de enero de 2026",
        rating: 5,
        comment: "Increíble experiencia, el guía fue muy amable y conocía mucho de la ciudad.",
        replied: false,
      },
      {
        id: "rev_2",
        author: "Mariana C.",
        tourName: "Recorrido gastronómico local",
        dateLabel: "12 de enero de 2026",
        rating: 4,
        comment: "Muy recomendado, buenos lugares y excelente energía.",
        replied: true,
      },
    ],
  };

  const dom = {
    total: null,
    average: null,
    fiveStarRate: null,
    thisMonth: null,
    feed: null,
  };

  const loadingMarkup = (label) => `
    <div class="guide-loading" role="status" aria-live="polite" aria-busy="true">
      <span class="guide-loading__spinner" aria-hidden="true"></span>
      <span>${label}</span>
    </div>
  `;

  function renderReviewsLoading() {
    if (!dom.feed) return;
    dom.feed.innerHTML = loadingMarkup("Cargando reseñas...");
  }

  function normalizeReview(raw) {
    return {
      id: raw.id || Math.random().toString(36).slice(2, 10),
      author: raw.author || raw.userName || "Turista",
      tourName: raw.tourName || raw.tourTitle || "Tour",
      dateLabel: raw.dateLabel || raw.createdAtLabel || raw.createdAt || "",
      rating: Number(raw.rating || 0),
      comment: raw.comment || raw.message || "",
      replied: Boolean(raw.replied || raw.hasReply),
    };
  }

  function mapOverview(raw) {
    // TODO(BACKEND): definir contrato oficial para overview de reseñas.
    if (!raw || typeof raw !== "object") return;
    state.overview.total = raw.totalReviews ?? state.overview.total;
    state.overview.average = Number(raw.averageRating ?? state.overview.average);
    state.overview.fiveStarRate = raw.fiveStarRateLabel ?? state.overview.fiveStarRate;
    state.overview.thisMonth = raw.thisMonthCount ?? state.overview.thisMonth;
  }

  async function hydrateFromApi() {
    if (!window.KCGuideApi) return;

    try {
      const [overviewRes, listRes] = await Promise.all([
        window.KCGuideApi.reviews.getOverview(state.guideId),
        window.KCGuideApi.reviews.list(state.guideId, { page: 0, size: 30 }),
      ]);

      mapOverview(overviewRes?.data || {});
      const items = listRes?.data?.items || listRes?.data || [];
      if (Array.isArray(items)) state.reviews = items.map(normalizeReview);
    } catch (error) {
      console.warn("Reviews API fallback enabled:", error);
    }
  }

  function renderOverview() {
    dom.total.textContent = String(state.overview.total);
    dom.average.textContent = Number(state.overview.average).toFixed(1);
    dom.fiveStarRate.textContent = state.overview.fiveStarRate;
    dom.thisMonth.textContent = String(state.overview.thisMonth);
  }

  function renderStars(rating) {
    const safeRating = Math.max(0, Math.min(5, Number(rating || 0)));
    const stars = [];
    for (let i = 0; i < 5; i += 1) {
      stars.push(`<span class="material-symbols-outlined">${i < safeRating ? "star" : "star_outline"}</span>`);
    }
    return stars.join("");
  }

  function renderReviews() {
    dom.feed.innerHTML = state.reviews
      .map((review) => {
        const replyLabel = review.replied ? "Editar respuesta" : "Responder a esta reseña";
        return `
          <article class="review-card" data-review-id="${review.id}">
            <div class="review-card__header">
              <div class="reviewer">
                <img src="https://i.pravatar.cc/100?u=${encodeURIComponent(review.author)}" alt="Usuario" class="reviewer-img">
                <div class="reviewer-info">
                  <h3>${review.author}</h3>
                  <p>${review.tourName}</p>
                  <span class="review-date">${review.dateLabel}</span>
                </div>
              </div>
              <div class="review-stars">
                ${renderStars(review.rating)}
              </div>
            </div>
            <p class="review-body">${review.comment}</p>
            <button class="btn-reply" type="button" data-reply-review="${review.id}">
              ${replyLabel}
            </button>
          </article>
        `;
      })
      .join("");
  }

  async function handleReply(reviewId) {
    const review = state.reviews.find((item) => String(item.id) === String(reviewId));
    if (!review) return;

    const message = window.prompt("Escribe tu respuesta para el turista:", "");
    if (!message || !message.trim()) return;

    try {
      if (window.KCGuideApi) {
        // TODO(BACKEND): endpoint final POST /guides/{guideId}/reviews/{reviewId}/reply
        await window.KCGuideApi.reviews.reply(state.guideId, reviewId, {
          message: message.trim(),
        });
      }
      review.replied = true;
      renderReviews();
    } catch (error) {
      console.warn("Reply flow pending backend implementation:", error);
    }
  }

  function bind() {
    dom.total = document.getElementById("reviewsTotal");
    dom.average = document.getElementById("reviewsAverage");
    dom.fiveStarRate = document.getElementById("reviewsFiveStarRate");
    dom.thisMonth = document.getElementById("reviewsThisMonth");
    dom.feed = document.getElementById("reviewsFeed");

    dom.feed?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-reply-review]");
      if (!button) return;
      handleReply(button.getAttribute("data-reply-review"));
    });
  }

  async function init() {
    bind();
    renderReviewsLoading();
    await hydrateFromApi();
    renderOverview();
    renderReviews();
  }

  return { init };
})();

const bootstrapGuideReviews = () => {
  const run = () => GuideReviewsApp.init();
  const sidebarReady = window.__guideSidebarReadyPromise;

  if (sidebarReady && typeof sidebarReady.finally === "function") {
    sidebarReady.finally(run);
    return;
  }

  run();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrapGuideReviews, { once: true });
} else {
  bootstrapGuideReviews();
}
