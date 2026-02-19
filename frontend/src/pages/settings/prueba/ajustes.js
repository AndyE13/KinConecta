/**
 * Kin Conecta - Lógica Unificada de Ajustes
 * Este archivo gestiona:
 * 1. Persistencia de Idioma (localStorage)
 * 2. Adaptación de interfaz según Rol (Guía/Turista)
 * 3. Funcionalidades de formulario (Contador de bio, guardado)
 */

document.addEventListener('DOMContentLoaded', () => {
    // === CONFIGURACIÓN INICIAL ===
    const userRole = localStorage.getItem('userRole') || 'turista';
    const currentLang = localStorage.getItem('appLanguage') || 'es';

    // === 1. LÓGICA PARA LENGUAGE.HTML ===
    const saveLanguageBtn = document.getElementById("saveLanguage");
    const languageSearch = document.getElementById("languageSearch");
    const languageItems = document.querySelectorAll(".lang-option");

    if (saveLanguageBtn) {
        // Marcar el radio button del idioma guardado actualmente
        const radioToCheck = document.querySelector(`input[value="${currentLang}"]`);
        if (radioToCheck) radioToCheck.checked = true;

        // Filtro de búsqueda de idiomas
        if (languageSearch) {
            languageSearch.addEventListener("input", (e) => {
                const term = e.target.value.toLowerCase();
                languageItems.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    item.style.display = text.includes(term) ? "flex" : "none";
                });
            });
        }

        // Guardar selección de idioma
        saveLanguageBtn.addEventListener("click", () => {
            const selected = document.querySelector('input[name="language"]:checked');
            if (selected) {
                localStorage.setItem('appLanguage', selected.value);
                alert("Idioma actualizado / Language updated: " + selected.value.toUpperCase());
                // Opcional: Redirigir al inicio después de guardar
                // window.location.href = '../inicio.html';
            }
        });
    }

    // === 2. LÓGICA PARA AJUSTESPERFIL.HTML ===
    const profileForm = document.getElementById("profileForm");
    const bioTextarea = document.getElementById("bio");
    const charCounter = document.getElementById("counter");
    const turistaFields = document.getElementById("turista-fields");
    const guiaFields = document.getElementById("guia-fields");
    const pageTitle = document.getElementById("pageTitle");
    const sidebarLogo = document.getElementById("sidebarLogo");

    if (profileForm) {
        // A) Adaptar vista según Rol
        if (userRole === 'guia') {
            if (guiaFields) guiaFields.style.display = 'block';
            if (turistaFields) turistaFields.style.display = 'none';
            if (pageTitle) pageTitle.innerText = "Ajustes de Perfil Guía";
            if (sidebarLogo) {
                sidebarLogo.innerHTML = `<span class="material-symbols-outlined">verified_user</span> Kin Guía`;
            }
        } else {
            if (turistaFields) turistaFields.style.display = 'block';
            if (guiaFields) guiaFields.style.display = 'none';
            if (pageTitle) pageTitle.innerText = "Ajustes de Perfil Turista";
        }

        // B) Contador de caracteres para la Biografía
        if (bioTextarea && charCounter) {
            bioTextarea.addEventListener("input", () => {
                const length = bioTextarea.value.length;
                charCounter.textContent = `${length}/250 caracteres`;
            });
        }

        // C) Manejo del botón Guardar Perfil
        const saveProfileBtn = document.getElementById("saveProfile");
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener("click", (e) => {
                e.preventDefault();
                const formData = new FormData(profileForm);
                const data = Object.fromEntries(formData.entries());
                
                // Aquí conectarías con tu base de datos en el futuro
                console.log("Datos de " + userRole + " listos para enviar:", data);
                alert("¡Tus cambios han sido guardados con éxito!");
            });
        }
    }

    // Ejecutar traducción básica al cargar
    traducirPagina();
});

/**
 * Función global para aplicar el idioma guardado.
 * Se puede llamar desde cualquier parte de la app.
 */
function traducirPagina() {
    const lang = localStorage.getItem('appLanguage') || 'es';
    console.log("Sistema Kin Conecta operando en modo:", lang.toUpperCase());
    
    // Aquí podrías implementar una lógica que busque elementos con [data-i18n]
    // y reemplace su texto usando un archivo JSON de traducciones.
}