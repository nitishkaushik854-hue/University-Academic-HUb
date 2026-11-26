const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const UNIVERSITIES_FILE = path.join(__dirname, "../data/universities.json");
const ACADEMIC_FILE = path.join(__dirname, "../data/academicData.json");
const STUDENTS_FILE = path.join(__dirname, "../data/uem_students.json");
const EVENTS_FILE = path.join(__dirname, "../data/events.json");

// In-memory cache loaded from JSON files
let universitiesCache = [];
let academicDataCache = {};
let uemStudentsCache = [];
let eventsCache = [];

function loadData() {
  try {
    const uniRaw = fs.readFileSync(UNIVERSITIES_FILE, "utf-8");
    universitiesCache = JSON.parse(uniRaw);
  } catch (err) {
    console.error("Error loading universities.json:", err.message);
    universitiesCache = [];
  }

  try {
    const acadRaw = fs.readFileSync(ACADEMIC_FILE, "utf-8");
    academicDataCache = JSON.parse(acadRaw);
  } catch (err) {
    console.error("Error loading academicData.json:", err.message);
    academicDataCache = {};
  }

  try {
    if (fs.existsSync(STUDENTS_FILE)) {
      const stuRaw = fs.readFileSync(STUDENTS_FILE, "utf-8");
      uemStudentsCache = JSON.parse(stuRaw);
    }
  } catch (err) {
    console.error("Error loading uem_students.json:", err.message);
    uemStudentsCache = [];
  }

  try {
    if (fs.existsSync(EVENTS_FILE)) {
      const evRaw = fs.readFileSync(EVENTS_FILE, "utf-8");
      eventsCache = JSON.parse(evRaw);
    }
  } catch (err) {
    console.error("Error loading events.json:", err.message);
    eventsCache = [];
  }
}

// Initial load
loadData();

/**
 * Get all universities with optional search and filters
 */
function getUniversities({ search, state, type, status } = {}) {
  let list = [...universitiesCache];

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter((u) => {
      const matchName = u.name && u.name.toLowerCase().includes(q);
      const matchShort = u.shortName && u.shortName.toLowerCase().includes(q);
      const matchCity = u.city && u.city.toLowerCase().includes(q);
      const matchState = u.state && u.state.toLowerCase().includes(q);
      const matchCode = u.code && u.code.toLowerCase().includes(q);
      return matchName || matchShort || matchCity || matchState || matchCode;
    });
  }

  if (state && state.trim()) {
    const s = state.trim().toLowerCase();
    list = list.filter((u) => u.state && u.state.toLowerCase() === s);
  }

  if (type && type.trim()) {
    const t = type.trim().toLowerCase();
    list = list.filter((u) => u.type && u.type.toLowerCase().includes(t));
  }

  if (status && status.trim()) {
    const st = status.trim().toLowerCase();
    list = list.filter((u) => u.status && u.status.toLowerCase() === st);
  }

  return list;
}

/**
 * Get university details by ID
 */
function getUniversityById(id) {
  if (!id) return null;
  const targetId = id.trim().toLowerCase();
  return universitiesCache.find((u) => u.id.toLowerCase() === targetId) || null;
}

/**
 * Get students for university (with search/filter)
 */
function getStudents({ universityId, section, search, rollNo, enrollmentNo } = {}) {
  let list = [...uemStudentsCache];

  if (section && section.trim()) {
    const sec = section.trim().toUpperCase();
    list = list.filter((s) => s.section && s.section.toUpperCase() === sec);
  }

  if (rollNo) {
    const r = parseInt(rollNo, 10);
    if (!isNaN(r)) {
      list = list.filter((s) => s.rollNo === r);
    }
  }

  if (enrollmentNo && enrollmentNo.trim()) {
    const en = enrollmentNo.trim();
    list = list.filter((s) => s.enrollmentNo === en);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter((s) => {
      const matchName = s.name && s.name.toLowerCase().includes(q);
      const matchRoll = s.rollNo && s.rollNo.toString().includes(q);
      const matchEnroll = s.enrollmentNo && s.enrollmentNo.toLowerCase().includes(q);
      const matchReg = s.registrationNo && s.registrationNo.toLowerCase().includes(q);
      return matchName || matchRoll || matchEnroll || matchReg;
    });
  }

  return list;
}

