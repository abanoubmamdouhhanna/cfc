import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import fetch from "node-fetch";
import QRCode from "qrcode"; // For generating QR codes

export async function createInvoice(invoice, filePath) {
  const dir = path.dirname(filePath);
  await fs.promises.mkdir(dir, { recursive: true }).catch(console.error);

  let doc = new PDFDocument({ size: "A4", margin: 50 });

  await generateHeader(doc, invoice); // Pass location URL
  generateCustomerInformation(doc, invoice);
  generateInvoiceTable(doc, invoice);
  generateFooter(doc);

  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);
  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });
}

async function generateHeader(doc, invoice) {
  const logoUrl = "https://res.cloudinary.com/dj0xqaovt/image/upload/v1740437348/CFC/mainLogo_uhsjfk.png";

  try {
    const response = await fetch(logoUrl);
    const arrayBuffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    doc.image(imageBuffer, 50, 30, { width: 80 }); // Reduced logo size
  } catch (error) {
    console.error("Error loading logo:", error);
  }

  // Company Name and Address
  doc
    .fillColor("#444444")
    .fontSize(22)
    .text("CRUNCHY FRIED CHICKEN", 150, 35, { align: "right" })
    .fontSize(10)
    .text("3205 YANCEVILLE Street, NC, USA, 27405", 150, 55, { align: "right" })
    .fontSize(10)
    .text(`${invoice.locationTitle}`, 150, 65, { align: "right" });

  // Add QR code for location under the company name and address
  if (invoice) {
    let locationUrl =invoice.locationUrl
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(locationUrl);
      const qrCodeImageBuffer = Buffer.from(qrCodeDataUrl.split(",")[1], "base64");
      doc.image(qrCodeImageBuffer, 500, 80, { width: 50 }); // QR code under the address
      
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  }

  doc.moveDown();
}

function generateCustomerInformation(doc, invoice) {
  const { invoice_nr, date, shipping } = invoice;
  let y = 140; // Starting Y position

  // Validate required fields
  if (!invoice_nr || !date || !shipping) {
    throw new Error("Missing required invoice fields: invoice_nr, date, or shipping.");
  }

  // Invoice Title
  doc.fillColor("#444444").fontSize(24).text("INVOICE", 50, 100, { align: "center" });
  generateHr(doc, 130);

  // Invoice Number and Date
  doc
    .fontSize(12)
    .text("Invoice Number:", 50, y)
    .font("Helvetica-Bold")
    .text(invoice_nr, 150, y)
    .font("Helvetica")
    .text("Invoice Date:", 50, y + 15)
    .text(formatDate(new Date(date)), 150, y + 15);

  // Customer Details
  y += 40; // Move down for customer details
  doc
    .fontSize(12)
    .text("Client Details:", 50, y)
    .moveDown()
    .font("Helvetica-Bold")
    .text(`Name: ${shipping.name}`, 50, y + 15)
    .font("Helvetica")
    .text(`Address: ${shipping.address}, ${shipping.city}, ${shipping.state}, ${shipping.country}`, 50, y + 30)
    .font("Helvetica")
    .text(`Phone: ${shipping.phone}`, 50, y + 45);

  generateHr(doc, y + 65); // Horizontal line after customer details
}

function generateInvoiceTable(doc, invoice) {
  if (!Array.isArray(invoice.items)) {
    throw new Error("Invoice items must be an array.");
  }

  let y = 290; // Starting Y position for the table

  // Table Header
  doc.font("Helvetica-Bold");
  generateTableRow(doc, y, "Item", "Description", "Unit Cost", "Qty", "Total");
  generateHr(doc, y + 20);
  doc.font("Helvetica");

  // Table Rows
  invoice.items.forEach((item, i) => {
    y += 30; // Move down for each row
    const description = item.description ? item.description.slice(0, 25) : "No description";

    generateTableRow(
      doc,
      y,
      item.title || "Unnamed Item",
      description,
      formatCurrency(item.unitPrice || 0),
      item.quantity || 0,
      formatCurrency(item.finalPrice || 0)
    );

    generateHr(doc, y + 20); // Horizontal line after each row
  });

  // Summary Section
  y += 30; // Move down for summary
  doc.font("Helvetica-Bold");
  generateTableRow(doc, y, "", "", "Subtotal", "", formatCurrency(invoice.subtotal));
  generateTableRow(doc, y + 20, "", "", "Discount", "", `${invoice.discount}%`);
  generateTableRow(doc, y + 40, "", "", "Final Price", "", formatCurrency(invoice.finalPrice));
  generateTableRow(doc, y + 60, "", "", `Tax (${invoice.taxRate}%)`, "", formatCurrency(invoice.tax));
  generateTableRow(doc, y + 80, "", "", "Total Price", "", formatCurrency(invoice.totalPrice));
}

function generateFooter(doc) {
  doc
    .fontSize(12)
    .fillColor("#555555")
    .text("Payment is due within 3 days. Thank you for your business!", 50, 750, { align: "center", width: 500 });
}

function generateTableRow(doc, y, item, description, unitCost, quantity, lineTotal) {
  doc
    .fontSize(10)
    .text(item, 50, y, { width: 90 })
    .text(description, 160, y, { width: 180 })
    .text(unitCost, 360, y, { width: 60, align: "right" })
    .text(quantity, 430, y, { width: 40, align: "right" })
    .text(lineTotal, 500, y, { width: 60, align: "right" });
}

function generateHr(doc, y) {
  doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(date);
}

export default { createInvoice };
