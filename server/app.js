const express = require("express");
const path = require("path");
const cors = require("cors");
const apiRouter = require("./routes");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();

// Public / client root directory
const PUBLIC_DIR = path.join(__dirname, "..");

// CORS configuration
const allowedOrigin = process.env.CORS_ORIGIN || "*";
app.use(cors({
  origin: allowedOrigin,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV !== "test") {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (req.path.startsWith("/api")) {
        console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });
}

// ── REST API ROUTES ──────────────────────────────────────────
app.use("/api", apiRouter);

// 404 for unhandled /api/* routes
app.use("/api", notFoundHandler);

// API Error Handler
app.use("/api", errorHandler);

// ── STATIC FRONTEND SERVING & CLEAN ROUTING ──────────────────
// Clean extensionless route mappings
const routeMap = {
  "/": "index.html",
  "/university": "university.html",
  "/courses": "courses.html",
  "/timetable": "timetable.html",
  "/add-course": "add-course.html",
  "/uem-home": "uem-home.html"
};

app.get("/events", (req, res) => {
  res.redirect("/uem-home#events");
});

Object.entries(routeMap).forEach(([routePath, fileName]) => {
  app.get(routePath, (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, fileName));
  });
});

// Serve all static assets (CSS, JS, images, videos, fonts)
app.use(express.static(PUBLIC_DIR, {
  extensions: ["html", "htm"],
  index: "index.html"
}));

// Fallback for SPA/browser navigation on non-API routes
app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// Global error handler
app.use(errorHandler);

module.exports = app;
