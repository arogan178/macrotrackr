import { useEffect } from "react";

interface Meta {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
}

// Small helper to set or create a meta tag
function setMeta(name: string, content?: string, property = false) {
  if (!content) return;
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    if (property) element.setAttribute("property", name);
    else element.setAttribute("name", name);
    document.head.append(element);
  }
  element.setAttribute("content", content);
}

export function usePageMetadata({
  title,
  description,
  canonical,
  ogImage,
  noindex,
}: Meta) {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) document.title = title;

    // Restored on unmount: the app routes client-side, so a noindex left behind
    // by the 404 page would follow the visitor onto every page after it.
    if (noindex) setMeta("robots", "noindex,follow");

    setMeta("description", description);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    if (ogImage) setMeta("twitter:image", ogImage);

    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    if (ogImage) setMeta("og:image", ogImage, true);
    if (canonical) {
      let link = document.head.querySelector("link[rel=canonical]") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.append(link);
      }
      link.setAttribute("href", canonical);
    }

    return () => {
      document.title = previousTitle;
      if (noindex) setMeta("robots", "index,follow");
    };
  }, [title, description, canonical, ogImage, noindex]);
}
