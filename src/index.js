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


function values(form, key) {
  return form
    .getAll(key)
    .filter(item => !(item instanceof File))
    .map(item => String(item).trim())
    .filter(Boolean);
}


function dateValue(form, key) {
  return formatDate(
    value(form, key)
  );
}


function fullName(form, prefix = "") {
  const first =
    value(
      form,
      prefix
        ? `${prefix}_vorname`
        : "vorname"
    );

  const last =
    value(
      form,
      prefix
        ? `${prefix}_name`
        : "name"
    );

  return [first, last]
    .filter(Boolean)
    .join(" ");
}


/* =========================================================
   MAIL DESIGN
   ========================================================= */

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


function headerBlock(title, reference) {
  return `
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
        ${escapeHtml(title)}
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
  `;
}


function mailWrapper(
  title,
  reference,
  intro,
  content
) {
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

          ${headerBlock(
            title,
            reference
          )}

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
              ${escapeHtml(title)} über heatiq.ch
            </div>

            <div style="
              margin-top:5px;
              color:#7a8583;
              font-size:13px;
              line-height:1.5;
            ">
              ${escapeHtml(intro)}
            </div>

          </div>

          <div style="
            padding:24px;
            background:#f7f8f4;
            border:1px solid #d8dfda;
            border-top:0;
            border-radius:0 0 16px 16px;
          ">

            ${content}

          </div>

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
   STATUS / HINWEISKARTEN
   ========================================================= */

function statusCard(label, checked) {
  return `
    <div style="
      margin:0 0 8px;
      padding:11px 13px;
      border:1px solid ${checked ? "#b8dc70" : "#e4b3b3"};
      border-radius:10px;
      background:${checked ? "#f5faea" : "#fff5f5"};
      font-size:14px;
      font-weight:700;
      color:${checked ? "#27351a" : "#7a2d2d"};
    ">

      <span style="
        display:inline-block;
        width:22px;
        color:${checked ? "#79a91e" : "#c94b4b"};
        font-size:17px;
        font-weight:900;
      ">
        ${checked ? "✓" : "✕"}
      </span>

      ${escapeHtml(label)}

    </div>
  `;
}


function samenessCard(
  same,
  yesText,
  noText
) {
  return `
    <div style="
      margin-bottom:12px;
      padding:11px 13px;
      border:1px solid ${same ? "#b8dc70" : "#e4b3b3"};
      border-radius:10px;
      background:${same ? "#f5faea" : "#fff5f5"};
      color:${same ? "#27351a" : "#7a2d2d"};
      font-size:13px;
      font-weight:700;
    ">

      <span style="
        display:inline-block;
        width:22px;
        color:${same ? "#79a91e" : "#c94b4b"};
        font-size:17px;
        font-weight:900;
      ">
        ${same ? "✓" : "✕"}
      </span>

      ${escapeHtml(
        same
          ? yesText
          : noText
      )}

    </div>
  `;
}


function urgencyCard(level) {
  const urgent =
    level !== "Normal" &&
    level !== "Flexibel";

  const critical =
    level === "Anlage komplett ausgefallen";

  return `
    <div style="
      margin-top:14px;
      padding:12px 14px;
      border-radius:10px;
      background:${
        critical
          ? "#fff1f1"
          : urgent
            ? "#fff6e8"
            : "#f7f8f4"
      };
      border:1px solid ${
        critical
          ? "#e4b3b3"
          : urgent
            ? "#e8c98e"
            : "#d8dfda"
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
        color:${
          critical
            ? "#9b2e2e"
            : "#111718"
        };
      ">
        ${escapeHtml(level)}
      </div>

    </div>
  `;
}


/* =========================================================
   GEMEINSAME KONTAKT-BEREICHE
   ========================================================= */

function buildAuftraggeber(form, number = "01") {
  return section(
    `${number} · Auftraggeber & Rechnungsadresse`,

    table(
      row(
        "Auftraggeber",
        value(form, "kundentyp")
      ) +

      row(
        "Firma",
        value(form, "firma")
      ) +

      row(
        "Name",
        fullName(form)
      ) +

      row(
        "Strasse / Nr.",
        value(
          form,
          "auftraggeber_strasse"
        )
      ) +

      row(
        "PLZ / Ort",
        [
          value(
            form,
            "auftraggeber_plz"
          ),
          value(
            form,
            "auftraggeber_ort"
          )
        ]
          .filter(Boolean)
          .join(" ")
      )
    )
  );
}


function buildKontakt(form, number = "02") {
  return section(
    `${number} · Kontakt für Rückfragen`,

    table(
      row(
        "Name",
        fullName(
          form,
          "kontakt"
        )
      ) +

      row(
        "Telefon",
        value(
          form,
          "kontakt_telefon"
        )
      ) +

      row(
        "E-Mail",
        value(
          form,
          "kontakt_email"
        )
      )
    )
  );
}


function buildVorOrt(form, number = "03") {
  const same =
    value(
      form,
      "kontakt_vor_ort_gleich"
    ) === "Ja";

  return section(
    `${number} · Kontaktperson vor Ort`,

    samenessCard(
      same,
      "Entspricht Kontakt für Rückfragen",
      "Abweichende Kontaktperson angegeben"
    ) +

    table(
      row(
        "Name",
        fullName(
          form,
          "vorort"
        )
      ) +

      row(
        "Telefon",
        value(
          form,
          "vorort_telefon"
        )
      ) +

      row(
        "E-Mail",
        value(
          form,
          "vorort_email"
        )
      )
    )
  );
}


function buildStandort(form, number = "04") {
  const same =
    value(
      form,
      "standort_gleich"
    ) === "Ja";

  return section(
    `${number} · Standort der Anlage`,

    samenessCard(
      same,
      "Entspricht Auftraggeber / Rechnungsadresse",
      "Abweichender Anlagenstandort angegeben"
    ) +

    table(
      row(
        "Strasse / Nr.",
        value(
          form,
          "standort_strasse"
        )
      ) +

      row(
        "PLZ / Ort",
        [
          value(
            form,
            "standort_plz"
          ),
          value(
            form,
            "standort_ort"
          )
        ]
          .filter(Boolean)
          .join(" ")
      ) +

      row(
        "Zugangshinweis",
        value(
          form,
          "standort_zugang"
        )
      )
    )
  );
}


/* =========================================================
   INBETRIEBNAHME
   ========================================================= */

function buildInbetriebnahmeEmail(
  form,
  reference,
  selectedStatuses,
  attachments
) {

  const auftraggeber =
    buildAuftraggeber(form, "01");

  const kontakt =
    buildKontakt(form, "02");

  const vorOrt =
    buildVorOrt(form, "03");

  const standort =
    buildStandort(form, "04");


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


  const statusContent =
    statusLabels
      .map(label =>
        statusCard(
          label,
          selectedStatuses.includes(
            label
          )
        )
      )
      .join("");


  const status = section(
    "06 · Stand der Installation",
    statusContent
  );


  const dringlichkeit =
    value(
      form,
      "dringlichkeit"
    ) || "Normal";


  const termin = section(
    "07 · Wunschtermin",

    table(
      row(
        "Gewünschter IBN-Termin",
        dateValue(
          form,
          "termin1"
        )
      ) +

      row(
        "Ersatztermin",
        dateValue(
          form,
          "termin2"
        )
      )
    ) +

    urgencyCard(
      dringlichkeit
    )
  );


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
        value(
          form,
          "bemerkungen"
        )
      )
    )
  );


  return mailWrapper(
    "Neue Inbetriebnahme",
    reference,
    "Alle Angaben aus der Anmeldung sind nach Bereichen gegliedert. Hochgeladene Dateien befinden sich im Anhang dieser E-Mail.",

    auftraggeber +
    kontakt +
    vorOrt +
    standort +
    anlage +
    status +
    termin +
    unterlagen
  );
}


