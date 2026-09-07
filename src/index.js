const RECIPIENT = "info@heatiq.ch";
const SENDER = "auftraege@mail.heatiq.ch";


/* =========================================================
   FORMULARTITEL
   ========================================================= */

const formTitles = {
  inbetriebnahme: "Neue Inbetriebnahme",
  wartung: "Neue Wartungsanfrage",
  stoerung: "Neue Störungsmeldung",
  anfrage: "Neue Anfrage",
};


/* =========================================================
   INSTALLATIONSSTATUS
   ========================================================= */

const statusLabels = [
  "Wärmepumpe montiert",
  "Hydraulik fertiggestellt",
  "Gefüllt und entlüftet",
  "Elektroanschluss fertig",
  "Aussengerät/Wärmequelle fertig",
  "Bus/Kommunikation fertig",
  "Anlage betriebsbereit",
];


/* =========================================================
   HILFSFUNKTIONEN
   ========================================================= */

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}


function formatDate(value) {
  if (!value) return "";

  const match = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) return String(value);

  return `${match[3]}.${match[2]}.${match[1]}`;
}


function makeReference(type) {
  const now = new Date();

  const stamp = now
    .toISOString()
    .replace(/\D/g, "")
    .slice(0, 14);

  const prefix =
    type === "inbetriebnahme" ? "IBN" :
    type === "wartung" ? "WART" :
    type === "stoerung" ? "STOER" :
    "ANF";

  return `HIQ-${prefix}-${stamp}`;
}


function value(form, key) {
  return String(form.get(key) || "").trim();
}


function dateValue(form, key) {
  return formatDate(value(form, key));
}


function yesNo(value) {
  return value ? value : "—";
}


/* =========================================================
   E-MAIL DESIGN
   ========================================================= */

function section(title, content) {
  return `
    <div style="
      margin:0 0 20px;
      border:1px solid #d8dfda;
      border-radius:14px;
      overflow:hidden;
      background:#ffffff;
    ">

      <div style="
        padding:15px 20px;
        background:#f7f8f4;
        border-bottom:1px solid #d8dfda;
        font-size:13px;
        font-weight:800;
        letter-spacing:.08em;
        text-transform:uppercase;
        color:#667274;
      ">
        ${escapeHtml(title)}
      </div>

      <div style="
        padding:18px 20px;
      ">
        ${content}
      </div>

    </div>
  `;
}


function row(label, val) {
  if (
    val === undefined ||
    val === null ||
    String(val).trim() === ""
  ) {
    return "";
  }

  return `
    <tr>

      <td style="
        width:38%;
        padding:9px 12px 9px 0;
        border-bottom:1px solid #edf0ed;
        vertical-align:top;
        color:#667274;
        font-size:13px;
        font-weight:700;
      ">
        ${escapeHtml(label)}
      </td>

      <td style="
        padding:9px 0;
        border-bottom:1px solid #edf0ed;
        vertical-align:top;
        color:#111718;
        font-size:14px;
        font-weight:600;
      ">
        ${escapeHtml(val)}
      </td>

    </tr>
  `;
}


function table(rows) {
  return `
    <table
      role="presentation"
      cellpadding="0"
      cellspacing="0"
      style="
        width:100%;
        border-collapse:collapse;
      "
    >
      ${rows}
    </table>
  `;
}


/* =========================================================
   INSTALLATIONSSTATUS DESIGN
   ========================================================= */

function statusCard(label, checked) {
  return `
    <div style="
      margin:0 0 8px;
      padding:11px 13px;
      border:1px solid ${checked ? "#b8dc70" : "#d8dfda"};
      border-radius:10px;
      background:${checked ? "#f5faea" : "#fbfcf9"};
      font-size:14px;
      font-weight:700;
      color:${checked ? "#27351a" : "#77817f"};
    ">

      <span style="
        display:inline-block;
        width:22px;
        color:${checked ? "#79a91e" : "#a4adaa"};
        font-size:17px;
      ">
        ${checked ? "✓" : "○"}
      </span>

      ${escapeHtml(label)}

    </div>
  `;
}


