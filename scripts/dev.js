// Fallback dev runner (`npm run dev:node`) for machines where `concurrently`
// is not installed: starts the server and client and prefixes their output.
const { spawn } = require("child_process");

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

// `cd x && ...` works in both cmd.exe and POSIX shells, so no per-OS variants are needed.
const serverCommand = "cd server && npm run dev";
const clientCommand = "cd client && npm run dev";

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
