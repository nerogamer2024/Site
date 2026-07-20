function renderSections() {
  const container = document.getElementById("sections-container");
  if (!container) return;

  container.innerHTML = SECTIONS.map(
    (section, index) => `
    <section class="hack-section" id="${section.id}" data-index="${index}">
      
      <!-- رأس القسم مع إرجاع الأيقونة الديناميكية -->
      <div class="section-header reveal">
        <div class="section-icon">${section.icon}</div>
        <div class="section-info">
          <h2 class="section-title">${section.title}</h2>
          <p class="section-desc">${section.description}</p>
        </div>
      </div>

      <!-- الميزات البرمجية: الصورة يسار والكلام يمين -->
      <div class="program-showcase-flow">
        ${section.features.map((feat, i) => `
          <div class="showcase-row reveal">
            <div class="program-media">
              <img src="${feat.image}" alt="${feat.title}" class="program-img" onerror="this.onerror=null; this.src='https://placehold.co/600x400/0a1020/3b82f6?text=${feat.badge}';" />
              <div class="image-overlay-glow"></div>
            </div>
            <div class="program-feature-info">
              <span class="feat-badge">${feat.badge}</span>
              <h3 class="feat-title">${feat.title}</h3>
              <p class="feat-desc">${feat.desc}</p>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- زر التحميل مع إرجاع أيقونة الـ SVG -->
      <div class="download-action-wrapper reveal">
        <a href="${section.downloadLink}" class="modern-download-btn" target="_blank">
          <div class="btn-content">
            <svg class="download-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            <span class="btn-text">Download ${section.title}</span>
            <span class="btn-subtext">Secure & Verified Setup</span>
          </div>
        </a>
      </div>

    </section>
  `
  ).join("");
}

function renderNav() {
  const nav = document.getElementById("section-nav");
  if (!nav) return;

  nav.innerHTML = SECTIONS.map(
    (section) => `
    <a href="#${section.id}" class="nav-link" data-section="${section.id}">
      <span class="nav-icon">${section.icon}</span>
      <span class="nav-text">${section.title}</span>
    </a>
  `
  ).join("");
}

function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    },
    { threshold: 0.05 }
  );
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

function initNavHighlight() {
  const sections = document.querySelectorAll(".hack-section");
  const navLinks = document.querySelectorAll(".nav-link");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => link.classList.remove("active"));
          const active = document.querySelector(`.nav-link[data-section="${entry.target.id}"]`);
          if (active) active.classList.add("active");
        }
      });
    },
    { threshold: 0.2, rootMargin: "-10% 0px -50% 0px" }
  );
  sections.forEach((section) => observer.observe(section));
}

function initMobileMenu() {
  const toggle = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");
  if (!toggle || !sidebar) return;

  toggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    overlay?.classList.toggle("visible");
    toggle.classList.toggle("active");
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const target = document.querySelector(anchor.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function initCounterAnimation() {
  const stats = document.querySelectorAll(".stat-number");
  stats.forEach((stat) => {
    const target = parseInt(stat.dataset.target, 10);
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        let current = 0;
        const duration = 1000;
        const start = performance.now();
        function update(now) {
          const progress = Math.min((now - start) / duration, 1);
          stat.textContent = Math.round(progress * target);
          if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(stat);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("site-name").textContent = SITE_CONFIG.siteName;
  document.getElementById("site-name-hero").textContent = SITE_CONFIG.siteName;
  document.getElementById("hero-tagline").textContent = SITE_CONFIG.tagline;
  document.getElementById("hero-btn").textContent = SITE_CONFIG.heroButton;
  document.getElementById("hero-badge").textContent = SITE_CONFIG.heroBadge;
  
  document.getElementById("sections-count").dataset.target = SECTIONS.length; 

  const firstSection = SECTIONS[0]?.id || "";
  const heroBtn = document.getElementById("hero-btn");
  if (heroBtn && firstSection) heroBtn.href = `#${firstSection}`;

  renderNav();
  renderSections();
  initScrollReveal();
  initNavHighlight();
  initMobileMenu();
  initSmoothScroll();
  initCounterAnimation();
});