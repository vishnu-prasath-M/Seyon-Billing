/**
 * Local client-side PDF generation & WhatsApp sharing utility
 * Bundled with local html2canvas & jspdf (zero external CDN dependencies)
 * Guarantees WhatsApp opens seamlessly without popup blocker issues on desktop & mobile
 */

export function formatWhatsAppPhone(phone?: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 11) return `91${digits.slice(1)}`;
  return digits;
}

export function getWhatsAppUrl(phone?: string, text?: string): string {
  const formattedPhone = formatWhatsAppPhone(phone);
  const encodedText = text ? encodeURIComponent(text) : "";
  if (formattedPhone) {
    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

export async function generatePdfBlob(element: HTMLElement): Promise<Blob> {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    windowWidth: 1024,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF("p", "mm", "a4");
  const imgWidth = 210;
  const pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Add image to A4 page
  pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
  return pdf.output("blob");
}

export async function sharePdfFile({
  element,
  fileName,
  title,
  text,
  phone,
  onSuccess,
  onError,
}: {
  element: HTMLElement;
  fileName: string;
  title: string;
  text: string;
  phone?: string;
  onSuccess?: (msg: string) => void;
  onError?: (err: any) => void;
}) {
  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  const waUrl = getWhatsAppUrl(phone, text);

  // Synchronously open a placeholder window on desktop to bypass browser popup blockers
  let waWindow: Window | null = null;
  if (!isMobile && typeof window !== "undefined") {
    try {
      waWindow = window.open("about:blank", "_blank");
      if (waWindow) {
        waWindow.document.write(
          `<!DOCTYPE html><html><head><title>Opening WhatsApp...</title><style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#f8fafc;}div{text-align:center;padding:24px;border:1px solid #334155;border-radius:12px;background:#1e293b;max-width:360px;}h3{margin:0 0 8px 0;color:#22c55e;}p{margin:0;font-size:13px;color:#94a3b8;}</style></head><body><div><h3>Opening WhatsApp...</h3><p>Preparing PDF invoice and opening WhatsApp chat...</p></div></body></html>`
        );
      }
    } catch {
      // Ignored if window opening failed
    }
  }

  try {
    const blob = await generatePdfBlob(element);
    const file = new File([blob], fileName, { type: "application/pdf" });

    // Download PDF file locally so it is ready to be attached or archived
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);

    // 1. Mobile Native Web Share (Android / iOS):
    // Allows sending the actual PDF file directly into WhatsApp
    if (
      isMobile &&
      typeof navigator !== "undefined" &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          files: [file],
          title,
          text,
        });
        onSuccess?.("Invoice PDF shared successfully!");
        return true;
      } catch (err: any) {
        if (err.name === "AbortError") {
          return false;
        }
      }
    }

    // 2. Open WhatsApp Web or WhatsApp mobile app directly
    if (waWindow && !waWindow.closed) {
      waWindow.location.href = waUrl;
    } else {
      if (isMobile) {
        window.location.href = waUrl;
      } else {
        window.open(waUrl, "_blank");
      }
    }

    onSuccess?.("PDF downloaded! WhatsApp opened to send invoice.");
    return true;
  } catch (err: any) {
    console.error("PDF generation/share error:", err);
    if (waWindow && !waWindow.closed) {
      waWindow.location.href = waUrl;
    } else {
      window.open(waUrl, "_blank");
    }
    onError?.(err);
    return false;
  }
}

export async function downloadPdfFile(element: HTMLElement, fileName: string) {
  const blob = await generatePdfBlob(element);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
