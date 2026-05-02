import Image from "next/image";
import styles from "./ascii-art-bg.module.css";

interface AsciiArtBgProps {
  src: string;
  /** Decorative — kept empty by default. Pass a non-empty value only when the image carries semantic meaning. */
  alt?: string;
  /** Where in the card the image anchors. */
  align?: "left" | "right" | "center";
  /** Used by Next/Image responsive sizing. */
  sizes?: string;
}

export function AsciiArtBg({
  src,
  alt = "",
  align = "right",
  sizes = "(min-width: 768px) 66vw, 100vw",
}: AsciiArtBgProps) {
  const alignClass =
    align === "left"
      ? styles.alignLeft
      : align === "center"
        ? styles.alignCenter
        : styles.alignRight;

  return (
    <div aria-hidden={alt === ""} className={styles.root}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={`${styles.image} ${alignClass}`}
        priority={false}
      />
    </div>
  );
}
