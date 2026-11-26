const express = require("express");
const router = express.Router();
const universitiesRouter = require("./universities");
const studentRouter = require("./student");

// Mount sub-routers
router.use("/universities", universitiesRouter);
router.use("/student", studentRouter);

// Health check / API status
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "University Academic Hub API",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
