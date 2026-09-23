import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { site } from "@/data/site";

// Formulario de contacto: valida con Zod, descarta bots por honeypot y limita
// intentos por IP. Envía con Resend a la dirección de RESEND_TO.

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  message: z.string().trim().min(10).max(5000),
  /** Honeypot: campo oculto que las personas no llenan. */
  website: z.string().max(0).optional().or(z.literal("")),
});

// Rate limit en memoria: 5 envíos por IP cada 10 minutos. En serverless cada
// instancia lleva su propia cuenta, suficiente para frenar abuso simple.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.set(ip, recent);
  if (recent.length >= MAX_PER_WINDOW) return true;
  recent.push(now);
  return false;
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.RESEND_TO;
  if (!apiKey || !to) {
    return NextResponse.json({ error: "disabled" }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (limited(ip)) {
    return NextResponse.json({ error: "too_many" }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const { name, email, message, website } = parsed.data;
  // A un bot que llenó el honeypot se le responde como si todo hubiera ido bien.
  if (website) return NextResponse.json({ ok: true });

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    // Sin dominio verificado, Resend solo permite onboarding@resend.dev y entrega
    // únicamente al correo de la cuenta. Con dominio, definir RESEND_FROM.
    from: process.env.RESEND_FROM ?? `${site.name} <onboarding@resend.dev>`,
    to,
    replyTo: email,
    subject: `${site.name}: mensaje de ${name}`,
    text: `${name}\n${email}\n\n${message}`,
  });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "send_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
