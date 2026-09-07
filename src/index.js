const RECIPIENT = "info@heatiq.ch";
const SENDER = "auftraege@mail.heatiq.ch";

const formTitles = {
  inbetriebnahme: "Neue Inbetriebnahme",
  wartung: "Neue Wartungsanfrage",
  stoerung: "Neue Störungsmeldung",
  anfrage: "Neue Anfrage",
};

const fieldLabels = {
  kundentyp: "Kundentyp",
  vorname: "Vorname",
  name: "Name",
  firma: "Firma",
  email: "E-Mail",
  telefon: "Telefon",

  standort_strasse: "Standort Strasse",
  standort_plz: "Standort PLZ",
  standort_ort: "Standort Ort",

  hersteller: "Hersteller",
  modell: "Modell",
  seriennummer: "Seriennummer",
  projekt: "Projekt",
  gebaeudetyp: "Gebäudetyp",
  waermeverteilung: "Wärmeverteilung",
  warmwasser: "Warmwasser",
  pufferspeicher: "Pufferspeicher",
  zusatzheizung: "Zusatzheizung",

  termin1: "Gewünschter IBN-Termin",
  termin2: "Ersatztermin",
  dringlichkeit: "Dringlichkeit",
  bemerkungen: "Bemerkungen",
};

const statusLabels = {
  "Wärmepumpe montiert": "Wärmepumpe montiert",
  "Hydraulik fertiggestellt": "Hydraulik fertiggestellt",
  "Gefüllt und entlüftet": "Gefüllt und entlüftet",
  "Elektroanschluss fertig": "Elektroanschluss fertig",
  "Aussengerät/Wärmequelle fertig": "Aussengerät/Wärmequelle fertig",
  "Bus/Kommunikation fertig": "Bus/Kommunikation fertig",
  "Anlage betriebsbereit": "Anlage betriebsbereit",
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function readableKey(key) {
  return fieldLabels[key] || key
    .replace(/^_/, "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, m => m.toUpperCase());
}

function makeReference(type) {
  const now = new Date();
  const stamp = now.toISOString().replace(/\D/g, "").slice(0, 14);

  const prefix =
    type === "inbetriebnahme" ? "IBN" :
    type === "wartung" ? "WART" :
    type === "stoerung" ? "STOER" :
    "ANF";

  return `HIQ-${prefix}-${stamp}`;
}

function formatDate(value) {
  if (!value) return "";

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) return value;

  return `${match[3]}.${match[2]}.${match[1]}`;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }

  return btoa(binary);
}

