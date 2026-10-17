/**
 * Local client-side PDF generation & sharing utility
 * Bundled with local html2canvas & jspdf (zero external CDN dependencies)
 * Supports native Web Share API on mobile & instant download + WhatsApp sharing on desktop
 */

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
    const blob = await generatePdfBlob(element);
    const file = new File([blob], fileName, { type: "application/pdf" });

    // 1. Try Mobile Native File Sharing (Android / iOS / Safari / Chrome Mobile)
    if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title,
          text,
        });
        onSuccess?.("PDF shared successfully!");
        return true;
      } catch (err: any) {
        if (err.name === "AbortError") {
          // User closed the share sheet
          return false;
        }
      }
    }

    // 2. Desktop Fallback (Windows / Mac / Linux Chrome & Edge):
    // Instantly download the PDF file directly to their machine
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    // Open WhatsApp Web with formatted bill details
    const whatsappMsg = encodeURIComponent(
      `*${title}*\n${text}\n📄 The PDF invoice has been generated.`
    );
    window.open(`https://api.whatsapp.com/send?text=${whatsappMsg}`, "_blank");

    onSuccess?.("PDF downloaded! WhatsApp opened for sharing.");
    return true;
  } catch (err: any) {
    console.error("PDF generation/share failed:", err);
    // Ultimate fallback: open print dialog
    try {
      window.print();
      onSuccess?.("Opened print dialog to save as PDF");
      return true;
    } catch {
      onError?.(err);
      return false;
    }
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
