const express = require("express");
const cors = require("cors");

const alignRoutes = require("./routes/align.routes");
const historyRoutes = require("./routes/history.routes");

// Returned by GET / and used by server.js to recognise an already-running instance.
const HEALTH_MESSAGE = "Bioinformatics Sequence Alignment API is running.";

// Any localhost / 127.0.0.1 port is allowed so the Vite dev server can fall
// back to 5174, 5175, ... without CORS errors. Requests with no Origin header
// (curl, server-to-server) are allowed too.
const ALLOWED_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGIN.test(origin)) {
          callback(null, true);
          return;
        }
        const error = new Error("CORS not allowed for this origin");
        error.status = 403;
        callback(error);
      },
      credentials: true,
    })
  );
  app.use(express.json());

  app.use("/api", alignRoutes);
  app.use("/api", historyRoutes);

  app.get("/", (_req, res) => {
    res.json({ message: HEALTH_MESSAGE });
  });

  // The client always calls response.json(), so unknown routes and errors must
  // answer with JSON rather than Express's default HTML page.
  app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
  });

  // eslint-disable-next-line no-unused-vars -- Express needs the 4-argument signature.
  app.use((error, _req, res, _next) => {
    if (error.type === "entity.parse.failed") {
      res.status(400).json({ message: "Request body is not valid JSON." });
      return;
    }
    const status = Number.isInteger(error.status) && error.status >= 400 ? error.status : 500;
    if (status >= 500) {
      console.error(error);
    }
    res.status(status).json({ message: status >= 500 ? "Internal server error." : error.message });
  });

  return app;
}

module.exports = { createApp, HEALTH_MESSAGE };
