// Load pages dynamically
async function loadPages() {
    const main = document.querySelector('main');
    const pages = ['hello', 'about', 'projects', 'contact'];
    
    for (const page of pages) {
        try {
            const response = await fetch(`pages/${page}.html`);
            const html = await response.text();
            main.innerHTML += html;
        } catch (error) {
            console.error(`Error loading ${page}.html:`, error);
        }
    }
    
    // Set hello as active by default
    document.getElementById('hello').classList.add('active');
    
    // Initialize event listeners after pages are loaded
    initializeEventListeners();
}

function initializeEventListeners() {
    // Navigation functionality
    const navLinks = document.querySelectorAll('.nav-links a');
    const pages = document.querySelectorAll('.page-content');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links and pages
            navLinks.forEach(l => l.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Show corresponding page
            const pageId = link.getAttribute('data-page');
            document.getElementById(pageId).classList.add('active');
        });
    });

    // Brand link navigation
    document.querySelector('.nav-brand').addEventListener('click', (e) => {
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        pages.forEach(p => p.classList.remove('active'));
        navLinks[0].classList.add('active');
        document.getElementById('hello').classList.add('active');
    });

    // Typewriter effect
    const subtitleElement = document.querySelector('.hello-page .subtitle');
    if (subtitleElement) {
        const textToType = "Developer";
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
}

// Sidebar toggle functionality
function toggleSidebar(header) {
    const icon = header.querySelector('.icon');
    const items = header.nextElementSibling;
    
    icon.classList.toggle('collapsed');
    items.classList.toggle('collapsed');
}

// Responsive navigation
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('nav');

if (navToggle) {
    navToggle.addEventListener('click', () => {
        nav.classList.toggle('nav-open');
    });
}

// Load pages when DOM is ready
document.addEventListener('DOMContentLoaded', loadPages);