import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

export class InvoiceService {
  static async generateInvoice(order, companyInfo) {
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const { width, height } = page.getSize();
      
      // Embed fonts
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Colors
      const primaryColor = rgb(0.2, 0.2, 0.2);
      const secondaryColor = rgb(0.4, 0.4, 0.4);
      const accentColor = rgb(0.8, 0.2, 0.4);
      
      // Header
      page.drawText('INVOICE', {
        x: 50,
        y: height - 80,
        size: 24,
        font: boldFont,
        color: accentColor
      });
      
      // Company Info (Left side)
      page.drawText(companyInfo.companyName, {
        x: 50,
        y: height - 120,
        size: 16,
        font: boldFont,
        color: primaryColor
      });
      
      page.drawText(companyInfo.address, {
        x: 50,
        y: height - 140,
        size: 10,
        font: font,
        color: secondaryColor
      });
      
      page.drawText(`Phone: ${companyInfo.phone}`, {
        x: 50,
        y: height - 155,
        size: 10,
        font: font,
        color: secondaryColor
      });
      
      page.drawText(`Email: ${companyInfo.contactEmail}`, {
        x: 50,
        y: height - 170,
        size: 10,
        font: font,
        color: secondaryColor
      });
      
      // Order Info (Right side)
      page.drawText(`Order ID: ${order.id}`, {
        x: width - 200,
        y: height - 120,
        size: 12,
        font: boldFont,
        color: primaryColor
      });
      
      page.drawText(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, {
        x: width - 200,
        y: height - 135,
        size: 10,
        font: font,
        color: secondaryColor
      });
      
      page.drawText(`Status: ${order.status.toUpperCase()}`, {
        x: width - 200,
        y: height - 150,
        size: 10,
        font: font,
        color: secondaryColor
      });
      
      // Customer Info
      page.drawText('Bill To:', {
        x: 50,
        y: height - 220,
        size: 14,
        font: boldFont,
        color: primaryColor
      });
      
      page.drawText(order.customer.name, {
        x: 50,
        y: height - 240,
        size: 12,
        font: font,
        color: primaryColor
      });
      
      page.drawText(order.customer.email, {
        x: 50,
        y: height - 255,
        size: 10,
        font: font,
        color: secondaryColor
      });
      
      if (order.customer.phone) {
        page.drawText(order.customer.phone, {
          x: 50,
          y: height - 270,
          size: 10,
          font: font,
          color: secondaryColor
        });
      }
      
      // Shipping Address
      if (order.shippingAddress) {
        page.drawText('Ship To:', {
          x: 250,
          y: height - 220,
          size: 14,
          font: boldFont,
          color: primaryColor
        });
        
        const addressLines = order.shippingAddress.split('\n');
        addressLines.forEach((line, index) => {
          page.drawText(line, {
            x: 250,
            y: height - 240 - (index * 15),
            size: 10,
            font: font,
            color: secondaryColor
          });
        });
      }
      
      // Products Table Header
      const tableY = height - 320;
      page.drawText('Item', {
        x: 50,
        y: tableY,
        size: 12,
        font: boldFont,
        color: primaryColor
      });
      
      page.drawText('Qty', {
        x: 300,
        y: tableY,
        size: 12,
        font: boldFont,
        color: primaryColor
      });
      
      page.drawText('Price', {
        x: 350,
        y: tableY,
        size: 12,
        font: boldFont,
        color: primaryColor
      });
      
      page.drawText('Total', {
        x: 450,
        y: tableY,
        size: 12,
        font: boldFont,
        color: primaryColor
      });
      
      // Draw table lines
      page.drawLine({
        start: { x: 50, y: tableY - 10 },
        end: { x: width - 50, y: tableY - 10 },
        thickness: 1,
        color: secondaryColor
      });
      
      page.drawLine({
        start: { x: 50, y: tableY - 10 },
        end: { x: 50, y: tableY + 20 },
        thickness: 1,
        color: secondaryColor
      });
      
      page.drawLine({
        start: { x: width - 50, y: tableY - 10 },
        end: { x: width - 50, y: tableY + 20 },
        thickness: 1,
        color: secondaryColor
      });
      
      // Products
      let currentY = tableY - 30;
      let subtotal = 0;
      
      order.items.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        page.drawText(item.name, {
          x: 50,
          y: currentY,
          size: 10,
          font: font,
          color: primaryColor
        });
        
        page.drawText(item.quantity.toString(), {
          x: 300,
          y: currentY,
          size: 10,
          font: font,
          color: secondaryColor
        });
        
        page.drawText(`$${item.price.toFixed(2)}`, {
          x: 350,
          y: currentY,
          size: 10,
          font: font,
          color: secondaryColor
        });
        
        page.drawText(`$${itemTotal.toFixed(2)}`, {
          x: 450,
          y: currentY,
          size: 10,
          font: font,
          color: secondaryColor
        });
        
        currentY -= 20;
      });
      
      // Draw bottom line
      page.drawLine({
        start: { x: 50, y: currentY + 10 },
        end: { x: width - 50, y: currentY + 10 },
        thickness: 1,
        color: secondaryColor
      });
      
      // Totals
      const totalsY = currentY - 20;
      page.drawText('Subtotal:', {
        x: width - 200,
        y: totalsY,
        size: 12,
        font: font,
        color: secondaryColor
      });
      
      page.drawText(`$${subtotal.toFixed(2)}`, {
        x: width - 100,
        y: totalsY,
        size: 12,
        font: font,
        color: primaryColor
      });
      
      if (order.shipping) {
        page.drawText('Shipping:', {
          x: width - 200,
          y: totalsY - 20,
          size: 12,
          font: font,
          color: secondaryColor
        });
        
        page.drawText(`$${order.shipping.toFixed(2)}`, {
          x: width - 100,
          y: totalsY - 20,
          size: 12,
          font: font,
          color: primaryColor
        });
      }
      
      if (order.tax) {
        page.drawText('Tax:', {
          x: width - 200,
          y: totalsY - 40,
          size: 12,
          font: font,
          color: secondaryColor
        });
        
        page.drawText(`$${order.tax.toFixed(2)}`, {
          x: width - 100,
          y: totalsY - 40,
          size: 12,
          font: font,
          color: primaryColor
        });
      }
      
      page.drawText('Total:', {
        x: width - 200,
        y: totalsY - 60,
        size: 14,
        font: boldFont,
        color: accentColor
      });
      
      page.drawText(`$${order.total.toFixed(2)}`, {
        x: width - 100,
        y: totalsY - 60,
        size: 14,
        font: boldFont,
        color: accentColor
      });
      
      // Payment Method
      if (order.paymentMethod) {
        page.drawText(`Payment Method: ${order.paymentMethod}`, {
          x: 50,
          y: totalsY - 100,
          size: 10,
          font: font,
          color: secondaryColor
        });
      }
      
      // Notes
      if (order.adminNotes) {
        page.drawText('Notes:', {
          x: 50,
          y: totalsY - 120,
          size: 12,
          font: boldFont,
          color: primaryColor
        });
        
        page.drawText(order.adminNotes, {
          x: 50,
          y: totalsY - 140,
          size: 10,
          font: font,
          color: secondaryColor
        });
      }
      
      // Footer
      page.drawText('Thank you for your business!', {
        x: width / 2 - 100,
        y: 50,
        size: 12,
        font: font,
        color: accentColor
      });
      
      // Generate QR code for the order
      const qrCodeDataURL = await QRCode.toDataURL(order.id);
      
      // Convert QR code to PDF image
      const qrCodeImageBytes = await fetch(qrCodeDataURL).then(res => res.arrayBuffer());
      const qrCodeImage = await pdfDoc.embedPng(qrCodeImageBytes);
      
      // Add QR code to the bottom right
      page.drawImage(qrCodeImage, {
        x: width - 100,
        y: 30,
        width: 50,
        height: 50
      });
      
      // Serialize the PDF
      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
      
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw new Error('Failed to generate invoice');
    }
  }
  
  static async generateDeliveryLabel(order, companyInfo) {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const { width, height } = page.getSize();
      
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const primaryColor = rgb(0.2, 0.2, 0.2);
      const accentColor = rgb(0.8, 0.2, 0.4);
      
      // Header
      page.drawText('DELIVERY LABEL', {
        x: 50,
        y: height - 80,
        size: 20,
        font: boldFont,
        color: accentColor
      });
      
      // Company Info
      page.drawText(companyInfo.companyName, {
        x: 50,
        y: height - 120,
        size: 14,
        font: boldFont,
        color: primaryColor
      });
      
      page.drawText(companyInfo.address, {
        x: 50,
        y: height - 140,
        size: 10,
        font: font,
        color: primaryColor
      });
      
      // Order Info
      page.drawText(`Order ID: ${order.id}`, {
        x: 50,
        y: height - 180,
        size: 12,
        font: boldFont,
        color: primaryColor
      });
      
      page.drawText(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, {
        x: 50,
        y: height - 200,
        size: 10,
        font: font,
        color: primaryColor
      });
      
      // Shipping Address
      page.drawText('SHIP TO:', {
        x: 50,
        y: height - 250,
        size: 14,
        font: boldFont,
        color: accentColor
      });
      
      if (order.shippingAddress) {
        const addressLines = order.shippingAddress.split('\n');
        addressLines.forEach((line, index) => {
          page.drawText(line, {
            x: 50,
            y: height - 270 - (index * 20),
            size: 12,
            font: font,
            color: primaryColor
          });
        });
      }
      
      // Customer Info
      page.drawText(`Customer: ${order.customer.name}`, {
        x: 50,
        y: height - 350,
        size: 10,
        font: font,
        color: primaryColor
      });
      
      if (order.customer.phone) {
        page.drawText(`Phone: ${order.customer.phone}`, {
          x: 50,
          y: height - 370,
          size: 10,
          font: font,
          color: primaryColor
        });
      }
      
      // Items Summary
      page.drawText('Items:', {
        x: 50,
        y: height - 420,
        size: 12,
        font: boldFont,
        color: primaryColor
      });
      
      let currentY = height - 440;
      order.items.forEach((item, index) => {
        if (index < 5) { // Limit to first 5 items
          page.drawText(`${item.quantity}x ${item.name}`, {
            x: 50,
            y: currentY,
            size: 10,
            font: font,
            color: primaryColor
          });
          currentY -= 20;
        }
      });
      
      if (order.items.length > 5) {
        page.drawText(`... and ${order.items.length - 5} more items`, {
          x: 50,
          y: currentY,
          size: 10,
          font: font,
          color: primaryColor
        });
      }
      
      // QR Code
      const qrCodeDataURL = await QRCode.toDataURL(order.id);
      const qrCodeImageBytes = await fetch(qrCodeDataURL).then(res => res.arrayBuffer());
      const qrCodeImage = await pdfDoc.embedPng(qrCodeImageBytes);
      
      page.drawImage(qrCodeImage, {
        x: width - 120,
        y: height - 200,
        width: 80,
        height: 80
      });
      
      // Instructions
      page.drawText('Shipping Instructions:', {
        x: 50,
        y: 150,
        size: 12,
        font: boldFont,
        color: primaryColor
      });
      
      page.drawText('Handle with care. Fragile items inside.', {
        x: 50,
        y: 130,
        size: 10,
        font: font,
        color: primaryColor
      });
      
      page.drawText('Keep dry and avoid extreme temperatures.', {
        x: 50,
        y: 110,
        size: 10,
        font: font,
        color: primaryColor
      });
      
      // Admin Notes
      if (order.adminNotes) {
        page.drawText('Admin Notes:', {
          x: 50,
          y: 80,
          size: 12,
          font: boldFont,
          color: primaryColor
        });
        
        page.drawText(order.adminNotes, {
          x: 50,
          y: 60,
          size: 10,
          font: font,
          color: primaryColor
        });
      }
      
      const pdfBytes = await pdfDoc.save();
      return pdfBytes;
      
    } catch (error) {
      console.error('Error generating delivery label:', error);
      throw new Error('Failed to generate delivery label');
    }
  }
  
  static downloadPDF(pdfBytes, filename) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
