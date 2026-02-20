/* =========================================================
   Turista - Centro de Ayuda
   Base de FAQ/tickets lista para integracion API.
   ========================================================= */

const TouristHelpApp = (() => {
  const dom = {
    supportOpenButton: null,
    modal: null,
    modalCloseTriggers: [],
    form: null,
    fileInput: null,
    fileDropzoneTitle: null,
    toast: null,
    toastClose: null,
  };

  function openModal() {
    if (!dom.modal) return;
    dom.modal.classList.add("modal--open");
    dom.modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!dom.modal) return;
    dom.modal.classList.remove("modal--open");
    dom.modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function showToast(message) {
    if (!dom.toast) return;
    const text = dom.toast.querySelector(".toast__text");
    if (text) text.textContent = message;
    dom.toast.classList.add("toast--show");
    dom.toast.setAttribute("aria-hidden", "false");
    window.setTimeout(() => {
      dom.toast.classList.remove("toast--show");
      dom.toast.setAttribute("aria-hidden", "true");
    }, 3200);
  }

  function buildTicketPayload() {
    const formData = new FormData(dom.form);
    return {
      fullName: String(formData.get("fullName") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      subject: String(formData.get("subject") || "").trim(),
      message: String(formData.get("message") || "").trim(),
    };
  }

  async function submitTicket(event) {
    event.preventDefault();
    const payload = buildTicketPayload();

    try {
      if (window.KCTouristApi) {
        // TODO(BACKEND): endpoint real de tickets y adjuntos para turista.
        await window.KCTouristApi.help.sendTicket(payload);
      }
      showToast("Mensaje enviado. Te responderemos pronto.");
      dom.form.reset();
      if (dom.fileDropzoneTitle) {
        dom.fileDropzoneTitle.textContent = "Haz clic o arrastra una imagen o documento";
      }
      closeModal();
    } catch (error) {
      console.warn("Support ticket flow pending backend implementation:", error);
      showToast("No se pudo enviar. Intenta nuevamente.");
    }
  }

  function setupFaqBehavior() {
    const detailsItems = [...document.querySelectorAll(".faq__item")];
    detailsItems.forEach((detail) => {
      detail.addEventListener("toggle", () => {
        if (!detail.open) return;
        detailsItems.forEach((other) => {
          if (other !== detail) other.open = false;
        });
      });
    });
  }

  function bind() {
    dom.supportOpenButton = document.querySelector("[data-support-open]");
    dom.modal = document.querySelector("[data-support-modal]");
    dom.modalCloseTriggers = [...document.querySelectorAll("[data-support-close]")];
    dom.form = document.querySelector("[data-support-form]");
    dom.fileInput = document.getElementById("file");
    dom.fileDropzoneTitle = document.querySelector(".dropzone__title");
    dom.toast = document.querySelector("[data-toast]");
    dom.toastClose = document.querySelector("[data-toast-close]");

    dom.supportOpenButton?.addEventListener("click", openModal);
    dom.modalCloseTriggers.forEach((trigger) => trigger.addEventListener("click", closeModal));
    dom.form?.addEventListener("submit", submitTicket);
    dom.toastClose?.addEventListener("click", () => {
      dom.toast.classList.remove("toast--show");
      dom.toast.setAttribute("aria-hidden", "true");
    });

    dom.fileInput?.addEventListener("change", () => {
      const file = dom.fileInput.files?.[0];
      if (!file || !dom.fileDropzoneTitle) return;
      dom.fileDropzoneTitle.textContent = `Archivo seleccionado: ${file.name}`;
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeModal();
    });
  }

  function init() {
    bind();
    setupFaqBehavior();
  }

  return { init };
})();

const bootstrapTouristHelp = () => {
  const run = () => TouristHelpApp.init();
  const sidebarReady = window.__touristSidebarReadyPromise;

  if (sidebarReady && typeof sidebarReady.finally === "function") {
    sidebarReady.finally(run);
    return;
  }

  run();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrapTouristHelp, { once: true });
} else {
  bootstrapTouristHelp();
}
