const dataService = require("../services/dataService");

/**
 * GET /api/universities
 * Returns universities matching search, state, type, and status query parameters
 */
function getUniversities(req, res, next) {
  try {
    const { search, state, type, status } = req.query;
    const universities = dataService.getUniversities({ search, state, type, status });

    res.json({
      success: true,
      count: universities.length,
      filters: {
        search: search || null,
        state: state || null,
        type: type || null,
        status: status || null
      },
      data: universities
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/universities/:id
 * Returns full details for a single university
 */
function getUniversityById(req, res, next) {
  try {
    const { id } = req.params;
    const university = dataService.getUniversityById(id);

    if (!university) {
      const err = new Error(`University with ID '${id}' not found.`);
      err.status = 404;
      return next(err);
    }

    res.json({
      success: true,
      data: university
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/universities/:id/academic-data
 * Returns courses, timetable, resources, events, and student roster filtered by department and semester
 */
function getAcademicData(req, res, next) {
  try {
    const { id } = req.params;
    const { department, semester } = req.query;

    const academicData = dataService.getAcademicData(id, department, semester);

    res.json({
      success: true,
      ...academicData
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/universities/:id/students
 * Returns the student roster with search/section filters
 */
function getStudents(req, res, next) {
  try {
    const { id } = req.params;
    const { search, section, rollNo, enrollmentNo } = req.query;

    const university = dataService.getUniversityById(id);
    if (!university) {
      const err = new Error(`University with ID '${id}' not found.`);
      err.status = 404;
      return next(err);
    }

    const students = dataService.getStudents({
      universityId: id,
      section,
      search,
      rollNo,
      enrollmentNo
    });

    res.json({
      success: true,
      universityId: id,
      count: students.length,
      section: section || "All",
      data: students
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/universities/:id/events
 * Returns the campus events
 */
function getEvents(req, res, next) {
  try {
    const { id } = req.params;
    const { search, category, status } = req.query;

    const university = dataService.getUniversityById(id);
    if (!university) {
      const err = new Error(`University with ID '${id}' not found.`);
      err.status = 404;
      return next(err);
    }

    const events = dataService.getEvents({
      universityId: id,
      category,
      status,
      search
    });

    res.json({
      success: true,
      universityId: id,
      count: events.length,
      data: events
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/universities/:id/events
 * Creates a new campus event
 */
function createEvent(req, res, next) {
  try {
    const { id } = req.params;
    const newEvent = dataService.createEvent(id, req.body);

    res.status(201).json({
      success: true,
      universityId: id,
      message: "Event published successfully.",
      data: newEvent
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/universities/:id/events/:eventId
 * Removes an event by ID
 */
function deleteEvent(req, res, next) {
  try {
    const { id, eventId } = req.params;
    const removed = dataService.deleteEvent(id, eventId);

    res.json({
      success: true,
      universityId: id,
      message: "Event deleted successfully.",
      data: removed
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUniversities,
  getUniversityById,
  getAcademicData,
  getStudents,
  getEvents,
  createEvent,
  deleteEvent
};
