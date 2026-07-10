import type { Metadata } from "next";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { StudioShortcutModal } from "./components/StudioShortcutModal";
import "./globals.css";

export const metadata: Metadata = {
  title: "AnalityQ | Sportowe raporty statystyczne",
  description:
    "Platforma AnalityQ do raportów meczowych, prawdopodobieństw modelowych, edge, ryzyka i scenariuszy opartych o dane.",
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
