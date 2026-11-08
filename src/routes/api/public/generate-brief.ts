import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const schema = z.object({
  negocio: z.string().trim().min(2).max(120),
  servicios: z.string().trim().min(5).max(1200),
  estilo: z.string().trim().min(2).max(300),
});

const SYSTEM = `Eres el estratega web de Mesa Creativa, un estudio en Caracas, Venezuela, que crea páginas web para negocios.
Con la información del cliente redacta un brief breve en español venezolano (cercano y profesional), en texto plano sin markdown ni asteriscos, con estas partes:
NEGOCIO: una línea.
OBJETIVO DE LA WEB: 1-2 líneas.
SECCIONES RECOMENDADAS: lista con guiones.
ESTILO VISUAL: colores, tipografía y sensación.
PLAN SUGERIDO: uno de Landing Emprendedor ($120), Web Catálogo + Menú ($190) o Web Pro a Medida (desde $290), con una línea de por qué.
Máximo 180 palabras. No inventes datos de contacto.`;

export const Route = createFileRoute("/api/public/generate-brief")({
  server: {
    handlers: {
      POST: async ({ request }) => {
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
        const { negocio, servicios, estilo } = parsed.data;
        try {
          const { generateResponse } = await import("@lovable.dev/ai-gateway");
          const r = await generateResponse({
            model: "openai/gpt-6-astra",
            instructions: SYSTEM,
            input: `Negocio: ${negocio}\nServicios/productos: ${servicios}\nEstilo deseado: ${estilo}`,
          });
          let text = "";
          for (const item of r.output ?? []) {
            if (item.type === "message") {
              for (const c of item.content) if (c.type === "output_text") text += c.text;
            }
          }
          if (!text.trim()) throw new Error("empty");
          return Response.json({ brief: text.trim() });
        } catch (e) {
          console.error("generate-brief failed", e);
          return Response.json(
            { error: "No pudimos generar el brief ahora. Intenta de nuevo en un momento." },
            { status: 502 },
          );
        }
      },
    },
  },
});
