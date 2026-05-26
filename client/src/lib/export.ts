import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Export data to PDF with a table
 */
export function exportToPDF(data: any[], title: string, filename: string, columns: { header: string, dataKey: string }[]) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Date
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  // Table
  (doc as any).autoTable({
    startY: 35,
    head: [columns.map(c => c.header)],
    body: data.map(item => columns.map(c => item[c.dataKey])),
    theme: 'grid',
    headStyles: { fillColor: [10, 92, 54] }, // Chama OS Green
  });

  doc.save(`${filename}.pdf`);
}

/**
 * Export data to Excel
 */
export function exportToExcel(data: any[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
