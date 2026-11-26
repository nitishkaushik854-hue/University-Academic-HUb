/**
 * IEM Student Hub — Courses / Syllabus Application Logic
 * Selection flow: Stream → Year → Section → View Courses → Subject → Syllabus
 */
(function () {
  "use strict";

  // ── COURSE DATA (from supplied syllabus images) ──────────
  const courseData = {
    "1st Year": [
      {
        name: "Mathematics – Calculus",
        code: "BSCM103A",
        semester: "1st Semester",
        credit: 4,
        lectureHours: 48,
        prerequisite: "High School Mathematics",
        icon: "Σ",
        image: "assets/courses/1st-year-math.png",
      },
      {
        name: "Python for Problem Solving",
        code: "ESCCS102",
        semester: "1st Semester",
        credit: 3,
        lectureHours: 42,
        prerequisite: "Basic Computer Knowledge",
        icon: "🐍",
        image: "assets/courses/1st-year-python.png",
      },
      {
        name: "Programming for Problem Solving using C",
        code: "ESCCS102",
        semester: "1st Semester",
        credit: 3,
        lectureHours: 42,
        prerequisite: "Basic Programming Knowledge",
        icon: "C",
        image: "assets/courses/1st-year-c.png",
      },
    ],
    "2nd Year": [
      {
        name: "Data Structures and Algorithms (DSA)",
        code: "",
        semester: "",
        credit: 4,
        lectureHours: 48,
        prerequisite: "Basic Programming & Problem Solving",
        courseLevel: "2nd Year B.Tech",
        icon: "⟨⟩",
        image: "assets/courses/2nd-year-dsa.png",
      },
      {
        name: "Professional Presentation",
        code: "",
        semester: "",
        credit: 5,
        lectureHours: 5,
        prerequisite: "Basic Communication Skills & Computer Literacy",
        courseLevel: "2nd Year B.Tech",
        icon: "📊",
        image: "assets/courses/2nd-year-professional-presentation.png",
      },
      {
        name: "Engineering Mathematics",
        code: "",
        semester: "",
        credit: 4,
        lectureHours: 48,
        prerequisite: "Higher Secondary Mathematics",
        courseLevel: "2nd Year B.Tech",
        icon: "∑",
        image: "assets/courses/2nd-year-mathematics.png",
      },
    ],
  };

  const STREAMS = [
    { id: "cse-ai", label: "CSE AI", subtitle: "Artificial Intelligence" },
    { id: "cse-iot", label: "CSE IoT", subtitle: "Internet of Things" },
    { id: "cse-ds", label: "CSE Data Science", subtitle: "Data Science" },
    { id: "cse-iot-cs-bt", label: "CSE (IoT, CS & BT)", subtitle: "IoT, CS & Blockchain Technology" },
  ];
  const YEARS = ["1st Year", "2nd Year"];
  const SECTIONS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // ── STATE ────────────────────────────────────────────────
  let state = { stream: null, year: null, section: null, view: "selection" };

  // ── DOM ──────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const selectionPanel = $("selection-panel");
  const subjectsPanel = $("subjects-panel");
  const syllabusPanel = $("syllabus-panel");
  const streamCards = $("stream-cards");
  const yearCards = $("year-cards");
  const sectionSelect = $("section-select");
  const viewCoursesBtn = $("view-courses-btn");

  const step1 = $("step-1"), step2 = $("step-2"), step3 = $("step-3");
  const pLine1 = $("progress-line-1"), pLine2 = $("progress-line-2");
  const yearContainer = $("year-container"), sectionContainer = $("section-container"), btnContainer = $("btn-container");
  const streamError = $("stream-error"), yearError = $("year-error"), sectionError = $("section-error");

  // ── STREAM SELECTION ─────────────────────────────────────
  function initStreamCards() {
    if (!streamCards) return;
    streamCards.innerHTML = "";
    STREAMS.forEach((s) => {
      const card = document.createElement("button");
      card.className = "stream-card";
      card.setAttribute("role", "radio");
      card.setAttribute("aria-checked", "false");
      card.setAttribute("aria-label", s.label);
      card.dataset.stream = s.label;
      card.innerHTML = `<span class="stream-card-name">${s.label}</span><span class="stream-card-subtitle">${s.subtitle}</span>`;
      card.addEventListener("click", () => selectStream(s.label));
      streamCards.appendChild(card);
    });
  }

  function selectStream(label) {
    state.stream = label;
    state.year = null;
    state.section = null;
    document.querySelectorAll("#stream-cards .stream-card").forEach((c) => {
      const sel = c.dataset.stream === label;
      c.classList.toggle("selected", sel);
      c.setAttribute("aria-checked", sel ? "true" : "false");
    });
    yearContainer.classList.remove("disabled");
    yearContainer.classList.add("animate-in");
    document.querySelectorAll("#year-cards .year-card").forEach((c) => { c.classList.remove("selected"); c.setAttribute("aria-checked", "false"); });
    sectionContainer.classList.add("disabled");
    sectionSelect.value = "";
    btnContainer.classList.add("disabled");
    hide(streamError); hide(yearError); hide(sectionError);
    updateProgress();
  }

  // ── YEAR SELECTION ───────────────────────────────────────
  function initYearCards() {
    if (!yearCards) return;
    yearCards.innerHTML = "";
    YEARS.forEach((y) => {
      const card = document.createElement("button");
      card.className = "year-card";
      card.setAttribute("role", "radio");
      card.setAttribute("aria-checked", "false");
      card.setAttribute("aria-label", y);
      card.dataset.year = y;
      card.textContent = y;
      card.addEventListener("click", () => { if (!yearContainer.classList.contains("disabled")) selectYear(y); });
      yearCards.appendChild(card);
    });
  }

  function selectYear(label) {
    if (!state.stream) return;
    state.year = label;
    state.section = null;
    document.querySelectorAll("#year-cards .year-card").forEach((c) => {
      const sel = c.dataset.year === label;
      c.classList.toggle("selected", sel);
      c.setAttribute("aria-checked", sel ? "true" : "false");
    });
    sectionContainer.classList.remove("disabled");
    sectionContainer.classList.add("animate-in");
    sectionSelect.value = "";
    btnContainer.classList.add("disabled");
    hide(yearError); hide(sectionError);
    updateProgress();
  }

  // ── SECTION SELECTION ────────────────────────────────────
  function initSectionSelect() {
    if (!sectionSelect) return;
    sectionSelect.innerHTML = '<option value="" disabled selected>Select Section</option>';
    SECTIONS.forEach((s) => { const o = document.createElement("option"); o.value = s; o.textContent = "Section " + s; sectionSelect.appendChild(o); });
    sectionSelect.addEventListener("change", () => {
      if (sectionContainer.classList.contains("disabled")) return;
      state.section = sectionSelect.value;
      btnContainer.classList.remove("disabled");
      btnContainer.classList.add("animate-in");
      hide(sectionError);
      updateProgress();
    });
  }

  // ── PROGRESS ─────────────────────────────────────────────
  function updateProgress() {
    const s = state;
    step1.className = "progress-step " + (s.stream ? "completed" : "active");
    pLine1.classList.toggle("active", !!s.stream);
    step2.className = "progress-step " + (s.year ? "completed" : s.stream ? "active" : "");
    pLine2.classList.toggle("active", !!s.year);
    step3.className = "progress-step " + (s.section ? "completed" : s.year ? "active" : "");
  }

  // ── VIEW COURSES ─────────────────────────────────────────
  function initViewCoursesBtn() {
    if (!viewCoursesBtn) return;
    viewCoursesBtn.addEventListener("click", () => {
      let valid = true;
      if (!state.stream) { show(streamError, "Please select your stream."); valid = false; }
      if (!state.year) { show(yearError, "Please select your study year."); valid = false; }
      if (!state.section) { show(sectionError, "Please select your section."); valid = false; }
      if (!valid) return;
      showSubjects();
    });
  }

  function showSubjects() {
    state.view = "subjects";
    transitionPanels(selectionPanel, subjectsPanel, () => renderSubjects());
  }

  function showSelection() {
    state.view = "selection";
    transitionPanels(subjectsPanel, selectionPanel);
  }

  function showSyllabus(subject) {
    state.view = "syllabus";
    transitionPanels(subjectsPanel, syllabusPanel, () => renderSyllabus(subject));
  }

  function showCurriculumMatrix(summary) {
    state.view = "syllabus";
    transitionPanels(subjectsPanel, syllabusPanel, () => {
      $("syl-title").textContent = summary.title || "Semester III (Second Year) Curriculum";
      $("syl-identity").textContent = `${state.stream}  ·  ${state.year}  ·  Section ${state.section}  ·  26 Credits`;
      const zoomEl = $("zoom-controls");
      if (zoomEl) zoomEl.style.display = "none";
      const viewer = $("syllabus-viewer");
      if (viewer && typeof window.UAHSyllabus !== "undefined") {
        window.UAHSyllabus.renderCurriculumMatrix(viewer, summary);
      }
    });
  }

  function backToSubjects() {
    state.view = "subjects";
    transitionPanels(syllabusPanel, subjectsPanel);
  }

  function transitionPanels(outPanel, inPanel, onShow) {
    outPanel.classList.add("slide-out");
    setTimeout(() => {
      outPanel.style.display = "none";
      outPanel.classList.remove("slide-out");
      inPanel.style.display = "block";
      void inPanel.offsetHeight;
      inPanel.classList.add("slide-in");
      if (onShow) onShow();
      window.scrollTo({ top: inPanel.offsetTop - 90, behavior: "smooth" });
      setTimeout(() => inPanel.classList.remove("slide-in"), 500);
    }, 350);
  }

  // ── RENDER SUBJECTS ──────────────────────────────────────
  async function renderSubjects() {
    $("subj-identity").textContent = `${state.stream}  ·  ${state.year}  ·  Section ${state.section}`;
    $("subj-stream").textContent = state.stream;
    $("subj-year").textContent = state.year;
    $("subj-section").textContent = "Section " + state.section;

    const grid = $("subject-grid");
    const currBtn = $("courses-curriculum-btn");
    if (currBtn) currBtn.style.display = "none";

    let baseSubjects = courseData[state.year] || [];
    let curriculumSummary = null;

    if (state.year === "2nd Year") {
      grid.innerHTML = `<div class="no-data"><p>Loading official Semester III subjects &amp; syllabus...</p></div>`;
      try {
        const res = await fetch("/api/universities/uem/academic-data?department=Computer%20Science&semester=3rd%20Semester");
        if (res.ok) {
          const json = await res.json();
          const apiCourses = json && json.data && json.data.courses;
          if (Array.isArray(apiCourses) && apiCourses.length > 0) {
            baseSubjects = apiCourses.map((c) => ({
              ...c,
              semester: "3rd Semester",
              courseLevel: "2nd Year B.Tech",
              credit: c.labCredits ? `${c.credits}+${c.labCredits} Cr` : c.credits
            }));
          }
          curriculumSummary = (json && json.data && json.data.curriculumSummary) || null;
        }
      } catch (err) {
        console.warn("Could not fetch live Sem 3 courses, falling back to local cache:", err);
      }
    }

    if (currBtn && curriculumSummary) {
      currBtn.style.display = "inline-flex";
      currBtn.onclick = () => showCurriculumMatrix(curriculumSummary);
    }

    // Fetch custom added courses from localStorage
    let customSubjects = [];
    try {
      const stored = localStorage.getItem("customCourses");
      if (stored) {
        const parsed = JSON.parse(stored);
        customSubjects = parsed.filter(c => c.year === state.year && c.stream === state.stream);
      }
    } catch(e) {}

    const subjects = [...baseSubjects, ...customSubjects];
    grid.innerHTML = "";

    if (!subjects.length) {
      grid.innerHTML = '<div class="no-data"><p>Syllabus content is being added for this academic combination.</p></div>';
      return;
    }

    subjects.forEach((sub, i) => {
      const card = document.createElement("button");
      card.className = "subject-card";
      card.style.animationDelay = (i * 0.08) + "s";
      card.setAttribute("aria-label", "View syllabus for " + sub.name);
      
      const icon = sub.icon || "📚";
      const code = sub.code ? (sub.oldCode && sub.oldCode !== sub.code ? `${sub.code} (${sub.oldCode})` : sub.code) : "";
      const credit = sub.credit !== undefined ? sub.credit : "N/A";
      const hours = sub.lectureHours || "N/A";
      const professor = sub.professor ? `<span class="meta-tag">Prof. ${sub.professor}</span>` : (sub.instructor ? `<span class="meta-tag">${sub.instructor}</span>` : "");
      const examDate = sub.examDate ? `<span class="meta-tag">Exam: ${sub.examDate}</span>` : "";

      card.innerHTML = `
        <div class="subject-icon">${icon}</div>
        <h3 class="subject-name">${sub.name}</h3>
        <div class="subject-meta">
          ${code ? `<span class="meta-tag">${code}</span>` : ""}
          ${sub.courseLevel ? `<span class="meta-tag">${sub.courseLevel}</span>` : ""}
          ${sub.semester ? `<span class="meta-tag">${sub.semester}</span>` : ""}
          ${professor}
          ${examDate}
        </div>
        <div class="subject-details">
          <div class="detail-item"><span class="detail-label">Credit</span><span class="detail-value">${credit}</span></div>
          <div class="detail-item"><span class="detail-label">Lecture Hours</span><span class="detail-value">${hours}</span></div>
        </div>
        <div class="subject-cta">
          ${sub.syllabus ? "View Full Sem 3 Syllabus" : "View Syllabus"}
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </div>
      `;
      card.addEventListener("click", () => showSyllabus(sub));
      grid.appendChild(card);
    });
  }

  // ── RENDER SYLLABUS ──────────────────────────────────────
  function renderSyllabus(subject) {
    $("syl-title").textContent = subject.name;
    const codePart = subject.code ? ` · ${subject.code}` : "";
    $("syl-identity").textContent = `${state.stream}  ·  ${state.year}  ·  Section ${state.section}${codePart}`;

    const viewer = $("syllabus-viewer");
    const zoomControls = $("zoom-controls");
    viewer.innerHTML = "";

    if (subject.syllabus && typeof window.UAHSyllabus !== "undefined") {
      if (zoomControls) zoomControls.style.display = "none";
      viewer.style.overflow = "visible";
      window.UAHSyllabus.renderCourseSyllabus(viewer, subject);
      return;
    }

    if (zoomControls) zoomControls.style.display = "flex";

    const img = document.createElement("img");
    img.src = subject.image;
    img.alt = subject.name + " — Full Syllabus";
    img.className = "syllabus-image";
    img.loading = "eager";
    img.decoding = "async";
    viewer.appendChild(img);

    // Reset zoom state
    currentZoom = 1;
    img.style.transform = "scale(1)";
    img.style.cursor = "zoom-in";

    img.addEventListener("click", () => {
      if (currentZoom < 2) { zoomIn(); } else { resetZoom(); }
    });
  }

  // ── ZOOM CONTROLS ────────────────────────────────────────
  let currentZoom = 1;
  const ZOOM_STEP = 0.3;
  const MAX_ZOOM = 3;
  const MIN_ZOOM = 1;

  function zoomIn() {
    currentZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);
    applyZoom();
  }
  function zoomOut() {
    currentZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);
    applyZoom();
  }
  function resetZoom() {
    currentZoom = 1;
    applyZoom();
  }
  function applyZoom() {
    const img = document.querySelector(".syllabus-image");
    if (!img) return;
    img.style.transform = `scale(${currentZoom})`;
    img.style.cursor = currentZoom > 1 ? "zoom-out" : "zoom-in";
    const wrapper = $("syllabus-viewer");
    if (wrapper) wrapper.style.overflow = currentZoom > 1 ? "auto" : "hidden";
  }

  function openFullscreen() {
    const viewer = $("syllabus-viewer");
    if (!viewer) return;
    if (viewer.requestFullscreen) viewer.requestFullscreen();
    else if (viewer.webkitRequestFullscreen) viewer.webkitRequestFullscreen();
    else if (viewer.msRequestFullscreen) viewer.msRequestFullscreen();
  }

  // ── INIT BUTTONS ─────────────────────────────────────────
  function initActions() {
    const changeBtn1 = $("change-profile-btn");
    if (changeBtn1) changeBtn1.addEventListener("click", () => {
      state.view = "selection";
      transitionPanels(subjectsPanel, selectionPanel);
    });

    const backBtn = $("back-to-subjects");
    if (backBtn) backBtn.addEventListener("click", backToSubjects);

    const changeSyl = $("syl-change-btn");
    if (changeSyl) changeSyl.addEventListener("click", () => {
      state.view = "selection";
      syllabusPanel.classList.add("slide-out");
      setTimeout(() => {
        syllabusPanel.style.display = "none";
        syllabusPanel.classList.remove("slide-out");
        selectionPanel.style.display = "block";
        void selectionPanel.offsetHeight;
        selectionPanel.classList.add("slide-in");
        window.scrollTo({ top: selectionPanel.offsetTop - 90, behavior: "smooth" });
        setTimeout(() => selectionPanel.classList.remove("slide-in"), 500);
      }, 350);
    });

    const zoomInBtn = $("zoom-in-btn");
    const zoomOutBtn = $("zoom-out-btn");
    const resetBtn = $("zoom-reset-btn");
    const fullscreenBtn = $("fullscreen-btn");

    if (zoomInBtn) zoomInBtn.addEventListener("click", zoomIn);
    if (zoomOutBtn) zoomOutBtn.addEventListener("click", zoomOut);
    if (resetBtn) resetBtn.addEventListener("click", resetZoom);
    if (fullscreenBtn) fullscreenBtn.addEventListener("click", openFullscreen);

    const printBtn = $("print-syl-btn");
    if (printBtn) printBtn.addEventListener("click", () => window.print());
  }

  // ── NAV SCROLL ───────────────────────────────────────────
  const siteHeader = $("site-header");
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) { window.requestAnimationFrame(() => { siteHeader.classList.toggle("scrolled", window.scrollY > 50); ticking = false; }); ticking = true; }
  }, { passive: true });

  // ── MOBILE MENU ──────────────────────────────────────────
  const mobileMenuBtn = $("mobile-menu-btn");
  const mobileMenu = $("mobile-menu");
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      const open = mobileMenu.classList.toggle("active");
      mobileMenuBtn.classList.toggle("active", open);
      mobileMenuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      mobileMenu.setAttribute("aria-hidden", open ? "false" : "true");
      document.body.style.overflow = open ? "hidden" : "";
    });
    mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
      mobileMenu.classList.remove("active"); mobileMenuBtn.classList.remove("active");
      mobileMenuBtn.setAttribute("aria-expanded", "false"); mobileMenu.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }));
  }

  // ── HELPERS ──────────────────────────────────────────────
  function show(el, msg) { if (el) { el.textContent = msg; el.style.display = "block"; } }
  function hide(el) { if (el) el.style.display = "none"; }

  // ── INIT ─────────────────────────────────────────────────
  function init() {
    initStreamCards();
    initYearCards();
    initSectionSelect();
    initViewCoursesBtn();
    initActions();
    updateProgress();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
