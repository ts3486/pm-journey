import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PM Journey - AIと一緒にPM体験を積む",
  description:
    "AIエージェントとの対話を通じて、プロダクトマネジメントのスキルを実践的に磨くトレーニングプラットフォーム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-beige-50 text-brown-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