/**
 * Get events for university
 */
function getEvents({ universityId, category, status, search } = {}) {
  let list = [...eventsCache];

  if (category && category.trim() && category.trim().toLowerCase() !== "all") {
    const cat = category.trim().toLowerCase();
    list = list.filter((e) => {
      const matchCat = e.category && e.category.toLowerCase().includes(cat);
      const matchGroup = e.categoryGroup && e.categoryGroup.toLowerCase() === cat;
      return matchCat || matchGroup;
    });
  }

  if (status && status.trim() && status.trim().toLowerCase() !== "all") {
    const st = status.trim().toLowerCase();
    list = list.filter((e) => e.status && e.status.toLowerCase().includes(st));
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter((e) => {
      const matchTitle = e.title && e.title.toLowerCase().includes(q);
      const matchDesc = e.description && e.description.toLowerCase().includes(q);
      const matchVenue = e.venue && e.venue.toLowerCase().includes(q);
      const matchOrg = e.organizer && e.organizer.toLowerCase().includes(q);
      const matchTags = e.tags && e.tags.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchVenue || matchOrg || matchTags;
    });
  }

  // Sort chronologically by startDate
  list.sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));

  return list;
}

const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const MONTHS_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function inferCategoryMeta(category = "") {
  const c = category.toLowerCase();
  if (c.includes("hack")) return { group: "hackathon", icon: "⚡", badge: "Hackathon" };
  if (c.includes("cultur") || c.includes("fest") && c.includes("cultur")) return { group: "cultural", icon: "🎸", badge: "Cultural" };
  if (c.includes("conf") || c.includes("academ") || c.includes("research")) return { group: "academic", icon: "📄", badge: "Academic" };
  if (c.includes("work") || c.includes("career") || c.includes("mentor")) return { group: "workshop", icon: "🎯", badge: "Workshop" };
  return { group: "technical", icon: "🚀", badge: "Campus Event" };
}

/**
 * Create and persist a new campus event
 */
function createEvent(universityId, payload = {}) {
  const university = getUniversityById(universityId);
  if (!university) {
    const err = new Error(`University with ID '${universityId}' not found.`);
    err.status = 404;
    throw err;
  }

  const title = (payload.title || "").trim();
  const category = (payload.category || "").trim();
  const startDate = (payload.startDate || "").trim();
  const endDate = (payload.endDate || "").trim();
  const venue = (payload.venue || "").trim();
  const description = (payload.description || "").trim();

  const errors = [];
  if (!title) errors.push("Event title is required.");
  if (!category) errors.push("Event category is required.");
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    errors.push("Valid start date (YYYY-MM-DD) is required.");
  }
  if (!venue) errors.push("Event venue is required.");
  if (!description) errors.push("Event description is required.");

  if (errors.length > 0) {
    const err = new Error("Event validation failed.");
    err.status = 400;
    err.details = errors;
    throw err;
  }

  const [yr, mo, dy] = startDate.split("-").map(Number);
  const monthIdx = Math.max(0, Math.min(11, (mo || 1) - 1));
  const monthFull = MONTHS_FULL[monthIdx];
  const monthShort = MONTHS_SHORT[monthIdx];
  const startDayStr = String(dy).padStart(2, "0");

  let dayLabel = startDayStr;
  let formattedDate = `${monthFull} ${startDayStr}, ${yr}`;
  if (endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate) && endDate > startDate) {
    const [eYr, eMo, eDy] = endDate.split("-").map(Number);
    const endDayStr = String(eDy).padStart(2, "0");
    if (eYr === yr && eMo === mo) {
      dayLabel = `${startDayStr}–${endDayStr}`;
      formattedDate = `${monthFull} ${startDayStr}–${endDayStr}, ${yr}`;
    } else {
      const eMonthFull = MONTHS_FULL[Math.max(0, Math.min(11, (eMo || 1) - 1))];
      formattedDate = `${monthFull} ${startDayStr} – ${eMonthFull} ${endDayStr}, ${eYr}`;
    }
  }

  const catMeta = inferCategoryMeta(category);
  const rawSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
  const id = `${rawSlug || "event"}-${Date.now().toString(36)}`;

  let tags = [];
  if (Array.isArray(payload.tags)) {
    tags = payload.tags.map((t) => String(t).trim()).filter(Boolean);
  } else if (typeof payload.tags === "string") {
    tags = payload.tags.split(",").map((t) => t.trim()).filter(Boolean);
  }
  if (tags.length === 0) tags = [category];

  const newEvent = {
    id,
    title,
    category,
    categoryGroup: (payload.categoryGroup || catMeta.group).trim().toLowerCase(),
    startDate,
    monthGroup: `${monthFull} ${yr}`,
    monthShort,
    dayLabel,
    date: formattedDate,
    time: (payload.time || "10:00 AM – 5:00 PM IST").trim(),
    registrationDeadline: (payload.registrationDeadline || "Open until filled").trim(),
    eligibility: (payload.eligibility || "Open to All Enrolled Students").trim(),
    mode: (payload.mode || "On-Campus").trim(),
    venue,
    organizer: (payload.organizer || university.shortName || "Student Council").trim(),
    description,
    status: (payload.status || "Registration Open").trim(),
    badge: (payload.badge || catMeta.badge).trim(),
    icon: (payload.icon || catMeta.icon).trim(),
    prizes: (payload.prizes || "Certificates & Merit Awards").trim(),
    tags,
    coordinator: (payload.coordinator || "Campus Events Committee").trim()
  };

  eventsCache.push(newEvent);
  eventsCache.sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));

  fs.writeFileSync(EVENTS_FILE, JSON.stringify(eventsCache, null, 2), "utf-8");

  return newEvent;
}

