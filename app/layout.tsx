import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://exit-planner.vercel.app";

export const metadata: Metadata = {
  title: "Exit Planner",
  description: "Set your exit strategy for held coins — Farcaster MiniApp",
  openGraph: {
    title: "Exit Planner",
    description: "Set your exit strategy for held coins",
    images: [`${appUrl}/api/og`],
  },
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: `${appUrl}/api/og`,
      button: { title: "Open Exit Planner", action: { type: "launch_frame", url: appUrl } },
    }),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
