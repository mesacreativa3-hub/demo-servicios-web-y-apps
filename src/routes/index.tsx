import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = "https://mesa-creativa.netlify.app";
const TITLE = "Mesa Creativa — Páginas web para negocios en Caracas";
const DESC =
  "Páginas web profesionales para negocios en Caracas: catálogo, menú y WhatsApp directo. Planes desde $120.";
const OG_IMAGE = `${BASE_URL}/media/og-image.jpg`;

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${BASE_URL}/` },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:locale", content: "es_ES" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: `${BASE_URL}/` }],
  }),
});

// La landing vive como archivo único autocontenido en /public/mesa-creativa.html
function Index() {
  return (
    <iframe
      src="/mesa-creativa.html"
      title="Mesa Creativa"
      style={{ border: 0, width: "100%", height: "100vh", display: "block" }}
    />
  );
}
