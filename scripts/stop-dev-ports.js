const { execSync } = require("child_process");
const os = require("os");

const PORTS = [5000, 5173, 5174, 5175, 5176, 5177];

function run(command) {
  return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function getWindowsPids(port) {
  try {
    const output = run(`netstat -ano | findstr :${port}`);
    return output
      .split(/\r?\n/)
      .map((line) => line.trim().split(/\s+/))
      .filter((parts) => parts.length >= 5 && parts[1]?.endsWith(`:${port}`) && parts[3] === "LISTENING")
      .map((parts) => parts[4]);
  } catch {
    return [];
  }
}

function getUnixPids(port) {
  try {
    return run(`lsof -ti tcp:${port} -sTCP:LISTEN`)
      .split(/\r?\n/)
      .map((pid) => pid.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function stopPid(pid) {
  if (os.platform() === "win32") {
    run(`taskkill /PID ${pid} /F`);
  } else {
    run(`kill -TERM ${pid}`);
  }
}

const seen = new Set();
let stopped = 0;

for (const port of PORTS) {
  const pids = os.platform() === "win32" ? getWindowsPids(port) : getUnixPids(port);
  for (const pid of pids) {
    if (seen.has(pid) || pid === "0") continue;
    seen.add(pid);
    try {
      stopPid(pid);
      stopped += 1;
      console.log(`Stopped process ${pid} on port ${port}.`);
    } catch (error) {
      console.warn(`Could not stop process ${pid} on port ${port}: ${error.message}`);
    }
  }
}

if (stopped === 0) {
  console.log("No dev server processes were found on the project ports.");
}
