import { randomUUID } from "node:crypto";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { r2, privateBucket, publicBucket, signedUpload, remove } from "../src/server/storage.ts";
try {
  process.loadEnvFile(".env.local");
} catch {
  /* Environment may be supplied directly. */
}
const key = `quarantine/verification/${randomUUID()}`,
  bytes = Buffer.from("Red Lark scoped upload verification");
try {
  const signed = await signedUpload(key, "image/png", bytes.length);
  const modified = new URL(signed);
  modified.pathname += "-different-key";
  const bad = await fetch(modified, {
    method: "PUT",
    headers: { "Content-Type": "image/png", "Content-Length": String(bytes.length) },
    body: bytes,
  });
  if (bad.status !== 403) throw new Error("Unexpected response for a differently scoped object.");
  const correct = await fetch(signed, {
    method: "PUT",
    headers: { "Content-Type": "image/png", "Content-Length": String(bytes.length) },
    body: bytes,
  });
  if (!correct.ok) throw new Error("Scoped upload failed.");
  await r2().send(new HeadObjectCommand({ Bucket: privateBucket(), Key: key }));
  let absent = false;
  try {
    await r2().send(new HeadObjectCommand({ Bucket: publicBucket(), Key: key }));
  } catch (error) {
    absent = Boolean(
      error &&
      typeof error === "object" &&
      "$metadata" in error &&
      (error.$metadata as { httpStatusCode: number }).httpStatusCode === 404,
    );
  }
  if (!absent) throw new Error("Pending object isolation not proven.");
  const unsigned = new URL(signed);
  unsigned.search = "";
  const anonymous = await fetch(unsigned);
  if (anonymous.ok) throw new Error("Private object unexpectedly readable without a signature.");
  if (process.argv.includes("--wait-expiry")) {
    console.log(
      "Waiting for the real five-minute signature expiry; the disposable probe will be removed afterwards.",
    );
    await new Promise((resolve) => setTimeout(resolve, 305000));
    const expired = await fetch(signed, {
      method: "PUT",
      headers: { "Content-Type": "image/png", "Content-Length": String(bytes.length) },
      body: bytes,
    });
    if (expired.status !== 403) throw new Error("Expired signed upload was not rejected.");
    console.log(
      "Elapsed-expiry integration passed: the same previously accepted signed PUT is rejected after its five-minute lifetime.",
    );
  }
  console.log(
    `R2 integration passed: correct-key signed PUT accepted, changed-key PUT rejected, object absent from approved bucket, unsigned private read denied. ${process.argv.includes("--wait-expiry") ? "Actual elapsed expiry passed." : "Actual elapsed expiry requires --wait-expiry."}`,
  );
} catch {
  console.error("R2 integration failed; credentials and signed URLs withheld.");
  process.exitCode = 1;
} finally {
  await remove(key).catch(() => {});
  await remove(`${key}-different-key`).catch(() => {});
}
