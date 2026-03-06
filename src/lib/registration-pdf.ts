type Rgb = [number, number, number];

export interface ApiRegistrationPdfDocument {
  documentType: string;
  fileName: string | null;
  mimeType: string | null;
  verificationStatus: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface ApiRegistrationPdfStakeholder {
  id: number;
  type: "individual" | "corporate";
  roles: string[];
  fullName: string | null;
  companyName: string | null;
  nationality: string | null;
  email: string | null;
  phone: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressPostalCode: string | null;
  addressCountry: string | null;
  registrationNumber: string | null;
  countryOfIncorporation: string | null;
  numberOfShares: number | null;
  sharePercentage: number | null;
  documents: ApiRegistrationPdfDocument[];
}

export interface ApiRegistrationPdfData {
  id: string;
  status: "pending" | "in-progress" | "completed";
  assignedTo: { id: number; name: string; email: string } | null;
  applicantFirstName: string;
  applicantLastName: string;
  applicantEmail: string;
  applicantPhone: string;
  countryOfIncorporation: string | null;
  companyType: string | null;
  businessRegistrationNumber: string | null;
  proposedCompanyName: string;
  alternativeNames: string[];
  natureOfBusiness: string[];
  businessScope: string | null;
  businessScopeDescription: string | null;
  shareCapitalCurrency: string | null;
  shareCapitalAmount: number | null;
  totalShares: number | null;
  bankingProviders: string[];
  preferredBankingProvider: string | null;
  additionalServices: string[];
  billingName: string | null;
  billingEmail: string | null;
  billingPhone: string | null;
  billingStreet: string | null;
  billingCity: string | null;
  billingState: string | null;
  billingPostalCode: string | null;
  billingCountry: string | null;
  billingPaymentMethod: string | null;
  complianceAccepted: boolean;
  complianceTimestamp: string | null;
  createdAt: string;
  updatedAt: string;
  stakeholders: ApiRegistrationPdfStakeholder[];
  documents: ApiRegistrationPdfDocument[];
}

type Theme = {
  pageBg: Rgb;
  cardBg: Rgb;
  cardStroke: Rgb;
  titleText: Rgb;
  bodyText: Rgb;
  mutedText: Rgb;
  brand: Rgb;
};

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 36;
const CARD_PADDING_X = 16;
const CARD_PADDING_Y = 14;
const CARD_BOTTOM_GAP = 14;

function rgb([r, g, b]: Rgb) {
  return `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)}`;
}

function esc(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r?\n/g, " ");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(value: string) {
  return value
    .split("-")
    .map((v) => v.charAt(0).toUpperCase() + v.slice(1))
    .join(" ");
}

function wrapText(value: string, maxChars: number) {
  const text = value.trim();
  if (!text) return ["—"];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    if (w.length <= maxChars) {
      current = w;
      continue;
    }
    let rest = w;
    while (rest.length > maxChars) {
      lines.push(rest.slice(0, maxChars - 1) + "-");
      rest = rest.slice(maxChars - 1);
    }
    current = rest;
  }
  if (current) lines.push(current);
  return lines;
}

function addRect(commands: string[], x: number, y: number, w: number, h: number, fill: Rgb, stroke?: Rgb) {
  commands.push(`${rgb(fill)} rg`);
  if (stroke) {
    commands.push(`${rgb(stroke)} RG`);
    commands.push(`${x} ${y} ${w} ${h} re B`);
    return;
  }
  commands.push(`${x} ${y} ${w} ${h} re f`);
}

function addText(commands: string[], text: string, x: number, y: number, size: number, color: Rgb, font: "F1" | "F2" = "F1") {
  commands.push(
    "BT",
    `/${font} ${size} Tf`,
    `${rgb(color)} rg`,
    `1 0 0 1 ${x} ${y} Tm`,
    `(${esc(text)}) Tj`,
    "ET"
  );
}

type PageState = {
  commands: string[];
  cursorY: number;
};

function initPage(theme: Theme, title: string, registrationId: string, generatedAt: string) {
  const commands: string[] = [];
  addRect(commands, 0, 0, PAGE_WIDTH, PAGE_HEIGHT, theme.pageBg);
  addRect(commands, 0, PAGE_HEIGHT - 84, PAGE_WIDTH, 84, theme.brand);
  addText(commands, title, MARGIN, PAGE_HEIGHT - 50, 16, [255, 255, 255], "F2");
  addText(commands, `Registration: ${registrationId}`, MARGIN, PAGE_HEIGHT - 68, 10, [235, 239, 255]);
  addText(commands, `Generated: ${generatedAt}`, PAGE_WIDTH - 220, PAGE_HEIGHT - 68, 10, [235, 239, 255]);
  return { commands, cursorY: PAGE_HEIGHT - 100 };
}

