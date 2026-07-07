import PDFDocument from 'pdfkit';
import { formatCurrencyForReport } from './report-format.util';

export interface ReportRow {
  date: string;
  reference: string;
  customerName: string;
  memberId: string;
  accountType: string;
  accountLabel?: string | null;
  type: string;
  amount: number;
  channel: string;
  status: string;
  branchName: string;
  processedBy?: string | null;
  narration?: string | null;
}

export function generateTransactionReportPdf(
  rows: ReportRow[],
  meta: { startDate: string; endDate: string; generatedAt: Date },
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    doc.on('data', (chunk) => chunks.push(chunk as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text('Tanjuriel TMC — Transaction Report', { align: 'center' });
    doc.fontSize(10).text(`Period: ${meta.startDate} to ${meta.endDate}`, { align: 'center' });
    doc.text(`Generated: ${meta.generatedAt.toISOString().slice(0, 16).replace('T', ' ')} UTC`, { align: 'center' });
    doc.moveDown();

    const headers = ['Date', 'Reference', 'Customer', 'Member ID', 'Account', 'Type', 'Amount', 'Channel', 'Status', 'Branch'];
    const colWidths = [58, 72, 80, 68, 72, 52, 58, 48, 52, 60];
    let y = doc.y;
    let x = doc.page.margins.left;

    doc.fontSize(8).font('Helvetica-Bold');
    headers.forEach((h, i) => {
      doc.text(h, x, y, { width: colWidths[i], lineBreak: false });
      x += colWidths[i];
    });
    y += 14;
    doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).stroke();
    y += 6;

    doc.font('Helvetica');
    for (const row of rows) {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      x = doc.page.margins.left;
      const accountCol = row.accountLabel ? `${row.accountType} · ${row.accountLabel}` : row.accountType;
      const cells = [
        row.date,
        row.reference,
        row.customerName,
        row.memberId,
        accountCol,
        row.type.replace(/_/g, ' '),
        formatCurrencyForReport(row.amount),
        row.channel,
        row.status,
        row.branchName,
      ];
      cells.forEach((cell, i) => {
        doc.text(String(cell ?? '—'), x, y, { width: colWidths[i], lineBreak: false });
        x += colWidths[i];
      });
      y += 12;
    }

    doc.end();
  });
}
