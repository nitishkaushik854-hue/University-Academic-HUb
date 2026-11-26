/**
 * Shared Academic Event Organizer & Modal Component (window.UAHEvents)
 * Used by both UEM Home (/uem-home) and University Academic Hub Dashboard (/university).
 */
(function (global) {
  "use strict";

  const STORAGE_KEY = "uah_saved_events";

  const CATEGORY_FILTERS = [
    { key: "all", label: "All Events" },
    { key: "hackathon", label: "Hackathons" },
    { key: "technical", label: "Technical & Expo" },
    { key: "academic", label: "Conferences" },
    { key: "workshop", label: "Career & Workshops" },
    { key: "cultural", label: "Cultural" }
  ];

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getSavedEventIds() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function toggleSavedEventId(eventId) {
    const saved = getSavedEventIds();
    const idx = saved.indexOf(eventId);
    if (idx === -1) {
      saved.push(eventId);
    } else {
      saved.splice(idx, 1);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch (e) {
      // Ignore storage quota errors
    }
    return idx === -1; // true if now saved
  }

  function getStatusClass(status) {
    const s = (status || "").toLowerCase();
    if (s.includes("open")) return "open";
    if (s.includes("call")) return "call";
    return "upcoming";
  }

  function matchesCategory(ev, filterKey) {
    if (filterKey === "all") return true;
    const group = (ev.categoryGroup || "").toLowerCase();
    if (group) return group === filterKey;

    const cat = (ev.category || "").toLowerCase();
    const tags = (ev.tags || []).map((t) => t.toLowerCase());
    if (filterKey === "technical") return cat.includes("technical") || cat.includes("innovation") || tags.includes("robotics") || tags.includes("iot");
    if (filterKey === "hackathon") return cat.includes("hackathon") || tags.includes("hackathon");
    if (filterKey === "academic") return cat.includes("conference") || cat.includes("academic") || tags.includes("research");
    if (filterKey === "workshop") return cat.includes("workshop") || cat.includes("career") || tags.includes("mentorship");
    if (filterKey === "cultural") return cat.includes("cultural") || tags.includes("cultural");
    return cat.includes(filterKey);
  }

  // Singleton Modal Manager
  let activeModalEvent = null;
  let onSavedChangeCallbacks = [];

  function ensureModal() {
    let backdrop = document.getElementById("uah-event-modal-backdrop");
    if (backdrop) return backdrop;

    backdrop = document.createElement("div");
    backdrop.id = "uah-event-modal-backdrop";
    backdrop.className = "event-modal-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.setAttribute("aria-labelledby", "uah-event-modal-title");
    backdrop.innerHTML = `
      <div class="event-modal-dialog">
        <div class="event-modal-header">
          <div class="event-modal-title-wrap">
            <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
              <span class="event-category-label" id="uah-event-modal-cat" style="margin:0;">Category</span>
              <span class="event-status-badge open" id="uah-event-modal-status">Status</span>
            </div>
            <h3 class="event-modal-title" id="uah-event-modal-title">Event Title</h3>
          </div>
          <button type="button" class="event-modal-close" id="uah-event-modal-close" aria-label="Close modal">&times;</button>
        </div>
        <div class="event-modal-body">
          <p class="event-modal-desc" id="uah-event-modal-desc"></p>
          <div class="event-modal-meta-grid" id="uah-event-modal-meta"></div>
          <div>
            <span class="event-modal-meta-label" style="margin-bottom:0.45rem;">Focus Areas &amp; Tracks</span>
            <div class="event-tags-row" id="uah-event-modal-tags" style="margin-bottom:0;"></div>
          </div>
        </div>
        <div class="event-modal-footer">
          <span class="event-prizes-pill" id="uah-event-modal-prizes"></span>
          <div style="display:flex;gap:0.6rem;align-items:center;">
            <button type="button" class="event-save-btn" id="uah-event-modal-save">Save Event</button>
            <button type="button" class="event-btn" id="uah-event-modal-done">Close</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    const closeModal = () => {
      backdrop.classList.remove("open");
      activeModalEvent = null;
    };

    backdrop.querySelector("#uah-event-modal-close").addEventListener("click", closeModal);
    backdrop.querySelector("#uah-event-modal-done").addEventListener("click", closeModal);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && backdrop.classList.contains("open")) {
        closeModal();
      }
    });

    backdrop.querySelector("#uah-event-modal-save").addEventListener("click", () => {
      if (!activeModalEvent) return;
      toggleSavedEventId(activeModalEvent.id);
      syncModalSaveButton();
      onSavedChangeCallbacks.forEach((cb) => cb());
    });

    return backdrop;
  }

  function syncModalSaveButton() {
    const btn = document.getElementById("uah-event-modal-save");
    if (!btn || !activeModalEvent) return;
    const isSaved = getSavedEventIds().includes(activeModalEvent.id);
    btn.classList.toggle("saved", isSaved);
    btn.textContent = isSaved ? "✓ Registered / Saved" : "☆ Bookmark / Register Interest";
  }

  function openEventModal(ev) {
    const backdrop = ensureModal();
    activeModalEvent = ev;

    backdrop.querySelector("#uah-event-modal-cat").textContent = ev.category || "Campus Event";
    const statusBadge = backdrop.querySelector("#uah-event-modal-status");
    statusBadge.textContent = ev.status || "Upcoming";
    statusBadge.className = `event-status-badge ${getStatusClass(ev.status)}`;
    backdrop.querySelector("#uah-event-modal-title").textContent = `${ev.icon || "📅"} ${ev.title}`;
    backdrop.querySelector("#uah-event-modal-desc").textContent = ev.description || "";
    backdrop.querySelector("#uah-event-modal-prizes").textContent = `🏆 ${ev.prizes || "Certificates & Awards"}`;

    const metaItems = [
      { label: "Date & Schedule", val: `${ev.date || "TBA"}${ev.time ? ` · ${ev.time}` : ""}` },
      { label: "Venue & Format", val: `${ev.venue || "Campus"}${ev.mode ? ` (${ev.mode})` : ""}` },
      { label: "Registration Deadline", val: ev.registrationDeadline || "Open until slots fill" },
      { label: "Eligibility", val: ev.eligibility || "All Enrolled Students" },
      { label: "Organized By", val: ev.organizer || "University Student Council" },
      { label: "Faculty Coordinator", val: ev.coordinator || "Campus Coordinator" }
    ];

    backdrop.querySelector("#uah-event-modal-meta").innerHTML = metaItems
      .map((m) => `
        <div class="event-modal-meta-card">
          <span class="event-modal-meta-label">${escapeHtml(m.label)}</span>
          <span class="event-modal-meta-val">${escapeHtml(m.val)}</span>
        </div>
      `)
      .join("");

    backdrop.querySelector("#uah-event-modal-tags").innerHTML = (ev.tags || [])
      .map((t) => `<span class="event-tag">${escapeHtml(t)}</span>`)
      .join("");

    syncModalSaveButton();
    backdrop.classList.add("open");
  }

  // Singleton Add Event Modal Manager
  let onEventCreatedCallback = null;

  function ensureAddEventModal() {
    let backdrop = document.getElementById("uah-add-event-backdrop");
    if (backdrop) return backdrop;

    backdrop = document.createElement("div");
    backdrop.id = "uah-add-event-backdrop";
    backdrop.className = "event-modal-backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.setAttribute("aria-labelledby", "uah-add-event-title");
    backdrop.innerHTML = `
      <div class="event-modal-dialog" style="max-width:720px;">
        <div class="event-modal-header">
          <div class="event-modal-title-wrap">
            <span class="event-category-label" style="margin:0;">Campus Event Management</span>
            <h3 class="event-modal-title" id="uah-add-event-title">+ Add New Campus Event</h3>
          </div>
          <button type="button" class="event-modal-close" id="uah-add-event-close" aria-label="Close add event modal">&times;</button>
        </div>
        <form id="uah-add-event-form" style="display:flex;flex-direction:column;overflow:hidden;flex:1;">
          <div class="event-modal-body">
            <p class="event-form-error" id="uah-add-event-error"></p>
            <div class="event-form-grid">
              <div class="event-form-group full">
                <label class="event-form-label" for="ev-add-title">Event Title *</label>
                <input type="text" id="ev-add-title" class="event-form-input" placeholder="e.g. IEM Smart Robotics Expo 2026" required />
              </div>
              <div class="event-form-group">
                <label class="event-form-label" for="ev-add-category">Category *</label>
                <select id="ev-add-category" class="event-form-select" required>
                  <option value="Technical Fest">Technical Fest</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Innovation & Science">Innovation &amp; Science</option>
                  <option value="Academic Conference">Academic Conference</option>
                  <option value="Workshop & Career">Workshop &amp; Career</option>
                  <option value="Cultural Fest">Cultural Fest</option>
                </select>
              </div>
              <div class="event-form-group">
                <label class="event-form-label" for="ev-add-status">Status *</label>
                <select id="ev-add-status" class="event-form-select" required>
                  <option value="Registration Open">Registration Open</option>
                  <option value="Call for Abstracts">Call for Abstracts</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Open to All Students">Open to All Students</option>
                </select>
              </div>
              <div class="event-form-group">
                <label class="event-form-label" for="ev-add-start">Start Date *</label>
                <input type="date" id="ev-add-start" class="event-form-input" value="2026-05-15" required />
              </div>
              <div class="event-form-group">
                <label class="event-form-label" for="ev-add-end">End Date (Optional)</label>
                <input type="date" id="ev-add-end" class="event-form-input" />
              </div>
              <div class="event-form-group">
                <label class="event-form-label" for="ev-add-time">Time Schedule</label>
                <input type="text" id="ev-add-time" class="event-form-input" placeholder="e.g. 10:00 AM – 5:00 PM IST" value="10:00 AM – 5:00 PM IST" />
              </div>
              <div class="event-form-group">
                <label class="event-form-label" for="ev-add-deadline">Registration Deadline</label>
                <input type="text" id="ev-add-deadline" class="event-form-input" placeholder="e.g. May 10, 2026" />
              </div>
              <div class="event-form-group">
                <label class="event-form-label" for="ev-add-venue">Venue *</label>
                <input type="text" id="ev-add-venue" class="event-form-input" placeholder="e.g. Main Auditorium, B3 Campus" required />
              </div>
              <div class="event-form-group">
                <label class="event-form-label" for="ev-add-mode">Mode</label>
                <select id="ev-add-mode" class="event-form-select">
                  <option value="On-Campus">On-Campus</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Online">Online</option>
                </select>
              </div>
              <div class="event-form-group">
                <label class="event-form-label" for="ev-add-coord">Organizer / Coordinator</label>
                <input type="text" id="ev-add-coord" class="event-form-input" placeholder="e.g. Dept. of CSE (IoT) & Tech Club" />
              </div>
              <div class="event-form-group">
                <label class="event-form-label" for="ev-add-prizes">Prizes / Highlights</label>
                <input type="text" id="ev-add-prizes" class="event-form-input" placeholder="e.g. ₹50,000 Prize Pool & Certificates" />
              </div>
              <div class="event-form-group full">
                <label class="event-form-label" for="ev-add-tags">Tags (comma separated)</label>
                <input type="text" id="ev-add-tags" class="event-form-input" placeholder="e.g. Robotics, IoT, Hardware" />
              </div>
              <div class="event-form-group full">
                <label class="event-form-label" for="ev-add-desc">Event Description *</label>
                <textarea id="ev-add-desc" class="event-form-textarea" rows="3" placeholder="Provide key details, themes, and participant guidelines..." required></textarea>
              </div>
            </div>
          </div>
          <div class="event-modal-footer">
            <span style="font-size:0.78rem;color:var(--ev-muted);">Published events appear immediately on UEM Hub &amp; Student Dashboard.</span>
            <div style="display:flex;gap:0.6rem;">
              <button type="button" class="event-save-btn" id="uah-add-event-cancel">Cancel</button>
              <button type="submit" class="event-btn" id="uah-add-event-submit">Publish Event →</button>
            </div>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(backdrop);

    const closeAdd = () => backdrop.classList.remove("open");
    backdrop.querySelector("#uah-add-event-close").addEventListener("click", closeAdd);
    backdrop.querySelector("#uah-add-event-cancel").addEventListener("click", closeAdd);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeAdd();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && backdrop.classList.contains("open")) {
        closeAdd();
      }
    });

    const form = backdrop.querySelector("#uah-add-event-form");
    const errEl = backdrop.querySelector("#uah-add-event-error");
    const submitBtn = backdrop.querySelector("#uah-add-event-submit");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errEl.style.display = "none";

      const targetUni = backdrop.dataset.universityId || "uem";
      const payload = {
        title: backdrop.querySelector("#ev-add-title").value.trim(),
        category: backdrop.querySelector("#ev-add-category").value,
        status: backdrop.querySelector("#ev-add-status").value,
        startDate: backdrop.querySelector("#ev-add-start").value,
        endDate: backdrop.querySelector("#ev-add-end").value,
        time: backdrop.querySelector("#ev-add-time").value.trim(),
        registrationDeadline: backdrop.querySelector("#ev-add-deadline").value.trim(),
        venue: backdrop.querySelector("#ev-add-venue").value.trim(),
        mode: backdrop.querySelector("#ev-add-mode").value,
        coordinator: backdrop.querySelector("#ev-add-coord").value.trim(),
        prizes: backdrop.querySelector("#ev-add-prizes").value.trim(),
        tags: backdrop.querySelector("#ev-add-tags").value.trim(),
        description: backdrop.querySelector("#ev-add-desc").value.trim()
      };

      submitBtn.disabled = true;
      submitBtn.textContent = "Publishing...";

      try {
        const res = await fetch(`/api/universities/${encodeURIComponent(targetUni)}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          const msg = (json.error && (json.error.details ? json.error.details.join(" ") : json.error.message)) || "Could not create event.";
          errEl.textContent = msg;
          errEl.style.display = "block";
          submitBtn.disabled = false;
          submitBtn.textContent = "Publish Event →";
          return;
        }

        form.reset();
        backdrop.querySelector("#ev-add-start").value = "2026-05-15";
        backdrop.querySelector("#ev-add-time").value = "10:00 AM – 5:00 PM IST";
        closeAdd();

        if (typeof onEventCreatedCallback === "function") {
          onEventCreatedCallback(json.data);
        }
      } catch (err) {
        errEl.textContent = "Network error while saving event. Ensure server is running.";
        errEl.style.display = "block";
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Publish Event →";
      }
    });

    return backdrop;
  }

  function openAddEventModal(universityId, onCreated) {
    const backdrop = ensureAddEventModal();
    backdrop.dataset.universityId = universityId || "uem";
    backdrop.querySelector("#uah-add-event-error").style.display = "none";
    onEventCreatedCallback = onCreated;
    backdrop.classList.add("open");
  }

  function createCardHtml(ev, savedIds) {
    const statusClass = getStatusClass(ev.status);
    const isSaved = savedIds.includes(ev.id);
    const tagsHtml = (ev.tags || []).map((t) => `<span class="event-tag">${escapeHtml(t)}</span>`).join("");

    const monthShort = ev.monthShort || (ev.date ? ev.date.split(" ")[0].slice(0, 3).toUpperCase() : "2026");
    const dayLabel = ev.dayLabel || (ev.date ? ev.date.replace(/^[A-Za-z]+\s*/, "").replace(/,\s*\d{4}$/, "") : "TBA");

    return `
      <article class="event-card" data-event-id="${escapeHtml(ev.id)}">
        <div class="event-card-top">
          <div class="event-top-left">
            <div class="event-date-badge" aria-label="${escapeHtml(ev.date || "")}">
              <span class="event-date-month">${escapeHtml(monthShort)}</span>
              <span class="event-date-day">${escapeHtml(dayLabel)}</span>
            </div>
            <div class="event-card-icon" aria-hidden="true">${escapeHtml(ev.icon || "📅")}</div>
          </div>
          <div class="event-top-badges">
            <span class="event-status-badge ${statusClass}">${escapeHtml(ev.status || "Upcoming")}</span>
          </div>
        </div>

        <span class="event-category-label">${escapeHtml(ev.category || "Campus Event")}</span>
        <h3 class="event-title">${escapeHtml(ev.title)}</h3>
        <p class="event-desc">${escapeHtml(ev.description || "")}</p>

        <div class="event-meta-info">
          <div class="event-meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span><strong>Venue:</strong> ${escapeHtml(ev.venue || "Campus")}</span>
          </div>
          <div class="event-meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span><strong>Deadline:</strong> ${escapeHtml(ev.registrationDeadline || "Open")} · <strong>Mode:</strong> ${escapeHtml(ev.mode || "On-Campus")}</span>
          </div>
          <div class="event-meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
            <span><strong>Coordinator:</strong> ${escapeHtml(ev.coordinator || ev.organizer || "Campus Council")}</span>
          </div>
        </div>

        <div class="event-tags-row">${tagsHtml}</div>

        <div class="event-action-row">
          <span class="event-prizes-pill" title="${escapeHtml(ev.prizes || "")}">🏆 ${escapeHtml(ev.prizes || "Certificates & Awards")}</span>
          <div class="event-card-btns">
            <button type="button" class="event-save-btn ${isSaved ? "saved" : ""}" data-save-id="${escapeHtml(ev.id)}" title="Bookmark event">
              ${isSaved ? "✓ Saved" : "☆ Save"}
            </button>
            <button type="button" class="event-btn" data-detail-id="${escapeHtml(ev.id)}">
              <span>Details</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Mounts an organized Events UI inside options.rootEl
   */
  async function mount(options) {
    const {
      rootEl,
      summaryEl = null,
      countBadgeEl = null,
      events: initialEvents = null,
      universityId = "uem",
      apiUrl = "/api/universities/uem/events"
    } = options || {};

    if (!rootEl) return;

    const uiState = {
      events: Array.isArray(initialEvents) ? [...initialEvents] : [],
      category: "all",
      status: "all",
      search: "",
      viewMode: "timeline" // 'timeline' | 'grid'
    };

    rootEl.innerHTML = `
      <div class="events-toolbar">
        <div class="events-toolbar-top">
          <div class="events-search-wrap">
            <svg class="events-search-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" class="events-search-input" placeholder="Search events by title, topic, coordinator, or venue..." aria-label="Search campus events" />
          </div>

          <div class="events-controls-right">
            <select class="events-status-select" aria-label="Filter events by registration status">
              <option value="all">All Statuses</option>
              <option value="open">Registration Open</option>
              <option value="call">Call for Abstracts</option>
              <option value="upcoming">Upcoming</option>
              <option value="saved">★ My Saved Events</option>
            </select>

            <div class="events-view-toggle" role="group" aria-label="Events layout view">
              <button type="button" class="view-toggle-btn active" data-view="timeline" title="Organize chronologically by month">📅 By Month</button>
              <button type="button" class="view-toggle-btn" data-view="grid" title="Flat grid view">⊞ Grid</button>
            </div>

            <button type="button" class="event-add-trigger-btn" title="Publish a new event">+ Add Event</button>
          </div>
        </div>

        <div class="event-filter-pills" role="group" aria-label="Filter events by category"></div>
      </div>

      <div class="events-toast-slot" style="display:none;"></div>

      <div class="events-list-host" id="events-grid">
        <div style="text-align:center;padding:3rem;color:var(--ev-muted);">Loading organized event schedule...</div>
      </div>
    `;

    const searchInput = rootEl.querySelector(".events-search-input");
    const statusSelect = rootEl.querySelector(".events-status-select");
    const viewBtns = rootEl.querySelectorAll(".view-toggle-btn");
    const addEventBtn = rootEl.querySelector(".event-add-trigger-btn");
    const toastSlot = rootEl.querySelector(".events-toast-slot");
    const pillsWrap = rootEl.querySelector(".event-filter-pills");
    const hostEl = rootEl.querySelector(".events-list-host");

    if (addEventBtn) {
      addEventBtn.addEventListener("click", () => {
        openAddEventModal(universityId, (createdEvent) => {
          uiState.events.push(createdEvent);
          uiState.category = "all";
          uiState.status = "all";
          statusSelect.value = "all";
          updateSummaryStrip();
          renderCategoryPills();
          renderEvents();

          if (toastSlot) {
            toastSlot.style.display = "block";
            toastSlot.innerHTML = `
              <div class="event-toast-banner">
                <span>✅ Added "${escapeHtml(createdEvent.title)}" (${escapeHtml(createdEvent.date)}) to campus schedule!</span>
                <button type="button" style="font-weight:800;color:inherit;font-size:1.1rem;" onclick="this.closest('.events-toast-slot').style.display='none'">&times;</button>
              </div>
            `;
          }
        });
      });
    }

    function updateSummaryStrip() {
      const savedIds = getSavedEventIds();
      const openCount = uiState.events.filter((e) => (e.status || "").toLowerCase().includes("open")).length;
      const savedInSet = uiState.events.filter((e) => savedIds.includes(e.id)).length;

      if (countBadgeEl) {
        countBadgeEl.textContent = uiState.events.length;
      }

      if (summaryEl) {
        summaryEl.innerHTML = `
          <span class="event-stat-pill"><strong>${uiState.events.length}</strong> Total Scheduled</span>
          <span class="event-stat-pill open-highlight"><strong>${openCount}</strong> Open Now</span>
          <span class="event-stat-pill saved-highlight"><strong>${savedInSet}</strong> Saved</span>
        `;
      }
    }

    function renderCategoryPills() {
      pillsWrap.innerHTML = CATEGORY_FILTERS.map((cat) => {
        const count = uiState.events.filter((ev) => matchesCategory(ev, cat.key)).length;
        const activeClass = uiState.category === cat.key ? " active" : "";
        return `
          <button type="button" class="event-filter-pill${activeClass}" data-filter="${cat.key}">
            <span>${cat.label}</span>
            <span class="pill-count">${count}</span>
          </button>
        `;
      }).join("");

      pillsWrap.querySelectorAll(".event-filter-pill").forEach((pill) => {
        pill.addEventListener("click", () => {
          uiState.category = pill.getAttribute("data-filter") || "all";
          renderCategoryPills();
          renderEvents();
        });
      });
    }

    function getFilteredEvents() {
      const savedIds = getSavedEventIds();
      return uiState.events
        .slice()
        .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""))
        .filter((ev) => {
          if (!matchesCategory(ev, uiState.category)) return false;

          if (uiState.status !== "all") {
            if (uiState.status === "saved") {
              if (!savedIds.includes(ev.id)) return false;
            } else if (!(ev.status || "").toLowerCase().includes(uiState.status)) {
              return false;
            }
          }

          if (uiState.search) {
            const q = uiState.search;
            const hay = [
              ev.title,
              ev.category,
              ev.description,
              ev.venue,
              ev.organizer,
              ev.coordinator,
              ...(ev.tags || [])
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
            if (!hay.includes(q)) return false;
          }

          return true;
        });
    }

    function attachCardListeners() {
      hostEl.querySelectorAll("[data-detail-id]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-detail-id");
          const ev = uiState.events.find((e) => e.id === id);
          if (ev) openEventModal(ev);
        });
      });

      hostEl.querySelectorAll("[data-save-id]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-save-id");
          toggleSavedEventId(id);
          updateSummaryStrip();
          renderEvents();
        });
      });
    }

    function renderEvents() {
      const filtered = getFilteredEvents();
      const savedIds = getSavedEventIds();

      if (filtered.length === 0) {
        hostEl.innerHTML = `
          <div style="text-align:center;padding:3rem;background:var(--ev-milk);border:1px solid var(--ev-border);border-radius:16px;">
            <p style="font-size:1.05rem;font-weight:700;color:var(--ev-text);margin-bottom:0.35rem;">No matching events found</p>
            <p style="color:var(--ev-muted);font-size:0.9rem;margin-bottom:1rem;">Try adjusting your category filter, status, or search keywords.</p>
            <button type="button" class="event-save-btn" data-reset-ev>Reset All Filters</button>
          </div>
        `;
        const resetBtn = hostEl.querySelector("[data-reset-ev]");
        if (resetBtn) {
          resetBtn.addEventListener("click", () => {
            uiState.category = "all";
            uiState.status = "all";
            uiState.search = "";
            searchInput.value = "";
            statusSelect.value = "all";
            renderCategoryPills();
            renderEvents();
          });
        }
        return;
      }

      if (uiState.viewMode === "grid") {
        hostEl.innerHTML = `<div class="events-grid">${filtered.map((ev) => createCardHtml(ev, savedIds)).join("")}</div>`;
      } else {
        // Chronological Timeline Grouped by Month
        const groups = [];
        const groupMap = new Map();

        filtered.forEach((ev) => {
          const label = ev.monthGroup || (ev.date ? ev.date.replace(/\d+([–-]\d+)?,?\s*/, "").trim() : "Scheduled Events");
          if (!groupMap.has(label)) {
            const g = { label, items: [] };
            groupMap.set(label, g);
            groups.push(g);
          }
          groupMap.get(label).items.push(ev);
        });

        hostEl.innerHTML = `
          <div class="events-grouped-container">
            ${groups.map((grp) => `
              <div class="events-month-group">
                <div class="month-group-header">
                  <span class="month-group-badge">📅 ${escapeHtml(grp.label)}</span>
                  <span class="month-group-count">${grp.items.length} Event${grp.items.length > 1 ? "s" : ""}</span>
                  <div class="month-group-line"></div>
                </div>
                <div class="events-grid">
                  ${grp.items.map((ev) => createCardHtml(ev, savedIds)).join("")}
                </div>
              </div>
            `).join("")}
          </div>
        `;
      }

      attachCardListeners();
    }

    searchInput.addEventListener("input", (e) => {
      uiState.search = e.target.value.trim().toLowerCase();
      renderEvents();
    });

    statusSelect.addEventListener("change", (e) => {
      uiState.status = e.target.value;
      renderEvents();
    });

    viewBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        viewBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        uiState.viewMode = btn.getAttribute("data-view") || "timeline";
        renderEvents();
      });
    });

    onSavedChangeCallbacks.push(() => {
      updateSummaryStrip();
      renderEvents();
    });

    // Fetch if events array was not provided inline
    if (initialEvents === null && apiUrl) {
      try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        uiState.events = json.data || [];
      } catch (err) {
        console.warn("Unable to load live campus events:", err);
        hostEl.innerHTML = `
          <div style="text-align:center;padding:2.5rem;background:var(--ev-milk);border:1px solid var(--ev-border);border-radius:14px;">
            <p style="color:var(--ev-muted);margin-bottom:0.75rem;">Unable to connect to live campus events feed.</p>
            <button type="button" class="event-btn" onclick="location.reload()">Retry</button>
          </div>
        `;
        return;
      }
    }

    updateSummaryStrip();
    renderCategoryPills();
    renderEvents();
  }

  global.UAHEvents = { mount };
})(window);
