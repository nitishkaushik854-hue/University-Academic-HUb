/**
 * Gider AI Education Chatbot
 * Live backend-connected assistant for university discovery, Sem 3 syllabus,
 * IoT 2B timetable, campus events, student roster lookup, and form auto-fill.
 */
(function () {
  "use strict";

  // ── 1. INJECT CHATBOT DOM ─────────────────────────────────────────
  function mountChatbot() {
    if (document.getElementById("gider-chatbot-container")) return;

    const chatbotHTML = `
      <div id="gider-chatbot-container">
        <button id="gider-fab" type="button" aria-label="Open Gider AI Chat" aria-expanded="false">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path></svg>
        </button>
        <div id="gider-window" role="dialog" aria-label="Gider AI Education Guide" aria-hidden="true">
          <div class="gider-header">
            <div class="gider-header-info">
              <div class="gider-avatar" aria-hidden="true">🤖</div>
              <div>
                <span class="gider-title">Gider AI</span>
                <span class="gider-subtitle"><span class="gider-status-dot"></span> Online · Academic Assistant</span>
              </div>
            </div>
            <button id="gider-close" type="button" aria-label="Close chat">&times;</button>
          </div>
          <div class="gider-quick-bar" id="gider-quick-bar">
            <button type="button" class="gider-chip" data-prompt="What universities are available?">🏛️ Universities</button>
            <button type="button" class="gider-chip" data-prompt="Show Sem 3 CSE syllabus & subjects">📚 Sem 3 Syllabus</button>
            <button type="button" class="gider-chip" data-prompt="Show IoT 2B timetable">🗓️ Timetable</button>
            <button type="button" class="gider-chip" data-prompt="Show upcoming UEM events">🎪 Events</button>
            <button type="button" class="gider-chip" data-prompt="Find roll no 1 in student roster">👥 Roster</button>
          </div>
          <div class="gider-messages" id="gider-messages">
            <div class="gider-msg bot">
              <strong>Hello! I'm Gider AI.</strong> Ask me about universities, Sem 3 syllabus, IoT 2B timetable, campus events, or UEM student roster — or tell me your details (e.g. <em>"My name is Nitish, ID 12025002034137, B.Tech CSE 3rd Sem at UEM"</em>) and I'll fill the form for you.
            </div>
            <div class="gider-typing" id="gider-typing">
              <div class="gider-dot"></div><div class="gider-dot"></div><div class="gider-dot"></div>
            </div>
          </div>
          <div class="gider-input-area">
            <input type="text" id="gider-input" placeholder="Ask about universities, Sem 3, events, or auto-fill..." autocomplete="off" />
            <button id="gider-send" type="button" aria-label="Send message">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", chatbotHTML);
    bindEvents();
  }

  // ── 2. LIVE BACKEND DATA CACHE ────────────────────────────────────
  const cache = {
    universities: null,
    academicSem3: null,
    academicSem1: null,
    students: null
  };

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function getUniversities() {
    if (!cache.universities) {
      const json = await fetchJson("/api/universities");
      cache.universities = json.data || [];
    }
    return cache.universities;
  }

  async function getAcademicData(semester) {
    if (semester === "1st Semester") {
      if (!cache.academicSem1) {
        const json = await fetchJson("/api/universities/uem/academic-data?department=Computer%20Science&semester=1st%20Semester");
        cache.academicSem1 = json.data || null;
      }
      return cache.academicSem1;
    }
    if (!cache.academicSem3) {
      const json = await fetchJson("/api/universities/uem/academic-data?department=Computer%20Science&semester=3rd%20Semester");
      cache.academicSem3 = json.data || null;
    }
    return cache.academicSem3;
  }

  async function getEvents() {
    // Always fetch latest events so + Add Event updates appear immediately
    const json = await fetchJson("/api/universities/uem/events");
    return json.data || [];
  }

  async function getStudents() {
    if (!cache.students) {
      const json = await fetchJson("/api/universities/uem/students");
      cache.students = json.data || [];
    }
    return cache.students;
  }

  // ── 3. UI HELPERS & EVENT BINDING ─────────────────────────────────
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function titleCase(str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }

  function bindEvents() {
    const container = document.getElementById("gider-chatbot-container");
    const fab = document.getElementById("gider-fab");
    const closeBtn = document.getElementById("gider-close");
    const chatWin = document.getElementById("gider-window");
    const input = document.getElementById("gider-input");
    const sendBtn = document.getElementById("gider-send");
    const quickBar = document.getElementById("gider-quick-bar");
    const messagesDiv = document.getElementById("gider-messages");
    const typingIndicator = document.getElementById("gider-typing");

    function setChatOpen(open) {
      container.classList.toggle("open", open);
      fab.setAttribute("aria-expanded", open ? "true" : "false");
      chatWin.setAttribute("aria-hidden", open ? "false" : "true");
      if (open) {
        setTimeout(() => input.focus(), 60);
      }
    }

    fab.addEventListener("click", () => {
      setChatOpen(!container.classList.contains("open"));
    });

    closeBtn.addEventListener("click", () => {
      setChatOpen(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && container.classList.contains("open")) {
        setChatOpen(false);
      }
    });

    if (quickBar) {
      quickBar.querySelectorAll(".gider-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          const promptText = chip.getAttribute("data-prompt");
          if (promptText) handleUserQuery(promptText);
        });
      });
    }

    function appendMessage(contentHtml, sender, actions = []) {
      const msgDiv = document.createElement("div");
      msgDiv.className = `gider-msg ${sender}`;
      if (sender === "user") {
        msgDiv.textContent = contentHtml;
      } else {
        msgDiv.innerHTML = contentHtml;
        if (actions && actions.length > 0) {
          const actionsEl = document.createElement("div");
          actionsEl.className = "gider-msg-actions";
          actions.forEach((act) => {
            if (act.href) {
              const a = document.createElement("a");
              a.className = "gider-msg-btn";
              a.href = act.href;
              a.textContent = act.label;
              actionsEl.appendChild(a);
            } else if (typeof act.onClick === "function") {
              const b = document.createElement("button");
              b.type = "button";
              b.className = "gider-msg-btn";
              b.textContent = act.label;
              b.addEventListener("click", act.onClick);
              actionsEl.appendChild(b);
            }
          });
          msgDiv.appendChild(actionsEl);
        }
      }
      messagesDiv.insertBefore(msgDiv, typingIndicator);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    let isBusy = false;

    async function handleUserQuery(overrideText) {
      const text = (typeof overrideText === "string" ? overrideText : input.value).trim();
      if (!text || isBusy) return;

      isBusy = true;
      appendMessage(text, "user");
      if (typeof overrideText !== "string") input.value = "";

      typingIndicator.classList.add("active");
      messagesDiv.scrollTop = messagesDiv.scrollHeight;

      try {
        const result = await generateAIResponse(text);
        await new Promise((r) => setTimeout(r, 320));
        typingIndicator.classList.remove("active");
        appendMessage(result.html, "bot", result.actions || []);
      } catch (err) {
        console.warn("Gider AI response error:", err);
        typingIndicator.classList.remove("active");
        appendMessage(
          "Sorry, I couldn't reach the campus data service right now. Please make sure the server is running and try again.",
          "bot"
        );
      } finally {
        isBusy = false;
      }
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleUserQuery();
      }
    });
    sendBtn.addEventListener("click", () => handleUserQuery());
  }

  // ── 4. GATEWAY AUTO-FILL LOGIC ────────────────────────────────────
  function isGatewayVisible() {
    const gateway = document.getElementById("gateway-panel");
    const nameEl = document.getElementById("student-name");
    return Boolean(nameEl && (!gateway || gateway.style.display !== "none"));
  }

  async function tryAutoFillGateway(msg) {
    if (!isGatewayVisible()) return { filled: false, details: [] };

    const lower = msg.toLowerCase();
    const details = [];

    // 1. Check if message references a UEM student by roll number (e.g., "roll 1", "roll no 5")
    const rollMatch = msg.match(/\broll(?:\s*no\.?|\s*number)?\s*(?:is|:|#)?\s*(\d{1,2})\b/i);
    if (rollMatch && (lower.includes("fill") || lower.includes("set") || lower.includes("identify") || lower.includes("my ") || lower.includes("i am") || lower.includes("at uem"))) {
      try {
        const students = await getStudents();
        const found = students.find((s) => String(s.rollNo) === rollMatch[1]);
        if (found) {
          setVal("student-name", found.name, "input");
          setVal("student-id", found.enrollmentNo || String(found.rollNo), "input");
          setVal("student-degree", "B.Tech", "change");
          setVal("student-domain", "Computer Science", "change");
          setVal("student-semester", "3rd Semester", "change");
          clickUniCard("uem");
          return {
            filled: true,
            details: ["Name", "ID", "Degree", "Department", "Semester", "UEM"],
            studentMatched: found
          };
        }
      } catch (_) {}
    }

    // 2. Parse Name ("my name is ...", "name: ...", "i am ...", "i'm ...")
    const nameMatch = msg.match(/(?:my name is|name is|name:|i am|i'm)\s+([a-z][a-z\s.]{1,30}?)(?=\s*(?:,|;|\.|id\b|roll\b|b\.?tech|m\.?tech|bca|dual|semester|sem\b|in\b|at\b|$))/i);
    if (nameMatch && nameMatch[1].trim()) {
      const cleaned = titleCase(nameMatch[1].trim());
      if (setVal("student-name", cleaned, "input")) details.push("Name");
    }

    // 3. Parse Student ID (require "id"/"enroll" cue OR 6+ digit roll/enroll OR UEM code so years like 2026 in event questions don't misfire)
    const idMatch =
      msg.match(/\b(?:student\s*)?(?:id|enroll(?:ment)?(?:\s*no\.?)?|reg(?:istration)?(?:\s*no\.?)?)\s*(?:is|:|=)?\s*([a-z0-9-]{4,24})/i) ||
      msg.match(/\b(UEM[A-Z0-9]{4,}|12025\d{6,})\b/i) ||
      (/\b(fill|my|i am|i'm|register|sign\s*in|name)\b/i.test(lower) ? msg.match(/\b(\d{5,16})\b/) : null);
    if (idMatch && setVal("student-id", idMatch[1].toUpperCase(), "input")) {
      details.push("ID");
    }

    // 4. Parse Degree & Form Context (only select form dropdowns when filling profile, not pure Q&A queries)
    const isExplicitQuestion = /\?/.test(msg) || /^\s*(what|which|when|where|who|how|show|list|tell|explain|find)\b/i.test(lower);
    const hasFormContext =
      details.length > 0 ||
      /\b(fill|auto[-\s]?fill|form|register|sign\s*in|my\s+name|i am|i'm)\b/i.test(lower) ||
      (!isExplicitQuestion && /\b(at uem|at iit|at jadavpur|at bits|at anna|at delhi|at iisc)\b/i.test(lower));
    if (hasFormContext) {
      if (/\bb\.?\s*tech\b|\bbachelors?\b/i.test(lower)) {
        if (setVal("student-degree", "B.Tech", "change")) details.push("Degree");
      } else if (/\bm\.?\s*tech\b|\bmasters?\b/i.test(lower)) {
        if (setVal("student-degree", "M.Tech", "change")) details.push("Degree");
      } else if (/\bdual\s*degree\b/i.test(lower)) {
        if (setVal("student-degree", "Dual Degree", "change")) details.push("Degree");
      } else if (/\bbca\b/i.test(lower)) {
        if (setVal("student-degree", "BCA", "change")) details.push("Degree");
      }
    }

    // 5. Parse Domain / Department (only when user has form/profile intent)
    if (hasFormContext) {
      if (/\b(computer science|cse|iot|computer)\b/i.test(lower)) {
        if (setVal("student-domain", "Computer Science", "change")) details.push("Department");
      } else if (/\b(electrical|eee)\b/i.test(lower)) {
        if (setVal("student-domain", "Electrical", "change")) details.push("Department");
      } else if (/\b(mechanical|mech)\b/i.test(lower)) {
        if (setVal("student-domain", "Mechanical", "change")) details.push("Department");
      } else if (/\b(electronics|ece|communication)\b/i.test(lower)) {
        if (setVal("student-domain", "Electronics", "change")) details.push("Department");
      }
    }

    // 6. Parse Semester (only when filling form)
    const semMatch = hasFormContext ? lower.match(/\b([1-8])(?:st|nd|rd|th)?\s*(?:sem|semester)\b|\bsem(?:ester)?\s*([1-8])\b/) : null;
    if (semMatch) {
      const n = Number(semMatch[1] || semMatch[2]);
      const ord = n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;
      if (setVal("student-semester", `${ord} Semester`, "change")) details.push("Semester");
    }

    // 7. Parse University selection
    const uniAliases = [
      { id: "uem", re: /\b(uem|iem)\b/i },
      { id: "iit-kharagpur", re: /\b(kharagpur|iit\s*kgp)\b/i },
      { id: "jadavpur-university", re: /\b(jadavpur)\b/i },
      { id: "iit-bombay", re: /\b(bombay|iit\s*b)\b/i },
      { id: "delhi-university", re: /\b(delhi university|\bdu\b)\b/i },
      { id: "bits-pilani", re: /\b(bits|pilani)\b/i },
      { id: "anna-university", re: /\b(anna)\b/i },
      { id: "iisc-bangalore", re: /\b(iisc|indian institute of science)\b/i }
    ];
    for (const u of uniAliases) {
      if (u.re.test(lower) && hasFormContext) {
        if (clickUniCard(u.id)) details.push("University");
        break;
      }
    }

    // Default semester to 3rd Semester when user filled fields + omitted semester so #enter-btn unlocks cleanly
    if (details.length >= 2) {
      const semEl = document.getElementById("student-semester");
      if (semEl && !semEl.value) {
        semEl.value = "3rd Semester";
        semEl.dispatchEvent(new Event("change"));
        details.push("Semester (3rd)");
      }
    }

    return { filled: details.length > 0, details };
  }

  function setVal(id, value, eventType) {
    const el = document.getElementById(id);
    if (!el) return false;
    el.value = value;
    el.dispatchEvent(new Event(eventType, { bubbles: true }));
    return true;
  }

  function clickUniCard(uniId) {
    const card = document.querySelector(`#uni-cards .uni-card[data-id="${uniId}"]`);
    if (card) {
      card.click();
      return true;
    }
    return false;
  }

  // ── 5. LIVE BACKEND-AWARE RESPONSE GENERATOR ──────────────────────
  async function generateAIResponse(msg) {
    const lower = msg.toLowerCase().trim();

    // First attempt auto-fill if user provided profile details on /university
    const autoFill = await tryAutoFillGateway(msg);
    if (autoFill.filled) {
      const enterBtn = document.getElementById("enter-btn");
      const ready = enterBtn && !enterBtn.disabled;
      const summaryLine = autoFill.studentMatched
        ? `Matched UEM Roster Roll #${autoFill.studentMatched.rollNo} (<strong>${escapeHtml(autoFill.studentMatched.name)}</strong>).<br/>`
        : "";
      const html = `${summaryLine}Updated your form with: <strong>${escapeHtml(autoFill.details.join(", "))}</strong>. ${
        ready
          ? 'Your profile is complete — click <strong>Enter University</strong> when ready!'
          : "Complete any remaining fields to unlock <strong>Enter University</strong>."
      }`;
      const actions = ready
        ? [{ label: "Enter University →", onClick: () => enterBtn.click() }]
        : [];
      return { html, actions };
    }

    // Explicitly ask user for details when they ask chatbot to fill form without data
    if (/\b(fill|auto[-\s]?fill|register|sign\s*in)\b/i.test(lower)) {
      if (isGatewayVisible()) {
        return {
          html: 'Sure! Share your details like:<br/><em>"My name is Nitish Kumar, ID 12025002034137, B.Tech CSE 3rd Sem at UEM"</em><br/>Or say <em>"Identify roll 1"</em> and I will auto-fill from the UEM roster.'
        };
      }
      return {
        html: "Head to the University Directory page and I can auto-fill the student identification form for you.",
        actions: [{ label: "Go to Select University →", href: "/university" }]
      };
    }

    // ── Roster / Student lookup ─────────────────────────────────────
    const rollQuery = msg.match(/\broll(?:\s*no\.?|\s*number)?\s*(?:is|:|#)?\s*(\d{1,2})\b/i);
    if (rollQuery || /\b(roster|section\s*b|enrollment|registration|how many students|class\s*list)\b/i.test(lower)) {
      const students = await getStudents();
      if (rollQuery) {
        const stu = students.find((s) => String(s.rollNo) === rollQuery[1]);
        if (stu) {
          const actions = isGatewayVisible()
            ? [
                {
                  label: `Fill Form as ${stu.name}`,
                  onClick: () => tryAutoFillGateway(`fill roll ${stu.rollNo}`)
                }
              ]
            : [{ label: "View Full Roster →", href: "/uem-home#students-roster" }];
          return {
            html: `<strong>UEM CSE (IoT) · Section B — Roll #${stu.rollNo}</strong><br/>Name: <strong>${escapeHtml(stu.name)}</strong><br/>Enrollment: <code>${escapeHtml(stu.enrollmentNo)}</code><br/>Registration: <code>${escapeHtml(stu.registrationNo)}</code>`,
            actions
          };
        }
        return {
          html: `Roll #${escapeHtml(rollQuery[1])} was not found. Section B covers Roll No 1 to ${students.length}.`,
          actions: [{ label: "Browse Roster →", href: "/uem-home#students-roster" }]
        };
      }
      return {
        html: `UEM's B.Tech CSE (IoT) Batch 2025–26 Section B directory has <strong>${students.length} registered students</strong> (Roll 1 to Roll ${students.length}). Ask me for any roll number (e.g. <em>"Roll no 1"</em>)!`,
        actions: [{ label: "Open Student Roster →", href: "/uem-home#students-roster" }]
      };
    }

    // ── Campus Events ───────────────────────────────────────────────
    if (/\b(events?|hackathon|ureckon|fest|calendar|add event|symposium|conclave)\b/i.test(lower)) {
      const events = await getEvents();
      const top = events.slice(0, 4);
      const listHtml = top
        .map(
          (e) =>
            `<li><strong>${escapeHtml(e.title)}</strong> — ${escapeHtml(e.date)} (${escapeHtml(e.venue)})</li>`
        )
        .join("");
      return {
        html: `There are currently <strong>${events.length} scheduled UEM events</strong>:<ul>${listHtml}</ul>You can view the full timeline or publish new ones using <strong>+ Add Event</strong>.`,
        actions: [{ label: "Explore Campus Events →", href: "/uem-home#events" }]
      };
    }

    // ── Timetable / Class Routine ───────────────────────────────────
    if (/\b(timetable|routine|schedule|classes|periods?|monday|tuesday|wednesday|thursday|friday|iot\s*2b)\b/i.test(lower)) {
      const data = await getAcademicData("3rd Semester");
      const routine = data && data.timetable && data.timetable.routine ? data.timetable.routine : {};
      const dayMatch = lower.match(/\b(monday|tuesday|wednesday|thursday|friday)\b/);
      if (dayMatch) {
        const dayKey = titleCase(dayMatch[1]);
        const slots = routine[dayKey] || [];
        const items = slots
          .filter((s) => !s.isBreak && s.subject && s.subject !== "EAA" && s.subject !== "-")
          .slice(0, 6)
          .map((s) => `<li><strong>${escapeHtml(s.time)}</strong> — ${escapeHtml(s.subject)} (${escapeHtml(s.room || "TBA")})</li>`)
          .join("");
        return {
          html: `<strong>IoT 2B · ${escapeHtml(dayKey)} Routine (Sem 3):</strong><ul>${items || "<li>No classes scheduled.</li>"}</ul>`,
          actions: [{ label: "Full Timetable →", href: "/timetable" }]
        };
      }
      return {
        html: "The official <strong>2nd Year / 3rd Semester (IoT 2B)</strong> class routine runs <strong>Monday–Friday, 9:30 AM – 5:00 PM</strong> (9 periods + 12:30–13:15 Break). Ask for any day (e.g. <em>\"Monday timetable\"</em>) or open the full view.",
        actions: [{ label: "View IoT 2B Timetable →", href: "/timetable" }]
      };
    }

    // ── Courses & Sem 3 Syllabus ────────────────────────────────────
    if (/\b(course|courses|syllabus|subjects?|curriculum|credits?|sem\s*3|3rd\s*sem|esc301|esc302|pcc301|pcccs302|bsm301|hsmcs301|dsa|data structures)\b/i.test(lower)) {
      const isSem1 = /\b(sem\s*1|1st\s*sem|first\s*sem)\b/i.test(lower);
      const data = await getAcademicData(isSem1 ? "1st Semester" : "3rd Semester");
      const courses = (data && data.courses) || [];
      const credits = data && data.curriculumSummary ? data.curriculumSummary.totals.credits : null;

      // Specific course match by code or keyword
      const matchedCourse = courses.find(
        (c) => lower.includes((c.code || "").toLowerCase()) || (c.name && lower.includes(c.name.toLowerCase()))
      );
      if (matchedCourse) {
        const mods = matchedCourse.syllabus && matchedCourse.syllabus.modules ? matchedCourse.syllabus.modules : [];
        const modHtml = mods.slice(0, 4).map((m) => `<li>${escapeHtml(m.title)}</li>`).join("");
        return {
          html: `<strong>${escapeHtml(matchedCourse.code)}: ${escapeHtml(matchedCourse.name)}</strong> (${matchedCourse.credits} Credits)${
            modHtml ? `<ul>${modHtml}</ul>` : ""
          }`,
          actions: [{ label: "Open Courses & Syllabus →", href: "/courses" }]
        };
      }

      const listHtml = courses
        .slice(0, 7)
        .map((c) => `<li><strong>${escapeHtml(c.code)}</strong> — ${escapeHtml(c.name)} (${c.credits} cr)</li>`)
        .join("");
      return {
        html: `<strong>${isSem1 ? "1st Semester" : "3rd Semester (IoT)"} Subjects</strong>${
          credits ? ` (${credits} Total Credits)` : ""
        }:<ul>${listHtml}</ul>`,
        actions: [{ label: "Browse Full Syllabus →", href: "/courses" }]
      };
    }

    // ── Universities Directory ──────────────────────────────────────
    if (/\b(universit(?:y|ies)|colleges?|institutions?|directory|campus|uem|iem|iit|jadavpur|bits|anna|iisc|delhi)\b/i.test(lower)) {
      const unis = await getUniversities();
      const activeList = unis.filter((u) => u.status === "active");
      const soonCount = unis.length - activeList.length;
      const names = activeList.map((u) => `<li><strong>${escapeHtml(u.name)}</strong> — ${escapeHtml(u.location)} (Active)</li>`).join("");
      return {
        html: `We feature <strong>${unis.length} Indian universities</strong> (${activeList.length} Active, ${soonCount} Coming Soon):<ul>${names}</ul>Only <strong>UEM</strong> has a full dedicated Campus Hub right now; IIT Kharagpur & Jadavpur University open the Academic Dashboard.`,
        actions: [
          { label: "Select University →", href: "/university" },
          { label: "Open UEM Campus Hub →", href: "/uem-home" }
        ]
      };
    }

    // ── Greeting / Fallback ─────────────────────────────────────────
    if (/^\s*(hi|hello|hey|namaste|good\s*(morning|afternoon|evening))\b/i.test(lower)) {
      return {
        html: "Hello! How can I help you today? You can ask about <strong>universities</strong>, <strong>Sem 3 courses & syllabus</strong>, the <strong>IoT 2B timetable</strong>, <strong>campus events</strong>, or <strong>auto-filling the university gateway</strong>."
      };
    }

    return {
      html: "I can help you with:<br/><ul><li><strong>Universities:</strong> Active portals & campus list</li><li><strong>Sem 3 Syllabus:</strong> Subjects, credits & modules</li><li><strong>Timetable:</strong> IoT 2B daily routine</li><li><strong>Events & Roster:</strong> Upcoming fests & Roll 1–60 lookup</li><li><strong>Form Auto-Fill:</strong> Say <em>\"My name is ..., ID ..., B.Tech CSE at UEM\"</em></li></ul>"
    };
  }

  // ── 6. INIT ───────────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountChatbot);
  } else {
    mountChatbot();
  }
})();
