const { spawn } = require("child_process");

const isWindows = process.platform === "win32";

function run(name, command) {
  let child;
  try {
    child = spawn(command, {
      cwd: process.cwd(),
      shell: true,
      stdio: "pipe",
      windowsHide: false,
    });
  } catch (error) {
    console.error(`[${name}] could not start: ${error.message}`);
    console.error("Start this command in its own terminal instead:");
    console.error(command);
    process.exitCode = 1;
    return null;
  }

  child.stdout.on("data", (data) => {
    process.stdout.write(`[${name}] ${data}`);
  });

  child.stderr.on("data", (data) => {
    process.stderr.write(`[${name}] ${data}`);
  });

  child.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });

  return child;
}

const serverCommand = isWindows ? "cd server && npm run dev" : "cd server && npm run dev";
const clientCommand = isWindows ? "cd client && npm run dev" : "cd client && npm run dev";

const children = [run("server", serverCommand), run("client", clientCommand)].filter(Boolean);

if (children.length === 0) {
  process.exit(1);
}

function shutdown() {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
