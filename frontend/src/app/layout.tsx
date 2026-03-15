import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Navbar from "@/components/Navbar";
import SpaceBackground from "@/components/SpaceBackground";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VTRockers Connect",
  description: "Meet the talented young people of our village",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#030b1a] text-slate-100`}>
        <ThemeProvider>
          {/* Animated space background — renders behind all content */}
          <SpaceBackground />
          {/* Content layer sits above the background */}
          <div className="relative" style={{ zIndex: 1 }}>
            <AuthProvider>
              <Navbar />
              <main>{children}</main>
            </AuthProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
