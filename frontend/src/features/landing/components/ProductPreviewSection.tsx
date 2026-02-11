import { motion } from "motion/react";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { IconButton } from "@/components/ui";

interface PreviewItem {
  src: string;
  caption: string;
}

interface ProductPreviewSectionProps {
  images: PreviewItem[];
}

export default function ProductPreviewSection({
  images,
}: ProductPreviewSectionProps) {
  const scrollerReference = useRef<HTMLDivElement | null>(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  const scrollByAmount = useCallback((direction: "prev" | "next") => {
    const scroller = scrollerReference.current;
    if (!scroller) return;
    let step = scroller.clientWidth * 0.9;
    const firstChild = scroller.firstElementChild as HTMLElement | null;
    if (firstChild) {
      const rect = firstChild.getBoundingClientRect();
      const styles = getComputedStyle(scroller);
      const gapPx = Number.parseFloat(styles.columnGap || styles.gap || "0");
      step = rect.width + gapPx;
    }
    const delta = direction === "next" ? step : -step;
    scroller.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  const handleKey = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollByAmount("next");
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollByAmount("prev");
      }
    },
    [scrollByAmount],
  );

  useEffect(() => {
    const scroller = scrollerReference.current;
    if (!scroller) return;
    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scroller;
      setIsAtStart(scrollLeft <= 0);
      setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - 1);
    };
    update();
    scroller.addEventListener("scroll", update, { passive: true });
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(scroller);
    return () => {
      scroller.removeEventListener("scroll", update);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <section className="w-full py-16" aria-label="Product preview gallery">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">
          See MacroTrackr in Action
        </h2>

        <div className="relative">
          {/* edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-linear-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-background to-transparent" />

          <motion.div
            ref={scrollerReference}
            className="flex snap-x snap-mandatory scroll-p-6 gap-6 overflow-x-auto pb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            tabIndex={0}
            onKeyDown={handleKey}
            aria-roledescription="carousel"
            aria-label="Screenshots"
          >
            {images.map((img, index) => (
              <motion.div
                key={index}
                className="group min-w-70 shrink-0 snap-start overflow-hidden rounded-xl bg-surface ring-1 ring-border md:min-w-100"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <img
                  src={img.src}
                  alt={img.caption}
                  className="h-150 w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  width={800}
                  height={600}
                />
                <div className="p-4 text-center text-sm text-muted">
                  {img.caption}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* controls */}
          <div className="pointer-events-none absolute inset-0 hidden items-center justify-between px-1 sm:flex">
            <div className="pointer-events-auto">
              <IconButton
                variant="custom"
                ariaLabel="Previous"
                onClick={() => scrollByAmount("prev")}
                disabled={isAtStart}
                buttonVariant="ghost"
                className="rounded-full bg-surface! ring-1 ring-border hover:bg-surface-2!"
                icon={
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                }
              />
            </div>
            <div className="pointer-events-auto">
              <IconButton
                variant="custom"
                ariaLabel="Next"
                onClick={() => scrollByAmount("next")}
                disabled={isAtEnd}
                buttonVariant="ghost"
                className="rounded-full bg-surface! ring-1 ring-border hover:bg-surface-2!"
                icon={
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
