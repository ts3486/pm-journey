import type { Metadata } from "next";
import { NavBar } from "@/components/NavBar";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "PM Journey",
  description: "Web-based PM simulation app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <Providers>
          <NavBar />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
