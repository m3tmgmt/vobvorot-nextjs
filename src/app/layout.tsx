import type { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Cart } from "@/components/Cart";
import { Wishlist } from "@/components/Wishlist";
import { FloatingCartIcons } from "@/components/FloatingCartIcons";
import { Effects } from "@/components/Effects";
import { SecretDetector } from "@/components/SecretDetector";
import { PuzzleProgress } from "@/components/PuzzleProgress";
import { MusicPlayer } from "@/components/MusicPlayer";
import { CartProvider } from "@/contexts/CartContext";
import { PuzzleProvider } from "@/contexts/PuzzleContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";


export const metadata: Metadata = {
  title: "vobvorot - digital playground ✨",
  description: "Unique vintage cameras, custom adidas, fur hats, vintage heels, unique bags from Ukraine with international shipping",
  keywords: ["vintage", "custom", "ukraine", "fashion", "unique", "handmade", "Y2K", "cameras", "adidas"],
  authors: [{ name: "vobvorot team" }],
  openGraph: {
    title: "vobvorot - digital playground ✨",
    description: "Unique vintage cameras, custom adidas, fur hats, vintage heels, unique bags from Ukraine",
    url: "https://vobvorot.com",
    siteName: "vobvorot",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "vobvorot digital playground",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "vobvorot - digital playground ✨",
    description: "Unique vintage cameras, custom adidas, fur hats, vintage heels, unique bags from Ukraine",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <PuzzleProvider>
            <CartProvider>
              <WishlistProvider>
                <Effects />
                <SecretDetector />
                <Navigation />
                <Cart />
                <Wishlist />
                <FloatingCartIcons />
                <PuzzleProgress />
                <MusicPlayer />
                <main>{children}</main>
              </WishlistProvider>
            </CartProvider>
          </PuzzleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
