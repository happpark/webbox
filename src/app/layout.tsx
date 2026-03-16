import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Webbox – Discover Vibe-Coded Web Apps",
  description: "The app store for web apps built by indie makers and AI-assisted developers. Find tools, games, and creative projects built with vibe coding.",
  keywords: ["vibe coding", "web apps", "indie makers", "app store", "AI apps"],
  openGraph: {
    title: "Webbox – Discover Vibe-Coded Web Apps",
    description: "The app store for web apps built by indie makers and AI-assisted developers.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0a0a0f] text-white min-h-screen`}>
        <Header />
        <main>{children}</main>
        <footer className="border-t border-white/10 py-8 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
            <p>Webbox · The app store for vibe-coded web apps</p>
            <p className="mt-1">Built with love for the indie maker community</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
