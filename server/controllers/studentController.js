const dataService = require("../services/dataService");

/**
 * POST /api/student/identify
 * Validates student name, student ID / roll number, university selection, department, and semester
 * Returns a verified session token and profile payload
 */
function identifyStudent(req, res, next) {
  try {
    const { name, studentId, rollNo, universityId, department, semester, degree } = req.body;

    const result = dataService.identifyStudent({
      name,
      studentId,
      rollNo,
      universityId,
      department,
      semester,
      degree
    });

    res.status(200).json({
      success: true,
      message: "Student identified and verified successfully.",
      token: result.token,
      student: result.student
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  identifyStudent
};
