/**
 * Client-side PDF generation & sharing helper
 * Supports sharing actual .pdf files via native Web Share API (WhatsApp, AirDrop, Email, etc.)
 * with zero-bundle-size footprint using dynamic CDN loading.
 */

export async function loadHtml2Pdf(): Promise<any> {
  if (typeof window === "undefined") return null;
  if ((window as any).html2pdf) return (window as any).html2pdf;
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="html2pdf"]');
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).html2pdf));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.async = true;
    script.onload = () => resolve((window as any).html2pdf);
    script.onerror = () => reject(new Error("Could not load PDF engine"));
    document.head.appendChild(script);
  });
}

export async function generatePdfBlob(element: HTMLElement, fileName: string): Promise<Blob> {
  const html2pdf = await loadHtml2Pdf();
  if (!html2pdf) throw new Error("PDF generator unavailable");
  const opt = {
    margin: [6, 6, 6, 6],
    filename: fileName,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };
  return await html2pdf().set(opt).from(element).outputPdf("blob");
}

export async function sharePdfFile({
  element,
  fileName,
  title,
  text,
  onSuccess,
  onError,
}: {
  element: HTMLElement;
  fileName: string;
  title: string;
  text: string;
  onSuccess?: (msg: string) => void;
  onError?: (err: any) => void;
}) {
  try {
    const blob = await generatePdfBlob(element, fileName);
    const file = new File([blob], fileName, { type: "application/pdf" });

    // 1. Try Native File Sharing (WhatsApp, Email, Telegram, AirDrop, Nearby Share)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title,
        text,
      });
      onSuccess?.("PDF shared successfully!");
      return true;
    }

    // 2. Try text/link sharing if file sharing is not supported by browser
    if (navigator.share) {
      await navigator.share({
        title,
        text: `${text}\n${window.location.href}`,
      });
      onSuccess?.("Shared successfully!");
      return true;
    }

    // 3. Fallback: Automatically download file & open WhatsApp share link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `${text}\n${window.location.href}`
    )}`;
    window.open(shareUrl, "_blank");
    onSuccess?.("PDF downloaded & WhatsApp opened for sharing!");
    return true;
  } catch (err: any) {
    if (err.name !== "AbortError") {
      onError?.(err);
    }
    return false;
  }
}

export async function downloadPdfFile(element: HTMLElement, fileName: string) {
  const html2pdf = await loadHtml2Pdf();
  const opt = {
    margin: [6, 6, 6, 6],
    filename: fileName,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };
  await html2pdf().set(opt).from(element).save();
}
