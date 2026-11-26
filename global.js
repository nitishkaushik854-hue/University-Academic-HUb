/** University Academic Hub — Global Home JS */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // Video autoplay & fallback handling
  const video = $("hero-video");
  const fallback = document.querySelector(".global-hero-fallback");
  if (video) {
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        if (fallback) fallback.style.display = "block";
      });
    }
    video.addEventListener("ended", () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    });
  }

  // Smooth scroll for anchor links (e.g. #platform-intro)
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const header = $("global-header");
        const headerHeight = header ? header.offsetHeight : 72;
        const targetPos = targetEl.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({
          top: targetPos,
          behavior: "smooth"
        });
      }
    });
  });

  // Nav scroll state
  const header = $("global-header");
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle("scrolled", window.scrollY > 50);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Mobile menu
  const btn = $("mobile-menu-btn");
  const menu = $("mobile-menu");
  if (btn && menu) {
    btn.addEventListener("click", () => {
      const open = menu.classList.toggle("active");
      btn.classList.toggle("active", open);
      btn.setAttribute("aria-expanded", open);
      menu.setAttribute("aria-hidden", !open);
      document.body.style.overflow = open ? "hidden" : "";
    });
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
      menu.classList.remove("active");
      btn.classList.remove("active");
      btn.setAttribute("aria-expanded", "false");
      menu.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }));
  }
})();
