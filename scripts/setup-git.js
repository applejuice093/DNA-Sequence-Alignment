const { execSync } = require("child_process");
const fs = require("fs");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) =>
  new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });

function run(command, label) {
  console.log(`\n▶ ${label}`);
  execSync(command, { stdio: "inherit" });
  console.log(`✓ ${label} completed`);
}

async function main() {
  try {
    const repoUrl = await ask("GitHub repo URL: ");
    const userName = await ask("Git username: ");
    const userEmail = await ask("Git email: ");
    rl.close();

    if (!repoUrl || !userName || !userEmail) {
      console.error("All fields are required.");
      process.exit(1);
    }

    run("git init", "Initialize git repository");

    try {
      execSync("git remote get-url origin", { stdio: "pipe" });
      run(`git remote set-url origin "${repoUrl}"`, "Set origin remote URL");
    } catch {
      run(`git remote add origin "${repoUrl}"`, "Add origin remote");
    }

    run(`git config user.name "${userName.replace(/"/g, '\\"')}"`, "Configure git username");
    run(`git config user.email "${userEmail.replace(/"/g, '\\"')}"`, "Configure git email");

    if (!fs.existsSync("README.md")) {
      fs.writeFileSync("README.md", "# SequenceDP\n", "utf8");
      console.log("✓ Created README.md");
    } else {
      console.log("✓ README.md already exists, skipping creation");
    }

    run("git add .", "Stage files");

    try {
      run('git commit -m "initial commit"', "Create initial commit");
    } catch (error) {
      const output = `${error.stdout ? error.stdout.toString() : ""}${error.stderr ? error.stderr.toString() : ""}`.toLowerCase();
      if (output.includes("nothing to commit")) {
        console.log("✓ Nothing to commit, continuing");
      } else {
        throw error;
      }
    }

    run("git branch -M main", "Set default branch to main");
    run("git push -u origin main", "Push main branch to origin");
    console.log("\nGit setup completed successfully.");
  } catch (error) {
    console.error("\nGit setup failed.");
    console.error(error.message || error);
    process.exit(1);
  }
}

main();
