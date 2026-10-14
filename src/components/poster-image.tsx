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
      <source type="image/avif" srcSet={poster.preview.replace(".webp", ".avif")} />
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
