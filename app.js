/**
 * IEM Student Hub — Homepage Application Logic
 * Handles: video autoplay, navigation scroll behavior,
 * mobile menu, entrance animations via IntersectionObserver.
 */

(function () {
  "use strict";

  // ─────────────────────────────────────────────
  // 1. CINEMATIC HERO VIDEO — AUTOPLAY GUARANTEE
  // ─────────────────────────────────────────────
  const heroVideo = document.getElementById("hero-video");

  if (heroVideo) {
    heroVideo.muted = true;
    heroVideo.loop = true;
    heroVideo.playsInline = true;

    heroVideo.play().catch(() => {
      // Browser autoplay restriction — remain silent, retry on interaction
      const resumePlay = () => {
        heroVideo.play().catch(() => {});
        document.removeEventListener("click", resumePlay);
        document.removeEventListener("touchstart", resumePlay);
        document.removeEventListener("scroll", resumePlay);
      };
      document.addEventListener("click", resumePlay, { once: true });
      document.addEventListener("touchstart", resumePlay, { once: true });
      document.addEventListener("scroll", resumePlay, { once: true });
    });
  }

  // ─────────────────────────────────────────────
  // 2. NAVIGATION — SCROLL STATE
  // ─────────────────────────────────────────────
  const siteHeader = document.getElementById("site-header");
  let lastScrollY = 0;
  let ticking = false;

  function updateNavOnScroll() {
    const scrollY = window.scrollY;

    if (scrollY > 50) {
      siteHeader.classList.add("scrolled");
    } else {
      siteHeader.classList.remove("scrolled");
    }

    lastScrollY = scrollY;
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(updateNavOnScroll);
      ticking = true;
    }
  }, { passive: true });

  // ─────────────────────────────────────────────
  // 3. MOBILE MENU TOGGLE
  // ─────────────────────────────────────────────
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.toggle("active");
      mobileMenuBtn.classList.toggle("active", isOpen);
      mobileMenuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      mobileMenu.setAttribute("aria-hidden", isOpen ? "false" : "true");

      // Prevent body scroll when menu is open
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    // Close mobile menu on link click
    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("active");
        mobileMenuBtn.classList.remove("active");
        mobileMenuBtn.setAttribute("aria-expanded", "false");
        mobileMenu.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
      });
    });
  }

  // ─────────────────────────────────────────────
  // 4. HERO ENTRANCE ANIMATION
  // ─────────────────────────────────────────────
  const heroContent = document.getElementById("hero-content");

  // Trigger hero animation shortly after page load
  if (heroContent) {
    // Small delay for video to start settling
    setTimeout(() => {
      heroContent.classList.add("animate");
    }, 300);
  }

  // ─────────────────────────────────────────────
  // 5. SCROLL-TRIGGERED ENTRANCE ANIMATIONS
  // ─────────────────────────────────────────────
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (!prefersReducedMotion) {
    const animateTargets = [
      { el: document.getElementById("welcome-text"), threshold: 0.2 },
      { el: document.getElementById("welcome-image"), threshold: 0.2 },
      { el: document.getElementById("about-image"), threshold: 0.2 },
      { el: document.getElementById("about-text"), threshold: 0.2 },
    ];

    const observerCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate");
          observer.unobserve(entry.target);
        }
      });
    };

    animateTargets.forEach(({ el, threshold }) => {
      if (!el) return;

      const observer = new IntersectionObserver(observerCallback, {
        root: null,
        rootMargin: "0px 0px -60px 0px",
        threshold: threshold,
      });

      observer.observe(el);
    });
  } else {
    // If reduced motion is preferred, show everything immediately
    document
      .querySelectorAll(
        "#welcome-text, #welcome-image, #about-image, #about-text"
      )
      .forEach((el) => {
        el.classList.add("animate");
      });
  }

  // ─────────────────────────────────────────────
  // 6. SMOOTH SCROLL FOR ANCHOR LINKS
  // ─────────────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const targetId = anchor.getAttribute("href");
      if (targetId === "#") return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const navHeight = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--nav-height"
          )
        ) || 72;

        const targetPosition =
          targetEl.getBoundingClientRect().top + window.scrollY - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      }
    });
  });

  // ─────────────────────────────────────────────
  // 7. ESCAPE HTML HELPER
  // ─────────────────────────────────────────────
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ─────────────────────────────────────────────
  // 8. CAMPUS EVENTS SECTION LOGIC (via shared UAHEvents)
  // ─────────────────────────────────────────────
  function initEventsSection() {
    const mountEl = document.getElementById("uem-events-mount");
    const summaryEl = document.getElementById("uem-events-summary");
    if (!mountEl || typeof window.UAHEvents === "undefined") return;

    window.UAHEvents.mount({
      rootEl: mountEl,
      summaryEl,
      apiUrl: "/api/universities/uem/events"
    });
  }

  // ─────────────────────────────────────────────
  // 9. STUDENT ROSTER SECTION LOGIC
  // ─────────────────────────────────────────────
  let allStudents = [];

  async function initRosterSection() {
    const tbody = document.getElementById("roster-tbody");
    const countPill = document.getElementById("roster-count-pill");
    const searchInput = document.getElementById("roster-search");
    if (!tbody) return;

    try {
      const res = await fetch("/api/universities/uem/students");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      allStudents = json.data || [];

      if (countPill) {
        countPill.textContent = `${allStudents.length} Registered Students`;
      }

      renderRosterTable(allStudents);
    } catch (err) {
      console.warn("Could not load students from API:", err);
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem; color: #DC2626;">
            Failed to retrieve student roster from service.
          </td>
        </tr>
      `;
    }

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (!query) {
          renderRosterTable(allStudents);
          if (countPill) countPill.textContent = `${allStudents.length} Registered Students`;
          return;
        }

        const filtered = allStudents.filter((s) => {
          const matchName = s.name && s.name.toLowerCase().includes(query);
          const matchRoll = s.rollNo && s.rollNo.toString().includes(query);
          const matchEnroll = s.enrollmentNo && s.enrollmentNo.toLowerCase().includes(query);
          const matchReg = s.registrationNo && s.registrationNo.toLowerCase().includes(query);
          return matchName || matchRoll || matchEnroll || matchReg;
        });

        renderRosterTable(filtered);
        if (countPill) {
          countPill.textContent = `${filtered.length} of ${allStudents.length} Students`;
        }
      });
    }
  }

  function renderRosterTable(students) {
    const tbody = document.getElementById("roster-tbody");
    if (!tbody) return;

    if (!students || students.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-secondary);">
            No students found matching your search.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = students.map((s) => `
      <tr>
        <td>
          <span class="roster-roll-badge">${s.rollNo}</span>
        </td>
        <td>
          <span class="roster-name-cell">${escapeHtml(s.name)}</span>
        </td>
        <td>
          <span class="roster-enroll-cell">${escapeHtml(s.enrollmentNo || "—")}</span>
        </td>
        <td>
          <span class="roster-reg-cell">${escapeHtml(s.registrationNo || "—")}</span>
        </td>
        <td style="color: var(--text-secondary); font-size: 0.85rem;">
          ${escapeHtml(s.degree || "B.Tech")} · ${escapeHtml(s.department || "CSE (IoT)")}
        </td>
        <td>
          <span class="event-status-badge open">Active</span>
        </td>
        <td style="text-align: right;">
          <button class="roster-action-btn" data-roll="${s.rollNo}" data-name="${escapeHtml(s.name)}" data-enroll="${escapeHtml(s.enrollmentNo || "")}">
            Identify Myself →
          </button>
        </td>
      </tr>
    `).join("");

    // Attach quick identify handlers
    tbody.querySelectorAll(".roster-action-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const studentName = btn.getAttribute("data-name");
        const rollNo = btn.getAttribute("data-roll");
        const enrollNo = btn.getAttribute("data-enroll");

        sessionStorage.setItem("studentName", studentName || "");
        sessionStorage.setItem("studentId", enrollNo || rollNo || "");
        sessionStorage.setItem("studentDegree", "B.Tech");
        sessionStorage.setItem("studentDomain", "Computer Science");
        sessionStorage.setItem("studentSemester", "3rd Semester");
        sessionStorage.setItem("selectedUniversity", "uem");

        window.location.href = "/university";
      });
    });
  }

  // ─────────────────────────────────────────────
  // 10. INITIALIZATION RUNNER
  // ─────────────────────────────────────────────
  initEventsSection();
  initRosterSection();

})();
