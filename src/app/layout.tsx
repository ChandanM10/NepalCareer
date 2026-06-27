import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NepalCareer — Nepal IT Jobs & Careers Platform",
  description:
    "Nepal's AI-powered job platform. Find IT jobs in Kathmandu and across Nepal. AI-powered matching, resume analysis, career advisor, and instant WhatsApp alerts.",
  keywords: [
    "Nepal jobs",
    "IT jobs Nepal",
    "Kathmandu jobs",
    "AI jobs",
    "job search Nepal",
    "career advisor",
    "resume analysis",
    "Fusemachines",
    "F1Soft",
    "Deerwalk",
    "Nepal IT careers",
  ],
  authors: [{ name: "NepalCareer" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "NepalCareer — Nepal IT Jobs & Careers",
    description: "Nepal's AI-powered job platform. Find IT jobs that fit your story.",
    siteName: "NepalCareer",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Ambient floating lights over the Bodhnath background */}
          <div className="ambient-lights" aria-hidden="true" />
          <div className="relative z-10">
            {children}
          </div>
          <Toaster />
          <SonnerToaster richColors closeButton position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
