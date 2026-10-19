import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import { jsPDF } from "jspdf";
import { ApiError, required, sha256 } from "./security.ts";

export const MAX_UPLOAD = 25 * 1024 * 1024;
export function r2() {
  return new S3Client({
    region: "auto",
    forcePathStyle: true,
    endpoint: required("R2_ENDPOINT"),
    credentials: {
      accessKeyId: required("R2_ACCESS_KEY_ID"),
      secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
    },
  });
}
export const privateBucket = () => required("R2_PRIVATE_BUCKET", "R2_PENDING_BUCKET");
export const publicBucket = () => required("R2_PUBLIC_BUCKET", "R2_APPROVED_BUCKET");
export function publicBase() {
  const url = new URL(required("R2_PUBLIC_BASE_URL"));
  if (
    url.protocol !== "https:" ||
    url.hostname !== "files.redlarkworkshop.com" ||
    url.pathname !== "/"
  )
    throw new ApiError(503, "public_storage_not_ready");
  return url.origin;
}
export function publicUrl(key: string) {
  return `${publicBase()}/${key.split("/").map(encodeURIComponent).join("/")}`;
}
export async function signedUpload(key: string, mime: string, bytes: number) {
  if (
    !["image/jpeg", "image/png"].includes(mime) ||
    !Number.isSafeInteger(bytes) ||
    bytes < 1 ||
    bytes > MAX_UPLOAD
  )
    throw new ApiError(422, "invalid_file");
  return getSignedUrl(
    r2(),
    new PutObjectCommand({
      Bucket: privateBucket(),
      Key: key,
      ContentType: mime,
      ContentLength: bytes,
    }),
    { expiresIn: 300, signableHeaders: new Set(["content-type", "content-length"]) },
  );
}
export async function signedRead(key: string) {
  return getSignedUrl(r2(), new GetObjectCommand({ Bucket: privateBucket(), Key: key }), {
    expiresIn: 60,
  });
}
export async function remove(key: string, published = false) {
  await r2().send(
    new DeleteObjectCommand({ Bucket: published ? publicBucket() : privateBucket(), Key: key }),
  );
}
export async function put(key: string, buffer: Buffer, mime: string) {
  await r2().send(
    new PutObjectCommand({
      Bucket: privateBucket(),
      Key: key,
      Body: buffer,
      ContentType: mime,
      CacheControl: "private, no-store",
    }),
  );
}
export async function copyPublic(from: string, to: string, mime: string) {
  await r2().send(
    new CopyObjectCommand({
      Bucket: publicBucket(),
      Key: to,
      CopySource: `${privateBucket()}/${from.split("/").map(encodeURIComponent).join("/")}`,
      ContentType: mime,
      MetadataDirective: "REPLACE",
      CacheControl: "no-store, max-age=0",
    }),
  );
}
export async function quarantine(key: string, bytes: number, mime: string) {
  const head = await r2().send(new HeadObjectCommand({ Bucket: privateBucket(), Key: key }));
  if (head.ContentLength !== bytes || bytes > MAX_UPLOAD || head.ContentType !== mime)
    throw new ApiError(422, "invalid_file");
  const object = await r2().send(new GetObjectCommand({ Bucket: privateBucket(), Key: key }));
  if (!object.Body) throw new ApiError(422, "invalid_file");
  const parts: Uint8Array[] = [];
  let total = 0;
  for await (const part of object.Body as AsyncIterable<Uint8Array>) {
    total += part.length;
    if (total > MAX_UPLOAD) throw new ApiError(413, "request_too_large");
    parts.push(part);
  }
  if (total !== bytes) throw new ApiError(422, "invalid_file");
  return sanitize(Buffer.concat(parts), mime);
}
export async function sanitize(input: Buffer, claimed: string) {
  const png = input.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = input[0] === 255 && input[1] === 216 && input[2] === 255;
  if ((!png && !jpeg) || (png ? "image/png" : "image/jpeg") !== claimed)
    throw new ApiError(422, "invalid_file");
  try {
    const image = sharp(input, { limitInputPixels: 40000000, animated: false, failOn: "warning" });
    const info = await image.metadata();
    if (!info.width || !info.height || (info.pages || 1) > 1) throw new Error("unsupported");
    // rotate applies orientation before the default metadata-free re-encode.
    const clean = await image.rotate().png().toBuffer({ resolveWithObject: true });
    const preview = await sharp(clean.data)
      .resize({ width: 1000, height: 1400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    return {
      buffer: clean.data,
      preview,
      width: clean.info.width,
      height: clean.info.height,
      sha256: sha256(clean.data),
    };
  } catch {
    throw new ApiError(422, "invalid_file");
  }
}
export function printPdf(image: Buffer, size: "a4" | "a2", credit: string) {
  const pdf = new jsPDF({ unit: "mm", format: size, compress: true });
  const width = pdf.internal.pageSize.getWidth(),
    height = pdf.internal.pageSize.getHeight();
  const data = pdf.getImageProperties(image);
  const scale = Math.min((width - 10) / data.width, (height - 18) / data.height);
  pdf.addImage(
    image,
    "PNG",
    (width - data.width * scale) / 2,
    5,
    data.width * scale,
    data.height * scale,
  );
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  // Built-in PDF fonts do not support Indic. Artist credit remains embedded verbatim in metadata.
  pdf.text(
    "RED LARK WORKSHOP | Credit and licence: see PDF properties and artwork page",
    5,
    height - 5,
  );
  pdf.setProperties({
    title: "Print-ready contribution",
    subject: credit,
    author: credit,
    keywords: "credit; licence; print",
  });
  return Buffer.from(pdf.output("arraybuffer"));
}
