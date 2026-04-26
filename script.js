document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggle-btn');
    const body = document.documentElement;
    const icon = toggleBtn.querySelector('i');

    const setTheme = (theme) => {
        body.setAttribute('data-theme', theme);
        icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        localStorage.setItem('theme', theme);
    };

    setTheme(localStorage.getItem('theme') || 'dark');

    toggleBtn.addEventListener('click', () => {
        setTheme(body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });

    window.addEventListener('scroll', () => {
        const nav = document.querySelector('nav');
        if (window.scrollY > 50) {
            nav.style.padding = '10px 0';
            nav.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
        } else {
            nav.style.padding = '0';
            nav.style.boxShadow = 'none';
        }
    });

    const revealElements = document.querySelectorAll('.reveal');
    const revealOnScroll = () => {
        revealElements.forEach(el => {
            if (el.getBoundingClientRect().top < window.innerHeight * 0.85) {
                el.classList.add('active');
            }
        });
    };
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();

    const form = document.getElementById("portfolio-form");
    const status = document.getElementById("form-status");
    const btn = document.getElementById("submit-btn");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: { 'Accept': 'application/json' }
            });
            if (response.ok) {
                status.innerHTML = "✅ Pesan Terkirim!";
                status.style.color = "#22c55e";
                form.reset();
            } else {
                status.innerHTML = "❌ Terjadi kesalahan.";
                status.style.color = "#ef4444";
            }
        } catch {
            status.innerHTML = "❌ Gagal mengirim.";
        } finally {
            btn.disabled = false;
            btn.innerHTML = "Kirim Pesan";
        }
    });
});