/* =========================================================
   WARTUNG
   ========================================================= */

function buildWartungEmail(
  form,
  reference,
  attachments
) {

  const auftraggeber =
    buildAuftraggeber(form, "01");

  const kontakt =
    buildKontakt(form, "02");

  const vorOrt =
    buildVorOrt(form, "03");

  const standort =
    buildStandort(form, "04");


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
        "Alter der Anlage",
        value(form, "anlagenalter")
      ) +

      row(
        "Gebäudetyp",
        value(form, "gebaeudetyp")
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
        "Letzte Wartung",
        dateValue(
          form,
          "letzte_wartung"
        )
      )
    )
  );


  const wartungsumfang =
    values(
      form,
      "wartungsumfang"
    );


  const wartungCards =
    wartungsumfang.length

      ? wartungsumfang
          .map(item =>
            statusCard(
              item,
              true
            )
          )
          .join("")

      : `
        <div style="
          color:#7a8583;
          font-size:14px;
        ">
          Kein spezieller Wartungsumfang ausgewählt.
        </div>
      `;


  const umfang = section(
    "06 · Wartungsumfang",
    wartungCards
  );


  const auffaelligkeiten =
    values(
      form,
      "auffaelligkeit"
    );


  const auffaelligkeitCards =
    auffaelligkeiten.length

      ? auffaelligkeiten
          .map(item => {
            const good =
              item ===
              "Keine Auffälligkeiten";

            return statusCard(
              item,
              good
            );
          })
          .join("")

      : `
        <div style="
          color:#7a8583;
          font-size:14px;
        ">
          Keine Angaben zu Auffälligkeiten.
        </div>
      `;


  const zustand = section(
    "07 · Aktueller Anlagenzustand",

    auffaelligkeitCards +

    (
      value(
        form,
        "beschreibung"
      )
        ? `
          <div style="
            margin-top:16px;
          ">
            ${table(
              row(
                "Beschreibung / Wünsche",
                value(
                  form,
                  "beschreibung"
                )
              )
            )}
          </div>
        `
        : ""
    )
  );


  const dringlichkeit =
    value(
      form,
      "dringlichkeit"
    ) || "Flexibel";


  const termin = section(
    "08 · Wunschtermin",

    table(
      row(
        "Gewünschter Wartungstermin",
        dateValue(
          form,
          "termin1"
        )
      ) +

      row(
        "Ersatztermin",
        dateValue(
          form,
          "termin2"
        )
      )
    ) +

    urgencyCard(
      dringlichkeit
    )
  );


  const unterlagen = section(
    "09 · Unterlagen & Bemerkungen",

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
        "Weitere Bemerkungen",
        value(
          form,
          "bemerkungen"
        )
      )
    )
  );


  return mailWrapper(
    "Neue Wartungsanfrage",
    reference,
    "Die Wartungsanfrage ist nach Auftraggeber, Anlage, Wartungsumfang und Termin gegliedert. Hochgeladene Dateien befinden sich im Anhang.",

    auftraggeber +
    kontakt +
    vorOrt +
    standort +
    anlage +
    umfang +
    zustand +
    termin +
    unterlagen
  );
}