/* =========================================================
   INBETRIEBNAHME E-MAIL
   ========================================================= */

function buildInbetriebnahmeEmail(
  form,
  reference,
  selectedStatuses,
  attachments
) {

  const kontaktGleich =
    value(form, "kontakt_vor_ort_gleich") === "Ja";

  const standortGleich =
    value(form, "standort_gleich") === "Ja";


  /* ---------------------------------------------------------
     Auftraggeber
     --------------------------------------------------------- */

  const auftraggeber = section(
    "01 · Auftraggeber & Rechnungsadresse",

    table(
      row("Auftraggeber", value(form, "kundentyp")) +
      row("Firma", value(form, "firma")) +
      row(
        "Name",
        [
          value(form, "vorname"),
          value(form, "name")
        ].filter(Boolean).join(" ")
      ) +
      row(
        "Strasse / Nr.",
        value(form, "auftraggeber_strasse")
      ) +
      row(
        "PLZ / Ort",
        [
          value(form, "auftraggeber_plz"),
          value(form, "auftraggeber_ort")
        ].filter(Boolean).join(" ")
      )
    )
  );


  /* ---------------------------------------------------------
     Kontakt für Rückfragen
     --------------------------------------------------------- */

  const kontakt = section(
    "02 · Kontakt für Rückfragen",

    table(
      row(
        "Name",
        [
          value(form, "kontakt_vorname"),
          value(form, "kontakt_name")
        ].filter(Boolean).join(" ")
      ) +
      row(
        "Telefon",
        value(form, "kontakt_telefon")
      ) +
      row(
        "E-Mail",
        value(form, "kontakt_email")
      )
    )
  );


  /* ---------------------------------------------------------
     Kontakt vor Ort
     --------------------------------------------------------- */

  const vorOrtHinweis = kontaktGleich
    ? `
      <div style="
        margin-bottom:12px;
        padding:9px 12px;
        background:#f5faea;
        border-radius:9px;
        color:#526c24;
        font-size:12px;
        font-weight:700;
      ">
        ✓ Entspricht Kontakt für Rückfragen
      </div>
    `
    : "";


  const vorOrt = section(
    "03 · Kontaktperson vor Ort",

    vorOrtHinweis +

    table(
      row(
        "Name",
        [
          value(form, "vorort_vorname"),
          value(form, "vorort_name")
        ].filter(Boolean).join(" ")
      ) +
      row(
        "Telefon",
        value(form, "vorort_telefon")
      ) +
      row(
        "E-Mail",
        value(form, "vorort_email")
      )
    )
  );


  /* ---------------------------------------------------------
     Anlagenstandort
     --------------------------------------------------------- */

  const standortHinweis = standortGleich
    ? `
      <div style="
        margin-bottom:12px;
        padding:9px 12px;
        background:#f5faea;
        border-radius:9px;
        color:#526c24;
        font-size:12px;
        font-weight:700;
      ">
        ✓ Entspricht Auftraggeber / Rechnungsadresse
      </div>
    `
    : "";


  const standort = section(
    "04 · Standort der Anlage",

    standortHinweis +

    table(
      row(
        "Strasse / Nr.",
        value(form, "standort_strasse")
      ) +
      row(
        "PLZ / Ort",
        [
          value(form, "standort_plz"),
          value(form, "standort_ort")
        ].filter(Boolean).join(" ")
      ) +
      row(
        "Zugangshinweis",
        value(form, "standort_zugang")
      )
    )
  );


  /* ---------------------------------------------------------
     Wärmepumpe
     --------------------------------------------------------- */

  const anlage = section(
    "05 · Wärmepumpe & Anlage",

    table(
      row(
        "Hersteller",
        value(form, "hersteller")
      ) +
      row(
        "Modell / Typ",
        value(form, "modell")
      ) +
      row(
        "Seriennummer",
        value(form, "seriennummer")
      ) +
      row(
        "Heizleistung",
        value(form, "heizleistung")
      ) +
      row(
        "Gebäudetyp",
        value(form, "gebaeudetyp")
      ) +
      row(
        "Projekt",
        value(form, "projekt")
      ) +
      row(
        "Wärmeabgabe",
        value(form, "waermeabgabe")
      ) +
      row(
        "Warmwasser über Wärmepumpe",
        value(form, "warmwasser")
      ) +
      row(
        "Pufferspeicher",
        value(form, "puffer")
      ) +
      row(
        "Zusatzheizung / Elektroheizstab",
        value(form, "zusatzheizung")
      )
    )
  );


  /* ---------------------------------------------------------
     Installationsstatus
     --------------------------------------------------------- */

  const statusContent = statusLabels
    .map(label =>
      statusCard(
        label,
        selectedStatuses.includes(label)
      )
    )
    .join("");


  const status = section(
    "06 · Stand der Installation",
    statusContent
  );


  /* ---------------------------------------------------------
     Termin
     --------------------------------------------------------- */

  let dringlichkeit =
    value(form, "dringlichkeit") || "Normal";


  let dringlichkeitHtml = `
    <div style="
      margin-top:14px;
      padding:12px 14px;
      border-radius:10px;
      background:${
        dringlichkeit === "Normal"
          ? "#f7f8f4"
          : "#fff6e8"
      };
      border:1px solid ${
        dringlichkeit === "Normal"
          ? "#d8dfda"
          : "#e8c98e"
      };
    ">

      <div style="
        font-size:11px;
        font-weight:800;
        letter-spacing:.08em;
        text-transform:uppercase;
        color:#7a8583;
        margin-bottom:4px;
      ">
        Dringlichkeit
      </div>

      <div style="
        font-size:15px;
        font-weight:800;
        color:#111718;
      ">
        ${escapeHtml(dringlichkeit)}
      </div>

    </div>
  `;


  const termin = section(
    "07 · Wunschtermin",

    table(
      row(
        "Gewünschter IBN-Termin",
        dateValue(form, "termin1")
      ) +
      row(
        "Ersatztermin",
        dateValue(form, "termin2")
      )
    ) +

    dringlichkeitHtml
  );


  /* ---------------------------------------------------------
     Unterlagen
     --------------------------------------------------------- */

  const attachmentNames =
    attachments.length
      ? attachments
          .map(a => escapeHtml(a.filename))
          .join("<br>")
      : "Keine Dateien hochgeladen";


  const unterlagen = section(
    "08 · Unterlagen & Bemerkungen",

    table(
      row(
        "Anhänge",
        attachments.length
          ? attachments
              .map(a => a.filename)
              .join(", ")
          : "Keine"
      ) +
      row(
        "Bemerkungen",
        value(form, "bemerkungen")
      )
    )
  );


  /* ---------------------------------------------------------
     Ganze Mail
     --------------------------------------------------------- */

  return `
    <!doctype html>

    <html>

    <body style="
      margin:0;
      padding:0;
      background:#f3f5f1;
    ">

      <div style="
        width:100%;
        background:#f3f5f1;
        padding:28px 0;
      ">

        <div style="
          max-width:760px;
          margin:0 auto;
          font-family:Arial,Helvetica,sans-serif;
          color:#111718;
        ">


          <!-- HEADER -->

          <div style="
            padding:28px 30px;
            background:#172124;
            border-radius:16px 16px 0 0;
            color:#ffffff;
          ">

            <div style="
              font-size:24px;
              font-weight:900;
              letter-spacing:-1px;
            ">
              HEAT<span style="color:#9bd82e;">IQ</span>
            </div>


            <div style="
              margin-top:24px;
              font-size:12px;
              font-weight:800;
              letter-spacing:.12em;
              color:#9bd82e;
              text-transform:uppercase;
            ">
              Neue Inbetriebnahme
            </div>


            <div style="
              margin-top:6px;
              font-size:27px;
              line-height:1.2;
              font-weight:800;
            ">
              ${escapeHtml(reference)}
            </div>

          </div>


          <!-- INFO -->

          <div style="
            padding:22px 30px;
            background:#ffffff;
            border-left:1px solid #d8dfda;
            border-right:1px solid #d8dfda;
          ">

            <div style="
              font-size:15px;
              font-weight:700;
              color:#111718;
            ">
              Neue Inbetriebnahme über heatiq.ch
            </div>

            <div style="
              margin-top:5px;
              color:#7a8583;
              font-size:13px;
              line-height:1.5;
            ">
              Alle Angaben aus der Anmeldung sind nachfolgend
              nach Bereichen gegliedert. Hochgeladene Dateien
              befinden sich im Anhang dieser E-Mail.
            </div>

          </div>


          <!-- CONTENT -->

          <div style="
            padding:24px;
            background:#f7f8f4;
            border:1px solid #d8dfda;
            border-top:0;
            border-radius:0 0 16px 16px;
          ">

            ${auftraggeber}

            ${kontakt}

            ${vorOrt}

            ${standort}

            ${anlage}

            ${status}

            ${termin}

            ${unterlagen}

          </div>


          <!-- FOOTER -->

          <div style="
            padding:18px 8px 0;
            text-align:center;
            color:#8a9492;
            font-size:11px;
            line-height:1.5;
          ">

            Automatisch erstellt über heatiq.ch<br>
            Referenz ${escapeHtml(reference)}

          </div>

        </div>

      </div>

    </body>

    </html>
  `;
}


