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

        // Sidebar toggle functionality
        function toggleSidebar(header) {
            const icon = header.querySelector('.icon');
            const items = header.nextElementSibling;
            
            icon.classList.toggle('collapsed');
            items.classList.toggle('collapsed');
        }

        // Brand link navigation
        document.querySelector('.nav-brand').addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));
            navLinks[0].classList.add('active');
            document.getElementById('hello').classList.add('active');
        });