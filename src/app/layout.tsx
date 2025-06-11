import type { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { Cart } from "@/components/Cart";
import { Wishlist } from "@/components/Wishlist";
import { FloatingCartIcons } from "@/components/FloatingCartIcons";
import { SecretDetector } from "@/components/SecretDetector";
import { DynamicComponents } from "@/components/DynamicComponents";
import { PuzzleProgress } from "@/components/PuzzleProgress";
import { MusicPlayer } from "@/components/MusicPlayer";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/Toast";
import { CartProvider } from "@/contexts/CartContext";
import { PuzzleProvider } from "@/contexts/PuzzleContext";
import { CriticalCSS } from "@/components/CriticalCSS";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { MatrixProvider } from "@/contexts/MatrixContext";
import { KonamiProvider } from "@/contexts/KonamiContext";
import { generateOrganizationStructuredData, generateWebsiteStructuredData } from "@/lib/seo";


export const metadata: Metadata = {
  title: {
    default: "VobVorot - Vintage & Custom Fashion Store",
    template: "%s | VobVorot"
  },
  description: "Discover unique vintage pieces and custom designs from Ukraine. VobVorot offers authentic vintage cameras, handmade accessories, custom Adidas, and exclusive fashion with worldwide shipping.",
  keywords: [
    "vintage fashion", "custom designs", "Ukrainian fashion", "vintage cameras", 
    "handmade accessories", "custom adidas", "authentic vintage", "luxury vintage",
    "designer vintage", "sustainable fashion", "unique pieces", "collector items",
    "artisan crafted", "vintage style", "retro fashion", "exclusive clothing",
    "limited edition", "vintage bags", "designer accessories", "custom footwear"
  ],
  authors: [{ name: "VobVorot", url: "https://vobvorot.com" }],
  creator: "VobVorot",
  publisher: "VobVorot",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://vobvorot.com'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
      'uk-UA': '/uk-UA',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://vobvorot.com',
    siteName: 'VobVorot',
    title: "VobVorot - Vintage & Custom Fashion Store",
    description: "Discover unique vintage pieces and custom designs from Ukraine. Authentic vintage cameras, handmade accessories, and exclusive fashion with worldwide shipping.",
    images: [
      {
        url: "/assets/images/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "VobVorot - Vintage & Custom Fashion Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@vobvorot",
    creator: "@vobvorot",
    title: "VobVorot - Vintage & Custom Fashion Store",
    description: "Discover unique vintage pieces and custom designs from Ukraine. Authentic vintage cameras, handmade accessories, and exclusive fashion.",
    images: ["/assets/images/og-default.jpg"],
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
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
  category: "fashion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationData = generateOrganizationStructuredData()
  const websiteData = generateWebsiteStructuredData()

  return (
    <html lang="en">
      <head>
        {/* Progressive cursor hiding - only after custom cursor loads */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Initial state - allow browser cursor until custom cursor is ready */
            .custom-cursor-ready {
              cursor: none !important;
            }
            .custom-cursor-ready *, 
            .custom-cursor-ready *::before, 
            .custom-cursor-ready *::after {
              cursor: none !important;
              -webkit-cursor: none !important;
            }
          `
        }} />
        
        
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
        <link
          href="/css/critical.css"
          rel="stylesheet"
        />
        <link
          href="/css/globals.css"
          rel="stylesheet"
        />
        {/* Global Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationData, websiteData])
          }}
        />
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      </head>
      <body>
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>
              <MatrixProvider>
                <PuzzleProvider>
                  <KonamiProvider>
                    <CartProvider>
                      <WishlistProvider>
                      <DynamicComponents />
                      <SecretDetector />
                      <Navigation />
                      <Cart />
                      <Wishlist />
                      <FloatingCartIcons />
                      <PuzzleProgress />
                      <MusicPlayer />
                      <main>
                        <ErrorBoundary>
                          {children}
                        </ErrorBoundary>
                      </main>
                      </WishlistProvider>
                    </CartProvider>
                  </KonamiProvider>
                </PuzzleProvider>
              </MatrixProvider>
            </AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
