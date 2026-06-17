import QRCode from "qrcode";

// Generate a PNG data URL encoding the given text (used in PO + invoice PDFs).
export async function qrDataUrl(text, size = 160) {
  try {
    return await QRCode.toDataURL(String(text), {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0a1628", light: "#ffffff" },
    });
  } catch {
    return null;
  }
}
