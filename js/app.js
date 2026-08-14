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

// Genera los números de línea dinámicamente según las <p> del panel activo
function updateLineNumbers() {
  const lineNumbersEl = document.getElementById("line-numbers");
  const activePanel = document.querySelector(".code-content-panel.active");
  if (!lineNumbersEl || !activePanel) return;

  // Ocultar números de línea si es el panel de la cuadrícula de proyectos
  if (activePanel.id === "projects-grid-panel") {
    lineNumbersEl.style.display = "none";
  } else {
    lineNumbersEl.style.display = "flex";
  }

  const lineCount = activePanel.querySelectorAll("p").length;
  lineNumbersEl.innerHTML = "";
  for (let i = 1; i <= lineCount; i++) {
    const div = document.createElement("div");
    div.textContent = i;
    lineNumbersEl.appendChild(div);
  }

  // Sincroniza el scroll del contenido con los números de línea
  const codeContent = document.querySelector(".code-content");
  const contentArea = document.querySelector(".content-area");
  if (codeContent && contentArea) {
    contentArea.scrollTop = 0;
  }
}

function initSidebarContentSwitcher() {
  const fileItems = document.querySelectorAll(
    ".sidebar .sidebar-item.final-item"
  );
  const contentPanels = document.querySelectorAll(".code-content-panel");

  if (!fileItems.length || !contentPanels.length) return;

  fileItems.forEach((item) => {
    item.addEventListener("click", () => {
      const targetId = item.getAttribute("data-target");
      const targetPanel = targetId && document.getElementById(targetId);

      if (!targetPanel) return;

      fileItems.forEach((file) => file.classList.remove("active"));
      contentPanels.forEach((panel) => panel.classList.remove("active"));

      item.classList.add("active");
      targetPanel.classList.add("active");
      updateLineNumbers();
    });
  });
}

function initProjectCards() {
  const cards = document.querySelectorAll(".project-card");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const projectNameElement = card.querySelector(".project-name");
      if (!projectNameElement) return;
      const projectName = projectNameElement.textContent.replace("//", "").trim();

      // Buscar el elemento final de la barra lateral que corresponde al README de este proyecto
      const finalItems = document.querySelectorAll(".sidebar .sidebar-item.final-item");
      let targetItem = null;
      finalItems.forEach((item) => {
        const parentItems = item.closest(".sidebar-items");
        if (parentItems) {
          const folderHeader = parentItems.previousElementSibling;
          if (folderHeader && folderHeader.classList.contains("nested-header")) {
            const folderName = folderHeader.querySelector("span:not(.icon)").textContent.trim();
            if (folderName === projectName) {
              targetItem = item;
            }
          }
        }
      });

      if (targetItem) {
        // Expandir carpeta si está contraída
        const parentItems = targetItem.closest(".sidebar-items");
        if (parentItems && parentItems.classList.contains("collapsed")) {
          const folderHeader = parentItems.previousElementSibling;
          if (folderHeader) {
            toggleSidebar(folderHeader);
          }
        }
        targetItem.click();
        // Registrar el estado para que el botón "atrás" vuelva a la cuadrícula
        // de proyectos en lugar de navegar a la página anterior (_about-me).
        history.pushState({ panel: "projects-grid-panel" }, "");
      }
    });
  });
}

function initProjectLinks() {
  const links = document.querySelectorAll(".project-link");
  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      // No abrir el panel README: este clic es solo para ir a GitHub
      event.stopPropagation();
      // Registrar estado para que el botón "atrás" vuelva a la grilla de
      // proyectos en lugar de salir de la página (_about-me / _hello).
      history.pushState({ panel: "projects-grid-panel" }, "");
    });
  });
}

function initBackToProjects() {
  window.addEventListener("popstate", () => {
    const gridPanel = document.getElementById("projects-grid-panel");
    if (!gridPanel) return;

    const contentPanels = document.querySelectorAll(".code-content-panel");
    const fileItems = document.querySelectorAll(
      ".sidebar .sidebar-item.final-item"
    );

    contentPanels.forEach((panel) => panel.classList.remove("active"));
    gridPanel.classList.add("active");

    fileItems.forEach((item) => {
      item.classList.remove("active");
      if (item.getAttribute("data-target") === "projects-grid-panel") {
        item.classList.add("active");
      }
    });

    updateLineNumbers();
  });
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

  initSidebarContentSwitcher();
  initProjectCards();
  initProjectLinks();
  initBackToProjects();
  updateLineNumbers();

  // Sincronizar scroll: al hacer scroll en content-area, line-numbers sigue
  const contentArea = document.querySelector(".content-area");
  const lineNumbersEl = document.getElementById("line-numbers");
  if (contentArea && lineNumbersEl) {
    contentArea.addEventListener("scroll", () => {
      lineNumbersEl.scrollTop = contentArea.scrollTop;
    });
  }

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
