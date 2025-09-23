import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SessionProvider from "@/components/SessionProvider";
import ConditionalLayout from "@/components/ConditionalLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Listed - Modern SaaS Solution",
  description: "The modern SaaS platform for your business needs",
  icons: {
    icon: [
      { url: '/fav.png', sizes: '32x32', type: 'image/png' },
      { url: '/fav.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/fav.png',
    apple: '/fav.png',
    other: [
      {
        rel: 'icon',
        url: '/fav.png',
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
          <SessionProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </SessionProvider>
      </body>
    </html>
  );
}
