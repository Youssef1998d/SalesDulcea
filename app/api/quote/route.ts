import { Resend } from "resend";
import { quoteSchema } from "@/lib/quote";
import { site } from "@/lib/site";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = quoteSchema.safeParse(json);
  if (!parsed.success) return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  const q = parsed.data;
  if (q.website) return Response.json({ ok: true }); // bot: pretend success

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return Response.json({ ok: false, error: "not_configured" }, { status: 503 });

  const rows = q.items.map((i) => `<li>${esc(i.name)} — ${esc(i.quantity || "?")}</li>`).join("");
  const html = `
    <h2>Nouvelle demande de devis</h2>
    <p><b>Établissement :</b> ${esc(q.company)}<br><b>Contact :</b> ${esc(q.name)}<br>
    <b>Téléphone :</b> ${esc(q.phone)}<br><b>E-mail :</b> ${esc(q.email || "—")}<br><b>Ville :</b> ${esc(q.city || "—")}</p>
    <p><b>Produits :</b></p><ul>${rows}</ul>
    <p><b>Personnalisation logo :</b> ${q.logo ? "oui" : "non"}</p>
    <p><b>Message :</b><br>${esc(q.message || "—").replace(/\n/g, "<br>")}</p>`;

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.QUOTE_FROM ?? "Dulcéa Site <onboarding@resend.dev>",
    to: [site.email],
    replyTo: q.email || undefined,
    subject: `Devis — ${q.company}`,
    html,
  });
  if (error) return Response.json({ ok: false, error: "send_failed" }, { status: 502 });
  return Response.json({ ok: true });
}
