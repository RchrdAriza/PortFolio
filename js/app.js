
function toggleSidebar(header) {
    const icon = header.querySelector('.icon');
    const items = header.nextElementSibling;
    
    icon.classList.toggle('collapsed');
    items.classList.toggle('collapsed');
}

// --- Lógica de Carga de Página ---
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Lógica de Menú Hamburguesa (Global) ---
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('nav');
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            nav.classList.toggle('nav-open');
        });
    }
    
    // --- Lógica de Typewriter (se ejecuta en CUALQUIER página que la tenga) ---
    // Esto funciona para 'hello.html' (ahora index.html) y para 'contact.html'
    const subtitleElement = document.querySelector('.hello-page .subtitle');
    
    if (subtitleElement) {
        
        // Determina qué texto escribir basándose en el ID de la sección padre
        let textToType = "Developer"; // Default
        const parentSection = subtitleElement.closest('.page-content');
        
        if (parentSection && parentSection.id === 'contact') {
            textToType = "Let's connect";
        }

        let charIndex = 0;
        let isDeleting = false;

        function typeWriter() {
            const currentText = textToType.substring(0, charIndex);
            subtitleElement.textContent = `> ${currentText}`;
            subtitleElement.classList.add('typing');

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
});