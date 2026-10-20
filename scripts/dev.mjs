import http from "node:http";
import { privateShellPath } from "../src/lib/private-routes.ts";
import { spawn } from "node:child_process";
import { bridge } from "./api-bridge.mjs";
try {
  process.loadEnvFile(".env.local");
} catch {
  /* Environment can be supplied directly. */
}
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", "3001"], {
  stdio: "inherit",
  env: process.env,
});
const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    void bridge(req, res);
    return;
  }
  const proxy = http.request(
    {
      hostname: "localhost",
      port: 3001,
      path:
        privateShellPath(req.url.split("?")[0]) +
        (req.url.includes("?") ? "?" + req.url.split("?").slice(1).join("?") : ""),
      method: req.method,
      headers: req.headers,
    },
    (upstream) => {
      res.writeHead(upstream.statusCode, upstream.headers);
      upstream.pipe(res);
    },
  );
  proxy.on("error", () => {
    res.writeHead(503);
    res.end("Development server is starting.");
  });
  req.pipe(proxy);
});
server.on("upgrade", (req, socket, head) => {
  const proxy = http.request({
    hostname: "localhost",
    port: 3001,
    path: req.url,
    headers: req.headers,
  });
  proxy.on("upgrade", (response, upstream, first) => {
    socket.write(
      `HTTP/1.1 ${response.statusCode} Switching Protocols\r\n${Object.entries(response.headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\r\n")}\r\n\r\n`,
    );
    upstream.write(head);
    socket.write(first);
    upstream.pipe(socket);
    socket.pipe(upstream);
  });
  proxy.on("error", () => socket.destroy());
  proxy.end();
});
server.listen(3000, () => console.log("Local site and API: http://localhost:3000"));
function stop() {
  child.kill();
  server.close();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
child.on("exit", () => server.close());
