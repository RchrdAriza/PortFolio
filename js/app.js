/**
 * Función global para el sidebar.
 * Se debe declarar globalmente para que onclick="toggleSidebar(this)" en el HTML la encuentre.
 */
function toggleSidebar(header) {
  // El ícono de flecha dentro del encabezado en el que se hizo clic
  const icon = header.querySelector(".icon");
  // El contenedor de items que es el siguiente hermano del encabezado
  const items = header.nextElementSibling;

  // Alterna la clase 'collapsed' para rotar la flecha
  if (icon) {
    icon.classList.toggle("collapsed");
  }

  // Alterna la clase 'collapsed' para mostrar/ocultar el contenido
  if (items && items.classList.contains("sidebar-items")) {
    items.classList.toggle("collapsed");

    // Ajusta la altura máxima para la animación suave
    if (items.classList.contains("collapsed")) {
      items.style.maxHeight = "0px";
    } else {
      // scrollHeight da la altura total del contenido, incluso si está oculto
      items.style.maxHeight = items.scrollHeight + "px";
    }
  }
}

// --- Lógica de Carga de Página ---
document.addEventListener("DOMContentLoaded", () => {
  // --- Lógica de Menú Hamburguesa (Global) ---
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("nav");
  if (navToggle) {
    navToggle.addEventListener("click", () => {
      nav.classList.toggle("nav-open");
    });
  }

  // --- Lógica de Typewriter (se ejecuta en CUALQUIER página que la tenga) ---
  // ... (Tu código de typewriter original va aquí, no es necesario copiarlo de nuevo si ya lo tienes)
  const subtitleElement = document.querySelector(".hello-page .subtitle");

  if (subtitleElement) {
    // Determina qué texto escribir basándose en el ID de la sección padre
    let textToType = "Developer"; // Default para la página de Hello
    const parentSection = subtitleElement.closest(".page-content");

    if (parentSection && parentSection.id === "contact") {
      textToType = "Let's connect";
    }

    let charIndex = 0;
    let isDeleting = false;

    function typeWriter() {
      const currentText = textToType.substring(0, charIndex);
      subtitleElement.textContent = `> ${currentText}`;
      subtitleElement.classList.add("typing");

      if (!isDeleting && charIndex < textToType.length) {
        charIndex++;
        setTimeout(typeWriter, 150);
      } else if (isDeleting && charIndex > 0) {
        charIndex--;
        setTimeout(typeWriter, 100);
      } else {
        isDeleting = !isDeleting;
        setTimeout(typeWriter, 1200);
      }
    }
    setTimeout(typeWriter, 500);
  }

  // --- NUEVO CÓDIGO: Lógica de Fondo de Navegación ---

  const navElement = document.querySelector("nav");
  const footerElement = document.querySelector("footer");
  const mainElement = document.querySelector("main"); // El <main> que contiene tus .page-content

  // 1. Función para actualizar el fondo
  function updateNavFooterBackground(activePageId) {
    if (activePageId === "hello") {
      // Si la página activa es 'hello', quita el fondo sólido
      navElement.classList.remove("solid-background");
      footerElement.classList.remove("solid-background");
    } else {
      // Para CUALQUIER OTRA página, añade el fondo sólido
      navElement.classList.add("solid-background");
      footerElement.classList.add("solid-background");
    }
  }

  // 2. Comprobar el estado inicial al cargar la página
  const initiallyActivePage = document.querySelector(".page-content.active");
  if (initiallyActivePage) {
    updateNavFooterBackground(initiallyActivePage.id);
  }

  // 3. Crear un "Observador" que vigile los cambios en <main>
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      // Si un atributo (como 'class') cambió
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        const targetElement = mutation.target;

        // Y el elemento que cambió es una .page-content y AHORA está .active
        if (
          targetElement.classList.contains("page-content") &&
          targetElement.classList.contains("active")
        ) {
          // Actualizamos el fondo basándonos en el ID de esta página
          updateNavFooterBackground(targetElement.id);
        }
      }
    }
  });

  // 4. Iniciar el observador
  if (mainElement) {
    // Le decimos que observe el <main> y a todos sus hijos (subtree: true)
    // por cambios en sus atributos (attributes: true)
    observer.observe(mainElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ["class"],
    });
  }
});
