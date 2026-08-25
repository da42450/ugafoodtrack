import type { Metadata, Viewport } from "next";
import { Fraunces, Karla } from "next/font/google";
import { PlateProvider } from "@/state/plate";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const karla = Karla({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "UGA Plate",
  description:
    "Scan dining hall labels, match today’s UGA menu, and track your plate calories.",
  applicationName: "UGA Plate",
  appleWebApp: {
    capable: true,
    title: "UGA Plate",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#BA0C2F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${karla.variable} h-full`}>
      <body className="min-h-full antialiased">
        <PlateProvider>
          <div className="mx-auto flex min-h-full w-full max-w-lg flex-col geo-bg">
            {children}
          </div>
        </PlateProvider>
      </body>
    </html>
  );
}
