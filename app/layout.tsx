import type { Metadata } from "next";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "AnalityQ | AI Sports Analytics",
  description:
    "Nowoczesna platforma AI Sports Analytics do raportów meczowych, trendów, ryzyka i scenariuszy opartych o dane.",
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
      </body>
    </html>
  );
}
