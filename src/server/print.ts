import PDFDocument from "pdfkit";
import path from "node:path";
/** Embedded, self-hosted fonts preserve visible credit on paper, including Indic shaping. */
export function printPdf(image: Buffer, size: "a4" | "a2", credit: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({
      size: size.toUpperCase(),
      margin: 14,
      autoFirstPage: true,
      info: {
        Title: "Print-ready contribution",
        Author: credit,
        Subject: credit,
        Keywords: "credit; licence; print",
      },
    });
    const chunks: Buffer[] = [];
    pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);
    try {
      pdf.registerFont("mono", path.resolve("public/fonts/ibm-plex-mono.ttf"));
      for (const script of ["devanagari", "bengali", "malayalam"])
        pdf.registerFont(script, path.resolve(`public/fonts/indic/noto-sans-${script}-full.ttf`));
      // Reserve enough room for the complete bounded artist/licence/source fields.
      const strip = 150;
      pdf.image(image, 14, 14, {
        fit: [pdf.page.width - 28, pdf.page.height - strip - 28],
        align: "center",
      });
      pdf
        .font("mono")
        .fontSize(7)
        .text("RED LARK WORKSHOP | CREDIT / LICENCE / SOURCE", 14, pdf.page.height - strip, {
          width: pdf.page.width - 28,
        });
      const runs =
        credit.match(
          /[\u0900-\u097f\u200c\u200d]+|[\u0980-\u09ff\u200c\u200d]+|[\u0d00-\u0d7f\u200c\u200d]+|[^\u0900-\u097f\u0980-\u09ff\u0d00-\u0d7f\u200c\u200d]+/gu,
        ) || [];
      runs.forEach((run, index) => {
        const font = /[\u0900-\u097f]/u.test(run)
          ? "devanagari"
          : /[\u0980-\u09ff]/u.test(run)
            ? "bengali"
            : /[\u0d00-\u0d7f]/u.test(run)
              ? "malayalam"
              : "mono";
        pdf.font(font).text(run, {
          width: pdf.page.width - 28,
          continued: index < runs.length - 1,
          lineGap: 3,
        });
      });
      pdf.end();
    } catch (error) {
      reject(error);
    }
  });
}
