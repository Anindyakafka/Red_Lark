import { Collection as InteractiveCollection } from "./collection";
import type { Poster } from "@/lib/types";
export function Collection({
  posters,
  ...props
}: {
  posters: Poster[];
  initialTheme?: string;
  heading?: string;
  compact?: boolean;
}) {
  const summaries = posters.map((p) => {
    const copy = { ...p };
    delete copy.studioLayers;
    copy.formats = p.formats.filter(
      (file, index, files) => files.findIndex((f) => f.format === file.format) === index,
    );
    return copy;
  });
  return <InteractiveCollection posters={summaries} {...props} />;
}