/* =========================================================
   STÖRUNG
   ========================================================= */

function buildStoerungEmail(
  form,
  reference,
  attachments
) {

  const auftraggeber =
    buildAuftraggeber(form, "01");

  const kontakt =
    buildKontakt(form, "02");

  const vorOrt =
    buildVorOrt(form, "03");

  const standort =
    buildStandort(form, "04");


  const stoerungen =
    values(
      form,
      "stoerung"
    );


  const stoerungCards =
    stoerungen.length

      ? stoerungen
          .map(item =>
            statusCard(
              item,
              false
            )
          )
          .join("")

      : `
        <div style="
          color:#7a8583;
          font-size:14px;
        ">
          Keine Fehlerart ausgewählt.
        </div>
      `;


  const fehlerart = section(
    "05 · Was funktioniert nicht?",
    stoerungCards
  );


  const fehlerbild = section(
    "06 · Anlage & Fehlerbild",

    table(
      row(
        "Hersteller",
        value(
          form,
          "hersteller"
        )
      ) +

      row(
        "Modell / Typ",
        value(
          form,
          "modell"
        )
      ) +

      row(
        "Seriennummer",
        value(
          form,
          "seriennummer"
        )
      ) +

      row(
        "Fehlercode / Displaymeldung",
        value(
          form,
          "fehlercode"
        )
      ) +

      row(
        "Seit wann besteht die Störung?",
        value(
          form,
          "seit_wann"
        )
      ) +

      row(
        "Anlage komplett ausgefallen?",
        value(
          form,
          "ausfall"
        )
      ) +

      row(
        "Reset bereits versucht?",
        value(
          form,
          "reset"
        )
      ) +

      row(
        "Fehler tritt auf",
        value(
          form,
          "fehler_haeufigkeit"
        )
      ) +

      row(
        "Beschreibung",
        value(
          form,
          "beschreibung"
        )
      )
    )
  );


  const dringlichkeit =
    value(
      form,
      "dringlichkeit"
    ) || "Normal";


  const dringlichkeitSection =
    section(
      "07 · Dringlichkeit",
      urgencyCard(
        dringlichkeit
      )
    );


  const unterlagen = section(
    "08 · Fotos & Unterlagen",

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
        "Weitere Bemerkungen",
        value(
          form,
          "bemerkungen"
        )
      )
    )
  );


  return mailWrapper(
    "Neue Störungsmeldung",
    reference,
    "Die Störungsmeldung ist nach Fehlerart, Anlage und Dringlichkeit gegliedert. Rot markierte Bereiche sollten besonders beachtet werden.",

    auftraggeber +
    kontakt +
    vorOrt +
    standort +
    fehlerart +
    fehlerbild +
    dringlichkeitSection +
    unterlagen
  );
}


/* =========================================================
   STANDARD FALLBACK
   ========================================================= */

function readableKey(key) {
  return key
    .replace(/^_/, "")
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      char => char.toUpperCase()
    );
}


