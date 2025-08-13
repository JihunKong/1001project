import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import I18nProvider from "@/components/providers/I18nProvider";
import AuthProvider from "@/components/auth/AuthProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getServerLocale } from "@/lib/language-server";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "1001 Stories - Global Education & Empowerment Platform",
  description: "Discover, publish, and share stories from children in underserved communities. Empowering young voices and inspiring the world.",
  keywords: "education, stories, children, global, empowerment, literacy, volunteer",
  authors: [{ name: "1001 Stories Team" }],
  openGraph: {
    title: "1001 Stories - Empower Young Voices",
    description: "A global platform for children's stories and education",
    url: "https://1001stories.org",
    siteName: "1001 Stories",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();
  
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <I18nProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                {children}
            </main>
            <Footer />
          </div>
        </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}