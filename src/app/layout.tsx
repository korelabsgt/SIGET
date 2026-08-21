import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/(base)/theme/provider";
import Header from "@/components/(base)/layout/header";
import { createClient } from "@/utils/supabase/server";
import Providers from "@/components/(base)/providers/QueryProviders";
import { UserProvider } from "@/components/(base)/providers/UserProvider";
import ConditionalFooter from "@/components/(base)/layout/ConditionalFooter";
import OfflineBanner from "@/components/OfflineBanner";
import ObsToastContainer from "@/components/(SIGET)/observatorio/lib/ObsToastContainer";
import { safeGetUser } from "@/utils/supabase/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "SIGET - Plan Trifinio",
  description: "Sistema Integral de Gestión Estratégica - Plan Trifinio",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SIGET - Plan Trifinio",
  },
  icons: {
    icon: "/apple-touch-icon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user = null;
  try {
    const supabase = await createClient();
    user = await safeGetUser(supabase);
  } catch {
    user = null;
  }

  return (
    <html lang="es" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        style={{
          paddingTop: "var(--banner-height, 0px)",
          transition: "padding-top 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background flex flex-col`}
      >
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <UserProvider user={user}>
              <OfflineBanner />
              <Header />
              <main className="flex min-h-0 w-full flex-1 flex-col">{children}</main>
              <ConditionalFooter />
              <ObsToastContainer />
            </UserProvider>
          </ThemeProvider>
        </Providers>
        <Script
          src="https://cdn.lordicon.com/lordicon.js"
          strategy="afterInteractive"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('touchstart', function (event) {
                if (event.touches.length > 1) {
                  event.preventDefault();
                }
              }, { passive: false });
              document.addEventListener('gesturestart', function (event) {
                event.preventDefault();
              }, { passive: false });
            `,
          }}
        />
      </body>
    </html>
  );
}
