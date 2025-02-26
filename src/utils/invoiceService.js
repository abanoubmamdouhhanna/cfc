import path from "path";
import { fileURLToPath } from "url";
import { unlink } from "fs";
import cloudinary from "./cloudinary.js"; // Import Cloudinary config
import { createInvoice } from "../utils/invoice.js"; // Import PDF invoice generator
import { capitalizeWords } from "./capitalize.js";
import locationModel from "../../DB/models/CFClocation.model.js";
import sendEmail from "./Emails/sendEmail.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function processInvoice(order, user) {
    const location = await locationModel.findById(order.locationId).lean();
    if (!location) return next(new Error("Invalid location ID", { cause: 400 }));
  

  try {
    const invoiceData = {
      shipping: {
        name: capitalizeWords(`${user.firstName} ${user.lastName}`),
        address: order.address,
        city: order.city,
        state: order.state,
        phone: order.phone,
        country: "USA",
        postal_code: 94111,
      },
      items: order.meals,
      subtotal: order.finalPrice - order.discount,
      discount:`${order.discount}%`,
      invoice_nr: order._id, 
      finalPrice: order.finalPrice,
      
      taxRate: location.taxRate,
      locationUrl: location.locationURL,
      locationTitle: location.title,
      

      tax: order.tax,
      totalPrice: order.totalPrice,
      date: order.createdAt,
    };

    // Define invoice PDF path
    const pdfPath =
      process.env.MOOD === "DEV"
        ? path.join(__dirname, `../../../../src/invoices/invoice_${order._id}.pdf`)
        : `/tmp/invoice_${order._id}.pdf`;

    // Generate invoice PDF
    await createInvoice(invoiceData, pdfPath);

    // Upload invoice to Cloudinary
    const uploadedInvoice = await cloudinary.uploader.upload(pdfPath, {
      folder: `${process.env.APP_NAME}/Order/${order.customId}/invoice`,
      public_id: `${order.customId}Invoice`,
      resource_type: "raw",
    });

    if (uploadedInvoice?.secure_url) {
        order.invoice = uploadedInvoice.secure_url;
        order.invoicePublicId = `${process.env.APP_NAME}/Order/${order.customId}/invoice/${order.customId}Invoice`;
        await order.save();

      // Remove local invoice file
      unlink(pdfPath, (err) => {
        if (err) console.error("Error deleting invoice file:", err);
      });

     await sendEmail({
            to: user.email,
            subject: "Order Invoice",
            attachments: [
                     {
                       path: uploadedInvoice.secure_url,
                       contentType: "application/pdf",
                     },]
          }).catch((err) => {
            console.error("Failed to send email:", err);
          });
      console.log(`Invoice sent to ${user.email}`);
    } else {
      console.error("Invoice upload failed: No secure_url returned.");
    }
  } catch (error) {
    console.error("Error in processInvoice:", error);
  }
}
