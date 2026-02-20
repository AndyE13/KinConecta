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

const TouristProfileApp = (() => {
  const state = {
    profile: cloneDefaultProfile(),
    history: [],
    media: {
      mode: null,
      file: null,
      objectUrl: "",
    },
  };

  const fallbackHistory = [
    {
      id: "h_1",
      title: "Senderismo Nevado de Toluca",
      dateLabel: "14 Oct 2025",
      image: "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: "h_2",
      title: "Ruta del Tequila",
      dateLabel: "03 Sep 2025",
      image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=900&q=80",
    },
  ];

  const dom = {
    avatar: null,
    cover: null,
    name: null,
    location: null,
    memberSince: null,
    badge: null,
    bio: null,
    interests: null,
    travelStyle: null,
    tripType: null,
    languages: null,
    paceAndCompany: null,
    activityLevel: null,
    groupPreference: null,
    dietaryPreferences: null,
    planningLevel: null,
    amenities: null,
    transport: null,
    photoPreference: null,
    accessibility: null,
    additionalNotes: null,
    history: null,
    btnChat: null,
    btnEditProfileNav: null,
    btnCardEdit: null,
    btnAvatarEdit: null,
    mediaModal: null,
    mediaBackdrop: null,
    mediaTitle: null,
    mediaHint: null,
    mediaInput: null,
    mediaPreview: null,
    mediaFilename: null,
    mediaStatus: null,
    mediaSave: null,
    mediaCancel: null,
    mediaClose: null,
  };

  const loadingMarkup = (label, compact = false) => `
    <div class="guide-loading ${compact ? "guide-loading--compact" : ""}" role="status" aria-live="polite" aria-busy="true">
      <span class="guide-loading__spinner" aria-hidden="true"></span>
      <span>${label}</span>
    </div>
  `;

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

  function mergeProfile(base, incoming) {
    if (!incoming) return base;
    return normalizeProfile({
      ...base,
      ...incoming,
      interests:
        Array.isArray(incoming.interests) && incoming.interests.length
          ? incoming.interests
          : base.interests,
      languages:
        Array.isArray(incoming.languages) && incoming.languages.length
          ? incoming.languages
          : base.languages,
    });
  }

  function readProfileFromStorage() {
    try {
      const raw = window.localStorage.getItem(TOURIST_PROFILE_STORAGE_KEY);
      if (!raw) return cloneDefaultProfile();
      return normalizeProfile(JSON.parse(raw));
    } catch (error) {
      console.warn("No se pudo leer el perfil local de turista.", error);
      return cloneDefaultProfile();
    }
  }

  function persistProfile(profile) {
    try {
      window.localStorage.setItem(TOURIST_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.warn("No se pudo guardar el perfil local de turista.", error);
    }
  }

  function mapHistory(raw) {
    return {
      id: raw.id,
      title: raw.title || "Viaje",
      dateLabel: raw.dateLabel || raw.date || "Sin fecha",
      image:
        raw.imageUrl ||
        "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=900&q=80",
    };
  }

  function mapApiProfile(raw) {
    return {
      name: raw.name || raw.fullName || "",
      location: raw.location || "",
      memberSince: raw.memberSince || "",
      badge: raw.badge || "",
      bio: raw.bio || raw.about || "",
      interests: raw.interests || [],
      travelStyle: raw.travelStyle || "",
      tripType: raw.tripType || "",
      languages: raw.languages || [],
      paceAndCompany: raw.paceAndCompany || "",
      activityLevel: raw.activityLevel || "",
      groupPreference: raw.groupPreference || "",
      dietaryPreferences: raw.dietaryPreferences || "",
      planningLevel: raw.planningLevel || "",
      amenities: raw.amenities || "",
      transport: raw.transport || "",
      photoPreference: raw.photoPreference || "",
      accessibility: raw.accessibility || "",
      additionalNotes: raw.additionalNotes || "",
      avatar: raw.avatarUrl || raw.avatarImage || "",
      cover: raw.coverUrl || raw.coverImage || "",
    };
  }

  async function hydrateFromApi() {
    if (!window.KCTouristApi) {
      state.history = fallbackHistory.slice();
      return;
    }

    try {
      const [profileRes, tripsRes] = await Promise.all([
        window.KCTouristApi.profile.getMe(),
        window.KCTouristApi.trips.list({ page: 0, size: 6 }),
      ]);

      const profile = mapApiProfile(profileRes?.data || {});
      state.profile = mergeProfile(state.profile, profile);

      const rows = tripsRes?.data?.items || tripsRes?.data || [];
      state.history = Array.isArray(rows) && rows.length
        ? rows.slice(0, 6).map(mapHistory)
        : fallbackHistory.slice();
    } catch (error) {
      console.warn("Profile API fallback enabled:", error);
      state.history = fallbackHistory.slice();
    }
  }

  function renderLoadingState() {
    if (dom.name) dom.name.textContent = "Cargando perfil...";
    if (dom.location) dom.location.textContent = "Ubicación en proceso...";
    if (dom.memberSince) dom.memberSince.textContent = "Miembro desde ...";
    if (dom.badge) dom.badge.textContent = "Insignia en proceso...";
    if (dom.bio) dom.bio.textContent = "Cargando información...";
    if (dom.interests) {
      dom.interests.innerHTML = `
        <div class="guide-loading guide-loading--compact" role="status" aria-live="polite" aria-busy="true">
          <span class="guide-loading__spinner" aria-hidden="true"></span>
          <span>Cargando intereses...</span>
        </div>
      `;
    }
    if (dom.history) dom.history.innerHTML = loadingMarkup("Cargando historial...");
  }

  function setText(node, value) {
    if (!node) return;
    node.textContent = value;
  }

  function renderProfile() {
    if (dom.avatar) dom.avatar.style.backgroundImage = `url('${state.profile.avatar}')`;
    if (dom.cover) dom.cover.style.backgroundImage = `url('${state.profile.cover}')`;

    setText(dom.name, state.profile.name);
    setText(dom.location, state.profile.location);
    setText(dom.memberSince, `Miembro desde ${state.profile.memberSince}`);
    setText(dom.badge, state.profile.badge);
    setText(dom.bio, state.profile.bio);
    setText(dom.travelStyle, state.profile.travelStyle);
    setText(dom.tripType, state.profile.tripType);
    setText(dom.languages, state.profile.languages.join(", "));
    setText(dom.paceAndCompany, state.profile.paceAndCompany);
    setText(dom.activityLevel, state.profile.activityLevel);
    setText(dom.groupPreference, state.profile.groupPreference);
    setText(dom.dietaryPreferences, state.profile.dietaryPreferences);
    setText(dom.planningLevel, state.profile.planningLevel);
    setText(dom.amenities, state.profile.amenities);
    setText(dom.transport, state.profile.transport);
    setText(dom.photoPreference, state.profile.photoPreference);
    setText(dom.accessibility, state.profile.accessibility);
    setText(dom.additionalNotes, state.profile.additionalNotes);

    if (dom.interests) {
      dom.interests.innerHTML = "";
      state.profile.interests.forEach((tag) => {
        const item = document.createElement("span");
        item.textContent = `#${tag}`;
        dom.interests.appendChild(item);
      });
    }
  }

  function renderHistory() {
    if (!dom.history) return;
    dom.history.innerHTML = "";

    if (!state.history.length) {
      dom.history.innerHTML = `
        <div class="guide-loading guide-loading--compact" role="status" aria-live="polite" aria-busy="false">
          <span>No hay viajes para mostrar por ahora.</span>
        </div>
      `;
      return;
    }

    state.history.forEach((item) => {
      const row = document.createElement("article");
      row.className = "trip-history__item";
      row.innerHTML = `
        <div class="trip-history__image" style="background-image:url('${item.image}');"></div>
        <div class="trip-history__body">
          <h4 class="trip-history__title">${item.title}</h4>
          <p class="trip-history__meta">
            <span class="material-symbols-outlined">calendar_month</span>
            ${item.dateLabel}
          </p>
        </div>
      `;
      dom.history.appendChild(row);
    });
  }

  function revokeMediaObjectUrl() {
    if (!state.media.objectUrl) return;
    window.URL.revokeObjectURL(state.media.objectUrl);
    state.media.objectUrl = "";
  }

  function openMediaModal(mode) {
    state.media.mode = mode;
    state.media.file = null;
    revokeMediaObjectUrl();

    const isCover = mode === "cover";
    const source = isCover ? state.profile.cover : state.profile.avatar;

    if (dom.mediaInput) dom.mediaInput.value = "";
    if (dom.mediaPreview) dom.mediaPreview.src = source;
    if (dom.mediaTitle) dom.mediaTitle.textContent = isCover ? "Editar foto de portada" : "Editar foto de perfil";
    if (dom.mediaHint) {
      dom.mediaHint.textContent = isCover
        ? "Selecciona una imagen para actualizar tu portada."
        : "Selecciona una imagen para actualizar tu foto de perfil.";
    }
    if (dom.mediaFilename) dom.mediaFilename.textContent = "Ningún archivo seleccionado.";
    if (dom.mediaStatus) dom.mediaStatus.textContent = "";
    dom.mediaBackdrop?.removeAttribute("hidden");
    dom.mediaModal?.removeAttribute("hidden");
  }

  function closeMediaModal() {
    revokeMediaObjectUrl();
    state.media.mode = null;
    state.media.file = null;
    dom.mediaBackdrop?.setAttribute("hidden", "hidden");
    dom.mediaModal?.setAttribute("hidden", "hidden");
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("No se pudo leer el archivo seleccionado."));
      reader.readAsDataURL(file);
    });
  }

  function handleMediaInputChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      if (dom.mediaStatus) dom.mediaStatus.textContent = "Selecciona un archivo de imagen válido.";
      event.target.value = "";
      state.media.file = null;
      return;
    }

    state.media.file = file;
    if (dom.mediaFilename) dom.mediaFilename.textContent = file.name;
    if (dom.mediaStatus) dom.mediaStatus.textContent = "";

    revokeMediaObjectUrl();
    state.media.objectUrl = window.URL.createObjectURL(file);
    if (dom.mediaPreview) dom.mediaPreview.src = state.media.objectUrl;
  }

  async function syncMediaWithApi(mode, file) {
    if (!window.KCTouristApi?.profile) return;

    const formData = new FormData();
    formData.append("file", file);

    if (mode === "cover") {
      if (!window.KCTouristApi.profile.uploadCover) return;
      formData.append("cover", file);
      await window.KCTouristApi.profile.uploadCover(formData);
      return;
    }

    if (!window.KCTouristApi.profile.uploadAvatar) return;
    formData.append("avatar", file);
    await window.KCTouristApi.profile.uploadAvatar(formData);
  }

  async function handleMediaSave() {
    if (!state.media.mode) return;
    if (!state.media.file) {
      if (dom.mediaStatus) dom.mediaStatus.textContent = "Selecciona una imagen antes de guardar.";
      return;
    }

    dom.mediaSave?.setAttribute("disabled", "disabled");
    if (dom.mediaStatus) dom.mediaStatus.textContent = "Guardando imagen...";

    try {
      const encodedImage = await fileToDataUrl(state.media.file);

      if (state.media.mode === "cover") {
        state.profile.cover = encodedImage;
      } else {
        state.profile.avatar = encodedImage;
      }

      persistProfile(state.profile);
      renderProfile();

      try {
        await syncMediaWithApi(state.media.mode, state.media.file);
      } catch (apiError) {
        console.warn("No se pudo sincronizar la imagen con API. Se mantiene actualización local.", apiError);
      }

      closeMediaModal();
    } catch (error) {
      if (dom.mediaStatus) dom.mediaStatus.textContent = error.message;
    } finally {
      dom.mediaSave?.removeAttribute("disabled");
    }
  }

  function setupActions() {
    dom.btnEditProfileNav?.addEventListener("click", () => {
      window.location.href = "./profileTouristEdit.html";
    });

    dom.btnCardEdit?.addEventListener("click", () => {
      openMediaModal("cover");
    });

    dom.btnAvatarEdit?.addEventListener("click", () => openMediaModal("avatar"));
    dom.mediaInput?.addEventListener("change", handleMediaInputChange);
    dom.mediaSave?.addEventListener("click", handleMediaSave);
    dom.mediaCancel?.addEventListener("click", closeMediaModal);
    dom.mediaClose?.addEventListener("click", closeMediaModal);
    dom.mediaBackdrop?.addEventListener("click", closeMediaModal);

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMediaModal();
    });

    dom.btnChat?.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("tourist-chat:open"));
    });
  }

  function bind() {
    dom.avatar = document.getElementById("profileAvatar");
    dom.cover = document.getElementById("profileCover");
    dom.name = document.getElementById("profileName");
    dom.location = document.getElementById("profileLocation");
    dom.memberSince = document.getElementById("profileMemberSince");
    dom.badge = document.getElementById("profileBadge");
    dom.bio = document.getElementById("profileBio");
    dom.interests = document.getElementById("profileInterests");
    dom.travelStyle = document.getElementById("profileTravelStyle");
    dom.tripType = document.getElementById("profileTripType");
    dom.languages = document.getElementById("profileLanguages");
    dom.paceAndCompany = document.getElementById("profilePaceAndCompany");
    dom.activityLevel = document.getElementById("profileActivityLevel");
    dom.groupPreference = document.getElementById("profileGroupPreference");
    dom.dietaryPreferences = document.getElementById("profileDietaryPreferences");
    dom.planningLevel = document.getElementById("profilePlanningLevel");
    dom.amenities = document.getElementById("profileAmenities");
    dom.transport = document.getElementById("profileTransport");
    dom.photoPreference = document.getElementById("profilePhotoPreference");
    dom.accessibility = document.getElementById("profileAccessibility");
    dom.additionalNotes = document.getElementById("profileAdditionalNotes");
    dom.history = document.getElementById("profileHistory");
    dom.btnChat = document.getElementById("btnChat");
    dom.btnEditProfileNav = document.getElementById("btnEditProfileNav");
    dom.btnCardEdit = document.getElementById("profileCardEditBtn");
    dom.btnAvatarEdit = document.getElementById("profileAvatarEditBtn");
    dom.mediaModal = document.getElementById("profileMediaModal");
    dom.mediaBackdrop = document.getElementById("profileMediaBackdrop");
    dom.mediaTitle = document.getElementById("profileMediaModalTitle");
    dom.mediaHint = document.getElementById("profileMediaModalHint");
    dom.mediaInput = document.getElementById("profileMediaInput");
    dom.mediaPreview = document.getElementById("profileMediaPreview");
    dom.mediaFilename = document.getElementById("profileMediaFilename");
    dom.mediaStatus = document.getElementById("profileMediaStatus");
    dom.mediaSave = document.getElementById("profileMediaSave");
    dom.mediaCancel = document.getElementById("profileMediaCancel");
    dom.mediaClose = document.getElementById("profileMediaClose");
  }

  async function init() {
    bind();
    setupActions();
    renderLoadingState();
    state.profile = readProfileFromStorage();
    await hydrateFromApi();
    renderProfile();
    renderHistory();
  }

  return { init };
})();

const bootstrapTouristProfile = () => {
  const run = () => TouristProfileApp.init();
  const sidebarReady = window.__touristSidebarReadyPromise;

  if (sidebarReady && typeof sidebarReady.finally === "function") {
    sidebarReady.finally(run);
    return;
  }

  run();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrapTouristProfile, { once: true });
} else {
  bootstrapTouristProfile();
}
