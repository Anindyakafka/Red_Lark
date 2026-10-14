import fs from "node:fs/promises";
import { zipSync, strToU8 } from "fflate";
await fs.mkdir("public/bundles", { recursive: true });
const files = {
  "README.txt": strToU8(
    "Mirafra local type kit.\nBebas Neue / IBM Plex Mono. Original upstream fonts, not CC0 artwork.\nBoth retain their SIL Open Font Licence files. Read them before redistribution.\nSources: https://github.com/google/fonts/tree/main/ofl/bebasneue\nhttps://github.com/google/fonts/tree/main/ofl/ibmplexmono\n",
  ),
};
for (const name of [
  "bebas-neue.ttf",
  "ibm-plex-mono.ttf",
  "Bebas-Neue-OFL.txt",
  "IBM-Plex-Mono-OFL.txt",
])
  files[name] = new Uint8Array(await fs.readFile(`public/fonts/${name}`));
await fs.writeFile("public/bundles/mirafra-type-kit.zip", zipSync(files));
