const http = require("http");
const mongoose = require("mongoose");
require("dotenv").config();

const { createApp, HEALTH_MESSAGE } = require("./app");

const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  // Fail fast if DB config is missing.
  throw new Error("MONGO_URI is missing. Copy server/.env.example to server/.env and set it.");
}

const app = createApp();

/**
 * When the port is taken, ask whoever owns it for GET /. If it answers with our
 * health message, another copy of this API is already running and we can exit
 * cleanly instead of failing (common when `npm run dev` is started twice).
 */
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
