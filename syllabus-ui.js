/**
 * Shared Academic Syllabus & Curriculum Viewer (window.UAHSyllabus)
 * Used by both /university Student Dashboard Modal and /courses Syllabus Viewer.
 */
(function (global) {
  "use strict";

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderCourseSyllabus(containerEl, course) {
    if (!containerEl || !course) return;
    const syl = course.syllabus;

    if (!syl) {
      // Fallback for image-based syllabi (e.g. 1st Year)
      if (course.image) {
        containerEl.innerHTML = `
          <div style="text-align:center;padding:1rem;">
            <img src="${escapeHtml(course.image)}" alt="${escapeHtml(course.name)} Syllabus" class="syllabus-image" style="max-width:100%;height:auto;border-radius:12px;" />
          </div>
        `;
      } else {
        containerEl.innerHTML = `<div class="syl-doc-wrap"><p>Detailed module syllabus is not available for this course.</p></div>`;
      }
      return;
    }

    const codeDisplay = course.oldCode && course.oldCode !== course.code
      ? `${course.code} (Prev: ${course.oldCode})`
      : (course.code || "—");

    const creditsDisplay = course.labCredits
      ? `${course.credits} Theory + ${course.labCredits} Lab (${course.credits + course.labCredits} Total)`
      : `${course.credits} Credits`;

    const objectivesHtml = (syl.objectives || []).length
      ? `<div class="syl-panel-card">
          <h4 class="syl-section-heading">🎯 Course Objectives</h4>
          <ol class="syl-objectives-list">
            ${syl.objectives.map((o) => `<li>${escapeHtml(o)}</li>`).join("")}
          </ol>
        </div>`
      : "";

    const outcomesHtml = (syl.outcomes || []).length
      ? `<div class="syl-panel-card">
          <h4 class="syl-section-heading">✅ Course Outcomes</h4>
          <div class="syl-co-list">
            ${syl.outcomes.map((co) => `
              <div class="syl-co-item">
                <span class="syl-co-badge">${escapeHtml(co.code)}</span>
                <span>${escapeHtml(co.text)}</span>
              </div>
            `).join("")}
          </div>
        </div>`
      : "";

    const modulesHtml = (syl.modules || []).map((mod) => `
      <div class="syl-module-card">
        <div class="syl-module-head">
          <div class="syl-module-title-row">
            <span class="syl-module-num">Module ${escapeHtml(mod.number)}</span>
            <h5 class="syl-module-title">${escapeHtml(mod.title)}</h5>
          </div>
          ${mod.hours ? `<span class="syl-module-hours">${escapeHtml(mod.hours)} Lecture Hours</span>` : ""}
        </div>
        <p class="syl-module-topics">${escapeHtml(mod.topics)}</p>
        ${mod.textbookRef ? `<div class="syl-module-book">📖 Text Ref: ${escapeHtml(mod.textbookRef)}</div>` : ""}
        ${(mod.labAssignments && mod.labAssignments.length) ? `
          <div class="syl-lab-box">
            <div class="syl-lab-title">🧪 Corresponding Lab Assignments</div>
            <ul class="syl-lab-list">
              ${mod.labAssignments.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}
            </ul>
          </div>
        ` : ""}
      </div>
    `).join("");

    const textbooksHtml = (syl.textbooks && syl.textbooks.length)
      ? `<div class="syl-panel-card">
          <h4 class="syl-section-heading">📚 Textbooks</h4>
          <ol class="syl-books-list">
            ${syl.textbooks.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
          </ol>
        </div>`
      : "";

    const refBooksHtml = (syl.referenceBooks && syl.referenceBooks.length)
      ? `<div class="syl-panel-card">
          <h4 class="syl-section-heading">📖 Reference Books</h4>
          <ol class="syl-books-list">
            ${syl.referenceBooks.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
          </ol>
        </div>`
      : "";

    const linksHtml = (syl.externalLinks && syl.externalLinks.length)
      ? `<div class="syl-panel-card">
          <h4 class="syl-section-heading">🔗 Official Study &amp; MOOC Links</h4>
          <div class="syl-links-row">
            ${syl.externalLinks.map((lnk) => `
              <a class="syl-ext-link" href="${escapeHtml(lnk.url)}" target="_blank" rel="noopener noreferrer">
                <span>${escapeHtml(lnk.label)}</span>
                <span>↗</span>
              </a>
            `).join("")}
          </div>
        </div>`
      : "";

    containerEl.innerHTML = `
      <div class="syl-doc-wrap">
        <div class="syl-meta-banner">
          <div class="syl-meta-box">
            <span class="syl-meta-label">Course Code</span>
            <span class="syl-meta-val">${escapeHtml(codeDisplay)}</span>
          </div>
          ${course.labCode ? `
          <div class="syl-meta-box">
            <span class="syl-meta-label">Lab Code</span>
            <span class="syl-meta-val">${escapeHtml(course.labCode)}</span>
          </div>` : ""}
          <div class="syl-meta-box">
            <span class="syl-meta-label">Credits</span>
            <span class="syl-meta-val">${escapeHtml(creditsDisplay)}</span>
          </div>
          <div class="syl-meta-box">
            <span class="syl-meta-label">Hours / Week</span>
            <span class="syl-meta-val">${escapeHtml(course.hoursPerWeek || `${course.lectureHours} Hours Total`)}</span>
          </div>
          <div class="syl-meta-box">
            <span class="syl-meta-label">Lecture Hours</span>
            <span class="syl-meta-val">${escapeHtml(course.lectureHours)} Hrs</span>
          </div>
          <div class="syl-meta-box">
            <span class="syl-meta-label">Prerequisites</span>
            <span class="syl-meta-val" style="font-size:0.82rem;">${escapeHtml(course.prerequisite || "None")}</span>
          </div>
        </div>

        ${(objectivesHtml || outcomesHtml) ? `<div class="syl-obj-co-grid">${objectivesHtml}${outcomesHtml}</div>` : ""}

        <div>
          <h4 class="syl-section-heading">📑 Detailed Module-Wise Syllabus</h4>
          <div class="syl-modules-stack">${modulesHtml}</div>
        </div>

        ${(textbooksHtml || refBooksHtml) ? `<div class="syl-obj-co-grid">${textbooksHtml}${refBooksHtml}</div>` : ""}

        ${linksHtml}

        ${course.image ? `
          <div>
            <button type="button" class="syl-ref-sheet-toggle" data-toggle-img>🖼️ View Legacy Visual Summary Card</button>
            <div data-ref-img-box style="display:none;margin-top:0.85rem;text-align:center;">
              <img src="${escapeHtml(course.image)}" alt="${escapeHtml(course.name)} Quick Card" style="max-width:100%;height:auto;border-radius:12px;border:1px solid var(--syl-border);" />
            </div>
          </div>
        ` : ""}
      </div>
    `;

    const toggleBtn = containerEl.querySelector("[data-toggle-img]");
    const imgBox = containerEl.querySelector("[data-ref-img-box]");
    if (toggleBtn && imgBox) {
      toggleBtn.addEventListener("click", () => {
        const hidden = imgBox.style.display === "none";
        imgBox.style.display = hidden ? "block" : "none";
        toggleBtn.textContent = hidden ? "Hide Quick Summary Card" : "🖼️ View Legacy Visual Summary Card";
      });
    }
  }

  function renderCurriculumMatrix(containerEl, summary) {
    if (!containerEl || !summary) return;

    const sectionsHtml = (summary.sections || []).map((sec) => {
      const rows = (sec.items || []).map((it) => `
        <tr>
          <td>${escapeHtml(it.sl)}</td>
          <td>${escapeHtml(it.type)}</td>
          <td><code>${escapeHtml(it.code)}</code></td>
          <td><strong>${escapeHtml(it.newCode)}</strong></td>
          <td>${escapeHtml(it.title)}</td>
          <td>${escapeHtml(it.l)}</td>
          <td>${escapeHtml(it.t)}</td>
          <td>${escapeHtml(it.p)}</td>
          <td>${escapeHtml(it.s)}</td>
          <td><strong>${escapeHtml(it.credits)}</strong></td>
        </tr>
      `).join("");

      const sub = sec.subtotal || {};
      return `
        <tr class="curr-section-banner">
          <td colspan="10">${escapeHtml(sec.name)}</td>
        </tr>
        ${rows}
        <tr class="curr-subtotal-row">
          <td colspan="5" style="text-align:right;">Subtotal — ${escapeHtml(sec.name)}</td>
          <td>${escapeHtml(sub.lecture)}</td>
          <td>${escapeHtml(sub.tutorial)}</td>
          <td>${escapeHtml(sub.practical)}</td>
          <td>${escapeHtml(sub.sessional)}</td>
          <td>${escapeHtml(sub.credits)}</td>
        </tr>
      `;
    }).join("");

    const tot = summary.totals || {};
    containerEl.innerHTML = `
      <div class="syl-doc-wrap">
        <div>
          <h4 class="syl-section-heading">📋 ${escapeHtml(summary.title || "Semester III Curriculum")}</h4>
          <p style="font-size:0.86rem;color:var(--syl-muted);margin:0 0 1rem;">
            Official UEM / IEM IT, CSE &amp; Allied Branches B.Tech Credit Structure — Theory, Practical Laboratories, and Sessional Papers.
          </p>
        </div>
        <div class="curr-matrix-wrap">
          <table class="curr-matrix-table">
            <thead>
              <tr>
                <th>Sl.</th>
                <th>Type</th>
                <th>Code</th>
                <th>New Code</th>
                <th>Course Title</th>
                <th>L</th>
                <th>T</th>
                <th>P</th>
                <th>S</th>
                <th>Credits</th>
              </tr>
            </thead>
            <tbody>
              ${sectionsHtml}
              <tr class="curr-total-row">
                <td colspan="5" style="text-align:right;">Grand Total (Semester III)</td>
                <td>${escapeHtml(tot.lecture)}</td>
                <td>${escapeHtml(tot.tutorial)}</td>
                <td>${escapeHtml(tot.practical)}</td>
                <td>${escapeHtml(tot.sessional)}</td>
                <td>${escapeHtml(tot.credits)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  global.UAHSyllabus = {
    renderCourseSyllabus,
    renderCurriculumMatrix
  };
})(window);
