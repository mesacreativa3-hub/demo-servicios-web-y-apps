import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const ESTILOS = [
  "Minimalista y elegante",
  "Moderno y tecnológico",
  "Clásico y formal",
  "Cálido y artesanal",
  "Colorido y juvenil",
] as const;

const schema = z.object({
  negocio: z.string().trim().min(2).max(120),
  servicios: z.string().trim().min(5).max(1200),
});

const outSchema = z.object({
  nombre: z.string().min(1).max(40),
  eslogan: z.string().min(1).max(70),
  servicios: z
    .array(z.object({ titulo: z.string().min(1).max(28), detalle: z.string().min(1).max(60) }))
    .length(3),
  cta: z.string().min(1).max(22),
  ordenEstilos: z
    .array(z.enum(ESTILOS))
    .length(5)
    .refine((a) => new Set(a).size === 5),
});

// Ad-hoc in-memory limit (per worker instance, best effort): 5 requests/min per IP.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (arr.length >= 5) {
    hits.set(ip, arr);
    return true;
  }
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < 60_000)) hits.delete(k);
  return false;
}

const SYSTEM = `Eres el estratega web de Mesa Creativa (Caracas, Venezuela). Con los datos del negocio responde SOLO un objeto JSON válido, sin markdown ni texto extra, con esta forma exacta:
{"nombre": string (máx 40), "eslogan": string (máx 70), "servicios": [{"titulo": string (máx 28), "detalle": string (máx 60)}, x3 exactamente], "cta": string (máx 22), "ordenEstilos": [los 5 nombres exactos ${JSON.stringify(ESTILOS)} ordenados del más al menos adecuado para ese negocio]}
Español venezolano, cercano y profesional. No inventes datos de contacto ni precios.`;

export const Route = createFileRoute("/api/public/generate-preview")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip =
          request.headers.get("cf-connecting-ip") ||
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          "unknown";
        if (limited(ip)) {
          return Response.json({ error: "Demasiadas solicitudes. Espera un momento." }, { status: 429 });
        }
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Solicitud inválida" }, { status: 400 });
        }
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "Completa todos los campos" }, { status: 400 });
        }
        const { negocio, servicios } = parsed.data;
        try {
          const { generateResponse } = await import("@lovable.dev/ai-gateway");
          const r = await generateResponse({
            model: "openai/gpt-6-astra",
            instructions: SYSTEM,
            input: `Negocio: ${negocio}\nServicios/productos: ${servicios}`,
          });
          let text = "";
          for (const item of r.output ?? []) {
            if (item.type === "message") {
              for (const c of item.content) if (c.type === "output_text") text += c.text;
            }
          }
          const m = text.match(/\{[\s\S]*\}/);
          if (!m) throw new Error("no json");
          const out = outSchema.safeParse(JSON.parse(m[0]));
          if (!out.success) throw new Error("invalid json");
          return Response.json(out.data);
        } catch (e) {
          console.error("generate-preview failed", e);
          return Response.json(
            { error: "No pudimos analizar tu negocio ahora. Intenta de nuevo en un momento." },
            { status: 502 },
          );
        }
      },
    },
  },
});
