/**
 * Add Course Faculty Portal Logic
 */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const stepAuth = $("step-auth");
  const stepCourse = $("step-course");
  const stepSuccess = $("step-success");
  
  const authForm = $("auth-form");
  const courseForm = $("course-form");
  const authError = $("auth-error");
  const courseError = $("course-error");
  
  const fileInput = $("course-syllabus");
  const uploadText = $("upload-text");
  
  let base64Image = "";

  // ── AUTHENTICATION ─────────────────────────────────────────
  authForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("faculty-name").value.trim();
    const id = $("faculty-id").value.trim();

    if (!name || !id) {
      showError(authError, "Please enter both Name and ID.");
      return;
    }

    if (id.length < 4) {
      showError(authError, "Please enter a valid Faculty University ID.");
      return;
    }

    authError.style.display = "none";
    
    // Transition to step 2
    stepAuth.style.opacity = "0";
    setTimeout(() => {
      stepAuth.classList.add("disabled");
      stepCourse.classList.remove("disabled");
      stepCourse.style.opacity = "0";
      setTimeout(() => stepCourse.style.opacity = "1", 50);
    }, 400);
  });

  // ── FILE UPLOAD HANDLING ───────────────────────────────────
  fileInput.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "image/png") {
      showError(courseError, "Only PNG images are supported for the syllabus.");
      this.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit for local storage safely
      showError(courseError, "File size must be under 2MB for prototype limits.");
      this.value = "";
      return;
    }

    courseError.style.display = "none";
    uploadText.textContent = file.name;
    uploadText.parentElement.parentElement.classList.add("upload-success");

    const reader = new FileReader();
    reader.onload = function(event) {
      base64Image = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  // ── COURSE SUBMISSION ──────────────────────────────────────
  courseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const name = $("course-name").value.trim();
    const code = $("course-code").value.trim();
    const prof = $("course-prof").value.trim();
    const examDate = $("exam-date").value;
    const stream = $("target-stream").value;
    const year = $("target-year").value;
    const credit = $("course-credit").value.trim();
    const hours = $("course-hours").value.trim();

    if (!name || !code || !prof || !examDate || !stream || !year || !credit || !hours) {
      showError(courseError, "Please fill in all course details.");
      return;
    }

    if (!base64Image) {
      showError(courseError, "Please upload a PNG syllabus image.");
      return;
    }

    courseError.style.display = "none";

    const newCourse = {
      id: "course-" + Date.now(),
      name: name,
      code: code,
      professor: prof,
      examDate: examDate,
      stream: stream,
      year: year,
      credit: credit,
      lectureHours: hours,
      image: base64Image,
      courseLevel: year + " B.Tech",
      semester: year === "1st Year" ? "1st Semester" : "3rd Semester",
      icon: "📘"
    };

    // Save to localStorage
    try {
      const stored = localStorage.getItem("customCourses");
      let courses = stored ? JSON.parse(stored) : [];
      courses.push(newCourse);
      localStorage.setItem("customCourses", JSON.stringify(courses));
    } catch(err) {
      console.error(err);
      showError(courseError, "Failed to save course. Storage might be full.");
      return;
    }

    // Render manage courses again
    renderManageCourses();

    // Transition to success step
    stepCourse.style.opacity = "0";
    setTimeout(() => {
      stepCourse.classList.add("disabled");
      stepSuccess.style.display = "block";
      setTimeout(() => stepSuccess.style.opacity = "1", 50);
    }, 400);

  });

  function showError(el, msg) {
    el.textContent = msg;
    el.style.display = "block";
  }

  // ── MANAGE COURSES ───────────────────────────────────────
  const manageSection = $("manage-section");
  const manageList = $("manage-course-list");

  function renderManageCourses() {
    manageSection.style.display = "block";
    
    let courses = [];
    try {
      const stored = localStorage.getItem("customCourses");
      if (stored) courses = JSON.parse(stored);
    } catch(e) {}

    manageList.innerHTML = "";
    
    if (courses.length === 0) {
      manageList.innerHTML = `<p class="no-courses-msg">No custom courses added yet.</p>`;
      return;
    }

    courses.forEach(course => {
      const item = document.createElement("div");
      item.className = "manage-course-item";
      
      item.innerHTML = `
        <div class="manage-course-info">
          <span class="manage-course-name">${course.name} <span style="color:var(--text-secondary); font-size:0.85em; font-weight:normal;">(${course.code})</span></span>
          <span class="manage-course-meta"><strong>Prof:</strong> ${course.professor} &nbsp;|&nbsp; <strong>Stream:</strong> ${course.stream} (${course.year})</span>
        </div>
        <button class="btn-danger disable-btn" data-id="${course.id}">Remove</button>
      `;

      manageList.appendChild(item);
    });

    // Attach listeners
    document.querySelectorAll(".disable-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idToRemove = e.target.getAttribute("data-id");
        removeCourse(idToRemove);
      });
    });
  }

  function removeCourse(id) {
    try {
      const stored = localStorage.getItem("customCourses");
      if (stored) {
        let courses = JSON.parse(stored);
        courses = courses.filter(c => c.id !== id);
        localStorage.setItem("customCourses", JSON.stringify(courses));
        renderManageCourses();
      }
    } catch(e) {
      console.error(e);
    }
  }

  // Bind renderManageCourses to run after successful auth
  const originalAuthSubmit = authForm.onsubmit;
  // We already have an event listener, so we'll just modify the auth event listener above. Wait, I'll just append it to auth form using a new event listener which is cleaner since it's an event target.
  authForm.addEventListener("submit", () => {
    // We can assume if auth passed, we show it. 
    // It will run after the original listener since it's added after.
    const name = $("faculty-name").value.trim();
    const id = $("faculty-id").value.trim();
    if (name && id.length >= 4) {
      renderManageCourses();
    }
  });

})();
