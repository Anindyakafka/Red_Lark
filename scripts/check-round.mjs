import fs from "node:fs/promises";
import { spawn } from "node:child_process";
const round = Number(process.argv[2]);
if (!Number.isInteger(round) || round < 1 || round > 15) throw new Error("Supply round 1–15");
const dir = `docs/evidence-local/round-${round}`;
await fs.mkdir(dir, { recursive: true });
const log = [];
const results = [];
function run(command, args) {
  return new Promise((resolve, reject) => {
    const display = [command, ...args].join(" ");
    log.push(`\n$ ${display}\n`);
    console.log(`Checking: ${display}`);
    const child =
      process.platform === "win32" && command === "npm"
        ? spawn(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", `npm.cmd ${args.join(" ")}`], {
            env: process.env,
          })
        : spawn(command, args, { env: process.env });
    let output = "";
    child.stdout.on("data", (b) => {
      output += b;
    });
    child.stderr.on("data", (b) => {
      output += b;
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      log.push(output);
      results.push({ command: display, exitCode: code });
      if (code === 0) resolve();
      else reject(new Error(`${display} failed (${code})\n${output.slice(-9000)}`));
    });
  });
}
try {
  await run("npm", [
    "install",
    "--prefer-offline",
    "--no-audit",
    "--no-fund",
    "--cache",
    ".npm-cache",
  ]);
  for (const script of ["typecheck", "lint", "format:check", "validate:content", "build"])
    await run("npm", ["run", script]);
  await run("npm", ["test"]);
  await run(process.execPath, ["node_modules/tsx/dist/cli.mjs", "scripts/qa-fixture.tsx"]);
  await run("npm", ["run", "test:e2e"]);
  const tests = JSON.parse(await fs.readFile("test-results/results.json", "utf8"));
  await fs.writeFile(`${dir}/browser-results.json`, JSON.stringify(tests, null, 2));
} finally {
  await fs.writeFile(`${dir}/checks.log`, log.join(""));
  await fs.writeFile(`${dir}/checks.json`, JSON.stringify(results, null, 2));
}
console.log(
  `Round ${round} install, typecheck, lint, format, validation, build and tests are green.`,
);
