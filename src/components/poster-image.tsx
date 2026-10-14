import Image from "next/image";
import type { Poster } from "@/lib/types";
export function PosterImage({
  poster,
  priority = false,
  large = false,
}: {
  poster: Poster;
  priority?: boolean;
  large?: boolean;
}) {
  return (
    <picture style={{ backgroundColor: poster.dominantColor }}>
      <source
        type="image/avif"
        sizes={
          large
            ? "(max-width: 768px) 94vw, 48vw"
            : "(max-width: 560px) 46vw, (max-width: 1024px) 30vw, 20vw"
        }
        srcSet={[240, 400, 700]
          .map((w) => `${poster.preview.replace("preview.webp", `preview-${w}.avif`)} ${w}w`)
          .join(", ")}
      />
      <source
        type="image/webp"
        sizes={
          large
            ? "(max-width: 768px) 94vw, 48vw"
            : "(max-width: 560px) 46vw, (max-width: 1024px) 30vw, 20vw"
        }
        srcSet={[240, 400, 700]
          .map((w) => `${poster.preview.replace("preview.webp", `preview-${w}.webp`)} ${w}w`)
          .join(", ")}
      />
      <Image
        src={poster.preview}
        alt={poster.alt}
        width={700}
        height={990}
        sizes={
          large
            ? "(max-width: 768px) 94vw, 48vw"
            : "(max-width: 560px) 46vw, (max-width: 1024px) 30vw, 20vw"
        }
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
      />
    </picture>
  );
}
