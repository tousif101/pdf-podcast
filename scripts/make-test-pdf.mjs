import { writeFileSync } from "node:fs";

const lines = [
  "The History of Coffee. Coffee cultivation began in Ethiopia over a thousand years ago.",
  "Legend says a goat herder named Kaldi noticed his goats became energetic after eating red berries.",
  "By the fifteenth century, coffee was being roasted and brewed in Yemen much as it is today.",
  "Coffee houses spread through the Ottoman Empire and reached Europe in the seventeenth century.",
  "They became centers of conversation and commerce, sometimes called penny universities in England.",
  "Today coffee is one of the most traded agricultural commodities in the world.",
  "Arabica and Robusta are the two dominant species grown commercially across the bean belt.",
];

const content = [
  "BT /F1 12 Tf 50 750 Td 14 TL",
  ...lines.map((l) => `(${l.replace(/[()\\]/g, "")}) Tj T*`),
  "ET",
].join("\n");

const objects = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
  `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
];

let pdf = "%PDF-1.4\n";
const offsets = [];
objects.forEach((body, i) => {
  offsets.push(pdf.length);
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
});
const xrefOffset = pdf.length;
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
for (const off of offsets) {
  pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
}
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

writeFileSync(new URL("../test/fixtures/history-of-coffee.pdf", import.meta.url), pdf, "binary");
console.log("wrote test/fixtures/history-of-coffee.pdf", pdf.length, "bytes");
