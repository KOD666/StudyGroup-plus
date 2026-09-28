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
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
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
        className={`${newsreader.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      >
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        </head>
        <body className="bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans antialiased selection:bg-[var(--invert-bg)] selection:text-[var(--invert-text)] overflow-x-hidden">
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
