const { execSync } = require("child_process");

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

function success(message) {
  console.log(`${GREEN}✅ ${message}${RESET}`);
}

function fail(message) {
  console.error(`${RED}❌ ${message}${RESET}`);
}

function info(message) {
  console.log(`${YELLOW}${message}${RESET}`);
}

function timestampMessage() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `update: ${yyyy}-${mm}-${dd} ${hh}:${min} - auto commit`;
}

function runCommand(command, stepLabel) {
  try {
    execSync(command, { stdio: "pipe" });
    success(stepLabel);
    return { ok: true, output: "" };
  } catch (error) {
    const output = `${error.stdout ? error.stdout.toString() : ""}${error.stderr ? error.stderr.toString() : ""}`;
    return { ok: false, output };
  }
}

function main() {
  const cliMessage = process.argv.slice(2).join(" ").trim();
  const message = cliMessage || timestampMessage();
  info(`Using commit message: "${message}"`);

  const addResult = runCommand("git add .", "Staged changes");
  if (!addResult.ok) {
    fail("Failed to stage changes.");
    if (addResult.output) console.error(addResult.output.trim());
    process.exit(1);
  }

  const commitResult = runCommand(`git commit -m "${message.replace(/"/g, '\\"')}"`, "Created commit");
  if (!commitResult.ok) {
    const lower = commitResult.output.toLowerCase();
    if (lower.includes("nothing to commit") || lower.includes("no changes added to commit")) {
      info("⚡ Nothing new to push.");
      process.exit(0);
    }
    fail("Failed to create commit.");
    if (commitResult.output) console.error(commitResult.output.trim());
    process.exit(1);
  }

  const pushResult = runCommand("git push origin main", "Pushed to origin/main");
  if (!pushResult.ok) {
    fail("Failed to push changes.");
    if (pushResult.output) console.error(pushResult.output.trim());
    process.exit(1);
  }
}

try {
  main();
} catch (error) {
  fail(error.message || "Unexpected error.");
  process.exit(1);
}
