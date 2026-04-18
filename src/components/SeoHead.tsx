import { useEffect } from "react";

interface Props {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
}

export default function SeoHead({ title, description, image, url, type = "website" }: Props) {
  useEffect(() => {
    const fullTitle = title.includes("Cofinity") ? title : `${title} | Cofinity`;
    document.title = fullTitle;

    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    if (description) {
      setMeta("description", description);
      setMeta("og:description", description, true);
      setMeta("twitter:description", description);
    }

    setMeta("og:title", fullTitle, true);
    setMeta("og:type", type, true);
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:card", "summary_large_image");

    if (image) {
      setMeta("og:image", image, true);
      setMeta("twitter:image", image);
    }

    if (url || window.location.href) {
      setMeta("og:url", url || window.location.href, true);
    }
  }, [title, description, image, url, type]);

  return null;
}
