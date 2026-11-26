/**
 * University Academic Hub — University Gateway & Student Dashboard Logic
 * Integrates:
 * - GET /api/universities (search, state, type filters)
 * - GET /api/universities/:id
 * - POST /api/student/identify (session token & profile verification)
 * - GET /api/universities/:id/academic-data (courses, timetables, resources)
 */
(function () {
  "use strict";

  const API_BASE = ""; // Relative path to current domain/port

  // DOM Elements
  const $ = (id) => document.getElementById(id);
  const uniCards = $("uni-cards");
  const uniCountBadge = $("uni-count-badge");
  const uniSearch = $("uni-search");
  const clearSearchBtn = $("clear-search-btn");
  const filterState = $("filter-state");
  const filterType = $("filter-type");
  const resetFiltersBtn = $("reset-filters-btn");
  const emptyResetBtn = $("empty-reset-btn");
  const retryFetchBtn = $("retry-fetch-btn");
  const emptyState = $("uni-empty-state");
  const errorState = $("uni-error-state");

  const nameInput = $("student-name");
  const idInput = $("student-id");
  const degreeInput = $("student-degree");
  const domainInput = $("student-domain");
  const semesterInput = $("student-semester");
  const enterBtn = $("enter-btn");
  const enterSpinner = $("enter-spinner");
  const globalError = $("global-error");
  const preview = $("confirmation-preview");

  const gatewayPanel = $("gateway-panel");
  const dashboardPanel = $("dashboard-panel");
  const comingSoonPanel = $("coming-soon-panel");

  // State
  let universities = [];
  let selectedUni = null;
  let searchTimeout = null;
  let currentAcademicData = null;
  let activeTimetableDay = "Monday";

  // ─────────────────────────────────────────────────────────────
  // 1. FETCH & RENDER UNIVERSITIES
  // ─────────────────────────────────────────────────────────────
  async function fetchUniversities() {
    renderSkeletons();
    hideError(globalError);
    if (emptyState) emptyState.style.display = "none";
    if (errorState) errorState.style.display = "none";

    const search = uniSearch ? uniSearch.value.trim() : "";
    const state = filterState ? filterState.value.trim() : "";
    const type = filterType ? filterType.value.trim() : "";

    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (state) params.append("state", state);
    if (type) params.append("type", type);

    const url = `${API_BASE}/api/universities?${params.toString()}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const result = await response.json();
      universities = result.data || [];

      if (uniCountBadge) {
        uniCountBadge.textContent = `${universities.length} institutions`;
      }

      renderUniversityCards(universities);
    } catch (err) {
      console.error("Failed to fetch universities:", err);
      if (uniCards) uniCards.innerHTML = "";
      if (uniCountBadge) uniCountBadge.textContent = "Offline";
      if (errorState) errorState.style.display = "block";
    }
  }

  function renderSkeletons() {
    if (!uniCards) return;
    uniCards.innerHTML = `
      <div class="uni-card skeleton-card"><div class="skeleton-icon"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>
      <div class="uni-card skeleton-card"><div class="skeleton-icon"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>
      <div class="uni-card skeleton-card"><div class="skeleton-icon"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>
    `;
  }

  function renderUniversityCards(list) {
    if (!uniCards) return;
    uniCards.innerHTML = "";

    if (!list || list.length === 0) {
      if (emptyState) emptyState.style.display = "block";
      return;
    }
    if (emptyState) emptyState.style.display = "none";

    list.forEach((uni) => {
      const card = document.createElement("button");
      card.className = "uni-card";
      card.setAttribute("role", "radio");
      card.setAttribute("type", "button");
      card.setAttribute("aria-label", uni.name);
      card.dataset.id = uni.id;

      const isSelected = selectedUni && selectedUni.id === uni.id;
      if (isSelected) {
        card.classList.add("selected");
        card.setAttribute("aria-checked", "true");
      } else {
        card.setAttribute("aria-checked", "false");
      }

      const statusClass = uni.status === "active" ? "active" : "coming-soon";
      const statusText = uni.status === "active" ? "Active Portal" : "Coming Soon";

      card.innerHTML = `
        <div class="uni-card-top-row">
          <span class="uni-card-icon">${uni.icon || "🏛️"}</span>
          <span class="uni-card-status-pill ${statusClass}">${statusText}</span>
        </div>
        <div class="uni-card-name">${escapeHtml(uni.name)}</div>
        <div class="uni-card-location">📍 ${escapeHtml(uni.city || "")}, ${escapeHtml(uni.state || "")}</div>
        <div class="uni-card-meta">
          <span class="uni-tag type-tag">${escapeHtml(uni.type || "University")}</span>
          ${uni.nirfRank ? `<span class="uni-tag">${escapeHtml(uni.nirfRank.split(' ')[0] + ' ' + (uni.nirfRank.split(' ')[1] || ''))}</span>` : ""}
          ${uni.stats && uni.stats.students ? `<span class="uni-tag">${escapeHtml(uni.stats.students)} Students</span>` : ""}
        </div>
      `;

      card.addEventListener("click", () => selectUniversity(uni));
      uniCards.appendChild(card);
    });
  }

  function selectUniversity(uni) {
    selectedUni = uni;
    document.querySelectorAll(".uni-card").forEach((c) => {
      const sel = c.dataset.id === uni.id;
      c.classList.toggle("selected", sel);
      c.setAttribute("aria-checked", sel ? "true" : "false");
    });

    hideError($("uni-error"));

    // Adapt department options if available
    if (uni.departments && Array.isArray(uni.departments) && domainInput) {
      const currentVal = domainInput.value;
      domainInput.innerHTML = `<option value="" disabled>Select your department</option>`;
      uni.departments.forEach((dept) => {
        const opt = document.createElement("option");
        opt.value = dept.includes("Computer") ? "Computer Science" : dept.includes("Electrical") ? "Electrical" : dept.includes("Mechanical") ? "Mechanical" : dept;
        opt.textContent = dept;
        if (opt.value === currentVal) opt.selected = true;
        domainInput.appendChild(opt);
      });
      if (!domainInput.value) {
        domainInput.selectedIndex = 1;
      }
    }

    updateFormState();
  }

  // ─────────────────────────────────────────────────────────────
  // 2. SEARCH & FILTER EVENT LISTENERS
  // ─────────────────────────────────────────────────────────────
  function initFilterListeners() {
    if (uniSearch) {
      uniSearch.addEventListener("input", () => {
        if (clearSearchBtn) {
          clearSearchBtn.style.display = uniSearch.value ? "block" : "none";
        }
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          fetchUniversities();
        }, 250);
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener("click", () => {
        uniSearch.value = "";
        clearSearchBtn.style.display = "none";
        fetchUniversities();
      });
    }

    if (filterState) filterState.addEventListener("change", fetchUniversities);
    if (filterType) filterType.addEventListener("change", fetchUniversities);

    const resetHandler = () => {
      if (uniSearch) uniSearch.value = "";
      if (clearSearchBtn) clearSearchBtn.style.display = "none";
      if (filterState) filterState.value = "";
      if (filterType) filterType.value = "";
      fetchUniversities();
    };

    if (resetFiltersBtn) resetFiltersBtn.addEventListener("click", resetHandler);
    if (emptyResetBtn) emptyResetBtn.addEventListener("click", resetHandler);
    if (retryFetchBtn) retryFetchBtn.addEventListener("click", fetchUniversities);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. FORM VALIDATION & CONFIRMATION PREVIEW
  // ─────────────────────────────────────────────────────────────
  function updateFormState() {
    const name = nameInput ? nameInput.value.trim() : "";
    const id = idInput ? idInput.value.trim() : "";
    const degree = degreeInput ? degreeInput.value : "";
    const domain = domainInput ? domainInput.value : "";
    const semester = semesterInput ? semesterInput.value : "";

    const allValid = name.length > 0 && id.length > 0 && degree && domain && semester && selectedUni !== null;

    if (enterBtn) {
      enterBtn.disabled = !allValid;
      enterBtn.classList.toggle("disabled", !allValid);
    }

    // Update confirmation summary preview
    if (preview) {
      if (allValid) {
        preview.style.display = "block";
        if ($("confirm-name")) $("confirm-name").textContent = name;
        if ($("confirm-id")) $("confirm-id").textContent = id;
        if ($("confirm-degree")) $("confirm-degree").textContent = degree;
        if ($("confirm-domain")) $("confirm-domain").textContent = domain;
        if ($("confirm-semester")) $("confirm-semester").textContent = semester;
        if ($("confirm-uni")) $("confirm-uni").textContent = selectedUni.name;
      } else {
        preview.style.display = "none";
      }
    }
  }

  function initFormListeners() {
    [nameInput, idInput].forEach((inp) => {
      if (inp) {
        inp.addEventListener("input", () => {
          hideError($(inp.id.replace("student-", "") + "-error"));
          updateFormState();
        });
      }
    });

    [degreeInput, domainInput, semesterInput].forEach((sel) => {
      if (sel) {
        sel.addEventListener("change", () => {
          hideError($(sel.id.replace("student-", "") + "-error"));
          updateFormState();
        });
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 4. STUDENT IDENTIFICATION (POST /api/student/identify)
  // ─────────────────────────────────────────────────────────────
  function initEnterBtn() {
    if (!enterBtn) return;

    enterBtn.addEventListener("click", async () => {
      const name = nameInput ? nameInput.value.trim() : "";
      const id = idInput ? idInput.value.trim() : "";
      const degree = degreeInput ? degreeInput.value : "";
      const domain = domainInput ? domainInput.value : "";
      const semester = semesterInput ? semesterInput.value : "";

      let valid = true;
      if (!name) { showError($("name-error"), "Please enter your full name."); valid = false; }
      if (!id) { showError($("id-error"), "Please enter your student ID or roll number."); valid = false; }
      if (!degree) { showError($("degree-error"), "Please select your academic degree."); valid = false; }
      if (!domain) { showError($("domain-error"), "Please select your engineering domain."); valid = false; }
      if (!semester) { showError($("semester-error"), "Please select your current semester."); valid = false; }
      if (!selectedUni) { showError($("uni-error"), "Please select your university."); valid = false; }

      if (!valid) {
        showError(globalError, "Please complete all student fields and select a university.");
        return;
      }

      hideError(globalError);
      setLoading(true);

      try {
        // Send POST to /api/student/identify
        const res = await fetch(`${API_BASE}/api/student/identify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            studentId: id,
            universityId: selectedUni.id,
            department: domain,
            semester,
            degree
          })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          const msg = (data.error && data.error.message) || "Identification failed. Please verify your details.";
          showError(globalError, msg);
          setLoading(false);
          return;
        }

        // Store session profile
        sessionStorage.setItem("uah_token", data.token);
        sessionStorage.setItem("studentName", name);
        sessionStorage.setItem("studentId", id);
        sessionStorage.setItem("studentDegree", degree);
        sessionStorage.setItem("studentDomain", domain);
        sessionStorage.setItem("studentSemester", semester);
        sessionStorage.setItem("selectedUniversity", selectedUni.id);

        setLoading(false);

        // Branching: direct campus portal route (like previous UEM -> /uem-home) vs inline dashboard vs coming soon
        if (selectedUni.status === "active" && selectedUni.route && degree === "B.Tech" && domain === "Computer Science") {
          const gateway = $("gateway-panel");
          if (gateway) gateway.classList.add("slide-out");
          setTimeout(() => {
            window.location.href = selectedUni.route;
          }, 350);
        } else if (selectedUni.status === "active") {
          loadStudentDashboard(data.student);
        } else {
          showComingSoon(selectedUni, degree, domain, semester);
        }

      } catch (err) {
        console.error("API error during student identification:", err);
        showError(globalError, "Network error: Unable to contact the verification service. Ensure server is running.");
        setLoading(false);
      }
    });
  }

  function setLoading(isLoading) {
    if (!enterBtn) return;
    enterBtn.disabled = isLoading;
    if (enterSpinner) enterSpinner.style.display = isLoading ? "inline-block" : "none";
    const textSpan = enterBtn.querySelector(".enter-btn-text");
    if (textSpan) textSpan.textContent = isLoading ? "Verifying Profile..." : "Enter University";
  }

  // ─────────────────────────────────────────────────────────────
  // 5. LOAD & RENDER STUDENT ACADEMIC DASHBOARD
  // ─────────────────────────────────────────────────────────────
  async function loadStudentDashboard(studentProfile) {
    if (!gatewayPanel || !dashboardPanel) return;

    // Transition panels
    gatewayPanel.classList.add("slide-out");
    setTimeout(() => {
      gatewayPanel.style.display = "none";
      gatewayPanel.classList.remove("slide-out");
      dashboardPanel.style.display = "block";
      dashboardPanel.classList.add("slide-in");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => dashboardPanel.classList.remove("slide-in"), 500);
    }, 350);

    // Populate header info
    if ($("dash-student-name")) $("dash-student-name").textContent = studentProfile.name;
    if ($("dash-student-id")) $("dash-student-id").textContent = `ID: ${studentProfile.studentId}`;
    if ($("dash-degree")) $("dash-degree").textContent = studentProfile.degree || "B.Tech";
    if ($("dash-domain")) $("dash-domain").textContent = studentProfile.department;
    if ($("dash-semester")) $("dash-semester").textContent = studentProfile.semester;
    if ($("dash-uni-name")) $("dash-uni-name").textContent = studentProfile.university.name;

    // Check campus portal link (e.g. UEM dedicated portal)
    const extLink = $("dash-external-link");
    if (extLink) {
      if (selectedUni && selectedUni.route) {
        extLink.href = selectedUni.route;
        extLink.textContent = `Open Dedicated Campus Portal ↗`;
        extLink.style.display = "inline-flex";
      } else {
        extLink.style.display = "none";
      }
    }

    // Fetch academic data
    await fetchAcademicData(studentProfile.university.id, studentProfile.department, studentProfile.semester);
  }

  async function fetchAcademicData(uniId, department, semester) {
    const loadingEl = $("dash-loading");
    const errorEl = $("dash-error");
    if (loadingEl) loadingEl.style.display = "block";
    if (errorEl) errorEl.style.display = "none";

    const params = new URLSearchParams({
      department: department || "Computer Science",
      semester: semester || "1st Semester"
    });

    try {
      const res = await fetch(`${API_BASE}/api/universities/${uniId}/academic-data?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      currentAcademicData = result.data;

      if (loadingEl) loadingEl.style.display = "none";

      renderCourses(currentAcademicData.courses || []);
      renderTimetable(currentAcademicData.timetable || {});
      renderResources(currentAcademicData.resources || []);
      renderDashboardEvents(currentAcademicData.events || []);
      renderDashboardRoster(currentAcademicData.students && currentAcademicData.students.list ? currentAcademicData.students.list : []);

    } catch (err) {
      console.error("Failed to fetch academic data:", err);
      if (loadingEl) loadingEl.style.display = "none";
      if (errorEl) {
        errorEl.style.display = "block";
        const msg = $("dash-error-msg");
        if (msg) msg.textContent = "Could not load curriculum data for this university.";
      }
    }
  }

  // ── COURSES RENDERING ──
  function renderCourses(courses) {
    const grid = $("dash-courses-grid");
    const countBadge = $("dash-course-count");
    const currBtn = $("view-curriculum-btn");
    if (countBadge) countBadge.textContent = courses.length;

    if (currBtn) {
      if (currentAcademicData && currentAcademicData.curriculumSummary) {
        const totCredits = currentAcademicData.curriculumSummary.totals && currentAcademicData.curriculumSummary.totals.credits;
        currBtn.textContent = `📋 Sem 3 Curriculum & Credit Scheme${totCredits ? ` (${totCredits} Credits)` : ""}`;
        currBtn.style.display = "inline-flex";
        currBtn.onclick = () => openCurriculumModal(currentAcademicData.curriculumSummary);
      } else {
        currBtn.style.display = "none";
      }
    }

    if (!grid) return;

    grid.innerHTML = "";

    if (!courses || courses.length === 0) {
      grid.innerHTML = `<p class="empty-text">No courses scheduled for this semester.</p>`;
      return;
    }

    courses.forEach((course, idx) => {
      const card = document.createElement("div");
      card.className = "course-card";
      const creditBadge = course.labCredits
        ? `${course.credits}+${course.labCredits} Cr`
        : `${course.credits || 4} Credits`;
      const hasSyl = Boolean(course.syllabus);

      card.innerHTML = `
        <div class="course-card-top">
          <div class="course-card-icon">${escapeHtml(course.icon || "📘")}</div>
          <div class="course-badges">
            <span class="course-code-badge">${escapeHtml(course.code || "CORE")}${course.oldCode && course.oldCode !== course.code ? ` / ${escapeHtml(course.oldCode)}` : ""}</span>
            <span class="course-credits-badge">${escapeHtml(creditBadge)}</span>
          </div>
        </div>
        <h4 class="course-title">${escapeHtml(course.name)}</h4>
        <p class="course-desc">${escapeHtml(course.description || "Core subject modules and technical prerequisites.")}</p>
        <div class="course-meta-list">
          <div class="course-meta-row">
            <span class="course-meta-label">Category:</span>
            <span class="course-meta-val">${escapeHtml(course.category || "Engineering")}</span>
          </div>
          <div class="course-meta-row">
            <span class="course-meta-label">Lecture Hours:</span>
            <span class="course-meta-val">${escapeHtml(course.lectureHours || 40)} hrs</span>
          </div>
          <div class="course-meta-row">
            <span class="course-meta-label">Faculty Mentor:</span>
            <span class="course-meta-val">${escapeHtml(course.instructor || "Senior Faculty")}</span>
          </div>
          ${course.prerequisite ? `
          <div class="course-meta-row">
            <span class="course-meta-label">Prerequisites:</span>
            <span class="course-meta-val">${escapeHtml(course.prerequisite)}</span>
          </div>` : ""}
        </div>
        ${(hasSyl || course.image) ? `
        <button class="view-syl-btn" type="button" data-course-idx="${idx}">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          ${hasSyl ? "View Full Syllabus & Modules" : "View Syllabus Module"}
        </button>` : ""}
      `;
      grid.appendChild(card);
    });

    // Modal syllabus click handlers
    grid.querySelectorAll(".view-syl-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-course-idx"), 10);
        const course = courses[idx];
        if (course) openSyllabusModal(course);
      });
    });
  }

  // ── TIMETABLE RENDERING ──
  function renderTimetable(timetable) {
    const cardsContainer = $("schedule-cards");
    if (!cardsContainer) return;

    const batchBadge = $("dash-timetable-batch");
    if (batchBadge) {
      if (timetable.batch) {
        batchBadge.textContent = timetable.batch;
        batchBadge.style.display = "inline-block";
      } else {
        batchBadge.style.display = "none";
      }
    }

    const routine = timetable.routine || {};
    const dayClasses = routine[activeTimetableDay] || [];

    cardsContainer.innerHTML = "";

    if (dayClasses.length === 0) {
      cardsContainer.innerHTML = `<div class="empty-state"><p class="empty-text">No routine scheduled for ${activeTimetableDay}.</p></div>`;
      return;
    }

    dayClasses.forEach((item) => {
      const card = document.createElement("div");
      const type = (item.type || "theory").toLowerCase();
      card.className = `schedule-item type-${type}`;

      const metaParts = [];
      if (item.faculty) metaParts.push(`<span>👤 ${escapeHtml(item.faculty)}</span>`);
      if (item.room) metaParts.push(`<span>📍 ${escapeHtml(item.room)}</span>`);

      card.innerHTML = `
        <div class="sched-time">⏰ ${escapeHtml(item.time)}</div>
        <div class="sched-period">${escapeHtml(item.period)}</div>
        <div class="sched-subject">
          <strong>${escapeHtml(item.subject)}</strong>
        </div>
        <div class="sched-faculty-room">
          ${metaParts.join(" · ") || `<span style="color:#94A3B8;">—</span>`}
        </div>
        <div class="sched-type-badge ${type}">
          ${escapeHtml(type)}
        </div>
      `;
      cardsContainer.appendChild(card);
    });
  }

  function initTimetableDaySelector() {
    const dayPills = document.querySelectorAll(".day-pill");
    dayPills.forEach((pill) => {
      pill.addEventListener("click", () => {
        dayPills.forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        activeTimetableDay = pill.dataset.day || "Monday";
        if (currentAcademicData && currentAcademicData.timetable) {
          renderTimetable(currentAcademicData.timetable);
        }
      });
    });

    const printBtn = $("print-timetable-btn");
    if (printBtn) {
      printBtn.addEventListener("click", () => window.print());
    }
  }

  // ── RESOURCES RENDERING ──
  function renderResources(resources) {
    const grid = $("dash-resources-grid");
    const countBadge = $("dash-resource-count");
    if (countBadge) countBadge.textContent = resources.length;
    if (!grid) return;

    grid.innerHTML = "";

    if (!resources || resources.length === 0) {
      grid.innerHTML = `<p class="empty-text">No resources available at this time.</p>`;
      return;
    }

    resources.forEach((res) => {
      const card = document.createElement("div");
      card.className = "resource-card";
      card.innerHTML = `
        <div class="res-card-top">
          <span class="res-type-pill">${escapeHtml(res.type || "Resource")}</span>
          <span class="res-category">${escapeHtml(res.category || "Academic")}</span>
        </div>
        <h4 class="res-title">${escapeHtml(res.title)}</h4>
        <p class="res-desc">${escapeHtml(res.description || "Institutional reference material.")}</p>
        <a class="res-action-btn" href="${escapeHtml(res.url || '#')}" target="_blank" rel="noopener noreferrer">
          ${res.type && res.type.includes("Portal") ? "Access Portal ↗" : "Download / View 📄"}
        </a>
      `;
      grid.appendChild(card);
    });
  }

  // ── DASHBOARD EVENTS RENDERING (via shared UAHEvents) ──
  function renderDashboardEvents(events) {
    const mountEl = $("dash-events-mount");
    const summaryEl = $("dash-events-summary");
    const countBadge = $("dash-event-count");
    if (!mountEl || typeof window.UAHEvents === "undefined") return;

    window.UAHEvents.mount({
      rootEl: mountEl,
      summaryEl,
      countBadgeEl: countBadge,
      universityId: selectedUni ? selectedUni.id : "uem",
      events: events || []
    });
  }

  // ── DASHBOARD CLASS ROSTER RENDERING ──
  let cachedDashboardStudents = [];

  function renderDashboardRoster(students) {
    cachedDashboardStudents = students || [];
    const tbody = $("dash-roster-tbody");
    const countBadge = $("dash-roster-count");
    const countPill = $("dash-roster-count-pill");
    const searchInput = $("dash-roster-search");

    if (countBadge) countBadge.textContent = cachedDashboardStudents.length;
    if (countPill) countPill.textContent = `${cachedDashboardStudents.length} Students`;
    if (!tbody) return;

    function populateTable(list) {
      if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No batchmates found matching your search.</td></tr>`;
        return;
      }

      tbody.innerHTML = list.map((s) => `
        <tr>
          <td><span class="roster-roll-badge">${s.rollNo}</span></td>
          <td><span class="roster-name-cell">${escapeHtml(s.name)}</span></td>
          <td><span class="roster-enroll-cell">${escapeHtml(s.enrollmentNo || "—")}</span></td>
          <td><span class="roster-reg-cell">${escapeHtml(s.registrationNo || "—")}</span></td>
          <td><span style="color: var(--text-secondary); font-size: 0.85rem;">${escapeHtml(s.degree || "B.Tech")} · ${escapeHtml(s.department || "CSE")}</span></td>
          <td><span class="event-status-badge open">Active</span></td>
        </tr>
      `).join("");
    }

    populateTable(cachedDashboardStudents);

    if (searchInput) {
      // Avoid duplicate listener
      searchInput.oninput = (e) => {
        const q = e.target.value.trim().toLowerCase();
        if (!q) {
          populateTable(cachedDashboardStudents);
          if (countPill) countPill.textContent = `${cachedDashboardStudents.length} Students`;
          return;
        }

        const filtered = cachedDashboardStudents.filter((s) => {
          const matchName = s.name && s.name.toLowerCase().includes(q);
          const matchRoll = s.rollNo && s.rollNo.toString().includes(q);
          const matchEnroll = s.enrollmentNo && s.enrollmentNo.toLowerCase().includes(q);
          const matchReg = s.registrationNo && s.registrationNo.toLowerCase().includes(q);
          return matchName || matchRoll || matchEnroll || matchReg;
        });

        populateTable(filtered);
        if (countPill) countPill.textContent = `${filtered.length} of ${cachedDashboardStudents.length} Students`;
      };
    }
  }

  // ── DASHBOARD TABS ──
  function initDashboardTabs() {
    const tabs = [
      { btn: $("tab-courses-btn"), pane: $("tab-courses") },
      { btn: $("tab-timetable-btn"), pane: $("tab-timetable") },
      { btn: $("tab-resources-btn"), pane: $("tab-resources") },
      { btn: $("tab-events-btn"), pane: $("tab-events") },
      { btn: $("tab-roster-btn"), pane: $("tab-roster") }
    ];

    tabs.forEach(({ btn, pane }) => {
      if (!btn || !pane) return;
      btn.addEventListener("click", () => {
        tabs.forEach((t) => {
          if (t.btn) {
            t.btn.classList.remove("active");
            t.btn.setAttribute("aria-selected", "false");
          }
          if (t.pane) t.pane.style.display = "none";
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
        pane.style.display = "block";
      });
    });

    // Switch university button in dashboard
    const switchBtn = $("dash-switch-uni-btn");
    if (switchBtn) {
      switchBtn.addEventListener("click", () => {
        dashboardPanel.classList.add("slide-out");
        setTimeout(() => {
          dashboardPanel.style.display = "none";
          dashboardPanel.classList.remove("slide-out");
          gatewayPanel.style.display = "block";
          gatewayPanel.classList.add("slide-in");
          window.scrollTo({ top: 0, behavior: "smooth" });
          setTimeout(() => gatewayPanel.classList.remove("slide-in"), 500);
        }, 350);
      });
    }

    const retryBtn = $("dash-retry-btn");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => {
        const uniId = selectedUni ? selectedUni.id : "uem";
        const dept = domainInput ? domainInput.value : "Computer Science";
        const sem = semesterInput ? semesterInput.value : "1st Semester";
        fetchAcademicData(uniId, dept, sem);
      });
    }
  }

  // ── SYLLABUS & CURRICULUM MODAL ──
  function openSyllabusModal(course) {
    const modal = $("syllabus-modal");
    const body = $("modal-body");
    if (!modal || !body) return;
    if ($("modal-title")) $("modal-title").textContent = course.name || "Course Syllabus";
    if ($("modal-subtitle")) {
      const codeStr = course.oldCode && course.oldCode !== course.code
        ? `${course.code} (Prev: ${course.oldCode})`
        : (course.code || "Course Module");
      $("modal-subtitle").textContent = `Course Code: ${codeStr}${course.labCode ? ` · Lab: ${course.labCode}` : ""}`;
    }

    if (typeof window.UAHSyllabus !== "undefined") {
      window.UAHSyllabus.renderCourseSyllabus(body, course);
    } else if (course.image) {
      body.innerHTML = `<div class="modal-image-wrap" style="padding:1.5rem;"><img src="${escapeHtml(course.image)}" alt="${escapeHtml(course.name)}" /></div>`;
    }

    modal.style.display = "flex";
  }

  function openCurriculumModal(summary) {
    const modal = $("syllabus-modal");
    const body = $("modal-body");
    if (!modal || !body || typeof window.UAHSyllabus === "undefined") return;
    if ($("modal-title")) $("modal-title").textContent = summary.title || "Curriculum Scheme";
    if ($("modal-subtitle")) {
      const tot = summary.totals || {};
      $("modal-subtitle").textContent = `Total Hours/Week: ${tot.lecture || 18}L · ${tot.practical || 16}P · ${tot.sessional || 2}S | Total Credits: ${tot.credits || 26}`;
    }
    window.UAHSyllabus.renderCurriculumMatrix(body, summary);
    modal.style.display = "flex";
  }

  function initModal() {
    const modal = $("syllabus-modal");
    const closeBtn = $("modal-close-btn");
    if (closeBtn && modal) {
      closeBtn.addEventListener("click", () => { modal.style.display = "none"; });
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.style.display === "flex") {
          modal.style.display = "none";
        }
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 6. COMING SOON PANEL
  // ─────────────────────────────────────────────────────────────
  function showComingSoon(uni, degree, domain, semester) {
    if (!gatewayPanel || !comingSoonPanel) return;

    if ($("coming-soon-title")) $("coming-soon-title").textContent = `${uni.name} Portal`;
    if ($("coming-soon-icon")) $("coming-soon-icon").textContent = uni.icon || "🏛️";

    let msg = `The ${uni.name} academic portal is currently being integrated into the University Academic Hub network.`;
    if (uni.status === "coming-soon") {
      msg = `${uni.name} (${uni.location}) academic data integration is currently in progress under the NEP 2020 gateway framework. Please check back as services become active.`;
    }

    if ($("coming-soon-text")) $("coming-soon-text").textContent = msg;

    if ($("coming-soon-meta")) {
      $("coming-soon-meta").innerHTML = `
        <span class="uni-tag type-tag">${escapeHtml(uni.type)}</span>
        <span class="uni-tag">Degree: ${escapeHtml(degree)}</span>
        <span class="uni-tag">${escapeHtml(domain)}</span>
        <span class="uni-tag">${escapeHtml(semester)}</span>
      `;
    }

    gatewayPanel.classList.add("slide-out");
    setTimeout(() => {
      gatewayPanel.style.display = "none";
      gatewayPanel.classList.remove("slide-out");
      comingSoonPanel.style.display = "block";
      comingSoonPanel.classList.add("slide-in");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => comingSoonPanel.classList.remove("slide-in"), 500);
    }, 350);
  }

  function initBackButtons() {
    const returnToGateway = () => {
      if (!comingSoonPanel || !gatewayPanel) return;
      comingSoonPanel.classList.add("slide-out");
      setTimeout(() => {
        comingSoonPanel.style.display = "none";
        comingSoonPanel.classList.remove("slide-out");
        gatewayPanel.style.display = "block";
        gatewayPanel.classList.add("slide-in");
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => gatewayPanel.classList.remove("slide-in"), 500);
      }, 350);
    };

    const backBtn1 = $("back-to-gateway");
    const backBtn2 = $("coming-soon-back-btn");
    if (backBtn1) backBtn1.addEventListener("click", returnToGateway);
    if (backBtn2) backBtn2.addEventListener("click", returnToGateway);
  }

  // ─────────────────────────────────────────────────────────────
  // 7. HELPERS & RESTORATION
  // ─────────────────────────────────────────────────────────────
  function showError(el, msg) {
    if (el) {
      el.textContent = msg;
      el.style.display = "block";
    }
  }

  function hideError(el) {
    if (el) {
      el.textContent = "";
      el.style.display = "none";
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Restore saved session if available
  function restoreSession() {
    const savedName = sessionStorage.getItem("studentName");
    const savedId = sessionStorage.getItem("studentId");
    const savedDegree = sessionStorage.getItem("studentDegree");
    const savedDomain = sessionStorage.getItem("studentDomain");
    const savedSemester = sessionStorage.getItem("studentSemester");

    if (savedName && nameInput) nameInput.value = savedName;
    if (savedId && idInput) idInput.value = savedId;
    if (savedDegree && degreeInput) degreeInput.value = savedDegree;
    if (savedDomain && domainInput) domainInput.value = savedDomain;
    if (savedSemester && semesterInput) semesterInput.value = savedSemester;
  }

  // ─────────────────────────────────────────────────────────────
  // 8. INITIALIZATION
  // ─────────────────────────────────────────────────────────────
  function init() {
    restoreSession();
    fetchUniversities();
    initFilterListeners();
    initFormListeners();
    initEnterBtn();
    initBackButtons();
    initDashboardTabs();
    initTimetableDaySelector();
    initModal();
    updateFormState();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
