import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export const exportToExcel = (
  data: Record<string, any>[],
  columns: ExportColumn[],
  fileName: string
) => {
  // Create worksheet data with headers
  const headers = columns.map((col) => col.header);
  const rows = data.map((item) => columns.map((col) => item[col.key] ?? '-'));

  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  worksheet['!cols'] = columns.map((col) => ({ wch: col.width || 15 }));

  // Create workbook and download
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

export const exportToPDF = (
  data: Record<string, any>[],
  columns: ExportColumn[],
  fileName: string,
  title: string
) => {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(10);
  doc.text(`Generated on: ${format(new Date(), 'MMM d, yyyy HH:mm')}`, 14, 30);

  // Create table data
  const headers = columns.map((col) => col.header);
  const rows = data.map((item) =>
    columns.map((col) => {
      const value = item[col.key];
      if (value === null || value === undefined) return '-';
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      return String(value);
    })
  );

  // Add table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 38,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [14, 165, 233] }, // sky-500 color
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(`${fileName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Column definitions for different data types
export const quoteColumns: ExportColumn[] = [
  { header: 'Subject', key: 'subject', width: 25 },
  { header: 'Product', key: 'productName', width: 20 },
  { header: 'Quantity', key: 'quantity', width: 10 },
  { header: 'Message', key: 'message', width: 35 },
  { header: 'Status', key: 'status', width: 12 },
  { header: 'Date', key: 'date', width: 15 },
];

export const quoteColumnsWithUser: ExportColumn[] = [
  { header: 'User', key: 'userName', width: 18 },
  { header: 'Email', key: 'userEmail', width: 25 },
  { header: 'Subject', key: 'subject', width: 20 },
  { header: 'Product', key: 'productName', width: 18 },
  { header: 'Qty', key: 'quantity', width: 8 },
  { header: 'Status', key: 'status', width: 12 },
  { header: 'Date', key: 'date', width: 15 },
];

export const productColumns: ExportColumn[] = [
  { header: 'Name', key: 'name', width: 25 },
  { header: 'Category', key: 'category', width: 15 },
  { header: 'Price', key: 'price', width: 12 },
  { header: 'Trending', key: 'is_trending', width: 10 },
  { header: 'Active', key: 'is_active', width: 10 },
  { header: 'Description', key: 'description', width: 35 },
];

export const userColumns: ExportColumn[] = [
  { header: 'Name', key: 'full_name', width: 20 },
  { header: 'Email', key: 'email', width: 25 },
  { header: 'Phone', key: 'phone', width: 15 },
  { header: 'Joined', key: 'joined_at', width: 15 },
];
