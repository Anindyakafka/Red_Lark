import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
const scanner = process.env.GITLEAKS_PATH ?? "gitleaks";
if (spawnSync(scanner, ["version"], { stdio: "ignore" }).status !== 0)
  throw new Error("Install Gitleaks 8.30.1 or set GITLEAKS_PATH. No scan was skipped.");
if (spawnSync("git", ["check-ignore", ".env.local"], { stdio: "ignore" }).status !== 0)
  throw new Error(".env.local must be ignored.");
if (
  spawnSync("git", ["ls-files", "--error-unmatch", ".env.local"], { stdio: "ignore" }).status === 0
)
  throw new Error(".env.local is tracked: remove it from the index and rotate exposed keys.");
const reports = fs.mkdtempSync(path.join(os.tmpdir(), "redlark-secret-scan-"));
function result(file, status, label) {
  if (status !== 0) {
    let findings = [];
    try {
      findings = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {}
    for (const f of findings)
      console.error(
        `${label}: ${f.RuleID} at ${f.File ?? "working-tree input"}:${f.StartLine ?? "?"}`,
      );
    throw new Error(
      `${label} secret scan failed (${findings.length} redacted findings); no secrets printed.`,
    );
  }
}
const history = path.join(reports, "history.json");
const historical = spawnSync(
  scanner,
  [
    "git",
    "--redact=100",
    "--no-banner",
    "--log-level=error",
    "--log-opts=--all",
    "--report-format=json",
    `--report-path=${history}`,
    ".",
  ],
  { stdio: ["ignore", "ignore", "pipe"], maxBuffer: 1024 * 1024 },
);
result(history, historical.status, "Git history");
const worktree = path.join(reports, "worktree.json");
const scan = spawn(
  scanner,
  [
    "stdin",
    "--redact=100",
    "--no-banner",
    "--log-level=error",
    "--report-format=json",
    `--report-path=${worktree}`,
  ],
  { stdio: ["pipe", "ignore", "pipe"] },
);
scan.stderr.resume();
const done = once(scan, "close");
const files = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
});
if (files.status !== 0) throw new Error("Could not enumerate versioned source.");
for (const file of new Set(files.stdout.split("\0").filter(Boolean))) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) continue;
  const data = fs.readFileSync(file);
  if (data.subarray(0, 8000).includes(0)) continue;
  if (!scan.stdin.write(Buffer.concat([Buffer.from(`\nFILE: ${file}\n`), data])))
    await once(scan.stdin, "drain");
}
scan.stdin.end();
result(worktree, (await done)[0], "Working tree");
console.log(
  "Secret scan passed: repository working files and all Git history; .env.local is ignored and untracked.",
);
