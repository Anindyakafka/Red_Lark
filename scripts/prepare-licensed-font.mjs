import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Netlify supplies the same values as build environment variables.
}

const files = ["regular", "italic"].map((style) => ({
  style,
  local: path.resolve(`.qa/private-fonts/bangla/li-subha-letterpress-${style}.ttf`),
  output: path.resolve(`public/fonts/licensed/bengali-${style}.ttf`),
  key: `site-fonts/subha-letterpress/v1/${style}.ttf`,
}));

function storage() {
  const endpoint = new URL(process.env.R2_ENDPOINT || "");
  if (
    endpoint.protocol !== "https:" ||
    !endpoint.hostname.endsWith(".r2.cloudflarestorage.com") ||
    endpoint.pathname !== "/"
  )
    throw new Error("A valid private R2 endpoint is required for licensed fonts.");
  const bucket = process.env.R2_PRIVATE_BUCKET || process.env.R2_PENDING_BUCKET;
  if (!bucket || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY)
    throw new Error("Private R2 bucket credentials are required for licensed fonts.");
  return {
    bucket,
    client: new S3Client({
      region: "auto",
      forcePathStyle: true,
      endpoint: endpoint.origin,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    }),
  };
}

function validFont(bytes) {
  if (
    bytes.length < 1024 ||
    !["00010000", "4f54544f", "74727565"].includes(bytes.subarray(0, 4).toString("hex"))
  )
    throw new Error("The licensed font file is not a supported TrueType/OpenType font.");
  return bytes;
}

if (process.argv.includes("--upload")) {
  if (!files.every(({ local }) => existsSync(local)))
    throw new Error("Place both licensed fonts in .qa/private-fonts/bangla before uploading.");
  const { client, bucket } = storage();
  try {
    for (const file of files) {
      const body = validFont(await readFile(file.local));
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: file.key,
          Body: body,
          ContentType: "font/ttf",
          CacheControl: "private, no-store",
        }),
      );
    }
  } finally {
    client.destroy();
  }
  console.log("Licensed Bengali font uploaded to private R2; no public R2 URL was created.");
} else {
  let payloads;
  if (!process.argv.includes("--remote") && files.every(({ local }) => existsSync(local))) {
    payloads = await Promise.all(files.map(async ({ local }) => validFont(await readFile(local))));
  } else if (
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
  ) {
    const { client, bucket } = storage();
    try {
      payloads = await Promise.all(
        files.map(async ({ key }) => {
          const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
          if (!result.Body) throw new Error("A private font object is missing from R2.");
          return validFont(Buffer.from(await result.Body.transformToByteArray()));
        }),
      );
    } finally {
      client.destroy();
    }
  } else if (process.env.CONTEXT === "production") {
    throw new Error(
      "Production licensed Bengali font source is unavailable; refusing an incomplete deploy.",
    );
  }

  if (payloads) {
    await mkdir(path.dirname(files[0].output), { recursive: true });
    await Promise.all(files.map((file, index) => writeFile(file.output, payloads[index])));
    console.log(
      "Licensed Bengali font prepared for same-origin delivery; original files remain outside Git.",
    );
  } else {
    await Promise.all(
      files.map(({ output }) =>
        unlink(output).catch((error) => {
          if (error.code !== "ENOENT") throw error;
        }),
      ),
    );
    console.log(
      "Licensed Bengali font unavailable in this local/CI build; Noto fallback remains active.",
    );
  }
}
