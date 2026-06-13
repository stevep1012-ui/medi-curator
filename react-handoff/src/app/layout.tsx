import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "메디큐레이터 · MediQ — AI 건강 가이드",
  description:
    "증상 분석, 복용 안전 검사, 비타민 궁합, 약국 찾기까지 — 약사 감수 정보로 안내하는 AI 건강 가이드. 한국어·영어·일본어·중국어 지원.",
  openGraph: {
    title: "메디큐레이터 · MediQ — AI 건강 가이드",
    description: "약사 감수 정보로 안내하는 AI 건강 가이드. 증상·복용 안전·비타민·약국 찾기.",
    type: "website",
  },
  icons: {
    icon: {
      url:
        "data:image/svg+xml," +
        encodeURIComponent(
          "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='#0a5d52'/><path d='M5 16h4l2.5-7 4 18 2.5-11h4.5' fill='none' stroke='white' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'/></svg>",
        ),
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a5d52" },
    { media: "(prefers-color-scheme: dark)", color: "#091211" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
