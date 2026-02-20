const TOURIST_PROFILE_STORAGE_KEY = "kc_tourist_profile_v1";

const DEFAULT_TOURIST_PROFILE = {
  name: "Sofía Ramírez",
  location: "Ciudad de México",
  memberSince: "Ene 2023",
  badge: "Viajera frecuente",
  bio: "Amante de la naturaleza y la comida callejera.",
  interests: ["Aventura", "Gastronomía", "Playa", "Fotografía"],
  travelStyle: "Exploración cultural con itinerarios flexibles.",
  tripType: "Escapadas de fin de semana y viajes urbanos.",
  languages: ["Español", "Inglés"],
  paceAndCompany: "Ritmo moderado en compañía de grupos pequeños.",
  activityLevel: "Moderado",
  groupPreference: "Pareja o grupos de 3 a 6 personas.",
  dietaryPreferences: "Sin restricciones, con prioridad en comida local.",
  planningLevel: "Intermedio",
  amenities: "Hospedajes céntricos, conectividad y descanso.",
  transport: "Caminata y transporte público.",
  photoPreference: "Fotos espontáneas y retratos naturales.",
  accessibility: "Sin necesidades especiales actualmente.",
  additionalNotes: "Disponible para ajustar actividades según clima e intereses.",
  avatar:
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=640&q=80",
  cover:
    "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1400&q=80",
};

