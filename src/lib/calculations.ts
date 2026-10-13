/**
 * Billing calculation utilities
 * Used for both quotations and bills.
 */

export interface LineItemInput {
  quantity: number;
  rate: number;
  mrp: number;
  gstPercent: number;
  discountPercent?: number;
  isInterState?: boolean;
}

export interface LineItemCalculated {
  quantity: number;
  mrp: number;
  rate: number;
  gstPercent: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  amount: number;
}

export function calculateLineItem(
  input: LineItemInput
): LineItemCalculated {
  const { quantity, rate, mrp, gstPercent, discountPercent = 0, isInterState = false } = input;
  
  const baseAmount = quantity * rate;
  const discountAmount = (baseAmount * discountPercent) / 100;
  const taxableAmount = baseAmount - discountAmount;
  const gstAmount = (taxableAmount * gstPercent) / 100;
  
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  
  if (isInterState) {
    igstAmount = gstAmount;
  } else {
    cgstAmount = gstAmount / 2;
    sgstAmount = gstAmount / 2;
  }
  
  const amount = taxableAmount + gstAmount;
  
  return {
    quantity,
    mrp: round2(mrp),
    rate: round2(rate),
    gstPercent,
    discountPercent,
    discountAmount: round2(discountAmount),
    taxableAmount: round2(taxableAmount),
    gstAmount: round2(gstAmount),
    cgstAmount: round2(cgstAmount),
    sgstAmount: round2(sgstAmount),
    igstAmount: round2(igstAmount),
    amount: round2(amount),
  };
}

export interface TotalsInput {
  items: LineItemCalculated[];
}

export interface Totals {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  grandTotal: number;
}

export function calculateTotals(items: LineItemCalculated[]): Totals {
  const subtotal = round2(items.reduce((sum, item) => sum + item.quantity * item.rate, 0));
  const discountAmount = round2(items.reduce((sum, item) => sum + item.discountAmount, 0));
  const taxableAmount = round2(items.reduce((sum, item) => sum + item.taxableAmount, 0));
  const cgstAmount = round2(items.reduce((sum, item) => sum + item.cgstAmount, 0));
  const sgstAmount = round2(items.reduce((sum, item) => sum + item.sgstAmount, 0));
  const igstAmount = round2(items.reduce((sum, item) => sum + item.igstAmount, 0));
  const grandTotal = round2(taxableAmount + cgstAmount + sgstAmount + igstAmount);
  
  return {
    subtotal,
    discountAmount,
    taxableAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    grandTotal,
  };
}

function round2(num: number): number {
  return Math.round(num * 100) / 100;
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

// Convert number to words (Indian format)
export function numberToWords(amount: number): string {
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function convertHundreds(n: number): string {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100)
      return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    return (
      ones[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100 !== 0 ? " " + convertHundreds(n % 100) : "")
    );
  }

  function convertToWords(n: number): string {
    if (n === 0) return "Zero";
    if (n < 0) return "Minus " + convertToWords(-n);

    let result = "";
    
    if (n >= 10000000) {
      result += convertToWords(Math.floor(n / 10000000)) + " Crore ";
      n %= 10000000;
    }
    if (n >= 100000) {
      result += convertToWords(Math.floor(n / 100000)) + " Lakh ";
      n %= 100000;
    }
    if (n >= 1000) {
      result += convertToWords(Math.floor(n / 1000)) + " Thousand ";
      n %= 1000;
    }
    if (n > 0) {
      result += convertHundreds(n);
    }

    return result.trim();
  }

  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  let words = "Rupees " + convertToWords(rupees);
  if (paise > 0) {
    words += " and " + convertToWords(paise) + " Paise";
  }
  words += " Only";

  return words;
}
