import fs from "fs";
import path from "path";
import { argv } from "process";

export function syncInfo() {
  const packageJson = JSON.parse(
    fs.readFileSync(path.resolve(import.meta.dirname, "package.json"), "utf-8"),
  );

  fs.writeFileSync(
    path.resolve(import.meta.dirname, "src/info.json"),
    JSON.stringify({
      name: packageJson.name,
      version: packageJson.version,
    }),
  );
}

if (argv[2] === "run") {
  syncInfo();
}