/* =========================================================
   STANDARD E-MAIL
   Wartung / Störung bleiben weiterhin funktionsfähig
   ========================================================= */

function readableKey(key) {
  return key
    .replace(/^_/, "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, m => m.toUpperCase());
}


function buildStandardEmail(
  form,
  title,
  reference,
  attachments
) {

  let rows = "";

  for (const [key, item] of form.entries()) {

    if (
      key === "_form_type" ||
      key === "website"
    ) {
      continue;
    }


    if (item instanceof File) {
      continue;
    }


    let val = String(item).trim();

    if (!val) continue;


    if (
      key === "termin1" ||
      key === "termin2"
    ) {
      val = formatDate(val);
    }


    rows += row(
      readableKey(key),
      val
    );
  }


  return `
    <div style="
      max-width:760px;
      margin:auto;
      font-family:Arial,Helvetica,sans-serif;
      color:#111718;
    ">

      <div style="
        padding:26px 28px;
        background:#172124;
        color:#ffffff;
      ">

        <div style="
          font-size:23px;
          font-weight:900;
        ">
          HEAT<span style="color:#9bd82e;">IQ</span>
        </div>

        <div style="
          margin-top:20px;
          color:#9bd82e;
          font-size:12px;
          font-weight:800;
          letter-spacing:.1em;
          text-transform:uppercase;
        ">
          ${escapeHtml(title)}
        </div>

        <div style="
          margin-top:5px;
          font-size:26px;
          font-weight:800;
        ">
          ${escapeHtml(reference)}
        </div>

      </div>


      <div style="
        padding:25px;
        background:#f7f8f4;
      ">

        ${section(
          "Angaben",
          table(rows)
        )}

        ${section(
          "Anhänge",
          table(
            row(
              "Dateien",
              attachments.length
                ? attachments
                    .map(a => a.filename)
                    .join(", ")
                : "Keine"
            )
          )
        )}

      </div>

    </div>
  `;
}


/* =========================================================
   TEXTVERSION
   ========================================================= */

function buildText(
  form,
  title,
  reference,
  selectedStatuses,
  attachments
) {

  const lines = [
    "HEATIQ",
    title,
    reference,
    ""
  ];


  for (const [key, item] of form.entries()) {

    if (
      key === "_form_type" ||
      key === "website" ||
      key === "status" ||
      item instanceof File
    ) {
      continue;
    }


    let val = String(item).trim();

    if (!val) continue;


    if (
      key === "termin1" ||
      key === "termin2"
    ) {
      val = formatDate(val);
    }


    lines.push(
      `${readableKey(key)}: ${val}`
    );
  }


  if (selectedStatuses.length) {

    lines.push(
      "",
      "INSTALLATIONSSTATUS"
    );


    for (const label of statusLabels) {

      lines.push(
        `${selectedStatuses.includes(label) ? "[X]" : "[ ]"} ${label}`
      );

    }

  }


  lines.push(
    "",
    attachments.length
      ? `Anhänge: ${
          attachments
            .map(a => a.filename)
            .join(", ")
        }`
      : "Anhänge: keine",
    "",
    "Automatisch erstellt über heatiq.ch"
  );


  return lines.join("\n");
}


/* =========================================================
   FORMULAR VERARBEITEN
   ========================================================= */

async function handleForm(request, env) {

  const form =
    await request.formData();


  const type =
    String(
      form.get("_form_type") ||
      "anfrage"
    );


  const title =
    formTitles[type] ||
    formTitles.anfrage;


  const reference =
    makeReference(type);


  /* Honeypot */

  if (
    String(
      form.get("website") || ""
    ).trim()
  ) {

    return Response.json({
      success: true,
      reference
    });

  }


  /* ---------------------------------------------------------
     STATUS
     --------------------------------------------------------- */

  const selectedStatuses =
    form
      .getAll("status")
      .map(item => String(item));


  /* ---------------------------------------------------------
     ATTACHMENTS
     --------------------------------------------------------- */

  const attachments = [];


  for (const [, item] of form.entries()) {

    if (!(item instanceof File)) {
      continue;
    }


    if (
      !item.name ||
      item.size === 0
    ) {
      continue;
    }


    const buffer =
      await item.arrayBuffer();


    const bytes =
      new Uint8Array(buffer);


    attachments.push({

      content: bytes,

      filename:
        item.name,

      type:
        item.type ||
        "application/octet-stream",

      disposition:
        "attachment"

    });

  }


  /* ---------------------------------------------------------
     BETREFF
     --------------------------------------------------------- */

  const ort =
    value(form, "standort_ort");


  const person =
    value(form, "firma") ||
    [
      value(form, "vorname"),
      value(form, "name")
    ].filter(Boolean).join(" ");


  const subjectBits = [
    `HeatIQ | ${title}`,
    reference
  ];


  if (person) {
    subjectBits.push(person);
  }


  if (ort) {
    subjectBits.push(ort);
  }


  const subject =
    subjectBits.join(" | ");


  /* ---------------------------------------------------------
     HTML
     --------------------------------------------------------- */

  const html =
    type === "inbetriebnahme"

      ? buildInbetriebnahmeEmail(
          form,
          reference,
          selectedStatuses,
          attachments
        )

      : buildStandardEmail(
          form,
          title,
          reference,
          attachments
        );


  /* ---------------------------------------------------------
     TEXT
     --------------------------------------------------------- */

  const text =
    buildText(
      form,
      title,
      reference,
      selectedStatuses,
      attachments
    );


  /* ---------------------------------------------------------
     REPLY TO
     --------------------------------------------------------- */

  const replyEmail =
    value(form, "kontakt_email") ||
    value(form, "email");


  /* ---------------------------------------------------------
     SENDEN
     --------------------------------------------------------- */

  try {

    const result =
      await env.EMAIL.send({

        to: RECIPIENT,

        from: {
          email: SENDER,
          name: "HeatIQ Aufträge"
        },

        replyTo:
          replyEmail ||
          undefined,

        subject,

        html,

        text,

        attachments

      });


    return Response.json({

      success: true,

      reference,

      messageId:
        result.messageId

    });

  }

  catch (error) {

    console.error(
      "Email sending failed",
      error?.code,
      error?.message,
      error
    );


    return Response.json({

      success: false,

      error:
        error?.message ||
        "E-Mail-Versand fehlgeschlagen",

      code:
        error?.code ||
        null

    }, {
      status:500
    });

  }

}


/* =========================================================
   WORKER
   ========================================================= */

export default {

  async fetch(request, env) {

    const url =
      new URL(request.url);


    if (
      url.pathname === "/api/form" &&
      request.method === "POST"
    ) {

      return handleForm(
        request,
        env
      );

    }


    if (
      url.pathname.startsWith("/api/")
    ) {

      return Response.json({

        success:false,

        error:"Not found"

      }, {
        status:404
      });

    }


    return env.ASSETS.fetch(
      request
    );

  }

};
