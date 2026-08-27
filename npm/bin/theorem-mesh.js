#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const executableName = process.platform === "win32" ? "theorem-mesh.exe" : "theorem-mesh";
const binaryPath = process.env.THEOREM_MESH_BINARY || resolve(packageRoot, "vendor", executableName);

if (!existsSync(binaryPath)) {
  const installer = resolve(packageRoot, "scripts", "install.js");
  const result = await import(pathToFileURL(installer).href);
  await result.install();
}

const child = spawn(binaryPath, process.argv.slice(2), {
  stdio: "inherit",
  windowsHide: false,
});

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("error", (error) => {
  console.error(`Unable to start Theorem Mesh: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
