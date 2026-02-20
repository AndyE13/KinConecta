(function () {
  const api = window.KCApiClient;

  if (!api) {
    console.warn("KCApiClient no esta disponible. Carga http-client.js antes de auth-api-services.js");
    return;
  }

  const endpoints = {
    login: "/auth/login",
    register: "/auth/register",
  };

  const auth = {
    login: (payload) => api.post(endpoints.login, payload),
    register: (payload) => api.post(endpoints.register, payload),
  };

  window.KCAuthApi = {
    endpoints,
    auth,
  };
})();
