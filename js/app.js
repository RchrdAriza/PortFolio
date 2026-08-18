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

// Genera los números de línea junto a cada texto del panel activo.
function updateLineNumbers() {
  const lineNumbersEl = document.getElementById("line-numbers");
  const activePanel = document.querySelector(".code-content-panel.active");
  if (!activePanel) return;

  if (lineNumbersEl) {
    lineNumbersEl.style.display = "none";
    lineNumbersEl.innerHTML = "";
  }

  if (activePanel.id === "projects-grid-panel") return;
  if (activePanel.classList.contains("markdown-panel")) return;

  const paragraphs = Array.from(activePanel.querySelectorAll("p"));
  if (!paragraphs.length) return;

  activePanel.innerHTML = "";

  paragraphs.forEach((paragraph, index) => {
    const row = document.createElement("div");
    row.className = "code-line";

    const number = document.createElement("span");
    number.className = "code-line-number";
    number.textContent = index + 1;

    const text = document.createElement("span");
    text.className = "code-line-text";
    text.innerHTML = paragraph.innerHTML;

    row.append(number, text);
    activePanel.appendChild(row);
  });

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
      loadReadmeIfNeeded(targetPanel);
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

function initProjectStars() {
  const starBlocks = document.querySelectorAll(".project-stars[data-repo]");
  starBlocks.forEach((block) => {
    const repo = block.getAttribute("data-repo");
    const span = block.querySelector("span");
    if (!repo || !span) return;

    const cacheKey = `repo-stars-${repo}`;
    const cached = (() => {
      try {
        return JSON.parse(localStorage.getItem(cacheKey));
      } catch {
        return null;
      }
    })();

    if (cached && Date.now() - cached.fetchedAt < 60 * 60 * 1000) {
      span.textContent = formatStars(cached.count);
      return;
    }

    fetch(`https://api.github.com/repos/${repo}`)
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data) => {
        const count = data.stargazers_count || 0;
        span.textContent = formatStars(count);
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ count, fetchedAt: Date.now() })
          );
        } catch {}
      })
      .catch(() => {});
  });
}

function formatStars(count) {
  return `${count} ${count === 1 ? "star" : "stars"}`;
}

// Estado de carga por repo para evitar peticiones duplicadas
const readmeLoadState = new Map();

function loadReadmeIfNeeded(panel) {
  const container = panel.querySelector(".markdown-body[data-repo]");
  if (!container) return;
  const repo = container.getAttribute("data-repo");
  const branch = container.getAttribute("data-branch") || "main";
  if (!repo || readmeLoadState.get(repo)) return;
  readmeLoadState.set(repo, true);
  loadReadmeInto(container, repo, branch);
}

async function loadReadmeInto(container, repo, branch = "main") {
  const cacheKey = `readme-${repo}-${branch}`;
  const cached = (() => {
    try {
      return JSON.parse(localStorage.getItem(cacheKey));
    } catch {
      return null;
    }
  })();

  // Cache de 12 horas para no golpear la API de GitHub
  if (cached && Date.now() - cached.fetchedAt < 12 * 60 * 60 * 1000) {
    container.innerHTML = cached.html;
    postProcessReadme(container, repo, branch);
    return;
  }

  container.innerHTML =
    '<p class="code-comment">// loading README...</p>';

  try {
    const markdown = await fetchRawReadme(repo);
    const html =
      markdown === null
        ? renderReadmePlaceholder(repo)
        : await renderReadme(markdown, repo);
    container.innerHTML = html;
    if (markdown !== null) postProcessReadme(container, repo, branch);

    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ html, fetchedAt: Date.now() })
      );
    } catch {}
  } catch {
    container.innerHTML =
      '<p class="code-comment">// failed to load README</p>';
  }
}