const TouristProfileEditApp = (() => {
  const state = {
    isSaving: false,
    profile: cloneDefaultProfile(),
  };

  const dom = {
    form: null,
    feedback: null,
    saveButton: null,
    profileNameInput: null,
    profileLocationInput: null,
    profileBioInput: null,
    interestsInput: null,
    travelStyleInput: null,
    tripTypeInput: null,
    languagesInput: null,
    paceAndCompanyInput: null,
    activityLevelInput: null,
    groupPreferenceInput: null,
    dietaryPreferencesInput: null,
    planningLevelInput: null,
    amenitiesInput: null,
    transportInput: null,
    photoPreferenceInput: null,
    accessibilityInput: null,
    additionalNotesInput: null,
  };

  function cloneDefaultProfile() {
    return {
      ...DEFAULT_TOURIST_PROFILE,
      interests: [...DEFAULT_TOURIST_PROFILE.interests],
      languages: [...DEFAULT_TOURIST_PROFILE.languages],
    };
  }

  function normalizeText(rawValue, fallbackValue) {
    const value = String(rawValue || "").trim();
    return value || fallbackValue;
  }

  function normalizeList(rawValue, fallbackList) {
    if (Array.isArray(rawValue)) {
      const list = rawValue
        .map((item) => String(item || "").trim())
        .filter(Boolean);
      return list.length ? list : [...fallbackList];
    }

    if (typeof rawValue === "string") {
      const list = rawValue
        .split(/[\n,]+/g)
        .map((item) => item.trim())
        .filter(Boolean);
      return list.length ? list : [...fallbackList];
    }

    return [...fallbackList];
  }

  function normalizeProfile(rawProfile) {
    const base = cloneDefaultProfile();
    if (!rawProfile || typeof rawProfile !== "object") return base;

    base.name = normalizeText(rawProfile.name, base.name);
    base.location = normalizeText(rawProfile.location, base.location);
    base.memberSince = normalizeText(rawProfile.memberSince, base.memberSince);
    base.badge = normalizeText(rawProfile.badge, base.badge);
    base.bio = normalizeText(rawProfile.bio, base.bio);
    base.interests = normalizeList(rawProfile.interests, base.interests);
    base.travelStyle = normalizeText(rawProfile.travelStyle, base.travelStyle);
    base.tripType = normalizeText(rawProfile.tripType, base.tripType);
    base.languages = normalizeList(rawProfile.languages, base.languages);
    base.paceAndCompany = normalizeText(rawProfile.paceAndCompany, base.paceAndCompany);
    base.activityLevel = normalizeText(rawProfile.activityLevel, base.activityLevel);
    base.groupPreference = normalizeText(rawProfile.groupPreference, base.groupPreference);
    base.dietaryPreferences = normalizeText(rawProfile.dietaryPreferences, base.dietaryPreferences);
    base.planningLevel = normalizeText(rawProfile.planningLevel, base.planningLevel);
    base.amenities = normalizeText(rawProfile.amenities, base.amenities);
    base.transport = normalizeText(rawProfile.transport, base.transport);
    base.photoPreference = normalizeText(rawProfile.photoPreference, base.photoPreference);
    base.accessibility = normalizeText(rawProfile.accessibility, base.accessibility);
    base.additionalNotes = normalizeText(rawProfile.additionalNotes, base.additionalNotes);
    base.avatar = normalizeText(rawProfile.avatar, base.avatar);
    base.cover = normalizeText(rawProfile.cover, base.cover);

    return base;
  }

  function textToList(rawValue) {
    return String(rawValue || "")
      .split(/[\n,]+/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function listToText(items) {
    return items.join("\n");
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

  function readProfileFromStorage() {
    try {
      const raw = window.localStorage.getItem(TOURIST_PROFILE_STORAGE_KEY);
      if (!raw) return cloneDefaultProfile();
      return normalizeProfile(JSON.parse(raw));
    } catch (error) {
      console.warn("No se pudo leer el perfil de turista guardado localmente.", error);
      return cloneDefaultProfile();
    }
  }

  function fillForm(profile) {
    dom.profileNameInput.value = profile.name;
    dom.profileLocationInput.value = profile.location;
    dom.profileBioInput.value = profile.bio;
    dom.interestsInput.value = listToText(profile.interests);
    dom.travelStyleInput.value = profile.travelStyle;
    dom.tripTypeInput.value = profile.tripType;
    dom.languagesInput.value = listToText(profile.languages);
    dom.paceAndCompanyInput.value = profile.paceAndCompany;
    dom.activityLevelInput.value = profile.activityLevel;
    dom.groupPreferenceInput.value = profile.groupPreference;
    dom.dietaryPreferencesInput.value = profile.dietaryPreferences;
    dom.planningLevelInput.value = profile.planningLevel;
    dom.amenitiesInput.value = profile.amenities;
    dom.transportInput.value = profile.transport;
    dom.photoPreferenceInput.value = profile.photoPreference;
    dom.accessibilityInput.value = profile.accessibility;
    dom.additionalNotesInput.value = profile.additionalNotes;
  }

  function collectPayload() {
    return normalizeProfile({
      ...state.profile,
      name: dom.profileNameInput.value,
      location: dom.profileLocationInput.value,
      bio: dom.profileBioInput.value,
      interests: textToList(dom.interestsInput.value),
      travelStyle: dom.travelStyleInput.value,
      tripType: dom.tripTypeInput.value,
      languages: textToList(dom.languagesInput.value),
      paceAndCompany: dom.paceAndCompanyInput.value,
      activityLevel: dom.activityLevelInput.value,
      groupPreference: dom.groupPreferenceInput.value,
      dietaryPreferences: dom.dietaryPreferencesInput.value,
      planningLevel: dom.planningLevelInput.value,
      amenities: dom.amenitiesInput.value,
      transport: dom.transportInput.value,
      photoPreference: dom.photoPreferenceInput.value,
      accessibility: dom.accessibilityInput.value,
      additionalNotes: dom.additionalNotesInput.value,
    });
  }

  function validatePayload(profile) {
    if (!profile.name.trim()) return "Ingresa tu nombre.";
    if (!profile.location.trim()) return "Ingresa tu ubicación.";
    if (!profile.bio.trim()) return "Agrega una breve descripción personal.";
    if (!profile.interests.length) return "Agrega al menos un interés.";
    if (!profile.languages.length) return "Agrega al menos un idioma.";
    return "";
  }

  function toApiPayload(profile) {
    return {
      name: profile.name,
      location: profile.location,
      bio: profile.bio,
      interests: profile.interests,
      travelStyle: profile.travelStyle,
      tripType: profile.tripType,
      languages: profile.languages,
      paceAndCompany: profile.paceAndCompany,
      activityLevel: profile.activityLevel,
      groupPreference: profile.groupPreference,
      dietaryPreferences: profile.dietaryPreferences,
      planningLevel: profile.planningLevel,
      amenities: profile.amenities,
      transport: profile.transport,
      photoPreference: profile.photoPreference,
      accessibility: profile.accessibility,
      additionalNotes: profile.additionalNotes,
    };
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
      window.localStorage.setItem(TOURIST_PROFILE_STORAGE_KEY, JSON.stringify(payload));

      try {
        if (window.KCTouristApi?.profile?.updateMe) {
          await window.KCTouristApi.profile.updateMe(toApiPayload(payload));
        }
      } catch (apiError) {
        console.warn("No se pudo sincronizar con API. Se conservaron cambios locales.", apiError);
      }

      setFeedback("Perfil actualizado correctamente. Redirigiendo...", "is-success");
      window.setTimeout(() => {
        window.location.href = "./profileTourist.html";
      }, 600);
    } catch (error) {
      console.error(error);
      setFeedback("No se pudo guardar. Intenta nuevamente.", "is-error");
    } finally {
      setSavingState(false);
    }
  }

  function bind() {
    dom.form = document.getElementById("touristProfileEditForm");
    dom.feedback = document.getElementById("touristProfileEditFeedback");
    dom.saveButton = document.getElementById("btnSaveTouristProfile");
    dom.profileNameInput = document.getElementById("profileNameInput");
    dom.profileLocationInput = document.getElementById("profileLocationInput");
    dom.profileBioInput = document.getElementById("profileBioInput");
    dom.interestsInput = document.getElementById("interestsInput");
    dom.travelStyleInput = document.getElementById("travelStyleInput");
    dom.tripTypeInput = document.getElementById("tripTypeInput");
    dom.languagesInput = document.getElementById("languagesInput");
    dom.paceAndCompanyInput = document.getElementById("paceAndCompanyInput");
    dom.activityLevelInput = document.getElementById("activityLevelInput");
    dom.groupPreferenceInput = document.getElementById("groupPreferenceInput");
    dom.dietaryPreferencesInput = document.getElementById("dietaryPreferencesInput");
    dom.planningLevelInput = document.getElementById("planningLevelInput");
    dom.amenitiesInput = document.getElementById("amenitiesInput");
    dom.transportInput = document.getElementById("transportInput");
    dom.photoPreferenceInput = document.getElementById("photoPreferenceInput");
    dom.accessibilityInput = document.getElementById("accessibilityInput");
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

const bootstrapTouristProfileEdit = () => {
  const run = () => TouristProfileEditApp.init();
  const sidebarReady = window.__touristSidebarReadyPromise;

  if (sidebarReady && typeof sidebarReady.finally === "function") {
    sidebarReady.finally(run);
    return;
  }

  run();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrapTouristProfileEdit, { once: true });
} else {
  bootstrapTouristProfileEdit();
}
