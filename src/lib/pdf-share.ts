/**
 * Local client-side PDF generation & WhatsApp sharing utility
 * Guarantees direct PDF file attachment on mobile devices via native Web Share API
 * Provides direct download + public PDF access link for desktop WhatsApp Web
 */

import html2canvas from "html2canvas";
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

  // Subsequent pages if content overflows A4
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
  try {
    const blob = await generatePdfBlob(element);
    const file = new File([blob], fileName, { type: "application/pdf" });

    // 1. Try Native Web Share with the actual PDF file
    // Supported on Android Chrome, iOS Safari, and modern desktop browsers.
    // IMPORTANT: We do not include a heavy text body alongside files because WhatsApp's
    // Android intent handler prioritizes text and drops the PDF file attachment if text is present.
    // By passing only files and title, WhatsApp is forced to open as a Document Share with the PDF attached!
    const canShareFiles =
      typeof navigator !== "undefined" &&
      !!navigator.canShare &&
      navigator.canShare({ files: [file] });

    if (canShareFiles) {
      try {
        await navigator.share({
          files: [file],
          title: title || fileName,
        });
        onSuccess?.("PDF shared successfully!");
        return true;
      } catch (err: any) {
        if (err.name === "AbortError") {
          // User closed share dialog intentionally
          return false;
        }
        console.warn("Native file share encountered an issue, using fallback:", err);
      }
    }

    // 2. Fallback for Desktop Browsers (e.g. WhatsApp Web)
    // Desktop WhatsApp Web cannot accept binary files directly via URL parameters.
    // Therefore:
    // a) Automatically download the PDF to user's computer
    // b) Formulate WhatsApp text with invoice summary + direct online PDF link
    // c) Open WhatsApp Web
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);

    let finalMessage = text || `*SEYON UPVC WINDOWS & DOORS*\n📄 ${fileName}`;
    if (publicUrl) {
      finalMessage += `\n\n📥 *Download / View Official PDF:*\n${publicUrl}`;
    }

    const waUrl = getWhatsAppUrl(phone, finalMessage);
    if (typeof window !== "undefined") {
      window.open(waUrl, "_blank");
    }

    onSuccess?.("PDF downloaded! WhatsApp opened to send invoice.");
    return true;
  } catch (err: any) {
    console.error("PDF share error:", err);
    onError?.(err);
    return false;
  }
}
