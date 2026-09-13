import { useEffect, useState } from "react";
import { assetPath } from "../lib/asset-path";

type ChunkedSvgImageProps = {
  assetName: string;
  partCount: number;
  alt: string;
  className?: string;
};

/**
 * Loads a large SVG from small static chunks. GitHub's contents API rejects
 * very large JSON uploads, while the browser can safely reassemble the same
 * bytes into a Blob before displaying it.
 */
export function ChunkedSvgImage({ assetName, partCount, alt, className }: ChunkedSvgImageProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    const load = async () => {
      try {
        const parts = await Promise.all(
          Array.from({ length: partCount }, (_, index) => {
            const suffix = String(index).padStart(3, "0");
            return fetch(assetPath(`${assetName}.part-${suffix}`)).then((response) => {
              if (!response.ok) throw new Error(`Unable to load ${assetName} part ${index}`);
              return response.arrayBuffer();
            });
          }),
        );
        const totalLength = parts.reduce((sum, part) => sum + part.byteLength, 0);
        const merged = new Uint8Array(totalLength);
        let offset = 0;
        for (const part of parts) {
          merged.set(new Uint8Array(part), offset);
          offset += part.byteLength;
        }
        objectUrl = URL.createObjectURL(new Blob([merged], { type: "image/svg+xml" }));
        if (!cancelled) setSrc(objectUrl);
      } catch {
        // Local development keeps the original file as a convenient fallback.
        if (!cancelled) setSrc(assetPath(`${assetName}.svg`));
      }
    };

    void load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [assetName, partCount]);

  if (!src) return <span className={className} aria-hidden="true" />;
  return <img className={className} src={src} alt={alt} loading="lazy" decoding="async" draggable={false} />;
}
