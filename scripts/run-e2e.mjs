import { spawn } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const env = { ...process.env, PORT: "3100", HOSTNAME: "127.0.0.1", AUTH_SECRET: "playwright-only-secret-32-bytes-long", ALLOW_DEMO_AUTH: "true" };
const server = spawn(process.execPath, [resolve(root, ".next/standalone/server.js")], { cwd: root, env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
server.stdout.on("data", (chunk) => process.stdout.write(`[server] ${chunk}`));
server.stderr.on("data", (chunk) => process.stderr.write(`[server] ${chunk}`));

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Test server exited with code ${server.exitCode}.`);
    try { const response = await fetch("http://127.0.0.1:3100/login"); if (response.ok) return; } catch { /* server is still warming */ }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error("Timed out waiting for the test server.");
}

let exitCode = 1;
try {
  await waitForServer();
  const playwright = spawn(process.execPath, [resolve(root, "node_modules/playwright/cli.js"), "test"], { cwd: root, env, stdio: "inherit", windowsHide: true });
  exitCode = await new Promise((resolveExit) => playwright.once("exit", (code) => resolveExit(code ?? 1)));
} finally {
  server.kill("SIGTERM");
  await Promise.race([new Promise((resolveExit) => server.once("exit", resolveExit)), new Promise((resolveWait) => setTimeout(resolveWait, 1500))]);
}
process.exitCode = exitCode;