async function fetchRawReadme(repo) {
  // El endpoint oficial devuelve el README (cualquier nombre/rama) como texto
  const apiUrl = `https://api.github.com/repos/${repo}/readme`;
  const apiRes = await fetch(apiUrl, {
    headers: { Accept: "application/vnd.github.raw+json" },
  });
  if (apiRes.status === 404) return null;
  if (!apiRes.ok) throw new Error("README fetch failed");
  return apiRes.text();
}

function renderReadmePlaceholder(repo) {
  const repoUrl = `https://github.com/${repo}`;
  const createUrl = `https://github.com/${repo}/new/main?filename=README.md`;
  return `
    <div class="markdown-placeholder">
      <div class="placeholder-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="15" y2="17" />
        </svg>
      </div>
      <p class="placeholder-title">README.md not found</p>
      <p class="placeholder-desc">
        This repository doesn't have a README on GitHub yet.
      </p>
      <div class="placeholder-actions">
        <a
          class="placeholder-btn"
          href="${repoUrl}"
          target="_blank"
          rel="noopener noreferrer"
          >view on github</a
        >
        <a
          class="placeholder-btn placeholder-btn-primary"
          href="${createUrl}"
          target="_blank"
          rel="noopener noreferrer"
          >create README.md</a
        >
      </div>
    </div>
  `;
}

async function renderReadme(markdown, repo) {
  // Opción 1: renderizado exacto de GitHub (mismo preview que github.com)
  if (typeof marked === "undefined") {
    return fallbackRender(markdown);
  }
  try {
    const res = await fetch("https://api.github.com/markdown", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        text: markdown,
        mode: "gfm",
        context: repo,
      }),
    });
    if (res.ok) return await res.text();
  } catch {}
  // Opción 2 (sin red / rate limit): render local con marked
  return fallbackRender(markdown);
}

function fallbackRender(markdown) {
  if (typeof marked === "undefined") return "<p>markdown parser unavailable</p>";
  configureMarkedRenderer();
  return marked.parse(markdown, { gfm: true, breaks: true });
}

let markedRendererConfigured = false;

