import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_URL,
  BASE_APP_ID,
  farcasterEmbed,
} from "@/lib/appConfig";
import "./globals.css";

const previewImageUrl = `${APP_URL}/preview.png`;

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: APP_NAME,
  description: APP_DESCRIPTION,
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    type: "website",
    images: [previewImageUrl],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
    images: [previewImageUrl],
  },
  other: {
    "fc:miniapp": JSON.stringify(farcasterEmbed),
    "fc:frame": JSON.stringify(farcasterEmbed),
    ...(BASE_APP_ID ? { "base:app_id": BASE_APP_ID } : {}),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-950 text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
