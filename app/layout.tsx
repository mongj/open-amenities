import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { Toaster } from "sonner";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Open Amenities",
  description: "Discover free public amenities in Singapore — power outlets, water coolers, and hidden gems across the city",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Open Amenities",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#E07A5F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --font-display: ${bricolage.style.fontFamily};
              --font-body: ${dmSans.style.fontFamily};
            }
          `
        }} />
      </head>
      <body className={`${bricolage.variable} ${dmSans.variable}`}>
        {children}
        <ServiceWorkerRegistration />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
