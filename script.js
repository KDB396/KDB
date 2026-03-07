document.addEventListener('DOMContentLoaded', () => {
    // 1. Loader Logic
    window.addEventListener('load', () => {
        const loader = document.getElementById('loader');
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 1000);
    });

    // 2. Random Background Video
    const bgVideo = document.getElementById('bgVideo');
    const clips = ['clip1.mp4', 'clip2.mp4', 'clip3.mp4']; // Assure-toi d'avoir ces fichiers
    
    if (bgVideo && clips.length > 0) {
        const randomClip = clips[Math.floor(Math.random() * clips.length)];
        const source = document.createElement('source');
        source.src = randomClip;
        source.type = 'video/mp4';
        bgVideo.appendChild(source);
        bgVideo.load();
    }

    // 3. Mobile Navigation
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeMenu = document.getElementById('closeMenu');
    const menuLinks = mobileMenu.querySelectorAll('a');

    const toggleMenu = (show) => {
        mobileMenu.classList.toggle('hidden', !show);
        document.body.style.overflow = show ? 'hidden' : '';
    };

    hamburger?.addEventListener('click', () => toggleMenu(true));
    closeMenu?.addEventListener('click', () => toggleMenu(false));
    menuLinks.forEach(link => link.addEventListener('click', () => toggleMenu(false)));

    // 4. Particle System (Ambience)
    const createParticles = () => {
        const hero = document.getElementById('hero');
        if (!hero) return;
        
        for (let i = 0; i < 30; i++) {
            const p = document.createElement('div');
            const size = Math.random() * 3 + 1;
            p.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: var(--primary);
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                border-radius: 50%;
                opacity: 0;
                pointer-events: none;
                animation: float ${7 + Math.random() * 7}s linear infinite;
                animation-delay: ${Math.random() * 5}s;
            `;
            hero.appendChild(p);
        }
    };
    createParticles();

    // 5. Form Submission
    const contactForm = document.getElementById('contactForm');
    contactForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert("Transmission reçue, KDB vous recontactera bientôt. 🔥");
        contactForm.reset();
    });
});