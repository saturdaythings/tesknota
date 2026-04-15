import type { Metadata } from "next";
import {
  Playfair_Display,
  Cormorant_Garamond,
  DM_Mono,
  Jost,
} from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/lib/user-context";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "tesknota",
  description: "Fragrance tracker for Kiana and Sylvia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${cormorant.variable} ${dmMono.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="h-full overflow-hidden bg-[var(--off)] text-[var(--ink)]">
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
