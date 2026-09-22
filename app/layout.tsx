import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Newsreader, Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { CustomCursor } from "@/components/motion/CustomCursor";
import { SmoothScrollProvider } from "@/components/motion/SmoothScroll";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "StudyGroup+ — Editorial Academic Studio",
  description:
    "Near-monochrome, high-contrast, editorial collaborative study workspace.",
};

const themeInitScript = `
(function() {
  try {
    const saved = localStorage.getItem('studygroup_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.style.colorScheme = 'light';
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${newsreader.variable} ${inter.variable} ${jetbrainsMono.variable} dark`}
      >
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        </head>
        <body className="bg-[#0a0a0a] text-[#ededed] font-sans antialiased selection:bg-[#ededed] selection:text-[#0a0a0a] overflow-x-hidden">
          <ThemeProvider>
            <SmoothScrollProvider>
              <CustomCursor />
              {children}
            </SmoothScrollProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
