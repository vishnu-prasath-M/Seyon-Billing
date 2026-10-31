/**
 * Local client-side PDF generation & WhatsApp sharing utility
 * Powered by html2canvas-pro for full modern CSS (oklch, lab, Tailwind v4) support
 * Guarantees WhatsApp opens seamlessly on both desktop & mobile without popup blocker issues
 */

import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

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

  let heightLeft = imgHeight;
  let position = 0;

  // First page
  pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Subsequent pages if document overflows A4
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  return pdf.output("blob");
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
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function sharePdfFile({
  element,
  fileName,
  title,
  text,
  phone,
  publicUrl,
  onSuccess,
  onError,
}: {
  element: HTMLElement;
  fileName: string;
  title: string;
  text?: string;
  phone?: string;
  publicUrl?: string;
  onSuccess?: (msg: string) => void;
  onError?: (err: any) => void;
}): Promise<boolean> {
  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  // Synchronously open a placeholder window on desktop to completely eliminate popup blockers
  let waWindow: Window | null = null;
  if (!isMobile && typeof window !== "undefined") {
    try {
      waWindow = window.open("about:blank", "_blank");
      if (waWindow) {
        waWindow.document.write(
          `<!DOCTYPE html><html><head><title>Opening WhatsApp...</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#f8fafc;}div{text-align:center;padding:28px 24px;border:1px solid #334155;border-radius:16px;background:#1e293b;max-width:380px;box-shadow:0 10px 25px -5px rgba(0,0,0,0.3);}h3{margin:0 0 10px 0;color:#22c55e;font-size:18px;}p{margin:0 0 16px 0;font-size:13px;color:#94a3b8;line-height:1.5;}.spinner{width:32px;height:32px;border:3px solid #334155;border-top-color:#22c55e;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px;}@keyframes spin{to{transform:rotate(360deg);}}</style></head><body><div><div class="spinner"></div><h3>Opening WhatsApp...</h3><p>Preparing PDF invoice and opening WhatsApp...</p></div></body></html>`
        );
      }
    } catch {
      // Ignored if window opening was blocked
    }
  }

  let finalMessage = text || `*SEYON UPVC*\n📄 ${fileName}`;
  if (publicUrl) {
    finalMessage += `\n\n📥 *Download / View Official PDF:*\n${publicUrl}`;
  }
  const waUrl = getWhatsAppUrl(phone, finalMessage);

  try {
    const blob = await generatePdfBlob(element);
    const file = new File([blob], fileName, { type: "application/pdf" });

    // 1. Mobile Native Web Share (Android / iOS)
    // Allows sending the actual PDF file directly into WhatsApp without text override
    const canShareFiles =
      isMobile &&
      typeof navigator !== "undefined" &&
      !!navigator.canShare &&
      navigator.canShare({ files: [file] });

    if (canShareFiles) {
      try {
        await navigator.share({
          files: [file],
          title: title || fileName,
        });
        if (waWindow && !waWindow.closed) waWindow.close();
        onSuccess?.("PDF shared successfully!");
        return true;
      } catch (err: any) {
        if (err.name === "AbortError") {
          // User intentionally cancelled the OS share sheet
          if (waWindow && !waWindow.closed) waWindow.close();
          return false;
        }
        console.warn("Native file share issue, falling back to direct URL:", err);
      }
    }

    // 2. Desktop & Fallback Mode
    // Automatically download the PDF locally so it's ready to attach or archive
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);

    // Open WhatsApp seamlessly
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

    // Fallback: ALWAYS ensure WhatsApp opens so user is never left stuck
    if (waWindow && !waWindow.closed) {
      waWindow.location.href = waUrl;
    } else {
      if (isMobile) {
        window.location.href = waUrl;
      } else {
        window.open(waUrl, "_blank");
      }
    }

    onError?.(err);
    return false;
  }
}