function estimateCardHeight(linesCount: number, sectionTitle = true) {
  const titleBlock = sectionTitle ? 20 : 0;
  return titleBlock + CARD_PADDING_Y * 2 + linesCount * 14 + CARD_BOTTOM_GAP;
}

function buildPdf(reg: ApiRegistrationPdfData, isDark: boolean) {
  const theme: Theme = isDark
    ? {
        pageBg: [12, 17, 29],
        cardBg: [26, 34, 49],
        cardStroke: [52, 64, 84],
        titleText: [236, 242, 255],
        bodyText: [220, 227, 240],
        mutedText: [162, 176, 198],
        brand: [70, 95, 255],
      }
    : {
        pageBg: [252, 252, 253],
        cardBg: [255, 255, 255],
        cardStroke: [228, 231, 236],
        titleText: [16, 24, 40],
        bodyText: [52, 64, 84],
        mutedText: [102, 112, 133],
        brand: [70, 95, 255],
      };

  const pages: PageState[] = [];
  const generatedAt = formatDate(new Date().toISOString());
  let current = initPage(theme, "Registration Details", reg.id, generatedAt);
  pages.push(current);

  const startNewPage = () => {
    current = initPage(theme, "Registration Details (cont.)", reg.id, generatedAt);
    pages.push(current);
  };

  const ensureHeight = (needed: number) => {
    if (current.cursorY - needed < MARGIN) startNewPage();
  };

  const addSection = (title: string, rows: Array<[string, string]>) => {
    const textLines = rows.flatMap(([k, v]) => {
      const wrapped = wrapText(v || "—", 74);
      return [[k, wrapped[0] || "—"] as [string, string], ...wrapped.slice(1).map((line) => ["", line] as [string, string])];
    });
    const needed = estimateCardHeight(textLines.length, true);
    ensureHeight(needed);

    const cardHeight = needed - CARD_BOTTOM_GAP;
    const cardY = current.cursorY - cardHeight;
    addRect(current.commands, MARGIN, cardY, PAGE_WIDTH - MARGIN * 2, cardHeight, theme.cardBg, theme.cardStroke);
    addText(current.commands, title, MARGIN + CARD_PADDING_X, current.cursorY - 24, 12, theme.titleText, "F2");

    let y = current.cursorY - 42;
    for (const [label, value] of textLines) {
      if (label) addText(current.commands, label, MARGIN + CARD_PADDING_X, y, 10, theme.mutedText, "F2");
      addText(current.commands, value, MARGIN + CARD_PADDING_X + 150, y, 10, theme.bodyText);
      y -= 14;
    }
    current.cursorY -= needed;
  };

  addSection("Summary", [
    ["Status", formatStatus(reg.status)],
    ["Assigned To", reg.assignedTo?.name || "Unassigned"],
    ["Submitted", formatDate(reg.createdAt)],
    ["Last Updated", formatDate(reg.updatedAt)],
  ]);

  addSection("Applicant", [
    ["Full Name", `${reg.applicantFirstName || ""} ${reg.applicantLastName || ""}`.trim() || "—"],
    ["Email", reg.applicantEmail || "—"],
    ["Phone", reg.applicantPhone || "—"],
  ]);

  addSection("Company", [
    ["Proposed Name", reg.proposedCompanyName || "—"],
    ["Country of Incorporation", reg.countryOfIncorporation || "—"],
    ["Company Type", reg.companyType || "—"],
    ["Business Registration #", reg.businessRegistrationNumber || "—"],
    ["Alternative Names", reg.alternativeNames?.length ? reg.alternativeNames.join(", ") : "—"],
    ["Nature of Business", reg.natureOfBusiness?.length ? reg.natureOfBusiness.join(", ") : "—"],
    ["Business Scope", reg.businessScope || "—"],
    ["Scope Description", reg.businessScopeDescription || "—"],
  ]);

  addSection("Share Capital", [
    ["Currency", reg.shareCapitalCurrency || "—"],
    ["Amount", reg.shareCapitalAmount != null ? String(reg.shareCapitalAmount) : "—"],
    ["Total Shares", reg.totalShares != null ? String(reg.totalShares) : "—"],
  ]);

  addSection("Banking & Services", [
    ["Banking Providers", reg.bankingProviders?.length ? reg.bankingProviders.join(", ") : "—"],
    ["Preferred Provider", reg.preferredBankingProvider || "—"],
    ["Additional Services", reg.additionalServices?.length ? reg.additionalServices.join(", ") : "—"],
  ]);

  addSection("Billing", [
    ["Name", reg.billingName || "—"],
    ["Email", reg.billingEmail || "—"],
    ["Phone", reg.billingPhone || "—"],
    [
      "Address",
      [reg.billingStreet, reg.billingCity, reg.billingState, reg.billingPostalCode, reg.billingCountry]
        .filter(Boolean)
        .join(", ") || "—",
    ],
    ["Payment Method", reg.billingPaymentMethod || "—"],
  ]);

  addSection("Compliance", [
    ["Accepted", reg.complianceAccepted ? "Yes" : "No"],
    ["Timestamp", formatDate(reg.complianceTimestamp)],
  ]);

  const topLevelDocs = reg.documents || [];
  addSection("Documents", [
    ["Total Documents", String(topLevelDocs.length)],
    [
      "Types",
      topLevelDocs.length
        ? topLevelDocs
            .map((d) => `${d.documentType} (${formatStatus(d.verificationStatus)})`)
            .join(", ")
        : "—",
    ],
  ]);

  for (let idx = 0; idx < reg.stakeholders.length; idx += 1) {
    const p = reg.stakeholders[idx];
    addSection(`Person ${idx + 1}`, [
      ["Type", formatStatus(p.type)],
      ["Roles", p.roles?.length ? p.roles.map(formatStatus).join(", ") : "—"],
      ["Name", p.fullName || p.companyName || "—"],
      ["Email", p.email || "—"],
      ["Phone", p.phone || "—"],
      ["Nationality", p.nationality || "—"],
      [
        "Address",
        [p.addressStreet, p.addressCity, p.addressState, p.addressPostalCode, p.addressCountry]
          .filter(Boolean)
          .join(", ") || "—",
      ],
      ["Reg #", p.registrationNumber || "—"],
      ["Country of Incorporation", p.countryOfIncorporation || "—"],
      ["Shares", p.numberOfShares != null ? String(p.numberOfShares) : "—"],
      ["Share %", p.sharePercentage != null ? String(p.sharePercentage) : "—"],
      ["Documents", p.documents?.length ? p.documents.map((d) => d.documentType).join(", ") : "—"],
    ]);
  }

  return pages.map((p) => p.commands.join("\n"));
}

