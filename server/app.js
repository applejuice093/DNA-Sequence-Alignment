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
        callback(new Error("CORS not allowed for this origin"));
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

  return app;
}

module.exports = { createApp, HEALTH_MESSAGE };
