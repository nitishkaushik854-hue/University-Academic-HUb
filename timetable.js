/**
 * IEM Student Hub — Timetable Application Logic
 * Handles: Stream/Year/Section selection, timetable data,
 * rendering (desktop grid + mobile day-cards), print, transitions.
 */

(function () {
  "use strict";

  // ─────────────────────────────────────────────
  // 1. TIMETABLE DATA — 1ST YEAR (Source: 1st year routine image)
  // ─────────────────────────────────────────────

  const PERIODS = [
    { id: "assembly", label: "Assembly", time: "9:00–9:30" },
    { id: "1st", label: "1st", time: "9:30–10:20" },
    { id: "2nd", label: "2nd", time: "10:20–11:10" },
    { id: "3rd", label: "3rd", time: "11:10–12:00" },
    { id: "4th", label: "4th", time: "12:00–12:50" },
    { id: "break", label: "BREAK", time: "12:50–13:40" },
    { id: "5th", label: "5th", time: "13:40–14:30" },
    { id: "6th", label: "6th", time: "14:30–15:20" },
    { id: "7th", label: "7th", time: "15:20–16:10" },
    { id: "8th", label: "8th", time: "16:10–17:00" },
  ];

  // 2nd Year · 3rd Semester (IoT 2B) Timings
  const PERIODS_3RD_SEM = [
    { id: "1st", label: "1st", time: "9:30–10:15" },
    { id: "2nd", label: "2nd", time: "10:15–11:00" },
    { id: "3rd", label: "3rd", time: "11:00–11:45" },
    { id: "4th", label: "4th", time: "11:45–12:30" },
    { id: "break", label: "BREAK", time: "12:30–13:15" },
    { id: "5th", label: "5th", time: "13:15–14:00" },
    { id: "6th", label: "6th", time: "14:00–14:45" },
    { id: "7th", label: "7th", time: "14:45–15:30" },
    { id: "8th", label: "8th", time: "15:30–16:15" },
    { id: "9th", label: "9th", time: "16:15–17:00" },
  ];

  const firstYearRoutine = {
    Monday: [
      { period: "Assembly", time: "9:00–9:30", subject: "Basic Electrical Engineering", faculty: "NM", room: "B2 LG 2.5", type: "theory" },
      { period: "1st", time: "9:30–10:20", subject: "Basic Electrical Engineering", faculty: "NM", room: "B2 LG 2.5", type: "theory" },
      { period: "2nd", time: "10:20–11:10", subject: "Physics", faculty: "APM", room: "B2 LG 2.5", type: "theory" },
      { period: "3rd", time: "11:10–12:00", subject: "Mathematics-Calculus", faculty: "SBD", room: "B2 LG 2.5", type: "theory" },
      { period: "4th", time: "12:00–12:50", subject: "Mathematics-Calculus", faculty: "SBD", room: "B2 LG 2.5", type: "theory" },
      { period: "BREAK", time: "12:50–13:40", subject: "BREAK", faculty: "", room: "", type: "break" },
      { period: "5th", time: "13:40–14:30", subject: "Introduction to AI and Data Science Laboratory using Python", faculty: "SS, SDM, SMJ, APK, DKC", room: "CCFL - II", type: "lab" },
      { period: "6th", time: "14:30–15:20", subject: "Introduction to AI and Data Science Laboratory using Python", faculty: "SS, SDM, SMJ, APK, DKC", room: "CCFL - II", type: "lab" },
      { period: "7th", time: "15:20–16:10", subject: "Introduction to AI and Data Science Laboratory using Python", faculty: "SS, SDM, SMJ, APK, DKC", room: "CCFL - II", type: "lab" },
      { period: "8th", time: "16:10–17:00", subject: "EAA", faculty: "", room: "", type: "special" },
    ],
    Tuesday: [
      { period: "Assembly", time: "9:00–9:30", subject: "Biology for Engineers Laboratory", faculty: "AV, KHD, AVS", room: "B3 LG 4.3", type: "lab" },
      { period: "1st", time: "9:30–10:20", subject: "Biology for Engineers Laboratory", faculty: "AV, KHD, AVS", room: "B3 LG 4.3", type: "lab" },
      { period: "2nd", time: "10:20–11:10", subject: "Physics", faculty: "APM", room: "B2 LG 2.5", type: "theory" },
      { period: "3rd", time: "11:10–12:00", subject: "Mathematics-Calculus", faculty: "SBD", room: "B2 LG 2.5", type: "theory" },
      { period: "4th", time: "12:00–12:50", subject: "Mathematics-Calculus", faculty: "SBD", room: "B2 LG 2.5", type: "theory" },
      { period: "BREAK", time: "12:50–13:40", subject: "BREAK", faculty: "", room: "", type: "break" },
      { period: "5th", time: "13:40–14:30", subject: "MATLAB", faculty: "SBD, CD, AN", room: "B2 LG 2.5", type: "special" },
      { period: "6th", time: "14:30–15:20", subject: "Basic Electrical Engineering", faculty: "NM", room: "B2 LG 2.5", type: "theory" },
      { period: "7th", time: "15:20–16:10", subject: "Biology for Engineers", faculty: "SN", room: "B2 LG 2.5", type: "theory" },
      { period: "8th", time: "16:10–17:00", subject: "EAA", faculty: "", room: "", type: "special" },
    ],
    Wednesday: [
      { period: "Assembly", time: "9:00–9:30", subject: "Engineering Graphics & Design", faculty: "RB, BB, PBM, ADG, SNS", room: "B3 LG 1.5 / B3 LG 2.2", type: "lab" },
      { period: "1st", time: "9:30–10:20", subject: "Engineering Graphics & Design", faculty: "RB, BB, PBM, ADG, SNS", room: "B3 LG 1.5 / B3 LG 2.2", type: "lab" },
      { period: "2nd", time: "10:20–11:10", subject: "Engineering Mechanics Principles", faculty: "GP", room: "B2 LG 2.5", type: "theory" },
      { period: "3rd", time: "11:10–12:00", subject: "Mathematics-Calculus", faculty: "SBD", room: "B2 LG 2.5", type: "theory" },
      { period: "4th", time: "12:00–12:50", subject: "Mathematics-Calculus", faculty: "SBD", room: "B2 LG 2.5", type: "theory" },
      { period: "BREAK", time: "12:50–13:40", subject: "BREAK", faculty: "", room: "", type: "break" },
      { period: "5th", time: "13:40–14:30", subject: "Physics", faculty: "APM", room: "B2 LG 2.5", type: "theory" },
      { period: "6th", time: "14:30–15:20", subject: "Essential Studies for Career Development", faculty: "GS DEPT.", room: "B2 LG 2.5", type: "special" },
      { period: "7th", time: "15:20–16:10", subject: "Essential Studies for Career Development", faculty: "GS DEPT.", room: "B2 LG 2.5", type: "special" },
      { period: "8th", time: "16:10–17:00", subject: "EAA", faculty: "", room: "", type: "special" },
    ],
    Thursday: [
      { period: "Assembly", time: "9:00–9:30", subject: "Basic Electrical Engineering", faculty: "NM", room: "B2 LG 2.5", type: "theory" },
      { period: "1st", time: "9:30–10:20", subject: "Biology for Engineers", faculty: "SN", room: "B2 LG 2.5", type: "theory" },
      { period: "2nd", time: "10:20–11:10", subject: "Competitive Aptitude Training-I", faculty: "GS DEPT.", room: "B2 LG 2.5", type: "special" },
      { period: "3rd", time: "11:10–12:00", subject: "Physical Education / Soft Skill", faculty: "MSB, TG, SHD, LKS, KSR", room: "B2 LG 2.5", type: "special" },
      { period: "4th", time: "12:00–12:50", subject: "Physical Education / Soft Skill", faculty: "MSB, TG, SHD, LKS, KSR", room: "B2 LG 2.5", type: "special" },
      { period: "BREAK", time: "12:50–13:40", subject: "BREAK", faculty: "", room: "", type: "break" },
      { period: "5th", time: "13:40–14:30", subject: "Competitive Aptitude Training-I", faculty: "GS DEPT.", room: "B2 LG 2.5", type: "special" },
      { period: "6th", time: "14:30–15:20", subject: "Physics Laboratory", faculty: "RND, APM, PMP, AGS, BG", room: "B2 LG 4.3 / B2 LG 4.4", type: "lab" },
      { period: "7th", time: "15:20–16:10", subject: "Physics Laboratory", faculty: "RND, APM, PMP, AGS, BG", room: "B2 LG 4.3 / B2 LG 4.4", type: "lab" },
      { period: "8th", time: "16:10–17:00", subject: "EAA", faculty: "", room: "", type: "special" },
    ],
    Friday: [
      { period: "Assembly", time: "9:00–9:30", subject: "Engineering Mechanics Principles", faculty: "RB", room: "B2 LG 2.5", type: "theory" },
      { period: "1st", time: "9:30–10:20", subject: "Physics", faculty: "APM", room: "B2 LG 2.5", type: "theory" },
      { period: "2nd", time: "10:20–11:10", subject: "Basic Electrical Engineering Laboratory", faculty: "TSB, GS, SNP, SMP, PMK", room: "B2 LG 3.3/4.1", type: "lab" },
      { period: "3rd", time: "11:10–12:00", subject: "Basic Electrical Engineering Laboratory", faculty: "TSB, GS, SNP, SMP, PMK", room: "B2 LG 3.3/4.1", type: "lab" },
      { period: "4th", time: "12:00–12:50", subject: "Basic Electrical Engineering Laboratory", faculty: "TSB, GS, SNP, SMP, PMK", room: "B2 LG 3.3/4.1", type: "lab" },
      { period: "BREAK", time: "12:50–13:40", subject: "BREAK", faculty: "", room: "", type: "break" },
      { period: "5th", time: "13:40–14:30", subject: "Foreign Language", faculty: "Academy Of Foreign Language", room: "B2 LG 2.5", type: "theory" },
      { period: "6th", time: "14:30–15:20", subject: "Economics and Business Models", faculty: "BRB", room: "B2 LG 2.5", type: "theory" },
      { period: "7th", time: "15:20–16:10", subject: "Design Thinking and Innovation-Ideation & Research", faculty: "TNP, TG", room: "B2 LG 2.5", type: "theory" },
      { period: "8th", time: "16:10–17:00", subject: "EAA", faculty: "", room: "", type: "special" },
    ],
  };

  // Faculty Initials (from 1st year routine image)
  const facultyInitials = {
    "NM": "Prof. (Dr.) Sandip Mukherjee",
    "AV": "Prof. Amitava Ukil",
    "KHD": "Prof. (Dr.) Kaushik Saha",
    "AVS": "Prof. (Dr.) Ruma Chatterjee",
    "RB": "Prof. (Dr.) Ruma Chatterjee",
    "BB": "Prof. Biswajit Banerjee",
    "PBM": "Prof. Pradip B. Maity",
    "ADG": "Prof. Arnab De",
    "SNS": "Prof. Subhajit Sen",
    "APM": "Prof. Soumya Pramanik",
    "SBD": "Prof. Mainak Ukil",
    "SN": "Prof. (Dr.) Souvik Nayak",
    "GP": "Prof. Goutam Paul",
    "GS": "Guest Faculty",
    "CD": "Prof. Chandrima Dey",
    "AN": "Prof. Ananya Nag",
    "RND": "Prof. R. N. Dey",
    "PMP": "Prof. Partha Pratim",
    "AGS": "Prof. Argha Sen",
    "BG": "Prof. Biswajit Ghosh",
    "TSB": "Prof. T. S. Banerjee",
    "SNP": "Prof. S. N. Pal",
    "SMP": "Prof. Suman Pramanik",
    "PMK": "Prof. Pradipta Kumar",
    "MSB": "Prof. Manas Barman",
    "TG": "Prof. Tapas Ghosh",
    "SHD": "Prof. Shankar De",
    "LKS": "Prof. L. K. Shaw",
    "KSR": "Prof. K. S. Roy",
    "TNP": "Prof. Tapan Nag",
    "SS": "Faculty",
    "SDM": "Faculty",
    "SMJ": "Faculty",
    "APK": "Faculty",
    "DKC": "Faculty",
    "BRB": "Faculty",
  };

  // 2nd Year Reference Master Image (Archive)
  const secondYearImagePath = "assets/photo/routine-2nd-year.png";

  // 2nd Year · 3rd Semester Interactive Routine (IoT 2B Schedule)
  const secondYearThirdSemRoutine = {
    Monday: [
      { period: "1st", time: "9:30–10:15", subject: "Technical Skill Development", faculty: "MNC", room: "B3 LG 4.6", type: "special" },
      { period: "2nd", time: "10:15–11:00", subject: "Technical Skill Development", faculty: "MNC", room: "B3 LG 4.6", type: "special" },
      { period: "3rd", time: "11:00–11:45", subject: "Data Structures and Algorithms", faculty: "PB", room: "B3 LG 4.6", type: "theory" },
      { period: "4th", time: "11:45–12:30", subject: "Analog Electronic Circuits", faculty: "SRN", room: "B3 LG 4.6", type: "theory" },
      { period: "BREAK", time: "12:30–13:15", subject: "BREAK", faculty: "", room: "", type: "break" },
      { period: "5th", time: "13:15–14:00", subject: "Digital Electronic Circuits", faculty: "SGH", room: "B3 LG 4.6", type: "theory" },
      { period: "6th", time: "14:00–14:45", "subject": "ESEP III", faculty: "ARC", room: "B3 LG 4.6", type: "special" },
      { period: "7th", time: "14:45–15:30", "subject": "ESEP III", faculty: "ARC", room: "B3 LG 4.6", type: "special" },
      { period: "8th", time: "15:30–16:15", subject: "Pre-Placement Training", faculty: "PB", room: "B3 LG 2.8", type: "special" },
      { period: "9th", time: "16:15–17:00", subject: "EAA", faculty: "", room: "", type: "special" },
    ],
    Tuesday: [
      { period: "1st", time: "9:30–10:15", subject: "Analog Electronic Circuits", faculty: "PRN", room: "B3 LG 4.6", type: "theory" },
      { period: "2nd", time: "10:15–11:00", subject: "Principles of Management", faculty: "SDA", room: "B3 LG 4.6", type: "theory" },
      { period: "3rd", time: "11:00–11:45", subject: "Principles of Management", faculty: "SDA", room: "B3 LG 4.6", type: "theory" },
      { period: "4th", time: "11:45–12:30", subject: "Pre-Placement Training", faculty: "RJD", room: "B3 LG 4.6", type: "special" },
      { period: "BREAK", time: "12:30–13:15", subject: "BREAK", faculty: "", room: "", type: "break" },
      { period: "5th", time: "13:15–14:00", subject: "Mathematics III", faculty: "SNG", room: "B3 LG 4.6", type: "theory" },
      { period: "6th", time: "14:00–14:45", subject: "Digital Electronic Circuits Laboratory", faculty: "SGH, SRN, SCS", room: "B2 LG 0.6", type: "lab" },
      { period: "7th", time: "14:45–15:30", subject: "Digital Electronic Circuits Laboratory", faculty: "SGH, SRN, SCS", room: "B2 LG 0.6", type: "lab" },
      { period: "8th", time: "15:30–16:15", subject: "Digital Electronic Circuits Laboratory", faculty: "SGH, AYC, SCS", room: "B2 LG 0.6", type: "lab" },
      { period: "9th", time: "16:15–17:00", subject: "EAA", faculty: "", room: "", type: "special" },
    ],
    Wednesday: [
      { period: "1st", time: "9:30–10:15", subject: "Analog Electronic Circuits Laboratory", faculty: "RJD, PRN, SCS", room: "B3 LG 3.9", type: "lab" },
      { period: "2nd", time: "10:15–11:00", subject: "Analog Electronic Circuits Laboratory", faculty: "RJD, PRN, SCS", room: "B3 LG 3.9", type: "lab" },
      { period: "3rd", time: "11:00–11:45", subject: "Pre-Placement Training", faculty: "SG", room: "B3 LG 4.6", type: "special" },
      { period: "4th", time: "11:45–12:30", subject: "Data Structures and Algorithms", faculty: "MMD", room: "B3 LG 4.6", type: "theory" },
      { period: "BREAK", time: "12:30–13:15", subject: "BREAK", faculty: "", room: "", type: "break" },
      { period: "5th", time: "13:15–14:00", subject: "Pre-Placement Training", faculty: "SCH", room: "B3 LG 4.6", type: "special" },
      { period: "6th", time: "14:00–14:45", subject: "Digital Electronic Circuits", faculty: "SGH", room: "B3 LG 4.6", type: "theory" },
      { period: "7th", time: "14:45–15:30", subject: "Pre-Placement Training", faculty: "", room: "RRR Hall", type: "special" },
      { period: "8th", time: "15:30–16:15", subject: "Pre-Placement Training", faculty: "", room: "RRR Hall", type: "special" },
      { period: "9th", time: "16:15–17:00", subject: "EAA", faculty: "", room: "", type: "special" },
    ],
    Thursday: [
      { period: "1st", time: "9:30–10:15", subject: "IT Workshop Laboratory", faculty: "RSG, AYC", room: "B3 LG 2.8", type: "lab" },
      { period: "2nd", time: "10:15–11:00", subject: "IT Workshop Laboratory", faculty: "RSG, AYC", room: "B3 LG 2.8", type: "lab" },
      { period: "3rd", time: "11:00–11:45", subject: "Pre-Placement Training", faculty: "SG", room: "B3 LG 4.6", type: "special" },
      { period: "4th", time: "11:45–12:30", subject: "Analog Electronic Circuits", faculty: "RJD", room: "B3 LG 4.6", type: "theory" },
      { period: "BREAK", time: "12:30–13:15", subject: "BREAK", faculty: "", room: "", type: "break" },
      { period: "5th", time: "13:15–14:00", subject: "Data Structures Laboratory", faculty: "MMD, PRN", room: "B3 LG 2.7", type: "lab" },
      { period: "6th", time: "14:00–14:45", subject: "Data Structures Laboratory", faculty: "MMD, PRN", room: "B3 LG 2.7", type: "lab" },
      { period: "7th", time: "14:45–15:30", subject: "Data Structures Laboratory", faculty: "MMD, PRN", room: "B3 LG 2.7", type: "lab" },
      { period: "8th", time: "15:30–16:15", subject: "Pre-Placement Training", faculty: "SKB", room: "B3 LG 4.6", type: "special" },
      { period: "9th", time: "16:15–17:00", subject: "EAA", faculty: "", room: "", type: "special" },
    ],
    Friday: [
      { period: "1st", time: "9:30–10:15", subject: "Analog Electronic Circuits", faculty: "SRN", room: "B3 LG 4.6", type: "theory" },
      { period: "2nd", time: "10:15–11:00", subject: "Pre-Placement Training", faculty: "SPG", room: "B3 LG 2.8", type: "special" },
      { period: "3rd", time: "11:00–11:45", subject: "Data Structures and Algorithms", faculty: "MMD", room: "B3 LG 4.6", type: "theory" },
      { period: "4th", time: "11:45–12:30", subject: "Digital Electronic Circuits", faculty: "AYC", room: "B3 LG 4.6", type: "theory" },
      { period: "BREAK", time: "12:30–13:15", subject: "BREAK", faculty: "", room: "", type: "break" },
      { period: "5th", time: "13:15–14:00", subject: "Digital Electronic Circuits", faculty: "AYC", room: "B3 LG 4.6", type: "theory" },
      { period: "6th", time: "14:00–14:45", subject: "Mathematics III", faculty: "SNG", room: "B3 LG 4.6", type: "theory" },
      { period: "7th", time: "14:45–15:30", subject: "Mathematics III", faculty: "SNG", room: "B3 LG 4.6", type: "theory" },
      { period: "8th", time: "15:30–16:15", subject: "Pre-Placement Training", faculty: "SBD", room: "B3 LG 4.6", type: "special" },
      { period: "9th", time: "16:15–17:00", subject: "EAA", faculty: "", room: "", type: "special" },
    ],
  };

  // ─────────────────────────────────────────────
  // 2. CONFIGURATION
  // ─────────────────────────────────────────────

  const STREAMS = [
    { id: "cse-ai", label: "CSE AI", subtitle: "Artificial Intelligence" },
    { id: "cse-iot", label: "CSE IoT", subtitle: "Internet of Things" },
    { id: "cse-ds", label: "CSE Data Science", subtitle: "Data Science" },
    { id: "cse-iot-cs-bt", label: "CSE (IoT, CS & BT)", subtitle: "IoT, CS & Blockchain Technology" },
  ];

  const YEARS = ["1st Year", "2nd Year"];
  const SECTIONS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  // ─────────────────────────────────────────────
  // 3. STATE
  // ─────────────────────────────────────────────

  let state = {
    stream: null,
    year: null,
    section: null,
    activeDay: "Monday",
    showResult: false,
  };

  // ─────────────────────────────────────────────
  // 4. DOM REFERENCES
  // ─────────────────────────────────────────────

  const selectionPanel = document.getElementById("selection-panel");
  const resultPanel = document.getElementById("result-panel");
  const streamCards = document.getElementById("stream-cards");
  const yearCards = document.getElementById("year-cards");
  const sectionSelect = document.getElementById("section-select");
  const viewRoutineBtn = document.getElementById("view-routine-btn");
  const changeSelectionBtn = document.getElementById("change-selection-btn");
  const printBtn = document.getElementById("print-btn");

  // Progress steps
  const step1 = document.getElementById("step-1");
  const step2 = document.getElementById("step-2");
  const step3 = document.getElementById("step-3");
  const progressLine1 = document.getElementById("progress-line-1");
  const progressLine2 = document.getElementById("progress-line-2");

  // Year and section containers
  const yearContainer = document.getElementById("year-container");
  const sectionContainer = document.getElementById("section-container");
  const btnContainer = document.getElementById("btn-container");

  // Validation messages
  const streamError = document.getElementById("stream-error");
  const yearError = document.getElementById("year-error");
  const sectionError = document.getElementById("section-error");

  // ─────────────────────────────────────────────
  // 5. STREAM SELECTION
  // ─────────────────────────────────────────────

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
      card.innerHTML = `
        <span class="stream-card-name">${s.label}</span>
        <span class="stream-card-subtitle">${s.subtitle}</span>
      `;
      card.addEventListener("click", () => selectStream(s.label));
      streamCards.appendChild(card);
    });
  }

  function selectStream(streamLabel) {
    state.stream = streamLabel;
    state.year = null;
    state.section = null;

    // Update stream cards
    document.querySelectorAll(".stream-card").forEach((c) => {
      const isSelected = c.dataset.stream === streamLabel;
      c.classList.toggle("selected", isSelected);
      c.setAttribute("aria-checked", isSelected ? "true" : "false");
    });

    // Enable year selection
    yearContainer.classList.remove("disabled");
    yearContainer.classList.add("animate-in");

    // Reset year cards
    document.querySelectorAll(".year-card").forEach((c) => {
      c.classList.remove("selected");
      c.setAttribute("aria-checked", "false");
    });

    // Disable section
    sectionContainer.classList.add("disabled");
    sectionSelect.value = "";

    // Disable button
    btnContainer.classList.add("disabled");

    // Clear errors
    hideError(streamError);
    hideError(yearError);
    hideError(sectionError);

    updateProgress();
  }

  // ─────────────────────────────────────────────
  // 6. YEAR SELECTION
  // ─────────────────────────────────────────────

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
      card.addEventListener("click", () => {
        if (yearContainer.classList.contains("disabled")) return;
        selectYear(y);
      });
      yearCards.appendChild(card);
    });
  }

  function selectYear(yearLabel) {
    if (!state.stream) return;
    state.year = yearLabel;
    state.section = null;

    document.querySelectorAll(".year-card").forEach((c) => {
      const isSelected = c.dataset.year === yearLabel;
      c.classList.toggle("selected", isSelected);
      c.setAttribute("aria-checked", isSelected ? "true" : "false");
    });

    // Enable section
    sectionContainer.classList.remove("disabled");
    sectionContainer.classList.add("animate-in");
    sectionSelect.value = "";

    // Disable button
    btnContainer.classList.add("disabled");

    hideError(yearError);
    hideError(sectionError);
    updateProgress();
  }

  // ─────────────────────────────────────────────
  // 7. SECTION SELECTION
  // ─────────────────────────────────────────────

  function initSectionSelect() {
    if (!sectionSelect) return;
    sectionSelect.innerHTML = '<option value="" disabled selected>Select Section</option>';
    SECTIONS.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = `Section ${s}`;
      sectionSelect.appendChild(opt);
    });

    sectionSelect.addEventListener("change", () => {
      if (sectionContainer.classList.contains("disabled")) return;
      state.section = sectionSelect.value;
      btnContainer.classList.remove("disabled");
      btnContainer.classList.add("animate-in");
      hideError(sectionError);
      updateProgress();
    });
  }

  // ─────────────────────────────────────────────
  // 8. PROGRESS INDICATOR
  // ─────────────────────────────────────────────

  function updateProgress() {
    // Step 1
    if (state.stream) {
      step1.classList.add("completed");
      step1.classList.remove("active");
      progressLine1.classList.add("active");
    } else {
      step1.classList.remove("completed");
      step1.classList.add("active");
      progressLine1.classList.remove("active");
    }

    // Step 2
    if (state.year) {
      step2.classList.add("completed");
      step2.classList.remove("active");
      progressLine2.classList.add("active");
    } else if (state.stream) {
      step2.classList.remove("completed");
      step2.classList.add("active");
      progressLine2.classList.remove("active");
    } else {
      step2.classList.remove("completed", "active");
      progressLine2.classList.remove("active");
    }

    // Step 3
    if (state.section) {
      step3.classList.add("completed");
      step3.classList.remove("active");
    } else if (state.year) {
      step3.classList.remove("completed");
      step3.classList.add("active");
    } else {
      step3.classList.remove("completed", "active");
    }
  }

  // ─────────────────────────────────────────────
  // 9. VIEW ROUTINE
  // ─────────────────────────────────────────────

  function initViewRoutineBtn() {
    if (!viewRoutineBtn) return;
    viewRoutineBtn.addEventListener("click", () => {
      // Validate
      let valid = true;
      if (!state.stream) {
        showError(streamError, "Please select your stream.");
        valid = false;
      }
      if (!state.year) {
        showError(yearError, "Please select your study year.");
        valid = false;
      }
      if (!state.section) {
        showError(sectionError, "Please select your section.");
        valid = false;
      }
      if (!valid) return;

      showRoutineResult();
    });
  }

  function showRoutineResult() {
    state.showResult = true;

    // Transition: selection out, result in
    selectionPanel.classList.add("slide-out");

    setTimeout(() => {
      selectionPanel.style.display = "none";
      selectionPanel.classList.remove("slide-out");

      resultPanel.style.display = "block";
      // Force reflow
      void resultPanel.offsetHeight;
      resultPanel.classList.add("slide-in");

      renderResult();

      // Scroll to top of result
      window.scrollTo({ top: resultPanel.offsetTop - 80, behavior: "smooth" });
    }, 350);
  }

  function showSelectionPanel() {
    state.showResult = false;

    resultPanel.classList.add("slide-out");

    setTimeout(() => {
      resultPanel.style.display = "none";
      resultPanel.classList.remove("slide-out", "slide-in");

      selectionPanel.style.display = "block";
      void selectionPanel.offsetHeight;
      selectionPanel.classList.add("slide-in");

      setTimeout(() => selectionPanel.classList.remove("slide-in"), 500);

      window.scrollTo({ top: selectionPanel.offsetTop - 80, behavior: "smooth" });
    }, 350);
  }

  // ─────────────────────────────────────────────
  // 10. RENDER RESULT
  // ─────────────────────────────────────────────

  function renderResult() {
    // Update info strip
    document.getElementById("result-stream").textContent = state.stream;
    document.getElementById("result-year").textContent = state.year;
    document.getElementById("result-section").textContent = `Section ${state.section}`;
    document.getElementById("result-identity").textContent =
      `${state.stream}  ·  ${state.year}  ·  Section ${state.section}`;

    const statusEl = document.querySelector(".info-status");
    if (statusEl) {
      statusEl.textContent = state.year === "2nd Year"
        ? "3rd Semester · IoT 2B Schedule"
        : "1st Semester · Section Schedule";
    }

    const routineContainer = document.getElementById("routine-container");
    routineContainer.innerHTML = "";

    if (state.year === "1st Year") {
      renderFirstYearRoutine(routineContainer);
    } else {
      renderSecondYearRoutine(routineContainer);
    }
  }

  // ─────────────────────────────────────────────
  // 11. SHARED STRUCTURED ROUTINE RENDERER
  // ─────────────────────────────────────────────

  function renderStructuredRoutine(container, periods, routineData) {
    // Desktop: full weekly grid
    const desktopWrapper = document.createElement("div");
    desktopWrapper.className = "routine-desktop";
    desktopWrapper.innerHTML = renderDesktopTable(periods, routineData);
    container.appendChild(desktopWrapper);

    // Mobile: day-based cards
    const mobileWrapper = document.createElement("div");
    mobileWrapper.className = "routine-mobile";
    mobileWrapper.innerHTML = renderMobileDaySelector() + renderMobileDayCards(routineData);
    container.appendChild(mobileWrapper);

    // Initialize mobile day tabs
    initMobileDayTabs(mobileWrapper);

    // Legend
    container.appendChild(createLegend());

    // Notice
    container.appendChild(createNotice());
  }

  function renderFirstYearRoutine(container) {
    renderStructuredRoutine(container, PERIODS, firstYearRoutine);
  }

  function renderDesktopTable(periods, routineData) {
    let html = '<div class="routine-table-wrapper"><table class="routine-table" role="table">';

    // Header row
    html += '<thead><tr><th class="time-header">Time</th>';
    DAYS.forEach((day) => {
      html += `<th class="day-header">${day}</th>`;
    });
    html += "</tr></thead><tbody>";

    // Period rows
    periods.forEach((p) => {
      if (p.id === "break") {
        html += `<tr class="break-row">
          <td class="time-cell break-cell">${p.time}<br><span class="period-label">${p.label}</span></td>`;
        DAYS.forEach(() => {
          html += '<td class="break-cell">BREAK</td>';
        });
        html += "</tr>";
        return;
      }

      html += `<tr><td class="time-cell">${p.time}<br><span class="period-label">${p.label}</span></td>`;

      DAYS.forEach((day) => {
        const daySlots = routineData[day] || [];
        const slot = daySlots.find((s) => s.period === p.label);
        if (slot) {
          // Check if this slot is a continuation of the previous period (same subject)
          const prevPeriodIdx = periods.findIndex((pp) => pp.label === p.label) - 1;
          const prevPeriod = prevPeriodIdx >= 0 ? periods[prevPeriodIdx] : null;
          const prevSlot = prevPeriod ? daySlots.find((s) => s.period === prevPeriod.label) : null;
          const isContinuation = prevSlot && prevSlot.subject === slot.subject && prevSlot.type !== "break";

          html += `<td class="class-cell type-${slot.type}${isContinuation ? " continuation" : ""}">
            <div class="cell-subject">${slot.subject}</div>
            ${slot.faculty ? `<div class="cell-faculty">${slot.faculty}</div>` : ""}
            ${slot.room ? `<div class="cell-room">${slot.room}</div>` : ""}
          </td>`;
        } else {
          html += '<td class="class-cell type-free">—</td>';
        }
      });
      html += "</tr>";
    });

    html += "</tbody></table></div>";
    return html;
  }

  // ─────────────────────────────────────────────
  // 12. MOBILE DAY CARDS
  // ─────────────────────────────────────────────

  function renderMobileDaySelector() {
    let html = '<div class="mobile-day-selector" role="tablist" aria-label="Select day">';
    DAYS.forEach((day, i) => {
      const shortDay = day.substring(0, 3);
      html += `<button class="mobile-day-tab${i === 0 ? " active" : ""}" 
        role="tab" 
        aria-selected="${i === 0 ? "true" : "false"}" 
        data-day="${day}">${shortDay}</button>`;
    });
    html += "</div>";
    return html;
  }

  function renderMobileDayCards(routineData) {
    let html = '<div class="mobile-day-panels">';
    DAYS.forEach((day, i) => {
      html += `<div class="mobile-day-panel${i === 0 ? " active" : ""}" 
        role="tabpanel" data-day="${day}">
        <h4 class="mobile-day-title">${day}</h4>`;

      (routineData[day] || []).forEach((slot) => {
        if (slot.type === "break") {
          html += `<div class="mobile-period-card type-break">
            <div class="mobile-period-time">${slot.time}</div>
            <div class="mobile-period-subject">BREAK</div>
          </div>`;
          return;
        }

        html += `<div class="mobile-period-card type-${slot.type}">
          <div class="mobile-period-time">${slot.time}</div>
          <div class="mobile-period-subject">${slot.subject}</div>
          ${slot.faculty ? `<div class="mobile-period-detail"><span class="detail-label">Faculty:</span> ${slot.faculty}</div>` : ""}
          ${slot.room ? `<div class="mobile-period-detail"><span class="detail-label">Room:</span> ${slot.room}</div>` : ""}
          <span class="mobile-period-type-badge type-${slot.type}">${getTypeLabel(slot.type)}</span>
        </div>`;
      });

      html += "</div>";
    });
    html += "</div>";
    return html;
  }

  function initMobileDayTabs(wrapper) {
    const tabs = wrapper.querySelectorAll(".mobile-day-tab");
    const panels = wrapper.querySelectorAll(".mobile-day-panel");

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const day = tab.dataset.day;

        tabs.forEach((t) => {
          t.classList.remove("active");
          t.setAttribute("aria-selected", "false");
        });
        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");

        panels.forEach((p) => {
          p.classList.toggle("active", p.dataset.day === day);
        });
      });
    });
  }

  function getTypeLabel(type) {
    switch (type) {
      case "lab": return "Lab / Practical";
      case "special": return "Special Session";
      case "theory": return "Theory";
      default: return "";
    }
  }

  // ─────────────────────────────────────────────
  // 13. SECOND YEAR ROUTINE (3RD SEMESTER IoT 2B + ARCHIVE SHEET)
  // ─────────────────────────────────────────────

  function renderSecondYearRoutine(container) {
    const headerBanner = document.createElement("div");
    headerBanner.className = "routine-2nd-year";
    headerBanner.innerHTML = `
      <div class="routine-2nd-info" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.75rem;padding:0.9rem 1.25rem;background:var(--blue-soft);border-radius:12px;border-left:4px solid var(--blue);">
        <div>
          <strong style="color:var(--blue);font-size:0.95rem;">2nd Year · 3rd Semester Timetable (IoT 2B Routine)</strong>
          <p class="routine-2nd-note" style="margin:0.2rem 0 0;padding:0;border:none;background:transparent;">Periods 1st–9th (9:30 AM – 5:00 PM) · Break 12:30–1:15 PM · Classrooms B3 LG 4.6 / Labs / RRR Hall</p>
        </div>
        <button type="button" class="action-btn" id="toggle-2nd-year-sheet-btn" style="flex-shrink:0;">
          View Reference Image Sheet
        </button>
      </div>
      <div class="routine-image-wrapper" id="second-year-archive-sheet" style="display:none;margin-top:1rem;">
        <img
          src="${secondYearImagePath}"
          alt="2nd Year Master Class Routine Archive"
          class="routine-image"
          loading="lazy"
          decoding="async"
        />
      </div>
    `;
    container.appendChild(headerBanner);

    const toggleBtn = headerBanner.querySelector("#toggle-2nd-year-sheet-btn");
    const archiveSheet = headerBanner.querySelector("#second-year-archive-sheet");
    if (toggleBtn && archiveSheet) {
      toggleBtn.addEventListener("click", () => {
        const isHidden = archiveSheet.style.display === "none";
        archiveSheet.style.display = isHidden ? "block" : "none";
        toggleBtn.textContent = isHidden ? "Hide Reference Sheet" : "View Reference Image Sheet";
      });
    }

    renderStructuredRoutine(container, PERIODS_3RD_SEM, secondYearThirdSemRoutine);
  }

  // ─────────────────────────────────────────────
  // 14. LEGEND & NOTICE
  // ─────────────────────────────────────────────

  function createLegend() {
    const legend = document.createElement("div");
    legend.className = "routine-legend";
    legend.innerHTML = `
      <h4 class="legend-title">Legend</h4>
      <div class="legend-items">
        <div class="legend-item">
          <span class="legend-swatch type-lab"></span>
          <span>Laboratory / Practical</span>
        </div>
        <div class="legend-item">
          <span class="legend-swatch type-special"></span>
          <span>Special Session / Mentoring</span>
        </div>
        <div class="legend-item">
          <span class="legend-swatch type-theory"></span>
          <span>Theory / Regular Class</span>
        </div>
      </div>
    `;
    return legend;
  }

  function createNotice() {
    const notice = document.createElement("div");
    notice.className = "routine-notice";
    notice.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <span>Routine is subject to change. Please check the official notice board for updates.</span>
    `;
    return notice;
  }

  // ─────────────────────────────────────────────
  // 15. UTILITY / UI HELPERS
  // ─────────────────────────────────────────────

  function showError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
  }

  function hideError(el) {
    if (!el) return;
    el.style.display = "none";
  }

  // ─────────────────────────────────────────────
  // 16. PRINT
  // ─────────────────────────────────────────────

  function initPrint() {
    if (!printBtn) return;
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  // ─────────────────────────────────────────────
  // 17. CHANGE SELECTION
  // ─────────────────────────────────────────────

  function initChangeSelection() {
    if (!changeSelectionBtn) return;
    changeSelectionBtn.addEventListener("click", showSelectionPanel);
  }

  // ─────────────────────────────────────────────
  // 18. NAVIGATION SCROLL STATE (reuse from homepage)
  // ─────────────────────────────────────────────

  const siteHeader = document.getElementById("site-header");
  let ticking = false;

  function updateNavOnScroll() {
    if (window.scrollY > 50) {
      siteHeader.classList.add("scrolled");
    } else {
      siteHeader.classList.remove("scrolled");
    }
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(updateNavOnScroll);
      ticking = true;
    }
  }, { passive: true });

  // ─────────────────────────────────────────────
  // 19. MOBILE MENU (reuse from homepage)
  // ─────────────────────────────────────────────

  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      const isOpen = mobileMenu.classList.toggle("active");
      mobileMenuBtn.classList.toggle("active", isOpen);
      mobileMenuBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      mobileMenu.setAttribute("aria-hidden", isOpen ? "false" : "true");
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

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
  // 20. INIT
  // ─────────────────────────────────────────────

  function init() {
    initStreamCards();
    initYearCards();
    initSectionSelect();
    initViewRoutineBtn();
    initChangeSelection();
    initPrint();
    updateProgress();
  }

  // Run
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
