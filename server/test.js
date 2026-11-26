const http = require("http");
const app = require("./app");

const PORT = 3099;
let server;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "127.0.0.1",
      port: PORT,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json"
      }
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on("error", (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("--- Starting API Integration Tests ---");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. GET /api/health
    const health = await request("GET", "/api/health");
    assert(health.status === 200 && health.body.status === "ok", "GET /api/health returns 200 ok");

    // 2. GET /api/universities
    const allUnis = await request("GET", "/api/universities");
    assert(allUnis.status === 200 && allUnis.body.success && allUnis.body.count >= 8, `GET /api/universities returns ${allUnis.body.count} universities`);

    // 3. GET /api/universities?search=kharagpur
    const searchUni = await request("GET", "/api/universities?search=kharagpur");
    assert(searchUni.status === 200 && searchUni.body.count === 1 && searchUni.body.data[0].id === "iit-kharagpur", "GET /api/universities?search=kharagpur finds IIT Kharagpur");

    // 4. GET /api/universities?state=Maharashtra
    const stateUni = await request("GET", "/api/universities?state=Maharashtra");
    assert(stateUni.status === 200 && stateUni.body.data.every(u => u.state.toLowerCase() === "maharashtra"), "GET /api/universities?state=Maharashtra filters correctly");

    // 5. GET /api/universities?type=Central
    const typeUni = await request("GET", "/api/universities?type=Central");
    assert(typeUni.status === 200 && typeUni.body.count >= 1, "GET /api/universities?type=Central filters central universities");

    // 6. GET /api/universities/:id (valid)
    const uniDetail = await request("GET", "/api/universities/uem");
    assert(uniDetail.status === 200 && uniDetail.body.data.id === "uem", "GET /api/universities/uem returns UEM details");

    // 7. GET /api/universities/:id (invalid 404)
    const notFoundUni = await request("GET", "/api/universities/unknown-uni-xyz");
    assert(notFoundUni.status === 404 && notFoundUni.body.success === false, "GET /api/universities/:id returns 404 for unknown ID");

    // 8. POST /api/student/identify (valid)
    const studentIdentify = await request("POST", "/api/student/identify", {
      name: "Aarav Sharma",
      studentId: "UEM2026CS1042",
      universityId: "uem",
      department: "Computer Science",
      semester: "1st Semester",
      degree: "B.Tech"
    });
    assert(
      studentIdentify.status === 200 &&
      studentIdentify.body.success &&
      studentIdentify.body.token.startsWith("uah_sess_") &&
      studentIdentify.body.student.name === "Aarav Sharma",
      "POST /api/student/identify validates and returns token and profile"
    );

    // 9. POST /api/student/identify (missing required fields -> 400 Bad Request)
    const invalidStudent = await request("POST", "/api/student/identify", {
      name: "",
      studentId: ""
    });
    assert(
      invalidStudent.status === 400 &&
      invalidStudent.body.success === false &&
      invalidStudent.body.error.details.length > 0,
      "POST /api/student/identify returns 400 with structured validation details"
    );

    // 10. GET /api/universities/:id/academic-data
    const academic = await request("GET", "/api/universities/uem/academic-data?department=Computer%20Science&semester=1st%20Semester");
    assert(
      academic.status === 200 &&
      academic.body.success &&
      academic.body.data.courses.length > 0 &&
      academic.body.data.timetable.routine.Monday.length > 0 &&
      academic.body.data.resources.length > 0 &&
      academic.body.data.events.length >= 6 &&
      academic.body.data.students.total === 60,
      "GET /api/universities/:id/academic-data returns courses, timetable, resources, events, and student roster summary"
    );

    // 11. GET /api/universities/:id/students (All 60 students)
    const studentsRes = await request("GET", "/api/universities/uem/students");
    assert(
      studentsRes.status === 200 &&
      studentsRes.body.success &&
      studentsRes.body.count === 60 &&
      studentsRes.body.data[0].rollNo === 1 &&
      studentsRes.body.data[0].section === "B",
      "GET /api/universities/uem/students returns all 60 students with section B details"
    );

    // 12. GET /api/universities/:id/students?rollNo=1 & search filter
    const roll1Res = await request("GET", "/api/universities/uem/students?rollNo=1");
    assert(
      roll1Res.status === 200 &&
      roll1Res.body.count === 1 &&
      roll1Res.body.data[0].name === "NITISH KUMAR" &&
      roll1Res.body.data[0].enrollmentNo === "12025002034137",
      "GET /api/universities/uem/students?rollNo=1 filters exactly Roll 1 Nitish Kumar"
    );

    // 13. POST /api/student/identify cross-referencing roster student
    const rosterStudentIdentify = await request("POST", "/api/student/identify", {
      name: "NITISH KUMAR",
      studentId: "12025002034137",
      universityId: "uem",
      department: "Computer Science",
      semester: "1st Semester",
      degree: "B.Tech"
    });
    assert(
      rosterStudentIdentify.status === 200 &&
      rosterStudentIdentify.body.student.verifiedRoster === true &&
      rosterStudentIdentify.body.student.rollNo === 1 &&
      rosterStudentIdentify.body.student.section === "B",
      "POST /api/student/identify cross-references and verifies student against official UEM roster"
    );

    // 14. GET /api/universities/:id/events
    const eventsRes = await request("GET", "/api/universities/uem/events");
    assert(
      eventsRes.status === 200 &&
      eventsRes.body.success &&
      eventsRes.body.count >= 6 &&
      eventsRes.body.data.some(e => e.id === "ureckon-2026"),
      "GET /api/universities/uem/events returns campus events including URECKON 2026"
    );

    // 15. GET /api/universities/:id/events?category=hackathon
    const hackathonRes = await request("GET", "/api/universities/uem/events?category=hackathon");
    assert(
      hackathonRes.status === 200 &&
      hackathonRes.body.data.length >= 1 &&
      hackathonRes.body.data[0].id === "campus-codesprint",
      "GET /api/universities/uem/events?category=hackathon filters hackathons correctly"
    );

    // 16. GET /api/universities/uem/events chronological order & status filter
    const openEventsRes = await request("GET", "/api/universities/uem/events?status=open");
    assert(
      openEventsRes.status === 200 &&
      openEventsRes.body.data.length >= 3 &&
      eventsRes.body.data[0].id === "campus-codesprint",
      "GET /api/universities/uem/events sorts chronologically and filters by status=open"
    );

    // 17. GET /api/universities/uem/academic-data for 2nd Year / 3rd Semester (IoT 2B timetable)
    const sem3Acad = await request("GET", "/api/universities/uem/academic-data?department=Computer%20Science&semester=3rd%20Semester");
    assert(
      sem3Acad.status === 200 &&
      sem3Acad.body.data.timetable.batch.includes("IoT 2B") &&
      sem3Acad.body.data.timetable.periods.length === 10 &&
      sem3Acad.body.data.timetable.routine.Monday[0].subject === "Technical Skill Development" &&
      sem3Acad.body.data.timetable.routine.Tuesday[8].faculty === "SGH, AYC, SCS" &&
      sem3Acad.body.data.timetable.routine.Wednesday[0].subject === "Analog Electronic Circuits Laboratory" &&
      sem3Acad.body.data.timetable.routine.Thursday[0].subject === "IT Workshop Laboratory" &&
      sem3Acad.body.data.timetable.routine.Friday[6].subject === "Mathematics III",
      "GET /api/universities/uem/academic-data (3rd Semester) returns exact IoT 2B 2nd Year timetable"
    );

    // 18. GET /api/universities/uem/academic-data Sem 3 full Curriculum & Syllabi
    const sem3Courses = sem3Acad.body.data.courses || [];
    const sem3Curr = sem3Acad.body.data.curriculumSummary;
    assert(
      sem3Curr &&
      sem3Curr.totals.credits === 26 &&
      sem3Curr.sections.length === 3 &&
      sem3Courses.length === 7 &&
      sem3Courses.every(c => c.syllabus && Array.isArray(c.syllabus.modules) && c.syllabus.modules.length >= 3),
      "GET /api/universities/uem/academic-data (3rd Semester) returns 26-credit Curriculum Matrix & full modules for all 7 courses"
    );

    // 19. POST /api/universities/:id/events (validation failure 400 + create 201 + cleanup DELETE)
    const badEvent = await request("POST", "/api/universities/uem/events", { title: "" });
    assert(badEvent.status === 400 && badEvent.body.success === false, "POST /api/universities/:id/events returns 400 on missing fields");

    const newEventRes = await request("POST", "/api/universities/uem/events", {
      title: "IoT & Edge Robotics Buildathon",
      category: "Hackathon",
      startDate: "2026-06-15",
      venue: "B3 Central Atrium",
      description: "24-hour hardware & IoT edge prototype competition.",
      tags: "IoT, Robotics, Edge AI"
    });
    const createdId = newEventRes.body && newEventRes.body.data && newEventRes.body.data.id;
    let cleanupOk = false;
    if (createdId) {
      const delRes = await request("DELETE", `/api/universities/uem/events/${createdId}`);
      cleanupOk = delRes.status === 200 && delRes.body.success === true;
    }
    assert(
      newEventRes.status === 201 &&
      newEventRes.body.success &&
      newEventRes.body.data.monthShort === "JUN" &&
      newEventRes.body.data.monthGroup === "June 2026" &&
      cleanupOk,
      "POST /api/universities/:id/events creates persisted event with month metadata and cleans up"
    );

    // 20. GET /api/universities/:id/academic-data (404 for non-existent uni)
    const badAcad = await request("GET", "/api/universities/non-existent/academic-data");
    assert(badAcad.status === 404 && badAcad.body.success === false, "GET /api/universities/:id/academic-data returns 404 for invalid university");

    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} passed, ${failed} failed`);
    console.log(`========================================`);

  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

server = app.listen(PORT, () => {
  runTests();
});
