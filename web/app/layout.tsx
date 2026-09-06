import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// IMPORT PARA SA GOOGLE LOGIN
import { GoogleOAuthProvider } from '@react-oauth/google'; 

import { AuthProvider } from "../context/AuthContext";
import { cn } from "../lib/utils";

// 👇 BAGONG IMPORT PARA SA DARK MODE 👇
import { ThemeProvider } from "../components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "School Clinic System",
  description: "Secure Medical Records Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 👇 DINAGDAG ANG suppressHydrationWarning (Important para sa next-themes) 👇
    <html lang="en" suppressHydrationWarning>
      {/* DINAGDAG ANG dark:bg-slate-900 PARA SA DARK BACKGROUND */}
      <body className={cn("min-h-screen bg-slate-50 dark:bg-slate-900 font-sans antialiased", inter.className)}>
        
        <GoogleOAuthProvider clientId="870089993580-tqc0kbjjptnec9tnhpidrf83rv5ob3vf.apps.googleusercontent.com">
          
          {/* 👇 BINALOT NATIN ANG BUONG APP NG THEME PROVIDER 👇 */}
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ThemeProvider>
          
        </GoogleOAuthProvider>
        
      </body>
    </html>
  );
}