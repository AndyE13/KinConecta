/* =========================================================
   Guía - Edición de perfil
   Formulario para actualizar información profesional del guía.
   ========================================================= */

const GUIDE_PROFILE_STORAGE_KEY = "kc_guide_profile_v1";

const DEFAULT_GUIDE_PROFILE = {
  name: "Carlos Rivera",
  summary: "Guía cultural con rutas flexibles para grupos pequeños y medianos.",
  areasExperience: [
    "Historia y patrimonio urbano",
    "Gastronomía local y mercados tradicionales",
    "Arte contemporáneo y cultura popular",
  ],
  locations: ["Centro Histórico", "Coyoacán", "Roma-Condesa", "Teotihuacán"],
  experienceLevel: "Avanzado",
  languages: ["Español (nativo)", "Inglés (C1)", "Francés (B1)"],
  style:
    "Estilo narrativo, cercano y dinámico. Combino contexto histórico con recomendaciones prácticas para el viajero.",
  groupSize: "Hasta 10 personas (ideal: 6)",
  tourIntensity: "Moderada: caminatas de 5 a 7 km con pausas programadas.",
  transportOffered:
    "Caminata guiada, transporte público acompañado y vehículo privado bajo solicitud.",
  certifications: [
    "Primeros auxilios básicos",
    "Acreditación local de guía de turismo cultural",
  ],
  adaptations: [
    "Rutas alternativas para movilidad reducida",
    "Ritmo adaptable para familias con menores",
  ],
  photoStyle:
    "Fotografía documental y retratos espontáneos en puntos emblemáticos. Entrega digital en 24 horas.",
  additionalNotes:
    "Se recomienda llevar calzado cómodo, protección solar e hidratación. Opciones vegetarianas y sin gluten disponibles.",
  updatedAt: "",
};

