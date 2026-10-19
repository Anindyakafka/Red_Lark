import { PutBucketCorsCommand, PutBucketLifecycleConfigurationCommand } from "@aws-sdk/client-s3";
import { r2, privateBucket, publicBucket } from "../src/server/storage.ts";
try {
  process.loadEnvFile(".env.local");
} catch {
  /* Environment may be supplied directly. */
}
const allowed = ["https://redlarkworkshop.com"];
if (process.argv.includes("--local")) allowed.push("http://localhost:3000");
if (!process.argv.includes("--apply")) {
  console.log(
    "Dry run: production-origin PUT CORS on private bucket; GET/HEAD CORS on approved bucket; one-day expiration for quarantine/ only. --local explicitly adds localhost for development. No public access is enabled.",
  );
  process.exit(0);
}
try {
  if (privateBucket() === publicBucket()) throw new Error("Buckets must differ.");
  await r2().send(
    new PutBucketCorsCommand({
      Bucket: privateBucket(),
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: allowed,
            AllowedMethods: ["PUT"],
            AllowedHeaders: ["Content-Type"],
            MaxAgeSeconds: 300,
          },
        ],
      },
    }),
  );
  await r2().send(
    new PutBucketCorsCommand({
      Bucket: publicBucket(),
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: allowed,
            AllowedMethods: ["GET", "HEAD"],
            AllowedHeaders: [],
            MaxAgeSeconds: 300,
          },
        ],
      },
    }),
  );
  await r2().send(
    new PutBucketLifecycleConfigurationCommand({
      Bucket: privateBucket(),
      LifecycleConfiguration: {
        Rules: [
          {
            ID: "expire-abandoned-quarantine",
            Status: "Enabled",
            Filter: { Prefix: "quarantine/" },
            Expiration: { Days: 1 },
          },
        ],
      },
    }),
  );
  console.log(
    "R2 CORS and quarantine-only cleanup applied. Approved data and public-access settings were not changed.",
  );
} catch {
  console.error(
    "Bucket configuration failed. Existing infrastructure was not recreated; provider/credential details withheld.",
  );
  process.exitCode = 1;
}
