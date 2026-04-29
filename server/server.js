const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
require("dotenv").config();

const alignRoutes = require("./routes/align.routes");
const historyRoutes = require("./routes/history.routes");

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
      if (!origin || allowedPattern.test(origin)) {
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

const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI;
const HEALTH_MESSAGE = "Bioinformatics Sequence Alignment API is running.";

if (!MONGO_URI) {
  // Fail fast if DB config is missing.
  throw new Error("MONGO_URI is missing. Add it to your .env file.");
}

function checkExistingApi(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        resolve(body.includes(HEALTH_MESSAGE));
      });
    });

    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    server.on("error", async (error) => {
      if (error.code === "EADDRINUSE") {
        const existingApiIsHealthy = await checkExistingApi(PORT);
        if (existingApiIsHealthy) {
          console.warn(`Port ${PORT} is already running SequenceDP API. Reusing the existing server.`);
          await mongoose.disconnect();
          process.exit(0);
        }
        console.error(`Port ${PORT} is already in use by another application.`);
        await mongoose.disconnect();
        process.exit(1);
      }
      console.error("Server startup error:", error.message);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  });
