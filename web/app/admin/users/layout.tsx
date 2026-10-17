import React from "react";
// Depende kung nasaan ang AppLayout mo, kadalasan ito ang tamang path:
import AppLayout from "@/components/layout/AppLayout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}