const GuideProfileEditApp = (() => {
  const state = {
    isSaving: false,
    profile: cloneDefaultProfile(),
  };

  const dom = {
    form: null,
    feedback: null,
    saveButton: null,
    profileNameInput: null,
    profileSummaryInput: null,
    areasExperienceInput: null,
    locationsInput: null,
    experienceLevelInput: null,
    languagesInput: null,
    styleInput: null,
    groupSizeInput: null,
    tourIntensityInput: null,
    transportOfferedInput: null,
    certificationsInput: null,
    adaptationsInput: null,
    photoStyleInput: null,
    additionalNotesInput: null,
  };

  function cloneDefaultProfile() {
    return {
      ...DEFAULT_GUIDE_PROFILE,
      areasExperience: [...DEFAULT_GUIDE_PROFILE.areasExperience],
      locations: [...DEFAULT_GUIDE_PROFILE.locations],
      languages: [...DEFAULT_GUIDE_PROFILE.languages],
      certifications: [...DEFAULT_GUIDE_PROFILE.certifications],
      adaptations: [...DEFAULT_GUIDE_PROFILE.adaptations],
    };
  }

  function normalizeList(rawValue, fallbackList) {
    if (Array.isArray(rawValue)) {
      const items = rawValue
        .map((item) => String(item || "").trim())
        .filter(Boolean);
      return items.length ? items : [...fallbackList];
    }

    if (typeof rawValue === "string") {
      const parsed = rawValue
        .split(/[\n,]+/g)
        .map((item) => item.trim())
        .filter(Boolean);
      return parsed.length ? parsed : [...fallbackList];
    }

    return [...fallbackList];
  }

  function normalizeText(rawValue, fallbackValue) {
    const value = String(rawValue || "").trim();
    return value || fallbackValue;
  }

  function normalizeProfile(rawProfile) {
    const base = cloneDefaultProfile();
    if (!rawProfile || typeof rawProfile !== "object") return base;

    base.name = normalizeText(rawProfile.name, base.name);
    base.summary = normalizeText(rawProfile.summary, base.summary);
    base.areasExperience = normalizeList(rawProfile.areasExperience, base.areasExperience);
    base.locations = normalizeList(rawProfile.locations, base.locations);
    base.experienceLevel = normalizeText(rawProfile.experienceLevel, base.experienceLevel);
    base.languages = normalizeList(rawProfile.languages, base.languages);
    base.style = normalizeText(rawProfile.style, base.style);
    base.groupSize = normalizeText(rawProfile.groupSize, base.groupSize);
    base.tourIntensity = normalizeText(rawProfile.tourIntensity, base.tourIntensity);
    base.transportOffered = normalizeText(rawProfile.transportOffered, base.transportOffered);
    base.certifications = normalizeList(rawProfile.certifications, base.certifications);
    base.adaptations = normalizeList(rawProfile.adaptations, base.adaptations);
    base.photoStyle = normalizeText(rawProfile.photoStyle, base.photoStyle);
    base.additionalNotes = normalizeText(rawProfile.additionalNotes, base.additionalNotes);
    return base;
  }

  function readProfileFromStorage() {
    try {
      const raw = window.localStorage.getItem(GUIDE_PROFILE_STORAGE_KEY);
      if (!raw) return cloneDefaultProfile();
      return normalizeProfile(JSON.parse(raw));
    } catch (error) {
      console.warn("No se pudo leer el perfil guardado localmente.", error);
      return cloneDefaultProfile();
    }
  }

  function listToText(items) {
    return items.join("\n");
  }

  function textToList(rawValue) {
    return String(rawValue || "")
      .split(/[\n,]+/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function setFeedback(message, type = "") {
    if (!dom.feedback) return;
    dom.feedback.textContent = message;
    dom.feedback.classList.remove("is-success", "is-error");
    if (type) dom.feedback.classList.add(type);
  }

  function setSavingState(isSaving) {
    state.isSaving = isSaving;
    if (!dom.saveButton) return;
    dom.saveButton.disabled = isSaving;
    dom.saveButton.textContent = isSaving ? "Guardando..." : "Guardar cambios";
  }

  function fillForm(profile) {
    dom.profileNameInput.value = profile.name;
    dom.profileSummaryInput.value = profile.summary;
    dom.areasExperienceInput.value = listToText(profile.areasExperience);
    dom.locationsInput.value = listToText(profile.locations);
    dom.experienceLevelInput.value = profile.experienceLevel;
    dom.languagesInput.value = listToText(profile.languages);
    dom.styleInput.value = profile.style;
    dom.groupSizeInput.value = profile.groupSize;
    dom.tourIntensityInput.value = profile.tourIntensity;
    dom.transportOfferedInput.value = profile.transportOffered;
    dom.certificationsInput.value = listToText(profile.certifications);
    dom.adaptationsInput.value = listToText(profile.adaptations);
    dom.photoStyleInput.value = profile.photoStyle;
    dom.additionalNotesInput.value = profile.additionalNotes;
  }

  function collectPayload() {
    return normalizeProfile({
      name: dom.profileNameInput.value,
      summary: dom.profileSummaryInput.value,
      areasExperience: textToList(dom.areasExperienceInput.value),
      locations: textToList(dom.locationsInput.value),
      experienceLevel: dom.experienceLevelInput.value,
      languages: textToList(dom.languagesInput.value),
      style: dom.styleInput.value,
      groupSize: dom.groupSizeInput.value,
      tourIntensity: dom.tourIntensityInput.value,
      transportOffered: dom.transportOfferedInput.value,
      certifications: textToList(dom.certificationsInput.value),
      adaptations: textToList(dom.adaptationsInput.value),
      photoStyle: dom.photoStyleInput.value,
      additionalNotes: dom.additionalNotesInput.value,
      updatedAt: new Date().toISOString(),
    });
  }

  function validatePayload(profile) {
    if (!profile.name.trim()) return "Ingresa el nombre del guía.";
    if (!profile.areasExperience.length) return "Agrega al menos un área de experiencia.";
    if (!profile.locations.length) return "Agrega al menos una ubicación.";
    if (!profile.languages.length) return "Agrega al menos un idioma.";
    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (state.isSaving) return;

    const payload = collectPayload();
    const validationError = validatePayload(payload);
    if (validationError) {
      setFeedback(validationError, "is-error");
      return;
    }

    setSavingState(true);
    setFeedback("Guardando cambios...", "");

    try {
      window.localStorage.setItem(GUIDE_PROFILE_STORAGE_KEY, JSON.stringify(payload));
      setFeedback("Perfil actualizado correctamente. Redirigiendo...", "is-success");
      window.setTimeout(() => {
        window.location.href = "profileGuide.html";
      }, 600);
    } catch (error) {
      console.error(error);
      setFeedback("No se pudo guardar. Intenta nuevamente.", "is-error");
    } finally {
      setSavingState(false);
    }
  }

  function bind() {
    dom.form = document.getElementById("profileEditForm");
    dom.feedback = document.getElementById("profileEditFeedback");
    dom.saveButton = document.getElementById("btnSaveProfile");
    dom.profileNameInput = document.getElementById("profileNameInput");
    dom.profileSummaryInput = document.getElementById("profileSummaryInput");
    dom.areasExperienceInput = document.getElementById("areasExperienceInput");
    dom.locationsInput = document.getElementById("locationsInput");
    dom.experienceLevelInput = document.getElementById("experienceLevelInput");
    dom.languagesInput = document.getElementById("languagesInput");
    dom.styleInput = document.getElementById("styleInput");
    dom.groupSizeInput = document.getElementById("groupSizeInput");
    dom.tourIntensityInput = document.getElementById("tourIntensityInput");
    dom.transportOfferedInput = document.getElementById("transportOfferedInput");
    dom.certificationsInput = document.getElementById("certificationsInput");
    dom.adaptationsInput = document.getElementById("adaptationsInput");
    dom.photoStyleInput = document.getElementById("photoStyleInput");
    dom.additionalNotesInput = document.getElementById("additionalNotesInput");

    dom.form?.addEventListener("submit", handleSubmit);
  }

  async function init() {
    bind();
    state.profile = readProfileFromStorage();
    fillForm(state.profile);
  }

  return { init };
})();

const bootstrapGuideProfileEdit = () => {
  const run = () => GuideProfileEditApp.init();
  const sidebarReady = window.__guideSidebarReadyPromise;

  if (sidebarReady && typeof sidebarReady.finally === "function") {
    sidebarReady.finally(run);
    return;
  }

  run();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrapGuideProfileEdit, { once: true });
} else {
  bootstrapGuideProfileEdit();
}
