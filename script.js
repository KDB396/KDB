/* ═══════════════════════════════════════════
   KDB.EXE — Site Logic
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    // ── Loader ──
    const loader = document.getElementById('loader');
    const hideLoader = () => {
        setTimeout(() => loader?.classList.add('hidden'), 800);
    };
    if (document.readyState === 'complete') hideLoader();
    else window.addEventListener('load', hideLoader);

    // ── Device detection ──
    const isTouch = matchMedia('(hover: none)').matches;
    const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── Custom Cursor (desktop only) ──
    if (!isTouch) {
        const cursor = document.getElementById('cursor');
        const trail = document.getElementById('cursorTrail');
        let cx = 0, cy = 0, tx = 0, ty = 0;

        document.addEventListener('mousemove', e => {
            cx = e.clientX;
            cy = e.clientY;
            if (cursor) {
                cursor.style.left = cx + 'px';
                cursor.style.top = cy + 'px';
            }
        });

        const updateTrail = () => {
            tx += (cx - tx) * 0.12;
            ty += (cy - ty) * 0.12;
            if (trail) {
                trail.style.left = tx + 'px';
                trail.style.top = ty + 'px';
            }
            requestAnimationFrame(updateTrail);
        };
        requestAnimationFrame(updateTrail);

        const hoverTargets = document.querySelectorAll('a, button, .release-card, .contact-cta');
        hoverTargets.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor?.classList.add('hovering');
                trail?.classList.add('hovering');
            });
            el.addEventListener('mouseleave', () => {
                cursor?.classList.remove('hovering');
                trail?.classList.remove('hovering');
            });
        });
    }

    // ══════════════════════════════════════
    //  HERO 3D TILT
    // ══════════════════════════════════════
    if (!isTouch && !prefersReduced) {
        const heroSection = document.getElementById('hero');
        const heroTilt = document.getElementById('heroTilt');

        if (heroSection && heroTilt) {
            const maxRotation = 8;

            heroSection.addEventListener('mousemove', e => {
                const rect = heroSection.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                const ratioX = (e.clientX - centerX) / (rect.width / 2);
                const ratioY = (e.clientY - centerY) / (rect.height / 2);

                const rotateY = ratioX * maxRotation;
                const rotateX = -ratioY * maxRotation * 0.6;

                heroTilt.style.transform =
                    `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
            });

            heroSection.addEventListener('mouseleave', () => {
                heroTilt.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                heroTilt.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
                setTimeout(() => {
                    heroTilt.style.transition = 'transform 0.1s ease-out';
                }, 600);
            });
        }
    }

    // ══════════════════════════════════════
    //  LIGHTNING SYSTEM (About Section)
    // ══════════════════════════════════════
    const lightningCanvas = document.getElementById('lightningCanvas');
    const aboutSection = document.getElementById('about');

    if (lightningCanvas && aboutSection && !prefersReduced) {
        const ctx = lightningCanvas.getContext('2d');
        let canvasW, canvasH;
        let isVisible = false;
        let lightningTimeout = null;

        // Add flash overlay
        const flashOverlay = document.createElement('div');
        flashOverlay.className = 'lightning-flash';
        aboutSection.appendChild(flashOverlay);

        const resizeCanvas = () => {
            const rect = aboutSection.getBoundingClientRect();
            canvasW = rect.width;
            canvasH = rect.height;
            lightningCanvas.width = canvasW;
            lightningCanvas.height = canvasH;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Generate bolt path with branches
        function generateBolt(startX, startY, endY, spread, branchChance) {
            const segments = [];
            let x = startX, y = startY;

            while (y < endY) {
                const nextY = y + 8 + Math.random() * 25;
                const nextX = x + (Math.random() - 0.5) * spread;
                segments.push({ x1: x, y1: y, x2: nextX, y2: Math.min(nextY, endY) });

                // Random branch
                if (Math.random() < branchChance) {
                    const branchDir = Math.random() < 0.5 ? -1 : 1;
                    let bx = nextX, by = nextY;
                    const branchLen = 2 + Math.floor(Math.random() * 4);
                    for (let i = 0; i < branchLen; i++) {
                        const nbx = bx + branchDir * (5 + Math.random() * 20);
                        const nby = by + 8 + Math.random() * 15;
                        segments.push({ x1: bx, y1: by, x2: nbx, y2: nby });
                        bx = nbx; by = nby;
                    }
                }

                x = nextX;
                y = nextY;
            }
            return segments;
        }

        // Draw bolt with quadruple-layer glow (boosted)
        function drawBolt(segments, alpha) {
            // Wide ambient glow
            ctx.strokeStyle = `rgba(100, 110, 255, ${alpha * 0.15})`;
            ctx.lineWidth = 16;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            segments.forEach(s => { ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); });
            ctx.stroke();

            // Outer glow
            ctx.strokeStyle = `rgba(140, 150, 255, ${alpha * 0.35})`;
            ctx.lineWidth = 8;
            ctx.beginPath();
            segments.forEach(s => { ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); });
            ctx.stroke();

            // Mid glow — primary tinted
            ctx.strokeStyle = `rgba(210, 200, 255, ${alpha * 0.65})`;
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            segments.forEach(s => { ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); });
            ctx.stroke();

            // Core white — hot center
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            segments.forEach(s => { ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); });
            ctx.stroke();
        }

        // Trigger a lightning strike
        function triggerLightning() {
            if (!isVisible) return;

            const startX = canvasW * 0.1 + Math.random() * canvasW * 0.8;
            const endY = canvasH * (0.6 + Math.random() * 0.4);
            const bolt = generateBolt(startX, 0, endY, 70, 0.32);

            // Set flash position
            const pctX = (startX / canvasW) * 100;
            flashOverlay.style.setProperty('--flash-x', pctX + '%');
            flashOverlay.style.setProperty('--flash-y', '0%');

            // Boosted flicker pattern — stronger peaks, sharper restrike
            const flickerPattern = [1, 0.1, 1, 0.05, 0.9, 0.15, 0.8, 0.3, 0.6, 0.1, 0.3, 0.05, 0.1, 0];
            let frame = 0;
            const totalFrames = flickerPattern.length;

            // Trigger screen shake on first frame
            aboutSection.classList.remove('thunder-shake');
            void aboutSection.offsetWidth; // force reflow
            aboutSection.classList.add('thunder-shake');
            setTimeout(() => aboutSection.classList.remove('thunder-shake'), 350);

            const animate = () => {
                ctx.clearRect(0, 0, canvasW, canvasH);

                if (frame < totalFrames) {
                    const alpha = flickerPattern[frame];
                    drawBolt(bolt, alpha);

                    if (alpha > 0.3) {
                        flashOverlay.classList.add('active');
                    } else {
                        flashOverlay.classList.remove('active');
                    }

                    frame++;
                    requestAnimationFrame(animate);
                } else {
                    ctx.clearRect(0, 0, canvasW, canvasH);
                    flashOverlay.classList.remove('active');
                    scheduleLightning();
                }
            };

            requestAnimationFrame(animate);
        }

        function clearLightningTimer() {
            if (lightningTimeout) {
                clearTimeout(lightningTimeout);
                lightningTimeout = null;
            }
        }

        function scheduleLightning() {
            clearLightningTimer();
            const delay = 1500 + Math.random() * 4000;
            lightningTimeout = setTimeout(triggerLightning, delay);
        }

        // Only run when visible
        const lightningObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isVisible = entry.isIntersecting;
                if (isVisible) {
                    resizeCanvas();
                    if (!lightningTimeout) {
                        scheduleLightning();
                    }
                } else {
                    clearLightningTimer();
                    ctx.clearRect(0, 0, canvasW, canvasH);
                }
            });
        }, { threshold: 0.1 });

        lightningObserver.observe(aboutSection);
    }

    // ══════════════════════════════════════
    //  GLITCH DIVIDERS
    // ══════════════════════════════════════
    const glitchDividers = document.querySelectorAll('.glitch-divider');

    if (glitchDividers.length && !prefersReduced) {
        const dividerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    setTimeout(() => {
                        entry.target.classList.remove('active');
                    }, 1200);
                }
            });
        }, {
            threshold: 0.5,
            rootMargin: '0px 0px -20px 0px'
        });

        glitchDividers.forEach(d => dividerObserver.observe(d));
    }

    // ══════════════════════════════════════
    //  NAVIGATION
    // ══════════════════════════════════════
    const nav = document.getElementById('nav');
    let lastScroll = 0;

    const handleNavScroll = () => {
        const current = window.scrollY;
        nav?.classList.toggle('scrolled', current > 80);
        if (current > lastScroll && current > 200) {
            nav?.classList.add('nav-hidden');
        } else {
            nav?.classList.remove('nav-hidden');
        }
        lastScroll = current;
    };

    window.addEventListener('scroll', handleNavScroll, { passive: true });

    // ══════════════════════════════════════
    //  MOBILE MENU
    // ══════════════════════════════════════
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileLinks = mobileMenu?.querySelectorAll('.mobile-link, .mobile-social');
    const mobileMenuBackdrop = mobileMenu?.querySelector('.mobile-menu-bg');
    let menuOpen = false;
    let lastFocusedElement = null;

    const getFocusableElements = () => {
        if (!mobileMenu) return [];
        return [...mobileMenu.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')];
    };

    const toggleMenu = (open) => {
        menuOpen = open;

        if (open) {
            lastFocusedElement = document.activeElement;
        }

        menuToggle?.classList.toggle('active', open);
        mobileMenu?.classList.toggle('open', open);
        mobileMenu?.setAttribute('aria-hidden', !open);
        menuToggle?.setAttribute('aria-expanded', open);
        menuToggle?.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
        document.body.style.overflow = open ? 'hidden' : '';
        mobileLinks?.forEach(link => { link.tabIndex = open ? 0 : -1; });

        if (open) {
            const [firstFocusable] = getFocusableElements();
            firstFocusable?.focus();
        } else if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            lastFocusedElement.focus();
        }
    };

    menuToggle?.addEventListener('click', () => toggleMenu(!menuOpen));
    mobileMenuBackdrop?.addEventListener('click', () => toggleMenu(false));
    mobileLinks?.forEach(link => link.addEventListener('click', () => toggleMenu(false)));
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && menuOpen) toggleMenu(false);

        if (e.key === 'Tab' && menuOpen) {
            const focusable = getFocusableElements();
            if (!focusable.length) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const active = document.activeElement;

            if (e.shiftKey && active === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });

    // ══════════════════════════════════════
    //  SCROLL REVEAL
    // ══════════════════════════════════════
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('[data-scroll]').forEach(el => revealObserver.observe(el));

    // ══════════════════════════════════════
    //  COUNTER ANIMATION
    // ══════════════════════════════════════
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.count, 10);
                const duration = 1500;
                const start = performance.now();
                const step = (now) => {
                    const p = Math.min((now - start) / duration, 1);
                    el.textContent = Math.round((1 - Math.pow(1 - p, 4)) * target);
                    if (p < 1) requestAnimationFrame(step);
                };
                requestAnimationFrame(step);
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

    // ══════════════════════════════════════
    //  HERO VIDEO — Random Clip Rotation
    // ══════════════════════════════════════
    const heroVideo = document.getElementById('heroVideo');
    if (heroVideo) {
        const clips = ['clip1.mp4', 'clip2.mp4', 'clip3.mp4'];
        let currentIndex = -1;

        const pickClip = () => {
            let next;
            do { next = Math.floor(Math.random() * clips.length); }
            while (next === currentIndex && clips.length > 1);
            currentIndex = next;
            return clips[currentIndex];
        };

        heroVideo.src = pickClip();
        heroVideo.load();
        heroVideo.removeAttribute('loop');

        heroVideo.addEventListener('ended', () => {
            heroVideo.style.transition = 'opacity 0.8s ease';
            heroVideo.style.opacity = '0';
            setTimeout(() => {
                heroVideo.src = pickClip();
                heroVideo.load();
                heroVideo.play().catch(() => {});
                setTimeout(() => { heroVideo.style.opacity = '1'; }, 100);
            }, 800);
        });
    }

    // ══════════════════════════════════════
    //  SMOOTH SCROLL
    // ══════════════════════════════════════
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 80;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
            }
        });
    });

    // ══════════════════════════════════════
    //  PARALLAX (desktop)
    // ══════════════════════════════════════
    if (!isTouch) {
        const heroTitle = document.querySelector('.hero-title');
        const heroTag = document.querySelector('.hero-tag');

        window.addEventListener('scroll', () => {
            const scroll = window.scrollY;
            if (scroll < window.innerHeight) {
                if (heroTitle) heroTitle.style.transform = `translateY(${scroll * 0.3}px)`;
                if (heroTag) heroTag.style.opacity = Math.max(0, 1 - scroll / 400);
            }
        }, { passive: true });
    }
});
