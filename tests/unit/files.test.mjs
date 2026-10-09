import { test } from "node:test";
import assert from "node:assert/strict";
import {
  savedFile,
  uploadPurpose,
  downloadLink,
} from "../../src/features/files/fileModel.ts";
test("file metadata preserves upstream expiry and image uploads use vision limits", () => {
  const item = savedFile({
    id: "file_fixture",
    filename: "fictional.png",
    bytes: 100,
    purpose: "vision",
    openjm: { content_type: "image/png", expires_at: 2000000000 },
  });
  assert.equal(item.contentType, "image/png");
  assert.equal(item.expiresAt, new Date(2000000000000).toISOString());
  assert.equal(uploadPurpose("fictional.png", 1024), "vision");
  assert.equal(uploadPurpose("fictional.pdf", 1024), "user_data");
  assert.throws(() => uploadPurpose("fictional.jpg", 8 * 1024 * 1024 + 1));
  assert.throws(() => uploadPurpose("fictional.exe", 100));
  assert.throws(() => downloadLink({ url: "http://unexpected.example" }));
  assert.throws(() =>
    downloadLink({ url: "https://credential@unexpected.example" }),
  );
  assert.equal(
    downloadLink({ download_url: "https://files.example.test/fictional" }).url,
    "https://files.example.test/fictional",
  );
});
