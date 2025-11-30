"use client";

import { memo, useMemo } from "react";
import QRCode from "react-qr-code";

interface ContactQRCodeProps {
  address: string;
  name?: string;
  size?: number;
  className?: string;
}

/**
 * 聯絡人 QR Code 生成器
 * Spec: 生成 Keylio 格式的 QR Code，供朋友掃描
 * 格式: { type: "keylio_contact", address: "0x...", name: "..." }
 */
function ContactQRCodeComponent({
  address,
  name,
  size = 200,
  className = "",
}: ContactQRCodeProps) {
  // Generate QR code data in Keylio format
  const qrData = useMemo(() => {
    const data = {
      type: "keylio_contact",
      address,
      name: name || undefined,
      chainId: "plasma_mainnet",
    };
    return JSON.stringify(data);
  }, [address, name]);

  return (
    <div className={`bg-white p-4 rounded-xl inline-block ${className}`}>
      <QRCode
        value={qrData}
        size={size}
        level="M"
        style={{
          height: "auto",
          maxWidth: "100%",
          width: "100%"
        }}
      />
    </div>
  );
}

export const ContactQRCode = memo(ContactQRCodeComponent);
export default ContactQRCode;
