import type { Metadata } from "next";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { StudioShortcutModal } from "./components/StudioShortcutModal";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://anality-q.vercel.app"),
  title: "AnalityQ | Zobacz mecz głębiej",
  description:
    "Forma, dom i wyjazd, składy, absencje, strzały, rożne, kartki i najważniejsze sygnały w jednym raporcie.",
  openGraph: {
    title: "AnalityQ | Zobacz mecz głębiej",
    description: "Czytelne raporty meczowe oparte na danych i kontekście.",
    images: [{ url: "/analityq-og-background.png", width: 1200, height: 630 }],
    locale: "pl_PL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body>
        <Header />
        <main className="flex-1 overflow-hidden">{children}</main>
        <Footer />
        <StudioShortcutModal />
      </body>
    </html>
  );
}
