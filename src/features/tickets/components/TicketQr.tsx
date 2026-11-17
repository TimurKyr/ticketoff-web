import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** QR of the signed ticket token, drawn in the browser; black on white so it scans in print too. */
export function TicketQr({ token, alt }: { token: string; alt: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(token, { errorCorrectionLevel: "M", margin: 2, width: 240 })
      .then((url) => !cancelled && setSrc(url))
      .catch(() => !cancelled && setSrc(null));
    return () => {
      cancelled = true;
    };
  }, [token]);

  return src ? (
    <img src={src} alt={alt} width={240} height={240} className="h-60 w-60 bg-white" />
  ) : (
    <div className="h-60 w-60 animate-pulse bg-gray-100" aria-hidden="true" />
  );
}
