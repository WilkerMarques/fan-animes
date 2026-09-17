import { buildPixQrDataUrl } from "./pixQr";

test("rejects an empty Pix payload", () => {
  expect(() => buildPixQrDataUrl("")).toThrow("Pix copia e cola vazio.");
});
