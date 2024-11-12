import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/app/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'AI Text to Video',
  description: 'Convert your ideas into videos with our text-to-video AI tool',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}