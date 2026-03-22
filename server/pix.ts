/**
 * Gerador de QR Code PIX (Padrão EMV - BACEN)
 * Gera o payload "Copia e Cola" e o QR Code em base64
 */
import QRCode from "qrcode";

// ── CRC16-CCITT ───────────────────────────────────────────────────────────
function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// ── TLV helper ────────────────────────────────────────────────────────────
function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

// ── Gerar payload EMV PIX ─────────────────────────────────────────────────
export interface PixOptions {
  pixKey: string;        // Chave PIX (CPF, CNPJ, e-mail, telefone, aleatória)
  amount: number;        // Valor em reais (ex: 50.00)
  merchantName: string;  // Nome do recebedor (máx 25 chars)
  merchantCity: string;  // Cidade do recebedor (máx 15 chars)
  txid: string;          // ID da transação (máx 25 chars alfanumérico)
  description?: string;  // Descrição opcional (máx 25 chars)
}

export function generatePixPayload(opts: PixOptions): string {
  const { pixKey, amount, merchantName, merchantCity, txid, description } = opts;

  // Campo 26: Merchant Account Information (PIX)
  const gui = tlv("00", "BR.GOV.BCB.PIX");
  const key = tlv("01", pixKey);
  const desc = description ? tlv("02", description.slice(0, 25)) : "";
  const merchantAccount = tlv("26", gui + key + desc);

  // Campo 62: Additional Data Field (TXID)
  const safeTxid = txid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25) || "***";
  const additionalData = tlv("62", tlv("05", safeTxid));

  // Valor formatado
  const amountStr = amount.toFixed(2);

  // Montar payload sem CRC
  const payload =
    tlv("00", "01") +                              // Payload Format Indicator
    tlv("01", "12") +                              // Point of Initiation Method (12 = dinâmico, 11 = estático)
    merchantAccount +
    tlv("52", "0000") +                            // Merchant Category Code
    tlv("53", "986") +                             // Transaction Currency (BRL)
    tlv("54", amountStr) +                         // Transaction Amount
    tlv("58", "BR") +                              // Country Code
    tlv("59", merchantName.slice(0, 25)) +         // Merchant Name
    tlv("60", merchantCity.slice(0, 15)) +         // Merchant City
    additionalData +
    "6304";                                         // CRC placeholder

  const crc = crc16(payload);
  return payload + crc;
}

// ── Gerar QR Code base64 ──────────────────────────────────────────────────
export async function generatePixQRCode(opts: PixOptions): Promise<{
  payload: string;
  qrCodeBase64: string;
}> {
  const payload = generatePixPayload(opts);
  const qrCodeBase64 = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    width: 300,
    margin: 2,
  });
  return { payload, qrCodeBase64 };
}

// ── Gerar TXID único ──────────────────────────────────────────────────────
export function generateTxid(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 25; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
