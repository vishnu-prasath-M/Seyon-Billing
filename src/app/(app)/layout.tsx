"use client";
import { AuthProvider } from "@/lib/auth-context";
import AppLayout from "@/components/AppLayout";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppLayout>{children}</AppLayout>
    </AuthProvider>
  );
}
