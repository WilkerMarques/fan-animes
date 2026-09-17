import QRCode from "qrcode";

export function buildPixQrDataUrl(copiaCola) {
  const copia = (copiaCola || "").trim();
  if (!copia) {
    throw new Error("Pix copia e cola vazio.");
  }
  return QRCode.toDataURL(copia, { width: 280, margin: 2, color: { dark: "#000000", light: "#ffffff" } });
}
