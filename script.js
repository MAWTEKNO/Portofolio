/**
 * MAW TEKNO PORTFOLIO — script.js
 * Arsitektur : Modular IIFE, event-driven, aksesibel.
 * Standar    : ES2022+, WCAG 2.2, IMK/HCI best practices.
 */
(function () {
    'use strict';

    /* ============================================================
       UTILITAS
    ============================================================ */
    const $  = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

    /** Debounce — batasi frekuensi pemanggilan fn */
    const debounce = (fn, ms = 100) => {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    };

    /** Cek apakah user meminta reduced motion */
    const prefersReducedMotion = () =>
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;


    /* ============================================================
       1. TEMA GELAP / TERANG
       Prioritas: (1) localStorage → (2) prefers-color-scheme → (3) dark
    ============================================================ */
    function initTheme() {
        const btn  = $('#toggle-btn');
        const root = document.documentElement;
        if (!btn) return;

        const icon = btn.querySelector('i');

        const applyTheme = (theme) => {
            root.setAttribute('data-theme', theme);
            const isDark = theme === 'dark';
            if (icon) icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
            btn.setAttribute(
                'aria-label',
                isDark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'
            );
            localStorage.setItem('maw-theme', theme);
            // Update meta theme-color dinamis
            const metaTheme = $('meta[name="theme-color"]');
            if (metaTheme) {
                metaTheme.setAttribute('content', isDark ? '#020617' : '#f0f4f8');
            }
        };

        const saved  = localStorage.getItem('maw-theme');
        const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        applyTheme(saved || system);

        btn.addEventListener('click', () => {
            const cur = root.getAttribute('data-theme');
            applyTheme(cur === 'dark' ? 'light' : 'dark');
        });

        // Ikuti perubahan sistem (hanya jika belum ada manual override)
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('maw-theme')) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }


    /* ============================================================
       2. NAVBAR — Scroll effect & Active Link
    ============================================================ */
    function initNavbar() {
        const nav      = $('#navbar');
        const links    = $$('.nav-link');
        const sections = $$('section[id]');
        if (!nav) return;

        // Shadow saat scroll
        const handleScroll = () => {
            nav.classList.toggle('scrolled', window.scrollY > 40);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        // Active link via IntersectionObserver (lebih efisien dari scroll listener)
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    links.forEach(link => {
                        const active = link.dataset.section === id;
                        link.classList.toggle('active', active);
                        link.setAttribute('aria-current', active ? 'page' : 'false');
                    });
                }
            });
        }, {
            rootMargin: `-${nav.offsetHeight + 10}px 0px -55% 0px`,
        });

        sections.forEach(sec => io.observe(sec));
    }


    /* ============================================================
       3. MOBILE NAV DRAWER
    ============================================================ */
    function initMobileNav() {
        const toggle   = $('#navToggle');
        const menu     = $('#navMenu');
        const overlay  = $('#navOverlay');
        const navLinks = $$('.nav-link');
        if (!toggle || !menu) return;

        const open = () => {
            menu.classList.add('open');
            overlay?.classList.add('open');
            overlay?.removeAttribute('aria-hidden');
            toggle.setAttribute('aria-expanded', 'true');
            toggle.setAttribute('aria-label', 'Tutup menu navigasi');
            document.body.style.overflow = 'hidden';
            // Fokus ke link pertama (aksesibilitas keyboard)
            menu.querySelector('.nav-link')?.focus();
        };

        const close = () => {
            menu.classList.remove('open');
            overlay?.classList.remove('open');
            overlay?.setAttribute('aria-hidden', 'true');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Buka menu navigasi');
            document.body.style.overflow = '';
            toggle.focus();
        };

        toggle.addEventListener('click', () => {
            toggle.getAttribute('aria-expanded') === 'true' ? close() : open();
        });

        overlay?.addEventListener('click', close);
        navLinks.forEach(link => link.addEventListener('click', close));

        // Escape menutup drawer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menu.classList.contains('open')) close();
        });

        // Tutup saat resize ke desktop
        window.matchMedia('(min-width: 64em)').addEventListener('change', (e) => {
            if (e.matches && menu.classList.contains('open')) close();
        });
    }


    /* ============================================================
       4. REVEAL ON SCROLL
    ============================================================ */
    function initReveal() {
        const els = $$('.reveal');
        if (!els.length) return;

        if (prefersReducedMotion()) {
            els.forEach(el => el.classList.add('active'));
            return;
        }

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    io.unobserve(entry.target); // Efisiensi: tidak observe ulang
                }
            });
        }, {
            threshold: 0.08,
            rootMargin: '0px 0px -40px 0px',
        });

        els.forEach(el => io.observe(el));
    }


    /* ============================================================
       5. SKILL PROGRESS BARS
    ============================================================ */
    function initSkillBars() {
        const cards = $$('.skill-card');
        if (!cards.length) return;

        if (prefersReducedMotion()) {
            $$('.skill-fill').forEach(bar => {
                bar.style.width = (bar.dataset.target || '0') + '%';
            });
            return;
        }

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const fill = entry.target.querySelector('.skill-fill');
                    if (fill) {
                        const target = fill.dataset.target || '0';
                        setTimeout(() => { fill.style.width = target + '%'; }, 120);
                    }
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.25 });

        cards.forEach(card => io.observe(card));
    }


    /* ============================================================
       6. FAQ ACCORDION
       Aksesibel: aria-expanded, hidden attribute, keyboard nav
    ============================================================ */
    function initFAQ() {
        const items = $$('.faq-item');
        if (!items.length) return;

        items.forEach(item => {
            const btn    = item.querySelector('.faq-btn');
            const answer = item.querySelector('.faq-answer');
            if (!btn || !answer) return;

            btn.addEventListener('click', () => {
                const isOpen = btn.getAttribute('aria-expanded') === 'true';

                // Tutup semua lain
                items.forEach(other => {
                    const ob = other.querySelector('.faq-btn');
                    const oa = other.querySelector('.faq-answer');
                    if (ob && oa && ob !== btn) {
                        ob.setAttribute('aria-expanded', 'false');
                        oa.hidden = true;
                    }
                });

                // Toggle yang diklik
                btn.setAttribute('aria-expanded', String(!isOpen));
                answer.hidden = isOpen;

                // Smooth scroll ke item jika diperlukan
                if (!isOpen && !prefersReducedMotion()) {
                    setTimeout(() => {
                        const rect = item.getBoundingClientRect();
                        if (rect.bottom > window.innerHeight) {
                            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                    }, 50);
                }
            });

            // Keyboard: arrow keys untuk navigasi antar FAQ
            btn.addEventListener('keydown', (e) => {
                const btns = items.map(i => i.querySelector('.faq-btn')).filter(Boolean);
                const idx  = btns.indexOf(btn);
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    btns[(idx + 1) % btns.length]?.focus();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    btns[(idx - 1 + btns.length) % btns.length]?.focus();
                }
            });
        });
    }


    /* ============================================================
       7. FORM — Validasi + Submit async + Feedback IMK
    ============================================================ */
    function initForm() {
        const form   = $('#portfolio-form');
        const status = $('#form-status');
        const btn    = $('#submit-btn');
        if (!form || !status || !btn) return;

        /* Validasi satu field — tampilkan pesan inline */
        const validateField = (field) => {
            const errorEl = $(`#${field.id}-error`);
            if (!errorEl) return true;

            let msg = '';
            if (field.validity.valueMissing) {
                msg = 'Kolom ini wajib diisi.';
            } else if (field.validity.typeMismatch) {
                msg = 'Format tidak valid. Contoh: nama@email.com';
            } else if (field.validity.tooShort) {
                msg = `Minimal ${field.minLength} karakter.`;
            }

            errorEl.textContent = msg;
            field.setAttribute('aria-invalid', msg ? 'true' : 'false');
            return !msg;
        };

        // Real-time validasi setelah blur
        $$('input, textarea, select', form).forEach(field => {
            field.addEventListener('blur', () => {
                if (field.required || field.value) validateField(field);
            });
            field.addEventListener('input', () => {
                if (field.getAttribute('aria-invalid') === 'true') validateField(field);
            });
        });

        /* Loading state tombol */
        const setLoading = (loading) => {
            btn.disabled = loading;
            btn.innerHTML = loading
                ? '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Mengirim...'
                : '<i class="fas fa-paper-plane" aria-hidden="true"></i> Kirim Pesan';
        };

        /* Tampilkan status submit */
        const showStatus = (msg, type) => {
            status.textContent = msg;
            status.className = `form-status ${type}`;
            // Scroll ke status untuk mobile
            if (msg) status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Validasi semua required field
            const fields   = $$('input[required], textarea[required]', form);
            const allValid = fields.map(validateField).every(Boolean);
            if (!allValid) {
                const firstInvalid = fields.find(f => f.getAttribute('aria-invalid') === 'true');
                firstInvalid?.focus();
                return;
            }

            setLoading(true);
            showStatus('', '');

            try {
                const res = await fetch(form.action, {
                    method: 'POST',
                    body: new FormData(form),
                    headers: { 'Accept': 'application/json' },
                });

                if (res.ok) {
                    showStatus('✅ Pesan berhasil terkirim! Saya akan segera membalas.', 'success');
                    form.reset();
                    fields.forEach(f => {
                        f.removeAttribute('aria-invalid');
                        const err = $(`#${f.id}-error`);
                        if (err) err.textContent = '';
                    });
                } else {
                    const data = await res.json().catch(() => ({}));
                    const errMsg = data?.errors?.[0]?.message;
                    showStatus(
                        errMsg ? `❌ ${errMsg}` : '❌ Terjadi kesalahan. Silakan coba lagi.',
                        'error'
                    );
                }
            } catch {
                showStatus('❌ Gagal mengirim. Periksa koneksi internet Anda.', 'error');
            } finally {
                setLoading(false);
            }
        });
    }


    /* ============================================================
       8. SMOOTH SCROLL + NAVBAR OFFSET
    ============================================================ */
    function initSmoothScroll() {
        const nav = $('#navbar');

        $$('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const id = link.getAttribute('href');
                if (!id || id === '#') return;
                const target = $(id);
                if (!target) return;

                e.preventDefault();
                const navH   = nav?.offsetHeight ?? 0;
                const offset = target.getBoundingClientRect().top + window.scrollY - navH - 16;

                window.scrollTo({ top: offset, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
            });
        });
    }


    /* ============================================================
       9. BACK TO TOP BUTTON
    ============================================================ */
    function initBackToTop() {
        const btn = $('#back-to-top');
        if (!btn) return;

        const handleScroll = debounce(() => {
            btn.hidden = window.scrollY < 400;
        }, 80);

        window.addEventListener('scroll', handleScroll, { passive: true });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        });
    }


    /* ============================================================
       10. WHATSAPP FLOATING BUTTON — dynamic pre-filled message
    ============================================================ */
    function initWhatsAppLinks() {
        // Update semua link WA agar mengandung halaman referrer
        $$('a[href^="https://wa.me"]').forEach(link => {
            link.addEventListener('click', () => {
                // Logging sederhana tanpa tracking eksternal
                try {
                    const source = link.closest('section')?.id || 'unknown';
                    console.debug('[MAW] WhatsApp click from section:', source);
                } catch {
                    // silent
                }
            });
        });
    }


    /* ============================================================
       11. LAZY-LOAD IFRAME (Google Maps)
    ============================================================ */
    function initLazyIframe() {
        const iframes = $$('iframe[loading="lazy"]');
        if (!iframes.length) return;

        // Modern browsers handle this natively via loading="lazy"
        // Fallback IntersectionObserver untuk browser lama
        if ('loading' in HTMLIFrameElement.prototype) return;

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const src = el.dataset.src;
                    if (src) el.src = src;
                    io.unobserve(el);
                }
            });
        }, { rootMargin: '200px' });

        iframes.forEach(el => {
            el.dataset.src = el.src;
            el.removeAttribute('src');
            io.observe(el);
        });
    }


    /* ============================================================
       12. SCROLL PROGRESS BAR (upgrade tambahan)
    ============================================================ */
    function initScrollProgress() {
        const fill = $('#scrollProgressFill');
        const bar  = $('#scrollProgress');
        if (!fill || !bar) return;

        const update = () => {
            const scrollTop   = window.scrollY;
            const docHeight   = document.documentElement.scrollHeight - window.innerHeight;
            const pct         = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
            fill.style.width  = pct + '%';
            bar.setAttribute('aria-valuenow', Math.round(pct));
        };

        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', debounce(update, 100));
        update();
    }


    /* ============================================================
       13. CURSOR GLOW — dekoratif, desktop only (upgrade tambahan)
    ============================================================ */
    function initCursorGlow() {
        const glow = $('#cursorGlow');
        if (!glow) return;
        if (prefersReducedMotion()) return;
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

        let raf = null;
        window.addEventListener('mousemove', (e) => {
            glow.classList.add('active');
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
            });
        }, { passive: true });

        document.addEventListener('mouseleave', () => glow.classList.remove('active'));
    }


    /* ============================================================
       14. ACHIEVEMENT COUNTERS (upgrade tambahan)
    ============================================================ */
    function initAchievementCounters() {
        const nums = $$('.achievement-number');
        if (!nums.length) return;

        if (prefersReducedMotion()) {
            nums.forEach(el => { el.textContent = el.dataset.count || '0'; });
            return;
        }

        const animateCount = (el) => {
            const target   = parseInt(el.dataset.count || '0', 10);
            const duration = 1400;
            const start    = performance.now();

            const tick = (now) => {
                const progress = Math.min((now - start) / duration, 1);
                const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
                el.textContent = Math.round(eased * target);
                if (progress < 1) requestAnimationFrame(tick);
                else el.textContent = target;
            };
            requestAnimationFrame(tick);
        };

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCount(entry.target);
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });

        nums.forEach(el => io.observe(el));
    }


    /* ============================================================
       15. MICRO-INTERACTION: BUTTON RIPPLE (upgrade tambahan)
    ============================================================ */
    function initButtonRipple() {
        if (prefersReducedMotion()) return;

        $$('.btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                const rect   = this.getBoundingClientRect();
                const ripple = document.createElement('span');
                const size   = Math.max(rect.width, rect.height);

                ripple.className = 'btn-ripple';
                ripple.style.width  = ripple.style.height = size + 'px';
                ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
                ripple.style.top  = (e.clientY - rect.top  - size / 2) + 'px';

                this.appendChild(ripple);
                ripple.addEventListener('animationend', () => ripple.remove());
            });
        });
    }


    /* ============================================================
       16. MICRO-INTERACTION: MAGNETIC BUTTON (upgrade tambahan)
       Efek "tertarik" mengikuti kursor — hanya pada .btn-primary desktop
    ============================================================ */
    function initMagneticButtons() {
        if (prefersReducedMotion()) return;
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

        $$('.btn-primary').forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width  / 2;
                const y = e.clientY - rect.top  - rect.height / 2;
                btn.style.transform = `translate(${x * 0.18}px, ${y * 0.35}px)`;
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
            });
        });
    }


    /* ============================================================
       17. MICRO-INTERACTION: CARD TILT (upgrade tambahan)
       Diterapkan pada brand-card & achievement-card
    ============================================================ */
    function initCardTilt() {
        if (prefersReducedMotion()) return;
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

        const cards = $$('.brand-card, .achievement-card');
        cards.forEach(card => {
            card.classList.add('tilt-card');
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width  - 0.5;
                const y = (e.clientY - rect.top)  / rect.height - 0.5;
                card.style.transform = `perspective(800px) rotateX(${y * -6}deg) rotateY(${x * 6}deg) translateY(-4px)`;
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }


    /* ============================================================
       INIT
    ============================================================ */
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        initNavbar();
        initMobileNav();
        initReveal();
        initSkillBars();
        initFAQ();
        initForm();
        initSmoothScroll();
        initBackToTop();
        initWhatsAppLinks();
        initLazyIframe();

        // Upgrade tambahan — tidak mengubah fungsi di atas
        initScrollProgress();
        initCursorGlow();
        initAchievementCounters();
        initButtonRipple();
        initMagneticButtons();
        initCardTilt();
    });

})();
