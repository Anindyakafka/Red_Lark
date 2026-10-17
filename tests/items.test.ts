import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { artists, posters } from "../src/lib/catalog";
import { validateArtist } from "../src/lib/validate";
import { ArtistContact } from "../src/components/artist-contact";
test("artist contact and UPI require separate explicit consent and private fields cannot enter published content", () => {
  const base = artists[0];
  const privateFields = {
    ...base,
    publicContact: { value: "test-only@example.invalid", consented: false },
    publicUpi: { value: "test-only@invalid", consented: false },
  };
  assert.equal(validateArtist(privateFields).length, 2);
  const hidden = renderToStaticMarkup(
    React.createElement(ArtistContact, { artist: privateFields }),
  );
  assert.ok(!hidden.includes("test-only"));
  const oneConsent = {
    ...privateFields,
    publicContact: { ...privateFields.publicContact, consented: true },
  };
  const contact = renderToStaticMarkup(React.createElement(ArtistContact, { artist: oneConsent }));
  assert.ok(contact.includes("data-public-contact"));
  assert.ok(!contact.includes("upi://"));
  const bothConsent = { ...oneConsent, publicUpi: { ...privateFields.publicUpi, consented: true } };
  assert.equal(validateArtist(bothConsent).length, 0);
  assert.ok(
    renderToStaticMarkup(React.createElement(ArtistContact, { artist: bothConsent })).includes(
      "upi://pay?",
    ),
  );
});
test("A4/A2 raster print files have actual 300-DPI dimensions, not only labels", async () => {
  for (const size of ["A4", "A2"])
    for (const format of ["PNG", "JPEG"]) {
      const file = posters[0].formats.find((file) => file.size === size && file.format === format);
      assert.ok(file, `Missing ${size} ${format}`);
      const image = await sharp(`public${file.path}`).metadata();
      assert.equal(image.density, 300);
      assert.equal(image.width, file.pixelWidth);
      assert.equal(image.height, file.pixelHeight);
      assert.equal(image.width, Math.round(((size === "A4" ? 210 : 420) / 25.4) * 300));
      assert.equal(image.height, Math.round(((size === "A4" ? 297 : 594) / 25.4) * 300));
    }
});
