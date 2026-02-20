(function () {
  const ONBOARDING_STORAGE_KEY = "match_profile_v2";

  // TODO(BACKEND): poner en false cuando /auth/register este disponible y estable.
  const ALLOW_REGISTER_FLOW_WITHOUT_BACKEND = true;

  const dom = {
    modal: null,
    title: null,
    tabs: [],
    views: new Map(),
    closeTriggers: [],
  };

  let previousBodyOverflow = "";
  let activeType = "login";
  let registerFormRef = null;

  async function fetchMarkup(path) {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("No se pudo cargar el formulario: " + path);
    }
    return response.text();
  }

  function extractFragment(markup) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(markup, "text/html");
    const fragment = doc.querySelector("[data-auth-fragment]");
    return fragment ? fragment.outerHTML : markup;
  }

  function buildModal() {
    const wrapper = document.createElement("div");
    wrapper.className = "auth-modal";
    wrapper.setAttribute("data-auth-modal", "");
    wrapper.setAttribute("aria-hidden", "true");
    wrapper.innerHTML = `
      <div class="auth-modal__backdrop" data-auth-close></div>
      <section class="auth-modal__panel" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <header class="auth-modal__header">
          <h2 class="auth-modal__title" id="auth-modal-title">Accede a Kin Conecta</h2>
          <button class="auth-modal__close" type="button" aria-label="Cerrar" data-auth-close>
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>

        <nav class="auth-modal__tabs" aria-label="Tipo de acceso">
          <button class="auth-modal__tab is-active" type="button" data-auth-tab="login">Iniciar sesión</button>
          <button class="auth-modal__tab" type="button" data-auth-tab="register">Registrarse</button>
        </nav>

        <div class="auth-modal__body">
          <div class="auth-modal__view" data-auth-view="login"></div>
          <div class="auth-modal__view" data-auth-view="register" hidden></div>
        </div>
      </section>
    `;

    document.body.appendChild(wrapper);
    dom.modal = wrapper;
    dom.title = wrapper.querySelector("#auth-modal-title");
    dom.tabs = [...wrapper.querySelectorAll("[data-auth-tab]")];
    dom.closeTriggers = [...wrapper.querySelectorAll("[data-auth-close]")];
    dom.views.set("login", wrapper.querySelector('[data-auth-view="login"]'));
    dom.views.set("register", wrapper.querySelector('[data-auth-view="register"]'));
  }

  function showFeedback(form, message, isSuccess) {
    const feedback = form.querySelector("[data-auth-feedback]");
    if (!feedback) return;
    feedback.textContent = message || "";
    feedback.classList.toggle("is-success", Boolean(isSuccess));
  }

  function clearRegisterRoleSelection(form) {
    if (!form) return;
    const roleButtons = [...form.querySelectorAll("[data-register-role]")];
    const hiddenRoleInput = form.querySelector('input[name="accountRole"]');
    if (hiddenRoleInput) hiddenRoleInput.value = "";
    roleButtons.forEach((button) => button.classList.remove("is-selected"));
  }

  function resetRegisterForm(form) {
    if (!form) return;
    form.reset();
    clearRegisterRoleSelection(form);
    showFeedback(form, "");
  }

  function setView(type, options) {
    const config = options || {};
    activeType = type === "register" ? "register" : "login";

    dom.tabs.forEach((tab) => {
      const selected = tab.getAttribute("data-auth-tab") === activeType;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
    });

    dom.views.forEach((view, key) => {
      view.hidden = key !== activeType;
    });

    if (dom.title) {
      dom.title.textContent =
        activeType === "register" ? "Crear cuenta en Kin Conecta" : "Accede a Kin Conecta";
    }

    if (activeType === "register" && config.resetRegisterForm) {
      resetRegisterForm(registerFormRef);
    }
  }

  function openModal(type, options) {
    const config = options || {};
    const shouldResetRegisterForm =
      typeof config.resetRegisterForm === "boolean"
        ? config.resetRegisterForm
        : type === "register";

    setView(type, { resetRegisterForm: shouldResetRegisterForm });
    previousBodyOverflow = document.body.style.overflow;
    dom.modal.classList.add("auth-modal--open");
    dom.modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!dom.modal) return;
    dom.modal.classList.remove("auth-modal--open");
    dom.modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = previousBodyOverflow;
  }

  function getAuthService() {
    return window.KCAuthApi?.auth || null;
  }

  function normalizeAccountRole(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (raw === "guide") return "guide";
    if (raw === "tourist" || raw === "traveler") return "tourist";
    return "";
  }

  function mapAccountRoleToProfilerRole(role) {
    return role === "guide" ? "guide" : "traveler";
  }

  function normalizePhone(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function resolveProfilerWizardPath() {
    const path = String(window.location.pathname || "").replace(/\\/g, "/").toLowerCase();
    if (path.includes("/frontend/src/pages/")) {
      return "./profiler/profiles-wizard.html";
    }
    return "./frontend/src/pages/profiler/profiles-wizard.html";
  }

  function seedProfilerState(payload) {
    const role = mapAccountRoleToProfilerRole(payload.accountRole);
    const phoneNumber = normalizePhone(payload.phoneNumber);

    let parsed = null;
    try {
      parsed = JSON.parse(localStorage.getItem(ONBOARDING_STORAGE_KEY) || "null");
    } catch (_error) {
      parsed = null;
    }

    const currentId = Number(parsed?.controller?.currentId || 0);
    const items = Array.isArray(parsed?.controller?.items) ? parsed.controller.items : [];
    const answers =
      parsed?.answers && typeof parsed.answers === "object"
        ? {
            traveler:
              parsed.answers.traveler && typeof parsed.answers.traveler === "object"
                ? parsed.answers.traveler
                : {},
            guide:
              parsed.answers.guide && typeof parsed.answers.guide === "object"
                ? parsed.answers.guide
                : {},
          }
        : { traveler: {}, guide: {} };

    answers[role] = {};

    const nextId = currentId + 1;
    const now = new Date().toISOString();
    const profile = {
      id: nextId,
      role,
      meta: {
        name: payload.fullName,
        img: "",
        description: "",
        email: payload.email,
        dateOfBirth: "",
        phoneCountryCode: payload.countryCode,
        phoneNumber,
        phoneE164: `${payload.countryCode}${phoneNumber}`,
      },
      answers: {},
      createdAt: now,
      updatedAt: now,
    };

    localStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({
        role,
        stepIndex: 0,
        answers,
        currentProfileId: nextId,
        controller: {
          currentId: nextId,
          items: [...items, profile],
        },
      }),
    );
  }

  function openOnboardingFlow(payload) {
    const profilerRole = mapAccountRoleToProfilerRole(payload.accountRole);
    localStorage.setItem("kcOnboardingRole", profilerRole);
    seedProfilerState(payload);
    closeModal();

    if (window.KCOnboardingModal?.open) {
      window.KCOnboardingModal.open(profilerRole);
      return;
    }

    const wizardPath = resolveProfilerWizardPath();
    window.location.href = `${wizardPath}?embed=1&role=${encodeURIComponent(profilerRole)}`;
  }

  function setupRegisterRoleSelection(form) {
    if (!form) return;
    const roleButtons = [...form.querySelectorAll("[data-register-role]")];
    const hiddenRoleInput = form.querySelector('input[name="accountRole"]');
    if (!hiddenRoleInput || !roleButtons.length) return;

    roleButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const selectedRole = normalizeAccountRole(button.getAttribute("data-register-role"));
        hiddenRoleInput.value = selectedRole;
        roleButtons.forEach((item) => {
          item.classList.toggle("is-selected", item === button);
        });
        showFeedback(form, "");
      });
    });
  }

  async function handleLogin(form) {
    const data = new FormData(form);
    const payload = {
      email: String(data.get("email") || "").trim(),
      password: String(data.get("password") || ""),
    };

    if (!payload.email || !payload.password) {
      showFeedback(form, "Escribe tu correo y contraseña.");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const service = getAuthService();
      if (!service?.login) {
        throw new Error("login-api-unavailable");
      }

      const result = await service.login(payload);
      const token = result?.data?.token;
      if (token) localStorage.setItem("kcAuthToken", token);

      showFeedback(form, "Sesión iniciada correctamente.", true);
      window.setTimeout(closeModal, 420);
    } catch (error) {
      if (error?.message === "login-api-unavailable") {
        console.warn("KCAuthApi.auth.login no está disponible.");
      } else {
        console.error(error);
      }
      showFeedback(form, "No fue posible iniciar sesión. Verifica tus datos.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  async function handleRegister(form) {
    const data = new FormData(form);
    const payload = {
      accountRole: normalizeAccountRole(data.get("accountRole")),
      fullName: String(data.get("fullName") || "").trim(),
      countryCode: String(data.get("countryCode") || "").trim(),
      phoneNumber: normalizePhone(data.get("phoneNumber")),
      email: String(data.get("email") || "").trim(),
      password: String(data.get("password") || ""),
      confirmPassword: String(data.get("confirmPassword") || ""),
    };

    if (!payload.accountRole) {
      showFeedback(form, "Debes seleccionar si te registras como turista o guía.");
      return;
    }

    if (!payload.fullName || payload.fullName.length < 3) {
      showFeedback(form, "Escribe tu nombre completo.");
      return;
    }

    if (!payload.countryCode) {
      showFeedback(form, "Selecciona tu clave LADA.");
      return;
    }

    if (!payload.phoneNumber || payload.phoneNumber.length < 7 || payload.phoneNumber.length > 15) {
      showFeedback(form, "Escribe un teléfono válido.");
      return;
    }

    if (!payload.email || !payload.password || !payload.confirmPassword) {
      showFeedback(form, "Completa todos los campos obligatorios.");
      return;
    }

    if (payload.password.length < 8) {
      showFeedback(form, "La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (payload.password !== payload.confirmPassword) {
      showFeedback(form, "Las contraseñas no coinciden.");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      // TODO(BACKEND): este bloque debe registrar al usuario en la API real.
      const service = getAuthService();
      if (!service?.register) {
        throw new Error("register-api-unavailable");
      }

      await service.register({
        role: payload.accountRole,
        fullName: payload.fullName,
        countryCode: payload.countryCode,
        phoneNumber: payload.phoneNumber,
        email: payload.email,
        password: payload.password,
      });

      showFeedback(form, "Cuenta creada correctamente.", true);
      window.setTimeout(() => openOnboardingFlow(payload), 280);
    } catch (error) {
      if (!ALLOW_REGISTER_FLOW_WITHOUT_BACKEND) {
        if (error?.message === "register-api-unavailable") {
          console.warn("KCAuthApi.auth.register no está disponible.");
        } else {
          console.error(error);
        }
        showFeedback(form, "No fue posible completar el registro.");
      } else {
        // TODO(BACKEND): eliminar este fallback cuando el endpoint real de registro esté activo.
        console.warn("Registro en modo prueba (sin backend).", error);
        showFeedback(form, "Modo prueba: continuando sin registro real.", true);
        window.setTimeout(() => openOnboardingFlow(payload), 280);
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  function setupFormHandlers() {
    const loginForm = dom.views.get("login")?.querySelector('[data-auth-form="login"]');
    const registerForm = dom.views.get("register")?.querySelector('[data-auth-form="register"]');

    registerFormRef = registerForm || null;
    setupRegisterRoleSelection(registerFormRef);

    loginForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      handleLogin(loginForm);
    });

    registerForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      handleRegister(registerForm);
    });
  }

  function bindModalEvents() {
    dom.tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const type = tab.getAttribute("data-auth-tab");
        setView(type, { resetRegisterForm: type === "register" });
      });
    });

    dom.closeTriggers.forEach((trigger) => {
      trigger.addEventListener("click", closeModal);
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeModal();
    });

    const openTriggers = [...document.querySelectorAll("[data-auth-open]")];
    openTriggers.forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        const type = trigger.getAttribute("data-auth-open");
        openModal(type);
      });
    });
  }

  async function mountAndInit() {
    const mount = document.querySelector("[data-auth-modal-mount]");
    if (!mount) return;

    const loginPath = mount.getAttribute("data-login-path");
    const registerPath = mount.getAttribute("data-register-path");
    if (!loginPath || !registerPath) return;

    try {
      const [loginMarkup, registerMarkup] = await Promise.all([
        fetchMarkup(loginPath),
        fetchMarkup(registerPath),
      ]);

      buildModal();
      dom.views.get("login").innerHTML = extractFragment(loginMarkup);
      dom.views.get("register").innerHTML = extractFragment(registerMarkup);
      setupFormHandlers();
      bindModalEvents();
    } catch (error) {
      console.error(error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAndInit, { once: true });
  } else {
    mountAndInit();
  }

  window.KCAuthModal = {
    openLogin(options) {
      openModal("login", options);
    },
    openRegister(options) {
      openModal("register", options);
    },
    close: closeModal,
  };
})();
