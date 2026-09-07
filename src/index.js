
const RECIPIENT = "info@heatiq.ch";
const SENDER = "auftraege@mail.heatiq.ch";

const formTitles = {
  inbetriebnahme: "Neue Inbetriebnahme",
  wartung: "Neue Wartungsanfrage",
  stoerung: "Neue Störungsmeldung",
  anfrage: "Neue Anfrage",
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function readableKey(key) {
  return key
    .replace(/^_/, "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, m => m.toUpperCase());
}

function makeReference(type) {
  const now = new Date();
  const stamp = now.toISOString().replace(/\D/g, "").slice(0, 14);
  const prefix = type === "inbetriebnahme" ? "IBN" :
                 type === "wartung" ? "WART" :
                 type === "stoerung" ? "STOER" : "ANF";
  return `HIQ-${prefix}-${stamp}`;
}

async function handleForm(request, env) {
  const form = await request.formData();
  const type = String(form.get("_form_type") || "anfrage");
  const title = formTitles[type] || formTitles.anfrage;
  const reference = makeReference(type);

  // Honeypot
  if (String(form.get("website") || "").trim()) {
    return Response.json({ success: true, reference });
  }

  const rows = [];
  const textRows = [];
  const filenames = [];

  for (const [key, value] of form.entries()) {
    if (key === "_form_type" || key === "website") continue;

    if (value instanceof File) {
      if (value.name) filenames.push(`${readableKey(key)}: ${value.name}`);
      continue;
    }

    const val = String(value).trim();
    if (!val) continue;

    rows.push(
      `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7e4;font-weight:700;vertical-align:top;width:36%">${escapeHtml(readableKey(key))}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7e4;vertical-align:top">${escapeHtml(val)}</td>
      </tr>`
    );
    textRows.push(`${readableKey(key)}: ${val}`);
  }

  if (filenames.length) {
    rows.push(
      `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7e4;font-weight:700">Uploads</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7e4">${filenames.map(escapeHtml).join("<br>")}</td></tr>`
    );
    textRows.push("", "Uploads:", ...filenames);
  }

  const ort = String(form.get("standort_ort") || "").trim();
  const name = String(form.get("name") || form.get("firma") || "").trim();

  const subjectBits = [`HeatIQ | ${title}`, reference];
  if (name) subjectBits.push(name);
  if (ort) subjectBits.push(ort);
  const subject = subjectBits.join(" | ");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111718;max-width:760px;margin:auto">
      <div style="padding:24px 28px;background:#172124;color:#fff">
        <div style="font-size:22px;font-weight:900">HEAT<span style="color:#a8d83e">IQ</span></div>
        <div style="margin-top:18px;font-size:12px;letter-spacing:.12em;color:#a8d83e">${escapeHtml(title.toUpperCase())}</div>
        <h1 style="margin:6px 0 0;font-size:28px">${escapeHtml(reference)}</h1>
      </div>
      <div style="padding:24px 28px;background:#fff">
        <p style="margin-top:0;color:#667274">Neue Anfrage über heatiq.ch. In der nächsten Ausbaustufe wird hier zusätzlich automatisch der PDF-Arbeitsauftrag angehängt.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">${rows.join("")}</table>
      </div>
    </div>`;

  const text = [
    "HeatIQ",
    title,
    reference,
    "",
    ...textRows,
    "",
    "Diese Nachricht wurde automatisch über heatiq.ch erstellt."
  ].join("\n");

  try {
    const result = await env.EMAIL.send({
      to: RECIPIENT,
      from: { email: SENDER, name: "HeatIQ Aufträge" },
      replyTo: form.get("email") ? String(form.get("email")) : undefined,
      subject,
      html,
      text
    });

    return Response.json({
      success: true,
      reference,
      messageId: result.messageId
    });
  } catch (error) {
    console.error("Email sending failed", error?.code, error?.message, error);
    return Response.json({
      success: false,
      error: error?.message || "E-Mail-Versand fehlgeschlagen",
      code: error?.code || null
    }, { status: 500 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/form" && request.method === "POST") {
      return handleForm(request, env);
    }

    if (url.pathname.startsWith("/api/")) {
      return Response.json({ success: false, error: "Not found" }, { status: 404 });
    }

    return env.ASSETS.fetch(request);
  }
};
