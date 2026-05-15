import jsPDF from 'jspdf';
import { Transaction, Business } from '../types';
import { formatCurrency, formatDate } from './utils';

export function generateReceiptPDF(tx: Transaction, business: Business) {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 200] // Thermal receipt style
  });

  const width = 80;
  let y = 10;

  // Header
  doc.setFontSize(14);
  doc.text(business.name, width/2, y, { align: 'center' });
  y += 6;
  
  doc.setFontSize(8);
  doc.text(business.town + ', ' + business.county, width/2, y, { align: 'center' });
  y += 4;
  doc.text('TEL: ' + business.phone, width/2, y, { align: 'center' });
  y += 8;

  // Tx Info
  doc.text('ID: ' + tx.id.slice(0, 10).toUpperCase(), 5, y);
  y += 4;
  doc.text('DATE: ' + formatDate(tx.createdAt), 5, y);
  y += 6;

  // Divider
  doc.line(5, y, width - 5, y);
  y += 6;

  // Items
  doc.setFontSize(9);
  tx.items.forEach(item => {
    doc.text(item.name, 5, y);
    const itemTotal = formatCurrency(item.price * item.quantity);
    doc.text(itemTotal, width - 5, y, { align: 'right' });
    y += 4;
    doc.setFontSize(7);
    doc.text(`${item.quantity} x ${formatCurrency(item.price)}`, 5, y);
    y += 5;
    doc.setFontSize(9);
  });

  y += 2;
  doc.line(5, y, width - 5, y);
  y += 6;

  // Totals
  doc.text('SUBTOTAL:', 5, y);
  doc.text(formatCurrency(tx.subtotal), width - 5, y, { align: 'right' });
  y += 5;
  
  if (tx.vat > 0) {
    doc.text('VAT (16%):', 5, y);
    doc.text(formatCurrency(tx.vat), width - 5, y, { align: 'right' });
    y += 5;
  }

  doc.setFontSize(11);
  doc.text('TOTAL:', 5, y);
  doc.text(formatCurrency(tx.total), width - 5, y, { align: 'right' });
  y += 8;

  // Footer
  doc.setFontSize(8);
  doc.text(business.settings.receiptFooter || 'Asante kwa ununuzi!', width/2, y, { align: 'center' });
  y += 6;
  doc.text('Built by Jackson Mwaniki · Nex-Ink', width/2, y, { align: 'center' });

  doc.save(`receipt-${tx.id.slice(0, 8)}.pdf`);
}

export function shareToWhatsApp(tx: Transaction, business: Business) {
  const text = `*${business.name} Receipt*%0A` +
               `-----------------------%0A` +
               `ID: ${tx.id.slice(0, 8).toUpperCase()}%0A` +
               `Total: ${formatCurrency(tx.total)}%0A` +
               `-----------------------%0A` +
               `Asante kwa ununuzi!`;
  
  window.open(`https://wa.me/?text=${text}`, '_blank');
}