/**
 * Delete an event by ID (supports cleanup)
 */
function deleteEvent(universityId, eventId) {
  const university = getUniversityById(universityId);
  if (!university) {
    const err = new Error(`University with ID '${universityId}' not found.`);
    err.status = 404;
    throw err;
  }

  const idx = eventsCache.findIndex((e) => e.id === eventId);
  if (idx === -1) {
    const err = new Error(`Event with ID '${eventId}' not found.`);
    err.status = 404;
    throw err;
  }

  const [removed] = eventsCache.splice(idx, 1);
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(eventsCache, null, 2), "utf-8");
  return removed;
}

/**
 * Identify & validate student
 */
function identifyStudent({ name, studentId, rollNo, enrollmentNo, registrationNo, universityId, department, semester, degree } = {}) {
  const effectiveId = (studentId || rollNo || enrollmentNo || registrationNo || "").trim();
  const studentName = (name || "").trim();
  const uniId = (universityId || "").trim();
  const dept = (department || "").trim();
  const sem = (semester || "1st Semester").trim();
  const deg = (degree || "B.Tech").trim();

  const errors = [];
  if (!studentName) errors.push("Student name is required.");
  if (!effectiveId) errors.push("Student ID or Roll Number is required.");
  if (!uniId) errors.push("University selection is required.");

  const university = getUniversityById(uniId);
  if (uniId && !university) {
    errors.push(`University with ID '${uniId}' does not exist.`);
  }

  if (errors.length > 0) {
    const err = new Error("Student identification validation failed.");
    err.status = 400;
    err.details = errors;
    throw err;
  }

  // Cross-reference with UEM Section B official roster if UEM is selected
  let rosterData = null;
  if (uniId.toLowerCase() === "uem" && uemStudentsCache.length > 0) {
    const effectiveIdLower = effectiveId.toLowerCase();
    const studentNameLower = studentName.toLowerCase();

    rosterData = uemStudentsCache.find((s) => {
      const matchRoll = s.rollNo.toString() === effectiveId;
      const matchEnroll = s.enrollmentNo && s.enrollmentNo.toLowerCase() === effectiveIdLower;
      const matchReg = s.registrationNo && s.registrationNo.toLowerCase().includes(effectiveIdLower);
      const matchName = s.name && s.name.toLowerCase() === studentNameLower;
      return (matchRoll || matchEnroll || matchReg) && matchName;
    }) || uemStudentsCache.find((s) => {
      const matchRoll = s.rollNo.toString() === effectiveId;
      const matchEnroll = s.enrollmentNo && s.enrollmentNo.toLowerCase() === effectiveIdLower;
      const matchReg = s.registrationNo && s.registrationNo.toLowerCase().includes(effectiveIdLower);
      return matchRoll || matchEnroll || matchReg;
    }) || uemStudentsCache.find((s) => {
      return s.name && s.name.toLowerCase() === studentNameLower;
    });
  }

  // Generate session token
  const token = `uah_sess_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;

  const studentProfile = {
    name: (rosterData && rosterData.name) || studentName,
    studentId: (rosterData && rosterData.enrollmentNo) || effectiveId,
    rollNo: (rosterData && rosterData.rollNo) || (parseInt(effectiveId, 10) || null),
    section: (rosterData && rosterData.section) || "B",
    enrollmentNo: (rosterData && rosterData.enrollmentNo) || effectiveId,
    registrationNo: (rosterData && rosterData.registrationNo) || null,
    degree: (rosterData && rosterData.degree) || deg,
    department: (rosterData && rosterData.department) || dept || (university.departments && university.departments[0]) || "Computer Science",
    semester: sem,
    session: (rosterData && rosterData.session) || "2025-26",
    isRosterVerified: Boolean(rosterData),
    verifiedRoster: Boolean(rosterData),
    university: {
      id: university.id,
      name: university.name,
      shortName: university.shortName,
      status: university.status,
      location: university.location,
      type: university.type
    },
    identifiedAt: new Date().toISOString()
  };

  return {
    token,
    student: studentProfile
  };
}

/**
 * Generate fallback academic data for any university/department/semester
 */
function generateFallbackAcademicData(university, department, semester) {
  const deptName = department || (university.departments && university.departments[0]) || "Computer Science";
  const semName = semester || "1st Semester";

  return {
    courses: [
      {
        code: `${deptName.substring(0, 3).toUpperCase()}101`,
        name: `Foundations of ${deptName}`,
        category: "Core Engineering",
        credits: 4,
        lectureHours: 48,
        prerequisite: "Higher Secondary Mathematics & Science",
        instructor: "Senior Department Faculty",
        icon: "📘",
        image: "assets/courses/1st-year-c.png",
        description: `Comprehensive core concepts in ${deptName}, analytical problem formulation, and experimental lab modules.`
      },
      {
        code: "MATH101",
        name: "Advanced Applied Mathematics",
        category: "Basic Science",
        credits: 4,
        lectureHours: 48,
        prerequisite: "Calculus & Linear Algebra",
        instructor: "Prof. (Dr.) Department of Mathematics",
        icon: "Σ",
        image: "assets/courses/1st-year-math.png",
        description: "Differential equations, Fourier transforms, numerical methods, and vector spaces for engineering applications."
      },
      {
        code: "COMP102",
        name: "Computational Thinking & Programming",
        category: "Engineering Science",
        credits: 3,
        lectureHours: 42,
        prerequisite: "Basic Logic",
        instructor: "Computer Centre Faculty",
        icon: "🐍",
        image: "assets/courses/1st-year-python.png",
        description: "Modern algorithmic problem solving, procedural abstractions, and data structure implementations."
      },
      {
        code: "ENG103",
        name: "Professional Communication & Ethics",
        category: "Humanities",
        credits: 2,
        lectureHours: 28,
        prerequisite: "None",
        instructor: "Humanities & Social Sciences Dept",
        icon: "📊",
        image: "assets/courses/2nd-year-professional-presentation.png",
        description: "Technical writing, team collaboration, engineering ethics, and presentation effectiveness."
      }
    ],
    timetable: {
      periods: [
        { id: "1st", label: "1st", time: "9:00–10:00" },
        { id: "2nd", label: "2nd", time: "10:00–11:00" },
        { id: "3rd", label: "3rd", time: "11:15–12:15" },
        { id: "break", label: "BREAK", time: "12:15–13:15" },
        { id: "4th", label: "4th", time: "13:15–14:15" },
        { id: "5th", label: "5th", time: "14:15–15:15" },
        { id: "6th", label: "6th", time: "15:30–17:00" }
      ],
      routine: {
        Monday: [
          { period: "1st", time: "9:00–10:00", subject: `Foundations of ${deptName}`, faculty: "Dept Faculty", room: "LT-1", type: "theory" },
          { period: "2nd", time: "10:00–11:00", subject: "Advanced Applied Mathematics", faculty: "Math Dept", room: "LT-1", type: "theory" },
          { period: "3rd", time: "11:15–12:15", subject: "Computational Thinking", faculty: "CS Dept", room: "LT-1", type: "theory" },
          { period: "BREAK", time: "12:15–13:15", subject: "Lunch Break", faculty: "", room: "", type: "break" },
          { period: "4th", time: "13:15–14:15", subject: `${deptName} Laboratory`, faculty: "Lab Instructors", room: "Lab A", type: "lab" },
          { period: "5th", time: "14:15–15:15", subject: `${deptName} Laboratory`, faculty: "Lab Instructors", room: "Lab A", type: "lab" },
          { period: "6th", time: "15:30–17:00", subject: "Self-Study / Library Session", faculty: "", room: "Library", type: "special" }
        ],
        Tuesday: [
          { period: "1st", time: "9:00–10:00", subject: "Advanced Applied Mathematics", faculty: "Math Dept", room: "LT-1", type: "theory" },
          { period: "2nd", time: "10:00–11:00", subject: `Foundations of ${deptName}`, faculty: "Dept Faculty", room: "LT-1", type: "theory" },
          { period: "3rd", time: "11:15–12:15", subject: "Professional Communication", faculty: "HSS Dept", room: "LT-1", type: "theory" },
          { period: "BREAK", time: "12:15–13:15", subject: "Lunch Break", faculty: "", room: "", type: "break" },
          { period: "4th", time: "13:15–14:15", subject: "Computational Lab", faculty: "CS Dept", room: "CC-1", type: "lab" },
          { period: "5th", time: "14:15–15:15", subject: "Computational Lab", faculty: "CS Dept", room: "CC-1", type: "lab" },
          { period: "6th", time: "15:30–17:00", subject: "Seminar & Tutorial", faculty: "Dept Mentors", room: "Seminar Hall", type: "special" }
        ],
        Wednesday: [
          { period: "1st", time: "9:00–10:00", subject: `Foundations of ${deptName}`, faculty: "Dept Faculty", room: "LT-1", type: "theory" },
          { period: "2nd", time: "10:00–11:00", subject: "Advanced Applied Mathematics", faculty: "Math Dept", room: "LT-1", type: "theory" },
          { period: "3rd", time: "11:15–12:15", subject: "Computational Thinking", faculty: "CS Dept", room: "LT-1", type: "theory" },
          { period: "BREAK", time: "12:15–13:15", subject: "Lunch Break", faculty: "", room: "", type: "break" },
          { period: "4th", time: "13:15–14:15", subject: "Technical Discussion & Mentorship", faculty: "Faculty Mentors", room: "Room 102", type: "special" },
          { period: "5th", time: "14:15–15:15", subject: "Professional Communication Lab", faculty: "HSS Dept", room: "Lang Lab", type: "lab" },
          { period: "6th", time: "15:30–17:00", subject: "Sports & Extra Academic", faculty: "", room: "Grounds", type: "special" }
        ],
        Thursday: [
          { period: "1st", time: "9:00–10:00", subject: "Computational Thinking", faculty: "CS Dept", room: "LT-1", type: "theory" },
          { period: "2nd", time: "10:00–11:00", subject: `Foundations of ${deptName}`, faculty: "Dept Faculty", room: "LT-1", type: "theory" },
          { period: "3rd", time: "11:15–12:15", subject: "Advanced Applied Mathematics", faculty: "Math Dept", room: "LT-1", type: "theory" },
          { period: "BREAK", time: "12:15–13:15", subject: "Lunch Break", faculty: "", room: "", type: "break" },
          { period: "4th", time: "13:15–14:15", subject: `${deptName} Hardware/Simulation Lab`, faculty: "Lab Instructors", room: "Lab B", type: "lab" },
          { period: "5th", time: "14:15–15:15", subject: `${deptName} Hardware/Simulation Lab`, faculty: "Lab Instructors", room: "Lab B", type: "lab" },
          { period: "6th", time: "15:30–17:00", subject: "Innovation & Project Hours", faculty: "Mentors", room: "Makerspace", type: "special" }
        ],
        Friday: [
          { period: "1st", time: "9:00–10:00", subject: "Advanced Applied Mathematics", faculty: "Math Dept", room: "LT-1", type: "theory" },
          { period: "2nd", time: "10:00–11:00", subject: `Foundations of ${deptName}`, faculty: "Dept Faculty", room: "LT-1", type: "theory" },
          { period: "3rd", time: "11:15–12:15", subject: "Professional Ethics & Presentation", faculty: "HSS Dept", room: "LT-1", type: "theory" },
          { period: "BREAK", time: "12:15–13:15", subject: "Lunch Break", faculty: "", room: "", type: "break" },
          { period: "4th", time: "13:15–14:15", subject: "Guest Lecture / Industry Webinar", faculty: "Guest Speakers", room: "Auditorium", type: "special" },
          { period: "5th", time: "14:15–15:15", subject: "Weekly Quiz & Continuous Evaluation", faculty: "Course Faculty", room: "LT-1", type: "theory" },
          { period: "6th", time: "15:30–17:00", subject: "Mentorship & Academic Review", faculty: "Faculty Mentors", room: "Faculty Block", type: "special" }
        ]
      }
    },
    resources: [
      {
        id: "res-gen-1",
        title: `${university.shortName || university.name} — ${deptName} Curriculum & Syllabus Guide`,
        type: "Curriculum PDF",
        category: "Syllabus",
        description: `Official course syllabus, program educational objectives (PEOs), and credit distribution for ${semName}.`,
        url: "#",
        updated: "2026-08-20"
      },
      {
        id: "res-gen-2",
        title: "Official Academic Calendar (2026–2027 Academic Session)",
        type: "Calendar",
        category: "Academic",
        description: "Official schedule of term dates, examination weeks, institutional holidays, and evaluation windows.",
        url: "#",
        updated: "2026-07-28"
      },
      {
        id: "res-gen-3",
        title: "Institutional Digital Library & Research Publications Gateway",
        type: "Portal",
        category: "Library",
        description: "Access institutional repository, national digital library subscriptions, journals, and e-learning resources.",
        url: university.website || "#",
        updated: "2026-09-01"
      },
      {
        id: "res-gen-4",
        title: "Faculty Advisor & Student Mentorship Directory",
        type: "Directory",
        category: "Mentorship",
        description: "Designated faculty counselors, grievance committee contacts, and office consultation hours.",
        url: "#",
        updated: "2026-08-15"
      }
    ],
    events: getEvents({ universityId: university.id })
  };
}

/**
 * Get academic data for university, department and semester
 */
function getAcademicData(universityId, department, semester) {
  const university = getUniversityById(universityId);
  if (!university) {
    const err = new Error(`University with ID '${universityId}' not found.`);
    err.status = 404;
    throw err;
  }

  const uniKey = university.id.toLowerCase();
  const deptKey = department ? department.trim() : "Computer Science";
  const semKey = semester ? semester.trim() : "1st Semester";

  const events = getEvents({ universityId });
  const students = (uniKey === "uem") ? getStudents({ universityId: "uem" }) : [];

  // Check if seeded dataset has specific data
  if (academicDataCache[uniKey]) {
    const availableDepts = Object.keys(academicDataCache[uniKey]);
    const matchedDept = availableDepts.find((d) =>
      d.toLowerCase().includes(deptKey.toLowerCase()) || deptKey.toLowerCase().includes(d.toLowerCase())
    ) || availableDepts[0];

    if (matchedDept && academicDataCache[uniKey][matchedDept]) {
      const semMap = academicDataCache[uniKey][matchedDept];
      const availableSems = Object.keys(semMap);
      const matchedSem = availableSems.find((s) =>
        s.toLowerCase().includes(semKey.toLowerCase()) || semKey.toLowerCase().includes(s.toLowerCase())
      ) || availableSems[0];

      if (matchedSem && semMap[matchedSem]) {
        return {
          universityId: university.id,
          universityName: university.name,
          department: matchedDept,
          semester: matchedSem,
          data: {
            ...semMap[matchedSem],
            events,
            students: {
              total: students.length,
              section: "B",
              session: "2025-26",
              list: students
            }
          }
        };
      }
    }
  }

  // Provide realistic generated academic data for universities without custom overrides
  const fallback = generateFallbackAcademicData(university, deptKey, semKey);
  return {
    universityId: university.id,
    universityName: university.name,
    department: deptKey,
    semester: semKey,
    data: fallback
  };
}

module.exports = {
  getUniversities,
  getUniversityById,
  identifyStudent,
  getAcademicData,
  getStudents,
  getEvents,
  createEvent,
  deleteEvent,
  loadData
};