async function handleForm(request, env) {
  const form = await request.formData();

  const type = String(form.get("_form_type") || "anfrage");
  const title = formTitles[type] || formTitles.anfrage;
  const reference = makeReference(type);

  // Honeypot
  if (String(form.get("website") || "").trim()) {
    return Response.json({
      success: true,
      reference
    });
  }

  const rows = [];
  const textRows = [];
  const attachments = [];

  /*
   * Installationsstatus separat behandeln.
   * Dadurch erscheinen auch NICHT angekreuzte Punkte.
   */
  const selectedStatuses = form
    .getAll("status")
    .map(value => String(value));

  for (const [key, value] of form.entries()) {
    if (
      key === "_form_type" ||
      key === "website" ||
      key === "status"
    ) {
      continue;
    }

    if (value instanceof File) {
      if (!value.name || value.size === 0) continue;

      const buffer = await value.arrayBuffer();

      const buffer = await value.arrayBuffer();
const bytes = new Uint8Array(buffer);

attachments.push({
  content: bytes,
  filename: value.name,
  type: value.type || "application/octet-stream",
  disposition: "attachment",
});

      continue;
    }

    let val = String(value).trim();

    if (!val) continue;

    if (key === "termin1" || key === "termin2") {
      val = formatDate(val);
    }

    rows.push(`
      <tr>
        <td style="
          padding:8px 12px;
          border-bottom:1px solid #e5e7e4;
          font-weight:700;
          vertical-align:top;
          width:36%;
        ">
          ${escapeHtml(readableKey(key))}
        </td>

        <td style="
          padding:8px 12px;
          border-bottom:1px solid #e5e7e4;
          vertical-align:top;
        ">
          ${escapeHtml(val)}
        </td>
      </tr>
    `);

    textRows.push(`${readableKey(key)}: ${val}`);
  }

  /*
   * Installationsstatus nur bei Inbetriebnahmen anzeigen.
   */
  let statusHtml = "";
  let statusText = [];

  if (type === "inbetriebnahme") {
    const statusRows = Object.values(statusLabels)
      .map(label => {
        const checked = selectedStatuses.includes(label);

        return `
          <tr>
            <td style="
              padding:7px 12px;
              border-bottom:1px solid #e5e7e4;
              width:36%;
              font-weight:700;
            ">
              ${checked ? "☑" : "☐"}
            </td>

            <td style="
              padding:7px 12px;
              border-bottom:1px solid #e5e7e4;
            ">
              ${escapeHtml(label)}
            </td>
          </tr>
        `;
      })
      .join("");

    statusHtml = `
      <div style="margin-top:28px;">
        <div style="
          font-size:13px;
          font-weight:800;
          letter-spacing:.08em;
          text-transform:uppercase;
          margin-bottom:8px;
          color:#667274;
        ">
          Installationsstatus
        </div>

        <table style="
          width:100%;
          border-collapse:collapse;
          font-size:14px;
        ">
          ${statusRows}
        </table>
      </div>
    `;

    statusText = [
      "",
      "Installationsstatus:",
      ...Object.values(statusLabels).map(label =>
        `${selectedStatuses.includes(label) ? "[X]" : "[ ]"} ${label}`
      )
    ];
  }

  const ort = String(form.get("standort_ort") || "").trim();
  const name = String(
    form.get("name") ||
    form.get("firma") ||
    ""
  ).trim();

  const subjectBits = [
    `HeatIQ | ${title}`,
    reference
  ];

  if (name) subjectBits.push(name);
  if (ort) subjectBits.push(ort);

  const subject = subjectBits.join(" | ");

  const html = `
    <div style="
      font-family:Arial,Helvetica,sans-serif;
      color:#111718;
      max-width:760px;
      margin:auto;
    ">

      <div style="
        padding:24px 28px;
        background:#172124;
        color:#fff;
      ">

        <div style="
          font-size:22px;
          font-weight:900;
        ">
          HEAT<span style="color:#a8d83e">IQ</span>
        </div>

        <div style="
          margin-top:18px;
          font-size:12px;
          letter-spacing:.12em;
          color:#a8d83e;
        ">
          ${escapeHtml(title.toUpperCase())}
        </div>

        <h1 style="
          margin:6px 0 0;
          font-size:28px;
        ">
          ${escapeHtml(reference)}
        </h1>

      </div>

      <div style="
        padding:24px 28px;
        background:#fff;
      ">

        <p style="
          margin-top:0;
          color:#667274;
        ">
          Neue Anfrage über heatiq.ch.
          Hochgeladene Dateien befinden sich im Anhang dieser E-Mail.
        </p>

        <table style="
          width:100%;
          border-collapse:collapse;
          font-size:14px;
        ">
          ${rows.join("")}
        </table>

        ${statusHtml}

      </div>
    </div>
  `;

  const text = [
    "HeatIQ",
    title,
    reference,
    "",
    ...textRows,
    ...statusText,
    "",
    attachments.length
      ? `Anhänge: ${attachments.map(a => a.filename).join(", ")}`
      : "Anhänge: keine",
    "",
    "Diese Nachricht wurde automatisch über heatiq.ch erstellt."
  ].join("\n");

  try {
    const result = await env.EMAIL.send({
      to: RECIPIENT,

      from: {
        email: SENDER,
        name: "HeatIQ Aufträge"
      },

      replyTo: form.get("email")
        ? String(form.get("email"))
        : undefined,

      subject,
      html,
      text,

      attachments
    });

    return Response.json({
      success: true,
      reference,
      messageId: result.messageId
    });

  } catch (error) {

    console.error(
      "Email sending failed",
      error?.code,
      error?.message,
      error
    );

    return Response.json({
      success: false,
      error: error?.message || "E-Mail-Versand fehlgeschlagen",
      code: error?.code || null
    }, {
      status: 500
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (
      url.pathname === "/api/form" &&
      request.method === "POST"
    ) {
      return handleForm(request, env);
    }

    if (url.pathname.startsWith("/api/")) {
      return Response.json({
        success: false,
        error: "Not found"
      }, {
        status: 404
      });
    }

    return env.ASSETS.fetch(request);
  }
};
