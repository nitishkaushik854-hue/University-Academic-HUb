const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");

// POST /api/student/identify
router.post("/identify", studentController.identifyStudent);

module.exports = router;
