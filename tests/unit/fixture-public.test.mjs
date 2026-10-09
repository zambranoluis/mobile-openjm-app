import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

test("fictional public uploads require resource credentials and fail after controlled expiry", async (t) => {
  const child = spawn(process.execPath, ["tests/fixtures/server.mjs"], {
    env: { ...process.env, OPENJM_FIXTURE_PORT: "0", OPENJM_FIXTURE_AUDIO_SECONDS: "30", OPENJM_FIXTURE_BINARY_FRAMING: "chunked" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  t.after(() => child.kill());
  const origin = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Fixture startup timed out")), 10000);
    let output = "";
    child.once("error", reject);
    child.once("exit", (code) => reject(new Error(`Fixture exited: ${code}`)));
    child.stdout.on("data", (chunk) => {
      output += chunk;
      const port = /127\.0\.0\.1:(\d+)/.exec(output)?.[1];
      if (port) {
        clearTimeout(timer);
        resolve(`http://127.0.0.1:${port}`);
      }
    });
  });
  const form = new FormData();
  form.append("file", new Blob(["Fictional attachment bytes."], { type: "text/plain" }), "fictional.txt");
  form.append("purpose", "user_data");
  const upload = await fetch(`${origin}/v1/public/files`, { method: "POST", body: form });
  assert.equal(upload.status, 201);
  const file = await upload.json();
  const content = `${origin}/v1/public/files/${file.id}/content`;
  assert.equal((await fetch(content)).status, 403);
  assert.equal((await fetch(content, { headers: { "X-OpenJM-File-Token": "wrong-token" } })).status, 403);
  const headers = { "X-OpenJM-File-Token": file.file_token };
  const downloaded = await fetch(content, { headers });
  assert.equal(downloaded.status, 200);
  assert.equal(await downloaded.text(), "Fictional attachment bytes.");
  await fetch(`${origin}/fixture/binary/interrupt-next`, { method: "POST" });
  const interrupted = await fetch(content, { headers });
  assert.equal(interrupted.status, 200);
  await assert.rejects(() => interrupted.arrayBuffer());
  assert.equal(await (await fetch(content, { headers })).text(), "Fictional attachment bytes.");
  assert.equal((await fetch(content, { headers: { ...headers, authorization: "Bearer fictional-access" } })).status, 403);
  const chat = () => fetch(`${origin}/v1/public/chat/completions`, {
    method: "POST", headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ message: "Fictional attachment test", attachments: [{ file_id: file.id, kind: "analysis" }] }),
  });
  assert.equal((await chat()).status, 200);
  const job = await (await fetch(`${origin}/v1/public/images/generations`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prompt: "Fictional image" }),
  })).json();
  await fetch(`${origin}/fixture/public/expire`, { method: "POST" });
  const expired = await fetch(content, { headers });
  assert.equal(expired.status, 403);
  assert.match((await expired.json()).message, /expired/);
  assert.equal((await chat()).status, 403);
  assert.equal((await fetch(`${origin}/v1/public/images/generations/${job.id}`, {
    headers: { "X-OpenJM-Job-Token": job.job_token },
  })).status, 403);
});
