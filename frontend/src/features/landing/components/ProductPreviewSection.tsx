import { motion } from "framer-motion";

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
  return (
    <section className="w-full bg-background py-16">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-8 text-center text-3xl font-bold">
          See MacroTrackr in Action
        </h2>

        <motion.div
          className="flex gap-6 overflow-x-auto pb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {images.map((img, index) => (
            <motion.div
              key={index}
              className="min-w-70 flex-shrink-0 overflow-hidden rounded-2xl bg-surface shadow-surface md:min-w-100"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <img
                src={img.src}
                alt={img.caption}
                className="h-150 w-full object-cover"
              />
              <div className="p-4 text-center text-sm  text-muted">
                {img.caption}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
