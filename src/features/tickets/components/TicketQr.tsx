import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** QR of the signed ticket token, drawn in the browser; black on white so it scans in print too. */
export function TicketQr({ token, alt }: { token: string; alt: string }) {
  // The image is kept together with the token it was drawn from: when the token changes,
  // the old QR is never shown for the new ticket while the new one is being drawn.
  const [qr, setQr] = useState<{ token: string; src: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(token, { errorCorrectionLevel: "M", margin: 2, width: 240 })
      .then((src) => !cancelled && setQr({ token, src }))
      .catch(() => !cancelled && setQr(null));
    return () => {
      cancelled = true;
    };
  }, [token]);

  return qr?.token === token ? (
    <img src={qr.src} alt={alt} width={240} height={240} className="h-60 w-60 bg-white" />
  ) : (
    <div className="h-60 w-60 animate-pulse bg-gray-100" aria-hidden="true" />
  );
}
