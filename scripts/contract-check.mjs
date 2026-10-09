import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const snapshot = await readFile("src/api/openapi-v1.json", "utf8");
const spec = JSON.parse(snapshot);
if (
  spec.openapi !== "3.0.3" ||
  spec.info.version !== "1.0.0" ||
  !spec.paths["/v1/auth/login"] ||
  !spec.paths["/v1/conversations"]
)
  throw new Error("Mobile v1 snapshot is invalid");
if (process.argv[2]) {
  const owner = await readFile(process.argv[2], "utf8");
  if (owner !== snapshot)
    throw new Error(
      "Gateway snapshot drift; review compatibility before replacing",
    );
}
console.log(
  `Mobile v1 snapshot: ${Object.keys(spec.paths).length} paths; sha256 ${createHash("sha256").update(snapshot).digest("hex")}`,
);
