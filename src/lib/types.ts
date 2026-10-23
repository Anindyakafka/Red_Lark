export const LICENSES = {
  "CC0-1.0": {
    derivatives: true,
    commercial: true,
    shareAlike: false,
    url: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  "CC-BY-4.0": {
    derivatives: true,
    commercial: true,
    shareAlike: false,
    url: "https://creativecommons.org/licenses/by/4.0/",
  },
  "CC-BY-SA-4.0": {
    derivatives: true,
    commercial: true,
    shareAlike: true,
    url: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  "CC-BY-NC-4.0": {
    derivatives: true,
    commercial: false,
    shareAlike: false,
    url: "https://creativecommons.org/licenses/by-nc/4.0/",
  },
  "CC-BY-NC-SA-4.0": {
    derivatives: true,
    commercial: false,
    shareAlike: true,
    url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  },
  "CC-BY-ND-4.0": {
    derivatives: false,
    commercial: true,
    shareAlike: false,
    url: "https://creativecommons.org/licenses/by-nd/4.0/",
  },
  "CC-BY-NC-ND-4.0": {
    derivatives: false,
    commercial: false,
    shareAlike: false,
    url: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
  },
} as const;
export type LicenseId = keyof typeof LICENSES;
export interface Artist {
  id: string;
  name: string;
  bio: string;
  links: { label: string; url: string }[];
  supportUrl?: string;
  placeholder: boolean;
  publicContact?: { value: string; consented: boolean };
  publicUpi?: { value: string; consented: boolean };
}
export interface Credit {
  id: string;
  title: string;
  artist: string;
  license: LicenseId;
  source: string;
}
export type LayerKind =
  "text" | "rectangle" | "circle" | "star" | "arrow" | "halftone" | "grain" | "image";
export type FontId = "display" | "mono";
export interface Layer {
  id: string;
  kind: LayerKind;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  text: string;
  font: FontId;
  fontSize: number;
  locked: boolean;
  hidden: boolean;
  image?: string;
  credit?: Credit;
  /** Normalized region of the retained original image; never replaces image bytes. */
  crop?: { x: number; y: number; width: number; height: number };
}
export const PRESETS = {
  A4: { width: 210, height: 297, unit: "mm" },
  A3: { width: 297, height: 420, unit: "mm" },
  A2: { width: 420, height: 594, unit: "mm" },
  "18x24": { width: 457.2, height: 609.6, unit: "mm" },
  Social: { width: 1080, height: 1350, unit: "px" },
} as const;
export type PresetId = keyof typeof PRESETS;
export interface Scene {
  version: 2;
  preset: PresetId;
  background: string;
  colors: 1 | 2 | 3;
  layers: Layer[];
  /** Source attribution survives layer deletion and is never an editing layer. */
  sources?: Credit[];
  exportCredit?: {
    enabled: boolean;
    x: number;
    y: number;
    width: number;
    fontSize: number;
    color: string;
    background: string;
  };
}
export interface PosterFile {
  format: "PDF" | "PNG" | "JPEG" | "SVG" | "ZIP";
  size: "A4" | "A3" | "A2" | "18x24" | "Bundle";
  path: string;
  bytes: number;
  dpi?: number;
  pixelWidth?: number;
  pixelHeight?: number;
}
export interface Poster {
  categories: string[];
  tags: string[];
  kind: string;
  imageCode: string;
  captionCode: string;
  aiUse: "none" | "minimal-assisted" | "generated";
  aiDisclosure: string;
  translations?: Partial<
    Record<
      "en" | "hi" | "bn" | "ml",
      { title: string; caption: string; tags: string[]; reviewed: boolean }
    >
  >;
  slug: string;
  title: string;
  titleOriginal?: string;
  languages: string[];
  artist: string;
  year: number;
  createdAt?: string;
  themes: string[];
  movements: string[];
  colorMode: "bw" | "color";
  region: string;
  formats: PosterFile[];
  license: LicenseId;
  licenseUrl: string;
  allowsDerivatives: boolean;
  commercialUseAllowed: boolean;
  source: string;
  artistUrl: string;
  alt: string;
  caption: string;
  remixable: boolean;
  placeholder: boolean;
  preview: string;
  dominantColor: string;
  /** Collection records are usable; retained records remain visible only in the historical Archive. */
  archiveStatus?: "usable" | "archive-only";
  studioLayers?: Scene;
  // Approved, owned R2 raster base, fetched and re-encoded locally by the Studio.
  remixImage?: string;
  publicContact?: Artist["publicContact"];
  publicUpi?: Artist["publicUpi"];
}