function configureMarkedRenderer() {
  if (markedRendererConfigured) return;
  markedRendererConfigured = true;
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = tokens
          .map((t) => t.text || t.raw || t)
          .join("")
          .replace(/<[^>]*>/g, "");
        const id = slugify(text);
        return (
          '<h' +
          depth +
          ' id="' +
          id +
          '">' +
          this.parser.parseInline(tokens) +
          "</h" +
          depth +
          ">"
        );
      },
    },
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function postProcessReadme(container, repo, branch = "main") {
  const repoUrl = `https://github.com/${repo}/blob/${branch}`;
  const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}`;

  container.querySelectorAll("a").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    // Enlaces internos del propio README: apuntan a los ids de GitHub
    if (href.startsWith("#")) {
      link.href = "#user-content-" + href.slice(1);
      return;
    }
    if (/^(https?:)?\/\//i.test(href) || href.startsWith("mailto:")) {
      if (!/^(https?:)?\/\//i.test(href)) return;
      const host = new URL(href, location.origin).hostname;
      if (host !== location.hostname) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      return;
    }
    link.href = repoUrl + "/" + href.replace(/^\.?\//, "");
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });

  container.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src");
    if (!src || /^(https?:)?\/\//i.test(src) || src.startsWith("data:")) return;
    img.src = rawUrl + "/" + src.replace(/^\.?\//, "");
    img.loading = "lazy";
  });

  enhanceReadmeAlerts(container);
}

function enhanceReadmeAlerts(container) {
  container.querySelectorAll("blockquote").forEach((blockquote) => {
    const firstP = blockquote.querySelector("p");
    if (!firstP) return;
    const match = firstP.textContent.match(
      /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i
    );
    if (!match) return;
    const type = match[1].toLowerCase();
    blockquote.classList.add("markdown-alert", `markdown-alert-${type}`);
    const title = document.createElement("p");
    title.className = "markdown-alert-title";
    title.textContent = match[1][0] + match[1].slice(1).toLowerCase();
    firstP.innerHTML = firstP.innerHTML.replace(
      /^\s*\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i,
      ""
    );
    blockquote.insertBefore(title, blockquote.firstChild);
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

function initMobileIDESidebar(pageSelector) {
  const page = document.querySelector(pageSelector);
  if (!page) return;
  const sidebar = page.querySelector(".sidebar");
  if (!sidebar) return;

  const sections = sidebar.querySelectorAll(".sidebar-section");
  const mq = window.matchMedia("(max-width: 768px)");

  function closeAll() {
    sections.forEach((section) => {
      section.classList.remove("section-active");
      const items = section.querySelector(":scope > .sidebar-items");
      if (items) items.classList.remove("open");
    });
  }

  function buildToolbar(section) {
    const items = section.querySelector(":scope > .sidebar-items");
    if (!items || items.querySelector(":scope > .panel-toolbar")) return;

    const toolbar = document.createElement("div");
    toolbar.className = "panel-toolbar";

    const title = document.createElement("span");
    title.className = "panel-title";
    const label = section.querySelector(
      ":scope > .sidebar-header > span:not(.icon)"
    );
    title.textContent = label ? label.textContent : "";

    const close = document.createElement("button");
    close.className = "panel-close";
    close.setAttribute("type", "button");
    close.setAttribute("aria-label", "close panel");
    close.textContent = "×";
    close.addEventListener("click", closeAll);

    toolbar.append(title, close);
    items.prepend(toolbar);
  }

  function openSection(section) {
    closeAll();
    buildToolbar(section);
    section.classList.add("section-active");
    const items = section.querySelector(":scope > .sidebar-items");
    if (items) items.classList.add("open");
  }

  function wireMobile() {
    sections.forEach((section) => {
      const header = section.querySelector(":scope > .sidebar-header");
      header.onclick = () => {
        if (section.classList.contains("section-active")) {
          closeAll();
        } else {
          openSection(section);
        }
      };
    });
  }

  function wireDesktop() {
    sections.forEach((section) => {
      const header = section.querySelector(":scope > .sidebar-header");
      header.onclick = () => toggleSidebar(header);
      section.classList.remove("section-active");
      const items = section.querySelector(":scope > .sidebar-items");
      if (items) items.classList.remove("open");
    });
  }

  function handleChange() {
    if (mq.matches) {
      wireMobile();
    } else {
      wireDesktop();
    }
  }

  handleChange();
  mq.addEventListener("change", handleChange);

  document.addEventListener("click", (event) => {
    if (!mq.matches) return;
    if (sidebar.contains(event.target)) return;
    closeAll();
  });
}

function initMobileAboutSidebar() {
  initMobileIDESidebar(".about-page");
}

function initMobileProjectsSidebar() {
  initMobileIDESidebar(".projects-page");
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

    document.addEventListener("click", (event) => {
      if (!nav.classList.contains("nav-open")) return;
      if (nav.contains(event.target)) return;
      nav.classList.remove("nav-open");
    });
  }

  const rightSidebarToggle = document.querySelector(".right-sidebar-toggle");
  const rightSidebar = document.querySelector(".right-sidebar");
  if (rightSidebarToggle && rightSidebar) {
    const closeRightSidebar = () => {
      rightSidebar.classList.remove("is-open");
      rightSidebarToggle.classList.remove("active");
    };

    rightSidebarToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = rightSidebar.classList.toggle("is-open");
      rightSidebarToggle.classList.toggle("active", isOpen);
    });

    document.addEventListener("click", (event) => {
      if (!rightSidebar.classList.contains("is-open")) return;
      if (
        rightSidebar.contains(event.target) ||
        rightSidebarToggle.contains(event.target)
      ) {
        return;
      }
      closeRightSidebar();
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
  initMobileAboutSidebar();
  initMobileProjectsSidebar();
  initProjectCards();
  initProjectStars();
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
