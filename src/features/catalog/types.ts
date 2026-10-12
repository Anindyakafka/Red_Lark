export type AssetKind = "poster" | "sticker";

export interface Artwork {
  id: string;
  slug: string;
  title: string;
  kind: AssetKind;
  collection: string;
  tags: string[];
  description: string;
  previewUrl: string;
  downloadUrl: string;
  background: string;
  format: "SVG";
  license: string;
  demo: boolean;
}