function composePdfDocument(pageContents: string[]) {
  const pageCount = pageContents.length;
  const firstPageObjId = 3;
  const fontRegularObjId = firstPageObjId + pageCount * 2;
  const fontBoldObjId = fontRegularObjId + 1;
  const totalObjects = fontBoldObjId;

  const objects = new Array<string>(totalObjects + 1);
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  const kids = Array.from({ length: pageCount }, (_, i) => `${firstPageObjId + i * 2} 0 R`).join(" ");
  objects[2] = `<< /Type /Pages /Count ${pageCount} /Kids [ ${kids} ] >>`;

  for (let i = 0; i < pageCount; i += 1) {
    const pageObjId = firstPageObjId + i * 2;
    const contentObjId = pageObjId + 1;
    const stream = pageContents[i];
    objects[pageObjId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 ${fontRegularObjId} 0 R /F2 ${fontBoldObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>`;
    objects[contentObjId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  }

  objects[fontRegularObjId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[fontBoldObjId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  let body = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (let i = 1; i <= totalObjects; i += 1) {
    offsets[i] = body.length;
    body += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefStart = body.length;
  body += `xref\n0 ${totalObjects + 1}\n`;
  body += "0000000000 65535 f \n";
  for (let i = 1; i <= totalObjects; i += 1) {
    body += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return new Blob([body], { type: "application/pdf" });
}

export function createRegistrationPdfBlob(registration: ApiRegistrationPdfData, isDarkTheme: boolean) {
  const pages = buildPdf(registration, isDarkTheme);
  return composePdfDocument(pages);
}
