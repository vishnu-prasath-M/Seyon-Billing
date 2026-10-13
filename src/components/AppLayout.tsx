"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const LayoutGridIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
    <rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" />
    <rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" />
  </svg>
);
const PackageIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
    <path d="M8 1.5L13.5 4.5v7L8 14.5 2.5 11.5v-7L8 1.5Z" />
    <path d="M2.5 4.5 8 7.5l5.5-3M8 7.5V14.5" />
  </svg>
);
const FileTextIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
    <path d="M9.5 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5L9.5 1.5Z" />
    <path d="M9.5 1.5V5H13M5.5 8.5h5M5.5 11h3" />
  </svg>
);
const ReceiptIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
    <path d="M3 2h10v12l-2-1.5L9 14l-1-1.5L7 14l-2-1.5L3 14V2Z" />
    <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" />
  </svg>
);
const UsersIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
    <circle cx="6" cy="5" r="2.5" /><path d="M1.5 13.5c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5" />
    <path d="M10.5 4c1.105 0 2 .895 2 2s-.895 2-2 2M14 13.5c0-2-1.344-3.703-3.196-4.296" />
  </svg>
);
const HistoryIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
    <circle cx="8" cy="8" r="6" /><path d="M8 5v3.5l2 1.5" />
  </svg>
);
const SettingsIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
    <path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    <path d="M12.5 8a4.5 4.5 0 0 0-.046-.67l1.25-1.044-1-1.732-1.524.636A4.5 4.5 0 0 0 9.5 4.5L9.25 3h-2.5L6.5 4.5a4.5 4.5 0 0 0-1.68.69L3.296 4.554l-1 1.732L3.546 7.33A4.5 4.5 0 0 0 3.5 8c0 .23.017.456.046.67L2.296 9.714l1 1.732 1.524-.636A4.5 4.5 0 0 0 6.5 11.5L6.75 13h2.5l.25-1.5a4.5 4.5 0 0 0 1.68-.69l1.524.636 1-1.732-1.25-1.044A4.5 4.5 0 0 0 12.5 8Z" />
  </svg>
);
const LogOutIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
    <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M10.5 11.5 14 8l-3.5-3.5M14 8H6" />
  </svg>
);
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 5h14M3 10h14M3 15h14" />
  </svg>
);
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M2 2l14 14M16 2 2 16" />
  </svg>
);

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutGridIcon /> },
  { href: "/products", label: "Products Master", icon: <PackageIcon /> },
  { href: "/quotations", label: "Quotations", icon: <FileTextIcon /> },
  { href: "/billing", label: "Billing & Invoices", icon: <ReceiptIcon /> },
  { href: "/customers", label: "Customer Master", icon: <UsersIcon /> },
  { href: "/history", label: "Transaction History", icon: <HistoryIcon /> },
  { href: "/settings", label: "Business Settings", icon: <SettingsIcon /> },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/billing") return pathname.startsWith("/billing") || pathname.startsWith("/bills");
    return pathname.startsWith(href);
  }


  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200/90 flex flex-col shadow-xs transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header with Prominent Seyon UPVC Logo */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3.5 no-underline group">
            <div className="relative">
              <img
                src="/seyon-logo.png"
                alt="Seyon UPVC Logo"
                className="h-12 w-12 object-contain flex-shrink-0 drop-shadow-xs transition-transform group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-[16px] tracking-tight text-[#0f3b4c] leading-none">
                SEYON UPVC
              </span>
              <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider mt-1 flex items-center gap-1">
                <span>Billing System</span>
                <span className="text-[9px] px-1 py-0.2 bg-amber-50 text-amber-700 rounded border border-amber-200 font-semibold">
                  v2.0
                </span>
              </span>
            </div>
          </Link>

          <button
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
            onClick={onClose}
            aria-label="Close menu"
          >
            <XIcon />
          </button>
        </div>

        {/* Workstation Status Badge */}
        <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-700">Billing Terminal</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wide">
            Online
          </span>
        </div>

        {/* Navigation Items with generous breathing space */}
        <nav className="p-3.5 space-y-1.5 flex-1 overflow-y-auto">
          <div className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu Navigation
          </div>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? "bg-[#087ea4] text-white shadow-xs font-bold"
                    : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-900"
                }`}
              >
                <span className={active ? "text-white" : "text-slate-400"}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/70">
          <div className="flex items-center gap-3 px-2 py-1.5 mb-2">
            <div className="w-9 h-9 rounded-full bg-[#087ea4] text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 shadow-2xs">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-800 truncate">
                {user?.name ? user.name.replace(/\s*\([^)]*\)/g, "") : "Billing Operator"}
              </div>
              <div className="text-[11px] text-slate-500 truncate">@{user?.username}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
          >
            <LogOutIcon />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const titles: Record<string, string> = {
    "/dashboard": "Workspace Dashboard",
    "/products": "Products & Pricing Master",
    "/quotations": "Estimates & Quotations",
    "/billing": "Tax Invoices & Billing",
    "/bills": "Tax Invoices & Billing",
    "/customers": "Customer Master Directory",
    "/history": "Transaction History",
    "/settings": "Business Settings",
  };
  const pageTitle = Object.entries(titles).find(([k]) => pathname.startsWith(k))?.[1] ?? "Seyon Billing";

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden text-slate-900 font-sans">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar with proper spacing & branding */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-6 md:px-8 flex items-center justify-between flex-shrink-0 z-10 print:hidden">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Open sidebar"
            >
              <MenuIcon />
            </button>
            <div>
              <h1 className="text-sm md:text-base font-bold text-slate-900 tracking-tight">
                {pageTitle}
              </h1>
              <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Seyon UPVC Billing & Workstation Portal
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-600 font-medium bg-slate-50 px-3.5 py-1.5 rounded-md border border-slate-200/60 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Main Workspace content */}
        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-8 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
