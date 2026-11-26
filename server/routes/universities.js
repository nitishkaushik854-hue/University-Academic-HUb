const express = require("express");
const router = express.Router();
const universityController = require("../controllers/universityController");

// GET /api/universities
router.get("/", universityController.getUniversities);

// GET /api/universities/:id
router.get("/:id", universityController.getUniversityById);

// GET /api/universities/:id/academic-data
router.get("/:id/academic-data", universityController.getAcademicData);

// GET /api/universities/:id/students
router.get("/:id/students", universityController.getStudents);

// GET /api/universities/:id/events
router.get("/:id/events", universityController.getEvents);

// POST /api/universities/:id/events
router.post("/:id/events", universityController.createEvent);

// DELETE /api/universities/:id/events/:eventId
router.delete("/:id/events/:eventId", universityController.deleteEvent);

module.exports = router;
