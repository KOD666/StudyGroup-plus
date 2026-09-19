import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Playfair_Display, DM_Sans, Newsreader } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StudyGroup+ | Editorial Academic Workspace",
  description:
    "A quiet room for serious study. Where the call lives inside your work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${playfair.variable} ${dmSans.variable} ${newsreader.variable}`}
      >
        <body className="bg-background text-on-surface font-sans antialiased selection:bg-[#ba5d1a]/20 selection:text-[#171615]">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