function buildStandardEmail(
  form,
  title,
  reference,
  attachments
) {

  let rows = "";

  for (
    const [key, item]
    of form.entries()
  ) {

    if (
      key === "_form_type" ||
      key === "website"
    ) {
      continue;
    }

    if (
      item instanceof File
    ) {
      continue;
    }

    let val =
      String(item).trim();

    if (!val) continue;

    rows += row(
      readableKey(key),
      val
    );
  }


  return mailWrapper(
    title,
    reference,
    "Neue Anfrage über heatiq.ch.",

    section(
      "Angaben",
      table(rows)
    ) +

    section(
      "Anhänge",

      table(
        row(
          "Dateien",
          attachments.length
            ? attachments
                .map(
                  a => a.filename
                )
                .join(", ")
            : "Keine"
        )
      )
    )
  );
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


  for (
    const [key, item]
    of form.entries()
  ) {

    if (
      key === "_form_type" ||
      key === "website" ||
      key === "status" ||
      item instanceof File
    ) {
      continue;
    }

    let val =
      String(item).trim();

    if (!val) continue;


    if (
      key === "termin1" ||
      key === "termin2" ||
      key === "letzte_wartung"
    ) {
      val =
        formatDate(val);
    }


    lines.push(
      `${readableKey(key)}: ${val}`
    );
  }


  if (
    selectedStatuses.length
  ) {

    lines.push(
      "",
      "INSTALLATIONSSTATUS"
    );


    for (
      const label
      of statusLabels
    ) {

      lines.push(
        `${
          selectedStatuses.includes(
            label
          )
            ? "[X]"
            : "[ ]"
        } ${label}`
      );

    }

  }


  lines.push(
    "",
    attachments.length
      ? `Anhänge: ${
          attachments
            .map(
              a => a.filename
            )
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

async function handleForm(
  request,
  env
) {

  const form =
    await request.formData();


  const type =
    String(
      form.get(
        "_form_type"
      ) || "anfrage"
    );


  const title =
    formTitles[type] ||
    formTitles.anfrage;


  const reference =
    makeReference(type);


  /* ---------------------------------------------------------
     HONEYPOT
     --------------------------------------------------------- */

  if (
    String(
      form.get("website") || ""
    ).trim()
  ) {

    return Response.json({
      success:true,
      reference
    });

  }


  /* ---------------------------------------------------------
     INSTALLATIONSSTATUS
     --------------------------------------------------------- */

  const selectedStatuses =
    form
      .getAll("status")
      .map(
        item =>
          String(item)
      );


  /* ---------------------------------------------------------
     ATTACHMENTS
     --------------------------------------------------------- */

  const attachments = [];


  for (
    const [, item]
    of form.entries()
  ) {

    if (
      !(item instanceof File)
    ) {
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
      new Uint8Array(
        buffer
      );


    attachments.push({

      content:
        bytes,

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
    value(
      form,
      "standort_ort"
    );


  const person =
    value(
      form,
      "firma"
    ) ||
    fullName(form);


  const subjectBits = [
    `HeatIQ | ${title}`,
    reference
  ];


  if (person) {
    subjectBits.push(
      person
    );
  }


  if (ort) {
    subjectBits.push(
      ort
    );
  }


  const subject =
    subjectBits.join(
      " | "
    );


  /* ---------------------------------------------------------
     HTML
     --------------------------------------------------------- */

  let html;


  if (
    type ===
    "inbetriebnahme"
  ) {

    html =
      buildInbetriebnahmeEmail(
        form,
        reference,
        selectedStatuses,
        attachments
      );

  }

  else if (
    type ===
    "wartung"
  ) {

    html =
      buildWartungEmail(
        form,
        reference,
        attachments
      );

  }

  else if (
    type ===
    "stoerung"
  ) {

    html =
      buildStoerungEmail(
        form,
        reference,
        attachments
      );

  }

  else {

    html =
      buildStandardEmail(
        form,
        title,
        reference,
        attachments
      );

  }


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
    value(
      form,
      "kontakt_email"
    ) ||
    value(
      form,
      "email"
    );


  /* ---------------------------------------------------------
     SENDEN
     --------------------------------------------------------- */

  try {

    const result =
      await env.EMAIL.send({

        to:
          RECIPIENT,

        from: {
          email:
            SENDER,

          name:
            "HeatIQ Aufträge"
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

      success:true,

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

      success:false,

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

  async fetch(
    request,
    env
  ) {

    const url =
      new URL(
        request.url
      );


    if (
      url.pathname ===
        "/api/form" &&
      request.method ===
        "POST"
    ) {

      return handleForm(
        request,
        env
      );

    }


    if (
      url.pathname
        .startsWith(
          "/api/"
        )
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
