import { promises as fs } from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";

const PDF_DIR = path.join(process.cwd(), "pdfs");

let cache: string | null = null;

export async function loadPdfContext(): Promise<string> {
  if (cache !== null) return cache;

  const files = await fs.readdir(PDF_DIR);
  const pdfFiles = files.filter((f) => f.toLowerCase().endsWith(".pdf"));

  if (pdfFiles.length === 0) {
    cache = "";
    return cache;
  }

  const parts: string[] = [];
  for (const file of pdfFiles) {
    const buffer = await fs.readFile(path.join(PDF_DIR, file));
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    await parser.destroy();
    parts.push(`=== ${file} ===\n${result.text.trim()}`);
  }

  cache = parts.join("\n\n");
  return cache;
}
