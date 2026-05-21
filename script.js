/**
 * MAW TEKNO PORTFOLIO — script.js
 * Arsitektur: Modular IIFE, event-driven, aksesibel.
 * Kompatibel: Modern browsers (ES6+).
 */
(function () {
    'use strict';

    /* ============================================================
       UTILITAS
    ============================================================ */

    /**
     * Shortcut querySelector.
     * @param {string} sel - CSS selector
     * @param {Element} [ctx=document] - context elemen
     */
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];


    /* ============================================================
       1. TEMA GELAP / TERANG
       - Menyimpan preferensi ke localStorage
       - Menghormati prefers-color-scheme bawaan browser jika
         belum ada preferensi tersimpan
    ============================================================ */
    function initTheme() {
        const btn  = $('#toggle-btn');
        const root = document.documentElement;
        const icon = btn.querySelector('i');

        /** Terapkan tema ke DOM dan perbarui label ARIA */
        const applyTheme = (theme) => {
            root.setAttribute('data-theme', theme);
            const isDark = theme === 'dark';
            icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
            btn.setAttribute(
                'aria-label',
                isDark ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'
            );
            localStorage.setItem('maw-theme', theme);
        };

        // Urutan prioritas: (1) tersimpan → (2) sistem OS → (3) default dark
        const saved   = localStorage.getItem('maw-theme');
        const system  = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        applyTheme(saved || system);

        btn.addEventListener('click', () => {
            const current = root.getAttribute('data-theme');
            applyTheme(current === 'dark' ? 'light' : 'dark');
        });

        // Ikuti perubahan preferensi OS secara real-time (jika belum override manual)
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('maw-theme')) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }


    /* ============================================================
       2. NAVBAR — Scroll & Active State
    ============================================================ */
    function initNavbar() {
        const nav    = $('#navbar');
        const links  = $$('.nav-link');
        const sections = $$('section[id]');

        // Tambah kelas .scrolled saat scroll agar shadow muncul
        const onScroll = () => {
            nav.classList.toggle('scrolled', window.scrollY > 40);
            highlightActiveLink();
        };

        // IntersectionObserver untuk menandai link aktif di navbar
        // Lebih efisien dari scroll listener + getBoundingClientRect
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    links.forEach(link => {
                        link.classList.toggle('active', link.dataset.section === id);
                        link.setAttribute('aria-current', link.dataset.section === id ? 'page' : 'false');
                    });
                }
            });
        }, {
            // Trigger saat bagian atas section ~20% dari atas viewport
            rootMargin: `-${nav.offsetHeight}px 0px -60% 0px`
        });

        sections.forEach(sec => observer.observe(sec));

        // Fallback highlight saat scroll (untuk kasus edge)
        function highlightActiveLink() {
            const scrollMid = window.scrollY + window.innerHeight / 3;
            sections.forEach(sec => {
                if (sec.offsetTop <= scrollMid && sec.offsetTop + sec.offsetHeight > scrollMid) {
                    const id = sec.id;
                    links.forEach(l => l.classList.toggle('active', l.dataset.section === id));
                }
            });
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); // Jalankan sekali saat load
    }


    /* ============================================================
       3. HAMBURGER MENU — Mobile/Tablet Nav Drawer
       IMK: ARIA expanded, keyboard navigasi (Escape menutup)
    ============================================================ */
    function initMobileNav() {
        const toggle  = $('#navToggle');
        const menu    = $('#navMenu');
        const overlay = $('#navOverlay');
        const navLinks = $$('.nav-link');

        if (!toggle || !menu) return;

        const openMenu = () => {
            menu.classList.add('open');
            overlay.classList.add('open');
            toggle.setAttribute('aria-expanded', 'true');
            toggle.setAttribute('aria-label', 'Tutup menu navigasi');
            // Cegah scroll di belakang saat drawer terbuka
            document.body.style.overflow = 'hidden';
            // Fokus ke link pertama (aksesibilitas keyboard)
            const firstLink = menu.querySelector('.nav-link');
            if (firstLink) firstLink.focus();
        };

        const closeMenu = () => {
            menu.classList.remove('open');
            overlay.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Buka menu navigasi');
            document.body.style.overflow = '';
            toggle.focus(); // Kembalikan fokus ke toggle
        };

        toggle.addEventListener('click', () => {
            toggle.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu();
        });

        // Tutup saat klik overlay
        overlay.addEventListener('click', closeMenu);

        // Tutup saat klik link navigasi
        navLinks.forEach(link => link.addEventListener('click', closeMenu));

        // Tutup dengan Escape (aksesibilitas keyboard)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menu.classList.contains('open')) {
                closeMenu();
            }
        });

        // Tutup saat layar diperlebar ke desktop (menghindari menu terbuka di resize)
        const mediaQuery = window.matchMedia('(min-width: 64em)');
        mediaQuery.addEventListener('change', (e) => {
            if (e.matches && menu.classList.contains('open')) closeMenu();
        });
    }


    /* ============================================================
       4. REVEAL ON SCROLL — IntersectionObserver
       Lebih performa dari scroll + getBoundingClientRect.
       Menghormati prefers-reduced-motion.
    ============================================================ */
    function initReveal() {
        // Jika user pilih reduce motion, langsung tampilkan semua
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            $$('.reveal').forEach(el => el.classList.add('active'));
            return;
        }

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    // Unobserve setelah reveal (efisiensi)
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,        // 10% elemen terlihat → trigger
            rootMargin: '0px 0px -40px 0px' // Sedikit sebelum batas bawah
        });

        $$('.reveal').forEach(el => revealObserver.observe(el));
    }


    /* ============================================================
       5. SKILL PROGRESS BARS — Animasi saat card terlihat
    ============================================================ */
    function initSkillBars() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            $$('.skill-fill').forEach(bar => {
                bar.style.width = bar.style.getPropertyValue('--target') || '0%';
            });
            return;
        }

        const barObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const fill = entry.target.querySelector('.skill-fill');
                    if (fill) {
                        // Ambil nilai target dari CSS custom property inline style
                        const target = fill.style.getPropertyValue('--target') || '0%';
                        // Delay kecil agar animasi terasa disengaja
                        setTimeout(() => {
                            fill.style.width = target;
                        }, 150);
                    }
                    barObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        $$('.skill-card').forEach(card => barObserver.observe(card));
    }


    /* ============================================================
       6. FORM — Validasi, Submit Async, Feedback
       IMK: Inline error per field, loading state, success/error
    ============================================================ */
    function initForm() {
        const form   = $('#portfolio-form');
        const status = $('#form-status');
        const btn    = $('#submit-btn');

        if (!form) return;

        /**
         * Validasi satu field dan tampilkan pesan error inline.
         * @param {HTMLElement} field
         * @returns {boolean} valid
         */
        const validateField = (field) => {
            const errorEl = $(`#${field.id}-error`);
            if (!errorEl) return true;

            let msg = '';
            if (field.validity.valueMissing) {
                msg = 'Wajib diisi.';
            } else if (field.validity.typeMismatch) {
                msg = 'Format tidak valid.';
            } else if (field.validity.tooShort) {
                msg = `Minimal ${field.minLength} karakter.`;
            }

            errorEl.textContent = msg;
            field.setAttribute('aria-invalid', msg ? 'true' : 'false');
            return !msg;
        };

        // Validasi real-time saat user meninggalkan field (blur)
        $$('input, textarea', form).forEach(field => {
            field.addEventListener('blur', () => validateField(field));
            field.addEventListener('input', () => {
                if (field.getAttribute('aria-invalid') === 'true') {
                    validateField(field); // Re-validasi live setelah ada error
                }
            });
        });

        /** Set state loading tombol submit */
        const setLoading = (loading) => {
            btn.disabled = loading;
            btn.innerHTML = loading
                ? '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Mengirim...'
                : '<i class="fas fa-paper-plane" aria-hidden="true"></i> Kirim Pesan';
        };

        /** Tampilkan status hasil submit */
        const showStatus = (msg, isSuccess) => {
            status.textContent = msg;
            status.style.color = isSuccess ? 'var(--clr-blue)' : '#ef4444';
        };

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Validasi semua field sebelum submit
            const fields = $$('input, textarea', form);
            const allValid = fields.map(validateField).every(Boolean);
            if (!allValid) {
                // Fokus ke field error pertama (aksesibilitas)
                const firstInvalid = fields.find(f => f.getAttribute('aria-invalid') === 'true');
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            setLoading(true);
            showStatus('', true);

            try {
                const res = await fetch(form.action, {
                    method: 'POST',
                    body: new FormData(form),
                    headers: { 'Accept': 'application/json' }
                });

                if (res.ok) {
                    showStatus('✅ Pesan berhasil terkirim! Saya akan segera membalas.', true);
                    form.reset();
                    // Reset ARIA invalid
                    fields.forEach(f => f.removeAttribute('aria-invalid'));
                } else {
                    const data = await res.json().catch(() => ({}));
                    showStatus(
                        data?.errors?.[0]?.message
                            ? `❌ ${data.errors[0].message}`
                            : '❌ Terjadi kesalahan. Silakan coba lagi.',
                        false
                    );
                }
            } catch {
                showStatus('❌ Gagal mengirim. Periksa koneksi internet Anda.', false);
            } finally {
                setLoading(false);
            }
        });
    }


    /* ============================================================
       7. SMOOTH SCROLL + OFFSET NAVBAR
       Koreksi offset untuk navbar fixed agar tidak menimpa heading.
    ============================================================ */
    function initSmoothScroll() {
        const nav = $('#navbar');

        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href');
                if (targetId === '#') return;

                const target = $(targetId);
                if (!target) return;

                e.preventDefault();

                const navH   = nav ? nav.offsetHeight : 0;
                const offset = target.getBoundingClientRect().top + window.scrollY - navH - 16;

                window.scrollTo({ top: offset, behavior: 'smooth' });
            });
        });
    }


    /* ============================================================
       INIT — Jalankan semua modul setelah DOM siap
    ============================================================ */
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        initNavbar();
        initMobileNav();
        initReveal();
        initSkillBars();
        initForm();
        initSmoothScroll();
    });

})();
