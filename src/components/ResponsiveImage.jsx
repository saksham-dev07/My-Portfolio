import { useEffect, useRef, useState } from "react";
import { responsiveImages } from "../assets/responsive";
import { prefersLightTransfer } from "../utils/network";

/** Full-resolution fallback; the browser selects density and format candidates. */
export default function ResponsiveImage({
  src,
  sizes = "100vw",
  loading = "lazy",
  alt,
  ...props
}) {
  const image = responsiveImages[src];
  const ref = useRef(null);
  const [visible, setVisible] = useState(loading === "eager");
  useEffect(() => {
    if (visible) return;
    if (loading === "eager" || !window.IntersectionObserver) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: prefersLightTransfer() ? "600px" : "900px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible, loading]);
  if (!image)
    return (
      <img
        ref={ref}
        src={visible ? src : undefined}
        alt={alt}
        loading="eager"
        decoding="async"
        {...props}
      />
    );
  return (
    <picture style={{ display: "contents" }}>
      {image.avif && (
        <source
          type="image/avif"
          srcSet={visible ? image.avif : undefined}
          sizes={sizes}
        />
      )}
      <img
        ref={ref}
        src={visible ? src : undefined}
        srcSet={visible ? image.webp : undefined}
        sizes={sizes}
        alt={alt}
        width={image.width}
        height={image.height}
        loading="eager"
        decoding="async"
        {...props}
      />
    </picture>
  );
}
