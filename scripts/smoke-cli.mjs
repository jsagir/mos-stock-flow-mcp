import { spawnSync } from "node:child_process";
import { writeFileSync, readFileSync, unlinkSync } from "node:fs";
const run = (args, input) => spawnSync(process.execPath, ["dist/cli.js", ...args], { input, encoding: "utf8" });
const init = run(["init"]); if (init.status !== 0) throw new Error(init.stderr);
const valid = run(["validate", "-"], init.stdout); if (valid.status !== 0 || !valid.stdout.includes("Valid")) throw new Error(valid.stderr || valid.stdout);
const path = ".mos-smoke.json"; writeFileSync(path, init.stdout); const show = run(["show", path]); unlinkSync(path); if (show.status !== 0) throw new Error(show.stderr);
if (!readFileSync("src/core/fixture.ts", "utf8").includes("community-garden")) throw new Error("fixture missing");
process.stdout.write("CLI smoke passed: init → stdin validate → file show.\n");
