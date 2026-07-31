import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const expoUrl = process.env.EXPO_URL;
if (!expoUrl) {
  console.error("EXPO_URL env var is required (e.g. exp://127.0.0.1:8081)");
  process.exit(1);
}

const templatePath = path.join(process.cwd(), ".maestro", "screenshots.yaml");
const outPath = path.join(
  process.cwd(),
  ".maestro",
  "screenshots.generated.yaml",
);

const template = fs.readFileSync(templatePath, "utf8");
const generated = template.replaceAll("${EXPO_URL}", expoUrl);
fs.writeFileSync(outPath, generated);

execFileSync(
  path.join(process.env.HOME || "", ".maestro", "bin", "maestro"),
  ["test", outPath],
  {
    stdio: "inherit",
  },
);

const home = process.env.HOME || "";
const testsRoot = path.join(home, ".maestro", "tests");
let latestDir = null;
let latestMtime = 0;

for (const name of fs.readdirSync(testsRoot, { withFileTypes: true })) {
  if (!name.isDirectory()) continue;
  const full = path.join(testsRoot, name.name);
  const stat = fs.statSync(full);
  if (stat.mtimeMs > latestMtime) {
    latestMtime = stat.mtimeMs;
    latestDir = full;
  }
}

if (latestDir) {
  const src = path.join(
    latestDir,
    "screenshots.generated",
    "takeScreenshot",
    "assets",
    "github",
  );
  const dest = path.join(process.cwd(), "assets", "github");
  if (fs.existsSync(src)) {
    fs.mkdirSync(dest, { recursive: true });
    fs.cpSync(src, dest, { recursive: true });
    console.log(`\nCopied screenshots to ${dest}`);
  } else {
    console.warn(`\nNo screenshots found at ${src}`);
  }
}
