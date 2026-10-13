import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";
import { formatNumber, numberToWords } from "@/lib/calculations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;
    const user = auth.session;
    const { id } = await params;

    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        items: true,
        counter: true,
        createdBy: true,
      },
    });

    if (!bill) {
      return new NextResponse("Bill not found", { status: 404 });
    }

    // Counter isolation check
    if (bill.counterId !== user.counterId) {
      return new NextResponse("Forbidden: Access restricted to assigned counter", {
        status: 403,
      });
    }

    const settings = (await prisma.companySettings.findFirst()) || {
      name: "SEYON UPVC WINDOWS & DOORS",
      address: "SF No 245, Avinashi Road, Civil Aerodrome Post",
      city: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "641014",
      phone: "+91 98422 12345",
      email: "seyonupvc@gmail.com",
      website: "www.seyonupvc.com",
      gstin: "33AABCS1234A1Z5",
      bankName: "State Bank of India",
      bankAccount: "38920192831",
      bankIFSC: "SBIN0001234",
      bankBranch: "Coimbatore Main Branch",
    };

    let logoBase64 = "/seyon-logo.png";
    try {
      const logoPath = path.join(process.cwd(), "public", "seyon-logo.png");
      if (fs.existsSync(logoPath)) {
        logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;
      }
    } catch {
      // fallback
    }

    const snap = (bill.customerSnapshot as any) || {};
    const customerName = snap.name || "Customer";
    const customerPhone = snap.phone || "";
    const customerAddress = snap.address || "";
    const customerCity = snap.city || "";
    const customerGstin = snap.gstin || "";
    const placeOfSupply = bill.placeOfSupply || snap.placeOfSupply || "Tamil Nadu";

    const hasIgst = Number(bill.igstAmount) > 0;
    const totalTaxAmount = hasIgst
      ? Number(bill.igstAmount)
      : Number(bill.cgstAmount) + Number(bill.sgstAmount);

    const totalQuantity = bill.items.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0
    );

    const totalDiscounts = bill.items.reduce((sum, item) => {
      const d =
        Number(item.discountAmount) ||
        (Number(item.discountPercent)
          ? (Number(item.quantity) * Number(item.rate) * Number(item.discountPercent)) / 100
          : 0);
      return sum + d;
    }, 0);

    const formattedDate = new Date(bill.invoiceDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const rowsHtml = bill.items
      .map((it) => {
        const itemDiscAmount =
          Number(it.discountAmount) ||
          (Number(it.discountPercent)
            ? (Number(it.quantity) * Number(it.rate) * Number(it.discountPercent)) / 100
            : 0);

        const itemTaxAmount =
          Number(it.gstAmount) ||
          (Number(it.taxableAmount) * Number(it.gstPercent)) / 100;

        const offPercent =
          it.mrp && Number(it.mrp) > Number(it.rate)
            ? Math.round(((Number(it.mrp) - Number(it.rate)) / Number(it.mrp)) * 100)
            : 0;

        return `
      <tr>
        <td class="item-desc">
          <div class="item-name">${it.productName}</div>
          ${it.productCode ? `<div class="item-code">${it.productCode}</div>` : ""}
        </td>
        <td class="text-center font-mono">${it.hsnSac || "-"}</td>
        <td class="text-right">${formatNumber(Number(it.quantity))} ${it.unit || "PCS"}</td>
        <td class="text-right">
          ${it.mrp ? `<div>${formatNumber(Number(it.mrp))}</div>${offPercent ? `<div class="sub-disc">(${offPercent}% OFF)</div>` : ""}` : "-"}
        </td>
        <td class="text-right font-medium">${formatNumber(Number(it.rate))}</td>
        <td class="text-right">
          ${itemDiscAmount > 0 ? `<div>${formatNumber(itemDiscAmount)}</div><div class="sub-disc">(${Number(it.discountPercent)}%)</div>` : "-"}
        </td>
        <td class="text-right">
          <div>${formatNumber(itemTaxAmount)}</div>
          <div class="sub-disc">(${Number(it.gstPercent)}%)</div>
        </td>
        <td class="text-right font-bold">${formatNumber(Number(it.amount))}</td>
      </tr>`;
      })
      .join("");

    const websiteDisplay = (settings.website || "WWW.SEYONUPVC.COM").toUpperCase();

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Tax Invoice - ${bill.invoiceNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 14mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      color: #111827;
      margin: 0;
      padding: 0;
      background: #fff;
      line-height: 1.45;
    }
    .doc-type {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #1f2937;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .header {
      display: flex;
      align-items: flex-start;
      gap: 18px;
      padding-bottom: 14px;
    }
    .logo-img {
      height: 76px;
      width: auto;
      max-width: 85px;
      object-fit: contain;
    }
    .company-title {
      font-size: 20px;
      font-weight: 800;
      color: #087ea4;
      line-height: 1.15;
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: -0.2px;
    }
    .company-addr {
      font-size: 10.5px;
      color: #4b5563;
      margin-bottom: 5px;
      line-height: 1.35;
    }
    .company-meta {
      font-size: 10.5px;
      color: #374151;
      line-height: 1.4;
    }
    .banner {
      background: #EEF4F7;
      border: 1px solid #D5E3EB;
      color: #1f2937;
      padding: 8px 14px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 12px;
      border-radius: 2px;
    }
    .banner .val { font-weight: 700; color: #111827; }
    .parties-grid {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 11px;
      gap: 16px;
    }
    .col-bill { flex: 5; }
    .col-ship { flex: 4; }
    .col-sales { flex: 3; text-align: right; }
    .sec-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #1f2937;
      margin-bottom: 3px;
      letter-spacing: 0.5px;
    }
    .cust-name {
      font-size: 12px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 2px;
    }
    .cust-meta {
      font-size: 10.5px;
      color: #4b5563;
      line-height: 1.35;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      border-top: 2px solid #087ea4;
      margin-bottom: 8px;
    }
    table.items-table th {
      padding: 8px 5px;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      border-bottom: 1px solid #d1d5db;
      color: #111827;
      letter-spacing: 0.3px;
    }
    table.items-table td {
      padding: 8px 5px;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: top;
    }
    .item-desc { text-align: left; }
    .item-name { font-weight: 700; text-transform: uppercase; color: #111827; line-height: 1.3; }
    .item-code { font-size: 9px; color: #6b7280; font-family: monospace; margin-top: 2px; }
    .sub-disc { font-size: 8.5px; color: #6b7280; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }
    .subtotal-bar {
      border-top: 2px solid #087ea4;
      border-bottom: 1px solid #087ea4;
      padding: 8px 5px;
      display: flex;
      justify-content: space-between;
      font-weight: 700;
      font-size: 10.5px;
      margin-bottom: 16px;
    }
    .subtotal-cols {
      display: flex;
      gap: 20px;
      text-align: right;
    }
    .bottom-grid {
      display: flex;
      gap: 30px;
      font-size: 10.5px;
    }
    .bottom-left { flex: 7; }
    .bottom-right { flex: 5; }
    .sec-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #111827;
      margin-bottom: 4px;
      letter-spacing: 0.5px;
    }
    .bank-info {
      font-size: 10px;
      color: #374151;
      margin-bottom: 14px;
      line-height: 1.4;
    }
    .terms-list {
      font-size: 9.5px;
      color: #4b5563;
      line-height: 1.45;
    }
    .tax-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      color: #374151;
    }
    .tax-box {
      border-bottom: 1px solid #d1d5db;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .total-bar {
      border-top: 2px solid #111827;
      border-bottom: 2px solid #111827;
      padding: 6px 0;
      display: flex;
      justify-content: space-between;
      font-size: 13.5px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
    }
    .words-box {
      text-align: right;
      margin-bottom: 24px;
    }
    .words-label { font-size: 9.5px; color: #6b7280; font-weight: 500; }
    .words-val { font-size: 10.5px; font-weight: 600; color: #111827; line-height: 1.35; }
    .sig-area { text-align: right; }
    .sig-script {
      font-family: Georgia, serif;
      font-style: italic;
      font-size: 22px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
      padding-right: 14px;
    }
    .sig-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #4b5563; }
    .sig-comp { font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #111827; }
    .actions-bar {
      margin-bottom: 18px;
      text-align: right;
    }
    .btn-print {
      background: #087ea4;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
    }
    @media print {
      .actions-bar { display: none; }
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <div class="actions-bar">
    <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="doc-type">TAX INVOICE</div>

  <div class="header">
    <img src="${logoBase64}" alt="Seyon UPVC Logo" class="logo-img" />
    <div>
      <h1 class="company-title">${settings.name}</h1>
      <div class="company-addr">${settings.address || "SF No 245, Avinashi Road, Civil Aerodrome Post, Coimbatore, Tamil Nadu - 641014"}</div>
      <div class="company-meta">
        <div><strong>GSTIN:</strong> ${settings.gstin || "33AABCS1234A1Z5"}</div>
        <div><strong>Email:</strong> ${settings.email || "seyonupvc@gmail.com"}</div>
        <div><strong>${websiteDisplay}:</strong> <span style="color: #087ea4;">${websiteDisplay}</span></div>
      </div>
    </div>
  </div>

  <div class="banner">
    <div>Invoice No.: <span class="val">${bill.invoiceNumber}</span></div>
    <div>Invoice Date: <span class="val">${formattedDate}</span></div>
    <div>Status: <span class="val">${bill.status}</span></div>
  </div>

  <div class="parties-grid">
    <div class="col-bill">
      <div class="sec-label">BILL TO</div>
      <div class="cust-name">${customerName}</div>
      <div class="cust-meta">Place of Supply: <strong>${placeOfSupply}</strong></div>
      ${customerPhone ? `<div class="cust-meta">Ph: ${customerPhone}</div>` : ""}
      ${customerAddress ? `<div class="cust-meta">${customerAddress}${customerCity ? `, ${customerCity}` : ""}</div>` : ""}
      ${customerGstin ? `<div class="cust-meta" style="color: #087ea4; font-weight: 600;">GSTIN: ${customerGstin}</div>` : ""}
    </div>

    <div class="col-ship">
      <div class="sec-label">SHIP TO</div>
      <div class="cust-name">${customerName}</div>
      <div class="cust-meta">${customerAddress || "Same as Billing Address"}</div>
    </div>

    <div class="col-sales">
      <div class="sec-label">DISPATCH & TERMINAL</div>
      <div style="font-weight: 700; font-family: monospace; font-size: 11.5px;">${(bill as any).paymentMode || "CASH"}</div>
      <div class="cust-meta">Counter: ${bill.counter?.name || "Counter 1"}</div>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="text-align: left;">ITEMS/SERVICES</th>
        <th style="width: 70px; text-align: center;">HSN/SAC</th>
        <th style="width: 55px; text-align: right;">QTY.</th>
        <th style="width: 65px; text-align: right;">MRP</th>
        <th style="width: 75px; text-align: right;">RATE</th>
        <th style="width: 65px; text-align: right;">DISC.</th>
        <th style="width: 65px; text-align: right;">TAX</th>
        <th style="width: 85px; text-align: right;">AMOUNT</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="subtotal-bar">
    <span>SUBTOTAL</span>
    <div class="subtotal-cols">
      <span style="width: 55px;">${formatNumber(totalQuantity)}</span>
      <span style="width: 70px;">₹ ${formatNumber(totalDiscounts || Number(bill.discountAmount))}</span>
      <span style="width: 65px;">₹ ${formatNumber(totalTaxAmount)}</span>
      <span style="width: 85px;">₹ ${formatNumber(Number(bill.grandTotal))}</span>
    </div>
  </div>

  <div class="bottom-grid">
    <div class="bottom-left">
      <div class="sec-title">BANK DETAILS</div>
      <div class="bank-info">
        <div><strong>Name:</strong> ${settings.name}</div>
        <div><strong>IFSC Code:</strong> ${settings.bankIFSC || "SBIN0001234"}</div>
        <div><strong>Account No:</strong> <strong>${settings.bankAccount || "38920192831"}</strong></div>
        <div><strong>Bank:</strong> ${settings.bankName || "State Bank of India"}, ${settings.bankBranch || "Coimbatore Main Branch"}</div>
      </div>

      <div class="sec-title">TERMS AND CONDITIONS</div>
      <div class="terms-list">
        <div>1. Goods once sold will not be taken back or exchanged.</div>
        <div>2. 100% payment before load from warehouse.</div>
        <div>3. Transportation and site unloading excluded unless specified.</div>
        <div>4. 15 years warranty on UPVC profiles against discoloration.</div>
        <div>5. All disputes subject to local jurisdiction only.</div>
        <div>6. Interest @ 18% p.a. will be charged on overdue payments.</div>
      </div>
    </div>

    <div class="bottom-right">
      <div class="tax-box">
        <div class="tax-row">
          <span>Taxable Amount</span>
          <span>₹ ${formatNumber(Number(bill.taxableAmount))}</span>
        </div>
        ${!hasIgst ? `
          <div class="tax-row">
            <span>CGST @9%</span>
            <span>₹ ${formatNumber(Number(bill.cgstAmount))}</span>
          </div>
          <div class="tax-row">
            <span>SGST @9%</span>
            <span>₹ ${formatNumber(Number(bill.sgstAmount))}</span>
          </div>
        ` : `
          <div class="tax-row">
            <span>IGST @18%</span>
            <span>₹ ${formatNumber(Number(bill.igstAmount))}</span>
          </div>
        `}
      </div>

      <div class="total-bar">
        <span>Total Amount</span>
        <span>₹ ${formatNumber(Number(bill.grandTotal))}</span>
      </div>

      <div class="words-box">
        <div class="words-label">Total Amount (in words)</div>
        <div class="words-val">${numberToWords(Number(bill.grandTotal))}</div>
      </div>

      <div class="sig-area">
        <div class="sig-script">Seyon.</div>
        <div class="sig-label">AUTHORISED SIGNATORY FOR</div>
        <div class="sig-comp">${settings.name}</div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      if (window.location.search.includes('print=true')) {
        window.print();
      }
    };
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error: any) {
    return new NextResponse(error.message || "Internal server error", { status: 500 });
  }
}
