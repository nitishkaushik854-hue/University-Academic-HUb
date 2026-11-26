const http = require("http");
const app = require("./server/app");

const PORT = 3000;

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${path}`, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    }).on("error", reject);
  });
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(`http://localhost:${PORT}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: JSON.parse(data)
        });
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function verify() {
  console.log("Starting End-to-End Server & Route Verification...\n");
  let passed = 0;
  let failed = 0;

  function check(condition, desc) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // 1. Root route
  const root = await get("/");
  check(root.statusCode === 200 && root.data.includes("University Academic Hub"), "GET / serves index.html with 200 OK");
  check(root.data.includes('id="platform-intro"'), 'index.html contains id="platform-intro" for smooth scrolling');

  // 2. /university route
  const uniPage = await get("/university");
  check(uniPage.statusCode === 200 && uniPage.data.includes("University Directory &amp; Gateway"), "GET /university serves university.html without 404 or routing errors");
  check(uniPage.data.includes('id="dashboard-panel"'), "university.html includes dynamic student dashboard panel");
  check(uniPage.data.includes('id="uni-filter-bar"'), "university.html includes search & filter controls");

  // 3. /courses and /timetable clean routes
  const coursesPage = await get("/courses");
  check(coursesPage.statusCode === 200 && coursesPage.data.includes("Courses &amp; Syllabus"), "GET /courses serves courses.html cleanly");
  const timetablePage = await get("/timetable");
  check(timetablePage.statusCode === 200 && timetablePage.data.includes("Class Routine"), "GET /timetable serves timetable.html cleanly");

  // 3b. /uem-home route & new sections (Events & Student Roster)
  const uemHomePage = await get("/uem-home");
  check(uemHomePage.statusCode === 200 && uemHomePage.data.includes('id="events"'), "GET /uem-home includes #events section with event cards");
  check(uemHomePage.data.includes('id="students-roster"'), "GET /uem-home includes #students-roster section with official class directory");
  check(uniPage.data.includes('id="tab-events-btn"'), "university.html includes #tab-events-btn in student dashboard");
  check(uniPage.data.includes('id="tab-roster-btn"'), "university.html includes #tab-roster-btn in student dashboard");

  // 4. Video and asset paths
  const videoHead = await new Promise((resolve) => {
    const req = http.request(`http://localhost:${PORT}/ministry-hero-video.mp4`, { method: "HEAD" }, (res) => {
      resolve({ statusCode: res.statusCode, headers: res.headers });
    });
    req.end();
  });
  check(videoHead.statusCode === 200 && videoHead.headers["content-type"] === "video/mp4", "GET /ministry-hero-video.mp4 serves video/mp4 with 200 OK");

  const emblem = await get("/assets/global/emblem-white.png");
  check(emblem.statusCode === 200, "GET /assets/global/emblem-white.png serves emblem asset with 200 OK");

  // 5. REST API: GET /api/universities
  const unis = await get("/api/universities");
  const unisJson = JSON.parse(unis.data);
  check(unis.statusCode === 200 && unisJson.success && unisJson.count >= 8, `GET /api/universities returns ${unisJson.count} Indian universities`);

  // 6. REST API: Search filter
  const searchFilter = await get("/api/universities?search=bombay");
  const searchJson = JSON.parse(searchFilter.data);
  check(searchFilter.statusCode === 200 && searchJson.count === 1 && searchJson.data[0].id === "iit-bombay", "GET /api/universities?search=bombay filters by name/city");

  // 7. REST API: State filter
  const stateFilter = await get("/api/universities?state=West%20Bengal");
  const stateJson = JSON.parse(stateFilter.data);
  check(stateFilter.statusCode === 200 && stateJson.count >= 3, `GET /api/universities?state=West Bengal returns ${stateJson.count} institutions in West Bengal`);

  // 8. REST API: Type filter
  const typeFilter = await get("/api/universities?type=National");
  const typeJson = JSON.parse(typeFilter.data);
  check(typeFilter.statusCode === 200 && typeJson.count >= 2, `GET /api/universities?type=National returns Institutes of National Importance`);

  // 9. REST API: GET /api/universities/:id
  const uem = await get("/api/universities/uem");
  const uemJson = JSON.parse(uem.data);
  check(uem.statusCode === 200 && uemJson.data.id === "uem", "GET /api/universities/:id returns specific university details");

  // 10. REST API: 404 for unknown university
  const unknownUni = await get("/api/universities/unknown-inst");
  const unknownJson = JSON.parse(unknownUni.data);
  check(unknownUni.statusCode === 404 && unknownJson.success === false && unknownJson.error.code === 404, "GET /api/universities/:id returns structured 404 JSON for unknown ID");

  // 11. REST API: POST /api/student/identify (valid)
  const ident = await post("/api/student/identify", {
    name: "Aarav Sharma",
    studentId: "UEM2026CS1042",
    universityId: "uem",
    department: "Computer Science",
    semester: "1st Semester",
    degree: "B.Tech"
  });
  check(ident.statusCode === 200 && ident.data.success && ident.data.token && ident.data.student.name === "Aarav Sharma", "POST /api/student/identify validates and returns session token and student profile");

  // 12. REST API: POST /api/student/identify (validation failure 400)
  const badIdent = await post("/api/student/identify", { name: "", studentId: "" });
  check(badIdent.statusCode === 400 && badIdent.data.success === false && badIdent.data.error.code === 400, "POST /api/student/identify returns structured 400 JSON when fields are missing");

  // 13. REST API: GET /api/universities/:id/academic-data
  const acad = await get("/api/universities/uem/academic-data?department=Computer%20Science&semester=1st%20Semester");
  const acadJson = JSON.parse(acad.data);
  check(
    acad.statusCode === 200 &&
    acadJson.success &&
    acadJson.data.courses.length >= 4 &&
    acadJson.data.timetable.routine.Monday.length >= 5 &&
    acadJson.data.resources.length >= 3,
    "GET /api/universities/:id/academic-data returns scoped courses, timetable, and resources"
  );

  // 14. REST API: GET /api/universities/:id/students (60 students)
  const studentsReq = await get("/api/universities/uem/students");
  const studentsJson = JSON.parse(studentsReq.data);
  check(
    studentsReq.statusCode === 200 &&
    studentsJson.success &&
    studentsJson.count === 60 &&
    studentsJson.data[0].rollNo === 1 &&
    studentsJson.data[0].section === "B",
    "GET /api/universities/uem/students returns all 60 registered students for Section B"
  );

  // 15. REST API: GET /api/universities/:id/events (6 events ordered chronologically)
  const eventsReq = await get("/api/universities/uem/events");
  const eventsJson = JSON.parse(eventsReq.data);
  check(
    eventsReq.statusCode === 200 &&
    eventsJson.success &&
    eventsJson.count >= 6 &&
    eventsJson.data[0].id === "campus-codesprint" &&
    Boolean(eventsJson.data[0].monthGroup),
    "GET /api/universities/uem/events returns organized campus events sorted chronologically"
  );

  // 15b. REST API: 2nd Year 3rd Semester IoT 2B timetable
  const acad3 = await get("/api/universities/uem/academic-data?department=Computer%20Science&semester=3rd%20Semester");
  const acad3Json = JSON.parse(acad3.data);
  check(
    acad3.statusCode === 200 &&
    acad3Json.success &&
    acad3Json.data.timetable.batch &&
    acad3Json.data.timetable.batch.includes("IoT 2B") &&
    acad3Json.data.timetable.routine.Monday.length === 10 &&
    acad3Json.data.timetable.routine.Friday[6].subject === "Mathematics III",
    "GET /api/universities/uem/academic-data (3rd Semester) returns complete IoT 2B 2nd Year schedule"
  );

  // 15c. Shared CSS & JS assets
  const evCss = await get("/events-roster.css");
  const evJs = await get("/events-ui.js");
  const sylCss = await get("/syllabus-ui.css");
  const sylJs = await get("/syllabus-ui.js");
  check(evCss.statusCode === 200 && evJs.statusCode === 200 && sylCss.statusCode === 200 && sylJs.statusCode === 200, "Shared events-roster and syllabus-ui assets are served cleanly");

  // 15d. Sem 3 curriculum summary and detailed syllabi
  check(
    acad3Json.data.curriculumSummary &&
    acad3Json.data.curriculumSummary.totals.credits === 26 &&
    acad3Json.data.courses.length === 7 &&
    acad3Json.data.courses.some(c => c.code === "ESC301" && c.syllabus.modules.length === 4) &&
    acad3Json.data.courses.some(c => c.code === "PCCCS302" && c.syllabus.modules.length === 6),
    "3rd Semester includes 26-credit Curriculum Summary and full module syllabi for ESC301, ESC302, PCC301, PCCCS302, BSM301, HSMCS301"
  );

  // 16. REST API: 404 for unmatched /api route
  const badApi = await get("/api/invalid-endpoint-url");
  const badApiJson = JSON.parse(badApi.data);
  check(badApi.statusCode === 404 && badApiJson.success === false, "Unmatched /api/* routes return structured 404 JSON");

  console.log(`\n========================================`);
  console.log(`Verification Summary: ${passed} passed, ${failed} failed`);
  console.log(`========================================`);

  return failed === 0;
}

const server = app.listen(PORT, async () => {
  try {
    const success = await verify();
    server.close();
    process.exit(success ? 0 : 1);
  } catch (err) {
    console.error("Verification crashed:", err);
    server.close();
    process.exit(1);
  }
});
