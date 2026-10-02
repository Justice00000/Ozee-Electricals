import { useEffect, useRef } from "react";

/** Muted looping hero video; stays paused for users who prefer reduced motion. */
export function HeroVideo({
  src,
  poster,
  className = "h-full w-full object-cover",
}: {
  src: string;
  poster: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
    }
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-label="Ozee Electrical showroom video"
    />
  );
}
