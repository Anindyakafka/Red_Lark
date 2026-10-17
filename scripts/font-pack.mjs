import fs from "node:fs/promises";
import { zipSync, strToU8 } from "fflate";
await fs.mkdir("public/bundles", { recursive: true });
const files = {
  "README.txt": strToU8(
    "Red Lark Workshop local type kit.\nBebas Neue / IBM Plex Mono / Noto Sans Devanagari, Bengali and Malayalam. Original upstream fonts, not CC0 artwork.\nEach retains its SIL Open Font Licence. Read before redistribution. Indic source provenance is included.\nSources: https://github.com/google/fonts/tree/main/ofl/bebasneue\nhttps://github.com/google/fonts/tree/main/ofl/ibmplexmono\n",
  ),
};
for (const name of [
  "bebas-neue.ttf",
  "ibm-plex-mono.ttf",
  "Bebas-Neue-OFL.txt",
  "IBM-Plex-Mono-OFL.txt",
])
  files[name] = new Uint8Array(await fs.readFile(`public/fonts/${name}`));
for (const script of ["devanagari", "bengali", "malayalam"])
  for (const suffix of ["full.ttf", "full-OFL.txt"])
    files[`noto-sans-${script}-${suffix}`] = new Uint8Array(
      await fs.readFile(`public/fonts/indic/noto-sans-${script}-${suffix}`),
    );
files["indic-provenance.json"] = new Uint8Array(
  await fs.readFile("public/fonts/indic/provenance.json"),
);
await fs.writeFile("public/bundles/redlark-type-kit.zip", zipSync(files));
