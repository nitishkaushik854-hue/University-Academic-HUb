require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const app = require("./app");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🎓 University Academic Hub Server is running!`);
  console.log(`🌐 Local URL:  http://localhost:${PORT}`);
  console.log(`🏛️ Directory:  http://localhost:${PORT}/university`);
  console.log(`⚡ API Root:   http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});
