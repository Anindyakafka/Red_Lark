import assert from "node:assert/strict";
import test from "node:test";
import { strToU8, zipSync } from "fflate";
import { isWritingMime, sanitizeWriting } from "../src/server/text-upload.ts";
import { ApiError } from "../src/server/security.ts";

test("writing uploads accept plain text, Markdown and DOCX while retaining only plain text", async () => {
  assert.equal(isWritingMime("text/plain"), true);
  assert.equal(isWritingMime("text/markdown"), true);
  assert.equal(
    isWritingMime("application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    true,
  );
  const plain = await sanitizeWriting(Buffer.from("# Heading\nHello world\n"), "text/markdown");
  assert.equal(plain.text.toString("utf8"), "# Heading\nHello world\n");
  assert.ok(plain.preview.length > 100);
  const docx = zipSync({
    "word/document.xml": strToU8(
      "<w:document><w:body><w:p><w:r><w:t>Hello &amp; welcome</w:t></w:r></w:p></w:body></w:document>",
    ),
  });
  const converted = await sanitizeWriting(
    Buffer.from(docx),
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  );
  assert.equal(converted.text.toString("utf8"), "Hello & welcome\n");
  await assert.rejects(sanitizeWriting(Buffer.from("<script>"), "application/pdf"), ApiError);
});
