(function () {
  const sidebarReadyResolvers = [];
  const sidebarReadyPromise = new Promise((resolve) => {
    sidebarReadyResolvers.push(resolve);
  });

  window.__touristSidebarReadyPromise = sidebarReadyPromise;

  function emitSidebarReady() {
    while (sidebarReadyResolvers.length) {
      const resolve = sidebarReadyResolvers.pop();
      resolve?.();
    }
    document.dispatchEvent(new CustomEvent("tourist-sidebar:ready"));
  }

  async function fetchMarkup(path) {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("No se pudo cargar componente: " + path);
    }
    return response.text();
  }

  function normalizePrefix(prefix) {
    if (!prefix) return "";
    return prefix.endsWith("/") ? prefix : prefix + "/";
  }

  function hydrateSidebar(sidebar, activeKey, pagesPrefix, assetsPrefix) {
    const links = sidebar.querySelectorAll("[data-href]");
    links.forEach((link) => {
      const target = link.getAttribute("data-href");
      if (target) {
        link.setAttribute("href", normalizePrefix(pagesPrefix) + target);
      }
    });

    const logo = sidebar.querySelector("[data-asset-path]");
    if (logo) {
      const assetPath = logo.getAttribute("data-asset-path");
      logo.setAttribute("src", normalizePrefix(assetsPrefix) + assetPath);
    }

    if (activeKey) {
      const active = sidebar.querySelector(`[data-nav-key="${activeKey}"]`);
      if (active) active.classList.add("sidebar__link--active");
    }
  }

  function isMobileDrawerMode() {
    return window.matchMedia("(max-width: 767px)").matches;
  }

  function createMobileSidebarFallbackToggle() {
    const button = document.createElement("button");
    button.className = "tourist-sidebar-toggle";
    button.type = "button";
    button.setAttribute("aria-label", "Abrir menú");
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = '<span class="material-symbols-outlined">menu</span>';
    document.body.appendChild(button);
    return button;
  }

  function setupResponsiveSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    const triggers = [
      ...document.querySelectorAll(
        "#btnSidebar, .topbar__menu-btn, .menu-button, [data-sidebar-open]",
      ),
    ];

    if (!triggers.length) {
      triggers.push(createMobileSidebarFallbackToggle());
    }

    let backdrop = document.getElementById("backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "backdrop";
      backdrop.id = "touristSidebarBackdrop";
      backdrop.hidden = true;
      document.body.appendChild(backdrop);
    }

    const setExpanded = (value) => {
      triggers.forEach((trigger) => {
        trigger.setAttribute("aria-expanded", value ? "true" : "false");
      });
    };

    const openSidebar = () => {
      if (!isMobileDrawerMode()) return;
      sidebar.classList.add("sidebar--open");
      backdrop.hidden = false;
      setExpanded(true);
    };

    const closeSidebar = () => {
      sidebar.classList.remove("sidebar--open");
      backdrop.hidden = true;
      setExpanded(false);
    };

    const toggleSidebar = (event) => {
      event?.preventDefault();
      if (!isMobileDrawerMode()) return;
      const isOpen = sidebar.classList.contains("sidebar--open");
      isOpen ? closeSidebar() : openSidebar();
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", toggleSidebar);
    });

    backdrop.addEventListener("click", closeSidebar);

    window.addEventListener("resize", () => {
      if (!isMobileDrawerMode()) closeSidebar();
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeSidebar();
    });
  }

  async function mountSidebar() {
    const mount = document.querySelector("[data-tourist-sidebar]");
    if (!mount) {
      emitSidebarReady();
      return;
    }

    try {
      const componentPath = mount.getAttribute("data-component-path");
      const pagesPrefix = mount.getAttribute("data-pages-prefix") || "";
      const assetsPrefix = mount.getAttribute("data-assets-prefix") || "";
      const activeKey = mount.getAttribute("data-tourist-active") || "";
      const markup = await fetchMarkup(componentPath);

      mount.insertAdjacentHTML("beforebegin", markup);
      mount.remove();

      const sidebar = document.getElementById("sidebar");
      if (sidebar) {
        hydrateSidebar(sidebar, activeKey, pagesPrefix, assetsPrefix);
      }
    } catch (error) {
      console.error(error);
    } finally {
      emitSidebarReady();
    }
  }

  function renderMessages(messagesEl, messages) {
    messagesEl.innerHTML = messages
      .map(
        (item) =>
          `<div class="guide-chat__bubble guide-chat__bubble--${item.from}">${item.text}</div>`,
      )
      .join("");
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setupChatWidget(container) {
    const root = container.querySelector("[data-guide-chat]");
    if (!root) return;

    const panel = root.querySelector(".guide-chat__panel");
    const launcher = root.querySelector(".guide-chat__launcher");
    const closeBtn = root.querySelector(".guide-chat__close");
    const threads = [...root.querySelectorAll(".guide-chat__thread")];
    const messagesEl = root.querySelector("[data-guide-chat-messages]");
    const form = root.querySelector("[data-guide-chat-form]");
    const input = form?.querySelector(".guide-chat__input");

    const threadData = {
      maria: [
        { from: "guest", text: "Hola, me gustaría confirmar el punto de encuentro." },
        { from: "guide", text: "Claro, te comparto la ubicación exacta en un momento." },
      ],
      alejandro: [
        { from: "guest", text: "Gracias por la recomendación del itinerario." },
        { from: "guide", text: "Con gusto. Si quieres ajustamos horarios." },
      ],
    };

    let activeThread = "maria";
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const CHAT_ANIMATION_MS = prefersReducedMotion ? 0 : 340;
    let closeTimer = null;

    const clearCloseTimer = () => {
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }
    };

    const openChat = () => {
      clearCloseTimer();
      panel.removeAttribute("hidden");
      panel.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => {
        root.classList.add("guide-chat--open");
      });
      input?.focus();
    };

    const closeChat = () => {
      clearCloseTimer();
      root.classList.remove("guide-chat--open");
      panel.setAttribute("aria-hidden", "true");
      closeTimer = window.setTimeout(() => {
        if (!root.classList.contains("guide-chat--open")) {
          panel.setAttribute("hidden", "hidden");
        }
      }, CHAT_ANIMATION_MS);
    };

    const setThread = (threadKey) => {
      activeThread = threadKey;
      threads.forEach((thread) => {
        thread.classList.toggle("is-active", thread.dataset.thread === threadKey);
      });
      renderMessages(messagesEl, threadData[threadKey] || []);
    };

    launcher?.addEventListener("click", () => {
      const isOpen = root.classList.contains("guide-chat--open");
      isOpen ? closeChat() : openChat();
    });

    const handleClose = (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeChat();
    };

    closeBtn?.addEventListener("pointerdown", handleClose);
    closeBtn?.addEventListener("click", handleClose);

    threads.forEach((thread) => {
      thread.addEventListener("click", () => {
        setThread(thread.dataset.thread);
        openChat();
      });
    });

    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = input?.value.trim();
      if (!text) return;

      const collection = threadData[activeThread] || [];
      // Reusa bubble "guide" (naranja) para mensajes salientes.
      collection.push({ from: "guide", text });
      threadData[activeThread] = collection;
      renderMessages(messagesEl, collection);
      input.value = "";
    });

    window.addEventListener("tourist-chat:open", openChat);
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeChat();
    });

    const extraOpeners = document.querySelectorAll(
      "#btnChat, [aria-label='Chat'], [data-open-tourist-chat]",
    );
    extraOpeners.forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        openChat();
      });
    });

    root.classList.remove("guide-chat--open");
    panel.setAttribute("aria-hidden", "true");
    panel.setAttribute("hidden", "hidden");
    setThread(activeThread);
  }

  async function mountChatWidget() {
    const mount = document.querySelector("[data-tourist-chat-widget]");
    if (!mount) return;

    try {
      const componentPath = mount.getAttribute("data-component-path");
      const markup = await fetchMarkup(componentPath);
      mount.insertAdjacentHTML("beforebegin", markup);
      mount.remove();
      setupChatWidget(document);
    } catch (error) {
      console.error(error);
    }
  }

  function createNotificationsPopover() {
    const panel = document.createElement("section");
    panel.className = "guide-notifications";
    panel.setAttribute("hidden", "hidden");
    panel.setAttribute("aria-label", "Notificaciones");
    panel.innerHTML = `
      <header class="guide-notifications__header">
        <p class="guide-notifications__title">Notificaciones</p>
        <span class="guide-notifications__count">0</span>
      </header>
      <ul class="guide-notifications__list"></ul>
    `;
    document.body.appendChild(panel);
    return panel;
  }

  function setupNotifications() {
    const triggers = [
      ...document.querySelectorAll(
        "#btnNotif, .topbar__notif, .notification-button, [data-notifications-trigger]",
      ),
    ];
    if (!triggers.length) return;

    const panel = createNotificationsPopover();
    const countEl = panel.querySelector(".guide-notifications__count");
    const listEl = panel.querySelector(".guide-notifications__list");
    let isOpen = false;
    let notifications = [
      { id: "ntf_1", title: "Tienes una nueva propuesta de viaje", meta: "Hace 5 min", read: false },
      { id: "ntf_2", title: "Un guía respondió tu consulta", meta: "Hace 22 min", read: false },
      { id: "ntf_3", title: "Actualización de reserva", meta: "Hace 1 h", read: true },
    ];

    const renderNotifications = () => {
      const unreadCount = notifications.filter((item) => !item.read).length;
      if (countEl) countEl.textContent = String(unreadCount);
      if (!listEl) return;

      listEl.innerHTML = notifications
        .map(
          (item) => `
            <li class="guide-notifications__item" data-notification-id="${item.id}">
              <p class="guide-notifications__item-title">${item.title}</p>
              <p class="guide-notifications__item-meta">${item.meta}</p>
            </li>
          `,
        )
        .join("");
    };

    const mapNotification = (item) => ({
      id: item.id,
      title: item.title || item.message || "Notificación",
      meta: item.dateLabel || item.relativeTime || "Reciente",
      read: Boolean(item.read || item.isRead),
    });

    const hydrateNotificationsFromApi = async () => {
      // TODO(API): reemplazar polling por websocket cuando backend lo habilite.
      if (!window.KCTouristApi) return;
      try {
        const response = await window.KCTouristApi.notifications.list();
        const items = response?.data?.items || response?.data || [];
        if (Array.isArray(items)) {
          notifications = items.map(mapNotification);
          renderNotifications();
        }
      } catch (error) {
        console.warn("Notifications API fallback enabled:", error);
      }
    };

    const placePanel = (trigger) => {
      const rect = trigger.getBoundingClientRect();
      const panelWidth = 320;
      const left = Math.max(
        12,
        Math.min(window.innerWidth - panelWidth - 12, rect.right - panelWidth),
      );
      const top = rect.bottom + 10;
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    };

    const open = async (trigger) => {
      placePanel(trigger);
      panel.removeAttribute("hidden");
      panel.classList.add("guide-notifications--open");
      isOpen = true;
      await hydrateNotificationsFromApi();
      renderNotifications();
    };

    const close = () => {
      panel.classList.remove("guide-notifications--open");
      panel.setAttribute("hidden", "hidden");
      isOpen = false;
    };

    const markAsRead = async (notificationId) => {
      const target = notifications.find((item) => item.id === notificationId);
      if (!target || target.read) return;
      target.read = true;
      renderNotifications();
      try {
        if (window.KCTouristApi) {
          await window.KCTouristApi.notifications.markAsRead(notificationId);
        }
      } catch (error) {
        console.warn("Mark notification as read pending backend implementation:", error);
      }
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (isOpen) {
          close();
          return;
        }
        open(trigger);
      });
    });

    panel.addEventListener("click", (event) => {
      const item = event.target.closest("[data-notification-id]");
      if (item) {
        markAsRead(item.getAttribute("data-notification-id"));
      }
      event.stopPropagation();
    });

    window.addEventListener("resize", () => {
      if (!isOpen) return;
      const firstTrigger = triggers[0];
      if (firstTrigger) placePanel(firstTrigger);
    });

    document.addEventListener("click", close);
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });

    renderNotifications();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await mountSidebar();
    setupResponsiveSidebar();
    await mountChatWidget();
    setupNotifications();
  });
})();
