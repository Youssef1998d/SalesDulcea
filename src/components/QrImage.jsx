import { useEffect, useState } from "react";
import { qrDataUrl } from "../services/qr";

// Renders a QR code on screen (not just in PDFs) for a given value/token.
export function QrImage({ value, size = 132, style = {} }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!value) { setSrc(null); return; }
    qrDataUrl(value, size * 2).then(d => { if (alive) setSrc(d); });
    return () => { alive = false; };
  }, [value, size]);

  return (
    <div style={{
      width: size, height: size, borderRadius: 10, background: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", flexShrink: 0, ...style,
    }}>
      {src && <img src={src} alt="QR" width={size} height={size} style={{ display: "block" }} />}
    </div>
  );
}
