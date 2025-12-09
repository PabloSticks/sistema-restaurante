import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateTicketPDF = (mesa, pedido, items) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200] 
  });

  const totalConsumo = items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0) + (pedido?.total || 0);
  const date = new Date().toLocaleString('es-CL');

  // --- CABECERA ---
  doc.setFontSize(14);
  doc.text('BUEN SABOR', 40, 10, { align: 'center' });
  
  doc.setFontSize(9);
  doc.text('Calle falsa 123', 40, 15, { align: 'center' });
  doc.text('Temuco, Chile', 40, 19, { align: 'center' });
  doc.text('--------------------------------', 40, 23, { align: 'center' });

  // --- INFO ORDEN ---
  doc.setFontSize(10);
  doc.text(`Mesa: ${mesa}`, 5, 29);
  doc.text(`Orden: #${pedido?.id || '---'}`, 5, 34);
  doc.text(`Fecha: ${date}`, 5, 39);
  
  // --- DETALLE ---
  const tableColumn = ["Cant", "Item", "Total"];
  const tableRows = [];

  if (pedido?.detalles) {
    pedido.detalles.forEach(d => {
      tableRows.push([d.cantidad, d.producto.nombre, `$${(d.precioUnit * d.cantidad).toLocaleString('es-CL')}`]);
    });
  }
  items.forEach(i => {
     tableRows.push([i.cantidad, i.nombre, `$${(i.precio * i.cantidad).toLocaleString('es-CL')}`]);
  });

  autoTable(doc, {
    startY: 43,
    head: [tableColumn],
    body: tableRows,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1, overflow: 'linebreak' },
    headStyles: { fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 10 }, 2: { halign: 'right' } },
    margin: { left: 2, right: 2 }
  });

  // --- TOTALES ---
  const finalY = doc.lastAutoTable.finalY + 5;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL: $${totalConsumo.toLocaleString('es-CL')}`, 75, finalY, { align: 'right' });
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text('Propina sugerida (10%): $' + Math.round(totalConsumo * 0.1).toLocaleString('es-CL'), 75, finalY + 5, { align: 'right' });

  doc.text('¡Gracias por su visita!', 40, finalY + 15, { align: 'center' });

  // Guardar / Abrir
  doc.save(`boleta_mesa_${mesa}.pdf`);
};